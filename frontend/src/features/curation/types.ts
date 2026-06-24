/**
 * Curation feature — domain types consumed by hooks + UI.
 *
 * Spec references:
 *  - docs/specs/front/features/curadoria.feature.spec.md §1 / §4 (response transforms)
 *  - docs/specs/domains/curation/openapi.yaml (request/response shapes)
 *  - docs/specs/domains/query-retrieval/openapi.yaml (ProvenanceResponse,
 *    AcceptedFragmentList)
 *  - docs/specs/domains/knowledge-graph/openapi.yaml (NodeDetail, LinkHistory,
 *    AttributeHistory)
 *
 * Wire shapes (Wire suffix) mirror snake_case + ISO date strings exactly as
 * the BFF returns them. Domain shapes (no suffix) are the SPA-internal view
 * AFTER `_transforms.ts` applied: ISO timestamp strings become `Date`, and
 * KG/QR envelopes are unwrapped (the curation REST domain is bare-body on
 * 2xx — see curadoria.feature.spec.md §6).
 *
 * Only fields the SPA actually consumes today are declared. Adding a UI
 * binding later is an additive change here.
 */

/* ------------------------------------------------------------------ *
 * Enums (mirror openapi.yaml)                                         *
 * ------------------------------------------------------------------ */

export type ReviewQueueKind = "entity_match" | "disputed";
export type ItemKind = "link" | "attribute";
export type EntityMatchDecision = "merge_into" | "keep_separate";
export type DisputeDecision = "prefer_one" | "adjust_periods" | "keep_disputed";
export type NodeStatus = "active" | "needs_review" | "merged" | "deleted";
export type AssertionStatus =
  | "active"
  | "uncertain"
  | "disputed"
  | "superseded"
  | "deleted";
export type ValidFromSource = "stated" | "document" | "received";
export type EffectiveStatus =
  | "active"
  | "uncertain"
  | "disputed"
  | "superseded"
  | "deleted";
export type AssertionFlag = "uncertain" | "disputed" | "low_confidence";
export type AttributeValueType = "text" | "date" | "number" | "bool";

/* ------------------------------------------------------------------ *
 * Wire shapes — exact BFF JSON                                        *
 * ------------------------------------------------------------------ */

export interface EntityMatchCandidateWire {
  readonly candidate_node_id: string;
  readonly canonical_name: string;
  readonly similarity: number;
}

export interface EntityMatchQueueItemWire {
  readonly kind: "entity_match";
  readonly node_id: string;
  readonly node_type: string;
  readonly canonical_name: string;
  readonly candidates: ReadonlyArray<EntityMatchCandidateWire>;
  readonly created_at: string;
}

export interface DisputedItemSideWire {
  readonly item_id: string;
  readonly value: string | null;
  readonly target_node_id?: string | null;
  readonly valid_from: string | null;
  readonly valid_to: string | null;
  readonly valid_from_source: ValidFromSource;
  readonly confidence: number;
  readonly status: AssertionStatus;
}

export interface DisputeScopeWire {
  readonly source_node_id: string | null;
  readonly target_node_id: string | null;
  readonly link_type: string | null;
  readonly node_id: string | null;
  readonly attribute_key: string | null;
}

export interface DisputeQueueItemWire {
  readonly kind: "disputed";
  readonly item_kind: ItemKind;
  readonly scope: DisputeScopeWire;
  readonly sides: ReadonlyArray<DisputedItemSideWire>;
  readonly created_at: string;
}

export type ReviewQueueItemWire =
  | EntityMatchQueueItemWire
  | DisputeQueueItemWire;

export interface ReviewQueueListWire {
  readonly total: number;
  readonly limit: number;
  readonly offset: number;
  readonly items: ReadonlyArray<ReviewQueueItemWire>;
}

export interface CurationMetricsWire {
  readonly accept_rate: number;
  readonly reject_rate_by_code: Readonly<Record<string, number>>;
  readonly needs_review_count: number;
  readonly uncertain_count: number;
  readonly disputed_count: number;
  readonly entity_match_queue_count: number;
  readonly disputed_queue_count: number;
  readonly computed_at: string;
}

/* ------------------------------------------------------------------ *
 * Domain shapes — `createdAt: Date` instead of ISO string             *
 * ------------------------------------------------------------------ */

export interface EntityMatchCandidate {
  readonly candidateNodeId: string;
  readonly canonicalName: string;
  readonly similarity: number;
}

export interface EntityMatchQueueItem {
  readonly kind: "entity_match";
  readonly nodeId: string;
  readonly nodeType: string;
  readonly canonicalName: string;
  readonly candidates: ReadonlyArray<EntityMatchCandidate>;
  readonly createdAt: Date;
}

export interface DisputedItemSide {
  readonly itemId: string;
  readonly value: string | null;
  readonly targetNodeId: string | null;
  readonly validFrom: Date | null;
  readonly validTo: Date | null;
  readonly validFromSource: ValidFromSource;
  readonly confidence: number;
  readonly status: AssertionStatus;
}

export interface DisputeScope {
  readonly sourceNodeId: string | null;
  readonly targetNodeId: string | null;
  readonly linkType: string | null;
  readonly nodeId: string | null;
  readonly attributeKey: string | null;
}

export interface DisputeQueueItem {
  readonly kind: "disputed";
  readonly itemKind: ItemKind;
  readonly scope: DisputeScope;
  readonly sides: ReadonlyArray<DisputedItemSide>;
  readonly createdAt: Date;
}

export type ReviewQueueItem = EntityMatchQueueItem | DisputeQueueItem;

export interface ReviewQueueList {
  readonly total: number;
  readonly limit: number;
  readonly offset: number;
  readonly items: ReadonlyArray<ReviewQueueItem>;
}

export interface CurationMetrics {
  readonly acceptRate: number;
  readonly rejectRateByCode: Readonly<Record<string, number>>;
  readonly needsReviewCount: number;
  readonly uncertainCount: number;
  readonly disputedCount: number;
  readonly entityMatchQueueCount: number;
  readonly disputedQueueCount: number;
  readonly computedAt: Date;
}

/* ------------------------------------------------------------------ *
 * Mutation request/response (DTOs)                                    *
 * ------------------------------------------------------------------ */

export interface ResolveEntityMatchRequest {
  readonly decision: EntityMatchDecision;
  readonly target_node_id?: string | null;
  readonly reason?: string | null;
}

export interface ResolveEntityMatchAffected {
  readonly links_repointed?: number;
  readonly attributes_repointed?: number;
  readonly aliases_copied?: number;
  readonly path_compressed_nodes?: number;
}

export interface ResolveEntityMatchResponse {
  readonly node_id: string;
  readonly decision: EntityMatchDecision;
  readonly resulting_status: NodeStatus;
  readonly target_node_id?: string | null;
  readonly affected?: ResolveEntityMatchAffected;
  readonly action_id: string;
}

export interface MergeNodesRequest {
  readonly survivor_id: string;
  readonly absorbed_id: string;
  readonly reason: string;
}

export interface MergeNodesResponse {
  readonly survivor_id: string;
  readonly absorbed_id: string;
  readonly affected: Required<ResolveEntityMatchAffected>;
  readonly action_id: string;
}

export interface AdjustedPeriod {
  readonly item_id: string;
  readonly valid_from: string | null;
  readonly valid_to?: string | null;
}

export interface ResolveDisputeRequest {
  readonly item_kind: ItemKind;
  readonly item_ids: ReadonlyArray<string>;
  readonly decision: DisputeDecision;
  readonly winner_id?: string | null;
  readonly periods?: ReadonlyArray<AdjustedPeriod> | null;
  readonly reason?: string | null;
}

export interface ResolveDisputeItemResult {
  readonly item_id: string;
  readonly resulting_status: AssertionStatus;
  readonly valid_from?: string | null;
  readonly valid_to?: string | null;
}

export interface ResolveDisputeResponse {
  readonly item_kind: ItemKind;
  readonly decision: DisputeDecision;
  readonly items: ReadonlyArray<ResolveDisputeItemResult>;
  readonly action_id: string;
}

export interface ConfirmItemRequest {
  readonly item_kind: ItemKind;
  readonly item_id: string;
  readonly reason?: string | null;
}

export interface RejectItemRequest {
  readonly item_kind: ItemKind;
  readonly item_id: string;
  readonly reason: string;
}

export interface ItemActionResponse {
  readonly item_kind: ItemKind;
  readonly item_id: string;
  readonly resulting_status: AssertionStatus;
  readonly action_id: string;
}

export interface CorrectedValues {
  readonly value?: string | null;
  readonly target_node_id?: string | null;
  readonly valid_from?: string | null;
  readonly valid_to?: string | null;
  readonly valid_from_source?: ValidFromSource;
  readonly valid_from_fragment_id?: string | null;
}

export interface CorrectItemRequest {
  readonly item_kind: ItemKind;
  readonly item_id: string;
  readonly corrected: CorrectedValues;
  readonly reason: string;
}

export interface CorrectItemResponse {
  readonly item_kind: ItemKind;
  readonly predecessor_id: string;
  readonly new_item_id: string;
  readonly action_id: string;
}

/* ------------------------------------------------------------------ *
 * Provenance — wire + domain                                          *
 * ------------------------------------------------------------------ */

export interface ProvenanceRawInformationWire {
  readonly id: string;
  readonly source_type: string;
  readonly received_at: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface ProvenanceChunkWire {
  readonly id: string;
  readonly chunk_index: number;
  readonly offset_start: number;
  readonly offset_end: number;
  readonly excerpt: string;
  readonly locator?: Readonly<Record<string, unknown>>;
  readonly raw_information: ProvenanceRawInformationWire;
}

export interface ProvenanceFragmentWire {
  readonly id: string;
  readonly text: string;
  readonly confidence: number;
  readonly status: string;
  readonly chunks: ReadonlyArray<ProvenanceChunkWire>;
}

export interface ProvenanceResponseWire {
  readonly fragments: ReadonlyArray<ProvenanceFragmentWire>;
}

export interface ProvenanceRawInformation {
  readonly id: string;
  readonly sourceType: string;
  readonly receivedAt: Date;
  readonly metadata: Readonly<Record<string, unknown>>;
}

export interface ProvenanceChunk {
  readonly id: string;
  readonly chunkIndex: number;
  readonly offsetStart: number;
  readonly offsetEnd: number;
  readonly excerpt: string;
  readonly locator: Readonly<Record<string, unknown>>;
  readonly rawInformation: ProvenanceRawInformation;
}

export interface ProvenanceFragment {
  readonly id: string;
  readonly text: string;
  readonly confidence: number;
  readonly status: string;
  readonly chunks: ReadonlyArray<ProvenanceChunk>;
}

export interface ProvenanceResponse {
  readonly fragments: ReadonlyArray<ProvenanceFragment>;
}

/* ---- Accepted-fragment listing (R2) ---- */

export interface AcceptedFragmentSourceRefWire {
  readonly raw_information_id: string;
  readonly chunk_index: number;
  readonly source_type: string;
  readonly received_at: string;
  readonly document_title?: string | null;
}

export interface AcceptedFragmentItemWire {
  readonly fragment_id: string;
  readonly text: string;
  readonly confidence: number;
  readonly llm_run_id: string;
  readonly created_at: string;
  readonly source: AcceptedFragmentSourceRefWire;
}

export interface AcceptedFragmentListWire {
  readonly total: number;
  readonly limit: number;
  readonly offset: number;
  readonly items: ReadonlyArray<AcceptedFragmentItemWire>;
}

export interface AcceptedFragmentSourceRef {
  readonly rawInformationId: string;
  readonly chunkIndex: number;
  readonly sourceType: string;
  readonly receivedAt: Date;
  readonly documentTitle: string | null;
}

export interface AcceptedFragmentItem {
  readonly fragmentId: string;
  readonly text: string;
  readonly confidence: number;
  readonly llmRunId: string;
  readonly createdAt: Date;
  readonly source: AcceptedFragmentSourceRef;
}

export interface AcceptedFragmentList {
  readonly total: number;
  readonly limit: number;
  readonly offset: number;
  readonly items: ReadonlyArray<AcceptedFragmentItem>;
}

/* ------------------------------------------------------------------ *
 * Knowledge-graph node detail + history                               *
 * ------------------------------------------------------------------ */

export interface NodeSummaryWire {
  readonly id: string;
  readonly node_type: string;
  readonly canonical_name: string;
  readonly status: NodeStatus;
  readonly merged_into_node_id?: string | null;
}

export interface NodeAliasWire {
  readonly id: string;
  readonly alias: string;
  readonly kind: "canonical" | "alias";
  readonly created_at?: string;
}

export interface AttributeDetailWire {
  readonly id: string;
  readonly node_id: string;
  readonly attribute_key: string;
  readonly value_type: AttributeValueType;
  readonly value: string;
  readonly valid_from: string | null;
  readonly valid_to: string | null;
  readonly recorded_at: string;
  readonly superseded_at: string | null;
  readonly status: AssertionStatus;
  readonly effective_status: EffectiveStatus;
  readonly is_current: boolean;
  readonly is_in_effect: boolean;
  readonly confidence: number;
  readonly valid_from_source?: ValidFromSource | null;
  readonly flags?: ReadonlyArray<AssertionFlag>;
  readonly supersedes_attribute_id?: string | null;
  readonly provenance?: ReadonlyArray<unknown>;
}

export interface NodeDetailWire {
  readonly node: NodeSummaryWire;
  readonly aliases: ReadonlyArray<NodeAliasWire>;
  readonly attributes: ReadonlyArray<AttributeDetailWire>;
}

export interface NodeSummary {
  readonly id: string;
  readonly nodeType: string;
  readonly canonicalName: string;
  readonly status: NodeStatus;
  readonly mergedIntoNodeId: string | null;
}

export interface NodeAlias {
  readonly id: string;
  readonly alias: string;
  readonly kind: "canonical" | "alias";
  readonly createdAt: Date | null;
}

export interface AttributeDetail {
  readonly id: string;
  readonly nodeId: string;
  readonly attributeKey: string;
  readonly valueType: AttributeValueType;
  readonly value: string;
  readonly validFrom: Date | null;
  readonly validTo: Date | null;
  readonly recordedAt: Date;
  readonly supersededAt: Date | null;
  readonly status: AssertionStatus;
  readonly effectiveStatus: EffectiveStatus;
  readonly isCurrent: boolean;
  readonly isInEffect: boolean;
  readonly confidence: number;
  readonly validFromSource: ValidFromSource | null;
  readonly flags: ReadonlyArray<AssertionFlag>;
  readonly supersedesAttributeId: string | null;
}

export interface NodeDetail {
  readonly node: NodeSummary;
  readonly aliases: ReadonlyArray<NodeAlias>;
  readonly attributes: ReadonlyArray<AttributeDetail>;
}

export interface LinkDetailWire {
  readonly id: string;
  readonly source_node_id: string;
  readonly target_node_id: string;
  readonly link_type: string;
  readonly link_inverse_name: string;
  readonly valid_from: string | null;
  readonly valid_to: string | null;
  readonly recorded_at: string;
  readonly superseded_at: string | null;
  readonly status: AssertionStatus;
  readonly effective_status: EffectiveStatus;
  readonly is_current: boolean;
  readonly is_in_effect: boolean;
  readonly confidence: number;
  readonly valid_from_source?: ValidFromSource | null;
  readonly supersedes_link_id?: string | null;
}

export interface LinkDetail {
  readonly id: string;
  readonly sourceNodeId: string;
  readonly targetNodeId: string;
  readonly linkType: string;
  readonly linkInverseName: string;
  readonly validFrom: Date | null;
  readonly validTo: Date | null;
  readonly recordedAt: Date;
  readonly supersededAt: Date | null;
  readonly status: AssertionStatus;
  readonly effectiveStatus: EffectiveStatus;
  readonly isCurrent: boolean;
  readonly isInEffect: boolean;
  readonly confidence: number;
  readonly validFromSource: ValidFromSource | null;
  readonly supersedesLinkId: string | null;
}

export interface LinkHistoryResponseWire {
  readonly versions: ReadonlyArray<LinkDetailWire>;
}

export interface LinkHistoryResponse {
  readonly versions: ReadonlyArray<LinkDetail>;
}

export interface AttributeHistoryResponseWire {
  readonly versions: ReadonlyArray<AttributeDetailWire>;
}

export interface AttributeHistoryResponse {
  readonly versions: ReadonlyArray<AttributeDetail>;
}
