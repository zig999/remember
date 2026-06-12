// Service: `ingest.propose_link` business logic (UC-10).
//
// Transport-agnostic. Receives an OPEN `PoolClient` — transaction wrapping is
// the caller's responsibility (BR-19 + TC-09 constraint).
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
// Full §6.5 consolidation / succession / conflict flow is TC-011; this TC-09
// keeps the minimal "accepted on first proposition; provenance always
// written" behaviour (BR-18 happy path).

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
      "NOT_FOUND",
      "One or more fragment_ids do not resolve to a fragment row.",
      { fragment_ids: args.fragment_ids }
    );
  }
  for (const f of fragRes.rows) {
    if (f.llm_run_id !== runCtx.llmRunId) {
      throw new ValidationFailure(
        "STRUCTURAL_INVALID",
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
  // Pull document_date from the run's metadata via the source.
  const docDateRes = await client.query<{ document_date: string | null }>(
    `SELECT (metadata->>'document_date') AS document_date
       FROM raw_information WHERE id = $1`,
    [runCtx.rawInformationId]
  );
  const documentDate = docDateRes.rows[0]?.document_date ?? null;

  validateTemporal({
    valid_from: args.valid_from ?? null,
    valid_to: args.valid_to ?? null,
    valid_from_basis: args.valid_from_basis ?? null,
    requires_valid_from: resolvedLink.requires_valid_from,
    change_hint: args.change_hint,
    fragment_texts: fragmentTexts,
    document_date: documentDate,
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
      "STRUCTURAL_INVALID",
      "One or more fragments are not anchored to the run's source chunks.",
      {
        fragment_ids: args.fragment_ids,
        expected_raw_information_id: runCtx.rawInformationId,
      }
    );
  }

  // ---- Business write --------------------------------------------------
  // Minimal accepted path: insert a new knowledge_link row + one provenance
  // row per fragment. Full §6.5 consolidation/succession/conflict flow is
  // TC-011 (graph-consolidation service).
  const linkStatus = route.kind === "active" ? "active" : "uncertain";
  const linkRes = await client.query<{ id: string }>(
    `INSERT INTO knowledge_link
       (source_node_id, target_node_id, link_type_id,
        valid_from, valid_to, status, confidence,
        valid_from_source, created_by_run_id)
     VALUES ($1, $2, $3,
             $4::date, $5::date,
             $6::assertion_status, $7,
             $8::valid_from_source, $9)
     RETURNING id`,
    [
      args.source_node_id,
      args.target_node_id,
      resolvedLink.id,
      args.valid_from ?? null,
      args.valid_to ?? null,
      linkStatus,
      args.confidence,
      args.valid_from_basis ?? null,
      runCtx.llmRunId,
    ]
  );
  const linkId = linkRes.rows[0]!.id;

  // Provenance — ON CONFLICT DO NOTHING because UNIQUE(link_id, fragment_id)
  // already guards duplicates if a future consolidation re-runs.
  await client.query(
    `INSERT INTO provenance (link_id, fragment_id)
     SELECT $1, f FROM unnest($2::uuid[]) AS f
     ON CONFLICT DO NOTHING`,
    [linkId, args.fragment_ids]
  );

  const result: ProposeLinkResult = {
    link_id: linkId,
    outcome: "accepted",
  };
  return { ok: true, result };
}
