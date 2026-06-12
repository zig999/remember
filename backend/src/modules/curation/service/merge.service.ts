// Shared merge mechanics used by UC-02 (resolveEntityMatch merge_into)
// and UC-04 (mergeNodes).
//
// Steps inside the open transaction (BR-13 layered validation):
//   1. SELECT ... FOR UPDATE on both rows (BR-26).
//   2. Inspect status: 404 if missing, 410 if deleted, 409/422 mismatch.
//   3. Enforce node_type match (BR-06).
//   4. UPDATE absorbed node: status='merged', merged_into_node_id=survivor.
//   5. Path compression (BR-07).
//   6. Alias copy (BR-08).
//   7. Repoint links / attributes (BR-09).

import type { PoolClient } from "pg";

import {
  copyAliases,
  loadNodesForUpdate,
  pathCompressMergedInto,
  repointAttributes,
  repointLinks,
  updateNodeMerged,
} from "../repository/curation.repository.js";
import {
  BusinessError,
  ConflictError,
  NodeDeletedError,
  ResourceNotFoundError,
} from "./errors.js";

/** Result of the merge mechanics. */
export interface MergeAffectedCounts {
  readonly links_repointed: number;
  readonly attributes_repointed: number;
  readonly aliases_copied: number;
  readonly path_compressed_nodes: number;
}

export interface PerformMergeArgs {
  /** "active" -> the canonical case (UC-04). */
  /** "needs_review" -> UC-02: the absorbed is in `needs_review`. */
  readonly absorbedExpectedStatus: "active" | "needs_review";
  readonly survivorId: string;
  readonly absorbedId: string;
}

/**
 * Execute the full merge inside an open transaction. Throws typed errors on
 * any guard violation. Returns the affected-row counts on success.
 */
export async function performMerge(
  client: PoolClient,
  args: PerformMergeArgs
): Promise<MergeAffectedCounts> {
  // Defence in depth (BR-23). Route layer rejects but the service must not
  // trust upstream.
  if (args.survivorId === args.absorbedId) {
    throw new ConflictError(
      "BUSINESS_SELF_MERGE_FORBIDDEN",
      "survivor_id equals absorbed_id"
    );
  }

  // BR-26: lock both rows.
  const locked = await loadNodesForUpdate(client, [
    args.survivorId,
    args.absorbedId,
  ]);
  const survivor = locked.find((r) => r.id === args.survivorId);
  const absorbed = locked.find((r) => r.id === args.absorbedId);
  if (!survivor) {
    throw new ResourceNotFoundError(`KnowledgeNode not found`, {
      missing_id: args.survivorId,
    });
  }
  if (!absorbed) {
    throw new ResourceNotFoundError(`KnowledgeNode not found`, {
      missing_id: args.absorbedId,
    });
  }

  // BR-12: 410 for tombstones; explicit before 409/422 status checks.
  if (survivor.status === "deleted") {
    throw new NodeDeletedError(
      "KnowledgeNode tombstoned by compliance_delete",
      { deleted_id: survivor.id }
    );
  }
  if (absorbed.status === "deleted") {
    throw new NodeDeletedError(
      "KnowledgeNode tombstoned by compliance_delete",
      { deleted_id: absorbed.id }
    );
  }

  // Survivor must be active.
  if (survivor.status !== "active") {
    throw new BusinessError(
      "BUSINESS_INVALID_TARGET_NODE",
      "Survivor must have status=active",
      { id: survivor.id, current_status: survivor.status }
    );
  }

  // Absorbed must be in expected status.
  if (absorbed.status !== args.absorbedExpectedStatus) {
    if (args.absorbedExpectedStatus === "needs_review") {
      throw new ConflictError(
        "BUSINESS_REVIEW_NOT_PENDING",
        "Node is not in `needs_review` state",
        { node_id: absorbed.id, current_status: absorbed.status }
      );
    }
    throw new BusinessError(
      "BUSINESS_INVALID_TARGET_NODE",
      "Both nodes must have status=active",
      { absorbed_id: absorbed.id, absorbed_status: absorbed.status }
    );
  }

  // BR-06: matching node_type.
  if (survivor.node_type_id !== absorbed.node_type_id) {
    throw new BusinessError(
      "BUSINESS_INVALID_TARGET_NODE",
      "survivor and absorbed nodes must share node_type_id",
      { reason: "node_type mismatch" }
    );
  }

  // Mutation steps. Order matters: status flip first, path compression next,
  // alias copy + repointing last. All commit atomically.
  const mergedCount = await updateNodeMerged(
    client,
    args.absorbedId,
    args.survivorId
  );
  if (mergedCount !== 1) {
    // Defensive — the lock should have prevented this. We surface it as a
    // conflict for visibility (the row was mutated between SELECT and UPDATE
    // by another transaction — should not happen under FOR UPDATE).
    throw new ConflictError(
      "BUSINESS_INVALID_TARGET_NODE",
      "Absorbed node status changed under lock",
      { absorbed_id: args.absorbedId }
    );
  }

  const pathCompressedCount = await pathCompressMergedInto(
    client,
    args.absorbedId,
    args.survivorId
  );
  const aliasesCopied = await copyAliases(
    client,
    args.absorbedId,
    args.survivorId
  );
  const linksRepointed = await repointLinks(
    client,
    args.absorbedId,
    args.survivorId
  );
  const attributesRepointed = await repointAttributes(
    client,
    args.absorbedId,
    args.survivorId
  );

  return {
    links_repointed: linksRepointed,
    attributes_repointed: attributesRepointed,
    aliases_copied: aliasesCopied,
    path_compressed_nodes: pathCompressedCount,
  };
}
