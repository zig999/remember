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
