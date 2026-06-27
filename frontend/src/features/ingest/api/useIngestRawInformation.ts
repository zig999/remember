/**
 * `useIngestRawInformation` — Step 1 of the ingest flow.
 *
 * Spec references:
 *  - docs/specs/front/features/ingest.feature.spec.md §1 (consumed:
 *    `ingestRawInformation`), §4 (request order; step 1 fires on submit),
 *    §3 (UI-02 → UI-03 transition).
 *  - docs/specs/domains/ingestion/openapi.yaml — `POST
 *    /api/v1/ingest/raw-information` returns `IngestRawInformationResponse`
 *    on 201 (`outcome: "created"`) or 200 (`outcome: "noop_existing"`).
 *
 * Design:
 *  - Mutation (TanStack `useMutation`); no cache key.
 *  - Calls the ingest-feature carve-out `httpIngest<T>()` because ingest
 *    REST returns bare body on 2xx (no envelope unwrap — see `_request.ts`
 *    header).
 *  - **No `ingest: true`** on this call: `ingestRawInformation` is fast
 *    (chunking + insert, no LLM call). The 30s cutoff is appropriate; the
 *    LLM-bound exception applies to `runLlmExtraction` (the next step).
 *  - Caller is responsible for chaining: on `outcome === "created"` →
 *    fire `useRunLlmExtraction`; on `outcome === "noop_existing"` → skip
 *    to graph assembly (TC-05 wires this).
 */

import { useMutation, type UseMutationResult } from "@tanstack/react-query";

import { authHeader, httpIngest } from "./_request";
import {
  toIngestRawInformationResult,
  type IngestRawInformationResponseWire,
  type IngestRawInformationResult,
  type SourceTypeWire,
} from "./_transforms";

export interface UseIngestRawInformationVariables {
  readonly source_type: SourceTypeWire;
  readonly content: string;
  readonly model: string;
  readonly prompt_version: string;
  readonly metadata?: Record<string, unknown>;
}

export function useIngestRawInformation(): UseMutationResult<
  IngestRawInformationResult,
  Error,
  UseIngestRawInformationVariables
> {
  return useMutation({
    mutationFn: async (vars) => {
      const wire = await httpIngest<IngestRawInformationResponseWire>(
        "/api/v1/ingest/raw-information",
        {
          method: "POST",
          headers: { ...authHeader(), "Content-Type": "application/json" },
          body: JSON.stringify(vars),
        },
      );
      return toIngestRawInformationResult(wire);
    },
  });
}
