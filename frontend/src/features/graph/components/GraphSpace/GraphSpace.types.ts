import type { Ref } from "react";
import type { GraphLinkData, GraphNodeData, GraphStatus } from "../../types";

export interface GraphSpaceHandle {
  focusNode(id: string): void;
  fitView(): void;
  recenter(): void;
}

export interface GraphSpaceProps {
  nodes: readonly GraphNodeData[];
  links: readonly GraphLinkData[];
  status: GraphStatus;
  errorMessage?: string;
  revealStaggerMs?: number;
  onNodeSelect?: (nodeId: string) => void;
  ref?: Ref<GraphSpaceHandle>;
  className?: string;
}
