// Entity-resolution pipeline (§4 of `remember-modelagem-v7.md`, BR-25 of
// `ingestion.back.md`, BR-24 of `ingestion.spec.md`).
//
// Single export: `resolveOrCreateNode(client, args)`. Called by
// `propose-node.service.ts` BETWEEN the structural catalog lookup (BR-14) and
// the alias-attachment step. Implements the deterministic three-way A12
// decision (matched_existing / needs_review / created_new) under the
// `pg_advisory_xact_lock` of BR-20.
//
// Why the lock comes first (BR-20): two concurrent `propose_node` calls for
// the same `(node_type, norm(name))` must NOT race on the resolve-or-create
// branch. Acquiring the advisory lock before the first SELECT serialises both
// the candidate scan AND the subsequent INSERT inside the same transaction;
// the lock is released automatically at commit/rollback.
//
// Why the thresholds are constants (BR-25): tuning belongs to a code change,
// not a runtime knob. The §16 metrics (acceptance rate, `needs_review` rate)
// are the calibration input — see the "thresholds calibration" note in the
// back spec.

import type { PoolClient } from "pg";

import type { CatalogSnapshot } from "../catalog/catalog.js";
import type { ProposeNodeResolution } from "../dto/propose-node.dto.js";

/**
 * Trigram-similarity ceiling above which a SINGLE candidate is taken as a
 * strong match (reuse the existing node). BR-25 / A12.
 *
 * Not configurable per call — see BR-25 description in the back spec.
 */
export const MATCH_STRONG = 0.85;

/**
 * Trigram-similarity floor below which a candidate is ignored entirely.
 * Candidates with `sim < MATCH_FLOOR` do not feed the decision and do not
 * produce `entity_match_review` rows. BR-25 / A12.
 *
 * Not configurable per call — see BR-25 description in the back spec.
 */
export const MATCH_FLOOR = 0.55;

/**
 * Hard cap on the trigram candidate set the decision considers. Matches the
 * `LIMIT 10` in the candidate query of BR-25 step 2 / §4.2.
 */
const TRIGRAM_CANDIDATE_LIMIT = 10;

/**
 * Arguments to the pipeline. The caller (propose-node.service) is expected to
 * have already resolved `node_type` -> `nodeTypeId` against the catalog
 * (BR-14).
 */
export interface ResolveOrCreateNodeArgs {
  /** Resolved `node_type.id` from the catalog (already validated by BR-14). */
  readonly nodeTypeId: string;
  /** Canonical name proposed by the LLM (already trimmed by Zod, BR-22 doesn't
   *  apply to nodes). */
  readonly name: string;
  /** Additional aliases the LLM supplied; appended to the resolved/created
   *  node via `ON CONFLICT DO NOTHING`. May be undefined/empty. */
  readonly aliases?: readonly string[];
  /** The active run's id — used as `node_alias.created_by_run_id`. */
  readonly llmRunId: string;
  /** Read-only catalog snapshot. Currently unused by the resolver itself but
   *  kept on the signature for symmetry with `proposeNodeService` and for
   *  forward compatibility (future per-`node_type` threshold overrides would
   *  read it from here). */
  readonly catalog: CatalogSnapshot;
}

/** Pipeline output. `resolution` mirrors the `ProposeNodeResolution` union. */
export interface ResolveOrCreateNodeResult {
  readonly node_id: string;
  readonly resolution: ProposeNodeResolution;
}

/** A single trigram candidate row, as returned by step 2 of BR-25. */
interface TrigramCandidate {
  readonly node_id: string;
  readonly sim: number;
}

/**
 * Resolve an entity to an existing `KnowledgeNode` or create a new one,
 * following §4 / BR-25 strictly. The function:
 *
 *   1. Acquires `pg_advisory_xact_lock(hashtextextended(nt || '\\x1F' || norm(name), 0))`
 *      BEFORE any read on `node_alias` (BR-20).
 *   2. Tries exact `alias_norm = norm(name)` match against active nodes of
 *      `nodeTypeId`. Hit → reuse; resolution = `matched_existing`.
 *   3. Otherwise, fetches up to 10 trigram candidates via the GIN
 *      `node_alias_norm_trgm_idx` (`%` operator), each carrying its max
 *      `similarity` against the proposed name.
 *   4. Applies the A12 decision:
 *      - Strong-unique → reuse, resolution = `matched_existing`.
 *      - Ambiguous → INSERT a new node with `status = 'needs_review'`, one
 *        `entity_match_review` row per candidate with `sim >= MATCH_FLOOR`,
 *        resolution = `needs_review`.
 *      - Novel → INSERT a new node with `status = 'active'`,
 *        resolution = `created_new`.
 *   5. In all branches: every alias supplied by the LLM (plus the canonical
 *      name for newly created nodes) is INSERTed into `node_alias` with
 *      `ON CONFLICT (node_id, alias_norm) DO NOTHING`.
 *
 * The function assumes it is running inside an open transaction; it does not
 * issue BEGIN/COMMIT/ROLLBACK. The advisory lock is released by the caller's
 * commit/rollback (this is the `pg_advisory_XACT_lock` flavour).
 */
export async function resolveOrCreateNode(
  client: PoolClient,
  args: ResolveOrCreateNodeArgs
): Promise<ResolveOrCreateNodeResult> {
  // ---- BR-20: advisory lock BEFORE the first node_alias read ---------------
  // Key composition matches §4.5 / the prior code path of propose-node:
  //   hashtextextended(node_type_id || '\x1F' || norm(name), 0)
  // We compute the inner string on the DB so that `norm(name)` uses the
  // canonical implementation from migration 0001 (not a JS approximation).
  const lockKeyRes = await client.query<{ key: string }>(
    `SELECT (CAST($1::text AS text) || E'\\x1F' || norm($2::text)) AS key`,
    [args.nodeTypeId, args.name]
  );
  const lockKey =
    lockKeyRes.rows[0]?.key ?? `${args.nodeTypeId}\x1F${args.name}`;
  await client.query(
    `SELECT pg_advisory_xact_lock(hashtextextended($1::text, 0))`,
    [lockKey]
  );

  // ---- Step 1: exact alias_norm match (score = 1.0) ------------------------
  const exactRes = await client.query<{ node_id: string }>(
    `SELECT na.node_id
       FROM node_alias na
       JOIN knowledge_node kn ON kn.id = na.node_id
      WHERE na.alias_norm = norm($1::text)
        AND kn.node_type_id = $2
        AND kn.status = 'active'
      LIMIT 1`,
    [args.name, args.nodeTypeId]
  );
  if (exactRes.rows.length > 0) {
    const nodeId = exactRes.rows[0]!.node_id;
    await attachAliases(client, {
      nodeId,
      // Canonical name not re-inserted on match (already present by virtue of
      // alias_norm hit). LLM-supplied aliases still attempt insert.
      aliases: args.aliases,
      runId: args.llmRunId,
    });
    return { node_id: nodeId, resolution: "matched_existing" };
  }

  // ---- Step 2: trigram candidates -----------------------------------------
  // The `na.alias_norm % norm($1)` predicate triggers the GIN trgm index
  // `node_alias_norm_trgm_idx` (pg_trgm `gin_trgm_ops`).
  const candRes = await client.query<{ node_id: string; sim: string }>(
    `SELECT na.node_id, MAX(similarity(na.alias_norm, norm($1::text)))::text AS sim
       FROM node_alias na
       JOIN knowledge_node kn ON kn.id = na.node_id
      WHERE kn.node_type_id = $2
        AND kn.status = 'active'
        AND na.alias_norm % norm($1::text)
      GROUP BY na.node_id
      ORDER BY MAX(similarity(na.alias_norm, norm($1::text))) DESC
      LIMIT ${TRIGRAM_CANDIDATE_LIMIT}`,
    [args.name, args.nodeTypeId]
  );
  const candidates: TrigramCandidate[] = candRes.rows
    .map((r) => ({ node_id: r.node_id, sim: Number(r.sim) }))
    // Defensive: filter NaN (should never happen — pg_trgm returns numeric).
    .filter((c) => Number.isFinite(c.sim));

  // ---- Step 3: A12 decision -----------------------------------------------
  const decision = decideFromCandidates(candidates);

  if (decision.kind === "strong_unique") {
    const nodeId = decision.nodeId;
    await attachAliases(client, {
      nodeId,
      aliases: args.aliases,
      runId: args.llmRunId,
    });
    return { node_id: nodeId, resolution: "matched_existing" };
  }

  if (decision.kind === "ambiguous") {
    // Create new node with status = 'needs_review' (ST-KN partial, UC-09).
    const insRes = await client.query<{ id: string }>(
      `INSERT INTO knowledge_node (node_type_id, canonical_name, status)
       VALUES ($1, $2, 'needs_review')
       RETURNING id`,
      [args.nodeTypeId, args.name]
    );
    const nodeId = insRes.rows[0]!.id;

    // One entity_match_review row PER ambiguous candidate (every candidate
    // with sim >= MATCH_FLOOR, NOT just the strong ones — BR-25 / TC
    // constraint: "entity_match_review inserts one row per candidate where
    // sim >= MATCH_FLOOR").
    for (const cand of decision.candidates) {
      await client.query(
        `INSERT INTO entity_match_review (node_id, candidate_node_id, similarity)
         VALUES ($1, $2, $3)
         ON CONFLICT (node_id, candidate_node_id) DO NOTHING`,
        [nodeId, cand.node_id, cand.sim]
      );
    }

    // Attach canonical + LLM aliases.
    await attachCanonicalAndAliases(client, {
      nodeId,
      canonicalName: args.name,
      aliases: args.aliases,
      runId: args.llmRunId,
    });
    return { node_id: nodeId, resolution: "needs_review" };
  }

  // decision.kind === "novel" — create active node (created_new branch).
  const insRes = await client.query<{ id: string }>(
    `INSERT INTO knowledge_node (node_type_id, canonical_name, status)
     VALUES ($1, $2, 'active')
     RETURNING id`,
    [args.nodeTypeId, args.name]
  );
  const nodeId = insRes.rows[0]!.id;
  await attachCanonicalAndAliases(client, {
    nodeId,
    canonicalName: args.name,
    aliases: args.aliases,
    runId: args.llmRunId,
  });
  return { node_id: nodeId, resolution: "created_new" };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Discriminated decision of the §4 candidate analysis. */
type Decision =
  | { readonly kind: "strong_unique"; readonly nodeId: string }
  | {
      readonly kind: "ambiguous";
      readonly candidates: readonly TrigramCandidate[];
    }
  | { readonly kind: "novel" };

/**
 * Pure decision function — exported as `_decideFromCandidates` for testing.
 * Encodes the A12 decision table verbatim:
 *
 *   - Strong unique: exactly ONE candidate with `sim >= MATCH_STRONG` AND no
 *     other candidate has `sim >= MATCH_FLOOR`.
 *   - Ambiguous: any candidate has `sim ∈ [MATCH_FLOOR, MATCH_STRONG)` OR two
 *     or more candidates have `sim >= MATCH_STRONG`.
 *   - Novel: every candidate has `sim < MATCH_FLOOR` (empty set included).
 *
 * The "ambiguous candidates" list returned in the ambiguous branch is the set
 * of all candidates with `sim >= MATCH_FLOOR` — these are the rows that
 * receive an `entity_match_review` insert.
 */
export function decideFromCandidates(
  candidates: readonly TrigramCandidate[]
): Decision {
  const strong = candidates.filter((c) => c.sim >= MATCH_STRONG);
  const aboveFloor = candidates.filter((c) => c.sim >= MATCH_FLOOR);

  if (aboveFloor.length === 0) {
    return { kind: "novel" };
  }

  // Strong-unique requires exactly one strong AND no second above the floor.
  if (strong.length === 1 && aboveFloor.length === 1) {
    return { kind: "strong_unique", nodeId: strong[0]!.node_id };
  }

  // Everything else with at least one above-floor candidate is ambiguous:
  //  - any candidate in [MATCH_FLOOR, MATCH_STRONG), OR
  //  - two-or-more candidates >= MATCH_STRONG.
  return { kind: "ambiguous", candidates: aboveFloor };
}

/**
 * Attach the canonical name as the first alias (`kind = 'canonical'`) plus
 * any LLM-supplied aliases (`kind = 'alias'`) to a newly created node.
 * UNIQUE(node_id, alias_norm) handles dedup via ON CONFLICT.
 */
async function attachCanonicalAndAliases(
  client: PoolClient,
  args: {
    nodeId: string;
    canonicalName: string;
    aliases?: readonly string[];
    runId: string;
  }
): Promise<void> {
  await client.query(
    `INSERT INTO node_alias (node_id, alias, kind, created_by_run_id)
     VALUES ($1, $2, 'canonical', $3)
     ON CONFLICT DO NOTHING`,
    [args.nodeId, args.canonicalName, args.runId]
  );
  await attachAliases(client, {
    nodeId: args.nodeId,
    aliases: args.aliases,
    runId: args.runId,
  });
}

/**
 * Attach LLM-supplied aliases (only) — used both when reusing an existing
 * node (`matched_existing`) and after the canonical insert on new nodes.
 */
async function attachAliases(
  client: PoolClient,
  args: {
    nodeId: string;
    aliases?: readonly string[];
    runId: string;
  }
): Promise<void> {
  if (!args.aliases || args.aliases.length === 0) return;
  for (const alias of args.aliases) {
    await client.query(
      `INSERT INTO node_alias (node_id, alias, kind, created_by_run_id)
       VALUES ($1, $2, 'alias', $3)
       ON CONFLICT DO NOTHING`,
      [args.nodeId, alias, args.runId]
    );
  }
}
