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
        "inline-flex items-center gap-xs rounded-pill border px-md py-xs text-xs",
        viewed
          ? "border-border-accepted bg-state-accepted text-state-accepted-fg"
          : "border-border-glass bg-surface-glass-panel text-foreground motion-safe:animate-pulse",
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
