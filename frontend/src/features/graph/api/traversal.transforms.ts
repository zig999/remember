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

function indexNodes(
  nodes: ReadonlyArray<NodeSummaryWire>,
): ReadonlyMap<string, NodeSummaryWire> {
  const map = new Map<string, NodeSummaryWire>();
  for (const n of nodes) map.set(n.id, n);
  return map;
}

function toLinkView(
  wire: TraversalLinkWire,
  currentNodeId: string,
  nodesById: ReadonlyMap<string, NodeSummaryWire>,
): TraversalLinkView {
  const isOutgoing = wire.source_node_id === currentNodeId;
  const direction: LinkDirection = isOutgoing ? "outgoing" : "incoming";
  const neighborId = isOutgoing ? wire.target_node_id : wire.source_node_id;
  const neighbor = nodesById.get(neighborId);
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
    confidenceLabel: formatConfidenceLabel(wire.confidence) ?? "0%",
    validFromLabel: formatDateLabel(wire.valid_from),
    validToLabel: formatDateLabel(wire.valid_to),
    flags: wire.flags ?? [],
    provenance: (wire.provenance ?? []).map(toProvenanceEntryView),
  };
}

export function toTraversalResult(
  wire: TraversalResultWire,
): TraversalResultView {
  const nodesById = indexNodes(wire.nodes);
  return {
    startingNodeId: wire.starting_node_id,
    links: wire.links.map((l) => toLinkView(l, wire.starting_node_id, nodesById)),
  };
}
