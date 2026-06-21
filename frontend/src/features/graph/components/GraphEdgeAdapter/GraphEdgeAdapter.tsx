/**
 * GraphEdgeAdapter — React Flow custom edge (TC-FE-06).
 *
 * Renders the SVG path between two `GraphNodeAdapter`s with:
 *  - Solid stroke when `data.isTemporal === true`; dashed (`4 4`) otherwise
 *    (tokens.md §7 — AC-F.11).
 *  - Confidence-state colour overrides (uncertain / disputed / superseded)
 *    via the `--color-state-*` tokens. When no override is active, the
 *    stroke uses the LinkType colour token (`--color-link-{label}`).
 *  - `opacity-40` when `data.inEffect === false` OR `data.state ===
 *    "superseded"` (out-of-effect / historical edge, GraphEdge.spec §3).
 *  - The link-type slug (`data.label`) rendered as a small centred label
 *    via `EdgeLabelRenderer`, using the `text-caption` token.
 *  - Hover thickens the stroke from `--border-thin` to `--border-2`
 *    (GraphEdge.spec §3 — hover state baseline; rich tooltip is deferred).
 *
 * Out of TC-FE-06 scope (left as Tech Debt for a follow-up TC):
 *  - The hover *tooltip* with pt-BR link name, status, flags (GraphEdge
 *    §3 row "Hover"). The TC contract only requires solid/dashed,
 *    label and ConfidenceState colouring — the tooltip composes
 *    multiple unrelated lookups (link-type map, status formatter,
 *    flag formatter) that warrant their own component spec follow-up.
 *
 * Normative sources:
 *  - docs/specs/front/components/GraphEdge.component.spec.md §1–§3
 *  - docs/specs/front/components/GraphSpace.component.spec.md §7
 *  - tokens.md §7 (link-type colours + temporal/stable stroke distinction)
 */
import type { FC } from "react";
import { BaseEdge, EdgeLabelRenderer, getBezierPath } from "@xyflow/react";
import type { ConfidenceState } from "@/components/ds/StateBadge";
import { cn } from "@/lib/cn";
import type { GraphEdgeAdapterProps } from "./GraphEdgeAdapter.types";

/**
 * Link-type slug → Tailwind stroke class. Listed as full literal strings so
 * the Tailwind v4 scanner keeps every variant (dynamic class concatenation
 * would silently drop most of them — Tailwind cannot infer them at scan
 * time). The 13 link types are the normative catalog from
 * `remember-modelagem-v7.md §15.2` + tokens.md §7.
 *
 * Slug format is snake_case on the wire (`participates_in`); CSS tokens are
 * kebab-case (`--color-link-participates-in`). The conversion is encoded in
 * this lookup table — never inferred at runtime — so a typo'd slug fails
 * loud (falls through to the neutral fallback) instead of producing a
 * silently-invented class.
 */
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

/** Neutral fallback for unknown link slugs (open ontology — G-B). */
const FALLBACK_STROKE_CLASS = "stroke-link-related-to";

/**
 * ConfidenceState override → Tailwind stroke class. Returns `null` when the
 * state does NOT override the stroke colour (i.e. `accepted` / `low-confidence`
 * fall through to the LinkType colour above).
 *
 * Mapping per `GraphEdge.component.spec.md §3`:
 *  - uncertain  → `--color-state-uncertain`  (amber)
 *  - disputed   → `--color-state-disputed`   (orange)
 *  - superseded → `--color-state-superseded` (muted grey)
 *  - accepted   → no override
 *  - low-confidence → no override (not normally rendered on edges; the
 *    derivation in lib/map.ts may emit it for diagnostic UIs)
 */
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
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
  selected,
}) => {
  // Defensive: React Flow may briefly call the edge renderer without `data`
  // during reconciliation (e.g. mid-reveal). Render nothing in that case
  // instead of crashing.
  if (!data) {
    return null;
  }

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Stroke colour: confidence-state override wins; otherwise link-type token.
  const stateClass = stateStrokeClass(data.state);
  const linkClass = LINK_STROKE_CLASS[data.label] ?? FALLBACK_STROKE_CLASS;
  const strokeColorClass = stateClass ?? linkClass;

  // Dash pattern: per §3, `uncertain` always reads as dashed (uncertainty
  // supersedes the temporal/stable visual). Otherwise `isTemporal` drives it.
  const isUncertain = data.state === "uncertain";
  const isDashed = isUncertain || !data.isTemporal;
  // SVG `stroke-dasharray` is an SVG attribute, not a Tailwind class — there
  // is no token-style class that maps to dasharray. The string values "0" /
  // "4 4" are the literal SVG-spec values cited in tokens.md §7 / I-1, NOT
  // arbitrary CSS values — they are part of the SVG path's stroke contract.
  const strokeDasharray = isDashed ? "4 4" : "0";

  // Dim out-of-effect or superseded edges (§3 — "Out of effect" / "Superseded").
  const isDimmed = data.inEffect === false || data.state === "superseded";

  // `BaseEdge`'s `markerEnd` is typed as `string` under
  // `exactOptionalPropertyTypes` — passing an explicit `undefined` is rejected.
  // We spread the prop only when React Flow actually provides one.
  const markerProp = markerEnd ? { markerEnd } : {};

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        {...markerProp}
        // `aria-hidden` on the edge — relationship info is announced via
        // node aria-labels + NodeDetailPanel (§8 accessibility).
        aria-hidden="true"
        // Stroke colour comes from a Tailwind utility (token-driven). Width
        // and hover-width use the `--border-*` tokens via Tailwind's
        // arbitrary syntax (the documented v4 pattern — tokens.md §7.1).
        // Selected toggles to `--border-thick`.
        className={cn(
          strokeColorClass,
          "[stroke-width:var(--border-thin)]",
          "hover:[stroke-width:var(--border-2)]",
          selected && "[stroke-width:var(--border-thick)]",
          isDimmed && "opacity-40",
        )}
        // SVG-spec attribute (NOT React inline CSS — `style=""` on HTML is
        // banned, but `strokeDasharray` is an SVG path attribute and is the
        // only spec-compliant way to set the dash pattern dynamically).
        strokeDasharray={strokeDasharray}
      />
      <EdgeLabelRenderer>
        <div
          // Position derived by React Flow's getBezierPath label centre. The
          // transform is a *computed coordinate*, not a styling decision —
          // it is the documented pattern for EdgeLabelRenderer (tokens.md §14
          // exception clause: dynamic values with no token equivalent).
          // eslint-disable-next-line react/forbid-dom-props
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: "all",
          }}
          className={cn(
            "rounded-sm bg-surface-glass-panel px-xs py-xs",
            "text-caption text-content",
            "border border-border-glass",
            // Selectable label: keep CSS `position: absolute` plus the
            // pointer-events override so React Flow's nopan/nodrag overlays
            // do not eat the label's hover region.
            "nodrag nopan",
            isDimmed && "opacity-40",
          )}
        >
          {data.label}
        </div>
      </EdgeLabelRenderer>
    </>
  );
};
