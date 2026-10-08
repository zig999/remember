import type { PoolClient } from "pg";

import { InvariantError } from "../../../shared/invariant-error.js";
import type {
  AssertionStatus,
  ItemKind,
  NodeStatus,
  ValidFromSource,
} from "../dto/enums.dto.js";

export interface KnowledgeNodeLockedRow {
  readonly id: string;
  readonly node_type_id: string;
  readonly canonical_name: string;
  readonly status: NodeStatus;
  readonly merged_into_node_id: string | null;
}

export async function loadNodesForUpdate(
  client: PoolClient,
  nodeIds: readonly string[]
): Promise<KnowledgeNodeLockedRow[]> {
  if (nodeIds.length === 0) return [];
  const res = await client.query<KnowledgeNodeLockedRow>(
    `SELECT id, node_type_id, canonical_name, status, merged_into_node_id
       FROM knowledge_node
      WHERE id = ANY($1::uuid[])
      FOR UPDATE`,
    [Array.from(nodeIds)]
  );
  return res.rows;
}

export async function updateNodeStatusKeepSeparate(
  client: PoolClient,
  nodeId: string
): Promise<number> {
  const res = await client.query(
    `UPDATE knowledge_node
        SET status = 'active'
      WHERE id = $1
        AND status = 'needs_review'
      RETURNING id`,
    [nodeId]
  );
  return res.rowCount ?? 0;
}

export async function updateNodeMerged(
  client: PoolClient,
  absorbedId: string,
  survivorId: string
): Promise<number> {
  const res = await client.query(
    `UPDATE knowledge_node
        SET status = 'merged',
            merged_into_node_id = $2
      WHERE id = $1
        AND status IN ('active', 'needs_review')
      RETURNING id`,
    [absorbedId, survivorId]
  );
  return res.rowCount ?? 0;
}

export async function pathCompressMergedInto(
  client: PoolClient,
  absorbedId: string,
  survivorId: string
): Promise<number> {
  const res = await client.query(
    `UPDATE knowledge_node
        SET merged_into_node_id = $2
      WHERE merged_into_node_id = $1
      RETURNING id`,
    [absorbedId, survivorId]
  );
  return res.rowCount ?? 0;
}

export async function copyAliases(
  client: PoolClient,
  absorbedId: string,
  survivorId: string
): Promise<number> {
  const res = await client.query(
    `INSERT INTO node_alias (node_id, alias, kind, created_by_run_id, created_at)
     SELECT $2, alias, 'alias', created_by_run_id, created_at
       FROM node_alias
      WHERE node_id = $1
     ON CONFLICT (node_id, alias_norm) DO NOTHING
     RETURNING id`,
    [absorbedId, survivorId]
  );
  return res.rowCount ?? 0;
}

export async function repointLinks(
  client: PoolClient,
  absorbedId: string,
  survivorId: string
): Promise<number> {
  const res = await client.query(
    `UPDATE knowledge_link
        SET source_node_id = CASE WHEN source_node_id = $1 THEN $2 ELSE source_node_id END,
            target_node_id = CASE WHEN target_node_id = $1 THEN $2 ELSE target_node_id END
      WHERE source_node_id = $1
         OR target_node_id = $1
      RETURNING id`,
    [absorbedId, survivorId]
  );
  return res.rowCount ?? 0;
}

export async function repointAttributes(
  client: PoolClient,
  absorbedId: string,
  survivorId: string
): Promise<number> {
  const res = await client.query(
    `UPDATE node_attribute
        SET node_id = $2
      WHERE node_id = $1
      RETURNING id`,
    [absorbedId, survivorId]
  );
  return res.rowCount ?? 0;
}

export async function deleteEntityMatchReviewByNode(
  client: PoolClient,
  nodeId: string
): Promise<number> {
  const res = await client.query(
    `DELETE FROM entity_match_review WHERE node_id = $1 RETURNING id`,
    [nodeId]
  );
  return res.rowCount ?? 0;
}

export interface ItemLockedRow {
  readonly id: string;
  readonly node_id?: string;
  readonly source_node_id?: string;
  readonly target_node_id?: string;
  readonly link_type_id?: string;
  readonly attribute_key_id?: string;
  readonly value_type?: "date" | "number" | "text" | "bool";
  readonly value?: string;
  readonly valid_from: string | null;
  readonly valid_to: string | null;
  readonly status: AssertionStatus;
  readonly confidence: string;
  readonly valid_from_source: "stated" | "document" | "received" | null;
  readonly superseded_at: Date | null;
  readonly supersedes_id?: string | null;
}

export async function loadItemsForUpdate(
  client: PoolClient,
  itemKind: ItemKind,
  itemIds: readonly string[]
): Promise<ItemLockedRow[]> {
  if (itemIds.length === 0) return [];
  if (itemKind === "link") {
    const res = await client.query<ItemLockedRow>(
      `SELECT id, source_node_id, target_node_id, link_type_id,
              valid_from::text AS valid_from,
              valid_to::text AS valid_to,
              status,
              confidence::text AS confidence,
              valid_from_source,
              superseded_at,
              supersedes_link_id AS supersedes_id
         FROM knowledge_link
        WHERE id = ANY($1::uuid[])
        FOR UPDATE`,
      [Array.from(itemIds)]
    );
    return res.rows;
  }
  const res = await client.query<ItemLockedRow>(
    `SELECT id, node_id, attribute_key_id, value_type, value,
            valid_from::text AS valid_from,
            valid_to::text AS valid_to,
            status,
            confidence::text AS confidence,
            valid_from_source,
            superseded_at,
            supersedes_attribute_id AS supersedes_id
       FROM node_attribute
      WHERE id = ANY($1::uuid[])
      FOR UPDATE`,
    [Array.from(itemIds)]
  );
  return res.rows;
}

export interface AttributesOfKeyFilter {
  readonly nodeId: string;
  readonly attributeKeyId: string;
  readonly statuses: readonly AssertionStatus[];
}

export async function loadAttributeIdsOfKeyForUpdate(
  client: PoolClient,
  filter: AttributesOfKeyFilter
): Promise<string[]> {
  const res = await client.query<{ id: string }>(
    `SELECT id
       FROM node_attribute
      WHERE node_id = $1
        AND attribute_key_id = $2
        AND status = ANY($3::assertion_status[])
      FOR UPDATE`,
    [filter.nodeId, filter.attributeKeyId, Array.from(filter.statuses)]
  );
  return res.rows.map((row) => row.id);
}

export async function confirmItem(
  client: PoolClient,
  itemKind: ItemKind,
  itemId: string
): Promise<number> {
  if (itemKind === "link") {
    const res = await client.query(
      `UPDATE knowledge_link
          SET status = 'active'
        WHERE id = $1 AND status = 'uncertain'
        RETURNING id`,
      [itemId]
    );
    return res.rowCount ?? 0;
  }
  const res = await client.query(
    `UPDATE node_attribute
        SET status = 'active'
      WHERE id = $1 AND status = 'uncertain'
      RETURNING id`,
    [itemId]
  );
  return res.rowCount ?? 0;
}

export async function rejectItem(
  client: PoolClient,
  itemKind: ItemKind,
  itemId: string
): Promise<number> {
  if (itemKind === "link") {
    const res = await client.query(
      `UPDATE knowledge_link
          SET status = 'deleted',
              superseded_at = now()
        WHERE id = $1
          AND status IN ('active', 'uncertain', 'disputed')
        RETURNING id`,
      [itemId]
    );
    return res.rowCount ?? 0;
  }
  const res = await client.query(
    `UPDATE node_attribute
        SET status = 'deleted',
            superseded_at = now()
      WHERE id = $1
        AND status IN ('active', 'uncertain', 'disputed')
      RETURNING id`,
    [itemId]
  );
  return res.rowCount ?? 0;
}

export async function resolveDisputeWinner(
  client: PoolClient,
  itemKind: ItemKind,
  winnerId: string
): Promise<number> {
  if (itemKind === "link") {
    const res = await client.query(
      `UPDATE knowledge_link
          SET status = 'active'
        WHERE id = $1 AND status = 'disputed'
        RETURNING id`,
      [winnerId]
    );
    return res.rowCount ?? 0;
  }
  const res = await client.query(
    `UPDATE node_attribute
        SET status = 'active'
      WHERE id = $1 AND status = 'disputed'
      RETURNING id`,
    [winnerId]
  );
  return res.rowCount ?? 0;
}

export async function resolveDisputeLosers(
  client: PoolClient,
  itemKind: ItemKind,
  loserIds: readonly string[]
): Promise<number> {
  if (loserIds.length === 0) return 0;
  if (itemKind === "link") {
    const res = await client.query(
      `UPDATE knowledge_link
          SET status = 'deleted',
              superseded_at = now()
        WHERE id = ANY($1::uuid[]) AND status = 'disputed'
        RETURNING id`,
      [Array.from(loserIds)]
    );
    return res.rowCount ?? 0;
  }
  const res = await client.query(
    `UPDATE node_attribute
        SET status = 'deleted',
            superseded_at = now()
      WHERE id = ANY($1::uuid[]) AND status = 'disputed'
      RETURNING id`,
    [Array.from(loserIds)]
  );
  return res.rowCount ?? 0;
}

export async function adjustItemPeriod(
  client: PoolClient,
  itemKind: ItemKind,
  itemId: string,
  validFrom: string | null,
  validTo: string | null
): Promise<number> {
  if (itemKind === "link") {
    const res = await client.query(
      `UPDATE knowledge_link
          SET valid_from = $2::date,
              valid_to = $3::date,
              status = 'active'
        WHERE id = $1 AND status = 'disputed'
        RETURNING id`,
      [itemId, validFrom, validTo]
    );
    return res.rowCount ?? 0;
  }
  const res = await client.query(
    `UPDATE node_attribute
        SET valid_from = $2::date,
            valid_to = $3::date,
            status = 'active'
      WHERE id = $1 AND status = 'disputed'
      RETURNING id`,
    [itemId, validFrom, validTo]
  );
  return res.rowCount ?? 0;
}

export interface CorrectionMutationArgs {
  readonly predecessorId: string;
  readonly correctedValue?: string | null;
  readonly correctedTargetNodeId?: string | null;
  readonly correctedValidFrom?: string | null;
  readonly correctedValidTo?: string | null;
  readonly correctedValidFromSource?: "stated" | "document" | "received" | null;
}

export async function supersedePredecessor(
  client: PoolClient,
  itemKind: ItemKind,
  predecessorId: string
): Promise<number> {
  if (itemKind === "link") {
    const res = await client.query(
      `UPDATE knowledge_link
          SET status = 'superseded',
              superseded_at = now()
        WHERE id = $1
          AND status IN ('active', 'uncertain', 'disputed')
        RETURNING id`,
      [predecessorId]
    );
    return res.rowCount ?? 0;
  }
  const res = await client.query(
    `UPDATE node_attribute
        SET status = 'superseded',
            superseded_at = now()
      WHERE id = $1
        AND status IN ('active', 'uncertain', 'disputed')
      RETURNING id`,
    [predecessorId]
  );
  return res.rowCount ?? 0;
}

export async function insertCorrectedRow(
  client: PoolClient,
  itemKind: ItemKind,
  args: CorrectionMutationArgs
): Promise<string> {
  if (itemKind === "link") {
    const res = await client.query<{ id: string }>(
      `INSERT INTO knowledge_link (
          source_node_id, target_node_id, link_type_id,
          valid_from, valid_to, status, confidence,
          valid_from_source, created_by_run_id,
          supersedes_link_id, recorded_at
       )
       SELECT source_node_id,
              COALESCE($2::uuid, target_node_id),
              link_type_id,
              COALESCE($3::date, valid_from),
              COALESCE($4::date, valid_to),
              'active'::assertion_status,
              confidence,
              COALESCE($5::valid_from_source, valid_from_source),
              NULL,
              $1::uuid,
              now()
         FROM knowledge_link
        WHERE id = $1
       RETURNING id`,
      [
        args.predecessorId,
        args.correctedTargetNodeId ?? null,
        args.correctedValidFrom ?? null,
        args.correctedValidTo ?? null,
        args.correctedValidFromSource ?? null,
      ]
    );
    const row = res.rows[0];
    if (!row) {
      throw new InvariantError("insertCorrectedRow returned no row for link");
    }
    return row.id;
  }
  const res = await client.query<{ id: string }>(
    `INSERT INTO node_attribute (
        node_id, attribute_key_id, value_type, value,
        valid_from, valid_to, status, confidence,
        valid_from_source, created_by_run_id,
        supersedes_attribute_id, recorded_at
     )
     SELECT node_id,
            attribute_key_id,
            value_type,
            COALESCE($2::text, value),
            COALESCE($3::date, valid_from),
            COALESCE($4::date, valid_to),
            'active'::assertion_status,
            confidence,
            COALESCE($5::valid_from_source, valid_from_source),
            NULL,
            $1::uuid,
            now()
       FROM node_attribute
      WHERE id = $1
     RETURNING id`,
    [
      args.predecessorId,
      args.correctedValue ?? null,
      args.correctedValidFrom ?? null,
      args.correctedValidTo ?? null,
      args.correctedValidFromSource ?? null,
    ]
  );
  const row = res.rows[0];
  if (!row) {
    throw new InvariantError("insertCorrectedRow returned no row for attribute");
  }
  return row.id;
}

export interface NewAttributeArgs {
  readonly nodeId: string;
  readonly attributeKeyId: string;
  readonly valueType: "date" | "number" | "text" | "bool";
  readonly value: string;
  readonly validFrom: string | null;
  readonly validTo: string | null;
  readonly validFromSource: ValidFromSource | null;
  readonly status: AssertionStatus;
  readonly confidence: number;
  readonly createdByRunId: string;
  readonly supersedesAttributeId: string | null;
}

export async function insertNewAttribute(
  client: PoolClient,
  args: NewAttributeArgs
): Promise<string> {
  const res = await client.query<{ id: string }>(
    `INSERT INTO node_attribute
       (node_id, attribute_key_id, value_type, value,
        valid_from, valid_to, status, confidence,
        valid_from_source, created_by_run_id, supersedes_attribute_id)
     VALUES ($1, $2, $3::attribute_value_type, $4,
             $5::date, $6::date,
             $7::assertion_status, $8,
             $9::valid_from_source, $10, $11)
     RETURNING id`,
    [
      args.nodeId,
      args.attributeKeyId,
      args.valueType,
      args.value,
      args.validFrom,
      args.validTo,
      args.status,
      args.confidence,
      args.validFromSource,
      args.createdByRunId,
      args.supersedesAttributeId,
    ]
  );
  const row = res.rows[0];
  if (!row) {
    throw new InvariantError("insertNewAttribute returned no row");
  }
  return row.id;
}

export interface AttributeSupersessionArgs {
  readonly attributeId: string;
  readonly validTo: string | null;
  readonly supersededAt: Date | null;
}

export async function supersedeAttributeAtEdit(
  client: PoolClient,
  args: AttributeSupersessionArgs
): Promise<number> {
  const res = await client.query(
    `UPDATE node_attribute
        SET status = 'superseded',
            valid_to = COALESCE($2::date, valid_to),
            superseded_at = $3::timestamptz
      WHERE id = $1
        AND status IN ('active', 'uncertain', 'disputed')
      RETURNING id`,
    [args.attributeId, args.validTo, args.supersededAt]
  );
  return res.rowCount ?? 0;
}

export async function copyProvenance(
  client: PoolClient,
  itemKind: ItemKind,
  predecessorId: string,
  successorId: string
): Promise<number> {
  if (itemKind === "link") {
    const res = await client.query(
      `INSERT INTO provenance (link_id, fragment_id, created_at)
       SELECT $2, fragment_id, now()
         FROM provenance
        WHERE link_id = $1
       ON CONFLICT (link_id, fragment_id) DO NOTHING
       RETURNING id`,
      [predecessorId, successorId]
    );
    return res.rowCount ?? 0;
  }
  const res = await client.query(
    `INSERT INTO provenance (attribute_id, fragment_id, created_at)
     SELECT $2, fragment_id, now()
       FROM provenance
      WHERE attribute_id = $1
     ON CONFLICT (attribute_id, fragment_id) DO NOTHING
     RETURNING id`,
    [predecessorId, successorId]
  );
  return res.rowCount ?? 0;
}

export async function appendProvenanceFragment(
  client: PoolClient,
  itemKind: ItemKind,
  successorId: string,
  fragmentId: string
): Promise<number> {
  if (itemKind === "link") {
    const res = await client.query(
      `INSERT INTO provenance (link_id, fragment_id, created_at)
         VALUES ($1, $2, now())
       ON CONFLICT (link_id, fragment_id) DO NOTHING
       RETURNING id`,
      [successorId, fragmentId]
    );
    return res.rowCount ?? 0;
  }
  const res = await client.query(
    `INSERT INTO provenance (attribute_id, fragment_id, created_at)
       VALUES ($1, $2, now())
     ON CONFLICT (attribute_id, fragment_id) DO NOTHING
     RETURNING id`,
    [successorId, fragmentId]
  );
  return res.rowCount ?? 0;
}

export interface InformationFragmentRow {
  readonly id: string;
  readonly status: string;
}

export async function findInformationFragmentById(
  client: PoolClient,
  fragmentId: string
): Promise<InformationFragmentRow | null> {
  const res = await client.query<InformationFragmentRow>(
    `SELECT id, status FROM information_fragment WHERE id = $1`,
    [fragmentId]
  );
  return res.rows[0] ?? null;
}

export async function acceptInformationFragment(
  client: PoolClient,
  fragmentId: string
): Promise<number> {
  const res = await client.query(
    `UPDATE information_fragment
        SET status = 'accepted'
      WHERE id = $1
        AND status = 'proposed'
      RETURNING id`,
    [fragmentId]
  );
  return res.rowCount ?? 0;
}

export interface CurationActionInsertArgs {
  readonly action: string;
  readonly target_kind: "node" | "link" | "attribute";
  readonly target_id: string;
  readonly payload: Record<string, unknown>;
  readonly reason: string | null;
}

export async function insertCurationAction(
  client: PoolClient,
  args: CurationActionInsertArgs
): Promise<{ id: string; created_at: Date }> {
  const res = await client.query<{ id: string; created_at: Date }>(
    `INSERT INTO curation_action (action, target_kind, target_id, payload, reason)
     VALUES ($1, $2, $3, $4::jsonb, $5)
     RETURNING id, created_at`,
    [
      args.action,
      args.target_kind,
      args.target_id,
      JSON.stringify(args.payload),
      args.reason,
    ]
  );
  const row = res.rows[0];
  if (!row) {
    throw new InvariantError("insertCurationAction returned no row");
  }
  return row;
}

export interface EntityMatchQueueRow {
  readonly node_id: string;
  readonly node_type: string;
  readonly canonical_name: string;
  readonly created_at: Date;
  readonly candidate_node_id: string | null;
  readonly candidate_canonical_name: string | null;
  readonly similarity: string | null;
}

export async function listEntityMatchQueue(
  client: PoolClient,
  limit: number,
  offset: number
): Promise<EntityMatchQueueRow[]> {
  const res = await client.query<EntityMatchQueueRow>(
    `SELECT kn.id AS node_id,
            nt.name AS node_type,
            kn.canonical_name,
            kn.created_at,
            em.candidate_node_id,
            cn.canonical_name AS candidate_canonical_name,
            em.similarity::text AS similarity
       FROM knowledge_node kn
       JOIN node_type nt ON nt.id = kn.node_type_id
  LEFT JOIN entity_match_review em ON em.node_id = kn.id
  LEFT JOIN knowledge_node cn ON cn.id = em.candidate_node_id
      WHERE kn.status = 'needs_review'
      ORDER BY kn.created_at ASC, kn.id ASC, em.similarity DESC NULLS LAST
      LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return res.rows;
}

export async function countEntityMatchQueue(
  client: PoolClient
): Promise<number> {
  const res = await client.query<{ total: string }>(
    `SELECT count(*)::text AS total FROM knowledge_node WHERE status = 'needs_review'`
  );
  return Number(res.rows[0]?.total ?? 0);
}

export interface DisputedLinkRow {
  readonly id: string;
  readonly source_node_id: string;
  readonly target_node_id: string;
  readonly link_type_id: string;
  readonly link_type_name: string;
  readonly allows_multiple_current: boolean;
  readonly valid_from: string | null;
  readonly valid_to: string | null;
  readonly valid_from_source: "stated" | "document" | "received" | null;
  readonly confidence: string;
  readonly status: AssertionStatus;
  readonly recorded_at: Date;
}

export async function listDisputedLinks(
  client: PoolClient,
  limit: number,
  offset: number
): Promise<DisputedLinkRow[]> {
  const res = await client.query<DisputedLinkRow>(
    `SELECT kl.id,
            kl.source_node_id,
            kl.target_node_id,
            kl.link_type_id,
            lt.name AS link_type_name,
            lt.allows_multiple_current,
            kl.valid_from::text AS valid_from,
            kl.valid_to::text AS valid_to,
            kl.valid_from_source,
            kl.confidence::text AS confidence,
            kl.status,
            kl.recorded_at
       FROM knowledge_link kl
       JOIN link_type lt ON lt.id = kl.link_type_id
      WHERE kl.status = 'disputed'
      ORDER BY kl.recorded_at ASC, kl.id ASC
      LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return res.rows;
}

export async function countDisputedLinks(client: PoolClient): Promise<number> {
  const res = await client.query<{ total: string }>(
    `SELECT count(*)::text AS total FROM knowledge_link WHERE status = 'disputed'`
  );
  return Number(res.rows[0]?.total ?? 0);
}

export interface DisputedAttributeRow {
  readonly id: string;
  readonly node_id: string;
  readonly attribute_key_id: string;
  readonly attribute_key: string;
  readonly value: string;
  readonly valid_from: string | null;
  readonly valid_to: string | null;
  readonly valid_from_source: "stated" | "document" | "received" | null;
  readonly confidence: string;
  readonly status: AssertionStatus;
  readonly recorded_at: Date;
}

export async function listDisputedAttributes(
  client: PoolClient,
  limit: number,
  offset: number
): Promise<DisputedAttributeRow[]> {
  const res = await client.query<DisputedAttributeRow>(
    `SELECT na.id,
            na.node_id,
            na.attribute_key_id,
            ak.key AS attribute_key,
            na.value,
            na.valid_from::text AS valid_from,
            na.valid_to::text AS valid_to,
            na.valid_from_source,
            na.confidence::text AS confidence,
            na.status,
            na.recorded_at
       FROM node_attribute na
       JOIN attribute_key ak ON ak.id = na.attribute_key_id
      WHERE na.status = 'disputed'
      ORDER BY na.recorded_at ASC, na.id ASC
      LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return res.rows;
}

export async function countDisputedAttributes(
  client: PoolClient
): Promise<number> {
  const res = await client.query<{ total: string }>(
    `SELECT count(*)::text AS total FROM node_attribute WHERE status = 'disputed'`
  );
  return Number(res.rows[0]?.total ?? 0);
}

const ACCEPT_ACTIONS = [
  "resolve_entity_match",
  "merge_nodes",
  "resolve_dispute",
  "confirm_item",
  "correct_item",
] as const;

export interface CurationMetricsRow {
  readonly accept_rate: number;
  readonly reject_rate_by_code: Readonly<Record<string, number>>;
  readonly needs_review_count: number;
  readonly uncertain_count: number;
  readonly disputed_count: number;
  readonly entity_match_queue_count: number;
  readonly disputed_queue_count: number;
}

export async function aggregateCurationMetrics(
  client: PoolClient
): Promise<CurationMetricsRow> {
  const totalActionsRes = await client.query<{ total: string }>(
    `SELECT count(*)::text AS total FROM curation_action`
  );
  const totalActions = Number(totalActionsRes.rows[0]?.total ?? 0);
  let acceptRate = 0;
  if (totalActions > 0) {
    const acceptedRes = await client.query<{ total: string }>(
      `SELECT count(*)::text AS total
         FROM curation_action
        WHERE action = ANY($1::text[])`,
      [Array.from(ACCEPT_ACTIONS)]
    );
    const accepted = Number(acceptedRes.rows[0]?.total ?? 0);
    acceptRate = accepted / totalActions;
  }

  const rejectRateByCode: Record<string, number> = {};
  if (totalActions > 0) {
    const rejectsRes = await client.query<{ code: string; total: string }>(
      `SELECT (payload->>'error_code') AS code,
              count(*)::text AS total
         FROM curation_action
        WHERE action = 'reject_item'
          AND payload ? 'error_code'
        GROUP BY 1`
    );
    for (const row of rejectsRes.rows) {
      if (row.code === null || row.code === undefined) continue;
      rejectRateByCode[row.code] = Number(row.total) / totalActions;
    }
  }

  const needsReviewRes = await client.query<{ total: string }>(
    `SELECT count(*)::text AS total
       FROM knowledge_node
      WHERE status = 'needs_review'`
  );
  const needsReviewCount = Number(needsReviewRes.rows[0]?.total ?? 0);
  const entityMatchQueueCount = needsReviewCount;

  const uncertainRes = await client.query<{ total: string }>(
    `SELECT (
       (SELECT count(*) FROM knowledge_link_resolved WHERE effective_status = 'uncertain')
     + (SELECT count(*) FROM node_attribute_resolved WHERE effective_status = 'uncertain')
     )::text AS total`
  );
  const uncertainCount = Number(uncertainRes.rows[0]?.total ?? 0);

  const disputedRes = await client.query<{ total: string }>(
    `SELECT (
       (SELECT count(*) FROM knowledge_link_resolved WHERE effective_status = 'disputed')
     + (SELECT count(*) FROM node_attribute_resolved WHERE effective_status = 'disputed')
     )::text AS total`
  );
  const disputedCount = Number(disputedRes.rows[0]?.total ?? 0);

  const disputedQueueRes = await client.query<{ total: string }>(
    `SELECT count(*)::text AS total
       FROM (
         SELECT DISTINCT 'link' AS k, source_node_id, target_node_id, link_type_id
           FROM knowledge_link
          WHERE status = 'disputed'
         UNION ALL
         SELECT DISTINCT 'attribute', node_id, attribute_key_id, NULL::uuid
           FROM node_attribute
          WHERE status = 'disputed'
       ) g`
  );
  const disputedQueueCount = Number(disputedQueueRes.rows[0]?.total ?? 0);

  return {
    accept_rate: acceptRate,
    reject_rate_by_code: rejectRateByCode,
    needs_review_count: needsReviewCount,
    uncertain_count: uncertainCount,
    disputed_count: disputedCount,
    entity_match_queue_count: entityMatchQueueCount,
    disputed_queue_count: disputedQueueCount,
  };
}
