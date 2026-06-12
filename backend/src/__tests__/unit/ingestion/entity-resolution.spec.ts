// TC-10 — Entity resolution pipeline (§4 / BR-25 / A12).
//
// Verifies `resolveOrCreateNode(client, args)` and the wired delegation from
// `proposeNodeService`. Covers all four decision branches:
//
//   1. exact-match              -> matched_existing
//   2. trigram strong-unique    -> matched_existing
//   3. trigram ambiguous        -> needs_review (+ N entity_match_review rows)
//   4. novel (all < MATCH_FLOOR -> created_new
//
// Also asserts:
//   - advisory lock is acquired BEFORE any SELECT on node_alias (BR-20)
//   - entity_match_review row count = candidates with sim >= MATCH_FLOOR
//   - aliases attempted via INSERT ... ON CONFLICT DO NOTHING
//   - thresholds (MATCH_STRONG = 0.85, MATCH_FLOOR = 0.55) live in the
//     entity-resolution module only.

import { describe, expect, it } from "vitest";

import {
  buildSnapshot,
  type CatalogSnapshot,
} from "../../../modules/ingestion/catalog/catalog.js";
import {
  MATCH_FLOOR,
  MATCH_STRONG,
  decideFromCandidates,
  resolveOrCreateNode,
} from "../../../modules/ingestion/service/entity-resolution.service.js";
import { proposeNodeService } from "../../../modules/ingestion/service/propose-node.service.js";

const NODE_TYPE_PERSON_ID = "00000000-0000-0000-0000-000000000001";
const RUN_ID = "44444444-4444-4444-4444-444444444444";
const RAW_INFO_ID = "55555555-5555-4555-8555-555555555555";

const EXISTING_NODE_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const EXISTING_NODE_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const EXISTING_NODE_C = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

const runCtx = { llmRunId: RUN_ID, rawInformationId: RAW_INFO_ID };

function buildPersonCatalog(): CatalogSnapshot {
  return buildSnapshot({
    nodeTypes: [{ id: NODE_TYPE_PERSON_ID, name: "Person" }],
    linkTypes: [],
    linkTypeRules: [],
    attributeKeys: [],
  });
}

/** Pre-canned stub responses keyed by the kind of SQL the caller emits. */
interface StubConfig {
  /** Exact-match rows returned by step 1; default = []. */
  readonly exactMatch?: ReadonlyArray<{ node_id: string }>;
  /** Trigram candidate rows returned by step 2; default = []. */
  readonly trigramCandidates?: ReadonlyArray<{ node_id: string; sim: number }>;
  /** New uuid handed back by INSERT INTO knowledge_node ... RETURNING id. */
  readonly newNodeId?: string;
}

/** Observable side-effects of the in-memory fake. */
interface StubState {
  /** Order of distinct SQL kinds, for ordering assertions. */
  readonly opLog: string[];
  /** Lock argument the caller passed to pg_advisory_xact_lock(...). */
  lockArg: string | null;
  /** Captured INSERT INTO knowledge_node payload. */
  insertedNode: { node_type_id: string; canonical_name: string; status: string } | null;
  /** Captured INSERT INTO entity_match_review rows. */
  matchReviewRows: Array<{ node_id: string; candidate_node_id: string; similarity: number }>;
  /** Captured INSERT INTO node_alias rows. */
  aliasRows: Array<{ node_id: string; alias: string; kind: string; run_id: string | null }>;
}

function freshState(): StubState {
  return {
    opLog: [],
    lockArg: null,
    insertedNode: null,
    matchReviewRows: [],
    aliasRows: [],
  };
}

function buildClient(cfg: StubConfig, state: StubState) {
  const newNodeId = cfg.newNodeId ?? "ffffffff-ffff-4fff-8fff-ffffffffffff";
  return {
    query: async (...args: unknown[]) => {
      const sql = String(args[0]).replace(/\s+/g, " ").trim();
      const params = (args[1] as unknown[]) ?? [];

      // 1) Lock key composition.
      if (sql.startsWith("SELECT (CAST")) {
        state.opLog.push("compose_lock_key");
        return {
          rows: [{ key: `${params[0]}\x1F${String(params[1]).toLowerCase()}` }],
          rowCount: 1,
        };
      }
      // 2) Advisory lock.
      if (/^SELECT pg_advisory_xact_lock/i.test(sql)) {
        state.opLog.push("acquire_lock");
        state.lockArg = String(params[0]);
        return { rows: [{}], rowCount: 1 };
      }
      // 3) Exact alias_norm match — step 1 of BR-25.
      //    Distinguished from the trigram query by the WHERE clause shape
      //    (`alias_norm = norm(`) vs trigram (`alias_norm %`).
      if (
        sql.startsWith("SELECT na.node_id") &&
        sql.includes("alias_norm = norm(")
      ) {
        state.opLog.push("exact_match");
        return {
          rows: (cfg.exactMatch ?? []).map((r) => ({ node_id: r.node_id })),
          rowCount: (cfg.exactMatch ?? []).length,
        };
      }
      // 4) Trigram candidates — step 2 of BR-25.
      if (
        sql.startsWith("SELECT na.node_id") &&
        sql.includes("alias_norm % norm(")
      ) {
        state.opLog.push("trigram_candidates");
        const rows = (cfg.trigramCandidates ?? []).map((c) => ({
          node_id: c.node_id,
          // The service casts sim to ::text — emulate that here so Number(...)
          // round-trips the numeric value exactly.
          sim: String(c.sim),
        }));
        return { rows, rowCount: rows.length };
      }
      // 5) INSERT knowledge_node.
      if (sql.startsWith("INSERT INTO knowledge_node")) {
        state.opLog.push("insert_node");
        // The status literal appears in the SQL string ("'active'" or "'needs_review'").
        const statusMatch = /VALUES \(\$1, \$2, '(\w+)'\)/.exec(sql);
        state.insertedNode = {
          node_type_id: String(params[0]),
          canonical_name: String(params[1]),
          status: statusMatch?.[1] ?? "active",
        };
        return { rows: [{ id: newNodeId }], rowCount: 1 };
      }
      // 6) INSERT entity_match_review.
      if (sql.startsWith("INSERT INTO entity_match_review")) {
        state.opLog.push("insert_review");
        state.matchReviewRows.push({
          node_id: String(params[0]),
          candidate_node_id: String(params[1]),
          similarity: Number(params[2]),
        });
        return { rows: [], rowCount: 1 };
      }
      // 7) INSERT node_alias.
      if (sql.startsWith("INSERT INTO node_alias")) {
        state.opLog.push("insert_alias");
        const kindMatch = /VALUES \(\$1, \$2, '(\w+)', \$3\)/.exec(sql);
        state.aliasRows.push({
          node_id: String(params[0]),
          alias: String(params[1]),
          kind: kindMatch?.[1] ?? "alias",
          run_id: params[2] == null ? null : String(params[2]),
        });
        return { rows: [], rowCount: 1 };
      }
      throw new Error(`unexpected SQL in stub: ${sql.slice(0, 80)}`);
    },
    release: () => undefined,
  } as unknown as import("pg").PoolClient;
}

describe("TC-10 — thresholds (BR-25)", () => {
  it("exports MATCH_STRONG = 0.85 and MATCH_FLOOR = 0.55", () => {
    expect(MATCH_STRONG).toBe(0.85);
    expect(MATCH_FLOOR).toBe(0.55);
  });
});

describe("TC-10 — decideFromCandidates (A12, pure)", () => {
  it("returns novel when no candidate is above the floor (including the empty set)", () => {
    expect(decideFromCandidates([])).toEqual({ kind: "novel" });
    expect(decideFromCandidates([{ node_id: EXISTING_NODE_A, sim: 0.4 }])).toEqual({
      kind: "novel",
    });
  });

  it("returns strong_unique when exactly one candidate is >= MATCH_STRONG and no other is >= MATCH_FLOOR", () => {
    const d = decideFromCandidates([
      { node_id: EXISTING_NODE_A, sim: 0.95 },
      { node_id: EXISTING_NODE_B, sim: 0.3 },
    ]);
    expect(d).toEqual({ kind: "strong_unique", nodeId: EXISTING_NODE_A });
  });

  it("returns ambiguous when one candidate is strong AND a second is in [FLOOR, STRONG)", () => {
    const d = decideFromCandidates([
      { node_id: EXISTING_NODE_A, sim: 0.9 },
      { node_id: EXISTING_NODE_B, sim: 0.6 },
    ]);
    expect(d.kind).toBe("ambiguous");
    if (d.kind !== "ambiguous") return;
    expect(d.candidates.length).toBe(2);
  });

  it("returns ambiguous when two-or-more candidates are >= MATCH_STRONG", () => {
    const d = decideFromCandidates([
      { node_id: EXISTING_NODE_A, sim: 0.9 },
      { node_id: EXISTING_NODE_B, sim: 0.92 },
    ]);
    expect(d.kind).toBe("ambiguous");
    if (d.kind !== "ambiguous") return;
    expect(d.candidates.length).toBe(2);
  });

  it("returns ambiguous when only one candidate sits in [FLOOR, STRONG)", () => {
    const d = decideFromCandidates([{ node_id: EXISTING_NODE_A, sim: 0.7 }]);
    expect(d.kind).toBe("ambiguous");
    if (d.kind !== "ambiguous") return;
    expect(d.candidates.length).toBe(1);
  });

  it("ambiguous candidates exclude rows below MATCH_FLOOR", () => {
    const d = decideFromCandidates([
      { node_id: EXISTING_NODE_A, sim: 0.7 },
      { node_id: EXISTING_NODE_B, sim: 0.6 },
      { node_id: EXISTING_NODE_C, sim: 0.4 }, // below floor — filtered.
    ]);
    expect(d.kind).toBe("ambiguous");
    if (d.kind !== "ambiguous") return;
    expect(d.candidates.length).toBe(2);
    expect(d.candidates.map((c) => c.node_id)).toEqual([
      EXISTING_NODE_A,
      EXISTING_NODE_B,
    ]);
  });
});

describe("TC-10 — resolveOrCreateNode pipeline branches", () => {
  it("branch 1: exact alias match -> matched_existing (no trigram query, no node insert)", async () => {
    const state = freshState();
    const client = buildClient(
      { exactMatch: [{ node_id: EXISTING_NODE_A }] },
      state
    );
    const out = await resolveOrCreateNode(client, {
      nodeTypeId: NODE_TYPE_PERSON_ID,
      name: "Ada Lovelace",
      aliases: ["Augusta Ada King"],
      llmRunId: RUN_ID,
      catalog: buildPersonCatalog(),
    });

    expect(out.node_id).toBe(EXISTING_NODE_A);
    expect(out.resolution).toBe("matched_existing");
    expect(state.insertedNode).toBeNull();
    expect(state.matchReviewRows).toEqual([]);
    // Trigram query MUST NOT have been issued — exact match short-circuits.
    expect(state.opLog).not.toContain("trigram_candidates");
    // LLM-supplied alias was attempted (canonical not re-inserted on match).
    expect(state.aliasRows).toEqual([
      { node_id: EXISTING_NODE_A, alias: "Augusta Ada King", kind: "alias", run_id: RUN_ID },
    ]);
  });

  it("branch 2: trigram strong-unique -> matched_existing (no node insert, no review rows)", async () => {
    const state = freshState();
    const client = buildClient(
      {
        exactMatch: [],
        trigramCandidates: [
          { node_id: EXISTING_NODE_A, sim: 0.92 },
          // Second candidate below the floor — does NOT defeat strong-unique.
          { node_id: EXISTING_NODE_B, sim: 0.3 },
        ],
      },
      state
    );
    const out = await resolveOrCreateNode(client, {
      nodeTypeId: NODE_TYPE_PERSON_ID,
      name: "Ada Lovelace",
      aliases: [],
      llmRunId: RUN_ID,
      catalog: buildPersonCatalog(),
    });

    expect(out.node_id).toBe(EXISTING_NODE_A);
    expect(out.resolution).toBe("matched_existing");
    expect(state.insertedNode).toBeNull();
    expect(state.matchReviewRows).toEqual([]);
  });

  it("branch 3: ambiguous (one strong + one in [FLOOR, STRONG)) -> needs_review + 2 review rows", async () => {
    const state = freshState();
    const newId = "00000000-0000-4000-8000-000000000fff";
    const client = buildClient(
      {
        exactMatch: [],
        trigramCandidates: [
          { node_id: EXISTING_NODE_A, sim: 0.9 },
          { node_id: EXISTING_NODE_B, sim: 0.6 },
        ],
        newNodeId: newId,
      },
      state
    );
    const out = await resolveOrCreateNode(client, {
      nodeTypeId: NODE_TYPE_PERSON_ID,
      name: "Ada L.",
      aliases: ["A. Lovelace"],
      llmRunId: RUN_ID,
      catalog: buildPersonCatalog(),
    });

    expect(out.node_id).toBe(newId);
    expect(out.resolution).toBe("needs_review");
    expect(state.insertedNode).toEqual({
      node_type_id: NODE_TYPE_PERSON_ID,
      canonical_name: "Ada L.",
      status: "needs_review",
    });
    // EXACTLY 2 entity_match_review rows — one per candidate at or above
    // MATCH_FLOOR (BR-25 / TC-10 constraint).
    expect(state.matchReviewRows).toEqual([
      { node_id: newId, candidate_node_id: EXISTING_NODE_A, similarity: 0.9 },
      { node_id: newId, candidate_node_id: EXISTING_NODE_B, similarity: 0.6 },
    ]);
    // Canonical alias + 1 LLM-supplied alias for the new node.
    expect(state.aliasRows).toEqual([
      { node_id: newId, alias: "Ada L.", kind: "canonical", run_id: RUN_ID },
      { node_id: newId, alias: "A. Lovelace", kind: "alias", run_id: RUN_ID },
    ]);
  });

  it("branch 3b: ambiguous (two strong candidates) -> needs_review + exactly 2 review rows", async () => {
    const state = freshState();
    const newId = "00000000-0000-4000-8000-000000000abc";
    const client = buildClient(
      {
        exactMatch: [],
        trigramCandidates: [
          { node_id: EXISTING_NODE_A, sim: 0.9 },
          { node_id: EXISTING_NODE_B, sim: 0.95 },
        ],
        newNodeId: newId,
      },
      state
    );
    const out = await resolveOrCreateNode(client, {
      nodeTypeId: NODE_TYPE_PERSON_ID,
      name: "Ada",
      llmRunId: RUN_ID,
      catalog: buildPersonCatalog(),
    });

    expect(out.resolution).toBe("needs_review");
    expect(state.matchReviewRows.length).toBe(2);
    expect(state.matchReviewRows.map((r) => r.candidate_node_id)).toEqual([
      EXISTING_NODE_A,
      EXISTING_NODE_B,
    ]);
  });

  it("branch 3c: ambiguous with a below-floor third candidate inserts only 2 review rows", async () => {
    const state = freshState();
    const newId = "00000000-0000-4000-8000-000000000abd";
    const client = buildClient(
      {
        exactMatch: [],
        trigramCandidates: [
          { node_id: EXISTING_NODE_A, sim: 0.9 },
          { node_id: EXISTING_NODE_B, sim: 0.6 },
          { node_id: EXISTING_NODE_C, sim: 0.4 }, // below floor — must not feed reviews.
        ],
        newNodeId: newId,
      },
      state
    );
    await resolveOrCreateNode(client, {
      nodeTypeId: NODE_TYPE_PERSON_ID,
      name: "Ada",
      llmRunId: RUN_ID,
      catalog: buildPersonCatalog(),
    });

    expect(state.matchReviewRows.length).toBe(2);
    expect(state.matchReviewRows.map((r) => r.candidate_node_id)).not.toContain(
      EXISTING_NODE_C
    );
  });

  it("branch 4: novel (no candidate at or above floor) -> created_new with status='active'", async () => {
    const state = freshState();
    const newId = "00000000-0000-4000-8000-000000000bbb";
    const client = buildClient(
      {
        exactMatch: [],
        trigramCandidates: [{ node_id: EXISTING_NODE_A, sim: 0.3 }],
        newNodeId: newId,
      },
      state
    );
    const out = await resolveOrCreateNode(client, {
      nodeTypeId: NODE_TYPE_PERSON_ID,
      name: "Brand New Person",
      aliases: ["B. N. P."],
      llmRunId: RUN_ID,
      catalog: buildPersonCatalog(),
    });

    expect(out.resolution).toBe("created_new");
    expect(state.insertedNode).toEqual({
      node_type_id: NODE_TYPE_PERSON_ID,
      canonical_name: "Brand New Person",
      status: "active",
    });
    expect(state.matchReviewRows).toEqual([]);
    expect(state.aliasRows).toEqual([
      { node_id: newId, alias: "Brand New Person", kind: "canonical", run_id: RUN_ID },
      { node_id: newId, alias: "B. N. P.", kind: "alias", run_id: RUN_ID },
    ]);
  });

  it("branch 4: novel with empty candidate set -> created_new (status='active')", async () => {
    const state = freshState();
    const newId = "00000000-0000-4000-8000-000000000ccc";
    const client = buildClient(
      { exactMatch: [], trigramCandidates: [], newNodeId: newId },
      state
    );
    const out = await resolveOrCreateNode(client, {
      nodeTypeId: NODE_TYPE_PERSON_ID,
      name: "First Of Its Kind",
      llmRunId: RUN_ID,
      catalog: buildPersonCatalog(),
    });

    expect(out.resolution).toBe("created_new");
    expect(state.insertedNode?.status).toBe("active");
  });
});

describe("TC-10 — BR-20: advisory lock acquired BEFORE any node_alias read", () => {
  it("the first DB op is the lock-key compose, the second is pg_advisory_xact_lock, the third is the exact-match read", async () => {
    const state = freshState();
    const client = buildClient(
      { exactMatch: [{ node_id: EXISTING_NODE_A }] },
      state
    );
    await resolveOrCreateNode(client, {
      nodeTypeId: NODE_TYPE_PERSON_ID,
      name: "Lock Order Test",
      llmRunId: RUN_ID,
      catalog: buildPersonCatalog(),
    });

    // The lock must come BEFORE the exact-match SELECT.
    const lockIdx = state.opLog.indexOf("acquire_lock");
    const exactIdx = state.opLog.indexOf("exact_match");
    expect(lockIdx).toBeGreaterThanOrEqual(0);
    expect(exactIdx).toBeGreaterThan(lockIdx);
    // The lock arg is the composed key (node_type_id || US || norm(name)).
    expect(state.lockArg).toContain(NODE_TYPE_PERSON_ID);
    expect(state.lockArg).toContain("\x1F");
  });

  it("the lock is also acquired before the trigram query in the no-exact-match path", async () => {
    const state = freshState();
    const client = buildClient(
      { exactMatch: [], trigramCandidates: [] },
      state
    );
    await resolveOrCreateNode(client, {
      nodeTypeId: NODE_TYPE_PERSON_ID,
      name: "Novel Name",
      llmRunId: RUN_ID,
      catalog: buildPersonCatalog(),
    });
    const lockIdx = state.opLog.indexOf("acquire_lock");
    const trigramIdx = state.opLog.indexOf("trigram_candidates");
    expect(lockIdx).toBeGreaterThanOrEqual(0);
    expect(trigramIdx).toBeGreaterThan(lockIdx);
  });
});

describe("TC-10 — proposeNodeService delegation", () => {
  it("ambiguous resolution propagates through proposeNodeService as ok:true with resolution='needs_review'", async () => {
    const state = freshState();
    const newId = "00000000-0000-4000-8000-000000000def";
    const client = buildClient(
      {
        exactMatch: [],
        trigramCandidates: [
          { node_id: EXISTING_NODE_A, sim: 0.9 },
          { node_id: EXISTING_NODE_B, sim: 0.6 },
        ],
        newNodeId: newId,
      },
      state
    );
    const envelope = await proposeNodeService(
      client,
      { node_type: "Person", name: "Ada L." },
      runCtx,
      { catalog: buildPersonCatalog() }
    );

    expect(envelope.ok).toBe(true);
    if (!envelope.ok) return;
    expect(envelope.result.resolution).toBe("needs_review");
    expect(envelope.result.node_id).toBe(newId);
    expect(state.matchReviewRows.length).toBe(2);
    expect(state.insertedNode?.status).toBe("needs_review");
  });

  it("matched_existing (exact) resolution propagates as ok:true with resolution='matched_existing'", async () => {
    const state = freshState();
    const client = buildClient(
      { exactMatch: [{ node_id: EXISTING_NODE_A }] },
      state
    );
    const envelope = await proposeNodeService(
      client,
      { node_type: "Person", name: "Ada Lovelace" },
      runCtx,
      { catalog: buildPersonCatalog() }
    );

    expect(envelope.ok).toBe(true);
    if (!envelope.ok) return;
    expect(envelope.result.resolution).toBe("matched_existing");
    expect(envelope.result.node_id).toBe(EXISTING_NODE_A);
    expect(state.insertedNode).toBeNull();
  });

  it("created_new resolution propagates as ok:true with resolution='created_new'", async () => {
    const state = freshState();
    const newId = "00000000-0000-4000-8000-000000000eee";
    const client = buildClient(
      { exactMatch: [], trigramCandidates: [], newNodeId: newId },
      state
    );
    const envelope = await proposeNodeService(
      client,
      { node_type: "Person", name: "Solo" },
      runCtx,
      { catalog: buildPersonCatalog() }
    );
    expect(envelope.ok).toBe(true);
    if (!envelope.ok) return;
    expect(envelope.result.resolution).toBe("created_new");
  });
});
