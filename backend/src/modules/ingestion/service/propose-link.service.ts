// Service: `ingest.propose_link` business logic (UC-10).
//
// Transport-agnostic. Receives an OPEN `PoolClient` — transaction wrapping is
// the caller's responsibility (BR-19).
//
// Layered validation (BR-13) in the documented order. Each layer is a
// sequential `await`, so layer N+1 only runs when layer N has not thrown:
//
//   1. Structural    — cross-table refs (nodes exist, fragments exist,
//                      link_type known).
//   2. Graph rules   — active link_type_rule for the triple (BR-15).
//   3. Temporal      — semi-open invariant, change_hint signal, date basis.
//   4. Confidence    — < 0.40 -> ok:true outcome=rejected (BELOW_CONFIDENCE_FLOOR).
//   5. Anti-halluc.  — every cited fragment anchors a chunk of the run's
//                      source (BR-18).
//
// On confidence < 0.40 the service returns `{ ok: true, result: { outcome:
// 'rejected', reason: 'BELOW_CONFIDENCE_FLOOR' } }`. The caller maps this to
// `validation_outcome = 'rejected'` on the `tool_call` row (BR-17).
//
// After validation, the service delegates the actual graph write to
// `consolidateLink` (TC-011 / BR-25 / BR-27): the consolidator locks the
// vigent row(s) under FOR UPDATE and decides between consolidated /
// superseded_previous / correction (outcome=accepted) / disputed / accepted
// (new). The previous behaviour (plain INSERT into knowledge_link) was
// only safe when there was no vigent row in scope — a second propose with
// the same scope would have hit the partial dup-guard index. The
// consolidator replaces that path entirely.

import type { PoolClient } from "pg";

import type { CatalogSnapshot } from "../catalog/catalog.js";
import type {
  ProposeLinkInput,
  ProposeLinkResult,
} from "../dto/propose-link.dto.js";
import {
  countFragmentsAnchoredToSource,
  findNodeTypeIdByNodeId,
} from "../repository/llm-run.repository.js";
import { routeConfidence } from "../validation/confidence.js";
import { ValidationFailure } from "../validation/errors.js";
import { validateGraphRule } from "../validation/graph-rules.js";
import { assertFound, assertKnownType } from "../validation/structural.js";
import { validateTemporal } from "../validation/temporal.js";

import { consolidateLink } from "./graph-consolidation.service.js";
import type { McpEnvelope, RunContext } from "./propose.types.js";

/**
 * Dependencies the propose-link service needs beyond the open client + args +
 * run context. `now` is injectable to keep the temporal layer deterministic
 * in unit tests.
 */
export interface ProposeLinkDeps {
  readonly catalog: CatalogSnapshot;
  readonly now: () => Date;
}

export async function proposeLinkService(
  client: PoolClient,
  args: ProposeLinkInput,
  runCtx: RunContext,
  deps: ProposeLinkDeps
): Promise<McpEnvelope<ProposeLinkResult>> {
  // ---- Layer 1: Structural ----------------------------------------------
  // (a) link_type known.
  const linkType = deps.catalog.linkTypeByName.get(args.link_type);
  assertKnownType({
    kind: "link_type",
    name: args.link_type,
    found: linkType !== undefined,
  });
  const resolvedLink = linkType!;

  // (b) source / target node rows exist; we also need their node_type_id for
  //     the graph-rule layer.
  const sourceNodeTypeId = await findNodeTypeIdByNodeId(
    client,
    args.source_node_id
  );
  assertFound({
    entity: "knowledge_node",
    id: args.source_node_id,
    found: sourceNodeTypeId !== null,
  });
  const targetNodeTypeId = await findNodeTypeIdByNodeId(
    client,
    args.target_node_id
  );
  assertFound({
    entity: "knowledge_node",
    id: args.target_node_id,
    found: targetNodeTypeId !== null,
  });

  // (c) fragments exist AND belong to this run. Fetch their texts in the
  //     same query so the temporal layer can run the errata-signal check.
  const fragRes = await client.query<{
    id: string;
    text: string;
    llm_run_id: string;
  }>(
    `SELECT id, "text", llm_run_id
       FROM information_fragment
      WHERE id = ANY($1::uuid[])`,
    [args.fragment_ids]
  );
  if (fragRes.rows.length !== args.fragment_ids.length) {
    throw new ValidationFailure(
      "RESOURCE_NOT_FOUND",
      "One or more fragment_ids do not resolve to a fragment row.",
      { fragment_ids: args.fragment_ids }
    );
  }
  for (const f of fragRes.rows) {
    if (f.llm_run_id !== runCtx.llmRunId) {
      throw new ValidationFailure(
        "VALIDATION_INVALID_FORMAT",
        "fragment_id does not belong to this run.",
        { fragment_id: f.id, llm_run_id: runCtx.llmRunId }
      );
    }
  }
  const fragmentTexts = fragRes.rows.map((r) => r.text);

  // ---- Layer 2: Graph rules --------------------------------------------
  validateGraphRule(
    deps.catalog,
    {
      source_node_type_id: sourceNodeTypeId!,
      link_type_id: resolvedLink.id,
      target_node_type_id: targetNodeTypeId!,
    },
    deps.now()
  );

  // ---- Layer 3: Temporal -----------------------------------------------
  // Pull document_date AND received_at from the run's source. `received_at`
  // is the LAST link of the date-justification chain (v7 §6.5 / §13c / A14)
  // and is consumed by `validateTemporal` as the fallback for
  // `requires_valid_from = true` rows that carry no stated/document date.
  const sourceMetaRes = await client.query<{
    document_date: string | null;
    received_at: Date | null;
  }>(
    `SELECT (metadata->>'document_date') AS document_date,
            received_at
       FROM raw_information WHERE id = $1`,
    [runCtx.rawInformationId]
  );
  const documentDate = sourceMetaRes.rows[0]?.document_date ?? null;
  const receivedAt =
    sourceMetaRes.rows[0]?.received_at?.toISOString() ?? null;

  const resolvedTemporal = validateTemporal({
    valid_from: args.valid_from ?? null,
    valid_to: args.valid_to ?? null,
    valid_from_basis: args.valid_from_basis ?? null,
    requires_valid_from: resolvedLink.requires_valid_from,
    change_hint: args.change_hint,
    fragment_texts: fragmentTexts,
    document_date: documentDate,
    received_at: receivedAt,
  });

  // ---- Layer 4: Confidence ---------------------------------------------
  const route = routeConfidence(args.confidence);
  if (route.kind === "below_floor") {
    // Business REJECTION: ok:true envelope. Caller maps to
    // validation_outcome='rejected' on the audit row.
    const result: ProposeLinkResult = {
      link_id: null,
      outcome: "rejected",
      reason: "BELOW_CONFIDENCE_FLOOR",
    };
    return { ok: true, result };
  }

  // ---- Layer 5: Anti-hallucination -------------------------------------
  const anchored = await countFragmentsAnchoredToSource(client, {
    fragment_ids: args.fragment_ids,
    expected_raw_information_id: runCtx.rawInformationId,
  });
  if (anchored !== args.fragment_ids.length) {
    throw new ValidationFailure(
      "VALIDATION_INVALID_FORMAT",
      "One or more fragments are not anchored to the run's source chunks.",
      {
        fragment_ids: args.fragment_ids,
        expected_raw_information_id: runCtx.rawInformationId,
      }
    );
  }

  // ---- Business write — delegated to the consolidator (BR-25/BR-27) ----
  const statusForNewRow: "active" | "uncertain" =
    route.kind === "active" ? "active" : "uncertain";
  const consolidation = await consolidateLink(
    client,
    {
      source_node_id: args.source_node_id,
      target_node_id: args.target_node_id,
      link_type_id: resolvedLink.id,
      confidence: args.confidence,
      // Use the temporal layer's resolved values — when the `received`
      // fallback applied, these carry the materialized date + basis instead
      // of the raw input nulls (v7 §6.5 / A14).
      valid_from: resolvedTemporal.valid_from,
      valid_to: args.valid_to ?? null,
      valid_from_basis: resolvedTemporal.valid_from_basis,
      change_hint: args.change_hint,
      fragment_ids: args.fragment_ids,
      status_for_new_row: statusForNewRow,
    },
    resolvedLink,
    fragmentTexts,
    runCtx
  );

  // Map consolidator outcome to the public DTO. `superseded_link_id` only
  // surfaces for `superseded_previous` and `accepted` (correction branch);
  // dispute returns just the new row id with the outcome flag.
  const baseResult = {
    link_id: consolidation.link_id,
    outcome: consolidation.outcome,
  };
  const result: ProposeLinkResult =
    consolidation.superseded_link_id !== undefined
      ? { ...baseResult, superseded_link_id: consolidation.superseded_link_id }
      : baseResult;
  return { ok: true, result };
}
