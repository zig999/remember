/**
 * graph feature — wire → surface mapping (TC-FE-01).
 *
 * Pure code (Golden Rule 5 — no LLM): three small mappers consumed by the
 * SSE `graph_delta` dispatcher in `features/chat/api/useSendMessage.ts`.
 *
 *  - `mapNodeType(wireType)` → `GraphNodeType`. Safe fallback for unknown
 *    slugs — the catalog is open (memo `ontology-extension-playbook`), so
 *    new NodeTypes may arrive before the closed `GraphNodeType` union is
 *    extended. We never throw — we return `"concept"` (the most neutral
 *    type in the union, used for abstract / unclassified nodes by the
 *    seed catalog — see migration `0001_seed.sql`). UC-CG-12, G-B.
 *
 *  - `deriveNodeState(status)` → `ConfidenceState | undefined`. **Status
 *    ONLY** (I-2) — nodes do not carry `flags`. `merged` / `deleted` map to
 *    `undefined` because the dispatcher filters those nodes out **before**
 *    they reach the surface shape; returning `undefined` here is the
 *    contract that flags them as "filter me out" rather than letting them
 *    render as something arbitrary.
 *
 *  - `deriveLinkState(status, flags)` → `ConfidenceState`. Links carry both
 *    a status and a flag set. Precedence (highest to lowest):
 *      1. `superseded` status → `"superseded"`
 *      2. `disputed` flag → `"disputed"`
 *      3. `low_confidence` flag → `"low-confidence"`
 *      4. `uncertain` flag → `"uncertain"`
 *      5. otherwise → `"accepted"`
 *    This mirrors the §3.5 / §6.6 ConfidenceState vocabulary in
 *    `remember-modelagem-v7.md` and the StateBadge spec.
 *
 * Normative sources:
 *  - temp/chat-graphspace-plan.md Rev. 2026-06-21 §4.2 (mappers spec)
 *  - docs/specs/front/components/GraphSpace.component.spec.md §2 (G-B, I-2)
 *  - components/ds/StateBadge/StateBadge.types.ts (ConfidenceState canon)
 */
import type { GraphNodeType } from "@/components/ds/GraphNode";
import type { ConfidenceState } from "@/components/ds/StateBadge";
import type { GraphLinkWireFlag, GraphNodeWireStatus } from "../types";

/**
 * The 10 normative NodeTypes. Mirrored from `GraphNodeType` as a runtime
 * Set so we can answer "is this slug in the closed union?" in O(1) without
 * a switch-statement that has to be kept in lockstep.
 */
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

/** Fallback type for unknown wire slugs. `concept` is the most neutral
 *  member of the union — used by the seed catalog for abstract /
 *  unclassified nodes (`0001_seed.sql`). */
const FALLBACK_NODE_TYPE: GraphNodeType = "concept";

/**
 * Map an open-catalog wire slug to the closed `GraphNodeType` union.
 *
 * - Never throws for any input — unknown slugs collapse to the fallback.
 * - Trims and lowercases input defensively before lookup so a trailing
 *   space or accidental casing variant from the wire still matches.
 *
 * @param wireType — the `node_type` slug from `GraphNodeWire`.
 * @returns a valid `GraphNodeType`. Defaults to `"concept"` when the slug
 *          is not in the closed union (UC-CG-12, G-B).
 */
export function mapNodeType(wireType: string): GraphNodeType {
  // Defensive normalization — wire is supposed to be a slug, but trimming
  // costs us nothing and avoids a class of brittle-match bugs.
  const normalized = wireType.trim().toLowerCase();
  return KNOWN_NODE_TYPES.has(normalized as GraphNodeType)
    ? (normalized as GraphNodeType)
    : FALLBACK_NODE_TYPE;
}

/**
 * Derive a node's visible confidence state from its wire `status` ALONE.
 *
 * Per I-2 in the plan, nodes do NOT carry flags — only links do. This
 * function therefore takes no `flags` argument.
 *
 *  | status         | result               | reason                            |
 *  |----------------|----------------------|-----------------------------------|
 *  | "active"       | "accepted"           | green StateBadge                  |
 *  | "needs_review" | "uncertain"          | amber StateBadge                  |
 *  | "merged"       | undefined            | filter signal — node hidden       |
 *  | "deleted"      | undefined            | filter signal — node hidden       |
 *
 * @returns `undefined` for `merged` / `deleted` — the dispatcher uses this
 *          as the filter signal (do not include this node in the surface
 *          shape). Returning a sentinel like `"hidden"` would force every
 *          downstream consumer to handle a value that should never reach
 *          the canvas.
 */
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
      // Exhaustiveness check — TypeScript will surface a compile error if a
      // new `GraphNodeWireStatus` member is added without updating this
      // function. At runtime, the default is defensive: an unknown status
      // is treated like `merged`/`deleted` (hidden).
      return undefined;
  }
}

/**
 * Derive a link's visible confidence state from its wire `status` and
 * `flags`. Unlike nodes, links carry both — the resolver walks them in
 * precedence order so the strongest signal wins (a `disputed` flag on a
 * `superseded` link still renders as `superseded`, because supersession is
 * a historical fact and disputed/uncertain are review states).
 *
 * @param status — wire `status` (free string — `superseded` is the only
 *                 one we branch on; everything else falls through).
 * @param flags  — wire `flags[]` (may be undefined or empty).
 * @returns the matching ConfidenceState; `"accepted"` is the default when
 *          no negative signal is present.
 */
export function deriveLinkState(
  status: string | undefined,
  flags: readonly GraphLinkWireFlag[] | undefined,
): ConfidenceState {
  if (status === "superseded") {
    return "superseded";
  }
  // We accept either undefined or an empty array — both mean "no flags".
  if (flags && flags.length > 0) {
    // Precedence order: disputed > low_confidence > uncertain. Picked to
    // match the StateBadge palette severity ladder (disputed is the
    // strongest review signal; uncertain is the softest).
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

/**
 * Resolve the visible pt-BR display label for a link from the wire payload.
 *
 * The backend projects `link_type_label` (catalog-resolved label, e.g.
 * `"participa de"`) alongside the slug `link_type` (`"participates_in"`). The
 * frontend renders the label — never the slug — but legacy frames or unknown
 * link types may omit the projection. In that case we humanize the slug
 * (underscores → spaces) as a graceful fallback (GraphEdge.spec §2, §7
 * Scenario 8).
 *
 * The slug stays the lookup key for `LINK_STROKE_CLASS` in `GraphEdgeAdapter`
 * — it is intentionally not consumed here.
 *
 * @param linkType — the wire `link_type` slug (snake_case).
 * @param linkTypeLabel — the wire `link_type_label` projection (optional).
 * @returns the visible label string; never empty when `linkType` is non-empty.
 */
export function mapLinkTypeLabel(
  linkType: string,
  linkTypeLabel: string | undefined,
): string {
  // We trim the wire label defensively. A backend bug that ever emitted an
  // empty string (instead of omitting the field) would otherwise render a
  // blank pill on the canvas, with no visible signal of the regression.
  if (linkTypeLabel !== undefined && linkTypeLabel.trim().length > 0) {
    return linkTypeLabel;
  }
  // Fallback: humanize the slug. We do NOT lowercase or title-case here —
  // slugs are already lowercase and the fallback is intentionally minimal
  // (replacing `_` with spaces). The user-facing surface for known
  // link types is always the backend-resolved label; the fallback is for
  // the unknown-slug case and is meant to look slightly different (no
  // pt-BR translation) so a missing projection is visually noticeable.
  return linkType.replace(/_/g, " ");
}
