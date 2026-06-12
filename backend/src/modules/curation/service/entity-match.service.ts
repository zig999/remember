// UC-02 (resolveEntityMatch) and UC-04 (mergeNodes).
//
// Both endpoints share the same merge mechanics (see ./merge.service.ts).
// Each one wraps the merge with its own pre-flight checks, status flip, and
// audit-row payload.

import type { Pool } from "pg";
import type { Logger } from "pino";

import type { ResolveEntityMatchBody } from "../dto/entity-match.dto.js";
import {
  deleteEntityMatchReviewByNode,
  insertCurationAction,
  loadNodesForUpdate,
  updateNodeStatusKeepSeparate,
} from "../repository/curation.repository.js";
import {
  BusinessError,
  ConflictError,
  NodeDeletedError,
  ResourceNotFoundError,
} from "./errors.js";
import { performMerge, type MergeAffectedCounts } from "./merge.service.js";
import { withTransaction } from "./transaction.js";

export interface EntityMatchServiceDeps {
  readonly pool: Pool;
  readonly logger: Logger;
}

export interface ResolveEntityMatchResult {
  readonly node_id: string;
  readonly decision: "merge_into" | "keep_separate";
  readonly resulting_status: "active" | "merged";
  readonly target_node_id: string | null;
  readonly affected: MergeAffectedCounts | null;
  readonly action_id: string;
}

export async function resolveEntityMatchService(
  deps: EntityMatchServiceDeps,
  nodeId: string,
  body: ResolveEntityMatchBody
): Promise<ResolveEntityMatchResult> {
  // BR-23 defence in depth on resolveEntityMatch (target == self).
  if (
    body.decision === "merge_into" &&
    body.target_node_id !== null &&
    body.target_node_id === nodeId
  ) {
    throw new ConflictError(
      "BUSINESS_SELF_MERGE_FORBIDDEN",
      "merge_into target equals the node being resolved",
      { node_id: nodeId }
    );
  }

  return withTransaction(deps.pool, async (client) => {
    if (body.decision === "keep_separate") {
      // BR-26: lock node and assert needs_review.
      const locked = await loadNodesForUpdate(client, [nodeId]);
      const node = locked.find((r) => r.id === nodeId);
      if (!node) {
        throw new ResourceNotFoundError("KnowledgeNode not found", {
          node_id: nodeId,
        });
      }
      if (node.status === "deleted") {
        throw new NodeDeletedError(
          "KnowledgeNode tombstoned by compliance_delete",
          { node_id: nodeId }
        );
      }
      if (node.status !== "needs_review") {
        throw new ConflictError(
          "BUSINESS_REVIEW_NOT_PENDING",
          "Node is not in `needs_review` state",
          { node_id: nodeId, current_status: node.status }
        );
      }

      const updated = await updateNodeStatusKeepSeparate(client, nodeId);
      if (updated !== 1) {
        throw new ConflictError(
          "BUSINESS_REVIEW_NOT_PENDING",
          "Node status changed under lock",
          { node_id: nodeId }
        );
      }
      // BR-10: drop review-context rows.
      await deleteEntityMatchReviewByNode(client, nodeId);

      const action = await insertCurationAction(client, {
        action: "resolve_entity_match",
        target_kind: "node",
        target_id: nodeId,
        payload: { decision: "keep_separate" },
        reason: body.reason ?? null,
      });

      deps.logger.info(
        {
          route: "POST /api/v1/curation/entity-matches/:node_id/resolve",
          operation: "resolve_entity_match",
          decision: "keep_separate",
          node_id: nodeId,
          action_id: action.id,
          rows_mutated: updated,
        },
        "curation_resolve_entity_match_ok"
      );

      return {
        node_id: nodeId,
        decision: "keep_separate",
        resulting_status: "active",
        target_node_id: null,
        affected: null,
        action_id: action.id,
      };
    }

    // merge_into branch — DTO superRefine guarantees target_node_id+reason exist.
    const targetNodeId = body.target_node_id;
    if (targetNodeId === null || targetNodeId === undefined) {
      // Defensive — should have been caught upstream.
      throw new BusinessError(
        "BUSINESS_TARGET_NODE_REQUIRED",
        "decision=merge_into requires target_node_id"
      );
    }

    const affected = await performMerge(client, {
      survivorId: targetNodeId,
      absorbedId: nodeId,
      absorbedExpectedStatus: "needs_review",
    });
    await deleteEntityMatchReviewByNode(client, nodeId);

    const action = await insertCurationAction(client, {
      action: "resolve_entity_match",
      target_kind: "node",
      target_id: nodeId,
      payload: { decision: "merge_into", target_node_id: targetNodeId },
      reason: body.reason ?? null,
    });

    deps.logger.info(
      {
        route: "POST /api/v1/curation/entity-matches/:node_id/resolve",
        operation: "resolve_entity_match",
        decision: "merge_into",
        node_id: nodeId,
        target_node_id: targetNodeId,
        action_id: action.id,
        affected,
      },
      "curation_resolve_entity_match_ok"
    );

    return {
      node_id: nodeId,
      decision: "merge_into",
      resulting_status: "merged",
      target_node_id: targetNodeId,
      affected,
      action_id: action.id,
    };
  });
}

export interface MergeNodesResult {
  readonly survivor_id: string;
  readonly absorbed_id: string;
  readonly affected: MergeAffectedCounts;
  readonly action_id: string;
}

export async function mergeNodesService(
  deps: EntityMatchServiceDeps,
  survivorId: string,
  absorbedId: string,
  reason: string
): Promise<MergeNodesResult> {
  return withTransaction(deps.pool, async (client) => {
    const affected = await performMerge(client, {
      survivorId,
      absorbedId,
      absorbedExpectedStatus: "active",
    });

    const action = await insertCurationAction(client, {
      action: "merge_nodes",
      target_kind: "node",
      target_id: absorbedId,
      payload: { survivor_id: survivorId },
      reason,
    });

    deps.logger.info(
      {
        route: "POST /api/v1/curation/nodes/merge",
        operation: "merge_nodes",
        survivor_id: survivorId,
        absorbed_id: absorbedId,
        action_id: action.id,
        affected,
      },
      "curation_merge_nodes_ok"
    );

    return {
      survivor_id: survivorId,
      absorbed_id: absorbedId,
      affected,
      action_id: action.id,
    };
  });
}
