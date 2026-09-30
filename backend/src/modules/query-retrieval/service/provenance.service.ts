import type { PoolClient } from "pg";
import type { Logger } from "pino";

import type {
  ProvenanceChunk,
  ProvenanceFragment,
  ProvenanceResponse,
} from "../dto/response.dto.js";
import { toSourceType } from "../dto/response.dto.js";
import {
  attributeExists,
  chainByAttribute,
  chainByFragment,
  chainByLink,
  findFragmentStatus,
  findTombstone,
  linkExists,
  type ProvenanceChainRow,
} from "../repository/provenance.repository.js";
import { ResourceNotFoundError } from "../../knowledge-graph/service/errors.js";
import {
  EmptyProvenanceError,
  FragmentNotAcceptedError,
  RawInformationDeletedError,
} from "./errors.js";

export async function getProvenanceByLinkService(
  client: PoolClient,
  linkId: string,
  logger: Logger
): Promise<ProvenanceResponse> {
  const exists = await linkExists(client, linkId);
  if (!exists) throw new ResourceNotFoundError("KnowledgeLink", linkId);

  const rows = await chainByLink(client, linkId);
  return finalise(client, rows, "link", linkId, logger);
}

export async function getProvenanceByAttributeService(
  client: PoolClient,
  attributeId: string,
  logger: Logger
): Promise<ProvenanceResponse> {
  const exists = await attributeExists(client, attributeId);
  if (!exists) throw new ResourceNotFoundError("NodeAttribute", attributeId);

  const rows = await chainByAttribute(client, attributeId);
  return finalise(client, rows, "attribute", attributeId, logger);
}

export async function getProvenanceByFragmentService(
  client: PoolClient,
  fragmentId: string,
  logger: Logger
): Promise<ProvenanceResponse> {
  const fragment = await findFragmentStatus(client, fragmentId);
  if (fragment === null) {
    throw new ResourceNotFoundError("InformationFragment", fragmentId);
  }
  if (fragment.status !== "accepted") {
    throw new FragmentNotAcceptedError(fragmentId, fragment.status);
  }

  const rows = await chainByFragment(client, fragmentId);
  return finalise(client, rows, "fragment", fragmentId, logger);
}

async function finalise(
  client: PoolClient,
  rows: readonly ProvenanceChainRow[],
  anchorKind: "link" | "attribute" | "fragment",
  anchorId: string,
  logger: Logger
): Promise<ProvenanceResponse> {
  const rawIds = Array.from(new Set(rows.map((r) => r.raw_information_id)));
  const tombstone = await findTombstone(client, rawIds);
  if (tombstone !== null) {
    logger.warn(
      {
        route: `GET /api/v1/provenance/${anchorKind}s/:id`,
        anchor_id: anchorId,
        anchor_kind: anchorKind,
        tombstone_short_circuit: true,
        raw_information_id: tombstone.raw_information_id,
      },
      "query_retrieval_provenance_tombstone"
    );
    throw new RawInformationDeletedError(
      tombstone.raw_information_id,
      tombstone.performed_at
    );
  }

  if (rows.length === 0) {
    logger.warn(
      {
        route: `GET /api/v1/provenance/${anchorKind}s/:id`,
        anchor_id: anchorId,
        anchor_kind: anchorKind,
        fragment_count: 0,
      },
      "query_retrieval_provenance_empty_chain",
    );
    throw new EmptyProvenanceError(anchorKind, anchorId);
  }

  const fragments = groupChain(rows);

  logger.info(
    {
      route: `GET /api/v1/provenance/${anchorKind}s/:id`,
      outcome: "ok",
      anchor_id: anchorId,
      anchor_kind: anchorKind,
      fragment_count: fragments.length,
      tombstone_short_circuit: false,
    },
    "query_retrieval_provenance_ok"
  );

  return { fragments };
}

function groupChain(rows: readonly ProvenanceChainRow[]): ProvenanceFragment[] {
  const byFragment = new Map<
    string,
    { fragment: ProvenanceChainRow; chunks: ProvenanceChainRow[] }
  >();

  for (const row of rows) {
    const entry = byFragment.get(row.fragment_id);
    if (entry === undefined) {
      byFragment.set(row.fragment_id, { fragment: row, chunks: [row] });
    } else {
      const already = entry.chunks.some(
        (c) => c.raw_chunk_id === row.raw_chunk_id
      );
      if (!already) entry.chunks.push(row);
    }
  }

  const fragments: ProvenanceFragment[] = [];
  for (const { fragment, chunks } of byFragment.values()) {
    const provChunks: ProvenanceChunk[] = chunks.map((c) => ({
      id: c.raw_chunk_id,
      chunk_index: c.chunk_index,
      offset_start: c.offset_start,
      offset_end: c.offset_end,
      excerpt: c.excerpt,
      locator: c.locator,
      raw_information: {
        id: c.raw_information_id,
        source_type: toSourceType(c.source_type),
        received_at: c.received_at.toISOString(),
        metadata: c.metadata,
        original_input: c.original_input ?? null,
      },
    }));
    fragments.push({
      id: fragment.fragment_id,
      text: fragment.fragment_text,
      confidence: Number(fragment.fragment_confidence),
      status: fragment.fragment_status,
      chunks: provChunks,
    });
  }
  return fragments;
}
