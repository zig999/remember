import Fastify, { type FastifyBaseLogger, type FastifyInstance } from "fastify";
import fastifyCors from "@fastify/cors";
import type { Logger } from "pino";
import type { Pool } from "pg";

import type { Env } from "./config/env.js";
import { collectHealth } from "./shared/health.js";
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
import { registerChatRoutes } from "./modules/chat/index.js";

export interface AppDependencies {
  readonly env: Env;
  readonly logger: Logger;
  readonly pool: Pool;
  readonly auth: NeonAuth;
  readonly mcp: McpServer;
  readonly catalog?: CatalogSnapshot;
  readonly ingestionCatalog?: IngestionCatalogSnapshot;
}

export async function buildApp(deps: AppDependencies): Promise<FastifyInstance> {
  const { env, logger, pool, auth, mcp, catalog, ingestionCatalog } = deps;

  const BODY_LIMIT_BYTES = 11 * 1024 * 1024;

  const app = Fastify({
    loggerInstance: logger as unknown as FastifyBaseLogger,
    bodyLimit: BODY_LIMIT_BYTES,
    disableRequestLogging: false,
    trustProxy: env.NODE_ENV === "production",
  });

  const corsOrigins = env.CORS_ORIGINS ?? [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
  ];
  await app.register(fastifyCors, {
    origin: corsOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  });

  app.setErrorHandler(buildErrorHandler(logger));

  app.get("/health", async (_req, reply) => {
    const health = await collectHealth(pool);
    return reply.status(health.ok ? 200 : 503).send(health);
  });

  await app.register(async (scoped) => {
    scoped.addHook("preHandler", auth.preHandler);
    scoped.get("/_self", async (request) => ({
      ok: true,
      result: { user_id: request.user?.id ?? null },
    }));

    await scoped.register(
      async (ingest) => {
        await registerIngestionRoutes(ingest, {
          pool,
          logger,
          ...(ingestionCatalog !== undefined ? { catalog: ingestionCatalog } : {}),
          env: {
            ANTHROPIC_API_KEY: env.ANTHROPIC_API_KEY,
            CONTEXT_MODEL: env.CONTEXT_MODEL,
          },
        });
      },
      { prefix: "/ingest" }
    );

    await registerComplianceAuditRoutes(scoped, { pool, logger });

    if (ingestionCatalog !== undefined) {
      await registerIngestMcpTransport(scoped, {
        logger,
        mcp,
        toolNames: [
          ...INGEST_TOOL_NAMES,
          "ingest_document",
          "ingest_directed",
          "health",
          "get_ingestion_status",
          "list_recent_ingestions",
        ],
      });
    }

    if (catalog !== undefined) {
      await registerKnowledgeGraphRoutes(scoped, { pool, logger, catalog });
      await registerQueryMcpTransport(scoped, {
        logger,
        mcp,
        toolNames: [...QUERY_TOOL_NAMES, ...QUERY_RETRIEVAL_TOOL_NAMES],
      });
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
        await registerCurationMcpTransport(scoped, {
          logger,
          mcp,
          toolNames: [...CURATION_TOOL_NAMES, "compliance_delete"],
        });
      }
      await registerQueryRetrievalRoutes(scoped, { pool, logger, catalog });

      await scoped.register(
        async (convScope) => {
          await registerChatRoutes(convScope, {
            mcp,
            logger,
            env,
            pool,
            ...(catalog !== undefined ? { catalog } : {}),
            ...(ingestionCatalog !== undefined ? { ingestionCatalog } : {}),
          });
        },
        { prefix: "/conversations" }
      );
    }
  }, { prefix: "/api/v1" });

  if (catalog !== undefined) {
    registerQueryToolset({ mcp, pool, logger, catalog });
    registerQueryRetrievalToolset({ mcp, pool, logger, catalog });
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

  registerComplianceToolset({ mcp, pool, logger });

  if (ingestionCatalog !== undefined) {
    registerIngestToolset({
      mcp,
      pool,
      logger,
      catalog: ingestionCatalog,
      env: {
        ANTHROPIC_API_KEY: env.ANTHROPIC_API_KEY,
        INGEST_MODEL: env.INGEST_MODEL,
        CONTEXT_MODEL: env.CONTEXT_MODEL,
        CHAT_INGEST_ENABLED: env.CHAT_INGEST_ENABLED,
      },
    });
  }

  return app;
}
