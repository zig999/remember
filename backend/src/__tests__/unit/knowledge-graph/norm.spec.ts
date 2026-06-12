// Unit tests for the application-side `norm()` policy used by the
// knowledge-graph prefix lookup (UC-04). Must match the DB `norm()`
// function (collapseSpaces ∘ unaccent ∘ lower ∘ trim).

import { describe, expect, it } from "vitest";

import { norm } from "../../../modules/knowledge-graph/service/norm.js";

describe("norm()", () => {
  it("lowercases, strips diacritics, trims and collapses whitespace", () => {
    expect(norm("  Projéto   APOLLO  ")).toBe("projeto apollo");
  });

  it("handles unicode accents from Portuguese", () => {
    expect(norm("Maçã não")).toBe("maca nao");
    expect(norm("São Paulo")).toBe("sao paulo");
  });

  it("returns an empty string for empty / whitespace-only inputs", () => {
    expect(norm("")).toBe("");
    expect(norm("    ")).toBe("");
  });

  it("is idempotent — norm(norm(x)) === norm(x)", () => {
    const input = "  Projéto   Apollo  ";
    expect(norm(norm(input))).toBe(norm(input));
  });
});
