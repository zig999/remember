// BFF process entry point.
//
// Boot sequence (fail fast on every step):
//   1. Validate environment.
//   2. Build pino logger.
//   3. Build pg pool and ping the database.
//   4. Build the Neon Auth middleware and the MCP server skeleton.
//   5. Build the Fastify app and start listening on PORT.
//   6. Install graceful-shutdown handlers (SIGINT/SIGTERM).
//
// Any failure in steps 1–5 logs the cause and exits with a non-zero code.

import { buildPool, pingDatabase } from "./config/db.js";
import { EnvValidationError, loadEnv } from "./config/env.js";
import { buildLogger } from "./config/logger.js";
import { buildNeonAuth } from "./middleware/auth.js";
import { buildMcpServer } from "./mcp/server.js";
import { buildApp } from "./app.js";
import { loadCatalog } from "./modules/knowledge-graph/index.js";

async function main(): Promise<void> {
  // Step 1 — env. Errors here are emitted to stderr because no logger exists
  // yet; we keep the message terse and actionable.
  let env;
  try {
    env = loadEnv();
  } catch (err) {
    if (err instanceof EnvValidationError) {
      process.stderr.write(`${err.message}\n`);
    } else {
      process.stderr.write(`Unexpected env load failure: ${String(err)}\n`);
    }
    process.exit(1);
  }

  // Step 2 — logger.
  const logger = buildLogger(env);
  logger.info({ port: env.PORT, node_env: env.NODE_ENV }, "boot_start");

  // Step 3 — pg pool.
  const pool = buildPool(env);
  pool.on("error", (err) => {
    // Idle-client errors. Log but never crash the process — pg will replace
    // the broken socket on the next acquire.
    logger.error({ err_message: err.message }, "pg_pool_idle_error");
  });
  try {
    await pingDatabase(pool);
    logger.info("db_ping_ok");
  } catch (err) {
    logger.fatal({ err_message: (err as Error).message }, "db_ping_failed");
    await pool.end().catch(() => undefined);
    process.exit(1);
  }

  // Step 4 — auth + MCP.
  const auth = buildNeonAuth(env);
  const mcp = buildMcpServer(logger);

  // Step 4b — catalog snapshot (knowledge-graph BR-10). Loaded once; the
  // ONLY invalidation path is a process restart accompanying a catalog
  // migration.
  let catalog;
  const catalogClient = await pool.connect();
  try {
    catalog = await loadCatalog(catalogClient);
    logger.info(
      {
        node_types: catalog.nodeTypeById.size,
        link_types: catalog.linkTypeById.size,
        link_type_rules: catalog.linkTypeRules.length,
        attribute_keys: catalog.attributeKeyById.size,
      },
      "catalog_loaded"
    );
  } catch (err) {
    logger.fatal(
      { err_message: (err as Error).message },
      "catalog_load_failed"
    );
    catalogClient.release();
    await pool.end().catch(() => undefined);
    process.exit(1);
  } finally {
    catalogClient.release();
  }

  // Step 5 — Fastify app.
  const app = await buildApp({ env, logger, pool, auth, mcp, catalog });
  try {
    await app.listen({ port: env.PORT, host: "0.0.0.0" });
    logger.info({ port: env.PORT }, "boot_ready");
  } catch (err) {
    logger.fatal({ err_message: (err as Error).message }, "listen_failed");
    await pool.end().catch(() => undefined);
    process.exit(1);
  }

  // Step 6 — graceful shutdown.
  const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
    logger.info({ signal }, "shutdown_start");
    try {
      await app.close();
      await pool.end();
      logger.info("shutdown_complete");
      process.exit(0);
    } catch (err) {
      logger.error({ err_message: (err as Error).message }, "shutdown_failed");
      process.exit(1);
    }
  };
  process.once("SIGINT", () => void shutdown("SIGINT"));
  process.once("SIGTERM", () => void shutdown("SIGTERM"));
}

void main();
