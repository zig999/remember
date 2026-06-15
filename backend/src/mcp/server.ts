// MCP server core — the in-process tool registry the HTTP/JSON-RPC transports
// dispatch through.
//
// Topology (CLAUDE.md "Architecture / Backend"; v7 §2, §14, A28). The BFF
// exposes its single service/validation layer over two transports: REST (for
// the SPA) and MCP (for the LLM). Three MCP transports coexist in this one
// process — each a Fastify route over a disjoint, closed tool whitelist:
//   - POST /api/v1/mcp           `ingest`   — MCP-only, requires X-LLM-Run-Id.
//                                              Tools live on a per-session
//                                              registry (ingestion/mcp/
//                                              session-factory.ts), NOT here.
//   - POST /api/v1/mcp/query     `query`    — dual MCP+REST, read-only
//                                              (9 knowledge-graph + 4
//                                              query-retrieval tools).
//   - POST /api/v1/mcp/curation  `curation` — dual MCP+REST, audited writes
//                                              (7 curation + compliance_delete).
// This module is the registry the `query` and `curation` toolsets bind to at
// boot; `ingest` uses its own per-session instance (see above).
//
// Envelope (CLAUDE.md "Architecture / Backend"):
//   success -> { ok: true,  result: <payload> }
//   failure -> { ok: false, error: { code, message, details? } }

import type { Logger } from "pino";
import type { ZodTypeAny } from "zod";

/**
 * Logical groups exposed by the MCP transport. Tightly scoped — the LLM
 * cannot register new toolset names ad-hoc; only these three exist and the
 * MCP protocol surfaces them by name (§14 of v7).
 */
export type ToolsetName = "ingest" | "query" | "curation";

/**
 * A single MCP tool. Toolset modules build instances of this and call
 * `mcpServer.registerTool(...)` at boot.
 *
 * - `name`: stable identifier the LLM uses to invoke the tool.
 * - `description`: short, single-line human-readable summary (surfaced to the
 *    LLM by the MCP protocol).
 * - `inputSchema`: Zod schema that validates the tool input before the
 *    handler runs. Failed parse -> STRUCTURAL_INVALID envelope.
 * - `handler`: pure function (or service-backed function) that returns the
 *    raw result payload. Throwing escapes through the dispatcher and gets
 *    wrapped in the MCP error envelope.
 */
export interface McpTool<I = unknown, O = unknown> {
  readonly name: string;
  readonly description: string;
  readonly inputSchema: ZodTypeAny;
  readonly handler: (input: I) => Promise<O>;
}

/**
 * The MCP server core: an in-process tool registry plus the lookup surface a
 * transport dispatches through. Instantiated twice in this codebase — once as
 * the process-wide singleton shared by the `query` and `curation` transports,
 * and once per LLM session for the `ingest` toolset (ingestion/mcp/
 * session-factory.ts), whose tools close over the ambient llm_run_id.
 *
 * Each transport advertises a static descriptor list and resolves the live
 * handler from this registry at dispatch time (registration may run after the
 * route is mounted — see app.ts).
 */
export class McpServer {
  private readonly tools = new Map<string, McpTool>();
  private readonly logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger.child({ component: "mcp" });
  }

  /**
   * Register a tool under a specific toolset. The fully-qualified tool name
   * the LLM sees is `<toolset>.<tool.name>` — this prevents tool-name
   * collisions across toolsets owned by independent domain modules.
   *
   * Re-registering the same key throws — toolset modules must not boot twice
   * in a single process, and a duplicate is almost always a copy-paste bug.
   */
  public registerTool<I, O>(toolset: ToolsetName, tool: McpTool<I, O>): void {
    const key = qualifiedKey(toolset, tool.name);
    if (this.tools.has(key)) {
      throw new Error(`MCP tool already registered: ${key}`);
    }
    this.tools.set(key, tool as McpTool);
    this.logger.info({ toolset, tool: tool.name }, "mcp_tool_registered");
  }

  /** Return a snapshot of registered keys — used by tests and `/mcp/tools` */
  public listTools(): string[] {
    return Array.from(this.tools.keys()).sort();
  }

  /**
   * Look up a tool by fully-qualified key. Returns `undefined` for unknown
   * keys; the transport layer turns that into a `NOT_FOUND` envelope.
   */
  public getTool(toolset: ToolsetName, name: string): McpTool | undefined {
    return this.tools.get(qualifiedKey(toolset, name));
  }
}

function qualifiedKey(toolset: ToolsetName, name: string): string {
  return `${toolset}.${name}`;
}

/**
 * Build the singleton MCP server bound to the project logger. The bootstrap
 * keeps the reference and passes it to each domain module's `registerToolsets`
 * function as those are wired up.
 */
export function buildMcpServer(logger: Logger): McpServer {
  return new McpServer(logger);
}
