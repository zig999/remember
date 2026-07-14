/**
 * GraphEmptyState — empty placeholder for the GraphSpace panel (TC-FE-07).
 *
 * Rendered by `GraphSpace` when `status === "empty"` — i.e. no graph tool
 * has produced any subgraph in the current conversation yet (or the
 * conversation was just cleared). Centered, static pt-BR copy; no spinner,
 * no animation, no callback.
 *
 * Spec references:
 *  - docs/specs/front/components/GraphSpace.component.spec.md §3 (state
 *    row `empty`), §7 BDD Scenario 1 ("Render default (empty state)").
 *  - temp/chat-graphspace-plan.md §6.7 (GraphEmptyState row).
 *
 * Accessibility:
 *  - This is a normal text element; screen readers read it without special
 *    ARIA per the GraphSpace spec §8 row "Empty state".
 *  - The parent `<section role="region" aria-label="Grafo de conhecimento">`
 *    in GraphSpace already names the landmark; we do not duplicate the
 *    label here.
 *
 * Why no `data-testid` here:
 *  - Tests assert against the visible pt-BR text. A `data-testid` would be
 *    redundant and decouple the test from the user-visible contract.
 */
import type { FC } from "react";
import { cn } from "@/lib/cn";
import type { GraphEmptyStateProps } from "./GraphEmptyState.types";

/** Static pt-BR copy. Lives at module scope so tests can import + assert
 *  identical strings without re-typing them (`text-as-data` pattern). */
export const GRAPH_EMPTY_STATE_COPY =
  "A memória aparecerá aqui conforme você conversa.";

export const GraphEmptyState: FC<GraphEmptyStateProps> = ({
  className,
  ref,
}) => {
  return (
    <div
      ref={ref}
      className={cn(
        // Center the message inside the available area — the parent
        // `GraphSpace` region uses `flex-1` so this `flex` child can fill.
        "flex h-full w-full items-center justify-center p-lg",
        className,
      )}
    >
      <p
        // `text-muted-foreground` — placeholder content per tokens.md §6.1; this is
        // ambient (not primary content), so it picks the muted text token
        // rather than `text-foreground`.
        className="text-xs text-muted-foreground text-center max-w-md"
      >
        {GRAPH_EMPTY_STATE_COPY}
      </p>
    </div>
  );
};
