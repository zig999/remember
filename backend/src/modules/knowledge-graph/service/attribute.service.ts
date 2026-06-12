// NodeAttribute read service — getAttributeById.

import type { PoolClient } from "pg";
import type { Logger } from "pino";

import type { AttributeDetailResponse } from "../dto/attribute.dto.js";
import {
  findAttributeById,
  listProvenanceByTargets,
} from "../repository/graph.repository.js";
import { groupProvenance, toAttributeDetail } from "./formatters.js";
import { ResourceNotFoundError } from "./errors.js";

export async function getAttributeByIdService(
  client: PoolClient,
  attributeId: string,
  logger: Logger
): Promise<AttributeDetailResponse> {
  const row = await findAttributeById(client, attributeId);
  if (row === null) {
    throw new ResourceNotFoundError("NodeAttribute", attributeId);
  }

  const provenanceRows = await listProvenanceByTargets(client, "attribute", [
    row.id,
  ]);
  const provenanceByAttrId = groupProvenance(provenanceRows);
  const provenance = provenanceByAttrId.get(row.id) ?? [];

  if (row.status !== "deleted" && provenance.length === 0) {
    logger.warn(
      {
        route: "GET /api/v1/attributes/:attribute_id",
        attribute_id: row.id,
        status: row.status,
      },
      "knowledge_graph_empty_provenance"
    );
  }

  return toAttributeDetail(row, provenance);
}
