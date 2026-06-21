/**
 * GraphStatusOverlay — status overlay for GraphSpace loading & error states
 * (TC-FE-07).
 *
 * Sits ABOVE the React Flow canvas via absolute positioning + a token-driven
 * z-index (`z-frame` — declared as a `@utility` in `styles/theme.css` because
 * Tailwind v4 does not emit z-index utilities from `--z-*` tokens by default;
 * see CLAUDE.md "Known Gotchas" and project memory entry "Tailwind v4 has no
 * z-index namespace").
 *
 * Two variants:
 *  - `loading` — frosted glass panel with the spinner and "Buscando na memória…".
 *  - `error`   — same surface with an error-coloured accent and the error
 *                blurb (or a default pt-BR sentence when no message is given).
 *
 * Important invariants:
 *  - `aria-live="polite"` — status changes are announced to assistive tech
 *    without yanking focus (GraphSpace.component.spec.md §8).
 *  - No retry button (I-6 from temp/chat-graphspace-plan.md §6.7).
 *  - Reuses `GlassSurface level="panel"` — does NOT reinvent the glass
 *    material (GlassSurface.component.spec.md §1).
 *
 * Layout notes:
 *  - `pointer-events-none` on the outer container so pan/zoom/click events
 *    continue to flow through to the canvas underneath (the overlay is
 *    informational, not interactive). The inner glass card re-enables
 *    pointer events for the spinner / text only.
 *  - Centered with `flex items-center justify-center` so the overlay panel
 *    floats over the canvas centre.
 */
import type { FC } from "react";
import { Loader2 } from "lucide-react";
import { GlassSurface } from "@/components/ds/GlassSurface";
import { cn } from "@/lib/cn";
import type { GraphStatusOverlayProps } from "./GraphStatusOverlay.types";

/** Static pt-BR copy for the loading variant. Exported so tests can assert
 *  the same string without duplicating it. */
export const GRAPH_STATUS_LOADING_COPY = "Buscando na memória…";

/** Default pt-BR copy for the error variant when no `errorMessage` is
 *  passed in — keeps the overlay informational even on a bare error frame. */
export const GRAPH_STATUS_ERROR_DEFAULT_COPY =
  "Não foi possível carregar o grafo agora.";

export const GraphStatusOverlay: FC<GraphStatusOverlayProps> = ({
  variant,
  errorMessage,
  className,
  ref,
}) => {
  const isError = variant === "error";
  const message = isError
    ? (errorMessage ?? GRAPH_STATUS_ERROR_DEFAULT_COPY)
    : GRAPH_STATUS_LOADING_COPY;

  return (
    <div
      ref={ref}
      // `absolute inset-0` — the overlay covers the full bounds of the
      // GraphSpace canvas region (the parent applies `relative`).
      // `z-frame` lifts it above React Flow's internal stacking (which sits
      // at `z-base` in our hierarchy; see styles/theme.css §z tokens).
      // `pointer-events-none` keeps pan/zoom flowing through to the canvas;
      // the inner glass card re-enables pointer events for the message
      // itself so focus / hover on the text works for assistive tech.
      className={cn(
        "absolute inset-0 z-frame",
        "flex items-center justify-center",
        "pointer-events-none",
        className,
      )}
      // aria-live="polite" announces the status text changes without
      // yanking focus (GraphSpace.component.spec.md §8 row "Status overlay
      // announced"). The role="status" anchors the live region semantically.
      role="status"
      aria-live="polite"
      data-variant={variant}
      data-testid="graph-status-overlay"
    >
      <GlassSurface
        level="panel"
        // Error variant picks the canonical `error` accent (tokens.md §10).
        // Loading stays neutral (no accent).
        accent={isError ? "error" : "none"}
        // The glass card re-enables pointer-events so hover/focus on the
        // text remains functional; the wrapper above is pointer-none so
        // pan/zoom passes through everywhere else.
        className={cn(
          "pointer-events-auto",
          "flex items-center gap-sm px-lg py-md",
          "min-w-0 max-w-md",
        )}
        aria-label={isError ? "Erro do grafo" : "Carregando grafo"}
      >
        {/* Spinner — only shown for the loading variant. Uses
            `animate-spin` (Tailwind built-in) on the Loader2 lucide icon.
            `aria-hidden="true"` because the text below already announces
            the state to screen readers. */}
        {!isError && (
          <Loader2
            className="size-4 shrink-0 animate-spin text-content"
            aria-hidden="true"
          />
        )}
        <span
          className={cn(
            // Loading: standard body text. Error: same size, picks up the
            // error accent border on the surrounding glass surface — we do
            // NOT also colour the text, since the surface + role="status"
            // already convey the state. WCAG 2.2 AA contrast is preserved.
            "text-body-sm text-content",
            // Truncate horizontally instead of wrapping more than two
            // lines — error messages from the backend are usually short
            // sentences; long-form goes to the chat bubble.
            "min-w-0 line-clamp-2",
          )}
        >
          {message}
        </span>
      </GlassSurface>
    </div>
  );
};
