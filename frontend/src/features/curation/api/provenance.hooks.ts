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

const STABLE_STALE_MS = 5 * 60_000;

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

export interface ListAcceptedFragmentsParams {
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
