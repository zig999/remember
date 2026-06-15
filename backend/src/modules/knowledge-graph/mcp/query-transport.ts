// MCP transport for the read-only `query` toolset — on the official
// `@modelcontextprotocol/sdk` (Streamable HTTP, stateless).
//
// Surface: `POST /api/v1/mcp/query` (mounted under the auth-protected scope by
// the bootstrap; the parent scope's requireNeonAuth preHandler gates every
// request). Speaks the MCP 2025-06-18 wire format: `initialize` negotiation,
// `tools/list`, `tools/call` returning `{ content, isError }` — consumable by
// any standard MCP client.
//
// Stateless pattern (validated by the Phase-0 spike): a FRESH McpServer +
// StreamableHTTPServerTransport is built PER REQUEST (a single long-lived
// stateless transport 500s on the 2nd request). The 13 read tools (9
// knowledge-graph + 4 query-retrieval) are reused verbatim from the shared
// in-process registry: their descriptors carry the Zod input schema (the SDK
// derives the advertised JSON Schema + validates input from it) and the
// envelope-producing handler (re-parse is idempotent for these DTOs). The
// handler's `{ ok, result }` / `{ ok:false, error }` envelope is adapted to the
// MCP result shape here — success → a text content block with the JSON payload;
// failure → `toMcpToolResult` (isError + the structured error in text).
//
// Fastify bridge: `reply.hijack()` then `transport.handleRequest(req.raw,
// res.raw, body)` — Fastify must not also send a response.

import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { Pool } from "pg";
import type { Logger } from "pino";
import type { ZodObject, ZodRawShape } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

import type { McpServer as ToolRegistry } from "../../../mcp/server.js";
import { toMcpToolResult } from "../../../shared/error-mapping.js";

const SERVER_INFO = { name: "remember-bff-query", version: "0.1.0" } as const;

/** Envelope produced by the toolset handlers (shared in-process contract). */
interface McpEnvelopeJson {
  readonly ok: boolean;
  readonly result?: unknown;
  readonly error?: { readonly code: string; readonly message: string; readonly details?: unknown };
}

export interface QueryMcpTransportDeps {
  /** Reserved for future read-side metrics; handlers open their own withReadOnly. */
  readonly pool: Pool;
  readonly logger: Logger;
  /** Shared in-process registry holding the `query` tool descriptors + handlers. */
  readonly mcp: ToolRegistry;
  /** The closed set of tool names this endpoint exposes (KG 9 + query-retrieval 4). */
  readonly toolNames: readonly string[];
}

/**
 * Register `POST /mcp/query` inside the calling Fastify scope. Stateless: each
 * request builds its own SDK server + transport, dispatches one MCP message,
 * and tears down on socket close.
 */
export async function registerQueryMcpTransport(
  scope: FastifyInstance,
  deps: QueryMcpTransportDeps
): Promise<void> {
  scope.post(
    "/mcp/query",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const server = buildSdkServer(deps);
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined, // stateless
        enableJsonResponse: true, // plain JSON responses (no SSE)
      });
      // No explicit transport.close() here: in stateless mode each request
      // produces a single complete JSON response, and the per-request server +
      // transport are GC'd once this closure returns. Calling close() would
      // schedule @hono/node-server's forceClose timer (socket.destroySoon),
      // which is both unnecessary here and incompatible with the mock sockets
      // used by Fastify's `inject()` under test.
      try {
        await server.connect(transport);
        reply.hijack(); // Fastify must NOT send its own response.
        await transport.handleRequest(request.raw, reply.raw, request.body);
      } catch (err) {
        deps.logger.error(
          {
            component: "mcp.query.transport",
            cause_message: err instanceof Error ? err.message : "unknown",
          },
          "mcp_query_transport_internal_error"
        );
        if (!reply.raw.headersSent) {
          reply.raw.statusCode = 500;
          reply.raw.end();
        }
      }
    }
  );
}

/**
 * Build a per-request SDK server with the 13 read tools registered. Each tool's
 * Zod input schema and envelope-producing handler are reused verbatim from the
 * shared registry; the only new code is the envelope → MCP-result adapter.
 *
 * The closed tool set is structural here: only `deps.toolNames` are registered,
 * so ingest `propose_*` / curation write tools are unreachable on this endpoint
 * by construction (no manual whitelist gate needed — replaces BR-23 rule 5).
 */
function buildSdkServer(deps: QueryMcpTransportDeps): McpServer {
  const server = new McpServer({ name: SERVER_INFO.name, version: SERVER_INFO.version });
  for (const name of deps.toolNames) {
    const tool = deps.mcp.getTool("query", name);
    if (tool === undefined) continue; // boot-time registrar gap — omit, don't fabricate.
    const shape = (tool.inputSchema as unknown as ZodObject<ZodRawShape>).shape;
    server.registerTool(
      name,
      { description: tool.description, inputSchema: shape },
      async (args: Record<string, unknown>) => {
        const env = (await tool.handler(args)) as McpEnvelopeJson;
        if (env.ok) {
          // Success: the service payload as a JSON text content block.
          // (structuredContent + outputSchema is a deliberate future enhancement.)
          return { content: [{ type: "text" as const, text: JSON.stringify(env.result) }] };
        }
        // Business error: our typed { code, message, details } in an isError result.
        // Rebuild into the SDK's mutable content shape (the shared mapper is readonly).
        const mapped = toMcpToolResult({ ok: false, error: env.error! });
        return {
          content: mapped.content.map((c) => ({ type: c.type, text: c.text })),
          isError: true as const,
        };
      }
    );
  }
  return server;
}
