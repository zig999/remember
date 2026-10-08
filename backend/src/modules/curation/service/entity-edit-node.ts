import type { PoolClient } from "pg";

import { loadNodesForUpdate } from "../repository/curation.repository.js";
import type { KnowledgeNodeLockedRow } from "../repository/curation.repository.js";
import { ConflictError, ResourceNotFoundError } from "./errors.js";

const NODE_NOT_ACTIVE_CODE = "BUSINESS_NODE_NOT_ACTIVE";
const ACTIVE_STATUS = "active";

export async function loadActiveNodeForEdit(
  client: PoolClient,
  nodeId: string
): Promise<KnowledgeNodeLockedRow> {
  const [node] = await loadNodesForUpdate(client, [nodeId]);
  if (node === undefined) {
    throw new ResourceNotFoundError(
      `Knowledge node '${nodeId}' is not held.`,
      { node_id: nodeId }
    );
  }
  if (node.status !== ACTIVE_STATUS) {
    throw new ConflictError(
      NODE_NOT_ACTIVE_CODE,
      `Knowledge node '${nodeId}' has status '${node.status}' and only an active node can be edited.`,
      { node_id: nodeId, status: node.status }
    );
  }
  return node;
}
