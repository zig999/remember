import { expect, it } from "vitest";
import pino from "pino";
import type Anthropic from "@anthropic-ai/sdk";
import type { Pool, PoolClient } from "pg";

import { buildSnapshot } from "../../../modules/ingestion/catalog/catalog.js";
import {
  runLlmExtraction,
  type AnthropicLike,
  type ExtractionMessageStream,
} from "../../../modules/ingestion/service/extraction.service.js";

const RUN_ID = "44444444-4444-4444-4444-444444444444";
const RAW_INFO_ID = "55555555-5555-4555-8555-555555555555";
const CHUNK_ID = "66666666-6666-4666-8666-666666666666";
const NODE_TYPE_PERSON = "00000000-0000-0000-0000-000000000001";
const PROMPT_VERSION_UNDER_TEST = "v5";

type Row = Record<string, unknown>;

interface QueryResult {
  rows: Row[];
  rowCount: number;
}

interface RunState {
  status: string;
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
  text: "First chunk text — talks about Alice and Bob.",
  offset_start: 0,
  offset_end: 46,
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

function runRow(status: string): Row {
  return {
    id: RUN_ID,
    model: "claude-opus-4-8",
    prompt_version: PROMPT_VERSION_UNDER_TEST,
    started_at: new Date("2026-06-11T20:24:00Z"),
    finished_at: status === "running" ? null : new Date("2026-06-11T20:29:42Z"),
    status,
    attempts: 1,
    input_raw_information_id: RAW_INFO_ID,
    idempotency_key: "a".repeat(64),
  };
}

function answer(sql: string, params: unknown[], state: RunState): QueryResult {
  if (sql.startsWith("UPDATE llm_run") && sql.includes("status")) {
    state.status = String(params[1]);
    return { rows: [runRow(state.status)], rowCount: 1 };
  }
  if (sql.startsWith("SELECT") && sql.includes("FROM llm_run")) {
    return { rows: [runRow(state.status)], rowCount: 1 };
  }
  if (sql.startsWith("SELECT") && sql.includes("FROM raw_information")) {
    return { rows: [RAW_INFORMATION_ROW], rowCount: 1 };
  }
  if (sql.includes("FROM raw_chunk") && sql.includes("ORDER BY chunk_index")) {
    return { rows: [CHUNK_ROW], rowCount: 1 };
  }
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

function endTurnClient(): AnthropicLike {
  return {
    messages: {
      stream: (): ExtractionMessageStream => ({
        finalMessage: async (): Promise<Anthropic.Messages.Message> => END_TURN_MESSAGE,
      }),
    },
  };
}

it("completes an extraction run whose prompt version is v5 instead of failing it as an unknown prompt version", async () => {
  const state: RunState = { status: "running" };
  const catalog = buildSnapshot({
    nodeTypes: [{ id: NODE_TYPE_PERSON, name: "Person" }],
    linkTypes: [],
    linkTypeRules: [],
    attributeKeys: [],
  });

  const result = await runLlmExtraction(
    buildPool(state),
    RUN_ID,
    pino({ level: "silent" }),
    catalog,
    { env: { ANTHROPIC_API_KEY: "sk-ant-test" }, anthropicFactory: () => endTurnClient() }
  );

  expect(result.status).toBe("completed");
});
