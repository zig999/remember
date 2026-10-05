import { useState, type FC } from "react";
import { X, Check, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/cn";
import { GlassSurface } from "@/components/ds/GlassSurface";
import { Button } from "@/shared/components/ui/button";

export type BatchKind = "entity_match" | "disputed" | "uncertain";

export interface BatchBarProps {
  readonly count: number;
  readonly kind: BatchKind;
  readonly onConfirm?: () => void;
  readonly onReject?: () => void;
  readonly onKeepSeparate?: () => void;
  readonly onClear: () => void;
  readonly submitting?: boolean;
  readonly className?: string;
}

export const BATCH_REJECT_CONFIRM_THRESHOLD = 5;

export const BatchBar: FC<BatchBarProps> = ({
  count,
  kind,
  onConfirm,
  onReject,
  onKeepSeparate,
  onClear,
  submitting = false,
  className,
}) => {
  const [pendingReject, setPendingReject] = useState(false);

  if (count < 2) return null;

  const disputedTooltip =
    "Disputas devem ser resolvidas individualmente.";
  const isDisputed = kind === "disputed";

  const showConfirm = kind === "uncertain";
  const showReject = kind === "uncertain";
  const showKeepSeparate = kind === "entity_match";

  function handleRejectClick(): void {
    if (count >= BATCH_REJECT_CONFIRM_THRESHOLD) {
      setPendingReject(true);
      return;
    }
    onReject?.();
  }

  function handleConfirmReject(): void {
    setPendingReject(false);
    onReject?.();
  }

  function handleCancelReject(): void {
    setPendingReject(false);
  }

  return (
    <GlassSurface
      level="ambient"
      role="group"
      aria-label="Ações em lote"
      className={cn(
        "sticky bottom-0 flex flex-wrap items-center justify-between gap-md border-t border-border p-md",
        className,
      )}
    >
      {pendingReject ? (
        <div className="flex flex-wrap items-center gap-md text-xs text-foreground">
          <AlertTriangle aria-hidden="true" className="size-4 text-destructive" />
          <span>Você está rejeitando {count} itens. Confirmar?</span>
          <div className="flex items-center gap-sm">
            <Button
              type="button"
              size="sm"
              variant="destructive"
              loading={submitting}
              onClick={handleConfirmReject}
            >
              Confirmar
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleCancelReject}
            >
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-sm text-xs text-foreground">
            <span aria-live="polite">{count} selecionados</span>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              aria-label="Limpar seleção"
              onClick={onClear}
            >
              <X aria-hidden="true" className="size-4" />
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-sm">
            {showKeepSeparate && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                loading={submitting}
                disabled={isDisputed}
                aria-label={`Manter separados ${count}`}
                onClick={onKeepSeparate}
              >
                Manter separados {count}
              </Button>
            )}
            {showConfirm && (
              <Button
                type="button"
                size="sm"
                variant="primary"
                loading={submitting}
                disabled={isDisputed}
                aria-label={`Confirmar ${count}`}
                onClick={onConfirm}
              >
                <Check aria-hidden="true" className="size-4" />
                Confirmar {count}
              </Button>
            )}
            {showReject && (
              <Button
                type="button"
                size="sm"
                variant="destructive"
                loading={submitting}
                disabled={isDisputed}
                aria-label={`Rejeitar ${count}`}
                onClick={handleRejectClick}
              >
                Rejeitar {count}
              </Button>
            )}
            {isDisputed && (
              <span
                role="note"
                aria-label={disputedTooltip}
                title={disputedTooltip}
                className="text-xs text-body"
              >
                {disputedTooltip}
              </span>
            )}
          </div>
        </>
      )}
    </GlassSurface>
  );
};
