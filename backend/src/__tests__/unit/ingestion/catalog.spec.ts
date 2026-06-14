// Unit tests for the ingestion catalog snapshot (BR-30 closed value domains).
//
// Scope: the additions of TC-02 — the `attributeValidValuesByKeyId` map on
// `CatalogSnapshot` and the `domainOf(snapshot, keyId)` helper. Pre-existing
// indexing of node_type / link_type / link_type_rule / attribute_key is
// already covered by `unit/knowledge-graph/catalog.spec.ts` (different
// catalog file with the same `buildSnapshot` shape).

import { describe, expect, it } from "vitest";

import {
  buildSnapshot,
  domainOf,
  type AttributeValidValueRow,
} from "../../../modules/ingestion/catalog/catalog.js";

const KEY_DOC_TYPE = "ak-doc-type-0000-0000-0000-000000000001";
const KEY_EVENT_TYPE = "ak-event-type-0000-0000-0000-000000000002";
const KEY_OPEN = "ak-open-0000-0000-0000-0000-000000000003";

describe("buildSnapshot — attributeValidValuesByKeyId (BR-30)", () => {
  it("returns an empty map when attributeValidValues is omitted (backward-compat)", () => {
    // BR-30: existing call sites that pre-date TC-02 must keep working —
    // the field is optional, and its absence collapses the closed-domain
    // semantics to "every key is open".
    const snap = buildSnapshot({
      nodeTypes: [],
      linkTypes: [],
      linkTypeRules: [],
      attributeKeys: [],
    });
    expect(snap.attributeValidValuesByKeyId.size).toBe(0);
  });

  it("groups rows by attribute_key_id into Sets", () => {
    // BR-30: each AttributeKey gets one Set of its allowed literal values.
    const rows: AttributeValidValueRow[] = [
      { attribute_key_id: KEY_DOC_TYPE, value: "proposta" },
      { attribute_key_id: KEY_DOC_TYPE, value: "ata" },
      { attribute_key_id: KEY_DOC_TYPE, value: "contrato" },
      { attribute_key_id: KEY_EVENT_TYPE, value: "reunião" },
      { attribute_key_id: KEY_EVENT_TYPE, value: "workshop" },
    ];
    const snap = buildSnapshot({
      nodeTypes: [],
      linkTypes: [],
      linkTypeRules: [],
      attributeKeys: [],
      attributeValidValues: rows,
    });
    expect(snap.attributeValidValuesByKeyId.size).toBe(2);
    expect(snap.attributeValidValuesByKeyId.get(KEY_DOC_TYPE)).toEqual(
      new Set(["proposta", "ata", "contrato"])
    );
    expect(snap.attributeValidValuesByKeyId.get(KEY_EVENT_TYPE)).toEqual(
      new Set(["reunião", "workshop"])
    );
  });

  it("deduplicates identical (attribute_key_id, value) pairs", () => {
    // The DB enforces UNIQUE(attribute_key_id, value) at the catalog level
    // (migration 0003), but the assembler is pure and must still cope with
    // duplicates passed by hand-built test fixtures.
    const snap = buildSnapshot({
      nodeTypes: [],
      linkTypes: [],
      linkTypeRules: [],
      attributeKeys: [],
      attributeValidValues: [
        { attribute_key_id: KEY_DOC_TYPE, value: "proposta" },
        { attribute_key_id: KEY_DOC_TYPE, value: "proposta" },
      ],
    });
    const bucket = snap.attributeValidValuesByKeyId.get(KEY_DOC_TYPE);
    expect(bucket?.size).toBe(1);
    expect(bucket?.has("proposta")).toBe(true);
  });

  it("preserves the exact diacritics of seeded values", () => {
    // §13 of v7 / §1 of ingestion.back.md: exact-match string equality in
    // v1 — no normalization. The Sets carry the bytes as inserted.
    const snap = buildSnapshot({
      nodeTypes: [],
      linkTypes: [],
      linkTypeRules: [],
      attributeKeys: [],
      attributeValidValues: [
        { attribute_key_id: KEY_DOC_TYPE, value: "relatório" },
        { attribute_key_id: KEY_EVENT_TYPE, value: "reunião" },
      ],
    });
    expect(snap.attributeValidValuesByKeyId.get(KEY_DOC_TYPE)?.has("relatório")).toBe(true);
    expect(snap.attributeValidValuesByKeyId.get(KEY_DOC_TYPE)?.has("relatorio")).toBe(false);
    expect(snap.attributeValidValuesByKeyId.get(KEY_EVENT_TYPE)?.has("reunião")).toBe(true);
    expect(snap.attributeValidValuesByKeyId.get(KEY_EVENT_TYPE)?.has("reuniao")).toBe(false);
  });
});

describe("domainOf — closed vs open domain (BR-30)", () => {
  it("returns null for a key with zero entries (open domain, backward-compatible)", () => {
    // BR-30 backward-compat clause: a key with no rows in
    // attribute_valid_value is open — the structural validator must NOT
    // reject any value on closed-domain grounds.
    const snap = buildSnapshot({
      nodeTypes: [],
      linkTypes: [],
      linkTypeRules: [],
      attributeKeys: [],
      attributeValidValues: [
        { attribute_key_id: KEY_DOC_TYPE, value: "proposta" },
      ],
    });
    expect(domainOf(snap, KEY_OPEN)).toBeNull();
  });

  it("returns null when there are no closed domains at all", () => {
    // Edge case: the snapshot was built without an attributeValidValues
    // argument (or with an empty array). Every domainOf() call must return
    // null. This is the state every legacy call site lands in until 0003
    // is applied and the BFF restarts.
    const snap = buildSnapshot({
      nodeTypes: [],
      linkTypes: [],
      linkTypeRules: [],
      attributeKeys: [],
    });
    expect(domainOf(snap, KEY_DOC_TYPE)).toBeNull();
    expect(domainOf(snap, KEY_EVENT_TYPE)).toBeNull();
  });

  it("returns the Set of allowed values for a closed key", () => {
    // BR-30: a key with >= 1 row in attribute_valid_value is closed; the
    // structural validator consults this Set and rejects any literal that
    // is not in it.
    const snap = buildSnapshot({
      nodeTypes: [],
      linkTypes: [],
      linkTypeRules: [],
      attributeKeys: [],
      attributeValidValues: [
        { attribute_key_id: KEY_DOC_TYPE, value: "proposta" },
        { attribute_key_id: KEY_DOC_TYPE, value: "ata" },
        { attribute_key_id: KEY_DOC_TYPE, value: "outro" },
      ],
    });
    const domain = domainOf(snap, KEY_DOC_TYPE);
    expect(domain).not.toBeNull();
    expect(domain).toEqual(new Set(["proposta", "ata", "outro"]));
    // Membership API is the consumer's contract.
    expect(domain?.has("proposta")).toBe(true);
    expect(domain?.has("Proposta")).toBe(false); // case-sensitive, no norm
    expect(domain?.has("desconhecido")).toBe(false);
  });

  it("isolates closed domains per key", () => {
    // Adding entries for one key must not leak into a different key's
    // domain — and an unrelated keyId remains open.
    const snap = buildSnapshot({
      nodeTypes: [],
      linkTypes: [],
      linkTypeRules: [],
      attributeKeys: [],
      attributeValidValues: [
        { attribute_key_id: KEY_DOC_TYPE, value: "proposta" },
        { attribute_key_id: KEY_EVENT_TYPE, value: "workshop" },
      ],
    });
    expect(domainOf(snap, KEY_DOC_TYPE)).toEqual(new Set(["proposta"]));
    expect(domainOf(snap, KEY_EVENT_TYPE)).toEqual(new Set(["workshop"]));
    expect(domainOf(snap, KEY_OPEN)).toBeNull();
  });

  it("is a pure read — does not mutate the snapshot", () => {
    // domainOf() must be safe to call repeatedly during request handling.
    // The snapshot is shared by every MCP session; mutation would be a
    // critical bug.
    const snap = buildSnapshot({
      nodeTypes: [],
      linkTypes: [],
      linkTypeRules: [],
      attributeKeys: [],
      attributeValidValues: [
        { attribute_key_id: KEY_DOC_TYPE, value: "proposta" },
      ],
    });
    const sizeBefore = snap.attributeValidValuesByKeyId.size;
    domainOf(snap, KEY_DOC_TYPE);
    domainOf(snap, KEY_OPEN);
    domainOf(snap, KEY_DOC_TYPE);
    expect(snap.attributeValidValuesByKeyId.size).toBe(sizeBefore);
    expect(snap.attributeValidValuesByKeyId.get(KEY_DOC_TYPE)?.size).toBe(1);
  });
});
