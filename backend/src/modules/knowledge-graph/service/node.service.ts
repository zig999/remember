// KnowledgeNode read service — UC-04 (`listNodes`) and UC-05 (`getNodeById`).
//
// Layering: route -> service (this file) -> repository. The service applies
// catalog validation (BR-03), defaulting of the status filter (BR-15),
// normalisation of the name_prefix (norm()), the merged / deleted policy
// (BR-11), and the inclusion of attribute rows via the resolved view
// (BR-09).

import type { PoolClient } from "pg";
import type { Logger } from "pino";

import type { CatalogSnapshot } from "../catalog/catalog.js";
import type { NodeStatus } from "../dto/enums.dto.js";
import type {
  NodeDetailResponse,
  NodeListResponse,
} from "../dto/node.dto.js";
import {
  findNodeById,
  listAliasesByNodeId,
  listAttributesByNodeId,
  listNodes as repoListNodes,
  listProvenanceByTargets,
  type AttributeResolvedRow,
} from "../repository/graph.repository.js";
import {
  groupProvenance,
  toAttributeDetail,
  toNodeAlias,
  toNodeSummary,
} from "./formatters.js";
import { norm } from "./norm.js";
import {
  NodeDeletedError,
  ResourceNotFoundError,
  UnknownNodeTypeError,
} from "./errors.js";

export interface ListNodesInput {
  readonly node_type?: string;
  readonly name_prefix?: string;
  readonly status?: NodeStatus;
  readonly limit: number;
  readonly offset: number;
}

export async function listNodesService(
  client: PoolClient,
  catalog: CatalogSnapshot,
  input: ListNodesInput
): Promise<NodeListResponse> {
  // BR-03 — resolve node_type name to id via cache.
  let nodeTypeId: string | undefined;
  if (input.node_type !== undefined) {
    const row = catalog.nodeTypeByName.get(input.node_type);
    if (row === undefined) {
      throw new UnknownNodeTypeError(input.node_type);
    }
    nodeTypeId = row.id;
  }

  // BR-15 — default to active when caller omits status.
  const status: NodeStatus = input.status ?? "active";

  // BR-01 of `.spec.md` — apply norm() before the LIKE prefix lookup.
  const name_prefix_norm =
    input.name_prefix !== undefined ? norm(input.name_prefix) : undefined;

  const repoResult = await repoListNodes(client, {
    node_type_id: nodeTypeId,
    name_prefix_norm,
    status,
    limit: input.limit,
    offset: input.offset,
  });

  return {
    total: repoResult.total,
    limit: input.limit,
    offset: input.offset,
    items: repoResult.items.map(toNodeSummary),
  };
}

export interface GetNodeByIdInput {
  readonly nodeId: string;
  readonly asOf?: string;
  readonly inEffectOnly: boolean;
  readonly includeUncertain: boolean;
}

export async function getNodeByIdService(
  client: PoolClient,
  input: GetNodeByIdInput,
  logger: Logger
): Promise<NodeDetailResponse> {
  const node = await findNodeById(client, input.nodeId);
  if (node === null) {
    throw new ResourceNotFoundError("KnowledgeNode", input.nodeId);
  }
  // BR-11 — deleted -> 410 (row exists but tombstoned).
  if (node.status === "deleted") {
    throw new NodeDeletedError(input.nodeId);
  }
  // Merged nodes return 200 with the merged_into pointer; caller follows.

  const [aliases, attributeRows] = await Promise.all([
    listAliasesByNodeId(client, input.nodeId),
    listAttributesByNodeId(client, {
      nodeId: input.nodeId,
      asOf: input.asOf,
      inEffectOnly: input.inEffectOnly,
      includeUncertain: input.includeUncertain,
    }),
  ]);

  // BR-16 — assemble provenance for ALL attributes in a single batched SQL.
  const attributeIds = attributeRows.map((r) => r.id);
  const provenanceRows = await listProvenanceByTargets(
    client,
    "attribute",
    attributeIds
  );
  const provenanceByAttrId = groupProvenance(provenanceRows);

  // BR-17 — empty provenance on non-deleted item -> WARN (no client error).
  warnIfEmptyProvenance(logger, attributeRows, provenanceByAttrId, {
    route: "GET /api/v1/nodes/:node_id",
    nodeId: input.nodeId,
  });

  return {
    node: toNodeSummary(node),
    aliases: aliases.map(toNodeAlias),
    attributes: attributeRows.map((r) =>
      toAttributeDetail(r, provenanceByAttrId.get(r.id) ?? [])
    ),
  };
}

function warnIfEmptyProvenance(
  logger: Logger,
  rows: readonly AttributeResolvedRow[],
  provenanceByAttrId: Map<string, readonly unknown[]>,
  ctx: { route: string; nodeId: string }
): void {
  for (const r of rows) {
    if (r.status === "deleted") continue;
    const arr = provenanceByAttrId.get(r.id);
    if (arr === undefined || arr.length === 0) {
      logger.warn(
        {
          route: ctx.route,
          node_id: ctx.nodeId,
          attribute_id: r.id,
          status: r.status,
        },
        "knowledge_graph_empty_provenance"
      );
    }
  }
}
