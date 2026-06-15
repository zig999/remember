// MCP transport for the write-side `curation` toolset — a thin wrapper over the
// shared SDK transport kernel (`src/mcp/sdk-http-transport.ts`). See that module
// for the stateless / low-level-Server / handler-validates rationale.
//
// Surface: `POST /api/v1/mcp/curation`, mounted under the auth-protected scope.
// Exposes 8 tools: the 7 owned by this domain (CURATION_TOOL_NAMES) plus
// `compliance_delete` (owned by compliance-audit, registered under the same
// `curation` toolset key on the shared registry). NO X-LLM-Run-Id — both the
// owner (REST) and the LLM (MCP) drive the SAME service layer; the write-side
// `curation_action` audit happens INSIDE the service (withTransaction), not here.
//
// Validation is the handlers' (the curation DTOs encode the BR-30 BUSINESS_*
// cross-field rules via superRefine): the kernel delegates raw args to the
// handler, so VALIDATION_INVALID_FORMAT and BUSINESS_* surface via the shared
// mapper byte-identically to REST.

import type { FastifyInstance } from "fastify";
import type { Logger } from "pino";

import type { McpServer as ToolRegistry } from "../../../mcp/server.js";
import {
  mountMcpEndpoint,
  type McpEnvelope,
  type McpHttpTool,
} from "../../../mcp/sdk-http-transport.js";

export interface CurationMcpTransportDeps {
  readonly logger: Logger;
  /** Shared in-process registry holding the `curation` tool descriptors + handlers. */
  readonly mcp: ToolRegistry;
  /** The closed set of tool names this endpoint exposes (7 curation + compliance_delete). */
  readonly toolNames: readonly string[];
}

/** Register `POST /mcp/curation` inside the calling Fastify scope. */
export async function registerCurationMcpTransport(
  scope: FastifyInstance,
  deps: CurationMcpTransportDeps
): Promise<void> {
  mountMcpEndpoint(scope, {
    path: "/mcp/curation",
    serverName: "remember-bff-curation",
    serverVersion: "0.1.0",
    logger: deps.logger,
    getTools: () =>
      deps.toolNames
        .map((name) => deps.mcp.getTool("curation", name))
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
