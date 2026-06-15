// Fastify application factory.
//
// Wires the singleton dependencies (pg pool, pino logger, MCP registry,
// Neon Auth) into a Fastify instance and registers:
//   - GET /health           (unauthenticated, returns 200 + DB ping result)
//   - The global error handler (single point that emits the envelope).
//   - The Neon Auth JWT preHandler under the `/api/v1` scope — every
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
import type { NeonAuth } from "./middleware/auth.js";
import type { McpServer } from "./mcp/server.js";
import {
  INGEST_TOOL_NAMES,
  registerIngestionRoutes,
  registerIngestMcpTransport,
  registerIngestToolset,
} from "./modules/ingestion/index.js";
import type { CatalogSnapshot as IngestionCatalogSnapshot } from "./modules/ingestion/index.js";
import {
  CURATION_TOOL_NAMES,
  registerCurationMcpTransport,
  registerCurationRoutes,
  registerCurationToolset,
} from "./modules/curation/index.js";
import {
  registerComplianceAuditRoutes,
  registerComplianceToolset,
} from "./modules/compliance-audit/index.js";
import {
  QUERY_TOOL_NAMES,
  registerKnowledgeGraphRoutes,
  registerQueryMcpTransport,
  registerQueryToolset,
  type CatalogSnapshot,
} from "./modules/knowledge-graph/index.js";
import {
  QUERY_RETRIEVAL_TOOL_NAMES,
  registerQueryRetrievalRoutes,
  registerQueryRetrievalToolset,
} from "./modules/query-retrieval/index.js";

export interface AppDependencies {
  readonly env: Env;
  readonly logger: Logger;
  readonly pool: Pool;
  readonly auth: NeonAuth;
  readonly mcp: McpServer;
  /**
   * Catalog snapshot loaded once at BFF startup. Used by knowledge-graph
   * (BR-03, BR-04 of the back spec) and reused across modules (ingestion,
   * curation). Optional so existing tests that do not exercise the
   * knowledge-graph routes need not load the catalog.
   */
  readonly catalog?: CatalogSnapshot;
  /**
   * Ingestion module's local catalog snapshot — same source data as
   * `catalog` above but with the ingestion-specific row shape (used by the
   * propose-* REST mirrors/services and the extraction orchestrator,
   * TC-12/TC-13 / BR-26). Optional for the same reason as `catalog`.
   */
  readonly ingestionCatalog?: IngestionCatalogSnapshot;
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
  const { env, logger, pool, auth, mcp, catalog, ingestionCatalog } = deps;

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
  // Neon Auth JWT preHandler. Domain modules (`backend/src/modules/<x>/`)
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

    // Ingestion module (TC-02 + TC-12 + TC-13) — POST /raw-information,
    // GET .../{id}, GET .../{id}/chunks, the four propose-* REST mirrors of
    // the ingest MCP toolset (TC-13), and POST /llm-runs/:id/run (the
    // extraction orchestrator, TC-12). The ingestion catalog + env are passed
    // through so the catalog-bound mirrors and the orchestrator endpoint mount.
    await scoped.register(
      async (ingest) => {
        await registerIngestionRoutes(ingest, {
          pool,
          logger,
          ...(ingestionCatalog !== undefined ? { catalog: ingestionCatalog } : {}),
          env: { ANTHROPIC_API_KEY: env.ANTHROPIC_API_KEY },
        });
      },
      { prefix: "/ingest" }
    );

    // Compliance-audit module (TC-08) — POST /compliance/deletions (UC-01) +
    // four audit reads (UC-02..UC-05). The two prefixes `/compliance` and
    // `/audit` are mounted at the root of the protected scope (paths are
    // siblings of `/api/v1/ingest`); catalog snapshot is NOT required.
    await registerComplianceAuditRoutes(scoped, { pool, logger });

    // MCP-over-HTTP transport for the `ingest` toolset (v1.2.4 — migrated to
    // the shared SDK kernel). Mounted as POST /api/v1/mcp/ingest under the
    // auth-protected scope, so requireNeonAuth is enforced for every request.
    // Stateless single-shape (no per-session model, no X-LLM-Run-Id ambient
    // header) — `llm_run_id` is a per-call tool argument validated by the
    // MCP-facing Zod schemas (Option B — BR-21 revised, BR-28). The four
    // `propose_*` tools live on the shared registry `mcp` (registered below
    // by `registerIngestToolset`); the transport reads their descriptors from
    // there at request time. The catalog snapshot is required for the
    // toolset's propose-node / propose-link / propose-attribute handlers —
    // if it is absent the transport is skipped (same condition as the
    // curation REST mirror).
    if (ingestionCatalog !== undefined) {
      await registerIngestMcpTransport(scoped, {
        logger,
        mcp,
        toolNames: [...INGEST_TOOL_NAMES],
      });
    }

    // Knowledge-graph module (TC-04) — read-only catalog + graph endpoints.
    // Mounted at the root of `/api/v1` because the route paths the OpenAPI
    // declares are `/api/v1/node-types`, `/api/v1/nodes`, `/api/v1/links/…`,
    // `/api/v1/attributes/…` — i.e. siblings of `/api/v1/ingest`. The catalog
    // dependency is required to run these routes; if it is absent at build
    // time we skip registration (test apps that don't exercise this domain
    // can stay light).
    if (catalog !== undefined) {
      await registerKnowledgeGraphRoutes(scoped, { pool, logger, catalog });
      // MCP-over-HTTP read transport — POST /api/v1/mcp/query (TC-02,
      // knowledge-graph.back.md BR-23). Mounted under the same auth scope as
      // the REST surface, with no extra headers and no audit-row writes
      // (BR-23 rules 1-3). The nine knowledge-graph read tools live on the
      // shared McpServer registry under the `query` toolset key (see
      // `registerQueryToolset` call below); the four query-retrieval tools
      // (`search`, `get_provenance_link|attribute|fragment`) are co-tenants
      // of the same registry — TC-03 / query-retrieval.back.md BR-23. The
      // transport reads these 13 descriptors from the shared registry `mcp` at
      // request time and registers them on a fresh per-request SDK server; the
      // closed tool set is structural (only these names are registered).
      await registerQueryMcpTransport(scoped, {
        logger,
        mcp,
        toolNames: [...QUERY_TOOL_NAMES, ...QUERY_RETRIEVAL_TOOL_NAMES],
      });
      // Curation module (TC-07) — POST verbs over the layered validation
      // pipeline. Mounted at /api/v1/curation/* (siblings of /api/v1/ingest).
      // TC-04 of valid-values-attribute-domains additionally requires the
      // ingestion catalog snapshot for the closed-value-domain check on
      // `correct_item`; if it is absent we skip the curation routes the same
      // way we skip the MCP transport when the catalog is missing.
      if (ingestionCatalog !== undefined) {
        await scoped.register(
          async (cur) => {
            await registerCurationRoutes(cur, {
              pool,
              logger,
              catalog,
              ingestionCatalog,
            });
          },
          { prefix: "/curation" }
        );
        // MCP-over-HTTP write transport — POST /api/v1/mcp/curation
        // (curation.back.md BR-29). Sibling of the REST surface, same
        // requireNeonAuth, NO X-LLM-Run-Id header. Closed set of 8 names
        // (CURATION_TOOL_NAMES ∪ {'compliance_delete'}); the seven curation
        // tools and the eighth (`compliance_delete`, owned by compliance-audit)
        // all live on the shared registry under the `curation` toolset key
        // (registered by `registerCurationToolset` / `registerComplianceToolset`
        // below). The transport reads their descriptors from the registry at
        // request time — no reverse dependency into compliance-audit.
        await registerCurationMcpTransport(scoped, {
          logger,
          mcp,
          toolNames: [...CURATION_TOOL_NAMES, "compliance_delete"],
        });
      }
      // Query-retrieval module (TC-06) — read-only search + provenance walks.
      // Mounted at the root of /api/v1 because the OpenAPI declares
      // /api/v1/search and /api/v1/provenance/* as siblings of /api/v1/nodes.
      await registerQueryRetrievalRoutes(scoped, { pool, logger, catalog });
    }
  }, { prefix: "/api/v1" });

  // MCP toolsets — bind tool handlers onto the shared (process-wide) McpServer
  // registry. `query`: 9 knowledge-graph + 4 query-retrieval read tools;
  // `curation`: 7 curation write tools + `compliance_delete` (compliance-audit).
  // The `query`/`curation` transports mounted above resolve these handlers at
  // dispatch time, so registering here (after the routes are mounted) is fine.
  if (catalog !== undefined) {
    registerQueryToolset({ mcp, pool, logger, catalog });
    // Query-retrieval MCP toolset (TC-03 / query-retrieval.back.md BR-23) —
    // co-tenants of the `query` toolset key. Composed at boot onto the SAME
    // McpServer instance the knowledge-graph registrar just populated; the
    // shared transport above is already aware of the four extra tool
    // descriptors and will admit + advertise them.
    registerQueryRetrievalToolset({ mcp, pool, logger, catalog });
    // Curation MCP toolset — like the REST routes, the `correct_item` tool
    // depends on the ingestion catalog for the closed-value-domain check
    // (TC-04 of valid-values-attribute-domains). Skip toolset registration
    // when the ingestion catalog is absent — the REST mirror is also skipped
    // in that case, so callers see a coherent (empty) curation surface.
    if (ingestionCatalog !== undefined) {
      registerCurationToolset({
        mcp,
        pool,
        logger,
        catalog,
        ingestionCatalog,
      });
    }
  }

  // Compliance-audit MCP tool (TC-08) — `curation.compliance_delete` (BR-14).
  // Registered independently of `catalog`: the compliance flow does not touch
  // the catalog cache (it neither reads link/attribute keys nor mutates the
  // graph through the curation pipeline). Sharing the `curation` toolset
  // namespace with the other seven tools is intentional — v7 §14.4 defines
  // the catalog of curation tools as a single list.
  registerComplianceToolset({ mcp, pool, logger });

  // Ingest MCP toolset (v1.2.4 — TC-MCI-001) — the four `propose_*` tool
  // handlers wired onto the shared registry under the `ingest` toolset key.
  // The MCP transport above (POST /api/v1/mcp/ingest) resolves these
  // descriptors at request time. Requires the ingestion catalog snapshot
  // (the toolset's propose-{node,link,attribute} handlers consume it for the
  // 5-layer validation pipeline); skipped when it is absent — the transport
  // is also skipped under the same condition, so callers see a coherent
  // (empty) ingest surface.
  if (ingestionCatalog !== undefined) {
    registerIngestToolset({
      mcp,
      pool,
      logger,
      catalog: ingestionCatalog,
    });
  }

  return app;
}

/** Health-check result shape returned by GET /health. */
export interface HealthReport {
  ok: boolean;
  service: "remember-bff";
  database: "ok" | "unreachable";
  checked_at: string;
}

async function collectHealth(pool: Pool): Promise<HealthReport> {
  const checkedAt = new Date().toISOString();
  try {
    await pingDatabase(pool);
    return {
      ok: true,
      service: "remember-bff",
      database: "ok",
      checked_at: checkedAt,
    };
  } catch {
    return {
      ok: false,
      service: "remember-bff",
      database: "unreachable",
      checked_at: checkedAt,
    };
  }
}
