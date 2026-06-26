// `listAcceptedFragments` service (TC-be-002 / openapi v1.3.0).
//
// Read-only, single transaction (the route wraps the call in
// `withReadOnly`). The service:
//   1. Runs the count query (pre-pagination total).
//   2. Runs the page query (deduped per fragment_id, ordered by
//      `r.received_at DESC NULLS LAST, f.created_at DESC, f.id ASC`).
//   3. Maps each row into the `AcceptedFragmentItem` wire shape.
//
// Filter validation (at-least-one-of, UUID syntax, limit/offset range) lives
// at the route DTO; this service receives an already-typed input. Tombstone
// short-circuit is in the repository SQL (`NOT EXISTS compliance_deletion`),
// per back-spec BR-14: tombstoned RawInformation rows are silently omitted.

import type { PoolClient } from "pg";
import type { Logger } from "pino";

import type {
  AcceptedFragmentItem,
  AcceptedFragmentList,
} from "../dto/fragment.dto.js";
import { toSourceType } from "../dto/response.dto.js";
import {
  countAcceptedFragments,
  selectAcceptedFragments,
  type AcceptedFragmentRow,
} from "../repository/accepted-fragments.repository.js";

export interface ListAcceptedFragmentsInput {
  readonly llm_run_id?: string;
  readonly raw_information_id?: string;
  readonly limit: number;
  readonly offset: number;
}

export async function listAcceptedFragmentsService(
  client: PoolClient,
  input: ListAcceptedFragmentsInput,
  logger: Logger
): Promise<AcceptedFragmentList> {
  const llmRunId = input.llm_run_id ?? null;
  const rawInformationId = input.raw_information_id ?? null;

  const total = await countAcceptedFragments(client, llmRunId, rawInformationId);

  // Short-circuit: total = 0 -> skip the page query, return an empty list.
  // Both the count and select share the same WHERE — they are consistent
  // within the same READ-ONLY snapshot — but the early return saves a roundtrip.
  let rows: readonly AcceptedFragmentRow[] = [];
  if (total > 0) {
    rows = await selectAcceptedFragments(
      client,
      llmRunId,
      rawInformationId,
      input.limit,
      input.offset
    );
  }

  const items: AcceptedFragmentItem[] = rows.map((row) => ({
    fragment_id: row.fragment_id,
    text: row.fragment_text,
    confidence: Number(row.fragment_confidence),
    llm_run_id: row.fragment_llm_run_id,
    created_at: row.fragment_created_at.toISOString(),
    source: {
      raw_information_id: row.raw_information_id,
      chunk_index: row.chunk_index,
      source_type: toSourceType(row.source_type),
      received_at: row.received_at.toISOString(),
      document_title: row.document_title,
    },
  }));

  logger.info(
    {
      route: "GET /api/v1/fragments/accepted",
      outcome: "ok",
      filters: {
        llm_run_id: llmRunId,
        raw_information_id: rawInformationId,
      },
      total,
      returned: items.length,
      limit: input.limit,
      offset: input.offset,
    },
    "query_retrieval_list_accepted_fragments_ok"
  );

  return {
    total,
    limit: input.limit,
    offset: input.offset,
    items,
  };
}
