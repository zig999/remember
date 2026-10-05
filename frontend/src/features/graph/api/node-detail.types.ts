import type { ConfidenceState } from "@/components/ds/StateBadge";

export type NodeWireStatus = "active" | "needs_review" | "merged" | "deleted";

export type AttributeWireAssertionStatus =
  | "proposed"
  | "accepted"
  | "uncertain"
  | "disputed"
  | "superseded";

export type AttributeWireEffectiveStatus =
  | "active"
  | "inactive"
  | "uncertain"
  | "disputed";

export interface NodeAliasWire {
  readonly id: string;
  readonly alias: string;
  readonly kind: "canonical" | "alias";
  readonly created_at?: string;
}

export interface ProvenanceEntryWire {
  readonly fragment_id: string;
  readonly fragment_text: string;
  readonly confidence?: number;
  readonly raw_information_id?: string;
  readonly source_type?: string;
  readonly received_at?: string;
  readonly excerpt?: string;
}

export interface AttributeWire {
  readonly id: string;
  readonly node_id: string;
  readonly attribute_key: string;
  readonly value_type: "text" | "number" | "date" | "bool";
  readonly value: string;
  readonly status: AttributeWireAssertionStatus;
  readonly effective_status: AttributeWireEffectiveStatus;
  readonly is_current: boolean;
  readonly is_in_effect: boolean;
  readonly confidence: number;
  readonly valid_from: string | null;
  readonly valid_to: string | null;
  readonly provenance?: ReadonlyArray<ProvenanceEntryWire>;
}

export interface NodeSummaryWire {
  readonly id: string;
  readonly node_type: string;
  readonly canonical_name: string;
  readonly status: NodeWireStatus;
  readonly merged_into_node_id?: string | null;
}

export interface NodeDetailWire {
  readonly node: NodeSummaryWire;
  readonly aliases: ReadonlyArray<NodeAliasWire>;
  readonly attributes: ReadonlyArray<AttributeWire>;
}

export interface ProvenanceEntryView {
  readonly fragmentId: string;
  readonly fragmentText: string;
  readonly confidenceLabel: string | null;
  readonly confidence: number | null;
  readonly rawInformationId: string | null;
  readonly sourceType: string | null;
  readonly receivedAtLabel: string | null;
  readonly excerpt: string | null;
}

export interface NodeAttributeView {
  readonly id: string;
  readonly key: string;
  readonly value: string;
  readonly valueType: AttributeWire["value_type"];
  readonly effectiveStatus: AttributeWireEffectiveStatus;
  readonly isInEffect: boolean;
  readonly state: ConfidenceState;
  readonly validFromLabel: string | null;
  readonly validToLabel: string | null;
  readonly provenance: ReadonlyArray<ProvenanceEntryView>;
}

export interface NodeAliasView {
  readonly id: string;
  readonly alias: string;
  readonly kind: NodeAliasWire["kind"];
}

export interface NodeDetailView {
  readonly id: string;
  readonly canonicalName: string;
  readonly nodeType: string;
  readonly status: NodeWireStatus;
  readonly badgeState: ConfidenceState;
  readonly mergedIntoNodeId: string | null;
  readonly aliases: ReadonlyArray<NodeAliasView>;
  readonly attributes: ReadonlyArray<NodeAttributeView>;
}
