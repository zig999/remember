// TC-02 / BR-43 v2.5 amendment — propagation test xxii.
//
// The chat ingest-adapter forwards `affected_nodes` VERBATIM from the
// ingestion response when present; when absent the chat envelope OMITS the
// key entirely (NEVER `[]`, NEVER `null`).

import { describe, expect, it, vi } from "vitest";
import pino from "pino";

import { dispatchStartAsyncIngestion } from "../../../modules/chat/service/ingest-adapter.js";
import type {
  StartAsyncIngestionDeps,
} from "../../../modules/chat/service/ingest-adapter.js";

function uuid(n: number): string {
  const hex = n.toString(16).padStart(2, "0");
  return `00000000-0000-4000-8000-0000000000${hex}`;
}

const VALID_INPUT = {
  source_type: "outro" as const,
  content: "lorem ipsum dolor sit amet",
};

function syncSchedule(cb: () => void): void {
  cb();
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

function makeIntakeStub(payload: Record<string, unknown>) {
  return (async () => ({
    status: 201,
    body: payload,
  })) as unknown as StartAsyncIngestionDeps["ingestRaw"];
}

function baseDeps(
  overrides: Partial<StartAsyncIngestionDeps> = {}
): StartAsyncIngestionDeps {
  return {
    pool: makePool() as unknown as StartAsyncIngestionDeps["pool"],
    logger: pino({ level: "silent" }),
    catalog: {} as StartAsyncIngestionDeps["catalog"],
    anthropicApiKey: "sk-test",
    schedule: syncSchedule,
    runExtraction: vi.fn(async () => ({})) as unknown as StartAsyncIngestionDeps["runExtraction"],
    ...overrides,
  };
}

describe("chat ingest-adapter — TC-02 affected_nodes propagation (test xxii)", () => {
  it("presence: when ingestion response carries affected_nodes, chat envelope propagates verbatim", async () => {
    const upstreamAffectedNodes = [
      { id: uuid(10), canonical_name: "Alice", node_type: "Person" },
      { id: uuid(11), canonical_name: "Bob", node_type: "Person" },
    ];
    const deps = baseDeps({
      ingestRaw: makeIntakeStub({
        outcome: "created",
        raw_information_id: uuid(50),
        content_hash: "0".repeat(64),
        chunk_count: 2,
        chunks: [],
        llm_run_id: uuid(60),
        idempotency_key: "0".repeat(64),
        // TC-02: the ingestion response carries the field (forward-compatible).
        affected_nodes: upstreamAffectedNodes,
      }),
    });

    const env = await dispatchStartAsyncIngestion(VALID_INPUT, deps);
    expect(env.ok).toBe(true);
    if (!env.ok) throw new Error("unreachable");
    // VERBATIM — same reference shape, same order, same content.
    expect(env.result.affected_nodes).toEqual(upstreamAffectedNodes);
  });

  it("absence: when ingestion response omits affected_nodes, chat envelope OMITS the key (not [], not null)", async () => {
    const deps = baseDeps({
      ingestRaw: makeIntakeStub({
        outcome: "created",
        raw_information_id: uuid(50),
        content_hash: "0".repeat(64),
        chunk_count: 2,
        chunks: [],
        llm_run_id: uuid(60),
        idempotency_key: "0".repeat(64),
        // No `affected_nodes` field at all.
      }),
    });

    const env = await dispatchStartAsyncIngestion(VALID_INPUT, deps);
    expect(env.ok).toBe(true);
    if (!env.ok) throw new Error("unreachable");
    // Critical invariant: the KEY must not be present (not `null`, not `[]`).
    expect("affected_nodes" in env.result).toBe(false);
  });

  it("dedupe path (noop_existing) preserves the same propagation contract", async () => {
    const upstreamAffectedNodes = [
      { id: uuid(20), canonical_name: "Project X", node_type: "Project" },
    ];
    const deps = baseDeps({
      ingestRaw: makeIntakeStub({
        outcome: "noop_existing",
        raw_information_id: uuid(50),
        content_hash: "0".repeat(64),
        chunk_count: 3,
        chunks: [],
        llm_run_id: uuid(60),
        idempotency_key: "0".repeat(64),
        affected_nodes: upstreamAffectedNodes,
      }),
    });

    const env = await dispatchStartAsyncIngestion(VALID_INPUT, deps);
    expect(env.ok).toBe(true);
    if (!env.ok) throw new Error("unreachable");
    expect(env.result.outcome).toBe("already_ingested");
    expect(env.result.affected_nodes).toEqual(upstreamAffectedNodes);
  });

  it("dedupe path WITHOUT affected_nodes -> chat envelope omits the key", async () => {
    const deps = baseDeps({
      ingestRaw: makeIntakeStub({
        outcome: "noop_existing",
        raw_information_id: uuid(50),
        content_hash: "0".repeat(64),
        chunk_count: 3,
        chunks: [],
        llm_run_id: uuid(60),
        idempotency_key: "0".repeat(64),
      }),
    });

    const env = await dispatchStartAsyncIngestion(VALID_INPUT, deps);
    expect(env.ok).toBe(true);
    if (!env.ok) throw new Error("unreachable");
    expect(env.result.outcome).toBe("already_ingested");
    expect("affected_nodes" in env.result).toBe(false);
  });
});
