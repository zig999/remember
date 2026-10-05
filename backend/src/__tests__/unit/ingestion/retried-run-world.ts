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
import { retryLlmRun } from "../../../modules/ingestion/service/llm-run.service.js";
import type { ContextMessageRequest } from "../../../modules/ingestion/service/preliminary-reading.js";
import {
  RAW_INFO_ID,
  RUN_ID,
  llmRunRow,
  type HeldDocumentContext,
} from "./run-document-context-fixture.js";

type Row = Record<string, unknown>;

export interface ModelCall {
  readonly text: string;
  readonly reading: boolean;
}

export interface RetriedRunWorld {
  readonly run: Row;
  readonly calls: ModelCall[];
}

const PROMPT_VERSION = "v5";
const CHUNK_REPLY = "done";
const NODE_TYPE_PERSON = "00000000-0000-0000-0000-000000000001";
const CONTEXT_MODEL = "claude-haiku-4-5";
const API_KEY = "sk-ant-test";
const FIXED_NOW = new Date("2026-10-05T13:00:00Z");
const READING_ANSWER = { summary: "Ata relida.", entities: [] };

const TOKENS = ["ALPHA-MARK", "BETA-MARK", "GAMMA-MARK"];
const CHUNK_TEXTS = TOKENS.map((token) => `${token} chunk body.`);

const CATALOG = buildSnapshot({
  nodeTypes: [{ id: NODE_TYPE_PERSON, name: "Person" }],
  linkTypes: [],
  linkTypeRules: [],
  attributeKeys: [],
});

const RAW_INFORMATION_ROW: Row = {
  id: RAW_INFO_ID,
  source_type: "text",
  content: TOKENS.join("\n"),
  storage_ref: null,
  content_hash: "f".repeat(64),
  received_at: new Date("2026-10-05T11:00:00Z"),
  metadata: { document_date: "2026-10-05", title: "Test doc" },
};

const CHUNK_ROWS: Row[] = CHUNK_TEXTS.map((text, index) => ({
  id: `66666666-6666-4666-8666-66666666666${index}`,
  raw_information_id: RAW_INFO_ID,
  chunk_index: index,
  text,
  offset_start: index * 20,
  offset_end: index * 20 + text.length,
  locator: null,
  chunking_version: "v1",
}));

const SET_CLAUSE = /\bSET\b([\s\S]*?)\bWHERE\b/i;
const REQUIRED_STATUS = /\bAND status = '(\w+)'/;
const ASSIGNMENT = /^\s*(\w+)\s*=\s*([\s\S]+?)\s*$/;
const QUOTED = /^'([^']*)'$/;
const PARAMETER = /^\$(\d+)(?:::(\w+))?$/;
const SELF_PLUS_ONE = /^(\w+)\s*\+\s*1$/;

function fromParameter(raw: unknown, cast: string | undefined): unknown {
  if (cast === "jsonb" && typeof raw === "string") return JSON.parse(raw);
  return raw;
}

function evaluate(expression: string, run: Row, params: unknown[]): unknown {
  const text = expression.trim();
  if (text.toUpperCase() === "NULL") return null;
  if (text === "now()") return FIXED_NOW;
  const quoted = QUOTED.exec(text);
  if (quoted !== null) return quoted[1];
  const parameter = PARAMETER.exec(text);
  if (parameter !== null) {
    return fromParameter(params[Number(parameter[1]) - 1], parameter[2]);
  }
  const increment = SELF_PLUS_ONE.exec(text);
  if (increment !== null) return Number(run[increment[1] ?? ""]) + 1;
  if (text in run) return run[text];
  throw new Error(`the store stand-in cannot evaluate: ${text}`);
}

function applyUpdate(sql: string, params: unknown[], run: Row): boolean {
  const required = REQUIRED_STATUS.exec(sql)?.[1];
  if (required !== undefined && run["status"] !== required) return false;
  const next: Row = { ...run };
  for (const part of (SET_CLAUSE.exec(sql)?.[1] ?? "").split(",")) {
    const match = ASSIGNMENT.exec(part);
    if (match === null) continue;
    const [, column, expression] = match;
    if (column === undefined || expression === undefined) continue;
    next[column] = evaluate(expression, run, params);
  }
  Object.assign(run, next);
  return true;
}

function answer(sql: string, params: unknown[], run: Row): Row[] {
  if (sql.startsWith("UPDATE llm_run")) {
    return applyUpdate(sql, params, run) ? [structuredClone(run)] : [];
  }
  if (sql.includes("GROUP BY validation_outcome")) return [];
  if (sql.includes("FROM information_fragment")) return [{ n: 0 }];
  if (sql.includes("FROM llm_run")) return [structuredClone(run)];
  if (sql.includes("FROM raw_information")) return [RAW_INFORMATION_ROW];
  if (sql.includes("FROM raw_chunk")) return CHUNK_ROWS;
  return [];
}

function clientOf(world: RetriedRunWorld): PoolClient {
  return {
    query: async (...args: unknown[]) => {
      const sql = String(args[0]).replace(/\s+/g, " ").trim();
      const rows = answer(sql, Array.isArray(args[1]) ? args[1] : [], world.run);
      return { rows, rowCount: rows.length };
    },
    release: (): undefined => undefined,
  } as unknown as PoolClient;
}

function poolOf(world: RetriedRunWorld): Pool {
  const client = clientOf(world);
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

function modelOf(world: RetriedRunWorld): AnthropicLike {
  return {
    messages: {
      stream: (
        req: ExtractionMessageRequest | ContextMessageRequest
      ): ExtractionMessageStream => {
        const text = userTextOf(req.messages);
        const reading = TOKENS.every((token) => text.includes(token));
        world.calls.push({ text, reading });
        const reply = reading ? JSON.stringify(READING_ANSWER) : CHUNK_REPLY;
        return { finalMessage: async () => endTurn(reply) };
      },
    },
  };
}

export function failedRunWorld(held: HeldDocumentContext): RetriedRunWorld {
  const run = llmRunRow({ status: "failed", prompt_version: PROMPT_VERSION, held });
  return { run, calls: [] };
}

export async function retryRun(world: RetriedRunWorld): Promise<LlmRunResponse> {
  return retryLlmRun(clientOf(world), RUN_ID);
}

export async function extractRun(world: RetriedRunWorld): Promise<LlmRunResponse> {
  return runLlmExtraction(poolOf(world), RUN_ID, pino({ level: "silent" }), CATALOG, {
    env: { ANTHROPIC_API_KEY: API_KEY, CONTEXT_MODEL },
    anthropicFactory: () => modelOf(world),
  });
}

export function readingCalls(world: RetriedRunWorld): ModelCall[] {
  return world.calls.filter((call) => call.reading);
}

export function chunkCalls(world: RetriedRunWorld): ModelCall[] {
  return world.calls.filter((call) => !call.reading);
}
