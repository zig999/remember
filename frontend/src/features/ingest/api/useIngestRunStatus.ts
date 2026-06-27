/**
 * `useIngestRunStatus` — Step 3 of the ingest flow (polling recovery).
 *
 * Spec references:
 *  - docs/specs/front/features/ingest.feature.spec.md §1 (consumed:
 *    `getLlmRunById`), §4 (Requests, Order and Cache — step 3, polling
 *    only on connection drop from step 2; refetchInterval 5s; staleTime 0;
 *    refetchOnWindowFocus false), §3 (UI-05 polling-mode transitions).
 *  - docs/specs/domains/ingestion/openapi.yaml — `GET
 *    /api/v1/ingest/llm-runs/{llmRunId}` returns `LlmRun`.
 *
 * Design:
 *  - Query (TanStack `useQuery`); cache key `ingestKeys.run(id)`.
 *  - **`refetchInterval: 5000`** while `enabled` is true; the spec calls
 *    for 5s polling cadence (§4).
 *  - **Stop polling automatically** when `status === "completed" |
 *    "failed"`: TanStack Query's `refetchInterval` accepts a function that
 *    receives the latest query value — returning `false` halts polling
 *    without unmounting the hook. This is the same pattern used by the
 *    background mutation polling in the chat feature (TC-FE-08 history).
 *  - `staleTime: 0` — every refetch must hit the server.
 *  - `refetchOnWindowFocus: false` — polling drives the cadence; window
 *    focus must NOT trigger an extra refetch (spec §4 TTL table).
 *  - `enabled` flag — caller (TC-06 IngestPanel) starts polling ONLY on
 *    `runLlmExtraction` connection drop. Default is `false` so simply
 *    mounting the hook (without an explicit `enabled: true`) does not
 *    open a polling loop. The hook also auto-disables when null/empty
 *    `llmRunId` is passed.
 *  - **Retry**: `retry: 2` (one beyond the global default of 1) — polling
 *    is supposed to ride through transient blips; a single network hiccup
 *    should not force the polling loop to terminate.
 */

import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import { authHeader, httpIngest } from "./_request";
import { ingestKeys } from "./keys";
import { toLlmRun, type LlmRun, type LlmRunWire } from "./_transforms";

export interface UseIngestRunStatusParams {
  /**
   * Target run identifier (UUID). `null` / `undefined` / `""` disables
   * the hook (no fetch fires).
   */
  readonly llmRunId: string | null | undefined;
  /**
   * Caller-controlled toggle. Default `true` when `llmRunId` is a non-empty
   * string — letting the caller opt out without juggling a sentinel id.
   * The caller (TC-06) sets this to `true` only when polling-mode is
   * needed (connection drop on step 2). Default `false` when the run id is
   * absent.
   */
  readonly enabled?: boolean;
}

/** Polling cadence — spec §4 TTL table. Exported so tests can pin the
 *  exact value, and downstream callers can read it for telemetry. */
export const INGEST_RUN_POLL_MS = 5_000;

/** Sentinel that disables `refetchInterval` once a run reaches a terminal
 *  state (TanStack Query honours `false` returns from the function form). */
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
    // TanStack accepts a function form so we can shut polling off on
    // terminal status without the consumer juggling a second `enabled`
    // toggle on every refetch.
    refetchInterval: terminalAwareRefetchInterval,
    // Polling is resilient — one extra retry helps small blips not kill
    // the loop. The global default is 1; we bump to 2 to be defensive.
    retry: 2,
  });
}
