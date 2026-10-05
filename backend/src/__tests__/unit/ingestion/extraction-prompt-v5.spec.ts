import { expect, it } from "vitest";

import {
  buildSnapshot,
  type CatalogSnapshot,
  type NodeTypeRow,
} from "../../../modules/ingestion/catalog/catalog.js";
import {
  selectPromptModule,
  UnknownPromptVersionError,
  type PromptModule,
} from "../../../modules/ingestion/prompts/index.js";

type UserArgs = Parameters<PromptModule["user"]>[0];

const HELD_VERSIONS: readonly string[] = ["v1", "v2", "v3", "v4", "v5"];
const VERSIONS_BEFORE_V5: readonly string[] = ["v1", "v2", "v3", "v4"];
const VERSIONS_FROM_V4: readonly string[] = ["v4", "v5"];
const UNHELD_VERSION = "v99";

const NODE_TYPES: NodeTypeRow[] = [
  {
    id: "nt-event-0000-0000-0000-000000000001",
    name: "Event",
    description: "an event",
  },
];

const USER_ARGS: UserArgs = {
  metadata: {
    source_type: "ata",
    received_at: "2026-06-26T12:00:00Z",
    document_date: null,
    title: "Ata de reunião",
  },
  chunkText: "hoje cobrei o Caio.",
  prevTail: "",
};

const OTHER_NAMES_CHECKS: Readonly<Record<string, RegExp>> = {
  "asks for every other name with each node":
    /(?:propose_node|\bnode\b)[^.]{0,120}?\b(?:every|all)\s+(?:the\s+)?other\s+names?\b|\b(?:every|all)\s+(?:the\s+)?other\s+names?\b[^.]{0,120}?(?:propose_node|\bnode\b)/i,
  "names an acronym as another name": /\bacronyms?\b/i,
  "names a short name as another name": /\bshort\s+names?\b/i,
  "names another spelling as another name":
    /\b(?:another|alternative|different|variant)\s+spellings?\b/i,
  "says a pronoun alone is not another name":
    /pronouns?\s+(?:alone|only|by itself|on its own)[^.]{0,120}?\b(?:not|never)\b|\b(?:not|never)\b[^.]{0,120}?pronouns?\s+(?:alone|only|by itself|on its own)/i,
  "says a role alone is not another name":
    /roles?\s+(?:alone|only|by itself|on its own)[^.]{0,120}?\b(?:not|never)\b|\b(?:not|never)\b[^.]{0,120}?roles?\s+(?:alone|only|by itself|on its own)/i,
};

const RELATIVE_DATE_WORDS =
  /relative[- ]dates?[^]{0,120}?hoje[^]{0,30}?ontem[^]{0,30}?amanhã/i;

const RESOLVES_AGAINST_DOCUMENT_DATE =
  /relative dates?[^]{0,250}?(?:against|from|relative to|using)\s+(?:the\s+)?`?document_date`?/i;

const FALLS_BACK_TO_RECEPTION =
  /`document_date`\s+is\s+(?:`?\(?unknown\)?`?|absent|missing|not\s+(?:present|known|stated))[^]{0,120}?`received_at`|(?:no|without)\s+(?:a\s+)?(?:known\s+)?`document_date`[^]{0,120}?`received_at`/i;

const OTHER_NAMES_MARKERS: Readonly<Record<string, RegExp>> = {
  alias: /\baliases?\b/i,
  otherName: /\bother\s+names?\b|\boutros?\s+nomes?\b/i,
  acronym: /\bacronyms?\b|\bsiglas?\b/i,
  shortName: /\bshort\s+names?\b|\bnomes?\s+curtos?\b/i,
  spelling: /\bspellings?\b|\bgrafias?\b/i,
  pronoun: /\bpronouns?\b/i,
};

function snapshot(): CatalogSnapshot {
  return buildSnapshot({
    nodeTypes: NODE_TYPES,
    linkTypes: [],
    linkTypeRules: [],
    attributeKeys: [],
  });
}

function squash(text: string): string {
  return text.replace(/\s+/g, " ");
}

function systemOf(version: string): string {
  return squash(selectPromptModule(version).system(snapshot()));
}

function userOf(version: string): string {
  return selectPromptModule(version)
    .user(USER_ARGS)
    .map((block) => block.text)
    .join("\n");
}

function refusalMessage(version: string): string {
  try {
    selectPromptModule(version);
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
  return "";
}

function knownVersionsListedBy(version: string): string[] {
  const listed = /Known versions:\s*([^.]*)\./.exec(refusalMessage(version))?.[1] ?? "";
  return listed
    .split(",")
    .map((name) => name.trim())
    .filter((name) => name.length > 0)
    .sort();
}

function evaluate(
  checks: Readonly<Record<string, RegExp>>,
  text: string
): Record<string, boolean> {
  return Object.fromEntries(
    Object.entries(checks).map(([name, pattern]) => [name, pattern.test(text)])
  );
}

function allTrue(results: Record<string, boolean>): Record<string, boolean> {
  return Object.fromEntries(Object.keys(results).map((name) => [name, true]));
}

function markersIn(text: string): string[] {
  return Object.entries(OTHER_NAMES_MARKERS)
    .filter(([, pattern]) => pattern.test(text))
    .map(([name]) => name);
}

it("holds exactly the prompt versions v1 to v5, each resolving to a module of its own version", () => {
  const expected = [...HELD_VERSIONS];

  const resolved = HELD_VERSIONS.map((version) => selectPromptModule(version).version);
  const known = knownVersionsListedBy(UNHELD_VERSION);

  expect({ resolved, known }).toEqual({ resolved: expected, known: expected });
});

it("refuses a prompt version the system does not hold instead of falling back to another one", () => {
  const select = (): PromptModule => selectPromptModule(UNHELD_VERSION);

  expect(select).toThrow(UnknownPromptVersionError);
});

it("asks under v5 for every other name the text gives each entity, names an acronym, a short name and another spelling, and excludes a pronoun alone and a role alone", () => {
  const prompt = systemOf("v5");

  const results = evaluate(OTHER_NAMES_CHECKS, prompt);

  expect(results).toEqual(allTrue(results));
});

it("keeps every instruction line of the v4 system prompt in the v5 system prompt", () => {
  const catalog = snapshot();
  const v4Lines = selectPromptModule("v4")
    .system(catalog)
    .split("\n")
    .map((line) => squash(line).trim())
    .filter((line) => line.length > 0);
  const v5Prompt = squash(selectPromptModule("v5").system(catalog));

  const missing = v4Lines.filter((line) => !v5Prompt.includes(line));

  expect(missing).toEqual([]);
});

it("names hoje, ontem and amanhã as relative-date words in the v4 and v5 system prompts", () => {
  const results: Record<string, boolean> = {};

  for (const version of VERSIONS_FROM_V4) {
    results[`${version} names hoje, ontem and amanhã as relative-date words`] =
      RELATIVE_DATE_WORDS.test(systemOf(version));
  }

  expect(results).toEqual(allTrue(results));
});

it("asks in the v4 and v5 system prompts to resolve a relative date against the document date and, without one, against the reception date", () => {
  const results: Record<string, boolean> = {};

  for (const version of VERSIONS_FROM_V4) {
    const prompt = systemOf(version);
    results[`${version} resolves a relative date against the document date`] =
      RESOLVES_AGAINST_DOCUMENT_DATE.test(prompt);
    results[`${version} falls back to the reception date`] =
      FALLS_BACK_TO_RECEPTION.test(prompt);
  }

  expect(results).toEqual(allTrue(results));
});

it("asks for no other names of an entity in any v1 to v4 system prompt nor in the user prompt they share", () => {
  const parts: Record<string, string> = {};
  for (const version of VERSIONS_BEFORE_V5) {
    parts[`${version} system`] = systemOf(version);
    parts[`${version} user`] = userOf(version);
  }

  const offenders: Record<string, string[]> = {};
  for (const [name, text] of Object.entries(parts)) {
    const found = markersIn(text);
    if (found.length > 0) offenders[name] = found;
  }

  expect(offenders).toEqual({});
});
