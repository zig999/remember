// Unit tests for `applyTemporalFilter` — single source of truth for
// composing the WHERE-clause fragment that surfaces BR-07 (current view)
// and BR-08 (valid-time travel) of `knowledge-graph.back.md`.

import { describe, expect, it } from "vitest";

import { applyTemporalFilter } from "../../../modules/knowledge-graph/repository/temporal-filter.js";

describe("applyTemporalFilter — BR-07 (current view, no as_of)", () => {
  it("emits valid_to IS NULL + superseded_at IS NULL and binds no params", () => {
    const result = applyTemporalFilter("na", 5, {});
    expect(result.params).toEqual([]);
    expect(result.sql).toContain("AND na.valid_to IS NULL");
    expect(result.sql).toContain("AND na.superseded_at IS NULL");
    // No `valid_from <= current_date` when `inEffectOnly` is omitted.
    expect(result.sql).not.toContain("valid_from <= current_date");
  });

  it("adds the valid_from <= current_date clause when inEffectOnly=true", () => {
    const result = applyTemporalFilter("kl", 1, { inEffectOnly: true });
    expect(result.params).toEqual([]);
    expect(result.sql).toContain("AND kl.valid_to IS NULL");
    expect(result.sql).toContain("AND kl.superseded_at IS NULL");
    expect(result.sql).toContain(
      "AND (kl.valid_from IS NULL OR kl.valid_from <= current_date)"
    );
  });
});

describe("applyTemporalFilter — BR-08 (valid-time travel)", () => {
  it("emits the semi-open [valid_from, valid_to) test and binds asOf once", () => {
    const result = applyTemporalFilter("na", 3, { asOf: "2026-01-01" });
    expect(result.params).toEqual(["2026-01-01"]);
    expect(result.sql).toContain("AND na.superseded_at IS NULL");
    // Both clauses use the same placeholder ($3) — single binding.
    expect(result.sql).toContain("na.valid_from <= $3");
    expect(result.sql).toContain("na.valid_to   >  $3");
    // Must NOT add the "current view" predicate when asOf is provided.
    expect(result.sql).not.toContain("valid_to IS NULL\n");
  });

  it("ignores inEffectOnly when asOf is provided (semantics overlap)", () => {
    const result = applyTemporalFilter("na", 4, {
      asOf: "2026-06-01",
      inEffectOnly: true,
    });
    expect(result.params).toEqual(["2026-06-01"]);
    expect(result.sql).toContain("na.valid_from <= $4");
    expect(result.sql).not.toContain("current_date");
  });
});

describe("applyTemporalFilter — security", () => {
  it("rejects an alias that is not a SQL identifier", () => {
    expect(() => applyTemporalFilter("na; DROP TABLE", 1, {})).toThrow(
      /invalid alias/i
    );
    expect(() => applyTemporalFilter("", 1, {})).toThrow(/invalid alias/i);
    expect(() => applyTemporalFilter("na space", 1, {})).toThrow(
      /invalid alias/i
    );
  });
});
