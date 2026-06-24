/**
 * curation-page-parts — presentational sub-components for CurationPage (TC-04).
 *
 * Extracted from CurationPage.tsx to keep the page component under the
 * 300-line limit. These are page-private, stateless, and carry the same
 * data-testids / aria contracts the page (and its tests) rely on.
 */
import { type FC } from "react";
import { AlertTriangle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Polling pill — "N novos" when the queue grows. `role="status"` so AT
 * announces the count. Clicking the pill acknowledges the delta
 * (`updateLastSeen`) so it disappears.
 */
export const PollingPill: FC<{
  readonly delta: number;
  readonly onAck: () => void;
}> = ({ delta, onAck }) => {
  if (delta <= 0) return null;
  return (
    <button
      type="button"
      role="status"
      aria-live="polite"
      onClick={onAck}
      data-testid="curation-polling-pill"
      className={cn(
        "rounded-pill border border-border-accepted bg-state-accepted px-md py-xs",
        "text-caption text-state-accepted-fg",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus",
      )}
    >
      {delta} {delta === 1 ? "novo" : "novos"}
    </button>
  );
};

/** UI-07 — empty queue copy. */
export const EmptyQueue: FC = () => (
  <div
    data-testid="curation-empty-queue"
    className="flex flex-col items-center justify-center gap-sm p-2xl text-center"
  >
    <CheckCircle aria-hidden="true" className="size-8 text-state-accepted-fg" />
    <p className="text-body-sm text-content">Nada pendente. A fila está limpa.</p>
  </div>
);

/** UI-09 — error banner with retry. */
export const QueueErrorBanner: FC<{ readonly onRetry: () => void }> = ({
  onRetry,
}) => (
  <div
    role="alert"
    data-testid="curation-queue-error"
    className={cn(
      "flex flex-col gap-sm rounded-md border border-border-disputed bg-state-disputed p-md",
      "text-state-disputed-fg",
    )}
  >
    <div className="flex items-start gap-sm">
      <AlertTriangle aria-hidden="true" className="size-5 shrink-0" />
      <p className="text-body-sm">Não foi possível carregar a fila.</p>
    </div>
    <button
      type="button"
      onClick={onRetry}
      className={cn(
        "self-start rounded-md border border-border-disputed px-md py-xs text-body-sm",
        "hover:bg-state-disputed/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus",
      )}
      data-testid="curation-queue-retry"
    >
      Tentar novamente
    </button>
  </div>
);
