/**
 * Provenance + accepted-fragment hooks (query-retrieval domain).
 *
 * Spec references:
 *  - docs/specs/front/features/curadoria.feature.spec.md §1 (consumed:
 *    `getProvenanceByLink`, `getProvenanceByAttribute`,
 *    `getProvenanceByFragment`), §4 (staleTime 5min, no
 *    refetchOnWindowFocus).
 *  - docs/specs/domains/query-retrieval/openapi.yaml — REST responses are
 *    enveloped (`{ ok: true, result: ProvenanceResponse }`). `lib/http.ts`
 *    unwraps the envelope, so the hooks here can directly request the
 *    inner wire shape.
 *  - listAcceptedFragments: same domain, additive v1.3.0 (R2).
 */

import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import { http } from "@/lib/http";
import { authHeader } from "./_request";
import { provenanceKeys } from "./keys";
import {
  toProvenanceResponse,
  toAcceptedFragmentList,
} from "./_transforms";
import type {
  ProvenanceResponse,
  ProvenanceResponseWire,
  AcceptedFragmentList,
  AcceptedFragmentListWire,
} from "../types";

/* ------------------------------------------------------------------ *
 * Constants — spec §4 TTL                                             *
 * ------------------------------------------------------------------ */

const STABLE_STALE_MS = 5 * 60_000; // 5 min

/* ------------------------------------------------------------------ *
 * getProvenanceByLink                                                 *
 * ------------------------------------------------------------------ */

/**
 * Returns the provenance trail (fragment → chunk → raw_information) for
 * a `KnowledgeLink`. Disabled when `linkId` is undefined/null/empty.
 */
export function useProvenanceByLink(
  linkId: string | null | undefined,
): UseQueryResult<ProvenanceResponse> {
  const enabled = typeof linkId === "string" && linkId.length > 0;
  return useQuery({
    queryKey: provenanceKeys.link(linkId ?? ""),
    queryFn: async () => {
      const wire = await http<ProvenanceResponseWire>(
        `/api/v1/provenance/links/${encodeURIComponent(linkId as string)}`,
        { method: "GET", headers: authHeader() },
      );
      return toProvenanceResponse(wire);
    },
    enabled,
    staleTime: STABLE_STALE_MS,
    refetchOnWindowFocus: false,
  });
}

/* ------------------------------------------------------------------ *
 * getProvenanceByAttribute                                            *
 * ------------------------------------------------------------------ */

export function useProvenanceByAttribute(
  attributeId: string | null | undefined,
): UseQueryResult<ProvenanceResponse> {
  const enabled = typeof attributeId === "string" && attributeId.length > 0;
  return useQuery({
    queryKey: provenanceKeys.attribute(attributeId ?? ""),
    queryFn: async () => {
      const wire = await http<ProvenanceResponseWire>(
        `/api/v1/provenance/attributes/${encodeURIComponent(attributeId as string)}`,
        { method: "GET", headers: authHeader() },
      );
      return toProvenanceResponse(wire);
    },
    enabled,
    staleTime: STABLE_STALE_MS,
    refetchOnWindowFocus: false,
  });
}

/* ------------------------------------------------------------------ *
 * getProvenanceByFragment                                             *
 * ------------------------------------------------------------------ */

export function useProvenanceByFragment(
  fragmentId: string | null | undefined,
): UseQueryResult<ProvenanceResponse> {
  const enabled = typeof fragmentId === "string" && fragmentId.length > 0;
  return useQuery({
    queryKey: provenanceKeys.fragment(fragmentId ?? ""),
    queryFn: async () => {
      const wire = await http<ProvenanceResponseWire>(
        `/api/v1/provenance/fragments/${encodeURIComponent(fragmentId as string)}`,
        { method: "GET", headers: authHeader() },
      );
      return toProvenanceResponse(wire);
    },
    enabled,
    staleTime: STABLE_STALE_MS,
    refetchOnWindowFocus: false,
  });
}

/* ------------------------------------------------------------------ *
 * listAcceptedFragments (R2 — CorrectionForm DateJustification picker) *
 * ------------------------------------------------------------------ */

export interface ListAcceptedFragmentsParams {
  /** At least one of `llmRunId` / `rawInformationId` MUST be set. */
  readonly llmRunId?: string;
  readonly rawInformationId?: string;
  readonly limit?: number;
  readonly offset?: number;
}

function buildFragmentsQs(params: ListAcceptedFragmentsParams): string {
  const search = new URLSearchParams();
  if (params.llmRunId !== undefined) search.set("llm_run_id", params.llmRunId);
  if (params.rawInformationId !== undefined)
    search.set("raw_information_id", params.rawInformationId);
  if (params.limit !== undefined) search.set("limit", String(params.limit));
  if (params.offset !== undefined) search.set("offset", String(params.offset));
  const qs = search.toString();
  return qs.length > 0 ? `?${qs}` : "";
}

/**
 * Returns accepted fragments filtered by source (`llm_run_id` and/or
 * `raw_information_id`). Disabled until at least one filter is supplied
 * — calling with neither would trigger a 422 `VALIDATION_INVALID_FORMAT`.
 */
export function useListAcceptedFragments(
  params: ListAcceptedFragmentsParams,
): UseQueryResult<AcceptedFragmentList> {
  const enabled =
    (typeof params.llmRunId === "string" && params.llmRunId.length > 0) ||
    (typeof params.rawInformationId === "string" &&
      params.rawInformationId.length > 0);
  return useQuery({
    queryKey: [
      "provenance",
      "accepted_fragments",
      {
        llmRunId: params.llmRunId ?? null,
        rawInformationId: params.rawInformationId ?? null,
        limit: params.limit ?? 20,
        offset: params.offset ?? 0,
      },
    ] as const,
    queryFn: async () => {
      const wire = await http<AcceptedFragmentListWire>(
        `/api/v1/fragments/accepted${buildFragmentsQs(params)}`,
        { method: "GET", headers: authHeader() },
      );
      return toAcceptedFragmentList(wire);
    },
    enabled,
    staleTime: STABLE_STALE_MS,
    refetchOnWindowFocus: false,
  });
}
