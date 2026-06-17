// Extraction prompt — version v2 (Frente 2 / BR-26).
//
// v2 = v1 + an explicit Event-dating directive. The "go-live veio sem data"
// gap was a PROMPT gap: v1 never told the model to propose `event_date` when it
// creates an Event (the catalog has had Event.event_date — temporal, functional
// — all along, §15.3). v2 appends that directive (plus the value-vs-valid_from
// distinction) to v1's SYSTEM prompt; the USER builder, MAX_TOKENS, the §13
// anti-injection envelope and the catalog rendering are reused VERBATIM from v1
// — no duplication, so v1 stays the single source for everything unchanged.
//
// Why a new version (not an in-place edit of v1): it keeps the audit trail
// honest. `llm_run.prompt_version` now MAPS to the prompt that ran (the registry
// in `./index.ts` dispatches on it), and `idempotency_key` — which includes
// prompt_version (hash.ts) — changes, so re-ingesting a document under v2 yields
// a NEW, distinct run instead of deduping to the stale v1 run.

import type { CatalogSnapshot } from "../catalog/catalog.js";
import {
  MAX_TOKENS,
  system as systemV1,
  user,
  type DocumentMetadata,
  type UserPromptArgs,
} from "./extraction.v1.js";

/** Identifier — used by the registry (`./index.ts`) and logged per run. */
export const PROMPT_VERSION = "v2" as const;

export { MAX_TOKENS, user };
export type { DocumentMetadata, UserPromptArgs };

/**
 * The v2 delta over v1 — appended to the v1 SYSTEM prompt. Named so the unit
 * test can assert its presence and a future v3 can compose further. The LLM
 * reads the whole SYSTEM block, so appending a clearly-headed section is
 * sufficient; the directive carries its own inline example.
 */
export const EVENT_DATING_DIRECTIVE = [
  "",
  "## Events — sempre date o acontecimento",
  "- Ao criar um `Event` (reunião, go-live, workshop…), proponha SEMPRE o seu",
  "  `event_date` quando o documento indicar a data do acontecimento (e `end_date`",
  "  quando houver término distinto). Justifique com `valid_from_basis`; NUNCA",
  "  invente uma data.",
  "- DISTINÇÃO crucial: `event_date` é o VALOR — a data em que o evento ocorre.",
  "  `valid_from` é quando essa data passou a valer/ser conhecida (tipicamente a",
  "  data do documento). Ex.: um go-live em 2026-08-01 anunciado numa ata de",
  "  2026-06-20 → `event_date`=\"2026-08-01\" (value), `valid_from`=\"2026-06-20\"",
  "  com `valid_from_basis`=\"document\".",
  "- Remarcação de um evento é `change_hint:\"succession\"` sobre `event_date` — a",
  "  mesma mecânica de qualquer atributo funcional (a data antiga vira histórico).",
].join("\n");

/** v1 SYSTEM prompt + the Event-dating directive (BR-26). */
export function system(catalog: CatalogSnapshot): string {
  return `${systemV1(catalog)}\n${EVENT_DATING_DIRECTIVE}`;
}
