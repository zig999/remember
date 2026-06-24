/**
 * Curation domain hooks — queue, metrics, and mutations.
 *
 * Spec references:
 *  - docs/specs/front/features/curadoria.feature.spec.md §1 (consumed
 *    endpoints), §4 (request order, cache keys, TTL), §6 (curation REST is
 *    bare-body on 2xx).
 *  - docs/specs/domains/curation/openapi.yaml (operationIds:
 *    `listReviewQueue`, `getCurationMetrics`, `resolveEntityMatch`,
 *    `mergeNodes`, `resolveDispute`, `confirmItem`, `rejectItem`,
 *    `correctItem`).
 *
 * Design:
 *  - Reads (`listReviewQueue`, `getCurationMetrics`) are `useQuery`.
 *    - `listReviewQueue`: staleTime 0 (volatile), refetchInterval 30s,
 *      refetchOnWindowFocus true — spec §4.
 *    - `getCurationMetrics`: staleTime 30s, refetchOnWindowFocus true.
 *  - Writes (`resolveEntityMatch`, `mergeNodes`, `resolveDispute`,
 *    `confirmItem`, `rejectItem`, `correctItem`) are `useMutation`. Every
 *    mutation on success invalidates:
 *      - `curationKeys.all` (queue + metrics refresh)
 *      - `nodeKeys.detail(affectedNodeId?)` when the action affected a
 *        specific node (entity_match, merge, correct that returns
 *        new_item_id but the node is on the predecessor — the caller may
 *        also pass an explicit `affectedNodeIds` overlay through
 *        `useResolveEntityMatch` etc., but the default invalidation is
 *        defensive: invalidate everything safe).
 *      - For item-level mutations: `provenanceKeys.link/attribute` for
 *        the touched item id (so the ProvenanceTrail re-fetches on
 *        auto-advance — see spec §4 "Invalidação pós-mutação").
 *  - All hooks call `httpCuration<T>()` (bare-body); they do NOT call
 *    `lib/http.ts` (which expects an envelope — see _request.ts header).
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
  type UseMutationResult,
} from "@tanstack/react-query";

import { authHeader, httpCuration } from "./_request";
import { curationKeys, nodeKeys, provenanceKeys } from "./keys";
import {
  toReviewQueueList,
  toCurationMetrics,
} from "./_transforms";
import type {
  ReviewQueueList,
  ReviewQueueListWire,
  ReviewQueueKind,
  CurationMetrics,
  CurationMetricsWire,
  ResolveEntityMatchRequest,
  ResolveEntityMatchResponse,
  MergeNodesRequest,
  MergeNodesResponse,
  ResolveDisputeRequest,
  ResolveDisputeResponse,
  ConfirmItemRequest,
  RejectItemRequest,
  ItemActionResponse,
  CorrectItemRequest,
  CorrectItemResponse,
  ItemKind,
} from "../types";

/* ------------------------------------------------------------------ *
 * Constants — spec §4 TTL table                                       *
 * ------------------------------------------------------------------ */

const QUEUE_STALE_MS = 0;
const QUEUE_POLL_MS = 30_000;
const METRICS_STALE_MS = 30_000;

/* ------------------------------------------------------------------ *
 * Reads                                                               *
 * ------------------------------------------------------------------ */

export interface ListReviewQueueParams {
  /** Filter by queue kind. Omit for both queues. */
  readonly kind?: ReviewQueueKind;
  /** Page size — clamped server-side to [1, 100]. Default 20. */
  readonly limit?: number;
  /** 0-based offset. Default 0. */
  readonly offset?: number;
}

function buildQueueQs(params: ListReviewQueueParams): string {
  const search = new URLSearchParams();
  if (params.kind !== undefined) search.set("kind", params.kind);
  if (params.limit !== undefined) search.set("limit", String(params.limit));
  if (params.offset !== undefined) search.set("offset", String(params.offset));
  const qs = search.toString();
  return qs.length > 0 ? `?${qs}` : "";
}

/**
 * `listReviewQueue` — fila de triagem (entity_match + disputed). Polling
 * every 30s (only while tab is visible — TanStack Query honours
 * `document.visibilityState`). staleTime 0 (volátil).
 */
export function useListReviewQueue(
  params: ListReviewQueueParams = {},
): UseQueryResult<ReviewQueueList> {
  // The page number used in the key factory is derived from `offset` +
  // `limit`. When the consumer passes no params at all (kind=undefined,
  // offset=undefined), we forward `undefined` to the factory so the key
  // matches the canonical "both queues, first page" shape
  // (`curationKeys.queue()`). When `offset` is provided, we derive a
  // 0-based page so two different pages occupy distinct cache entries.
  const limit = params.limit ?? 20;
  const offset = params.offset;
  const page =
    offset === undefined ? undefined : limit > 0 ? Math.floor(offset / limit) : 0;
  return useQuery({
    queryKey: curationKeys.queue(params.kind, page),
    queryFn: async () => {
      const wire = await httpCuration<ReviewQueueListWire>(
        `/api/v1/curation/queue${buildQueueQs(params)}`,
        { method: "GET", headers: authHeader() },
      );
      return toReviewQueueList(wire);
    },
    staleTime: QUEUE_STALE_MS,
    refetchInterval: QUEUE_POLL_MS,
    refetchOnWindowFocus: true,
  });
}

/**
 * `getCurationMetrics` — §16 calibration aggregates. staleTime 30s.
 *
 * Graceful degradation contract (R1, spec §1): callers MUST tolerate the
 * query failing (503) and fall back to per-kind totals derived from
 * `listReviewQueue.total`. This hook does not enforce the fallback — it
 * exposes `isError` so the UI can branch.
 */
export function useCurationMetrics(): UseQueryResult<CurationMetrics> {
  return useQuery({
    queryKey: curationKeys.metrics(),
    queryFn: async () => {
      const wire = await httpCuration<CurationMetricsWire>(
        "/api/v1/curation/metrics",
        { method: "GET", headers: authHeader() },
      );
      return toCurationMetrics(wire);
    },
    staleTime: METRICS_STALE_MS,
    refetchOnWindowFocus: true,
    // Retry once: metrics is advisory, a single transient failure shouldn't
    // spam retries while the queue is being interacted with.
    retry: 1,
  });
}

/* ------------------------------------------------------------------ *
 * Mutations — invalidation helpers                                    *
 * ------------------------------------------------------------------ */

interface AffectedKeysOverlay {
  /** Node ids whose `nodeKeys.detail` should be invalidated. */
  readonly nodeIds?: ReadonlyArray<string>;
  /** Item ids whose `provenanceKeys.link/attribute` should be invalidated. */
  readonly items?: ReadonlyArray<{ readonly kind: ItemKind; readonly id: string }>;
}

function invalidateCurationAndAffected(
  queryClient: ReturnType<typeof useQueryClient>,
  overlay: AffectedKeysOverlay = {},
): void {
  // Queue + metrics (root prefix).
  void queryClient.invalidateQueries({ queryKey: curationKeys.all });
  // Per-node detail keys (entity_match / merge / correct flows).
  (overlay.nodeIds ?? []).forEach((nodeId) => {
    void queryClient.invalidateQueries({
      queryKey: nodeKeys.detail(nodeId),
    });
  });
  // Per-item provenance keys (confirm / reject / correct of a single
  // link/attribute).
  (overlay.items ?? []).forEach(({ kind, id }) => {
    const key =
      kind === "link"
        ? provenanceKeys.link(id)
        : provenanceKeys.attribute(id);
    void queryClient.invalidateQueries({ queryKey: key });
  });
}

/* ------------------------------------------------------------------ *
 * Mutations                                                           *
 * ------------------------------------------------------------------ */

export interface ResolveEntityMatchVariables {
  readonly node_id: string;
  readonly body: ResolveEntityMatchRequest;
}

export function useResolveEntityMatch(): UseMutationResult<
  ResolveEntityMatchResponse,
  Error,
  ResolveEntityMatchVariables
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ node_id, body }) =>
      httpCuration<ResolveEntityMatchResponse>(
        `/api/v1/curation/entity-matches/${encodeURIComponent(node_id)}/resolve`,
        {
          method: "POST",
          headers: { ...authHeader(), "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      ),
    onSuccess: (data, variables) => {
      const nodeIds: string[] = [variables.node_id];
      if (variables.body.target_node_id) {
        nodeIds.push(variables.body.target_node_id);
      }
      invalidateCurationAndAffected(queryClient, { nodeIds });
      // `data.affected` carries the repointed counts but no per-item ids
      // are returned (link/attribute provenance is invalidated on demand
      // when the curator visits the affected node).
      void data;
    },
  });
}

export function useMergeNodes(): UseMutationResult<
  MergeNodesResponse,
  Error,
  MergeNodesRequest
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body) =>
      httpCuration<MergeNodesResponse>("/api/v1/curation/nodes/merge", {
        method: "POST",
        headers: { ...authHeader(), "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    onSuccess: (_data, variables) => {
      invalidateCurationAndAffected(queryClient, {
        nodeIds: [variables.survivor_id, variables.absorbed_id],
      });
    },
  });
}

export function useResolveDispute(): UseMutationResult<
  ResolveDisputeResponse,
  Error,
  ResolveDisputeRequest
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body) =>
      httpCuration<ResolveDisputeResponse>("/api/v1/curation/disputes/resolve", {
        method: "POST",
        headers: { ...authHeader(), "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    onSuccess: (_data, variables) => {
      invalidateCurationAndAffected(queryClient, {
        items: variables.item_ids.map((id) => ({
          kind: variables.item_kind,
          id,
        })),
      });
    },
  });
}

export function useConfirmItem(): UseMutationResult<
  ItemActionResponse,
  Error,
  ConfirmItemRequest
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body) =>
      httpCuration<ItemActionResponse>("/api/v1/curation/items/confirm", {
        method: "POST",
        headers: { ...authHeader(), "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    onSuccess: (_data, variables) => {
      invalidateCurationAndAffected(queryClient, {
        items: [{ kind: variables.item_kind, id: variables.item_id }],
      });
    },
  });
}

export function useRejectItem(): UseMutationResult<
  ItemActionResponse,
  Error,
  RejectItemRequest
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body) =>
      httpCuration<ItemActionResponse>("/api/v1/curation/items/reject", {
        method: "POST",
        headers: { ...authHeader(), "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    onSuccess: (_data, variables) => {
      invalidateCurationAndAffected(queryClient, {
        items: [{ kind: variables.item_kind, id: variables.item_id }],
      });
    },
  });
}

export function useCorrectItem(): UseMutationResult<
  CorrectItemResponse,
  Error,
  CorrectItemRequest
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body) =>
      httpCuration<CorrectItemResponse>("/api/v1/curation/items/correct", {
        method: "POST",
        headers: { ...authHeader(), "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    onSuccess: (data, variables) => {
      // Invalidate provenance of BOTH the predecessor and the new row, plus
      // any history key on the predecessor (errata flow).
      invalidateCurationAndAffected(queryClient, {
        items: [
          { kind: variables.item_kind, id: variables.item_id },
          { kind: variables.item_kind, id: data.new_item_id },
        ],
      });
      // History invalidations live in node.hooks (historyKeys); do them
      // explicitly here because correct_item is the only mutation that
      // extends a lineage chain.
      const historyKey =
        variables.item_kind === "link"
          ? ["history", "link", variables.item_id]
          : ["history", "attribute", variables.item_id];
      void queryClient.invalidateQueries({ queryKey: historyKey });
    },
  });
}
