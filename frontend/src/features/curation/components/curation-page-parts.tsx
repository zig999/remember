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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/shared/components/ui/button";

/**
 * Polling pill — "N novos" when the queue grows. `role="status"` so AT
 * announces the count. Clicking the pill acknowledges the delta
 * (`updateLastSeen`) so it disappears.
 *
 * Uses the standard `Badge` for the accepted-state pill chrome inside a
 * `<button>` (the click is what acknowledges; the button preserves keyboard
 * activation + focus ring). `role="status"` + `aria-live` stay on the
 * button so AT announces the count change in place.
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
        "rounded-pill",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus",
      )}
    >
      <Badge variant="success">
        {delta} {delta === 1 ? "novo" : "novos"}
      </Badge>
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
    <p className="text-xs text-foreground">Nada pendente. A fila está limpa.</p>
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
      <p className="text-xs">Não foi possível carregar a fila.</p>
    </div>
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onRetry}
      data-testid="curation-queue-retry"
      className="self-start"
    >
      Tentar novamente
    </Button>
  </div>
);
