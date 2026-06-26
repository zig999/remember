// Extraction prompt — version v4 (BR-26 step 5a v1.4.2).
//
// v4 = v3 + an explicit `received_at` fallback anchor for relative-date
// resolution. The gap v4 closes: v3 told the model to resolve relative dates
// ("hoje", "ontem", "amanhã", "semana que vem") against `document_date`, and
// to OMIT the date when `document_date` is unknown. But the user prompt also
// surfaces `received_at` (the canonical intake timestamp set at UC-01) — and
// ingestion.back.md BR-26 step 5a v1.4.2 names that field the canonical
// date-anchor when the document is silent. v4 teaches the model to use it as
// the FALLBACK anchor: resolve against `document_date` when present, against
// `received_at` otherwise. No DTO change, no orchestrator change — the
// metadata block already includes both fields.
//
// Composition: like v3 over v2 and v2 over v1, v4 appends a clearly-headed
// section to v3's SYSTEM prompt. The USER builder, MAX_TOKENS, the §13
// anti-injection envelope and the catalog rendering are reused VERBATIM from
// v1 (via v3) — no duplication. The v3 event-classification directive (and
// its worked example, which still anchors against `document_date`) is kept
// intact: v4 only adds the fallback rule on top.
//
// Why a new version (not an in-place edit of v3): audit honesty — same
// rationale as v2 over v1 and v3 over v2. `llm_run.prompt_version` maps to
// the prompt that actually ran (registry in `./index.ts`), and
// `idempotency_key` (hash.ts) includes prompt_version, so a re-ingest under
// v4 yields a new, distinct run.

import type { CatalogSnapshot } from "../catalog/catalog.js";
import {
  MAX_TOKENS,
  user,
  type DocumentMetadata,
  type UserPromptArgs,
} from "./extraction.v1.js";
import { system as systemV3 } from "./extraction.v3.js";

/** Identifier — used by the registry (`./index.ts`) and logged per run. */
export const PROMPT_VERSION = "v4" as const;

export { MAX_TOKENS, user };
export type { DocumentMetadata, UserPromptArgs };

/**
 * The v4 delta over v3 — appended to v3's SYSTEM prompt. Named so the unit
 * test can assert its presence and a future v5 can compose further. Carries
 * the `received_at` fallback rule: when `document_date` is absent, the
 * relative-date anchor is `received_at` (already surfaced in the user prompt
 * metadata block). `received_at` is an ISO-8601 timestamp; the model
 * extracts its date portion (`YYYY-MM-DD`).
 */
export const RECEIVED_AT_ANCHOR_DIRECTIVE = [
  "",
  "## Relative dates — `received_at` is the fallback anchor",
  "- The USER prompt's `## Document metadata` block surfaces TWO temporal",
  "  anchors: `document_date` (the date the document itself states) and",
  "  `received_at` (the ISO-8601 timestamp the system received the document at",
  "  intake). They form a FALLBACK CHAIN.",
  "- When you encounter a relative date in the chunk text (`\"hoje\"`, `\"ontem\"`,",
  "  `\"amanhã\"`, `\"semana que vem\"`, `\"esta semana\"`, similar pt-BR temporal",
  "  deictics), resolve it AGAINST `document_date` if it is present (basis",
  "  `\"document\"`). If `document_date` is `(unknown)`, fall back to the date",
  "  portion of `received_at` (the `YYYY-MM-DD` prefix of the ISO-8601 string) —",
  "  use basis `\"received\"`.",
  "- This supersedes v3's rule of \"omit the date when `document_date` is unknown\":",
  "  with `received_at` always present, you now HAVE an anchor — use it.",
  "- The rule applies ONLY to relative dates. Absolute dates stated in the chunk",
  "  text remain `\"stated\"`; never invent a date.",
].join("\n");

/** v3 SYSTEM prompt + the received_at-anchor directive (v4 delta). */
export function system(catalog: CatalogSnapshot): string {
  return `${systemV3(catalog)}\n${RECEIVED_AT_ANCHOR_DIRECTIVE}`;
}
