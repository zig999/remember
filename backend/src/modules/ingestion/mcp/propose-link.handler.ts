// MCP `ingest.propose_link` (UC-10).
//
// Runs the FULL 5-layer pipeline of BR-13 in the documented order. The order
// is encoded structurally: each layer is a sequential `await`, layer N+1
// runs only when layer N has not thrown.
//
//   1. Structural    — input parse + cross-table refs (nodes exist, fragments
//                      exist, link_type known).
//   2. Graph rules   — active link_type_rule for the triple (BR-15).
//   3. Temporal      — semi-open invariant, change_hint signal, date basis.
//   4. Confidence    — < 0.40 -> ok:true outcome=rejected (BELOW_CONFIDENCE_FLOOR).
//   5. Anti-halluc.  — every fragment in fragment_ids anchors a chunk of the
//                      run's source (BR-18).
//
// On confidence < 0.40, we DO write a `tool_call` row with
// `validation_outcome = 'rejected'` (BR-17), but the envelope is `ok: true`
// because rejection-by-confidence is a business outcome, not an error.

import type { Pool } from "pg";
import type { Logger } from "pino";

import type { CatalogSnapshot } from "../catalog/catalog.js";
import {
  ProposeLinkInputSchema,
  type ProposeLinkInput,
  type ProposeLinkResult,
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
import {
  assertRunIsRunning,
  runIngestHandler,
  type McpEnvelope,
} from "./handler-base.js";

export function buildProposeLinkHandler(args: {
  pool: Pool;
  logger: Logger;
  llm_run_id: string;
  catalog: CatalogSnapshot;
  now?: () => Date;
}) {
  const now = args.now ?? (() => new Date());
  return async (raw: unknown): Promise<McpEnvelope<ProposeLinkResult>> => {
    const parsed = ProposeLinkInputSchema.safeParse(raw);
    if (!parsed.success) {
      return await runIngestHandler({
        deps: { pool: args.pool, logger: args.logger, llm_run_id: args.llm_run_id },
        tool_name: "propose_link",
        input: raw as ProposeLinkInput,
        run: async () => {
          throw new ValidationFailure(
            "STRUCTURAL_INVALID",
            "Input failed Zod parse.",
            { issues: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })) }
          );
        },
      });
    }
    return await proposeLinkHandler(parsed.data, { ...args, now });
  };
}

export async function proposeLinkHandler(
  input: ProposeLinkInput,
  deps: {
    pool: Pool;
    logger: Logger;
    llm_run_id: string;
    catalog: CatalogSnapshot;
    now: () => Date;
  }
): Promise<McpEnvelope<ProposeLinkResult>> {
  return await runIngestHandler({
    deps,
    tool_name: "propose_link",
    input,
    run: async (client) => {
      const run = await assertRunIsRunning(client, deps.llm_run_id);

      // ---- Layer 1: Structural ----------------------------------------
      // (a) link_type known.
      const linkType = deps.catalog.linkTypeByName.get(input.link_type);
      assertKnownType({
        kind: "link_type",
        name: input.link_type,
        found: linkType !== undefined,
      });
      const resolvedLink = linkType!;

      // (b) source / target node rows exist; we also need their node_type_id
      //     for the graph-rule layer.
      const sourceNodeTypeId = await findNodeTypeIdByNodeId(
        client,
        input.source_node_id
      );
      assertFound({
        entity: "knowledge_node",
        id: input.source_node_id,
        found: sourceNodeTypeId !== null,
      });
      const targetNodeTypeId = await findNodeTypeIdByNodeId(
        client,
        input.target_node_id
      );
      assertFound({
        entity: "knowledge_node",
        id: input.target_node_id,
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

      // ---- Layer 2: Graph rules ---------------------------------------
      validateGraphRule(
        deps.catalog,
        {
          source_node_type_id: sourceNodeTypeId!,
          link_type_id: resolvedLink.id,
          target_node_type_id: targetNodeTypeId!,
        },
        deps.now()
      );

      // ---- Layer 3: Temporal -----------------------------------------
      // Pull document_date from the run's metadata via the source.
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
        requires_valid_from: resolvedLink.requires_valid_from,
        change_hint: input.change_hint,
        fragment_texts: fragmentTexts,
        document_date: documentDate,
      });

      // ---- Layer 4: Confidence ---------------------------------------
      const route = routeConfidence(input.confidence);
      if (route.kind === "below_floor") {
        // Business REJECTION: ok:true envelope, validation_outcome=rejected.
        const result: ProposeLinkResult = {
          link_id: null,
          outcome: "rejected",
          reason: "BELOW_CONFIDENCE_FLOOR",
        };
        return {
          result,
          validation_outcome: "rejected",
          tool_call_result: { ...result },
        };
      }

      // ---- Layer 5: Anti-hallucination -------------------------------
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

      // ---- Business write --------------------------------------------
      // Minimal accepted path: insert a new knowledge_link row + one
      // provenance row per fragment.
      // Full §6.5 consolidation/succession/conflict flow lives in the future
      // `graph-consolidation` domain; the contract here is "accepted on first
      // proposition; provenance always written" (BR-18 happy path).
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
          input.source_node_id,
          input.target_node_id,
          resolvedLink.id,
          input.valid_from ?? null,
          input.valid_to ?? null,
          linkStatus,
          input.confidence,
          input.valid_from_basis ?? null,
          deps.llm_run_id,
        ]
      );
      const linkId = linkRes.rows[0]!.id;

      // Provenance — ON CONFLICT DO NOTHING because UNIQUE(link_id, fragment_id)
      // already guards duplicates if a future consolidation re-runs.
      await client.query(
        `INSERT INTO provenance (link_id, fragment_id)
         SELECT $1, f FROM unnest($2::uuid[]) AS f
         ON CONFLICT DO NOTHING`,
        [linkId, input.fragment_ids]
      );

      const result: ProposeLinkResult = {
        link_id: linkId,
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
