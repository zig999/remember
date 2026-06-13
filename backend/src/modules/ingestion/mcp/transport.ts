// MCP-over-HTTP transport for the `ingest` toolset.
//
// Surface: `POST /api/v1/mcp` (mounted under the auth-protected scope by the
// bootstrap). Body is a JSON-RPC 2.0 request. Supported methods:
//   - `initialize`                — protocol handshake (returns server info)
//   - `tools/list`                — list the `propose_*` tools available to
//                                   the current session
//   - `tools/call` { name, arguments }
//                                 — invoke a tool. `name` may be the bare
//                                   tool name (`propose_fragment`) or the
//                                   fully-qualified `ingest.propose_fragment`.
//
// BR-21: every call carries an ambient `llm_run_id` (header `X-LLM-Run-Id`).
// If the header is missing/empty, the transport returns a JSON-RPC `result`
// payload that wraps a `STRUCTURAL_INVALID` envelope WITHOUT writing a
// `tool_call` row (BR-23 transport-exception). Any tool dispatch that DOES
// reach a registered handler runs through `runIngestHandler` from
// `handler-base.ts`, which itself owns the audit-row writes (BR-23 happy
// path + ROLLBACK path).
//
// Streamable HTTP / SDK note (infrastructure-pending)
// ---------------------------------------------------
// The task contract calls out `@modelcontextprotocol/sdk` as the SDK that
// would normally own the HTTP wire format (Streamable HTTP). That SDK is
// not yet installed (see the infra-pending report). The Fastify handler
// below implements the same JSON-RPC 2.0 envelope the SDK speaks, scoped to
// the three methods the `ingest` toolset actually needs. When the SDK is
// added, this handler is the single seam to swap: the session factory
// already exposes a stable McpServer surface, and the JSON-RPC envelope
// matches the spec.

import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { Pool } from "pg";
import type { Logger } from "pino";
import { z } from "zod";

import type { CatalogSnapshot } from "../catalog/catalog.js";
import { createIngestSession } from "./session-factory.js";
import { IngestToolInputJsonSchemas } from "../dto/index.js";

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
// MCP `tools/call` params shape (subset relevant to `ingest`).
// ---------------------------------------------------------------------------

const ToolsCallParamsSchema = z.object({
  name: z.string().min(1),
  arguments: z.record(z.string(), z.unknown()).optional(),
});

// ---------------------------------------------------------------------------
// Public registration entry point.
// ---------------------------------------------------------------------------

export interface IngestMcpTransportDeps {
  readonly pool: Pool;
  readonly logger: Logger;
  readonly catalog: CatalogSnapshot;
}

/** HTTP header carrying the ambient `llm_run_id` for the MCP session. */
export const LLM_RUN_HEADER = "x-llm-run-id";

/**
 * Register `POST /mcp` inside the calling Fastify scope. The route is
 * stateless from the transport's point of view — every request opens a
 * fresh session via the factory, dispatches one JSON-RPC message, and
 * returns. Auth is enforced by the parent scope's `requireNeonAuth`
 * preHandler (the bootstrap mounts this under `/api/v1`).
 */
export async function registerIngestMcpTransport(
  scope: FastifyInstance,
  deps: IngestMcpTransportDeps
): Promise<void> {
  scope.post(
    "/mcp",
    async (request: FastifyRequest, reply: FastifyReply) =>
      handleMcpRequest(request, reply, deps)
  );
}

/**
 * Per-request handler. Wraps the dispatch loop in a top-level try/catch so
 * any unexpected throw becomes a JSON-RPC `internal_error` instead of a
 * Fastify 500 + the global error envelope (which would break MCP clients).
 */
async function handleMcpRequest(
  request: FastifyRequest,
  reply: FastifyReply,
  deps: IngestMcpTransportDeps
): Promise<JsonRpcResponse | void> {
  // Reply always speaks JSON-RPC over HTTP 200 — the JSON-RPC `error` field
  // is the success indicator (matches MCP / matches the project's MCP
  // envelope semantics). Transport-level failures (auth) are 4xx via the
  // parent scope's preHandler.
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
        return successResponse(
          rpcId,
          await handleToolsList(request, deps)
        );

      case "tools/call":
        return successResponse(
          rpcId,
          await handleToolsCall(request, deps, rpc)
        );

      default:
        return errorResponse(
          rpcId,
          JSON_RPC.METHOD_NOT_FOUND,
          `Method '${rpc.method}' is not supported by this MCP endpoint.`
        );
    }
  } catch (err) {
    // We never let an unhandled error leak through — the MCP client should
    // always see a well-formed JSON-RPC envelope.
    deps.logger.error(
      {
        component: "mcp.ingest.transport",
        method: rpc.method,
        cause_message: err instanceof Error ? err.message : "unknown",
      },
      "mcp_transport_internal_error"
    );
    return errorResponse(rpcId, JSON_RPC.INTERNAL_ERROR, "Internal error in MCP transport.");
  }
}

// ---------------------------------------------------------------------------
// Method implementations.
// ---------------------------------------------------------------------------

/**
 * MCP `initialize` — handshake. Returns the server's protocol version and
 * the capability set. The `ingest` transport only advertises tool support.
 */
function buildInitializeResult(): Record<string, unknown> {
  return {
    protocolVersion: "2024-11-05",
    serverInfo: { name: "remember-bff-ingest", version: "0.1.0" },
    capabilities: { tools: {} },
  };
}

/**
 * MCP `tools/list` — enumerate the tools the current session may invoke.
 *
 * If no ambient `llm_run_id` header is present we still return a valid
 * `tools/list` result, but the list is empty (BR-21 first bullet: the
 * transport refuses to expose `propose_*` without a run). No `tool_call`
 * row is written in this branch (BR-23 transport-exception).
 */
async function handleToolsList(
  request: FastifyRequest,
  deps: IngestMcpTransportDeps
): Promise<{ tools: McpToolDescriptor[] }> {
  const llmRunId = readLlmRunHeader(request);
  const session = createIngestSession(
    { pool: deps.pool, logger: deps.logger, catalog: deps.catalog },
    llmRunId
  );

  if (!session.tools_registered) {
    return { tools: [] };
  }

  const tools: McpToolDescriptor[] = [];
  for (const qualified of session.mcp.listTools()) {
    const [, name] = qualified.split(".") as [string, string];
    const tool = session.mcp.getTool("ingest", name);
    if (tool === undefined) continue;
    const inputSchema =
      IngestToolInputJsonSchemas[name as keyof typeof IngestToolInputJsonSchemas];
    if (inputSchema === undefined) continue;
    tools.push({
      name,
      description: tool.description,
      // BR-24 enforced: the JSON Schema published over MCP is the SAME
      // object derived from the Zod source at module init (see dto/index.ts).
      inputSchema: inputSchema as unknown as Record<string, unknown>,
    });
  }
  return { tools };
}

interface McpToolDescriptor {
  readonly name: string;
  readonly description: string;
  readonly inputSchema: Record<string, unknown>;
}

/**
 * MCP `tools/call` — invoke a propose-* tool.
 *
 * Behaviour matrix:
 *   - No ambient run id (BR-21 first bullet)            -> STRUCTURAL_INVALID
 *                                                         envelope in `result`,
 *                                                         NO tool_call row
 *                                                         (BR-23 exception)
 *   - Ambient run id present, tool name unknown         -> NOT_FOUND envelope
 *   - Tool handler runs                                  -> handler's envelope
 *                                                         (handler owns audit)
 *
 * The envelope is returned INSIDE the JSON-RPC `result` field (consistent
 * with MCP wire format) so JSON-RPC `error` stays reserved for
 * transport-level failures.
 */
async function handleToolsCall(
  request: FastifyRequest,
  deps: IngestMcpTransportDeps,
  rpc: JsonRpcRequest
): Promise<McpEnvelopeJson> {
  const params = ToolsCallParamsSchema.safeParse(rpc.params);
  if (!params.success) {
    return {
      ok: false,
      error: {
        code: "STRUCTURAL_INVALID",
        message: "Invalid `tools/call` params.",
        details: { issues: params.error.issues.map((i) => ({ path: i.path, message: i.message })) },
      },
    };
  }

  const llmRunId = readLlmRunHeader(request);
  const session = createIngestSession(
    { pool: deps.pool, logger: deps.logger, catalog: deps.catalog },
    llmRunId
  );

  if (!session.tools_registered) {
    // BR-21 + BR-23 exception: refuse before reaching any handler.
    return {
      ok: false,
      error: {
        code: "STRUCTURAL_INVALID",
        message: "MCP session has no ambient llm_run_id; ingest tools are not exposed.",
      },
    };
  }

  // Accept both bare name (`propose_fragment`) and fully-qualified form
  // (`ingest.propose_fragment`) — MCP clients can write either.
  const requestedName = params.data.name;
  const bareName = requestedName.startsWith("ingest.")
    ? requestedName.slice("ingest.".length)
    : requestedName;
  const tool = session.mcp.getTool("ingest", bareName);
  if (tool === undefined) {
    return {
      ok: false,
      error: {
        code: "NOT_FOUND",
        message: `Tool 'ingest.${bareName}' is not registered.`,
      },
    };
  }

  // The handler is the per-tool closure built by `buildProposeXxxHandler`
  // in `propose-*.handler.ts`. It calls the service layer through
  // `runIngestHandler`, which owns the audit row, the transaction policy,
  // and the envelope mapping. We surface whatever it returns verbatim.
  const args = params.data.arguments ?? {};
  const handlerResult = (await tool.handler(args)) as McpEnvelopeJson;
  return handlerResult;
}

/** Verbatim of the project's MCP envelope shape. Kept as a structural type
 *  so we do not pull a service-layer type into the transport. */
interface McpEnvelopeJson {
  readonly ok: boolean;
  readonly result?: unknown;
  readonly error?: {
    readonly code: string;
    readonly message: string;
    readonly details?: Record<string, unknown>;
  };
}

// ---------------------------------------------------------------------------
// Helpers.
// ---------------------------------------------------------------------------

/**
 * Extract the ambient `llm_run_id` from the request header. The header is
 * lowercased by Fastify (Node http convention), so we read the lowercase key.
 * Returns `null` when the header is absent or whitespace-only.
 */
function readLlmRunHeader(request: FastifyRequest): string | null {
  const raw = request.headers[LLM_RUN_HEADER];
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  return trimmed.length === 0 ? null : trimmed;
}

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
