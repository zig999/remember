import { useEffect, useMemo, useState, type FC } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/cn";
import { GlassSurface } from "@/components/ds/GlassSurface/GlassSurface";
import { curationRoute } from "@/router/routes";
import {
  parseItemSearchParam,
  stringifyItemSearchParam,
  useCurationStore,
  type SelectedItem,
} from "../state/curation-store";
import { QueueList } from "./QueueList";
import { QueueTabs, type QueueKindFilter } from "./QueueTabs";
import {
  deriveInitialSelection,
  findItemInQueue,
  neighbour,
  selectByIndex,
} from "./curation-page-helpers";
import { useCurationKeyboard } from "../hooks/useCurationKeyboard";
import { useCurationQueue } from "../hooks/useCurationQueue";
import { useCurationMetrics } from "../api/curation.hooks";
import { CurationDecision } from "./CurationDecision";
import { MetricsStrip } from "./MetricsStrip";
import { PollingPill, EmptyQueue, QueueErrorBanner } from "./curation-page-parts";

export const CurationPage: FC = () => {
  const search = useSearch({ from: curationRoute.id }) as { item?: string };
  const deepLink = useMemo(
    () => parseItemSearchParam(search.item),
    [search.item],
  );

  const [kindFilter, setKindFilter] = useState<QueueKindFilter>(undefined);

  const selectedItem = useCurationStore((s) => s.selectedItem);
  const lastSeenTotal = useCurationStore((s) => s.lastSeenTotal);
  const setSelectedItem = useCurationStore((s) => s.setSelectedItem);
  const updateLastSeen = useCurationStore((s) => s.updateLastSeen);

  const queueQuery = useCurationQueue(kindFilter);
  const isPending = queueQuery.isPending;
  const isError = queueQuery.isError;
  const data = queueQuery.data;
  const metricsQuery = useCurationMetrics();

  const navigate = useNavigate();

  useEffect(() => {
    if (isPending || data === undefined) return;
    const initial = deriveInitialSelection(data, deepLink);
    setSelectedItem(initial);
  }, [isPending, data, deepLink, kindFilter, setSelectedItem]);

  const total = data?.total ?? 0;
  const delta = lastSeenTotal === null ? 0 : Math.max(0, total - lastSeenTotal);
  useEffect(() => {
    if (lastSeenTotal === null && data !== undefined) {
      updateLastSeen(total);
    }
  }, [lastSeenTotal, total, data, updateLastSeen]);

  const handleSelect = (item: SelectedItem): void => {
    setSelectedItem(item);
    const next = stringifyItemSearchParam(item);
    void navigate({
      to: "/curation",
      search: next !== undefined ? { item: next } : {},
      replace: true,
    });
  };

  const items = data?.items ?? [];
  const isEmpty = !isPending && !isError && items.length === 0;

  const selectedFull = useMemo(
    () => findItemInQueue(data, selectedItem),
    [data, selectedItem],
  );

  const metricsFallback = useMemo(() => {
    let em = 0;
    let dp = 0;
    for (const it of items) {
      if (it.kind === "entity_match") em += 1;
      else dp += 1;
    }
    return { entityMatchQueueCount: em, disputedQueueCount: dp };
  }, [items]);

  const setSelectedItems = useCurationStore((s) => s.setSelectedItems);
  const checkedIds = useCurationStore((s) => s.selectedItems);
  useCurationKeyboard({
    onNext: () => {
      const next = neighbour(data, selectedItem, "next");
      if (next !== null) handleSelect(next);
    },
    onPrev: () => {
      const prev = neighbour(data, selectedItem, "prev");
      if (prev !== null) handleSelect(prev);
    },
    onSelectIndex: (n) => {
      const picked = selectByIndex(data, n);
      if (picked !== null) handleSelect(picked);
    },
    onToggleCheck: () => {
      if (selectedItem === null) return;
      const next = new Set(checkedIds);
      if (next.has(selectedItem.id)) {
        next.delete(selectedItem.id);
      } else {
        next.add(selectedItem.id);
      }
      setSelectedItems(next);
    },
  });

  return (
    <div
      className="@container min-h-0 w-full flex-1"
      data-testid="curation-page"
    >
      <div className="flex h-full w-full flex-col gap-md p-lg @3xl:flex-row">
        <GlassSurface
          level="ambient"
          role="region"
          aria-label="Fila de curadoria"
          aria-busy={isPending}
          data-testid="curation-queue-region"
          className={cn(
            "flex min-h-0 flex-1 flex-col gap-lg p-md",
            "@3xl:w-1/3 @3xl:flex-none",
            "@5xl:w-1/4",
          )}
        >
          <div className="flex flex-col gap-sm">
            <header className="flex items-center justify-between gap-sm">
              <h2 className="text-lg font-semibold tracking-tight text-foreground">Curadoria</h2>
              <PollingPill delta={delta} onAck={() => updateLastSeen(total)} />
            </header>

            <MetricsStrip
              metrics={metricsQuery.data ?? null}
              settled={!metricsQuery.isPending}
              hasError={metricsQuery.isError}
              fallback={metricsFallback}
            />
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-sm">
            <QueueTabs value={kindFilter} onChange={setKindFilter} />

            {isError ? (
              <QueueErrorBanner onRetry={() => void queueQuery.refetch()} />
            ) : isEmpty ? (
              <EmptyQueue />
            ) : (
              <QueueList
                items={items}
                selected={selectedItem}
                onSelect={handleSelect}
                skeleton={isPending}
              />
            )}
          </div>
        </GlassSurface>

        <div
          data-testid="curation-decision-region"
          className="flex min-h-0 flex-1 flex-col overflow-y-auto"
        >
          {selectedFull ? (
            <CurationDecision item={selectedFull} queue={data} />
          ) : (
            <GlassSurface
              level="ambient"
              role="region"
              aria-label="Painel de decisão"
              data-testid="curation-decision-panel"
              className="flex h-full min-h-0 flex-col p-lg"
            >
              <div
                className="m-auto flex flex-col items-center gap-sm text-center"
                data-testid="curation-decision-idle"
              >
                <Inbox aria-hidden="true" className="size-6 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  Selecione um item da fila para começar.
                </p>
              </div>
            </GlassSurface>
          )}
        </div>
      </div>
    </div>
  );
};
