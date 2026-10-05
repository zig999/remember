import type { FC } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  useInternalNode,
} from "@xyflow/react";
import type { ConfidenceState } from "@/components/ds/StateBadge";
import { cn } from "@/lib/cn";
import { getEdgeParams } from "../../lib/edge-params";
import type { GraphEdgeAdapterProps } from "./GraphEdgeAdapter.types";

const LINK_STROKE_CLASS: Readonly<Record<string, string>> = Object.freeze({
  participates_in: "stroke-link-participates-in",
  member_of: "stroke-link-member-of",
  holds_role: "stroke-link-holds-role",
  responsible_for: "stroke-link-responsible-for",
  reports_to: "stroke-link-reports-to",
  part_of: "stroke-link-part-of",
  located_in: "stroke-link-located-in",
  organizes: "stroke-link-organizes",
  belongs_to_category: "stroke-link-belongs-to-category",
  related_to: "stroke-link-related-to",
  concerns: "stroke-link-concerns",
  delivered_to: "stroke-link-delivered-to",
  sponsors: "stroke-link-sponsors",
});

const FALLBACK_STROKE_CLASS = "stroke-link-related-to";

function stateStrokeClass(state: ConfidenceState | undefined): string | null {
  switch (state) {
    case "uncertain":
      return "stroke-state-uncertain";
    case "disputed":
      return "stroke-state-disputed";
    case "superseded":
      return "stroke-state-superseded";
    case "accepted":
    case "low-confidence":
    case undefined:
      return null;
  }
}

export const GraphEdgeAdapter: FC<GraphEdgeAdapterProps> = ({
  id,
  source,
  target,
  data,
  markerEnd,
  selected,
}) => {
  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);

  if (!data) {
    return null;
  }

  const params = getEdgeParams(sourceNode, targetNode);
  if (!params) {
    return null;
  }

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX: params.sourceX,
    sourceY: params.sourceY,
    sourcePosition: params.sourcePos,
    targetX: params.targetX,
    targetY: params.targetY,
    targetPosition: params.targetPos,
  });

  const stateClass = stateStrokeClass(data.state);
  const linkClass = LINK_STROKE_CLASS[data.label] ?? FALLBACK_STROKE_CLASS;
  const strokeColorClass = stateClass ?? linkClass;

  const isUncertain = data.state === "uncertain";
  const isDashed = isUncertain || !data.isTemporal;
  const strokeDasharray = isDashed ? "4 4" : "0";

  const isDimmed = data.inEffect === false || data.state === "superseded";

  const markerProp = markerEnd ? { markerEnd } : {};

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        {...markerProp}
        aria-hidden="true"
        className={cn(
          strokeColorClass,
          "[stroke-width:var(--border-thin)]",
          "hover:[stroke-width:var(--border-2)]",
          selected && "[stroke-width:var(--border-thick)]",
          isDimmed && "opacity-40",
        )}
        strokeDasharray={strokeDasharray}
      />
      <EdgeLabelRenderer>
        <div
          // eslint-disable-next-line react/forbid-dom-props
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: "none",
          }}
          className={cn(
            "rounded-sm bg-surface-glass-panel px-xs py-xs",
            "text-xs text-foreground",
            "border border-border-glass",
            isDimmed && "opacity-40",
          )}
        >
          {data.linkTypeLabel}
        </div>
      </EdgeLabelRenderer>
    </>
  );
};
