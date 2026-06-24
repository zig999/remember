/**
 * DecisionBar — action buttons anchored to the panel footer (TC-05).
 *
 * Spec references:
 *  - curadoria.feature.spec.md §2 UI-02/UI-03 (gated by evidenceViewed),
 *    §8 (aria-disabled=true, NOT `disabled` — keeps the buttons focusable
 *    so screen-reader users hear the tooltip via aria-describedby).
 *
 * Per-kind button set:
 *   - entity_match: "Fundir neste"  |  "Manter separados"
 *   - disputed:     "Preferir este" |  "Ajustar períodos" | "Manter em disputa"
 *   - any:          "Corrigir…"  (opens UI-11)
 *
 * Click handlers fire even when `evidenceViewed=false`? NO — aria-disabled
 * + a guard in the click handler skips the dispatch. This matches BDD
 * Scenario 2 ("nenhuma ação é disparada").
 */
import type { FC, MouseEvent, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import type { ButtonProps } from "@/components/ui/button";

export interface DecisionBarButtonProps {
  readonly id: string;
  readonly label: ReactNode;
  readonly variant?: ButtonProps["variant"];
  readonly onClick: () => void;
  /** Marks the button as destructive — tooltip / confirmation copy adapts. */
  readonly destructive?: boolean;
  /** When true, button stays hidden until the parent flips it (e.g. the
   *  "Fundir neste" button only after a candidate is selected). */
  readonly hidden?: boolean;
}

export interface DecisionBarProps {
  /** Gate: when false, buttons are visually present but `aria-disabled`. */
  readonly evidenceViewed: boolean;
  /** When true, the bar shows the action-in-flight state. */
  readonly submitting?: boolean;
  readonly buttons: ReadonlyArray<DecisionBarButtonProps>;
  /** Optional tooltip id wired to every blocked button's
   *  aria-describedby — set by parent to a hidden text node. */
  readonly blockedHintId?: string;
  readonly className?: string;
}

export const DecisionBar: FC<DecisionBarProps> = ({
  evidenceViewed,
  submitting = false,
  buttons,
  blockedHintId,
  className,
}) => {
  function gated(handler: () => void) {
    return (e: MouseEvent<HTMLButtonElement>) => {
      if (!evidenceViewed) {
        // §8 — aria-disabled means we MUST intercept the click ourselves
        // (the button is still focusable; HTML disabled=false). Suppress
        // the event so optimistic flows do not run.
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      handler();
    };
  }

  return (
    <div
      role="toolbar"
      aria-label="Ações de decisão"
      className={cn(
        // No background — the bar inherits the (now glass) panel material
        // behind it. Keeps the panel chrome uninterrupted across the footer.
        "flex flex-wrap items-center gap-md border-t border-border p-md",
        className,
      )}
    >
      {buttons
        .filter((b) => b.hidden !== true)
        .map((b) => (
          <Button
            key={b.id}
            type="button"
            variant={b.variant ?? (b.destructive ? "destructive" : "default")}
            aria-disabled={!evidenceViewed || undefined}
            aria-describedby={
              !evidenceViewed && blockedHintId ? blockedHintId : undefined
            }
            loading={submitting}
            onClick={gated(b.onClick)}
          >
            {b.label}
          </Button>
        ))}
    </div>
  );
};
