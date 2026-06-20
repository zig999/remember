// Unicode code-point-bounded truncation of tool-result JSON bodies fed back
// to the model on the next iteration (chat.back.md BR-13).
//
// Why code points (not bytes, not UTF-16 code units)?
//   - The ceiling is `env.TOOL_RESULT_MAX_CHARS` (default 8000), advertised
//     to the operator as a "chars" value. Counting in code points matches
//     the BR-13 spec wording verbatim ("Unicode code points") and matches the
//     user-visible character notion for the appended marker.
//   - UTF-16 code units would over-count a string with emoji or supplementary
//     CJK by a factor of 2 (one user-visible char = 2 code units), making the
//     ceiling unpredictable. Bytes would be even worse.
//
// Implementation uses `Array.from(str)` / `[...str]` which iterates the string
// as Unicode code points (the iterator protocol on a String object yields code
// points, NOT code units — surrogate pairs are joined). This is the de-facto
// standard idiom; `Intl.Segmenter` is overkill for code-point counting (it
// segments at grapheme clusters, which is a different and slower unit).
//
// On truncation, BR-13 mandates a marker: `\n[truncated: <n> chars]` where
// `<n>` is the FULL (pre-truncation) code-point length. The marker tells the
// model the result was cut, so the model can either ask for a narrower query
// or accept partial knowledge.

/** Output of `truncateToolResult` — used by the dispatcher and the tests. */
export interface TruncateOutput {
  /** The (possibly truncated) string, with the marker appended if truncated. */
  readonly value: string;
  /** Whether truncation actually occurred. */
  readonly truncated: boolean;
  /** Total code-point length of the ORIGINAL input. */
  readonly totalChars: number;
}

/**
 * Truncate a string to at most `maxChars` Unicode code points.
 *
 * Behaviour:
 *   - If `input.length` (in code points) `<= maxChars`: returned unchanged,
 *     `truncated: false`. No marker appended.
 *   - Otherwise: the first `maxChars` code points are kept and the marker
 *     `"\n[truncated: <total> chars]"` is appended. `truncated: true`.
 *
 * The marker is appended OUTSIDE the `maxChars` budget — the model receives a
 * slightly-longer-than-`maxChars` payload but with an unambiguous signal that
 * the result was cut. This matches BR-13: "Truncation appends an explicit
 * marker"; the marker is metadata, not content, so it does not consume the
 * budget.
 */
export function truncateToolResult(input: string, maxChars: number): TruncateOutput {
  // `[...input]` yields code points (surrogate pairs joined into single
  // entries). This is the same idiom used in `args-summary.ts`.
  const codepoints = [...input];
  const total = codepoints.length;

  if (total <= maxChars) {
    return { value: input, truncated: false, totalChars: total };
  }

  const head = codepoints.slice(0, maxChars).join("");
  return {
    value: `${head}\n[truncated: ${total} chars]`,
    truncated: true,
    totalChars: total,
  };
}
