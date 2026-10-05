import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import { http } from "@/lib/http";
import { authHeader } from "./_request";
import { nodeKeys, historyKeys } from "./keys";
import {
  toNodeDetail,
  toLinkHistoryResponse,
  toAttributeHistoryResponse,
} from "./_transforms";
import type {
  NodeDetail,
  NodeDetailWire,
  LinkHistoryResponse,
  LinkHistoryResponseWire,
  AttributeHistoryResponse,
  AttributeHistoryResponseWire,
} from "../types";

const STABLE_STALE_MS = 5 * 60_000;

export interface UseCurationNodeDetailParams {
  readonly asOf?: string;
  readonly inEffectOnly?: boolean;
  readonly includeUncertain?: boolean;
}

function buildNodeQs(params: UseCurationNodeDetailParams): string {
  const search = new URLSearchParams();
  if (params.asOf !== undefined) search.set("as_of", params.asOf);
  if (params.inEffectOnly === true) search.set("in_effect_only", "true");
  if (params.includeUncertain === false)
    search.set("include_uncertain", "false");
  const qs = search.toString();
  return qs.length > 0 ? `?${qs}` : "";
}

export function useCurationNodeDetail(
  nodeId: string | null | undefined,
  params: UseCurationNodeDetailParams = {},
): UseQueryResult<NodeDetail> {
  const enabled = typeof nodeId === "string" && nodeId.length > 0;
  return useQuery({
    queryKey: nodeKeys.detail(nodeId ?? ""),
    queryFn: async () => {
      const wire = await http<NodeDetailWire>(
        `/api/v1/nodes/${encodeURIComponent(nodeId as string)}${buildNodeQs(params)}`,
        { method: "GET", headers: authHeader() },
      );
      return toNodeDetail(wire);
    },
    enabled,
    staleTime: STABLE_STALE_MS,
    refetchOnWindowFocus: false,
  });
}

export function useLinkHistory(
  linkId: string | null | undefined,
): UseQueryResult<LinkHistoryResponse> {
  const enabled = typeof linkId === "string" && linkId.length > 0;
  return useQuery({
    queryKey: historyKeys.link(linkId ?? ""),
    queryFn: async () => {
      const wire = await http<LinkHistoryResponseWire>(
        `/api/v1/links/${encodeURIComponent(linkId as string)}/history`,
        { method: "GET", headers: authHeader() },
      );
      return toLinkHistoryResponse(wire);
    },
    enabled,
    staleTime: STABLE_STALE_MS,
    refetchOnWindowFocus: false,
  });
}

export function useAttributeHistory(
  attributeId: string | null | undefined,
): UseQueryResult<AttributeHistoryResponse> {
  const enabled = typeof attributeId === "string" && attributeId.length > 0;
  return useQuery({
    queryKey: historyKeys.attribute(attributeId ?? ""),
    queryFn: async () => {
      const wire = await http<AttributeHistoryResponseWire>(
        `/api/v1/attributes/${encodeURIComponent(attributeId as string)}/history`,
        { method: "GET", headers: authHeader() },
      );
      return toAttributeHistoryResponse(wire);
    },
    enabled,
    staleTime: STABLE_STALE_MS,
    refetchOnWindowFocus: false,
  });
}
