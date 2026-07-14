/**
 * PeriodTimeline — accessible textual + visual timeline (TC-05).
 *
 * Spec: curadoria.feature.spec.md §10, §8 ("Descrição textual alternativa
 * via aria-label ou aria-describedby — ex: 'Lado A vigente de 2021 a 2023;
 * Lado B vigente de 2023 em diante'").
 *
 * Avoiding dynamic inline width styles, the timeline renders as a
 * compact list — fully accessible and stack-conformant. The visual bar
 * variant lives in `temp/curate.md` and can be added later by composing
 * SVG (no Tailwind arbitrary widths needed).
 */
import type { FC } from "react";
import { cn } from "@/lib/cn";
import type { DisputedItemSide } from "../../types";

export interface PeriodTimelineProps {
  readonly sides: ReadonlyArray<DisputedItemSide>;
  readonly className?: string;
}

// Full calendar date in UTC — year-only granularity collapsed same-year
// disputes into identical text ("de 2026 em diante" on both sides), hiding
// the distinct start dates AND the overlap that IS the conflict. UTC keeps
// the stored date-only value from shifting a day in BR local time.
function fmtDate(d: Date | null): string {
  return d === null ? "" : d.toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

function describeSide(i: number, s: DisputedItemSide): string {
  const label = String.fromCharCode(65 + i); // A, B, C…
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
