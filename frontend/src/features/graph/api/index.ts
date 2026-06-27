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
export { useNodeRelationships } from "./useNodeRelationships";
export { useProvenance } from "./useProvenance";

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
  ProvenanceEntryView,
  ProvenanceEntryWire,
} from "./node-detail.types";

export type {
  LinkDirection,
  TraversalLinkView,
  TraversalLinkWire,
  TraversalResultView,
  TraversalResultWire,
} from "./traversal.types";

export type {
  ProvenanceKind,
  ProvenanceResponseView,
  ProvenanceResponseWire,
  ProvenanceFragmentView,
  ProvenanceChunkView,
  ProvenanceRawInformationView,
} from "./provenance.types";

// Re-export pure transforms for unit tests.
export {
  formatConfidenceLabel,
  formatDateLabel,
  formatReceivedAtLabel,
  mapAttributeStatusToBadge,
  mapNodeStatusToBadge,
  toNodeDetail,
  toProvenanceEntryView,
} from "./_transforms";

export { toTraversalResult } from "./traversal.transforms";
export {
  formatReceivedAtDateTime,
  toProvenanceResponse,
} from "./provenance.transforms";

// dev_tc_001 — wire→surface mapper extracted from `features/chat`. Both
// `/chat` (SSE dispatcher) and `/ingest` (traverse-assembled deltas)
// consume it from here to avoid a cross-feature import.
export {
  mapWireToGraphDelta,
  type MapWireToGraphDeltaInput,
} from "./mapWireToGraphDelta";
