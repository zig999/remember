// MCP `curation` toolset — write-side mirror of the REST curation surface
// (curation.back.md BR-29/BR-31, ADR A28). Each tool wraps the SAME
// service-layer function the REST handler invokes; success is wrapped in the
// canonical envelope `{ ok: true, result }`, failure flows through the shared
// `mapErrorToEnvelope` from TC-01 so REST and MCP surface byte-identical
// `code` / `message` / `details` for the same thrown sentinel (BR-30, BR-32).
//
// Seven tools owned by this domain:
//   - list_review_queue            (UC-01)
//   - resolve_entity_match         (UC-02 / UC-03)
//   - merge_nodes                  (UC-04)
//   - resolve_dispute              (UC-05 / UC-06 / UC-07)
//   - confirm_item                 (UC-08)
//   - reject_item                  (UC-09)
//   - correct_item                 (UC-10)
//
// The eighth tool on the curation MCP transport — `compliance_delete` — is
// owned end-to-end by `compliance-audit` (BR-31; compliance-audit.back.md
// BR-15) and registered separately by `registerComplianceToolset`. It is NOT
// included in `CURATION_TOOL_NAMES`; the transport composes the closed
// whitelist of 8 names by adding the singleton `'compliance_delete'` to this
// domain's seven (BR-29 rule 5).
//
// Transactional model (`withCurationTransaction` per BR-31):
//   - `list_review_queue`     -> read-only (`withReadOnly`, BR-05 rule 4).
//   - Six write-side tools    -> the service-layer function already opens its
//                                own `BEGIN` / `COMMIT` via `withTransaction`
//                                (curation/service/transaction.ts). Wrapping
//                                the call a second time would nest BEGIN
//                                statements and break audit-row visibility,
//                                so the handler simply calls the service and
//                                relies on the service-owned transaction. The
//                                spec's `withCurationTransaction(pool, (client)
//                                => serviceForTool(...))` formulation is
//                                conceptual: in practice, the existing service
//                                signatures take `{ pool }`, not `{ client }`,
//                                so the BEGIN/COMMIT lives inside the service.
//                                Result is behaviour-identical:
//                                one transaction per tool call (BR-29 rule 4).
//
// JSON Schemas for `tools/list` are derived once at module init via
// `z.toJSONSchema(...)` with `unrepresentable: "any"` (same as
// `knowledge-graph/mcp/query-toolset.ts` and `ingestion/mcp/toolset.ts`).
// This is required because `discriminatedUnion`, `superRefine`-backed
// cross-field rules, and `.transform()` query-string coercion have no
// JSON-Schema equivalent.

import type { Pool } from "pg";
import type { Logger } from "pino";
import { z } from "zod";

import type { CatalogSnapshot } from "../../knowledge-graph/index.js";
import type { CatalogSnapshot as IngestionCatalogSnapshot } from "../../ingestion/index.js";
import type { McpServer } from "../../../mcp/server.js";
import {
  MergeNodesBodySchema,
  ResolveEntityMatchBodySchema,
} from "../dto/entity-match.dto.js";
import { ResolveDisputeBodySchema } from "../dto/dispute.dto.js";
import {
  ConfirmItemBodySchema,
  CorrectItemBodySchema,
  RejectItemBodySchema,
} from "../dto/item.dto.js";
import { ListReviewQueueQuerySchema } from "../dto/queue.dto.js";
import {
  mergeNodesService,
  resolveEntityMatchService,
} from "../service/entity-match.service.js";
import { resolveDisputeService } from "../service/dispute.service.js";
import {
  confirmItemService,
  correctItemService,
  rejectItemService,
} from "../service/item.service.js";
import { listReviewQueueService } from "../service/queue.service.js";
import { UuidSchema } from "../dto/enums.dto.js";
import { mapErrorToEnvelope } from "./error-envelope.js";

export interface CurationToolsetDeps {
  readonly mcp: McpServer;
  readonly pool: Pool;
  readonly logger: Logger;
  readonly catalog: CatalogSnapshot;
  /**
   * Ingestion catalog snapshot — required by `correctItemService` (UC-10 /
   * BR-23) for the type-parse + closed-value-domain legs. See the matching
   * field on `CurationRouteDeps` for the rationale.
   */
  readonly ingestionCatalog: IngestionCatalogSnapshot;
}

// ---------------------------------------------------------------------------
// Per-tool input schemas. For `resolve_entity_match` the path `node_id` is
// merged with the REST body via `.and()` (the body is a `ZodEffects` because
// of the `superRefine` cross-field rules, so `.extend()` is not available;
// `.and()` produces a `ZodIntersection` that parses the same shape and
// `z.toJSONSchema` emits an `allOf` envelope around the two halves).
// ---------------------------------------------------------------------------

/** ResolveEntityMatchInput accepts `node_id` alongside the REST body. */
export const ResolveEntityMatchToolInputSchema = z
  .object({
    node_id: UuidSchema,
  })
  .and(ResolveEntityMatchBodySchema);
export type ResolveEntityMatchToolInput = z.infer<
  typeof ResolveEntityMatchToolInputSchema
>;

// ---------------------------------------------------------------------------
// JSON Schemas — pinned at module init (BR-31). Exported so the MCP curation
// transport's `tools/list` can serve the same objects without re-deriving and
// so the boot wiring in `app.ts` (BR-29) can pass the descriptors to the
// transport.
//
// `unrepresentable: "any"` is required because the curation DTOs encode
// cross-field validations as `superRefine` (`MergeNodesBodySchema`,
// `ResolveEntityMatchBodySchema`, `ResolveDisputeBodySchema`,
// `CorrectItemBodySchema`) which has no JSON-Schema equivalent. The Zod
// schema does the strict runtime validation at dispatch time; the published
// JSON Schema tells the LLM the broad shape (field names, primitive types).
// ---------------------------------------------------------------------------

const JSON_SCHEMA_OPTS = { unrepresentable: "any" as const };

export const CurationToolInputJsonSchemas = {
  list_review_queue: z.toJSONSchema(ListReviewQueueQuerySchema, JSON_SCHEMA_OPTS),
  resolve_entity_match: z.toJSONSchema(
    ResolveEntityMatchToolInputSchema,
    JSON_SCHEMA_OPTS
  ),
  merge_nodes: z.toJSONSchema(MergeNodesBodySchema, JSON_SCHEMA_OPTS),
  resolve_dispute: z.toJSONSchema(ResolveDisputeBodySchema, JSON_SCHEMA_OPTS),
  confirm_item: z.toJSONSchema(ConfirmItemBodySchema, JSON_SCHEMA_OPTS),
  reject_item: z.toJSONSchema(RejectItemBodySchema, JSON_SCHEMA_OPTS),
  correct_item: z.toJSONSchema(CorrectItemBodySchema, JSON_SCHEMA_OPTS),
} as const;

export type CurationToolName = keyof typeof CurationToolInputJsonSchemas;

/**
 * Closed enumeration of the seven curation tool names owned by this domain.
 * The MCP curation transport composes its full closed whitelist (BR-29 rule
 * 5) as the union of this list + the singleton `'compliance_delete'`
 * (compliance-audit BR-15).
 */
export const CURATION_TOOL_NAMES: readonly CurationToolName[] = [
  "list_review_queue",
  "resolve_entity_match",
  "merge_nodes",
  "resolve_dispute",
  "confirm_item",
  "reject_item",
  "correct_item",
];

/** Per-tool human-readable descriptions surfaced over `tools/list`. */
export const CurationToolDescriptions: Record<CurationToolName, string> = {
  list_review_queue:
    "List items pending human review. Two queues are surfaced: `entity_match` " +
    "(KnowledgeNodes in `needs_review` joined with their similarity candidates) " +
    "and `disputed` (KnowledgeLinks / NodeAttributes with status=`disputed` " +
    "grouped by conflict scope). Pagination via `limit` (1..100, default 20) " +
    "and `offset`.",
  resolve_entity_match:
    "Resolve a KnowledgeNode pending entity-match review. `decision=merge_into` " +
    "requires `target_node_id` (the survivor) and a non-empty `reason`; " +
    "`decision=keep_separate` simply promotes the node to `active`. Self-merge " +
    "is rejected with BUSINESS_SELF_MERGE_FORBIDDEN.",
  merge_nodes:
    "Merge two `active` KnowledgeNodes directly (no review queue). `absorbed_id` " +
    "is set to `status=merged` with `merged_into_node_id=survivor_id`; every " +
    "link / attribute / alias is repointed to the survivor in the same " +
    "transaction (BR-04, BR-07). `reason` is mandatory.",
  resolve_dispute:
    "Resolve a set of items in `status=disputed`. `decision=prefer_one` picks " +
    "a winner (other items go to `status=deleted`); `decision=adjust_periods` " +
    "edits the temporal periods (`valid_from`/`valid_to`) of every item; " +
    "`decision=keep_disputed` leaves the rows untouched and records the " +
    "decision in the audit log only.",
  confirm_item:
    "Promote an `uncertain` link or attribute to `active`. `item_kind` selects " +
    "the target table; `item_id` selects the row. `reason` is optional.",
  reject_item:
    "Reject a link or attribute (set `status=deleted` and `superseded_at=now()` " +
    "atomically). Allowed from `active`, `uncertain`, or `disputed`; refuses " +
    "rows already in `deleted` / `superseded`. `reason` is mandatory.",
  correct_item:
    "Correct a link or attribute (errata flow). The predecessor row goes to " +
    "`status=superseded` with `valid_to` UNCHANGED (BR-18); a new successor " +
    "row is created with the corrected values, `supersedes_X=predecessor_id`, " +
    "and the predecessor's provenance copied verbatim (BR-19). `reason` is " +
    "mandatory; `valid_from` changes require a `valid_from_source` " +
    "justification (BR-17).",
};

// ---------------------------------------------------------------------------
// Envelope shape — identical to query / ingestion. Kept as a structural type
// so we do not pull a service-layer type into the transport / handler return.
// ---------------------------------------------------------------------------

export interface McpEnvelopeJson {
  readonly ok: boolean;
  readonly result?: unknown;
  readonly error?: {
    readonly code: string;
    readonly message: string;
    readonly details?: unknown;
  };
}

// ---------------------------------------------------------------------------
// Handler factory — each tool handler:
//   1. Re-parses the input through its Zod schema (the transport already
//      parsed once for dispatch, but the defensive re-parse here means the
//      handler can never receive an untyped object — same pattern the query
//      toolset uses).
//   2. Invokes the service-layer function (which owns its own BEGIN/COMMIT
//      via curation/service/transaction.ts `withTransaction`).
//   3. Wraps the result in `{ ok: true, result }` or, on throw, in the shared
//      `mapErrorToEnvelope(err)` envelope. The mapper never raises — every
//      thrown value collapses to a typed `{ ok: false, error }` envelope.
// ---------------------------------------------------------------------------

function makeHandler<S extends z.ZodTypeAny, O>(
  schema: S,
  run: (input: z.output<S>) => Promise<O>
): (rawInput: unknown) => Promise<McpEnvelopeJson> {
  return async (rawInput: unknown): Promise<McpEnvelopeJson> => {
    try {
      const parsed = schema.parse(rawInput) as z.output<S>;
      const result = await run(parsed);
      return { ok: true, result };
    } catch (err) {
      // ZodError, curation sentinels, pg unavailability, unknowns — all
      // collapse to a typed envelope via the shared mapper (BR-30).
      return mapErrorToEnvelope(err);
    }
  };
}

/**
 * Register the seven curation MCP tools on `deps.mcp` under the `curation`
 * toolset key. Idempotency: re-calling this function in the same process
 * throws (the underlying `McpServer.registerTool` rejects duplicates) — by
 * design.
 */
export function registerCurationToolset(deps: CurationToolsetDeps): void {
  const { mcp, pool, logger, catalog, ingestionCatalog } = deps;

  // ----- list_review_queue (UC-01) -----
  mcp.registerTool("curation", {
    name: "list_review_queue",
    description: CurationToolDescriptions.list_review_queue,
    inputSchema: ListReviewQueueQuerySchema,
    handler: makeHandler(ListReviewQueueQuerySchema, (input) =>
      listReviewQueueService({ pool }, input)
    ),
  });

  // ----- resolve_entity_match (UC-02 / UC-03) -----
  mcp.registerTool("curation", {
    name: "resolve_entity_match",
    description: CurationToolDescriptions.resolve_entity_match,
    inputSchema: ResolveEntityMatchToolInputSchema,
    handler: makeHandler(ResolveEntityMatchToolInputSchema, (input) =>
      resolveEntityMatchService({ pool, logger }, input.node_id, {
        decision: input.decision,
        target_node_id: input.target_node_id,
        reason: input.reason,
      })
    ),
  });

  // ----- merge_nodes (UC-04) -----
  mcp.registerTool("curation", {
    name: "merge_nodes",
    description: CurationToolDescriptions.merge_nodes,
    inputSchema: MergeNodesBodySchema,
    handler: makeHandler(MergeNodesBodySchema, (input) =>
      mergeNodesService(
        { pool, logger },
        input.survivor_id,
        input.absorbed_id,
        input.reason
      )
    ),
  });

  // ----- resolve_dispute (UC-05 / UC-06 / UC-07) -----
  mcp.registerTool("curation", {
    name: "resolve_dispute",
    description: CurationToolDescriptions.resolve_dispute,
    inputSchema: ResolveDisputeBodySchema,
    handler: makeHandler(ResolveDisputeBodySchema, (input) =>
      resolveDisputeService({ pool, logger, catalog }, input)
    ),
  });

  // ----- confirm_item (UC-08) -----
  mcp.registerTool("curation", {
    name: "confirm_item",
    description: CurationToolDescriptions.confirm_item,
    inputSchema: ConfirmItemBodySchema,
    handler: makeHandler(ConfirmItemBodySchema, (input) =>
      confirmItemService(
        { pool, logger, catalog: ingestionCatalog },
        input
      )
    ),
  });

  // ----- reject_item (UC-09) -----
  mcp.registerTool("curation", {
    name: "reject_item",
    description: CurationToolDescriptions.reject_item,
    inputSchema: RejectItemBodySchema,
    handler: makeHandler(RejectItemBodySchema, (input) =>
      rejectItemService(
        { pool, logger, catalog: ingestionCatalog },
        input
      )
    ),
  });

  // ----- correct_item (UC-10) -----
  mcp.registerTool("curation", {
    name: "correct_item",
    description: CurationToolDescriptions.correct_item,
    inputSchema: CorrectItemBodySchema,
    handler: makeHandler(CorrectItemBodySchema, (input) =>
      correctItemService(
        { pool, logger, catalog: ingestionCatalog },
        input
      )
    ),
  });

  logger.info(
    {
      component: "mcp.curation",
      tools_registered: CURATION_TOOL_NAMES.length,
      tool_names: CURATION_TOOL_NAMES,
    },
    "curation_toolset_registered"
  );
}
