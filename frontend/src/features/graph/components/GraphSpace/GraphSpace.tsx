/**
 * GraphSpace — knowledge-graph visualization panel (TC-FE-07).
 *
 * Mounted in the 60% right pane of `ChatWorkspace`. Pure sink: receives
 * `nodes` / `links` / `status` as props (the caller reads `useGraphStore`
 * and passes them down) and renders one of three things depending on the
 * status:
 *
 *   - `empty`                     → `GraphEmptyState` (no canvas mounted).
 *   - `loading` / `error`         → `GraphStatusOverlay` over the canvas
 *                                    (canvas remains visible when prior
 *                                    nodes existed — overlay is a partial
 *                                    scrim).
 *   - `revealing` / `ready`       → canvas with nodes/edges.
 *
 * Composition (GraphSpace.component.spec.md §9):
 *
 *   <section role="region" aria-label="Grafo de conhecimento">
 *     {status==="empty"  && <GraphEmptyState />}
 *     {(status==="loading"||status==="error") && <GraphStatusOverlay … />}
 *     <ReactFlowProvider>
 *       <GraphCanvas ref={ref} … />
 *     </ReactFlowProvider>
 *   </section>
 *
 * The `<ReactFlowProvider>` wraps `<GraphCanvas>` so the canvas can call
 * `useReactFlow()` (required for the `GraphSpaceHandle` operations). The
 * provider stays mounted across status transitions so the React Flow
 * instance is stable — toggling the provider would re-create the viewport
 * (zoom/pan would reset to defaults on every loading↔ready flip).
 *
 * Structural unidirectionality (AC-U.3 / REQ-6):
 *  - This file does NOT import `useChatTurnStore`, `useSendMessage`, or
 *    anything from `@/features/chat`. The structural test in
 *    `__tests__/GraphSpace.spec.tsx` scans the file source to confirm
 *    that — a regression that adds such an import fails the test loudly.
 *
 * Why `useForceLayout` runs here (not inside GraphCanvas):
 *  - The hook subscribes to `useGraphStore` for the `nodes` / `links` /
 *    `positions` Maps. Subscribing inside GraphCanvas would couple the
 *    canvas to the store's identity — but GraphSpace already reads
 *    `positions` for the canvas anyway, and reading it once at this
 *    layer keeps the canvas dumb (props in → React Flow out). The store
 *    write happens in the hook's effect; GraphSpace re-renders with the
 *    fresh positions Map identity.
 *  - GraphSpace is the ONLY caller of `useForceLayout` — by contract,
 *    not enforced. If a future subcomponent needs positions, expose them
 *    through props from this layer.
 *
 * Why no `forwardRef`:
 *  - React 19 ref-as-prop. The `ref` lives on `GraphSpaceProps` directly;
 *    we pass it down to `<GraphCanvas>`, which calls `useImperativeHandle`
 *    against it under the React Flow provider.
 *
 * Spec references:
 *  - docs/specs/front/components/GraphSpace.component.spec.md §1 (purpose),
 *    §3 (states), §8 (accessibility), §9 (component tree).
 *  - temp/chat-graphspace-plan.md §6.1, §6.2, §6.3, §6.7.
 */
import type { FC } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { cn } from "@/lib/cn";
import { useForceLayout } from "../../hooks/useForceLayout";
import { useGraphStore } from "../../state/graph-store";
import {
  useGraphReveal,
  DEFAULT_REVEAL_STAGGER_MS,
} from "../../hooks/useGraphReveal";
import { GraphCanvas } from "../GraphCanvas";
import { GraphEmptyState } from "../GraphEmptyState";
import { GraphStatusOverlay } from "../GraphStatusOverlay";
import type { GraphSpaceProps } from "./GraphSpace.types";

/**
 * Render the canvas region (with optional overlay).
 *
 * Separated as an inner component because `useForceLayout` subscribes to
 * the live `useGraphStore` Maps — calling the hook unconditionally inside
 * `GraphSpace` would still subscribe when `status === "empty"`, wasting
 * the d3-force run. By gating the call at the parent, the hook only
 * subscribes once the canvas is actually mounted.
 */
interface GraphCanvasRegionProps {
  nodes: GraphSpaceProps["nodes"];
  links: GraphSpaceProps["links"];
  status: GraphSpaceProps["status"];
  errorMessage?: GraphSpaceProps["errorMessage"];
  revealStaggerMs: number;
  onNodeSelect?: GraphSpaceProps["onNodeSelect"];
  spaceRef?: GraphSpaceProps["ref"];
}

const GraphCanvasRegion: FC<GraphCanvasRegionProps> = ({
  nodes,
  links,
  status,
  errorMessage,
  revealStaggerMs,
  onNodeSelect,
  spaceRef,
}) => {
  // Subscribes to the store's `positions` Map and re-runs the d3-force
  // pass whenever the `nodes`/`links` Maps change identity. Returns the
  // live (subscribed) positions — GraphCanvas reads them every render.
  const positions = useForceLayout();

  // Drag-and-drop commit (TC-FE drag). The store action pins the dragged
  // node; `useForceLayout` honours the pin on the next force pass. Selecting
  // the action (stable reference) keeps this subscription from re-rendering
  // on unrelated store changes.
  const setNodePosition = useGraphStore((s) => s.setNodePosition);
  // "Reorganizar" (Phase 2) — re-flow the layout, discarding user drags.
  const resetLayout = useGraphStore((s) => s.resetLayout);

  // Consume the reveal queue at the configured stagger. The hook owns the
  // status transition `"revealing" → "ready"` and the reduced-motion
  // batch-drain — GraphSpace stays a thin orchestrator. Returns the live
  // `revealedIds` Set that GraphCanvas uses to filter visible nodes/edges
  // (AC-F.14, AC-F.15).
  const revealedIds = useGraphReveal(revealStaggerMs);

  // Loading / error overlay variant. `null` skips the overlay entirely
  // for `revealing` / `ready` — the canvas is fully visible.
  const overlayVariant =
    status === "loading" ? "loading" : status === "error" ? "error" : null;

  // Spread `errorMessage` only when defined — under
  // `exactOptionalPropertyTypes` an explicit `undefined` would be rejected
  // by the prop type `errorMessage?: string`.
  const overlayErrorProp =
    errorMessage !== undefined ? { errorMessage } : {};

  // Spread `onNodeSelect`/`ref` only when defined for the same reason
  // (`onNodeSelect?: …`, `ref?: …`).
  const canvasNodeSelectProp =
    onNodeSelect !== undefined ? { onNodeSelect } : {};
  const canvasRefProp = spaceRef !== undefined ? { ref: spaceRef } : {};

  return (
    // `relative` anchors the absolutely-positioned overlay; `h-full
    // w-full` lets the canvas fill the parent region; `overflow-hidden`
    // clips the React Flow viewport so pan-beyond-bounds doesn't escape
    // into the surrounding shell.
    <div className="relative h-full w-full overflow-hidden">
      <GraphCanvas
        nodes={nodes}
        links={links}
        positions={positions}
        revealedIds={revealedIds}
        onNodePositionCommit={setNodePosition}
        onResetLayout={resetLayout}
        {...canvasNodeSelectProp}
        {...canvasRefProp}
      />
      {overlayVariant !== null && (
        <GraphStatusOverlay variant={overlayVariant} {...overlayErrorProp} />
      )}
    </div>
  );
};

export const GraphSpace: FC<GraphSpaceProps> = ({
  nodes,
  links,
  status,
  errorMessage,
  // Consumed by `useGraphReveal` (TC-FE-09). Default in this layer must
  // mirror GraphSpace.component.spec.md §2 (90ms). The hook also exports
  // its own DEFAULT_REVEAL_STAGGER_MS — both sources are kept in sync via
  // a shared constant.
  revealStaggerMs = DEFAULT_REVEAL_STAGGER_MS,
  onNodeSelect,
  ref,
  className,
}) => {
  // The empty-state shortcut: spec §3 rule — "when status is 'empty' and
  // the pane has never had data, only `GraphEmptyState` is shown (no
  // canvas)". `nodes.length === 0` is the operational check for "never
  // had data": status=empty plus a populated `nodes` array should not
  // occur (the dispatcher clears nodes before setting status to empty),
  // but if it does we still fall through to the canvas — defensive.
  const showEmptyState = status === "empty" && nodes.length === 0;

  // `aria-busy="true"` only while the graph is actively in flight or
  // animating in — covers `loading` AND `revealing` per spec §8.
  const isBusy = status === "loading" || status === "revealing";

  // Spread the optional ref into the inner region. The inner component
  // receives it as `spaceRef` and forwards to GraphCanvas (which calls
  // `useImperativeHandle` against it under the React Flow provider).
  const regionRefProp = ref !== undefined ? { spaceRef: ref } : {};

  return (
    <section
      role="region"
      aria-label="Grafo de conhecimento"
      // `aria-busy` reflects in-flight state for assistive tech (spec §8).
      // Per ARIA's contract, only set it when actually busy — omit when
      // false so screen readers do not announce "not busy".
      {...(isBusy ? { "aria-busy": true } : {})}
      data-status={status}
      data-testid="graph-space"
      className={cn(
        // Fill the right pane of ChatWorkspace; `min-h-0` lets the
        // section shrink inside a flex parent (otherwise the canvas
        // would push the parent to its content height).
        "relative flex h-full w-full flex-col min-h-0",
        className,
      )}
    >
      {showEmptyState ? (
        <GraphEmptyState />
      ) : (
        // Provider stays mounted across loading/revealing/ready/error so
        // the React Flow instance + viewport survive status transitions.
        // Toggling the provider per status would reset zoom/pan on every
        // flip — broken UX.
        <ReactFlowProvider>
          <GraphCanvasRegion
            nodes={nodes}
            links={links}
            status={status}
            errorMessage={errorMessage}
            revealStaggerMs={revealStaggerMs}
            onNodeSelect={onNodeSelect}
            {...regionRefProp}
          />
        </ReactFlowProvider>
      )}
    </section>
  );
};
