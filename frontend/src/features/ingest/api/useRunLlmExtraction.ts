/**
 * useRunLlmExtraction — POST /api/v1/ingest/llm-runs/:id/run (dev_tc_005).
 *
 * Step 2 of the ingest flow. Synchronous, LLM-bound — the connection stays
 * open for minutes. We pass `ingest: true` so the lib/http.ts 30s cutoff is
 * skipped (CLAUDE.md "ingest_document client timeout ≠ failure"). If the
 * underlying connection drops anyway (proxy, network), the caller transitions
 * to polling via `useIngestRunStatus`.
 *
 * On success (HTTP 200) the final `LlmRun` is returned, including the
 * derived `summary` and (forward-compat) `affected_nodes`. On 409 the run is
 * not in a runnable state (`BUSINESS_RUN_NOT_RUNNABLE`); on 502 the LLM
 * provider is down. `lib/http.ts` raises both as `EnvelopeError` — the caller
 * routes them to the UI-06 error band.
 */
import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import { http } from "@/lib/http";
import { authHeader } from "./_request";
import { toLlmRun } from "./_transforms";
import type { LlmRun, LlmRunWire } from "./types";

export interface RunLlmExtractionVariables {
  readonly llmRunId: string;
}

export function useRunLlmExtraction(): UseMutationResult<
  LlmRun,
  Error,
  RunLlmExtractionVariables
> {
  return useMutation({
    mutationFn: async ({ llmRunId }) => {
      const wire = await http<LlmRunWire>(
        `/api/v1/ingest/llm-runs/${encodeURIComponent(llmRunId)}/run`,
        {
          method: "POST",
          headers: {
            ...authHeader(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
          ingest: true,
        },
      );
      return toLlmRun(wire);
    },
  });
}
