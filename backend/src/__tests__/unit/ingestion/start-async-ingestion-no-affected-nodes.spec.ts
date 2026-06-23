// TC-02 / BR-32 invariant — the `start_async_ingestion` handler MUST NOT
// include `affected_nodes` in its return envelope.
//
// Reason: extraction is detached (fire-and-forget). The orchestrator has not
// finished when the handler returns, so the affected-node list does not
// exist yet. The caller observes the field LATER via `get_ingestion_status`
// (BR-31 + BR-33). Surfacing the field from the handler would surface a
// PARTIAL list — fail-loud, never silent.

import { describe, expect, it, vi } from "vitest";
import pino from "pino";

import { startAsyncIngestionHandler } from "../../../modules/ingestion/mcp/start-async-ingestion.handler.js";
import type { StartAsyncIngestionDeps } from "../../../modules/ingestion/mcp/start-async-ingestion.handler.js";

function uuid(n: number): string {
  const hex = n.toString(16).padStart(2, "0");
  return `00000000-0000-4000-8000-0000000000${hex}`;
}

function makePool() {
  const fakeClient = {
    query: vi.fn(async () => ({ rows: [], rowCount: 0 })),
    release: vi.fn(),
  };
  return {
    connect: async () => fakeClient,
  };
}

function baseDeps(
  overrides: Partial<StartAsyncIngestionDeps> = {}
): StartAsyncIngestionDeps {
  return {
    pool: makePool() as unknown as StartAsyncIngestionDeps["pool"],
    logger: pino({ level: "silent" }),
    catalog: {} as StartAsyncIngestionDeps["catalog"],
    anthropicApiKey: "sk-test",
    scheduleBackground: () => {
      // detach but never actually invoke — we are testing the handler envelope.
    },
    ...overrides,
  };
}

const VALID_INPUT = {
  source_type: "outro" as const,
  content: "lorem ipsum",
};

describe("start_async_ingestion handler — BR-32 invariant (no affected_nodes)", () => {
  it("created path: envelope MUST NOT include affected_nodes (orchestrator detached)", async () => {
    const deps = baseDeps({
      ingestRaw: (async () => ({
        status: 201,
        body: {
          outcome: "created" as const,
          raw_information_id: uuid(50),
          content_hash: "0".repeat(64),
          chunk_count: 2,
          chunks: [],
          llm_run_id: uuid(60),
          idempotency_key: "0".repeat(64),
        },
      })) as StartAsyncIngestionDeps["ingestRaw"],
    });

    const env = await startAsyncIngestionHandler(VALID_INPUT, deps);
    expect(env.ok).toBe(true);
    const result = (env.result ?? {}) as Record<string, unknown>;
    expect(result.outcome).toBe("ingested");
    // Critical invariant — the handler NEVER surfaces `affected_nodes`.
    expect("affected_nodes" in result).toBe(false);
  });

  it("noop_existing path: envelope MUST NOT include affected_nodes (poll BR-31 instead)", async () => {
    const deps = baseDeps({
      ingestRaw: (async () => ({
        status: 200,
        body: {
          outcome: "noop_existing" as const,
          raw_information_id: uuid(50),
          content_hash: "0".repeat(64),
          chunk_count: 3,
          chunks: [],
          llm_run_id: uuid(60),
          idempotency_key: "0".repeat(64),
        },
      })) as StartAsyncIngestionDeps["ingestRaw"],
      readRunStatus: async () => "completed",
    });

    const env = await startAsyncIngestionHandler(VALID_INPUT, deps);
    expect(env.ok).toBe(true);
    const result = (env.result ?? {}) as Record<string, unknown>;
    expect(result.outcome).toBe("already_ingested");
    expect("affected_nodes" in result).toBe(false);
  });
});
