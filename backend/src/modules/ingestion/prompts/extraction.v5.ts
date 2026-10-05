import type { CatalogSnapshot } from "../catalog/catalog.js";
import {
  MAX_TOKENS,
  user,
  type DocumentMetadata,
  type UserPromptArgs,
} from "./extraction.v1.js";
import { system as systemV4 } from "./extraction.v4.js";

export const PROMPT_VERSION = "v5" as const;

export { MAX_TOKENS, user };
export type { DocumentMetadata, UserPromptArgs };

export const OTHER_NAMES_DIRECTIVE = [
  "",
  "## Other names — propose every other name the text gives the same entity",
  "- With each `propose_node`, ALSO send in `aliases` every OTHER name the text",
  "  itself gives that same entity: an acronym (\"PMO\" for \"Escritório de",
  "  Projetos\"), a short name (\"Zeus\" for \"Projeto Zeus\") or another spelling",
  "  of the name. List only names the text actually uses for that entity; never",
  "  invent one.",
  "- A pronoun alone (\"ele\", \"ela\", \"isso\") is NOT another name of the entity.",
  "  Do not propose it.",
  "- A role alone (\"o gerente\", \"o cliente\", \"a diretora\") is NOT another name of",
  "  the entity. Do not propose it.",
  "- The `name` stays the canonical name; `aliases` carries only the additional",
  "  names. When the text gives no other name, send no `aliases`.",
].join("\n");

export function system(catalog: CatalogSnapshot): string {
  return `${systemV4(catalog)}\n${OTHER_NAMES_DIRECTIVE}`;
}
