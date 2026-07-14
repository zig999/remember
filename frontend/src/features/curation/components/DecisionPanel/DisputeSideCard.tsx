/**
 * DisputeSideCard — single side of a disputed item (TC-05).
 *
 * Spec: curadoria.feature.spec.md §10 (feature-local), §11 (full-diff mode
 * lists all sides). Selection sets the `winner_id` for `prefer_one`.
 */
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
  // Format in UTC: valid_from/valid_to are DATE-ONLY values parsed to UTC
  // midnight. Formatting in local time (BR = UTC-3) would shift them back a
  // day (2026-06-17 → 16/06). UTC keeps the stored calendar date.
  return d === null ? "—" : d.toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

export const DisputeSideCard: FC<DisputeSideCardProps> = ({
  side,
  selected,
  onSelect,
  className,
}) => {
  // LINK dispute sides carry a target node (no `value`); resolve its canonical
  // name so the side reads "Apollo (Project)" instead of "—" (R3). ATTRIBUTE
  // sides carry `value` and pass null here, so the query stays disabled.
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
        // More opaque than the ambient panel behind it so the card reads
        // as a discrete selectable surface (Group E option a).
        "relative isolate flex w-full flex-col gap-sm rounded-md border p-md text-left bg-surface-glass-panel transition",
        // Dark scrim under the content so light metadata text stays AA-legible
        // regardless of the bright backdrop bleeding through the frost.
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
