// BR-13 — layered validation order must be:
//   structural -> graph rules -> temporal -> confidence -> anti-hallucination
//
// Acceptance criterion of TC-03:
//   "Vitest: 5-layer validation order — temporal check does not run before
//    graph rules pass".
//
// Strategy: drive `proposeLinkHandler` with a fake pool that records every SQL
// query in order. Build an input that would fail BOTH layer 2 (graph rules)
// AND layer 3 (temporal). The first failure must be RULE_VIOLATION; the
// temporal layer must not be reached.

import { describe, expect, it } from "vitest";
import pino from "pino";

import {
  buildSnapshot,
  type CatalogSnapshot,
} from "../../../modules/ingestion/catalog/catalog.js";
import { proposeLinkHandler } from "../../../modules/ingestion/mcp/propose-link.handler.js";

const NODE_TYPE_PERSON = "00000000-0000-0000-0000-000000000001";
const NODE_TYPE_PROJECT = "00000000-0000-0000-0000-000000000002";

const catalog: CatalogSnapshot = buildSnapshot({
  nodeTypes: [
    { id: NODE_TYPE_PERSON, name: "Person" },
    { id: NODE_TYPE_PROJECT, name: "Project" },
  ],
  linkTypes: [
    {
      id: "00000000-0000-0000-0000-000000000010",
      name: "participates_in",
      is_temporal: true,
      allows_multiple_current: true,
      requires_valid_from: true,
      requires_valid_to_on_change: false,
    },
  ],
  // INTENTIONALLY EMPTY — no rule authorises the triple, so layer 2 fails.
  linkTypeRules: [],
  attributeKeys: [],
});

const silentLogger = pino({ level: "silent" });

interface CapturedQuery {
  readonly sql: string;
}

/**
 * Fake pool that records queries. Returns canned responses for the queries
 * the structural layer issues, so the handler can reach layer 2.
 */
function buildPool(): { pool: import("pg").Pool; queries: CapturedQuery[] } {
  const queries: CapturedQuery[] = [];
  const sourceNodeId = "11111111-1111-4111-8111-111111111111";
  const targetNodeId = "22222222-2222-4222-8222-222222222222";
  const fragmentId = "33333333-3333-4333-8333-333333333333";
  const llmRunId = "44444444-4444-4444-4444-444444444444";

  const client = {
    query: async (...args: unknown[]) => {
      const sql = String(args[0]).replace(/\s+/g, " ").trim();
      queries.push({ sql });
      const upper = sql.toUpperCase();
      if (upper === "BEGIN" || upper === "COMMIT" || upper === "ROLLBACK") {
        return { rows: [], rowCount: 0 };
      }
      // findLlmRunById
      if (sql.startsWith("SELECT") && sql.includes("FROM llm_run") && sql.includes("WHERE id = $1")) {
        return {
          rows: [
            {
              id: llmRunId,
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
      // findNodeTypeIdByNodeId
      if (sql.startsWith("SELECT node_type_id FROM knowledge_node")) {
        const id = String(args[1]?.[0] ?? "");
        if (id === sourceNodeId) {
          return { rows: [{ node_type_id: NODE_TYPE_PERSON }], rowCount: 1 };
        }
        if (id === targetNodeId) {
          return { rows: [{ node_type_id: NODE_TYPE_PROJECT }], rowCount: 1 };
        }
        return { rows: [], rowCount: 0 };
      }
      // information_fragment fetch
      if (sql.includes("FROM information_fragment WHERE id = ANY")) {
        return {
          rows: [{ id: fragmentId, text: "x", llm_run_id: llmRunId }],
          rowCount: 1,
        };
      }
      // raw_information.metadata->>document_date
      if (sql.startsWith("SELECT (metadata->>'document_date')")) {
        return { rows: [{ document_date: null }], rowCount: 1 };
      }
      // tool_call insert
      if (sql.startsWith("INSERT INTO tool_call")) {
        return { rows: [{ id: "tool-call-id" }], rowCount: 1 };
      }
      // anything else — unexpected for this test
      return { rows: [], rowCount: 0 };
    },
    release: () => undefined,
  } as unknown as import("pg").PoolClient;
  const pool = {
    connect: async () => client,
  } as unknown as import("pg").Pool;
  return { pool, queries };
}

describe("BR-13 layered validation order", () => {
  it("temporal check does NOT run before graph rules pass (RULE_VIOLATION)", async () => {
    const { pool } = buildPool();
    const result = await proposeLinkHandler(
      {
        source_node_id: "11111111-1111-4111-8111-111111111111",
        target_node_id: "22222222-2222-4222-8222-222222222222",
        link_type: "participates_in",
        // Temporally INVALID: valid_from > valid_to. If the order were broken
        // and temporal ran first, we would get TEMPORAL_INCOHERENT.
        valid_from: "2027-01-01",
        valid_to: "2026-01-01",
        valid_from_basis: "stated",
        confidence: 0.9,
        fragment_ids: ["33333333-3333-4333-8333-333333333333"],
        change_hint: "none",
      },
      {
        pool,
        logger: silentLogger,
        llm_run_id: "44444444-4444-4444-4444-444444444444",
        catalog,
        now: () => new Date("2026-06-12T12:00:00Z"),
      }
    );

    expect(result.ok).toBe(false);
    if (result.ok) return; // narrow
    // Layer 2 fires first because the catalog is empty -> RULE_VIOLATION.
    expect(result.error.code).toBe("RULE_VIOLATION");
  });
});
