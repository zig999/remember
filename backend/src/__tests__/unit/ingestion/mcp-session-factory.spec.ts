// TC-014 — Session factory: per-request McpServer instances scoped to an
// ambient llm_run_id, with the four `propose_*` tools registered against
// the ingest toolset key.
//
// Acceptance criteria addressed here:
//   - "MCP session is scoped per run — one McpServer instance per session
//      with the run context bound at creation"
//   - "MCP session without ambient llm_run_id returns an empty toolset (the
//      transport surfaces that as STRUCTURAL_INVALID)" — partial: covers the
//      factory's side of the contract; the envelope mapping is exercised in
//      mcp-transport.spec.ts.

import { describe, expect, it } from "vitest";
import pino from "pino";

import {
  buildSnapshot,
  type CatalogSnapshot,
} from "../../../modules/ingestion/catalog/catalog.js";
import { createIngestSession } from "../../../modules/ingestion/mcp/session-factory.js";

const RUN_ID = "44444444-4444-4444-4444-444444444444";

function buildCatalog(): CatalogSnapshot {
  return buildSnapshot({
    nodeTypes: [
      { id: "n1", name: "Person" },
      { id: "n2", name: "Project" },
    ],
    linkTypes: [
      {
        id: "l1",
        name: "participates_in",
        is_temporal: true,
        allows_multiple_current: true,
        requires_valid_from: true,
        requires_valid_to_on_change: false,
      },
    ],
    linkTypeRules: [],
    attributeKeys: [],
  });
}

const silentLogger = pino({ level: "silent" });
const fakePool = { connect: async () => ({ query: async () => ({ rows: [], rowCount: 0 }), release: () => undefined }) } as unknown as import("pg").Pool;

describe("createIngestSession (TC-014)", () => {
  it("registers the four propose-* tools when an ambient llm_run_id is provided", () => {
    // BR-21 first bullet (positive branch): with an ambient run, the
    // toolset surface is non-empty.
    const session = createIngestSession(
      { pool: fakePool, logger: silentLogger, catalog: buildCatalog() },
      RUN_ID
    );
    expect(session.tools_registered).toBe(true);
    expect(session.llm_run_id).toBe(RUN_ID);
    expect(session.mcp.listTools().sort()).toEqual([
      "ingest.propose_attribute",
      "ingest.propose_fragment",
      "ingest.propose_link",
      "ingest.propose_node",
    ]);
  });

  it("returns a tool-less session when ambient llm_run_id is missing (BR-21)", () => {
    // BR-21 first bullet (negative branch): without an ambient run the
    // toolset must not be exposed. The factory still returns a usable
    // McpServer so the transport can dispatch `tools/list` without
    // crashing — it just sees zero registered tools.
    const session = createIngestSession(
      { pool: fakePool, logger: silentLogger, catalog: buildCatalog() },
      null
    );
    expect(session.tools_registered).toBe(false);
    expect(session.llm_run_id).toBe("");
    expect(session.mcp.listTools()).toEqual([]);
  });

  it("treats whitespace-only run id as missing (BR-21)", () => {
    const session = createIngestSession(
      { pool: fakePool, logger: silentLogger, catalog: buildCatalog() },
      "   "
    );
    expect(session.tools_registered).toBe(false);
    expect(session.mcp.listTools()).toEqual([]);
  });

  it("creates an isolated McpServer per call (concurrent sessions do not share state)", () => {
    // Different runs in the same process must not share tool registries —
    // duplicate-registration on a shared server would throw, and an
    // accidental shared state would mean an `llm_run_id` leak between
    // concurrent MCP clients. The factory guarantees neither happens.
    const sessionA = createIngestSession(
      { pool: fakePool, logger: silentLogger, catalog: buildCatalog() },
      "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
    );
    const sessionB = createIngestSession(
      { pool: fakePool, logger: silentLogger, catalog: buildCatalog() },
      "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"
    );
    expect(sessionA.mcp).not.toBe(sessionB.mcp);
    expect(sessionA.llm_run_id).not.toBe(sessionB.llm_run_id);
    // Both registries are independently populated.
    expect(sessionA.mcp.listTools().length).toBe(4);
    expect(sessionB.mcp.listTools().length).toBe(4);
  });
});
