// SQL-contract tests for the query-retrieval repositories.
//
// These assert the SHAPE of the emitted SQL against a capturing stub client.
// In this codebase the repositories run against fake pools in every test, so
// the SQL text is the only seam where schema-conformance regressions show up
// before hitting a real database. Two invariants are pinned here:
//
//  1. LGPD §11 — the chunk search arm MUST exclude compliance-tombstoned
//     chunks (`superseded_at IS NULL`). Without the predicate, redacted
//     content remains retrievable through the chunk layer, silently
//     re-exposing deleted data (and the partial GIN index `raw_chunk_fts_idx`
//     no longer applies).
//
//  2. BR-14 tombstone lookup — `compliance_deletion`'s physical column is
//     `executed_at` (owned by the compliance-audit domain). The repository
//     must alias it (`executed_at AS performed_at`); querying `performed_at`
//     directly crashes on a real database.

import { describe, expect, it } from "vitest";
import type { PoolClient } from "pg";

import {
  listProvenanceForNodes,
  searchChunkLayer,
} from "../../../modules/query-retrieval/repository/search.repository.js";
import { findTombstone } from "../../../modules/query-retrieval/repository/provenance.repository.js";

function buildCapturingClient(): { client: PoolClient; captured: string[] } {
  const captured: string[] = [];
  const client = {
    query: async (sql: string | { text: string }) => {
      captured.push(typeof sql === "string" ? sql : sql.text);
      return { rows: [], rowCount: 0 };
    },
  } as unknown as PoolClient;
  return { client, captured };
}

describe("searchChunkLayer SQL contract", () => {
  it("excludes compliance-tombstoned chunks (LGPD §11)", async () => {
    const { client, captured } = buildCapturingClient();
    await searchChunkLayer(client, "qualquer termo", 10);
    expect(captured).toHaveLength(1);
    const sql = captured[0]!;
    expect(sql).toContain("FROM raw_chunk rc");
    // The predicate must match the partial index raw_chunk_fts_idx
    // (WHERE superseded_at IS NULL) — deleted content never resurfaces.
    expect(sql).toContain("rc.superseded_at IS NULL");
  });
});

describe("listProvenanceForNodes SQL contract", () => {
  it("matches the node alias with plainto_tsquery, never a bare to_tsquery", async () => {
    // Regression for the /search 500 surfaced by the live E2E: a node whose
    // alias_norm is multi-word (e.g. "rodrigo isensee") fed into a bare
    // `to_tsquery(cfg, alias_norm)` raises `syntax error in tsquery` on a real
    // DB, because to_tsquery requires operators between lexemes. plainto_tsquery
    // treats the alias as plain text (ANDs the lexemes) and accepts any phrase.
    // The fake-pool suite cannot execute tsquery, so we pin the SQL shape here.
    const { client, captured } = buildCapturingClient();
    await listProvenanceForNodes(client, [
      "22222222-0000-4000-8000-000000000001",
    ]);
    expect(captured).toHaveLength(1);
    const sql = captured[0]!;
    expect(sql).toContain("plainto_tsquery(");
    // The bare form `@@ to_tsquery(` is the crash; plainto_tsquery is allowed
    // even though "to_tsquery" is a substring of it.
    expect(sql).not.toMatch(/@@\s*to_tsquery\(/);
  });

  it("short-circuits without touching the DB when no node ids are given", async () => {
    const { client, captured } = buildCapturingClient();
    const result = await listProvenanceForNodes(client, []);
    expect(result).toEqual([]);
    expect(captured).toHaveLength(0);
  });
});

describe("findTombstone SQL contract", () => {
  it("reads the physical column executed_at (aliased to performed_at)", async () => {
    const { client, captured } = buildCapturingClient();
    await findTombstone(client, ["11111111-0000-4000-8000-000000000001"]);
    expect(captured).toHaveLength(1);
    const sql = captured[0]!;
    expect(sql).toContain("executed_at AS performed_at");
    // Guard against regressing to the non-existent bare column.
    expect(sql).not.toMatch(/ORDER BY performed_at/);
  });

  it("short-circuits without touching the DB when no raw ids are given", async () => {
    const { client, captured } = buildCapturingClient();
    const result = await findTombstone(client, []);
    expect(result).toBeNull();
    expect(captured).toHaveLength(0);
  });
});
