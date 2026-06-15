// MCP transport for the `ingest` toolset — a thin wrapper over the shared SDK
// transport kernel (`src/mcp/sdk-http-transport.ts`). See that module for the
// stateless / low-level-Server / handler-validates rationale.
//
// Surface: `POST /api/v1/mcp/ingest`, mounted under the auth-protected scope
// by the bootstrap. Exposes 4 tools owned by this domain — the four
// `propose_*` actions. NO `X-LLM-Run-Id` ambient header: per BR-21 (revised),
// `llm_run_id` is a per-call tool argument validated by the MCP-facing Zod
// schemas in `mcp-schemas.ts` (Option B — arg-based run binding). The handler
// shell (`handler-base.ts` -> `runIngestHandler`) owns the per-call
// transaction, `assertRunIsRunning`, and the `tool_call` audit row (BR-23
// updated).
//
// Pattern is identical to `modules/curation/mcp/curation-transport.ts` and
// `modules/knowledge-graph/mcp/query-transport.ts` (Fases 2-3 of the MCP→SDK
// migration). The per-session model (`session-factory.ts`) is RETIRED in this
// revision; `tools/list` always returns all four tools, regardless of state.

import type { FastifyInstance } from "fastify";
import type { Logger } from "pino";

import type { McpServer as ToolRegistry } from "../../../mcp/server.js";
import {
  mountMcpEndpoint,
  type McpEnvelope,
  type McpHttpTool,
} from "../../../mcp/sdk-http-transport.js";

export interface IngestMcpTransportDeps {
  readonly logger: Logger;
  /** Shared in-process registry holding the `ingest` tool descriptors + handlers. */
  readonly mcp: ToolRegistry;
  /** The closed set of tool names this endpoint exposes (4 propose_* actions). */
  readonly toolNames: readonly string[];
}

/** Register `POST /mcp/ingest` inside the calling Fastify scope. */
export async function registerIngestMcpTransport(
  scope: FastifyInstance,
  deps: IngestMcpTransportDeps
): Promise<void> {
  mountMcpEndpoint(scope, {
    path: "/mcp/ingest",
    serverName: "remember-bff-ingest",
    serverVersion: "0.1.0",
    logger: deps.logger,
    getTools: () =>
      deps.toolNames
        .map((name) => deps.mcp.getTool("ingest", name))
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
