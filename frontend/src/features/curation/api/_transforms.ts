/**
 * Curation api — pure wire→domain transforms.
 *
 * Spec references:
 *  - docs/specs/front/features/curadoria.feature.spec.md §4 (Response
 *    transforms table — `created_at: string` → `createdAt: Date`, valid_from
 *    / valid_to ISO date → `Date|null`, envelope unwrap for KG/QR).
 *  - Curation REST is bare-body on 2xx (§6) — no unwrap needed on curation
 *    responses.
 *
 * Design notes:
 *  - All functions are pure (no React, no fetch). They are exercised
 *    directly by unit tests in `__tests__/transforms.spec.ts`.
 *  - Dates are parsed with `new Date(iso)`. The BFF only ever emits valid
 *    ISO strings; the `parseIsoDate*` helpers ALSO accept and forward
 *    pre-parsed `Date` values (for tests that fixture domain shapes
 *    directly), but this isn't part of the wire contract.
 *  - "Date-only" fields (`valid_from` / `valid_to`) are parsed as UTC
 *    midnight: the BFF stores DATE without a time component, so picking
 *    local-midnight would shift the displayed day for users west of UTC.
 *    The SPA renders these via `Intl.DateTimeFormat` with `timeZone: 'UTC'`
 *    (NodeDetailPanel adapter sets the precedent — see graph feature).
 */

import type {
  // queue + metrics
  ReviewQueueListWire,
  ReviewQueueList,
  ReviewQueueItemWire,
  ReviewQueueItem,
  EntityMatchQueueItemWire,
  EntityMatchQueueItem,
  EntityMatchCandidateWire,
  EntityMatchCandidate,
  DisputeQueueItemWire,
  DisputeQueueItem,
  DisputedItemSideWire,
  DisputedItemSide,
  CurationMetricsWire,
  CurationMetrics,
  // provenance
  ProvenanceResponseWire,
  ProvenanceResponse,
  ProvenanceFragmentWire,
  ProvenanceFragment,
  ProvenanceChunkWire,
  ProvenanceChunk,
  ProvenanceRawInformationWire,
  ProvenanceRawInformation,
  AcceptedFragmentListWire,
  AcceptedFragmentList,
  AcceptedFragmentItemWire,
  AcceptedFragmentItem,
  AcceptedFragmentSourceRefWire,
  AcceptedFragmentSourceRef,
  // KG
  NodeDetailWire,
  NodeDetail,
  NodeSummaryWire,
  NodeSummary,
  NodeAliasWire,
  NodeAlias,
  AttributeDetailWire,
  AttributeDetail,
  LinkDetailWire,
  LinkDetail,
  LinkHistoryResponseWire,
  LinkHistoryResponse,
  AttributeHistoryResponseWire,
  AttributeHistoryResponse,
} from "../types";

/* ------------------------------------------------------------------ *
 * Envelope unwrap (KG + QR only — curation REST is bare-body)         *
 * ------------------------------------------------------------------ */

/**
 * The standard BFF envelope shape. `lib/http.ts` already unwraps it on the
 * way out (`http<T>()` returns `result` directly), so this helper is here
 * as a fallback for tests / explicit unwrapping when consumers receive a
 * raw wire body (e.g., MSW handlers that hand back the full envelope).
 */
export interface OkEnvelope<T> {
  readonly ok: true;
  readonly result: T;
}

export function unwrapOk<T>(env: OkEnvelope<T>): T {
  return env.result;
}

/* ------------------------------------------------------------------ *
 * Helpers                                                             *
 * ------------------------------------------------------------------ */

function parseIso(value: string): Date {
  // `new Date(iso)` returns `Invalid Date` on malformed input — guard with
  // a NaN check so the call site doesn't silently propagate NaN getTime().
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    throw new Error(`Invalid ISO date string: ${value}`);
  }
  return d;
}

function parseIsoOrNull(value: string | null | undefined): Date | null {
  if (value === null || value === undefined) return null;
  return parseIso(value);
}

/* ------------------------------------------------------------------ *
 * listReviewQueue                                                     *
 * ------------------------------------------------------------------ */

export function toEntityMatchCandidate(
  wire: EntityMatchCandidateWire,
): EntityMatchCandidate {
  return {
    candidateNodeId: wire.candidate_node_id,
    canonicalName: wire.canonical_name,
    similarity: wire.similarity,
  };
}

export function toEntityMatchQueueItem(
  wire: EntityMatchQueueItemWire,
): EntityMatchQueueItem {
  return {
    kind: "entity_match",
    nodeId: wire.node_id,
    nodeType: wire.node_type,
    canonicalName: wire.canonical_name,
    candidates: wire.candidates.map(toEntityMatchCandidate),
    createdAt: parseIso(wire.created_at),
  };
}

export function toDisputedItemSide(
  wire: DisputedItemSideWire,
): DisputedItemSide {
  return {
    itemId: wire.item_id,
    value: wire.value,
    targetNodeId: wire.target_node_id ?? null,
    validFrom: parseIsoOrNull(wire.valid_from),
    validTo: parseIsoOrNull(wire.valid_to),
    validFromSource: wire.valid_from_source,
    confidence: wire.confidence,
    status: wire.status,
  };
}

export function toDisputeQueueItem(
  wire: DisputeQueueItemWire,
): DisputeQueueItem {
  return {
    kind: "disputed",
    itemKind: wire.item_kind,
    scope: {
      sourceNodeId: wire.scope.source_node_id,
      targetNodeId: wire.scope.target_node_id,
      linkType: wire.scope.link_type,
      nodeId: wire.scope.node_id,
      attributeKey: wire.scope.attribute_key,
    },
    sides: wire.sides.map(toDisputedItemSide),
    createdAt: parseIso(wire.created_at),
  };
}

export function toReviewQueueItem(wire: ReviewQueueItemWire): ReviewQueueItem {
  if (wire.kind === "entity_match") {
    return toEntityMatchQueueItem(wire);
  }
  return toDisputeQueueItem(wire);
}

export function toReviewQueueList(wire: ReviewQueueListWire): ReviewQueueList {
  return {
    total: wire.total,
    limit: wire.limit,
    offset: wire.offset,
    items: wire.items.map(toReviewQueueItem),
  };
}

/* ------------------------------------------------------------------ *
 * getCurationMetrics                                                  *
 * ------------------------------------------------------------------ */

export function toCurationMetrics(wire: CurationMetricsWire): CurationMetrics {
  return {
    acceptRate: wire.accept_rate,
    rejectRateByCode: wire.reject_rate_by_code,
    needsReviewCount: wire.needs_review_count,
    uncertainCount: wire.uncertain_count,
    disputedCount: wire.disputed_count,
    entityMatchQueueCount: wire.entity_match_queue_count,
    disputedQueueCount: wire.disputed_queue_count,
    computedAt: parseIso(wire.computed_at),
  };
}

/* ------------------------------------------------------------------ *
 * Provenance (getProvenanceBy*)                                       *
 * ------------------------------------------------------------------ */

export function toProvenanceRawInformation(
  wire: ProvenanceRawInformationWire,
): ProvenanceRawInformation {
  return {
    id: wire.id,
    sourceType: wire.source_type,
    receivedAt: parseIso(wire.received_at),
    metadata: wire.metadata ?? {},
  };
}

export function toProvenanceChunk(wire: ProvenanceChunkWire): ProvenanceChunk {
  return {
    id: wire.id,
    chunkIndex: wire.chunk_index,
    offsetStart: wire.offset_start,
    offsetEnd: wire.offset_end,
    excerpt: wire.excerpt,
    locator: wire.locator ?? {},
    rawInformation: toProvenanceRawInformation(wire.raw_information),
  };
}

export function toProvenanceFragment(
  wire: ProvenanceFragmentWire,
): ProvenanceFragment {
  return {
    id: wire.id,
    text: wire.text,
    confidence: wire.confidence,
    status: wire.status,
    chunks: wire.chunks.map(toProvenanceChunk),
  };
}

export function toProvenanceResponse(
  wire: ProvenanceResponseWire,
): ProvenanceResponse {
  return {
    fragments: wire.fragments.map(toProvenanceFragment),
  };
}

/* ---- listAcceptedFragments ---- */

export function toAcceptedFragmentSourceRef(
  wire: AcceptedFragmentSourceRefWire,
): AcceptedFragmentSourceRef {
  return {
    rawInformationId: wire.raw_information_id,
    chunkIndex: wire.chunk_index,
    sourceType: wire.source_type,
    receivedAt: parseIso(wire.received_at),
    documentTitle: wire.document_title ?? null,
  };
}

export function toAcceptedFragmentItem(
  wire: AcceptedFragmentItemWire,
): AcceptedFragmentItem {
  return {
    fragmentId: wire.fragment_id,
    text: wire.text,
    confidence: wire.confidence,
    llmRunId: wire.llm_run_id,
    createdAt: parseIso(wire.created_at),
    source: toAcceptedFragmentSourceRef(wire.source),
  };
}

export function toAcceptedFragmentList(
  wire: AcceptedFragmentListWire,
): AcceptedFragmentList {
  return {
    total: wire.total,
    limit: wire.limit,
    offset: wire.offset,
    items: wire.items.map(toAcceptedFragmentItem),
  };
}

/* ------------------------------------------------------------------ *
 * Knowledge-graph node detail + history                               *
 * ------------------------------------------------------------------ */

export function toNodeSummary(wire: NodeSummaryWire): NodeSummary {
  return {
    id: wire.id,
    nodeType: wire.node_type,
    canonicalName: wire.canonical_name,
    status: wire.status,
    mergedIntoNodeId: wire.merged_into_node_id ?? null,
  };
}

export function toNodeAlias(wire: NodeAliasWire): NodeAlias {
  return {
    id: wire.id,
    alias: wire.alias,
    kind: wire.kind,
    createdAt: parseIsoOrNull(wire.created_at ?? null),
  };
}

export function toAttributeDetail(wire: AttributeDetailWire): AttributeDetail {
  return {
    id: wire.id,
    nodeId: wire.node_id,
    attributeKey: wire.attribute_key,
    valueType: wire.value_type,
    value: wire.value,
    validFrom: parseIsoOrNull(wire.valid_from),
    validTo: parseIsoOrNull(wire.valid_to),
    recordedAt: parseIso(wire.recorded_at),
    supersededAt: parseIsoOrNull(wire.superseded_at),
    status: wire.status,
    effectiveStatus: wire.effective_status,
    isCurrent: wire.is_current,
    isInEffect: wire.is_in_effect,
    confidence: wire.confidence,
    validFromSource: wire.valid_from_source ?? null,
    flags: wire.flags ?? [],
    supersedesAttributeId: wire.supersedes_attribute_id ?? null,
  };
}

export function toNodeDetail(wire: NodeDetailWire): NodeDetail {
  return {
    node: toNodeSummary(wire.node),
    aliases: wire.aliases.map(toNodeAlias),
    attributes: wire.attributes.map(toAttributeDetail),
  };
}

export function toLinkDetail(wire: LinkDetailWire): LinkDetail {
  return {
    id: wire.id,
    sourceNodeId: wire.source_node_id,
    targetNodeId: wire.target_node_id,
    linkType: wire.link_type,
    linkInverseName: wire.link_inverse_name,
    validFrom: parseIsoOrNull(wire.valid_from),
    validTo: parseIsoOrNull(wire.valid_to),
    recordedAt: parseIso(wire.recorded_at),
    supersededAt: parseIsoOrNull(wire.superseded_at),
    status: wire.status,
    effectiveStatus: wire.effective_status,
    isCurrent: wire.is_current,
    isInEffect: wire.is_in_effect,
    confidence: wire.confidence,
    validFromSource: wire.valid_from_source ?? null,
    supersedesLinkId: wire.supersedes_link_id ?? null,
  };
}

export function toLinkHistoryResponse(
  wire: LinkHistoryResponseWire,
): LinkHistoryResponse {
  return { versions: wire.versions.map(toLinkDetail) };
}

export function toAttributeHistoryResponse(
  wire: AttributeHistoryResponseWire,
): AttributeHistoryResponse {
  return { versions: wire.versions.map(toAttributeDetail) };
}
