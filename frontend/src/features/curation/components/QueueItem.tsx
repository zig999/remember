import { useMemo, type FC, type KeyboardEvent } from "react";
import { cn } from "@/lib/cn";
import { StateBadge } from "@/components/ds/StateBadge/StateBadge";
import type { ReviewQueueItem } from "../types";
import type { SelectedItem } from "../state/curation-store";

export interface QueueItemProps {
  readonly item: ReviewQueueItem;
  readonly itemKey: SelectedItem;
  readonly selected: boolean;
  readonly onSelect: (item: SelectedItem) => void;
}

function formatRelative(date: Date, now: Date = new Date()): string {
  const diffMs = Math.max(0, now.getTime() - date.getTime());
  const min = Math.floor(diffMs / 60_000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `há ${hr} h`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `há ${day} d`;
  return date.toLocaleDateString("pt-BR");
}

function mapKindToBadge(kind: ReviewQueueItem["kind"]): {
  readonly state: "uncertain" | "disputed";
  readonly label: string;
} {
  if (kind === "entity_match") {
    return { state: "uncertain", label: "Para revisar" };
  }
  return { state: "disputed", label: "Disputado" };
}

function describeScope(item: ReviewQueueItem): string {
  if (item.kind === "entity_match") {
    return item.canonicalName;
  }
  const linkType = item.scope.linkType;
  const attributeKey = item.scope.attributeKey;
  if (item.itemKind === "link") {
    return linkType !== null ? `Link · ${linkType}` : "Link";
  }
  return attributeKey !== null ? `Atributo · ${attributeKey}` : "Atributo";
}

export const QueueItem: FC<QueueItemProps> = ({
  item,
  itemKey,
  selected,
  onSelect,
}) => {
  const badge = mapKindToBadge(item.kind);
  const scope = describeScope(item);
  const relative = useMemo(
    () => formatRelative(item.createdAt),
    [item.createdAt],
  );

  const handleKey = (event: KeyboardEvent<HTMLButtonElement>): void => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect(itemKey);
    }
  };

  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      {...(selected ? { "aria-current": "true" as const } : {})}
      onClick={() => onSelect(itemKey)}
      onKeyDown={handleKey}
      data-testid="curation-queue-item"
      data-item-kind={item.kind}
      className={cn(
        "flex w-full flex-col items-start gap-xs rounded-md p-md text-left",
        "border border-border-glass bg-surface-glass-panel",
        "transition-colors hover:bg-surface-glass-modal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus",
        selected && "bg-surface-glass-modal ring-2 ring-border-focus",
      )}
    >
      <div className="flex w-full items-center justify-between gap-sm">
        <StateBadge state={badge.state} size="sm" label={badge.label} />
        <span className="text-xs text-muted-foreground">{relative}</span>
      </div>
      <span className="text-xs font-medium text-foreground">{scope}</span>
    </button>
  );
};
