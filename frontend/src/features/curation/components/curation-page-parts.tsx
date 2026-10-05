import { type FC } from "react";
import { CheckCircle } from "lucide-react";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Alert } from "@/shared/components/ui/alert";
import { Empty } from "@/shared/components/ui/empty";

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

export const EmptyQueue: FC = () => (
  <Empty
    data-testid="curation-empty-queue"
    icon={<CheckCircle aria-hidden="true" className="size-8 text-state-accepted-fg" />}
    title="Nada pendente"
    description="A fila está limpa."
  />
);

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
