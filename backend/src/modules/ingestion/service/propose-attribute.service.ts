// Service: `ingest.propose_attribute` business logic (UC-11).
//
// Transport-agnostic. Receives an OPEN `PoolClient` — transaction wrapping is
// the caller's responsibility (BR-19).
//
// Mirror of `proposeLinkService`. Differences:
//   - Structural layer additionally parses the literal `value` against
//     `attribute_key.value_type` (BR-14, structural cross-table check).
//   - There is no link_type_rule lookup — the attribute_key catalog itself
//     scopes the `node_type` (UNIQUE(node_type_id, key)). The "graph rules"
//     layer for attributes is "key.node_type_id == node.node_type_id".
//
// After validation, the service delegates the actual graph write to
// `consolidateAttribute` (TC-011 / BR-25 / BR-27).

import type { PoolClient } from "pg";

import type { CatalogSnapshot } from "../catalog/catalog.js";
import { attributeKeyCacheKey, domainOf } from "../catalog/catalog.js";
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
  assertValueInDomain,
  parseAttributeValue,
} from "../validation/structural.js";
import { validateTemporal } from "../validation/temporal.js";

import { consolidateAttribute } from "./graph-consolidation.service.js";
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
      "VALIDATION_INVALID_FORMAT",
      "attribute_key.node_type_id does not match the node's node_type_id.",
      { node_id: args.node_id, key: args.key }
    );
  }

  // Parse `value` against the declared `value_type`.
  parseAttributeValue({ value: args.value, value_type: resolvedKey.value_type });

  // Closed-domain gate (BR-30). Runs IMMEDIATELY after parseAttributeValue
  // and BEFORE any subsequent layer (graph rules / temporal / confidence /
  // anti-hallucination). When `domainOf` returns `null` the key has an open
  // domain (zero rows in `attribute_valid_value`) — backward-compatible
  // no-op for every legacy key. When it returns a `ReadonlySet<string>` the
  // key is closed and `assertValueInDomain` rejects out-of-domain literals
  // with `VALIDATION_INVALID_FORMAT` carrying `{ value, allowed_values }`.
  // Exact match (no normalisation) per spec §1 / BR-30 v1 semantics.
  const domain = domainOf(deps.catalog, resolvedKey.id);
  if (domain !== null) {
    assertValueInDomain(args.value, domain);
  }

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

  // ---- Layer 2: Graph rules (attributes have none beyond catalog scope) ----
  // (Already enforced above via the (node_type_id, key) lookup; nothing more
  // to check.)

  // ---- Layer 3: Temporal ----
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
    requires_valid_from: resolvedKey.requires_valid_from,
    change_hint: args.change_hint,
    fragment_texts: fragmentTexts,
    document_date: documentDate,
    received_at: receivedAt,
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
  const consolidation = await consolidateAttribute(
    client,
    {
      node_id: args.node_id,
      attribute_key_id: resolvedKey.id,
      value_type: resolvedKey.value_type,
      value: args.value,
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
    resolvedKey,
    fragmentTexts,
    runCtx
  );

  const baseResult = {
    attribute_id: consolidation.attribute_id,
    outcome: consolidation.outcome,
  };
  const result: ProposeAttributeResult =
    consolidation.superseded_attribute_id !== undefined
      ? {
          ...baseResult,
          superseded_attribute_id: consolidation.superseded_attribute_id,
        }
      : baseResult;
  return { ok: true, result };
}
