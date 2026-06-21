/**
 * GraphCanvas — the controlled `<ReactFlow>` canvas inside GraphSpace
 * (TC-FE-07).
 *
 * Responsibilities:
 *  - Build the React Flow `Node[]` / `Edge[]` arrays from the surface-shape
 *    `nodes`/`links` props + the force-layout positions Map.
 *  - Register `nodeTypes.graphNode` (GraphNodeAdapter) and
 *    `edgeTypes.graphEdge` (GraphEdgeAdapter).
 *  - Translate React Flow's `onNodeClick(event, node)` to the spec's
 *    `onNodeSelect(nodeId)` callback (view-only — never a chat mutation).
 *  - Expose the `GraphSpaceHandle` (`focusNode`/`fitView`/`recenter`) via
 *    the ref-as-prop pattern, backed by `useReactFlow()`.
 *
 * Why useImperativeHandle:
 *  - React 19 made `ref` a normal prop, BUT we still need a stable handle
 *    object that calls into `useReactFlow()` — that hook only resolves
 *    inside a `ReactFlowProvider`, so the handle has to live in a child
 *    of the provider. `useImperativeHandle` is the canonical primitive
 *    for binding a ref to a derived API surface and it is unchanged in
 *    React 19 (only `forwardRef` was deprecated).
 *
 * Structural constraints (AC-U.3):
 *  - This file does NOT import `useChatTurnStore` or any chat write
 *    action. The only callback flowing out is `onNodeSelect`, which the
 *    parent uses for view-only NodeDetailPanel mounting (decision 4 in
 *    the plan).
 *
 * Spec references:
 *  - docs/specs/front/components/GraphSpace.component.spec.md §3 (states
 *    — ready/revealing show the canvas), §9 (component tree, key
 *    implementation constraints).
 *  - temp/chat-graphspace-plan.md §6.1, §6.3 (GraphSpaceHandle), §6.7.
 */
import { useCallback, useImperativeHandle, useMemo } from "react";
import type { FC, MouseEvent as ReactMouseEvent } from "react";
import {
  ReactFlow,
  Panel,
  useReactFlow,
  type Edge,
  type Node,
  type NodeMouseHandler,
  type OnNodesChange,
} from "@xyflow/react";
import { Shuffle } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import {
  GraphNodeAdapter,
  type GraphNode,
} from "../GraphNodeAdapter";
import {
  GraphEdgeAdapter,
  type GraphEdge,
} from "../GraphEdgeAdapter";
import type { GraphCanvasProps } from "./GraphCanvas.types";

/**
 * `nodeTypes`/`edgeTypes` are referentially-stable maps — React Flow
 * recommends declaring them OUTSIDE the component to avoid re-registration
 * on every render (the library logs a warning otherwise). Both maps key on
 * the literal slug that the surface-to-RF mapper assigns below.
 */
const NODE_TYPES = { graphNode: GraphNodeAdapter } as const;
const EDGE_TYPES = { graphEdge: GraphEdgeAdapter } as const;

/** Default React Flow viewport — small zoom so a 5-node subgraph fits
 *  without immediately needing `fitView`. `fitView` is still on by default
 *  in the `<ReactFlow>` props below so any non-empty subgraph centres. */
const DEFAULT_VIEWPORT = { x: 0, y: 0, zoom: 0.75 } as const;

/**
 * Build the React Flow `Node[]` from surface-shape nodes + positions.
 *
 * - Each node uses the `graphNode` custom type — adapter handles the visual.
 * - Position falls back to {0, 0} when missing (the force pass hasn't run
 *   yet for this id). The adapter renders fine at any position; the next
 *   `useForceLayout` tick will write the real coordinates.
 * - `data` payload satisfies the RF index-signature constraint (the
 *   adapter's type wraps with `& Record<string, unknown>` — see
 *   GraphNodeAdapter.types.ts).
 */
function toRfNodes(
  nodes: readonly GraphCanvasProps["nodes"][number][],
  positions: ReadonlyMap<string, { readonly x: number; readonly y: number }>,
): GraphNode[] {
  return nodes.map<GraphNode>((n) => {
    const pos = positions.get(n.id);
    return {
      id: n.id,
      type: "graphNode",
      position: pos ? { x: pos.x, y: pos.y } : { x: 0, y: 0 },
      // Cast through `unknown` because React Flow's `Node<Data>` requires
      // `Data extends Record<string, unknown>` — the adapter's type alias
      // (`GraphNodeDataRF`) is the documented escape hatch. The runtime
      // shape is unchanged.
      data: n as unknown as NonNullable<GraphNode["data"]>,
    };
  });
}

/**
 * Build the React Flow `Edge[]` from surface-shape links.
 *
 * - Each edge uses the `graphEdge` custom type — adapter handles the
 *   stroke style (solid vs. dashed) and label.
 * - `aria-hidden` is set by the adapter itself; edges are decorative per
 *   GraphSpace.component.spec.md §8.
 */
function toRfEdges(
  links: readonly GraphCanvasProps["links"][number][],
): GraphEdge[] {
  return links.map<GraphEdge>((l) => {
    // The `data` cast uses a NonNullable widening to satisfy
    // `exactOptionalPropertyTypes` — React Flow's `Edge<Data>` types
    // `data` as `Data` (not `Data | undefined`), but our adapter's
    // type alias adds the index-signature intersection.
    return {
      id: l.id,
      type: "graphEdge",
      source: l.source,
      target: l.target,
      data: l as unknown as NonNullable<GraphEdge["data"]>,
    };
  });
}

export const GraphCanvas: FC<GraphCanvasProps> = ({
  nodes,
  links,
  positions,
  revealedIds,
  onNodeSelect,
  onNodePositionCommit,
  onResetLayout,
  ref,
  className,
}) => {
  // `useReactFlow` provides the viewport-control API. Available because
  // GraphSpace wraps this component in `<ReactFlowProvider>`.
  const rfApi = useReactFlow();

  // Apply the reveal filter (TC-FE-09):
  //  - When `revealedIds` is undefined → no filtering (legacy callers /
  //    static rendering). Pass nodes and links through.
  //  - When provided → mount only nodes whose id is in the Set, and only
  //    edges whose BOTH endpoints are in the Set (AC-F.15). An edge whose
  //    source OR target is still queued would render a stroke into an
  //    unmounted node — visually a phantom.
  //
  // The filtered arrays feed the memoized RF-shape builders below. Identity
  // changes on every reveal tick (the Set grows), so the memos recompute —
  // that is the intended trigger for React Flow to re-diff and mount the
  // newly-revealed node.
  const visibleNodes = useMemo(
    () =>
      revealedIds === undefined
        ? nodes
        : nodes.filter((n) => revealedIds.has(n.id)),
    [nodes, revealedIds],
  );
  const visibleLinks = useMemo(
    () =>
      revealedIds === undefined
        ? links
        : links.filter(
            (l) => revealedIds.has(l.source) && revealedIds.has(l.target),
          ),
    [links, revealedIds],
  );

  // Memoize the RF arrays so React Flow's diff stays cheap. Identity only
  // changes when the underlying props change — addNodes produces fresh
  // Maps so the source arrays' identities flip on every delta.
  const rfNodes = useMemo<Node[]>(
    () => toRfNodes(visibleNodes, positions),
    [visibleNodes, positions],
  );
  const rfEdges = useMemo<Edge[]>(() => toRfEdges(visibleLinks), [visibleLinks]);

  // Build the imperative handle. `useImperativeHandle` is still the
  // documented primitive in React 19 for binding a ref-as-prop to a
  // derived API surface — only `forwardRef` was deprecated.
  useImperativeHandle(
    ref,
    () => ({
      focusNode: (id: string) => {
        // Look up the live RF node — its `position` may have been pushed
        // by the user dragging; we want the *current* canvas coordinate.
        const node = rfApi.getNode(id);
        if (!node) return;
        // `setCenter(x, y, { zoom, duration })` centers the viewport on
        // a single point. The node's `position` is the top-left; offset
        // by half its measured size (when known) so we centre on the
        // node's geometric middle. When the size is unknown (RF hasn't
        // measured yet) we centre on the raw position — close enough.
        const measured = node.measured;
        const cx = node.position.x + (measured?.width ?? 0) / 2;
        const cy = node.position.y + (measured?.height ?? 0) / 2;
        rfApi.setCenter(cx, cy, { zoom: 1, duration: 300 });
      },
      fitView: () => {
        rfApi.fitView({ duration: 300, padding: 0.1 });
      },
      recenter: () => {
        // "Reset to default" — clear pan/zoom to the canvas origin.
        rfApi.setViewport(
          { x: DEFAULT_VIEWPORT.x, y: DEFAULT_VIEWPORT.y, zoom: DEFAULT_VIEWPORT.zoom },
          { duration: 300 },
        );
      },
    }),
    [rfApi],
  );

  /**
   * React Flow's onNodeClick — translate to the spec's `onNodeSelect`.
   * View-only: we never trigger a chat mutation or navigation. The
   * event signature `(event, node) => void` is the documented React
   * Flow contract for `onNodeClick` (see @xyflow/react d.ts).
   */
  const handleNodeClick = useCallback<NodeMouseHandler>(
    (_event: ReactMouseEvent, node: Node) => {
      if (!onNodeSelect) return;
      onNodeSelect(node.id);
    },
    [onNodeSelect],
  );

  /**
   * React Flow's onNodesChange — the canvas is FULLY CONTROLLED (the store
   * owns `positions`, fed in via the `nodes` prop), so RF cannot move a node
   * during a drag unless we apply the change ourselves. We route every
   * `position` change straight to the store via `onNodePositionCommit`: the
   * store writes the coord + pins the node, which flows back through
   * `positions` → `toRfNodes` and re-renders the node at the new spot (so it
   * follows the cursor). On drop the final change persists; the pin makes the
   * next force pass keep it put (AC-F.12 extended). Non-position changes
   * (dimensions/selection) are RF-internal and intentionally ignored — they
   * matched the prior view-only behaviour.
   */
  const handleNodesChange = useCallback<OnNodesChange>(
    (changes) => {
      if (!onNodePositionCommit) return;
      for (const change of changes) {
        if (change.type === "position" && change.position) {
          onNodePositionCommit(change.id, {
            x: change.position.x,
            y: change.position.y,
          });
        }
      }
    },
    [onNodePositionCommit],
  );

  // Spread `onNodesChange` only when a commit handler is wired — under
  // `exactOptionalPropertyTypes` an explicit `undefined` is rejected by
  // React Flow's prop type.
  const nodesChangeProp = onNodePositionCommit
    ? { onNodesChange: handleNodesChange }
    : {};

  return (
    <ReactFlow
      // Controlled mode: parent owns nodes/edges; we never write to RF's
      // internal store from here. This is the documented pattern for
      // externally-driven graphs (RF docs §State Management).
      nodes={rfNodes}
      edges={rfEdges}
      nodeTypes={NODE_TYPES}
      edgeTypes={EDGE_TYPES}
      defaultViewport={DEFAULT_VIEWPORT}
      onNodeClick={handleNodeClick}
      {...nodesChangeProp}
      // Auto-fit when nodes change so a new turn's subgraph centres
      // without the user having to click "fit". The `padding: 0.1` keeps
      // a 10% margin around the bounding box (RF default is too tight).
      fitView
      fitViewOptions={{ padding: 0.1 }}
      // Hide React Flow's attribution badge — visual noise that is not
      // required by the MIT licence at our scale. The licence permits
      // hiding it (see @xyflow/react LICENSE).
      proOptions={{ hideAttribution: true }}
      // Selection / drag flags: nodes are interactive (selectable +
      // focusable for keyboard a11y per GraphSpace §8 scenario 6). Draggable
      // when a position-commit handler is wired (TC-FE drag, supersedes D5):
      // d3-force still computes the INITIAL layout and pins existing nodes,
      // but the user can override any node's position by dragging — the
      // commit persists it as a pin (AC-F.12 extended). Omitting the handler
      // (tests / static callers) keeps the original view-only, non-draggable
      // behaviour. `nodesConnectable` stays false — this is a read-only graph.
      nodesDraggable={onNodePositionCommit !== undefined}
      nodesConnectable={false}
      elementsSelectable={true}
      // Pan/zoom are user-driven — these are the React Flow defaults
      // restated for clarity. No mutation back to the chat (REQ-6).
      panOnDrag
      zoomOnScroll
      className={cn("h-full w-full", className)}
    >
      {/* "Reorganizar" — re-flow the layout (discard user drags, re-run the
          force pass). Shown only with a handler wired AND at least one node.
          React Flow's <Panel> overlays the canvas without affecting layout. */}
      {onResetLayout && visibleNodes.length > 0 && (
        <Panel position="top-right">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onResetLayout}
            aria-label="Reorganizar o layout do grafo"
          >
            <Shuffle aria-hidden="true" className="size-4" />
            Reorganizar
          </Button>
        </Panel>
      )}
    </ReactFlow>
  );
};
