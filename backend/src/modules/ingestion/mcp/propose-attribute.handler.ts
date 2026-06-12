// MCP `ingest.propose_attribute` (UC-11).
//
// Mirror of propose_link. Differences:
//   - Structural layer additionally parses the literal `value` against
//     `attribute_key.value_type` (BR-14, structural cross-table check).
//   - There is no link_type_rule lookup — the attribute_key catalog itself
//     scopes the `node_type` (UNIQUE(node_type_id, key)). The "graph rules"
//     layer for attributes is "key.node_type_id == node.node_type_id".

import type { Pool } from "pg";
import type { Logger } from "pino";

import type { CatalogSnapshot } from "../catalog/catalog.js";
import { attributeKeyCacheKey } from "../catalog/catalog.js";
import {
  ProposeAttributeInputSchema,
  type ProposeAttributeInput,
  type ProposeAttributeResult,
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
import {
  assertRunIsRunning,
  runIngestHandler,
  type McpEnvelope,
} from "./handler-base.js";

export function buildProposeAttributeHandler(args: {
  pool: Pool;
  logger: Logger;
  llm_run_id: string;
  catalog: CatalogSnapshot;
  now?: () => Date;
}) {
  const now = args.now ?? (() => new Date());
  return async (raw: unknown): Promise<McpEnvelope<ProposeAttributeResult>> => {
    const parsed = ProposeAttributeInputSchema.safeParse(raw);
    if (!parsed.success) {
      return await runIngestHandler({
        deps: { pool: args.pool, logger: args.logger, llm_run_id: args.llm_run_id },
        tool_name: "propose_attribute",
        input: raw as ProposeAttributeInput,
        run: async () => {
          throw new ValidationFailure(
            "STRUCTURAL_INVALID",
            "Input failed Zod parse.",
            { issues: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })) }
          );
        },
      });
    }
    return await proposeAttributeHandler(parsed.data, { ...args, now });
  };
}

export async function proposeAttributeHandler(
  input: ProposeAttributeInput,
  deps: {
    pool: Pool;
    logger: Logger;
    llm_run_id: string;
    catalog: CatalogSnapshot;
    now: () => Date;
  }
): Promise<McpEnvelope<ProposeAttributeResult>> {
  return await runIngestHandler({
    deps,
    tool_name: "propose_attribute",
    input,
    run: async (client) => {
      const run = await assertRunIsRunning(client, deps.llm_run_id);

      // ---- Layer 1: Structural ----------------------------------------
      const nodeTypeId = await findNodeTypeIdByNodeId(client, input.node_id);
      assertFound({
        entity: "knowledge_node",
        id: input.node_id,
        found: nodeTypeId !== null,
      });

      // attribute_key lookup is scoped to (node_type_id, key).
      const attrKey = deps.catalog.attributeKeyByNodeTypeAndKey.get(
        attributeKeyCacheKey(nodeTypeId!, input.key)
      );
      assertKnownType({
        kind: "attribute_key",
        name: input.key,
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
          { node_id: input.node_id, key: input.key }
        );
      }

      // Parse `value` against the declared `value_type`.
      parseAttributeValue({ value: input.value, value_type: resolvedKey.value_type });

      // Fragment refs (existence + ownership). Same pattern as propose_link.
      const fragRes = await client.query<{
        id: string;
        text: string;
        llm_run_id: string;
      }>(
        `SELECT id, "text", llm_run_id
           FROM information_fragment WHERE id = ANY($1::uuid[])`,
        [input.fragment_ids]
      );
      if (fragRes.rows.length !== input.fragment_ids.length) {
        throw new ValidationFailure(
          "NOT_FOUND",
          "One or more fragment_ids do not resolve to a fragment row.",
          { fragment_ids: input.fragment_ids }
        );
      }
      for (const f of fragRes.rows) {
        if (f.llm_run_id !== deps.llm_run_id) {
          throw new ValidationFailure(
            "STRUCTURAL_INVALID",
            "fragment_id does not belong to this run.",
            { fragment_id: f.id, llm_run_id: deps.llm_run_id }
          );
        }
      }
      const fragmentTexts = fragRes.rows.map((r) => r.text);

      // ---- Layer 2: Graph rules (attributes have none beyond catalog scope) ----
      // (Already enforced above via the (node_type_id, key) lookup; nothing
      // more to check.)

      // ---- Layer 3: Temporal ----
      const docDateRes = await client.query<{ document_date: string | null }>(
        `SELECT (metadata->>'document_date') AS document_date
           FROM raw_information WHERE id = $1`,
        [run.input_raw_information_id]
      );
      const documentDate = docDateRes.rows[0]?.document_date ?? null;
      validateTemporal({
        valid_from: input.valid_from ?? null,
        valid_to: input.valid_to ?? null,
        valid_from_basis: input.valid_from_basis ?? null,
        requires_valid_from: resolvedKey.requires_valid_from,
        change_hint: input.change_hint,
        fragment_texts: fragmentTexts,
        document_date: documentDate,
      });

      // ---- Layer 4: Confidence ----
      const route = routeConfidence(input.confidence);
      if (route.kind === "below_floor") {
        const result: ProposeAttributeResult = {
          attribute_id: null,
          outcome: "rejected",
          reason: "BELOW_CONFIDENCE_FLOOR",
        };
        return {
          result,
          validation_outcome: "rejected",
          tool_call_result: { ...result },
        };
      }

      // ---- Layer 5: Anti-hallucination ----
      const anchored = await countFragmentsAnchoredToSource(client, {
        fragment_ids: input.fragment_ids,
        expected_raw_information_id: run.input_raw_information_id,
      });
      if (anchored !== input.fragment_ids.length) {
        throw new ValidationFailure(
          "STRUCTURAL_INVALID",
          "One or more fragments are not anchored to the run's source chunks.",
          {
            fragment_ids: input.fragment_ids,
            expected_raw_information_id: run.input_raw_information_id,
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
          input.node_id,
          resolvedKey.id,
          resolvedKey.value_type,
          input.value,
          input.valid_from ?? null,
          input.valid_to ?? null,
          attrStatus,
          input.confidence,
          input.valid_from_basis ?? null,
          deps.llm_run_id,
        ]
      );
      const attrId = attrRes.rows[0]!.id;
      await client.query(
        `INSERT INTO provenance (attribute_id, fragment_id)
         SELECT $1, f FROM unnest($2::uuid[]) AS f
         ON CONFLICT DO NOTHING`,
        [attrId, input.fragment_ids]
      );

      const result: ProposeAttributeResult = {
        attribute_id: attrId,
        outcome: "accepted",
      };
      return {
        result,
        validation_outcome: "accepted",
        tool_call_result: { ...result },
      };
    },
  });
}
