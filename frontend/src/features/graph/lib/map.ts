import type { GraphNodeType } from "@/components/ds/GraphNode";
import type { ConfidenceState } from "@/components/ds/StateBadge";
import type { GraphLinkWireFlag, GraphNodeWireStatus } from "../types";

const KNOWN_NODE_TYPES: ReadonlySet<GraphNodeType> = new Set<GraphNodeType>([
  "person",
  "organization",
  "project",
  "event",
  "role",
  "category",
  "concept",
  "location",
  "document",
  "task",
]);

const FALLBACK_NODE_TYPE: GraphNodeType = "concept";

export function mapNodeType(wireType: string): GraphNodeType {
  const normalized = wireType.trim().toLowerCase();
  return KNOWN_NODE_TYPES.has(normalized as GraphNodeType)
    ? (normalized as GraphNodeType)
    : FALLBACK_NODE_TYPE;
}

export function deriveNodeState(status: GraphNodeWireStatus): ConfidenceState | undefined {
  switch (status) {
    case "active":
      return "accepted";
    case "needs_review":
      return "uncertain";
    case "merged":
    case "deleted":
      return undefined;
    default:
      return undefined;
  }
}

export function deriveLinkState(
  status: string | undefined,
  flags: readonly GraphLinkWireFlag[] | undefined,
): ConfidenceState {
  if (status === "superseded") {
    return "superseded";
  }
  if (flags && flags.length > 0) {
    if (flags.includes("disputed")) {
      return "disputed";
    }
    if (flags.includes("low_confidence")) {
      return "low-confidence";
    }
    if (flags.includes("uncertain")) {
      return "uncertain";
    }
  }
  return "accepted";
}

export function mapLinkTypeLabel(
  linkType: string,
  linkTypeLabel: string | undefined,
): string {
  if (linkTypeLabel !== undefined && linkTypeLabel.trim().length > 0) {
    return linkTypeLabel;
  }
  return linkType.replace(/_/g, " ");
}
