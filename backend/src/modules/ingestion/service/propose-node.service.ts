// Service: `ingest.propose_node` business logic (UC-09).
//
// Transport-agnostic. Receives an OPEN `PoolClient` — transaction wrapping is
// the caller's responsibility (BR-19 + TC-09 constraint).
//
// Scope of TC-09 (previous TC):
//   - Structural layer (BR-14): node_type must exist in the seeded catalog.
//
// Scope of THIS Task Contract (TC-10):
//   - Delegate the resolve-or-create branch (advisory lock + exact match +
//     trigram candidates + A12 decision + alias attachment) to
//     `entity-resolution.service.resolveOrCreateNode`. The previous exact-
//     match-or-create stub is replaced by the full §4 pipeline (BR-25). The
//     service's surface contract is unchanged: same input/output, still
//     transport-agnostic, still no transaction management.
//
// The advisory lock (BR-20) now lives INSIDE `resolveOrCreateNode` — it is
// acquired before the first SELECT on `node_alias`, per §4.5.

import type { PoolClient } from "pg";

import type { CatalogSnapshot } from "../catalog/catalog.js";
import type {
  ProposeNodeInput,
  ProposeNodeResult,
} from "../dto/propose-node.dto.js";
import { assertKnownType } from "../validation/structural.js";

import { resolveOrCreateNode } from "./entity-resolution.service.js";
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

  // Delegate to the §4 entity-resolution pipeline (BR-25). The advisory lock
  // (BR-20) is acquired inside this call, BEFORE any read on `node_alias`.
  const resolved = await resolveOrCreateNode(client, {
    nodeTypeId: resolvedType.id,
    name: args.name,
    aliases: args.aliases,
    llmRunId: runCtx.llmRunId,
    catalog: deps.catalog,
  });

  const result: ProposeNodeResult = {
    node_id: resolved.node_id,
    resolution: resolved.resolution,
  };
  return { ok: true, result };
}
