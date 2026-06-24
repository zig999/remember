/**
 * UndoToast — destructive-action pre-commit toast (TC-06, UI-04 / FL-CURATION-05).
 *
 * Spec references:
 *  - curadoria.feature.spec.md §2 UI-04 ("Item removido · Desfazer (5s)"),
 *    §3 (UI-04 transitions: undo→UI-03, timer-expire→UI-05),
 *    §8 (aria-live polite for status region — sonner sets role=status on the
 *    toast itself).
 *  - curadoria.flow.md FL-CURATION-05 — "no BFF request during the 5-second
 *    window".
 *
 * Contract:
 *  - This component is the JSX body sonner renders inside `toast.custom()` —
 *    not a standalone component the screen mounts. It only knows how to
 *    DISPLAY a countdown and emit `onUndo` when the curator clicks Desfazer.
 *    The TIMER lives in `useDecisionDispatch` (the controller); the toast just
 *    re-renders the seconds-remaining counter the controller pushes via prop.
 *  - Rendering the timer here (not in the hook) keeps the toast UI in React's
 *    paint loop without forcing the hook to call `toast.custom` every second
 *    (which would spam re-renders of every queue item subscribed to the
 *    store).
 *
 * Why a 100ms tick (instead of 1000ms)?
 *  - At 1s ticks, the visible counter only flips once per second — a 5s toast
 *    feels frozen if the curator opened it mid-second (worst case: 4.99s of
 *    "5" before flipping). 100ms ticks give a smooth countdown without
 *    over-rendering.
 *
 * `onUndo` is the only side-effect this component triggers — it does NOT
 * call `toast.dismiss()` itself. The hook owns the toast id and dismisses
 * the toast as part of the undo path; mixing dismiss inside the renderer
 * would race against the hook's commit/expire logic.
 */
import { useEffect, useState, type FC } from "react";
import { Undo2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";

export interface UndoToastProps {
  /** Caption above the countdown (e.g. "Item removido" or
   *  "3 itens removidos"). */
  readonly label: string;
  /** Absolute deadline (ms since epoch) at which the destructive action
   *  commits. The toast renders `ceil((deadline - now()) / 1000)`. */
  readonly deadlineMs: number;
  /** Fired when the curator clicks "Desfazer". The owning hook cancels
   *  its timer, reverts the optimistic state, and dismisses the toast. */
  readonly onUndo: () => void;
  /** Optional className override (composition root may want to widen the
   *  toast — sonner applies its own width by default). */
  readonly className?: string;
}

export const UNDO_WINDOW_MS = 5_000;
const TICK_MS = 100;

function secondsRemaining(deadlineMs: number, nowMs: number): number {
  return Math.max(0, Math.ceil((deadlineMs - nowMs) / 1000));
}

export const UndoToast: FC<UndoToastProps> = ({
  label,
  deadlineMs,
  onUndo,
  className,
}) => {
  // Tick state is local — the hook does NOT push the seconds value down. We
  // only re-render this component, not every queue subscriber.
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), TICK_MS);
    return () => window.clearInterval(id);
  }, []);

  const remaining = secondsRemaining(deadlineMs, now);

  return (
    <div
      // aria-live is provided by sonner (role=status on the toast root) —
      // we don't add a second live region to avoid double-announcing.
      className={cn(
        "flex items-center justify-between gap-md text-body-sm text-content",
        className,
      )}
    >
      <div className="flex flex-col gap-xs">
        <span>{label}</span>
        <span
          aria-label={`Tempo restante para desfazer: ${remaining} segundos`}
          className="text-caption text-body"
        >
          {remaining}s
        </span>
      </div>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={onUndo}
        aria-label="Desfazer ação"
      >
        <Undo2 aria-hidden="true" className="size-4" />
        Desfazer
      </Button>
    </div>
  );
};
