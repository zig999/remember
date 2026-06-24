/**
 * useCurationQueue — TC-04 local queue hook.
 *
 * Local copy of `useListReviewQueue` that pins
 * `refetchIntervalInBackground: false` (TC-04 constraint #4).
 *
 * Why duplicate the hook from TC-03 (api/curation.hooks.ts) instead of
 * importing it: the upstream hook does NOT set
 * `refetchIntervalInBackground`, so it inherits the TanStack default
 * (`undefined` → polls in background). The TC-04 contract requires the
 * stricter "only while tab visible" behaviour, and changing the shared
 * hook would silently affect other consumers in TC-05/06/07.
 *
 * Documented in `spec_divergences` of the delivery file.
 */
import { useQuery } from "@tanstack/react-query";
import { authHeader, httpCuration } from "../api/_request";
import { curationKeys } from "../api/keys";
import { toReviewQueueList } from "../api/_transforms";
import type { ReviewQueueListWire } from "../types";
import type { QueueKindFilter } from "../components/QueueTabs";

const QUEUE_POLL_MS = 30_000;
const QUEUE_LIMIT = 20;

export function useCurationQueue(kind: QueueKindFilter) {
  return useQuery({
    queryKey: curationKeys.queue(kind, 0),
    queryFn: async () => {
      const qs = new URLSearchParams();
      if (kind !== undefined) qs.set("kind", kind);
      qs.set("limit", String(QUEUE_LIMIT));
      qs.set("offset", "0");
      const wire = await httpCuration<ReviewQueueListWire>(
        `/api/v1/curation/queue?${qs.toString()}`,
        { method: "GET", headers: authHeader() },
      );
      return toReviewQueueList(wire);
    },
    staleTime: 0,
    refetchInterval: QUEUE_POLL_MS,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });
}
