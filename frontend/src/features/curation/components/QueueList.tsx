/**
 * QueueList — virtualised review-queue list (TC-04).
 *
 * Renders the ReviewQueueItem array using `@tanstack/react-virtual`. We
 * virtualise because the queue can hold thousands of pending items in
 * the worst case (catalog backfill, mass-rejection rollback) — even a
 * few hundred would be enough to stutter on the typical workstation.
 *
 * Accessibility (curadoria.feature.spec.md §8):
 *   - root is `role="listbox"` and `aria-busy` flips while the query is
 *     pending (UI-08); the parent CurationPage owns the aria-busy state.
 *   - keyboard "j/k" navigation is OUT of scope for this TC (handled by
 *     the page-level keymap in TC-06/TC-07); arrow-key Tab-to-next is
 *     the browser default and works for free.
 *
 * Why a separate file from CurationPage: QueueList is a candidate for
 * the CurationDrawer in TC-08 (it does not appear there, but the layout
 * primitive is still reusable in tests) and isolates the
 * virtualisation library — if we ever swap @tanstack/react-virtual for
 * something else (e.g. react-window) the blast radius is one file.
 */
import { useRef, type FC, type ReactElement } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { cn } from "@/lib/cn";
import { QueueItem } from "./QueueItem";
import type { ReviewQueueItem } from "../types";
import type { SelectedItem } from "../state/curation-store";

/** Approximate row height — passed to the virtualiser as an estimate.
 *  TanStack Virtual measures actual heights after first render, so a
 *  small mismatch is self-correcting; we just want the scrollbar to
 *  start at a believable height. */
const ROW_HEIGHT_PX = 72;

/** How many off-screen rows to keep mounted on each side of the
 *  viewport. Higher = smoother scroll but more DOM nodes. 5 is the
 *  default and adequate for a single-column queue. */
const OVERSCAN = 5;

export interface QueueListProps {
  /** The items to render. Pass an empty array for UI-07 / skeleton. */
  readonly items: ReadonlyArray<ReviewQueueItem>;
  /** Currently selected item (kind:id) — drives `aria-selected`. */
  readonly selected: SelectedItem | null;
  /** Click / keyboard activate callback. */
  readonly onSelect: (item: SelectedItem) => void;
  /** When `true`, render skeleton rows instead of items (UI-08). */
  readonly skeleton?: boolean;
}

/**
 * Build the composite `SelectedItem` key for one wire item. entity_match
 * uses `node_id`; disputed uses a synthesized
 * `<itemKind>:<scopeFingerprint>` so two disputes on different scopes
 * never collide. We mirror the backend's deep-link contract.
 */
function buildItemKey(item: ReviewQueueItem): SelectedItem {
  if (item.kind === "entity_match") {
    return { kind: "entity_match", id: item.nodeId };
  }
  // Disputed: prefer item-id of the first side (stable per dispute),
  // falling back to a deterministic scope-based id when sides is empty
  // (defensive — sides should always have ≥2 entries, but a malformed
  // payload must not crash the list).
  const firstSide = item.sides[0];
  const id =
    firstSide !== undefined
      ? firstSide.itemId
      : `${item.itemKind}:${item.scope.sourceNodeId ?? "?"}:${
          item.scope.linkType ?? item.scope.attributeKey ?? "?"
        }`;
  return { kind: "disputed", id };
}

/**
 * Render `count` placeholder rows for the loading state (UI-08). The
 * rows are `aria-hidden` so screen readers do not enumerate them as
 * options.
 */
function SkeletonRows({ count }: { count: number }): ReactElement {
  return (
    <ul aria-hidden="true" className="flex flex-col gap-sm">
      {Array.from({ length: count }, (_, i) => (
        <li
          key={i}
          className="h-[72px] animate-pulse rounded-md border border-border bg-surface-glass-panel"
          data-testid="curation-queue-skeleton-row"
        />
      ))}
    </ul>
  );
}

export const QueueList: FC<QueueListProps> = ({
  items,
  selected,
  onSelect,
  skeleton = false,
}) => {
  const parentRef = useRef<HTMLDivElement | null>(null);

  // `useVirtualizer` is safe to instantiate unconditionally — when
  // `items.length === 0` (skeleton path or empty queue) it returns no
  // virtual items and the surface renders nothing. We do not gate the
  // hook on `skeleton` because that would change hook order.
  const virtualizer = useVirtualizer({
    count: skeleton ? 0 : items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT_PX,
    overscan: OVERSCAN,
    // Pin keys to the composite (kind:id) so reordering / re-arming a
    // re-affirmed item does not throw away its DOM (smooth list).
    // The virtualizer reads this on `index`; we look up the item.
    getItemKey: (index) => {
      const item = items[index];
      if (item === undefined) return index;
      const key = buildItemKey(item);
      return `${key.kind}:${key.id}`;
    },
  });

  if (skeleton) {
    return (
      <div
        data-testid="curation-queue-list-skeleton"
        className="min-h-0 flex-1 overflow-hidden p-sm"
      >
        <SkeletonRows count={5} />
      </div>
    );
  }

  if (items.length === 0) {
    // Empty list — the parent CurationPage decides whether this is
    // UI-07 (EmptyQueue copy) or a filtered-empty state. We just render
    // an inert listbox so screen-readers do not lose the landmark.
    return (
      <div
        role="listbox"
        aria-label="Fila de curadoria"
        data-testid="curation-queue-list-empty"
        className="min-h-0 flex-1 overflow-hidden"
      />
    );
  }

  const virtualItems = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();

  return (
    <div
      ref={parentRef}
      role="listbox"
      aria-label="Fila de curadoria"
      data-testid="curation-queue-list"
      className={cn("min-h-0 flex-1 overflow-auto p-sm")}
    >
      <div
        style={{ height: `${totalSize}px`, position: "relative" }}
        data-testid="curation-queue-list-spacer"
      >
        {virtualItems.map((v) => {
          const item = items[v.index];
          if (item === undefined) return null;
          const key = buildItemKey(item);
          const isSelected =
            selected !== null &&
            selected.kind === key.kind &&
            selected.id === key.id;
          return (
            <div
              key={`${key.kind}:${key.id}`}
              data-index={v.index}
              ref={virtualizer.measureElement}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${v.start}px)`,
              }}
            >
              <div className="pb-sm">
                <QueueItem
                  item={item}
                  itemKey={key}
                  selected={isSelected}
                  onSelect={onSelect}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
