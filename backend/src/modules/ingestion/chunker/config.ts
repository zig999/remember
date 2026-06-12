// Chunker v1 constants — single source of truth (BR-04, A22).
//
// Changing any of these requires bumping `CHUNKING_VERSION` and writing a new
// chunker module (BR-03). The constants are not configurable per request.
//
// Units: Unicode code points (BR-05) — we measure block size by code-point
// count, not by UTF-16 units or bytes.

/** Identifier of the chunking strategy persisted in `raw_chunk.chunking_version`. */
export const CHUNKING_VERSION = "v1" as const;

/**
 * Soft size window for a chunk. The chunker keeps appending sentences while the
 * running block stays within `[CHUNK_TARGET[0], CHUNK_TARGET[1]]`; it tries to
 * close the chunk once the upper bound is reached, but only if it lands on a
 * sentence boundary. Hard boundaries (BR-06) close earlier; oversize blocks
 * (BR-07) split with `Intl.Segmenter`.
 */
export const CHUNK_TARGET: readonly [number, number] = [1500, 2000] as const;

/** Hard ceiling on a single chunk. A block above this size is sentence-split. */
export const CHUNK_HARD_MAX = 4000 as const;

/**
 * Reading-tail window — overlap added to the END of a chunk to keep cross-
 * sentence context readable downstream. Not persisted (BR-06): the overlap is
 * computed at read time by the future retrieval layer. Listed here so the
 * constant has one home should a future revision decide to materialize it.
 */
export const READING_TAIL = 200 as const;
