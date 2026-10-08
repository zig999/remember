import type {
  AllowedValue,
  AllowedValueWire,
  AppliedChange,
  AppliedChangeWire,
  AttributeChange,
  AttributeChangeWire,
  AttributeKey,
  AttributeKeyListWire,
  AttributeKeyWire,
  EditAccepted,
  EditAcceptedWire,
  EntityEdit,
  EntityEditWire,
  ListedNode,
  ListedNodeWire,
  NodeAlias,
  NodeAliasWire,
  NodeAttribute,
  NodeAttributeWire,
  NodeListing,
  NodeListingWire,
  NodeRead,
  NodeReadWire,
  NodeSummaryWire,
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
    mergedInto: wire.merged_into_node_id,
  };
}

export function toNodeListing(wire: NodeListingWire): NodeListing {
  return {
    total: wire.total,
    items: wire.items.map(toListedNode),
  };
}

export function toNodeSummary(wire: NodeSummaryWire): ListedNode {
  return {
    id: wire.id,
    nodeType: wire.node_type,
    canonicalName: wire.canonical_name,
    status: wire.status,
    mergedInto: wire.merged_into_node_id ?? wire.merged_into ?? null,
  };
}

export function toNodeAlias(wire: NodeAliasWire): NodeAlias {
  return {
    id: wire.id,
    alias: wire.alias,
    kind: wire.kind,
    createdAt: wire.created_at ?? null,
  };
}

export function toNodeAttribute(wire: NodeAttributeWire): NodeAttribute {
  return {
    id: wire.id,
    attributeKey: wire.attribute_key,
    value: wire.value,
    validFrom: wire.valid_from,
    validTo: wire.valid_to,
    status: wire.status,
    isCurrent: wire.is_current,
  };
}

export function toNodeRead(wire: NodeReadWire): NodeRead {
  return {
    node: toNodeSummary(wire.node),
    aliases: wire.aliases.map(toNodeAlias),
    attributes: wire.attributes.map(toNodeAttribute),
  };
}

export function toAllowedValue(wire: AllowedValueWire): AllowedValue {
  if (typeof wire === "string") {
    return { value: wire, label: null, sortOrder: null };
  }
  return {
    value: wire.value,
    label: wire.label ?? null,
    sortOrder: wire.sort_order ?? null,
  };
}

export function toAttributeKey(wire: AttributeKeyWire): AttributeKey {
  return {
    key: wire.key,
    valueType: wire.value_type,
    isTemporal: wire.is_temporal,
    allowsMultiple: wire.allows_multiple_current,
    description: wire.description,
    allowedValues:
      wire.valid_values === undefined
        ? null
        : wire.valid_values.map(toAllowedValue),
  };
}

export function toAttributeKeys(
  wire: AttributeKeyListWire,
): readonly AttributeKey[] {
  return wire.items.map(toAttributeKey);
}

function memberOrNull(member: string | null | undefined): string | null {
  if (member === undefined || member === null || member.length === 0) {
    return null;
  }
  return member;
}

function toAttributeChangeWire(change: AttributeChange): AttributeChangeWire {
  const removes = change.kind === "remove";
  return {
    attribute_key: change.attributeKey,
    kind: change.kind,
    value: removes ? null : memberOrNull(change.value),
    item_id: memberOrNull(change.itemId),
    valid_from: removes ? null : memberOrNull(change.validFrom),
    valid_to: removes ? null : memberOrNull(change.validTo),
  };
}

export function toEntityEditWire(edit: EntityEdit): EntityEditWire {
  return {
    reason: edit.reason,
    changes: edit.changes.map(toAttributeChangeWire),
  };
}

export function toAppliedChange(wire: AppliedChangeWire): AppliedChange {
  return {
    attributeKey: wire.attribute_key,
    effect: wire.effect,
    itemId: wire.item_id,
    predecessorId: wire.predecessor_id,
  };
}

export function toEditAccepted(wire: EditAcceptedWire): EditAccepted {
  return {
    kind: "accepted",
    nodeId: wire.node_id,
    actionId: wire.action_id,
    applied: wire.applied.map(toAppliedChange),
  };
}
