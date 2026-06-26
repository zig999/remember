// MCP stdio entry point — standalone process.
//
// Purpose: expose the BFF's query + ingest toolsets over a LOCAL stdio MCP
// transport (StdioServerTransport from `@modelcontextprotocol/sdk`), so a
// desktop MCP client (e.g. Claude Desktop) can spawn this binary directly and
// talk to it over its own stdin/stdout — no HTTP, no JWT.
//
// Spec carve-outs (knowledge-graph.back.md v1.4.0 BR-01/BR-23; ingestion.back.md
// v1.2.6 §1 / BR-21 / BR-28 / BR-30):
//   - NO auth gate (no NeonAuth, no JWT) — the operating model is "one local
//     client per process", spawned by the desktop binary on the owner's box.
//   - NO Fastify, NO HTTP transport — communication is over the inherited
//     stdin/stdout pipes.
//   - pino MUST write to process.stderr — stdout is reserved for the MCP
//     JSON-RPC frames the StdioServerTransport writes (knowledge-graph.back.md
//     §7 "Known Technical Constraints"). Any byte of log on stdout corrupts the
//     transport.
//   - The closed tool set is 18 tools (9 KG read + 4 query-retrieval read +
//     4 ingest propose_* + 1 ingest_document) — curation is intentionally
//     out of scope for v1.4.0.
//
// Boot sequence (failure at any step => exit non-zero, message on stderr):
//   1. loadEnv()                          — env validation, fail-fast.
//   2. pino logger pinned to stderr.
//   3. buildPool(env) + pingDatabase()    — fail fast if Neon is unreachable.
//   4. loadCatalog (KG) + loadIngestionCatalog — single client, released.
//   5. local McpServer registry           — registerQueryToolset,
//                                            registerQueryRetrievalToolset,
//                                            registerIngestToolset (with the
//                                            same Anthropic key the HTTP boot
//                                            consumes).
//   6. resolve flat McpHttpTool[]         — 18 descriptors lifted from the
//                                            registry by name (closed set).
//   7. buildConfiguredMcpServer(...)      — low-level SDK Server with
//                                            ListTools + CallTool handlers.
//   8. new StdioServerTransport(); server.connect(transport).
//   9. SIGINT / SIGTERM / stdin EOF handlers — pool.end() then exit(0).
//
// This file deliberately mirrors backend/src/server.ts steps 1-4b. The HTTP
// boot keeps Fastify + Neon Auth + the three /api/v1/mcp/* routes; this entry
// point keeps the catalog loading + the toolset registrations and skips
// everything HTTP-shaped.

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

/**
 * PII redaction paths — kept in sync with `backend/src/config/logger.ts`
 * REDACT_PATHS. We intentionally do NOT call `buildLogger()` here because
 * that factory pins pino's default destination (stdout); stdio requires
 * stderr (see knowledge-graph.back.md §7). Duplicating the small list of
 * paths is preferred over leaking a `destination` parameter through the
 * shared logger factory just for this entry point.
 */
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

/**
 * Build a pino logger whose destination is pinned to `process.stderr`.
 *
 * Stdout is reserved for the MCP JSON-RPC frames the StdioServerTransport
 * writes — any byte of log on stdout corrupts the transport. Using
 * `pino(options, destination)` with the stderr writable stream as the second
 * argument is the canonical way to redirect pino's output stream.
 */
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
  // Step 1 — env. No logger yet: errors go directly to stderr.
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

  // Step 2 — logger pinned to stderr.
  const logger = buildStderrLogger(env);
  logger.info({ node_env: env.NODE_ENV, transport: "stdio" }, "boot_start");

  // Step 3 — pg pool + ping.
  const pool = buildPool(env);
  pool.on("error", (err) => {
    // Idle-client errors. Log but never crash — pg will replace the broken
    // socket on the next acquire.
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

  // Step 4 — catalog snapshots (knowledge-graph + ingestion). Same two-shape
  // load as `server.ts`: a single client is acquired, both snapshots are
  // loaded against it, then it is released. Failure here is fatal — without
  // either catalog the propose_*/query handlers cannot enforce BR-23/BR-26.
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

  // Step 5 — local McpServer registry + toolset registrations. The registry
  // is process-local (single client per stdio process); no curation toolset
  // is registered — v1.4.0 stdio scope explicitly excludes curation.
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
    // BR-29: `ingest_document` drives the server-side extraction orchestrator,
    // which is the sole LLM caller of the BFF. The same key the HTTP boot
    // consumes is forwarded here so the stdio transport's `ingest_document`
    // tool can call Anthropic. BR-34 / TC-03: `ingest_directed` is always
    // registered (no rollout flag — it never calls Anthropic) so the env
    // surface no longer carries a per-tool gate here.
    env: {
      ANTHROPIC_API_KEY: env.ANTHROPIC_API_KEY,
      INGEST_MODEL: env.INGEST_MODEL,
      CHAT_INGEST_ENABLED: env.CHAT_INGEST_ENABLED,
    },
  });

  // Step 6 — closed tool set (19 tools = 9 KG + 4 QR + 4 propose_* +
  // `ingest_document` + `ingest_directed`). Order is purely cosmetic
  // (tools/list sorts by registry insertion); we group by toolset for
  // readability when inspecting the descriptor list. BR-34 / TC-03 replaced
  // the retired `start_async_ingestion` with the unconditional
  // `ingest_directed` advertised here.
  const toolCoordinates: readonly ToolCoordinate[] = [
    ...QUERY_TOOL_NAMES.map((name) => ({ toolset: "query" as const, name })),
    ...QUERY_RETRIEVAL_TOOL_NAMES.map((name) => ({ toolset: "query" as const, name })),
    ...INGEST_TOOL_NAMES.map((name) => ({ toolset: "ingest" as const, name })),
    { toolset: "ingest" as const, name: "ingest_document" },
    { toolset: "ingest" as const, name: "ingest_directed" },
  ];
  const tools = resolveStdioTools(registry, toolCoordinates);
  logger.info({ tool_count: tools.length }, "tools_resolved");

  // Step 7 — low-level SDK Server with ListTools + CallTool handlers wired
  // to the closed set. Same builder the HTTP transport uses (TC-01 — extracted
  // from sdk-http-transport.ts so both transports share advertisement +
  // dispatch + error mapping byte-identically).
  const server = buildConfiguredMcpServer({
    serverName: "remember-bff-stdio",
    serverVersion: "0.1.0",
    tools,
  });

  // Step 8 — connect the stdio transport. server.connect() also calls
  // transport.start(), which begins listening on process.stdin. After this
  // line returns, the process is alive on the stdin handler — keeping the
  // event loop busy until the parent closes stdin or sends a signal.
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

  // Step 9 — graceful shutdown. Three paths: SIGINT (Ctrl-C from a shell),
  // SIGTERM (orchestrator-issued termination), and stdin EOF (the parent
  // process — e.g. Claude Desktop — closed our stdin pipe). All three
  // converge on a single shutdown routine that ends the pg pool and exits 0.
  // `process.once` ensures double-fires (SIGINT followed by stdin close, etc.)
  // do not re-enter the shutdown path.
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
  // stdin EOF — the parent closed our input pipe. Both `close` (the canonical
  // EOF event on a Readable) and `end` (legacy alias) are wired so we exit
  // promptly regardless of which the host runtime emits first.
  process.stdin.once("close", () => void shutdown("stdin_close"));
  process.stdin.once("end", () => void shutdown("stdin_end"));
}

void main();
