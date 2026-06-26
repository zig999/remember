/**
 * NodeDetail — wire + surface shapes for `GET /api/v1/nodes/:id` (TC-FE-08).
 *
 * Wire shapes mirror `docs/specs/domains/knowledge-graph/openapi.yaml`
 * (schemas `NodeDetail`, `NodeSummary`, `NodeAlias`, `AttributeDetail`,
 * `ProvenanceEntry`, `TraversalResult`, `TraversalLink`, `ProvenanceResponse`).
 *
 * v2.0 (progressive-disclosure wave, dev_tc_001): the wire `AttributeWire`
 * carries `provenance: ProvenanceEntry[]` (already returned by `getNodeById`)
 * — Phase A renders it inline without any extra fetch. Two new request
 * shapes are added: `TraversalResultWire` (Phase B, GET `/nodes/:id/traverse`)
 * and `ProvenanceResponseWire` (Phase C, GET `/provenance/{kind}/:id`).
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

/** Wire `ProvenanceEntry` — openapi `ProvenanceEntry` schema. */
export interface ProvenanceEntryWire {
  readonly fragment_id: string;
  readonly fragment_text: string;
  readonly confidence?: number;
  readonly raw_information_id?: string;
  readonly source_type?: string;
  readonly received_at?: string;
  readonly excerpt?: string;
}

/** Wire attribute — fields used by the panel (v2.0 includes `provenance`). */
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
  /** Phase A — inline provenance entries returned by `getNodeById`. */
  readonly provenance?: ReadonlyArray<ProvenanceEntryWire>;
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

/** Phase A — provenance entry surface shape (camelCase). */
export interface ProvenanceEntryView {
  readonly fragmentId: string;
  readonly fragmentText: string;
  /** Confidence formatted as integer percent (e.g. `"92%"`) — `null` when
   *  the wire field was missing. */
  readonly confidenceLabel: string | null;
  /** Raw 0..1 number kept for tests / future affordances. */
  readonly confidence: number | null;
  readonly rawInformationId: string | null;
  readonly sourceType: string | null;
  /** `DD/MM/YYYY` pt-BR label for `received_at` — `null` if absent. */
  readonly receivedAtLabel: string | null;
  readonly excerpt: string | null;
}

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
  /** Phase A — inline provenance entries (already in `getNodeById` payload).
   *  Defaults to `[]` when the wire field is absent. */
  readonly provenance: ReadonlyArray<ProvenanceEntryView>;
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
