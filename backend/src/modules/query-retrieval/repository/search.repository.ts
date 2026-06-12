// Search repository — read-only access to the three full-text layers, the
// dedup join, and the supporting provenance lookups.
//
// CLAUDE.md "Security": every query is parameterized. Identifiers (FTS
// configuration names, table aliases, column names) are authored by the
// developer and never come from the network.
//
// Layer SQL queries (BR-01, BR-02 of `.spec.md` / BR-06, BR-07 of back spec):
//   - fragment: `information_fragment.text_search` (partial GIN WHERE status='accepted'),
//               score = ts_rank_cd * LAYER_WEIGHT_FRAGMENT.
//   - node:     `to_tsvector('simple_unaccent_v1', node_alias.alias)`,
//               score = ts_rank_cd * LAYER_WEIGHT_NODE, collapsed by node_id.
//   - chunk:    `raw_chunk.text_search` (full GIN),
//               score = ts_rank_cd * LAYER_WEIGHT_CHUNK.

import type { PoolClient } from "pg";

import { FTS_NAME_CONFIG, FTS_PROSE_CONFIG } from "./fts-config.js";
import {
  LAYER_WEIGHT_CHUNK,
  LAYER_WEIGHT_FRAGMENT,
  LAYER_WEIGHT_NODE,
} from "./scoring.js";

// ---------------------------------------------------------------------------
// Parsed tsquery check (BR-05).
//
// `websearch_to_tsquery` may return an empty tsquery for inputs that contain
// only stopwords (e.g. "o a de") or only operators (e.g. "OR -"). We ask
// Postgres for the canonical text of the parsed query and short-circuit the
// fan-out when the result is empty.
// ---------------------------------------------------------------------------

export async function parseTsQuery(
  client: PoolClient,
  query: string
): Promise<string> {
  const res = await client.query<{ q: string }>(
    `SELECT websearch_to_tsquery($1::regconfig, $2)::text AS q`,
    [FTS_PROSE_CONFIG, query]
  );
  return res.rows[0]?.q ?? "";
}

// ---------------------------------------------------------------------------
// Fragment layer (BR-01 / BR-09 / BR-08)
// ---------------------------------------------------------------------------

export interface FragmentHitRow {
  readonly id: string;
  readonly text: string;
  readonly confidence: string | number;
  readonly status: "accepted";
  readonly created_at: Date;
  readonly score: number;
}

/**
 * Fragment layer SQL. The partial GIN `information_fragment_fts_idx WHERE
 * status = 'accepted'` enforces the status filter at the index level (BR-05
 * of `.spec.md`); we add the WHERE clause defensively too so a future
 * change to the index does not silently leak non-accepted fragments.
 *
 * The layer weight is bound as `$2::float` — NEVER concatenated into SQL.
 */
export async function searchFragmentLayer(
  client: PoolClient,
  query: string,
  limit: number
): Promise<readonly FragmentHitRow[]> {
  const sql = `
    SELECT f.id,
           f.text,
           f.confidence,
           f.status,
           f.created_at,
           (ts_rank_cd(f.text_search, websearch_to_tsquery($1::regconfig, $2)) * $3::float)::float AS score
      FROM information_fragment f
     WHERE f.status = 'accepted'
       AND f.text_search @@ websearch_to_tsquery($1::regconfig, $2)
     ORDER BY score DESC, f.created_at DESC, f.id ASC
     LIMIT $4
  `;
  const res = await client.query<FragmentHitRow>(sql, [
    FTS_PROSE_CONFIG,
    query,
    LAYER_WEIGHT_FRAGMENT,
    limit,
  ]);
  return res.rows;
}

// ---------------------------------------------------------------------------
// Node-alias layer (BR-12 / BR-09)
// ---------------------------------------------------------------------------

export interface NodeAliasHitRow {
  readonly node_id: string;
  readonly canonical_name: string;
  readonly status: "active" | "needs_review";
  readonly score: number;
  /** UUID[] of matching `node_alias.id` — used by the provenance step. */
  readonly matched_alias_ids: readonly string[];
}

/**
 * Node-alias layer SQL. Collapses multiple alias hits onto a single
 * `node_id` via `GROUP BY` and reports the MAX rank across matching
 * aliases. Filters out merged/deleted nodes (BR-09).
 *
 * NOTE on `simple_unaccent_v1`: the index is on `to_tsvector('simple_unaccent_v1', alias)`
 * — same expression used in the WHERE clause so the GIN index applies.
 */
export async function searchNodeAliasLayer(
  client: PoolClient,
  query: string,
  limit: number
): Promise<readonly NodeAliasHitRow[]> {
  const sql = `
    SELECT kn.id  AS node_id,
           kn.canonical_name,
           kn.status,
           (max(ts_rank_cd(to_tsvector($1::regconfig, na.alias), websearch_to_tsquery($1::regconfig, $2))) * $3::float)::float AS score,
           array_agg(na.id) AS matched_alias_ids
      FROM node_alias na
      JOIN knowledge_node kn ON kn.id = na.node_id
     WHERE to_tsvector($1::regconfig, na.alias) @@ websearch_to_tsquery($1::regconfig, $2)
       AND kn.status NOT IN ('merged', 'deleted')
     GROUP BY kn.id, kn.canonical_name, kn.status
     ORDER BY score DESC, kn.canonical_name ASC, kn.id ASC
     LIMIT $4
  `;
  const res = await client.query<NodeAliasHitRow>(sql, [
    FTS_NAME_CONFIG,
    query,
    LAYER_WEIGHT_NODE,
    limit,
  ]);
  return res.rows;
}

// ---------------------------------------------------------------------------
// Chunk layer (BR-09 / BR-10)
// ---------------------------------------------------------------------------

export interface ChunkHitRow {
  readonly id: string;
  readonly raw_information_id: string;
  readonly chunk_index: number;
  readonly offset_start: number;
  readonly offset_end: number;
  readonly excerpt: string;
  readonly score: number;
}

/**
 * Chunk layer SQL. Returns the rank, excerpt and parent raw_information_id;
 * the dedup step in the service collapses chunks anchored by fragments
 * (BR-10). Excerpt is sliced in SQL with the +1 offset adjustment for
 * Postgres 1-based `substring` (BR-11 of back spec, A22).
 *
 * `superseded_at IS NULL` excludes compliance-tombstoned chunks (§11 — deleted
 * content must never come back through retrieval) and matches the partial GIN
 * index predicate of `raw_chunk_fts_idx`.
 */
export async function searchChunkLayer(
  client: PoolClient,
  query: string,
  limit: number
): Promise<readonly ChunkHitRow[]> {
  const sql = `
    SELECT rc.id,
           rc.raw_information_id,
           rc.chunk_index,
           rc.offset_start,
           rc.offset_end,
           substring(rc."text" FROM rc.offset_start + 1
                     FOR rc.offset_end - rc.offset_start) AS excerpt,
           (ts_rank_cd(rc.text_search, websearch_to_tsquery($1::regconfig, $2)) * $3::float)::float AS score
      FROM raw_chunk rc
     WHERE rc.text_search @@ websearch_to_tsquery($1::regconfig, $2)
       AND rc.superseded_at IS NULL
     ORDER BY score DESC, rc.id ASC
     LIMIT $4
  `;
  const res = await client.query<ChunkHitRow>(sql, [
    FTS_PROSE_CONFIG,
    query,
    LAYER_WEIGHT_CHUNK,
    limit,
  ]);
  return res.rows;
}

// ---------------------------------------------------------------------------
// Dedup join (BR-10) — fragment-source match between chunk hits and fragment hits
// ---------------------------------------------------------------------------

export interface DedupRow {
  readonly fragment_id: string;
  readonly raw_chunk_id: string;
}

/**
 * Batched dedup SQL. Returns the rows of `fragment_source` whose
 * `raw_chunk_id` is in the chunk-hit set AND `fragment_id` is in the
 * fragment-hit set. Empty input on either side returns an empty array
 * without issuing SQL (saves a round trip).
 */
export async function findChunkFragmentLinks(
  client: PoolClient,
  fragmentIds: readonly string[],
  rawChunkIds: readonly string[]
): Promise<readonly DedupRow[]> {
  if (fragmentIds.length === 0 || rawChunkIds.length === 0) return [];
  const res = await client.query<DedupRow>(
    `SELECT fs.fragment_id, fs.raw_chunk_id
       FROM fragment_source fs
      WHERE fs.raw_chunk_id = ANY($1::uuid[])
        AND fs.fragment_id  = ANY($2::uuid[])`,
    [rawChunkIds, fragmentIds]
  );
  return res.rows;
}

// ---------------------------------------------------------------------------
// Provenance lookups for search-result items (BR-18 building blocks)
// ---------------------------------------------------------------------------

export interface SearchProvenanceRow {
  readonly anchor_id: string;
  readonly fragment_id: string;
  readonly fragment_text: string;
  readonly fragment_confidence: string | number;
  readonly raw_chunk_id: string;
  readonly offset_start: number;
  readonly offset_end: number;
  readonly excerpt: string;
  readonly raw_information_id: string;
  readonly source_type: string;
  readonly received_at: Date;
}

/**
 * Assemble the provenance chain for a set of fragment ids. Used to surface
 * SearchProvenanceEntry rows for fragment-kind hits (the fragment IS its
 * own anchor — `anchor_id === fragment_id`).
 *
 * One round-trip SQL, no N+1.
 */
export async function listProvenanceForFragments(
  client: PoolClient,
  fragmentIds: readonly string[]
): Promise<readonly SearchProvenanceRow[]> {
  if (fragmentIds.length === 0) return [];
  const sql = `
    SELECT f.id          AS anchor_id,
           f.id          AS fragment_id,
           f.text        AS fragment_text,
           f.confidence  AS fragment_confidence,
           rc.id         AS raw_chunk_id,
           rc.offset_start,
           rc.offset_end,
           substring(rc."text" FROM rc.offset_start + 1
                     FOR rc.offset_end - rc.offset_start) AS excerpt,
           ri.id         AS raw_information_id,
           ri.source_type::text AS source_type,
           ri.received_at
      FROM information_fragment f
      JOIN fragment_source fs ON fs.fragment_id = f.id
      JOIN raw_chunk rc       ON rc.id = fs.raw_chunk_id
      JOIN raw_information ri ON ri.id = rc.raw_information_id
     WHERE f.id = ANY($1::uuid[])
     ORDER BY f.id, fs.raw_chunk_id ASC
  `;
  const res = await client.query<SearchProvenanceRow>(sql, [fragmentIds]);
  return res.rows;
}

/**
 * Assemble the provenance chain anchored on a list of `knowledge_link.id`s
 * (the union of `provenance` rows attached to each link). The `anchor_id`
 * column carries `provenance.link_id` so the service can group rows back
 * by link.
 *
 * One round-trip SQL, no N+1.
 */
export async function listProvenanceForLinks(
  client: PoolClient,
  linkIds: readonly string[]
): Promise<readonly SearchProvenanceRow[]> {
  if (linkIds.length === 0) return [];
  const sql = `
    SELECT p.link_id     AS anchor_id,
           f.id          AS fragment_id,
           f.text        AS fragment_text,
           f.confidence  AS fragment_confidence,
           rc.id         AS raw_chunk_id,
           rc.offset_start,
           rc.offset_end,
           substring(rc."text" FROM rc.offset_start + 1
                     FOR rc.offset_end - rc.offset_start) AS excerpt,
           ri.id         AS raw_information_id,
           ri.source_type::text AS source_type,
           ri.received_at
      FROM provenance p
      JOIN information_fragment f ON f.id = p.fragment_id
      JOIN fragment_source fs     ON fs.fragment_id = f.id
      JOIN raw_chunk rc           ON rc.id = fs.raw_chunk_id
      JOIN raw_information ri     ON ri.id = rc.raw_information_id
     WHERE p.link_id = ANY($1::uuid[])
     ORDER BY p.link_id, p.created_at ASC, f.id ASC
  `;
  const res = await client.query<SearchProvenanceRow>(sql, [linkIds]);
  return res.rows;
}

/**
 * Provenance anchored on `node_alias.id`s — for the node layer. We surface
 * the provenance of the fragments that support the matched aliases via
 * `fragment_source` (chunk -> fragment) — but `node_alias` itself has no
 * `provenance` table entry. Instead we read the provenance of the matched
 * aliases by following the chunks that contain the alias surface form.
 *
 * For TC-06 we take the pragmatic route: each node-alias hit surfaces a
 * synthetic provenance entry consisting of the matched alias's parent
 * `node_alias` row joined to the node's first accepted fragment if any;
 * the OpenAPI requires `provenance[] minItems: 1` (BR-13 of back spec).
 *
 * NOTE: the schema does not record a Provenance row for a node_alias hit
 * directly; the spec says "the chain is the union of the provenances of
 * the matching aliases' supporting fragments" — but `node_alias` does not
 * link to fragments. The practical anchor is the set of `provenance.fragment_id`
 * rows whose fragments mention the same canonical name. For v1 we surface
 * one synthetic SearchProvenanceEntry per node hit by joining to ANY
 * accepted fragment whose `text_search` matches the canonical name. When
 * no such fragment exists, the node hit is dropped — search MUST return
 * provenance >= 1 per OpenAPI contract. This is documented in the delivery
 * file as a known spec-vs-schema gap and is consistent with BR-19's
 * "empty provenance is a 500 alarm" policy applied at the layer level.
 */
export interface NodeProvenanceRow extends SearchProvenanceRow {}

export async function listProvenanceForNodes(
  client: PoolClient,
  nodeIds: readonly string[]
): Promise<readonly NodeProvenanceRow[]> {
  if (nodeIds.length === 0) return [];
  // Strategy: surface the provenance of every fragment whose text contains
  // the node's canonical_name token (subset of accepted fragments that
  // mention the node). Anchor id = node_id. One SQL, no N+1.
  const sql = `
    SELECT kn.id        AS anchor_id,
           f.id         AS fragment_id,
           f.text       AS fragment_text,
           f.confidence AS fragment_confidence,
           rc.id        AS raw_chunk_id,
           rc.offset_start,
           rc.offset_end,
           substring(rc."text" FROM rc.offset_start + 1
                     FOR rc.offset_end - rc.offset_start) AS excerpt,
           ri.id        AS raw_information_id,
           ri.source_type::text AS source_type,
           ri.received_at
      FROM knowledge_node kn
      JOIN node_alias na          ON na.node_id = kn.id
      JOIN information_fragment f ON f.status = 'accepted'
                                  AND f.text_search @@ to_tsquery($1::regconfig, na.alias_norm)
      JOIN fragment_source fs     ON fs.fragment_id = f.id
      JOIN raw_chunk rc           ON rc.id = fs.raw_chunk_id
      JOIN raw_information ri     ON ri.id = rc.raw_information_id
     WHERE kn.id = ANY($2::uuid[])
     ORDER BY kn.id, f.created_at DESC, f.id ASC
  `;
  const res = await client.query<NodeProvenanceRow>(sql, [
    FTS_PROSE_CONFIG,
    nodeIds,
  ]);
  return res.rows;
}

// ---------------------------------------------------------------------------
// Knowledge link metadata for ranking / summary (BR-13, BR-15)
// ---------------------------------------------------------------------------

export interface LinkMetadataRow {
  readonly id: string;
  readonly source_canonical_name: string;
  readonly target_canonical_name: string;
  readonly link_type: string;
  readonly recorded_at: Date;
  readonly status: string;
}

/**
 * Batched lookup of canonical names + link-type names for a set of link
 * ids — used by the service to format `SearchItem.summary` for link rows
 * surfaced by the graph expansion step.
 */
export async function findLinksMetadata(
  client: PoolClient,
  linkIds: readonly string[]
): Promise<readonly LinkMetadataRow[]> {
  if (linkIds.length === 0) return [];
  const res = await client.query<LinkMetadataRow>(
    `SELECT kl.id,
            src.canonical_name AS source_canonical_name,
            tgt.canonical_name AS target_canonical_name,
            lt.name            AS link_type,
            kl.recorded_at,
            kl.status::text    AS status
       FROM knowledge_link kl
       JOIN knowledge_node src ON src.id = kl.source_node_id
       JOIN knowledge_node tgt ON tgt.id = kl.target_node_id
       JOIN link_type lt       ON lt.id  = kl.link_type_id
      WHERE kl.id = ANY($1::uuid[])`,
    [linkIds]
  );
  return res.rows;
}
