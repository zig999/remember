import pino from "pino";
import type Anthropic from "@anthropic-ai/sdk";
import type { Pool, PoolClient } from "pg";

import { buildSnapshot } from "../../../modules/ingestion/catalog/catalog.js";
import type { LlmRunResponse } from "../../../modules/ingestion/dto/llm-run.dto.js";
import {
  runLlmExtraction,
  type AnthropicLike,
  type ExtractionMessageRequest,
  type ExtractionMessageStream,
} from "../../../modules/ingestion/service/extraction.service.js";
import type { ContextMessageRequest } from "../../../modules/ingestion/service/preliminary-reading.js";
import {
  HOLDS_NONE,
  RAW_INFO_ID,
  RUN_ID,
  llmRunRow,
  type HeldDocumentContext,
} from "./run-document-context-fixture.js";

type Row = Record<string, unknown>;

export const CONTEXT_MODEL = "claude-context-under-test";
export const CHUNK_COUNT = 3;

export interface ModelCall {
  readonly reading: boolean;
  readonly model: string;
  readonly prompt: string;
}

export interface StoreWrite {
  readonly table: string;
  readonly params: readonly unknown[];
}

export interface ExtractionWorld {
  readonly run: Row;
  readonly calls: ModelCall[];
  readonly writes: StoreWrite[];
  readonly readingAnswer: string;
}

export interface WorldOptions {
  readonly held?: HeldDocumentContext;
  readonly readingAnswer?: string;
}

const PROMPT_VERSION = "v5";
const CHUNK_REPLY = "done";
const API_KEY = "test-key";
const FINISHED_AT = new Date("2026-10-05T12:05:00Z");
const NODE_TYPE_PERSON_ID = "00000000-0000-4000-8000-000000000001";
const NODE_TYPE_ORGANIZATION_ID = "00000000-0000-4000-8000-000000000002";
const INSERT_PATTERN = /^INSERT INTO (\w+)/;

const CATALOG = buildSnapshot({
  nodeTypes: [
    { id: NODE_TYPE_PERSON_ID, name: "Person" },
    { id: NODE_TYPE_ORGANIZATION_ID, name: "Organization" },
  ],
  linkTypes: [],
  linkTypeRules: [],
  attributeKeys: [],
});

const CHUNK_TEXTS: readonly string[] = Array.from(
  { length: CHUNK_COUNT },
  (_, index) => `Passagem numero ${index + 1} fala apenas do orcamento.`
);

const RAW_INFORMATION_ROW: Row = {
  id: RAW_INFO_ID,
  source_type: "text",
  content: CHUNK_TEXTS.join("\n"),
  storage_ref: null,
  content_hash: "f".repeat(64),
  received_at: new Date("2026-10-05T11:00:00Z"),
  metadata: { document_date: "2026-10-05", title: "Ata" },
};

const CHUNK_ROWS: Row[] = CHUNK_TEXTS.map((text, index) => ({
  id: `66666666-6666-4666-8666-66666666666${index}`,
  raw_information_id: RAW_INFO_ID,
  chunk_index: index,
  text,
  offset_start: index * 100,
  offset_end: index * 100 + text.length,
  locator: null,
  chunking_version: "v1",
}));

function applyUpdate(sql: string, params: unknown[], run: Row): Row {
  const value = params[1];
  if (sql.includes("SET document_context_status")) {
    run["document_context_status"] = value;
  } else if (sql.includes("SET document_context =")) {
    run["document_context"] = JSON.parse(String(value));
  } else if (sql.includes("SET status")) {
    run["status"] = value;
    run["finished_at"] = FINISHED_AT;
  }
  return run;
}

function answer(sql: string, params: unknown[], world: ExtractionWorld): Row[] {
  const insert = INSERT_PATTERN.exec(sql);
  if (insert !== null) world.writes.push({ table: insert[1] ?? "", params });
  if (sql.startsWith("UPDATE llm_run")) {
    return [structuredClone(applyUpdate(sql, params, world.run))];
  }
  if (sql.includes("GROUP BY validation_outcome")) return [];
  if (sql.includes("FROM information_fragment")) return [{ n: 0 }];
  if (sql.includes("FROM llm_run")) return [structuredClone(world.run)];
  if (sql.includes("FROM raw_information")) return [RAW_INFORMATION_ROW];
  if (sql.includes("FROM raw_chunk")) return CHUNK_ROWS;
  return [];
}

function poolOf(world: ExtractionWorld): Pool {
  const client = {
    query: async (...args: unknown[]) => {
      const sql = String(args[0]).replace(/\s+/g, " ").trim();
      const rows = answer(sql, Array.isArray(args[1]) ? args[1] : [], world);
      return { rows, rowCount: rows.length };
    },
    release: (): undefined => undefined,
  } as unknown as PoolClient;
  return { connect: async (): Promise<PoolClient> => client } as unknown as Pool;
}

function userTextOf(messages: Anthropic.Messages.MessageParam[]): string {
  const content = messages[0]?.content ?? "";
  if (typeof content === "string") return content;
  return content.map((b) => (b.type === "text" ? b.text : "")).join("\n");
}

function endTurn(text: string): Anthropic.Messages.Message {
  return {
    id: "msg_end",
    type: "message",
    role: "assistant",
    model: CONTEXT_MODEL,
    content: [{ type: "text", text, citations: null }],
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
}

function modelOf(world: ExtractionWorld): AnthropicLike {
  return {
    messages: {
      stream: (
        req: ExtractionMessageRequest | ContextMessageRequest
      ): ExtractionMessageStream => {
        const reading = !("tools" in req);
        const prompt = userTextOf(req.messages);
        world.calls.push({ reading, model: req.model, prompt });
        const reply = reading ? world.readingAnswer : CHUNK_REPLY;
        return { finalMessage: async () => endTurn(reply) };
      },
    },
  };
}

export function newWorld(options: WorldOptions = {}): ExtractionWorld {
  const held = options.held ?? HOLDS_NONE;
  return {
    run: llmRunRow({ status: "running", prompt_version: PROMPT_VERSION, held }),
    calls: [],
    writes: [],
    readingAnswer: options.readingAnswer ?? "{}",
  };
}

export function extract(world: ExtractionWorld): Promise<LlmRunResponse> {
  return runLlmExtraction(poolOf(world), RUN_ID, pino({ level: "silent" }), CATALOG, {
    env: { ANTHROPIC_API_KEY: API_KEY, CONTEXT_MODEL },
    anthropicFactory: () => modelOf(world),
  });
}

export function chunkPrompts(world: ExtractionWorld): string[] {
  return world.calls.filter((call) => !call.reading).map((call) => call.prompt);
}

export function readerModels(world: ExtractionWorld): string[] {
  return world.calls.filter((call) => call.reading).map((call) => call.model);
}

export function recordedContext(world: ExtractionWorld): unknown {
  return world.run["document_context"];
}
