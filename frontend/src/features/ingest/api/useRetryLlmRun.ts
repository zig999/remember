/**
 * `useRetryLlmRun` — Error recovery mutation.
 *
 * Spec references:
 *  - docs/specs/front/features/ingest.feature.spec.md §1 (consumed:
 *    `retryLlmRun`), §3 (UI-06 → UI-05 transition; "Tentar novamente"
 *    button: `retryLlmRun` then `runLlmExtraction`).
 *  - docs/specs/domains/ingestion/openapi.yaml — `POST
 *    /api/v1/ingest/llm-runs/{llmRunId}/retry` returns `LlmRun` on 200
 *    (status transitions `failed → running`).
 *
 * Design:
 *  - Mutation (TanStack `useMutation`); no cache key.
 *  - Optional `reason` field per `RetryLlmRunRequest` schema (free-form
 *    note, max 500 chars). The caller (TC-06 IngestPanel) does not pass
 *    one in v1.0.0 — the empty body is acceptable per openapi (`required:
 *    false`).
 *  - On success: caller (TC-06) chains `useRunLlmExtraction` to re-fire
 *    the blocking extraction call. This hook does NOT chain — keeping it
 *    single-responsibility lets the caller branch on the retry result
 *    (e.g. show a transient "Reprocessando…" before the extraction kicks
 *    in).
 *  - On `BUSINESS_RUN_NOT_RETRYABLE` (409): the run is not in `failed`
 *    state — caller surfaces the error band per spec §6 and offers
 *    "Ingerir outro" (UI-01 reset).
 */

import { useMutation, type UseMutationResult } from "@tanstack/react-query";

import { authHeader, httpIngest } from "./_request";
import {
  toLlmRun,
  type LlmRun,
  type LlmRunWire,
  type RetryLlmRunRequestWire,
} from "./_transforms";

export interface UseRetryLlmRunVariables {
  /** Target run identifier (UUID). */
  readonly llm_run_id: string;
  /** Optional human-readable note (max 500 chars per openapi). */
  readonly reason?: string;
}

export function useRetryLlmRun(): UseMutationResult<
  LlmRun,
  Error,
  UseRetryLlmRunVariables
> {
  return useMutation({
    mutationFn: async ({ llm_run_id, reason }) => {
      // Build the wire body honouring `exactOptionalPropertyTypes` — only
      // attach `reason` when the caller passed one.
      const body: RetryLlmRunRequestWire =
        reason !== undefined ? { reason } : {};
      const wire = await httpIngest<LlmRunWire>(
        `/api/v1/ingest/llm-runs/${encodeURIComponent(llm_run_id)}/retry`,
        {
          method: "POST",
          headers: { ...authHeader(), "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      return toLlmRun(wire);
    },
  });
}
