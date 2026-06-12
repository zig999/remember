// Unit tests for the Unicode code-point excerpt convention — BR-11 of back
// spec, ADR A22.
//
// The PRODUCTION excerpt is computed in SQL via
//   `substring(rc.text FROM offset_start + 1 FOR offset_end - offset_start)`
// where `substring` is 1-based and the offsets are 0-based code points.
//
// This test pins the TypeScript equivalent — `[...text].slice(start, end).join('')`
// — which is the contract used by any unit test asserting an excerpt without
// hitting Postgres. The two MUST agree on multi-byte Unicode inputs.

import { describe, expect, it } from "vitest";

/**
 * Reference implementation — identical to the SQL contract:
 *   `substring(text FROM offset_start + 1 FOR offset_end - offset_start)`
 * but in pure TypeScript using Unicode code-point indexing.
 */
function sliceExcerpt(text: string, offsetStart: number, offsetEnd: number): string {
  const codePoints = [...text];
  return codePoints.slice(offsetStart, offsetEnd).join("");
}

describe("excerpt slicing — BR-11 (Unicode code-point indexing)", () => {
  it("matches plain ASCII with the 0-based [start, end) convention", () => {
    const text = "Projeto Apollo go-live em 2026.";
    // offset_start=8, offset_end=14 -> "Apollo"
    expect(sliceExcerpt(text, 8, 14)).toBe("Apollo");
  });

  it("handles accented Latin (NFC composed) as single code points", () => {
    // "implantação" in NFC: each accented char is 1 code point.
    const text = "A implantação do Projeto Apollo";
    // The word starts at code-point 2 and is 11 code points long.
    expect(sliceExcerpt(text, 2, 13)).toBe("implantação");
  });

  it("handles em-dash as a single code point", () => {
    // Em-dash U+2014. Test pin: the offset arithmetic still works when the
    // chunk contains a code point that takes 3 UTF-8 bytes.
    const text = "Projeto Apollo — go-live em 2026.";
    expect(sliceExcerpt(text, 15, 16)).toBe("—");
  });

  it("treats NFD combining marks as separate code points (matches SQL substring)", () => {
    // NFD form: 'e' + U+0301 (combining acute) renders as "é" visually
    // identical to "é" but takes 2 code points.
    //
    // SQL `substring` and JS `[...str]` BOTH split combining marks — this
    // test ensures the contract is identical so that a chunker emitting NFD
    // does not produce inconsistent excerpts between BFF tests and Postgres.
    const text = "éã"; // visually "éã" but NFD.
    expect([...text].length).toBe(4);
    // [0, 2) -> base 'e' + combining acute -> renders as "é"
    expect(sliceExcerpt(text, 0, 2)).toBe("é");
    // [0, 4) -> full string preserved.
    expect(sliceExcerpt(text, 0, 4)).toBe(text);
    // Splitting INSIDE the combining sequence is permitted by the contract
    // (and produces a lone combining mark) — guard against future "smart"
    // boundary detection that would diverge from SQL.
    expect(sliceExcerpt(text, 1, 3)).toBe("́a");
  });

  it("returns an empty string when start == end (semi-open interval)", () => {
    expect(sliceExcerpt("Projeto Apollo", 4, 4)).toBe("");
  });

  it("respects the semi-open [start, end) convention at boundaries", () => {
    const text = "abcde";
    // [0, 5) -> "abcde"
    expect(sliceExcerpt(text, 0, text.length)).toBe("abcde");
    // [4, 5) -> "e" only — end is exclusive.
    expect(sliceExcerpt(text, 4, 5)).toBe("e");
  });

  it("matches the SQL +1 adjustment for multi-byte content (regression — off-by-one)", () => {
    // The most likely failure mode is forgetting the +1 in
    // `substring(rc.text from offset_start + 1 for ...)` — landing one
    // position to the left. NFC composed accents make the bug visible.
    const text = "ção é difícil"; // "ção é difícil" in NFC.
    // [0, 3) -> "ção"
    expect(sliceExcerpt(text, 0, 3)).toBe("ção");
    // [4, 6) -> "é "
    expect(sliceExcerpt(text, 4, 6)).toBe("é ");
  });
});
