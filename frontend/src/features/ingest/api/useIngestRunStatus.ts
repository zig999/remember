/**
 * useIngestRunStatus — GET /api/v1/ingest/llm-runs/:id polling (dev_tc_005).
 *
 * Step 3 of the ingest flow. TanStack Query with `refetchInterval: 5000`,
 * enabled only while the caller is in "polling mode" (set after the
 * `useRunLlmExtraction` connection drops). Stop polling when the run
 * transitions to a terminal status (`completed` | `failed`) — the hook
 * exposes the run shape, the caller decides what to do with it.
 *
 * `staleTime: 0` because the run status changes asynchronously on the
 * server; we never want a cached stale row.
 */
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { http } from "@/lib/http";
import { authHeader } from "./_request";
import { ingestKeys } from "./keys";
import { toLlmRun } from "./_transforms";
import type { LlmRun, LlmRunWire } from "./types";

const POLL_INTERVAL_MS = 5_000;

export interface UseIngestRunStatusOptions {
  /** Identifier of the run to poll. `null` disables the query. */
  readonly llmRunId: string | null;
  /** Caller-controlled gate — only poll while the workspace is in polling
   *  mode (after a connection drop or on `noop_existing` reuse). */
  readonly enabled: boolean;
}

export function useIngestRunStatus(
  options: UseIngestRunStatusOptions,
): UseQueryResult<LlmRun> {
  const { llmRunId, enabled } = options;
  return useQuery({
    queryKey: ingestKeys.run(llmRunId ?? "__noop__"),
    queryFn: async () => {
      const wire = await http<LlmRunWire>(
        `/api/v1/ingest/llm-runs/${encodeURIComponent(llmRunId as string)}`,
        { method: "GET", headers: authHeader() },
      );
      return toLlmRun(wire);
    },
    enabled: enabled && typeof llmRunId === "string" && llmRunId.length > 0,
    staleTime: 0,
    refetchOnWindowFocus: false,
    // Stop polling once the run has reached a terminal status. Returning
    // `false` here disables the next poll; the caller will see `data.status`
    // and decide what to do.
    refetchInterval: (query) => {
      const data = query.state.data as LlmRun | undefined;
      if (data === undefined) return POLL_INTERVAL_MS;
      if (data.status === "completed" || data.status === "failed") return false;
      return POLL_INTERVAL_MS;
    },
  });
}
