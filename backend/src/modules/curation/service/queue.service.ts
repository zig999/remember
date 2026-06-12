// UC-01 — GET /api/v1/curation/queue.
//
// Two queues are surfaced (ADR A26 / spec §10.1):
//   - entity_match: knowledge_node rows with status='needs_review',
//                   joined with their entity_match_review candidates.
//   - disputed:     knowledge_link / node_attribute rows with status='disputed',
//                   grouped by conflict scope.
//
// Cursorless pagination per ListReviewQueueQuery (BR-03 / BR-04).

import type { Pool } from "pg";

import type { ListReviewQueueQuery } from "../dto/queue.dto.js";
import type { AssertionStatus, ReviewQueueKind } from "../dto/enums.dto.js";
import {
  countDisputedAttributes,
  countDisputedLinks,
  countEntityMatchQueue,
  listDisputedAttributes,
  listDisputedLinks,
  listEntityMatchQueue,
  type DisputedAttributeRow,
  type DisputedLinkRow,
} from "../repository/curation.repository.js";
import { withReadOnly } from "./transaction.js";

export interface EntityMatchCandidate {
  readonly candidate_node_id: string;
  readonly canonical_name: string;
  readonly similarity: number;
}

export interface EntityMatchQueueItem {
  readonly kind: "entity_match";
  readonly node_id: string;
  readonly node_type: string;
  readonly canonical_name: string;
  readonly candidates: readonly EntityMatchCandidate[];
  readonly created_at: string;
}

export interface DisputedItemSide {
  readonly item_id: string;
  readonly value: string | null;
  readonly target_node_id: string | null;
  readonly valid_from: string | null;
  readonly valid_to: string | null;
  readonly valid_from_source: "stated" | "document" | "received" | null;
  readonly confidence: number;
  readonly status: AssertionStatus;
}

export interface DisputeQueueScope {
  readonly source_node_id: string | null;
  readonly target_node_id: string | null;
  readonly link_type: string | null;
  readonly node_id: string | null;
  readonly attribute_key: string | null;
}

export interface DisputeQueueItem {
  readonly kind: "disputed";
  readonly item_kind: "link" | "attribute";
  readonly scope: DisputeQueueScope;
  readonly sides: readonly DisputedItemSide[];
  readonly created_at: string;
}

export type ReviewQueueItem = EntityMatchQueueItem | DisputeQueueItem;

export interface ReviewQueueList {
  readonly total: number;
  readonly limit: number;
  readonly offset: number;
  readonly items: readonly ReviewQueueItem[];
}

export interface QueueServiceDeps {
  readonly pool: Pool;
}

export async function listReviewQueueService(
  deps: QueueServiceDeps,
  query: ListReviewQueueQuery
): Promise<ReviewQueueList> {
  const { kind, limit, offset } = query;

  return withReadOnly(deps.pool, async (client) => {
    const items: ReviewQueueItem[] = [];
    let total = 0;

    if (kind === undefined || kind === "entity_match") {
      const rows = await listEntityMatchQueue(client, limit, offset);
      const grouped = groupEntityMatchRows(rows);
      items.push(...grouped);
      total += await countEntityMatchQueue(client);
    }

    if (kind === undefined || kind === "disputed") {
      const linkRows = await listDisputedLinks(client, limit, offset);
      const attrRows = await listDisputedAttributes(client, limit, offset);
      items.push(...groupDisputedLinks(linkRows));
      items.push(...groupDisputedAttributes(attrRows));
      total += await countDisputedLinks(client);
      total += await countDisputedAttributes(client);
    }

    return { total, limit, offset, items };
  });
}

interface EntityMatchAggRow {
  node_id: string;
  node_type: string;
  canonical_name: string;
  created_at: Date;
  candidate_node_id: string | null;
  candidate_canonical_name: string | null;
  similarity: string | null;
}

function groupEntityMatchRows(
  rows: readonly EntityMatchAggRow[]
): EntityMatchQueueItem[] {
  const map = new Map<string, EntityMatchQueueItem & { candidates: EntityMatchCandidate[] }>();
  for (const r of rows) {
    let entry = map.get(r.node_id);
    if (!entry) {
      entry = {
        kind: "entity_match",
        node_id: r.node_id,
        node_type: r.node_type,
        canonical_name: r.canonical_name,
        candidates: [],
        created_at: r.created_at.toISOString(),
      };
      map.set(r.node_id, entry);
    }
    if (
      r.candidate_node_id !== null &&
      r.candidate_canonical_name !== null &&
      r.similarity !== null
    ) {
      entry.candidates.push({
        candidate_node_id: r.candidate_node_id,
        canonical_name: r.candidate_canonical_name,
        similarity: Number(r.similarity),
      });
    }
  }
  return Array.from(map.values());
}

function groupDisputedLinks(rows: readonly DisputedLinkRow[]): DisputeQueueItem[] {
  // Group by (source, target, link_type).
  const groups = new Map<string, DisputeQueueItem & { sides: DisputedItemSide[] }>();
  for (const r of rows) {
    const key = `${r.source_node_id}\x1F${r.target_node_id}\x1F${r.link_type_id}`;
    let group = groups.get(key);
    if (!group) {
      group = {
        kind: "disputed",
        item_kind: "link",
        scope: {
          source_node_id: r.source_node_id,
          target_node_id: r.target_node_id,
          link_type: r.link_type_name,
          node_id: null,
          attribute_key: null,
        },
        sides: [],
        created_at: r.recorded_at.toISOString(),
      };
      groups.set(key, group);
    }
    group.sides.push({
      item_id: r.id,
      value: null,
      target_node_id: r.target_node_id,
      valid_from: r.valid_from,
      valid_to: r.valid_to,
      valid_from_source: r.valid_from_source,
      confidence: Number(r.confidence),
      status: r.status,
    });
  }
  return Array.from(groups.values());
}

function groupDisputedAttributes(
  rows: readonly DisputedAttributeRow[]
): DisputeQueueItem[] {
  const groups = new Map<string, DisputeQueueItem & { sides: DisputedItemSide[] }>();
  for (const r of rows) {
    const key = `${r.node_id}\x1F${r.attribute_key_id}`;
    let group = groups.get(key);
    if (!group) {
      group = {
        kind: "disputed",
        item_kind: "attribute",
        scope: {
          source_node_id: null,
          target_node_id: null,
          link_type: null,
          node_id: r.node_id,
          attribute_key: r.attribute_key,
        },
        sides: [],
        created_at: r.recorded_at.toISOString(),
      };
      groups.set(key, group);
    }
    group.sides.push({
      item_id: r.id,
      value: r.value,
      target_node_id: null,
      valid_from: r.valid_from,
      valid_to: r.valid_to,
      valid_from_source: r.valid_from_source,
      confidence: Number(r.confidence),
      status: r.status,
    });
  }
  return Array.from(groups.values());
}

/** Re-export the discriminant for route layer logging. */
export type { ReviewQueueKind };
