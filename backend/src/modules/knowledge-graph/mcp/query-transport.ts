// MCP transport for the read-only `query` toolset — a thin wrapper over the
// shared SDK transport kernel (`src/mcp/sdk-http-transport.ts`). See that module
// for the stateless / low-level-Server / handler-validates rationale.
//
// Surface: `POST /api/v1/mcp/query`, mounted under the auth-protected scope by
// the bootstrap. Exposes the 13 read tools (9 knowledge-graph + 4
// query-retrieval) whose descriptors live on the shared in-process registry.

import type { FastifyInstance } from "fastify";
import type { Logger } from "pino";

import type { McpServer as ToolRegistry } from "../../../mcp/server.js";
import {
  mountMcpEndpoint,
  type McpEnvelope,
  type McpHttpTool,
} from "../../../mcp/sdk-http-transport.js";

export interface QueryMcpTransportDeps {
  readonly logger: Logger;
  /** Shared in-process registry holding the `query` tool descriptors + handlers. */
  readonly mcp: ToolRegistry;
  /** The closed set of tool names this endpoint exposes (KG 9 + query-retrieval 4). */
  readonly toolNames: readonly string[];
}

/** Register `POST /mcp/query` inside the calling Fastify scope. */
export async function registerQueryMcpTransport(
  scope: FastifyInstance,
  deps: QueryMcpTransportDeps
): Promise<void> {
  mountMcpEndpoint(scope, {
    path: "/mcp/query",
    serverName: "remember-bff-query",
    serverVersion: "0.1.0",
    logger: deps.logger,
    getTools: () =>
      deps.toolNames
        .map((name) => deps.mcp.getTool("query", name))
        .filter((t): t is NonNullable<typeof t> => t !== undefined)
        .map(
          (t): McpHttpTool => ({
            name: t.name,
            description: t.description,
            inputSchema: t.inputSchema,
            handler: t.handler as (input: unknown) => Promise<McpEnvelope>,
          })
        ),
  });
}
