// Unit tests for the FTS configuration constants — BR-06 of back spec.
//
// Both constants are HARDCODED compile-time strings — never request data.
// Tests guard against accidental rename / typo at code review time.

import { describe, expect, it } from "vitest";

import {
  FTS_NAME_CONFIG,
  FTS_PROSE_CONFIG,
} from "../../../modules/query-retrieval/repository/fts-config.js";

describe("FTS configs — BR-06 (two named, versioned configurations)", () => {
  it("uses `pt_unaccent_v1` for prose (fragment + chunk layers)", () => {
    expect(FTS_PROSE_CONFIG).toBe("pt_unaccent_v1");
  });

  it("uses `simple_unaccent_v1` for names (node-alias layer)", () => {
    expect(FTS_NAME_CONFIG).toBe("simple_unaccent_v1");
  });

  it("treats the two configs as distinct values", () => {
    // A future rename that accidentally collapses both onto a single config
    // would break the stemming-vs-no-stemming distinction (BR-01 of `.spec.md`).
    expect(FTS_PROSE_CONFIG).not.toBe(FTS_NAME_CONFIG);
  });
});
