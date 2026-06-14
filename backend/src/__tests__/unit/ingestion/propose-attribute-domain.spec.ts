// TC-03 — Closed-domain gate wiring on `propose_attribute` (BR-30).
//
// Verifies that `proposeAttributeService` invokes `assertValueInDomain`
// IMMEDIATELY after `parseAttributeValue` and BEFORE any subsequent layer:
//
//   1. Zod parse (BR-24)               ← handled at transport edge
//   2. parseAttributeValue (BR-13)     ← canonical typed value
//   3. assertValueInDomain (BR-30)     ← NEW: closed-domain gate ← this file
//   4. Graph-rule layer (BR-15)
//   5. Temporal layer (BR-16)
//   6. Confidence layer (BR-17)
//   7. Anti-hallucination layer (BR-18)
//
// Strategy: drive `proposeAttributeService` with a mocked PoolClient that
// (a) records every SQL query in order and (b) lets us inject the catalog
// snapshot directly. The catalog snapshot is the only knob we need to
// flip between "open domain" (legacy backward-compat) and "closed domain"
// (BR-30 enforcement).
//
// Three behaviours under test:
//
//   1. Closed domain, in-domain value → accepted (no rejection at structural).
//   2. Closed domain, out-of-domain value → STRUCTURAL_INVALID with
//      `{ value, allowed_values }`; downstream queries (fragment fetch,
//      anti-hallucination count, INSERTs) are NOT issued (call-order proof).
//   3. Open domain (`domainOf` returns null) → no-op; the service proceeds
//      as if the helper did not exist.

import { describe, expect, it } from "vitest";

import {
  buildSnapshot,
  type CatalogSnapshot,
} from "../../../modules/ingestion/catalog/catalog.js";
import { proposeAttributeService } from "../../../modules/ingestion/service/propose-attribute.service.js";
import {
  isValidationFailure,
  ValidationFailure,
} from "../../../modules/ingestion/validation/errors.js";

// ----- Fixed ids -----
const NODE_TYPE_DOCUMENT = "00000000-0000-0000-0000-000000000003";
const ATTR_KEY_DOC_TYPE = "00000000-0000-0000-0000-000000000030";
const ATTR_KEY_TITLE = "00000000-0000-0000-0000-000000000031";

const RUN_ID = "44444444-4444-4444-4444-444444444444";
const RAW_INFO_ID = "55555555-5555-4555-8555-555555555555";
const NODE_ID = "11111111-1111-4111-8111-111111111111";
const FRAGMENT_ID = "33333333-3333-4333-8333-333333333333";

const runCtx = { llmRunId: RUN_ID, rawInformationId: RAW_INFO_ID };

// ----- Catalog builders -----
// Closed domain for `doc_type` (BR-30): {ata, contrato, outro, proposta,
// relatório}. `title` is an open-domain key with no rows in
// attribute_valid_value.
function buildCatalogWithClosedDocType(): CatalogSnapshot {
  return buildSnapshot({
    nodeTypes: [{ id: NODE_TYPE_DOCUMENT, name: "Document" }],
    linkTypes: [],
    linkTypeRules: [],
    attributeKeys: [
      {
        id: ATTR_KEY_DOC_TYPE,
        node_type_id: NODE_TYPE_DOCUMENT,
        key: "doc_type",
        value_type: "text",
        is_temporal: false,
        allows_multiple_current: false,
        requires_valid_from: false,
      },
      {
        id: ATTR_KEY_TITLE,
        node_type_id: NODE_TYPE_DOCUMENT,
        key: "title",
        value_type: "text",
        is_temporal: false,
        allows_multiple_current: false,
        requires_valid_from: false,
      },
    ],
    attributeValidValues: [
      { attribute_key_id: ATTR_KEY_DOC_TYPE, value: "ata" },
      { attribute_key_id: ATTR_KEY_DOC_TYPE, value: "contrato" },
      { attribute_key_id: ATTR_KEY_DOC_TYPE, value: "outro" },
      { attribute_key_id: ATTR_KEY_DOC_TYPE, value: "proposta" },
      { attribute_key_id: ATTR_KEY_DOC_TYPE, value: "relatório" },
      // `title` deliberately has no rows → open domain.
    ],
  });
}

// ----- Mock client -----
//
// Returns canned responses for the queries `proposeAttributeService`
// issues. The configurable knob is `nodeTypeBy` (default: NODE_ID →
// NODE_TYPE_DOCUMENT). The mock also records EVERY SQL statement so we
// can assert call-ordering invariants.
function buildClient() {
  const sql: string[] = [];
  const inserts: { node_attribute: number; provenance: number } = {
    node_attribute: 0,
    provenance: 0,
  };
  let nextAttrId = 1;
  const client = {
    query: async (...args: unknown[]) => {
      const s = String(args[0]).replace(/\s+/g, " ").trim();
      const params = (args[1] as unknown[]) ?? [];
      sql.push(s);
      // Tx control / savepoints — pass-through.
      if (s === "BEGIN" || s === "COMMIT" || s === "ROLLBACK") {
        return { rows: [], rowCount: 0 };
      }
      if (/^SAVEPOINT /i.test(s) || /^RELEASE SAVEPOINT/i.test(s) || /^ROLLBACK TO SAVEPOINT/i.test(s)) {
        return { rows: [], rowCount: 0 };
      }
      // findNodeTypeIdByNodeId
      if (s.startsWith("SELECT node_type_id FROM knowledge_node")) {
        const id = String(params[0]);
        if (id === NODE_ID) {
          return { rows: [{ node_type_id: NODE_TYPE_DOCUMENT }], rowCount: 1 };
        }
        return { rows: [], rowCount: 0 };
      }
      // information_fragment fetch
      if (s.includes("FROM information_fragment WHERE id = ANY")) {
        const ids = (params[0] as string[]) ?? [];
        return {
          rows: ids.map((id) => ({ id, text: "trecho", llm_run_id: RUN_ID })),
          rowCount: ids.length,
        };
      }
      // metadata->>'document_date'
      if (s.startsWith("SELECT (metadata->>'document_date')")) {
        return { rows: [{ document_date: null, received_at: null }], rowCount: 1 };
      }
      // anti-hallucination count
      if (s.includes("count(DISTINCT f.id)::text AS n")) {
        return { rows: [{ n: "1" }], rowCount: 1 };
      }
      // FOR UPDATE on node_attribute — no vigent row in this test.
      if (
        s.startsWith("SELECT id, node_id, attribute_key_id, value,") &&
        s.includes("FROM node_attribute") &&
        s.includes("FOR UPDATE")
      ) {
        return { rows: [], rowCount: 0 };
      }
      // INSERT node_attribute
      if (s.startsWith("INSERT INTO node_attribute")) {
        inserts.node_attribute += 1;
        return { rows: [{ id: `attr-${nextAttrId++}` }], rowCount: 1 };
      }
      // INSERT provenance
      if (s.startsWith("INSERT INTO provenance")) {
        inserts.provenance += 1;
        return { rows: [], rowCount: 1 };
      }
      return { rows: [], rowCount: 0 };
    },
    release: () => undefined,
  } as unknown as import("pg").PoolClient;
  return { client, sql, inserts };
}

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
  node_id: NODE_ID,
  key: "doc_type",
  value: "proposta",
  confidence: 0.9,
  fragment_ids: [FRAGMENT_ID],
  change_hint: "none" as const,
  ...overrides,
});

describe("TC-03 / BR-30 — proposeAttributeService closed-domain wiring", () => {
  it("accepts an in-domain value (closed domain, value present in set)", async () => {
    const catalog = buildCatalogWithClosedDocType();
    const { client, inserts } = buildClient();
    const envelope = await proposeAttributeService(
      client,
      baseAttrArgs({ value: "proposta" }),
      runCtx,
      { catalog, now: () => new Date("2026-06-14T12:00:00Z") }
    );
    expect(envelope.ok).toBe(true);
    if (envelope.ok) {
      expect(envelope.result.outcome).toBe("accepted");
    }
    expect(inserts.node_attribute).toBe(1);
    expect(inserts.provenance).toBe(1);
  });

  it("rejects an out-of-domain value with STRUCTURAL_INVALID + {value, allowed_values}", async () => {
    const catalog = buildCatalogWithClosedDocType();
    const { client, sql, inserts } = buildClient();
    let caught: unknown = null;
    try {
      await proposeAttributeService(
        client,
        baseAttrArgs({ value: "PROPOSAL" }), // out-of-domain (case mismatch)
        runCtx,
        { catalog, now: () => new Date("2026-06-14T12:00:00Z") }
      );
    } catch (e) {
      caught = e;
    }
    expect(isValidationFailure(caught)).toBe(true);
    const vf = caught as ValidationFailure;
    expect(vf.code).toBe("STRUCTURAL_INVALID");
    expect(vf.message).toBe("attribute value not in closed domain");
    expect(vf.details.value).toBe("PROPOSAL");
    expect(vf.details.allowed_values).toEqual([
      "ata",
      "contrato",
      "outro",
      "proposta",
      "relatório",
    ]);
    // Call-order proof: the rejection fires at structural layer, BEFORE
    // the fragment fetch (layer 1 continuation), the anti-hallucination
    // count (layer 5), or any INSERT. Only the node_type_id lookup
    // (which precedes parseAttributeValue) is expected to have run.
    expect(sql.some((s) => s.startsWith("SELECT node_type_id FROM knowledge_node"))).toBe(true);
    expect(sql.some((s) => s.includes("FROM information_fragment WHERE id = ANY"))).toBe(false);
    expect(sql.some((s) => s.includes("count(DISTINCT f.id)"))).toBe(false);
    expect(sql.some((s) => s.startsWith("INSERT INTO node_attribute"))).toBe(false);
    expect(inserts.node_attribute).toBe(0);
    expect(inserts.provenance).toBe(0);
  });

  it("is a no-op on an OPEN domain — `title` has zero rows in attribute_valid_value", async () => {
    const catalog = buildCatalogWithClosedDocType();
    const { client, inserts } = buildClient();
    // `title` is in the catalog but has no rows in attribute_valid_value
    // → open domain. Any literal that parses against value_type='text'
    // must be accepted.
    const envelope = await proposeAttributeService(
      client,
      baseAttrArgs({
        key: "title",
        value: "an arbitrary title the LLM produced",
      }),
      runCtx,
      { catalog, now: () => new Date("2026-06-14T12:00:00Z") }
    );
    expect(envelope.ok).toBe(true);
    if (envelope.ok) {
      expect(envelope.result.outcome).toBe("accepted");
    }
    expect(inserts.node_attribute).toBe(1);
    expect(inserts.provenance).toBe(1);
  });
});
