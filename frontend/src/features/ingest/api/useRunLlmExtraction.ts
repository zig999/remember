/**
 * `useRunLlmExtraction` — Step 2 of the ingest flow.
 *
 * Spec references:
 *  - docs/specs/front/features/ingest.feature.spec.md §1 (consumed:
 *    `runLlmExtraction`), §4 (request order; blocking call, LLM-bound),
 *    §3 (UI-03 → UI-05 transition after `outcome === "created"`).
 *  - docs/specs/domains/ingestion/openapi.yaml — `POST
 *    /api/v1/ingest/llm-runs/{llmRunId}/run` returns `LlmRun` on 200
 *    (`status: "completed"`). Body is empty in v1.0.0
 *    (`RunLlmExtractionRequest = {}`).
 *  - CLAUDE.md "ingest_document client timeout ≠ failure" — no enforced
 *    client-side timeout; server extraction can take minutes.
 *
 * Design:
 *  - Mutation (TanStack `useMutation`); no cache key.
 *  - **`ingest: true`** on `httpIngest` → skips the 30s client-side
 *    cutoff. If the network drops mid-run, the mutation rejects with
 *    `SYSTEM_NETWORK` and the caller (TC-06 IngestPanel) flips to
 *    `useIngestRunStatus` polling.
 *  - Empty body sent as `{}` (openapi declares `additionalProperties: false`).
 *  - On `BUSINESS_RUN_NOT_RUNNABLE` (409): the run is in a non-runnable
 *    state — the caller surfaces the error band per spec §6 and offers
 *    "Ver grafo existente" (UI-04 path) or "Ingerir outro" (UI-01 reset).
 *    No invalidation here — the caller drives the next step.
 */

import { useMutation, type UseMutationResult } from "@tanstack/react-query";

import { authHeader, httpIngest } from "./_request";
import { toLlmRun, type LlmRun, type LlmRunWire } from "./_transforms";

export interface UseRunLlmExtractionVariables {
  /** Target run identifier (UUID) returned by `ingestRawInformation`. */
  readonly llm_run_id: string;
}

export function useRunLlmExtraction(): UseMutationResult<
  LlmRun,
  Error,
  UseRunLlmExtractionVariables
> {
  return useMutation({
    mutationFn: async ({ llm_run_id }) => {
      const wire = await httpIngest<LlmRunWire>(
        `/api/v1/ingest/llm-runs/${encodeURIComponent(llm_run_id)}/run`,
        {
          method: "POST",
          headers: { ...authHeader(), "Content-Type": "application/json" },
          body: JSON.stringify({}),
          // LLM-bound — no client-side cutoff. Server stays connected for
          // the duration of extraction (minutes). If the network drops,
          // the caller switches to polling via `useIngestRunStatus`.
          ingest: true,
        },
      );
      return toLlmRun(wire);
    },
  });
}
