/**
 * graph — feature public surface (TC-FE-01).
 *
 * Phase-1 deliverable: types + wire/surface mappers only. The store,
 * components (GraphSpace, GraphCanvas, adapters) and hooks (useForceLayout,
 * useGraphReveal) land in subsequent TCs (F2–F8 in the plan §9). The
 * barrel is the import surface for the SSE dispatcher in
 * `features/chat/api/useSendMessage.ts` and for unit tests.
 *
 * Convention: `export *` per CLAUDE.md "feature-based" folder rule + the
 * pattern used by `features/auth/index.ts`.
 */
export type {
  GraphDelta,
  GraphDeltaWire,
  GraphLinkData,
  GraphLinkWire,
  GraphLinkWireFlag,
  GraphNodeData,
  GraphNodeWire,
  GraphNodeWireStatus,
  GraphStatus,
} from "./types";

export { deriveLinkState, deriveNodeState, mapNodeType } from "./lib/map";

export { useGraphStore } from "./state/graph-store";
export type { GraphPosition, GraphState } from "./state/graph-store";

export { useForceLayout, runForceLayout } from "./hooks/useForceLayout";

export { GraphNodeAdapter } from "./components/GraphNodeAdapter";
export type {
  GraphNode,
  GraphNodeAdapterProps,
  GraphNodeDataRF,
} from "./components/GraphNodeAdapter";

export { GraphEdgeAdapter } from "./components/GraphEdgeAdapter";
export type {
  GraphEdge,
  GraphEdgeAdapterProps,
  GraphLinkDataRF,
} from "./components/GraphEdgeAdapter";

export { GraphSpace } from "./components/GraphSpace";
export type { GraphSpaceHandle, GraphSpaceProps } from "./components/GraphSpace";

export { GraphCanvas } from "./components/GraphCanvas";
export type { GraphCanvasProps } from "./components/GraphCanvas";

export {
  GraphStatusOverlay,
  GRAPH_STATUS_LOADING_COPY,
  GRAPH_STATUS_ERROR_DEFAULT_COPY,
} from "./components/GraphStatusOverlay";
export type {
  GraphStatusOverlayProps,
  GraphStatusOverlayVariant,
} from "./components/GraphStatusOverlay";

export {
  GraphEmptyState,
  GRAPH_EMPTY_STATE_COPY,
} from "./components/GraphEmptyState";
export type { GraphEmptyStateProps } from "./components/GraphEmptyState";
