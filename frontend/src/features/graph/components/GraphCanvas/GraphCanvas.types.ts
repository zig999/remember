/**
 * GraphCanvas — public type contract (TC-FE-07).
 *
 * The React Flow canvas component rendered inside `<ReactFlowProvider>` by
 * GraphSpace. Receives surface-shape nodes/links + positions and renders
 * them via the registered `nodeTypes.graphNode` (GraphNodeAdapter) and
 * `edgeTypes.graphEdge` (GraphEdgeAdapter).
 *
 * Why a SEPARATE component (not inline in GraphSpace):
 *  - React Flow's `useReactFlow()` hook (consumed by GraphSpaceHandle for
 *    `focusNode` / `fitView` / `recenter`) requires a parent
 *    `ReactFlowProvider`. The cleanest seam is GraphSpace mounting the
 *    provider, and GraphCanvas — its sole child — consuming the hook.
 *  - Allows the canvas to be unit-tested in isolation without GraphSpace's
 *    status routing logic.
 *
 * Normative sources:
 *  - docs/specs/front/components/GraphSpace.component.spec.md §9 component
 *    tree (GraphCanvas row).
 *  - temp/chat-graphspace-plan.md §6.1 (component tree), §6.7 (table).
 */
import type { Ref } from "react";
import type { GraphLinkData, GraphNodeData } from "../../types";
import type { GraphPosition } from "../../state/graph-store";
import type { GraphSpaceHandle } from "../GraphSpace/GraphSpace.types";

export interface GraphCanvasProps {
  /** Surface-shape nodes to render (already mapped from wire). */
  nodes: readonly GraphNodeData[];
  /** Surface-shape links to render. */
  links: readonly GraphLinkData[];
  /** Force-layout positions keyed by node id. Comes from `useForceLayout`.
   *  Nodes without a position get a fallback {0, 0} — temporary placement
   *  until the next force pass writes them. */
  positions: ReadonlyMap<string, GraphPosition>;
  /** View-only callback fired when a node is clicked. The parent uses it
   *  to mount the NodeDetailPanel — never to trigger a chat mutation
   *  (REQ-6 / AC-U.3). */
  onNodeSelect?: (nodeId: string) => void;
  /** Imperative view-handle ref (React 19 ref-as-prop). Exposes
   *  `focusNode`/`fitView`/`recenter` against the React Flow viewport. */
  ref?: Ref<GraphSpaceHandle>;
  /** Additional Tailwind classes — merged via `cn()`. */
  className?: string;
}
