// Provenance walk repository (BR-18 of `query-retrieval.back.md`).
//
// One SQL per request — the chain is `provenance? -> information_fragment ->
// fragment_source -> raw_chunk -> raw_information`. The EXISTS tombstone
// short-circuit (BR-17) is a SEPARATE check that runs BEFORE the chain
// assembly so that the service can return 410 without ever materialising
// tombstoned content.
//
// All queries are parameterised. Excerpt slicing uses the +1 offset
// adjustment for Postgres 1-based `substring` (BR-11 / A22).

import type { PoolClient } from "pg";

// ---------------------------------------------------------------------------
// Anchor existence checks (BR-16) — 404 vs 410 precedence
// ---------------------------------------------------------------------------

export async function linkExists(
  client: PoolClient,
  linkId: string
): Promise<boolean> {
  const res = await client.query<{ exists: boolean }>(
    `SELECT EXISTS(SELECT 1 FROM knowledge_link WHERE id = $1) AS exists`,
    [linkId]
  );
  return res.rows[0]?.exists ?? false;
}

export async function attributeExists(
  client: PoolClient,
  attributeId: string
): Promise<boolean> {
  const res = await client.query<{ exists: boolean }>(
    `SELECT EXISTS(SELECT 1 FROM node_attribute WHERE id = $1) AS exists`,
    [attributeId]
  );
  return res.rows[0]?.exists ?? false;
}

export interface FragmentStatusRow {
  readonly id: string;
  readonly status: "accepted" | "proposed" | "rejected" | "deleted";
}

export async function findFragmentStatus(
  client: PoolClient,
  fragmentId: string
): Promise<FragmentStatusRow | null> {
  const res = await client.query<FragmentStatusRow>(
    `SELECT id, status::text AS status
       FROM information_fragment WHERE id = $1`,
    [fragmentId]
  );
  return res.rows[0] ?? null;
}

// ---------------------------------------------------------------------------
// Chain assembly — one SQL per endpoint variant (BR-18)
// ---------------------------------------------------------------------------

export interface ProvenanceChainRow {
  readonly fragment_id: string;
  readonly fragment_text: string;
  readonly fragment_confidence: string | number;
  readonly fragment_status: "accepted" | "proposed" | "rejected" | "deleted";
  readonly raw_chunk_id: string;
  readonly chunk_index: number;
  readonly offset_start: number;
  readonly offset_end: number;
  readonly excerpt: string;
  readonly locator: Record<string, unknown> | null;
  readonly raw_information_id: string;
  readonly source_type: string;
  readonly received_at: Date;
  readonly metadata: Record<string, unknown>;
  // v1.4.0 — verbatim chat user turn captured by `ingest_directed`
  // (`ingestion.back.md` BR-34). Null for non-chat sources and rows that
  // predate the feature. `'[REDACTED]'` after `compliance_delete` (BR-18 of
  // compliance-audit). NOT part of the content_hash; NOT indexed by
  // full-text — surface-only field.
  readonly original_input: string | null;
}

/**
 * Provenance chain anchored on a `knowledge_link.id`.
 */
export async function chainByLink(
  client: PoolClient,
  linkId: string
): Promise<readonly ProvenanceChainRow[]> {
  return runChainSql(client, "p.link_id", linkId, false);
}

/**
 * Provenance chain anchored on a `node_attribute.id`.
 */
export async function chainByAttribute(
  client: PoolClient,
  attributeId: string
): Promise<readonly ProvenanceChainRow[]> {
  return runChainSql(client, "p.attribute_id", attributeId, false);
}

/**
 * Provenance chain anchored on an `information_fragment.id` — there is no
 * `provenance` row to traverse here; the input IS the fragment. We read
 * the fragment + chunks + raw rows directly.
 */
export async function chainByFragment(
  client: PoolClient,
  fragmentId: string
): Promise<readonly ProvenanceChainRow[]> {
  return runChainSql(client, "f.id", fragmentId, true);
}

/**
 * Shared SQL. `anchorCol` is one of `p.link_id`, `p.attribute_id` (with
 * `useProvenance=false`) or `f.id` (with `useProvenance=true`). The flag
 * tells us whether to JOIN the `provenance` table at all — `getProvenanceByFragment`
 * does not.
 *
 * `anchorCol` is a developer-authored identifier (never user input). The
 * anchor value is parameterised.
 */
async function runChainSql(
  client: PoolClient,
  anchorCol: "p.link_id" | "p.attribute_id" | "f.id",
  anchorValue: string,
  isFragmentAnchor: boolean
): Promise<readonly ProvenanceChainRow[]> {
  const sql = isFragmentAnchor
    ? `
        SELECT f.id        AS fragment_id,
               f.text      AS fragment_text,
               f.confidence AS fragment_confidence,
               f.status::text AS fragment_status,
               rc.id       AS raw_chunk_id,
               rc.chunk_index,
               rc.offset_start,
               rc.offset_end,
               substring(rc."text" FROM rc.offset_start + 1
                         FOR rc.offset_end - rc.offset_start) AS excerpt,
               rc.locator,
               ri.id       AS raw_information_id,
               ri.source_type::text AS source_type,
               ri.received_at,
               ri.metadata,
               ri.original_input
          FROM information_fragment f
          JOIN fragment_source fs ON fs.fragment_id = f.id
          JOIN raw_chunk rc       ON rc.id = fs.raw_chunk_id
          JOIN raw_information ri ON ri.id = rc.raw_information_id
         WHERE f.id = $1
         ORDER BY f.id, rc.chunk_index ASC, rc.id ASC
      `
    : `
        SELECT f.id        AS fragment_id,
               f.text      AS fragment_text,
               f.confidence AS fragment_confidence,
               f.status::text AS fragment_status,
               rc.id       AS raw_chunk_id,
               rc.chunk_index,
               rc.offset_start,
               rc.offset_end,
               substring(rc."text" FROM rc.offset_start + 1
                         FOR rc.offset_end - rc.offset_start) AS excerpt,
               rc.locator,
               ri.id       AS raw_information_id,
               ri.source_type::text AS source_type,
               ri.received_at,
               ri.metadata,
               ri.original_input
          FROM provenance p
          JOIN information_fragment f ON f.id = p.fragment_id
          JOIN fragment_source fs     ON fs.fragment_id = f.id
          JOIN raw_chunk rc           ON rc.id = fs.raw_chunk_id
          JOIN raw_information ri     ON ri.id = rc.raw_information_id
         WHERE ${anchorCol} = $1
         ORDER BY p.created_at ASC, f.id, rc.chunk_index ASC, rc.id ASC
      `;
  const res = await client.query<ProvenanceChainRow>(sql, [anchorValue]);
  return res.rows;
}

// ---------------------------------------------------------------------------
// Tombstone short-circuit (BR-17)
//
// Given the set of raw_information_id values reached by the chain, return
// the FIRST tombstone row (if any). One SQL, ANY-array bound — no N+1.
// ---------------------------------------------------------------------------

export interface TombstoneRow {
  readonly raw_information_id: string;
  readonly performed_at: Date;
}

export async function findTombstone(
  client: PoolClient,
  rawInformationIds: readonly string[]
): Promise<TombstoneRow | null> {
  if (rawInformationIds.length === 0) return null;
  // The physical column is `executed_at` (compliance_deletion is owned by the
  // compliance-audit domain — its schema is authoritative). The alias keeps
  // the `performed_at` name this domain's spec uses for the 410 mapping.
  const res = await client.query<TombstoneRow>(
    `SELECT raw_information_id, executed_at AS performed_at
       FROM compliance_deletion
      WHERE raw_information_id = ANY($1::uuid[])
      ORDER BY executed_at ASC
      LIMIT 1`,
    [rawInformationIds]
  );
  return res.rows[0] ?? null;
}
