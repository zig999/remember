// Unit tests for `resolveStdioTools` — the multi-toolset projector used by
// `backend/src/mcp-stdio.ts` (TC-02 of mcp-stdio-transport).
//
// Acceptance criteria touched here (TC-02):
//   - AC4: the closed set is exactly QUERY (9) + QUERY_RETRIEVAL (4) +
//          INGEST (4) + `ingest_document` (1) = 18 tools.
//
// What we test (the WHY, per Rule 9):
//   - The resolver MUST return the registry's `McpTool` projected into the
//     `McpHttpTool` shape the shared SDK builder consumes — preserving name,
//     description, schema, and handler reference (so dispatch in tools/call
//     reaches the SAME function the HTTP transports would).
//   - The resolver MUST silently drop coordinates whose `(toolset, name)`
//     pair is not present in the registry. That is the contract that makes
//     `mcp-stdio.ts` boot-safe against a future refactor forgetting to call
//     one registrar — the missing tool isn't advertised, but the process
//     still starts.
//   - The resolver MUST allow the SAME `name` under TWO different toolsets
//     to coexist in the projection (the registry namespaces them with
//     `<toolset>.<name>` qualified keys, but the projected `McpHttpTool.name`
//     drops the toolset prefix — so both entries appear with the same `name`
//     in tools/list, which is acceptable because the only place this matters
//     is dispatch, and only one toolset registers each name in the real
//     stdio composition; this test pins the behaviour).
//   - The resolver MUST preserve coordinate order — the descriptor list the
//     SDK Server advertises follows the input order, which makes `tools/list`
//     output stable across boots (relevant for snapshot debugging).

import { describe, expect, it } from "vitest";
import pino from "pino";
import { z } from "zod";

import { buildMcpServer } from "../../mcp/server.js";
import {
  resolveStdioTools,
  type ToolCoordinate,
} from "../../mcp/stdio-tools.js";

const silentLogger = pino({ level: "silent" });

describe("resolveStdioTools", () => {
  it("projects registry entries into McpHttpTool shape", async () => {
    // GIVEN — a registry with one tool registered.
    const registry = buildMcpServer(silentLogger);
    const handler = async (input: unknown): Promise<{ ok: true; result: unknown }> => ({
      ok: true,
      result: { echoed: input },
    });
    registry.registerTool("query", {
      name: "get_node",
      description: "fetch a node by id",
      inputSchema: z.object({ node_id: z.string() }),
      handler,
    });

    // WHEN — the resolver lifts that single coordinate.
    const tools = resolveStdioTools(registry, [
      { toolset: "query", name: "get_node" },
    ]);

    // THEN — the projection matches name + description + schema + handler.
    expect(tools).toHaveLength(1);
    expect(tools[0]?.name).toBe("get_node");
    expect(tools[0]?.description).toBe("fetch a node by id");
    expect(tools[0]?.inputSchema).toBeDefined();
    // Handler reference IS the same function — dispatch reaches the original.
    expect(tools[0]?.handler).toBe(handler);
    // And the projected handler still produces the envelope.
    const envelope = await tools[0]?.handler({ node_id: "abc" });
    expect(envelope).toEqual({ ok: true, result: { echoed: { node_id: "abc" } } });
  });

  it("drops coordinates whose (toolset, name) is missing from the registry", () => {
    // GIVEN — a registry that has only `query.get_node` registered.
    const registry = buildMcpServer(silentLogger);
    registry.registerTool("query", {
      name: "get_node",
      description: "fetch a node by id",
      inputSchema: z.object({ node_id: z.string() }),
      handler: async () => ({ ok: true, result: null }),
    });

    // WHEN — we ask for three coordinates, two of which do NOT exist.
    const coordinates: readonly ToolCoordinate[] = [
      { toolset: "query", name: "get_node" }, // present
      { toolset: "query", name: "search" }, // missing
      { toolset: "ingest", name: "propose_node" }, // missing
    ];
    const tools = resolveStdioTools(registry, coordinates);

    // THEN — only the present coordinate is projected; nothing throws.
    expect(tools).toHaveLength(1);
    expect(tools[0]?.name).toBe("get_node");
  });

  it("returns an empty list when every coordinate is missing", () => {
    // GIVEN — an empty registry.
    const registry = buildMcpServer(silentLogger);

    // WHEN — we ask for two coordinates that don't exist.
    const tools = resolveStdioTools(registry, [
      { toolset: "query", name: "get_node" },
      { toolset: "ingest", name: "propose_node" },
    ]);

    // THEN — empty array, no exceptions. This is the contract that keeps
    // the stdio boot fail-soft if a future change retires every toolset.
    expect(tools).toEqual([]);
  });

  it("preserves coordinate order in the projected list", () => {
    // GIVEN — three tools registered in arbitrary order.
    const registry = buildMcpServer(silentLogger);
    registry.registerTool("query", {
      name: "list_nodes",
      description: "list all nodes",
      inputSchema: z.object({}),
      handler: async () => ({ ok: true, result: [] }),
    });
    registry.registerTool("query", {
      name: "get_node",
      description: "get a node",
      inputSchema: z.object({ node_id: z.string() }),
      handler: async () => ({ ok: true, result: null }),
    });
    registry.registerTool("ingest", {
      name: "propose_node",
      description: "propose a node",
      inputSchema: z.object({ llm_run_id: z.string() }),
      handler: async () => ({ ok: true, result: null }),
    });

    // WHEN — we lift them in a specific order.
    const tools = resolveStdioTools(registry, [
      { toolset: "ingest", name: "propose_node" },
      { toolset: "query", name: "list_nodes" },
      { toolset: "query", name: "get_node" },
    ]);

    // THEN — the projected list reflects the input order verbatim. Stable
    // tools/list output across boots makes the snapshot diffs interpretable.
    expect(tools.map((t) => t.name)).toEqual([
      "propose_node",
      "list_nodes",
      "get_node",
    ]);
  });

  it("allows the same short name under two toolsets (qualified-key isolation)", () => {
    // GIVEN — the SAME short name registered under TWO toolsets. The registry
    // namespaces them with `<toolset>.<name>` qualified keys (see
    // mcp-server.spec.ts "isolates tools across toolsets"); the projected
    // `McpHttpTool.name` drops the toolset prefix — and that is fine, because
    // in the real stdio composition no two registrars contribute the same
    // short name. This test pins the resolver behaviour against a future
    // accidental collision (both would appear in the projection).
    const registry = buildMcpServer(silentLogger);
    registry.registerTool("query", {
      name: "get_node",
      description: "query side",
      inputSchema: z.object({ node_id: z.string() }),
      handler: async () => ({ ok: true, result: "query" }),
    });
    registry.registerTool("curation", {
      name: "get_node",
      description: "curation side",
      inputSchema: z.object({ node_id: z.string() }),
      handler: async () => ({ ok: true, result: "curation" }),
    });

    const tools = resolveStdioTools(registry, [
      { toolset: "query", name: "get_node" },
      { toolset: "curation", name: "get_node" },
    ]);

    expect(tools).toHaveLength(2);
    // Both entries surface with the same short `name` — descriptions tell
    // them apart.
    expect(tools[0]?.description).toBe("query side");
    expect(tools[1]?.description).toBe("curation side");
  });
});
