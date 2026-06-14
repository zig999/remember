// MCP-over-HTTP transport for the read-only `query` toolset.
//
// Surface: `POST /api/v1/mcp/query` (mounted under the auth-protected scope by
// the bootstrap). Body is a JSON-RPC 2.0 request. Supported methods:
//   - `initialize`     — protocol handshake (returns server info).
//   - `tools/list`     — list the nine `query` tools registered by the
//                        `registerQueryToolset` call in `app.ts`.
//   - `tools/call`     — invoke a tool. `name` may be the bare tool name
//                        (`get_node`) or the fully-qualified `query.get_node`.
//
// Differences from `ingestion/mcp/transport.ts` (intentional, BR-23):
//   1. NO `X-LLM-Run-Id` header — the query surface is callable outside any
//      LLM run (v7 §14.3).
//   2. NO `tool_call` audit row writes — audit rows are scoped to the ingest
//      write surface (`ingestion.back.md` BR-23).
//   3. Tool registration is a CLOSED enumeration whitelist (BR-23 rule 5):
//      any request whose `tools/call.name` does not name one of the nine
//      query tools is rejected with `NOT_FOUND`. Even if someone managed to
//      register an `ingest.propose_*` tool on the shared `McpServer` core,
//      this transport refuses to dispatch it.
//
// The JSON-RPC envelope handling mirrors the ingest transport (Rule 11 —
// match the codebase's conventions). The pattern is intentionally inlined
// (Rule 2 — Simplicity First; the assumption is documented in TC-02).
//
// MCP envelope (CLAUDE.md "Architecture / Backend"):
//   success -> JSON-RPC `result` = { ok: true,  result: <payload> }
//   failure -> JSON-RPC `result` = { ok: false, error: { code, message, … } }
//   Transport-level failures (malformed JSON-RPC, unknown method) are
//   surfaced via the JSON-RPC `error` field instead.

import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { Pool } from "pg";
import type { Logger } from "pino";
import { z } from "zod";

import type { McpServer } from "../../../mcp/server.js";
import {
  QUERY_TOOL_NAMES,
  QueryToolInputJsonSchemas,
  QueryToolDescriptions,
  type QueryToolName,
} from "./query-toolset.js";

// ---------------------------------------------------------------------------
// JSON-RPC envelope shapes — JSON-RPC 2.0 §4 + §5.
// ---------------------------------------------------------------------------

const JsonRpcIdSchema = z.union([z.string(), z.number(), z.null()]);

const JsonRpcRequestSchema = z.object({
  jsonrpc: z.literal("2.0"),
  id: JsonRpcIdSchema.optional(), // optional => notification, no response
  method: z.string().min(1),
  params: z.unknown().optional(),
});

type JsonRpcRequest = z.infer<typeof JsonRpcRequestSchema>;

interface JsonRpcSuccess {
  readonly jsonrpc: "2.0";
  readonly id: string | number | null;
  readonly result: unknown;
}

interface JsonRpcError {
  readonly jsonrpc: "2.0";
  readonly id: string | number | null;
  readonly error: {
    readonly code: number;
    readonly message: string;
    readonly data?: unknown;
  };
}

type JsonRpcResponse = JsonRpcSuccess | JsonRpcError;

// JSON-RPC 2.0 reserved error codes (§5.1).
const JSON_RPC = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
} as const;

// ---------------------------------------------------------------------------
// MCP `tools/call` params shape.
// ---------------------------------------------------------------------------

const ToolsCallParamsSchema = z.object({
  name: z.string().min(1),
  arguments: z.record(z.string(), z.unknown()).optional(),
});

// ---------------------------------------------------------------------------
// MCP envelope shape returned inside JSON-RPC `result` for tools/call.
// ---------------------------------------------------------------------------

interface McpEnvelopeJson {
  readonly ok: boolean;
  readonly result?: unknown;
  readonly error?: {
    readonly code: string;
    readonly message: string;
    readonly details?: unknown;
  };
}

// ---------------------------------------------------------------------------
// Public registration entry point.
// ---------------------------------------------------------------------------

export interface QueryMcpTransportDeps {
  readonly pool: Pool;
  readonly logger: Logger;
  readonly mcp: McpServer;
}

/** Closed enumeration whitelist — BR-23 rule 5. Anything outside this set is
 *  rejected with NOT_FOUND even if a tool by that name happens to be present
 *  in the shared `McpServer` core (e.g. an ingest `propose_*`). */
const QUERY_TOOL_NAME_SET: ReadonlySet<string> = new Set<string>(
  QUERY_TOOL_NAMES
);

/**
 * Register `POST /mcp/query` inside the calling Fastify scope. The route is
 * stateless: each request parses one JSON-RPC message, dispatches it, and
 * returns. Auth is enforced by the parent scope's `requireNeonAuth`
 * preHandler — this transport adds NO additional headers (BR-23 rule 2).
 *
 * The pool dep is kept on the type but the transport does not use it
 * directly: the per-tool handlers in `query-toolset.ts` open their own
 * `withReadOnly` transactions. The dep is reserved for future read-side
 * connection metrics / smoke probes.
 */
export async function registerQueryMcpTransport(
  scope: FastifyInstance,
  deps: QueryMcpTransportDeps
): Promise<void> {
  scope.post(
    "/mcp/query",
    async (request: FastifyRequest, reply: FastifyReply) =>
      handleMcpRequest(request, reply, deps)
  );
}

/**
 * Per-request handler. Wraps the dispatch in a top-level try/catch so that
 * any unexpected throw becomes a JSON-RPC `internal_error` instead of a
 * Fastify 500 — MCP clients expect a well-formed JSON-RPC envelope on every
 * response.
 */
async function handleMcpRequest(
  request: FastifyRequest,
  reply: FastifyReply,
  deps: QueryMcpTransportDeps
): Promise<JsonRpcResponse | void> {
  // Reply always speaks JSON-RPC over HTTP 200 — the JSON-RPC `error` field
  // is the success indicator (matches MCP wire semantics + ingestion
  // transport behaviour).
  reply.type("application/json");

  // 1. Parse the JSON-RPC envelope.
  const parsed = JsonRpcRequestSchema.safeParse(request.body);
  if (!parsed.success) {
    return errorResponse(null, JSON_RPC.INVALID_REQUEST, "Invalid JSON-RPC request.", {
      issues: parsed.error.issues.map((i) => ({ path: i.path, message: i.message })),
    });
  }
  const rpc = parsed.data;
  const rpcId = rpc.id ?? null;

  // 2. Dispatch by method.
  try {
    switch (rpc.method) {
      case "initialize":
        return successResponse(rpcId, buildInitializeResult());

      case "tools/list":
        return successResponse(rpcId, buildToolsListResult(deps));

      case "tools/call":
        return successResponse(
          rpcId,
          await handleToolsCall(deps, rpc)
        );

      default:
        return errorResponse(
          rpcId,
          JSON_RPC.METHOD_NOT_FOUND,
          `Method '${rpc.method}' is not supported by this MCP endpoint.`
        );
    }
  } catch (err) {
    // We never let an unhandled error leak — the MCP client should always
    // see a well-formed JSON-RPC envelope. The shared error mapper (BR-24)
    // would mask `err.message`, so the transport-level message here is
    // intentionally generic too.
    deps.logger.error(
      {
        component: "mcp.query.transport",
        method: rpc.method,
        cause_message: err instanceof Error ? err.message : "unknown",
      },
      "mcp_query_transport_internal_error"
    );
    return errorResponse(rpcId, JSON_RPC.INTERNAL_ERROR, "Internal error in MCP transport.");
  }
}

// ---------------------------------------------------------------------------
// Method implementations.
// ---------------------------------------------------------------------------

/**
 * MCP `initialize` — handshake. Returns the server's protocol version and
 * capability set. The `query` transport advertises tool support only.
 */
function buildInitializeResult(): Record<string, unknown> {
  return {
    protocolVersion: "2024-11-05",
    serverInfo: { name: "remember-bff-query", version: "0.1.0" },
    capabilities: { tools: {} },
  };
}

interface McpToolDescriptor {
  readonly name: string;
  readonly description: string;
  readonly inputSchema: Record<string, unknown>;
}

/**
 * MCP `tools/list` — enumerate the nine read-only query tools. The
 * descriptors come from the toolset module's pinned bundle so REST DTOs and
 * MCP tool schemas can never drift (BR-25).
 *
 * Tools are intersected with the shared `McpServer` registry: if a tool from
 * `QUERY_TOOL_NAMES` is unexpectedly absent (e.g. the registrar threw at
 * boot) we omit it rather than fabricate an entry. In practice the registrar
 * is total and all nine names are present.
 */
function buildToolsListResult(
  deps: QueryMcpTransportDeps
): { tools: McpToolDescriptor[] } {
  const tools: McpToolDescriptor[] = [];
  for (const name of QUERY_TOOL_NAMES) {
    const tool = deps.mcp.getTool("query", name);
    if (tool === undefined) continue;
    tools.push({
      name,
      description: QueryToolDescriptions[name],
      // BR-25: same JSON Schema object pinned at registration time in
      // `query-toolset.ts`. The shape is JSON-Schema-2020-12.
      inputSchema: QueryToolInputJsonSchemas[name] as unknown as Record<
        string,
        unknown
      >,
    });
  }
  return { tools };
}

/**
 * MCP `tools/call` — dispatch to one of the nine query tools.
 *
 * Behaviour matrix:
 *   - params malformed                              -> STRUCTURAL_INVALID env.
 *   - tool name not in QUERY_TOOL_NAMES whitelist   -> NOT_FOUND env.
 *     (Closes BR-23 rule 5 — `propose_*` / `finalize_run` are unreachable
 *      even if they live in the shared registry under a different toolset.)
 *   - tool name in whitelist but not registered yet -> NOT_FOUND env.
 *   - handler runs                                  -> handler's envelope
 *     (the toolset's `makeHandler` already maps thrown errors via
 *      `mapErrorToEnvelope` — see BR-24).
 */
async function handleToolsCall(
  deps: QueryMcpTransportDeps,
  rpc: JsonRpcRequest
): Promise<McpEnvelopeJson> {
  const params = ToolsCallParamsSchema.safeParse(rpc.params);
  if (!params.success) {
    return {
      ok: false,
      error: {
        code: "STRUCTURAL_INVALID",
        message: "Invalid `tools/call` params.",
        details: {
          issues: params.error.issues.map((i) => ({
            path: i.path,
            message: i.message,
          })),
        },
      },
    };
  }

  // Accept both bare name (`get_node`) and fully-qualified form
  // (`query.get_node`). The bare form is what the LLM typically sends.
  const requestedName = params.data.name;
  const bareName = requestedName.startsWith("query.")
    ? requestedName.slice("query.".length)
    : requestedName;

  // BR-23 rule 5: closed whitelist. An `ingest.propose_*` invocation cannot
  // reach the handler even if it accidentally shares the underlying
  // McpServer instance.
  if (!QUERY_TOOL_NAME_SET.has(bareName)) {
    return {
      ok: false,
      error: {
        code: "NOT_FOUND",
        message: `Tool 'query.${bareName}' is not registered on the query transport.`,
      },
    };
  }

  const tool = deps.mcp.getTool("query", bareName as QueryToolName);
  if (tool === undefined) {
    // Whitelisted but missing from registry — means the boot-time registrar
    // failed for this tool. Surface NOT_FOUND rather than crashing.
    return {
      ok: false,
      error: {
        code: "NOT_FOUND",
        message: `Tool 'query.${bareName}' is not registered on the query transport.`,
      },
    };
  }

  const args = params.data.arguments ?? {};
  const handlerResult = (await tool.handler(args)) as McpEnvelopeJson;
  return handlerResult;
}

// ---------------------------------------------------------------------------
// Helpers.
// ---------------------------------------------------------------------------

function successResponse(
  id: string | number | null,
  result: unknown
): JsonRpcSuccess {
  return { jsonrpc: "2.0", id, result };
}

function errorResponse(
  id: string | number | null,
  code: number,
  message: string,
  data?: unknown
): JsonRpcError {
  return {
    jsonrpc: "2.0",
    id,
    error: data === undefined ? { code, message } : { code, message, data },
  };
}
