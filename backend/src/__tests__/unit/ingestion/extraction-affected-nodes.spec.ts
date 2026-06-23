// TC-02 / BR-33 — runLlmExtraction collects affected node ids during the
// per-chunk tool-use loop and writes them through to the LRU cache on
// happy-path completion.

import { beforeEach, describe, expect, it, vi } from "vitest";
import pino from "pino";
import type Anthropic from "@anthropic-ai/sdk";
import type { Pool, PoolClient } from "pg";

import { buildSnapshot } from "../../../modules/ingestion/catalog/catalog.js";
import { runLlmExtraction } from "../../../modules/ingestion/service/extraction.service.js";
import type {
  AnthropicLike,
  ExtractionMessageRequest,
  ExtractionMessageStream,
} from "../../../modules/ingestion/service/extraction.service.js";
import {
  __clearAffectedNodesCacheForTests,
  getCachedAffectedNodes,
} from "../../../modules/ingestion/service/affected-nodes.js";

const RUN_ID = "44444444-4444-4444-4444-444444444444";
const RAW_INFO_ID = "55555555-5555-4555-8555-555555555555";
const CHUNK_A_ID = "66666666-6666-4666-8666-666666666666";
const NODE_TYPE_PERSON = "00000000-0000-0000-0000-000000000001";
const NODE_A_ID = "11111111-1111-4111-8111-111111111111";
const NODE_B_ID = "22222222-2222-4222-8222-222222222222";

function buildTestCatalog() {
  return buildSnapshot({
    nodeTypes: [{ id: NODE_TYPE_PERSON, name: "Person" }],
    linkTypes: [],
    linkTypeRules: [],
    attributeKeys: [],
  });
}

interface PoolState {
  runStatus: "running" | "completed" | "failed";
  proposeNodeResults: Array<{ node_id: string; resolution: string }>;
  proposeNodeCursor: number;
  /** Whether knowledge_node lookups should return the test fixtures. */
  resolverActive: boolean;
}

function buildPool(): { pool: Pool; state: PoolState } {
  const state: PoolState = {
    runStatus: "running",
    proposeNodeResults: [
      { node_id: NODE_A_ID, resolution: "created_new" },
      { node_id: NODE_B_ID, resolution: "matched_existing" },
    ],
    proposeNodeCursor: 0,
    resolverActive: true,
  };

  const connect = async () => {
    const client = {
      query: vi.fn(async (...args: unknown[]) => {
        const rawSql = String(args[0]);
        const sql = rawSql.replace(/\s+/g, " ").trim();
        const upper = sql.toUpperCase();

        if (upper === "BEGIN" || upper === "BEGIN READ ONLY") {
          return { rows: [], rowCount: 0 };
        }
        if (upper === "COMMIT" || upper === "ROLLBACK") {
          return { rows: [], rowCount: 0 };
        }

        // findLlmRunById
        if (sql.startsWith("SELECT") && sql.includes("FROM llm_run")) {
          return {
            rows: [
              {
                id: RUN_ID,
                model: "claude-sonnet-4-6",
                prompt_version: "v3",
                started_at: new Date("2026-06-23T10:00:00Z"),
                finished_at:
                  state.runStatus === "running"
                    ? null
                    : new Date("2026-06-23T10:00:42Z"),
                status: state.runStatus,
                attempts: 1,
                input_raw_information_id: RAW_INFO_ID,
                idempotency_key: "a".repeat(64),
              },
            ],
            rowCount: 1,
          };
        }

        // findRawInformationById
        if (sql.startsWith("SELECT") && sql.includes("FROM raw_information")) {
          return {
            rows: [
              {
                id: RAW_INFO_ID,
                source_type: "outro",
                content: "doc content",
                storage_ref: null,
                content_hash: "f".repeat(64),
                received_at: new Date("2026-06-23T09:00:00Z"),
                metadata: { title: "Test doc" },
              },
            ],
            rowCount: 1,
          };
        }

        // findChunksByRawInformationId
        if (
          sql.startsWith("SELECT") &&
          sql.includes("FROM raw_chunk") &&
          sql.includes("ORDER BY chunk_index")
        ) {
          return {
            rows: [
              {
                id: CHUNK_A_ID,
                raw_information_id: RAW_INFO_ID,
                chunk_index: 0,
                text: "Alice met Bob.",
                offset_start: 0,
                offset_end: 14,
                locator: null,
                chunking_version: "v1",
              },
            ],
            rowCount: 1,
          };
        }

        // UPDATE llm_run SET status
        if (sql.startsWith("UPDATE llm_run") && sql.includes("status")) {
          const params = (args[1] as unknown[]) ?? [];
          state.runStatus = params[1] as "completed" | "failed";
          return {
            rows: [
              {
                id: RUN_ID,
                model: "claude-sonnet-4-6",
                prompt_version: "v3",
                started_at: new Date("2026-06-23T10:00:00Z"),
                finished_at: new Date("2026-06-23T10:00:42Z"),
                status: state.runStatus,
                attempts: 1,
                input_raw_information_id: RAW_INFO_ID,
                idempotency_key: "a".repeat(64),
              },
            ],
            rowCount: 1,
          };
        }

        // tool_call aggregate (summary)
        if (
          sql.startsWith("SELECT") &&
          sql.includes("FROM tool_call") &&
          sql.includes("GROUP BY")
        ) {
          return { rows: [], rowCount: 0 };
        }

        // Resolver: knowledge_node JOIN node_type
        if (sql.includes("knowledge_node") && sql.includes("node_type")) {
          if (!state.resolverActive) return { rows: [], rowCount: 0 };
          return {
            rows: [
              {
                id: NODE_A_ID,
                canonical_name: "Alice",
                node_type: "Person",
                status: "active",
                merged_into_node_id: null,
              },
              {
                id: NODE_B_ID,
                canonical_name: "Bob",
                node_type: "Person",
                status: "active",
                merged_into_node_id: null,
              },
            ],
            rowCount: 2,
          };
        }

        // catch-all
        return { rows: [], rowCount: 0 };
      }),
      release: () => undefined,
    } as unknown as PoolClient;

    return client;
  };

  const pool = { connect } as unknown as Pool;
  return { pool, state };
}

// Build a stub Anthropic client that scripts the messages.
type ScriptedMessage = Anthropic.Messages.Message;

function buildAnthropicStub(messages: readonly ScriptedMessage[]): {
  client: AnthropicLike;
  calls: ExtractionMessageRequest[];
} {
  const calls: ExtractionMessageRequest[] = [];
  let cursor = 0;
  const client: AnthropicLike = {
    messages: {
      stream(req: ExtractionMessageRequest): ExtractionMessageStream {
        calls.push({ ...req, messages: req.messages.map((m) => ({ ...m })) });
        const msg = messages[cursor];
        cursor += 1;
        return {
          finalMessage: async () => {
            if (msg === undefined) {
              throw new Error(`script exhausted at cursor=${cursor}`);
            }
            return msg;
          },
        };
      },
    },
  };
  return { client, calls };
}

function endTurnMessage(): ScriptedMessage {
  return {
    id: "msg_end",
    type: "message",
    role: "assistant",
    model: "claude-sonnet-4-6",
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
  } as unknown as ScriptedMessage;
}

describe("runLlmExtraction — BR-33 affected-nodes collection + write-through", () => {
  beforeEach(() => __clearAffectedNodesCacheForTests());

  it("happy path with no propose_* tool_use blocks -> caches empty list", async () => {
    const { pool } = buildPool();
    const { client } = buildAnthropicStub([endTurnMessage()]);

    const result = await runLlmExtraction(
      pool,
      RUN_ID,
      pino({ level: "silent" }),
      buildTestCatalog(),
      {
        env: { ANTHROPIC_API_KEY: "sk-ant-test" },
        anthropicFactory: () => client,
      }
    );

    expect(result.status).toBe("completed");
    // BR-33 — empty array IS a valid completed-run payload, written to the cache.
    const cached = getCachedAffectedNodes(RUN_ID);
    expect(cached).toEqual([]);
    // And surfaced on the response.
    expect(result.affected_nodes).toEqual([]);
  });
});
