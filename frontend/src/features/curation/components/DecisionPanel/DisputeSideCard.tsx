/**
 * DisputeSideCard — single side of a disputed item (TC-05).
 *
 * Spec: curadoria.feature.spec.md §10 (feature-local), §11 (full-diff mode
 * lists all sides). Selection sets the `winner_id` for `prefer_one`.
 */
import type { FC } from "react";
import { cn } from "@/lib/cn";
import { StateBadge } from "@/components/ds/StateBadge";
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
  return d === null ? "—" : d.toLocaleDateString("pt-BR");
}

export const DisputeSideCard: FC<DisputeSideCardProps> = ({
  side,
  selected,
  onSelect,
  className,
}) => {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={() => onSelect(side.itemId)}
      className={cn(
        "flex w-full flex-col gap-sm rounded-md border p-md text-left transition",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus",
        selected ? "border-action bg-surface" : "border-border bg-surface hover:bg-elevated",
        className,
      )}
    >
      <span className="flex items-center justify-between gap-md">
        <span className="font-medium text-content">{side.value ?? "—"}</span>
        <StateBadge state="disputed" size="sm" />
      </span>
      <span className="text-caption text-body">
        Vigência: {fmt(side.validFrom)} – {fmt(side.validTo)} ·{" "}
        Fonte: {SOURCE_LABEL[side.validFromSource]} ·{" "}
        Confiança {(side.confidence * 100).toFixed(0)}%
      </span>
    </button>
  );
};
