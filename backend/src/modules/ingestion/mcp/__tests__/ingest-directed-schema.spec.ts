// Unit tests for the MCP-facing `ingest_directed` schema + tool description
// (BR-34 of `ingestion.back.md`, v1.4.1).
//
// The schema is the public contract advertised by `tools/list` for the
// `ingest_directed` tool — these tests pin its shape so a future refactor
// cannot quietly:
//   - drop the BR-34 ban on a client-supplied `confidence` field
//     (the server forces `confidence = 1.0`; allowing a caller value would
//     break the "directed payload is a stated fact by construction" guarantee),
//   - drop the BR-22 1000-char ceiling on `fragments[].text`,
//     (the propose_fragment service rejects oversize text downstream, but the
//     boundary belongs at the tool surface so the LLM gets a precise schema
//     error rather than a deep validation rejection),
//   - drop the BR-34 minimum cardinality (≥1 fragment, ≥1 node) — the
//     orchestrator's dispatch maps `ref->fragment_id` / `ref->node_id` are
//     populated by these arrays; an empty array is meaningless.
//
// Each `it()` references the BR / TC clause the test guards.

import { describe, expect, it } from "vitest";
import { z } from "zod";

import {
  IngestDirectedMcpInputSchema,
  type IngestDirectedMcpInput,
} from "../mcp-schemas.js";
import { IngestToolDescriptions } from "../../dto/index.js";

describe("IngestDirectedMcpInputSchema (BR-34 schema contract)", () => {
  // ------------------------------------------------------------------
  // Happy path — TC-02 validation criterion #1.
  // ------------------------------------------------------------------

  it("accepts the minimal payload (one fragment + one node)", () => {
    // BR-34: ≥1 fragment AND ≥1 node are mandatory; everything else optional.
    const minimal: IngestDirectedMcpInput = {
      fragments: [{ ref: "f1", text: "test" }],
      nodes: [{ ref: "n1", node_type: "Person", name: "Test" }],
    };
    expect(() => IngestDirectedMcpInputSchema.parse(minimal)).not.toThrow();
  });

  it("accepts the full payload (fragments + nodes + attributes + links + source_label + pin)", () => {
    // BR-34 — exhaustive shape; pins (`node_id`) skip BR-25 resolution.
    const full = {
      fragments: [{ ref: "f1", text: "Alice joined Project Apollo on 2024-03-15." }],
      nodes: [
        { ref: "n_alice", node_type: "Person", name: "Alice", aliases: ["A."] },
        {
          ref: "n_apollo",
          node_type: "Project",
          name: "Apollo",
          node_id: "00000000-0000-4000-8000-000000000001",
        },
      ],
      attributes: [
        {
          node_ref: "n_apollo",
          key: "status",
          value: "active",
          evidence_ref: "f1",
          valid_from: "2024-03-15",
          valid_from_basis: "stated",
        },
      ],
      links: [
        {
          source_ref: "n_alice",
          target_ref: "n_apollo",
          link_type: "works_on",
          evidence_ref: "f1",
          valid_from: "2024-03-15",
          valid_from_basis: "stated",
        },
      ],
      source_label: "chat-turn-42",
    } satisfies IngestDirectedMcpInput;
    expect(() => IngestDirectedMcpInputSchema.parse(full)).not.toThrow();
  });

  // ------------------------------------------------------------------
  // Boundary rejections — TC-02 validation criteria #2 and #3.
  // ------------------------------------------------------------------

  it("rejects fragments[].text exceeding 1000 characters (BR-22 ceiling)", () => {
    // BR-22 mirror — the directed schema enforces the same 1000-char cap as
    // `propose_fragment` so the LLM gets a precise schema error at the tool
    // surface (rather than a downstream rejection from the service layer).
    const oversize = "x".repeat(1001);
    const payload = {
      fragments: [{ ref: "f1", text: oversize }],
      nodes: [{ ref: "n1", node_type: "Person", name: "Test" }],
    };
    const result = IngestDirectedMcpInputSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join("."));
      expect(paths).toContain("fragments.0.text");
    }
  });

  it("rejects a payload with no fragments array", () => {
    // BR-34: `fragments` is REQUIRED with min length 1. Omitting it must fail
    // (not silently treated as empty) — the orchestrator's `ref -> fragment_id`
    // map is built from this array; an absent array is meaningless and would
    // cascade every attribute/link.
    const payload = {
      nodes: [{ ref: "n1", node_type: "Person", name: "Test" }],
    };
    expect(IngestDirectedMcpInputSchema.safeParse(payload).success).toBe(false);
  });

  it("rejects an empty fragments array (BR-34: ≥1 required)", () => {
    const payload = {
      fragments: [],
      nodes: [{ ref: "n1", node_type: "Person", name: "Test" }],
    };
    expect(IngestDirectedMcpInputSchema.safeParse(payload).success).toBe(false);
  });

  it("rejects an empty nodes array (BR-34: ≥1 required)", () => {
    const payload = {
      fragments: [{ ref: "f1", text: "test" }],
      nodes: [],
    };
    expect(IngestDirectedMcpInputSchema.safeParse(payload).success).toBe(false);
  });

  // ------------------------------------------------------------------
  // The `confidence` ban — TC-02 validation criterion #4 + BR-34 decision (ii).
  // ------------------------------------------------------------------

  it("does not declare a `confidence` property anywhere in the JSON Schema", () => {
    // BR-34 decision (ii): the server forces `confidence = 1.0` on every
    // dispatched `propose_*` call. Exposing `confidence` in the schema would
    // let a caller advertise a lower confidence and rely on it being honoured
    // — which it never is. The field is absent BY DESIGN. This test walks the
    // emitted JSON Schema tree (z.toJSONSchema is the BR-24 derivation site
    // for the Anthropic `input_schema`) and asserts no node carries the key.
    const jsonSchema = z.toJSONSchema(IngestDirectedMcpInputSchema);
    const serialized = JSON.stringify(jsonSchema);
    expect(serialized).not.toMatch(/"confidence"/);
  });

  it("strips a caller-supplied `confidence` field at parse (Zod strip default)", () => {
    // Defence in depth: even if some future refactor accidentally relaxes the
    // schema, the parsed object must not surface a `confidence` field to the
    // downstream orchestrator — the orchestrator never reads one, but a
    // `confidence` on the parsed payload would create a misleading audit
    // trail. Zod's default strip behaviour drops unknown keys; this test pins
    // that default for the directed surface.
    const payload = {
      fragments: [{ ref: "f1", text: "test", confidence: 0.42 }],
      nodes: [{ ref: "n1", node_type: "Person", name: "Test", confidence: 0.1 }],
    };
    const parsed = IngestDirectedMcpInputSchema.parse(payload);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((parsed.fragments[0] as any).confidence).toBeUndefined();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((parsed.nodes[0] as any).confidence).toBeUndefined();
  });

  // ------------------------------------------------------------------
  // BR-16: `valid_from_basis` is the PUBLIC enum only (no 'received').
  // ------------------------------------------------------------------

  it("rejects valid_from_basis = 'received' (server-internal fallback per BR-16)", () => {
    // BR-16 of `ingestion.spec.md` §4: the `'received'` fallback is server-
    // internal — only `'stated' | 'document'` are accepted from callers.
    const payload = {
      fragments: [{ ref: "f1", text: "t" }],
      nodes: [{ ref: "n1", node_type: "Person", name: "X" }],
      attributes: [
        {
          node_ref: "n1",
          key: "status",
          value: "active",
          evidence_ref: "f1",
          valid_from: "2024-01-01",
          valid_from_basis: "received",
        },
      ],
    };
    expect(IngestDirectedMcpInputSchema.safeParse(payload).success).toBe(false);
  });

  // ------------------------------------------------------------------
  // `node_id` pin shape — BR-34: optional UUID, never a free string.
  // ------------------------------------------------------------------

  it("rejects a non-UUID `node_id` pin (BR-34 pin path expects a UUID)", () => {
    const payload = {
      fragments: [{ ref: "f1", text: "t" }],
      nodes: [
        { ref: "n1", node_type: "Person", name: "X", node_id: "not-a-uuid" },
      ],
    };
    expect(IngestDirectedMcpInputSchema.safeParse(payload).success).toBe(false);
  });

  it("accepts node items without a `node_id` (normal BR-25 resolution path)", () => {
    // The default (no pin) goes through the trigram resolver — the schema
    // must not require `node_id`.
    const payload = {
      fragments: [{ ref: "f1", text: "t" }],
      nodes: [{ ref: "n1", node_type: "Person", name: "X" }],
    };
    expect(IngestDirectedMcpInputSchema.safeParse(payload).success).toBe(true);
  });

  // ------------------------------------------------------------------
  // INGEST_TOOL_NAMES enum boundary (TC-02 constraint).
  // ------------------------------------------------------------------

  it("`ingest_directed` is NOT a member of the propose_* audit enum", async () => {
    // TC-02 constraint + BR-31 clarification: INGEST_TOOL_NAMES is the audit
    // surface of the four per-proposal writers (`propose_*`). `ingest_directed`
    // is an orchestrator that ITSELF dispatches `propose_*` calls — its own
    // invocation writes no top-level `tool_call` row, exactly like
    // `ingest_document` and `start_async_ingestion`. Adding it to the enum
    // would be a category error.
    const { INGEST_TOOL_NAMES } = await import("../mcp-schemas.js");
    expect(INGEST_TOOL_NAMES).not.toContain("ingest_directed");
  });
});

describe("IngestToolDescriptions.ingest_directed (TC-02 validation criterion #5)", () => {
  it("exists and is a non-empty string", () => {
    expect(typeof IngestToolDescriptions.ingest_directed).toBe("string");
    expect(IngestToolDescriptions.ingest_directed.length).toBeGreaterThan(0);
  });

  it("mentions the deterministic intent (no LLM extraction)", () => {
    // The description is the LLM's primary signal for WHEN to pick this tool
    // versus `ingest_document` (which DOES extract via LLM). The contrast
    // must be visible in the text.
    const text = IngestToolDescriptions.ingest_directed;
    expect(text.toLowerCase()).toMatch(/no\s+llm|deterministic/);
  });
});
