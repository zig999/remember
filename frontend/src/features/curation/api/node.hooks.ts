/**
 * Knowledge-graph node detail + history hooks (curation-feature scope).
 *
 * Spec references:
 *  - docs/specs/front/features/curadoria.feature.spec.md §1 (consumed:
 *    `getNodeById`, `getLinkHistory`, `getAttributeHistory`), §4 (staleTime
 *    5min, no refetchOnWindowFocus).
 *  - docs/specs/domains/knowledge-graph/openapi.yaml — REST responses are
 *    enveloped; `lib/http.ts` unwraps the envelope before returning.
 *
 * Note on duplication with `features/graph/api/useNodeDetail`:
 *  - The graph feature has its own `useNodeDetail` hook that transforms
 *    the same wire shape into a UI-specific `NodeDetailView` (with
 *    formatted dates and a derived `badgeState`). The curation feature
 *    needs the RAW DOMAIN shape (Date objects, no UI labels) for the
 *    ComparePane diff calculation. Both can coexist under different
 *    query keys; the graph hook keys under `graphNodeKeys.detail`, this
 *    one keys under `nodeKeys.detail`. The two are NOT shared via a
 *    cross-feature import (CLAUDE.md "Conventions" forbids that).
 *  - Documented as intentional duplication in the delivery file.
 */

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

const STABLE_STALE_MS = 5 * 60_000; // 5 min

/* ------------------------------------------------------------------ *
 * getNodeById                                                         *
 * ------------------------------------------------------------------ */

export interface UseCurationNodeDetailParams {
  /** Optional `as_of` (date-time travel) — defaults to current view. */
  readonly asOf?: string;
  /** When true, only attributes whose `is_in_effect` is true. */
  readonly inEffectOnly?: boolean;
  /** When false, `uncertain` attributes are omitted. Default true. */
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

/**
 * Returns the node detail (summary + aliases + attributes) for the
 * curation feature. Distinct from `features/graph`'s `useNodeDetail`:
 * this hook returns the raw domain shape (Date objects), the graph hook
 * returns a UI-formatted view.
 *
 * Disabled when `nodeId` is null/undefined/empty.
 */
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

/* ------------------------------------------------------------------ *
 * getLinkHistory                                                      *
 * ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ *
 * getAttributeHistory                                                 *
 * ------------------------------------------------------------------ */

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
