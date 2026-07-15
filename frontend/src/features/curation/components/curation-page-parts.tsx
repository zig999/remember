/**
 * curation-page-parts — presentational sub-components for CurationPage (TC-04).
 *
 * Extracted from CurationPage.tsx to keep the page component under the
 * 300-line limit. These are page-private, stateless, and carry the same
 * data-testids / aria contracts the page (and its tests) rely on.
 */
import { type FC } from "react";
import { CheckCircle } from "lucide-react";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Alert } from "@/shared/components/ui/alert";
import { Empty } from "@/shared/components/ui/empty";

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
  <Empty
    data-testid="curation-empty-queue"
    icon={<CheckCircle aria-hidden="true" className="size-8 text-state-accepted-fg" />}
    title="Nada pendente"
    description="A fila está limpa."
  />
);

/** UI-09 — error banner with retry. */
export const QueueErrorBanner: FC<{ readonly onRetry: () => void }> = ({
  onRetry,
}) => (
  <Alert
    variant="destructive"
    role="alert"
    data-testid="curation-queue-error"
    action={
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onRetry}
        data-testid="curation-queue-retry"
      >
        Tentar novamente
      </Button>
    }
  >
    Não foi possível carregar a fila. Tente novamente.
  </Alert>
);
