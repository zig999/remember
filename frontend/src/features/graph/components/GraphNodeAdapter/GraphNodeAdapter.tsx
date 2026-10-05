import type { FC } from "react";
import { Handle, Position } from "@xyflow/react";
import { GraphNode as DsGraphNode } from "@/components/ds/GraphNode";
import type { GraphNodeAdapterProps } from "./GraphNodeAdapter.types";

const HANDLE_CLASSES =
  "!size-2 !min-w-0 !rounded-pill !border !border-border-glass !bg-surface-glass-panel opacity-0 pointer-events-none";

export const GraphNodeAdapter: FC<GraphNodeAdapterProps> = ({
  data,
  selected,
}) => {
  const stateProp = data.state ? { state: data.state } : {};
  const subtitleProp = data.subtitle ? { subtitle: data.subtitle } : {};
  return (
    <>
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={false}
        aria-hidden="true"
        className={HANDLE_CLASSES}
      />
      <DsGraphNode
        type={data.type}
        label={data.label}
        {...stateProp}
        {...subtitleProp}
        selected={selected ?? false}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={false}
        aria-hidden="true"
        className={HANDLE_CLASSES}
      />
    </>
  );
};
