// Affected-nodes projection — TC-02 / BR-33.
//
// Surfaces, on the LLMRun read path, the deduplicated list of KnowledgeNode
// ids the run touched via `propose_node` / `propose_link` / `propose_attribute`
// — resolved to `{ id, canonical_name, node_type }` via ONE batched
// `knowledge_node JOIN node_type` lookup after all chunks complete.
//
// This module owns:
//   - The per-run in-memory collector built up during `runLlmExtraction`.
//   - The process-scoped LRU cache (size 256) keyed by `llm_run_id`.
//   - The derived fallback over `tool_call.result` rows (cache miss on a
//     completed run).
//   - The batched resolver against `knowledge_node` + `node_type`.
//
// Persistence is in-memory only in v1.3.0 — a future additive migration
// (`llm_run.affected_nodes_snapshot jsonb`) is deferred per BR-33 "Out of
// scope". The contract on the wire is unchanged either way.
//
// CONTRACT (mirrors BR-33 — additive, optional):
//   `affected_nodes` is attached to a `LlmRunResponse` ONLY when the run's
//   status === 'completed'. Empty array is a valid completed-run payload (a
//   run can complete with only `rejected` outcomes). Absent means the run is
//   not in a state that supports the field, OR the read path could not produce
//   the list (e.g. transient DB outage on the batched lookup — best-effort,
//   not transactional).
//
// `rejected` and `error` validation outcomes do NOT contribute (they did not
// touch the graph). De-dup is by `node_id`; first-write-wins on the entry.
// Iteration order on the final list is insertion order (deterministic by
// per-chunk tool-use order).

import type { PoolClient } from "pg";

import type { McpEnvelope } from "./propose.types.js";

// --------------------------------------------------------------------------
// Public types
// --------------------------------------------------------------------------

/** Final shape surfaced on the wire (`LlmRunResponse.affected_nodes`). */
export interface AffectedNode {
  readonly id: string;
  readonly canonical_name: string;
  readonly node_type: string;
}

// --------------------------------------------------------------------------
// Collector — used by `runLlmExtraction`. Per-run, in-memory Map.
// --------------------------------------------------------------------------

/**
 * Per-run collector. Records node ids touched by `ok:true` envelopes from the
 * three writer tools, de-duplicating by id (first-write-wins). Records are
 * insertion-ordered: callers MUST iterate via `ids()` to preserve order.
 *
 * The collector does NOT do DB lookups; it only carries the ids the
 * orchestrator observed. Resolution to `{ canonical_name, node_type }` is the
 * caller's responsibility (`resolveAffectedNodes`).
 */
export interface AffectedNodeCollector {
  /**
   * Inspect a tool envelope and record any affected node ids. No-op for
   * tools other than `propose_node` / `propose_link` / `propose_attribute`,
   * and for `ok:false` envelopes (which include layered-validation rejections
   * AND ok:true with outcome === 'rejected' — see filter below).
   */
  record(toolName: string, envelope: McpEnvelope<Record<string, unknown>>): void;
  /** Snapshot of the collected node ids in insertion order. */
  ids(): string[];
}

/**
 * Whether an `ok:true` envelope's `outcome` is one of the affected-node-
 * contributing buckets (BR-33 "Collection" — `rejected` and `error` do NOT
 * contribute).
 */
function isContributingOutcome(outcome: unknown): boolean {
  if (typeof outcome !== "string") return false;
  // Closed list per BR-33 / BR-27.
  //   propose_node:     created_new | matched_existing | needs_review
  //   propose_link:     accepted | consolidated | superseded_previous | disputed
  //   propose_attribute: accepted | consolidated | superseded_previous | disputed
  // We intentionally accept the union — the dispatch table (which tool emitted
  // which outcome) is already enforced by the service layer; collecting the
  // union is what the spec says ("any `{ ok: true }` outcome that surfaces a
  // node id, excluding `rejected`").
  switch (outcome) {
    case "created_new":
    case "matched_existing":
    case "needs_review":
    case "accepted":
    case "consolidated":
    case "superseded_previous":
    case "disputed":
      return true;
    default:
      // `rejected` AND any unknown future value fall through — explicit allow-list.
      return false;
  }
}

/** Extract every affected node id from a tool envelope. Empty array on miss. */
function affectedIdsFromEnvelope(
  toolName: string,
  envelope: McpEnvelope<Record<string, unknown>>
): string[] {
  // `ok:false` envelopes (layered-validation, internal errors) never touch the
  // graph — they cannot contribute.
  if (!envelope.ok) return [];
  // Only the three writer tools surface affected node ids.
  if (
    toolName !== "propose_node" &&
    toolName !== "propose_link" &&
    toolName !== "propose_attribute"
  ) {
    return [];
  }
  const result = envelope.result as Record<string, unknown> | null | undefined;
  if (result === null || result === undefined || typeof result !== "object") {
    return [];
  }
  const outcome = (result as { outcome?: unknown }).outcome;
  // `propose_node` does not carry an `outcome` field — it carries `resolution`.
  // For node it is always contributing on ok:true (resolution is one of
  // matched_existing / created_new / needs_review — all three contribute).
  // For link/attribute the `outcome` gate is enforced via isContributingOutcome.
  if (toolName === "propose_node") {
    const nodeId = (result as { node_id?: unknown }).node_id;
    return typeof nodeId === "string" && nodeId.length > 0 ? [nodeId] : [];
  }
  if (!isContributingOutcome(outcome)) return [];
  if (toolName === "propose_link") {
    const source = (result as { source_node_id?: unknown }).source_node_id;
    const target = (result as { target_node_id?: unknown }).target_node_id;
    const ids: string[] = [];
    if (typeof source === "string" && source.length > 0) ids.push(source);
    if (typeof target === "string" && target.length > 0) ids.push(target);
    return ids;
  }
  // propose_attribute
  const nodeId = (result as { node_id?: unknown }).node_id;
  return typeof nodeId === "string" && nodeId.length > 0 ? [nodeId] : [];
}

/** Create a fresh collector — one per `runLlmExtraction` invocation. */
export function createAffectedNodeCollector(): AffectedNodeCollector {
  // Map<id, true> — `Map` preserves insertion order per the JS spec, which is
  // what BR-33 ("Iteration order on the final list is the insertion order")
  // requires. We only need the keys; the boolean is a placeholder.
  const seen = new Map<string, true>();
  return {
    record(toolName, envelope) {
      const ids = affectedIdsFromEnvelope(toolName, envelope);
      for (const id of ids) {
        if (!seen.has(id)) {
          seen.set(id, true);
        }
      }
    },
    ids() {
      return Array.from(seen.keys());
    },
  };
}

// --------------------------------------------------------------------------
// LRU cache — process-scoped singleton, size 256.
// --------------------------------------------------------------------------

const CACHE_CAPACITY = 256 as const;

/**
 * Insertion-ordered Map used as a simple LRU: every read/write touches a key
 * by deleting and re-inserting; eviction targets the oldest key when size
 * exceeds capacity. This is a classic LRU-via-Map idiom (no external dep).
 */
const cache = new Map<string, readonly AffectedNode[]>();

function touch(llmRunId: string, value: readonly AffectedNode[]): void {
  if (cache.has(llmRunId)) cache.delete(llmRunId);
  cache.set(llmRunId, value);
  if (cache.size > CACHE_CAPACITY) {
    // Evict oldest — the first key returned by the iterator.
    const oldest = cache.keys().next().value;
    if (typeof oldest === "string") cache.delete(oldest);
  }
}

/** Read from the cache; returns `undefined` on miss. */
export function getCachedAffectedNodes(
  llmRunId: string
): readonly AffectedNode[] | undefined {
  if (!cache.has(llmRunId)) return undefined;
  const value = cache.get(llmRunId)!;
  // Touch for LRU recency.
  cache.delete(llmRunId);
  cache.set(llmRunId, value);
  return value;
}

/** Write to the cache (write-through from the orchestrator on completion). */
export function setCachedAffectedNodes(
  llmRunId: string,
  list: readonly AffectedNode[]
): void {
  touch(llmRunId, list);
}

/** Test-only — reset the module cache between specs. */
export function __clearAffectedNodesCacheForTests(): void {
  cache.clear();
}

// --------------------------------------------------------------------------
// Resolver — ONE batched `knowledge_node JOIN node_type` lookup.
// --------------------------------------------------------------------------

/**
 * Resolve a list of node ids to `{ id, canonical_name, node_type }`, in the
 * SAME order as the input ids (de-duplicated upstream by the collector).
 *
 * Behaviour per BR-33:
 *   - One batched query against `knowledge_node JOIN node_type` with
 *     `WHERE kn.id = ANY($1::uuid[])`.
 *   - Rows whose `knowledge_node.status = 'merged_into'` are resolved
 *     transparently to the surviving node via `merged_into_node_id`. We do
 *     ONE extra batched lookup for the survivors (depth-1 path compression on
 *     write keeps this normally enough).
 *   - Ids the lookup does not find at all (e.g. a node compliance-deleted
 *     between the tool call and run-completion) are skipped silently — they
 *     are not the run's responsibility to resurrect.
 *
 * Empty `ids` array → empty result without issuing a query.
 */
export async function resolveAffectedNodes(
  client: PoolClient,
  ids: readonly string[]
): Promise<AffectedNode[]> {
  if (ids.length === 0) return [];

  // Step 1 — one batched lookup. We need `status` + `merged_into_node_id` so
  // we can transparently follow merges. The view `knowledge_node_resolved`
  // would re-derive `effective_status`, but we want the raw row's status to
  // detect the merged-into case explicitly.
  const lookup = await client.query<{
    id: string;
    canonical_name: string;
    node_type: string;
    status: string;
    merged_into_node_id: string | null;
  }>(
    `SELECT kn.id,
            kn.canonical_name,
            nt.name AS node_type,
            kn.status,
            kn.merged_into_node_id
       FROM knowledge_node kn
       JOIN node_type nt ON nt.id = kn.node_type_id
      WHERE kn.id = ANY($1::uuid[])`,
    [ids as unknown as string[]]
  );

  // Index for fast id → row lookups in the input order.
  const byId = new Map<string, (typeof lookup.rows)[number]>();
  for (const row of lookup.rows) byId.set(row.id, row);

  // Step 2 — collect merged ids that need a survivor lookup.
  const mergedSurvivorIds = new Set<string>();
  for (const id of ids) {
    const row = byId.get(id);
    if (
      row !== undefined &&
      row.status === "merged_into" &&
      row.merged_into_node_id !== null &&
      !byId.has(row.merged_into_node_id)
    ) {
      mergedSurvivorIds.add(row.merged_into_node_id);
    }
  }

  if (mergedSurvivorIds.size > 0) {
    const survivors = await client.query<{
      id: string;
      canonical_name: string;
      node_type: string;
      status: string;
      merged_into_node_id: string | null;
    }>(
      `SELECT kn.id,
              kn.canonical_name,
              nt.name AS node_type,
              kn.status,
              kn.merged_into_node_id
         FROM knowledge_node kn
         JOIN node_type nt ON nt.id = kn.node_type_id
        WHERE kn.id = ANY($1::uuid[])`,
      [Array.from(mergedSurvivorIds) as unknown as string[]]
    );
    for (const row of survivors.rows) byId.set(row.id, row);
  }

  // Step 3 — produce the output list in the input id order, following one hop
  // of `merged_into_node_id` when present.
  const out: AffectedNode[] = [];
  const emitted = new Set<string>();
  for (const id of ids) {
    let row = byId.get(id);
    if (row === undefined) continue;
    if (row.status === "merged_into" && row.merged_into_node_id !== null) {
      const survivor = byId.get(row.merged_into_node_id);
      if (survivor === undefined) continue;
      row = survivor;
    }
    if (emitted.has(row.id)) continue;
    emitted.add(row.id);
    out.push({
      id: row.id,
      canonical_name: row.canonical_name,
      node_type: row.node_type,
    });
  }
  return out;
}

// --------------------------------------------------------------------------
// Derive — fallback for a cache miss on a completed run.
// --------------------------------------------------------------------------

/**
 * Rebuild the affected-node list from `tool_call.result` rows for a completed
 * run. Used as the derived fallback when the in-process LRU has evicted the
 * entry (process restart, capacity overflow). Re-applies the same de-dup +
 * batched lookup the orchestrator did at completion — the wire payload is
 * byte-equivalent to the cached one.
 *
 * Per-call cost is O(rows in tool_call for the run) + ONE batched
 * knowledge_node lookup. Acceptable on cache miss; the cache absorbs the
 * common path.
 */
export async function deriveAffectedNodes(
  client: PoolClient,
  llmRunId: string
): Promise<AffectedNode[]> {
  // Walk every tool_call row of the run, re-applying the same envelope filter.
  // We rebuild the synthetic envelope shape `{ ok: true, result }` because the
  // collector consumes that shape (single source of truth for filtering).
  const rows = await client.query<{
    tool_name: string;
    result: Record<string, unknown> | null;
    validation_outcome: string;
  }>(
    `SELECT tool_name, result, validation_outcome
       FROM tool_call
      WHERE llm_run_id = $1
      ORDER BY created_at ASC, id ASC`,
    [llmRunId]
  );

  const collector = createAffectedNodeCollector();
  for (const row of rows.rows) {
    // Only `validation_outcome IN (accepted, consolidated, superseded_previous,
    // disputed)` rows can contribute — but the collector ALREADY enforces this
    // via `isContributingOutcome` reading `result.outcome` (the
    // `validation_outcome` audit column tracks the same value). We feed the
    // collector the synthetic envelope and let it filter.
    if (row.result === null) continue;
    collector.record(row.tool_name, {
      ok: true,
      result: row.result,
    });
  }

  return resolveAffectedNodes(client, collector.ids());
}
