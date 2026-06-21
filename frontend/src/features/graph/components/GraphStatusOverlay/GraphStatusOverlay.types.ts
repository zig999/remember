/**
 * GraphStatusOverlay — public type contract (TC-FE-07).
 *
 * Status overlay rendered ABOVE the React Flow canvas inside `GraphSpace`
 * for the `loading` and `error` states. The overlay never hides the canvas
 * — when `GraphSpace` has prior nodes, the user sees the existing subgraph
 * THROUGH the translucent overlay (GraphSpace.component.spec.md §3 rule).
 *
 * Variant — `loading`:
 *  - Renders the spinner + the pt-BR copy "Buscando na memória…".
 *  - `aria-live="polite"` (GraphSpace.component.spec.md §8 row "Status
 *    overlay announced").
 *
 * Variant — `error`:
 *  - Renders an error-styled glass panel with `errorMessage` (optional;
 *    falls back to a default pt-BR sentence when absent).
 *  - No retry button (I-6 from the plan: "informa, sem retry").
 *
 * Normative sources:
 *  - docs/specs/front/components/GraphSpace.component.spec.md §3, §8.
 *  - temp/chat-graphspace-plan.md §6.7 (GraphStatusOverlay row); I-6.
 */
import type { Ref } from "react";

/** Visible variants. The parent computes this from the store's
 *  `GraphStatus`; statuses that do not paint an overlay
 *  (`empty`/`revealing`/`ready`) never reach this component. */
export type GraphStatusOverlayVariant = "loading" | "error";

export interface GraphStatusOverlayProps {
  /** Which overlay to render. */
  variant: GraphStatusOverlayVariant;
  /** Optional error message — only consumed when `variant === "error"`.
   *  When absent, a default pt-BR sentence is shown. */
  errorMessage?: string;
  /** Additional Tailwind classes — merged via `cn()`. */
  className?: string;
  /** React 19 ref-as-prop on the root container. */
  ref?: Ref<HTMLDivElement>;
}
