/**
 * Ingest — TanStack Query key factory.
 *
 * Spec references:
 *  - docs/specs/front/features/ingest.feature.spec.md §4 (Cache keys) —
 *    `ingestKeys.run(id)` → `["ingest", "run", id]`;
 *    `ingestKeys.traverse(nodeId)` → `["ingest", "traverse", nodeId]`.
 *  - front.md §4.1 (centralised key factories per feature; mutation
 *    invalidation references the factory entries).
 *
 * Conventions:
 *  - All entries are `as const` tuples — TanStack Query uses array equality;
 *    `as const` gives literal types so consumers can match prefixes safely
 *    (e.g. `invalidateQueries({ queryKey: ingestKeys.all })` wipes both run
 *    + traverse caches).
 *  - `run(id)` is consumed by `useIngestRunStatus` polling.
 *  - `traverse(nodeId)` is consumed by `useIngestGraphAssembly` (TC-05);
 *    declared here so both this TC's hooks and TC-05 share the same factory.
 *  - Mutations (`ingestRawInformation`, `runLlmExtraction`, `retryLlmRun`)
 *    do not occupy cache slots — they invalidate `ingestKeys.run(id)` on
 *    success to force a polling refetch.
 */

export const ingestKeys = {
  /** Root prefix — invalidates ALL ingest-scoped queries. */
  all: ["ingest"] as const,

  /** Per-run status — `["ingest", "run", id]`. Used by polling Query. */
  run: (id: string) => ["ingest", "run", id] as const,

  /** Per-node traverse — `["ingest", "traverse", nodeId]`. Used by the
   *  graph-assembly Queries in TC-05. Declared here (not in features/graph)
   *  because the cache slot is scoped to the ingest flow's depth-1 fetches;
   *  the graph feature's `graphNodeKeys.relationships` is a different slot
   *  used by NodeDetailPanel. */
  traverse: (nodeId: string) => ["ingest", "traverse", nodeId] as const,
} as const;
