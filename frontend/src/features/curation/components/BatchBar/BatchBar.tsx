/**
 * BatchBar — multi-selection action bar (TC-06, UI-12).
 *
 * Spec references:
 *  - curadoria.feature.spec.md §2 UI-12 (≥2 homogeneous checkboxes selected;
 *    actions per kind; rejeição em lote ≥5 inline confirm).
 *  - curadoria.feature.spec.md §3 (UI-12 transitions:
 *    "Deselecionar até <2 itens" → UI-01/UI-03; ação destrutiva → UI-04;
 *    ação não-destrutiva → UI-05).
 *  - curadoria.flow.md §2 Sub-flow D (batch mode), §4 step 6 (batch reject
 *    ≥5 inline confirm — NOT modal).
 *  - §8 (button targets ≥32px, aria-label per action).
 *
 * Behavior:
 *  - Hidden when `count < 2` — the consumer can render the component
 *    unconditionally; the bar self-occults below the threshold.
 *  - Per-kind actions (homogeneous selection only):
 *      - entity_match → "Manter separados N" (non-destructive)
 *      - uncertain    → "Confirmar N" (non-destructive) + "Rejeitar N" (destructive)
 *      - disputed     → all batch actions disabled with tooltip
 *        ("Disputas devem ser resolvidas individualmente.")
 *  - Rejection ≥5 items → inline confirmation banner replaces the action
 *    row until the curator clicks "Confirmar" or "Cancelar". No modal.
 *
 * Why feature-local (not in components/)?
 *  - BatchBar is only consumed by /curadoria. Promoting it would require a
 *    generic batch-action contract that doesn't exist anywhere else in the
 *    app. Matches `front.md` rule: feature-local components stay feature-local.
 */
import { useState, type FC } from "react";
import { X, Check, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";

export type BatchKind = "entity_match" | "disputed" | "uncertain";

export interface BatchBarProps {
  /** Number of items currently checked. Bar self-hides below 2. */
  readonly count: number;
  /** Homogeneous kind of the selected items. `disputed` disables actions. */
  readonly kind: BatchKind;
  /** Callbacks per action; the parent wires each one to the appropriate
   *  mutation hook + UndoToast (for destructive). */
  readonly onConfirm?: () => void;
  readonly onReject?: () => void;
  readonly onKeepSeparate?: () => void;
  /** Fired by the "X" button — caller clears the selection set. */
  readonly onClear: () => void;
  /** When true, the bar shows submitting state on every action. */
  readonly submitting?: boolean;
  readonly className?: string;
}

/**
 * Threshold above which destructive batch actions require a one-step inline
 * confirmation (spec §5: "Você está rejeitando N itens. Confirmar?").
 */
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
  // Confirmation state for ≥5-item reject. Reset whenever the selection
  // count or kind changes (the parent rebuilds the bar on selection edits).
  const [pendingReject, setPendingReject] = useState(false);

  // Self-hide guard. Returning null keeps consumers free of conditional
  // mounting boilerplate — they can render <BatchBar count={…} /> always.
  if (count < 2) return null;

  const disputedTooltip =
    "Disputas devem ser resolvidas individualmente.";
  const isDisputed = kind === "disputed";

  // Per-kind action availability map.
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
    <div
      role="toolbar"
      aria-label="Ações em lote"
      className={cn(
        "sticky bottom-0 flex flex-wrap items-center justify-between gap-md border-t border-border bg-surface p-md",
        className,
      )}
    >
      {pendingReject ? (
        <div className="flex flex-wrap items-center gap-md text-body-sm text-content">
          <AlertTriangle aria-hidden="true" className="size-4 text-danger" />
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
          <div className="flex items-center gap-sm text-body-sm text-content">
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
                variant="default"
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
                className="text-caption text-body"
              >
                {disputedTooltip}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
};
