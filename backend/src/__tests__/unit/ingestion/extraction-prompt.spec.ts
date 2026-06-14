// Unit tests for the extraction system-prompt builder (TC-05 / BR-30 prompt support).
//
// Scope: the additions of TC-05 — the `system(catalog)` function in
// `backend/src/modules/ingestion/prompts/extraction.v1.ts` now appends the
// sorted allowed values for closed-domain AttributeKeys (catalog-driven, via
// `domainOf`) and leaves open-domain keys unchanged. This file does NOT
// re-cover the catalog snapshot itself (see `catalog.spec.ts`) or any other
// section of the system prompt; it asserts only the lines emitted under the
// `### AttributeKey by NodeType:` header.
//
// Spec references:
//   - `docs/specs/domains/ingestion/back/ingestion.back.md` §1 Prompt builder
//     row (v1.3.0) — format example: `doc_type (text, values: ["ata",
//     "contrato","outro","proposta","relatório"])`; order is `[...set].sort()`
//     (default locale, deterministic).
//   - Open-domain key: line unchanged from v1.2.0 (`key (value_type[,
//     temporal])`); no `values:` suffix.
//   - Closed-domain check is runtime-only (`assertValueInDomain`, TC-03); the
//     prompt is a hint, not a contract.

import { describe, expect, it } from "vitest";

import {
  buildSnapshot,
  type AttributeKeyRow,
  type AttributeValidValueRow,
  type NodeTypeRow,
} from "../../../modules/ingestion/catalog/catalog.js";
import { system } from "../../../modules/ingestion/prompts/extraction.v1.js";

// --- Fixture ids (UUID-shaped strings; the prompt builder treats them as
// opaque, so the exact format is irrelevant — only stability matters). ----

const NT_DOCUMENT = "nt-document-0000-0000-0000-000000000001";
const NT_EVENT = "nt-event-0000-0000-0000-0000-000000000002";
const NT_PROJECT = "nt-project-0000-0000-0000-000000000003";

const AK_DOC_TYPE = "ak-doc-type-0000-0000-0000-000000000010";
const AK_EVENT_TYPE = "ak-event-type-0000-0000-0000-000000000011";
const AK_DEADLINE = "ak-deadline-0000-0000-0000-000000000012"; // open domain
const AK_TITLE = "ak-title-0000-0000-0000-0000-000000000013"; // open domain

const nodeTypes: NodeTypeRow[] = [
  { id: NT_DOCUMENT, name: "Document", description: "a document" },
  { id: NT_EVENT, name: "Event", description: "an event" },
  { id: NT_PROJECT, name: "Project", description: "a project" },
];

const attributeKeys: AttributeKeyRow[] = [
  {
    id: AK_DOC_TYPE,
    node_type_id: NT_DOCUMENT,
    key: "doc_type",
    value_type: "text",
    is_temporal: false,
    allows_multiple_current: false,
    requires_valid_from: false,
  },
  {
    id: AK_TITLE,
    node_type_id: NT_DOCUMENT,
    key: "title",
    value_type: "text",
    is_temporal: false,
    allows_multiple_current: false,
    requires_valid_from: false,
  },
  {
    id: AK_EVENT_TYPE,
    node_type_id: NT_EVENT,
    key: "event_type",
    value_type: "text",
    is_temporal: false,
    allows_multiple_current: false,
    requires_valid_from: false,
  },
  {
    id: AK_DEADLINE,
    node_type_id: NT_PROJECT,
    key: "deadline",
    value_type: "date",
    is_temporal: true,
    allows_multiple_current: false,
    requires_valid_from: true,
  },
];

/** Extract the line under `### AttributeKey by NodeType:` for `nodeTypeName`. */
function attributeLineFor(prompt: string, nodeTypeName: string): string {
  const lines = prompt.split("\n");
  const header = "### AttributeKey by NodeType:";
  const headerIdx = lines.indexOf(header);
  expect(headerIdx).toBeGreaterThan(-1);
  // The block ends at the next blank line.
  const blockEnd = lines.indexOf("", headerIdx);
  expect(blockEnd).toBeGreaterThan(headerIdx);
  const prefix = `  - ${nodeTypeName}: `;
  const hit = lines
    .slice(headerIdx + 1, blockEnd)
    .find((l) => l.startsWith(prefix));
  expect(hit, `no AttributeKey line for NodeType "${nodeTypeName}"`).toBeDefined();
  return (hit as string).slice(prefix.length);
}

describe("extraction.v1 system() — AttributeKey closed-domain values (TC-05 / BR-30)", () => {
  it("appends the sorted allowed values for a closed-domain key (doc_type)", () => {
    // BR-30 prompt support: `domainOf(catalog, AK_DOC_TYPE)` returns a
    // non-null Set, so the line for `doc_type` carries `values: [...]` in
    // deterministic lexicographic order. The spec quotes this exact format.
    const validValues: AttributeValidValueRow[] = [
      // Insertion order deliberately scrambled — the prompt MUST sort.
      { attribute_key_id: AK_DOC_TYPE, value: "relatório" },
      { attribute_key_id: AK_DOC_TYPE, value: "ata" },
      { attribute_key_id: AK_DOC_TYPE, value: "proposta" },
      { attribute_key_id: AK_DOC_TYPE, value: "outro" },
      { attribute_key_id: AK_DOC_TYPE, value: "contrato" },
    ];
    const snap = buildSnapshot({
      nodeTypes,
      linkTypes: [],
      linkTypeRules: [],
      attributeKeys,
      attributeValidValues: validValues,
    });
    const prompt = system(snap);
    const documentLine = attributeLineFor(prompt, "Document");
    // `title` is open-domain (no rows for AK_TITLE), so it appears as-is;
    // `doc_type` is closed-domain. AttributeKey lines per NodeType are
    // sorted alphabetically, so `doc_type` comes before `title`.
    expect(documentLine).toBe(
      'doc_type (text, values: ["ata","contrato","outro","proposta","relatório"]), title (text)'
    );
  });

  it("appends the sorted allowed values for a closed-domain key (event_type)", () => {
    // Same as above, on a different NodeType — proves the suffix is
    // applied per-key, not globally.
    const validValues: AttributeValidValueRow[] = [
      { attribute_key_id: AK_EVENT_TYPE, value: "workshop" },
      { attribute_key_id: AK_EVENT_TYPE, value: "reunião" },
      { attribute_key_id: AK_EVENT_TYPE, value: "decisão" },
    ];
    const snap = buildSnapshot({
      nodeTypes,
      linkTypes: [],
      linkTypeRules: [],
      attributeKeys,
      attributeValidValues: validValues,
    });
    const prompt = system(snap);
    const eventLine = attributeLineFor(prompt, "Event");
    expect(eventLine).toBe(
      'event_type (text, values: ["decisão","reunião","workshop"])'
    );
  });

  it("omits the values: suffix for an open-domain key (deadline)", () => {
    // BR-30 backward-compat clause: a key with no rows in
    // attribute_valid_value (`domainOf` returns null) MUST print without
    // any `values:` suffix — bit-identical to the v1.2.0 format. The
    // temporal flag still surfaces.
    const snap = buildSnapshot({
      nodeTypes,
      linkTypes: [],
      linkTypeRules: [],
      attributeKeys,
      attributeValidValues: [
        // Close `doc_type` but leave `deadline` and `title` open.
        { attribute_key_id: AK_DOC_TYPE, value: "ata" },
      ],
    });
    const prompt = system(snap);
    const projectLine = attributeLineFor(prompt, "Project");
    // `deadline` is the only key on Project, open-domain, temporal.
    expect(projectLine).toBe("deadline (date, temporal)");
    // Defensive: no `values:` substring anywhere in the Project line.
    expect(projectLine.includes("values:")).toBe(false);
  });

  it("omits the values: suffix when the snapshot has no closed domains at all", () => {
    // Edge case — the buildSnapshot call predates `0003_attribute_valid_value`
    // (or every closed key has been emptied by a future migration). Every
    // line MUST collapse to the legacy `key (value_type[, temporal])` shape.
    const snap = buildSnapshot({
      nodeTypes,
      linkTypes: [],
      linkTypeRules: [],
      attributeKeys,
      // attributeValidValues deliberately omitted — exercises the
      // "no closed domains" branch.
    });
    const prompt = system(snap);
    expect(attributeLineFor(prompt, "Document")).toBe(
      "doc_type (text), title (text)"
    );
    expect(attributeLineFor(prompt, "Event")).toBe("event_type (text)");
    expect(attributeLineFor(prompt, "Project")).toBe("deadline (date, temporal)");
    // Defensive: `values:` never appears in the AttributeKey block at all.
    const headerIdx = prompt.split("\n").indexOf("### AttributeKey by NodeType:");
    const blockEnd = prompt.split("\n").indexOf("", headerIdx);
    const block = prompt
      .split("\n")
      .slice(headerIdx + 1, blockEnd)
      .join("\n");
    expect(block.includes("values:")).toBe(false);
  });

  it("sorts allowed values lexicographically by default Array.prototype.sort", () => {
    // Spec: `[...set].sort()` — locale-default sort is acceptable. Insertion
    // order in the catalog row array MUST NOT influence the prompt output;
    // this is what keeps the prompt byte-identical across boots / migrations
    // that re-seed the same domain.
    const validValues: AttributeValidValueRow[] = [
      { attribute_key_id: AK_DOC_TYPE, value: "zeta" },
      { attribute_key_id: AK_DOC_TYPE, value: "alpha" },
      { attribute_key_id: AK_DOC_TYPE, value: "mu" },
    ];
    const snap = buildSnapshot({
      nodeTypes,
      linkTypes: [],
      linkTypeRules: [],
      attributeKeys,
      attributeValidValues: validValues,
    });
    const prompt = system(snap);
    const documentLine = attributeLineFor(prompt, "Document");
    // `doc_type` comes before `title` (alphabetic AttributeKey-name sort).
    expect(documentLine).toBe(
      'doc_type (text, values: ["alpha","mu","zeta"]), title (text)'
    );
  });

  it("preserves diacritics inside the values: array (no JSON unicode-escape collateral)", () => {
    // `JSON.stringify("relatório")` returns `"\"relatório\""` — the
    // diacritic is preserved in the surface string (browsers and the
    // Anthropic API both accept UTF-8 here). The LLM sees the canonical
    // literal, matching what `assertValueInDomain` will compare against
    // at validation time (exact-match, no normalisation; BR-30 v1).
    const snap = buildSnapshot({
      nodeTypes,
      linkTypes: [],
      linkTypeRules: [],
      attributeKeys,
      attributeValidValues: [
        { attribute_key_id: AK_DOC_TYPE, value: "relatório" },
      ],
    });
    const prompt = system(snap);
    const documentLine = attributeLineFor(prompt, "Document");
    expect(documentLine).toContain('"relatório"');
    expect(documentLine.includes("\\u00f3")).toBe(false);
  });
});
