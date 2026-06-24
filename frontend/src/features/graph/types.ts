/**
 * graph feature — domain types (TC-FE-01).
 *
 * Wire shapes (snake_case) match the SSE `graph_delta` payload defined in
 * `temp/chat-graphspace-plan.md` §4.1. Surface shapes (camelCase) are the
 * mapped form consumed by `GraphSpace` and its subcomponents (§4.2).
 *
 * Invariants pinned by this module:
 *  - `GraphStatus` has exactly 5 values — there is NO `"idle"` (I-4). Adding
 *    `"idle"` would re-introduce the empty/idle ambiguity the plan removed.
 *  - `GraphNodeData.state` is derived from the node `status` field only —
 *    nodes do not carry `flags` (I-2 — flags live on links). The wire
 *    `GraphNodeWire` therefore intentionally omits a `flags` field.
 *  - `GraphLinkData.isTemporal` is a boolean — drives stroke style in
 *    `GraphEdge` (tokens.md §7 — temporal → solid, stable → dashed). The
 *    wire field is `is_temporal`; mapping happens in `lib/map.ts` (out of
 *    scope for this Task Contract, which delivers the types only).
 *
 * Normative sources:
 *  - temp/chat-graphspace-plan.md Rev. 2026-06-21 §4.1, §4.2
 *  - docs/specs/front/components/GraphSpace.component.spec.md v1.0.0 §2
 *  - docs/specs/front/design-system/tokens.md §7
 */
import type { GraphNodeType } from "@/components/ds/GraphNode";
import type { ConfidenceState } from "@/components/ds/StateBadge";

/* -------------------------------------------------------------------------
 * Surface shapes (camelCase) — consumed by GraphSpace, GraphNodeAdapter,
 * GraphEdgeAdapter, and the chat dispatcher after mapping the wire payload.
 * ------------------------------------------------------------------------- */

/** One node ready to render in React Flow. `type` has already been mapped
 *  via `mapNodeType()` — unknown wire types collapse to the safe fallback
 *  (UC-CG-12, G-B). */
export interface GraphNodeData {
  /** UUID — used as the React Flow node id. */
  readonly id: string;
  /** Mapped NodeType — drives icon + accent color in `ds/GraphNode`. */
  readonly type: GraphNodeType;
  /** Primary label (canonical_name from the wire). */
  readonly label: string;
  /** Confidence state — derived ONLY from the node `status` field (I-2).
   *  `undefined` is emitted for `status` values that do not map to a visible
   *  state (e.g. `merged`, `deleted` — those nodes are filtered out by the
   *  dispatcher before reaching this surface shape). */
  readonly state?: ConfidenceState;
  /** Optional human-readable subtitle (e.g. pt-BR type name). */
  readonly subtitle?: string;
}

/** One link/edge ready to render. */
export interface GraphLinkData {
  /** UUID — used as the React Flow edge id. */
  readonly id: string;
  /** GraphNodeData.id of the source endpoint. */
  readonly source: string;
  /** GraphNodeData.id of the target endpoint. */
  readonly target: string;
  /** Link type slug (`participates_in`, `member_of`, …). Used **exclusively**
   *  as the stroke-color lookup key (`LINK_STROKE_CLASS[label]`) and as a
   *  diagnostic id — **never** rendered as visible text. The visible text is
   *  `linkTypeLabel`. */
  readonly label: string;
  /** Catalog-resolved pt-BR display label (e.g. `"participa de"`). Sourced
   *  from `link_type_label` on the wire (projected by the backend
   *  `graph-normalizer.ts`); falls back to the humanized slug
   *  (`link_type.replace(/_/g, " ")`) when the wire field is absent (legacy
   *  frames / unknown link types). This is the only string rendered along
   *  the edge path and in the hover tooltip — see GraphEdge.spec §2. */
  readonly linkTypeLabel: string;
  /** `true` → solid stroke; `false` → dashed stroke (tokens.md §7, I-1). */
  readonly isTemporal: boolean;
  /** Optional: dim the edge when `false` (out-of-effect today). */
  readonly inEffect?: boolean;
  /** Confidence state — derived from link `status` + `flags` (links carry
   *  flags; nodes do not — I-2). */
  readonly state?: ConfidenceState;
}

/** A single delta as it lands in `useGraphStore.addNodes`. One delta is
 *  emitted per graph-producing tool call (one per `tool_result` in a turn). */
export interface GraphDelta {
  /** Which tool produced this delta (`traverse` / `get_node` / `list_nodes`
   *  / `search`). Used for analytics + debugging — never branches the UI. */
  readonly sourceTool: string;
  readonly nodes: readonly GraphNodeData[];
  readonly links: readonly GraphLinkData[];
}

/** Processing state of the graph pane (REQ-2). Exactly 5 values — no
 *  `"idle"` (I-4). State transitions are driven by the chat dispatcher in
 *  `features/chat/api/useSendMessage.ts`. */
export type GraphStatus = "empty" | "loading" | "revealing" | "ready" | "error";

/* -------------------------------------------------------------------------
 * Wire shapes (snake_case) — exactly mirror the backend SSE `graph_delta`
 * payload (plan §4.1). The dispatcher receives these and feeds them to the
 * mapping layer; nothing else in the frontend should touch them.
 * ------------------------------------------------------------------------- */

/** Wire status from the backend `knowledge_node.status` column. `merged` and
 *  `deleted` are valid backend values but are filtered out by the dispatcher
 *  before reaching the surface store (I-2). */
export type GraphNodeWireStatus = "active" | "needs_review" | "merged" | "deleted";

/** Wire flags that may appear on a link assertion. Nodes do NOT carry
 *  `flags` — the field intentionally lives on `GraphLinkWire` only (I-2). */
export type GraphLinkWireFlag = "uncertain" | "disputed" | "low_confidence";

/** Node as it arrives in the SSE `graph_delta.nodes[]` array. */
export interface GraphNodeWire {
  readonly id: string;
  /** Open-catalog slug — may be outside the closed `GraphNodeType` union
   *  (the ontology is extensible — G-B). `mapNodeType` falls back to
   *  `"concept"` for unknown slugs. */
  readonly node_type: string;
  readonly canonical_name: string;
  readonly status: GraphNodeWireStatus;
}

/** Link as it arrives in the SSE `graph_delta.links[]` array. */
export interface GraphLinkWire {
  readonly id: string;
  readonly source_node_id: string;
  readonly target_node_id: string;
  readonly link_type: string;
  /** Optional: catalog-resolved pt-BR display label for `link_type`
   *  (e.g. `"participa de"` for `link_type="participates_in"`). Projected
   *  by the backend `graph-normalizer.ts` from the LinkType catalog
   *  (`backend/src/modules/.../graph-normalizer.ts`). Older frames or
   *  unknown link types omit it; the mapper falls back to the humanized
   *  slug in that case — see `lib/map.ts#mapLinkTypeLabel`. */
  readonly link_type_label?: string;
  /** From the LinkType catalog (`is_temporal` column) — temporal → solid,
   *  stable → dashed (tokens.md §7, I-1). */
  readonly is_temporal: boolean;
  /** Optional: backend may include the derived `is_in_effect` view; the
   *  frontend uses it to dim out-of-effect edges. */
  readonly is_in_effect?: boolean;
  /** Optional: assertion status. Combines with `flags` in `deriveLinkState`. */
  readonly status?: string;
  /** Optional: link assertion flags (uncertain / disputed / low_confidence). */
  readonly flags?: readonly GraphLinkWireFlag[];
}

/** Full SSE `graph_delta` frame payload. */
export interface GraphDeltaWire {
  readonly source_tool: string;
  readonly nodes: readonly GraphNodeWire[];
  readonly links: readonly GraphLinkWire[];
}
