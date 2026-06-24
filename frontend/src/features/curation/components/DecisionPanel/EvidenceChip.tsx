/**
 * EvidenceChip — small "Ver evidência / visto" indicator (TC-05).
 *
 * Spec references:
 *  - curadoria.feature.spec.md §2 UI-02 (pulse while evidence pending),
 *    UI-03 (check icon when viewed), §8 (aria-live polite).
 *
 * Pulse via Tailwind `animate-pulse` — Framer Motion is not needed for
 * this 2-state indicator; we rely on the reduced-motion CSS media query
 * via Tailwind's `motion-reduce:` variant (the project's theme.css gates
 * `@keyframes pulse` accordingly).
 */
import type { FC } from "react";
import { Check, Eye } from "lucide-react";
import { cn } from "@/lib/cn";

export interface EvidenceChipProps {
  readonly viewed: boolean;
  readonly className?: string;
}

export const EvidenceChip: FC<EvidenceChipProps> = ({ viewed, className }) => {
  return (
    <span
      aria-live="polite"
      aria-label={
        viewed
          ? "Evidência vista."
          : "Veja a evidência antes de decidir"
      }
      className={cn(
        "inline-flex items-center gap-xs rounded-pill border px-md py-xs text-caption",
        viewed
          ? "border-border-accepted bg-state-accepted text-state-accepted-fg"
          : "border-border-glass bg-surface-glass-panel text-content motion-safe:animate-pulse",
        className,
      )}
    >
      {viewed ? (
        <Check aria-hidden="true" className="size-3" />
      ) : (
        <Eye aria-hidden="true" className="size-3" />
      )}
      {viewed ? "Evidência vista" : "Ver evidência"}
    </span>
  );
};
