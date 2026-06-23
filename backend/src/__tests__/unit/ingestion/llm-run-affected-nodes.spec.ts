// TC-02 / BR-33 — `getLlmRunById` attaches `affected_nodes` ONLY on completed runs.
//
// Read-path contract (BR-31 + BR-33):
//   - status === "completed" -> attach (cache hit OR derived fallback);
//   - status === "running"   -> field absent from the response;
//   - status === "failed"    -> field absent from the response;
//   - empty list IS a valid completed-run payload (run with only `rejected`
//     outcomes) — we still attach `[]`.

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PoolClient } from "pg";

import { getLlmRunById } from "../../../modules/ingestion/service/llm-run.service.js";
import {
  __clearAffectedNodesCacheForTests,
  setCachedAffectedNodes,
  type AffectedNode,
} from "../../../modules/ingestion/service/affected-nodes.js";

function uuid(n: number): string {
  const hex = n.toString(16).padStart(2, "0");
  return `00000000-0000-4000-8000-0000000000${hex}`;
}

const RUN_ID = uuid(1);

interface FakeClientOptions {
  readonly status: "running" | "completed" | "failed";
  /** Cache-miss derive rows for tool_call.result (one node id contributing). */
  readonly toolCallRows?: ReadonlyArray<{
    tool_name: string;
    result: Record<string, unknown> | null;
    validation_outcome: string;
  }>;
  /** Resolver rows (id -> canonical_name + node_type). */
  readonly resolverRows?: ReadonlyArray<{
    id: string;
    canonical_name: string;
    node_type: string;
    status: string;
    merged_into_node_id: string | null;
  }>;
}

function fakeClient(opts: FakeClientOptions): PoolClient {
  return {
    query: vi.fn(async (sql: string) => {
      const trimmed = sql.replace(/\s+/g, " ").trim();
      // findLlmRunById
      if (trimmed.startsWith("SELECT") && trimmed.includes("FROM llm_run")) {
        return {
          rows: [
            {
              id: RUN_ID,
              model: "claude-sonnet-4-6",
              prompt_version: "v3",
              started_at: new Date("2026-06-23T10:00:00Z"),
              finished_at:
                opts.status === "running"
                  ? null
                  : new Date("2026-06-23T10:00:42Z"),
              status: opts.status,
              attempts: 1,
              input_raw_information_id: uuid(50),
              idempotency_key: "a".repeat(64),
            },
          ],
          rowCount: 1,
        };
      }
      // aggregateToolCallOutcomes — returns empty summary
      if (
        trimmed.startsWith("SELECT") &&
        trimmed.includes("FROM tool_call") &&
        trimmed.includes("GROUP BY")
      ) {
        return { rows: [], rowCount: 0 };
      }
      // deriveAffectedNodes — tool_call read
      if (trimmed.startsWith("SELECT") && trimmed.includes("FROM tool_call")) {
        const rows = opts.toolCallRows ?? [];
        return { rows, rowCount: rows.length };
      }
      // resolveAffectedNodes — knowledge_node JOIN node_type
      if (trimmed.includes("knowledge_node") && trimmed.includes("node_type")) {
        const rows = opts.resolverRows ?? [];
        return { rows, rowCount: rows.length };
      }
      return { rows: [], rowCount: 0 };
    }),
  } as unknown as PoolClient;
}

describe("getLlmRunById — BR-33 affected_nodes attachment", () => {
  beforeEach(() => __clearAffectedNodesCacheForTests());

  it("status='completed' + cache HIT -> attaches affected_nodes verbatim", async () => {
    const cached: AffectedNode[] = [
      { id: uuid(10), canonical_name: "Alice", node_type: "Person" },
      { id: uuid(11), canonical_name: "Bob", node_type: "Person" },
    ];
    setCachedAffectedNodes(RUN_ID, cached);

    const client = fakeClient({ status: "completed" });
    const out = await getLlmRunById(client, RUN_ID);

    expect(out.status).toBe("completed");
    expect(out.affected_nodes).toEqual(cached);
  });

  it("status='completed' + cache MISS -> derives from tool_call.result and attaches", async () => {
    const client = fakeClient({
      status: "completed",
      toolCallRows: [
        {
          tool_name: "propose_node",
          result: { node_id: uuid(10), resolution: "created_new" },
          validation_outcome: "accepted",
        },
      ],
      resolverRows: [
        {
          id: uuid(10),
          canonical_name: "Alice",
          node_type: "Person",
          status: "active",
          merged_into_node_id: null,
        },
      ],
    });

    const out = await getLlmRunById(client, RUN_ID);

    expect(out.status).toBe("completed");
    expect(out.affected_nodes).toEqual([
      { id: uuid(10), canonical_name: "Alice", node_type: "Person" },
    ]);
  });

  it("status='completed' with zero affected-node-contributing tool_calls -> attaches []", async () => {
    const client = fakeClient({
      status: "completed",
      toolCallRows: [
        {
          tool_name: "propose_attribute",
          result: { attribute_id: null, outcome: "rejected", node_id: uuid(99) },
          validation_outcome: "rejected",
        },
      ],
      resolverRows: [],
    });

    const out = await getLlmRunById(client, RUN_ID);

    expect(out.status).toBe("completed");
    expect(out.affected_nodes).toEqual([]);
  });

  it("status='running' -> affected_nodes field is ABSENT (not [], not null)", async () => {
    // Even if a cached entry exists, the read path MUST omit the field on a
    // non-completed run (BR-33 "Read paths" contract).
    setCachedAffectedNodes(RUN_ID, [
      { id: uuid(10), canonical_name: "Alice", node_type: "Person" },
    ]);

    const client = fakeClient({ status: "running" });
    const out = await getLlmRunById(client, RUN_ID);

    expect(out.status).toBe("running");
    expect("affected_nodes" in out).toBe(false);
  });

  it("status='failed' -> affected_nodes field is ABSENT", async () => {
    setCachedAffectedNodes(RUN_ID, [
      { id: uuid(10), canonical_name: "Alice", node_type: "Person" },
    ]);

    const client = fakeClient({ status: "failed" });
    const out = await getLlmRunById(client, RUN_ID);

    expect(out.status).toBe("failed");
    expect("affected_nodes" in out).toBe(false);
  });
});
