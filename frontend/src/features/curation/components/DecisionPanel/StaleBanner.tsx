/**
 * StaleBanner — UI-10 overlay banner (TC-05).
 *
 * Spec: curadoria.feature.spec.md §2 UI-10 — "StaleBanner aparece sobre o
 * DecisionPanel (não bloqueia, mas avisa): ícone refresh-cw, 'Este item
 * mudou desde que você o abriu. [Recarregar]' (bg-warning)." §8: role=alert.
 */
import type { FC } from "react";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/shared/components/ui/button";

export interface StaleBannerProps {
  readonly onReload: () => void;
  readonly className?: string;
}

export const StaleBanner: FC<StaleBannerProps> = ({ onReload, className }) => {
  return (
    <div
      role="alert"
      className={cn(
        "flex items-center justify-between gap-md rounded-md border border-border bg-warning p-md text-foreground",
        className,
      )}
    >
      <p className="flex items-center gap-sm text-xs">
        <RefreshCw aria-hidden="true" className="size-4" />
        Este item mudou desde que você o abriu.
      </p>
      <Button type="button" size="sm" variant="outline" onClick={onReload}>
        Recarregar
      </Button>
    </div>
  );
};
