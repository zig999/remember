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
 *  - Fetch `listReviewQueue` (TC-03 hook); render UI-08 / UI-07 / UI-09.
 *  - Deep-link `?item=<kind>:<id>` resolution: parse + look up the item
 *    in the resolved queue + select OR fall back to auto-select-first
 *    (Sub-flow A step 5).
 *  - Polling pill: when `data.total` grows above `lastSeenTotal`, render
 *    "N novos" with `role="status"`; click to refetch + update.
 *  - 30s polling: already configured in `useListReviewQueue`
 *    (`refetchInterval: 30_000`). We additionally cap `refetchIntervalIn
 *    Background` to `false` by overriding the hook locally (the hook in
 *    TC-03 does not set this — see "Spec divergence" below).
 *
 * Out of scope (TC-05/06/07/08):
 *  - DecisionPanel content (ComparePane, DecisionBar, ReasonField, …)
 *  - EvidencePanel content (ProvenanceTrail)
 *  - BatchBar UI (the slot is reserved here but display:none)
 *  - Mutations, UndoToast, StaleBanner
 */
import { useEffect, useMemo, useState, type FC } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { AlertTriangle, CheckCircle, Inbox } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/cn";
import { GlassSurface } from "@/components/ds/GlassSurface/GlassSurface";
import { curationRoute } from "@/router/routes";
import { authHeader, httpCuration } from "../api/_request";
import { curationKeys } from "../api/keys";
import { toReviewQueueList } from "../api/_transforms";
import {
  parseItemSearchParam,
  stringifyItemSearchParam,
  useCurationStore,
  type SelectedItem,
} from "../state/curation-store";
import type { ReviewQueueListWire } from "../types";
import { QueueList } from "./QueueList";
import { QueueTabs, type QueueKindFilter } from "./QueueTabs";
import {
  deriveInitialSelection,
  neighbour,
  selectByIndex,
} from "./curation-page-helpers";
import { useCurationKeyboard } from "../hooks/useCurationKeyboard";

const QUEUE_POLL_MS = 30_000;
const QUEUE_LIMIT = 20;

/**
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
function useCurationQueue(kind: QueueKindFilter) {
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

/**
 * Polling pill — "N novos" when the queue grows. `role="status"` so AT
 * announces the count. Clicking the pill acknowledges the delta
 * (`updateLastSeen`) so it disappears.
 */
const PollingPill: FC<{
  readonly delta: number;
  readonly onAck: () => void;
}> = ({ delta, onAck }) => {
  if (delta <= 0) return null;
  return (
    <button
      type="button"
      role="status"
      aria-live="polite"
      onClick={onAck}
      data-testid="curation-polling-pill"
      className={cn(
        "rounded-pill border border-border-accepted bg-state-accepted px-md py-xs",
        "text-caption text-state-accepted-fg",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus",
      )}
    >
      {delta} {delta === 1 ? "novo" : "novos"}
    </button>
  );
};

/** UI-07 — empty queue copy. */
const EmptyQueue: FC = () => (
  <div
    data-testid="curation-empty-queue"
    className="flex flex-col items-center justify-center gap-sm p-2xl text-center"
  >
    <CheckCircle aria-hidden="true" className="size-8 text-state-accepted-fg" />
    <p className="text-body-sm text-content">Nada pendente. A fila está limpa.</p>
  </div>
);

/** UI-09 — error banner with retry. */
const QueueErrorBanner: FC<{ readonly onRetry: () => void }> = ({ onRetry }) => (
  <div
    role="alert"
    data-testid="curation-queue-error"
    className={cn(
      "flex flex-col gap-sm rounded-md border border-border-disputed bg-state-disputed p-md",
      "text-state-disputed-fg",
    )}
  >
    <div className="flex items-start gap-sm">
      <AlertTriangle aria-hidden="true" className="size-5 shrink-0" />
      <p className="text-body-sm">Não foi possível carregar a fila.</p>
    </div>
    <button
      type="button"
      onClick={onRetry}
      className={cn(
        "self-start rounded-md border border-border-disputed px-md py-xs text-body-sm",
        "hover:bg-state-disputed/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus",
      )}
      data-testid="curation-queue-retry"
    >
      Tentar novamente
    </button>
  </div>
);

/** Placeholder DecisionPanel — TC-05 swaps the inner content. */
const DecisionPanelPlaceholder: FC<{ readonly hasSelection: boolean }> = ({
  hasSelection,
}) => (
  <GlassSurface
    level="panel"
    role="region"
    aria-label="Painel de decisão"
    data-testid="curation-decision-panel"
    className="flex h-full min-h-0 flex-col p-lg"
  >
    {hasSelection ? (
      <p
        className="m-auto text-body-sm text-content-muted"
        data-testid="curation-decision-placeholder-selected"
      >
        Painel de decisão em construção (TC-05).
      </p>
    ) : (
      <div
        className="m-auto flex flex-col items-center gap-sm text-center"
        data-testid="curation-decision-placeholder-idle"
      >
        <Inbox aria-hidden="true" className="size-6 text-content-muted" />
        <p className="text-body-sm text-content-muted">
          Selecione um item da fila para começar.
        </p>
      </div>
    )}
  </GlassSurface>
);

/** Placeholder EvidencePanel — TC-05 swaps the inner content. */
const EvidencePanelPlaceholder: FC = () => (
  <GlassSurface
    level="panel"
    role="region"
    aria-label="Evidência"
    data-testid="curation-evidence-panel"
    className="flex h-full min-h-0 flex-col p-lg"
  >
    <p className="m-auto text-body-sm text-content-muted">
      A trilha de evidência aparecerá aqui (TC-05).
    </p>
  </GlassSurface>
);

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
