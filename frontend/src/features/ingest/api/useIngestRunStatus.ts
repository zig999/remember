import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import { authHeader, httpIngest } from "./_request";
import { ingestKeys } from "./keys";
import { toLlmRun, type LlmRun, type LlmRunWire } from "./_transforms";

export interface UseIngestRunStatusParams {
  readonly llmRunId: string | null | undefined;
  readonly enabled?: boolean;
}

export const INGEST_RUN_POLL_MS = 5_000;

function terminalAwareRefetchInterval(
  query: { state: { data: LlmRun | undefined } },
): number | false {
  const status = query.state.data?.status;
  if (status === "completed" || status === "failed") return false;
  return INGEST_RUN_POLL_MS;
}

export function useIngestRunStatus(
  params: UseIngestRunStatusParams,
): UseQueryResult<LlmRun> {
  const hasRunId =
    typeof params.llmRunId === "string" && params.llmRunId.length > 0;
  const enabled = hasRunId && (params.enabled ?? true);

  return useQuery({
    queryKey: ingestKeys.run(params.llmRunId ?? ""),
    queryFn: async () => {
      const wire = await httpIngest<LlmRunWire>(
        `/api/v1/ingest/llm-runs/${encodeURIComponent(params.llmRunId as string)}`,
        { method: "GET", headers: authHeader() },
      );
      return toLlmRun(wire);
    },
    enabled,
    staleTime: 0,
    refetchOnWindowFocus: false,
    refetchInterval: terminalAwareRefetchInterval,
    retry: 2,
  });
}
