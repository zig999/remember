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

export const EVENT_DATING_DIRECTIVE = [
  "",
  "## Events — always date the occurrence",
  "- When you create an `Event` (meeting, go-live, workshop…), ALWAYS propose its",
  "  `event_date` when the document states the date of the occurrence (and",
  "  `end_date` when there is a distinct end). Justify it with `valid_from_basis`;",
  "  NEVER invent a date.",
  "- CRUCIAL distinction: `event_date` is the VALUE — the date the event happens.",
  "  `valid_from` is when that date started to hold / became known (typically the",
  "  document date). E.g. a go-live on 2026-08-01 announced in minutes dated",
  "  2026-06-20 → `event_date`=\"2026-08-01\" (value), `valid_from`=\"2026-06-20\"",
  "  with `valid_from_basis`=\"document\".",
  "- Rescheduling an event is `change_hint:\"succession\"` on `event_date` — the",
  "  same mechanics as any functional attribute (the old date becomes history).",
].join("\n");

/** v1 SYSTEM prompt + the Event-dating directive (BR-26). */
export function system(catalog: CatalogSnapshot): string {
  return `${systemV1(catalog)}\n${EVENT_DATING_DIRECTIVE}`;
}
