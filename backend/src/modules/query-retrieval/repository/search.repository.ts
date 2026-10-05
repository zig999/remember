import type { PoolClient } from "pg";

import { FTS_NAME_CONFIG, FTS_PROSE_CONFIG } from "./fts-config.js";
import {
  APPROXIMATE_ALIAS_MIN_LENGTH,
  APPROXIMATE_MATCH_MIN_SIMILARITY,
  LAYER_WEIGHT_CHUNK,
  LAYER_WEIGHT_FRAGMENT,
  LAYER_WEIGHT_NODE,
} from "./scoring.js";

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

export interface FragmentHitRow {
  readonly id: string;
  readonly text: string;
  readonly confidence: string | number;
  readonly status: "accepted";
  readonly created_at: Date;
  readonly score: number;
}

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

export interface NodeAliasHitRow {
  readonly node_id: string;
  readonly canonical_name: string;
  readonly status: "active" | "needs_review";
  readonly score: number;
  readonly matched_alias_ids: readonly string[];
}

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

export interface ApproximateNodeSearchInput {
  readonly query: string;
  readonly limit: number;
  readonly excludedNodeIds: readonly string[];
}

const APPROXIMATE_NODE_ALIAS_SQL = `
    SELECT kn.id  AS node_id,
           kn.canonical_name,
           kn.status,
           (max(word_similarity(na.alias_norm, norm($1::text))) * $2::float)::float AS score,
           array_agg(na.id) AS matched_alias_ids
      FROM knowledge_node kn
      JOIN node_alias na ON na.node_id = kn.id
     WHERE kn.status NOT IN ('merged', 'deleted')
       AND kn.id <> ALL($5::uuid[])
       AND char_length(na.alias_norm) >= $3::int
       AND word_similarity(na.alias_norm, norm($1::text)) >= $4::real
     GROUP BY kn.id, kn.canonical_name, kn.status
     ORDER BY score DESC, kn.canonical_name ASC, kn.id ASC
     LIMIT $6
  `;

export async function searchNodeAliasApproximateLayer(
  client: PoolClient,
  input: ApproximateNodeSearchInput
): Promise<readonly NodeAliasHitRow[]> {
  const res = await client.query<NodeAliasHitRow>(APPROXIMATE_NODE_ALIAS_SQL, [
    input.query,
    LAYER_WEIGHT_NODE,
    APPROXIMATE_ALIAS_MIN_LENGTH,
    APPROXIMATE_MATCH_MIN_SIMILARITY,
    input.excludedNodeIds,
    input.limit,
  ]);
  return res.rows;
}

export interface ChunkHitRow {
  readonly id: string;
  readonly raw_information_id: string;
  readonly chunk_index: number;
  readonly offset_start: number;
  readonly offset_end: number;
  readonly excerpt: string;
  readonly score: number;
}

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

export interface DedupRow {
  readonly fragment_id: string;
  readonly raw_chunk_id: string;
}

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

export type NodeProvenanceRow = SearchProvenanceRow;

export async function listProvenanceForNodes(
  client: PoolClient,
  nodeIds: readonly string[]
): Promise<readonly NodeProvenanceRow[]> {
  if (nodeIds.length === 0) return [];
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
                                  AND f.text_search @@ plainto_tsquery($1::regconfig, na.alias_norm)
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

export interface LinkMetadataRow {
  readonly id: string;
  readonly source_canonical_name: string;
  readonly target_canonical_name: string;
  readonly link_type: string;
  readonly recorded_at: Date;
  readonly status: string;
}

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
