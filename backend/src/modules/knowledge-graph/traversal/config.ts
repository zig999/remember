// Cross-domain traversal configuration constants.
//
// `TRAVERSAL_DECAY` (BR-14 of `knowledge-graph.back.md`, ADR A16) is the
// single source of truth for the per-hop score decay applied by the BFS
// traversal engine. It MUST live in this file because the contract is
// consumed by:
//
//   - `knowledge-graph` (this domain) — UC-06 `traverseNode` REST endpoint
//     and the internal `traverseNodes()` service method.
//   - `query-retrieval` (TC-06) — graph-expansion step of `searchKnowledge`
//     reuses the same constant to keep ranking scores comparable across
//     domains.
//
// Changing the constant requires coordinated updates in BOTH consumers and
// is therefore a deliberate cross-domain contract change.

/** Per-hop score multiplier: `score(hop) = TRAVERSAL_DECAY ** hop`. */
export const TRAVERSAL_DECAY = 0.5 as const;

/** Lower bound on the depth parameter (BR-05 of `knowledge-graph.back.md`). */
export const TRAVERSAL_DEPTH_MIN = 1 as const;

/** Upper bound on the depth parameter (BR-05). */
export const TRAVERSAL_DEPTH_MAX = 3 as const;

/** Default depth when the caller does not specify one. */
export const TRAVERSAL_DEPTH_DEFAULT = 1 as const;
