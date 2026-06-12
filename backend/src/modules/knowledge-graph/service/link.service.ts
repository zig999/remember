// KnowledgeLink read service — getLinkById (mirrors `get_link` semantics).
//
// Assembles `LinkDetail` from `knowledge_link_resolved` plus a single
// batched provenance SQL (BR-16, no N+1). BR-17 emits a structured WARN
// when the resolved link is non-deleted yet has no provenance.

import type { PoolClient } from "pg";
import type { Logger } from "pino";

import type { LinkDetailResponse } from "../dto/link.dto.js";
import {
  findLinkById,
  listProvenanceByTargets,
} from "../repository/graph.repository.js";
import { groupProvenance, toLinkDetail } from "./formatters.js";
import { ResourceNotFoundError } from "./errors.js";

export async function getLinkByIdService(
  client: PoolClient,
  linkId: string,
  logger: Logger
): Promise<LinkDetailResponse> {
  const link = await findLinkById(client, linkId);
  if (link === null) {
    throw new ResourceNotFoundError("KnowledgeLink", linkId);
  }

  // BR-16 — single SQL for all provenance entries.
  const provenanceRows = await listProvenanceByTargets(client, "link", [
    link.id,
  ]);
  const provenanceByLinkId = groupProvenance(provenanceRows);
  const provenance = provenanceByLinkId.get(link.id) ?? [];

  // BR-17 — empty provenance on non-deleted link is an alarm (logged, not
  // returned).
  if (link.status !== "deleted" && provenance.length === 0) {
    logger.warn(
      {
        route: "GET /api/v1/links/:link_id",
        link_id: link.id,
        status: link.status,
      },
      "knowledge_graph_empty_provenance"
    );
  }

  return toLinkDetail(link, provenance);
}
