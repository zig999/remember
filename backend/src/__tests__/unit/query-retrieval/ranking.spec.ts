// Unit tests for the deterministic ranking contract — BR-15 of back spec.
//
// The contract is: score DESC, recordedAtTs DESC, id ASC. Two identical
// requests against an unchanged corpus MUST return rows in the same order.
//
// This test reproduces the sort key used by `searchKnowledgeService` and
// asserts that:
//   - identical scores fall back to recordedAtTs DESC;
//   - identical (score, recordedAtTs) fall back to id ASC (lexicographic);
//   - the sort is stable across permutations of the input array.

import { describe, expect, it } from "vitest";

interface Row {
  id: string;
  score: number;
  recordedAtTs: number;
}

function rank(rows: Row[]): Row[] {
  // Identical to the production sort key in `searchKnowledgeService`.
  const copy = rows.slice();
  copy.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.recordedAtTs !== a.recordedAtTs)
      return b.recordedAtTs - a.recordedAtTs;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
  return copy;
}

describe("ranking — BR-15 (deterministic tie-breakers)", () => {
  it("orders by score DESC primarily", () => {
    const result = rank([
      { id: "a", score: 0.5, recordedAtTs: 0 },
      { id: "b", score: 0.9, recordedAtTs: 0 },
      { id: "c", score: 0.1, recordedAtTs: 0 },
    ]);
    expect(result.map((r) => r.id)).toEqual(["b", "a", "c"]);
  });

  it("breaks score ties with recordedAtTs DESC", () => {
    const result = rank([
      { id: "old", score: 0.5, recordedAtTs: 100 },
      { id: "new", score: 0.5, recordedAtTs: 200 },
    ]);
    expect(result.map((r) => r.id)).toEqual(["new", "old"]);
  });

  it("breaks score + recordedAtTs ties with id ASC", () => {
    const result = rank([
      { id: "zzz", score: 0.5, recordedAtTs: 100 },
      { id: "aaa", score: 0.5, recordedAtTs: 100 },
      { id: "mmm", score: 0.5, recordedAtTs: 100 },
    ]);
    expect(result.map((r) => r.id)).toEqual(["aaa", "mmm", "zzz"]);
  });

  it("returns the same order across input permutations (idempotent)", () => {
    const base: Row[] = [
      { id: "u1", score: 0.8, recordedAtTs: 100 },
      { id: "u2", score: 0.8, recordedAtTs: 200 },
      { id: "u3", score: 0.5, recordedAtTs: 100 },
      { id: "u4", score: 0.5, recordedAtTs: 100 },
      { id: "u5", score: 0.8, recordedAtTs: 200 },
    ];
    // Permute the array and confirm the ranking is identical.
    const perm: Row[] = [base[4]!, base[2]!, base[0]!, base[3]!, base[1]!];
    expect(rank(base)).toEqual(rank(perm));
  });

  it("ranks two same-score same-time items by lexicographic id (regression — cenario C12)", () => {
    // UUIDs are unique; the id fallback is the FINAL defensive tie-breaker.
    // Picking an obviously-ordered pair makes the assertion unambiguous.
    const result = rank([
      { id: "ffffffff-0000-0000-0000-000000000000", score: 0.7, recordedAtTs: 50 },
      { id: "00000000-0000-0000-0000-000000000000", score: 0.7, recordedAtTs: 50 },
    ]);
    expect(result[0]!.id).toBe("00000000-0000-0000-0000-000000000000");
    expect(result[1]!.id).toBe("ffffffff-0000-0000-0000-000000000000");
  });
});
