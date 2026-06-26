/**
 * Traversal — wire + surface shapes for `GET /api/v1/nodes/:id/traverse`
 * (dev_tc_001, Phase B of NodeDetailPanel v2.0).
 *
 * Wire shapes mirror `docs/specs/domains/knowledge-graph/openapi.yaml`
 * (schemas `TraversalResult`, `TraversalLink`, `NodeSummary`).
 *
 * The panel only consumes `depth=1&direction=both` so the surface trims the
 * wire payload to the fields actually rendered. Keeping the type narrow on
 * purpose: a regression that starts reading an unmodelled field would not
 * silently pass.
 */
import type {
  AttributeWireAssertionStatus,
  AttributeWireEffectiveStatus,
  NodeSummaryWire,
  ProvenanceEntryWire,
  ProvenanceEntryView,
} from "./node-detail.types";

/* -------------------------------------------------------------------------
 * Wire shapes (snake_case).
 * ------------------------------------------------------------------------- */

/** Wire `TraversalLink` — `LinkDetail` extended with `hop`/`score`. */
export interface TraversalLinkWire {
  readonly id: string;
  readonly source_node_id: string;
  readonly target_node_id: string;
  readonly link_type: string;
  readonly link_inverse_name: string;
  readonly status: AttributeWireAssertionStatus;
  readonly effective_status: AttributeWireEffectiveStatus;
  readonly is_current: boolean;
  readonly is_in_effect: boolean;
  readonly confidence: number;
  readonly valid_from: string | null;
  readonly valid_to: string | null;
  readonly recorded_at?: string;
  readonly superseded_at?: string | null;
  readonly flags?: ReadonlyArray<string>;
  readonly hop: number;
  readonly score: number;
  readonly provenance?: ReadonlyArray<ProvenanceEntryWire>;
}

export interface TraversalResultWire {
  readonly starting_node_id: string;
  readonly nodes: ReadonlyArray<NodeSummaryWire>;
  readonly links: ReadonlyArray<TraversalLinkWire>;
}

/* -------------------------------------------------------------------------
 * Surface shapes (camelCase).
 * ------------------------------------------------------------------------- */

/** Direction of a link relative to the panel's current node. */
export type LinkDirection = "outgoing" | "incoming";

export interface TraversalLinkView {
  readonly id: string;
  readonly linkType: string;
  /** Label rendered for the link kind — `link_type` for outgoing,
   *  `link_inverse_name` for incoming, mirroring spec §9 transform. */
  readonly directionLabel: string;
  readonly direction: LinkDirection;
  /** `"→"` for outgoing, `"←"` for incoming — used in the row arrow. */
  readonly directionArrow: "→" | "←";
  /** Canonical name of the OTHER endpoint (the neighbour). */
  readonly neighborName: string;
  readonly neighborNodeId: string;
  readonly neighborNodeType: string;
  readonly effectiveStatus: AttributeWireEffectiveStatus;
  readonly isInEffect: boolean;
  /** `"92%"`-style label for the link confidence. */
  readonly confidenceLabel: string;
  readonly confidence: number;
  readonly validFromLabel: string | null;
  readonly validToLabel: string | null;
  readonly flags: ReadonlyArray<string>;
  readonly provenance: ReadonlyArray<ProvenanceEntryView>;
}

export interface TraversalResultView {
  readonly startingNodeId: string;
  readonly links: ReadonlyArray<TraversalLinkView>;
}
