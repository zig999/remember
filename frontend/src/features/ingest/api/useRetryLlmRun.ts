/**
 * useRetryLlmRun — POST /api/v1/ingest/llm-runs/:id/retry (dev_tc_005).
 *
 * Error-recovery step (`ingest.feature.spec.md §3` UI-06 → UI-05). Reopens a
 * `failed` run; the caller then fires `useRunLlmExtraction` again.
 */
import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import { http } from "@/lib/http";
import { authHeader } from "./_request";
import { toLlmRun } from "./_transforms";
import type { LlmRun, LlmRunWire } from "./types";

export interface RetryLlmRunVariables {
  readonly llmRunId: string;
  readonly reason?: string;
}

export function useRetryLlmRun(): UseMutationResult<
  LlmRun,
  Error,
  RetryLlmRunVariables
> {
  return useMutation({
    mutationFn: async ({ llmRunId, reason }) => {
      const body = reason !== undefined ? { reason } : {};
      const wire = await http<LlmRunWire>(
        `/api/v1/ingest/llm-runs/${encodeURIComponent(llmRunId)}/retry`,
        {
          method: "POST",
          headers: {
            ...authHeader(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        },
      );
      return toLlmRun(wire);
    },
  });
}
