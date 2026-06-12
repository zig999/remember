// Service: `ingest.propose_node` business logic (UC-09).
//
// Transport-agnostic. Receives an OPEN `PoolClient` — transaction wrapping is
// the caller's responsibility (BR-19 + TC-09 constraint).
//
// Scope of THIS Task Contract (TC-09):
//   - Structural layer (BR-14): node_type must exist in the seeded catalog.
//   - Concurrency primitive (BR-20): pg_advisory_xact_lock keyed by
//     hash(node_type_id || US || norm(name)).
//   - Minimal happy path: exact-match-or-create with `status = 'active'` plus
//     a canonical alias row.
//
// The full entity-resolution pipeline (§4 of v7 / threshold table A12 /
// `needs_review` flow) is TC-010. When wired in, it slots BETWEEN the
// advisory-lock acquire and the INSERT — this service delegates without
// changing its surface contract.

import type { PoolClient } from "pg";

import type { CatalogSnapshot } from "../catalog/catalog.js";
import type {
  ProposeNodeInput,
  ProposeNodeResolution,
  ProposeNodeResult,
} from "../dto/propose-node.dto.js";
import { assertKnownType } from "../validation/structural.js";

import type { McpEnvelope, RunContext } from "./propose.types.js";

/**
 * Dependencies a `propose-node` call needs beyond the open client + args + run
 * context. The catalog is loaded once at boot by the bootstrap and reused
 * across all calls (single owner — no per-call cache invalidation).
 */
export interface ProposeNodeDeps {
  readonly catalog: CatalogSnapshot;
}

export async function proposeNodeService(
  client: PoolClient,
  args: ProposeNodeInput,
  runCtx: RunContext,
  deps: ProposeNodeDeps
): Promise<McpEnvelope<ProposeNodeResult>> {
  // Layer 1 — catalog lookup (BR-14).
  const nodeType = deps.catalog.nodeTypeByName.get(args.node_type);
  assertKnownType({
    kind: "node_type",
    name: args.node_type,
    found: nodeType !== undefined,
  });
  // narrowing — assertKnownType guarantees defined.
  const resolvedType = nodeType!;

  // Layer "concurrency primitive" — pg_advisory_xact_lock (BR-20). The lock
  // key combines node_type_id and norm(name) via the DB's hashtextextended.
  // We rely on the DB function `norm` already loaded by migration 0001.
  const lockArgRes = await client.query<{ key: string }>(
    `SELECT (CAST($1::text AS text) || E'\\x1F' || norm($2::text)) AS key`,
    [resolvedType.id, args.name]
  );
  const lockArg = lockArgRes.rows[0]?.key ?? `${resolvedType.id}\x1F${args.name}`;
  await client.query(
    `SELECT pg_advisory_xact_lock(hashtextextended($1::text, 0))`,
    [lockArg]
  );

  // Entity-resolution proper is TC-010; the simplest correct write path under
  // the lock is: try to match an existing node by exact-norm alias; otherwise
  // create new.
  const matchRes = await client.query<{ node_id: string }>(
    `SELECT na.node_id
       FROM node_alias na
       JOIN knowledge_node kn ON kn.id = na.node_id
      WHERE na.alias_norm = norm($1::text)
        AND kn.node_type_id = $2
        AND kn.status = 'active'
      LIMIT 1`,
    [args.name, resolvedType.id]
  );

  let nodeId: string;
  let resolution: ProposeNodeResolution;
  if (matchRes.rows.length > 0) {
    nodeId = matchRes.rows[0]!.node_id;
    resolution = "matched_existing";
  } else {
    const ins = await client.query<{ id: string }>(
      `INSERT INTO knowledge_node (node_type_id, canonical_name)
       VALUES ($1, $2)
       RETURNING id`,
      [resolvedType.id, args.name]
    );
    nodeId = ins.rows[0]!.id;
    resolution = "created_new";
    // Canonical alias mirrors the canonical_name.
    await client.query(
      `INSERT INTO node_alias (node_id, alias, kind, created_by_run_id)
       VALUES ($1, $2, 'canonical', $3)
       ON CONFLICT DO NOTHING`,
      [nodeId, args.name, runCtx.llmRunId]
    );
  }

  // Add any new aliases — UNIQUE(node_id, alias_norm) handles duplicates.
  if (args.aliases && args.aliases.length > 0) {
    for (const alias of args.aliases) {
      await client.query(
        `INSERT INTO node_alias (node_id, alias, kind, created_by_run_id)
         VALUES ($1, $2, 'alias', $3)
         ON CONFLICT DO NOTHING`,
        [nodeId, alias, runCtx.llmRunId]
      );
    }
  }

  const result: ProposeNodeResult = { node_id: nodeId, resolution };
  return { ok: true, result };
}
