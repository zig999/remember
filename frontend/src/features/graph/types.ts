import type { GraphNodeType } from "@/components/ds/GraphNode";
import type { ConfidenceState } from "@/components/ds/StateBadge";

export interface GraphNodeData {
  readonly id: string;
  readonly type: GraphNodeType;
  readonly label: string;
  readonly state?: ConfidenceState;
  readonly subtitle?: string;
}

export interface GraphLinkData {
  readonly id: string;
  readonly source: string;
  readonly target: string;
  readonly label: string;
  readonly linkTypeLabel: string;
  readonly isTemporal: boolean;
  readonly inEffect?: boolean;
  readonly state?: ConfidenceState;
}

export interface GraphDelta {
  readonly sourceTool: string;
  readonly nodes: readonly GraphNodeData[];
  readonly links: readonly GraphLinkData[];
}

export type GraphStatus = "empty" | "loading" | "revealing" | "ready" | "error";

export type GraphNodeWireStatus = "active" | "needs_review" | "merged" | "deleted";

export type GraphLinkWireFlag = "uncertain" | "disputed" | "low_confidence";

export interface GraphNodeWire {
  readonly id: string;
  readonly node_type: string;
  readonly canonical_name: string;
  readonly status: GraphNodeWireStatus;
}

export interface GraphLinkWire {
  readonly id: string;
  readonly source_node_id: string;
  readonly target_node_id: string;
  readonly link_type: string;
  readonly link_type_label?: string;
  readonly is_temporal: boolean;
  readonly is_in_effect?: boolean;
  readonly status?: string;
  readonly flags?: readonly GraphLinkWireFlag[];
}

export interface GraphDeltaWire {
  readonly source_tool: string;
  readonly nodes: readonly GraphNodeWire[];
  readonly links: readonly GraphLinkWire[];
}
