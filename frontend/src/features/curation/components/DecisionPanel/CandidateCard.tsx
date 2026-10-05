import type { FC } from "react";
import { cn } from "@/lib/cn";
import type { EntityMatchCandidate } from "../../types";

export interface CandidateCardProps {
  readonly candidate: EntityMatchCandidate;
  readonly selected: boolean;
  readonly onSelect: (candidateNodeId: string) => void;
  readonly invalid?: boolean;
  readonly className?: string;
}

function clampPct(n: number): number {
  if (n < 0) return 0;
  if (n > 1) return 100;
  return Math.round(n * 100);
}

export const CandidateCard: FC<CandidateCardProps> = ({
  candidate,
  selected,
  onSelect,
  invalid = false,
  className,
}) => {
  const pct = clampPct(candidate.similarity);
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-invalid={invalid || undefined}
      onClick={() => onSelect(candidate.candidateNodeId)}
      className={cn(
        "relative isolate flex w-full flex-col gap-sm rounded-md border p-md text-left bg-surface-glass-panel transition",
        "before:absolute before:inset-0 before:-z-10 before:rounded-md before:bg-scrim-glass",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus",
        selected
          ? "border-primary"
          : "border-border-glass hover:bg-elevated",
        invalid ? "border-border-error" : null,
        className,
      )}
    >
      <span className="flex items-center justify-between gap-md">
        <span className="font-medium text-foreground">{candidate.canonicalName}</span>
        <span className="text-xs text-body">{pct}%</span>
      </span>
      <span
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Similaridade com o nó proposto"
        className="text-xs text-body"
      >
        Similaridade {pct} de 100
      </span>
    </button>
  );
};
