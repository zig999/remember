// Layer weight constants for the three-layer FTS pipeline (BR-07 of
// `query-retrieval.back.md`, ADR A15).
//
// These multipliers are bound as query parameters (NEVER concatenated into
// SQL strings) by each layer builder. Calibration = changing the constants
// here; no SQL rewrite. Tests assert the documented order
// (fragment > node > chunk) remains invariant.

/** Layer weight for `information_fragment` hits (highest authority). */
export const LAYER_WEIGHT_FRAGMENT = 1.0 as const;

/** Layer weight for `node_alias` hits (resolved to the parent node). */
export const LAYER_WEIGHT_NODE = 0.9 as const;

/** Layer weight for raw `raw_chunk` hits (only surfaced when no fragment anchors them). */
export const LAYER_WEIGHT_CHUNK = 0.6 as const;
