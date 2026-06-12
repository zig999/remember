// Service: `ingest.propose_attribute` business logic (UC-11).
//
// Transport-agnostic. Receives an OPEN `PoolClient` — transaction wrapping is
// the caller's responsibility (BR-19 + TC-09 constraint).
//
// Mirror of `proposeLinkService`. Differences:
//   - Structural layer additionally parses the literal `value` against
//     `attribute_key.value_type` (BR-14, structural cross-table check).
//   - There is no link_type_rule lookup — the attribute_key catalog itself
//     scopes the `node_type` (UNIQUE(node_type_id, key)). The "graph rules"
//     layer for attributes is "key.node_type_id == node.node_type_id".

import type { PoolClient } from "pg";

import type { CatalogSnapshot } from "../catalog/catalog.js";
import { attributeKeyCacheKey } from "../catalog/catalog.js";
import type {
  ProposeAttributeInput,
  ProposeAttributeResult,
} from "../dto/propose-attribute.dto.js";
import {
  countFragmentsAnchoredToSource,
  findNodeTypeIdByNodeId,
} from "../repository/llm-run.repository.js";
import { routeConfidence } from "../validation/confidence.js";
import { ValidationFailure } from "../validation/errors.js";
import {
  assertFound,
  assertKnownType,
  parseAttributeValue,
} from "../validation/structural.js";
import { validateTemporal } from "../validation/temporal.js";

import type { McpEnvelope, RunContext } from "./propose.types.js";

export interface ProposeAttributeDeps {
  readonly catalog: CatalogSnapshot;
  readonly now: () => Date;
}

export async function proposeAttributeService(
  client: PoolClient,
  args: ProposeAttributeInput,
  runCtx: RunContext,
  deps: ProposeAttributeDeps
): Promise<McpEnvelope<ProposeAttributeResult>> {
  // ---- Layer 1: Structural ----------------------------------------------
  const nodeTypeId = await findNodeTypeIdByNodeId(client, args.node_id);
  assertFound({
    entity: "knowledge_node",
    id: args.node_id,
    found: nodeTypeId !== null,
  });

  // attribute_key lookup is scoped to (node_type_id, key).
  const attrKey = deps.catalog.attributeKeyByNodeTypeAndKey.get(
    attributeKeyCacheKey(nodeTypeId!, args.key)
  );
  assertKnownType({
    kind: "attribute_key",
    name: args.key,
    found: attrKey !== undefined,
  });
  const resolvedKey = attrKey!;

  // Cross-table check: key.node_type_id matches node.node_type_id. The
  // catalog lookup already enforces this; if a future version relaxes the
  // catalog cache scope, this guard catches the mismatch.
  if (resolvedKey.node_type_id !== nodeTypeId) {
    throw new ValidationFailure(
      "STRUCTURAL_INVALID",
      "attribute_key.node_type_id does not match the node's node_type_id.",
      { node_id: args.node_id, key: args.key }
    );
  }

  // Parse `value` against the declared `value_type`.
  parseAttributeValue({ value: args.value, value_type: resolvedKey.value_type });

  // Fragment refs (existence + ownership). Same pattern as propose_link.
  const fragRes = await client.query<{
    id: string;
    text: string;
    llm_run_id: string;
  }>(
    `SELECT id, "text", llm_run_id
       FROM information_fragment WHERE id = ANY($1::uuid[])`,
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

  // ---- Layer 2: Graph rules (attributes have none beyond catalog scope) ----
  // (Already enforced above via the (node_type_id, key) lookup; nothing more
  // to check.)

  // ---- Layer 3: Temporal ----
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
    requires_valid_from: resolvedKey.requires_valid_from,
    change_hint: args.change_hint,
    fragment_texts: fragmentTexts,
    document_date: documentDate,
  });

  // ---- Layer 4: Confidence ----
  const route = routeConfidence(args.confidence);
  if (route.kind === "below_floor") {
    const result: ProposeAttributeResult = {
      attribute_id: null,
      outcome: "rejected",
      reason: "BELOW_CONFIDENCE_FLOOR",
    };
    return { ok: true, result };
  }

  // ---- Layer 5: Anti-hallucination ----
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

  // ---- Business write ----
  const attrStatus = route.kind === "active" ? "active" : "uncertain";
  const attrRes = await client.query<{ id: string }>(
    `INSERT INTO node_attribute
       (node_id, attribute_key_id, value_type, value,
        valid_from, valid_to, status, confidence,
        valid_from_source, created_by_run_id)
     VALUES ($1, $2, $3::attribute_value_type, $4,
             $5::date, $6::date,
             $7::assertion_status, $8,
             $9::valid_from_source, $10)
     RETURNING id`,
    [
      args.node_id,
      resolvedKey.id,
      resolvedKey.value_type,
      args.value,
      args.valid_from ?? null,
      args.valid_to ?? null,
      attrStatus,
      args.confidence,
      args.valid_from_basis ?? null,
      runCtx.llmRunId,
    ]
  );
  const attrId = attrRes.rows[0]!.id;
  await client.query(
    `INSERT INTO provenance (attribute_id, fragment_id)
     SELECT $1, f FROM unnest($2::uuid[]) AS f
     ON CONFLICT DO NOTHING`,
    [attrId, args.fragment_ids]
  );

  const result: ProposeAttributeResult = {
    attribute_id: attrId,
    outcome: "accepted",
  };
  return { ok: true, result };
}
