import type { Ref } from "react";
import type { ConfidenceState } from "@/components/ds/StateBadge";

export type GraphNodeType =
  | "person"
  | "organization"
  | "project"
  | "event"
  | "role"
  | "category"
  | "concept"
  | "location"
  | "document"
  | "task";

export interface GraphNodeProps {
  type: GraphNodeType;
  label: string;
  state?: ConfidenceState;
  subtitle?: string;
  selected?: boolean;
  className?: string;
  ref?: Ref<HTMLDivElement>;
}
