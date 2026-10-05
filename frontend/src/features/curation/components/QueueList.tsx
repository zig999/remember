import { useRef, type FC, type ReactElement } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { cn } from "@/lib/cn";
import { QueueItem } from "./QueueItem";
import type { ReviewQueueItem } from "../types";
import type { SelectedItem } from "../state/curation-store";

const ROW_HEIGHT_PX = 72;

const OVERSCAN = 5;

export interface QueueListProps {
  readonly items: ReadonlyArray<ReviewQueueItem>;
  readonly selected: SelectedItem | null;
  readonly onSelect: (item: SelectedItem) => void;
  readonly skeleton?: boolean;
}

function buildItemKey(item: ReviewQueueItem): SelectedItem {
  if (item.kind === "entity_match") {
    return { kind: "entity_match", id: item.nodeId };
  }
  const firstSide = item.sides[0];
  const id =
    firstSide !== undefined
      ? firstSide.itemId
      : `${item.itemKind}:${item.scope.sourceNodeId ?? "?"}:${
          item.scope.linkType ?? item.scope.attributeKey ?? "?"
        }`;
  return { kind: "disputed", id };
}

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

  const virtualizer = useVirtualizer({
    count: skeleton ? 0 : items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT_PX,
    overscan: OVERSCAN,
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
