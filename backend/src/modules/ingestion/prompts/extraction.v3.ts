// Extraction prompt — version v3.
//
// v3 = v2 + an Event-classification directive (and a worked Event example).
//
// The gap v3 closes: v2 taught the model to DATE events (`event_date`), but
// never to CLASSIFY them (`event_type`), and v1's only worked example has no
// `Event` at all — so the model had zero few-shot signal for event extraction.
// In practice events whose kind fell outside the original closed
// `event_type` domain {reunião, go-live, workshop, outro} landed on `outro`
// with a lowered confidence (→ `uncertain`). Migration
// `0003_event_type_taxonomy.sql` widened that closed domain (cobrança,
// decisão, escalonamento, bloqueio, marco); this prompt teaches the model to
// USE it — pick the best-fitting catalog value, fall back to `outro` only
// when none fits (and then lower confidence so curation sees the gap), and
// resolve relative dates ("hoje"/"ontem"/…) against `document_date`.
//
// Composition: like v2 over v1, v3 appends a clearly-headed section to v2's
// SYSTEM prompt. The USER builder, MAX_TOKENS, the §13 anti-injection
// envelope and the catalog rendering are reused VERBATIM from v1 (via v2) —
// no duplication. The allowed `event_type` values are NOT hard-coded here:
// they are rendered from the live catalog by v1's `system()` (the
// `Event: event_type (text, values:[…])` line), so this directive stays
// correct as the taxonomy evolves by migration.
//
// Why a new version (not an in-place edit of v2): audit honesty — same
// rationale as v2 over v1. `llm_run.prompt_version` maps to the prompt that
// actually ran (registry in `./index.ts`), and `idempotency_key` (hash.ts)
// includes prompt_version, so a re-ingest under v3 yields a new, distinct run.

import type { CatalogSnapshot } from "../catalog/catalog.js";
import {
  MAX_TOKENS,
  user,
  type DocumentMetadata,
  type UserPromptArgs,
} from "./extraction.v1.js";
import { system as systemV2 } from "./extraction.v2.js";

/** Identifier — used by the registry (`./index.ts`) and logged per run. */
export const PROMPT_VERSION = "v3" as const;

export { MAX_TOKENS, user };
export type { DocumentMetadata, UserPromptArgs };

/**
 * The v3 delta over v2 — appended to v2's SYSTEM prompt. Named so the unit
 * test can assert its presence and a future v4 can compose further. Carries a
 * worked Event example inline (the missing few-shot signal). It references the
 * `event_type` values by behavior ("escolha do catálogo acima"), not by
 * literal list, so it never drifts from the migration-owned domain.
 */
export const EVENT_CLASSIFICATION_DIRECTIVE = [
  "",
  "## Events — classify the type and resolve relative dates",
  "- When you create an `Event`, ALSO propose the `event_type` attribute, picking",
  "  from the closed domain listed in the catalog above (the `Event: … event_type",
  "  (text, values:[…])` line) the value that best describes the occurrence (a",
  "  follow-up/chase, a decision, an escalation, a blocker, a milestone, a",
  "  meeting…). `event_type` is NOT temporal: it takes no `valid_from`.",
  "- Use `outro` ONLY when NO domain value fits — and, in that case, LOWER the",
  "  confidence (≤ 0.74) to flag a possible catalog gap to curation. Do not force",
  "  a value that does not describe the fact.",
  "- RELATIVE DATES in the text (\"hoje\", \"ontem\", \"amanhã\", \"semana que vem\")",
  "  resolve against `document_date`: `event_date` (the VALUE) gets the computed",
  "  date and `valid_from_basis`=\"document\". With no known `document_date`, omit",
  "  the date (the backend records `received`). NEVER invent a date.",
  "",
  "### Example (Event) — use the REAL catalog above; document_date 2026-06-17",
  'Chunk: "Hoje cobrei o Caio no grupo do WhatsApp sobre os prazos dos chamados N3."',
  '  propose_fragment {text:"Hoje cobrei o Caio no grupo do WhatsApp sobre os prazos dos chamados N3.", confidence:0.9} -> F1',
  '  propose_node {node_type:"Event", name:"Cobrança ao Caio sobre prazos dos chamados N3"} -> E',
  '  propose_node {node_type:"Person", name:"Caio"}                              -> C',
  '  propose_attribute {node_id:E, key:"event_type", value:"cobrança",',
  "    confidence:0.85, fragment_ids:[F1]}   // no valid_from — event_type is not temporal",
  '  propose_attribute {node_id:E, key:"event_date", value:"2026-06-17",',
  '    confidence:0.9, fragment_ids:[F1], valid_from:"2026-06-17", valid_from_basis:"document"}',
  '  propose_link {source_node_id:C, link_type:"participates_in", target_node_id:E,',
  '    confidence:0.9, fragment_ids:[F1], valid_from:"2026-06-17", valid_from_basis:"document"}',
  "  then end_turn.",
].join("\n");

/** v2 SYSTEM prompt + the Event-classification directive (v3 delta). */
export function system(catalog: CatalogSnapshot): string {
  return `${systemV2(catalog)}\n${EVENT_CLASSIFICATION_DIRECTIVE}`;
}
