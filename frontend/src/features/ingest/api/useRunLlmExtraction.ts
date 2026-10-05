import { useMutation, type UseMutationResult } from "@tanstack/react-query";

import { authHeader, httpIngest } from "./_request";
import { toLlmRun, type LlmRun, type LlmRunWire } from "./_transforms";

export interface UseRunLlmExtractionVariables {
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
          ingest: true,
        },
      );
      return toLlmRun(wire);
    },
  });
}
