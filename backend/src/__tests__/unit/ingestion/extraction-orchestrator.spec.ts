// TC-12 — Extraction orchestrator acceptance (BR-26 / UC-12).
//
// Drives `runLlmExtraction` against a fully-stubbed Anthropic client and a
// mock `pg` pool that records every transaction + audit row. The tests
// cover the five validation criteria of TC-12:
//
//   1. End_turn after multiple tool_use blocks (BR-26 step 5b bullet 1).
//   2. Pause_turn resumed once without modifying messages (bullet 2).
//   3. Refusal logged + chunk skipped (bullet 3).
//   4. >=3 consecutive 'error' outcomes -> run failed -> 500.
//   5. Anthropic SDK fatal error -> run failed -> 502 with partial summary.
//
// Plus the pre-check paths: 404 unknown run, 409 not running.

import { describe, expect, it, vi } from "vitest";
import pino from "pino";
import type Anthropic from "@anthropic-ai/sdk";
import type { Pool, PoolClient } from "pg";

import { buildSnapshot } from "../../../modules/ingestion/catalog/catalog.js";
import { ResourceNotFoundError } from "../../../modules/ingestion/service/ingestion.service.js";
import {
  ExtractionFatalError,
  LlmProviderFatalError,
  RunNotRunnableError,
  runLlmExtraction,
  type AnthropicLike,
  type ExtractionMessageRequest,
  type ExtractionMessageStream,
} from "../../../modules/ingestion/service/extraction.service.js";

// -------------------------------------------------------------------------
// Fixed IDs
// -------------------------------------------------------------------------

const RUN_ID = "44444444-4444-4444-4444-444444444444";
const RAW_INFO_ID = "55555555-5555-4555-8555-555555555555";
const CHUNK_A_ID = "66666666-6666-4666-8666-666666666666";
const CHUNK_B_ID = "77777777-7777-4777-8777-777777777777";
const NODE_TYPE_PERSON = "00000000-0000-0000-0000-000000000001";

// -------------------------------------------------------------------------
// Mock catalog (small subset — orchestrator only needs the snapshot to pass
// through to propose-* handlers and to render the system prompt).
// -------------------------------------------------------------------------

function buildTestCatalog() {
  return buildSnapshot({
    nodeTypes: [{ id: NODE_TYPE_PERSON, name: "Person" }],
    linkTypes: [],
    linkTypeRules: [],
    attributeKeys: [],
  });
}

// -------------------------------------------------------------------------
// Mock pg pool
// -------------------------------------------------------------------------

interface TxRecord {
  state: "idle" | "open";
  committed: number;
  rolledBack: number;
  queries: string[];
}

interface PoolState {
  txs: TxRecord[];
  toolCalls: Array<{
    tool_name: string;
    validation_outcome: string;
    llm_run_id: string;
  }>;
  runStatus: "running" | "completed" | "failed";
  runStatusHistory: Array<"running" | "completed" | "failed">;
  /** When true `findLlmRunById` returns null on the first read. */
  runMissing: boolean;
}

function buildPool(initial: Partial<PoolState>): {
  pool: Pool;
  state: PoolState;
} {
  const state: PoolState = {
    txs: [],
    toolCalls: [],
    runStatus: initial.runStatus ?? "running",
    runStatusHistory: [],
    runMissing: initial.runMissing ?? false,
  };

  const connect = async () => {
    const tx: TxRecord = {
      state: "idle",
      committed: 0,
      rolledBack: 0,
      queries: [],
    };
    state.txs.push(tx);

    const client = {
      query: async (...args: unknown[]) => {
        const rawSql = String(args[0]);
        const sql = rawSql.replace(/\s+/g, " ").trim();
        const params = (args[1] as unknown[]) ?? [];
        tx.queries.push(sql);
        const upper = sql.toUpperCase();

        if (upper === "BEGIN") {
          tx.state = "open";
          return { rows: [], rowCount: 0 };
        }
        if (upper === "COMMIT") {
          tx.state = "idle";
          tx.committed += 1;
          return { rows: [], rowCount: 0 };
        }
        if (upper === "ROLLBACK") {
          tx.state = "idle";
          tx.rolledBack += 1;
          return { rows: [], rowCount: 0 };
        }

        // UPDATE llm_run SET status = ...
        if (sql.startsWith("UPDATE llm_run") && sql.includes("status")) {
          const newStatus = params[1] as "completed" | "failed";
          state.runStatus = newStatus;
          state.runStatusHistory.push(newStatus);
          return {
            rows: [
              {
                id: RUN_ID,
                model: "claude-opus-4-8",
                prompt_version: "v1",
                started_at: new Date("2026-06-11T20:24:00Z"),
                finished_at: new Date("2026-06-11T20:29:42Z"),
                status: newStatus,
                attempts: 1,
                input_raw_information_id: RAW_INFO_ID,
                idempotency_key: "a".repeat(64),
              },
            ],
            rowCount: 1,
          };
        }

        // findLlmRunById
        if (sql.startsWith("SELECT") && sql.includes("FROM llm_run")) {
          if (state.runMissing) return { rows: [], rowCount: 0 };
          return {
            rows: [
              {
                id: RUN_ID,
                model: "claude-opus-4-8",
                prompt_version: "v1",
                started_at: new Date("2026-06-11T20:24:00Z"),
                finished_at:
                  state.runStatus === "running"
                    ? null
                    : new Date("2026-06-11T20:29:42Z"),
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
                source_type: "text",
                content: "doc content",
                storage_ref: null,
                content_hash: "f".repeat(64),
                received_at: new Date("2026-06-11T20:00:00Z"),
                metadata: { document_date: "2026-06-11", title: "Test doc" },
              },
            ],
            rowCount: 1,
          };
        }

        // findChunksByRawInformationId
        if (sql.startsWith("SELECT") && sql.includes("FROM raw_chunk") && sql.includes("ORDER BY chunk_index")) {
          return {
            rows: [
              {
                id: CHUNK_A_ID,
                raw_information_id: RAW_INFO_ID,
                chunk_index: 0,
                text: "First chunk text — talks about Alice and Bob.",
                offset_start: 0,
                offset_end: 46,
                locator: null,
                chunking_version: "v1",
              },
              {
                id: CHUNK_B_ID,
                raw_information_id: RAW_INFO_ID,
                chunk_index: 1,
                text: "Second chunk text — adds context about the team.",
                offset_start: 46,
                offset_end: 93,
                locator: null,
                chunking_version: "v1",
              },
            ],
            rowCount: 2,
          };
        }

        // tool_call aggregate (BR-12 summary)
        if (
          sql.startsWith("SELECT") &&
          sql.includes("FROM tool_call") &&
          sql.includes("GROUP BY")
        ) {
          // Derive summary from recorded tool_calls.
          const counts: Record<string, number> = {};
          for (const tc of state.toolCalls) {
            counts[tc.validation_outcome] =
              (counts[tc.validation_outcome] ?? 0) + 1;
          }
          return {
            rows: Object.entries(counts).map(([validation_outcome, n]) => ({
              validation_outcome,
              n: String(n),
            })),
            rowCount: Object.keys(counts).length,
          };
        }

        // count chunks in source — used by proposeFragmentService Layer 1.
        if (sql.startsWith("SELECT count(*)") && sql.includes("FROM raw_chunk")) {
          return { rows: [{ n: "1" }], rowCount: 1 };
        }

        // tool_call insert (audit row, BR-23)
        if (sql.startsWith("INSERT INTO tool_call")) {
          state.toolCalls.push({
            llm_run_id: String(params[0]),
            tool_name: String(params[1]),
            validation_outcome: String(params[4]),
          });
          return {
            rows: [
              {
                id: "tool-call-row-id",
                llm_run_id: String(params[0]),
                tool_name: String(params[1]),
                arguments: {},
                result: null,
                validation_outcome: String(params[4]),
                created_at: new Date(),
              },
            ],
            rowCount: 1,
          };
        }

        // information_fragment insert
        if (sql.startsWith("INSERT INTO information_fragment")) {
          return {
            rows: [{ id: "frag-id-001" }],
            rowCount: 1,
          };
        }

        // fragment_source insert
        if (sql.startsWith("INSERT INTO fragment_source")) {
          return { rows: [], rowCount: 1 };
        }

        // catch-all: empty result
        return { rows: [], rowCount: 0 };
      },
      release: () => undefined,
    } as unknown as PoolClient;

    return client;
  };

  const pool = { connect } as unknown as Pool;
  return { pool, state };
}

// -------------------------------------------------------------------------
// Mock Anthropic client
// -------------------------------------------------------------------------

/** A scripted response: returned from `stream().finalMessage()` in order. */
type ScriptedResponse =
  | { kind: "response"; message: Anthropic.Messages.Message }
  | { kind: "throw"; error: unknown };

/**
 * Convenience: wrap a `Message` directly into a `{kind:"response"}` entry.
 * Tests pass `Message | ScriptedResponse` and this helper normalises them.
 */
function asResponse(
  item: Anthropic.Messages.Message | ScriptedResponse
): ScriptedResponse {
  if ("kind" in item) return item;
  return { kind: "response", message: item };
}

function buildAnthropicStub(
  rawScript: ReadonlyArray<Anthropic.Messages.Message | ScriptedResponse>
): {
  client: AnthropicLike;
  callsMade: ExtractionMessageRequest[];
} {
  const script: ScriptedResponse[] = rawScript.map(asResponse);
  const callsMade: ExtractionMessageRequest[] = [];
  let cursor = 0;

  const client: AnthropicLike = {
    messages: {
      stream(req: ExtractionMessageRequest): ExtractionMessageStream {
        callsMade.push({
          ...req,
          // Capture messages by value (snapshot at call time).
          messages: req.messages.map((m) => ({ ...m })),
        });
        const item = script[cursor];
        cursor += 1;
        return {
          finalMessage: async (): Promise<Anthropic.Messages.Message> => {
            if (item === undefined) {
              throw new Error(
                `Anthropic stub script exhausted at cursor=${cursor} (script length=${script.length})`
              );
            }
            if (item.kind === "throw") {
              throw item.error;
            }
            return item.message;
          },
        };
      },
    },
  };

  return { client, callsMade };
}

// -------------------------------------------------------------------------
// Helpers to build canned Message responses
// -------------------------------------------------------------------------

function endTurnMessage(): Anthropic.Messages.Message {
  return {
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
}

function pauseTurnMessage(): Anthropic.Messages.Message {
  return {
    id: "msg_pause",
    type: "message",
    role: "assistant",
    model: "claude-opus-4-8",
    content: [{ type: "text", text: "paused", citations: null }],
    stop_reason: "pause_turn",
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

function refusalMessage(): Anthropic.Messages.Message {
  return {
    id: "msg_refusal",
    type: "message",
    role: "assistant",
    model: "claude-opus-4-8",
    content: [{ type: "text", text: "refusing", citations: null }],
    stop_reason: "refusal",
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

function toolUseMessage(
  toolUseBlocks: Array<{
    id: string;
    name: string;
    input: Record<string, unknown>;
  }>
): Anthropic.Messages.Message {
  return {
    id: `msg_tool_${toolUseBlocks[0]?.id ?? "x"}`,
    type: "message",
    role: "assistant",
    model: "claude-opus-4-8",
    content: toolUseBlocks.map(
      (b) =>
        ({
          type: "tool_use",
          id: b.id,
          name: b.name,
          input: b.input,
        }) as Anthropic.Messages.ToolUseBlock
    ),
    stop_reason: "tool_use",
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

// -------------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------------

function silentLogger() {
  return pino({ level: "silent" });
}

function fragmentArgs() {
  return {
    text: "Alice met Bob.",
    confidence: 0.92,
    chunk_ids: [CHUNK_A_ID],
  };
}

// =========================================================================
// TESTS
// =========================================================================

describe("TC-12 — runLlmExtraction orchestrator", () => {
  it("404: unknown run id → ResourceNotFoundError", async () => {
    const { pool } = buildPool({ runMissing: true });
    const { client } = buildAnthropicStub([]);
    await expect(
      runLlmExtraction(pool, RUN_ID, silentLogger(), buildTestCatalog(), {
        env: { ANTHROPIC_API_KEY: "sk-ant-test" },
        anthropicFactory: () => client,
      })
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it("409 BUSINESS_RUN_NOT_RUNNABLE: run is completed", async () => {
    const { pool } = buildPool({ runStatus: "completed" });
    const { client } = buildAnthropicStub([]);
    await expect(
      runLlmExtraction(pool, RUN_ID, silentLogger(), buildTestCatalog(), {
        env: { ANTHROPIC_API_KEY: "sk-ant-test" },
        anthropicFactory: () => client,
      })
    ).rejects.toBeInstanceOf(RunNotRunnableError);
  });

  it("409 BUSINESS_RUN_NOT_RUNNABLE: run is failed", async () => {
    const { pool } = buildPool({ runStatus: "failed" });
    const { client } = buildAnthropicStub([]);
    let caught: unknown;
    try {
      await runLlmExtraction(pool, RUN_ID, silentLogger(), buildTestCatalog(), {
        env: { ANTHROPIC_API_KEY: "sk-ant-test" },
        anthropicFactory: () => client,
      });
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(RunNotRunnableError);
    expect((caught as RunNotRunnableError).code).toBe(
      "BUSINESS_RUN_NOT_RUNNABLE"
    );
    expect((caught as RunNotRunnableError).statusCode).toBe(409);
    expect((caught as RunNotRunnableError).currentStatus).toBe("failed");
  });

  it("happy path: two tool_use blocks then end_turn — both dispatched, run completed", async () => {
    const { pool, state } = buildPool({});
    const { client, callsMade } = buildAnthropicStub([
      // Chunk 1 turn 1: emit 2 propose_fragment calls.
      toolUseMessage([
        { id: "tu_1", name: "propose_fragment", input: fragmentArgs() },
        { id: "tu_2", name: "propose_fragment", input: fragmentArgs() },
      ]),
      // Chunk 1 turn 2: end_turn.
      endTurnMessage(),
      // Chunk 2 turn 1: end_turn (no extraction).
      endTurnMessage(),
    ]);

    const result = await runLlmExtraction(
      pool,
      RUN_ID,
      silentLogger(),
      buildTestCatalog(),
      {
        env: { ANTHROPIC_API_KEY: "sk-ant-test" },
        anthropicFactory: () => client,
      }
    );

    // Both tool_use blocks dispatched -> two tool_call audit rows.
    const fragmentToolCalls = state.toolCalls.filter(
      (t) => t.tool_name === "propose_fragment"
    );
    expect(fragmentToolCalls.length).toBe(2);
    // Each call is 'accepted' (happy path through propose-fragment service).
    expect(fragmentToolCalls.every((t) => t.validation_outcome === "accepted")).toBe(
      true
    );

    // Run closed as completed.
    expect(state.runStatusHistory).toContain("completed");
    expect(result.status).toBe("completed");
    // Summary aggregated from tool_call rows (BR-12).
    expect(result.summary.accepted).toBe(2);

    // Three stream calls total: 2 for chunk 1 (tool_use then end_turn), 1
    // for chunk 2 (end_turn). The orchestrator iterates chunks in order.
    expect(callsMade.length).toBe(3);
  });

  it("pause_turn: resumed once without modifying messages", async () => {
    const { pool, state } = buildPool({});
    const { client, callsMade } = buildAnthropicStub([
      // Chunk 1 turn 1: pause_turn.
      pauseTurnMessage(),
      // Chunk 1 turn 2: end_turn (the resume).
      endTurnMessage(),
      // Chunk 2 turn 1: end_turn.
      endTurnMessage(),
    ]);

    await runLlmExtraction(
      pool,
      RUN_ID,
      silentLogger(),
      buildTestCatalog(),
      {
        env: { ANTHROPIC_API_KEY: "sk-ant-test" },
        anthropicFactory: () => client,
      }
    );

    // Three stream calls (pause_turn → resume → end_turn for chunk 1; one
    // more for chunk 2).
    expect(callsMade.length).toBe(3);

    // BR-26 step 5b bullet 2: "continue the loop without modifying
    // `messages`". The pause-turn resume MUST send the SAME messages
    // array as the pause-turn call's payload — the only allowed mutation
    // between turns is the appended assistant turn from the previous
    // response (which carried the pause_turn message).
    //
    // After the orchestrator appends the pause_turn response, the next
    // stream call carries messages = [user, assistant(pause)]. The
    // assistant content is the literal pause-turn message — there are no
    // user tool_result blocks inserted in between (this is what
    // distinguishes pause_turn handling from tool_use handling).
    expect(callsMade[1]?.messages.length).toBe(2);
    expect(callsMade[1]?.messages[1]?.role).toBe("assistant");

    // Run closed as completed.
    expect(state.runStatusHistory).toContain("completed");
  });

  it("refusal: logged, chunk skipped, next chunk continues normally", async () => {
    const logger = pino({ level: "silent" });
    const warnSpy = vi.spyOn(logger, "warn");
    const { pool, state } = buildPool({});
    const { client, callsMade } = buildAnthropicStub([
      // Chunk 1 turn 1: refusal — chunk soft-skipped.
      refusalMessage(),
      // Chunk 2 turn 1: end_turn (chunk continues).
      endTurnMessage(),
    ]);

    await runLlmExtraction(pool, RUN_ID, logger, buildTestCatalog(), {
      env: { ANTHROPIC_API_KEY: "sk-ant-test" },
      anthropicFactory: () => client,
    });

    // The warn was emitted for the refusal (extraction_chunk_refused).
    const refusalWarn = warnSpy.mock.calls.find(
      (call) =>
        typeof call[1] === "string" && call[1] === "extraction_chunk_refused"
    );
    expect(refusalWarn).toBeDefined();

    // Two stream calls — refusal closed chunk 1, end_turn closed chunk 2.
    expect(callsMade.length).toBe(2);

    // Run closed as completed (refusal is a soft per-chunk failure).
    expect(state.runStatusHistory).toContain("completed");
  });

  it(">=3 consecutive INTERNAL errors in one chunk: run failed → ExtractionFatalError (500)", async () => {
    // Override the pool so every tool_call dispatch produces an INTERNAL
    // error envelope. The simplest way is to make the propose-fragment
    // service throw inside its query; the audit row will land with
    // validation_outcome='error'.
    //
    // We can do this by overriding the pg pool to throw on any
    // INSERT INTO information_fragment.
    const state: PoolState = {
      txs: [],
      toolCalls: [],
      runStatus: "running",
      runStatusHistory: [],
      runMissing: false,
    };

    const connect = async () => {
      const tx: TxRecord = {
        state: "idle",
        committed: 0,
        rolledBack: 0,
        queries: [],
      };
      state.txs.push(tx);
      const client = {
        query: async (...args: unknown[]) => {
          const rawSql = String(args[0]);
          const sql = rawSql.replace(/\s+/g, " ").trim();
          const params = (args[1] as unknown[]) ?? [];
          tx.queries.push(sql);
          const upper = sql.toUpperCase();

          if (upper === "BEGIN") {
            tx.state = "open";
            return { rows: [], rowCount: 0 };
          }
          if (upper === "COMMIT") {
            tx.state = "idle";
            tx.committed += 1;
            return { rows: [], rowCount: 0 };
          }
          if (upper === "ROLLBACK") {
            tx.state = "idle";
            tx.rolledBack += 1;
            return { rows: [], rowCount: 0 };
          }

          if (sql.startsWith("UPDATE llm_run") && sql.includes("status")) {
            const newStatus = params[1] as "completed" | "failed";
            state.runStatus = newStatus;
            state.runStatusHistory.push(newStatus);
            return {
              rows: [
                {
                  id: RUN_ID,
                  model: "claude-opus-4-8",
                  prompt_version: "v1",
                  started_at: new Date(),
                  finished_at: new Date(),
                  status: newStatus,
                  attempts: 1,
                  input_raw_information_id: RAW_INFO_ID,
                  idempotency_key: "a".repeat(64),
                },
              ],
              rowCount: 1,
            };
          }

          if (sql.startsWith("SELECT") && sql.includes("FROM llm_run")) {
            return {
              rows: [
                {
                  id: RUN_ID,
                  model: "claude-opus-4-8",
                  prompt_version: "v1",
                  started_at: new Date(),
                  finished_at:
                    state.runStatus === "running" ? null : new Date(),
                  status: state.runStatus,
                  attempts: 1,
                  input_raw_information_id: RAW_INFO_ID,
                  idempotency_key: "a".repeat(64),
                },
              ],
              rowCount: 1,
            };
          }

          if (sql.startsWith("SELECT") && sql.includes("FROM raw_information")) {
            return {
              rows: [
                {
                  id: RAW_INFO_ID,
                  source_type: "text",
                  content: "doc",
                  storage_ref: null,
                  content_hash: "f".repeat(64),
                  received_at: new Date(),
                  metadata: {},
                },
              ],
              rowCount: 1,
            };
          }

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
                  text: "chunk text",
                  offset_start: 0,
                  offset_end: 10,
                  locator: null,
                  chunking_version: "v1",
                },
              ],
              rowCount: 1,
            };
          }

          if (sql.startsWith("SELECT count(*)") && sql.includes("FROM raw_chunk")) {
            return { rows: [{ n: "1" }], rowCount: 1 };
          }

          // tool_call aggregate
          if (
            sql.startsWith("SELECT") &&
            sql.includes("FROM tool_call") &&
            sql.includes("GROUP BY")
          ) {
            const counts: Record<string, number> = {};
            for (const tc of state.toolCalls) {
              counts[tc.validation_outcome] =
                (counts[tc.validation_outcome] ?? 0) + 1;
            }
            return {
              rows: Object.entries(counts).map(([validation_outcome, n]) => ({
                validation_outcome,
                n: String(n),
              })),
              rowCount: Object.keys(counts).length,
            };
          }

          // tool_call insert — accept the row, record outcome.
          if (sql.startsWith("INSERT INTO tool_call")) {
            state.toolCalls.push({
              llm_run_id: String(params[0]),
              tool_name: String(params[1]),
              validation_outcome: String(params[4]),
            });
            return { rows: [{ id: "row-id" }], rowCount: 1 };
          }

          // Force the propose-fragment service to fail inside the business
          // transaction → handler shell catches it as an internal error and
          // writes the audit row with validation_outcome='error'.
          if (sql.startsWith("INSERT INTO information_fragment")) {
            throw new Error("simulated DB outage");
          }

          return { rows: [], rowCount: 0 };
        },
        release: () => undefined,
      } as unknown as PoolClient;
      return client;
    };

    const pool = { connect } as unknown as Pool;

    const { client } = buildAnthropicStub([
      // One assistant message with 3 propose_fragment calls — each will
      // produce an 'error' audit row -> burst threshold (3) hit.
      toolUseMessage([
        { id: "tu_a", name: "propose_fragment", input: fragmentArgs() },
        { id: "tu_b", name: "propose_fragment", input: fragmentArgs() },
        { id: "tu_c", name: "propose_fragment", input: fragmentArgs() },
      ]),
    ]);

    let caught: unknown;
    try {
      await runLlmExtraction(
        pool,
        RUN_ID,
        silentLogger(),
        buildTestCatalog(),
        {
          env: { ANTHROPIC_API_KEY: "sk-ant-test" },
          anthropicFactory: () => client,
        }
      );
    } catch (e) {
      caught = e;
    }

    expect(caught).toBeInstanceOf(ExtractionFatalError);
    expect((caught as ExtractionFatalError).statusCode).toBe(500);
    expect((caught as ExtractionFatalError).code).toBe("SYSTEM_INTERNAL_ERROR");
    // Run closed as 'failed' (BR-26 step 7).
    expect(state.runStatusHistory[state.runStatusHistory.length - 1]).toBe(
      "failed"
    );
    // Three error tool_call rows were written (the burst).
    const errorRows = state.toolCalls.filter(
      (t) => t.validation_outcome === "error"
    );
    expect(errorRows.length).toBe(3);
  });

  it("Anthropic SDK fatal error: run failed → LlmProviderFatalError (502) with partial summary", async () => {
    const { pool, state } = buildPool({});
    const sdkError = Object.assign(new Error("network is down"), {
      name: "AnthropicConnectionError",
    });
    const { client } = buildAnthropicStub([{ kind: "throw", error: sdkError }]);

    let caught: unknown;
    try {
      await runLlmExtraction(pool, RUN_ID, silentLogger(), buildTestCatalog(), {
        env: { ANTHROPIC_API_KEY: "sk-ant-test" },
        anthropicFactory: () => client,
      });
    } catch (e) {
      caught = e;
    }

    expect(caught).toBeInstanceOf(LlmProviderFatalError);
    const err = caught as LlmProviderFatalError;
    expect(err.statusCode).toBe(502);
    expect(err.code).toBe("SYSTEM_LLM_PROVIDER_UNAVAILABLE");
    expect(err.partialRun).toBeDefined();
    expect(err.partialRun.id).toBe(RUN_ID);
    // Partial summary present (all zeros — no tool calls landed).
    expect(err.partialRun.summary).toBeDefined();
    // Run was closed as 'failed' before throwing.
    expect(state.runStatusHistory[state.runStatusHistory.length - 1]).toBe(
      "failed"
    );
    // The error message must NOT contain the API key.
    expect(err.message).not.toContain("sk-ant-test");
  });

  it("ANTHROPIC_API_KEY never appears in error sentinels even when fatal SDK error fires", async () => {
    const { pool } = buildPool({});
    // Construct an error whose .message contains the API key — simulates
    // a poorly-written SDK that echoed the key. The orchestrator MUST
    // forward only the SDK's message verbatim (not stash the key).
    const sdkError = Object.assign(
      new Error("auth failed for token sk-ant-secret-from-sdk"),
      { name: "AnthropicAuthError" }
    );
    const { client } = buildAnthropicStub([{ kind: "throw", error: sdkError }]);

    let caught: unknown;
    try {
      await runLlmExtraction(pool, RUN_ID, silentLogger(), buildTestCatalog(), {
        env: { ANTHROPIC_API_KEY: "sk-ant-test-correct" },
        anthropicFactory: () => client,
      });
    } catch (e) {
      caught = e;
    }
    // The error message reflects the SDK cause — and crucially NEVER the
    // env-supplied key.
    expect((caught as Error).message).not.toContain("sk-ant-test-correct");
  });

  it("uncaught (non-SDK) exception: run failed → ExtractionFatalError (500)", async () => {
    const { pool, state } = buildPool({});
    const { client } = buildAnthropicStub([
      { kind: "throw", error: new Error("plain generic exception") },
    ]);

    let caught: unknown;
    try {
      await runLlmExtraction(pool, RUN_ID, silentLogger(), buildTestCatalog(), {
        env: { ANTHROPIC_API_KEY: "sk-ant-test" },
        anthropicFactory: () => client,
      });
    } catch (e) {
      caught = e;
    }

    expect(caught).toBeInstanceOf(ExtractionFatalError);
    expect((caught as ExtractionFatalError).statusCode).toBe(500);
    expect(state.runStatusHistory[state.runStatusHistory.length - 1]).toBe(
      "failed"
    );
  });

  it("each tool dispatch acquires its own client (BR-19 — orchestrator does not hold a pg client across tool calls)", async () => {
    const { pool, state } = buildPool({});
    const { client } = buildAnthropicStub([
      toolUseMessage([
        { id: "tu_x", name: "propose_fragment", input: fragmentArgs() },
        { id: "tu_y", name: "propose_fragment", input: fragmentArgs() },
      ]),
      endTurnMessage(),
      endTurnMessage(),
    ]);

    await runLlmExtraction(pool, RUN_ID, silentLogger(), buildTestCatalog(), {
      env: { ANTHROPIC_API_KEY: "sk-ant-test" },
      anthropicFactory: () => client,
    });

    // Each tool_use must open its OWN transaction. We had two tool calls
    // in chunk 1; each is its own BR-19 boundary.
    const txsWithBegin = state.txs.filter((t) =>
      t.queries.some((q) => q.toUpperCase() === "BEGIN")
    );
    // pre-check loadRunContext (no BEGIN), then 2 tool TXs, then 2
    // closing reads (no BEGIN — only the close UPDATE has BEGIN), then
    // close-run (BEGIN), then finalRun read (no BEGIN).
    // -> at least 3 transactions issued BEGIN: 2 tool calls + 1 close.
    expect(txsWithBegin.length).toBeGreaterThanOrEqual(3);
  });
});
