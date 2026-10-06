import { expect, it } from "vitest";
import pino from "pino";
import type Anthropic from "@anthropic-ai/sdk";
import type { Pool, PoolClient } from "pg";

import {
  buildSnapshot,
  type CatalogSnapshot,
} from "../../../modules/ingestion/catalog/catalog.js";
import {
  selectPromptModule,
  UnknownPromptVersionError,
} from "../../../modules/ingestion/prompts/index.js";
import {
  runLlmExtraction,
  type AnthropicLike,
  type ExtractionMessageStream,
} from "../../../modules/ingestion/service/extraction.service.js";

const RUN_ID = "44444444-4444-4444-8444-444444444444";
const RAW_INFO_ID = "55555555-5555-4555-8555-555555555555";
const CHUNK_ID = "66666666-6666-4666-8666-666666666666";
const PERSON_ID = "00000000-0000-4000-8000-000000000001";

const MAX_PROBED_VERSION = 50;
const FIRST_OTHER_NAMES_VERSION = 5;

const ASKS_EVERY_OTHER_NAME = "asks for every other name";
const TIES_ASK_TO_EACH_NODE = "ties the ask to each node";
const NAMES_FROM_THE_TEXT = "asks for names the text itself gives that entity";
const GIVES_ACRONYM = "gives an acronym as an example";
const GIVES_SHORT_NAME = "gives a short name as an example";
const GIVES_SPELLING = "gives another spelling as an example";
const EXCLUDES_PRONOUN = "excludes a pronoun alone";
const EXCLUDES_ROLE = "excludes a role alone";

const ALONE = /\b(?:alone|only|by itself|on its own)\b/i;
const NEGATION = /\b(?:not|never|no|exclude[sd]?)\b/i;

type Row = Record<string, unknown>;

interface QueryResult {
  rows: Row[];
  rowCount: number;
}

interface RunState {
  status: string;
  readonly promptVersion: string;
}

const EMPTY_RESULT: QueryResult = { rows: [], rowCount: 0 };

const RAW_INFORMATION_ROW: Row = {
  id: RAW_INFO_ID,
  source_type: "text",
  content: "doc content",
  storage_ref: null,
  content_hash: "f".repeat(64),
  received_at: new Date("2026-06-11T20:00:00Z"),
  metadata: { document_date: "2026-06-11", title: "Test doc" },
};

const CHUNK_ROW: Row = {
  id: CHUNK_ID,
  raw_information_id: RAW_INFO_ID,
  chunk_index: 0,
  text: "O Escritório de Projetos (PMO) cobrou o Caio.",
  offset_start: 0,
  offset_end: 45,
  locator: null,
  chunking_version: "v1",
};

const END_TURN_MESSAGE = {
  id: "msg_end",
  type: "message",
  role: "assistant",
  model: "claude-opus-4-8",
  content: [{ type: "text", text: "done", citations: null }],
  stop_reason: "end_turn",
  stop_sequence: null,
  usage: {
    input_tokens: 1,
    output_tokens: 1,
    cache_creation_input_tokens: 0,
    cache_read_input_tokens: 0,
    cache_creation: null,
    server_tool_use: null,
    service_tier: null,
  },
} as unknown as Anthropic.Messages.Message;

const CATALOG: CatalogSnapshot = buildSnapshot({
  nodeTypes: [{ id: PERSON_ID, name: "Person" }],
  linkTypes: [],
  linkTypeRules: [],
  attributeKeys: [],
});

const ASK_AND_EXAMPLES_IN_ONE_BLOCK = [
  "## Other names",
  "- With each `propose_node`, send every other name the text itself gives that",
  "  same entity: an acronym, a short name or another spelling.",
].join("\n");

const EXCLUSIONS_IN_ANOTHER_BLOCK = [
  "## What is not a name",
  "- A pronoun alone is not another name of the entity.",
  "- A role alone is not another name of the entity.",
].join("\n");

const AT_MOST_ONE_NAME_PROMPT =
  "With each node you may propose one other name, which must be a name the text itself gives for that entity, such as an acronym, a short name or another spelling, never a pronoun or a role alone.";

const LACKING_CASES: Array<[string, string, string[]]> = [
  [
    "a prompt whose pronoun and role exclusions sit in another block than the ask",
    `${ASK_AND_EXAMPLES_IN_ONE_BLOCK}\n\n${EXCLUSIONS_IN_ANOTHER_BLOCK}`,
    [EXCLUDES_PRONOUN, EXCLUDES_ROLE],
  ],
  [
    "a prompt asking for at most one other name per node",
    AT_MOST_ONE_NAME_PROMPT,
    [ASKS_EVERY_OTHER_NAME],
  ],
];

const PARTS: Readonly<Record<string, (block: string) => boolean>> = {
  [ASKS_EVERY_OTHER_NAME]: (block) =>
    /\b(?:every|all)\s+(?:the\s+)?other\s+names?\b/i.test(block),
  [TIES_ASK_TO_EACH_NODE]: (block) =>
    /\b(?:with|for|per)\s+each\s+`?(?:propose_)?node`?|\bper\s+node\b/i.test(block),
  [NAMES_FROM_THE_TEXT]: (block) =>
    /\btext\b[^.:]{0,60}?\b(?:gives|uses|states|says|names|mentions|calls|refers)\b[^.:]{0,60}?\bentity\b/i.test(
      block
    ),
  [GIVES_ACRONYM]: (block) => /\bacronyms?\b/i.test(block),
  [GIVES_SHORT_NAME]: (block) => /\bshort\s+names?\b/i.test(block),
  [GIVES_SPELLING]: (block) =>
    /\b(?:another|alternative|different|variant|other)\s+spellings?\b/i.test(block),
  [EXCLUDES_PRONOUN]: excludesAlone("pronoun"),
  [EXCLUDES_ROLE]: excludesAlone("role"),
};

function excludesAlone(word: string): (block: string) => boolean {
  const noun = new RegExp(`\\b${word}s?\\b`, "i");
  return (block) =>
    block
      .split(/[.;]/)
      .some(
        (clause) => noun.test(clause) && ALONE.test(clause) && NEGATION.test(clause)
      );
}

function instructionBlocks(text: string): string[] {
  const blocks: string[] = [];
  let current: string[] = [];
  const close = (): void => {
    if (current.length > 0) blocks.push(current.join(" "));
    current = [];
  };
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (line === "") close();
    else {
      if (line.startsWith("#")) close();
      current.push(line);
    }
  }
  close();
  return blocks;
}

function evaluate(block: string): Record<string, boolean> {
  return Object.fromEntries(
    Object.entries(PARTS).map(([name, holds]) => [name, holds(block)])
  );
}

function heldCount(results: Record<string, boolean>): number {
  return Object.values(results).filter((held) => held).length;
}

function judge(systemText: string): Record<string, boolean> {
  const candidates = instructionBlocks(systemText).map(evaluate);
  const empty = evaluate("");
  return candidates.reduce(
    (best, next) => (heldCount(next) > heldCount(best) ? next : best),
    empty
  );
}

function missingParts(results: Record<string, boolean>): string[] {
  return Object.entries(results)
    .filter(([, held]) => !held)
    .map(([name]) => name);
}

function allTrue(results: Record<string, boolean>): Record<string, boolean> {
  return Object.fromEntries(Object.keys(results).map((name) => [name, true]));
}

function heldVersionsFrom(firstNumber: number): string[] {
  const held: string[] = [];
  for (let number = firstNumber; number <= MAX_PROBED_VERSION; number += 1) {
    const version = `v${number}`;
    try {
      selectPromptModule(version);
      held.push(version);
    } catch (error) {
      if (!(error instanceof UnknownPromptVersionError)) throw error;
    }
  }
  return held;
}

function systemTextOf(
  system: string | readonly Anthropic.Messages.TextBlockParam[]
): string {
  return typeof system === "string"
    ? system
    : system.map((block) => block.text).join("\n");
}

function runRow(state: RunState): Row {
  return {
    id: RUN_ID,
    model: "claude-opus-4-8",
    prompt_version: state.promptVersion,
    started_at: new Date("2026-06-11T20:24:00Z"),
    finished_at: state.status === "running" ? null : new Date("2026-06-11T20:29:42Z"),
    status: state.status,
    attempts: 1,
    input_raw_information_id: RAW_INFO_ID,
    idempotency_key: "a".repeat(64),
    document_context: null,
    document_context_status: null,
  };
}

function rowsOf(rows: Row[]): QueryResult {
  return { rows, rowCount: rows.length };
}

function answer(sql: string, params: unknown[], state: RunState): QueryResult {
  if (sql.startsWith("UPDATE llm_run") && sql.includes("SET status =")) {
    state.status = String(params[1]);
  }
  if (sql.startsWith("UPDATE llm_run")) return rowsOf([runRow(state)]);
  if (sql.startsWith("SELECT") && sql.includes("FROM llm_run")) {
    return rowsOf([runRow(state)]);
  }
  if (sql.startsWith("SELECT") && sql.includes("FROM raw_information")) {
    return rowsOf([RAW_INFORMATION_ROW]);
  }
  if (sql.includes("FROM raw_chunk")) return rowsOf([CHUNK_ROW]);
  if (sql.includes("FROM information_fragment")) return rowsOf([{ n: 0 }]);
  return EMPTY_RESULT;
}

function buildPool(state: RunState): Pool {
  const client = {
    query: async (...args: unknown[]): Promise<QueryResult> => {
      const sql = String(args[0]).replace(/\s+/g, " ").trim();
      return answer(sql, Array.isArray(args[1]) ? args[1] : [], state);
    },
    release: (): undefined => undefined,
  } as unknown as PoolClient;
  return { connect: async (): Promise<PoolClient> => client } as unknown as Pool;
}

function capturingClient(systemTexts: string[]): AnthropicLike {
  return {
    messages: {
      stream: (request): ExtractionMessageStream => {
        systemTexts.push(systemTextOf(request.system));
        return { finalMessage: async () => END_TURN_MESSAGE };
      },
    },
  };
}

async function systemTextSentUnder(promptVersion: string): Promise<string> {
  const systemTexts: string[] = [];
  const pool = buildPool({ status: "running", promptVersion });
  try {
    await runLlmExtraction(pool, RUN_ID, pino({ level: "silent" }), CATALOG, {
      env: { ANTHROPIC_API_KEY: "stub-key", CONTEXT_MODEL: "stub-context-model" },
      anthropicFactory: () => capturingClient(systemTexts),
    });
  } catch (refusal) {
    if (systemTexts.length === 0) throw refusal;
  }
  return systemTexts[0] ?? "";
}

it("sends under every held prompt version from v5 on one instruction that asks, with each node, for every other name the text gives that entity, names an acronym, a short name and another spelling, and excludes a pronoun alone and a role alone", async () => {
  const versions = heldVersionsFrom(FIRST_OTHER_NAMES_VERSION);
  const results: Record<string, boolean> = { "v5 is held": versions.includes("v5") };

  for (const version of versions) {
    const sent = await systemTextSentUnder(version);
    for (const [part, held] of Object.entries(judge(sent))) {
      results[`${version} ${part}`] = held;
    }
  }

  expect(results).toEqual(allTrue(results));
});

it.each(LACKING_CASES)(
  "judges %s as missing a part of the single instruction",
  (_label, systemText, expectedMissing) => {
    const results = judge(systemText);

    expect(missingParts(results)).toEqual(expectedMissing);
  }
);
