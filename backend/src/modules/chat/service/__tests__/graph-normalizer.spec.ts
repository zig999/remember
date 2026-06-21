// Unit tests for `service/graph-normalizer.ts` (TC-be-001).
//
// Coverage map (against the TC's AC):
//   AC-B.1 traverse with N nodes / M links produces matching delta.
//   AC-B.2 get_node -> 1 node, 0 links; list_nodes -> N nodes, 0 links.
//   AC-B.3 search with mixed-kind items hydrates only `kind=node`.
//   AC-B.4 non-graph tools (catalog/history/provenance) return `null`.
//
// Additional defensive cases:
//   - is_temporal lookup hits the catalog (true/false branches + fallback).
//   - Malformed entries are silently dropped (defensive guards).
//   - search hydration is a SINGLE call to findNodesByIds (no N+1).
//   - search preserves item order and dedupes repeated ids.
//   - dispatcher rejects "search" when called without a client.

import { describe, expect, it, vi } from "vitest";

import {
  buildSnapshot,
  type CatalogSnapshot,
  type LinkTypeRow,
} from "../../../knowledge-graph/catalog/catalog.js";

// Mock the repository before importing the normalizer. The normalizer pulls
// `findNodesByIds` from this module, so the mock takes effect at the FIRST
// load of the module under test.
vi.mock("../../../knowledge-graph/repository/graph.repository.js", () => ({
  findNodesByIds: vi.fn(),
}));

import { findNodesByIds } from "../../../knowledge-graph/repository/graph.repository.js";
import {
  normalizeGetNode,
  normalizeListNodes,
  normalizeSearch,
  normalizeToolResult,
  normalizeTraverse,
  type GraphDeltaWire,
  type GraphNodeWire,
} from "../graph-normalizer.js";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/** Build a tiny CatalogSnapshot with two LinkTypes (one temporal, one stable). */
function buildTestCatalog(): CatalogSnapshot {
  const reportsTo: LinkTypeRow = {
    id: "lt-reports-to",
    name: "reports_to",
    label: "reports to",
    description: "Employment hierarchy",
    inverse_name: "managed_by",
    is_temporal: true,
    allows_multiple_current: false,
    requires_valid_from: true,
    requires_valid_to_on_change: true,
    version: 1,
  };
  const partOf: LinkTypeRow = {
    id: "lt-part-of",
    name: "part_of",
    label: "part of",
    description: "Structural containment",
    inverse_name: "contains",
    is_temporal: false,
    allows_multiple_current: false,
    requires_valid_from: false,
    requires_valid_to_on_change: false,
    version: 1,
  };
  return buildSnapshot({
    nodeTypes: [],
    linkTypes: [reportsTo, partOf],
    linkTypeRules: [],
    attributeKeys: [],
  });
}

/** Build a NodeSummary-shaped record (the shape `traverse`/`list_nodes` emit). */
function nodeSummary(
  id: string,
  node_type: string,
  canonical_name: string,
  status: GraphNodeWire["status"] = "active"
): Record<string, unknown> {
  return {
    id,
    node_type,
    canonical_name,
    status,
    merged_into_node_id: null,
  };
}

/** Build a TraversalLink-shaped record (LinkDetail + hop + score). */
function traversalLink(args: {
  id: string;
  source: string;
  target: string;
  link_type: string;
  status?: string;
  flags?: readonly string[];
  is_in_effect?: boolean;
}): Record<string, unknown> {
  return {
    id: args.id,
    source_node_id: args.source,
    target_node_id: args.target,
    link_type: args.link_type,
    link_inverse_name: `inv_${args.link_type}`,
    recorded_at: "2026-06-21T12:00:00.000Z",
    status: args.status ?? "active",
    effective_status: "active",
    is_current: true,
    is_in_effect: args.is_in_effect ?? true,
    confidence: 0.9,
    flags: args.flags ?? [],
    provenance: [],
    hop: 1,
    score: 0.85,
  };
}

// ---------------------------------------------------------------------------
// normalizeTraverse — AC-B.1 (+ is_temporal + flags branches)
// ---------------------------------------------------------------------------

describe("normalizeTraverse", () => {
  it("AC-B.1: produces delta with N nodes and M links matching the input", () => {
    const catalog = buildTestCatalog();
    const result = {
      starting_node_id: "n-1",
      nodes: [
        nodeSummary("n-1", "person", "Anna"),
        nodeSummary("n-2", "organization", "Acme"),
        nodeSummary("n-3", "person", "Carla"),
      ],
      links: [
        traversalLink({
          id: "l-1",
          source: "n-1",
          target: "n-2",
          link_type: "reports_to",
        }),
        traversalLink({
          id: "l-2",
          source: "n-3",
          target: "n-2",
          link_type: "part_of",
        }),
      ],
    };

    const delta = normalizeTraverse(result, catalog);

    expect(delta.source_tool).toBe("traverse");
    expect(delta.nodes).toHaveLength(3);
    expect(delta.links).toHaveLength(2);
    expect(delta.nodes[0]).toEqual({
      id: "n-1",
      node_type: "person",
      canonical_name: "Anna",
      status: "active",
    });
  });

  it("resolves is_temporal from the catalog: temporal LinkType -> true", () => {
    const catalog = buildTestCatalog();
    const delta = normalizeTraverse(
      {
        nodes: [nodeSummary("n-1", "person", "Anna"), nodeSummary("n-2", "organization", "Acme")],
        links: [
          traversalLink({ id: "l-1", source: "n-1", target: "n-2", link_type: "reports_to" }),
        ],
      },
      catalog
    );
    expect(delta.links[0]?.is_temporal).toBe(true);
  });

  it("resolves is_temporal from the catalog: stable LinkType -> false", () => {
    const catalog = buildTestCatalog();
    const delta = normalizeTraverse(
      {
        nodes: [nodeSummary("n-1", "person", "Anna"), nodeSummary("n-2", "organization", "Acme")],
        links: [
          traversalLink({ id: "l-1", source: "n-1", target: "n-2", link_type: "part_of" }),
        ],
      },
      catalog
    );
    expect(delta.links[0]?.is_temporal).toBe(false);
  });

  it("falls back to is_temporal=false when link_type is missing from the catalog", () => {
    // assumptions_allowed[2] of the TC explicitly permits this fallback.
    const catalog = buildTestCatalog();
    const delta = normalizeTraverse(
      {
        nodes: [nodeSummary("n-1", "person", "Anna"), nodeSummary("n-2", "organization", "Acme")],
        links: [
          traversalLink({ id: "l-1", source: "n-1", target: "n-2", link_type: "totally_unknown" }),
        ],
      },
      catalog
    );
    expect(delta.links[0]?.is_temporal).toBe(false);
  });

  it("passes through optional link fields (status, flags, is_in_effect)", () => {
    const catalog = buildTestCatalog();
    const delta = normalizeTraverse(
      {
        nodes: [nodeSummary("n-1", "person", "Anna"), nodeSummary("n-2", "organization", "Acme")],
        links: [
          traversalLink({
            id: "l-1",
            source: "n-1",
            target: "n-2",
            link_type: "reports_to",
            status: "uncertain",
            flags: ["uncertain"],
            is_in_effect: false,
          }),
        ],
      },
      catalog
    );
    expect(delta.links[0]).toMatchObject({
      status: "uncertain",
      flags: ["uncertain"],
      is_in_effect: false,
    });
  });

  it("returns an empty delta when result is not an object", () => {
    const catalog = buildTestCatalog();
    expect(normalizeTraverse(null, catalog)).toEqual({
      source_tool: "traverse",
      nodes: [],
      links: [],
    });
    expect(normalizeTraverse("oops", catalog)).toEqual({
      source_tool: "traverse",
      nodes: [],
      links: [],
    });
  });

  it("silently drops malformed nodes / links instead of crashing", () => {
    const catalog = buildTestCatalog();
    const delta = normalizeTraverse(
      {
        nodes: [
          nodeSummary("n-1", "person", "Anna"),
          { id: "n-bad", node_type: 42, canonical_name: "Bad", status: "active" }, // mistyped
          nodeSummary("n-2", "organization", "Acme"),
        ],
        links: [
          traversalLink({ id: "l-1", source: "n-1", target: "n-2", link_type: "reports_to" }),
          { id: "l-bad" /* missing endpoints */ },
        ],
      },
      catalog
    );
    expect(delta.nodes.map((n) => n.id)).toEqual(["n-1", "n-2"]);
    expect(delta.links.map((l) => l.id)).toEqual(["l-1"]);
  });
});

// ---------------------------------------------------------------------------
// normalizeGetNode — AC-B.2 (1 node, 0 links)
// ---------------------------------------------------------------------------

describe("normalizeGetNode", () => {
  it("AC-B.2: produces 1 node and 0 links", () => {
    const result = {
      node: nodeSummary("n-1", "person", "Anna"),
      aliases: [{ id: "a-1", alias: "Annie", kind: "alias" }],
      attributes: [{ id: "att-1", key: "role", value: "CEO" }],
    };
    const delta = normalizeGetNode(result);
    expect(delta.source_tool).toBe("get_node");
    expect(delta.nodes).toHaveLength(1);
    expect(delta.links).toEqual([]);
    expect(delta.nodes[0]).toEqual({
      id: "n-1",
      node_type: "person",
      canonical_name: "Anna",
      status: "active",
    });
  });

  it("returns 0 nodes when `node` is missing or malformed", () => {
    expect(normalizeGetNode({}).nodes).toEqual([]);
    expect(normalizeGetNode({ node: null }).nodes).toEqual([]);
    expect(normalizeGetNode({ node: { id: 1 } }).nodes).toEqual([]);
  });

  it("returns an empty delta when result is not an object", () => {
    expect(normalizeGetNode(undefined)).toEqual({
      source_tool: "get_node",
      nodes: [],
      links: [],
    });
  });
});

// ---------------------------------------------------------------------------
// normalizeListNodes — AC-B.2 (N nodes, 0 links)
// ---------------------------------------------------------------------------

describe("normalizeListNodes", () => {
  it("AC-B.2: produces N nodes and 0 links from items[]", () => {
    const result = {
      total: 3,
      limit: 20,
      offset: 0,
      items: [
        nodeSummary("n-1", "person", "Anna"),
        nodeSummary("n-2", "person", "Bruno"),
        nodeSummary("n-3", "person", "Carla", "needs_review"),
      ],
    };
    const delta = normalizeListNodes(result);
    expect(delta.source_tool).toBe("list_nodes");
    expect(delta.links).toEqual([]);
    expect(delta.nodes.map((n) => n.id)).toEqual(["n-1", "n-2", "n-3"]);
    expect(delta.nodes[2]?.status).toBe("needs_review");
  });

  it("returns an empty delta when items[] is empty", () => {
    expect(normalizeListNodes({ items: [] })).toEqual({
      source_tool: "list_nodes",
      nodes: [],
      links: [],
    });
  });

  it("returns an empty delta when result is malformed", () => {
    expect(normalizeListNodes(null)).toEqual({
      source_tool: "list_nodes",
      nodes: [],
      links: [],
    });
    expect(normalizeListNodes({ items: "not-an-array" })).toEqual({
      source_tool: "list_nodes",
      nodes: [],
      links: [],
    });
  });
});

// ---------------------------------------------------------------------------
// normalizeSearch — AC-B.3 (hydrate kind=node items, drop fragment/link)
// ---------------------------------------------------------------------------

describe("normalizeSearch", () => {
  // A bare stand-in for PoolClient — `findNodesByIds` is mocked, so the
  // client object is never actually used (only its identity matters).
  const fakeClient = {} as never;

  it("AC-B.3: hydrates kind=node items into nodes; fragment/link items excluded", async () => {
    const catalog = buildTestCatalog();
    vi.mocked(findNodesByIds).mockResolvedValueOnce([
      {
        id: "n-1",
        node_type_id: "nt-person",
        node_type: "person",
        canonical_name: "Anna",
        status: "active",
        merged_into_node_id: null,
        created_at: new Date("2026-06-01T00:00:00.000Z"),
        updated_at: new Date("2026-06-01T00:00:00.000Z"),
      },
      {
        id: "n-2",
        node_type_id: "nt-org",
        node_type: "organization",
        canonical_name: "Acme",
        status: "active",
        merged_into_node_id: null,
        created_at: new Date("2026-06-01T00:00:00.000Z"),
        updated_at: new Date("2026-06-01T00:00:00.000Z"),
      },
    ]);

    const result = {
      query: "Anna",
      total: 4,
      limit: 20,
      offset: 0,
      items: [
        { kind: "node", layer: "node", id: "n-1", score: 0.9, hop: 0, summary: "Anna", flags: [] },
        { kind: "fragment", layer: "fragment", id: "f-1", score: 0.6, hop: 0, summary: "…", flags: [] },
        { kind: "node", layer: "node", id: "n-2", score: 0.7, hop: 1, summary: "Acme", flags: [] },
        { kind: "link", layer: "node", id: "l-1", score: 0.5, hop: 0, summary: "Anna -> Acme", flags: [] },
      ],
    };

    const delta = await normalizeSearch(result, fakeClient, catalog);

    expect(delta.source_tool).toBe("search");
    expect(delta.links).toEqual([]);
    expect(delta.nodes.map((n) => n.id)).toEqual(["n-1", "n-2"]);
    // Hydrated payload carries node_type + canonical_name (the search items
    // themselves do NOT carry these — proof of hydration).
    expect(delta.nodes[0]).toEqual({
      id: "n-1",
      node_type: "person",
      canonical_name: "Anna",
      status: "active",
    });
    expect(findNodesByIds).toHaveBeenCalledTimes(1);
    expect(findNodesByIds).toHaveBeenCalledWith(fakeClient, ["n-1", "n-2"]);
  });

  it("issues NO SQL when there are zero kind=node items (defensive)", async () => {
    const catalog = buildTestCatalog();
    const result = {
      items: [
        { kind: "fragment", layer: "fragment", id: "f-1", score: 0.6, hop: 0, summary: "…", flags: [] },
        { kind: "link", layer: "node", id: "l-1", score: 0.5, hop: 0, summary: "x", flags: [] },
      ],
    };
    const delta = await normalizeSearch(result, fakeClient, catalog);
    expect(delta).toEqual({ source_tool: "search", nodes: [], links: [] });
    expect(findNodesByIds).not.toHaveBeenCalled();
  });

  it("preserves search item order and dedupes repeated node ids", async () => {
    const catalog = buildTestCatalog();
    vi.mocked(findNodesByIds).mockResolvedValueOnce([
      // Returned in arbitrary order — the normalizer must re-sort.
      {
        id: "n-2",
        node_type_id: "nt-org",
        node_type: "organization",
        canonical_name: "Acme",
        status: "active",
        merged_into_node_id: null,
        created_at: new Date("2026-06-01T00:00:00.000Z"),
        updated_at: new Date("2026-06-01T00:00:00.000Z"),
      },
      {
        id: "n-1",
        node_type_id: "nt-person",
        node_type: "person",
        canonical_name: "Anna",
        status: "active",
        merged_into_node_id: null,
        created_at: new Date("2026-06-01T00:00:00.000Z"),
        updated_at: new Date("2026-06-01T00:00:00.000Z"),
      },
    ]);

    const result = {
      items: [
        { kind: "node", layer: "node", id: "n-1", score: 0.9, hop: 0, summary: "Anna", flags: [] },
        { kind: "node", layer: "node", id: "n-2", score: 0.7, hop: 0, summary: "Acme", flags: [] },
        // Duplicate id — must be deduped to a SINGLE call argument.
        { kind: "node", layer: "node", id: "n-1", score: 0.9, hop: 1, summary: "Anna", flags: [] },
      ],
    };

    const delta = await normalizeSearch(result, fakeClient, catalog);

    expect(delta.nodes.map((n) => n.id)).toEqual(["n-1", "n-2"]);
    expect(findNodesByIds).toHaveBeenCalledWith(fakeClient, ["n-1", "n-2"]);
    expect(findNodesByIds).toHaveBeenCalledTimes(1);
  });

  it("drops nodes that disappeared between search and hydration (race)", async () => {
    const catalog = buildTestCatalog();
    // hydration returns only n-2 — n-1 was deleted between calls.
    vi.mocked(findNodesByIds).mockResolvedValueOnce([
      {
        id: "n-2",
        node_type_id: "nt-org",
        node_type: "organization",
        canonical_name: "Acme",
        status: "active",
        merged_into_node_id: null,
        created_at: new Date("2026-06-01T00:00:00.000Z"),
        updated_at: new Date("2026-06-01T00:00:00.000Z"),
      },
    ]);

    const result = {
      items: [
        { kind: "node", layer: "node", id: "n-1", score: 0.9, hop: 0, summary: "Anna", flags: [] },
        { kind: "node", layer: "node", id: "n-2", score: 0.7, hop: 0, summary: "Acme", flags: [] },
      ],
    };

    const delta = await normalizeSearch(result, fakeClient, catalog);
    expect(delta.nodes.map((n) => n.id)).toEqual(["n-2"]);
  });

  it("returns an empty delta when result is malformed", async () => {
    const catalog = buildTestCatalog();
    const delta = await normalizeSearch(null, fakeClient, catalog);
    expect(delta).toEqual({ source_tool: "search", nodes: [], links: [] });
    expect(findNodesByIds).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// normalizeToolResult (dispatcher) — AC-B.4 + routing
// ---------------------------------------------------------------------------

describe("normalizeToolResult (dispatcher)", () => {
  const fakeClient = {} as never;

  it("AC-B.4: non-graph tools (catalog/history/provenance) return null", async () => {
    const catalog = buildTestCatalog();
    const nonGraphTools = [
      "list_node_types",
      "list_link_types",
      "list_attribute_keys",
      "get_history_link",
      "get_history_attribute",
      "get_history_attribute_key",
      "get_provenance_link",
      "get_provenance_attribute",
      "get_provenance_fragment",
    ];
    for (const tool of nonGraphTools) {
      const out = await normalizeToolResult(tool, { foo: "bar" }, catalog, fakeClient);
      expect(out, `tool=${tool}`).toBeNull();
    }
  });

  it("returns null for an UNKNOWN tool name (defensive — never crash)", async () => {
    const catalog = buildTestCatalog();
    expect(await normalizeToolResult("not_a_tool", {}, catalog)).toBeNull();
  });

  it("routes `traverse` to normalizeTraverse (no client needed)", async () => {
    const catalog = buildTestCatalog();
    const result = {
      nodes: [nodeSummary("n-1", "person", "Anna")],
      links: [],
    };
    const out = (await normalizeToolResult("traverse", result, catalog)) as GraphDeltaWire;
    expect(out.source_tool).toBe("traverse");
    expect(out.nodes).toHaveLength(1);
  });

  it("routes `get_node` to normalizeGetNode (no client needed)", async () => {
    const catalog = buildTestCatalog();
    const result = { node: nodeSummary("n-1", "person", "Anna") };
    const out = (await normalizeToolResult("get_node", result, catalog)) as GraphDeltaWire;
    expect(out.source_tool).toBe("get_node");
    expect(out.nodes).toHaveLength(1);
  });

  it("routes `list_nodes` to normalizeListNodes (no client needed)", async () => {
    const catalog = buildTestCatalog();
    const result = { items: [nodeSummary("n-1", "person", "Anna")] };
    const out = (await normalizeToolResult("list_nodes", result, catalog)) as GraphDeltaWire;
    expect(out.source_tool).toBe("list_nodes");
    expect(out.nodes).toHaveLength(1);
  });

  it("routes `search` to normalizeSearch, requires a client", async () => {
    const catalog = buildTestCatalog();
    vi.mocked(findNodesByIds).mockResolvedValueOnce([
      {
        id: "n-1",
        node_type_id: "nt-person",
        node_type: "person",
        canonical_name: "Anna",
        status: "active",
        merged_into_node_id: null,
        created_at: new Date("2026-06-01T00:00:00.000Z"),
        updated_at: new Date("2026-06-01T00:00:00.000Z"),
      },
    ]);
    const result = {
      items: [{ kind: "node", layer: "node", id: "n-1", score: 0.9, hop: 0, summary: "x", flags: [] }],
    };
    const out = (await normalizeToolResult(
      "search",
      result,
      catalog,
      fakeClient
    )) as GraphDeltaWire;
    expect(out.source_tool).toBe("search");
    expect(out.nodes).toHaveLength(1);
  });

  it("rejects when `search` is dispatched without a client (programmer error)", async () => {
    const catalog = buildTestCatalog();
    await expect(
      normalizeToolResult("search", { items: [] }, catalog)
    ).rejects.toThrow(/search requires a PoolClient/);
  });
});
