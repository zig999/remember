/**
 * useIngestRawInformation — POST /api/v1/ingest/raw-information (dev_tc_005).
 *
 * Step 1 of the ingest flow (`ingest.feature.spec.md §4`). On 201
 * (`outcome: "created"`) the caller fires `useRunLlmExtraction`; on 200
 * (`outcome: "noop_existing"`) the caller skips extraction and goes
 * straight to step 4 (graph assembly).
 */
import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import { http } from "@/lib/http";
import { authHeader } from "./_request";
import { toIngestRawInformationResponse } from "./_transforms";
import type {
  IngestRawInformationRequest,
  IngestRawInformationResponse,
  IngestRawInformationResponseWire,
} from "./types";

export type IngestRawInformationVariables = IngestRawInformationRequest;

export function useIngestRawInformation(): UseMutationResult<
  IngestRawInformationResponse,
  Error,
  IngestRawInformationVariables
> {
  return useMutation({
    mutationFn: async (vars) => {
      const wire = await http<IngestRawInformationResponseWire>(
        "/api/v1/ingest/raw-information",
        {
          method: "POST",
          headers: {
            ...authHeader(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify(vars),
          // ingest endpoint — no client-side 30s cutoff (chunking can be
          // expensive on large documents).
          ingest: true,
        },
      );
      return toIngestRawInformationResponse(wire);
    },
  });
}
