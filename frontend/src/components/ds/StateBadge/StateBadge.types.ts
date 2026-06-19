/**
 * StateBadge — public type contract (COMP-01).
 *
 * Canonical source: docs/specs/front/components/StateBadge.component.spec.md §3.
 *
 * `ConfidenceState` is the SINGLE source of truth for the five-state vocabulary
 * (remember-modelagem-v7.md §3.5 / §6.6). Every other module that needs the type
 * — features, hooks, BFF response adapters — MUST import it from here.
 */
import type { Ref } from "react";

export type ConfidenceState =
  | "accepted"
  | "uncertain"
  | "low-confidence"
  | "disputed"
  | "superseded";

export type StateBadgeSize = "sm" | "md";

export interface StateBadgeProps {
  /** Required — one of the five vocabulary values. */
  state: ConfidenceState;

  /**
   * When true (default), the `uncertain` state animates its ambient pulse and
   * any state change animates the matching transition variant from `lib/motion`.
   * When false, the badge updates instantly. `prefers-reduced-motion: reduce`
   * always wins over `animate=true`.
   */
  animate?: boolean;

  /** `sm` (default) is the in-row size; `md` is the selection-panel size. */
  size?: StateBadgeSize;

  /**
   * Render only the icon + colour halo; hide the visible pt-BR label. The
   * full label is still exposed via `aria-label` for screen readers.
   */
  iconOnly?: boolean;

  /** Override the pt-BR label rendered next to the icon. */
  label?: string;

  /** Extra Tailwind classes merged via `cn()` — never via string concatenation. */
  className?: string;

  /** React 19 ref-as-prop — attached to the root `<span>`. No `forwardRef`. */
  ref?: Ref<HTMLSpanElement>;
}
