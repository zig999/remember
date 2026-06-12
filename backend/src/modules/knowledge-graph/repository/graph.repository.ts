// Graph repository — read-only access to `knowledge_node`, `node_alias`,
// `node_attribute`, `knowledge_link`, `provenance` and the resolved views
// (`knowledge_link_resolved`, `node_attribute_resolved`).
//
// CLAUDE.md "Security": every query is parameterized. Identifiers (column
// names, view aliases) are authored by the developer and never come from
// the network. `applyTemporalFilter` composes the temporal predicates.
//
// BR-09: derived fields (`is_current`, `is_in_effect`, `effective_status`)
// are read directly from the views. The BFF never recomputes them.

import type { PoolClient } from "pg";

import {
  applyTemporalFilter,
  type TemporalFilterOptions,
} from "./temporal-filter.js";

// ---------------------------------------------------------------------------
// knowledge_node
// ---------------------------------------------------------------------------

export interface KnowledgeNodeRow {
  readonly id: string;
  readonly node_type_id: string;
  readonly node_type: string;
  readonly canonical_name: string;
  readonly status: "active" | "needs_review" | "merged" | "deleted";
  readonly merged_into_node_id: string | null;
  readonly created_at: Date;
  readonly updated_at: Date;
}

/** Read a single node + its scope NodeType name (joined). */
export async function findNodeById(
  client: PoolClient,
  nodeId: string
): Promise<KnowledgeNodeRow | null> {
  const res = await client.query<KnowledgeNodeRow>(
    `SELECT kn.id, kn.node_type_id, nt.name AS node_type,
            kn.canonical_name, kn.status, kn.merged_into_node_id,
            kn.created_at, kn.updated_at
       FROM knowledge_node kn
       JOIN node_type nt ON nt.id = kn.node_type_id
       WHERE kn.id = $1`,
    [nodeId]
  );
  return res.rows[0] ?? null;
}

export interface ListNodesFilter {
  /** Resolved NodeType id (resolved from `node_type` name in the service). */
  readonly node_type_id?: string;
  /** Already-normalised prefix (`norm(name_prefix)`); compared via LIKE. */
  readonly name_prefix_norm?: string;
  /** Status filter; defaults to "active" in the service (BR-15). */
  readonly status: "active" | "needs_review" | "merged" | "deleted";
  readonly limit: number;
  readonly offset: number;
}

export interface ListNodesResult {
  readonly items: readonly KnowledgeNodeRow[];
  readonly total: number;
}

/**
 * List nodes filtered by status, optional NodeType, optional name-prefix
 * lookup (via `node_alias.alias_norm`). Uses two SQL queries (data + count).
 *
 * Prefix lookup mechanics (BR-03 of `.spec.md` / UC-04):
 *   - We pass the already-normalized prefix as `$X` and compare with
 *     `alias_norm LIKE $X || '%'`. The btree index on `alias_norm`
 *     supports left-anchored LIKE under the default collation.
 *   - DISTINCT on `kn.id` because a node can have many matching aliases.
 *
 * Per CLAUDE.md "Known Gotchas", `unaccent()` is STABLE; the caller has
 * already invoked `norm()` (via `immutable_unaccent`) at the application
 * boundary so the bound parameter is already normalized.
 */
export async function listNodes(
  client: PoolClient,
  filter: ListNodesFilter
): Promise<ListNodesResult> {
  const params: unknown[] = [];
  const where: string[] = ["kn.status = $1"];
  params.push(filter.status);

  if (filter.node_type_id !== undefined) {
    params.push(filter.node_type_id);
    where.push(`kn.node_type_id = $${params.length}`);
  }

  // We always JOIN node_type for the response. Alias prefix is an optional
  // INNER JOIN — when present, narrows the candidate set; the DISTINCT keeps
  // one row per node id.
  let aliasJoin = "";
  if (filter.name_prefix_norm !== undefined) {
    params.push(filter.name_prefix_norm);
    aliasJoin = `JOIN node_alias na ON na.node_id = kn.id
                   AND na.alias_norm LIKE $${params.length} || '%'`;
  }

  const baseFrom = `FROM knowledge_node kn
                    JOIN node_type nt ON nt.id = kn.node_type_id
                    ${aliasJoin}
                    WHERE ${where.join(" AND ")}`;

  // Count first (separate query keeps the parametrisation simple).
  const countSql = `SELECT count(DISTINCT kn.id)::int AS total
                      ${baseFrom}`;
  const countRes = await client.query<{ total: number }>(countSql, params);
  const total = countRes.rows[0]?.total ?? 0;

  // Data.
  params.push(filter.limit);
  const limitIdx = params.length;
  params.push(filter.offset);
  const offsetIdx = params.length;

  const dataSql = `SELECT DISTINCT kn.id, kn.node_type_id, nt.name AS node_type,
                          kn.canonical_name, kn.status, kn.merged_into_node_id,
                          kn.created_at, kn.updated_at
                    ${baseFrom}
                    ORDER BY kn.canonical_name ASC, kn.id ASC
                    LIMIT $${limitIdx} OFFSET $${offsetIdx}`;
  const dataRes = await client.query<KnowledgeNodeRow>(dataSql, params);
  return { items: dataRes.rows, total };
}

// ---------------------------------------------------------------------------
// node_alias
// ---------------------------------------------------------------------------

export interface NodeAliasRow {
  readonly id: string;
  readonly node_id: string;
  readonly alias: string;
  readonly alias_norm: string;
  readonly kind: "canonical" | "alias";
  readonly created_at: Date;
}

export async function listAliasesByNodeId(
  client: PoolClient,
  nodeId: string
): Promise<readonly NodeAliasRow[]> {
  const res = await client.query<NodeAliasRow>(
    `SELECT id, node_id, alias, alias_norm, kind, created_at
       FROM node_alias
       WHERE node_id = $1
       ORDER BY kind ASC, alias ASC`,
    [nodeId]
  );
  return res.rows;
}

// ---------------------------------------------------------------------------
// node_attribute_resolved (the read path — §5.4)
// ---------------------------------------------------------------------------

export interface AttributeResolvedRow {
  readonly id: string;
  readonly node_id: string;
  readonly attribute_key_id: string;
  readonly value_type: "date" | "number" | "text" | "bool";
  readonly value: string;
  readonly valid_from: Date | null;
  readonly valid_to: Date | null;
  readonly recorded_at: Date;
  readonly superseded_at: Date | null;
  readonly status: "active" | "uncertain" | "disputed" | "superseded" | "deleted";
  readonly confidence: string | number;
  readonly valid_from_source: "stated" | "document" | "received" | null;
  readonly created_by_run_id: string | null;
  readonly supersedes_attribute_id: string | null;
  readonly created_at: Date;
  readonly updated_at: Date;
  readonly attribute_key: string;
  readonly key_is_temporal: boolean;
  readonly key_allows_multiple_current: boolean;
  readonly is_current: boolean;
  readonly is_in_effect: boolean;
  readonly effective_status: string;
}

export interface ListAttributesByNodeFilter extends TemporalFilterOptions {
  readonly nodeId: string;
  readonly includeUncertain: boolean;
}

/**
 * List the attribute rows for a node, applying the temporal-filter helper
 * (BR-07 / BR-08) and the `include_uncertain` flag (BR-21).
 */
export async function listAttributesByNodeId(
  client: PoolClient,
  filter: ListAttributesByNodeFilter
): Promise<readonly AttributeResolvedRow[]> {
  const params: unknown[] = [filter.nodeId];
  const temporal = applyTemporalFilter("na", params.length + 1, {
    asOf: filter.asOf,
    inEffectOnly: filter.inEffectOnly,
  });
  params.push(...temporal.params);

  // BR-21: filter on the storage column `status`, never on the derived flag.
  let uncertainClause = "";
  if (!filter.includeUncertain) {
    uncertainClause = "AND na.status <> 'uncertain'";
  }

  const sql = `SELECT na.*
                 FROM node_attribute_resolved na
                WHERE na.node_id = $1
                  ${temporal.sql}
                  ${uncertainClause}
                ORDER BY na.attribute_key ASC, na.recorded_at ASC, na.id ASC`;
  const res = await client.query<AttributeResolvedRow>(sql, params);
  return res.rows;
}

/** Read a single attribute by id (from the resolved view). */
export async function findAttributeById(
  client: PoolClient,
  attributeId: string
): Promise<AttributeResolvedRow | null> {
  const res = await client.query<AttributeResolvedRow>(
    `SELECT na.*
       FROM node_attribute_resolved na
       WHERE na.id = $1`,
    [attributeId]
  );
  return res.rows[0] ?? null;
}

// ---------------------------------------------------------------------------
// knowledge_link_resolved (the read path — §5.4)
// ---------------------------------------------------------------------------

export interface LinkResolvedRow {
  readonly id: string;
  readonly source_node_id: string;
  readonly target_node_id: string;
  readonly link_type_id: string;
  readonly valid_from: Date | null;
  readonly valid_to: Date | null;
  readonly recorded_at: Date;
  readonly superseded_at: Date | null;
  readonly status: "active" | "uncertain" | "disputed" | "superseded" | "deleted";
  readonly confidence: string | number;
  readonly valid_from_source: "stated" | "document" | "received" | null;
  readonly created_by_run_id: string | null;
  readonly supersedes_link_id: string | null;
  readonly created_at: Date;
  readonly updated_at: Date;
  readonly link_type: string;
  readonly link_inverse_name: string;
  readonly is_current: boolean;
  readonly is_in_effect: boolean;
  readonly effective_status: string;
}

export async function findLinkById(
  client: PoolClient,
  linkId: string
): Promise<LinkResolvedRow | null> {
  const res = await client.query<LinkResolvedRow>(
    `SELECT kl.*
       FROM knowledge_link_resolved kl
       WHERE kl.id = $1`,
    [linkId]
  );
  return res.rows[0] ?? null;
}

// ---------------------------------------------------------------------------
// provenance (BR-16 — assembled in ONE batched SQL per request)
// ---------------------------------------------------------------------------

export interface ProvenanceRow {
  readonly target_id: string;
  readonly fragment_id: string;
  readonly fragment_text: string;
  readonly fragment_confidence: string | number;
  readonly raw_information_id: string;
  readonly source_type: string;
  readonly received_at: Date;
  readonly excerpt: string;
}

/**
 * Batched provenance assembler. `kind` selects the target column
 * (`link_id` for links, `attribute_id` for attributes); `targetIds` is the
 * array of ids we want provenance for in a single round trip.
 *
 * BR-16 excerpt computation: `substring(raw_chunk.text from offset_start + 1
 * for offset_end - offset_start)` — 1-based `substring`, 0-based
 * `[offset_start, offset_end)` offsets (CLAUDE.md "Known Gotchas" / A22).
 *
 * The query uses `= ANY($1::uuid[])` so all rows arrive in one network
 * round trip — never one query per target id (BR-16, no N+1).
 */
export async function listProvenanceByTargets(
  client: PoolClient,
  kind: "link" | "attribute",
  targetIds: readonly string[]
): Promise<readonly ProvenanceRow[]> {
  if (targetIds.length === 0) return [];

  // The column the JOIN keys on is a developer-authored identifier — never
  // user input. We do NOT concatenate user data into the SQL.
  const targetCol = kind === "link" ? "p.link_id" : "p.attribute_id";

  const sql = `SELECT ${targetCol} AS target_id,
                      f.id          AS fragment_id,
                      f.text        AS fragment_text,
                      f.confidence  AS fragment_confidence,
                      ri.id         AS raw_information_id,
                      ri.source_type::text AS source_type,
                      ri.received_at,
                      substring(rc."text" FROM rc.offset_start + 1
                                FOR rc.offset_end - rc.offset_start) AS excerpt
                 FROM provenance p
                 JOIN information_fragment f ON f.id = p.fragment_id
                 JOIN fragment_source fs    ON fs.fragment_id = f.id
                 JOIN raw_chunk rc          ON rc.id = fs.raw_chunk_id
                 JOIN raw_information ri    ON ri.id = rc.raw_information_id
                WHERE ${targetCol} = ANY($1::uuid[])
                ORDER BY ${targetCol}, p.created_at ASC, f.id ASC`;
  const res = await client.query<ProvenanceRow>(sql, [targetIds]);
  return res.rows;
}

// ---------------------------------------------------------------------------
// Batched node reads — used by traversal to (a) substitute merged endpoints
// for survivors and (b) build the `NodeSummary[]` of the response in ONE
// network round trip per hop (BR-13 of back spec).
// ---------------------------------------------------------------------------

/**
 * Read a batch of nodes by id. Returns rows in arbitrary order; the caller
 * is responsible for indexing by `id`. Empty input returns an empty array
 * without issuing SQL.
 */
export async function findNodesByIds(
  client: PoolClient,
  nodeIds: readonly string[]
): Promise<readonly KnowledgeNodeRow[]> {
  if (nodeIds.length === 0) return [];
  const res = await client.query<KnowledgeNodeRow>(
    `SELECT kn.id, kn.node_type_id, nt.name AS node_type,
            kn.canonical_name, kn.status, kn.merged_into_node_id,
            kn.created_at, kn.updated_at
       FROM knowledge_node kn
       JOIN node_type nt ON nt.id = kn.node_type_id
      WHERE kn.id = ANY($1::uuid[])`,
    [nodeIds]
  );
  return res.rows;
}

// ---------------------------------------------------------------------------
// Traversal SQL — one hop at a time (BR-13 of back spec: BFS with per-hop
// materialisation, NOT recursive CTE — the merged-node substitution + score
// assignment require service-layer work between hops).
// ---------------------------------------------------------------------------

export interface TraversalHopFilter extends TemporalFilterOptions {
  /** Origin node ids for this hop — drives the IN(...) on source/target. */
  readonly currentIds: readonly string[];
  /** "out" = source IN currentIds; "in" = target IN currentIds. */
  readonly direction: "out" | "in";
  /** Optional LinkType id filter; undefined means "all link types". */
  readonly linkTypeIds?: readonly string[];
}

/**
 * Fetch one hop's worth of `knowledge_link_resolved` rows. Applies the
 * temporal filter (BR-07 / BR-08) and the optional `link_types[]` filter
 * (BR-04 — already resolved to UUIDs in the service).
 *
 * Returns the resolved-view rows verbatim; service layer takes care of
 * dedup, merged-node substitution (BR-13), and hop accounting.
 */
export async function fetchTraversalHop(
  client: PoolClient,
  filter: TraversalHopFilter
): Promise<readonly LinkResolvedRow[]> {
  if (filter.currentIds.length === 0) return [];

  // Direction is an internal enum authored by the developer — never user
  // input. The branch selects the column to constrain.
  const sideCol =
    filter.direction === "out" ? "kl.source_node_id" : "kl.target_node_id";

  const params: unknown[] = [filter.currentIds];
  const where: string[] = [`${sideCol} = ANY($1::uuid[])`];

  if (filter.linkTypeIds !== undefined && filter.linkTypeIds.length > 0) {
    params.push(filter.linkTypeIds);
    where.push(`kl.link_type_id = ANY($${params.length}::uuid[])`);
  }

  const temporal = applyTemporalFilter("kl", params.length + 1, {
    asOf: filter.asOf,
    inEffectOnly: filter.inEffectOnly,
  });
  params.push(...temporal.params);

  // BR-07 / BR-08: temporal filter from the helper. Excluded the `status =
  // 'deleted'` rows explicitly here — a tombstoned link is never part of
  // the traversal envelope (UC-06 alt 3a).
  const sql = `SELECT kl.*
                 FROM knowledge_link_resolved kl
                WHERE ${where.join(" AND ")}
                  AND kl.status <> 'deleted'
                  ${temporal.sql}`;
  const res = await client.query<LinkResolvedRow>(sql, params);
  return res.rows;
}

// ---------------------------------------------------------------------------
// History — recursive CTE walking both up and down the lineage chain
// (BR-12 of back spec). The same shape works for links and attributes; we
// parameterise by view / supersedes column / kind for the FROM clause.
// ---------------------------------------------------------------------------

export type HistoryKind = "link" | "attribute";

/**
 * Walk the complete lineage chain anchored at `anchorId`. Issues one
 * recursive CTE that follows BOTH directions (up via `supersedes_*_id`,
 * down via reverse pointer). Returns each row at most once, ordered ASC
 * by `recorded_at` then `id` for deterministic output.
 *
 * Returns `null` when the anchor itself is missing (the caller maps to
 * `RESOURCE_NOT_FOUND`).
 *
 * Because every row in the result set is read from the resolved view, the
 * derived fields (`is_current`, `is_in_effect`, `effective_status`) are the
 * SAME across the chain — they are functions of `current_date`, not of the
 * row's position in the chain. The service layer is responsible for keeping
 * the surrounding transaction open so all rows observe the same
 * `current_date` (back spec §1 "Transaction policy").
 */
export async function walkLinkHistory(
  client: PoolClient,
  anchorId: string
): Promise<readonly LinkResolvedRow[] | null> {
  // The CTE below uses two non-recursive seeds — one for the upward walk
  // and one for the downward walk — and UNIONs them at the end. The
  // `UNION` (not `UNION ALL`) deduplicates by full row, then ORDER BY
  // imposes the canonical ordering.
  //
  // Note: `knowledge_link_resolved` carries the full row plus the derived
  // fields; we propagate `id` and `supersedes_link_id` as the recursion
  // anchors.
  const sql = `WITH RECURSIVE
    up AS (
      SELECT kl.*
        FROM knowledge_link_resolved kl
       WHERE kl.id = $1
      UNION
      SELECT kl.*
        FROM knowledge_link_resolved kl
        JOIN up ON kl.id = up.supersedes_link_id
    ),
    down AS (
      SELECT kl.*
        FROM knowledge_link_resolved kl
       WHERE kl.id = $1
      UNION
      SELECT kl.*
        FROM knowledge_link_resolved kl
        JOIN down ON kl.supersedes_link_id = down.id
    )
    SELECT * FROM up
    UNION
    SELECT * FROM down
    ORDER BY recorded_at ASC, id ASC`;
  const res = await client.query<LinkResolvedRow>(sql, [anchorId]);
  if (res.rows.length === 0) return null;
  return res.rows;
}

/**
 * Same as `walkLinkHistory` but for `node_attribute_resolved`.
 */
export async function walkAttributeHistory(
  client: PoolClient,
  anchorId: string
): Promise<readonly AttributeResolvedRow[] | null> {
  const sql = `WITH RECURSIVE
    up AS (
      SELECT na.*
        FROM node_attribute_resolved na
       WHERE na.id = $1
      UNION
      SELECT na.*
        FROM node_attribute_resolved na
        JOIN up ON na.id = up.supersedes_attribute_id
    ),
    down AS (
      SELECT na.*
        FROM node_attribute_resolved na
       WHERE na.id = $1
      UNION
      SELECT na.*
        FROM node_attribute_resolved na
        JOIN down ON na.supersedes_attribute_id = down.id
    )
    SELECT * FROM up
    UNION
    SELECT * FROM down
    ORDER BY recorded_at ASC, id ASC`;
  const res = await client.query<AttributeResolvedRow>(sql, [anchorId]);
  if (res.rows.length === 0) return null;
  return res.rows;
}

/**
 * UC-11 — list every version of `(node_id, attribute_key_id)`, ordered ASC
 * by `recorded_at`. Differs from `walkAttributeHistory` because the anchor
 * is a `(node, key)` pair rather than a single attribute id; the result is
 * the FULL evolution of that key on that node (successions, corrections,
 * disputes, consolidations).
 */
export async function listAttributeHistoryByNodeKey(
  client: PoolClient,
  nodeId: string,
  attributeKeyId: string
): Promise<readonly AttributeResolvedRow[]> {
  const res = await client.query<AttributeResolvedRow>(
    `SELECT na.*
       FROM node_attribute_resolved na
      WHERE na.node_id = $1
        AND na.attribute_key_id = $2
      ORDER BY na.recorded_at ASC, na.id ASC`,
    [nodeId, attributeKeyId]
  );
  return res.rows;
}
