// Shared MCP-over-HTTP transport kernel — the single seam every MCP endpoint
// (query, curation, …) mounts on. Built on the official `@modelcontextprotocol/sdk`
// LOW-LEVEL `Server` (Streamable HTTP, stateless per-request).
//
// Why the low-level Server (not McpServer.registerTool):
//   - tools/list advertises the JSON Schema derived ONCE from each tool's Zod
//     source (`z.toJSONSchema`, same derivation the toolsets pin — BR-25/BR-31),
//     so refined / intersection DTOs (curation's superRefine + `.and()`) still
//     advertise full properties.
//   - tools/call delegates the RAW arguments to the toolset handler with NO SDK
//     validation interposed, so the handler's layered Zod validation is
//     authoritative: VALIDATION_INVALID_FORMAT and the BR-30 BUSINESS_* cross-
//     field codes surface via our shared error mapper, byte-identical to REST.
//
// Per the MCP 2025-06-18 spec the success/error split is: protocol errors →
// JSON-RPC error (the SDK owns those); tool execution / business errors →
// result with `isError: true` (we map those via `toMcpToolResult`).
//
// Stateless pattern (Phase-0 spike): a FRESH Server + transport PER REQUEST. We
// do NOT call transport.close()/server.close() — each request emits one complete
// JSON response and the per-request objects are GC'd; close() would schedule
// @hono/node-server's forceClose timer needlessly.
//
// Fastify bridge: `reply.hijack()` then `transport.handleRequest(req.raw,
// res.raw, body)` — Fastify must not also send a response.

import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { Logger } from "pino";
import type { ZodTypeAny } from "zod";
import { z } from "zod";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type CallToolResult,
} from "@modelcontextprotocol/sdk/types.js";

import { toMcpToolResult, type ErrorEnvelope } from "../shared/error-mapping.js";

/** Canonical envelope the toolset handlers return (shared in-process contract). */
export interface McpEnvelope {
  readonly ok: boolean;
  readonly result?: unknown;
  readonly error?: { readonly code: string; readonly message: string; readonly details?: unknown };
}

/** One tool an endpoint exposes: its Zod source (for schema advertisement) +
 *  the envelope-producing handler (which owns validation). */
export interface McpHttpTool {
  readonly name: string;
  readonly description: string;
  readonly inputSchema: ZodTypeAny;
  readonly handler: (rawInput: unknown) => Promise<McpEnvelope>;
}

export interface McpHttpEndpointOptions {
  readonly path: string;
  readonly serverName: string;
  readonly serverVersion: string;
  readonly logger: Logger;
  /** Resolved lazily on first request (toolsets register after the route mounts
   *  in app.ts), then memoized. */
  readonly getTools: () => readonly McpHttpTool[];
}

const JSON_SCHEMA_OPTS = { unrepresentable: "any" as const };

/** Map a handler envelope to an MCP `tools/call` result. */
function toCallToolResult(env: McpEnvelope): CallToolResult {
  if (env.ok) {
    // (structuredContent + outputSchema is a deliberate future enhancement.)
    return { content: [{ type: "text", text: JSON.stringify(env.result) }] };
  }
  const mapped = toMcpToolResult(env as ErrorEnvelope);
  return {
    content: mapped.content.map((c) => ({ type: c.type, text: c.text })),
    isError: true,
  };
}

/** Inputs for {@link buildConfiguredMcpServer}: the server identity advertised
 *  in `initialize` plus the closed set of tools to register. */
export interface BuildConfiguredMcpServerOptions {
  readonly serverName: string;
  readonly serverVersion: string;
  readonly tools: readonly McpHttpTool[];
}

/**
 * Build a low-level `@modelcontextprotocol/sdk` `Server` with `ListTools` /
 * `CallTool` handlers wired to the supplied closed tool set, ready to be
 * `.connect()`-ed to any transport (HTTP via `StreamableHTTPServerTransport`
 * inside {@link mountMcpEndpoint}; stdio via `StdioServerTransport` in the
 * forthcoming `backend/src/mcp-stdio.ts` entry point).
 *
 * Behaviour is identical to the inline construction this builder replaces:
 *  - `tools/list` advertises each tool's name, description, and the JSON Schema
 *    derived once from its Zod source (`z.toJSONSchema`, BR-25 / BR-31).
 *  - `tools/call` looks the name up in the closed set; unknown names yield a
 *    `NOT_FOUND` isError result mapped via {@link toMcpToolResult}.
 *  - Arguments are forwarded RAW to the handler — no SDK validation interposed,
 *    so the handler's layered Zod validation remains authoritative.
 */
export function buildConfiguredMcpServer(opts: BuildConfiguredMcpServerOptions): Server {
  const advertised = opts.tools.map((t) => ({
    name: t.name,
    description: t.description,
    inputSchema: z.toJSONSchema(t.inputSchema, JSON_SCHEMA_OPTS) as unknown as Record<
      string,
      unknown
    >,
  }));
  const handlers = new Map(opts.tools.map((t) => [t.name, t.handler]));

  const server = new Server(
    { name: opts.serverName, version: opts.serverVersion },
    { capabilities: { tools: {} } }
  );
  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: advertised }));
  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const handler = handlers.get(req.params.name);
    if (handler === undefined) {
      return toCallToolResult({
        ok: false,
        error: {
          code: "NOT_FOUND",
          message: `Tool '${req.params.name}' is not available on this endpoint.`,
        },
      });
    }
    const env = await handler(req.params.arguments ?? {});
    return toCallToolResult(env);
  });
  return server;
}

/**
 * Mount one MCP-over-HTTP endpoint on the calling Fastify scope. Auth is the
 * parent scope's responsibility (requireNeonAuth preHandler). The closed tool
 * set is structural — only the tools returned by `getTools()` are advertised
 * and dispatchable; any other name yields a NOT_FOUND isError result.
 */
export function mountMcpEndpoint(
  scope: FastifyInstance,
  opts: McpHttpEndpointOptions
): void {
  // Toolsets register after the route mounts in app.ts, so the closed set is
  // resolved lazily on the first request and memoized; subsequent requests
  // re-use the same `tools` reference (the JSON-Schema derivation inside the
  // builder is cheap and deterministic, but we still hand the same array in
  // every time to keep allocations identical to the pre-extraction path).
  let cachedTools: readonly McpHttpTool[] | null = null;
  const resolveTools = (): readonly McpHttpTool[] => {
    if (cachedTools === null) cachedTools = opts.getTools();
    return cachedTools;
  };

  scope.post(opts.path, async (request: FastifyRequest, reply: FastifyReply) => {
    const server = buildConfiguredMcpServer({
      serverName: opts.serverName,
      serverVersion: opts.serverVersion,
      tools: resolveTools(),
    });

    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined, // stateless
      enableJsonResponse: true, // plain JSON responses (no SSE)
    });
    try {
      await server.connect(transport);
      reply.hijack(); // Fastify must NOT send its own response.
      await transport.handleRequest(request.raw, reply.raw, request.body);
    } catch (err) {
      opts.logger.error(
        {
          component: "mcp.transport",
          path: opts.path,
          cause_message: err instanceof Error ? err.message : "unknown",
        },
        "mcp_transport_internal_error"
      );
      if (!reply.raw.headersSent) {
        reply.raw.statusCode = 500;
        reply.raw.end();
      }
    }
  });
}
