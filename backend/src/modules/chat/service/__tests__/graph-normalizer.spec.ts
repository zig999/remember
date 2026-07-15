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
  normalizeIngestDirected,
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

  it("projects link_type_label from the catalog when the slug is known", () => {
    // openapi.yaml v2.4.0 (GraphLinkWire.link_type_label): single source of
    // truth is the catalog row's `label`. The SPA renders it instead of
    // humanizing the slug client-side.
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
    expect(delta.links[0]?.link_type_label).toBe("reports to");
  });

  it("OMITS link_type_label when the slug is missing from the catalog snapshot", () => {
    // openapi.yaml v2.4.0: open-ontology fallback — the SPA humanizes the
    // slug client-side. We must NOT emit a label fabricated from the slug.
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
    const link = delta.links[0];
    expect(link).toBeDefined();
    expect(link && "link_type_label" in link).toBe(false);
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
// normalizeIngestDirected — TC-03 (BR-41 v2.11) — fifth graph-producing tool
// ---------------------------------------------------------------------------
//
// Coverage against the TC-03 acceptance / validation criteria:
//   AC-1 GRAPH_TOOL_NAMES admits ingest_directed (verified via dispatcher).
//   AC-2 normalizeIngestDirected exported and callable with (unknown, CatalogSnapshot).
//   AC-3 Dispatcher returns non-null delta on a valid envelope.
//   AC-4 Empty envelope (no affected_nodes, no accepted link entries) still
//        emits an empty non-null delta.
//   plus: node projection with status: "active" forced; accepted-family
//   filter (rejected/error/dependency_failed dropped); node_ref -> id map
//   built from accepted node entries only; compound ref parsing (FIRST/LAST
//   '->'); catalog fallback (is_temporal=false, link_type_label OMITTED);
//   is_in_effect / status / flags OMITTED on the directed path; unresolved
//   endpoints dropped silently; malformed envelope returns null (not empty).

describe("normalizeIngestDirected (BR-41 v2.11 — fifth arm)", () => {
  /** Build an `AffectedNode`-shaped record. */
  function affected(
    id: string,
    node_type: string,
    canonical_name: string
  ): Record<string, unknown> {
    return { id, canonical_name, node_type };
  }

  /** Build a `DirectedItemReport` node entry. */
  function nodeReport(
    ref: string,
    node_id: string | undefined,
    status: string
  ): Record<string, unknown> {
    return {
      ref,
      kind: "node",
      status,
      ...(node_id !== undefined ? { node_id } : {}),
    };
  }

  /** Build a `DirectedItemReport` link entry with the compound `ref`. */
  function linkReport(
    source_ref: string,
    link_type: string,
    target_ref: string,
    link_id: string | undefined,
    status: string
  ): Record<string, unknown> {
    return {
      ref: `${source_ref}->${link_type}->${target_ref}`,
      kind: "link",
      status,
      ...(link_id !== undefined ? { link_id } : {}),
    };
  }

  it("AC-2/3: projects run.affected_nodes as nodes with status forced to 'active'", () => {
    const catalog = buildTestCatalog();
    const result = {
      outcome: "ingested",
      run: {
        affected_nodes: [
          affected("n-1", "person", "João"),
          affected("n-2", "organization", "Rede Unifique"),
        ],
      },
      report: [],
    };

    const delta = normalizeIngestDirected(result, catalog);

    // AC-2: return a non-null delta with the ingest_directed source_tool.
    expect(delta).not.toBeNull();
    expect(delta?.source_tool).toBe("ingest_directed");
    // Status is FORCED to "active" — directed items are stated-by-construction
    // (BR-43 v2.8: confidence=1.0, valid_from_basis="stated"), so they cannot
    // land in needs_review/merged/deleted on creation. Testing intent: if the
    // spec ever relaxes this constraint the assertion must fail loud.
    expect(delta?.nodes).toEqual([
      { id: "n-1", node_type: "person", canonical_name: "João", status: "active" },
      {
        id: "n-2",
        node_type: "organization",
        canonical_name: "Rede Unifique",
        status: "active",
      },
    ]);
    expect(delta?.links).toEqual([]);
  });

  it("emits an accepted link with endpoints resolved via the node ref->id map", () => {
    const catalog = buildTestCatalog();
    const result = {
      run: {
        affected_nodes: [
          affected("n-joao", "person", "João"),
          affected("n-unifique", "organization", "Rede Unifique"),
        ],
      },
      report: [
        nodeReport("joao", "n-joao", "accepted"),
        nodeReport("unifique", "n-unifique", "consolidated"),
        linkReport("joao", "reports_to", "unifique", "l-1", "accepted"),
      ],
    };

    const delta = normalizeIngestDirected(result, catalog);

    expect(delta?.links).toHaveLength(1);
    expect(delta?.links[0]).toEqual({
      id: "l-1",
      source_node_id: "n-joao",
      target_node_id: "n-unifique",
      link_type: "reports_to",
      link_type_label: "reports to",
      is_temporal: true,
      // NOTE: is_in_effect, status, flags are DELIBERATELY absent (BR-41 v2.11
      // omission list on the directed path).
    });
  });

  it("OMITS is_in_effect, status (assertion_status), and flags on the directed path", () => {
    // Locks the BR-41 v2.11 omission contract: view-derived fields are NOT
    // present on the freshly persisted link. A follow-up `traverse` surfaces
    // them if needed. Regressing this would leak stale/undefined fields to
    // the SPA.
    const catalog = buildTestCatalog();
    const result = {
      run: { affected_nodes: [affected("n-a", "person", "A"), affected("n-b", "organization", "B")] },
      report: [
        nodeReport("a", "n-a", "accepted"),
        nodeReport("b", "n-b", "accepted"),
        linkReport("a", "reports_to", "b", "l-1", "accepted"),
      ],
    };
    const delta = normalizeIngestDirected(result, catalog);
    const link = delta?.links[0];
    expect(link).toBeDefined();
    expect(link && "is_in_effect" in link).toBe(false);
    expect(link && "status" in link).toBe(false);
    expect(link && "flags" in link).toBe(false);
  });

  it("keeps every accepted-family status: accepted, consolidated, superseded_previous, needs_review, uncertain, disputed", () => {
    const catalog = buildTestCatalog();
    const acceptedStatuses = [
      "accepted",
      "consolidated",
      "superseded_previous",
      "needs_review",
      "uncertain",
      "disputed",
    ];
    const result = {
      run: {
        affected_nodes: [
          affected("n-a", "person", "A"),
          affected("n-b", "organization", "B"),
        ],
      },
      report: [
        nodeReport("a", "n-a", "accepted"),
        nodeReport("b", "n-b", "accepted"),
        ...acceptedStatuses.map((s, i) =>
          linkReport("a", "part_of", "b", `l-${i}`, s)
        ),
      ],
    };
    const delta = normalizeIngestDirected(result, catalog);
    expect(delta?.links.map((l) => l.id)).toEqual(
      acceptedStatuses.map((_, i) => `l-${i}`)
    );
  });

  it("DROPS rejected / error / dependency_failed link entries", () => {
    // Intent: the graph shows ONLY what was persisted. Dropped families
    // surface to the Owner via the text channel (report[i].status), never
    // in the graph delta. Regressing this would leak non-persistent links.
    const catalog = buildTestCatalog();
    const droppedStatuses = ["rejected", "error", "dependency_failed"];
    const result = {
      run: {
        affected_nodes: [
          affected("n-a", "person", "A"),
          affected("n-b", "organization", "B"),
        ],
      },
      report: [
        nodeReport("a", "n-a", "accepted"),
        nodeReport("b", "n-b", "accepted"),
        // 1 accepted (kept), then 3 dropped.
        linkReport("a", "reports_to", "b", "l-ok", "accepted"),
        ...droppedStatuses.map((s, i) =>
          linkReport("a", "reports_to", "b", `l-drop-${i}`, s)
        ),
      ],
    };
    const delta = normalizeIngestDirected(result, catalog);
    expect(delta?.links.map((l) => l.id)).toEqual(["l-ok"]);
  });

  it("DROPS node entries with non-accepted status from the ref->id map (so their links unresolve)", () => {
    // Intent: a link whose source_ref points to a REJECTED node entry must
    // NOT resolve via the map — otherwise we'd emit an edge to a node the
    // graph does not carry. Regressing this could dangle links.
    const catalog = buildTestCatalog();
    const result = {
      run: { affected_nodes: [affected("n-b", "organization", "B")] },
      report: [
        // "a" was rejected — must NOT enter the map.
        nodeReport("a", "n-a-would-be", "rejected"),
        nodeReport("b", "n-b", "accepted"),
        // Link references "a" as source — source unresolved -> drop.
        linkReport("a", "reports_to", "b", "l-orphan", "accepted"),
      ],
    };
    const delta = normalizeIngestDirected(result, catalog);
    expect(delta?.links).toEqual([]);
    // The node projection still surfaces "b" from affected_nodes.
    expect(delta?.nodes.map((n) => n.id)).toEqual(["n-b"]);
  });

  it("SILENTLY drops links whose source_ref or target_ref is absent from the node map (WARN-and-skip, no throw)", () => {
    // Constraint 6 of the TC. Regression would either (a) crash the SSE
    // stream via a thrown error, or (b) emit a dangling edge — both bad.
    const catalog = buildTestCatalog();
    const result = {
      run: { affected_nodes: [affected("n-a", "person", "A")] },
      report: [
        nodeReport("a", "n-a", "accepted"),
        // target_ref "b" was NEVER an accepted node in the run.
        linkReport("a", "reports_to", "b", "l-orphan", "accepted"),
      ],
    };
    // Must not throw:
    expect(() => normalizeIngestDirected(result, catalog)).not.toThrow();
    const delta = normalizeIngestDirected(result, catalog);
    expect(delta?.links).toEqual([]);
    expect(delta?.nodes.map((n) => n.id)).toEqual(["n-a"]);
  });

  it("parses the compound ref via FIRST '->' and LAST '->' (survives link_type slugs that contain '->')", () => {
    // Defensive: if a future link_type slug ever contained "->", a naive
    // split(/->/) would produce the wrong triple. FIRST/LAST parsing keeps
    // source_ref and target_ref stable no matter how many '->' the link_type
    // itself carries. Regression-guard for a future data quirk.
    const catalog = buildTestCatalog();
    const result = {
      run: {
        affected_nodes: [
          affected("n-a", "person", "A"),
          affected("n-b", "organization", "B"),
        ],
      },
      report: [
        nodeReport("a", "n-a", "accepted"),
        nodeReport("b", "n-b", "accepted"),
        // Simulate a pathological link_type that itself contains '->'.
        {
          ref: "a->weird->slug->b",
          kind: "link",
          status: "accepted",
          link_id: "l-weird",
        },
      ],
    };
    const delta = normalizeIngestDirected(result, catalog);
    expect(delta?.links).toHaveLength(1);
    expect(delta?.links[0]).toMatchObject({
      id: "l-weird",
      source_node_id: "n-a",
      target_node_id: "n-b",
      link_type: "weird->slug",
      // Not in the catalog snapshot -> is_temporal fallback + no label.
      is_temporal: false,
    });
    expect(delta?.links[0] && "link_type_label" in delta.links[0]).toBe(false);
  });

  it("falls back to is_temporal=false and OMITS link_type_label when the slug is missing from the catalog", () => {
    // Same fallback contract as the `traverse` arm (pickLinkWire) — locked so
    // an open-ontology link_type never crashes or fabricates a label.
    const catalog = buildTestCatalog();
    const result = {
      run: {
        affected_nodes: [
          affected("n-a", "person", "A"),
          affected("n-b", "organization", "B"),
        ],
      },
      report: [
        nodeReport("a", "n-a", "accepted"),
        nodeReport("b", "n-b", "accepted"),
        linkReport("a", "totally_unknown_slug", "b", "l-1", "accepted"),
      ],
    };
    const delta = normalizeIngestDirected(result, catalog);
    const link = delta?.links[0];
    expect(link?.is_temporal).toBe(false);
    expect(link && "link_type_label" in link).toBe(false);
  });

  it("projects link_type_label from the catalog when the slug is known (parity with traverse arm)", () => {
    const catalog = buildTestCatalog();
    const result = {
      run: {
        affected_nodes: [
          affected("n-a", "person", "A"),
          affected("n-b", "organization", "B"),
        ],
      },
      report: [
        nodeReport("a", "n-a", "accepted"),
        nodeReport("b", "n-b", "accepted"),
        linkReport("a", "reports_to", "b", "l-1", "accepted"),
      ],
    };
    const delta = normalizeIngestDirected(result, catalog);
    expect(delta?.links[0]?.link_type_label).toBe("reports to");
  });

  it("AC-4: empty envelope (no affected_nodes, no accepted link entries) still emits a NON-null empty delta", () => {
    // BR-41 v2.11 — an empty `{nodes:[], links:[]}` delta is contractual; the
    // route MUST emit the frame so the SPA can distinguish "empty result" from
    // "no data emitted". `null` would suppress the frame — reserved for
    // malformed envelopes (see next test).
    const catalog = buildTestCatalog();
    const delta = normalizeIngestDirected(
      { outcome: "ingested", run: {}, report: [] },
      catalog
    );
    expect(delta).toEqual({
      source_tool: "ingest_directed",
      nodes: [],
      links: [],
    });
  });

  it("returns null when the envelope is not a well-formed object (BR-41 v2.11 shape-mismatch guard)", () => {
    // Distinct from the empty-delta case: a shape mismatch means "no graph
    // data at all" — the route MUST NOT emit any frame. The other arms
    // return an empty delta on this branch, but BR-41 v2.11 specifies null
    // for ingest_directed. Regression would surface junk empty frames on
    // envelopes we do not understand.
    const catalog = buildTestCatalog();
    expect(normalizeIngestDirected(null, catalog)).toBeNull();
    expect(normalizeIngestDirected(undefined, catalog)).toBeNull();
    expect(normalizeIngestDirected("nope", catalog)).toBeNull();
    expect(normalizeIngestDirected(42, catalog)).toBeNull();
    expect(normalizeIngestDirected([], catalog)).toBeNull();
  });

  it("silently drops malformed report entries (missing link_id, missing ref, mistyped fields)", () => {
    // Defensive parity with the other arms: bad rows do not crash the stream.
    const catalog = buildTestCatalog();
    const result = {
      run: {
        affected_nodes: [
          affected("n-a", "person", "A"),
          affected("n-b", "organization", "B"),
        ],
      },
      report: [
        nodeReport("a", "n-a", "accepted"),
        nodeReport("b", "n-b", "accepted"),
        // Missing link_id — dropped.
        { ref: "a->reports_to->b", kind: "link", status: "accepted" },
        // Non-string ref — dropped.
        { ref: 123, kind: "link", status: "accepted", link_id: "l-x" },
        // Malformed compound (single '->' in the middle only) — dropped.
        { ref: "a->b", kind: "link", status: "accepted", link_id: "l-y" },
        // Empty source_ref segment — dropped.
        { ref: "->reports_to->b", kind: "link", status: "accepted", link_id: "l-z" },
        // Well-formed — kept.
        linkReport("a", "reports_to", "b", "l-good", "accepted"),
      ],
    };
    const delta = normalizeIngestDirected(result, catalog);
    expect(delta?.links.map((l) => l.id)).toEqual(["l-good"]);
  });

  it("silently drops malformed affected_nodes entries (mistyped fields)", () => {
    const catalog = buildTestCatalog();
    const result = {
      run: {
        affected_nodes: [
          affected("n-1", "person", "OK"),
          { id: 42, canonical_name: "Bad", node_type: "person" }, // mistyped id
          { id: "n-2", canonical_name: "Bad2", node_type: 99 }, // mistyped type
          affected("n-3", "person", "Also OK"),
        ],
      },
      report: [],
    };
    const delta = normalizeIngestDirected(result, catalog);
    expect(delta?.nodes.map((n) => n.id)).toEqual(["n-1", "n-3"]);
  });

  it("treats affected_nodes absent as [] and still emits the frame", () => {
    // Contract: absence is not an error, just an empty node list.
    const catalog = buildTestCatalog();
    const result = {
      // No `run.affected_nodes` field — projection still runs.
      run: {},
      report: [],
    };
    const delta = normalizeIngestDirected(result, catalog);
    expect(delta).toEqual({
      source_tool: "ingest_directed",
      nodes: [],
      links: [],
    });
  });

  it("treats missing `run` field as an absent affected_nodes list (defensive)", () => {
    const catalog = buildTestCatalog();
    const result = { report: [] };
    const delta = normalizeIngestDirected(result, catalog);
    expect(delta).toEqual({
      source_tool: "ingest_directed",
      nodes: [],
      links: [],
    });
  });

  it("treats missing `report` field as an empty report list (defensive)", () => {
    const catalog = buildTestCatalog();
    const result = {
      run: { affected_nodes: [affected("n-1", "person", "A")] },
    };
    const delta = normalizeIngestDirected(result, catalog);
    expect(delta?.nodes.map((n) => n.id)).toEqual(["n-1"]);
    expect(delta?.links).toEqual([]);
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

  // BR-41 (chat.back.md v2.4) — the two v2.4 ingestion tools are NOT graph
  // tools: their results ({ run_id, status, ... }) carry no node/link data, so
  // the normalizer MUST return null and NO `graph_delta` frame is emitted for
  // them. Locks BUG-03 from the TC-05 QA review.
  it("BR-41: v2.4 ingestion tools (start_async_ingestion/get_ingestion_status) return null", async () => {
    const catalog = buildTestCatalog();
    const ingestionTools = ["start_async_ingestion", "get_ingestion_status"];
    for (const tool of ingestionTools) {
      const out = await normalizeToolResult(
        tool,
        { run_id: "r-1", raw_information_id: "raw-1", status: "running" },
        catalog,
        fakeClient
      );
      expect(out, `tool=${tool}`).toBeNull();
    }
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

  // BR-41 v2.11 — TC-03 validation criterion #3: the dispatcher returns a
  // non-null delta when called with ('ingest_directed', <valid envelope>,
  // catalog). No client needed — the arm is pure.
  it("BR-41 v2.11: routes `ingest_directed` to normalizeIngestDirected (no client needed)", async () => {
    const catalog = buildTestCatalog();
    const result = {
      run: {
        affected_nodes: [
          { id: "n-1", canonical_name: "João", node_type: "person" },
          { id: "n-2", canonical_name: "Rede Unifique", node_type: "organization" },
        ],
      },
      report: [
        { ref: "joao", kind: "node", status: "accepted", node_id: "n-1" },
        { ref: "unifique", kind: "node", status: "consolidated", node_id: "n-2" },
        {
          ref: "joao->reports_to->unifique",
          kind: "link",
          status: "accepted",
          link_id: "l-1",
        },
      ],
    };
    const out = (await normalizeToolResult(
      "ingest_directed",
      result,
      catalog
    )) as GraphDeltaWire;
    expect(out).not.toBeNull();
    expect(out.source_tool).toBe("ingest_directed");
    expect(out.nodes).toHaveLength(2);
    expect(out.links).toHaveLength(1);
    expect(out.links[0]?.source_node_id).toBe("n-1");
    expect(out.links[0]?.target_node_id).toBe("n-2");
  });

  // TC-03 validation criterion #4: an empty envelope (no affected_nodes, no
  // accepted link entries) is a NON-null empty delta — the frame still emits.
  // Only a malformed shape produces null (regression test on the same
  // dispatcher for the BR-41 v2.11 null vs empty-delta distinction).
  it("BR-41 v2.11: routes `ingest_directed` — empty envelope produces a non-null empty delta", async () => {
    const catalog = buildTestCatalog();
    const out = await normalizeToolResult(
      "ingest_directed",
      { outcome: "ingested", run: {}, report: [] },
      catalog
    );
    expect(out).toEqual({
      source_tool: "ingest_directed",
      nodes: [],
      links: [],
    });
  });

  it("BR-41 v2.11: routes `ingest_directed` — malformed envelope returns null (frame suppressed)", async () => {
    const catalog = buildTestCatalog();
    expect(await normalizeToolResult("ingest_directed", null, catalog)).toBeNull();
    expect(
      await normalizeToolResult("ingest_directed", "not-an-object", catalog)
    ).toBeNull();
  });
});
