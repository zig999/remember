// Fastify application factory.
//
// Wires the singleton dependencies (pg pool, pino logger, MCP registry,
// Supabase auth) into a Fastify instance and registers:
//   - GET /health           (unauthenticated, returns 200 + DB ping result)
//   - The global error handler (single point that emits the envelope).
//   - The `requireSupabaseJwt` preHandler under the `/api/v1` scope — every
//     route mounted under it inherits authentication for free.
//
// Domain routes are NOT registered here. Each domain module exposes a
// `register(app)` function which is called from `server.ts` after the app
// is built — TC-01 only delivers the shell.

import Fastify, { type FastifyBaseLogger, type FastifyInstance } from "fastify";
import type { Logger } from "pino";
import type { Pool } from "pg";

import { pingDatabase } from "./config/db.js";
import type { Env } from "./config/env.js";
import { buildErrorHandler } from "./middleware/error-handler.js";
import type { SupabaseAuth } from "./middleware/auth.js";
import type { McpServer } from "./mcp/server.js";
import { registerIngestionRoutes } from "./modules/ingestion/index.js";
import {
  registerCurationRoutes,
  registerCurationToolset,
} from "./modules/curation/index.js";
import {
  registerComplianceAuditRoutes,
  registerComplianceToolset,
} from "./modules/compliance-audit/index.js";
import {
  registerKnowledgeGraphRoutes,
  registerQueryToolset,
  type CatalogSnapshot,
} from "./modules/knowledge-graph/index.js";
import { registerQueryRetrievalRoutes } from "./modules/query-retrieval/index.js";

export interface AppDependencies {
  readonly env: Env;
  readonly logger: Logger;
  readonly pool: Pool;
  readonly auth: SupabaseAuth;
  readonly mcp: McpServer;
  /**
   * Catalog snapshot loaded once at BFF startup. Used by knowledge-graph
   * (BR-03, BR-04 of the back spec) and reused across modules (ingestion,
   * curation). Optional so existing tests that do not exercise the
   * knowledge-graph routes need not load the catalog.
   */
  readonly catalog?: CatalogSnapshot;
}

/**
 * Build a configured but not-yet-listening Fastify instance.
 *
 * - `loggerInstance`: we hand Fastify our pino logger directly so every
 *    request gets the same redaction rules.
 * - `bodyLimit`: 11 MiB (`ingestion.back.md §1` requires 10 MiB content +
 *    envelope overhead). Domain routes can override per-route if needed.
 * - `disableRequestLogging`: we use Fastify's per-route logger; the default
 *    request log is too verbose for production.
 */
export async function buildApp(deps: AppDependencies): Promise<FastifyInstance> {
  const { env, logger, pool, auth, mcp, catalog } = deps;

  const app = Fastify({
    // pino's `Logger` satisfies Fastify's `FastifyBaseLogger` structurally
    // (msgPrefix is optional on pino loggers but required by FastifyBaseLogger).
    // The cast is safe because Fastify only calls methods present on pino.
    loggerInstance: logger as unknown as FastifyBaseLogger,
    bodyLimit: 11 * 1024 * 1024,
    disableRequestLogging: false,
    trustProxy: env.NODE_ENV === "production",
  });

  // Global error handler — must be set before any route registers.
  app.setErrorHandler(buildErrorHandler(logger));

  // Public health endpoint. NOT protected by auth — the operator needs to
  // probe the BFF without holding a valid JWT (smoke tests, container probes).
  app.get("/health", async (_req, reply) => {
    const health = await collectHealth(pool);
    return reply.status(health.ok ? 200 : 503).send(health);
  });

  // Protected `/api/v1/*` scope — anything registered under it inherits the
  // Supabase JWT preHandler. Domain modules (`backend/src/modules/<x>/`)
  // register their routes inside this scope.
  await app.register(async (scoped) => {
    scoped.addHook("preHandler", auth.preHandler);
    // Sentinel route so the scope is non-empty during the bootstrap phase.
    // Domain modules add real routes alongside; this one only confirms the
    // scope is wired and the auth preHandler is enforced.
    scoped.get("/_self", async (request) => ({
      ok: true,
      result: { user_id: request.user?.id ?? null },
    }));

    // Ingestion module (TC-02) — POST /raw-information, GET .../{id}, GET .../{id}/chunks.
    await scoped.register(
      async (ingest) => {
        await registerIngestionRoutes(ingest, { pool, logger });
      },
      { prefix: "/ingest" }
    );

    // Compliance-audit module (TC-08) — POST /compliance/deletions (UC-01) +
    // four audit reads (UC-02..UC-05). The two prefixes `/compliance` and
    // `/audit` are mounted at the root of the protected scope (paths are
    // siblings of `/api/v1/ingest`); catalog snapshot is NOT required.
    await registerComplianceAuditRoutes(scoped, { pool, logger });

    // Knowledge-graph module (TC-04) — read-only catalog + graph endpoints.
    // Mounted at the root of `/api/v1` because the route paths the OpenAPI
    // declares are `/api/v1/node-types`, `/api/v1/nodes`, `/api/v1/links/…`,
    // `/api/v1/attributes/…` — i.e. siblings of `/api/v1/ingest`. The catalog
    // dependency is required to run these routes; if it is absent at build
    // time we skip registration (test apps that don't exercise this domain
    // can stay light).
    if (catalog !== undefined) {
      await registerKnowledgeGraphRoutes(scoped, { pool, logger, catalog });
      // Curation module (TC-07) — POST verbs over the layered validation
      // pipeline. Mounted at /api/v1/curation/* (siblings of /api/v1/ingest).
      await scoped.register(
        async (cur) => {
          await registerCurationRoutes(cur, { pool, logger, catalog });
        },
        { prefix: "/curation" }
      );
      // Query-retrieval module (TC-06) — read-only search + provenance walks.
      // Mounted at the root of /api/v1 because the OpenAPI declares
      // /api/v1/search and /api/v1/provenance/* as siblings of /api/v1/nodes.
      await registerQueryRetrievalRoutes(scoped, { pool, logger, catalog });
    }
  }, { prefix: "/api/v1" });

  // MCP toolsets — query and curation. Query is a skeleton in TC-04 (lands in
  // TC-05); curation registers the seven write tools alongside list_review_queue
  // (TC-07).
  if (catalog !== undefined) {
    registerQueryToolset({ mcp, pool, logger, catalog });
    registerCurationToolset({ mcp, pool, logger, catalog });
  }

  // Compliance-audit MCP tool (TC-08) — `curation.compliance_delete` (BR-14).
  // Registered independently of `catalog`: the compliance flow does not touch
  // the catalog cache (it neither reads link/attribute keys nor mutates the
  // graph through the curation pipeline). Sharing the `curation` toolset
  // namespace with the other seven tools is intentional — v7 §14.4 defines
  // the catalog of curation tools as a single list.
  registerComplianceToolset({ mcp, pool, logger });

  return app;
}

/** Health-check result shape returned by GET /health. */
export interface HealthReport {
  ok: boolean;
  service: "segundo-cerebro-bff";
  database: "ok" | "unreachable";
  checked_at: string;
}

async function collectHealth(pool: Pool): Promise<HealthReport> {
  const checkedAt = new Date().toISOString();
  try {
    await pingDatabase(pool);
    return {
      ok: true,
      service: "segundo-cerebro-bff",
      database: "ok",
      checked_at: checkedAt,
    };
  } catch {
    return {
      ok: false,
      service: "segundo-cerebro-bff",
      database: "unreachable",
      checked_at: checkedAt,
    };
  }
}
