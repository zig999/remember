// Tool-resolution helper for the stdio entry point.
//
// The HTTP transports each carry their own per-toolset resolver inline (see
// `modules/{ingestion,knowledge-graph,curation}/mcp/*transport.ts`) because
// each Fastify route exposes ONE toolset. The stdio entry point, by contrast,
// exposes THREE toolsets on a single transport (query KG + query-retrieval +
// ingest), so the resolver has to project across multiple toolset keys.
//
// Keeping this in its own module — instead of inlining it in
// `backend/src/mcp-stdio.ts` — has one practical benefit: the entry-point file
// runs `void main()` at import time, so unit tests cannot import from it
// without also triggering the boot sequence (which would fail env validation
// in the test process). Extracting the pure helper here lets tests exercise
// the shape lift in isolation.

import type {
  McpEnvelope,
  McpHttpTool,
} from "./sdk-http-transport.js";
import type { McpServer, ToolsetName } from "./server.js";

/** One (toolset, tool-name) coordinate the stdio bootstrap wants to expose. */
export interface ToolCoordinate {
  readonly toolset: ToolsetName;
  readonly name: string;
}

/**
 * Resolve a list of (toolset, name) coordinates against the in-process MCP
 * registry, lifting each found `McpTool` into the `McpHttpTool` shape the
 * shared SDK builder consumes (`buildConfiguredMcpServer`).
 *
 * Behaviour:
 *  - Coordinates whose `(toolset, name)` pair is not present in the registry
 *    are silently dropped from the returned list. Stdio boot pre-registers
 *    every toolset before calling this resolver, so a missing entry would
 *    indicate a future refactor forgot to call a registrar — the missing tool
 *    simply won't be advertised; nothing throws.
 *  - The handler is widened from the registry's generic `unknown -> Promise<unknown>`
 *    to the `McpHttpTool` contract (`unknown -> Promise<McpEnvelope>`); the
 *    toolset handlers already return envelopes, so the cast is a no-op at
 *    runtime (same pattern as the HTTP transports).
 */
export function resolveStdioTools(
  registry: McpServer,
  coordinates: readonly ToolCoordinate[]
): McpHttpTool[] {
  return coordinates
    .map((c) => registry.getTool(c.toolset, c.name))
    .filter((t): t is NonNullable<typeof t> => t !== undefined)
    .map(
      (t): McpHttpTool => ({
        name: t.name,
        description: t.description,
        inputSchema: t.inputSchema,
        handler: t.handler as (input: unknown) => Promise<McpEnvelope>,
      })
    );
}
