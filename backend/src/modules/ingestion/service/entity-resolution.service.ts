import type { PoolClient } from "pg";

import type { CatalogSnapshot } from "../catalog/catalog.js";
import {
  ALIAS_NOT_IN_SOURCE,
  type AliasNotAdmitted,
  type ProposeNodeResolution,
} from "../dto/propose-node.dto.js";

import { DIRECTED_MODEL, DIRECTED_PROMPT_VERSION } from "./directed-run.js";

export const MATCH_STRONG = 0.85;

export const MATCH_FLOOR = 0.55;

const TRIGRAM_CANDIDATE_LIMIT = 10;

export interface ResolveOrCreateNodeArgs {
  readonly nodeTypeId: string;
  readonly name: string;
  readonly aliases?: readonly string[];
  readonly llmRunId: string;
  readonly catalog: CatalogSnapshot;
}

interface ResolvedNode {
  readonly node_id: string;
  readonly resolution: ProposeNodeResolution;
}

export interface ResolveOrCreateNodeResult extends ResolvedNode {
  readonly aliases_not_admitted: readonly AliasNotAdmitted[];
}

interface TrigramCandidate {
  readonly node_id: string;
  readonly sim: number;
}

interface AliasAdmission {
  readonly admitted: readonly string[];
  readonly admittedOtherThanName: readonly string[];
  readonly notAdmitted: readonly AliasNotAdmitted[];
}

interface AdmissionRow {
  readonly alias: string;
  readonly admitted: boolean;
  readonly is_name: boolean;
}

type NewNodeStatus = "active" | "needs_review";

const INSERT_NODE_SQL: Record<NewNodeStatus, string> = {
  active: `INSERT INTO knowledge_node (node_type_id, canonical_name, status)
     VALUES ($1, $2, 'active')
     RETURNING id`,
  needs_review: `INSERT INTO knowledge_node (node_type_id, canonical_name, status)
       VALUES ($1, $2, 'needs_review')
       RETURNING id`,
};

const ALIAS_ADMISSION_SQL = `SELECT a.alias,
        COALESCE(
          r.directed
            OR (norm(a.alias) <> '' AND strpos(r.content_norm, norm(a.alias)) > 0),
          false
        ) AS admitted,
        norm(a.alias) = norm($5::text) AS is_name
   FROM unnest($1::text[]) WITH ORDINALITY AS a(alias, ord)
   LEFT JOIN (
     SELECT (lr.model = $2 AND lr.prompt_version = $3) AS directed,
            norm(ri.content) AS content_norm
       FROM llm_run lr
       JOIN raw_information ri ON ri.id = lr.input_raw_information_id
      WHERE lr.id = $4
   ) r ON true
  ORDER BY a.ord`;

export async function resolveOrCreateNode(
  client: PoolClient,
  args: ResolveOrCreateNodeArgs
): Promise<ResolveOrCreateNodeResult> {
  await acquireNameLock(client, args);
  const admission = await admitAliases(client, args);
  const resolved = await resolveWithAdmittedAliases(client, args, admission);
  return { ...resolved, aliases_not_admitted: admission.notAdmitted };
}

async function resolveWithAdmittedAliases(
  client: PoolClient,
  args: ResolveOrCreateNodeArgs,
  admission: AliasAdmission
): Promise<ResolvedNode> {
  const exactNodeId = await findExactMatch(client, args);
  if (exactNodeId !== null) {
    return await matchExisting(client, args, exactNodeId, admission);
  }

  const decision = decideFromCandidates(
    await findTrigramCandidates(client, args)
  );
  if (decision.kind === "strong_unique") {
    return await matchExisting(client, args, decision.nodeId, admission);
  }

  return await createNewNode(client, args, {
    reviewCandidates: decision.kind === "ambiguous" ? decision.candidates : [],
    aliases: admission.admitted,
  });
}

async function matchExisting(
  client: PoolClient,
  args: ResolveOrCreateNodeArgs,
  nodeId: string,
  admission: AliasAdmission
): Promise<ResolvedNode> {
  await attachAliases(client, {
    nodeId,
    aliases: admission.admittedOtherThanName,
    runId: args.llmRunId,
  });
  return { node_id: nodeId, resolution: "matched_existing" };
}

async function createNewNode(
  client: PoolClient,
  args: ResolveOrCreateNodeArgs,
  plan: {
    reviewCandidates: readonly TrigramCandidate[];
    aliases: readonly string[];
  }
): Promise<ResolvedNode> {
  const needsReview = plan.reviewCandidates.length > 0;
  const nodeId = await insertNode(
    client,
    args,
    needsReview ? "needs_review" : "active"
  );
  await insertMatchReviews(client, nodeId, plan.reviewCandidates);
  await attachCanonicalAndAliases(client, {
    nodeId,
    canonicalName: args.name,
    aliases: plan.aliases,
    runId: args.llmRunId,
  });
  return {
    node_id: nodeId,
    resolution: needsReview ? "needs_review" : "created_new",
  };
}

async function acquireNameLock(
  client: PoolClient,
  args: ResolveOrCreateNodeArgs
): Promise<void> {
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
}

async function admitAliases(
  client: PoolClient,
  args: ResolveOrCreateNodeArgs
): Promise<AliasAdmission> {
  const proposed = args.aliases ?? [];
  if (proposed.length === 0) {
    return { admitted: [], admittedOtherThanName: [], notAdmitted: [] };
  }
  const res = await client.query<AdmissionRow>(ALIAS_ADMISSION_SQL, [
    proposed,
    DIRECTED_MODEL,
    DIRECTED_PROMPT_VERSION,
    args.llmRunId,
    args.name,
  ]);
  const admitted = res.rows.filter((r) => r.admitted);
  return {
    admitted: admitted.map((r) => r.alias),
    admittedOtherThanName: admitted
      .filter((r) => !r.is_name)
      .map((r) => r.alias),
    notAdmitted: res.rows
      .filter((r) => !r.admitted)
      .map((r) => ({ alias: r.alias, reason: ALIAS_NOT_IN_SOURCE })),
  };
}

async function findExactMatch(
  client: PoolClient,
  args: ResolveOrCreateNodeArgs
): Promise<string | null> {
  const res = await client.query<{ node_id: string }>(
    `SELECT na.node_id
       FROM node_alias na
       JOIN knowledge_node kn ON kn.id = na.node_id
      WHERE na.alias_norm = norm($1::text)
        AND kn.node_type_id = $2
        AND kn.status = 'active'
      LIMIT 1`,
    [args.name, args.nodeTypeId]
  );
  return res.rows[0]?.node_id ?? null;
}

async function findTrigramCandidates(
  client: PoolClient,
  args: ResolveOrCreateNodeArgs
): Promise<TrigramCandidate[]> {
  const res = await client.query<{ node_id: string; sim: string }>(
    `SELECT na.node_id, MAX(similarity(na.alias_norm, norm($1::text)))::text AS sim
       FROM node_alias na
       JOIN knowledge_node kn ON kn.id = na.node_id
      WHERE kn.node_type_id = $2
        AND kn.status = 'active'
        AND na.alias_norm % norm($1::text)
      GROUP BY na.node_id
      ORDER BY MAX(similarity(na.alias_norm, norm($1::text))) DESC
      LIMIT $3`,
    [args.name, args.nodeTypeId, TRIGRAM_CANDIDATE_LIMIT]
  );
  return res.rows
    .map((r) => ({ node_id: r.node_id, sim: Number(r.sim) }))
    .filter((c) => Number.isFinite(c.sim));
}

async function insertNode(
  client: PoolClient,
  args: ResolveOrCreateNodeArgs,
  status: NewNodeStatus
): Promise<string> {
  const res = await client.query<{ id: string }>(INSERT_NODE_SQL[status], [
    args.nodeTypeId,
    args.name,
  ]);
  return res.rows[0]!.id;
}

async function insertMatchReviews(
  client: PoolClient,
  nodeId: string,
  candidates: readonly TrigramCandidate[]
): Promise<void> {
  for (const cand of candidates) {
    await client.query(
      `INSERT INTO entity_match_review (node_id, candidate_node_id, similarity)
         VALUES ($1, $2, $3)
         ON CONFLICT (node_id, candidate_node_id) DO NOTHING`,
      [nodeId, cand.node_id, cand.sim]
    );
  }
}

type Decision =
  | { readonly kind: "strong_unique"; readonly nodeId: string }
  | {
      readonly kind: "ambiguous";
      readonly candidates: readonly TrigramCandidate[];
    }
  | { readonly kind: "novel" };

export function decideFromCandidates(
  candidates: readonly TrigramCandidate[]
): Decision {
  const strong = candidates.filter((c) => c.sim >= MATCH_STRONG);
  const aboveFloor = candidates.filter((c) => c.sim >= MATCH_FLOOR);

  if (aboveFloor.length === 0) {
    return { kind: "novel" };
  }

  if (strong.length === 1 && aboveFloor.length === 1) {
    return { kind: "strong_unique", nodeId: strong[0]!.node_id };
  }

  return { kind: "ambiguous", candidates: aboveFloor };
}

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
