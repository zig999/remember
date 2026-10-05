import type { FC } from "react";
import { cn } from "@/lib/cn";
import type { DisputedItemSide } from "../../types";

export interface PeriodTimelineProps {
  readonly sides: ReadonlyArray<DisputedItemSide>;
  readonly className?: string;
}

function fmtDate(d: Date | null): string {
  return d === null ? "" : d.toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

function describeSide(i: number, s: DisputedItemSide): string {
  const label = String.fromCharCode(65 + i);
  if (s.validFrom === null && s.validTo === null) {
    return `Lado ${label}: sem datas registradas`;
  }
  if (s.validTo === null) {
    return `Lado ${label}: vigente de ${fmtDate(s.validFrom)} em diante`;
  }
  if (s.validFrom === null) {
    return `Lado ${label}: vigente até ${fmtDate(s.validTo)}`;
  }
  return `Lado ${label}: vigente de ${fmtDate(s.validFrom)} a ${fmtDate(
    s.validTo,
  )}`;
}

export const PeriodTimeline: FC<PeriodTimelineProps> = ({ sides, className }) => {
  const description = sides.map((s, i) => describeSide(i, s)).join("; ");
  return (
    <ol
      aria-label={description}
      className={cn("flex flex-col gap-xs text-xs text-foreground", className)}
    >
      {sides.map((s, i) => (
        <li key={s.itemId} className="flex items-center gap-sm">
          <span
            aria-hidden="true"
            className="inline-block h-2 w-2 rounded-pill bg-primary"
          />
          {describeSide(i, s)}
        </li>
      ))}
    </ol>
  );
};
