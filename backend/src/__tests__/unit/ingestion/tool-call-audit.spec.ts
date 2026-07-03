// BR-23 ToolCall audit invariant.
//
// Acceptance: "tool_call row is always written (verified by a test that
// induces a rollback and checks tool_call exists)".
//
// We exercise `proposeFragmentHandler` with a deliberately-failing scenario
// (Zod min length on `text` triggers via direct call to runIngestHandler with
// a thrown ValidationFailure). The handler shell ROLLBACKs the business TX
// and writes the audit row via insertToolCallStandalone.

import { describe, expect, it } from "vitest";
import pino from "pino";

import { proposeFragmentHandler } from "../../../modules/ingestion/mcp/propose-fragment.handler.js";

interface Tx {
  state: "idle" | "open";
  committed: number;
  rolledBack: number;
}

interface ToolCallRow {
  llm_run_id: string;
  tool_name: string;
  validation_outcome: string;
}

function buildPool(): {
  pool: import("pg").Pool;
  toolCalls: ToolCallRow[];
  txs: Tx[];
} {
  const toolCalls: ToolCallRow[] = [];
  const txs: Tx[] = [];

  // Each `connect()` returns a fresh client backed by a fresh tx state, so we
  // can detect business-TX rollback vs audit-TX commit independently.
  const connect = async () => {
    const tx: Tx = { state: "idle", committed: 0, rolledBack: 0 };
    txs.push(tx);

    const client = {
      query: async (...args: unknown[]) => {
        const sql = String(args[0]).replace(/\s+/g, " ").trim();
        const params = (args[1] as unknown[]) ?? [];
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
        // The run row used by assertRunIsRunning.
        if (sql.startsWith("SELECT") && sql.includes("FROM llm_run")) {
          return {
            rows: [
              {
                id: "44444444-4444-4444-4444-444444444444",
                model: "claude",
                prompt_version: "v1",
                started_at: new Date(),
                finished_at: null,
                status: "running",
                attempts: 1,
                input_raw_information_id: "55555555-5555-4555-8555-555555555555",
                idempotency_key: "a".repeat(64),
              },
            ],
            rowCount: 1,
          };
        }
        // count chunks -> 0 (forces RESOURCE_NOT_FOUND or VALIDATION_INVALID_FORMAT branch)
        if (sql.startsWith("SELECT count(*)") && sql.includes("FROM raw_chunk")) {
          // Return mismatched count to trigger RESOURCE_NOT_FOUND branch.
          return { rows: [{ n: "0" }], rowCount: 1 };
        }
        // tool_call insert — capture
        if (sql.startsWith("INSERT INTO tool_call")) {
          toolCalls.push({
            llm_run_id: String(params[0]),
            tool_name: String(params[1]),
            validation_outcome: String(params[4]),
          });
          return { rows: [{ id: "tool-call-row-id" }], rowCount: 1 };
        }
        return { rows: [], rowCount: 0 };
      },
      release: () => undefined,
    } as unknown as import("pg").PoolClient;

    return client;
  };

  const pool = {
    connect,
  } as unknown as import("pg").Pool;

  return { pool, toolCalls, txs };
}

describe("BR-23 tool_call is always written (audit invariant)", () => {
  const llmRunId = "44444444-4444-4444-4444-444444444444";

  it("writes tool_call with validation_outcome='rejected' on validation failure", async () => {
    const { pool, toolCalls, txs } = buildPool();
    const result = await proposeFragmentHandler(
      {
        text: "hello",
        confidence: 0.9,
        chunk_ids: ["66666666-6666-4666-8666-666666666666"],
      },
      { pool, logger: pino({ level: "silent" }), llm_run_id: llmRunId }
    );

    expect(result.ok).toBe(false);
    // Two transactions were opened: one for the business path (which rolled
    // back due to NOT_FOUND) and one standalone for the audit row.
    expect(txs.length).toBeGreaterThanOrEqual(2);
    // The business TX rolled back.
    expect(txs[0]!.rolledBack).toBe(1);
    expect(txs[0]!.committed).toBe(0);
    // At least one COMMIT happened across the second/audit TX.
    const totalCommits = txs.reduce((s, t) => s + t.committed, 0);
    expect(totalCommits).toBeGreaterThan(0);
    // Audit row was captured with 'rejected'.
    expect(toolCalls.length).toBe(1);
    expect(toolCalls[0]!.tool_name).toBe("propose_fragment");
    expect(toolCalls[0]!.validation_outcome).toBe("rejected");
    expect(toolCalls[0]!.llm_run_id).toBe(llmRunId);
  });
});
