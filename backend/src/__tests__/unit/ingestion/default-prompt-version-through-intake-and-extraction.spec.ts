import { describe, expect, it } from "vitest";
import pino from "pino";
import type Anthropic from "@anthropic-ai/sdk";
import type { Pool, PoolClient } from "pg";

import { buildSnapshot } from "../../../modules/ingestion/catalog/catalog.js";
import {
  ingestDocumentHandler,
  type IngestDocumentDeps,
} from "../../../modules/ingestion/mcp/ingest-document.handler.js";
import type { IngestDocumentMcpInput } from "../../../modules/ingestion/mcp/mcp-schemas.js";
import { selectPromptModule } from "../../../modules/ingestion/prompts/index.js";
import type {
  AnthropicLike,
  ExtractionMessageRequest,
  ExtractionMessageStream,
} from "../../../modules/ingestion/service/extraction.service.js";
import type { ContextMessageRequest } from "../../../modules/ingestion/service/preliminary-reading.js";

type Row = Record<string, unknown>;
type ModelRequest = ExtractionMessageRequest | ContextMessageRequest;

interface Store {
  raw: Row | null;
  chunks: Row[];
  run: Row | null;
}

interface World {
  readonly store: Store;
  readonly requests: ModelRequest[];
}

const PROMPT_VERSION_THE_RULE_STATES = "v5";
const RUN_ID = "44444444-4444-4444-8444-444444444444";
const RAW_ID = "55555555-5555-4555-8555-555555555555";
const NODE_TYPE_PERSON = "00000000-0000-0000-0000-000000000001";
const API_KEY = "sk-ant-test";
const CONTEXT_MODEL = "claude-haiku-4-5";
const RECEIVED_AT = new Date("2026-10-05T11:00:00Z");
const STARTED_AT = new Date("2026-10-05T12:00:00Z");
const FINISHED_AT = new Date("2026-10-05T12:05:00Z");

const CATALOG = buildSnapshot({
  nodeTypes: [{ id: NODE_TYPE_PERSON, name: "Person" }],
  linkTypes: [],
  linkTypeRules: [],
  attributeKeys: [],
});

const INPUT_NAMING_NO_PROMPT_VERSION: IngestDocumentMcpInput = {
  content: "Rodrigo lidera o Projeto Apollo.",
  source_type: "outro",
  metadata: {},
};

const END_TURN_MESSAGE = {
  id: "msg_end",
  type: "message",
  role: "assistant",
  model: CONTEXT_MODEL,
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

function chunkRowsOf(params: unknown[]): Row[] {
  const [rawId, indices, texts, starts, ends, versions] = params as [
    string,
    number[],
    string[],
    number[],
    number[],
    string[],
  ];
  return indices.map((chunkIndex, i) => ({
    id: `66666666-6666-4666-8666-66666666666${chunkIndex}`,
    raw_information_id: rawId,
    chunk_index: chunkIndex,
    text: texts[i],
    offset_start: starts[i],
    offset_end: ends[i],
    locator: null,
    chunking_version: versions[i],
  }));
}

function openedRunRow(params: unknown[]): Row {
  return {
    id: RUN_ID,
    model: params[0],
    prompt_version: params[1],
    started_at: STARTED_AT,
    finished_at: null,
    status: "running",
    attempts: 1,
    input_raw_information_id: params[2],
    idempotency_key: params[3],
    document_context: null,
    document_context_status: null,
  };
}

function insertAnswer(sql: string, params: unknown[], store: Store): Row[] | null {
  if (sql.startsWith("INSERT INTO raw_information")) {
    store.raw = {
      id: RAW_ID,
      source_type: params[0],
      content: params[1],
      storage_ref: null,
      content_hash: params[2],
      received_at: RECEIVED_AT,
      metadata: JSON.parse(String(params[3])),
      original_input: params[4],
    };
    return [store.raw];
  }
  if (sql.startsWith("INSERT INTO raw_chunk")) {
    store.chunks = chunkRowsOf(params);
    return store.chunks;
  }
  if (sql.startsWith("INSERT INTO llm_run")) {
    store.run = openedRunRow(params);
    return [structuredClone(store.run)];
  }
  return null;
}

function updateAnswer(sql: string, params: unknown[], run: Row): Row[] {
  if (sql.includes("document_context_status =")) {
    run["document_context_status"] = params[1];
  } else if (sql.includes("document_context =")) {
    run["document_context"] = JSON.parse(String(params[1]));
  } else {
    run["status"] = params[1];
    run["finished_at"] = FINISHED_AT;
  }
  return [structuredClone(run)];
}

function selectAnswer(sql: string, store: Store): Row[] {
  if (sql.includes("GROUP BY validation_outcome")) return [];
  if (sql.includes("FROM information_fragment")) return [{ n: 0 }];
  if (sql.includes("FROM llm_run") && store.run !== null) {
    return [structuredClone(store.run)];
  }
  if (sql.includes("FROM raw_information") && store.raw !== null) {
    return [store.raw];
  }
  if (sql.includes("FROM raw_chunk")) return store.chunks;
  return [];
}

function answer(sql: string, params: unknown[], store: Store): Row[] {
  const inserted = insertAnswer(sql, params, store);
  if (inserted !== null) return inserted;
  if (sql.startsWith("UPDATE llm_run") && store.run !== null) {
    return updateAnswer(sql, params, store.run);
  }
  if (sql.startsWith("SELECT")) return selectAnswer(sql, store);
  return [];
}

function poolOf(store: Store): Pool {
  const client = {
    query: async (...args: unknown[]) => {
      const sql = String(args[0]).replace(/\s+/g, " ").trim();
      const rows = answer(sql, Array.isArray(args[1]) ? args[1] : [], store);
      return { rows, rowCount: rows.length };
    },
    release: (): undefined => undefined,
  } as unknown as PoolClient;
  return { connect: async (): Promise<PoolClient> => client } as unknown as Pool;
}

function modelOf(requests: ModelRequest[]): AnthropicLike {
  return {
    messages: {
      stream: (req: ModelRequest): ExtractionMessageStream => {
        requests.push(req);
        return { finalMessage: async () => END_TURN_MESSAGE };
      },
    },
  };
}

function systemTextOf(request: ModelRequest | undefined): string | undefined {
  if (request === undefined) return undefined;
  if (typeof request.system === "string") return request.system;
  return request.system.map((block) => block.text).join("");
}

function newWorld(): World {
  return { store: { raw: null, chunks: [], run: null }, requests: [] };
}

function depsOf(world: World): IngestDocumentDeps {
  return {
    pool: poolOf(world.store),
    logger: pino({ level: "silent" }),
    catalog: CATALOG,
    anthropicApiKey: API_KEY,
    contextModel: CONTEXT_MODEL,
    anthropicFactory: () => modelOf(world.requests),
  };
}

describe("default prompt version through intake and extraction", () => {
  it("opens the run under v5 and runs extraction with the v5 prompt module when an ingest_document call names no prompt version", async () => {
    const world = newWorld();

    await ingestDocumentHandler(INPUT_NAMING_NO_PROMPT_VERSION, depsOf(world));

    expect(
      world.store.run?.["prompt_version"],
      "the LLMRun opened at intake records the prompt version"
    ).toBe(PROMPT_VERSION_THE_RULE_STATES);
    expect(
      systemTextOf(world.requests[0]),
      "the extraction's system prompt comes from the prompt module"
    ).toBe(selectPromptModule(PROMPT_VERSION_THE_RULE_STATES).system(CATALOG));
  });
});
