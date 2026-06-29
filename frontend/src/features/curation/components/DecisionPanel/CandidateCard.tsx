/**
 * CandidateCard — single entity_match candidate (TC-05).
 *
 * Spec: curadoria.feature.spec.md §10 (feature-local), §11 (full-diff mode
 * lists candidates). Selecting a candidate sets the merge target_node_id.
 *
 * Visual: name, similarity bar, "Fundir neste" selection radio.
 */
import type { FC } from "react";
import { cn } from "@/lib/cn";
import type { EntityMatchCandidate } from "../../types";

export interface CandidateCardProps {
  readonly candidate: EntityMatchCandidate;
  readonly selected: boolean;
  readonly onSelect: (candidateNodeId: string) => void;
  /** When the parent surfaces BUSINESS_INVALID_TARGET_NODE / SELF_MERGE
   *  inline, the card highlights with the error border. */
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
        // More opaque than the ambient panel behind it so the card reads
        // as a discrete selectable surface (Group E option a).
        "relative isolate flex w-full flex-col gap-sm rounded-md border p-md text-left bg-surface-glass-panel transition",
        // Dark scrim under the content so light metadata text stays AA-legible
        // regardless of the bright backdrop bleeding through the frost.
        "before:absolute before:inset-0 before:-z-10 before:rounded-md before:bg-scrim-glass",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus",
        selected
          ? "border-action"
          : "border-border-glass hover:bg-elevated",
        invalid ? "border-border-error" : null,
        className,
      )}
    >
      <span className="flex items-center justify-between gap-md">
        <span className="font-medium text-content">{candidate.canonicalName}</span>
        <span className="text-caption text-body">{pct}%</span>
      </span>
      <span
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Similaridade com o nó proposto"
        className="text-caption text-body"
      >
        Similaridade {pct} de 100
      </span>
    </button>
  );
};
