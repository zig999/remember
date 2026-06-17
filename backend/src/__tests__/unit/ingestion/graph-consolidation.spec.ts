// TC-011 — Graph consolidation service (BR-25 / BR-27 / §6.5).
//
// Verifies the five decision branches for both `consolidateLink` and
// `consolidateAttribute`, plus the dup-guard 23505 recovery path. The tests
// drive the consolidator directly via the `propose-link` / `propose-attribute`
// services — they exercise the call-graph end-to-end (5-layer validation
// + consolidator), confirming the consolidator replaces the previous plain
// INSERT.
//
// The DB is mocked at the `PoolClient.query` boundary: we capture every
// SQL statement issued and assert on the recorded sequence. Behaviour-level
// expectations (outcome, link_id, supersedes chain, provenance rows) are
// derived from that capture.

import { describe, expect, it } from "vitest";

import {
  buildSnapshot,
  type CatalogSnapshot,
} from "../../../modules/ingestion/catalog/catalog.js";
import {
  consolidateAttribute,
  consolidateLink,
  __testing__ as gcInternals,
} from "../../../modules/ingestion/service/graph-consolidation.service.js";
import { proposeAttributeService } from "../../../modules/ingestion/service/propose-attribute.service.js";
import { proposeLinkService } from "../../../modules/ingestion/service/propose-link.service.js";
import { isValidationFailure } from "../../../modules/ingestion/validation/errors.js";

// ----- Fixed test ids ---------------------------------------------------
const NODE_TYPE_PERSON = "00000000-0000-0000-0000-000000000001";
const NODE_TYPE_PROJECT = "00000000-0000-0000-0000-000000000002";
const LINK_TYPE_LEADS = "00000000-0000-0000-0000-000000000010";          // functional
const LINK_TYPE_PARTICIPATES = "00000000-0000-0000-0000-000000000011"; // multi-valued
const ATTR_KEY_DEADLINE = "00000000-0000-0000-0000-000000000020";        // functional
const ATTR_KEY_TAG = "00000000-0000-0000-0000-000000000021";             // multi-valued

const RUN_ID = "44444444-4444-4444-4444-444444444444";
const RAW_INFO_ID = "55555555-5555-4555-8555-555555555555";
const SOURCE_NODE = "11111111-1111-4111-8111-111111111111";
const TARGET_NODE_A = "22222222-2222-4222-8222-222222222222";
const TARGET_NODE_B = "33333333-3333-4333-8333-333333333333";
const FRAGMENT_ID = "66666666-6666-4666-8666-666666666666";
const EXISTING_LINK_ID = "77777777-7777-4777-8777-777777777777";
const EXISTING_ATTR_ID = "88888888-8888-4888-8888-888888888888";

const runCtx = { llmRunId: RUN_ID, rawInformationId: RAW_INFO_ID };

// ----- Catalog builder --------------------------------------------------
function buildCatalog(): CatalogSnapshot {
  return buildSnapshot({
    nodeTypes: [
      { id: NODE_TYPE_PERSON, name: "Person" },
      { id: NODE_TYPE_PROJECT, name: "Project" },
    ],
    linkTypes: [
      {
        id: LINK_TYPE_LEADS,
        name: "leads",
        is_temporal: true,
        allows_multiple_current: false, // functional
        requires_valid_from: true,
        requires_valid_to_on_change: false,
      },
      {
        id: LINK_TYPE_PARTICIPATES,
        name: "participates_in",
        is_temporal: true,
        allows_multiple_current: true, // multi-valued
        requires_valid_from: true,
        requires_valid_to_on_change: false,
      },
    ],
    linkTypeRules: [
      {
        link_type_id: LINK_TYPE_LEADS,
        source_node_type_id: NODE_TYPE_PERSON,
        target_node_type_id: NODE_TYPE_PROJECT,
        valid_from: null,
        valid_to: null,
      },
      {
        link_type_id: LINK_TYPE_PARTICIPATES,
        source_node_type_id: NODE_TYPE_PERSON,
        target_node_type_id: NODE_TYPE_PROJECT,
        valid_from: null,
        valid_to: null,
      },
    ],
    attributeKeys: [
      {
        id: ATTR_KEY_DEADLINE,
        node_type_id: NODE_TYPE_PROJECT,
        key: "deadline",
        value_type: "date",
        is_temporal: true,
        allows_multiple_current: false, // functional
        requires_valid_from: true,
      },
      {
        id: ATTR_KEY_TAG,
        node_type_id: NODE_TYPE_PROJECT,
        key: "tag",
        value_type: "text",
        is_temporal: false,
        allows_multiple_current: true, // multi-valued
        requires_valid_from: false,
      },
    ],
  });
}

// ----- Mock client -------------------------------------------------------
//
// The mock records every SQL statement and produces canned responses for
// the queries the propose-* services + graph-consolidation service issue.
// Tests can configure:
//   - vigentLink:    row returned by SELECT FOR UPDATE on knowledge_link
//   - vigentAttr:    row returned by SELECT FOR UPDATE on node_attribute
//   - chunkValid / fragmentAnchored: layer-1/layer-5 happy-path flags
//   - nodeTypeBy:   id -> node_type_id resolution
//   - dupGuardRaceLinkOnFirstInsert / Attr: simulate a 23505 race
interface VigentLinkFixture {
  readonly id: string;
  readonly target_node_id: string;
  readonly valid_from: string | null;
  readonly status: string;
}
interface VigentAttrFixture {
  readonly id: string;
  readonly value: string;
  readonly valid_from: string | null;
  readonly status: string;
}

interface MockConfig {
  vigentLink?: VigentLinkFixture | null;
  vigentAttr?: VigentAttrFixture | null;
  chunkValid?: boolean;
  fragmentAnchored?: boolean;
  fragmentText?: string;
  nodeTypeBy?: Record<string, string>;
  dupGuardRaceLinkOnFirstInsert?: boolean;
  dupGuardRaceAttrOnFirstInsert?: boolean;
  documentDate?: string | null;
}

interface MockState {
  readonly sql: string[];
  readonly inserts: {
    knowledge_link: Array<Record<string, unknown>>;
    node_attribute: Array<Record<string, unknown>>;
    provenance: Array<Record<string, unknown>>;
  };
  readonly updates: Array<{ table: string; bindings: unknown[]; sql: string }>;
  /** §6.6 fragment promotions (UPDATE information_fragment) — kept separate
   * from `updates` so graph-row close counts stay meaningful. */
  readonly fragmentPromotions: Array<{ bindings: unknown[]; sql: string }>;
  readonly savepoints: string[];
  readonly releases: string[];
  readonly rollbacks: string[];
  raceFiredForLink: boolean;
  raceFiredForAttr: boolean;
}

class FakeUniqueViolationError extends Error {
  public readonly code = "23505";
  public readonly constraint: string;
  constructor(constraint: string) {
    super(`duplicate key value violates unique constraint "${constraint}"`);
    this.name = "error";
    this.constraint = constraint;
  }
}

function buildClient(cfg: MockConfig = {}) {
  const chunkValid = cfg.chunkValid ?? true;
  const fragmentAnchored = cfg.fragmentAnchored ?? true;
  const fragmentText = cfg.fragmentText ?? "alguma sentença válida";
  const nodeTypeBy = cfg.nodeTypeBy ?? {
    [SOURCE_NODE]: NODE_TYPE_PERSON,
    [TARGET_NODE_A]: NODE_TYPE_PROJECT,
    [TARGET_NODE_B]: NODE_TYPE_PROJECT,
  };
  const documentDate = cfg.documentDate ?? null;
  const state: MockState = {
    sql: [],
    inserts: { knowledge_link: [], node_attribute: [], provenance: [] },
    updates: [],
    fragmentPromotions: [],
    savepoints: [],
    releases: [],
    rollbacks: [],
    raceFiredForLink: false,
    raceFiredForAttr: false,
  };
  let nextLinkId = 1;
  let nextAttrId = 1;
  const client = {
    query: async (...args: unknown[]) => {
      const sql = String(args[0]).replace(/\s+/g, " ").trim();
      const params = (args[1] as unknown[]) ?? [];
      state.sql.push(sql);
      // Tx control / savepoints
      if (/^SAVEPOINT (gc_link_|gc_attr_)/i.test(sql)) {
        state.savepoints.push(sql);
        return { rows: [], rowCount: 0 };
      }
      if (/^RELEASE SAVEPOINT/i.test(sql)) {
        state.releases.push(sql);
        return { rows: [], rowCount: 0 };
      }
      if (/^ROLLBACK TO SAVEPOINT/i.test(sql)) {
        state.rollbacks.push(sql);
        return { rows: [], rowCount: 0 };
      }
      if (sql === "BEGIN" || sql === "COMMIT" || sql === "ROLLBACK") {
        return { rows: [], rowCount: 0 };
      }

      // information_fragment fetch
      if (sql.includes("FROM information_fragment WHERE id = ANY")) {
        const ids = (params[0] as string[]) ?? [];
        return {
          rows: ids.map((id) => ({
            id,
            text: fragmentText,
            llm_run_id: RUN_ID,
          })),
          rowCount: ids.length,
        };
      }

      // node_type_id lookup
      if (sql.startsWith("SELECT node_type_id FROM knowledge_node")) {
        const id = String(params[0]);
        const t = nodeTypeBy[id];
        if (t === undefined) return { rows: [], rowCount: 0 };
        return { rows: [{ node_type_id: t }], rowCount: 1 };
      }

      // anti-hallucination count
      if (sql.includes("count(DISTINCT f.id)::text AS n")) {
        return { rows: [{ n: fragmentAnchored ? "1" : "0" }], rowCount: 1 };
      }
      if (sql.includes("count(*)") && sql.includes("FROM raw_chunk")) {
        return { rows: [{ n: chunkValid ? "1" : "0" }], rowCount: 1 };
      }

      // metadata->>'document_date'
      if (sql.startsWith("SELECT (metadata->>'document_date')")) {
        return { rows: [{ document_date: documentDate }], rowCount: 1 };
      }

      // FOR UPDATE on knowledge_link
      if (
        sql.startsWith("SELECT id, source_node_id, target_node_id, link_type_id,") &&
        sql.includes("FROM knowledge_link") &&
        sql.includes("FOR UPDATE")
      ) {
        if (cfg.vigentLink !== undefined && cfg.vigentLink !== null) {
          return {
            rows: [
              {
                id: cfg.vigentLink.id,
                source_node_id: SOURCE_NODE,
                target_node_id: cfg.vigentLink.target_node_id,
                link_type_id: String(params[1]),
                valid_from: cfg.vigentLink.valid_from,
                valid_to: null,
                status: cfg.vigentLink.status,
              },
            ],
            rowCount: 1,
          };
        }
        return { rows: [], rowCount: 0 };
      }
      // FOR UPDATE on node_attribute
      if (
        sql.startsWith("SELECT id, node_id, attribute_key_id, value,") &&
        sql.includes("FROM node_attribute") &&
        sql.includes("FOR UPDATE")
      ) {
        if (cfg.vigentAttr !== undefined && cfg.vigentAttr !== null) {
          return {
            rows: [
              {
                id: cfg.vigentAttr.id,
                node_id: String(params[0]),
                attribute_key_id: String(params[1]),
                value: cfg.vigentAttr.value,
                valid_from: cfg.vigentAttr.valid_from,
                valid_to: null,
                status: cfg.vigentAttr.status,
              },
            ],
            rowCount: 1,
          };
        }
        return { rows: [], rowCount: 0 };
      }

      // UPDATE knowledge_link / node_attribute
      if (sql.startsWith("UPDATE knowledge_link")) {
        state.updates.push({ table: "knowledge_link", bindings: params, sql });
        return { rows: [], rowCount: 1 };
      }
      if (sql.startsWith("UPDATE node_attribute")) {
        state.updates.push({ table: "node_attribute", bindings: params, sql });
        return { rows: [], rowCount: 1 };
      }
      // UPDATE information_fragment — §6.6 proposed -> accepted promotion.
      // Captured separately from `updates` (which counts graph-row closes).
      if (sql.startsWith("UPDATE information_fragment")) {
        state.fragmentPromotions.push({ bindings: params, sql });
        return { rows: [], rowCount: ((params[0] as string[] | undefined) ?? []).length };
      }

      // INSERT knowledge_link
      if (sql.startsWith("INSERT INTO knowledge_link")) {
        if (
          cfg.dupGuardRaceLinkOnFirstInsert === true &&
          !state.raceFiredForLink
        ) {
          state.raceFiredForLink = true;
          throw new FakeUniqueViolationError(
            "knowledge_link_current_dup_guard"
          );
        }
        const id = `link-${nextLinkId++}`;
        state.inserts.knowledge_link.push({
          id,
          source_node_id: params[0],
          target_node_id: params[1],
          link_type_id: params[2],
          valid_from: params[3],
          valid_to: params[4],
          status: params[5],
          confidence: params[6],
          valid_from_basis: params[7],
          created_by_run_id: params[8],
          supersedes_link_id: params[9],
        });
        return { rows: [{ id }], rowCount: 1 };
      }
      // INSERT node_attribute
      if (sql.startsWith("INSERT INTO node_attribute")) {
        if (
          cfg.dupGuardRaceAttrOnFirstInsert === true &&
          !state.raceFiredForAttr
        ) {
          state.raceFiredForAttr = true;
          throw new FakeUniqueViolationError(
            "node_attribute_current_dup_guard"
          );
        }
        const id = `attr-${nextAttrId++}`;
        state.inserts.node_attribute.push({
          id,
          node_id: params[0],
          attribute_key_id: params[1],
          value_type: params[2],
          value: params[3],
          valid_from: params[4],
          valid_to: params[5],
          status: params[6],
          confidence: params[7],
          valid_from_basis: params[8],
          created_by_run_id: params[9],
          supersedes_attribute_id: params[10],
        });
        return { rows: [{ id }], rowCount: 1 };
      }

      // INSERT provenance
      if (sql.startsWith("INSERT INTO provenance")) {
        const targetId = String(params[0]);
        const fragIds = (params[1] as string[]) ?? [];
        for (const fid of fragIds) {
          state.inserts.provenance.push({
            target_id: targetId,
            fragment_id: fid,
            // Best-effort label (link vs attr) based on which UPDATE/INSERT
            // came right before — not strictly needed for the assertions.
          });
        }
        return { rows: [], rowCount: fragIds.length };
      }

      return { rows: [], rowCount: 0 };
    },
    release: () => undefined,
  } as unknown as import("pg").PoolClient;

  return { client, state };
}

const baseLinkArgs = (overrides: Partial<{
  source_node_id: string;
  target_node_id: string;
  link_type: string;
  confidence: number;
  fragment_ids: string[];
  valid_from?: string;
  valid_from_basis?: "stated" | "document" | "received";
  change_hint: "none" | "succession" | "correction";
}> = {}) => ({
  source_node_id: SOURCE_NODE,
  target_node_id: TARGET_NODE_A,
  link_type: "leads",
  confidence: 0.9,
  fragment_ids: [FRAGMENT_ID],
  valid_from: "2026-01-01",
  valid_from_basis: "stated" as const,
  change_hint: "none" as const,
  ...overrides,
});

const baseAttrArgs = (overrides: Partial<{
  node_id: string;
  key: string;
  value: string;
  confidence: number;
  fragment_ids: string[];
  valid_from?: string;
  valid_from_basis?: "stated" | "document" | "received";
  change_hint: "none" | "succession" | "correction";
}> = {}) => ({
  node_id: TARGET_NODE_A, // we use a Project node here
  key: "deadline",
  value: "2026-06-30",
  confidence: 0.9,
  fragment_ids: [FRAGMENT_ID],
  valid_from: "2026-01-10",
  valid_from_basis: "stated" as const,
  change_hint: "none" as const,
  ...overrides,
});

// ============================================================================
// Branch 1 — accepted (new), no vigent row
// ============================================================================
describe("TC-011 — consolidateLink — accepted (new)", () => {
  // UC-10 / BR-25: no vigent row in scope -> INSERT new + INSERT provenance.
  it("inserts a new knowledge_link row and one provenance row when no vigent exists", async () => {
    const catalog = buildCatalog();
    const { client, state } = buildClient({ vigentLink: null });

    const envelope = await proposeLinkService(
      client,
      baseLinkArgs(),
      runCtx,
      { catalog, now: () => new Date("2026-06-12T12:00:00Z") }
    );

    expect(envelope.ok).toBe(true);
    if (!envelope.ok) return;
    expect(envelope.result.outcome).toBe("accepted");
    expect(state.inserts.knowledge_link.length).toBe(1);
    expect(state.inserts.provenance.length).toBe(1);
    // supersedes_link_id is null for a brand-new accepted row.
    expect(state.inserts.knowledge_link[0]!.supersedes_link_id).toBeNull();
    // active status because confidence >= 0.75 (BR-17).
    expect(state.inserts.knowledge_link[0]!.status).toBe("active");
  });

  it("promotes the cited fragment proposed -> accepted when provenance is created (§6.6)", async () => {
    // Regression: a populated graph with fragments stuck at 'proposed' makes
    // /search return nothing (the fragment layer + node-provenance synthesis
    // both filter status='accepted'). §6.6 requires the fragment to flip to
    // 'accepted' exactly when its Provenance row is created on consolidation.
    const catalog = buildCatalog();
    const { client, state } = buildClient({ vigentLink: null });

    const envelope = await proposeLinkService(
      client,
      baseLinkArgs(),
      runCtx,
      { catalog, now: () => new Date("2026-06-12T12:00:00Z") }
    );

    expect(envelope.ok).toBe(true);
    expect(state.inserts.provenance.length).toBe(1);
    // The promotion must be issued, scoped to the cited fragment, and guarded
    // to only touch 'proposed' rows (idempotent under re-affirmation, §18).
    expect(state.fragmentPromotions.length).toBe(1);
    const promotion = state.fragmentPromotions[0]!;
    expect(promotion.sql).toContain("status = 'accepted'");
    expect(promotion.sql).toContain("status = 'proposed'");
    expect(promotion.bindings[0]).toEqual([FRAGMENT_ID]);
  });

  it("inserts with status='uncertain' when 0.40 <= confidence < 0.75", async () => {
    const catalog = buildCatalog();
    const { client, state } = buildClient({ vigentLink: null });

    const envelope = await proposeLinkService(
      client,
      baseLinkArgs({ confidence: 0.5 }),
      runCtx,
      { catalog, now: () => new Date("2026-06-12T12:00:00Z") }
    );

    expect(envelope.ok).toBe(true);
    if (!envelope.ok) return;
    expect(envelope.result.outcome).toBe("accepted");
    expect(state.inserts.knowledge_link[0]!.status).toBe("uncertain");
  });
});

// ============================================================================
// Branch 2 — consolidated (re-affirmation)
// ============================================================================
describe("TC-011 — consolidateLink — consolidated (re-affirmation)", () => {
  // BR-27 step (a): vigent row exists; same target; same valid_from;
  // change_hint='none' -> no new row, only provenance.
  it("returns outcome=consolidated and does NOT insert a new row when (source, link_type, target, valid_from) match the vigent row", async () => {
    const catalog = buildCatalog();
    const { client, state } = buildClient({
      vigentLink: {
        id: EXISTING_LINK_ID,
        target_node_id: TARGET_NODE_A,
        valid_from: "2026-01-01",
        status: "active",
      },
    });

    const envelope = await proposeLinkService(
      client,
      baseLinkArgs(),
      runCtx,
      { catalog, now: () => new Date("2026-06-12T12:00:00Z") }
    );

    expect(envelope.ok).toBe(true);
    if (!envelope.ok) return;
    expect(envelope.result.outcome).toBe("consolidated");
    expect(envelope.result.link_id).toBe(EXISTING_LINK_ID);
    expect(state.inserts.knowledge_link.length).toBe(0);
    // Provenance MUST still be inserted (BR-18) — re-affirmation accumulates.
    expect(state.inserts.provenance.length).toBe(1);
    expect(state.inserts.provenance[0]!.target_id).toBe(EXISTING_LINK_ID);
    // No UPDATE on knowledge_link in the re-affirmation branch.
    expect(state.updates.length).toBe(0);
  });

  // Calling propose_link twice with identical args returns consolidated on the
  // second call and does NOT hit the dup-guard index (BR-27 acceptance).
  it("calling proposeLinkService twice with identical args returns accepted then consolidated (no dup-guard hit)", async () => {
    const catalog = buildCatalog();
    // First call: no vigent.
    {
      const { client, state } = buildClient({ vigentLink: null });
      const e1 = await proposeLinkService(
        client,
        baseLinkArgs(),
        runCtx,
        { catalog, now: () => new Date("2026-06-12T12:00:00Z") }
      );
      expect(e1.ok).toBe(true);
      if (e1.ok) expect(e1.result.outcome).toBe("accepted");
      expect(state.inserts.knowledge_link.length).toBe(1);
    }
    // Second call: vigent row now exists with identical scope.
    {
      const { client, state } = buildClient({
        vigentLink: {
          id: EXISTING_LINK_ID,
          target_node_id: TARGET_NODE_A,
          valid_from: "2026-01-01",
          status: "active",
        },
      });
      const e2 = await proposeLinkService(
        client,
        baseLinkArgs(),
        runCtx,
        { catalog, now: () => new Date("2026-06-12T12:00:00Z") }
      );
      expect(e2.ok).toBe(true);
      if (!e2.ok) return;
      expect(e2.result.outcome).toBe("consolidated");
      // Definitive proof we never hit the dup-guard partial index — no
      // second INSERT into knowledge_link occurred.
      expect(state.inserts.knowledge_link.length).toBe(0);
      expect(state.inserts.provenance.length).toBe(1);
    }
  });
});

// ============================================================================
// Multi-current link re-affirmation with divergent valid_from (§18 bug fix)
// ============================================================================
//
// Bug: branch (a) used to require `sameValidFrom`. For multi-current link
// types (e.g. `holds_role`, `participates_in`), the per-document `received`
// fallback in temporal.ts FR-001 yields a different `valid_from` on each
// document — so re-affirming the same fact from a second document landed
// in the INSERT path and hit the dup-guard unique index, surfacing as
// `STRUCTURAL_INVALID "graph consolidation hit dup-guard twice"`.
//
// Fix: for multi-current types, recognize re-affirmation by
// `sameTarget && change_hint === 'none'` WITHOUT requiring `sameValidFrom`.
// The dup-guard scope (source, target, link_type) already guarantees there
// is at most one vigent row per triple, so a vigent row here IS the same
// assertion. Functional types still require `sameValidFrom` (a different
// period on a functional type is potential succession or dispute, not
// re-affirmation).
describe("TC-011 — multi-current link re-affirmation with divergent valid_from (§18 bug fix)", () => {
  // §18: "Re-afirmação consolida, nunca duplica — proveniência acumula no
  // item existente." On a multi-current link type, a re-affirmation from a
  // second document with a `received`-fallback `valid_from` must consolidate
  // on the existing vigent row, not attempt to insert a coexisting row.
  it("consolidates a multi-current link when second document has a different valid_from (received fallback)", async () => {
    const catalog = buildCatalog();
    const { client, state } = buildClient({
      vigentLink: {
        id: EXISTING_LINK_ID,
        target_node_id: TARGET_NODE_A,
        valid_from: "2026-06-13", // first doc received_at
        status: "active",
      },
    });

    const envelope = await proposeLinkService(
      client,
      baseLinkArgs({
        link_type: "participates_in", // multi-current (allows_multiple_current=true)
        target_node_id: TARGET_NODE_A,
        valid_from: "2026-06-14", // second doc received_at -> different valid_from
        valid_from_basis: "received",
        change_hint: "none",
      }),
      runCtx,
      { catalog, now: () => new Date("2026-06-14T12:00:00Z") }
    );

    expect(envelope.ok).toBe(true);
    if (!envelope.ok) return;
    expect(envelope.result.outcome).toBe("consolidated");
    expect(envelope.result.link_id).toBe(EXISTING_LINK_ID);
    // No new row inserted — re-affirmation consolidates on the existing one.
    expect(state.inserts.knowledge_link.length).toBe(0);
    // Provenance accumulated on the vigent link (BR-18).
    expect(state.inserts.provenance.length).toBe(1);
    expect(state.inserts.provenance[0]!.target_id).toBe(EXISTING_LINK_ID);
    // No UPDATE — only branch (a) was taken.
    expect(state.updates.length).toBe(0);
  });

  // Counterpart: a multi-current proposal with change_hint='succession' is
  // semantically odd (succession does not apply to multi-current types per
  // §6.5) and must NOT be treated as a silent re-affirmation. The fix only
  // relaxes branch (a) for `change_hint === 'none'` — any change signal
  // keeps the original branching.
  it("does NOT consolidate when change_hint='succession' even on a multi-current link", async () => {
    const catalog = buildCatalog();
    const { client } = buildClient({
      vigentLink: {
        id: EXISTING_LINK_ID,
        target_node_id: TARGET_NODE_A,
        valid_from: "2026-06-13",
        status: "active",
      },
      fragmentText: "neutral text without succession markers",
    });

    let envelope: Awaited<ReturnType<typeof proposeLinkService>> | null = null;
    let thrown: unknown = null;
    try {
      envelope = await proposeLinkService(
        client,
        baseLinkArgs({
          link_type: "participates_in",
          target_node_id: TARGET_NODE_A,
          valid_from: "2026-06-14",
          valid_from_basis: "received",
          change_hint: "succession",
        }),
        runCtx,
        { catalog, now: () => new Date("2026-06-14T12:00:00Z") }
      );
    } catch (err) {
      thrown = err;
    }
    // Either an envelope with a non-consolidated outcome OR a thrown
    // ValidationFailure is acceptable — what matters is that we did NOT
    // silently consolidate (which would hide the change signal).
    if (envelope !== null && envelope.ok) {
      expect(envelope.result.outcome).not.toBe("consolidated");
    } else {
      expect(thrown).not.toBeNull();
    }
  });

  // Functional types must still require `sameValidFrom` for branch (a) —
  // different valid_from on a functional type is a different period, which
  // belongs to branches (c) succession or (d) dispute, not consolidation.
  it("functional link with different valid_from does NOT auto-consolidate (still requires sameValidFrom)", async () => {
    const catalog = buildCatalog();
    const { client, state } = buildClient({
      vigentLink: {
        id: EXISTING_LINK_ID,
        target_node_id: TARGET_NODE_A,
        valid_from: "2026-06-13",
        status: "active",
      },
      fragmentText: "neutral text without succession or errata markers",
    });

    const envelope = await proposeLinkService(
      client,
      baseLinkArgs({
        link_type: "leads", // functional (allows_multiple_current=false)
        target_node_id: TARGET_NODE_A,
        valid_from: "2026-06-14", // different period
        change_hint: "none",
      }),
      runCtx,
      { catalog, now: () => new Date("2026-06-14T12:00:00Z") }
    );

    expect(envelope.ok).toBe(true);
    if (!envelope.ok) return;
    // Not consolidated — functional + different valid_from + sameTarget +
    // no signal => dispute (branch (d)).
    expect(envelope.result.outcome).not.toBe("consolidated");
    expect(envelope.result.outcome).toBe("disputed");
    // The new row was inserted (dispute branch INSERTs the conflicting row).
    expect(state.inserts.knowledge_link.length).toBe(1);
  });
});

// ============================================================================
// Branch 3 — superseded_previous (succession)
// ============================================================================
describe("TC-011 — consolidateLink — superseded_previous (succession)", () => {
  // BR-27 step (c): vigent row exists; functional link_type;
  // different target AND succession signal -> close vigent + insert chained.
  it("closes vigent and inserts a new chained row when functional + different target + textual succession signal", async () => {
    const catalog = buildCatalog();
    const { client, state } = buildClient({
      vigentLink: {
        id: EXISTING_LINK_ID,
        target_node_id: TARGET_NODE_A, // different from new target_node_b
        valid_from: "2026-01-01",
        status: "active",
      },
      fragmentText: "Ada deixou de liderar o projeto Apollo em junho",
    });

    const envelope = await proposeLinkService(
      client,
      baseLinkArgs({
        target_node_id: TARGET_NODE_B,
        valid_from: "2026-06-01",
        change_hint: "none", // signal comes from text, per BR-27
      }),
      runCtx,
      { catalog, now: () => new Date("2026-06-12T12:00:00Z") }
    );

    expect(envelope.ok).toBe(true);
    if (!envelope.ok) return;
    expect(envelope.result.outcome).toBe("superseded_previous");
    expect(envelope.result.superseded_link_id).toBe(EXISTING_LINK_ID);
    // One UPDATE closing the vigent row.
    expect(state.updates.length).toBe(1);
    expect(state.updates[0]!.table).toBe("knowledge_link");
    expect(state.updates[0]!.sql).toContain("valid_to");
    expect(state.updates[0]!.sql).toContain("superseded_at");
    expect(state.updates[0]!.sql).toContain("'superseded'");
    // Emenda v7.3: succession closes the VALIDITY axis only — the close must
    // guard superseded_at conditionally (intra-day fallback), never set it
    // unconditionally. `ELSE superseded_at` proves the normal branch leaves it
    // NULL so the old version stays visible to as_of (C7). A regression to a
    // blind `superseded_at = now()` drops this token and silently re-breaks C7.
    expect(state.updates[0]!.sql).toContain("ELSE superseded_at");
    // One INSERT for the new row, chained.
    expect(state.inserts.knowledge_link.length).toBe(1);
    expect(state.inserts.knowledge_link[0]!.supersedes_link_id).toBe(
      EXISTING_LINK_ID
    );
    expect(state.inserts.knowledge_link[0]!.target_node_id).toBe(TARGET_NODE_B);
    // Provenance for the new row.
    expect(state.inserts.provenance.length).toBe(1);
  });

  it("intra-day succession closes on the transaction axis only — guards the degenerate [D,D) interval (§5.1 date granularity)", async () => {
    // When the new version's valid_from equals the vigent row's valid_from
    // (a same-day succession on a day-granular validity axis), setting
    // valid_to = that same date would make valid_from == valid_to and violate
    // the strict `valid_from < valid_to` CHECK. The succession close must guard
    // this: emit valid_to only when valid_from < closeDate, else leave it.
    const catalog = buildCatalog();
    const { client, state } = buildClient({
      vigentLink: {
        id: EXISTING_LINK_ID,
        target_node_id: TARGET_NODE_A,
        valid_from: "2026-06-01", // SAME day as the new proposal below
        status: "active",
      },
      fragmentText: "Ada deixou de liderar o projeto Apollo",
    });

    const envelope = await proposeLinkService(
      client,
      baseLinkArgs({
        target_node_id: TARGET_NODE_B,
        valid_from: "2026-06-01", // same-day change
        change_hint: "none", // signal from text
      }),
      runCtx,
      { catalog, now: () => new Date("2026-06-12T12:00:00Z") }
    );

    expect(envelope.ok).toBe(true);
    if (!envelope.ok) return;
    expect(envelope.result.outcome).toBe("superseded_previous");
    // The close stays a single guarded UPDATE on the vigent row.
    expect(state.updates.length).toBe(1);
    const close = state.updates[0]!;
    expect(close.table).toBe("knowledge_link");
    // SQL-contract: the collapse guard must be present (a regression that
    // reverts to a blind `valid_to = $2::date` would crash on a real DB).
    expect(close.sql).toContain("CASE");
    expect(close.sql).toContain("valid_from >=");
    expect(close.sql).toContain("THEN valid_to");
    expect(close.sql).toContain("superseded_at");
    // Emenda v7.3: the intra-day branch is the ONLY succession case that closes
    // on the transaction axis (validity can't represent the sub-day boundary) —
    // `THEN now()` in the superseded_at CASE proves that fallback is wired.
    expect(close.sql).toContain("THEN now()");
    // closeDate is still bound as $2 (the CASE decides whether to apply it).
    expect(close.bindings[1]).toBe("2026-06-01");
  });

  it("recognizes change_hint='succession' as a succession signal even without textual marker", async () => {
    const catalog = buildCatalog();
    const { client, state } = buildClient({
      vigentLink: {
        id: EXISTING_LINK_ID,
        target_node_id: TARGET_NODE_A,
        valid_from: "2026-01-01",
        status: "active",
      },
      fragmentText: "neutral text without markers",
    });

    const envelope = await proposeLinkService(
      client,
      baseLinkArgs({
        target_node_id: TARGET_NODE_B,
        valid_from: "2026-06-01",
        change_hint: "succession",
      }),
      runCtx,
      { catalog, now: () => new Date("2026-06-12T12:00:00Z") }
    );

    expect(envelope.ok).toBe(true);
    if (envelope.ok) {
      expect(envelope.result.outcome).toBe("superseded_previous");
    }
    expect(state.updates.length).toBe(1);
    expect(state.inserts.knowledge_link.length).toBe(1);
  });
});

// ============================================================================
// Branch 4 — disputed (conflict, no signal)
// ============================================================================
describe("TC-011 — consolidateLink — disputed (no succession/correction signal)", () => {
  // BR-27 step (d): functional vigent row exists; different target; overlapping
  // period; no signal -> mark BOTH disputed.
  it("flags both old and new row as disputed and surfaces conflicting_link_id", async () => {
    const catalog = buildCatalog();
    const { client, state } = buildClient({
      vigentLink: {
        id: EXISTING_LINK_ID,
        target_node_id: TARGET_NODE_A,
        valid_from: "2026-01-01",
        status: "active",
      },
      fragmentText: "neutral text without succession or errata markers",
    });

    const envelope = await proposeLinkService(
      client,
      baseLinkArgs({
        target_node_id: TARGET_NODE_B,
        valid_from: "2026-01-15", // overlapping period
        change_hint: "none",
      }),
      runCtx,
      { catalog, now: () => new Date("2026-06-12T12:00:00Z") }
    );

    expect(envelope.ok).toBe(true);
    if (!envelope.ok) return;
    expect(envelope.result.outcome).toBe("disputed");
    // The vigent row was UPDATEd to disputed.
    expect(state.updates.length).toBe(1);
    expect(state.updates[0]!.sql).toContain("'disputed'");
    // The new row was INSERTed with status='disputed' and NULL supersedes.
    expect(state.inserts.knowledge_link.length).toBe(1);
    expect(state.inserts.knowledge_link[0]!.status).toBe("disputed");
    expect(state.inserts.knowledge_link[0]!.supersedes_link_id).toBeNull();
    // Provenance for the new row.
    expect(state.inserts.provenance.length).toBe(1);
  });
});

// ============================================================================
// Branch 5 — correction (outcome=accepted)
// ============================================================================
describe("TC-011 — consolidateLink — correction (outcome=accepted)", () => {
  // BR-25 / BR-27 step (b): change_hint='correction' + errata text -> close
  // the vigent row (transaction axis only, valid_to UNTOUCHED), insert
  // new chained row; tool_call.validation_outcome='accepted'.
  it("closes vigent with status='superseded' (transaction axis only) and inserts a chained new row; outcome=accepted", async () => {
    const catalog = buildCatalog();
    const { client, state } = buildClient({
      vigentLink: {
        id: EXISTING_LINK_ID,
        target_node_id: TARGET_NODE_A,
        valid_from: "2026-01-01",
        status: "active",
      },
      fragmentText: "errata: o líder correto é Bob, não Ada",
    });

    const envelope = await proposeLinkService(
      client,
      baseLinkArgs({
        target_node_id: TARGET_NODE_B,
        valid_from: "2026-01-01", // SAME period — correction not change in world
        change_hint: "correction",
      }),
      runCtx,
      { catalog, now: () => new Date("2026-06-12T12:00:00Z") }
    );

    expect(envelope.ok).toBe(true);
    if (!envelope.ok) return;
    // Correction surfaces as 'accepted' per BR-25 (audit lives in supersedes_*).
    expect(envelope.result.outcome).toBe("accepted");
    expect(envelope.result.superseded_link_id).toBe(EXISTING_LINK_ID);
    // The vigent row's UPDATE must NOT touch valid_to (§6.5-B "transaction
    // axis only").
    expect(state.updates.length).toBe(1);
    expect(state.updates[0]!.sql).not.toContain("valid_to");
    expect(state.updates[0]!.sql).toContain("superseded_at");
    expect(state.updates[0]!.sql).toContain("'superseded'");
    // New chained row.
    expect(state.inserts.knowledge_link.length).toBe(1);
    expect(state.inserts.knowledge_link[0]!.supersedes_link_id).toBe(
      EXISTING_LINK_ID
    );
    expect(state.inserts.provenance.length).toBe(1);
  });
});

// ============================================================================
// Dup-guard 23505 race recovery (BR-27 step "SQLSTATE 23505 -> retry once")
// ============================================================================
describe("TC-011 — dup-guard 23505 race recovery", () => {
  it("catches 23505 on first INSERT, retries the lookup-and-decide, settles deterministically on the second attempt", async () => {
    const catalog = buildCatalog();
    // No vigent on the first lookup; the INSERT fails with 23505. On the
    // retry the mock still reports no vigent (worst case — concurrent row
    // not visible to the synthetic SELECT). The second INSERT succeeds:
    // the test asserts the retry happened, not whether the second lookup
    // saw the racer (which is mock-specific).
    const { client, state } = buildClient({
      vigentLink: null,
      dupGuardRaceLinkOnFirstInsert: true,
    });
    const envelope = await proposeLinkService(
      client,
      baseLinkArgs(),
      runCtx,
      { catalog, now: () => new Date("2026-06-12T12:00:00Z") }
    );
    expect(envelope.ok).toBe(true);
    // Two SAVEPOINT statements observed (one per attempt).
    expect(state.savepoints.length).toBe(2);
    expect(state.rollbacks.length).toBe(1); // first attempt rolled back
    // Only one INSERT persisted (the racer flag is reset for the retry).
    expect(state.inserts.knowledge_link.length).toBe(1);
  });

  it("a SECOND 23505 (still racing) surfaces as ValidationFailure(STRUCTURAL_INVALID)", async () => {
    const catalog = buildCatalog();
    // We need the racer to fire on BOTH inserts. Easiest: configure a
    // mock that throws unconditionally for every INSERT into knowledge_link.
    const { client } = buildClient({});
    // Replace the query function with one that always 23505s on the INSERT.
    const realQuery = client.query as unknown as (...args: unknown[]) => Promise<unknown>;
    let insertAttempts = 0;
    (client as unknown as { query: typeof realQuery }).query = async (
      ...args: unknown[]
    ) => {
      const sql = String(args[0]).replace(/\s+/g, " ").trim();
      if (sql.startsWith("INSERT INTO knowledge_link")) {
        insertAttempts += 1;
        throw new FakeUniqueViolationError(
          "knowledge_link_current_dup_guard"
        );
      }
      return realQuery.call(client, ...args);
    };
    let thrown: unknown = null;
    try {
      await proposeLinkService(
        client,
        baseLinkArgs(),
        runCtx,
        { catalog, now: () => new Date("2026-06-12T12:00:00Z") }
      );
    } catch (err) {
      thrown = err;
    }
    expect(thrown).not.toBeNull();
    expect(isValidationFailure(thrown)).toBe(true);
    if (!isValidationFailure(thrown)) return;
    expect(thrown.code).toBe("STRUCTURAL_INVALID");
    // Two INSERT attempts -> two 23505s -> ValidationFailure.
    expect(insertAttempts).toBe(2);
  });
});

// ============================================================================
// Mirror suite — attribute branch (mirrors the link branch)
// ============================================================================
describe("TC-011 — consolidateAttribute — five decision branches", () => {
  it("accepted (new) — no vigent row", async () => {
    const catalog = buildCatalog();
    const { client, state } = buildClient({ vigentAttr: null });
    const envelope = await proposeAttributeService(
      client,
      baseAttrArgs(),
      runCtx,
      { catalog, now: () => new Date("2026-06-12T12:00:00Z") }
    );
    expect(envelope.ok).toBe(true);
    if (envelope.ok) expect(envelope.result.outcome).toBe("accepted");
    expect(state.inserts.node_attribute.length).toBe(1);
    expect(state.inserts.provenance.length).toBe(1);
  });

  it("consolidated — same (node, key, value, valid_from)", async () => {
    const catalog = buildCatalog();
    const { client, state } = buildClient({
      vigentAttr: {
        id: EXISTING_ATTR_ID,
        value: "2026-06-30",
        valid_from: "2026-01-10",
        status: "active",
      },
    });
    const envelope = await proposeAttributeService(
      client,
      baseAttrArgs(),
      runCtx,
      { catalog, now: () => new Date("2026-06-12T12:00:00Z") }
    );
    expect(envelope.ok).toBe(true);
    if (envelope.ok) {
      expect(envelope.result.outcome).toBe("consolidated");
      expect(envelope.result.attribute_id).toBe(EXISTING_ATTR_ID);
    }
    expect(state.inserts.node_attribute.length).toBe(0);
    expect(state.inserts.provenance.length).toBe(1);
  });

  it("superseded_previous — different value on a functional key with succession signal", async () => {
    const catalog = buildCatalog();
    const { client, state } = buildClient({
      vigentAttr: {
        id: EXISTING_ATTR_ID,
        value: "2026-06-30",
        valid_from: "2026-01-10",
        status: "active",
      },
      fragmentText: "novo prazo: passou a 2026-07-15",
    });
    const envelope = await proposeAttributeService(
      client,
      baseAttrArgs({
        value: "2026-07-15",
        valid_from: "2026-06-10",
        change_hint: "none",
      }),
      runCtx,
      { catalog, now: () => new Date("2026-06-12T12:00:00Z") }
    );
    expect(envelope.ok).toBe(true);
    if (envelope.ok) {
      expect(envelope.result.outcome).toBe("superseded_previous");
      expect(envelope.result.superseded_attribute_id).toBe(EXISTING_ATTR_ID);
    }
    expect(state.updates.length).toBe(1);
    expect(state.updates[0]!.table).toBe("node_attribute");
    expect(state.updates[0]!.sql).toContain("valid_to");
    expect(state.inserts.node_attribute.length).toBe(1);
    expect(state.inserts.node_attribute[0]!.supersedes_attribute_id).toBe(
      EXISTING_ATTR_ID
    );
  });

  it("disputed — divergent value, same overlapping period, no signal", async () => {
    const catalog = buildCatalog();
    const { client, state } = buildClient({
      vigentAttr: {
        id: EXISTING_ATTR_ID,
        value: "2026-06-30",
        valid_from: "2026-01-10",
        status: "active",
      },
      fragmentText: "neutral text",
    });
    const envelope = await proposeAttributeService(
      client,
      baseAttrArgs({
        value: "2026-07-15",
        valid_from: "2026-01-15", // overlapping
        change_hint: "none",
      }),
      runCtx,
      { catalog, now: () => new Date("2026-06-12T12:00:00Z") }
    );
    expect(envelope.ok).toBe(true);
    if (envelope.ok) expect(envelope.result.outcome).toBe("disputed");
    expect(state.updates.length).toBe(1);
    expect(state.updates[0]!.sql).toContain("'disputed'");
    expect(state.inserts.node_attribute.length).toBe(1);
    expect(state.inserts.node_attribute[0]!.status).toBe("disputed");
    expect(state.inserts.node_attribute[0]!.supersedes_attribute_id).toBeNull();
  });

  it("correction — change_hint='correction' + errata text, outcome=accepted, valid_to untouched", async () => {
    const catalog = buildCatalog();
    const { client, state } = buildClient({
      vigentAttr: {
        id: EXISTING_ATTR_ID,
        value: "2026-06-30",
        valid_from: "2026-01-10",
        status: "active",
      },
      fragmentText: "errata: o prazo correto é 2026-08-01",
    });
    const envelope = await proposeAttributeService(
      client,
      baseAttrArgs({
        value: "2026-08-01",
        valid_from: "2026-01-10", // same period (correction not change)
        change_hint: "correction",
      }),
      runCtx,
      { catalog, now: () => new Date("2026-06-12T12:00:00Z") }
    );
    expect(envelope.ok).toBe(true);
    if (envelope.ok) {
      expect(envelope.result.outcome).toBe("accepted");
      expect(envelope.result.superseded_attribute_id).toBe(EXISTING_ATTR_ID);
    }
    // valid_to MUST NOT be touched (§6.5-B).
    expect(state.updates.length).toBe(1);
    expect(state.updates[0]!.sql).not.toContain("valid_to");
    expect(state.updates[0]!.sql).toContain("'superseded'");
    expect(state.inserts.node_attribute.length).toBe(1);
    expect(state.inserts.node_attribute[0]!.supersedes_attribute_id).toBe(
      EXISTING_ATTR_ID
    );
  });

  it("dup-guard 23505 race on attribute INSERT — retried once, then succeeds", async () => {
    const catalog = buildCatalog();
    const { client, state } = buildClient({
      vigentAttr: null,
      dupGuardRaceAttrOnFirstInsert: true,
    });
    const envelope = await proposeAttributeService(
      client,
      baseAttrArgs(),
      runCtx,
      { catalog, now: () => new Date("2026-06-12T12:00:00Z") }
    );
    expect(envelope.ok).toBe(true);
    expect(state.savepoints.length).toBe(2);
    expect(state.rollbacks.length).toBe(1);
    expect(state.inserts.node_attribute.length).toBe(1);
  });
});

// ============================================================================
// BR-18 provenance invariant — every accepted / consolidated branch INSERTs >=1 provenance row
// ============================================================================
describe("TC-011 — BR-18 provenance invariant", () => {
  const branches: Array<{
    name: string;
    setup: () => { vigentLink: VigentLinkFixture | null; fragmentText: string };
    args: ReturnType<typeof baseLinkArgs>;
  }> = [
    {
      name: "accepted (new)",
      setup: () => ({ vigentLink: null, fragmentText: "neutral" }),
      args: baseLinkArgs(),
    },
    {
      name: "consolidated",
      setup: () => ({
        vigentLink: {
          id: EXISTING_LINK_ID,
          target_node_id: TARGET_NODE_A,
          valid_from: "2026-01-01",
          status: "active",
        },
        fragmentText: "neutral",
      }),
      args: baseLinkArgs(),
    },
    {
      name: "superseded_previous",
      setup: () => ({
        vigentLink: {
          id: EXISTING_LINK_ID,
          target_node_id: TARGET_NODE_A,
          valid_from: "2026-01-01",
          status: "active",
        },
        fragmentText: "deixou de liderar",
      }),
      args: baseLinkArgs({
        target_node_id: TARGET_NODE_B,
        valid_from: "2026-06-01",
      }),
    },
    {
      name: "correction (outcome=accepted)",
      setup: () => ({
        vigentLink: {
          id: EXISTING_LINK_ID,
          target_node_id: TARGET_NODE_A,
          valid_from: "2026-01-01",
          status: "active",
        },
        fragmentText: "errata: corrigir o líder",
      }),
      args: baseLinkArgs({
        target_node_id: TARGET_NODE_B,
        valid_from: "2026-01-01",
        change_hint: "correction",
      }),
    },
    {
      name: "disputed",
      setup: () => ({
        vigentLink: {
          id: EXISTING_LINK_ID,
          target_node_id: TARGET_NODE_A,
          valid_from: "2026-01-01",
          status: "active",
        },
        fragmentText: "neutral",
      }),
      args: baseLinkArgs({
        target_node_id: TARGET_NODE_B,
        valid_from: "2026-01-15",
      }),
    },
  ];

  for (const branch of branches) {
    it(`branch "${branch.name}" inserts >= 1 provenance row`, async () => {
      const catalog = buildCatalog();
      const { client, state } = buildClient(branch.setup());
      const envelope = await proposeLinkService(
        client,
        branch.args,
        runCtx,
        { catalog, now: () => new Date("2026-06-12T12:00:00Z") }
      );
      expect(envelope.ok).toBe(true);
      expect(state.inserts.provenance.length).toBeGreaterThanOrEqual(1);
    });
  }
});

// ============================================================================
// Unit-level tests on the pure helpers
// ============================================================================
describe("TC-011 — succession-signal heuristic", () => {
  it("detects 'deixou de' / 'passou a' / 'novo' / 'replaced' / 'substituiu'", () => {
    expect(gcInternals.hasSuccessionSignal(["Ada deixou de liderar"])).toBe(true);
    expect(gcInternals.hasSuccessionSignal(["passou a ser o novo líder"])).toBe(true);
    expect(gcInternals.hasSuccessionSignal(["replaced by Bob"])).toBe(true);
    expect(gcInternals.hasSuccessionSignal(["Bob substituiu Ada"])).toBe(true);
    expect(gcInternals.hasSuccessionSignal(["completely neutral text"])).toBe(false);
  });

  it("is case-insensitive", () => {
    expect(gcInternals.hasSuccessionSignal(["DEIXOU DE liderar"])).toBe(true);
    expect(gcInternals.hasSuccessionSignal(["Replaced By Bob"])).toBe(true);
  });
});

// Type-only smoke test to confirm the public API surface is what callers
// see.
describe("TC-011 — public API surface", () => {
  it("exports consolidateLink and consolidateAttribute", () => {
    expect(typeof consolidateLink).toBe("function");
    expect(typeof consolidateAttribute).toBe("function");
  });
});
