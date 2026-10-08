import type {
  ListedNode,
  ListedNodeWire,
  NodeListing,
  NodeListingWire,
  NodeType,
  NodeTypeListWire,
  NodeTypeWire,
} from "../types";

export function toNodeType(wire: NodeTypeWire): NodeType {
  return {
    id: wire.id,
    name: wire.name,
    description: wire.description,
    version: wire.version,
  };
}

export function toNodeTypes(wire: NodeTypeListWire): readonly NodeType[] {
  return wire.items.map(toNodeType);
}

export function toListedNode(wire: ListedNodeWire): ListedNode {
  return {
    id: wire.id,
    nodeType: wire.node_type,
    canonicalName: wire.canonical_name,
    status: wire.status,
    mergedInto: wire.merged_into,
  };
}

export function toNodeListing(wire: NodeListingWire): NodeListing {
  return {
    total: wire.total,
    items: wire.items.map(toListedNode),
  };
}
