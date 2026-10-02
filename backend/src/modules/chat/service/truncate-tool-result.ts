/** Output of `truncateToolResult` — used by the dispatcher and the tests. */
export interface TruncateOutput {
  /** The (possibly truncated) string, with the marker appended if truncated. */
  readonly value: string;
  /** Whether truncation actually occurred. */
  readonly truncated: boolean;
  /** Total code-point length of the ORIGINAL input. */
  readonly totalChars: number;
}

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
