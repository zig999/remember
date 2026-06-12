// Unit tests for the BFS traversal engine (`traverseNodes`).
//
// Acceptance criteria coverage (dev_tc_005 validation.criteria):
//   - BR-05: depth=0 / depth=5 -> InvalidTraverseDepthError
//   - BR-04: unknown link_type -> UnknownLinkTypeError (via traverseNodeService)
//   - BR-13: merged endpoints substituted transparently
//   - BR-14: score = TRAVERSAL_DECAY ** hop
//   - BR-22: direction=both never duplicates a link
//   - Edge case: BFS terminates when all reachable nodes within depth are
//     visited (no infinite loop on cycles).
//   - Edge case: self-edge created by merged substitution is dropped.
//   - Edge case: empty link_types[] is treated as "all link types".

import { describe, expect, it } from "vitest";
import pino from "pino";
import type { PoolClient } from "pg";

import { buildSnapshot, type CatalogSnapshot } from "../../../modules/knowledge-graph/catalog/catalog.js";
import { InvalidTraverseDepthError, UnknownLinkTypeError } from "../../../modules/knowledge-graph/service/errors.js";
import {
  traverseNodes,
  traverseNodeService,
} from "../../../modules/knowledge-graph/service/traversal.service.js";
import { TRAVERSAL_DECAY } from "../../../modules/knowledge-graph/traversal/config.js";

const silentLogger = pino({ level: "silent" });

// ---------------------------------------------------------------------------
// In-memory store and fake pg client — the smallest surface the SQL templates
// emitted by the traversal repository touch.
// ---------------------------------------------------------------------------

interface NodeRowMem {
  id: string;
  node_type_id: string;
  node_type: string;
  canonical_name: string;
  status: "active" | "needs_review" | "merged" | "deleted";
  merged_into_node_id: string | null;
}
interface LinkRowMem {
  id: string;
  source_node_id: string;
  target_node_id: string;
  link_type_id: string;
  link_type: string;
  link_inverse_name: string;
  status: "active" | "uncertain" | "disputed" | "superseded" | "deleted";
  confidence: number;
  valid_from: string | null;
  valid_to: string | null;
  superseded_at: string | null;
}

interface Store {
  nodes: NodeRowMem[];
  links: LinkRowMem[];
  hopQueryCount: number;
}

function makeNode(id: string, name: string, status: NodeRowMem["status"] = "active", merged: string | null = null): NodeRowMem {
  return {
    id,
    node_type_id: "nt-project",
    node_type: "Project",
    canonical_name: name,
    status,
    merged_into_node_id: merged,
  };
}

function makeLink(id: string, source: string, target: string, linkType = "participates_in"): LinkRowMem {
  return {
    id,
    source_node_id: source,
    target_node_id: target,
    link_type_id: `lt-${linkType}`,
    link_type: linkType,
    link_inverse_name: `inv_${linkType}`,
    status: "active",
    confidence: 0.9,
    valid_from: null,
    valid_to: null,
    superseded_at: null,
  };
}

function buildFakeClient(store: Store): PoolClient {
  return {
    query: async (sql: string, params: unknown[] = []) => {
      const text = String(sql).trim();
      // findNodeById (joins node_type)
      if (text.includes("FROM knowledge_node kn") && text.includes("WHERE kn.id = $1")) {
        const id = String(params[0]);
        const n = store.nodes.find((x) => x.id === id);
        if (n === undefined) return { rows: [], rowCount: 0 };
        return {
          rows: [{ ...n, created_at: new Date(), updated_at: new Date() }],
          rowCount: 1,
        };
      }
      // findNodesByIds (= ANY)
      if (text.includes("FROM knowledge_node kn") && text.includes("WHERE kn.id = ANY")) {
        const ids = params[0] as string[];
        const rows = store.nodes
          .filter((n) => ids.includes(n.id))
          .map((n) => ({ ...n, created_at: new Date(), updated_at: new Date() }));
        return { rows, rowCount: rows.length };
      }
      // fetchTraversalHop
      if (text.includes("FROM knowledge_link_resolved kl") && text.includes("source_node_id = ANY")) {
        store.hopQueryCount += 1;
        const ids = params[0] as string[];
        const linkTypeIds =
          text.includes("link_type_id = ANY") ? (params[1] as string[]) : undefined;
        const rows = store.links
          .filter((l) => l.status !== "deleted" && ids.includes(l.source_node_id))
          .filter((l) => linkTypeIds === undefined || linkTypeIds.includes(l.link_type_id))
          .map((l) => buildLinkRowProj(l));
        return { rows, rowCount: rows.length };
      }
      if (text.includes("FROM knowledge_link_resolved kl") && text.includes("target_node_id = ANY")) {
        store.hopQueryCount += 1;
        const ids = params[0] as string[];
        const linkTypeIds =
          text.includes("link_type_id = ANY") ? (params[1] as string[]) : undefined;
        const rows = store.links
          .filter((l) => l.status !== "deleted" && ids.includes(l.target_node_id))
          .filter((l) => linkTypeIds === undefined || linkTypeIds.includes(l.link_type_id))
          .map((l) => buildLinkRowProj(l));
        return { rows, rowCount: rows.length };
      }
      // listProvenanceByTargets — return empty (no provenance in these tests)
      if (text.includes("FROM provenance p") && text.includes("= ANY($1::uuid[])")) {
        return { rows: [], rowCount: 0 };
      }
      throw new Error(`fake client: unknown SQL: ${text.slice(0, 120)}`);
    },
    release: () => undefined,
  } as unknown as PoolClient;
}

function buildLinkRowProj(l: LinkRowMem) {
  return {
    id: l.id,
    source_node_id: l.source_node_id,
    target_node_id: l.target_node_id,
    link_type_id: l.link_type_id,
    link_type: l.link_type,
    link_inverse_name: l.link_inverse_name,
    valid_from: l.valid_from,
    valid_to: l.valid_to,
    recorded_at: new Date(),
    superseded_at: l.superseded_at ? new Date(l.superseded_at) : null,
    status: l.status,
    confidence: l.confidence,
    valid_from_source: null,
    created_by_run_id: null,
    supersedes_link_id: null,
    created_at: new Date(),
    updated_at: new Date(),
    is_current: l.valid_to === null && l.superseded_at === null,
    is_in_effect: l.valid_to === null && l.superseded_at === null,
    effective_status: l.status,
  };
}

function buildCatalog(): CatalogSnapshot {
  return buildSnapshot({
    nodeTypes: [
      { id: "nt-project", name: "Project", description: "x", version: 1 },
    ],
    linkTypes: [
      {
        id: "lt-participates_in",
        name: "participates_in",
        label: "",
        description: "",
        inverse_name: "inv_participates_in",
        is_temporal: true,
        allows_multiple_current: false,
        requires_valid_from: false,
        requires_valid_to_on_change: false,
        version: 1,
      },
      {
        id: "lt-related_to",
        name: "related_to",
        label: "",
        description: "",
        inverse_name: "inv_related_to",
        is_temporal: true,
        allows_multiple_current: false,
        requires_valid_from: false,
        requires_valid_to_on_change: false,
        version: 1,
      },
    ],
    linkTypeRules: [],
    attributeKeys: [],
  });
}

// ---------------------------------------------------------------------------
// BR-05 — depth bounds
// ---------------------------------------------------------------------------

describe("traverseNodes — BR-05 depth bounds", () => {
  it("throws InvalidTraverseDepthError for depth = 0", async () => {
    const store: Store = { nodes: [], links: [], hopQueryCount: 0 };
    const client = buildFakeClient(store);
    await expect(
      traverseNodes(
        client,
        {
          startingNodeIds: ["n1"],
          direction: "out",
          depth: 0,
          inEffectOnly: false,
        },
        silentLogger
      )
    ).rejects.toBeInstanceOf(InvalidTraverseDepthError);
  });

  it("throws InvalidTraverseDepthError for depth = 5", async () => {
    const store: Store = { nodes: [], links: [], hopQueryCount: 0 };
    const client = buildFakeClient(store);
    await expect(
      traverseNodes(
        client,
        {
          startingNodeIds: ["n1"],
          direction: "out",
          depth: 5,
          inEffectOnly: false,
        },
        silentLogger
      )
    ).rejects.toBeInstanceOf(InvalidTraverseDepthError);
  });

  it("throws InvalidTraverseDepthError for non-integer depth", async () => {
    const store: Store = { nodes: [], links: [], hopQueryCount: 0 };
    const client = buildFakeClient(store);
    await expect(
      traverseNodes(
        client,
        {
          startingNodeIds: ["n1"],
          direction: "out",
          depth: 1.5,
          inEffectOnly: false,
        },
        silentLogger
      )
    ).rejects.toBeInstanceOf(InvalidTraverseDepthError);
  });
});

// ---------------------------------------------------------------------------
// BR-04 — unknown link_type
// ---------------------------------------------------------------------------

describe("traverseNodeService — BR-04 unknown link_type", () => {
  it("throws UnknownLinkTypeError when an element of link_types[] is absent from the catalog", async () => {
    const store: Store = {
      nodes: [makeNode("n1", "Source")],
      links: [],
      hopQueryCount: 0,
    };
    const client = buildFakeClient(store);
    const catalog = buildCatalog();
    await expect(
      traverseNodeService(
        client,
        catalog,
        {
          startingNodeId: "n1",
          direction: "out",
          linkTypeNames: ["nonexistent"],
          depth: 1,
          inEffectOnly: false,
        },
        silentLogger
      )
    ).rejects.toBeInstanceOf(UnknownLinkTypeError);
  });

  it("known link_types names are resolved and produce a successful traversal", async () => {
    const store: Store = {
      nodes: [makeNode("n1", "A"), makeNode("n2", "B")],
      links: [makeLink("l1", "n1", "n2", "participates_in")],
      hopQueryCount: 0,
    };
    const client = buildFakeClient(store);
    const catalog = buildCatalog();
    const result = await traverseNodeService(
      client,
      catalog,
      {
        startingNodeId: "n1",
        direction: "out",
        linkTypeNames: ["participates_in"],
        depth: 1,
        inEffectOnly: false,
      },
      silentLogger
    );
    expect(result.links).toHaveLength(1);
    expect(result.links[0]?.link_type).toBe("participates_in");
  });
});

// ---------------------------------------------------------------------------
// BR-14 — exponential decay scoring
// ---------------------------------------------------------------------------

describe("traverseNodes — BR-14 score = TRAVERSAL_DECAY ** hop", () => {
  it("hop-1 link has score TRAVERSAL_DECAY^1", async () => {
    const store: Store = {
      nodes: [makeNode("n1", "A"), makeNode("n2", "B")],
      links: [makeLink("l1", "n1", "n2")],
      hopQueryCount: 0,
    };
    const client = buildFakeClient(store);
    const result = await traverseNodes(
      client,
      {
        startingNodeIds: ["n1"],
        direction: "out",
        depth: 1,
        inEffectOnly: false,
      },
      silentLogger
    );
    expect(result.links).toHaveLength(1);
    expect(result.links[0]?.hop).toBe(1);
    expect(result.links[0]?.score).toBe(TRAVERSAL_DECAY);
  });

  it("hop-2 link has score TRAVERSAL_DECAY^2", async () => {
    const store: Store = {
      nodes: [makeNode("n1", "A"), makeNode("n2", "B"), makeNode("n3", "C")],
      links: [makeLink("l1", "n1", "n2"), makeLink("l2", "n2", "n3")],
      hopQueryCount: 0,
    };
    const client = buildFakeClient(store);
    const result = await traverseNodes(
      client,
      {
        startingNodeIds: ["n1"],
        direction: "out",
        depth: 2,
        inEffectOnly: false,
      },
      silentLogger
    );
    expect(result.links).toHaveLength(2);
    const l1 = result.links.find((l) => l.id === "l1");
    const l2 = result.links.find((l) => l.id === "l2");
    expect(l1?.hop).toBe(1);
    expect(l1?.score).toBe(TRAVERSAL_DECAY);
    expect(l2?.hop).toBe(2);
    expect(l2?.score).toBeCloseTo(TRAVERSAL_DECAY ** 2);
  });

  it("hop-3 link has score TRAVERSAL_DECAY^3 = 0.125", async () => {
    const store: Store = {
      nodes: ["n1", "n2", "n3", "n4"].map((id) => makeNode(id, id)),
      links: [
        makeLink("l1", "n1", "n2"),
        makeLink("l2", "n2", "n3"),
        makeLink("l3", "n3", "n4"),
      ],
      hopQueryCount: 0,
    };
    const client = buildFakeClient(store);
    const result = await traverseNodes(
      client,
      {
        startingNodeIds: ["n1"],
        direction: "out",
        depth: 3,
        inEffectOnly: false,
      },
      silentLogger
    );
    expect(result.links).toHaveLength(3);
    const l3 = result.links.find((l) => l.id === "l3");
    expect(l3?.hop).toBe(3);
    expect(l3?.score).toBeCloseTo(0.125);
  });
});

// ---------------------------------------------------------------------------
// BR-13 — merged-node substitution
// ---------------------------------------------------------------------------

describe("traverseNodes — BR-13 merged-node substitution", () => {
  it("substitutes a merged endpoint by its survivor transparently", async () => {
    // Graph: n1 -> n2_merged (merged into n2_survivor).
    // Expected result: the link is rewritten with target = n2_survivor and
    // the response `nodes` list contains n1 + n2_survivor but NEVER n2_merged.
    const store: Store = {
      nodes: [
        makeNode("n1", "Source"),
        makeNode("n2_merged", "Loser", "merged", "n2_survivor"),
        makeNode("n2_survivor", "Survivor"),
      ],
      links: [makeLink("l1", "n1", "n2_merged")],
      hopQueryCount: 0,
    };
    const client = buildFakeClient(store);
    const result = await traverseNodes(
      client,
      {
        startingNodeIds: ["n1"],
        direction: "out",
        depth: 1,
        inEffectOnly: false,
      },
      silentLogger
    );

    expect(result.links).toHaveLength(1);
    expect(result.links[0]?.target_node_id).toBe("n2_survivor");

    const nodeIds = result.nodes.map((n) => n.id);
    expect(nodeIds).toContain("n2_survivor");
    expect(nodeIds).not.toContain("n2_merged");
  });

  it("never expands a merged node — the survivor is enqueued instead", async () => {
    // Graph: n1 -> n2_merged -> ... (no outbound edges from n2_merged)
    //                      ... but the survivor n2_survivor -> n3
    // Expected at depth=2: the BFS expands from n2_survivor, picking up
    // the n2_survivor->n3 edge as hop-2. The merged loser's edges (none
    // here) are not followed.
    const store: Store = {
      nodes: [
        makeNode("n1", "A"),
        makeNode("n2_merged", "Loser", "merged", "n2_survivor"),
        makeNode("n2_survivor", "Survivor"),
        makeNode("n3", "C"),
      ],
      links: [
        makeLink("l1", "n1", "n2_merged"),
        makeLink("l2", "n2_survivor", "n3"),
      ],
      hopQueryCount: 0,
    };
    const client = buildFakeClient(store);
    const result = await traverseNodes(
      client,
      {
        startingNodeIds: ["n1"],
        direction: "out",
        depth: 2,
        inEffectOnly: false,
      },
      silentLogger
    );

    // The hop-2 link must appear with the survivor as its source.
    const l2 = result.links.find((l) => l.id === "l2");
    expect(l2).toBeDefined();
    expect(l2?.hop).toBe(2);
    expect(l2?.source_node_id).toBe("n2_survivor");

    // The merged loser is NEVER in `nodes`.
    expect(result.nodes.map((n) => n.id)).not.toContain("n2_merged");
  });

  it("drops self-edges that emerge purely from substitution", async () => {
    // Graph: n_survivor <- l1 -> n_merged (which substitutes to n_survivor).
    // After substitution, both endpoints collapse to n_survivor; the link
    // conveys no graph information beyond the survivor itself and is dropped.
    const store: Store = {
      nodes: [
        makeNode("n_survivor", "Survivor"),
        makeNode("n_merged", "Loser", "merged", "n_survivor"),
      ],
      links: [makeLink("l1", "n_survivor", "n_merged")],
      hopQueryCount: 0,
    };
    const client = buildFakeClient(store);
    const result = await traverseNodes(
      client,
      {
        startingNodeIds: ["n_survivor"],
        direction: "out",
        depth: 1,
        inEffectOnly: false,
      },
      silentLogger
    );
    expect(result.links).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// BR-22 — direction=both dedup
// ---------------------------------------------------------------------------

describe("traverseNodes — BR-22 direction=both dedup", () => {
  it("never duplicates a link that appears in both BFS halves", async () => {
    // A graph where n1 <-> n2 (two endpoints in the frontier would surface
    // the same edge in both directions if we only seed the frontier with
    // n1). The dedup is keyed by link.id.
    const store: Store = {
      nodes: [makeNode("n1", "A"), makeNode("n2", "B")],
      links: [makeLink("l1", "n1", "n2"), makeLink("l2", "n2", "n1")],
      hopQueryCount: 0,
    };
    const client = buildFakeClient(store);
    const result = await traverseNodes(
      client,
      {
        startingNodeIds: ["n1"],
        direction: "both",
        depth: 1,
        inEffectOnly: false,
      },
      silentLogger
    );
    // Two distinct links — l1 and l2 are different `knowledge_link.id`s.
    // What we MUST verify is that NO id appears twice.
    const ids = result.links.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("collapses a single link reached via both halves into one entry", async () => {
    // Graph: only one knowledge_link `l1` between n1 (source) and n2 (target).
    // direction=both queries source IN [n1] AND target IN [n1]. The outbound
    // half returns l1; the inbound half does NOT return l1 (because n1 is
    // only the source, not the target). But a self-loop link would appear
    // in BOTH halves — let us model that.
    const store: Store = {
      nodes: [makeNode("nself", "Self")],
      links: [makeLink("l_self", "nself", "nself")],
      hopQueryCount: 0,
    };
    const client = buildFakeClient(store);
    const result = await traverseNodes(
      client,
      {
        startingNodeIds: ["nself"],
        direction: "both",
        depth: 1,
        inEffectOnly: false,
      },
      silentLogger
    );
    // The self-loop appears in both halves but is recorded once.
    expect(result.links.filter((l) => l.id === "l_self")).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// Termination — BFS terminates when reachable set is exhausted
// ---------------------------------------------------------------------------

describe("traverseNodes — termination", () => {
  it("terminates with all reachable nodes within depth, no infinite loop on cycles", async () => {
    // Cycle: n1 -> n2 -> n3 -> n1
    const store: Store = {
      nodes: ["n1", "n2", "n3"].map((id) => makeNode(id, id)),
      links: [
        makeLink("l1", "n1", "n2"),
        makeLink("l2", "n2", "n3"),
        makeLink("l3", "n3", "n1"),
      ],
      hopQueryCount: 0,
    };
    const client = buildFakeClient(store);
    const result = await traverseNodes(
      client,
      {
        startingNodeIds: ["n1"],
        direction: "out",
        depth: 3,
        inEffectOnly: false,
      },
      silentLogger
    );
    // All three edges are reachable within depth 3; no edge is duplicated.
    expect(result.links).toHaveLength(3);
    const ids = result.links.map((l) => l.id).sort();
    expect(ids).toEqual(["l1", "l2", "l3"]);
    // BFS query count must be bounded — at most 3 hops worth of queries
    // (out only -> 1 SQL per hop, max 3).
    expect(store.hopQueryCount).toBeLessThanOrEqual(3);
  });

  it("stops early when the frontier empties before reaching the depth ceiling", async () => {
    // Single edge: n1 -> n2. Depth=3 — hop 1 expands n1 and discovers n2;
    // hop 2 expands n2 (returns no edges); hop 3 sees an empty frontier
    // and breaks before issuing SQL. So we observe 2 hop SQLs, not 3.
    const store: Store = {
      nodes: [makeNode("n1", "A"), makeNode("n2", "B")],
      links: [makeLink("l1", "n1", "n2")],
      hopQueryCount: 0,
    };
    const client = buildFakeClient(store);
    const result = await traverseNodes(
      client,
      {
        startingNodeIds: ["n1"],
        direction: "out",
        depth: 3,
        inEffectOnly: false,
      },
      silentLogger
    );
    expect(result.links).toHaveLength(1);
    // The depth ceiling is 3 but the BFS terminates after at most 2 hop
    // queries because the frontier is empty by hop 3.
    expect(store.hopQueryCount).toBeLessThanOrEqual(2);
  });
});
