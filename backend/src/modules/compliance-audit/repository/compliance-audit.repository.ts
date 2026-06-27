// Repository layer for the compliance-audit module.
//
// All queries are parameterized (CLAUDE.md "Security"). This module is the
// only one in the BFF authorized to issue UPDATE statements against
// raw_information / raw_chunk / information_fragment / knowledge_link /
// node_attribute (BR-12 carve-out). It owns INSERTs against
// compliance_deletion + curation_action (write-only for those two tables).
//
// The query bodies are aligned VERBATIM with the SQL templates of
// `compliance-audit.back.md §3 BR-04..BR-08`.

import type { PoolClient } from "pg";

import { InvariantError } from "../../../shared/invariant-error.js";
import type { ComplianceDeletionAffected } from "../dto/compliance-delete.dto.js";

// ---------------------------------------------------------------------------
// raw_information — single FOR UPDATE read + tombstone UPDATE
// ---------------------------------------------------------------------------

export interface RawInformationLockedRow {
  readonly id: string;
  readonly status: "active" | "needs_review" | "merged" | "deleted";
}

/**
 * BR-02 — first SQL of the UC-01 transaction. Locks the raw row and returns
 * its status; the service inspects the status to decide between the deletion
 * path and the idempotent no-op path (BR-03).
 */
export async function loadRawInformationForUpdate(
  client: PoolClient,
  rawInformationId: string
): Promise<RawInformationLockedRow | null> {
  const res = await client.query<RawInformationLockedRow>(
    `SELECT id, status
       FROM raw_information
      WHERE id = $1
      FOR UPDATE`,
    [rawInformationId]
  );
  return res.rows[0] ?? null;
}

/**
 * BR-04 + BR-05 + BR-18 — single UPDATE redacts content, the v1.3.0
 * `original_input` column (chat verbatim capture), sets the compliance flag in
 * metadata (shallow JSON merge), and transitions status + superseded_at.
 * content_hash is intentionally left untouched (BR-04).
 *
 * The `[REDACTED]` literal is hardcoded — never read from config (constraint
 * "[REDACTED] literal is hardcoded in the service").
 *
 * BR-18 — `original_input` is redacted in the SAME UPDATE statement using a
 * CASE expression so null stays null (rows never ingested through the
 * directed-chat path) and non-null is rewritten to the 10-character literal
 * `[REDACTED]`. The CASE preserves the audit-honest distinction between
 * "this row never carried a captured chat turn" (null after tombstone) and
 * "this row did carry a verbatim chat turn, which has been redacted under §11"
 * (`[REDACTED]` after tombstone). Atomic with `content` redaction.
 */
export async function tombstoneRawInformation(
  client: PoolClient,
  rawInformationId: string
): Promise<number> {
  const res = await client.query(
    `UPDATE raw_information
        SET content        = '[REDACTED]',
            original_input = CASE WHEN original_input IS NULL THEN NULL ELSE '[REDACTED]' END,
            metadata       = metadata || jsonb_build_object('compliance_deleted', true),
            status         = 'deleted',
            superseded_at  = now()
      WHERE id = $1
      RETURNING id`,
    [rawInformationId]
  );
  return res.rowCount ?? 0;
}

// ---------------------------------------------------------------------------
// Cascade: raw_chunk -> information_fragment -> knowledge_link / node_attribute
// ---------------------------------------------------------------------------

/**
 * Tombstone every raw_chunk anchored to the deleted raw. RETURNING.id count
 * feeds `affected.chunks` (BR-16). Spec UC-01 step 6 cascades BOTH
 * `status = 'deleted'` and `superseded_at = now()`.
 */
export async function tombstoneRawChunksOfRaw(
  client: PoolClient,
  rawInformationId: string
): Promise<number> {
  const res = await client.query(
    `UPDATE raw_chunk
        SET status        = 'deleted',
            superseded_at = now()
      WHERE raw_information_id = $1
        AND superseded_at IS NULL
      RETURNING id`,
    [rawInformationId]
  );
  return res.rowCount ?? 0;
}

/**
 * BR-06 — tombstones every fragment whose `fragment_source` chain anchors
 * ONLY chunks of the deleted raw. Cross-source fragments survive.
 *
 * RETURNING.id count feeds `affected.fragments` (BR-16). Spec UC-01 step 6
 * cascades BOTH `status = 'deleted'` and `superseded_at = now()`.
 */
export async function tombstoneCascadedFragments(
  client: PoolClient,
  rawInformationId: string
): Promise<number> {
  const res = await client.query(
    `UPDATE information_fragment AS f
        SET status        = 'deleted',
            superseded_at = now()
      WHERE EXISTS (
              SELECT 1 FROM fragment_source fs
                JOIN raw_chunk rc ON rc.id = fs.raw_chunk_id
               WHERE fs.fragment_id = f.id
                 AND rc.raw_information_id = $1)
        AND NOT EXISTS (
              SELECT 1 FROM fragment_source fs
                JOIN raw_chunk rc ON rc.id = fs.raw_chunk_id
                JOIN raw_information ri ON ri.id = rc.raw_information_id
               WHERE fs.fragment_id = f.id
                 AND ri.id <> $1
                 AND ri.status <> 'deleted')
        AND f.status <> 'deleted'
      RETURNING f.id`,
    [rawInformationId]
  );
  return res.rowCount ?? 0;
}

/**
 * BR-07 — tombstones every knowledge_link whose provenance chain ALL points
 * to fragments anchored exclusively in the deleted raw.
 *
 * RETURNING.id count feeds `affected.links` (BR-16).
 */
export async function tombstoneCascadedLinks(
  client: PoolClient,
  rawInformationId: string
): Promise<number> {
  const res = await client.query(
    `UPDATE knowledge_link AS kl
        SET status        = 'deleted',
            superseded_at = now()
      WHERE EXISTS (SELECT 1 FROM provenance p
                      JOIN information_fragment f ON f.id = p.fragment_id
                      JOIN fragment_source fs ON fs.fragment_id = f.id
                      JOIN raw_chunk rc ON rc.id = fs.raw_chunk_id
                     WHERE p.link_id = kl.id
                       AND rc.raw_information_id = $1)
        AND NOT EXISTS (SELECT 1 FROM provenance p
                          JOIN information_fragment f ON f.id = p.fragment_id
                          JOIN fragment_source fs ON fs.fragment_id = f.id
                          JOIN raw_chunk rc ON rc.id = fs.raw_chunk_id
                          JOIN raw_information ri ON ri.id = rc.raw_information_id
                         WHERE p.link_id = kl.id
                           AND ri.id <> $1
                           AND ri.status <> 'deleted')
        AND kl.status <> 'deleted'
      RETURNING kl.id`,
    [rawInformationId]
  );
  return res.rowCount ?? 0;
}

/**
 * BR-07 — tombstones every node_attribute whose provenance chain ALL points
 * to fragments anchored exclusively in the deleted raw.
 *
 * RETURNING.id count feeds `affected.attributes` (BR-16).
 */
export async function tombstoneCascadedAttributes(
  client: PoolClient,
  rawInformationId: string
): Promise<number> {
  const res = await client.query(
    `UPDATE node_attribute AS na
        SET status        = 'deleted',
            superseded_at = now()
      WHERE EXISTS (SELECT 1 FROM provenance p
                      JOIN information_fragment f ON f.id = p.fragment_id
                      JOIN fragment_source fs ON fs.fragment_id = f.id
                      JOIN raw_chunk rc ON rc.id = fs.raw_chunk_id
                     WHERE p.attribute_id = na.id
                       AND rc.raw_information_id = $1)
        AND NOT EXISTS (SELECT 1 FROM provenance p
                          JOIN information_fragment f ON f.id = p.fragment_id
                          JOIN fragment_source fs ON fs.fragment_id = f.id
                          JOIN raw_chunk rc ON rc.id = fs.raw_chunk_id
                          JOIN raw_information ri ON ri.id = rc.raw_information_id
                         WHERE p.attribute_id = na.id
                           AND ri.id <> $1
                           AND ri.status <> 'deleted')
        AND na.status <> 'deleted'
      RETURNING na.id`,
    [rawInformationId]
  );
  return res.rowCount ?? 0;
}

// ---------------------------------------------------------------------------
// compliance_deletion — write + read
// ---------------------------------------------------------------------------

export interface ComplianceDeletionRow {
  readonly id: string;
  readonly raw_information_id: string;
  readonly reason: string;
  readonly executed_at: Date;
  readonly affected: ComplianceDeletionAffected;
}

/**
 * BR-08 — writes the single ComplianceDeletion row inside the UC-01
 * transaction. Returns the persisted row including the server-side
 * `executed_at` timestamp.
 */
export async function insertComplianceDeletion(
  client: PoolClient,
  args: {
    raw_information_id: string;
    reason: string;
    affected: ComplianceDeletionAffected;
  }
): Promise<ComplianceDeletionRow> {
  const res = await client.query<ComplianceDeletionRow>(
    `INSERT INTO compliance_deletion (raw_information_id, reason, affected)
     VALUES ($1, $2, jsonb_build_object(
       'chunks', $3::int,
       'fragments', $4::int,
       'links', $5::int,
       'attributes', $6::int))
     RETURNING id, raw_information_id, reason, executed_at, affected`,
    [
      args.raw_information_id,
      args.reason,
      args.affected.chunks,
      args.affected.fragments,
      args.affected.links,
      args.affected.attributes,
    ]
  );
  const row = res.rows[0];
  if (!row) {
    throw new InvariantError("insertComplianceDeletion returned no row");
  }
  return row;
}

/**
 * BR-03 lookup — used by the idempotent no-op path after the FOR UPDATE
 * confirms `status = 'deleted'`. Returns the single (LIMIT 1) row or null.
 *
 * Zero rows on a deleted raw is the BR-17 legacy-orphan signal.
 */
export async function findComplianceDeletionByRawId(
  client: PoolClient,
  rawInformationId: string
): Promise<ComplianceDeletionRow | null> {
  const res = await client.query<ComplianceDeletionRow>(
    `SELECT id, raw_information_id, reason, executed_at, affected
       FROM compliance_deletion
      WHERE raw_information_id = $1
      ORDER BY executed_at DESC
      LIMIT 1`,
    [rawInformationId]
  );
  return res.rows[0] ?? null;
}

/** UC-03 — fetch a single ComplianceDeletion by primary key. */
export async function findComplianceDeletionById(
  client: PoolClient,
  id: string
): Promise<ComplianceDeletionRow | null> {
  const res = await client.query<ComplianceDeletionRow>(
    `SELECT id, raw_information_id, reason, executed_at, affected
       FROM compliance_deletion
      WHERE id = $1`,
    [id]
  );
  return res.rows[0] ?? null;
}

export interface ListComplianceDeletionsFilters {
  readonly raw_information_id?: string;
  readonly executed_from?: string;
  readonly executed_to?: string;
  readonly limit: number;
  readonly offset: number;
}

export interface ListComplianceDeletionsResult {
  readonly items: ComplianceDeletionRow[];
  readonly total: number;
}

/**
 * UC-02 — list ComplianceDeletion rows newest-first with optional filters.
 * BR-09: `executed_from` inclusive, `executed_to` exclusive (semi-open).
 */
export async function listComplianceDeletions(
  client: PoolClient,
  f: ListComplianceDeletionsFilters
): Promise<ListComplianceDeletionsResult> {
  const where: string[] = [];
  const params: unknown[] = [];
  let i = 1;
  if (f.raw_information_id) {
    where.push(`raw_information_id = $${i++}`);
    params.push(f.raw_information_id);
  }
  if (f.executed_from) {
    where.push(`executed_at >= $${i++}`);
    params.push(f.executed_from);
  }
  if (f.executed_to) {
    where.push(`executed_at < $${i++}`);
    params.push(f.executed_to);
  }
  const whereClause = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";

  const dataParams = [...params, f.limit, f.offset];
  const dataSql = `SELECT id, raw_information_id, reason, executed_at, affected
                     FROM compliance_deletion
                     ${whereClause}
                     ORDER BY executed_at DESC
                     LIMIT $${i++} OFFSET $${i++}`;
  const dataRes = await client.query<ComplianceDeletionRow>(dataSql, dataParams);

  const countSql = `SELECT count(*)::int AS total
                      FROM compliance_deletion
                      ${whereClause}`;
  const countRes = await client.query<{ total: number }>(countSql, params);
  const total = countRes.rows[0]?.total ?? 0;

  return { items: dataRes.rows, total };
}

// ---------------------------------------------------------------------------
// curation_action — INSERT (one row per UC-01 'deleted' outcome) + read paths
// ---------------------------------------------------------------------------

export interface CurationActionInsertArgs {
  readonly action: string;
  readonly target_kind: string;
  readonly target_id: string | null;
  readonly payload: Record<string, unknown>;
  readonly reason: string | null;
}

export interface CurationActionRow {
  readonly id: string;
  readonly action: string;
  readonly target_kind: string;
  readonly target_id: string | null;
  readonly payload: Record<string, unknown>;
  readonly reason: string | null;
  readonly created_at: Date;
}

/**
 * BR-08 — inserts the one CurationAction row per UC-01 `deleted` outcome.
 * Reused by the future `curation` domain for the other six tool actions.
 */
export async function insertCurationAction(
  client: PoolClient,
  args: CurationActionInsertArgs
): Promise<CurationActionRow> {
  const res = await client.query<CurationActionRow>(
    `INSERT INTO curation_action (action, target_kind, target_id, payload, reason)
     VALUES ($1, $2, $3, $4::jsonb, $5)
     RETURNING id, action, target_kind, target_id, payload, reason, created_at`,
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

/** UC-05 — fetch a single CurationAction by primary key. */
export async function findCurationActionById(
  client: PoolClient,
  id: string
): Promise<CurationActionRow | null> {
  const res = await client.query<CurationActionRow>(
    `SELECT id, action, target_kind, target_id, payload, reason, created_at
       FROM curation_action
      WHERE id = $1`,
    [id]
  );
  return res.rows[0] ?? null;
}

export interface ListCurationActionsFilters {
  readonly action?: string;
  readonly target_kind?: string;
  readonly target_id?: string;
  readonly created_from?: string;
  readonly created_to?: string;
  readonly limit: number;
  readonly offset: number;
}

export interface ListCurationActionsResult {
  readonly items: CurationActionRow[];
  readonly total: number;
}

/**
 * UC-04 — list CurationAction rows newest-first with optional filters.
 * BR-09 semi-open range, BR-10 enum already enforced at API layer.
 */
export async function listCurationActions(
  client: PoolClient,
  f: ListCurationActionsFilters
): Promise<ListCurationActionsResult> {
  const where: string[] = [];
  const params: unknown[] = [];
  let i = 1;
  if (f.action) {
    where.push(`action = $${i++}`);
    params.push(f.action);
  }
  if (f.target_kind) {
    where.push(`target_kind = $${i++}`);
    params.push(f.target_kind);
  }
  if (f.target_id) {
    where.push(`target_id = $${i++}`);
    params.push(f.target_id);
  }
  if (f.created_from) {
    where.push(`created_at >= $${i++}`);
    params.push(f.created_from);
  }
  if (f.created_to) {
    where.push(`created_at < $${i++}`);
    params.push(f.created_to);
  }
  const whereClause = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";

  const dataParams = [...params, f.limit, f.offset];
  const dataSql = `SELECT id, action, target_kind, target_id, payload, reason, created_at
                     FROM curation_action
                     ${whereClause}
                     ORDER BY created_at DESC
                     LIMIT $${i++} OFFSET $${i++}`;
  const dataRes = await client.query<CurationActionRow>(dataSql, dataParams);

  const countSql = `SELECT count(*)::int AS total
                      FROM curation_action
                      ${whereClause}`;
  const countRes = await client.query<{ total: number }>(countSql, params);
  const total = countRes.rows[0]?.total ?? 0;

  return { items: dataRes.rows, total };
}
