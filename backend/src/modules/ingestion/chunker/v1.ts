// Chunker v1 — deterministic Unicode-code-point-safe document chunker.
//
// BR-03 (deterministic), BR-04 (constants), BR-05 (offsets), BR-06 (hard
// boundaries per source_type), BR-07 (oversize fallback) of
// docs/specs/domains/ingestion/back/ingestion.back.md.
//
// Algorithm:
//   1. Split the content into "blocks" along the hard boundaries that apply to
//      `sourceType` (BR-06). For `ata`, `artigo`, `outro`, there are no hard
//      boundaries — the whole content is a single block.
//   2. For each block, try to keep it as one chunk if its size is at most
//      `CHUNK_HARD_MAX` code points. If the block exceeds `CHUNK_HARD_MAX`, fall
//      back to sentence-level split via `Intl.Segmenter('pt', {granularity:
//      'sentence'})` (BR-07).
//   3. Append sentence segments to a running buffer; close the buffer when
//      adding the next sentence would push it above `CHUNK_TARGET[1]` (or above
//      `CHUNK_HARD_MAX` if the very first sentence already exceeds the soft
//      target).
//
// All offsets are 0-based, semi-open, counted in Unicode code points of the
// ORIGINAL content (BR-05). We use `[...content]` to iterate code points and a
// "code point index" array to translate between UTF-16 substring positions
// and code-point positions — JavaScript's `string.length` and `substring`
// operate on UTF-16 units, not code points.

import {
  CHUNK_HARD_MAX,
  CHUNK_TARGET,
  CHUNKING_VERSION,
} from "./config.js";

/** Source type discriminator — mirrors the PostgreSQL `source_type` enum. */
export type SourceType =
  | "pdf"
  | "email"
  | "ata"
  | "chat"
  | "artigo"
  | "transcricao"
  | "outro";

/**
 * Output of the chunker — one entry per persisted chunk. Verbatim slice of the
 * original content between `offset_start` and `offset_end` (code points,
 * semi-open). `chunk_index` is the 0-based position within the document.
 */
export interface RawChunkInput {
  readonly chunk_index: number;
  readonly text: string;
  readonly offset_start: number;
  readonly offset_end: number;
  readonly chunking_version: typeof CHUNKING_VERSION;
}

/**
 * Run the v1 chunker.
 *
 * Throws `Error` only for programmer errors (negative input length, etc.); a
 * legitimate empty content is impossible at this layer because the Zod schema
 * requires `content.minLength = 1` upstream.
 */
export function chunkV1(content: string, sourceType: SourceType): RawChunkInput[] {
  if (content.length === 0) {
    return [];
  }

  // Convert to a stable code-point array once. All offsets below index into
  // this array, never into the raw string.
  const codePoints = Array.from(content);
  const totalCodePoints = codePoints.length;

  // Step 1 — split into blocks by hard boundaries for this source_type.
  const blocks = splitByHardBoundaries(codePoints, sourceType);

  // Step 2/3 — turn each block into one or more chunks.
  const chunks: RawChunkInput[] = [];
  for (const block of blocks) {
    const blockSize = block.endExclusive - block.start;
    if (blockSize <= 0) continue;
    if (blockSize <= CHUNK_HARD_MAX) {
      // Whole block fits — emit as a single chunk.
      chunks.push(
        buildChunk(codePoints, block.start, block.endExclusive, chunks.length)
      );
      continue;
    }
    // Oversize — fall back to sentence-level split (BR-07).
    const blockText = codePoints.slice(block.start, block.endExclusive).join("");
    const sentenceRanges = splitBySentences(blockText, block.start);
    let bufferStart: number | null = null;
    let bufferEnd = 0;
    for (const [sStart, sEnd] of sentenceRanges) {
      if (bufferStart === null) {
        bufferStart = sStart;
        bufferEnd = sEnd;
        continue;
      }
      const tentativeSize = sEnd - bufferStart;
      // Close the running buffer if appending this sentence crosses the upper
      // soft target. If the buffer itself is already empty and the first
      // sentence is larger than CHUNK_HARD_MAX, emit it standalone — we have
      // no finer atom to split on (a single 5000-char sentence will become one
      // chunk; this is BR-07's documented limit).
      if (tentativeSize > CHUNK_TARGET[1]) {
        chunks.push(
          buildChunk(codePoints, bufferStart, bufferEnd, chunks.length)
        );
        bufferStart = sStart;
        bufferEnd = sEnd;
        continue;
      }
      bufferEnd = sEnd;
    }
    if (bufferStart !== null && bufferEnd > bufferStart) {
      chunks.push(
        buildChunk(codePoints, bufferStart, bufferEnd, chunks.length)
      );
    }
  }

  if (chunks.length === 0 && totalCodePoints > 0) {
    // Edge case: input was non-empty but consisted entirely of hard-boundary
    // separators (e.g. a file made of nothing but form-feed characters). We
    // still emit one chunk covering the raw content to preserve the audit
    // chain. This is intentionally conservative — the LLM will likely reject
    // the document, but ingestion never silently drops bytes.
    chunks.push(buildChunk(codePoints, 0, totalCodePoints, 0));
  }

  return chunks;
}

/** Internal — half-open code-point range `[start, endExclusive)`. */
interface CodePointRange {
  readonly start: number;
  readonly endExclusive: number;
}

/**
 * Split the document into top-level blocks along the hard boundaries that
 * apply to `sourceType` (BR-06). Hard boundaries are **mandatory closures**:
 * the chunker never produces a chunk that crosses one.
 *
 * v1 boundary policy (intentionally conservative — see BR-06):
 *
 * - `pdf`:          form-feed (`\f`, U+000C). PDF extractors typically insert
 *                    `\f` between pages.
 * - `email`:        first blank line (header/body separator) plus every
 *                    transition into / out of a `>` quotation block.
 * - `chat`,
 *   `transcricao`:  speaker boundary. A line that starts with
 *                    `[ \t]*[A-Za-z0-9_]+[ \t]*:[ \t]` (e.g. `João:`,
 *                    `[12:00] Maria:`) opens a new block. We never fuse two
 *                    consecutive speakers into one chunk.
 * - `ata`,
 *   `artigo`,
 *   `outro`:        no hard boundary — single block.
 */
function splitByHardBoundaries(
  codePoints: readonly string[],
  sourceType: SourceType
): CodePointRange[] {
  const total = codePoints.length;
  if (total === 0) return [];

  switch (sourceType) {
    case "ata":
    case "artigo":
    case "outro":
      return [{ start: 0, endExclusive: total }];

    case "pdf":
      return splitOnCharBoundary(codePoints, "\f");

    case "email":
      return splitEmail(codePoints);

    case "chat":
    case "transcricao":
      return splitTurns(codePoints);

    default: {
      // TypeScript exhaustiveness guard — if a new source_type is added to the
      // enum without updating this switch, the compiler flags it.
      const _exhaustive: never = sourceType;
      void _exhaustive;
      return [{ start: 0, endExclusive: total }];
    }
  }
}

/** Split on a single delimiter character; the delimiter is dropped. */
function splitOnCharBoundary(
  codePoints: readonly string[],
  delimiter: string
): CodePointRange[] {
  const ranges: CodePointRange[] = [];
  let cursor = 0;
  for (let i = 0; i < codePoints.length; i++) {
    if (codePoints[i] === delimiter) {
      if (i > cursor) {
        ranges.push({ start: cursor, endExclusive: i });
      }
      cursor = i + 1;
    }
  }
  if (cursor < codePoints.length) {
    ranges.push({ start: cursor, endExclusive: codePoints.length });
  }
  return ranges;
}

/**
 * Split an email: first blank line closes the headers, every transition into
 * or out of a quotation block (`^>+ `) closes a chunk. We operate on lines.
 */
function splitEmail(codePoints: readonly string[]): CodePointRange[] {
  const lines = scanLines(codePoints);
  if (lines.length === 0) return [];

  const ranges: CodePointRange[] = [];
  let blockStart = lines[0]!.start;
  let prevQuoted = isQuotedLine(codePoints, lines[0]!);
  let seenBlank = false;
  let headersClosed = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const isBlank = line.endExclusive === line.start;
    const isQuoted = !isBlank && isQuotedLine(codePoints, line);

    // First blank line closes the headers block.
    if (!headersClosed && isBlank) {
      if (line.start > blockStart) {
        ranges.push({ start: blockStart, endExclusive: line.start });
      }
      headersClosed = true;
      seenBlank = true;
      blockStart = nextLineStart(lines, i);
      prevQuoted = false;
      continue;
    }

    // Once headers are closed, every quote-state transition closes the chunk.
    if (headersClosed && i > 0 && !isBlank && isQuoted !== prevQuoted) {
      if (line.start > blockStart) {
        ranges.push({ start: blockStart, endExclusive: line.start });
      }
      blockStart = line.start;
    }
    if (!isBlank) prevQuoted = isQuoted;
    void seenBlank;
  }
  const total = codePoints.length;
  if (blockStart < total) {
    ranges.push({ start: blockStart, endExclusive: total });
  }
  return ranges;
}

/**
 * Split chat / transcript: a new "speaker line" opens a new block. A speaker
 * line is one whose trimmed start matches `[A-Za-z0-9_]+:` followed by white
 * space (e.g. `João: Bom dia`). Bracketed timestamps like `[12:00] João:` are
 * also accepted.
 */
function splitTurns(codePoints: readonly string[]): CodePointRange[] {
  const lines = scanLines(codePoints);
  if (lines.length === 0) return [];

  const ranges: CodePointRange[] = [];
  let blockStart = lines[0]!.start;
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]!;
    if (isSpeakerLine(codePoints, line)) {
      if (line.start > blockStart) {
        ranges.push({ start: blockStart, endExclusive: line.start });
      }
      blockStart = line.start;
    }
  }
  const total = codePoints.length;
  if (blockStart < total) {
    ranges.push({ start: blockStart, endExclusive: total });
  }
  return ranges;
}

/**
 * Walk the code-point array and emit one range per line. Line terminator is
 * `\n`; the terminator is NOT included in the range (so blank lines have
 * `start == endExclusive`).
 */
function scanLines(codePoints: readonly string[]): CodePointRange[] {
  const ranges: CodePointRange[] = [];
  let lineStart = 0;
  for (let i = 0; i < codePoints.length; i++) {
    if (codePoints[i] === "\n") {
      ranges.push({ start: lineStart, endExclusive: i });
      lineStart = i + 1;
    }
  }
  if (lineStart <= codePoints.length) {
    ranges.push({ start: lineStart, endExclusive: codePoints.length });
  }
  return ranges;
}

function nextLineStart(lines: readonly CodePointRange[], i: number): number {
  const next = lines[i + 1];
  if (next === undefined) {
    const here = lines[i]!;
    return here.endExclusive + 1;
  }
  return next.start;
}

function isQuotedLine(
  codePoints: readonly string[],
  line: CodePointRange
): boolean {
  // Skip leading whitespace, then look for at least one `>` character.
  let i = line.start;
  while (i < line.endExclusive && (codePoints[i] === " " || codePoints[i] === "\t")) {
    i++;
  }
  return i < line.endExclusive && codePoints[i] === ">";
}

function isSpeakerLine(
  codePoints: readonly string[],
  line: CodePointRange
): boolean {
  // Build the line as a string and test it against the speaker regex. We use
  // a regex here (not character-by-character) because the pattern is small and
  // documented; the cost is one substring per line, negligible at our scale.
  const text = codePoints.slice(line.start, line.endExclusive).join("");
  return SPEAKER_LINE_REGEX.test(text);
}

/**
 * Speaker-line regex. Accepts:
 *   - `Name:` followed by white space (Name = ASCII identifier characters
 *      plus single embedded spaces — we keep it strict to avoid false
 *      positives on prose like "Importante: ...").
 *   - Optional bracketed timestamp prefix `[12:00]` or `(12:00)`.
 *
 * Anchored to the start of the line. The trailing `\s` requirement avoids
 * matching `URLs:` headings and similar.
 */
const SPEAKER_LINE_REGEX = /^\s*(?:[[(]\d{1,2}:\d{2}(?::\d{2})?[\])][\s\t]+)?[A-Za-zÀ-ÿ0-9_]+(?:\s[A-Za-zÀ-ÿ0-9_]+)?:\s/;

/**
 * Sentence split via `Intl.Segmenter('pt', { granularity: 'sentence' })`
 * (BR-07). Returns half-open code-point ranges anchored to the ORIGINAL
 * document — `blockStart` is the code-point index where `blockText` begins in
 * the full document, so we can return absolute offsets without recomputing.
 *
 * Code-block / table heuristics (BR-07 carve-out): we currently do not split
 * sentences inside a Markdown ``` fenced block or inside a `|...|` table row.
 * Because v1 only sentence-splits on blocks above CHUNK_HARD_MAX, structural
 * blocks below that limit are preserved by step 2; the carve-out only matters
 * for pathological inputs and is documented in BR-07 as best-effort.
 *
 * The `Intl.Segmenter` API operates on UTF-16 indices; we translate them back
 * to code-point indices via a precomputed cumulative map.
 */
function splitBySentences(
  blockText: string,
  blockStart: number
): Array<[number, number]> {
  // Use Intl.Segmenter if available (Node 20 LTS official Linux x64 binaries
  // ship with full ICU and provide it). The `pt` locale and `sentence`
  // granularity are spec-mandated (BR-07).
  const segmenter = new Intl.Segmenter("pt", { granularity: "sentence" });

  // Map UTF-16 index -> code-point index within `blockText`. Index `i` in the
  // returned array gives the count of code points consumed by `blockText` up
  // to (and not including) UTF-16 position `i`. This is the canonical safe
  // translation between the two address spaces.
  const utf16ToCp = buildUtf16ToCodePointMap(blockText);

  const result: Array<[number, number]> = [];
  for (const segment of segmenter.segment(blockText)) {
    const utf16Start = segment.index;
    const utf16End = segment.index + segment.segment.length;
    const cpStart = utf16ToCp[utf16Start] ?? 0;
    const cpEnd = utf16ToCp[utf16End] ?? (utf16ToCp[utf16ToCp.length - 1] ?? 0);
    if (cpEnd > cpStart) {
      result.push([blockStart + cpStart, blockStart + cpEnd]);
    }
  }
  return result;
}

function buildUtf16ToCodePointMap(s: string): number[] {
  // Length = s.length + 1 so we can look up the final boundary.
  const map = new Array<number>(s.length + 1);
  let cp = 0;
  for (let i = 0; i < s.length; ) {
    map[i] = cp;
    const codePoint = s.codePointAt(i);
    if (codePoint === undefined) {
      i++;
      cp++;
      continue;
    }
    const stride = codePoint > 0xffff ? 2 : 1;
    i += stride;
    cp++;
  }
  map[s.length] = cp;
  return map;
}

/** Build a `RawChunkInput` from absolute code-point offsets. */
function buildChunk(
  codePoints: readonly string[],
  start: number,
  endExclusive: number,
  index: number
): RawChunkInput {
  return {
    chunk_index: index,
    text: codePoints.slice(start, endExclusive).join(""),
    offset_start: start,
    offset_end: endExclusive,
    chunking_version: CHUNKING_VERSION,
  };
}
