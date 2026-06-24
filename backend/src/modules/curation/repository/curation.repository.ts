// Repository layer for the curation module.
//
// All queries are parameterized (CLAUDE.md "Security"). Functions are pure
// SQL wrappers — the service layer owns transaction wiring (BEGIN / COMMIT)
// and decides which repo function to call inside the open transaction.
//
// BR-26: every write UC issues `SELECT ... FOR UPDATE` on every row to be
// mutated at the START of the transaction. The corresponding `loadXForUpdate`
// functions live here.

import type { PoolClient } from "pg";

import type {
  AssertionStatus,
  ItemKind,
  NodeStatus,
} from "../dto/enums.dto.js";

// ---------------------------------------------------------------------------
// knowledge_node
// ---------------------------------------------------------------------------

export interface KnowledgeNodeLockedRow {
  readonly id: string;
  readonly node_type_id: string;
  readonly canonical_name: string;
  readonly status: NodeStatus;
  readonly merged_into_node_id: string | null;
}

/**
 * Load multiple knowledge_node rows with `FOR UPDATE` lock. Returns rows in
 * an arbitrary order; caller is expected to match by id.
 */
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

/** UC-02 / UC-03: set status of a node previously locked. */
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

/** UC-02 / UC-04: mark `absorbed` as merged, pointing at `survivor`. */
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

/** BR-07: path compression — repoint anything that was pointing at absorbed. */
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

// ---------------------------------------------------------------------------
// node_alias (copy on merge — BR-08)
// ---------------------------------------------------------------------------

/**
 * Copy aliases from absorbed -> survivor. The absorbed node's canonical alias
 * is downgraded to `kind = 'alias'` on the survivor (the survivor's canonical
 * is preserved by the partial unique index `node_alias_one_canonical_uq`).
 */
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

// ---------------------------------------------------------------------------
// knowledge_link / node_attribute repointing (BR-09)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// entity_match_review (delete on resolution — BR-10)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Item-level (link/attribute) operations — UC-05, UC-06, UC-07, UC-08, UC-09, UC-10
// ---------------------------------------------------------------------------

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
  readonly confidence: string; // numeric returned by pg as string
  readonly valid_from_source: "stated" | "document" | "received" | null;
  readonly superseded_at: Date | null;
  readonly supersedes_id?: string | null;
}

/**
 * Load multiple link OR attribute rows with FOR UPDATE. The `item_kind`
 * argument selects the table; the caller is responsible for ensuring every
 * id refers to the same kind.
 */
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

/** UC-08: confirm_item — flip `uncertain` -> `active`. BR-21. */
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

/** UC-09: reject_item — pair status='deleted' AND superseded_at=now() (BR-20). */
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

/** UC-05 (prefer_one, winner): disputed -> active. */
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

/** UC-05 (prefer_one, losers): pair status='deleted' AND superseded_at=now(). */
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

/** UC-06 (adjust_periods): set new (valid_from, valid_to) and status='active'. */
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

// ---------------------------------------------------------------------------
// UC-10: correct_item — predecessor + new row + provenance
// ---------------------------------------------------------------------------

export interface CorrectionMutationArgs {
  readonly predecessorId: string;
  readonly correctedValue?: string | null;
  readonly correctedTargetNodeId?: string | null;
  readonly correctedValidFrom?: string | null;
  readonly correctedValidTo?: string | null;
  readonly correctedValidFromSource?: "stated" | "document" | "received" | null;
}

/** UC-10 predecessor UPDATE — `valid_to` is NOT in the SET list (BR-18). */
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

/** UC-10 new row creation — SELECT-then-INSERT with COALESCE overrides. */
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
      throw new Error("insertCorrectedRow returned no row for link");
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
    throw new Error("insertCorrectedRow returned no row for attribute");
  }
  return row.id;
}

/** UC-10 BR-19 provenance copy from predecessor to successor. */
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

/** UC-10 BR-19 (extension): append the errata fragment if supplied. */
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

// ---------------------------------------------------------------------------
// information_fragment — BR-17 date justification check
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// curation_action — audit row (BR-24)
// ---------------------------------------------------------------------------

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
    throw new Error("insertCurationAction returned no row");
  }
  return row;
}

// ---------------------------------------------------------------------------
// Queue listing — UC-01
// ---------------------------------------------------------------------------

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
  /** Cardinality of the link type (A10). false = functional (one current per
   *  (source, link_type)) → competing targets are SIDES of one dispute; true =
   *  multi-valued → conflict scope includes the target. Drives the queue
   *  dispute grouping (queue.service.groupDisputedLinks). */
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

// ---------------------------------------------------------------------------
// BR-33: curation_metrics — read-only §16 calibration aggregates.
//
// Each statement below is a separate `client.query(...)` issued inside the
// SAME `BEGIN READ ONLY` transaction (opened by `withReadOnly` in the service
// layer) so all seven aggregates see one coherent MVCC snapshot — the
// `computed_at` guarantee declared by `openapi.yaml` (CurationMetricsResponse).
//
// SQL sources are spelled out in `curation.back.md` BR-33 ("SQL sources" table).
// ---------------------------------------------------------------------------

/** Accept actions are the five non-reject curator verbs (BR-33 spec table). */
const ACCEPT_ACTIONS = [
  "resolve_entity_match",
  "merge_nodes",
  "resolve_dispute",
  "confirm_item",
  "correct_item",
] as const;

/** Row shape used by `aggregateCurationMetrics` to surface the snapshot. */
export interface CurationMetricsRow {
  /** `accept_rate` numerator/denominator; pre-divided to keep service simple. */
  readonly accept_rate: number;
  /**
   * Map of `error.code` → fraction (in [0, 1]) for explicit reject_item rows
   * whose `payload->>'error_code'` is populated. Empty `{}` is the canonical
   * empty state (NEVER omitted from the response — BR-33).
   */
  readonly reject_rate_by_code: Readonly<Record<string, number>>;
  readonly needs_review_count: number;
  readonly uncertain_count: number;
  readonly disputed_count: number;
  readonly entity_match_queue_count: number;
  readonly disputed_queue_count: number;
}

/**
 * Run the BR-33 aggregate snapshot inside the caller's transaction. The
 * service layer is expected to have already opened a `BEGIN READ ONLY` block
 * (`withReadOnly`) — every statement below is parameterless and read-only.
 */
export async function aggregateCurationMetrics(
  client: PoolClient
): Promise<CurationMetricsRow> {
  // -- accept_rate ---------------------------------------------------------
  // Numerator: rows whose `action` is one of the five accept verbs.
  // Denominator: total curation_action rows. Zero-division → 0 at BFF layer
  // (documented choice; matches the OpenAPI "Share of curator actions"
  // description for an empty-table cold start — see acceptance criterion #3).
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

  // -- reject_rate_by_code -------------------------------------------------
  // Today `curation_action.payload` of `reject_item` is `'{}'` (BR-25), so
  // this map is empty in practice. We still surface the field as `{}` rather
  // than omit it (BR-33 — front spec depends on the key being present).
  let rejectRateByCode: Record<string, number> = {};
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

  // -- needs_review_count + entity_match_queue_count -----------------------
  // BR-33: surfaced as two separate fields even though they are logically
  // equal under BR-10 — the OpenAPI contract requires both, and they are NOT
  // guaranteed equal across out-of-band repairs.
  const needsReviewRes = await client.query<{ total: string }>(
    `SELECT count(*)::text AS total
       FROM knowledge_node
      WHERE status = 'needs_review'`
  );
  const needsReviewCount = Number(needsReviewRes.rows[0]?.total ?? 0);
  const entityMatchQueueCount = needsReviewCount;

  // -- uncertain_count -----------------------------------------------------
  // Sum of resolved-view rows whose effective_status='uncertain' (§5.4/§6.6).
  const uncertainRes = await client.query<{ total: string }>(
    `SELECT (
       (SELECT count(*) FROM knowledge_link_resolved WHERE effective_status = 'uncertain')
     + (SELECT count(*) FROM node_attribute_resolved WHERE effective_status = 'uncertain')
     )::text AS total`
  );
  const uncertainCount = Number(uncertainRes.rows[0]?.total ?? 0);

  // -- disputed_count ------------------------------------------------------
  const disputedRes = await client.query<{ total: string }>(
    `SELECT (
       (SELECT count(*) FROM knowledge_link_resolved WHERE effective_status = 'disputed')
     + (SELECT count(*) FROM node_attribute_resolved WHERE effective_status = 'disputed')
     )::text AS total`
  );
  const disputedCount = Number(disputedRes.rows[0]?.total ?? 0);

  // -- disputed_queue_count ------------------------------------------------
  // Per-assertion-scope count (links keyed by (source, target, link_type)).
  // NOTE: this is an ADVISORY metric and is NOT fully consistent with the
  // queue's dispute grouping (queue.service.groupDisputedLinks), which is
  // cardinality-aware and collapses competing targets of a FUNCTIONAL link
  // into ONE group. For functional multi-target disputes this can over-count
  // vs. the number of queue items. Reconciling the two is a follow-up (the
  // queue grouping is the user-facing source of truth).
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
