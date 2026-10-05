import type { FC } from "react";
import { cn } from "@/lib/cn";
import { StateBadge } from "@/components/ds/StateBadge";
import { useCurationNodeDetail } from "../../api/node.hooks";
import type { DisputedItemSide } from "../../types";

export interface DisputeSideCardProps {
  readonly side: DisputedItemSide;
  readonly selected: boolean;
  readonly onSelect: (itemId: string) => void;
  readonly className?: string;
}

const SOURCE_LABEL: Readonly<
  Record<DisputedItemSide["validFromSource"], string>
> = Object.freeze({
  stated: "Declarada",
  document: "Doc.",
  received: "Receb.",
});

function fmt(d: Date | null): string {
  return d === null ? "—" : d.toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

export const DisputeSideCard: FC<DisputeSideCardProps> = ({
  side,
  selected,
  onSelect,
  className,
}) => {
  const isLink = side.value === null && side.targetNodeId !== null;
  const nodeQ = useCurationNodeDetail(isLink ? side.targetNodeId : null);
  const targetName = nodeQ.data?.node.canonicalName;
  const targetType = nodeQ.data?.node.nodeType;
  const label = isLink
    ? (targetName ??
      (nodeQ.isPending
        ? "Carregando…"
        : `nó ${side.targetNodeId?.slice(0, 8) ?? "?"}`))
    : (side.value ?? "—");

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={label}
      onClick={() => onSelect(side.itemId)}
      className={cn(
        "relative isolate flex w-full flex-col gap-sm rounded-md border p-md text-left bg-surface-glass-panel transition",
        "before:absolute before:inset-0 before:-z-10 before:rounded-md before:bg-scrim-glass",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus",
        selected
          ? "border-primary"
          : "border-border-glass hover:bg-elevated",
        className,
      )}
    >
      <span className="flex items-center justify-between gap-md">
        <span className="font-medium text-foreground">
          {label}
          {isLink && targetType && (
            <span className="ml-sm text-xs text-muted-foreground">({targetType})</span>
          )}
        </span>
        <StateBadge state="disputed" size="sm" />
      </span>
      <span className="text-xs text-body">
        Vigência: {fmt(side.validFrom)} – {fmt(side.validTo)} ·{" "}
        Fonte: {SOURCE_LABEL[side.validFromSource]} ·{" "}
        Confiança {(side.confidence * 100).toFixed(0)}%
      </span>
    </button>
  );
};
