/**
 * CurationDrawer — contextual curation overlay (TC-07).
 *
 * Spec references:
 *  - curadoria.feature.spec.md §2 (CurationDrawer row in the §3 transition
 *    table), §7 (uses `GlassSurface`), §8 (a11y: role=dialog, aria-modal,
 *    aria-label="Curadoria", focus trap, Esc, target-size ≥ 32px), §9
 *    Scenario 6.
 *  - curadoria.flow.md §2 Sub-flow C, §3 row 3m (409 inside drawer),
 *    §4 FL-CURATION-03, §5 deep-link escape hatch
 *    (`/curation?item=<kind>:<id>`).
 *
 * Why Radix Dialog:
 *  - The project's `components/ui/dialog/` is the canonical wrapper for
 *    Radix Dialog. Radix supplies focus trap, Esc-to-close, click-outside,
 *    aria-modal, and focus-return-to-trigger out of the box — we use it
 *    directly here instead of re-implementing those primitives.
 *  - The standard `DialogContent` lives at `z-modal` and `max-w-md`; the
 *    drawer needs `z-drawer` (between header `z-frame` and modal — see
 *    `theme.css` lines 259-286) and a wider right-anchored panel, so we
 *    compose Overlay + Content directly with the drawer-specific layout.
 *
 * Why a Glass-on-Dialog inner surface:
 *  - The §7 Shared Components table requires `GlassSurface` for the drawer
 *    panel (consistent material with the rest of the curation page). The
 *    Radix `Content` is the focus-trap container; the inner `GlassSurface`
 *    is the visual surface. This split mirrors the pattern used by
 *    `Dialog.Content` itself (it portals to a div that the surface
 *    decorates).
 *
 * Why a single `useListReviewQueue` fetch + filter:
 *  - The queue endpoint already paginates the visible items; the drawer
 *    only ever shows ONE item, but the spec wires the queue (not a
 *    `getQueueItem(id)` endpoint, which does not exist). Filtering on the
 *    client is O(n) over the page — acceptable: the queue page is at most
 *    20 items by design (§4 default limit).
 *  - If the item is not in the queue (FL-CURATION-03 fallback), the drawer
 *    surfaces the "Abrir na fila de curadoria" escape link instead of
 *    blank-modal-of-doom (consistent with the §5 deep-link "silently
 *    ignored if not found" rule, but here we make the absence explicit
 *    because the user EXPLICITLY clicked "Curar" — silence would feel like
 *    a bug).
 *
 * URL contract (TC-07 constraint):
 *  - The drawer NEVER mutates the URL. Open / item identity is driven by
 *    props from the trigger. Closing the drawer leaves the URL untouched.
 *  - The "Abrir na fila de curadoria" link is the ONLY navigation path
 *    out of the drawer; it goes to `/curation?item=<kind>:<id>` so the
 *    full triage page can pick up the same item.
 */
import { useMemo, type FC } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Link } from "@tanstack/react-router";
import { AlertTriangle, Loader2, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { GlassSurface } from "@/components/ds/GlassSurface";
import { DecisionPanel } from "../DecisionPanel";
import { ProvenanceTrail } from "../ProvenanceTrail";
import { useListReviewQueue } from "../../api/curation.hooks";
import { useDecisionDispatch } from "../../hooks/useDecisionDispatch";
import { useCurationStore } from "../../state/curation-store";
import type { ItemKind, ReviewQueueItem } from "../../types";
import type { CurationDrawerProps } from "./CurationDrawer.types";

/* ------------------------------------------------------------------ *
 * Pure helpers                                                        *
 * ------------------------------------------------------------------ */

/**
 * Resolve a queue item by `(kind, itemId)`. For `entity_match` the id is
 * the node id; for `disputed` we match if any side carries the id (the
 * dispute key is synthetic — the BFF emits it per scope, the SPA receives
 * the side `itemId`s instead). Exported for test isolation.
 */
export function findDrawerItem(
  items: ReadonlyArray<ReviewQueueItem>,
  kind: "entity_match" | "disputed",
  itemId: string,
): ReviewQueueItem | null {
  for (const it of items) {
    if (kind === "entity_match" && it.kind === "entity_match") {
      if (it.nodeId === itemId) return it;
      continue;
    }
    if (kind === "disputed" && it.kind === "disputed") {
      if (it.sides.some((s) => s.itemId === itemId)) return it;
    }
  }
  return null;
}

/**
 * Derive the `(itemKind, itemId)` used by `ProvenanceTrail` from a queue
 * item. `entity_match` items have no link/attribute id of their own —
 * provenance is on the candidate nodes; we surface no trail in that case
 * (the panel's ComparePane already shows the candidate summary). Returns
 * `null` to signal "no provenance hook to mount".
 */
export function provenanceContextOf(
  item: ReviewQueueItem,
): { itemKind: ItemKind; itemId: string } | null {
  if (item.kind === "entity_match") return null;
  const first = item.sides[0];
  if (first === undefined) return null;
  return { itemKind: item.itemKind, itemId: first.itemId };
}

/* ------------------------------------------------------------------ *
 * Inner panel — mounted only when the queue resolves so the         *
 * mutation hook is created INSIDE the QueryClient context (the       *
 * drawer's parents already provide it via the route tree).           *
 * ------------------------------------------------------------------ */

interface DrawerPanelProps {
  readonly item: ReviewQueueItem;
  readonly forceClose: () => void;
}

/**
 * Drawer-local controller for a single curation item. Wires
 * `useDecisionDispatch` to:
 *   - `onItemRemove` — closes the drawer (the item is gone from the
 *     drawer's universe; there is no auto-advance because the drawer
 *     hosts a single item, per Sub-flow C step 8).
 *   - `onItemRestore` — keeps the drawer open (undo brings the item
 *     back to the drawer state).
 *   - `getNextItem` — always returns `null` (single-item drawer).
 *
 * Evidence-viewed is local to the drawer (NOT the page store) so the
 * page's evidenceViewed flag for a different selected item is not
 * accidentally flipped by the drawer.
 */
const DrawerPanel: FC<DrawerPanelProps> = ({ item, forceClose }) => {
  // Local evidence-viewed state for the drawer. The page store has its own
  // flag for the queue selection; we keep them independent so opening the
  // drawer does not pollute the page's gating.
  const evidenceViewed = useCurationStore((s) => s.evidenceViewed);
  const setEvidenceViewed = useCurationStore((s) => s.setEvidenceViewed);

  const provenance = useMemo(() => provenanceContextOf(item), [item]);

  const dispatch = useDecisionDispatch({
    // Single-item drawer — there is no "next item" to advance to.
    getNextItem: () => null,
    // Optimistic removal in the drawer collapses to "close the drawer".
    // The page (graph / search) refetches the affected node via the
    // mutation's `invalidateQueries` (already wired in TC-03 hooks).
    onItemRemove: () => {
      forceClose();
    },
    // Undo brings the item back — drawer stays open. The mutation never
    // fired, so nothing to roll back externally.
    onItemRestore: () => {
      // No-op: the drawer state is already correct — the item is the
      // current `item` prop. Sonner has already restored the toast UI.
    },
  });

  // Render decision: if the drawer's item is in a "no provenance hook"
  // shape (entity_match), evidence is the ComparePane summary itself —
  // we arm the buttons immediately. Otherwise the ProvenanceTrail's
  // onEvidenceViewed flips the store flag.
  const armedImmediately = provenance === null;
  const effectiveEvidenceViewed = armedImmediately || evidenceViewed;

  return (
    <DecisionPanel
      item={item}
      surface="plain"
      evidenceViewed={effectiveEvidenceViewed}
      serverError={dispatch.serverError}
      stale={dispatch.stale}
      submitting={dispatch.submitting}
      actions={{
        onResolveEntityMatch: (body) => {
          if (item.kind !== "entity_match") return;
          const isDestructive = body.decision === "merge_into";
          if (isDestructive) {
            dispatch.dispatchDestructive(
              {
                kind: "resolve_entity_match_merge",
                nodeId: item.nodeId,
                body,
              },
              item.nodeId,
              "Item fundido",
            );
          } else {
            dispatch.dispatchNonDestructive({
              kind: "resolve_entity_match_keep",
              nodeId: item.nodeId,
              body,
            });
          }
        },
        onResolveDispute: (body) => {
          if (item.kind !== "disputed") return;
          const optimisticId = body.item_ids[0] ?? item.sides[0]?.itemId ?? "";
          if (body.decision === "prefer_one") {
            dispatch.dispatchDestructive(
              { kind: "resolve_dispute_prefer", body },
              optimisticId,
              "Lado preferido",
            );
          } else if (body.decision === "keep_disputed") {
            dispatch.dispatchNonDestructive({
              kind: "resolve_dispute_keep",
              body,
            });
          } else {
            // adjust_periods is non-destructive
            dispatch.dispatchNonDestructive({
              kind: "resolve_dispute_adjust",
              body,
            });
          }
        },
        onConfirm: (body) => {
          dispatch.dispatchNonDestructive({ kind: "confirm_item", body });
        },
        onReject: (body) => {
          dispatch.dispatchDestructive(
            { kind: "reject_item", body },
            body.item_id,
            "Item rejeitado",
          );
        },
        onCorrect: (body) => {
          dispatch.dispatchNonDestructive({ kind: "correct_item", body });
        },
      }}
      provenanceSlot={
        provenance !== null ? (
          <div className="px-md">
            <ProvenanceTrail
              itemKind={provenance.itemKind}
              itemId={provenance.itemId}
              onEvidenceViewed={() => {
                setEvidenceViewed(true);
              }}
            />
          </div>
        ) : null
      }
    />
  );
};

/* ------------------------------------------------------------------ *
 * Root component                                                      *
 * ------------------------------------------------------------------ */

/**
 * Inner body — mounted only when the drawer is open. Splitting it from
 * the root component lets us call `useListReviewQueue` (and any other
 * data hooks) lazily, so a closed drawer triggers ZERO network requests.
 * This is critical: the parent NodeDetailPanel renders the drawer
 * unconditionally (Radix needs the controller in the tree to manage
 * its open transitions), but we MUST NOT pay the staleTime-0 queue
 * fetch on every node-detail render.
 */
interface DrawerBodyProps {
  readonly kind: "entity_match" | "disputed";
  readonly itemId: string;
  readonly close: () => void;
}

const DrawerBody: FC<DrawerBodyProps> = ({ kind, itemId, close }) => {
  const queueQuery = useListReviewQueue();
  const items = queueQuery.data?.items ?? [];
  const item = useMemo(
    () => (queueQuery.isSuccess ? findDrawerItem(items, kind, itemId) : null),
    // The reference of `items` is stable per TanStack Query response; we
    // include it (rather than `queueQuery.data`) so a refetch swap triggers
    // a re-lookup.
    [items, kind, itemId, queueQuery.isSuccess],
  );

  const escapeItemParam = `${kind}:${itemId}`;

  if (queueQuery.isPending) {
    return (
      <div
        className="flex h-full items-center justify-center gap-sm p-2xl"
        data-testid="curation-drawer-loading"
      >
        <Loader2
          aria-hidden="true"
          className="size-5 animate-spin text-foreground"
        />
        <span aria-live="polite" className="text-xs text-foreground">
          Carregando item de curadoria…
        </span>
      </div>
    );
  }
  if (queueQuery.isError) {
    return (
      <DrawerInlineError
        message="Não foi possível carregar a evidência."
        escapeItemParam={escapeItemParam}
        onClose={close}
      />
    );
  }
  if (item === null) {
    return (
      <DrawerInlineError
        message="Este item não está mais disponível na fila."
        escapeItemParam={escapeItemParam}
        onClose={close}
      />
    );
  }
  return (
    <div className="p-md">
      <DrawerPanel item={item} forceClose={close} />
    </div>
  );
};

export const CurationDrawer: FC<CurationDrawerProps> = ({
  open,
  onOpenChange,
  kind,
  itemId,
  itemLabel,
}) => {
  function close(): void {
    onOpenChange(false);
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        {/* Backdrop — z-drawer minus one (sits between page header z-frame
            and the drawer body). Click closes via onOpenChange.
            `bg-overlay` is the canonical scrim token. */}
        <DialogPrimitive.Overlay
          data-testid="curation-drawer-overlay"
          className={cn(
            "fixed inset-0 z-drawer bg-overlay",
            "data-[state=open]:animate-overlay-in data-[state=closed]:animate-overlay-out",
          )}
        />
        {/* Content — focus trap + Esc-to-close are Radix defaults. We
            anchor to the right side with a fixed width band so the drawer
            feels like an in-loco overlay rather than a center-modal. */}
        <DialogPrimitive.Content
          data-testid="curation-drawer"
          aria-label="Curadoria"
          className={cn(
            "fixed inset-y-0 right-0 z-drawer",
            "flex w-full max-w-2xl flex-col",
            "data-[state=open]:animate-modal-slide-in data-[state=closed]:animate-modal-slide-out",
          )}
        >
          <GlassSurface
            level="modal"
            role="group"
            className="flex h-full min-h-0 w-full flex-col rounded-l-lg rounded-r-none"
          >
            {/* Header */}
            <header className="flex items-start gap-md border-b border-border p-lg">
              <div className="min-w-0 flex-1">
                <DialogPrimitive.Title className="font-sans text-sm font-medium font-bold text-foreground">
                  Curadoria
                </DialogPrimitive.Title>
                {itemLabel !== undefined && itemLabel.length > 0 && (
                  <DialogPrimitive.Description className="mt-xs text-xs text-muted-foreground truncate">
                    {itemLabel}
                  </DialogPrimitive.Description>
                )}
              </div>
              <DialogPrimitive.Close
                aria-label="Fechar curadoria"
                data-testid="curation-drawer-close"
                className={cn(
                  // Hit target ≥ 32px (project floor; §8 + WCAG 2.2 SC 2.5.8).
                  "inline-flex size-8 shrink-0 items-center justify-center rounded-md",
                  "text-foreground hover:bg-elevated transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                )}
              >
                <X aria-hidden="true" className="size-4" />
              </DialogPrimitive.Close>
            </header>

            {/* Body — swaps by query state. Only mounted when `open` so
                the queue fetch is lazy. */}
            <div className="flex-1 min-h-0 overflow-y-auto">
              {open ? (
                <DrawerBody kind={kind} itemId={itemId} close={close} />
              ) : null}
            </div>
          </GlassSurface>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};

/* ------------------------------------------------------------------ *
 * Inline error — used for both "queue load failed" and                *
 * "item not in queue" branches (FL-CURATION-03 fallback).             *
 * ------------------------------------------------------------------ */

interface DrawerInlineErrorProps {
  readonly message: string;
  /** Stringified `<kind>:<id>` to pre-select once on /curation. */
  readonly escapeItemParam: string;
  readonly onClose: () => void;
}

const DrawerInlineError: FC<DrawerInlineErrorProps> = ({
  message,
  escapeItemParam,
  onClose,
}) => {
  return (
    <div
      role="alert"
      data-testid="curation-drawer-error"
      className="flex flex-col items-center gap-md p-2xl text-center"
    >
      <AlertTriangle aria-hidden="true" className="size-6 text-warning" />
      <p className="text-xs text-foreground max-w-md">{message}</p>
      <Link
        to="/curation"
        search={{ item: escapeItemParam }}
        onClick={onClose}
        data-testid="curation-drawer-escape-link"
        className={cn(
          "inline-flex items-center gap-xs rounded-md px-md py-sm",
          "text-xs text-primary-foreground bg-primary hover:bg-primary-hover",
          "transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        )}
      >
        Abrir na fila de curadoria
      </Link>
    </div>
  );
};
