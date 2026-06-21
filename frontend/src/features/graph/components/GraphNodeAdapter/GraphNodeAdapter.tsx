/**
 * GraphNodeAdapter — React Flow custom node that wraps `ds/GraphNode` (TC-FE-06).
 *
 * Responsibilities (GraphSpace.component.spec.md §7):
 *  - Reuse `components/ds/GraphNode` as the visual — DO NOT re-implement
 *    node styling. The adapter only:
 *      1. Renders two `<Handle>`s (source on Bottom, target on Top) so React
 *         Flow can wire edges through this node.
 *      2. Maps `NodeProps<GraphNode>.data` (a `GraphNodeData` payload) to the
 *         presentational `GraphNodeProps`.
 *      3. Forwards React Flow's `selected` flag so the node renders its
 *         focus ring when the user selects it.
 *  - No event listeners — `onNodeClick` is handled by `<ReactFlow>` itself
 *    in `GraphCanvas`. The adapter never imports `useChatTurnStore`
 *    (AC-U.3 — structural unidirectionality).
 *  - No `forwardRef` — React 19 ref-as-prop pattern. The adapter does not
 *    expose a ref upwards; the underlying `ds/GraphNode` already accepts
 *    one when needed by other call-sites.
 *
 * Normative sources:
 *  - docs/specs/front/components/GraphSpace.component.spec.md §7 (this file)
 *  - components/ds/GraphNode/GraphNode.tsx (the wrapped visual)
 *  - tokens.md §6.3 (node-type colours — owned by ds/GraphNode)
 */
import type { FC } from "react";
import { Handle, Position } from "@xyflow/react";
import { GraphNode as DsGraphNode } from "@/components/ds/GraphNode";
import type { GraphNodeAdapterProps } from "./GraphNodeAdapter.types";

/**
 * Handle styling — kept minimal and token-driven. React Flow renders the
 * `<Handle>` as a small DOM element at a fixed offset around the node; we
 * size it via Tailwind classes (4-pt grid) so it stays consistent with the
 * design system. The handle is decorative for v1 (edges are auto-wired by
 * the layout, not user-drawn), so we hide it from assistive technology.
 */
const HANDLE_CLASSES =
  "!size-2 !min-w-0 !rounded-pill !border !border-border-glass !bg-surface-glass-panel";

export const GraphNodeAdapter: FC<GraphNodeAdapterProps> = ({
  data,
  selected,
}) => {
  // `data.state` is optional on the surface shape — only spread when present so
  // exactOptionalPropertyTypes doesn't get an explicit `undefined`.
  const stateProp = data.state ? { state: data.state } : {};
  // Same logic for `subtitle` — preserve "absent" semantics.
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
