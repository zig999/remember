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

const QUEUE_STALE_MS = 0;
const QUEUE_POLL_MS = 30_000;
const METRICS_STALE_MS = 30_000;

export interface ListReviewQueueParams {
  readonly kind?: ReviewQueueKind;
  readonly limit?: number;
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

export function useListReviewQueue(
  params: ListReviewQueueParams = {},
): UseQueryResult<ReviewQueueList> {
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
    retry: 1,
  });
}

interface AffectedKeysOverlay {
  readonly nodeIds?: ReadonlyArray<string>;
  readonly items?: ReadonlyArray<{ readonly kind: ItemKind; readonly id: string }>;
}

function invalidateCurationAndAffected(
  queryClient: ReturnType<typeof useQueryClient>,
  overlay: AffectedKeysOverlay = {},
): void {
  void queryClient.invalidateQueries({ queryKey: curationKeys.all });
  (overlay.nodeIds ?? []).forEach((nodeId) => {
    void queryClient.invalidateQueries({
      queryKey: nodeKeys.detail(nodeId),
    });
  });
  (overlay.items ?? []).forEach(({ kind, id }) => {
    const key =
      kind === "link"
        ? provenanceKeys.link(id)
        : provenanceKeys.attribute(id);
    void queryClient.invalidateQueries({ queryKey: key });
  });
}

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
      invalidateCurationAndAffected(queryClient, {
        items: [
          { kind: variables.item_kind, id: variables.item_id },
          { kind: variables.item_kind, id: data.new_item_id },
        ],
      });
      const historyKey =
        variables.item_kind === "link"
          ? ["history", "link", variables.item_id]
          : ["history", "attribute", variables.item_id];
      void queryClient.invalidateQueries({ queryKey: historyKey });
    },
  });
}
