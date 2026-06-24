// Repository for `listAcceptedFragments` (openapi v1.3.0, TC-be-002).
//
// Two parameterised SQL statements share the same filter predicate:
//   - `countAcceptedFragments`: total BEFORE pagination
//   - `selectAcceptedFragments`: paginated page, with the MIN(chunk_index)
//     supporting chunk per fragment (deterministic dedup).
//
// Filter (back-spec BR-14 tombstone short-circuit + task spec):
//   - `f.status = 'accepted'`
//   - `($1::uuid IS NULL OR f.llm_run_id = $1)`
//   - `($2::uuid IS NULL OR r.id = $2)`
//   - `NOT EXISTS (SELECT 1 FROM compliance_deletion cd
//                  WHERE cd.raw_information_id = r.id)` — tombstone short-circuit.
//
// Deduplication: a fragment may have multiple `fragment_source` rows; the
// listing contract returns each fragment exactly once and surfaces the FIRST
// supporting chunk by `chunk_index ASC`. We compute that join inline using
// `DISTINCT ON (f.id) ... ORDER BY f.id, rc.chunk_index ASC`. The COUNT query
// uses the same `DISTINCT` subselect to keep the total consistent with the
// page-level dedup.
//
// Ordering (page query, overall):
//   `r.received_at DESC NULLS LAST, f.created_at DESC, f.id ASC`
//
// All inputs are parameterised; `uuid::uuid` casts make the NULL bridge
// explicit so a missing filter becomes a no-op in SQL.

import type { PoolClient } from "pg";

export interface AcceptedFragmentRow {
  readonly fragment_id: string;
  readonly fragment_text: string;
  readonly fragment_confidence: string | number;
  readonly fragment_llm_run_id: string;
  readonly fragment_created_at: Date;
  readonly raw_information_id: string;
  readonly chunk_index: number;
  readonly source_type: string;
  readonly received_at: Date;
  readonly document_title: string | null;
}

const FILTER_WHERE = `
       f.status = 'accepted'
   AND ($1::uuid IS NULL OR f.llm_run_id = $1::uuid)
   AND ($2::uuid IS NULL OR r.id = $2::uuid)
   AND NOT EXISTS (
         SELECT 1 FROM compliance_deletion cd
          WHERE cd.raw_information_id = r.id
       )
`;

/**
 * Count distinct accepted fragments matching the filter (pre-pagination total).
 */
export async function countAcceptedFragments(
  client: PoolClient,
  llmRunId: string | null,
  rawInformationId: string | null
): Promise<number> {
  const sql = `
    SELECT COUNT(DISTINCT f.id)::bigint AS total
      FROM information_fragment f
      JOIN fragment_source fs ON fs.fragment_id = f.id
      JOIN raw_chunk rc      ON rc.id = fs.raw_chunk_id
      JOIN raw_information r ON r.id = rc.raw_information_id
     WHERE ${FILTER_WHERE}
  `;
  const res = await client.query<{ total: string | number }>(sql, [
    llmRunId,
    rawInformationId,
  ]);
  // pg returns bigint as string; coerce defensively.
  const raw = res.rows[0]?.total ?? 0;
  return typeof raw === "number" ? raw : Number(raw);
}

/**
 * Select one row per accepted fragment, with the MIN(chunk_index) supporting
 * chunk and its raw-information source ref. Ordered per the openapi contract.
 *
 * The `DISTINCT ON (f.id)` pass picks the lowest-chunk-index chunk per
 * fragment; the outer SELECT then orders the result globally and applies
 * LIMIT/OFFSET.
 */
export async function selectAcceptedFragments(
  client: PoolClient,
  llmRunId: string | null,
  rawInformationId: string | null,
  limit: number,
  offset: number
): Promise<readonly AcceptedFragmentRow[]> {
  const sql = `
    WITH deduped AS (
      SELECT DISTINCT ON (f.id)
             f.id          AS fragment_id,
             f.text        AS fragment_text,
             f.confidence  AS fragment_confidence,
             f.llm_run_id  AS fragment_llm_run_id,
             f.created_at  AS fragment_created_at,
             r.id          AS raw_information_id,
             rc.chunk_index,
             r.source_type::text AS source_type,
             r.received_at,
             r.metadata->>'title' AS document_title
        FROM information_fragment f
        JOIN fragment_source fs ON fs.fragment_id = f.id
        JOIN raw_chunk rc       ON rc.id = fs.raw_chunk_id
        JOIN raw_information r  ON r.id = rc.raw_information_id
       WHERE ${FILTER_WHERE}
       ORDER BY f.id, rc.chunk_index ASC, rc.id ASC
    )
    SELECT *
      FROM deduped
     ORDER BY received_at DESC NULLS LAST,
              fragment_created_at DESC,
              fragment_id ASC
     LIMIT $3
    OFFSET $4
  `;
  const res = await client.query<AcceptedFragmentRow>(sql, [
    llmRunId,
    rawInformationId,
    limit,
    offset,
  ]);
  return res.rows;
}
