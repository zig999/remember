// Lineage-chain history services — UC-09 (link), UC-10 (attribute), UC-11
// (node + attribute_key).
//
// Each service walks the lineage chain (BR-12 of back spec): a recursive
// CTE seeded at the anchor that follows `supersedes_*` BOTH up AND down.
// The result is ordered ASC by `recorded_at` (oldest first) so callers can
// reconstruct successions / corrections by inspecting both temporal axes.
//
// Provenance for every version is fetched in ONE batched SQL (BR-16). The
// BR-17 empty-provenance alarm fires once per non-deleted version with no
// provenance.

import type { PoolClient } from "pg";
import type { Logger } from "pino";

import type { CatalogSnapshot } from "../catalog/catalog.js";
import type {
  AttributeHistoryResponse,
  LinkHistoryResponse,
} from "../dto/history.dto.js";
import {
  attributeKeyCacheKey,
} from "../catalog/catalog.js";
import {
  findNodeById,
  listAttributeHistoryByNodeKey,
  listProvenanceByTargets,
  walkAttributeHistory,
  walkLinkHistory,
  type AttributeResolvedRow,
  type LinkResolvedRow,
} from "../repository/graph.repository.js";
import {
  groupProvenance,
  toAttributeDetail,
  toLinkDetail,
} from "./formatters.js";
import {
  NodeDeletedError,
  ResourceNotFoundError,
  UnknownAttributeKeyError,
} from "./errors.js";

// ---------------------------------------------------------------------------
// UC-09 — link history
// ---------------------------------------------------------------------------

export async function getLinkHistoryService(
  client: PoolClient,
  linkId: string,
  logger: Logger
): Promise<LinkHistoryResponse> {
  const rows = await walkLinkHistory(client, linkId);
  if (rows === null) {
    throw new ResourceNotFoundError("KnowledgeLink", linkId);
  }
  return assembleLinkHistory(client, rows, logger, "GET /api/v1/links/:link_id/history");
}

// ---------------------------------------------------------------------------
// UC-10 — attribute history (anchored on a single attribute id)
// ---------------------------------------------------------------------------

export async function getAttributeHistoryService(
  client: PoolClient,
  attributeId: string,
  logger: Logger
): Promise<AttributeHistoryResponse> {
  const rows = await walkAttributeHistory(client, attributeId);
  if (rows === null) {
    throw new ResourceNotFoundError("NodeAttribute", attributeId);
  }
  return assembleAttributeHistory(
    client,
    rows,
    logger,
    "GET /api/v1/attributes/:attribute_id/history"
  );
}

// ---------------------------------------------------------------------------
// UC-11 — attribute-key history for `(node_id, key)`
// ---------------------------------------------------------------------------

export interface GetAttributeKeyHistoryInput {
  readonly nodeId: string;
  readonly key: string;
}

export async function getAttributeKeyHistoryService(
  client: PoolClient,
  catalog: CatalogSnapshot,
  input: GetAttributeKeyHistoryInput,
  logger: Logger
): Promise<AttributeHistoryResponse> {
  // BR-11 — resolve the node first; 404 if absent, 410 if tombstoned.
  const node = await findNodeById(client, input.nodeId);
  if (node === null) {
    throw new ResourceNotFoundError("KnowledgeNode", input.nodeId);
  }
  if (node.status === "deleted") {
    throw new NodeDeletedError(input.nodeId);
  }

  // BR-20 — resolve `(node_type_id, key)` via the catalog cache. The
  // attribute_key id is required to scope the history listing; a miss
  // surfaces as 404 (BUSINESS_UNKNOWN_ATTRIBUTE_KEY) because the segment
  // is part of the URL hierarchy, not a free query parameter.
  const cacheKey = attributeKeyCacheKey(node.node_type_id, input.key);
  const attributeKeyRow = catalog.attributeKeyByNodeTypeAndKey.get(cacheKey);
  if (attributeKeyRow === undefined) {
    throw new UnknownAttributeKeyError(node.node_type, input.key);
  }

  const rows = await listAttributeHistoryByNodeKey(
    client,
    input.nodeId,
    attributeKeyRow.id
  );

  // Note: an empty result is a valid response — the caller queried a key
  // that exists in the catalog but has no attributes recorded yet on this
  // node. Return `{ versions: [] }` rather than 404.
  return assembleAttributeHistory(
    client,
    rows,
    logger,
    "GET /api/v1/nodes/:node_id/attributes/:key/history"
  );
}

// ---------------------------------------------------------------------------
// Shared assemblers — batch provenance for every chain row and surface the
// BR-17 alarm. Pure SQL is in the repository; this stays in the service
// layer because it owns the empty-provenance log decision.
// ---------------------------------------------------------------------------

async function assembleLinkHistory(
  client: PoolClient,
  rows: readonly LinkResolvedRow[],
  logger: Logger,
  route: string
): Promise<LinkHistoryResponse> {
  const ids = rows.map((r) => r.id);
  const provenanceRows = await listProvenanceByTargets(client, "link", ids);
  const provenanceByLinkId = groupProvenance(provenanceRows);

  const versions = rows.map((row) => {
    const provenance = provenanceByLinkId.get(row.id) ?? [];
    if (row.status !== "deleted" && provenance.length === 0) {
      logger.warn(
        { route, link_id: row.id, status: row.status },
        "knowledge_graph_empty_provenance"
      );
    }
    return toLinkDetail(row, provenance);
  });

  return { versions };
}

async function assembleAttributeHistory(
  client: PoolClient,
  rows: readonly AttributeResolvedRow[],
  logger: Logger,
  route: string
): Promise<AttributeHistoryResponse> {
  const ids = rows.map((r) => r.id);
  const provenanceRows = await listProvenanceByTargets(client, "attribute", ids);
  const provenanceByAttrId = groupProvenance(provenanceRows);

  const versions = rows.map((row) => {
    const provenance = provenanceByAttrId.get(row.id) ?? [];
    if (row.status !== "deleted" && provenance.length === 0) {
      logger.warn(
        { route, attribute_id: row.id, status: row.status },
        "knowledge_graph_empty_provenance"
      );
    }
    return toAttributeDetail(row, provenance);
  });

  return { versions };
}
