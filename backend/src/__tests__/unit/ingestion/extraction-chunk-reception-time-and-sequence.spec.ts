import { expect, it } from "vitest";
import pino from "pino";
import type Anthropic from "@anthropic-ai/sdk";
import type { Pool, PoolClient } from "pg";

import { buildSnapshot } from "../../../modules/ingestion/catalog/catalog.js";
import {
  DocumentContextSchema,
  type DocumentContext,
} from "../../../modules/ingestion/dto/llm-run.dto.js";
import {
  runLlmExtraction,
  type AnthropicLike,
  type ExtractionMessageRequest,
  type ExtractionMessageStream,
} from "../../../modules/ingestion/service/extraction.service.js";
import type { ContextMessageRequest } from "../../../modules/ingestion/service/preliminary-reading.js";

const RUN_ID = "44444444-4444-4444-8444-444444444444";
const RAW_ID = "55555555-5555-4555-8555-555555555555";
const CHUNK_IDS = [
  "66666666-6666-4666-8666-666666666660",
  "66666666-6666-4666-8666-666666666661",
  "66666666-6666-4666-8666-666666666662",
] as const;
const NODE_TYPE_PERSON_ID = "00000000-0000-4000-8000-000000000001";
const RUN_MODEL = "claude-opus-4-8";
const ENV = {
  ANTHROPIC_API_KEY: "sk-ant-test",
  CONTEXT_MODEL: "claude-context-under-test",
} as const;
const CHUNK_REPLY = "done";
const CHUNK_TEXTS: readonly string[] = [
  "ALPHA-MARK primeiro trecho",
  "BETA-MARK segundo trecho",
  "GAMMA-MARK terceiro trecho",
];

const RECEIVED_AT = "2026-10-05T12:00:00Z";
const RECEIVED_AT_PREFIX = "2026-10-05T12:00:00";
const STARTED_AT = "2026-10-06T08:30:00Z";
const STARTED_AT_DATE = "2026-10-06";
const STARTED_AT_TIME = "08:30:00";
const SUMMARY = "Ata do comite financeiro.";
const SINGLE_FLIGHT = 1;

interface Scenario {
  promptVersion: string;
  readingError?: Error;
}

interface QueryResult {
  rows: object[];
  rowCount: number;
}

interface RunRow {
  id: string;
  model: string;
  prompt_version: string;
  started_at: Date;
  finished_at: Date | null;
  status: string;
  attempts: number;
  input_raw_information_id: string;
  idempotency_key: string;
  document_context: DocumentContext | null;
  document_context_status: string | null;
}

interface World {
  scenario: Scenario;
  run: RunRow;
  chunkPrompts: string[];
  inFlight: number;
  maxInFlight: number;
}

type ModelRequest = ExtractionMessageRequest | ContextMessageRequest;

const EMPTY_RESULT: QueryResult = { rows: [], rowCount: 0 };

const CATALOG = buildSnapshot({
  nodeTypes: [{ id: NODE_TYPE_PERSON_ID, name: "Person" }],
  linkTypes: [],
  linkTypeRules: [],
  attributeKeys: [],
});

function rowsOf(...rows: object[]): QueryResult {
  return { rows, rowCount: rows.length };
}

function rawRow(): Record<string, unknown> {
  return {
    id: RAW_ID,
    source_type: "transcricao",
    content: "Conteudo da ata.",
    storage_ref: null,
    content_hash: "f".repeat(64),
    received_at: new Date(RECEIVED_AT),
    metadata: { document_date: "2026-09-30", title: "Relatorio Orion" },
  };
}

function chunkRows(): object[] {
  return CHUNK_TEXTS.map((text, index) => ({
    id: CHUNK_IDS[index] ?? "",
    raw_information_id: RAW_ID,
    chunk_index: index,
    text,
    offset_start: 0,
    offset_end: text.length,
    locator: null,
    chunking_version: "v1",
  }));
}

function updateRun(sql: string, params: unknown[], world: World): QueryResult {
  const value = String(params[1]);
  if (sql.includes("SET document_context_status")) {
    world.run.document_context_status = value;
  } else if (sql.includes("SET document_context =")) {
    world.run.document_context = DocumentContextSchema.parse(JSON.parse(value));
  } else if (sql.includes("SET status")) {
    world.run.status = value;
  }
  return rowsOf(structuredClone(world.run));
}

type Route = readonly [
  RegExp,
  (sql: string, params: unknown[], world: World) => QueryResult,
];

const ROUTES: readonly Route[] = [
  [/^UPDATE llm_run/, updateRun],
  [/FROM llm_run/, (_sql, _params, world) => rowsOf(world.run)],
  [/FROM raw_information/, () => rowsOf(rawRow())],
  [/FROM raw_chunk/, () => rowsOf(...chunkRows())],
];

function answer(sql: string, params: unknown[], world: World): QueryResult {
  const route = ROUTES.find(([pattern]) => pattern.test(sql));
  return route === undefined ? EMPTY_RESULT : route[1](sql, params, world);
}

function buildPool(world: World): Pool {
  const client = {
    query: async (...args: unknown[]): Promise<QueryResult> => {
      const sql = String(args[0]).replace(/\s+/g, " ").trim();
      return answer(sql, Array.isArray(args[1]) ? args[1] : [], world);
    },
    release: (): undefined => undefined,
  } as unknown as PoolClient;
  return { connect: async (): Promise<PoolClient> => client } as unknown as Pool;
}

function textMessage(text: string): Anthropic.Messages.Message {
  return {
    id: "msg_test",
    type: "message",
    role: "assistant",
    model: RUN_MODEL,
    content: [{ type: "text", text, citations: null }],
    stop_reason: "end_turn",
    stop_sequence: null,
    usage: { input_tokens: 1, output_tokens: 1 },
  } as unknown as Anthropic.Messages.Message;
}

function promptOf(messages: Anthropic.Messages.MessageParam[]): string {
  const content = messages[0]?.content;
  if (content === undefined) return "";
  if (typeof content === "string") return content;
  return content.map((block) => (block.type === "text" ? block.text : "")).join("\n");
}

function readingAnswer(world: World): Anthropic.Messages.Message {
  const { readingError } = world.scenario;
  if (readingError !== undefined) throw readingError;
  const entities = [{ node_type: "Person", names: ["Joao Silva"] }];
  return textMessage(JSON.stringify({ summary: SUMMARY, entities }));
}

function tick(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

function readingStream(world: World): ExtractionMessageStream {
  return {
    finalMessage: async (): Promise<Anthropic.Messages.Message> => {
      await tick();
      return readingAnswer(world);
    },
  };
}

function chunkStream(world: World, req: ModelRequest): ExtractionMessageStream {
  world.chunkPrompts.push(promptOf(req.messages));
  world.inFlight += 1;
  world.maxInFlight = Math.max(world.maxInFlight, world.inFlight);
  return {
    finalMessage: async (): Promise<Anthropic.Messages.Message> => {
      await tick();
      world.inFlight -= 1;
      return textMessage(CHUNK_REPLY);
    },
  };
}

function buildModel(world: World): AnthropicLike {
  return {
    messages: {
      stream: (req) =>
        "tools" in req ? chunkStream(world, req) : readingStream(world),
    },
  };
}

function newWorld(scenario: Scenario): World {
  const run: RunRow = {
    id: RUN_ID,
    model: RUN_MODEL,
    prompt_version: scenario.promptVersion,
    started_at: new Date(STARTED_AT),
    finished_at: null,
    status: "running",
    attempts: 1,
    input_raw_information_id: RAW_ID,
    idempotency_key: "a".repeat(64),
    document_context: null,
    document_context_status: null,
  };
  return { scenario, run, chunkPrompts: [], inFlight: 0, maxInFlight: 0 };
}

async function runExtraction(scenario: Scenario): Promise<World> {
  const world = newWorld(scenario);
  await runLlmExtraction(
    buildPool(world),
    RUN_ID,
    pino({ level: "silent" }),
    CATALOG,
    { env: ENV, anthropicFactory: () => buildModel(world) }
  );
  return world;
}

const RECEPTION_SHAPES: Readonly<Record<string, Scenario>> = {
  "a v5 run holding a document context": { promptVersion: "v5" },
  "a v4 run": { promptVersion: "v4" },
};

const NO_CONTEXT_SHAPES: Readonly<Record<string, Scenario>> = {
  "a v4 run of three chunks": { promptVersion: "v4" },
  "a v5 run of three chunks whose preliminary reading failed": {
    promptVersion: "v5",
    readingError: new Error("provider unavailable"),
  },
};

function receptionProblems(world: World): string[] {
  return world.chunkPrompts.flatMap((prompt, at) => {
    const lacksReceived = prompt.includes(RECEIVED_AT_PREFIX)
      ? []
      : [`chunk ${at + 1} does not show received_at`];
    const showsStarted = [STARTED_AT_DATE, STARTED_AT_TIME]
      .filter((needle) => prompt.includes(needle))
      .map((needle) => `chunk ${at + 1} shows started_at (${needle})`);
    return [...lacksReceived, ...showsStarted];
  });
}

it("shows received_at and never the run's started_at in every chunk prompt when the two differ", async () => {
  const worlds: Record<string, World> = {};
  for (const [shape, scenario] of Object.entries(RECEPTION_SHAPES)) {
    worlds[shape] = await runExtraction(scenario);
  }

  const observed = Object.fromEntries(
    Object.entries(worlds).map(([shape, world]) => [
      shape,
      { chunksPrompted: world.chunkPrompts.length, problems: receptionProblems(world) },
    ])
  );

  expect(observed).toEqual({
    "a v5 run holding a document context": { chunksPrompted: 3, problems: [] },
    "a v4 run": { chunksPrompted: 3, problems: [] },
  });
});

it("never has two chunk model calls in flight at once for a multi-chunk run holding no document context", async () => {
  const worlds: Record<string, World> = {};
  for (const [shape, scenario] of Object.entries(NO_CONTEXT_SHAPES)) {
    worlds[shape] = await runExtraction(scenario);
  }

  const observed = Object.fromEntries(
    Object.entries(worlds).map(([shape, world]) => [
      shape,
      {
        chunksPrompted: world.chunkPrompts.length,
        largestNumberOfChunkCallsInFlight: world.maxInFlight,
      },
    ])
  );

  const expectedPerShape = {
    chunksPrompted: 3,
    largestNumberOfChunkCallsInFlight: SINGLE_FLIGHT,
  };
  expect(observed).toEqual({
    "a v4 run of three chunks": expectedPerShape,
    "a v5 run of three chunks whose preliminary reading failed": expectedPerShape,
  });
});
