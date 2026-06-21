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
