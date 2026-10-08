export interface NodeTypeWire {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly version: number;
}

export interface NodeTypeListWire {
  readonly total: number;
  readonly items: readonly NodeTypeWire[];
}

export interface ListedNodeWire {
  readonly id: string;
  readonly node_type: string;
  readonly canonical_name: string;
  readonly status: string;
  readonly merged_into: string | null;
}

export interface NodeListingWire {
  readonly total: number;
  readonly limit: number;
  readonly offset: number;
  readonly items: readonly ListedNodeWire[];
}

export interface NodeType {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly version: number;
}

export interface ListedNode {
  readonly id: string;
  readonly nodeType: string;
  readonly canonicalName: string;
  readonly status: string;
  readonly mergedInto: string | null;
}

export interface NodeListing {
  readonly total: number;
  readonly items: readonly ListedNode[];
}

export interface NodeListingNarrowing {
  readonly namePrefix?: string | null;
  readonly nodeType?: string | null;
}

export interface NodeSummaryWire {
  readonly id: string;
  readonly node_type: string;
  readonly canonical_name: string;
  readonly status: string;
  readonly merged_into_node_id?: string | null;
  readonly merged_into?: string | null;
}

export interface NodeAliasWire {
  readonly id: string;
  readonly alias: string;
  readonly kind: string;
  readonly created_at?: string | null;
}

export interface NodeAttributeWire {
  readonly id: string;
  readonly attribute_key: string;
  readonly value: string;
  readonly valid_from: string | null;
  readonly valid_to: string | null;
  readonly status: string;
  readonly is_current: boolean;
}

export interface NodeReadWire {
  readonly node: NodeSummaryWire;
  readonly aliases: readonly NodeAliasWire[];
  readonly attributes: readonly NodeAttributeWire[];
}

export interface NodeAlias {
  readonly id: string;
  readonly alias: string;
  readonly kind: string;
  readonly createdAt: string | null;
}

export interface NodeAttribute {
  readonly id: string;
  readonly attributeKey: string;
  readonly value: string;
  readonly validFrom: string | null;
  readonly validTo: string | null;
  readonly status: string;
  readonly isCurrent: boolean;
}

export interface NodeRead {
  readonly node: ListedNode;
  readonly aliases: readonly NodeAlias[];
  readonly attributes: readonly NodeAttribute[];
}

export interface AllowedValueObjectWire {
  readonly value: string;
  readonly label?: string | null;
  readonly sort_order?: number | null;
}

export type AllowedValueWire = string | AllowedValueObjectWire;

export interface AttributeKeyWire {
  readonly key: string;
  readonly value_type: string;
  readonly is_temporal: boolean;
  readonly allows_multiple: boolean;
  readonly description: string | null;
  readonly valid_values?: readonly AllowedValueWire[];
}

export interface AttributeKeyListWire {
  readonly total: number;
  readonly items: readonly AttributeKeyWire[];
}

export interface AllowedValue {
  readonly value: string;
  readonly label: string | null;
  readonly sortOrder: number | null;
}

export interface AttributeKey {
  readonly key: string;
  readonly valueType: string;
  readonly isTemporal: boolean;
  readonly allowsMultiple: boolean;
  readonly description: string | null;
  readonly allowedValues: readonly AllowedValue[] | null;
}

export type AttributeChangeKind = "set" | "remove";

export interface AttributeChange {
  readonly attributeKey: string;
  readonly kind: AttributeChangeKind;
  readonly value?: string | null;
  readonly itemId?: string | null;
  readonly validFrom?: string | null;
  readonly validTo?: string | null;
}

export interface EntityEdit {
  readonly reason: string;
  readonly changes: readonly AttributeChange[];
}

export interface AttributeChangeWire {
  readonly attribute_key: string;
  readonly kind: AttributeChangeKind;
  readonly value: string | null;
  readonly item_id: string | null;
  readonly valid_from: string | null;
  readonly valid_to: string | null;
}

export interface EntityEditWire {
  readonly reason: string;
  readonly changes: readonly AttributeChangeWire[];
}

export interface AppliedChangeWire {
  readonly attribute_key: string;
  readonly effect: string;
  readonly item_id: string | null;
  readonly predecessor_id: string | null;
}

export interface EditAcceptedWire {
  readonly node_id: string;
  readonly action_id: string;
  readonly applied: readonly AppliedChangeWire[];
}

export interface AppliedChange {
  readonly attributeKey: string;
  readonly effect: string;
  readonly itemId: string | null;
  readonly predecessorId: string | null;
}

export interface EditFailure {
  readonly code: string;
  readonly status: number;
  readonly message: string;
  readonly details: unknown;
}

export interface EditAccepted {
  readonly kind: "accepted";
  readonly nodeId: string;
  readonly actionId: string;
  readonly applied: readonly AppliedChange[];
}

export interface EditConflict {
  readonly kind: "conflict";
  readonly attributeKey: string | null;
  readonly itemId: string | null;
}

export interface EditRefused {
  readonly kind: "refused";
  readonly failure: EditFailure;
}

export interface EditUnreachable {
  readonly kind: "unreachable";
  readonly failure: EditFailure;
}

export interface EditSessionEnded {
  readonly kind: "session-ended";
}

export type EditOutcome =
  | EditAccepted
  | EditConflict
  | EditRefused
  | EditUnreachable
  | EditSessionEnded;

export interface EditVariables {
  readonly nodeId: string;
  readonly edit: EntityEdit;
  readonly signal?: AbortSignal;
}
