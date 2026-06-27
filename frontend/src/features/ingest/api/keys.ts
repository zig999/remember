/**
 * Ingest TanStack Query key factory (dev_tc_005).
 *
 * Spec: `ingest.feature.spec.md §4 Cache keys`.
 *
 * Mutations (`ingestRawInformation`, `runLlmExtraction`, `retryLlmRun`) do NOT
 * own a cache key — they invalidate queries on success but don't read them.
 * Only the polling query (`getLlmRunById`) and the parallel traverses
 * (`traverseNode` per affected node) need keys.
 */
export const ingestKeys = {
  all: ["ingest"] as const,
  /** `useIngestRunStatus` — polling key for `getLlmRunById`. */
  run: (id: string) => ["ingest", "run", id] as const,
  /** `useIngestGraphAssembly` — per-node traverse key. */
  traverse: (nodeId: string) => ["ingest", "traverse", nodeId] as const,
};
