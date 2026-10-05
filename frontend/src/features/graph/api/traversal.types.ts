import type {
  AttributeWireAssertionStatus,
  AttributeWireEffectiveStatus,
  NodeSummaryWire,
  ProvenanceEntryWire,
  ProvenanceEntryView,
} from "./node-detail.types";

export interface TraversalLinkWire {
  readonly id: string;
  readonly source_node_id: string;
  readonly target_node_id: string;
  readonly link_type: string;
  readonly link_inverse_name: string;
  readonly status: AttributeWireAssertionStatus;
  readonly effective_status: AttributeWireEffectiveStatus;
  readonly is_current: boolean;
  readonly is_in_effect: boolean;
  readonly confidence: number;
  readonly valid_from: string | null;
  readonly valid_to: string | null;
  readonly recorded_at?: string;
  readonly superseded_at?: string | null;
  readonly flags?: ReadonlyArray<string>;
  readonly hop: number;
  readonly score: number;
  readonly provenance?: ReadonlyArray<ProvenanceEntryWire>;
}

export interface TraversalResultWire {
  readonly starting_node_id: string;
  readonly nodes: ReadonlyArray<NodeSummaryWire>;
  readonly links: ReadonlyArray<TraversalLinkWire>;
}

export type LinkDirection = "outgoing" | "incoming";

export interface TraversalLinkView {
  readonly id: string;
  readonly linkType: string;
  readonly directionLabel: string;
  readonly direction: LinkDirection;
  readonly directionArrow: "→" | "←";
  readonly neighborName: string;
  readonly neighborNodeId: string;
  readonly neighborNodeType: string;
  readonly effectiveStatus: AttributeWireEffectiveStatus;
  readonly isInEffect: boolean;
  readonly confidenceLabel: string;
  readonly confidence: number;
  readonly validFromLabel: string | null;
  readonly validToLabel: string | null;
  readonly flags: ReadonlyArray<string>;
  readonly provenance: ReadonlyArray<ProvenanceEntryView>;
}

export interface TraversalResultView {
  readonly startingNodeId: string;
  readonly links: ReadonlyArray<TraversalLinkView>;
}
