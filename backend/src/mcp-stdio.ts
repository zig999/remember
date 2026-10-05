import pino, { type Logger, type LoggerOptions } from "pino";

import { buildPool, pingDatabase } from "./config/db.js";
import { EnvValidationError, loadEnv, type Env } from "./config/env.js";
import { buildConfiguredMcpServer } from "./mcp/sdk-http-transport.js";
import { buildMcpServer } from "./mcp/server.js";
import {
  resolveStdioTools,
  type ToolCoordinate,
} from "./mcp/stdio-tools.js";
import {
  INGEST_TOOL_NAMES,
  loadCatalog as loadIngestionCatalog,
  registerIngestToolset,
} from "./modules/ingestion/index.js";
import {
  QUERY_TOOL_NAMES,
  loadCatalog,
  registerQueryToolset,
} from "./modules/knowledge-graph/index.js";
import {
  QUERY_RETRIEVAL_TOOL_NAMES,
  registerQueryRetrievalToolset,
} from "./modules/query-retrieval/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const REDACT_PATHS: readonly string[] = [
  "content",
  "text",
  "value",
  "*.content",
  "*.text",
  "*.value",
  "req.body.content",
  "req.body.text",
  "req.body.value",
  "*.req.body.content",
  "*.req.body.text",
  "*.req.body.value",
  "req.headers.authorization",
  "*.req.headers.authorization",
  "headers.authorization",
];

function buildStderrLogger(env: Pick<Env, "LOG_LEVEL" | "NODE_ENV">): Logger {
  const options: LoggerOptions = {
    level: env.LOG_LEVEL,
    base: {
      env: env.NODE_ENV,
      service: "remember-bff-stdio",
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    redact: {
      paths: [...REDACT_PATHS],
      censor: "[REDACTED]",
      remove: false,
    },
    formatters: {
      level(label) {
        return { level: label };
      },
    },
  };
  return pino(options, process.stderr);
}

async function main(): Promise<void> {
  let env: Env;
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

  const logger = buildStderrLogger(env);
  logger.info({ node_env: env.NODE_ENV, transport: "stdio" }, "boot_start");

  const pool = buildPool(env);
  pool.on("error", (err) => {
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

  let kgCatalog;
  let ingestionCatalog;
  const catalogClient = await pool.connect();
  try {
    kgCatalog = await loadCatalog(catalogClient);
    ingestionCatalog = await loadIngestionCatalog(catalogClient);
    logger.info(
      {
        node_types: kgCatalog.nodeTypeById.size,
        link_types: kgCatalog.linkTypeById.size,
        link_type_rules: kgCatalog.linkTypeRules.length,
        attribute_keys: kgCatalog.attributeKeyById.size,
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

  const registry = buildMcpServer(logger);
  registerQueryToolset({ mcp: registry, pool, logger, catalog: kgCatalog });
  registerQueryRetrievalToolset({
    mcp: registry,
    pool,
    logger,
    catalog: kgCatalog,
  });
  registerIngestToolset({
    mcp: registry,
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

  const toolCoordinates: readonly ToolCoordinate[] = [
    ...QUERY_TOOL_NAMES.map((name) => ({ toolset: "query" as const, name })),
    ...QUERY_RETRIEVAL_TOOL_NAMES.map((name) => ({ toolset: "query" as const, name })),
    ...INGEST_TOOL_NAMES.map((name) => ({ toolset: "ingest" as const, name })),
    { toolset: "ingest" as const, name: "ingest_document" },
    { toolset: "ingest" as const, name: "ingest_directed" },
  ];
  const tools = resolveStdioTools(registry, toolCoordinates);
  logger.info({ tool_count: tools.length }, "tools_resolved");

  const server = buildConfiguredMcpServer({
    serverName: "remember-bff-stdio",
    serverVersion: "0.1.0",
    tools,
  });

  const transport = new StdioServerTransport();
  try {
    await server.connect(transport);
    logger.info("stdio_ready");
  } catch (err) {
    logger.fatal(
      { err_message: (err as Error).message },
      "stdio_connect_failed"
    );
    await pool.end().catch(() => undefined);
    process.exit(1);
  }

  let shuttingDown = false;
  const shutdown = async (reason: string): Promise<void> => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info({ reason }, "shutdown_start");
    try {
      await pool.end();
      logger.info("shutdown_complete");
      process.exit(0);
    } catch (err) {
      logger.error(
        { err_message: (err as Error).message },
        "shutdown_failed"
      );
      process.exit(1);
    }
  };
  process.once("SIGINT", () => void shutdown("SIGINT"));
  process.once("SIGTERM", () => void shutdown("SIGTERM"));
  process.stdin.once("close", () => void shutdown("stdin_close"));
  process.stdin.once("end", () => void shutdown("stdin_end"));
}

void main();
