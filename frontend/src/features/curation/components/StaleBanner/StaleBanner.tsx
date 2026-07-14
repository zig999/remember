/**
 * StaleBanner — UI-10 advisory banner used outside DecisionPanel (TC-06).
 *
 * Spec references:
 *  - curadoria.feature.spec.md §2 UI-10 ("StaleBanner aparece sobre o
 *    DecisionPanel (não bloqueia, mas avisa): ícone refresh-cw, 'Este item
 *    mudou desde que você o abriu. [Recarregar]' (bg-warning).").
 *  - §3: triggered by `revalidateOnWindowFocus` snapshot delta, OR a 409
 *    `BUSINESS_REVIEW_NOT_PENDING` / `BUSINESS_ITEM_NOT_DISPUTED` (the toast
 *    path is separate; this banner is the "soft" warning when focus
 *    detection raced ahead of the user).
 *  - §8 (role=alert).
 *
 * TC-05 ships an identical banner inside DecisionPanel as
 * `components/DecisionPanel/StaleBanner.tsx`. TC-06 surfaces an additional
 * public re-export here so callers OUTSIDE the panel (e.g. CurationPage
 * overlay, BatchBar stale check) can mount the same component without
 * importing from DecisionPanel internals. The visual + a11y contract is
 * intentionally identical — duplicating the message would risk drift.
 *
 * The component is intentionally trivial (icon + text + Recarregar button).
 * The "should I show this?" decision lives one layer up, in the page or
 * useDecisionDispatch (which observes 409 responses).
 */
import type { FC } from "react";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/shared/components/ui/button";

export interface StaleBannerProps {
  /** Fired when the curator clicks "Recarregar"; the caller refetches the
   *  affected query (item evidence / queue / metrics). */
  readonly onReload: () => void;
  /** Override the default copy when the trigger is a different stale source
   *  (e.g. queue moved while user was idle). Defaults to the spec UI-10 text. */
  readonly message?: string;
  readonly className?: string;
}

const DEFAULT_MESSAGE = "Este item mudou desde que você o abriu.";

export const StaleBanner: FC<StaleBannerProps> = ({
  onReload,
  message = DEFAULT_MESSAGE,
  className,
}) => {
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
        {message}
      </p>
      <Button type="button" size="sm" variant="outline" onClick={onReload}>
        Recarregar
      </Button>
    </div>
  );
};
