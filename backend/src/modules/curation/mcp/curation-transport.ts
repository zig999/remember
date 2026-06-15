// MCP-over-HTTP transport for the write-side `curation` toolset.
//
// Surface: `POST /api/v1/mcp/curation` (mounted under the auth-protected scope
// by the bootstrap). Body is a JSON-RPC 2.0 request. Supported methods:
//   - `initialize`     — protocol handshake (returns server info).
//   - `tools/list`     — list the 8 curation tools registered on the shared
//                        `McpServer` core (the 7 owned by this domain plus
//                        `compliance_delete` owned by `compliance-audit`).
//   - `tools/call`     — invoke a tool. `name` may be the bare tool name
//                        (`merge_nodes`) or the fully-qualified
//                        `curation.merge_nodes`.
//
// Sibling-of `knowledge-graph/mcp/query-transport.ts` (Rule 11 — match the
// codebase's conventions). The two transports share the same JSON-RPC
// envelope handling and the same closed-whitelist gate; they differ in three
// well-defined ways recorded in `curation.back.md` BR-29:
//   1. The whitelist is `CURATION_TOOL_NAMES` (7) ∪ {'compliance_delete'} (1)
//      = 8 names. Anything else (including ingest-side `propose_*` /
//      `finalize_run` and query-side `get_node` / `traverse` / `search` / ...)
//      is rejected with `{ ok: false, error.code: "NOT_FOUND" }`.
//   2. NO `X-LLM-Run-Id` header — curation is not tied to an LLM run; both the
//      Owner (via SPA / REST) and the LLM (via MCP) call the SAME service
//      layer.
//   3. The handlers ARE write-side and DO write `curation_action` audit rows —
//      but that audit happens INSIDE the service layer (via
//      `withTransaction` in `curation/service/transaction.ts`), not at the
//      transport level. The transport itself stays envelope-only.
//
// MCP envelope (CLAUDE.md "Architecture / Backend"):
//   success -> JSON-RPC `result` = { ok: true,  result: <payload> }
//   failure -> JSON-RPC `result` = { ok: false, error: { code, message, … } }
//   Transport-level failures (malformed JSON-RPC, unknown method) are surfaced
//   via the JSON-RPC `error` field (codes -32700/-32600/-32601/-32602/-32603).

import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { Pool } from "pg";
import type { Logger } from "pino";
import { z } from "zod";

import type { McpServer } from "../../../mcp/server.js";
import {
  CURATION_TOOL_NAMES,
  CurationToolDescriptions,
  CurationToolInputJsonSchemas,
  type CurationToolName,
} from "./curation-toolset.js";

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
// Co-tenant descriptor (compliance_delete).
// ---------------------------------------------------------------------------

/**
 * Per-tool metadata a co-tenant domain (e.g. `compliance-audit`) hands to the
 * transport at boot so it can (a) advertise the tool through `tools/list` and
 * (b) admit it through the closed-whitelist gate (BR-29 rule 5). The transport
 * itself never imports the co-tenant module — composition happens in the
 * bootstrap (`app.ts`), preserving the one-way dependency from compliance-audit
 * into curation rather than back.
 */
export interface CurationMcpToolDescriptor {
  readonly name: string;
  readonly description: string;
  /** JSON Schema (2020-12) for the tool input — same object pinned at
   *  registration time by the co-tenant toolset module (BR-31). */
  readonly inputSchema: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Public registration entry point.
// ---------------------------------------------------------------------------

export interface CurationMcpTransportDeps {
  readonly pool: Pool;
  readonly logger: Logger;
  readonly mcp: McpServer;
  /** Optional co-tenant descriptors. The seven curation tools owned by this
   *  domain (`CURATION_TOOL_NAMES`) are always advertised; entries here extend
   *  that set without creating a reverse dependency from this module into the
   *  co-tenant (BR-31: `compliance_delete` is the canonical entry). */
  readonly extraTools?: readonly CurationMcpToolDescriptor[];
}

/** Build the closed-whitelist set for one request — the seven curation tools
 *  owned by this domain plus any extras handed in by the bootstrap (in
 *  practice: `compliance_delete`). Anything outside this set is rejected with
 *  NOT_FOUND even if a tool by that name happens to be present in the shared
 *  `McpServer` core (e.g. an ingest `propose_*` or a query `get_node`). */
function buildToolNameSet(
  deps: CurationMcpTransportDeps
): ReadonlySet<string> {
  const set = new Set<string>(CURATION_TOOL_NAMES);
  if (deps.extraTools !== undefined) {
    for (const tool of deps.extraTools) set.add(tool.name);
  }
  return set;
}

/**
 * Register `POST /mcp/curation` inside the calling Fastify scope. The route is
 * stateless: each request parses one JSON-RPC message, dispatches it, and
 * returns. Auth is enforced by the parent scope's `requireNeonAuth`
 * preHandler — this transport adds NO additional headers (BR-29 rule 2).
 *
 * The pool dep is kept on the type but the transport does not use it
 * directly: the per-tool handlers in `curation-toolset.ts` call services that
 * open their own `withTransaction` lifecycles. The dep is reserved for future
 * write-side connection metrics / smoke probes.
 */
export async function registerCurationMcpTransport(
  scope: FastifyInstance,
  deps: CurationMcpTransportDeps
): Promise<void> {
  scope.post(
    "/mcp/curation",
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
  deps: CurationMcpTransportDeps
): Promise<JsonRpcResponse | void> {
  // Reply always speaks JSON-RPC over HTTP 200 — the JSON-RPC `error` field
  // is the success indicator (matches MCP wire semantics + ingestion / query
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
    // see a well-formed JSON-RPC envelope. The shared error mapper (BR-30)
    // already collapses tool-side throws inside `makeHandler`; a throw that
    // reaches this point indicates a transport-layer bug.
    deps.logger.error(
      {
        component: "mcp.curation.transport",
        method: rpc.method,
        cause_message: err instanceof Error ? err.message : "unknown",
      },
      "mcp_curation_transport_internal_error"
    );
    return errorResponse(rpcId, JSON_RPC.INTERNAL_ERROR, "Internal error in MCP transport.");
  }
}

// ---------------------------------------------------------------------------
// Method implementations.
// ---------------------------------------------------------------------------

/**
 * MCP `initialize` — handshake. Returns the server's protocol version and
 * capability set. The `curation` transport advertises tool support only.
 */
function buildInitializeResult(): Record<string, unknown> {
  return {
    protocolVersion: "2024-11-05",
    serverInfo: { name: "remember-bff-curation", version: "0.1.0" },
    capabilities: { tools: {} },
  };
}

interface McpToolDescriptor {
  readonly name: string;
  readonly description: string;
  readonly inputSchema: Record<string, unknown>;
}

/**
 * MCP `tools/list` — enumerate the 8 curation tools. The seven owned by this
 * domain come from the toolset module's pinned bundle (BR-31); the eighth
 * (`compliance_delete`) is passed in as a co-tenant descriptor by the
 * bootstrap (BR-29). Both sets are intersected with the shared `McpServer`
 * registry so a tool absent from the registry (e.g. boot-time registrar
 * failure) is omitted rather than fabricated.
 */
function buildToolsListResult(
  deps: CurationMcpTransportDeps
): { tools: McpToolDescriptor[] } {
  const tools: McpToolDescriptor[] = [];
  // (a) curation seven tools — owned by this module.
  for (const name of CURATION_TOOL_NAMES) {
    const tool = deps.mcp.getTool("curation", name);
    if (tool === undefined) continue;
    tools.push({
      name,
      description: CurationToolDescriptions[name],
      // BR-31: same JSON Schema object pinned at registration time in
      // `curation-toolset.ts`. The shape is JSON-Schema-2020-12.
      inputSchema: CurationToolInputJsonSchemas[name] as unknown as Record<
        string,
        unknown
      >,
    });
  }
  // (b) co-tenant extras (e.g. compliance-audit's `compliance_delete`) — passed
  // in by the bootstrap. Same registry intersection rule.
  if (deps.extraTools !== undefined) {
    for (const desc of deps.extraTools) {
      const tool = deps.mcp.getTool("curation", desc.name);
      if (tool === undefined) continue;
      tools.push({
        name: desc.name,
        description: desc.description,
        inputSchema: desc.inputSchema,
      });
    }
  }
  return { tools };
}

/**
 * MCP `tools/call` — dispatch to one of the 8 curation tools.
 *
 * Behaviour matrix:
 *   - params malformed                              -> STRUCTURAL_INVALID env.
 *   - tool name not in {CURATION_TOOL_NAMES} ∪ {compliance_delete} -> NOT_FOUND env.
 *     (Closes BR-29 rule 5 — `propose_*` / `get_node` / `search` are
 *      unreachable even if they live in the shared registry under a different
 *      toolset, AND a write tool published on another toolset by mistake.)
 *   - tool name in whitelist but not registered yet -> NOT_FOUND env.
 *   - handler runs                                  -> handler's envelope
 *     (the toolset's `makeHandler` already maps thrown errors via
 *      `mapErrorToEnvelope` — BR-30; `compliance_delete` keeps its own §14
 *      canonical-code mapping — BR-31.)
 */
async function handleToolsCall(
  deps: CurationMcpTransportDeps,
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

  // Accept both bare name (`merge_nodes`) and fully-qualified form
  // (`curation.merge_nodes`). The bare form is what the LLM typically sends
  // (BR-29 rule 6).
  const requestedName = params.data.name;
  const bareName = requestedName.startsWith("curation.")
    ? requestedName.slice("curation.".length)
    : requestedName;

  // BR-29 rule 5: closed whitelist of 8 names. An `ingest.propose_*` or
  // `query.get_node` invocation cannot reach the handler even if it
  // accidentally shares the underlying McpServer instance. The set is built
  // per-request from the static curation seven names + any `extraTools`
  // handed in by the bootstrap (`compliance_delete`).
  const toolNameSet = buildToolNameSet(deps);
  if (!toolNameSet.has(bareName)) {
    return {
      ok: false,
      error: {
        code: "NOT_FOUND",
        message: `Tool 'curation.${bareName}' is not registered on the curation transport.`,
      },
    };
  }

  const tool = deps.mcp.getTool("curation", bareName as CurationToolName);
  if (tool === undefined) {
    // Whitelisted but missing from registry — means the boot-time registrar
    // failed for this tool. Surface NOT_FOUND rather than crashing.
    return {
      ok: false,
      error: {
        code: "NOT_FOUND",
        message: `Tool 'curation.${bareName}' is not registered on the curation transport.`,
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
