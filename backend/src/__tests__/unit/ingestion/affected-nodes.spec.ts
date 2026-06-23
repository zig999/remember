// TC-02 / BR-33 — affected-nodes collector + LRU cache + resolver + derive.
//
// Covers the spec's validation criteria:
//   - rejected and error outcomes do NOT contribute (de-dup + filter test);
//   - propose_node/link/attribute ok:true envelopes contribute the right ids;
//   - the batched resolver issues ONE knowledge_node JOIN node_type query;
//   - the resolver follows merged_into_node_id one hop (path compression);
//   - the LRU cache evicts the oldest entry at capacity (256) + LRU recency;
//   - deriveAffectedNodes rebuilds the list from tool_call.result rows.

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PoolClient } from "pg";

import {
  __clearAffectedNodesCacheForTests,
  createAffectedNodeCollector,
  deriveAffectedNodes,
  getCachedAffectedNodes,
  resolveAffectedNodes,
  setCachedAffectedNodes,
  type AffectedNode,
} from "../../../modules/ingestion/service/affected-nodes.js";

// --------------------------------------------------------------------------
// UUID helpers — predictable + valid v4-shaped strings.
// --------------------------------------------------------------------------

function uuid(n: number): string {
  // 8-4-4-4-12 = 32 hex digits with a fixed "4" in the version nibble.
  const hex = n.toString(16).padStart(2, "0");
  return `00000000-0000-4000-8000-0000000000${hex}`;
}

// --------------------------------------------------------------------------
// Collector
// --------------------------------------------------------------------------

describe("AffectedNodeCollector — BR-33 collection", () => {
  beforeEach(() => __clearAffectedNodesCacheForTests());

  it("propose_node ok:true with each resolution contributes the node_id", () => {
    const c = createAffectedNodeCollector();
    c.record("propose_node", {
      ok: true,
      result: { node_id: uuid(1), resolution: "created_new" },
    });
    c.record("propose_node", {
      ok: true,
      result: { node_id: uuid(2), resolution: "matched_existing" },
    });
    c.record("propose_node", {
      ok: true,
      result: { node_id: uuid(3), resolution: "needs_review" },
    });
    expect(c.ids()).toEqual([uuid(1), uuid(2), uuid(3)]);
  });

  it("propose_link contributes BOTH source and target on contributing outcomes; not on rejected", () => {
    const c = createAffectedNodeCollector();
    c.record("propose_link", {
      ok: true,
      result: {
        link_id: uuid(99),
        outcome: "accepted",
        source_node_id: uuid(1),
        target_node_id: uuid(2),
      },
    });
    c.record("propose_link", {
      ok: true,
      result: {
        link_id: uuid(98),
        outcome: "consolidated",
        source_node_id: uuid(3),
        target_node_id: uuid(4),
      },
    });
    // BR-33 — rejected outcome MUST NOT contribute.
    c.record("propose_link", {
      ok: true,
      result: {
        link_id: null,
        outcome: "rejected",
        source_node_id: uuid(5),
        target_node_id: uuid(6),
      },
    });
    expect(c.ids()).toEqual([uuid(1), uuid(2), uuid(3), uuid(4)]);
  });

  it("propose_attribute contributes node_id on contributing outcomes only", () => {
    const c = createAffectedNodeCollector();
    c.record("propose_attribute", {
      ok: true,
      result: { attribute_id: uuid(50), outcome: "accepted", node_id: uuid(10) },
    });
    c.record("propose_attribute", {
      ok: true,
      result: { attribute_id: uuid(51), outcome: "consolidated", node_id: uuid(11) },
    });
    c.record("propose_attribute", {
      ok: true,
      result: { attribute_id: uuid(52), outcome: "disputed", node_id: uuid(12) },
    });
    // BR-33 — rejected does NOT contribute.
    c.record("propose_attribute", {
      ok: true,
      result: { attribute_id: null, outcome: "rejected", node_id: uuid(13) },
    });
    expect(c.ids()).toEqual([uuid(10), uuid(11), uuid(12)]);
  });

  it("ok:false envelopes do NOT contribute (layered-validation rejections)", () => {
    const c = createAffectedNodeCollector();
    c.record("propose_node", {
      ok: false,
      error: { code: "STRUCTURAL_INVALID", message: "bad type" },
    });
    c.record("propose_link", {
      ok: false,
      error: { code: "RULE_VIOLATION", message: "no rule" },
    });
    c.record("propose_attribute", {
      ok: false,
      error: { code: "INTERNAL", message: "boom" },
    });
    expect(c.ids()).toEqual([]);
  });

  it("non-writer tools (propose_fragment) do NOT contribute even on ok:true", () => {
    const c = createAffectedNodeCollector();
    c.record("propose_fragment", {
      ok: true,
      result: { fragment_id: uuid(20), node_id: uuid(99), outcome: "accepted" },
    });
    expect(c.ids()).toEqual([]);
  });

  it("de-duplicates by node_id — first-write-wins, insertion order preserved", () => {
    const c = createAffectedNodeCollector();
    c.record("propose_node", {
      ok: true,
      result: { node_id: uuid(1), resolution: "created_new" },
    });
    c.record("propose_link", {
      ok: true,
      result: {
        link_id: uuid(99),
        outcome: "accepted",
        source_node_id: uuid(1),
        target_node_id: uuid(2),
      },
    });
    c.record("propose_attribute", {
      ok: true,
      result: { attribute_id: uuid(50), outcome: "accepted", node_id: uuid(1) },
    });
    // node 1 appears 3 times in input, MUST appear once in output (insertion-
    // ordered first); node 2 second.
    expect(c.ids()).toEqual([uuid(1), uuid(2)]);
  });
});

// --------------------------------------------------------------------------
// LRU cache
// --------------------------------------------------------------------------

describe("Affected-nodes LRU cache — BR-33 persistence (in-memory v1.3.0)", () => {
  beforeEach(() => __clearAffectedNodesCacheForTests());

  it("get/set round-trips a list", () => {
    const id = uuid(1);
    expect(getCachedAffectedNodes(id)).toBeUndefined();
    const list: AffectedNode[] = [
      { id: uuid(1), canonical_name: "Alice", node_type: "Person" },
    ];
    setCachedAffectedNodes(id, list);
    expect(getCachedAffectedNodes(id)).toEqual(list);
  });

  it("empty array is a valid cached value (completed run with only rejected outcomes)", () => {
    const id = uuid(1);
    setCachedAffectedNodes(id, []);
    const cached = getCachedAffectedNodes(id);
    expect(cached).toEqual([]);
    expect(cached).toBeDefined();
  });

  it("evicts the oldest entry when size exceeds 256 (capacity bound)", () => {
    // Fill the cache to 256 + insert a 257th — the first (oldest) must be evicted.
    for (let i = 0; i < 256; i += 1) {
      setCachedAffectedNodes(`run-${i}`, [
        { id: uuid(i % 200), canonical_name: `n${i}`, node_type: "Person" },
      ]);
    }
    // The 0th entry is still there at this point.
    expect(getCachedAffectedNodes("run-0")).toBeDefined();
    // Read of run-0 above already touched it — it is now the MOST RECENT entry,
    // so the NEXT oldest is now "run-1". Insert a 257th to push the evict.
    setCachedAffectedNodes("run-256", [
      { id: uuid(50), canonical_name: "new", node_type: "Person" },
    ]);
    // run-1 (the oldest after the touch above) must have been evicted.
    expect(getCachedAffectedNodes("run-1")).toBeUndefined();
    // run-0 (touched recently) must still be present.
    expect(getCachedAffectedNodes("run-0")).toBeDefined();
    // run-256 (just inserted) must be present.
    expect(getCachedAffectedNodes("run-256")).toBeDefined();
  });
});

// --------------------------------------------------------------------------
// resolveAffectedNodes — batched lookup + merged_into hop
// --------------------------------------------------------------------------

interface QueryCall {
  sql: string;
  params: unknown[];
}

function fakeClient(
  rows: ReadonlyArray<{
    id: string;
    canonical_name: string;
    node_type: string;
    status: string;
    merged_into_node_id: string | null;
  }>,
  survivorRows: ReadonlyArray<{
    id: string;
    canonical_name: string;
    node_type: string;
    status: string;
    merged_into_node_id: string | null;
  }> = []
): { client: PoolClient; calls: QueryCall[] } {
  const calls: QueryCall[] = [];
  let queryIndex = 0;
  const client = {
    query: vi.fn(async (sql: string, params: unknown[]) => {
      calls.push({ sql, params });
      const rowsForCall = queryIndex === 0 ? rows : survivorRows;
      queryIndex += 1;
      return { rows: rowsForCall, rowCount: rowsForCall.length };
    }),
  } as unknown as PoolClient;
  return { client, calls };
}

describe("resolveAffectedNodes — BR-33 batched lookup", () => {
  beforeEach(() => __clearAffectedNodesCacheForTests());

  it("empty ids -> empty result without issuing any query", async () => {
    const { client, calls } = fakeClient([]);
    const out = await resolveAffectedNodes(client, []);
    expect(out).toEqual([]);
    expect(calls).toHaveLength(0);
  });

  it("issues ONE query for the active-node case (no merges)", async () => {
    const { client, calls } = fakeClient([
      {
        id: uuid(1),
        canonical_name: "Alice",
        node_type: "Person",
        status: "active",
        merged_into_node_id: null,
      },
      {
        id: uuid(2),
        canonical_name: "Bob",
        node_type: "Person",
        status: "active",
        merged_into_node_id: null,
      },
    ]);
    const out = await resolveAffectedNodes(client, [uuid(1), uuid(2)]);
    expect(calls).toHaveLength(1);
    expect(calls[0]!.sql).toMatch(/knowledge_node/);
    expect(calls[0]!.sql).toMatch(/JOIN node_type/);
    expect(calls[0]!.sql).toMatch(/ANY\(\$1::uuid\[\]\)/);
    expect(out).toEqual([
      { id: uuid(1), canonical_name: "Alice", node_type: "Person" },
      { id: uuid(2), canonical_name: "Bob", node_type: "Person" },
    ]);
  });

  it("follows merged_into_node_id one hop and swaps in the survivor", async () => {
    const { client, calls } = fakeClient(
      [
        {
          id: uuid(1),
          canonical_name: "Alias-merged",
          node_type: "Person",
          status: "merged_into",
          merged_into_node_id: uuid(2),
        },
      ],
      [
        {
          id: uuid(2),
          canonical_name: "Bob",
          node_type: "Person",
          status: "active",
          merged_into_node_id: null,
        },
      ]
    );
    const out = await resolveAffectedNodes(client, [uuid(1)]);
    expect(calls).toHaveLength(2);
    expect(out).toEqual([
      { id: uuid(2), canonical_name: "Bob", node_type: "Person" },
    ]);
  });

  it("skips ids the lookup does not find (e.g. compliance-deleted node)", async () => {
    const { client } = fakeClient([
      {
        id: uuid(1),
        canonical_name: "Alice",
        node_type: "Person",
        status: "active",
        merged_into_node_id: null,
      },
      // uuid(2) is intentionally absent in the result set.
    ]);
    const out = await resolveAffectedNodes(client, [uuid(1), uuid(2)]);
    expect(out).toEqual([
      { id: uuid(1), canonical_name: "Alice", node_type: "Person" },
    ]);
  });

  it("preserves the input id order on the output", async () => {
    const { client } = fakeClient([
      // intentionally reversed from input order
      {
        id: uuid(2),
        canonical_name: "Bob",
        node_type: "Person",
        status: "active",
        merged_into_node_id: null,
      },
      {
        id: uuid(1),
        canonical_name: "Alice",
        node_type: "Person",
        status: "active",
        merged_into_node_id: null,
      },
    ]);
    const out = await resolveAffectedNodes(client, [uuid(1), uuid(2)]);
    expect(out.map((n) => n.id)).toEqual([uuid(1), uuid(2)]);
  });
});

// --------------------------------------------------------------------------
// deriveAffectedNodes — cache-miss fallback path over tool_call.result rows
// --------------------------------------------------------------------------

describe("deriveAffectedNodes — BR-33 cache-miss fallback", () => {
  beforeEach(() => __clearAffectedNodesCacheForTests());

  it("re-applies the collector over tool_call.result rows and resolves", async () => {
    // Two tool_call rows for the run, both contributing.
    const toolCallRows = [
      {
        tool_name: "propose_node",
        result: { node_id: uuid(1), resolution: "created_new" },
        validation_outcome: "accepted",
      },
      {
        tool_name: "propose_link",
        result: {
          link_id: uuid(99),
          outcome: "accepted",
          source_node_id: uuid(1),
          target_node_id: uuid(2),
        },
        validation_outcome: "accepted",
      },
      // A rejected row that MUST be ignored.
      {
        tool_name: "propose_attribute",
        result: { attribute_id: null, outcome: "rejected", node_id: uuid(9) },
        validation_outcome: "rejected",
      },
    ];
    const resolverRows = [
      {
        id: uuid(1),
        canonical_name: "Alice",
        node_type: "Person",
        status: "active",
        merged_into_node_id: null,
      },
      {
        id: uuid(2),
        canonical_name: "Bob",
        node_type: "Person",
        status: "active",
        merged_into_node_id: null,
      },
    ];

    let call = 0;
    const client = {
      query: vi.fn(async (sql: string) => {
        call += 1;
        if (call === 1) {
          // tool_call read
          expect(sql).toMatch(/FROM tool_call/);
          return { rows: toolCallRows, rowCount: toolCallRows.length };
        }
        // resolver
        expect(sql).toMatch(/knowledge_node/);
        return { rows: resolverRows, rowCount: resolverRows.length };
      }),
    } as unknown as PoolClient;

    const out = await deriveAffectedNodes(client, uuid(100));
    expect(out.map((n) => n.id)).toEqual([uuid(1), uuid(2)]);
  });

  it("returns empty list when the run has no contributing tool_calls", async () => {
    const client = {
      query: vi.fn(async () => ({ rows: [], rowCount: 0 })),
    } as unknown as PoolClient;
    const out = await deriveAffectedNodes(client, uuid(100));
    expect(out).toEqual([]);
  });
});
