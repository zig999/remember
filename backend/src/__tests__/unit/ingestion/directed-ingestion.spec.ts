// TC-01 / BR-34 — directed-ingestion orchestrator acceptance.
//
// Covers the validation criteria of the Task Contract:
//   1. Happy path: fragments → nodes → attributes → links land per-item
//      outcomes; the run is closed `completed`; the envelope carries the
//      report + summary + affected_nodes.
//   2. Per-item rejection: a `propose_link` rejection lands `rejected` in the
//      report; preceding items persist; the run still completes.
//   3. node_id pin: an active node id bypasses `proposeNodeHandler` (no
//      handler call is made) and the report shows resolution=`matched_existing`.
//   4. node_id pin invalid: unknown UUID / non-active status → STRUCTURAL_INVALID
//      item-level entry; dependent attributes/links cascade to `dependency_failed`.
//   5. Re-affirmation: two successive identical calls produce two distinct
//      RawInformation rows (per-call nonce makes content_hash unique).
//   6. Confidence clamping: confidence=1.0 enforced on every dispatched
//      propose_* args (the caller payload has no confidence field).
//   7. affected_nodes: result.run.affected_nodes populated from the collected
//      ids; empty array when all items rejected.
//
// The orchestrator delegates to the propose-* handlers and `ingestRawInformation`
// — the tests inject lightweight stubs for those collaborators rather than
// exercise the full DB + catalog stack (the propose-* services already have
// their own integration test surface). The DB pool is mocked at the level the
// orchestrator itself queries (the close-run + pin-verify + final read paths).
//
// Spec refs: ingestion.back.md BR-34 (full algorithm); BR-19 (one TX per
// propose_*); BR-21 (assertRunIsRunning inside each handler); BR-25 (entity
// resolution + node_id pin); BR-33 (affected_nodes collection).

import { beforeEach, describe, expect, it, vi } from "vitest";
import pino from "pino";
import type { Pool } from "pg";

import { buildSnapshot } from "../../../modules/ingestion/catalog/catalog.js";
import {
  __clearAffectedNodesCacheForTests,
  getCachedAffectedNodes,
} from "../../../modules/ingestion/service/affected-nodes.js";
import {
  DIRECTED_MODEL,
  DIRECTED_PROMPT_VERSION,
  directedIngestionService,
  __testing__,
  type DirectedIngestionInput,
  type DirectedIngestionDeps,
} from "../../../modules/ingestion/service/directed-ingestion.service.js";
import type { IngestRawInformationResult } from "../../../modules/ingestion/service/ingestion.service.js";

// ---------------------------------------------------------------------------
// Fixed ids — chosen so test failures point straight at the missing column.
// ---------------------------------------------------------------------------

const RUN_ID = "11111111-1111-4111-8111-111111111111";
const RAW_INFO_ID = "22222222-2222-4222-8222-222222222222";
const CHUNK_ID = "33333333-3333-4333-8333-333333333333";

const PIN_NODE_ID = "44444444-4444-4444-8444-444444444444";
const ALICE_NODE_ID = "55555555-5555-4555-8555-555555555555";
const BOB_NODE_ID = "66666666-6666-4666-8666-666666666666";
const FRAG_ALICE_ID = "77777777-7777-4777-8777-777777777777";
const FRAG_REL_ID = "88888888-8888-4888-8888-888888888888";
const FRAG_AGE_ID = "99999999-9999-4999-8999-999999999999";

const NODE_TYPE_PERSON = "10000000-0000-4000-8000-000000000001";

const LINK_OK_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const ATTR_OK_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

// ---------------------------------------------------------------------------
// Helpers — build a stub pool + stubbed handler dependencies.
// ---------------------------------------------------------------------------

function buildTestCatalog() {
  return buildSnapshot({
    nodeTypes: [{ id: NODE_TYPE_PERSON, name: "Person" }],
    linkTypes: [],
    linkTypeRules: [],
    attributeKeys: [],
  });
}

interface PoolHooks {
  /** Called once when the orchestrator opens the close-run TX. */
  onCloseRun?: () => void;
  /** Override the closed-run row returned by `findLlmRunById`. */
  closedRunRow?: {
    started_at: Date;
    finished_at: Date | null;
    attempts: number;
  };
  /** Override the affected-nodes resolver result. Empty array by default. */
  resolverRows?: Array<{
    id: string;
    canonical_name: string;
    node_type: string;
    status: string;
    merged_into_node_id: string | null;
  }>;
}

/**
 * Build a mock pg pool that responds to the orchestrator's own queries (close
 * run, read closed run, resolve affected nodes). The propose-* handlers are
 * stubbed at the function level so the pool never has to satisfy their queries.
 */
function buildPool(hooks: PoolHooks = {}): { pool: Pool; closeRunCalls: number } {
  let closeRunCalls = 0;

  const connect = async () => {
    const client = {
      query: vi.fn(async (...args: unknown[]) => {
        const rawSql = String(args[0]);
        const sql = rawSql.replace(/\s+/g, " ").trim();
        const upper = sql.toUpperCase();

        if (upper === "BEGIN" || upper === "COMMIT" || upper === "ROLLBACK") {
          return { rows: [], rowCount: 0 };
        }

        // closeLlmRunRow — UPDATE llm_run SET status = ...
        if (sql.startsWith("UPDATE llm_run") && sql.includes("status")) {
          closeRunCalls += 1;
          hooks.onCloseRun?.();
          return {
            rows: [
              {
                id: RUN_ID,
                model: DIRECTED_MODEL,
                prompt_version: DIRECTED_PROMPT_VERSION,
                started_at: hooks.closedRunRow?.started_at ?? new Date("2026-06-25T10:00:00Z"),
                finished_at: hooks.closedRunRow?.finished_at ?? new Date("2026-06-25T10:00:05Z"),
                status: "completed",
                attempts: hooks.closedRunRow?.attempts ?? 1,
                input_raw_information_id: RAW_INFO_ID,
                idempotency_key: "f".repeat(64),
              },
            ],
            rowCount: 1,
          };
        }

        // findLlmRunById — used by readClosedRunSafe.
        if (sql.startsWith("SELECT") && sql.includes("FROM llm_run")) {
          return {
            rows: [
              {
                id: RUN_ID,
                model: DIRECTED_MODEL,
                prompt_version: DIRECTED_PROMPT_VERSION,
                started_at: hooks.closedRunRow?.started_at ?? new Date("2026-06-25T10:00:00Z"),
                finished_at: hooks.closedRunRow?.finished_at ?? new Date("2026-06-25T10:00:05Z"),
                status: "completed",
                attempts: hooks.closedRunRow?.attempts ?? 1,
                input_raw_information_id: RAW_INFO_ID,
                idempotency_key: "f".repeat(64),
              },
            ],
            rowCount: 1,
          };
        }

        // Affected-nodes resolver — knowledge_node JOIN node_type.
        if (sql.includes("FROM knowledge_node") && sql.includes("JOIN node_type")) {
          return {
            rows: hooks.resolverRows ?? [],
            rowCount: (hooks.resolverRows ?? []).length,
          };
        }

        // knowledge_node read (pin verifier) — covered separately via the
        // verifyNodePin seam in the tests that need it.

        return { rows: [], rowCount: 0 };
      }),
      release: vi.fn(),
    };
    return client;
  };

  const pool = { connect } as unknown as Pool;
  return { pool, closeRunCalls: 0, get [Symbol.toPrimitive]() { return closeRunCalls; } } as unknown as {
    pool: Pool;
    closeRunCalls: number;
  };
}

/**
 * Stub `ingestRawInformation` to return a canonical intake result (one chunk).
 * Returns a `created` outcome so the orchestrator proceeds past the no-op guard.
 *
 * `contentSink` (when supplied) captures the synthesised content of each
 * intake call — re-affirmation tests use this to confirm the two calls
 * produced two distinct content_hash inputs (via different nonces).
 */
function buildIngestRaw(
  contentSink?: string[]
): DirectedIngestionDeps["ingestRaw"] {
  let callCount = 0;
  return async (_client, body) => {
    callCount += 1;
    if (contentSink !== undefined) contentSink.push(body.content);
    const intake: IngestRawInformationResult = {
      status: 201,
      body: {
        outcome: "created",
        raw_information_id:
          callCount === 1 ? RAW_INFO_ID : `${"d".repeat(7)}-dddd-4ddd-8ddd-${"d".repeat(12)}`,
        content_hash: "a".repeat(64),
        chunk_count: 1,
        chunks: [
          {
            id: CHUNK_ID,
            chunk_index: 0,
            offset_start: 0,
            offset_end: body.content.length,
          },
        ],
        llm_run_id: callCount === 1 ? RUN_ID : `${"e".repeat(7)}-eeee-4eee-8eee-${"e".repeat(12)}`,
        idempotency_key: "b".repeat(64),
      },
    };
    return intake;
  };
}

const logger = pino({ enabled: false });

beforeEach(() => {
  __clearAffectedNodesCacheForTests();
});

// ---------------------------------------------------------------------------
// Pure-helper tests.
// ---------------------------------------------------------------------------

describe("directed-ingestion / pure helpers", () => {
  it("synthesises content with the fragments + nonce + timestamp", () => {
    // Encoding the contract: the nonce MUST be in the content so the
    // content_hash is unique per call (BR-34 step 2 / decision 3).
    const payload: DirectedIngestionInput = {
      fragments: [
        { ref: "f1", text: "Alice works on Project X." },
        { ref: "f2", text: "Bob reports to Alice." },
      ],
      nodes: [{ ref: "n1", node_type: "Person", name: "Alice" }],
    };
    const at = new Date("2026-06-25T10:00:00.000Z");
    const out = __testing__.synthesiseContent(payload, at);

    expect(out.content).toContain("[f1] Alice works on Project X.");
    expect(out.content).toContain("[f2] Bob reports to Alice.");
    expect(out.content).toContain("directed_at=2026-06-25T10:00:00.000Z");
    expect(out.content).toContain(`nonce=${out.nonce}`);
    expect(out.nonce).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("produces two distinct contents for two synth calls (nonce uniqueness)", () => {
    // The whole point of the per-call nonce is that the resulting content_hash
    // differs across calls — otherwise re-affirmation would hit `noop_existing`.
    const payload: DirectedIngestionInput = {
      fragments: [{ ref: "f1", text: "Alice works on Project X." }],
      nodes: [{ ref: "n1", node_type: "Person", name: "Alice" }],
    };
    const at = new Date("2026-06-25T10:00:00.000Z");
    const a = __testing__.synthesiseContent(payload, at);
    const b = __testing__.synthesiseContent(payload, at);
    expect(a.nonce).not.toBe(b.nonce);
    expect(a.content).not.toBe(b.content);
  });

  it("canonicalises attribute values to string form", () => {
    expect(__testing__.canonicaliseAttributeValue("verbatim")).toBe("verbatim");
    expect(__testing__.canonicaliseAttributeValue(42)).toBe("42");
    expect(__testing__.canonicaliseAttributeValue(-1.5)).toBe("-1.5");
    expect(__testing__.canonicaliseAttributeValue(true)).toBe("true");
    expect(__testing__.canonicaliseAttributeValue(false)).toBe("false");
  });

  it("classifies envelope failures: SYSTEM_* → error, everything else → rejected", () => {
    // BR-13 (P2.1) — layered validation rejections (`VALIDATION_*`,
    // `BUSINESS_*`, `RESOURCE_NOT_FOUND`) are `rejected`; system-level
    // failures (`SYSTEM_*` — e.g. SYSTEM_INTERNAL_ERROR, SYSTEM_SERVICE_UNAVAILABLE)
    // are the SDK / catch-all bucket and stay `error`.
    expect(
      __testing__.classifyEnvelopeFailureStatus({
        ok: false,
        error: { code: "VALIDATION_INVALID_FORMAT" },
      })
    ).toBe("rejected");
    expect(
      __testing__.classifyEnvelopeFailureStatus({
        ok: false,
        error: { code: "BUSINESS_LINK_RULE_VIOLATION" },
      })
    ).toBe("rejected");
    expect(
      __testing__.classifyEnvelopeFailureStatus({
        ok: false,
        error: { code: "RESOURCE_NOT_FOUND" },
      })
    ).toBe("rejected");
    expect(
      __testing__.classifyEnvelopeFailureStatus({
        ok: false,
        error: { code: "SYSTEM_INTERNAL_ERROR" },
      })
    ).toBe("error");
    expect(
      __testing__.classifyEnvelopeFailureStatus({
        ok: false,
        error: { code: "SYSTEM_SERVICE_UNAVAILABLE" },
      })
    ).toBe("error");
  });

  it("checkCascade returns the missing dependency ref or null", () => {
    const refToFrag = new Map<string, string>([["evF", FRAG_AGE_ID]]);
    const refToNode = new Map<string, string>([["nA", ALICE_NODE_ID]]);
    expect(
      __testing__.checkCascade(
        {
          node_ref: "nA",
          key: "age",
          value: 30,
          evidence_ref: "evF",
        },
        refToFrag,
        refToNode
      )
    ).toBeNull();
    // Missing node_ref returned FIRST (dependency order).
    expect(
      __testing__.checkCascade(
        {
          node_ref: "nMissing",
          key: "age",
          value: 30,
          evidence_ref: "evF",
        },
        refToFrag,
        refToNode
      )
    ).toBe("nMissing");
    // node_ref present but evidence_ref missing.
    expect(
      __testing__.checkCascade(
        {
          node_ref: "nA",
          key: "age",
          value: 30,
          evidence_ref: "evMissing",
        },
        refToFrag,
        refToNode
      )
    ).toBe("evMissing");
  });
});

// ---------------------------------------------------------------------------
// End-to-end orchestrator tests (with stubbed propose-* + intake).
// ---------------------------------------------------------------------------

describe("directed-ingestion / orchestrator", () => {
  it("happy path: dispatches fragments → nodes → attributes → links in order; run closes 'completed'", async () => {
    // Why this matters: BR-34 step 3 prescribes a specific dispatch ORDER —
    // attributes/links cannot resolve their refs until the fragments/nodes
    // they cite have been dispatched. A regression that swaps the order
    // would silently turn every link into `dependency_failed`.
    const calls: string[] = [];
    const proposeFragment = vi.fn(async (input: any) => {
      calls.push(`fragment:${input.text}`);
      // Confidence MUST be 1.0 on every dispatch — the server forces this.
      expect(input.confidence).toBe(1.0);
      const idMap: Record<string, string> = {
        "Alice works on Project X.": FRAG_ALICE_ID,
        "Bob reports to Alice.": FRAG_REL_ID,
        "Alice is 30 years old.": FRAG_AGE_ID,
      };
      return {
        ok: true as const,
        result: { fragment_id: idMap[input.text] ?? FRAG_ALICE_ID, status: "proposed" as const },
      };
    });
    const proposeNode = vi.fn(async (input: any) => {
      calls.push(`node:${input.name}`);
      const nodeId = input.name === "Alice" ? ALICE_NODE_ID : BOB_NODE_ID;
      return {
        ok: true as const,
        result: { node_id: nodeId, resolution: "created_new" as const },
      };
    });
    const proposeAttribute = vi.fn(async (input: any) => {
      calls.push(`attribute:${input.key}=${input.value}`);
      expect(input.confidence).toBe(1.0);
      expect(input.valid_from_basis).toBe("stated");
      return {
        ok: true as const,
        result: { attribute_id: ATTR_OK_ID, outcome: "accepted" as const },
      };
    });
    const proposeLink = vi.fn(async (input: any) => {
      calls.push(`link:${input.link_type}`);
      expect(input.confidence).toBe(1.0);
      expect(input.valid_from_basis).toBe("stated");
      return {
        ok: true as const,
        result: { link_id: LINK_OK_ID, outcome: "accepted" as const },
      };
    });

    const { pool } = buildPool({
      resolverRows: [
        {
          id: ALICE_NODE_ID,
          canonical_name: "Alice",
          node_type: "Person",
          status: "active",
          merged_into_node_id: null,
        },
        {
          id: BOB_NODE_ID,
          canonical_name: "Bob",
          node_type: "Person",
          status: "active",
          merged_into_node_id: null,
        },
      ],
    });

    const input: DirectedIngestionInput = {
      fragments: [
        { ref: "fAlice", text: "Alice works on Project X." },
        { ref: "fRel", text: "Bob reports to Alice." },
        { ref: "fAge", text: "Alice is 30 years old." },
      ],
      nodes: [
        { ref: "nAlice", node_type: "Person", name: "Alice" },
        { ref: "nBob", node_type: "Person", name: "Bob" },
      ],
      attributes: [
        { node_ref: "nAlice", key: "age", value: 30, evidence_ref: "fAge" },
      ],
      links: [
        {
          source_ref: "nBob",
          target_ref: "nAlice",
          link_type: "reports_to",
          evidence_ref: "fRel",
        },
      ],
    };

    const envelope = await directedIngestionService(input, {
      pool,
      logger,
      catalog: buildTestCatalog(),
      ingestRaw: buildIngestRaw(),
      proposeFragment,
      proposeNode,
      proposeAttribute,
      proposeLink,
      verifyNodePin: async () => ({ kind: "ok" }),
    });

    expect(envelope.ok).toBe(true);
    if (!envelope.ok) return;
    expect(envelope.result.outcome).toBe("ingested");
    expect(envelope.result.raw_information_id).toBe(RAW_INFO_ID);
    expect(envelope.result.llm_run_id).toBe(RUN_ID);

    // Dispatch order: 3 fragments, then 2 nodes, then 1 attribute, then 1 link.
    expect(calls).toEqual([
      "fragment:Alice works on Project X.",
      "fragment:Bob reports to Alice.",
      "fragment:Alice is 30 years old.",
      "node:Alice",
      "node:Bob",
      "attribute:age=30",
      "link:reports_to",
    ]);

    // Report shape: one entry per input item, in the same caller order.
    expect(envelope.result.report.map((r) => r.ref)).toEqual([
      "fAlice",
      "fRel",
      "fAge",
      "nAlice",
      "nBob",
      "nAlice.age",
      "nBob->reports_to->nAlice",
    ]);
    // Every item accepted on the happy path.
    expect(envelope.result.report.every((r) => r.status === "accepted")).toBe(
      true
    );

    // Run sentinel values — never resolved from prompt registry.
    expect(envelope.result.run.model).toBe(DIRECTED_MODEL);
    expect(envelope.result.run.prompt_version).toBe(DIRECTED_PROMPT_VERSION);
    expect(envelope.result.run.status).toBe("completed");
  });

  it("per-item rejection: one link rejected → report shows rejected; run still completes", async () => {
    // BR-34 step 4 — per-item atomicity. A propose_link rejection does NOT
    // rollback the K-1 already-accepted items; the run still lands `completed`.
    const proposeFragment = vi.fn(async () => ({
      ok: true as const,
      result: { fragment_id: FRAG_ALICE_ID, status: "proposed" as const },
    }));
    const proposeNode = vi.fn(async () => ({
      ok: true as const,
      result: { node_id: ALICE_NODE_ID, resolution: "created_new" as const },
    }));
    const proposeLink = vi.fn(async () => ({
      ok: false as const,
      error: {
        code: "RULE_VIOLATION",
        message: "Link type not allowed for source/target node types.",
      },
    }));

    const { pool } = buildPool();
    const input: DirectedIngestionInput = {
      fragments: [{ ref: "f1", text: "Alice works." }],
      nodes: [
        { ref: "n1", node_type: "Person", name: "Alice" },
        { ref: "n2", node_type: "Person", name: "Bob" },
      ],
      links: [
        {
          source_ref: "n1",
          target_ref: "n2",
          link_type: "invalid_rel",
          evidence_ref: "f1",
        },
      ],
    };
    const envelope = await directedIngestionService(input, {
      pool,
      logger,
      catalog: buildTestCatalog(),
      ingestRaw: buildIngestRaw(),
      proposeFragment,
      proposeNode,
      proposeLink,
      proposeAttribute: vi.fn(),
      verifyNodePin: async () => ({ kind: "ok" }),
    });

    expect(envelope.ok).toBe(true);
    if (!envelope.ok) return;
    const linkEntry = envelope.result.report.find(
      (r) => r.kind === "link"
    );
    expect(linkEntry).toBeDefined();
    expect(linkEntry!.status).toBe("rejected");
    expect(linkEntry!.error?.code).toBe("RULE_VIOLATION");
    // Run still landed completed; the orchestrator never returns `failed` on
    // a per-item rejection.
    expect(envelope.result.run.status).toBe("completed");
    // Fragments + nodes still landed accepted.
    expect(
      envelope.result.report.filter((r) => r.status === "accepted").length
    ).toBe(3);
    // Summary aggregates correctly.
    expect(envelope.result.summary.rejected).toBe(1);
    expect(envelope.result.summary.accepted).toBe(3);
    expect(envelope.result.summary.links).toBe(1);
  });

  it("node_id pin (valid): bypasses propose_node; resolution=matched_existing", async () => {
    // BR-34 schema notes — `node_id` is a pin: the orchestrator does NOT call
    // `proposeNodeHandler` (which would risk trigram drift to a different node).
    // Instead the orchestrator verifies the pin row exists + is active, then
    // forwards the supplied id verbatim.
    const proposeNode = vi.fn(async () => {
      // Should never be reached on the pin path.
      throw new Error("proposeNode should not be called when node_id is pinned");
    });
    const proposeFragment = vi.fn(async () => ({
      ok: true as const,
      result: { fragment_id: FRAG_ALICE_ID, status: "proposed" as const },
    }));
    const verifyPin = vi.fn(async () => ({ kind: "ok" as const }));

    const { pool } = buildPool();
    const input: DirectedIngestionInput = {
      fragments: [{ ref: "f1", text: "Alice works." }],
      nodes: [
        {
          ref: "nA",
          node_type: "Person",
          name: "Alice",
          node_id: PIN_NODE_ID,
        },
      ],
    };
    const envelope = await directedIngestionService(input, {
      pool,
      logger,
      catalog: buildTestCatalog(),
      ingestRaw: buildIngestRaw(),
      proposeFragment,
      proposeNode,
      proposeAttribute: vi.fn(),
      proposeLink: vi.fn(),
      verifyNodePin: verifyPin,
    });

    expect(envelope.ok).toBe(true);
    if (!envelope.ok) return;
    expect(verifyPin).toHaveBeenCalledWith(pool, PIN_NODE_ID);
    expect(proposeNode).not.toHaveBeenCalled();

    const nodeEntry = envelope.result.report.find((r) => r.kind === "node");
    expect(nodeEntry?.status).toBe("accepted");
    expect(nodeEntry?.node_id).toBe(PIN_NODE_ID);
    expect(nodeEntry?.resolution).toBe("matched_existing");
  });

  it("node_id pin (invalid): unknown UUID → RESOURCE_NOT_FOUND; dependent items cascade", async () => {
    // BR-34 step 3 nodes(a) — P2.1 pin-failure discriminator (ingestion.back.md
    // v1.6.0): pin `reason: 'not_found'` maps to RESOURCE_NOT_FOUND (missing
    // row); `reason: 'inactive'` would map to VALIDATION_INVALID_FORMAT
    // (structural-layer surface). Cascade rule (step 4): any attribute/link
    // that referenced this node's ref lands `dependency_failed` with no
    // tool_call row.
    const proposeNode = vi.fn();
    const proposeAttribute = vi.fn();
    const proposeLink = vi.fn();
    const proposeFragment = vi.fn(async () => ({
      ok: true as const,
      result: { fragment_id: FRAG_ALICE_ID, status: "proposed" as const },
    }));

    const { pool } = buildPool();
    const input: DirectedIngestionInput = {
      fragments: [{ ref: "f1", text: "Some claim." }],
      nodes: [
        {
          ref: "nA",
          node_type: "Person",
          name: "Alice",
          node_id: PIN_NODE_ID,
        },
        { ref: "nB", node_type: "Person", name: "Bob" },
      ],
      attributes: [
        { node_ref: "nA", key: "age", value: 30, evidence_ref: "f1" },
      ],
      links: [
        {
          source_ref: "nA",
          target_ref: "nB",
          link_type: "knows",
          evidence_ref: "f1",
        },
      ],
    };

    const envelope = await directedIngestionService(input, {
      pool,
      logger,
      catalog: buildTestCatalog(),
      ingestRaw: buildIngestRaw(),
      proposeFragment,
      proposeNode: vi.fn(async () => ({
        ok: true as const,
        result: { node_id: BOB_NODE_ID, resolution: "created_new" as const },
      })),
      proposeAttribute,
      proposeLink,
      verifyNodePin: async () => ({
        kind: "rejected" as const,
        message: "node_id pin does not resolve to an existing knowledge_node row.",
        details: { reason: "not_found" },
      }),
    });

    expect(envelope.ok).toBe(true);
    if (!envelope.ok) return;

    // Pin node rejected.
    const pinEntry = envelope.result.report.find(
      (r) => r.kind === "node" && r.ref === "nA"
    );
    expect(pinEntry?.status).toBe("rejected");
    expect(pinEntry?.error?.code).toBe("RESOURCE_NOT_FOUND");

    // Bob node still went through propose_node.
    const bobEntry = envelope.result.report.find(
      (r) => r.kind === "node" && r.ref === "nB"
    );
    expect(bobEntry?.status).toBe("accepted");
    expect(bobEntry?.node_id).toBe(BOB_NODE_ID);

    // Attribute cascaded — no propose_attribute call.
    const attrEntry = envelope.result.report.find(
      (r) => r.kind === "attribute"
    );
    expect(attrEntry?.status).toBe("dependency_failed");
    expect(attrEntry?.reason).toBe("nA");
    expect(proposeAttribute).not.toHaveBeenCalled();

    // Link cascaded — no propose_link call.
    const linkEntry = envelope.result.report.find((r) => r.kind === "link");
    expect(linkEntry?.status).toBe("dependency_failed");
    expect(linkEntry?.reason).toBe("nA");
    expect(proposeLink).not.toHaveBeenCalled();
  });

  it("cascade on missing fragment evidence_ref: link lands dependency_failed", async () => {
    // The cascade contract covers attributes AND links. A link whose
    // evidence_ref is not in the fragment map is skipped silently.
    const proposeFragment = vi.fn(async () => ({
      ok: false as const,
      error: {
        code: "STRUCTURAL_INVALID",
        message: "Fragment too long.",
      },
    }));
    const proposeNode = vi.fn(async () => ({
      ok: true as const,
      result: { node_id: ALICE_NODE_ID, resolution: "created_new" as const },
    }));
    const proposeLink = vi.fn();

    const { pool } = buildPool();
    const input: DirectedIngestionInput = {
      fragments: [
        // The fragment will fail at Zod / structural — there is no map entry.
        { ref: "fBad", text: "Some claim." },
      ],
      nodes: [
        { ref: "nA", node_type: "Person", name: "Alice" },
        { ref: "nB", node_type: "Person", name: "Bob" },
      ],
      links: [
        {
          source_ref: "nA",
          target_ref: "nB",
          link_type: "knows",
          evidence_ref: "fBad",
        },
      ],
    };

    const envelope = await directedIngestionService(input, {
      pool,
      logger,
      catalog: buildTestCatalog(),
      ingestRaw: buildIngestRaw(),
      proposeFragment,
      proposeNode,
      proposeAttribute: vi.fn(),
      proposeLink,
      verifyNodePin: async () => ({ kind: "ok" }),
    });

    expect(envelope.ok).toBe(true);
    if (!envelope.ok) return;
    const linkEntry = envelope.result.report.find((r) => r.kind === "link");
    expect(linkEntry?.status).toBe("dependency_failed");
    expect(linkEntry?.reason).toBe("fBad");
    expect(proposeLink).not.toHaveBeenCalled();
  });

  it("re-affirmation: two successive identical calls produce two distinct raw contents", async () => {
    // The per-call nonce (BR-34 step 2 / decision 3) guarantees a unique
    // content_hash per call. Otherwise the second call would hit
    // `noop_existing` and the orchestrator would never run propose-*.
    const contents: string[] = [];
    const ingestRaw = buildIngestRaw(contents);
    const proposeFragment = vi.fn(async () => ({
      ok: true as const,
      result: { fragment_id: FRAG_ALICE_ID, status: "proposed" as const },
    }));
    const proposeNode = vi.fn(async () => ({
      ok: true as const,
      // Re-affirmation surfaces as `matched_existing` on the second call.
      result: { node_id: ALICE_NODE_ID, resolution: "matched_existing" as const },
    }));

    const { pool } = buildPool();
    const payload: DirectedIngestionInput = {
      fragments: [{ ref: "f1", text: "Alice works on Project X." }],
      nodes: [{ ref: "n1", node_type: "Person", name: "Alice" }],
    };

    const a = await directedIngestionService(payload, {
      pool,
      logger,
      catalog: buildTestCatalog(),
      ingestRaw,
      proposeFragment,
      proposeNode,
      proposeAttribute: vi.fn(),
      proposeLink: vi.fn(),
      verifyNodePin: async () => ({ kind: "ok" }),
    });
    const b = await directedIngestionService(payload, {
      pool,
      logger,
      catalog: buildTestCatalog(),
      ingestRaw,
      proposeFragment,
      proposeNode,
      proposeAttribute: vi.fn(),
      proposeLink: vi.fn(),
      verifyNodePin: async () => ({ kind: "ok" }),
    });

    expect(a.ok && b.ok).toBe(true);
    expect(contents.length).toBe(2);
    expect(contents[0]).not.toBe(contents[1]);
  });

  it("structural failure: Zod parse error → VALIDATION_INVALID_FORMAT envelope; no intake, no dispatch", async () => {
    // A malformed payload never reaches intake — the orchestrator returns the
    // envelope synchronously, no `tool_call` rows due (no run exists yet).
    const ingestRaw = vi.fn();
    const proposeFragment = vi.fn();
    const { pool } = buildPool();

    const envelope = await directedIngestionService(
      // Missing required `fragments` array.
      { nodes: [] },
      {
        pool,
        logger,
        catalog: buildTestCatalog(),
        ingestRaw,
        proposeFragment,
        proposeNode: vi.fn(),
        proposeAttribute: vi.fn(),
        proposeLink: vi.fn(),
        verifyNodePin: async () => ({ kind: "ok" }),
      }
    );

    expect(envelope.ok).toBe(false);
    if (envelope.ok) return;
    expect(envelope.error.code).toBe("VALIDATION_INVALID_FORMAT");
    expect(ingestRaw).not.toHaveBeenCalled();
    expect(proposeFragment).not.toHaveBeenCalled();
  });

  it("affected_nodes: collected from propose-* envelopes; populated on result.run", async () => {
    // BR-33: every node touched by a `propose_*` ok:true envelope must surface
    // on `result.run.affected_nodes`. Empty list when no items contribute.
    const proposeFragment = vi.fn(async () => ({
      ok: true as const,
      result: { fragment_id: FRAG_ALICE_ID, status: "proposed" as const },
    }));
    const proposeNode = vi.fn(async (input: any) => {
      const id = input.name === "Alice" ? ALICE_NODE_ID : BOB_NODE_ID;
      return {
        ok: true as const,
        result: { node_id: id, resolution: "created_new" as const },
      };
    });

    const { pool } = buildPool({
      resolverRows: [
        {
          id: ALICE_NODE_ID,
          canonical_name: "Alice",
          node_type: "Person",
          status: "active",
          merged_into_node_id: null,
        },
        {
          id: BOB_NODE_ID,
          canonical_name: "Bob",
          node_type: "Person",
          status: "active",
          merged_into_node_id: null,
        },
      ],
    });

    const input: DirectedIngestionInput = {
      fragments: [{ ref: "f1", text: "Alice works." }],
      nodes: [
        { ref: "nA", node_type: "Person", name: "Alice" },
        { ref: "nB", node_type: "Person", name: "Bob" },
      ],
    };

    const envelope = await directedIngestionService(input, {
      pool,
      logger,
      catalog: buildTestCatalog(),
      ingestRaw: buildIngestRaw(),
      proposeFragment,
      proposeNode,
      proposeAttribute: vi.fn(),
      proposeLink: vi.fn(),
      verifyNodePin: async () => ({ kind: "ok" }),
    });

    expect(envelope.ok).toBe(true);
    if (!envelope.ok) return;

    expect(envelope.result.run.affected_nodes.length).toBe(2);
    const ids = envelope.result.run.affected_nodes.map((n) => n.id);
    expect(ids).toContain(ALICE_NODE_ID);
    expect(ids).toContain(BOB_NODE_ID);

    // Cache populated for the run id.
    const cached = getCachedAffectedNodes(RUN_ID);
    expect(cached?.length).toBe(2);
  });

  it("intake failure: orchestrator maps to SYSTEM_INTERNAL_ERROR envelope; no propose-* dispatched", async () => {
    // Step 2 — intake transaction failure must be caught and surfaced as a
    // clean envelope (BR-34 step 2). An uncaught throw would leak err.message
    // through the SDK kernel.
    const ingestRaw = vi.fn(async () => {
      throw new Error("simulated intake failure (not a pg-unavailable code)");
    });
    const proposeFragment = vi.fn();
    const { pool } = buildPool();

    const envelope = await directedIngestionService(
      {
        fragments: [{ ref: "f1", text: "x" }],
        nodes: [{ ref: "n1", node_type: "Person", name: "Alice" }],
      },
      {
        pool,
        logger,
        catalog: buildTestCatalog(),
        ingestRaw,
        proposeFragment,
        proposeNode: vi.fn(),
        proposeAttribute: vi.fn(),
        proposeLink: vi.fn(),
        verifyNodePin: async () => ({ kind: "ok" }),
      }
    );

    expect(envelope.ok).toBe(false);
    if (envelope.ok) return;
    expect(envelope.error.code).toBe("SYSTEM_INTERNAL_ERROR");
    expect(proposeFragment).not.toHaveBeenCalled();
  });

  it("forced confidence: dispatched propose_* args carry confidence=1.0 even when the caller payload has no confidence field", async () => {
    // BR-34 schema note — `confidence` is deliberately absent from every
    // directed item; the server forces 1.0 on dispatch. The test asserts this
    // by inspecting the actual args the orchestrator passes to each handler.
    const fragmentArgs: any[] = [];
    const attributeArgs: any[] = [];
    const linkArgs: any[] = [];
    const proposeFragment = vi.fn(async (input: any) => {
      fragmentArgs.push(input);
      return {
        ok: true as const,
        result: { fragment_id: FRAG_ALICE_ID, status: "proposed" as const },
      };
    });
    const proposeNode = vi.fn(async () => ({
      ok: true as const,
      result: { node_id: ALICE_NODE_ID, resolution: "created_new" as const },
    }));
    const proposeAttribute = vi.fn(async (input: any) => {
      attributeArgs.push(input);
      return {
        ok: true as const,
        result: { attribute_id: ATTR_OK_ID, outcome: "accepted" as const },
      };
    });
    const proposeLink = vi.fn(async (input: any) => {
      linkArgs.push(input);
      return {
        ok: true as const,
        result: { link_id: LINK_OK_ID, outcome: "accepted" as const },
      };
    });

    const { pool } = buildPool();
    const input: DirectedIngestionInput = {
      fragments: [{ ref: "f1", text: "Alice works." }],
      nodes: [
        { ref: "n1", node_type: "Person", name: "Alice" },
        { ref: "n2", node_type: "Person", name: "Bob" },
      ],
      attributes: [
        { node_ref: "n1", key: "age", value: 30, evidence_ref: "f1" },
      ],
      links: [
        {
          source_ref: "n1",
          target_ref: "n2",
          link_type: "knows",
          evidence_ref: "f1",
        },
      ],
    };
    await directedIngestionService(input, {
      pool,
      logger,
      catalog: buildTestCatalog(),
      ingestRaw: buildIngestRaw(),
      proposeFragment,
      proposeNode,
      proposeAttribute,
      proposeLink,
      verifyNodePin: async () => ({ kind: "ok" }),
    });

    expect(fragmentArgs[0].confidence).toBe(1.0);
    expect(attributeArgs[0].confidence).toBe(1.0);
    expect(linkArgs[0].confidence).toBe(1.0);
    // valid_from_basis defaults to 'stated' when caller omits it.
    expect(attributeArgs[0].valid_from_basis).toBe("stated");
    expect(linkArgs[0].valid_from_basis).toBe("stated");
  });
});
