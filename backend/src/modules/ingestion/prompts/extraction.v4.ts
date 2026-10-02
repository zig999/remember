import type { CatalogSnapshot } from "../catalog/catalog.js";
import {
  MAX_TOKENS,
  user,
  type DocumentMetadata,
  type UserPromptArgs,
} from "./extraction.v1.js";
import { system as systemV3 } from "./extraction.v3.js";

export const PROMPT_VERSION = "v4" as const;

export { MAX_TOKENS, user };
export type { DocumentMetadata, UserPromptArgs };

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
  "  portion of `received_at` (the `YYYY-MM-DD` prefix of the ISO-8601 string).",
  "- This supersedes v3's rule of \"omit the date when `document_date` is unknown\":",
  "  with `received_at` always present, you now HAVE an anchor — use it.",
  "- The rule applies ONLY to relative dates. Absolute dates stated in the chunk",
  "  text remain `\"stated\"`; never invent a date.",
].join("\n");

export function system(catalog: CatalogSnapshot): string {
  return `${systemV3(catalog)}\n${RECEIVED_AT_ANCHOR_DIRECTIVE}`;
}
