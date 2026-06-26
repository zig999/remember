/**
 * Traversal transforms — wire → surface for `TraversalResult` (dev_tc_001).
 *
 * Spec references:
 *  - docs/specs/front/components/NodeDetailPanel.component.spec.md §9
 *    "Response transforms":
 *      • link direction: `link.source_node_id === nodeId` → "→" (outgoing,
 *        label from `link.link_type`); else "←" (incoming, label from
 *        `link.link_inverse_name`).
 *      • neighbor canonical name: look up `result.nodes` by the other endpoint.
 *
 * Pure functions — no React, no fetch. The hook is a thin wrapper around
 * `http<T>` + this transform.
 */
import {
  formatConfidenceLabel,
  formatDateLabel,
  toProvenanceEntryView,
} from "./_transforms";
import type { NodeSummaryWire } from "./node-detail.types";
import type {
  LinkDirection,
  TraversalLinkView,
  TraversalLinkWire,
  TraversalResultView,
  TraversalResultWire,
} from "./traversal.types";

/* ---------- internal helpers --------------------------------------- */

/** Index `nodes[]` by id for O(1) neighbor lookup. */
function indexNodes(
  nodes: ReadonlyArray<NodeSummaryWire>,
): ReadonlyMap<string, NodeSummaryWire> {
  const map = new Map<string, NodeSummaryWire>();
  for (const n of nodes) map.set(n.id, n);
  return map;
}

/** Build a single link view relative to `currentNodeId`. */
function toLinkView(
  wire: TraversalLinkWire,
  currentNodeId: string,
  nodesById: ReadonlyMap<string, NodeSummaryWire>,
): TraversalLinkView {
  const isOutgoing = wire.source_node_id === currentNodeId;
  const direction: LinkDirection = isOutgoing ? "outgoing" : "incoming";
  const neighborId = isOutgoing ? wire.target_node_id : wire.source_node_id;
  const neighbor = nodesById.get(neighborId);
  // Defensive: if the BFF omitted the neighbor from `nodes[]` (should not
  // happen — `TraversalResult.nodes` MUST include all reachable nodes), fall
  // back to the raw id. Surface still renders; we never throw.
  const neighborName = neighbor?.canonical_name ?? neighborId;
  const neighborType = neighbor?.node_type ?? "";
  return {
    id: wire.id,
    linkType: wire.link_type,
    directionLabel: isOutgoing ? wire.link_type : wire.link_inverse_name,
    direction,
    directionArrow: isOutgoing ? "→" : "←",
    neighborName,
    neighborNodeId: neighborId,
    neighborNodeType: neighborType,
    effectiveStatus: wire.effective_status,
    isInEffect: wire.is_in_effect,
    confidence: wire.confidence,
    // `formatConfidenceLabel` returns `null` for `null|undefined|NaN`; here
    // the wire field is required so we coerce defensively to "0%" to avoid
    // a blank cell on a malformed payload.
    confidenceLabel: formatConfidenceLabel(wire.confidence) ?? "0%",
    validFromLabel: formatDateLabel(wire.valid_from),
    validToLabel: formatDateLabel(wire.valid_to),
    flags: wire.flags ?? [],
    provenance: (wire.provenance ?? []).map(toProvenanceEntryView),
  };
}

/** Top-level transform: traversal wire → surface (immutable). */
export function toTraversalResult(
  wire: TraversalResultWire,
): TraversalResultView {
  const nodesById = indexNodes(wire.nodes);
  return {
    startingNodeId: wire.starting_node_id,
    links: wire.links.map((l) => toLinkView(l, wire.starting_node_id, nodesById)),
  };
}
