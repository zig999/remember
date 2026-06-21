/**
 * NodeDetail — wire + surface shapes for `GET /api/v1/nodes/:id` (TC-FE-08).
 *
 * Wire shapes mirror `docs/specs/domains/knowledge-graph/openapi.yaml`
 * (schemas `NodeDetail`, `NodeSummary`, `NodeAlias`, `AttributeDetail`). Only
 * the fields the SPA actually displays in the v1 `NodeDetailPanel` are
 * declared — the response includes a full `provenance[]` per attribute but
 * v1 hides provenance (deferred to the `/graph` full-screen wave, per
 * `NodeDetailPanel.component.spec.md §1 "Does NOT"`).
 *
 * Surface shapes (camelCase) are the post-transform form consumed by
 * `NodeDetailPanel`. The transform is intentionally minimal — most fields
 * pass through verbatim; the only adaptations are:
 *  - `node.status` → `ConfidenceState` (for the `StateBadge`) via
 *    `mapNodeStatusToBadge` (spec §9 "Response transforms" row).
 *  - Attributes sorted: `in_effect: true` first, then by `attribute_key`
 *    ascending (spec §9).
 *  - `valid_from` / `valid_to` formatted as `DD/MM/YYYY` (pt-BR) — the raw
 *    ISO strings stay on the surface object too, so a future panel feature
 *    (e.g. an "edit valid_to" affordance, out of v1 scope) does not have to
 *    re-parse the wire date.
 */
import type { ConfidenceState } from "@/components/ds/StateBadge";

/* -------------------------------------------------------------------------
 * Wire shapes — snake_case, mirror openapi.yaml exactly.
 * Only the consumed subset of `AttributeDetail` is declared; the wire
 * structurally has more fields but the type stays narrow on purpose so a
 * regression that starts reading an unmodelled field would not silently pass.
 * ------------------------------------------------------------------------- */

/** Node status — closed enum from the openapi `NodeStatus` schema. */
export type NodeWireStatus = "active" | "needs_review" | "merged" | "deleted";

/** Assertion status — closed enum from openapi `AssertionStatus`. */
export type AttributeWireAssertionStatus =
  | "proposed"
  | "accepted"
  | "uncertain"
  | "disputed"
  | "superseded";

/** Effective status — closed enum from openapi `EffectiveStatus`. */
export type AttributeWireEffectiveStatus =
  | "active"
  | "inactive"
  | "uncertain"
  | "disputed";

/** Wire alias — kept verbatim on the surface shape (no transform). */
export interface NodeAliasWire {
  readonly id: string;
  readonly alias: string;
  readonly kind: "canonical" | "alias";
  readonly created_at?: string;
}

/** Wire attribute — only the fields used by the v1 panel are declared. */
export interface AttributeWire {
  readonly id: string;
  readonly node_id: string;
  readonly attribute_key: string;
  readonly value_type: "text" | "number" | "date" | "bool";
  readonly value: string;
  readonly status: AttributeWireAssertionStatus;
  readonly effective_status: AttributeWireEffectiveStatus;
  readonly is_current: boolean;
  readonly is_in_effect: boolean;
  readonly confidence: number;
  readonly valid_from: string | null;
  readonly valid_to: string | null;
}

/** Wire node summary. */
export interface NodeSummaryWire {
  readonly id: string;
  readonly node_type: string;
  readonly canonical_name: string;
  readonly status: NodeWireStatus;
  readonly merged_into_node_id?: string | null;
}

/** Full `GET /api/v1/nodes/:id` response payload (envelope `result`). */
export interface NodeDetailWire {
  readonly node: NodeSummaryWire;
  readonly aliases: ReadonlyArray<NodeAliasWire>;
  readonly attributes: ReadonlyArray<AttributeWire>;
}

/* -------------------------------------------------------------------------
 * Surface shapes — camelCase, consumed by NodeDetailPanel.
 * ------------------------------------------------------------------------- */

export interface NodeAttributeView {
  readonly id: string;
  readonly key: string;
  readonly value: string;
  readonly valueType: AttributeWire["value_type"];
  readonly effectiveStatus: AttributeWireEffectiveStatus;
  readonly isInEffect: boolean;
  /** Confidence state — derived from `effective_status` + `status` for the
   *  StateBadge inside the attributes table. */
  readonly state: ConfidenceState;
  /** Human-readable pt-BR date (DD/MM/YYYY) or `null` when the wire date
   *  was `null` (open-ended). */
  readonly validFromLabel: string | null;
  readonly validToLabel: string | null;
}

export interface NodeAliasView {
  readonly id: string;
  readonly alias: string;
  readonly kind: NodeAliasWire["kind"];
}

export interface NodeDetailView {
  readonly id: string;
  readonly canonicalName: string;
  readonly nodeType: string;
  readonly status: NodeWireStatus;
  /** Mapped state for the node-level StateBadge in the panel header. */
  readonly badgeState: ConfidenceState;
  /** Present only when `status = 'merged'`. */
  readonly mergedIntoNodeId: string | null;
  readonly aliases: ReadonlyArray<NodeAliasView>;
  readonly attributes: ReadonlyArray<NodeAttributeView>;
}
