/**
 * graph feature — api barrel (TC-FE-08).
 *
 * Public surface for the graph data layer. Components consume hooks from
 * here; the underlying `_request.ts` / `_transforms.ts` modules are
 * implementation details (prefixed `_` to signal that). Mirrors the chat
 * feature's `api/index.ts` shape.
 */

export { graphNodeKeys } from "./keys";

export { useNodeDetail } from "./useNodeDetail";

// Wire / surface types — exported so component tests can build fixtures
// without re-declaring the shape, and so the panel can type its prop
// destructuring against `NodeDetailView`.
export type {
  AttributeWire,
  AttributeWireAssertionStatus,
  AttributeWireEffectiveStatus,
  NodeAliasView,
  NodeAliasWire,
  NodeAttributeView,
  NodeDetailView,
  NodeDetailWire,
  NodeSummaryWire,
  NodeWireStatus,
} from "./node-detail.types";

// Re-export pure transforms for unit tests.
export {
  formatDateLabel,
  mapAttributeStatusToBadge,
  mapNodeStatusToBadge,
  toNodeDetail,
} from "./_transforms";
