/**
 * CurationPage — `/curation` route component.
 *
 * Layout (curadoria.feature.spec.md §2 UI-01):
 *
 *   ┌──────────────────────────────────────────────────────┐
 *   │  Queue (left)            │  Decision + evidence (main) │
 *   │  - MetricsStrip          │  DecisionPanel (ComparePane │
 *   │  - QueueTabs             │   + ProvenanceTrail slot +  │
 *   │  - QueueList             │   DecisionBar + Correction   │
 *   │                          │   Section)                  │
 *   └──────────────────────────────────────────────────────┘
 *
 * Evidence is mounted as the DecisionPanel `provenanceSlot` (the same
 * composition CurationDrawer uses) so the evidence gate works at every
 * breakpoint without a separate, sometimes-hidden column. The dedicated
 * ≥xl third-column treatment from §4/§6 is a visual follow-up.
 *
 * Container-query breakpoints (Tailwind v4 — never CSS @media):
 *   - `@md` and above → queue (1/3) + decision (fill) side by side
 *   - below `@md`     → queue stacked above decision (mobile)
 *
 * Responsibilities owned HERE:
 *  - Fetch the review queue (useCurationQueue) + the metrics aggregates
 *    (useCurationMetrics, R1) and render UI-08 / UI-07 / UI-09.
 *  - Resolve the selected queue item to its full shape and mount the real
 *    DecisionPanel via CurationDecision.
 *  - Deep-link `?item=<kind>:<id>` resolution + auto-select-first.
 *  - Polling pill: when `data.total` grows above `lastSeenTotal`.
 *
 * Presentational sub-components live in `curation-page-parts.tsx`; the
 * queue hook lives in `../hooks/useCurationQueue.ts`; the decision wiring
 * lives in `CurationDecision.tsx`.
 *
 * Deferred (not yet wired here): BatchBar multi-select dispatch (the queue
 * checkbox state exists; the batch action bar is a follow-up).
 */
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
  // Deep-link param. `validateSearch` on curationRoute yields `{ item?: string }`.
  const search = useSearch({ from: curationRoute.id }) as { item?: string };
  const deepLink = useMemo(
    () => parseItemSearchParam(search.item),
    [search.item],
  );

  // Local UI-only state (the active queue-kind tab).
  const [kindFilter, setKindFilter] = useState<QueueKindFilter>(undefined);

  // Store slices — subscribe to ONLY the values that change the render.
  const selectedItem = useCurationStore((s) => s.selectedItem);
  const lastSeenTotal = useCurationStore((s) => s.lastSeenTotal);
  const setSelectedItem = useCurationStore((s) => s.setSelectedItem);
  const updateLastSeen = useCurationStore((s) => s.updateLastSeen);

  // Server cache — the queue (UI-08/09) + the R1 calibration metrics.
  const queueQuery = useCurationQueue(kindFilter);
  const isPending = queueQuery.isPending;
  const isError = queueQuery.isError;
  const data = queueQuery.data;
  const metricsQuery = useCurationMetrics();

  const navigate = useNavigate();

  // Deep-link + auto-select resolution. Runs AFTER the queue resolves.
  useEffect(() => {
    if (isPending || data === undefined) return;
    const initial = deriveInitialSelection(data, deepLink);
    setSelectedItem(initial);
  }, [isPending, data, deepLink, kindFilter, setSelectedItem]);

  // Polling pill delta — recomputed on every resolve.
  const total = data?.total ?? 0;
  const delta = lastSeenTotal === null ? 0 : Math.max(0, total - lastSeenTotal);
  useEffect(() => {
    if (lastSeenTotal === null && data !== undefined) {
      updateLastSeen(total);
    }
  }, [lastSeenTotal, total, data, updateLastSeen]);

  // Selection callback — mirrors the choice into the URL (replace, no back-
  // stack pollution) so a reload / share-link reproduces the same view.
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

  // Resolve the selected item to its full queue shape for the DecisionPanel.
  const selectedFull = useMemo(
    () => findItemInQueue(data, selectedItem),
    [data, selectedItem],
  );

  // R1 fallback for MetricsStrip — best-effort per-kind counts from the
  // loaded page (≤20 items). Only consulted when metrics errors out.
  const metricsFallback = useMemo(() => {
    let em = 0;
    let dp = 0;
    for (const it of items) {
      if (it.kind === "entity_match") em += 1;
      else dp += 1;
    }
    return { entityMatchQueueCount: em, disputedQueueCount: dp };
  }, [items]);

  // ---- keyboard shortcuts ----
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
      {/* Side-by-side only once the container is genuinely wide enough for a
          1/3 + fill split to be usable (@3xl ≈ 624px at the 13px root). Below
          that — phones, narrow splits — the columns stack so neither gets
          squeezed to an unreadable ~110px. */}
      <div className="flex h-full w-full flex-col gap-md p-lg @3xl:flex-row">
        {/* Queue column — full width below @md, 1/3 at @md, 1/4 at @xl.
            One shared ambient GlassSurface holds the title, the calibration
            metrics AND the queue tabpanel, so they read as a single frosted
            panel (no nested glass — MetricsStrip is now plain inside it). */}
        <GlassSurface
          level="ambient"
          role="region"
          aria-label="Fila de curadoria"
          aria-busy={isPending}
          data-testid="curation-queue-region"
          className={cn(
            // gap-lg separates the two clusters (context vs. queue); each
            // cluster keeps its own tighter gap-sm. Rhythm, not a uniform stack.
            "flex min-h-0 flex-1 flex-col gap-lg p-md",
            "@3xl:w-1/3 @3xl:flex-none",
            "@5xl:w-1/4",
          )}
        >
          {/* Context cluster — title + advisory calibration metrics. Does
              not grow; sits above the working queue. */}
          <div className="flex flex-col gap-sm">
            <header className="flex items-center justify-between gap-sm">
              <h2 className="text-heading text-content">Curadoria</h2>
              <PollingPill delta={delta} onAck={() => updateLastSeen(total)} />
            </header>

            <MetricsStrip
              metrics={metricsQuery.data ?? null}
              settled={!metricsQuery.isPending}
              hasError={metricsQuery.isError}
              fallback={metricsFallback}
            />
          </div>

          {/* Queue cluster — the actual task. Grows to fill and scrolls
              internally (QueueList owns its own overflow). */}
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

        {/* Decision column (with inline evidence) — fills the rest and
            scrolls INTERNALLY (min-h-0 + overflow-y-auto) so a tall dispute
            panel never makes <main> scroll. Keeping the scroll in-column
            keeps the scrollbar between the fixed header and footer instead
            of running the full viewport height under them. */}
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
                <Inbox aria-hidden="true" className="size-6 text-muted" />
                <p className="text-body-sm text-muted">
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
