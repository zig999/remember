// MCP `ingest` toolset behavior — exercises the four handlers end-to-end with
// a fake pool. Acceptance criteria from TC-03:
//   - "propose_fragment with text >1000 chars returns STRUCTURAL_INVALID"
//   - "propose_link with unknown link_type returns UNKNOWN_TYPE"
//   - "propose_link violating graph rules returns RULE_VIOLATION"
//   - "propose_link with confidence <0.40 returns ok:true with outcome=rejected reason=BELOW_CONFIDENCE_FLOOR"
//   - "propose_link accepted: provenance row inserted in same transaction"

import { describe, expect, it } from "vitest";
import pino from "pino";

import {
  buildSnapshot,
  type CatalogSnapshot,
} from "../../../modules/ingestion/catalog/catalog.js";
import { proposeFragmentHandler } from "../../../modules/ingestion/mcp/propose-fragment.handler.js";
import { proposeLinkHandler } from "../../../modules/ingestion/mcp/propose-link.handler.js";
import { buildProposeFragmentHandler } from "../../../modules/ingestion/mcp/propose-fragment.handler.js";

const NODE_TYPE_PERSON = "00000000-0000-0000-0000-000000000001";
const NODE_TYPE_PROJECT = "00000000-0000-0000-0000-000000000002";
const LINK_TYPE_PARTICIPATES = "00000000-0000-0000-0000-000000000010";
const LINK_TYPE_REPORTS = "00000000-0000-0000-0000-000000000011";

const RUN_ID = "44444444-4444-4444-4444-444444444444";
const RAW_INFO_ID = "55555555-5555-4555-8555-555555555555";
const SOURCE_NODE = "11111111-1111-4111-8111-111111111111";
const TARGET_NODE = "22222222-2222-4222-8222-222222222222";
const FRAGMENT_ID = "33333333-3333-4333-8333-333333333333";
const CHUNK_ID = "66666666-6666-4666-8666-666666666666";

function buildCatalog(rules: {
  link_type_id: string;
  source_node_type_id: string;
  target_node_type_id: string;
}[]): CatalogSnapshot {
  return buildSnapshot({
    nodeTypes: [
      { id: NODE_TYPE_PERSON, name: "Person" },
      { id: NODE_TYPE_PROJECT, name: "Project" },
    ],
    linkTypes: [
      {
        id: LINK_TYPE_PARTICIPATES,
        name: "participates_in",
        is_temporal: true,
        allows_multiple_current: true,
        requires_valid_from: true,
        requires_valid_to_on_change: false,
      },
      {
        id: LINK_TYPE_REPORTS,
        name: "reports_to",
        is_temporal: true,
        allows_multiple_current: false,
        requires_valid_from: true,
        requires_valid_to_on_change: true,
      },
    ],
    linkTypeRules: rules.map((r) => ({
      link_type_id: r.link_type_id,
      source_node_type_id: r.source_node_type_id,
      target_node_type_id: r.target_node_type_id,
      valid_from: null,
      valid_to: null,
    })),
    attributeKeys: [],
  });
}

interface FakeState {
  toolCalls: Array<{
    llm_run_id: string;
    tool_name: string;
    arguments: string;
    result: string | null;
    validation_outcome: string;
  }>;
  knowledgeLinks: Array<{ id: string }>;
  provenance: Array<{ link_id: string | null; fragment_id: string }>;
  fragments: Array<{ id: string; llm_run_id: string; text: string }>;
}

function buildPool(state: FakeState, options?: { chunkValid?: boolean; fragmentAnchored?: boolean }) {
  const chunkValid = options?.chunkValid ?? true;
  const fragmentAnchored = options?.fragmentAnchored ?? true;
  const connect = async () => {
    const client = {
      query: async (...args: unknown[]) => {
        // Collapse whitespace so cross-line SQL fragments are easy to match.
        const sqlRaw = String(args[0]);
        const sql = sqlRaw.replace(/\s+/g, " ").trim();
        const params = (args[1] as unknown[]) ?? [];
        const upper = sql.toUpperCase();
        if (upper === "BEGIN" || upper === "COMMIT" || upper === "ROLLBACK") {
          return { rows: [], rowCount: 0 };
        }
        if (sql.startsWith("SELECT") && sql.includes("FROM llm_run")) {
          return {
            rows: [
              {
                id: RUN_ID,
                model: "claude",
                prompt_version: "v1",
                started_at: new Date(),
                finished_at: null,
                status: "running",
                attempts: 1,
                input_raw_information_id: RAW_INFO_ID,
                idempotency_key: "a".repeat(64),
              },
            ],
            rowCount: 1,
          };
        }
        if (sql.startsWith("SELECT count(*)") && sql.includes("FROM raw_chunk")) {
          return {
            rows: [{ n: chunkValid ? "1" : "0" }],
            rowCount: 1,
          };
        }
        if (sql.startsWith("SELECT node_type_id FROM knowledge_node")) {
          const id = String(params[0]);
          if (id === SOURCE_NODE) {
            return { rows: [{ node_type_id: NODE_TYPE_PERSON }], rowCount: 1 };
          }
          if (id === TARGET_NODE) {
            return { rows: [{ node_type_id: NODE_TYPE_PROJECT }], rowCount: 1 };
          }
          return { rows: [], rowCount: 0 };
        }
        if (sql.includes("FROM information_fragment WHERE id = ANY")) {
          return {
            rows: [{ id: FRAGMENT_ID, text: "x", llm_run_id: RUN_ID }],
            rowCount: 1,
          };
        }
        if (sql.startsWith("SELECT (metadata->>'document_date')")) {
          return { rows: [{ document_date: null }], rowCount: 1 };
        }
        if (sql.includes("count(DISTINCT f.id)::text AS n")) {
          // anti-hallucination count
          return {
            rows: [{ n: fragmentAnchored ? "1" : "0" }],
            rowCount: 1,
          };
        }
        if (sql.startsWith("INSERT INTO information_fragment")) {
          const id = `frag-${state.fragments.length + 1}`;
          state.fragments.push({
            id,
            llm_run_id: String(params[0]),
            text: String(params[1]),
          });
          return { rows: [{ id }], rowCount: 1 };
        }
        if (sql.startsWith("INSERT INTO fragment_source")) {
          return { rows: [], rowCount: 1 };
        }
        if (sql.startsWith("INSERT INTO knowledge_link")) {
          const id = `link-${state.knowledgeLinks.length + 1}`;
          state.knowledgeLinks.push({ id });
          return { rows: [{ id }], rowCount: 1 };
        }
        if (sql.startsWith("INSERT INTO provenance")) {
          // unnest($2::uuid[]) — params[1] is the array
          const fragIds = (params[1] as string[]) ?? [];
          const linkOrAttrId = String(params[0]);
          for (const fid of fragIds) {
            state.provenance.push({ link_id: linkOrAttrId, fragment_id: fid });
          }
          return { rows: [], rowCount: fragIds.length };
        }
        if (sql.startsWith("INSERT INTO tool_call")) {
          state.toolCalls.push({
            llm_run_id: String(params[0]),
            tool_name: String(params[1]),
            arguments: String(params[2]),
            result: params[3] === null ? null : String(params[3]),
            validation_outcome: String(params[4]),
          });
          return { rows: [{ id: `tc-${state.toolCalls.length}` }], rowCount: 1 };
        }
        return { rows: [], rowCount: 0 };
      },
      release: () => undefined,
    } as unknown as import("pg").PoolClient;
    return client;
  };
  return { connect } as unknown as import("pg").Pool;
}

function freshState(): FakeState {
  return { toolCalls: [], knowledgeLinks: [], provenance: [], fragments: [] };
}

const silentLogger = pino({ level: "silent" });

describe("propose_fragment", () => {
  it("text > 1000 chars returns VALIDATION_INVALID_FORMAT (Zod boundary)", async () => {
    const state = freshState();
    const pool = buildPool(state);
    const handler = buildProposeFragmentHandler({
      pool,
      logger: silentLogger,
      llm_run_id: RUN_ID,
    });
    const result = await handler({
      text: "x".repeat(1001),
      confidence: 0.9,
      chunk_ids: [CHUNK_ID],
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("VALIDATION_INVALID_FORMAT");
    // Audit row written even on rejection (BR-23).
    expect(state.toolCalls[0]!.validation_outcome).toBe("rejected");
  });

  it("accepted path writes fragment and audit row in same transaction", async () => {
    const state = freshState();
    const pool = buildPool(state);
    const result = await proposeFragmentHandler(
      {
        text: "alguma sentença válida",
        confidence: 0.9,
        chunk_ids: [CHUNK_ID],
      },
      { pool, logger: silentLogger, llm_run_id: RUN_ID }
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.result.status).toBe("proposed");
    expect(state.fragments.length).toBe(1);
    expect(state.toolCalls.length).toBe(1);
    expect(state.toolCalls[0]!.validation_outcome).toBe("accepted");
  });
});

describe("propose_link layered failures", () => {
  it("unknown link_type returns BUSINESS_UNKNOWN_LINK_TYPE", async () => {
    const state = freshState();
    const pool = buildPool(state);
    const catalog = buildCatalog([]);
    const result = await proposeLinkHandler(
      {
        source_node_id: SOURCE_NODE,
        target_node_id: TARGET_NODE,
        link_type: "bogus_link",
        confidence: 0.9,
        fragment_ids: [FRAGMENT_ID],
        change_hint: "none",
      },
      {
        pool,
        logger: silentLogger,
        llm_run_id: RUN_ID,
        catalog,
        now: () => new Date("2026-06-12T12:00:00Z"),
      }
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("BUSINESS_UNKNOWN_LINK_TYPE");
    expect(state.toolCalls[0]!.validation_outcome).toBe("rejected");
  });

  it("graph rule violation returns BUSINESS_LINK_RULE_VIOLATION", async () => {
    const state = freshState();
    const pool = buildPool(state);
    // Catalog has the link_type but no rule authorising the triple.
    const catalog = buildCatalog([]);
    const result = await proposeLinkHandler(
      {
        source_node_id: SOURCE_NODE,
        target_node_id: TARGET_NODE,
        link_type: "participates_in",
        confidence: 0.9,
        fragment_ids: [FRAGMENT_ID],
        valid_from: "2026-01-01",
        valid_from_basis: "stated",
        change_hint: "none",
      },
      {
        pool,
        logger: silentLogger,
        llm_run_id: RUN_ID,
        catalog,
        now: () => new Date("2026-06-12T12:00:00Z"),
      }
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("BUSINESS_LINK_RULE_VIOLATION");
  });

  it("confidence < 0.40 returns ok:true outcome=rejected BELOW_CONFIDENCE_FLOOR", async () => {
    const state = freshState();
    const pool = buildPool(state);
    const catalog = buildCatalog([
      {
        link_type_id: LINK_TYPE_PARTICIPATES,
        source_node_type_id: NODE_TYPE_PERSON,
        target_node_type_id: NODE_TYPE_PROJECT,
      },
    ]);
    const result = await proposeLinkHandler(
      {
        source_node_id: SOURCE_NODE,
        target_node_id: TARGET_NODE,
        link_type: "participates_in",
        confidence: 0.1,
        fragment_ids: [FRAGMENT_ID],
        valid_from: "2026-01-01",
        valid_from_basis: "stated",
        change_hint: "none",
      },
      {
        pool,
        logger: silentLogger,
        llm_run_id: RUN_ID,
        catalog,
        now: () => new Date("2026-06-12T12:00:00Z"),
      }
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.result.outcome).toBe("rejected");
    expect(result.result.reason).toBe("BELOW_CONFIDENCE_FLOOR");
    expect(result.result.link_id).toBe(null);
    // No link was created.
    expect(state.knowledgeLinks.length).toBe(0);
    // Audit: rejected outcome.
    expect(state.toolCalls.length).toBe(1);
    expect(state.toolCalls[0]!.validation_outcome).toBe("rejected");
  });

  it("accepted path inserts a provenance row in the same transaction (BR-18)", async () => {
    const state = freshState();
    const pool = buildPool(state);
    const catalog = buildCatalog([
      {
        link_type_id: LINK_TYPE_PARTICIPATES,
        source_node_type_id: NODE_TYPE_PERSON,
        target_node_type_id: NODE_TYPE_PROJECT,
      },
    ]);
    const result = await proposeLinkHandler(
      {
        source_node_id: SOURCE_NODE,
        target_node_id: TARGET_NODE,
        link_type: "participates_in",
        confidence: 0.9,
        fragment_ids: [FRAGMENT_ID],
        valid_from: "2026-01-01",
        valid_from_basis: "stated",
        change_hint: "none",
      },
      {
        pool,
        logger: silentLogger,
        llm_run_id: RUN_ID,
        catalog,
        now: () => new Date("2026-06-12T12:00:00Z"),
      }
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.result.outcome).toBe("accepted");
    expect(state.knowledgeLinks.length).toBe(1);
    expect(state.provenance.length).toBe(1);
    expect(state.provenance[0]!.fragment_id).toBe(FRAGMENT_ID);
    expect(state.toolCalls[0]!.validation_outcome).toBe("accepted");
  });
});
