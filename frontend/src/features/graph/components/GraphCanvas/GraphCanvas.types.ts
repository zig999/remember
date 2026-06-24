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
import type { GraphLayoutAlgorithm, GraphPosition } from "../../state/graph-store";
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
  /** Reveal filter (TC-FE-09 — AC-F.14 / AC-F.15). When provided, only
   *  nodes whose id is in this Set are mounted, and only edges whose BOTH
   *  endpoints are in the Set are mounted. When omitted (`undefined`), all
   *  nodes and edges render — the "no reveal cadence" path used by tests
   *  and by static rendering callers. */
  revealedIds?: ReadonlySet<string>;
  /** View-only callback fired when a node is clicked. The parent uses it
   *  to mount the NodeDetailPanel — never to trigger a chat mutation
   *  (REQ-6 / AC-U.3). */
  onNodeSelect?: (nodeId: string) => void;
  /** Drag-and-drop commit (TC-FE drag). Fired on `onNodeDragStop` with the
   *  node's final canvas coordinate. The parent persists it via the store's
   *  `setNodePosition` (which pins the node). When OMITTED, nodes are NOT
   *  draggable — preserves the view-only default and keeps unit tests that
   *  don't wire it on the legacy non-draggable path. */
  onNodePositionCommit?: (nodeId: string, position: GraphPosition) => void;
  /** "Reorganizar" (TC-FE drag, Phase 2). When provided AND the canvas has at
   *  least one node, an overlay button is shown that re-flows the layout
   *  (discards user drags, re-runs the force pass). Omitted → no button. */
  onResetLayout?: () => void;
  /** Active layout algorithm (TC-02). When provided alongside
   *  `onLayoutAlgorithmChange`, GraphCanvas renders a Select beside the
   *  Reorganizar button so the user can switch between force / tree / radial.
   *  Both props must be passed together — passing only one disables the
   *  Select (defensive: a Select without a setter is read-only and useless;
   *  a setter without the current value can't show the selection). */
  layoutAlgorithm?: GraphLayoutAlgorithm;
  /** Setter for the active layout algorithm (TC-02). Paired with
   *  `layoutAlgorithm` above. */
  onLayoutAlgorithmChange?: (algo: GraphLayoutAlgorithm) => void;
  /** Imperative view-handle ref (React 19 ref-as-prop). Exposes
   *  `focusNode`/`fitView`/`recenter` against the React Flow viewport. */
  ref?: Ref<GraphSpaceHandle>;
  /** Additional Tailwind classes — merged via `cn()`. */
  className?: string;
}
