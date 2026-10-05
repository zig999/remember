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
  ExtractionFatalError,
  runLlmExtraction,
  type AnthropicLike,
  type ExtractionMessageStream,
} from "../../../modules/ingestion/service/extraction.service.js";

const RUN_ID = "44444444-4444-4444-8444-444444444444";
const RAW_INFO_ID = "55555555-5555-4555-8555-555555555555";
const CHUNK_ID = "66666666-6666-4666-8666-666666666666";
const PERSON_ID = "00000000-0000-4000-8000-000000000001";
const PROJECT_ID = "00000000-0000-4000-8000-000000000002";
const LINK_TYPE_ID = "00000000-0000-4000-8000-000000000003";
const ATTRIBUTE_KEY_ID = "00000000-0000-4000-8000-000000000004";

const MAX_PROBED_VERSION = 50;
const FIRST_OTHER_NAMES_VERSION = 5;
const FIRST_RELATIVE_DATE_VERSION = 4;
const UNHELD_VERSION = "v99";
const RELATIVE_DATE_WORDS: readonly string[] = ["hoje", "ontem", "amanhã"];

type Row = Record<string, unknown>;

interface QueryResult {
  rows: Row[];
  rowCount: number;
}

interface RunState {
  status: string;
  readonly promptVersion: string;
}

interface RunReport {
  readonly systemTexts: string[];
  readonly refusal: unknown;
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
  text: "O Escritório de Projetos (PMO) cobrou o Caio hoje.",
  offset_start: 0,
  offset_end: 50,
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

const EXTRACTION_CATALOG: CatalogSnapshot = buildSnapshot({
  nodeTypes: [{ id: PERSON_ID, name: "Person" }],
  linkTypes: [],
  linkTypeRules: [],
  attributeKeys: [],
});

const RICH_CATALOG: CatalogSnapshot = buildSnapshot({
  nodeTypes: [
    { id: PERSON_ID, name: "Person", description: "a person" },
    { id: PROJECT_ID, name: "Project", description: "a project" },
  ],
  linkTypes: [
    {
      id: LINK_TYPE_ID,
      name: "responsible_for",
      is_temporal: true,
      allows_multiple_current: false,
      requires_valid_from: true,
      requires_valid_to_on_change: true,
    },
  ],
  linkTypeRules: [
    {
      link_type_id: LINK_TYPE_ID,
      source_node_type_id: PERSON_ID,
      target_node_type_id: PROJECT_ID,
      valid_from: null,
      valid_to: null,
    },
  ],
  attributeKeys: [
    {
      id: ATTRIBUTE_KEY_ID,
      node_type_id: PROJECT_ID,
      key: "status_text",
      value_type: "text",
      is_temporal: true,
      allows_multiple_current: false,
      requires_valid_from: true,
    },
  ],
  attributeValidValues: [
    { attribute_key_id: ATTRIBUTE_KEY_ID, value: "ativo" },
    { attribute_key_id: ATTRIBUTE_KEY_ID, value: "encerrado" },
  ],
});

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

function squash(text: string): string {
  return text.replace(/\s+/g, " ");
}

function versionNumber(version: string): number {
  return Number.parseInt(version.slice(1), 10);
}

function heldVersions(): string[] {
  const held: string[] = [];
  for (let number = 1; number <= MAX_PROBED_VERSION; number += 1) {
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

function heldFrom(firstNumber: number): string[] {
  return heldVersions().filter((version) => versionNumber(version) >= firstNumber);
}

function relativeDateWordCheck(word: string): RegExp {
  return new RegExp(`relative[- ]dates?[^.]{0,200}?${word}`, "i");
}

function allTrue(results: Record<string, boolean>): Record<string, boolean> {
  return Object.fromEntries(Object.keys(results).map((name) => [name, true]));
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

async function runUnder(promptVersion: string): Promise<RunReport> {
  const systemTexts: string[] = [];
  const pool = buildPool({ status: "running", promptVersion });
  try {
    await runLlmExtraction(pool, RUN_ID, pino({ level: "silent" }), EXTRACTION_CATALOG, {
      env: { ANTHROPIC_API_KEY: "sk-ant-test", CONTEXT_MODEL: "claude-context-test" },
      anthropicFactory: () => capturingClient(systemTexts),
    });
  } catch (refusal) {
    return { systemTexts, refusal };
  }
  return { systemTexts, refusal: null };
}

function failedRunStatusOf(refusal: unknown): string {
  return refusal instanceof ExtractionFatalError
    ? refusal.partialRun.status
    : "not refused as a failed run";
}

function instructionLines(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

it("sends every held prompt version from v5 on a request asking for every other name of each entity, naming an acronym, a short name and another spelling, and excluding a pronoun alone and a role alone", async () => {
  const versions = heldFrom(FIRST_OTHER_NAMES_VERSION);
  const results: Record<string, boolean> = { "v5 is held": versions.includes("v5") };

  for (const version of versions) {
    const { systemTexts } = await runUnder(version);
    const sent = squash(systemTexts[0] ?? "");
    for (const [name, pattern] of Object.entries(OTHER_NAMES_CHECKS)) {
      results[`${version} request ${name}`] = pattern.test(sent);
    }
  }

  expect(results).toEqual(allTrue(results));
});

it("names hoje, ontem and amanhã as relative-date words in the system prompt of every held version from v4 on", () => {
  const versions = heldFrom(FIRST_RELATIVE_DATE_VERSION);
  const results: Record<string, boolean> = { "v4 is held": versions.includes("v4") };

  for (const version of versions) {
    const system = squash(selectPromptModule(version).system(EXTRACTION_CATALOG));
    for (const word of RELATIVE_DATE_WORDS) {
      results[`${version} names ${word} as a relative-date word`] =
        relativeDateWordCheck(word).test(system);
    }
  }

  expect(results).toEqual(allTrue(results));
});

it("holds each instruction line of the v4 system prompt as a whole line of the v5 system prompt, over a catalog with a link type, a link type rule and an attribute key with valid values", () => {
  const v4Lines = instructionLines(selectPromptModule("v4").system(RICH_CATALOG));
  const v5Lines = new Set(instructionLines(selectPromptModule("v5").system(RICH_CATALOG)));

  const missing = v4Lines.filter((line) => !v5Lines.has(line));

  expect(missing).toEqual([]);
});

it("fails an extraction under a prompt version the system does not hold without asking the model, and runs every held version under its own prompt", async () => {
  const refused = await runUnder(UNHELD_VERSION);
  const held = heldVersions();
  const mismatched: string[] = [];
  for (const version of held) {
    const { systemTexts } = await runUnder(version);
    const own = selectPromptModule(version).system(EXTRACTION_CATALOG);
    if (systemTexts[0] !== own) mismatched.push(version);
  }

  expect({
    unheldVersionRunStatus: failedRunStatusOf(refused.refusal),
    unheldVersionModelRequests: refused.systemTexts.length,
    heldVersionsNotRunUnderTheirOwnPrompt: mismatched,
    v5IsAmongTheHeldVersionsExercised: held.includes("v5"),
  }).toEqual({
    unheldVersionRunStatus: "failed",
    unheldVersionModelRequests: 0,
    heldVersionsNotRunUnderTheirOwnPrompt: [],
    v5IsAmongTheHeldVersionsExercised: true,
  });
});
