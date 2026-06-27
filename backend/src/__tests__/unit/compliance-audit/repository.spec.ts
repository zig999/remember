// Unit tests for the compliance-audit repository — BR-18 redaction of
// `raw_information.original_input` together with `content` in the same
// UPDATE issued by `tombstoneRawInformation` (compliance-audit.back.md §3
// BR-04 + BR-18).
//
// Encodes WHY: the verbatim user turn captured by the directed-chat path
// (`raw_information.original_input`, owned by `ingestion.back.md` BR-34)
// must be redacted by `compliance_delete` so the §11 / LGPD coverage holds.
// The redaction MUST be atomic with the `content` redaction (single SQL
// statement, single transaction) so an outside reader can never observe a
// state where `content = '[REDACTED]'` but `original_input` still carries
// the verbatim turn. The CASE expression preserves the audit-honest
// null/non-null distinction (BR-18 rationale).

import { describe, expect, it } from "vitest";

import { tombstoneRawInformation } from "../../../modules/compliance-audit/repository/compliance-audit.repository.js";

type FakeRow = { id: string; original_input: string | null };

function buildFakeClient(rows: FakeRow[]): {
  client: import("pg").PoolClient;
  capturedSql: { sql: string; params: unknown[] }[];
  store: FakeRow[];
} {
  const store = [...rows];
  const captured: { sql: string; params: unknown[] }[] = [];
  const client = {
    query: async (sql: string, params: unknown[] = []) => {
      captured.push({ sql, params });
      // Simulate ONLY the UPDATE raw_information ... RETURNING id call the
      // function issues. Drive the CASE expression in-memory so an
      // implementation that drops the CASE would fail BR-18 assertions.
      if (
        typeof sql === "string" &&
        sql.includes("UPDATE raw_information") &&
        sql.includes("RETURNING id")
      ) {
        const id = String(params[0]);
        const row = store.find((r) => r.id === id);
        if (!row) return { rows: [], rowCount: 0 };
        // BR-18: CASE WHEN original_input IS NULL THEN NULL ELSE '[REDACTED]'
        row.original_input = row.original_input === null ? null : "[REDACTED]";
        return { rows: [{ id: row.id }], rowCount: 1 };
      }
      return { rows: [], rowCount: 0 };
    },
    release: () => {},
  } as unknown as import("pg").PoolClient;
  return { client, capturedSql: captured, store };
}

describe("tombstoneRawInformation — BR-18 (single-UPDATE shape)", () => {
  it("issues a single UPDATE that includes the original_input CASE expression", async () => {
    // WHY: a refactor that splits the redaction into two UPDATEs (or that
    // drops the CASE in favour of a flat assignment) would silently break
    // the §11 atomicity and the null-preservation invariant. The SQL shape
    // is therefore part of the contract — assert it directly.
    const { client, capturedSql } = buildFakeClient([
      { id: "11111111-0000-4000-8000-000000000001", original_input: null },
    ]);
    await tombstoneRawInformation(
      client,
      "11111111-0000-4000-8000-000000000001"
    );
    expect(capturedSql).toHaveLength(1);
    const sql = capturedSql[0]!.sql;
    expect(sql).toContain("UPDATE raw_information");
    expect(sql).toContain("content");
    expect(sql).toContain("'[REDACTED]'");
    // BR-18 — must use CASE on original_input (not a flat assignment).
    expect(sql).toMatch(
      /original_input\s*=\s*CASE\s+WHEN\s+original_input\s+IS\s+NULL\s+THEN\s+NULL\s+ELSE\s+'\[REDACTED\]'\s+END/i
    );
    // Same UPDATE also sets status + superseded_at + metadata flag (BR-04/05).
    expect(sql).toContain("status");
    expect(sql).toContain("superseded_at");
    expect(sql).toContain("compliance_deleted");
  });
});

describe("tombstoneRawInformation — BR-18 (null preservation)", () => {
  it("leaves original_input as NULL when it was already NULL", async () => {
    // WHY: rows ingested outside the directed-chat path (REST `ingestRawInformation`,
    // MCP `ingest_document`, `propose_*`) never populate `original_input`.
    // A flat `original_input = '[REDACTED]'` would falsely suggest those
    // rows had carried a verbatim turn. The CASE keeps the audit honest:
    // null stays null after tombstone.
    const { client, store } = buildFakeClient([
      { id: "11111111-0000-4000-8000-000000000001", original_input: null },
    ]);
    const affected = await tombstoneRawInformation(
      client,
      "11111111-0000-4000-8000-000000000001"
    );
    expect(affected).toBe(1);
    expect(store[0]!.original_input).toBeNull();
  });
});

describe("tombstoneRawInformation — BR-18 (non-null redaction)", () => {
  it("rewrites a non-null original_input to the literal '[REDACTED]'", async () => {
    // WHY: a row ingested via `ingest_directed` from chat carries the
    // verbatim user turn. §11 (LGPD coverage) requires that turn be redacted
    // alongside `content`. The 10-character literal must match `content`
    // (byte-identical) so the redaction policy is uniform across columns.
    const { client, store } = buildFakeClient([
      {
        id: "11111111-0000-4000-8000-000000000002",
        original_input: "Cria o projeto Acompanahr",
      },
    ]);
    const affected = await tombstoneRawInformation(
      client,
      "11111111-0000-4000-8000-000000000002"
    );
    expect(affected).toBe(1);
    expect(store[0]!.original_input).toBe("[REDACTED]");
  });
});
