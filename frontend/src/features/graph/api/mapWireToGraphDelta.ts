import { useGraphStore } from "../state/graph-store";
import {
  deriveLinkState,
  deriveNodeState,
  mapLinkTypeLabel,
  mapNodeType,
} from "../lib/map";
import type {
  GraphDelta,
  GraphLinkData,
  GraphLinkWire,
  GraphNodeData,
  GraphNodeWire,
} from "../types";

export interface MapWireToGraphDeltaInput {
  readonly sourceTool: string;
  readonly nodes: readonly GraphNodeWire[];
  readonly links: readonly GraphLinkWire[];
}

export function mapWireToGraphDelta(
  input: MapWireToGraphDeltaInput,
): GraphDelta {
  const mappedNodes: GraphNodeData[] = [];
  const visibleIds = new Set<string>();
  for (const wireNode of input.nodes) {
    const state = deriveNodeState(wireNode.status);
    if (state === undefined) {
      continue;
    }
    const node: GraphNodeData = {
      id: wireNode.id,
      type: mapNodeType(wireNode.node_type),
      label: wireNode.canonical_name,
      state,
    };
    mappedNodes.push(node);
    visibleIds.add(wireNode.id);
  }

  const mappedLinks: GraphLinkData[] = [];
  for (const wireLink of input.links) {
    const sourceVisible =
      visibleIds.has(wireLink.source_node_id) ||
      useGraphStore.getState().nodes.has(wireLink.source_node_id);
    const targetVisible =
      visibleIds.has(wireLink.target_node_id) ||
      useGraphStore.getState().nodes.has(wireLink.target_node_id);
    if (!sourceVisible || !targetVisible) continue;

    const link: GraphLinkData = {
      id: wireLink.id,
      source: wireLink.source_node_id,
      target: wireLink.target_node_id,
      label: wireLink.link_type,
      linkTypeLabel: mapLinkTypeLabel(wireLink.link_type, wireLink.link_type_label),
      isTemporal: wireLink.is_temporal,
      state: deriveLinkState(wireLink.status, wireLink.flags),
      ...(wireLink.is_in_effect === undefined
        ? {}
        : { inEffect: wireLink.is_in_effect }),
    };
    mappedLinks.push(link);
  }

  return {
    sourceTool: input.sourceTool,
    nodes: mappedNodes,
    links: mappedLinks,
  };
}
