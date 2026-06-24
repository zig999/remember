/**
 * CurationPage — `/curation` route component (TC-04).
 *
 * Layout (curadoria.feature.spec.md §2 UI-01):
 *
 *   ┌────────────────────────────────────────────────────────────────┐
 *   │  Queue (left)        │  Decision (centre)   │  Evidence (right)│
 *   │  - QueueTabs         │  GlassSurface panel  │  GlassSurface    │
 *   │  - QueueList         │  (placeholder; TC-05 │  (placeholder;   │
 *   │  - BatchBar (TC-06)  │   delivers content)  │   TC-05 too)     │
 *   └────────────────────────────────────────────────────────────────┘
 *
 * Container-query breakpoints (Tailwind v4 — never CSS @media):
 *   - `@xl` and above → three columns visible
 *   - `@md` to `@xl`  → queue + decision (evidence hidden)
 *   - below `@md`     → queue stacked above decision (mobile)
 *
 * Responsibilities owned HERE:
 *  - Fetch the review queue (useCurationQueue, hooks/); render UI-08/07/09.
 *  - Deep-link `?item=<kind>:<id>` resolution: parse + look up the item
 *    in the resolved queue + select OR fall back to auto-select-first
 *    (Sub-flow A step 5).
 *  - Polling pill: when `data.total` grows above `lastSeenTotal`, render
 *    "N novos" with `role="status"`; click to refetch + update.
 *
 * Presentational sub-components live in `curation-page-parts.tsx`; the
 * queue hook lives in `../hooks/useCurationQueue.ts` — both extracted to
 * keep this file under the 300-line limit.
 *
 * Out of scope (TC-05/06/07/08):
 *  - DecisionPanel content (ComparePane, DecisionBar, ReasonField, …)
 *  - EvidencePanel content (ProvenanceTrail)
 *  - BatchBar UI (the slot is reserved here but display:none)
 *  - Mutations, UndoToast, StaleBanner
 */
import { useEffect, useMemo, useState, type FC } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { cn } from "@/lib/cn";
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
  neighbour,
  selectByIndex,
} from "./curation-page-helpers";
import { useCurationKeyboard } from "../hooks/useCurationKeyboard";
import { useCurationQueue } from "../hooks/useCurationQueue";
import {
  PollingPill,
  EmptyQueue,
  QueueErrorBanner,
  DecisionPanelPlaceholder,
  EvidencePanelPlaceholder,
} from "./curation-page-parts";

export const CurationPage: FC = () => {
  // Deep-link param. `validateSearch` on curationRoute (set below in
  // routes.tsx) yields `{ item?: string }`. `useSearch` is reactive: if
  // the curator navigates `?item=<other>` the page re-derives.
  const search = useSearch({ from: curationRoute.id }) as { item?: string };
  const deepLink = useMemo(
    () => parseItemSearchParam(search.item),
    [search.item],
  );

  // Local UI-only state (the tab and any panel-local fields). Tabs are
  // page-local; URL-persistence of the filter is a follow-up TC.
  const [kindFilter, setKindFilter] = useState<QueueKindFilter>(undefined);

  // Store slices — subscribe to ONLY the values that change the render
  // (Zustand strict-equality avoids the whole-store re-render trap).
  const selectedItem = useCurationStore((s) => s.selectedItem);
  const lastSeenTotal = useCurationStore((s) => s.lastSeenTotal);
  const setSelectedItem = useCurationStore((s) => s.setSelectedItem);
  const updateLastSeen = useCurationStore((s) => s.updateLastSeen);

  // Server cache — UI-08 if pending, UI-09 if error.
  const queueQuery = useCurationQueue(kindFilter);
  const isPending = queueQuery.isPending;
  const isError = queueQuery.isError;
  const data = queueQuery.data;

  const navigate = useNavigate();

  // Deep-link + auto-select resolution. Runs AFTER the queue resolves
  // (gated on `!isPending && data !== undefined`) per TC-04 constraint
  // #3 ("deep-link resolution must run AFTER listReviewQueue resolves").
  // Also runs whenever `kindFilter` flips — switching tabs may take the
  // current selection out of the active list.
  useEffect(() => {
    if (isPending || data === undefined) return;
    const initial = deriveInitialSelection(data, deepLink);
    setSelectedItem(initial);
  }, [isPending, data, deepLink, kindFilter, setSelectedItem]);

  // Polling pill delta — recomputed on every resolve. We compare against
  // `lastSeenTotal` (the user's last "acknowledged" total). On first
  // resolve `lastSeenTotal === null`, so we seed it WITHOUT showing the
  // pill (no false-positive on cold load).
  const total = data?.total ?? 0;
  const delta = lastSeenTotal === null ? 0 : Math.max(0, total - lastSeenTotal);
  useEffect(() => {
    if (lastSeenTotal === null && data !== undefined) {
      updateLastSeen(total);
    }
  }, [lastSeenTotal, total, data, updateLastSeen]);

  // Selection callback — also mirrors the choice into the URL so a
  // reload / share-link reproduces the same view. We use
  // `replace: true` to avoid polluting the back stack on every click.
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
  const hasSelection = selectedItem !== null;

  // ---- keyboard shortcuts (TC-07) ----
  //
  // Page-level navigation: j/k cycles items, 1..9 selects Nth. Decision
  // shortcuts (m/s/c/r/e/u) are deferred to TC-05 wiring — the page does
  // not own DecisionPanel state — so we surface the dispatch entry point
  // via the store + DecisionPanel actions. For now we wire the navigation
  // + checkbox shortcuts that have no dependency on TC-05 internals.
  //
  // The hook auto-disables when focus is inside an input/textarea/select
  // (the ReasonField inside DecisionPanel would otherwise eat every `c`
  // the curator types).
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
    // The page itself opts INTO container queries with `@container` so
    // its descendant layout can react to the page's own width (not the
    // viewport). This is the same primitive used by ChatWorkspace.
    <div
      className="@container min-h-0 w-full flex-1"
      data-testid="curation-page"
    >
      <div className="flex h-full w-full flex-col gap-md p-lg @md:flex-row">
        {/* Queue column — full width below @md, 1/3 at @md+. */}
        <section
          aria-label="Fila de curadoria"
          aria-busy={isPending}
          data-testid="curation-queue-region"
          className={cn(
            "flex min-h-0 flex-1 flex-col gap-sm",
            "@md:w-1/3 @md:flex-none",
            "@xl:w-1/4",
          )}
        >
          <header className="flex items-center justify-between gap-sm">
            <h2 className="text-heading text-content">Curadoria</h2>
            <PollingPill
              delta={delta}
              onAck={() => updateLastSeen(total)}
            />
          </header>

          {/* MetricsStrip placeholder — TC-05 will fetch + render. The
              skeleton keeps the layout stable. */}
          <div
            data-testid="curation-metrics-strip"
            className={cn(
              "h-12 rounded-md border border-border bg-surface-glass-panel",
              isPending && "animate-pulse",
            )}
            aria-hidden={isPending}
          />

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

          {/* BatchBar slot — TC-06 mounts content here. Reserved with
              display:none so the layout does not shift when TC-06 lands. */}
          <div
            data-testid="curation-batch-bar-slot"
            className="hidden"
            aria-hidden="true"
          />
        </section>

        {/* Decision column — visible from base up; 2/3 at @md, 2/4 at @xl. */}
        <section
          aria-label="Painel de decisão"
          className={cn(
            "flex min-h-0 flex-1 flex-col",
            "@md:w-2/3 @md:flex-none",
            "@xl:w-2/4",
          )}
        >
          <DecisionPanelPlaceholder hasSelection={hasSelection} />
        </section>

        {/* Evidence column — visible only at @xl+ (third column). */}
        <section
          aria-label="Evidência"
          className={cn(
            "hidden min-h-0 flex-col",
            "@xl:flex @xl:w-1/4",
          )}
        >
          <EvidencePanelPlaceholder />
        </section>
      </div>
    </div>
  );
};
