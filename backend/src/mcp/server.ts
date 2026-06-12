// MCP server skeleton.
//
// TC-01 scope: the skeleton itself — toolset registry, typed tool descriptor,
// and the dispatch surface. Real toolsets (`ingest`, `query`, `curation`)
// are added by future TCs; this module exposes the surface they will plug
// into.
//
// CLAUDE.md "Architecture / Backend": MCP is the second transport of the BFF
// (the first is REST). Both share the same service layer. The `ingest`
// toolset is MCP-only; `query` / `curation` are mirrored in REST.
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
 * The MCP server itself. Holds the registry and exposes a `dispatch` entry
 * point that the transport layer (stdio / websocket / future) will call.
 *
 * Transport binding is intentionally out of scope of TC-01 — we only build
 * the in-process registry. A subsequent TC will wire the actual MCP protocol
 * layer (e.g. `@modelcontextprotocol/sdk`) on top of this surface.
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
