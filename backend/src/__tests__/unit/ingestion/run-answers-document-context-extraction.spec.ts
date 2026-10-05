import { expect, it } from "vitest";
import pino from "pino";
import type Anthropic from "@anthropic-ai/sdk";
import type { Pool, PoolClient } from "pg";

import { buildSnapshot } from "../../../modules/ingestion/catalog/catalog.js";
import {
  LlmRunStatusSchema,
  type LlmRunResponse,
  type LlmRunStatus,
} from "../../../modules/ingestion/dto/llm-run.dto.js";
import {
  runLlmExtraction,
  type AnthropicLike,
  type ExtractionMessageStream,
} from "../../../modules/ingestion/service/extraction.service.js";
import {
  DOCUMENT_CONTEXT,
  HOLDS_NONE,
  RAW_INFO_ID,
  RUN_ID,
  llmRunRow,
  type RunRowArgs,
} from "./run-document-context-fixture.js";

type Row = Record<string, unknown>;
type RunSetup = Omit<RunRowArgs, "status">;

const NODE_TYPE_PERSON = "00000000-0000-0000-0000-000000000001";

const CATALOG = buildSnapshot({
  nodeTypes: [{ id: NODE_TYPE_PERSON, name: "Person" }],
  linkTypes: [],
  linkTypeRules: [],
  attributeKeys: [],
});

const RAW_INFORMATION_ROW: Row = {
  id: RAW_INFO_ID,
  source_type: "text",
  content: "Chunk 0 Chunk 1",
  storage_ref: null,
  content_hash: "f".repeat(64),
  received_at: new Date("2026-10-05T11:00:00Z"),
  metadata: { document_date: "2026-10-05", title: "Test doc" },
};

const CHUNK_ROWS: Row[] = [0, 1].map((index) => ({
  id: `66666666-6666-4666-8666-66666666666${index}`,
  raw_information_id: RAW_INFO_ID,
  chunk_index: index,
  text: `Chunk ${index}`,
  offset_start: index * 8,
  offset_end: index * 8 + 7,
  locator: null,
  chunking_version: "v1",
}));

const END_TURN_MESSAGE = {
  id: "msg_end",
  type: "message",
  role: "assistant",
  model: "claude-sonnet-4-5",
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

function endTurnClient(): AnthropicLike {
  return {
    messages: {
      stream: (): ExtractionMessageStream => ({
        finalMessage: async (): Promise<Anthropic.Messages.Message> =>
          END_TURN_MESSAGE,
      }),
    },
  };
}

function storeFor(setup: RunSetup): (sql: string, params: unknown[]) => Row[] {
  let status: LlmRunStatus = "running";
  const run = (): Row => llmRunRow({ status, ...setup });
  return (sql, params) => {
    if (sql.startsWith("UPDATE llm_run")) {
      status = LlmRunStatusSchema.parse(params[1]);
      return [run()];
    }
    if (sql.includes("GROUP BY validation_outcome")) return [];
    if (sql.includes("FROM information_fragment")) return [{ n: 0 }];
    if (sql.includes("FROM raw_information")) return [RAW_INFORMATION_ROW];
    if (sql.includes("FROM raw_chunk")) return CHUNK_ROWS;
    if (sql.includes("FROM llm_run")) return [run()];
    return [];
  };
}

async function runExtraction(setup: RunSetup): Promise<LlmRunResponse> {
  const answer = storeFor(setup);
  const client = {
    query: async (...args: unknown[]) => {
      const sql = String(args[0]).replace(/\s+/g, " ").trim();
      const rows = answer(sql, Array.isArray(args[1]) ? args[1] : []);
      return { rows, rowCount: rows.length };
    },
    release: (): undefined => undefined,
  } as unknown as PoolClient;
  const pool = { connect: async (): Promise<PoolClient> => client } as unknown as Pool;
  return runLlmExtraction(pool, RUN_ID, pino({ level: "silent" }), CATALOG, {
    env: { ANTHROPIC_API_KEY: "sk-ant-test", CONTEXT_MODEL: "claude-haiku-4-5" },
    anthropicFactory: () => endTurnClient(),
  });
}

const REUSED_CONTEXT_RUN: RunSetup = {
  prompt_version: "v5",
  held: { status: "produced", context: DOCUMENT_CONTEXT },
};

it("carries the document context status of the completed run when it holds one", async () => {
  const completed = await runExtraction(REUSED_CONTEXT_RUN);

  expect(completed.document_context_status).toBe("produced");
});

it("carries the whole document context of the completed run when it holds one", async () => {
  const completed = await runExtraction(REUSED_CONTEXT_RUN);

  expect(completed.document_context).toEqual(DOCUMENT_CONTEXT);
});

it("carries no document context for a completed run that holds none", async () => {
  const completed = await runExtraction({ prompt_version: "v4", held: HOLDS_NONE });

  expect(completed.document_context ?? null).toBeNull();
});

it("carries no document context status for a completed run that holds none", async () => {
  const completed = await runExtraction({ prompt_version: "v4", held: HOLDS_NONE });

  expect(completed.document_context_status ?? null).toBeNull();
});
