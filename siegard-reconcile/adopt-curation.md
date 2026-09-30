---
contract_version: siegard-reconcile/8
title: Adoption of the curation context
summary: The curation module is adopted as it stands and did not change; the owner states the source is
  the running system, and this reconciliation asks whether the specification written from its survey holds
  what each file carries.
target: backend
files:
- path: src/modules/curation/dto/dispute.dto.ts
  change: 'Validates the dispute-resolution request: item kind, at least two distinct items, decision,
    winner, periods and reason.'
- path: src/modules/curation/dto/entity-match.dto.ts
  change: Validates the entity-match resolution and node-merge requests and the node identity in the path.
- path: src/modules/curation/dto/enums.dto.ts
  change: 'Declares the closed sets and shared formats the curation requests use: assertion kind, queue
    kind, decisions, statuses, valid-from basis, identifiers, dates and reasons.'
- path: src/modules/curation/dto/item.dto.ts
  change: Validates the confirmation, rejection and correction requests, including the corrected values.
- path: src/modules/curation/dto/queue.dto.ts
  change: 'Validates the review queue listing query: kind, limit and offset with their defaults.'
- path: src/modules/curation/index.ts
  change: Exposes the curation module's routes, MCP toolset and transport to the application.
- path: src/modules/curation/mcp/curation-toolset.ts
  change: Registers the seven curation tools for the language model over the same services as REST.
- path: src/modules/curation/mcp/curation-transport.ts
  change: Mounts the curation MCP endpoint over the tools named for it.
- path: src/modules/curation/mcp/error-envelope.ts
  change: Classifies every curation failure into its answer, the same for REST and MCP.
- path: src/modules/curation/repository/curation.repository.ts
  change: 'Reads and writes the store for curation: queue listings, guarded status changes, merges, corrections,
    provenance, curation actions and metrics aggregates.'
- path: src/modules/curation/routes/curation.routes.ts
  change: Serves the eight curation operations over REST.
- path: src/modules/curation/service/dispute.service.ts
  change: Resolves disputes by preferring one item, adjusting periods or keeping the dispute, and records
    the action.
- path: src/modules/curation/service/entity-match.service.ts
  change: Resolves entity matches and merges nodes, and records the action.
- path: src/modules/curation/service/errors.ts
  change: Declares the curation refusal classes with their status, code, message and details.
- path: src/modules/curation/service/item.service.ts
  change: Confirms, rejects and corrects links and attributes, and records the action.
- path: src/modules/curation/service/merge.service.ts
  change: Checks and carries out the merge of one knowledge node into another.
- path: src/modules/curation/service/metrics.service.ts
  change: Computes the curation metrics snapshot.
- path: src/modules/curation/service/queue.service.ts
  change: Lists the review queues, grouping disputed items by dispute scope.
- path: src/modules/curation/service/transaction.ts
  change: Re-exports the transaction helpers the curation services run in.
nodes:
- node: constraints/curation-is-atomic
  conforms: true
  how: 'src/modules/curation/service/dispute.service.ts: held at `resolveDisputeService` returns `withTransaction(deps.pool,
    async (client) => { ... })`, wrapping every lock, update and action insert. — return withTransaction(deps.pool,
    async (client) => {

    src/modules/curation/service/entity-match.service.ts: held at the `withTransaction(deps.pool, async
    (client) => { ... })` wrappers of resolveEntityMatchService and mergeNodesService — return withTransaction(deps.pool,
    async (client) => {

    src/modules/curation/service/item.service.ts: held at the `withTransaction(deps.pool, async (client)
    => { ... })` wrapper in each of confirmItemService, rejectItemService and correctItemService — return
    withTransaction(deps.pool, async (client) => {'
  encoded_at:
  - src/modules/curation/service/dispute.service.ts
  - src/modules/curation/service/entity-match.service.ts
  - src/modules/curation/service/item.service.ts
- node: constraints/curation-reads-are-consistent
  conforms: true
  how: "src/modules/curation/service/metrics.service.ts: held at the withReadOnly(deps.pool, ...) call\
    \ in computeCurationMetricsService, lines 57-59. The transaction body is in ./transaction.js, which\
    \ I did not read. — const row = await withReadOnly(deps.pool, async (client) => {\n    return aggregateCurationMetrics(client);\n\
    \  });\nsrc/modules/curation/service/queue.service.ts: held at listReviewQueueService, the `withReadOnly(deps.pool,\
    \ async (client) => { ... })` wrapper around every queue read and count. — return withReadOnly(deps.pool,\
    \ async (client) => {\n  ...\n  return { total, limit, offset, items };\n});"
  encoded_at:
  - src/modules/curation/service/metrics.service.ts
  - src/modules/curation/service/queue.service.ts
- node: constraints/curation-transports-answer-alike
  conforms: true
  how: "src/modules/curation/mcp/curation-toolset.ts: held at `makeHandler` (lines 226-241) and the seven\
    \ `mcp.registerTool(\"curation\", ...)` handlers inside `registerCurationToolset`. They call the same\
    \ service-layer functions as REST and route every failure through the shared `mapErrorToEnvelope`.\
    \ — try {\n  const parsed = schema.parse(rawInput) as z.output<S>;\n  const result = await run(parsed);\n\
    \  return { ok: true, result };\n} catch (err) {\n  return mapErrorToEnvelope(err);\n}\nsrc/modules/curation/mcp/error-envelope.ts:\
    \ held at mapErrorToEnvelope, line 209, which shares one classification core with mapErrorToHttpResponse\
    \ — export function mapErrorToEnvelope(err: unknown) {\n  return mapErrorToHttpResponse(err).envelope;\n\
    }\nsrc/modules/curation/routes/curation.routes.ts: held at `sendError()` (lines 81-107) and the GET\
    \ /metrics catch branch (lines 154-165), which take the status and envelope of every REST refusal\
    \ from the shared `mapErrorToHttpResponse` imported from \"../mcp/error-envelope.js\". The mapper\
    \ is not in the file set. This file holds only the routing of errors into it. — const { statusCode,\
    \ envelope, logLevel } = mapErrorToHttpResponse(err); ... return reply.status(statusCode).send(envelope);"
  encoded_at:
  - src/modules/curation/mcp/curation-toolset.ts
  - src/modules/curation/mcp/error-envelope.ts
  - src/modules/curation/routes/curation.routes.ts
- node: constraints/llm-toolset-omits-curation-metrics
  conforms: true
  how: "src/modules/curation/mcp/curation-toolset.ts: held at `CURATION_TOOL_NAMES` (lines 148-156), `CurationToolInputJsonSchemas`\
    \ (lines 127-138) and the seven `registerTool` calls. They cover the review queue listing and the\
    \ six decisions. No metrics tool is registered. — export const CURATION_TOOL_NAMES: readonly CurationToolName[]\
    \ = [\n  \"list_review_queue\",\n  \"resolve_entity_match\",\n  \"merge_nodes\",\n  \"resolve_dispute\"\
    ,\n  \"confirm_item\",\n  \"reject_item\",\n  \"correct_item\",\n];"
  encoded_at:
  - src/modules/curation/mcp/curation-toolset.ts
- node: contracts/knowledge-base/curation
  conforms: false
  how: "src/modules/curation/service/dispute.service.ts, the prefer_one branch of `resolveDisputeService`,\
    \ lines 118-123.: throw new BusinessError(\n  \"BUSINESS_DISPUTE_WINNER_REQUIRED\",\n  \"decision=prefer_one\
    \ requires winner_id\"\n); — The contract fixes the message as \"decision=prefer_one requires winner_id\
    \ (member of item_ids)\". The code emits the text without \"(member of item_ids)\", so a client matching\
    \ or displaying the specified message gets a different one. This file also checks only that `winnerId`\
    \ is present, not that it is among `item_ids`. Whether another file enforces membership is outside\
    \ this file set.\nsrc/modules/curation/service/dispute.service.ts, the adjust_periods branch of `resolveDisputeService`,\
    \ lines 200-206.: if (!periods || periods.length === 0) {\n  throw new BusinessError(\n    \"BUSINESS_DISPUTE_PERIODS_REQUIRED\"\
    ,\n    \"decision=adjust_periods requires periods[]\"\n  );\n} — The contract fixes the message as\
    \ \"decision=adjust_periods requires periods[] (one entry per item_id)\". The code emits the text\
    \ without the parenthesis. The guard here also checks only that the list is non-empty, so this file\
    \ does not hold \"exactly one period to each of its items\". A list of periods that does not match\
    \ the items reaches `adjustItemPeriod` and fails there as a different refusal, BUSINESS_ITEM_NOT_DISPUTED.\
    \ The same contract message is owed by the code path that enforces one period per item.\nsrc/modules/curation/service/errors.ts,\
    \ TemporalIncoherentError constructor, lines 66-74 (the SQLSTATE 23505 duplicate-guard fallback):\
    \ /** Defensive: SQLSTATE 23505 fallback (BR-28). */\nexport class TemporalIncoherentError extends\
    \ BusinessError {\n  constructor(details?: CurationErrorDetails) {\n    super(\n      \"BUSINESS_TEMPORAL_INCOHERENT\"\
    ,\n      \"Adjusted periods violate semi-open invariant or functional-scope overlap.\",\n      details\n\
    \    ); — The node fixes what a caller is told when a uniqueness guard of the store refuses the write.\
    \ That answer is code BUSINESS_TEMPORAL_INCOHERENT with the message \"A duplicate-guard index rejected\
    \ the resolution; another row currently occupies this scope.\" and no details. The class emits a different\
    \ message and accepts optional details. A client or MCP caller that reads the contract gets one text,\
    \ and the running system sends another. Someone checking the wording against the specification cannot\
    \ tell which text was decided."
  observed_at:
  - src/modules/curation/service/dispute.service.ts
  - src/modules/curation/service/errors.ts
- node: domain/knowledge-base/adjusted-period
  conforms: false
  how: 'src/modules/curation/dto/dispute.dto.ts, AdjustedPeriodSchema, line 15 (valid_from): valid_from:
    IsoDateSchema.nullable(), valid_to: IsoDateSchema.nullable().optional(), — The node declares both
    `valid_from` and `valid_to` as optional dates, with only `item_id` required. The schema accepts an
    omitted `valid_to` but refuses a period whose `valid_from` key is absent. The owner can omit a start
    in one field and not in the other. The only place that asymmetry is decided is this file, and a reader
    of the specification would not expect it.'
  observed_at:
  - src/modules/curation/dto/dispute.dto.ts
- node: domain/knowledge-base/assertion-correction
  conforms: true
  how: 'src/modules/curation/dto/item.dto.ts: held at The object shape inside CorrectItemBodySchema, lines
    43-49. — item_kind: ItemKindSchema, item_id: UuidSchema, corrected: CorrectedValuesSchema, reason:
    ReasonRequiredSchema'
  encoded_at:
  - src/modules/curation/dto/item.dto.ts
- node: domain/knowledge-base/assertion-kind
  conforms: true
  how: 'src/modules/curation/dto/enums.dto.ts: held at `ItemKindSchema`, line 7. It carries the values
    link and attribute. — export const ItemKindSchema = z.enum(["link", "attribute"]);

    src/modules/curation/service/queue.service.ts: held at The inline union `"link" | "attribute"` on
    DisputeQueueItem.item_kind, line 63. — readonly item_kind: "link" | "attribute";'
  encoded_at:
  - src/modules/curation/dto/enums.dto.ts
  - src/modules/curation/service/queue.service.ts
- node: domain/knowledge-base/assertion-review
  conforms: true
  how: 'src/modules/curation/dto/item.dto.ts: held at ConfirmItemBodySchema (lines 14-18) and RejectItemBodySchema
    (lines 22-26). — item_kind: ItemKindSchema, item_id: UuidSchema, reason: z.string().trim().min(1).optional().nullable()'
  encoded_at:
  - src/modules/curation/dto/item.dto.ts
- node: domain/knowledge-base/assertion-status
  conforms: true
  how: "src/modules/curation/dto/enums.dto.ts: held at `AssertionStatusSchema`, lines 31-37. It carries\
    \ the five values of the node. — export const AssertionStatusSchema = z.enum([\n  \"active\",\n  \"\
    uncertain\",\n  \"disputed\",\n  \"superseded\",\n  \"deleted\",\n]);"
  encoded_at:
  - src/modules/curation/dto/enums.dto.ts
- node: domain/knowledge-base/corrected-values
  conforms: true
  how: 'src/modules/curation/dto/item.dto.ts: held at CorrectedValuesSchema, lines 30-37. — target_node_id:
    UuidSchema.optional().nullable(), valid_from: IsoDateSchema.optional().nullable(), valid_to: IsoDateSchema.optional().nullable(),
    valid_from_source: ValidFromSourceSchema.optional().nullable(), valid_from_fragment_id: UuidSchema.optional().nullable()'
  encoded_at:
  - src/modules/curation/dto/item.dto.ts
- node: domain/knowledge-base/curation-action
  conforms: true
  how: 'src/modules/curation/repository/curation.repository.ts: held at the CurationActionInsertArgs interface
    and the INSERT in insertCurationAction (lines 592-621) — `INSERT INTO curation_action (action, target_kind,
    target_id, payload, reason) VALUES ($1, $2, $3, $4::jsonb, $5) RETURNING id, created_at`'
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
- node: domain/knowledge-base/curation-metrics
  conforms: true
  how: 'src/modules/curation/service/metrics.service.ts: held at the CurationMetricsResponse interface,
    lines 27-36, which declares all eight attributes — readonly accept_rate: number; readonly reject_rate_by_code:
    Readonly<Record<string, number>>; readonly needs_review_count: number; readonly uncertain_count: number;
    readonly disputed_count: number; readonly entity_match_queue_count: number; readonly disputed_queue_count:
    number; readonly computed_at: string;'
  encoded_at:
  - src/modules/curation/service/metrics.service.ts
- node: domain/knowledge-base/curation-target-kind
  conforms: true
  how: 'src/modules/curation/repository/curation.repository.ts: held at the `target_kind` union in CurationActionInsertArgs
    (line 594), which declares only three of the five values — readonly target_kind: "node" | "link" |
    "attribute";'
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
- node: domain/knowledge-base/dispute-decision
  conforms: true
  how: "src/modules/curation/dto/enums.dto.ts: held at `DisputeDecisionSchema`, lines 16-20. It carries\
    \ the three values in the underscore spelling the contract uses on the wire. — export const DisputeDecisionSchema\
    \ = z.enum([\n  \"prefer_one\",\n  \"adjust_periods\",\n  \"keep_disputed\",\n]);\nsrc/modules/curation/service/dispute.service.ts:\
    \ held at the literal union on `ResolveDisputeResult.decision`, line 46. — readonly decision: \"prefer_one\"\
    \ | \"adjust_periods\" | \"keep_disputed\";"
  encoded_at:
  - src/modules/curation/dto/enums.dto.ts
  - src/modules/curation/service/dispute.service.ts
- node: domain/knowledge-base/dispute-resolution
  conforms: true
  how: 'src/modules/curation/dto/dispute.dto.ts: held at ResolveDisputeBodySchema z.object, lines 31-39
    — item_kind: ItemKindSchema, item_ids: z.array(UuidSchema).min(2), decision: DisputeDecisionSchema,
    winner_id: UuidSchema.optional().nullable(), periods: z.array(AdjustedPeriodSchema).optional().nullable(),
    reason: z.string().trim().min(1).optional().nullable(),'
  encoded_at:
  - src/modules/curation/dto/dispute.dto.ts
- node: domain/knowledge-base/dispute-scope
  conforms: true
  how: "src/modules/curation/service/queue.service.ts: held at The DisputeQueueScope interface, lines\
    \ 53-59, and the scope objects built in groupDisputedLinks and groupDisputedAttributes. — export interface\
    \ DisputeQueueScope {\n  readonly source_node_id: string | null;\n  readonly target_node_id: string\
    \ | null;\n  readonly link_type: string | null;\n  readonly node_id: string | null;\n  readonly attribute_key:\
    \ string | null;\n}"
  encoded_at:
  - src/modules/curation/service/queue.service.ts
- node: domain/knowledge-base/entity-match-decision
  conforms: true
  how: 'src/modules/curation/dto/enums.dto.ts: held at `EntityMatchDecisionSchema`, line 13. It carries
    the two values in the underscore spelling the contract uses on the wire. — export const EntityMatchDecisionSchema
    = z.enum(["merge_into", "keep_separate"]);

    src/modules/curation/service/entity-match.service.ts: held at the literal union on `decision` in the
    ResolveEntityMatchResult interface — readonly decision: "merge_into" | "keep_separate";'
  encoded_at:
  - src/modules/curation/dto/enums.dto.ts
  - src/modules/curation/service/entity-match.service.ts
- node: domain/knowledge-base/entity-match-resolution
  conforms: true
  how: 'src/modules/curation/dto/entity-match.dto.ts: held at ResolveEntityMatchBodySchema, lines 25-56
    — decision: EntityMatchDecisionSchema, target_node_id: UuidSchema.optional().nullable(), reason: z.string().trim().min(1).optional().nullable(),'
  encoded_at:
  - src/modules/curation/dto/entity-match.dto.ts
- node: domain/knowledge-base/knowledge-link
  conforms: true
  how: 'src/modules/curation/repository/curation.repository.ts: held at the row types ItemLockedRow and
    DisputedLinkRow (lines 182-198 and 671-688), which name part of the link''s attributes, and the knowledge_link
    statements — `readonly source_node_id?: string; readonly target_node_id?: string; readonly link_type_id?:
    string;` and `supersedes_link_id AS supersedes_id`'
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
- node: domain/knowledge-base/merge-counts
  conforms: true
  how: 'src/modules/curation/service/merge.service.ts: held at The MergeAffectedCounts interface, lines
    31 to 36. — export interface MergeAffectedCounts { readonly links_repointed: number; readonly attributes_repointed:
    number; readonly aliases_copied: number; readonly path_compressed_nodes: number; }'
  encoded_at:
  - src/modules/curation/service/merge.service.ts
- node: domain/knowledge-base/node-attribute
  conforms: true
  how: 'src/modules/curation/repository/curation.repository.ts: held at the row types ItemLockedRow and
    DisputedAttributeRow (lines 182-198 and 725-737), which name part of the attribute''s fields, and
    the node_attribute statements — `readonly attribute_key_id?: string; readonly value?: string;` and
    `supersedes_attribute_id AS supersedes_id`'
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
- node: domain/knowledge-base/node-merge
  conforms: true
  how: 'src/modules/curation/dto/entity-match.dto.ts: held at MergeNodesBodySchema, lines 63-77 — survivor_id:
    UuidSchema, absorbed_id: UuidSchema, reason: ReasonRequiredSchema,'
  encoded_at:
  - src/modules/curation/dto/entity-match.dto.ts
- node: domain/knowledge-base/node-status
  conforms: true
  how: "src/modules/curation/dto/enums.dto.ts: held at `NodeStatusSchema`, lines 23-28. It carries the\
    \ four values of the node. — export const NodeStatusSchema = z.enum([\n  \"active\",\n  \"needs_review\"\
    ,\n  \"merged\",\n  \"deleted\",\n]);"
  encoded_at:
  - src/modules/curation/dto/enums.dto.ts
- node: domain/knowledge-base/review-queue-filter
  conforms: true
  how: "src/modules/curation/dto/queue.dto.ts: held at ListReviewQueueQuerySchema, lines 8-12. It declares\
    \ the filter's shape: `kind` and the page attributes `limit` and `offset`. — export const ListReviewQueueQuerySchema\
    \ = z.object({\n  kind: ReviewQueueKindSchema.optional(),\n  limit: z.coerce.number().int().min(1).max(100).default(20),\n\
    \  offset: z.coerce.number().int().min(0).default(0),\n});"
  encoded_at:
  - src/modules/curation/dto/queue.dto.ts
- node: domain/knowledge-base/review-queue-kind
  conforms: true
  how: 'src/modules/curation/dto/enums.dto.ts: held at `ReviewQueueKindSchema`, line 10. It carries the
    two values in the underscore spelling the contract uses in `kind: "entity_match"`. — export const
    ReviewQueueKindSchema = z.enum(["entity_match", "disputed"]);'
  encoded_at:
  - src/modules/curation/dto/enums.dto.ts
- node: domain/knowledge-base/valid-from-basis
  conforms: true
  how: 'src/modules/curation/dto/enums.dto.ts: held at `ValidFromSourceSchema`, line 40. It carries the
    three values of the node. — export const ValidFromSourceSchema = z.enum(["stated", "document", "received"]);

    src/modules/curation/service/queue.service.ts: held at The inline union on DisputedItemSide.valid_from_source,
    line 48. — readonly valid_from_source: "stated" | "document" | "received" | null;'
  encoded_at:
  - src/modules/curation/dto/enums.dto.ts
  - src/modules/curation/service/queue.service.ts
- node: domain/knowledge-base/value-type
  conforms: true
  how: 'src/modules/curation/repository/curation.repository.ts: held at the `value_type` union in ItemLockedRow
    (line 189) — readonly value_type?: "date" | "number" | "text" | "bool";'
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
- node: rules/knowledge-base/accept-rate
  conforms: true
  how: 'src/modules/curation/repository/curation.repository.ts: held at the ACCEPT_ACTIONS array and the
    totalActions > 0 branch in aggregateCurationMetrics (lines 787-839) — `"resolve_entity_match", "merge_nodes",
    "resolve_dispute", "confirm_item", "correct_item"` and `let acceptRate = 0; if (totalActions > 0)
    { ... acceptRate = accepted / totalActions; }`'
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
- node: rules/knowledge-base/adjust-periods-one-per-item
  conforms: true
  how: "src/modules/curation/dto/dispute.dto.ts: held at the adjust_periods branch of the superRefine,\
    \ lines 76-112 — if (value.periods.length !== value.item_ids.length) { ctx.addIssue({ code: \"custom\"\
    , path: [\"periods\"], message: \"BUSINESS_DISPUTE_PERIODS_REQUIRED\", }); }\nsrc/modules/curation/mcp/error-envelope.ts:\
    \ held at the BUSINESS_DISPUTE_PERIODS_REQUIRED case of messageForZodCustomCode, line 70. The file\
    \ renders the refusal and does not check the rule. — case \"BUSINESS_DISPUTE_PERIODS_REQUIRED\":\n\
    \  return \"decision=adjust_periods requires periods[] (one entry per item_id)\";"
  encoded_at:
  - src/modules/curation/dto/dispute.dto.ts
  - src/modules/curation/mcp/error-envelope.ts
- node: rules/knowledge-base/adjust-periods-outcome
  conforms: true
  how: "src/modules/curation/repository/curation.repository.ts: held at the UPDATEs in adjustItemPeriod\
    \ (lines 357-386) — `SET valid_from = $2::date, valid_to = $3::date, status = 'active' WHERE id =\
    \ $1 AND status = 'disputed'`\nsrc/modules/curation/service/dispute.service.ts: held at the adjust_periods\
    \ loop, lines 229-250. — const updated = await adjustItemPeriod(\n  client, body.item_kind, p.item_id,\
    \ p.valid_from, p.valid_to ?? null\n);\n...\nresulting_status: \"active\",\nvalid_from: p.valid_from,\n\
    valid_to: p.valid_to ?? null,"
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
  - src/modules/curation/service/dispute.service.ts
- node: rules/knowledge-base/adjusted-periods-single-open
  conforms: true
  how: "src/modules/curation/service/dispute.service.ts: held at the `openCount > 1` guard, lines 210-226,\
    \ with `scopeAllowsMultipleCurrent` at lines 322-339. — if (openCount > 1) {\n  throw new BusinessError(\n\
    \    \"BUSINESS_TEMPORAL_INCOHERENT\",\n    \"More than one row would remain current after the adjustment\"\
    ,\n    { open_count: openCount }\n  );\n}"
  encoded_at:
  - src/modules/curation/service/dispute.service.ts
- node: rules/knowledge-base/alias-unique-per-node
  conforms: true
  how: 'src/modules/curation/repository/curation.repository.ts: held at the ON CONFLICT clause of the
    INSERT in copyAliases (line 120). The uniqueness itself is a store constraint declared elsewhere.
    — `ON CONFLICT (node_id, alias_norm) DO NOTHING`'
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
- node: rules/knowledge-base/assertion-review-check-order
  conforms: true
  how: 'src/modules/curation/service/item.service.ts: held at the order of checks in confirmItemService
    and rejectItemService: the empty-lock branch (RESOURCE_NOT_FOUND), then the status check — if (locked.length
    === 0) { throw new ResourceNotFoundError("Item not found", ...) } const row = locked[0]!; if (row.status
    !== "uncertain") {'
  encoded_at:
  - src/modules/curation/service/item.service.ts
- node: rules/knowledge-base/assertion-review-records-curation-action
  conforms: true
  how: 'src/modules/curation/service/item.service.ts: held at the insertCurationAction calls in confirmItemService
    (lines 91-97) and rejectItemService (lines 151-157) — action: "confirm_item", target_kind: body.item_kind,
    target_id: body.item_id, payload: {}, reason: body.reason ?? null'
  encoded_at:
  - src/modules/curation/service/item.service.ts
- node: rules/knowledge-base/attribute-provenance-once-per-fragment
  conforms: true
  how: 'src/modules/curation/repository/curation.repository.ts: held at the ON CONFLICT clauses on the
    attribute branches of copyProvenance and appendProvenanceFragment (lines 534 and 561). The uniqueness
    itself is a store constraint declared elsewhere. — `ON CONFLICT (attribute_id, fragment_id) DO NOTHING`'
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
- node: rules/knowledge-base/attribute-value-in-allowed-values
  conforms: true
  how: 'src/modules/curation/service/item.service.ts: held at the domain leg of correctItemService, lines
    288-311 — const domain = domainOf(deps.catalog, attrKey.id); if (domain !== null) { try { assertValueInDomain(body.corrected.value,
    domain);'
  encoded_at:
  - src/modules/curation/service/item.service.ts
- node: rules/knowledge-base/attribute-value-parses
  conforms: true
  how: 'src/modules/curation/service/item.service.ts: held at the type leg of correctItemService, lines
    271-286 — parseAttributeValue({ value: body.corrected.value, value_type: attrKey.value_type, });'
  encoded_at:
  - src/modules/curation/service/item.service.ts
- node: rules/knowledge-base/confirmation-activates
  conforms: true
  how: 'src/modules/curation/repository/curation.repository.ts: held at the UPDATEs in confirmItem (lines
    246-269) — `UPDATE node_attribute SET status = ''active'' WHERE id = $1 AND status = ''uncertain''
    RETURNING id`

    src/modules/curation/service/item.service.ts: held at the `confirmItem(client, body.item_kind, body.item_id)`
    call and the returned `resulting_status: "active"` in confirmItemService. The status write is in the
    repository. — const updated = await confirmItem(client, body.item_kind, body.item_id); ... resulting_status:
    "active",'
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
  - src/modules/curation/service/item.service.ts
- node: rules/knowledge-base/confirmation-requires-uncertain
  conforms: true
  how: 'src/modules/curation/repository/curation.repository.ts: held at the `AND status = ''uncertain''`
    guards in confirmItem (lines 255 and 265) — `WHERE id = $1 AND status = ''uncertain''`

    src/modules/curation/service/item.service.ts: held at the status check in confirmItemService, lines
    74-80 — if (row.status !== "uncertain") { throw new ConflictError("BUSINESS_ITEM_NOT_UNCERTAIN",'
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
  - src/modules/curation/service/item.service.ts
- node: rules/knowledge-base/corrected-item-provenance
  conforms: true
  how: 'src/modules/curation/repository/curation.repository.ts: held at copyProvenance (lines 511-539)
    and appendProvenanceFragment (lines 542-566) — `INSERT INTO provenance (link_id, fragment_id, created_at)
    SELECT $2, fragment_id, now() FROM provenance WHERE link_id = $1` and `INSERT INTO provenance (link_id,
    fragment_id, created_at) VALUES ($1, $2, now())`

    src/modules/curation/service/item.service.ts: held at the copyProvenance and appendProvenanceFragment
    calls in correctItemService, lines 339-352 — await copyProvenance(client, body.item_kind, body.item_id,
    newItemId); ... await appendProvenanceFragment(client, body.item_kind, newItemId, body.corrected.valid_from_fragment_id);'
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
  - src/modules/curation/service/item.service.ts
- node: rules/knowledge-base/corrected-item-values
  conforms: true
  how: 'src/modules/curation/repository/curation.repository.ts: held at the INSERT ... SELECT statements
    in insertCorrectedRow (lines 432-508) — `COALESCE($2::uuid, target_node_id), link_type_id, COALESCE($3::date,
    valid_from), COALESCE($4::date, valid_to), ''active''::assertion_status, confidence, ... NULL,`

    src/modules/curation/service/item.service.ts: held at the insertCorrectedRow call in correctItemService,
    lines 329-336. Null counts as not stated here. The coalescing with the superseded item''s values is
    in the repository. — correctedValue: body.corrected.value ?? null, correctedTargetNodeId: body.corrected.target_node_id
    ?? null, correctedValidFrom: body.corrected.valid_from ?? null, correctedValidTo: body.corrected.valid_to
    ?? null,'
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
  - src/modules/curation/service/item.service.ts
- node: rules/knowledge-base/corrected-stated-start-cites-fragment
  conforms: true
  how: "src/modules/curation/dto/item.dto.ts: held at The second branch of the valid_from block in CorrectItemBodySchema.superRefine,\
    \ lines 99-109. — c.valid_from_source === \"stated\" && (c.valid_from_fragment_id === undefined ||\
    \ c.valid_from_fragment_id === null) ... path: [\"corrected\", \"valid_from_fragment_id\"], message:\
    \ \"BUSINESS_DATE_UNJUSTIFIED\"\nsrc/modules/curation/mcp/error-envelope.ts: held at the BUSINESS_DATE_UNJUSTIFIED\
    \ case of messageForZodCustomCode, line 76. The file renders the refusal and does not check the rule.\
    \ — case \"BUSINESS_DATE_UNJUSTIFIED\":\n  return \"valid_from change requires a justification (stated|document|received)\"\
    ;"
  encoded_at:
  - src/modules/curation/dto/item.dto.ts
  - src/modules/curation/mcp/error-envelope.ts
- node: rules/knowledge-base/correction-changes-something
  conforms: true
  how: "src/modules/curation/dto/item.dto.ts: held at The `someProvided` check in CorrectItemBodySchema.superRefine,\
    \ lines 54-65. — if (!someProvided) { ctx.addIssue({ code: \"custom\", path: [\"corrected\"], message:\
    \ \"BUSINESS_CORRECTION_NO_CHANGES\" }); }\nsrc/modules/curation/mcp/error-envelope.ts: held at the\
    \ BUSINESS_CORRECTION_NO_CHANGES case of messageForZodCustomCode, line 74. The file renders the refusal\
    \ and does not check the rule. — case \"BUSINESS_CORRECTION_NO_CHANGES\":\n  return \"corrected{}\
    \ must change at least one of value, target_node_id, valid_from, valid_to\";"
  encoded_at:
  - src/modules/curation/dto/item.dto.ts
  - src/modules/curation/mcp/error-envelope.ts
- node: rules/knowledge-base/correction-check-order
  conforms: true
  how: 'src/modules/curation/service/item.service.ts: held at the order of checks in correctItemService:
    absent item, then deleted or superseded, then fragment, then attribute value type, then allowed values
    — if (locked.length === 0) {...} if (predecessor.status === "deleted" || predecessor.status === "superseded")
    {...} const fragment = await findInformationFragmentById(...) ... parseAttributeValue({ ... }) ...
    assertValueInDomain(body.corrected.value, domain);'
  encoded_at:
  - src/modules/curation/service/item.service.ts
- node: rules/knowledge-base/correction-fits-assertion-kind
  conforms: true
  how: 'src/modules/curation/dto/item.dto.ts: held at The two cross-field branches in CorrectItemBodySchema.superRefine,
    lines 68-85. — body.item_kind === "link" && c.value !== undefined && c.value !== null ... path: ["corrected",
    "value"], message: "VALIDATION_INVALID_FORMAT"; body.item_kind === "attribute" && c.target_node_id
    !== undefined ... path: ["corrected", "target_node_id"]'
  encoded_at:
  - src/modules/curation/dto/item.dto.ts
- node: rules/knowledge-base/correction-fragment-accepted
  conforms: true
  how: 'src/modules/curation/service/item.service.ts: held at the fragment check in correctItemService,
    lines 214-229 — if (!fragment || fragment.status !== "accepted") { throw new BusinessError("BUSINESS_DATE_UNJUSTIFIED",'
  encoded_at:
  - src/modules/curation/service/item.service.ts
- node: rules/knowledge-base/correction-records-curation-action
  conforms: true
  how: 'src/modules/curation/service/item.service.ts: held at the insertCurationAction call in correctItemService,
    lines 355-364 — action: "correct_item", target_kind: body.item_kind, target_id: body.item_id, payload:
    { corrected: body.corrected, new_item_id: newItemId, }, reason: body.reason,'
  encoded_at:
  - src/modules/curation/service/item.service.ts
- node: rules/knowledge-base/correction-supersedes-item
  conforms: true
  how: 'src/modules/curation/repository/curation.repository.ts: held at supersedePredecessor (lines 402-429),
    plus the `supersedes_*` columns set by insertCorrectedRow — `SET status = ''superseded'', superseded_at
    = now() WHERE id = $1 AND status IN (''active'', ''uncertain'', ''disputed'')`; the INSERT sets `supersedes_link_id`
    from `$1::uuid`.

    src/modules/curation/service/item.service.ts: held at the supersedePredecessor and insertCorrectedRow
    calls in correctItemService, lines 315-336 — const predecessorUpdated = await supersedePredecessor(client,
    body.item_kind, body.item_id); ... const newItemId = await insertCorrectedRow(client, body.item_kind,
    { predecessorId: body.item_id,'
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
  - src/modules/curation/service/item.service.ts
- node: rules/knowledge-base/curation-reason-not-blank
  conforms: true
  how: "src/modules/curation/dto/entity-match.dto.ts: held at the `reason` field of ResolveEntityMatchBodySchema,\
    \ line 29. The merge-nodes `reason` uses ReasonRequiredSchema, which is declared in ./enums.dto.js\
    \ and not in this file. — reason: z.string().trim().min(1).optional().nullable(),\nsrc/modules/curation/dto/enums.dto.ts:\
    \ held at `ReasonRequiredSchema` and `ReasonOptionalSchema`, lines 50-56. Both trim the reason and\
    \ then require at least one character. — export const ReasonRequiredSchema = z.string().trim().min(1);\n\
    export const ReasonOptionalSchema = z\n  .string()\n  .trim()\n  .min(1)\n  .optional()\n  .nullable();\n\
    src/modules/curation/mcp/error-envelope.ts: held at the BUSINESS_REASON_REQUIRED entry of ZOD_CUSTOM_CODE_PRIORITY\
    \ and the VALIDATION_INVALID_FORMAT fallthrough of mapZodError, lines 114-118. Which of the two fires\
    \ for a blank reason is decided in the DTOs, not in this file. — return mapped(422, \"warn\", {\n\
    \  code: \"VALIDATION_INVALID_FORMAT\",\n  message: \"Request payload failed validation.\",\n  details:\
    \ { issues: zodIssuesAsDetails(err) },\n});"
  encoded_at:
  - src/modules/curation/dto/entity-match.dto.ts
  - src/modules/curation/dto/enums.dto.ts
  - src/modules/curation/mcp/error-envelope.ts
- node: rules/knowledge-base/curation-reason-required
  conforms: true
  how: "src/modules/curation/dto/dispute.dto.ts: held at the prefer_one branch of the superRefine, lines\
    \ 51-62 — if ( value.reason === undefined || value.reason === null || value.reason.trim().length ===\
    \ 0 ) { ctx.addIssue({ code: \"custom\", path: [\"reason\"], message: \"BUSINESS_REASON_REQUIRED\"\
    , }); }\nsrc/modules/curation/dto/entity-match.dto.ts: held at the merge_into branch of the ResolveEntityMatchBodySchema\
    \ superRefine, lines 32-55, and `reason: ReasonRequiredSchema` in MergeNodesBodySchema, line 67 —\
    \ if (value.decision === \"merge_into\") { ... if (value.reason === undefined || value.reason ===\
    \ null || value.reason.trim().length === 0) { ctx.addIssue({ code: \"custom\", path: [\"reason\"],\
    \ message: \"BUSINESS_REASON_REQUIRED\",\nsrc/modules/curation/dto/item.dto.ts: held at The `reason`\
    \ field of RejectItemBodySchema (line 25) and of CorrectItemBodySchema (line 48), declared without\
    \ `.optional()`. — reason: ReasonRequiredSchema\nsrc/modules/curation/mcp/error-envelope.ts: held\
    \ at the BUSINESS_REASON_REQUIRED case of messageForZodCustomCode, line 64. The file renders the refusal\
    \ and does not check the rule. — case \"BUSINESS_REASON_REQUIRED\":\n  return \"reason is required\
    \ for the requested operation\";"
  encoded_at:
  - src/modules/curation/dto/dispute.dto.ts
  - src/modules/curation/dto/entity-match.dto.ts
  - src/modules/curation/dto/item.dto.ts
  - src/modules/curation/mcp/error-envelope.ts
- node: rules/knowledge-base/curation-refuses-deleted-node
  conforms: true
  how: "src/modules/curation/service/entity-match.service.ts: held at the `node.status === \"deleted\"\
    ` branch of the keep_separate path. The merge paths are refused in performMerge, outside this file.\
    \ — if (node.status === \"deleted\") {\n  throw new NodeDeletedError(\nsrc/modules/curation/service/merge.service.ts:\
    \ held at The two deleted-status guards, lines 82 to 93. — if (survivor.status === \"deleted\") {\
    \ throw new NodeDeletedError( \"KnowledgeNode tombstoned by compliance_delete\", { deleted_id: survivor.id\
    \ } ); }"
  encoded_at:
  - src/modules/curation/service/entity-match.service.ts
  - src/modules/curation/service/merge.service.ts
- node: rules/knowledge-base/curation-request-check-order
  conforms: true
  how: "src/modules/curation/dto/dispute.dto.ts: held at the order of the superRefine checks, lines 40-127.\
    \ The file lists uniqueness, then reason, then winner, then periods, then start before end. Only the\
    \ reason-before-winner ordering can be read from the file, because nothing here shows how the issues\
    \ are ordered or ranked when the result is reported. — message: \"BUSINESS_REASON_REQUIRED\", ...\
    \ message: \"BUSINESS_DISPUTE_WINNER_REQUIRED\",\nsrc/modules/curation/mcp/error-envelope.ts: held\
    \ at the ZOD_CUSTOM_CODE_PRIORITY list, lines 49-58, walked in order by mapZodError. The VALIDATION_INVALID_FORMAT\
    \ return (lines 114-118) is reached only when none of the custom codes is present. — const ZOD_CUSTOM_CODE_PRIORITY:\
    \ readonly string[] = [\n  \"BUSINESS_TARGET_NODE_REQUIRED\",\n  \"BUSINESS_REASON_REQUIRED\",\n \
    \ \"BUSINESS_SELF_MERGE_FORBIDDEN\",\n  \"BUSINESS_DISPUTE_WINNER_REQUIRED\",\n  \"BUSINESS_DISPUTE_PERIODS_REQUIRED\"\
    ,\n  \"BUSINESS_TEMPORAL_INCOHERENT\",\n  \"BUSINESS_CORRECTION_NO_CHANGES\",\n  \"BUSINESS_DATE_UNJUSTIFIED\"\
    ,\n];"
  encoded_at:
  - src/modules/curation/dto/dispute.dto.ts
  - src/modules/curation/mcp/error-envelope.ts
- node: rules/knowledge-base/curation-request-checked-first
  conforms: true
  how: 'src/modules/curation/routes/curation.routes.ts: held at The order in each POST handler: the body
    parse (in `try`, with failures sent through `sendError`) comes before the service call that reads
    nodes, links, attributes or fragments. In the entity-match route, `NodeIdPathSchema.parse(request.params)`
    comes first of all. — body = ResolveDisputeBodySchema.parse(request.body ?? {}); ... const result
    = await resolveDisputeService('
  encoded_at:
  - src/modules/curation/routes/curation.routes.ts
- node: rules/knowledge-base/dispute-resolution-check-order
  conforms: true
  how: "src/modules/curation/service/dispute.service.ts: held at the sequence in `resolveDisputeService`:\
    \ the locked-row count check, then the status loop, then `assertSameScope`, then the decision branches.\
    \ — if (locked.length !== body.item_ids.length) {\n...\nfor (const row of locked) {\n  if (row.status\
    \ !== \"disputed\") {\n...\nassertSameScope(body.item_kind, locked);"
  encoded_at:
  - src/modules/curation/service/dispute.service.ts
- node: rules/knowledge-base/dispute-resolution-distinct-items
  conforms: true
  how: "src/modules/curation/dto/dispute.dto.ts: held at item_ids .min(2) and the uniqueness check in\
    \ the superRefine, lines 34 and 41-49 — item_ids: z.array(UuidSchema).min(2), ... if (uniqueIds.size\
    \ !== value.item_ids.length) {\nsrc/modules/curation/mcp/error-envelope.ts: held at the VALIDATION_INVALID_FORMAT\
    \ fallthrough of mapZodError, lines 114-118. The file renders the refusal and does not check the rule.\
    \ — return mapped(422, \"warn\", {\n  code: \"VALIDATION_INVALID_FORMAT\",\n  message: \"Request payload\
    \ failed validation.\",\n  details: { issues: zodIssuesAsDetails(err) },\n});"
  encoded_at:
  - src/modules/curation/dto/dispute.dto.ts
  - src/modules/curation/mcp/error-envelope.ts
- node: rules/knowledge-base/dispute-resolution-records-curation-action
  conforms: true
  how: "src/modules/curation/service/dispute.service.ts: held at the three `insertCurationAction` calls,\
    \ one per decision. The target is `winnerId` for prefer_one and `body.item_ids[0]!` otherwise. — action:\
    \ \"resolve_dispute\",\ntarget_kind: body.item_kind,\ntarget_id: winnerId,\npayload: {\n  decision:\
    \ \"prefer_one\",\n  item_ids: body.item_ids,\n  winner_id: winnerId,\n},\nreason: body.reason ??\
    \ null,"
  encoded_at:
  - src/modules/curation/service/dispute.service.ts
- node: rules/knowledge-base/dispute-resolution-requires-disputed-items
  conforms: true
  how: "src/modules/curation/service/dispute.service.ts: held at the status loop, lines 68-76. — if (row.status\
    \ !== \"disputed\") {\n  throw new ConflictError(\n    \"BUSINESS_ITEM_NOT_DISPUTED\","
  encoded_at:
  - src/modules/curation/service/dispute.service.ts
- node: rules/knowledge-base/dispute-resolution-single-scope
  conforms: true
  how: 'src/modules/curation/service/dispute.service.ts: held at `assertSameScope`, called at line 79.
    It compares a stricter scope for links than the dispute-scope node defines, reported as a finding.
    — assertSameScope(body.item_kind, locked);'
  encoded_at:
  - src/modules/curation/service/dispute.service.ts
- node: rules/knowledge-base/dispute-scope
  conforms: false
  how: "src/modules/curation/service/dispute.service.ts, the function `assertSameScope`, link branch (lines\
    \ 292-305), called from `resolveDisputeService` at line 79.: if (\n  r.source_node_id !== first.source_node_id\
    \ ||\n  r.target_node_id !== first.target_node_id ||\n  r.link_type_id !== first.link_type_id\n) {\n\
    \  throw new ConflictError(\n    \"BUSINESS_ITEM_NOT_DISPUTED\",\n    \"Items do not share the same\
    \ conflict scope\",\n    { scope_mismatch: true }\n  ); — The node gives two link scopes: one source\
    \ node and one link type that does not allow multiple current links, whatever the target, or one source\
    \ node, one link type and one target node. The code accepts only the second. Disputed links from one\
    \ source under a functional link type that point at different targets are in one scope by the node.\
    \ The code refuses them with BUSINESS_ITEM_NOT_DISPUTED and `scope_mismatch: true`, so the owner cannot\
    \ resolve the dispute that the review queue lists as one scope. The scope definition has a second,\
    \ narrower home in this function, and the catalog's `allows_multiple_current` is never consulted to\
    \ choose the scope."
  observed_at:
  - src/modules/curation/service/dispute.service.ts
- node: rules/knowledge-base/entity-match-queue-entry
  conforms: true
  how: 'src/modules/curation/repository/curation.repository.ts: held at listEntityMatchQueue (lines 637-660)
    — `FROM knowledge_node kn ... LEFT JOIN entity_match_review em ON em.node_id = kn.id ... WHERE kn.status
    = ''needs_review'' ORDER BY kn.created_at ASC, kn.id ASC, em.similarity DESC NULLS LAST`

    src/modules/curation/service/queue.service.ts: held at groupEntityMatchRows, lines 122-152. It makes
    one entry per node_id and appends each candidate row in arrival order. The needs-review filter and
    the similarity ordering are not visible in this file. — let entry = map.get(r.node_id);

    if (!entry) { entry = { kind: "entity_match", node_id: r.node_id, ... candidates: [], ... }; map.set(r.node_id,
    entry); }

    ...

    entry.candidates.push({ candidate_node_id: r.candidate_node_id, canonical_name: r.candidate_canonical_name,
    similarity: Number(r.similarity) });'
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
  - src/modules/curation/service/queue.service.ts
- node: rules/knowledge-base/entity-match-resolution-check-order
  conforms: true
  how: 'src/modules/curation/service/entity-match.service.ts: held at the self-target guard before `withTransaction`,
    then the absent, deleted and not-needs_review checks in order inside the keep_separate branch — body.decision
    === "merge_into" && body.target_node_id !== null && body.target_node_id === nodeId'
  encoded_at:
  - src/modules/curation/service/entity-match.service.ts
- node: rules/knowledge-base/entity-match-resolution-clears-reviews
  conforms: true
  how: 'src/modules/curation/repository/curation.repository.ts: held at deleteEntityMatchReviewByNode
    (lines 167-176) — `DELETE FROM entity_match_review WHERE node_id = $1 RETURNING id`

    src/modules/curation/service/entity-match.service.ts: held at the `deleteEntityMatchReviewByNode(client,
    nodeId)` calls in both the keep_separate and merge_into branches — await deleteEntityMatchReviewByNode(client,
    nodeId);'
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
  - src/modules/curation/service/entity-match.service.ts
- node: rules/knowledge-base/entity-match-resolution-records-curation-action
  conforms: true
  how: 'src/modules/curation/service/entity-match.service.ts: held at the two insertCurationAction calls
    in resolveEntityMatchService — action: "resolve_entity_match", target_kind: "node", target_id: nodeId,
    payload: { decision: "merge_into", target_node_id: targetNodeId }, reason: body.reason ?? null,'
  encoded_at:
  - src/modules/curation/service/entity-match.service.ts
- node: rules/knowledge-base/entity-match-resolution-requires-pending-review
  conforms: true
  how: "src/modules/curation/service/entity-match.service.ts: held at the `node.status !== \"needs_review\"\
    ` check in the keep_separate branch, and `absorbedExpectedStatus: \"needs_review\"` passed to performMerge\
    \ on the merge_into branch — if (node.status !== \"needs_review\") {\n  throw new ConflictError(\n\
    \    \"BUSINESS_REVIEW_NOT_PENDING\",\nsrc/modules/curation/service/merge.service.ts: held at The\
    \ absorbed status guard, where absorbedExpectedStatus is needs_review, lines 105 to 112. — if (args.absorbedExpectedStatus\
    \ === \"needs_review\") { throw new ConflictError( \"BUSINESS_REVIEW_NOT_PENDING\", \"Node is not\
    \ in `needs_review` state\", { node_id: absorbed.id, current_status: absorbed.status } ); }"
  encoded_at:
  - src/modules/curation/service/entity-match.service.ts
  - src/modules/curation/service/merge.service.ts
- node: rules/knowledge-base/keep-disputed-changes-nothing
  conforms: true
  how: 'src/modules/curation/service/dispute.service.ts: held at the keep_disputed branch, lines 81-114.
    It calls no update and returns the rows as they were locked. — rows_mutated: 0,

    ...

    resulting_status: r.status,

    valid_from: r.valid_from,

    valid_to: r.valid_to,'
  encoded_at:
  - src/modules/curation/service/dispute.service.ts
- node: rules/knowledge-base/keep-separate-activates-node
  conforms: true
  how: 'src/modules/curation/repository/curation.repository.ts: held at updateNodeStatusKeepSeparate (lines
    52-65) — `UPDATE knowledge_node SET status = ''active'' WHERE id = $1 AND status = ''needs_review''
    RETURNING id`

    src/modules/curation/service/entity-match.service.ts: held at the `updateNodeStatusKeepSeparate(client,
    nodeId)` call and the `resulting_status: "active"` return of the keep_separate branch — const updated
    = await updateNodeStatusKeepSeparate(client, nodeId);'
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
  - src/modules/curation/service/entity-match.service.ts
- node: rules/knowledge-base/link-provenance-once-per-fragment
  conforms: true
  how: 'src/modules/curation/repository/curation.repository.ts: held at the ON CONFLICT clauses on the
    link branches of copyProvenance and appendProvenanceFragment (lines 523 and 552). The uniqueness itself
    is a store constraint declared elsewhere. — `ON CONFLICT (link_id, fragment_id) DO NOTHING`'
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
- node: rules/knowledge-base/merge-check-order
  conforms: true
  how: 'src/modules/curation/service/merge.service.ts: held at The sequence of guards in performMerge,
    lines 56 to 127. The order is self-merge, absent survivor, absent absorbed, deleted survivor, deleted
    absorbed, survivor not active, absorbed status, then node type. — if (args.survivorId === args.absorbedId)
    { ... } if (!survivor) { ... } if (!absorbed) { ... } if (survivor.status === "deleted") { ... } if
    (absorbed.status === "deleted") { ... } if (survivor.status !== "active") { ... } if (absorbed.status
    !== args.absorbedExpectedStatus) { ... } if (survivor.node_type_id !== absorbed.node_type_id) { ...
    }'
  encoded_at:
  - src/modules/curation/service/merge.service.ts
- node: rules/knowledge-base/merge-compresses-paths
  conforms: true
  how: 'src/modules/curation/repository/curation.repository.ts: held at pathCompressMergedInto (lines
    86-99) — `UPDATE knowledge_node SET merged_into_node_id = $2 WHERE merged_into_node_id = $1 RETURNING
    id`

    src/modules/curation/service/merge.service.ts: held at The call to pathCompressMergedInto with the
    absorbed and survivor ids, lines 147 to 151. The statement that nodes merged into the absorbed node
    come to name the survivor is carried by this call. The update itself is performed in the repository,
    outside this file. — const pathCompressedCount = await pathCompressMergedInto( client, args.absorbedId,
    args.survivorId );'
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
  - src/modules/curation/service/merge.service.ts
- node: rules/knowledge-base/merge-copies-aliases
  conforms: true
  how: 'src/modules/curation/repository/curation.repository.ts: held at copyAliases (lines 110-125) —
    `INSERT INTO node_alias (node_id, alias, kind, created_by_run_id, created_at) SELECT $2, alias, ''alias'',
    created_by_run_id, created_at FROM node_alias WHERE node_id = $1 ON CONFLICT (node_id, alias_norm)
    DO NOTHING`'
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
- node: rules/knowledge-base/merge-counts-what-it-changed
  conforms: true
  how: 'src/modules/curation/service/merge.service.ts: held at The return statement of performMerge, lines
    168 to 173. — return { links_repointed: linksRepointed, attributes_repointed: attributesRepointed,
    aliases_copied: aliasesCopied, path_compressed_nodes: pathCompressedCount, };'
  encoded_at:
  - src/modules/curation/service/merge.service.ts
- node: rules/knowledge-base/merge-into-requires-target
  conforms: true
  how: "src/modules/curation/dto/entity-match.dto.ts: held at the merge_into branch of the ResolveEntityMatchBodySchema\
    \ superRefine, lines 32-43 — if (value.target_node_id === undefined || value.target_node_id === null)\
    \ { ctx.addIssue({ code: \"custom\", path: [\"target_node_id\"], message: \"BUSINESS_TARGET_NODE_REQUIRED\"\
    ,\nsrc/modules/curation/mcp/error-envelope.ts: held at the BUSINESS_TARGET_NODE_REQUIRED case of messageForZodCustomCode,\
    \ line 62. The file renders the refusal and does not check the rule. — case \"BUSINESS_TARGET_NODE_REQUIRED\"\
    :\n  return \"decision=merge_into requires target_node_id\";\nsrc/modules/curation/service/entity-match.service.ts:\
    \ held at the defensive `targetNodeId === null || targetNodeId === undefined` throw at the start of\
    \ the merge_into branch — throw new BusinessError(\n  \"BUSINESS_TARGET_NODE_REQUIRED\",\n  \"decision=merge_into\
    \ requires target_node_id\"\n);"
  encoded_at:
  - src/modules/curation/dto/entity-match.dto.ts
  - src/modules/curation/mcp/error-envelope.ts
  - src/modules/curation/service/entity-match.service.ts
- node: rules/knowledge-base/merge-marks-absorbed-merged
  conforms: true
  how: 'src/modules/curation/repository/curation.repository.ts: held at updateNodeMerged (lines 68-83)
    — `SET status = ''merged'', merged_into_node_id = $2 WHERE id = $1 AND status IN (''active'', ''needs_review'')`

    src/modules/curation/service/merge.service.ts: held at The call to updateNodeMerged with the absorbed
    and survivor ids, lines 131 to 135. The rowcount check that follows it is at lines 136 to 145. — const
    mergedCount = await updateNodeMerged( client, args.absorbedId, args.survivorId );'
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
  - src/modules/curation/service/merge.service.ts
- node: rules/knowledge-base/merge-repoints-assertions
  conforms: true
  how: 'src/modules/curation/repository/curation.repository.ts: held at repointLinks and repointAttributes
    (lines 131-161) — `SET source_node_id = CASE WHEN source_node_id = $1 THEN $2 ELSE source_node_id
    END, ... WHERE source_node_id = $1 OR target_node_id = $1` and `UPDATE node_attribute SET node_id
    = $2 WHERE node_id = $1`, neither filtering on status.'
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
- node: rules/knowledge-base/merge-requires-same-node-type
  conforms: true
  how: 'src/modules/curation/service/merge.service.ts: held at The node type guard, lines 121 to 127.
    — if (survivor.node_type_id !== absorbed.node_type_id) { throw new BusinessError( "BUSINESS_INVALID_TARGET_NODE",
    "survivor and absorbed nodes must share node_type_id", { reason: "node_type mismatch" } ); }'
  encoded_at:
  - src/modules/curation/service/merge.service.ts
- node: rules/knowledge-base/merge-survivor-active
  conforms: true
  how: 'src/modules/curation/service/merge.service.ts: held at The survivor status guard, lines 96 to
    102. — if (survivor.status !== "active") { throw new BusinessError( "BUSINESS_INVALID_TARGET_NODE",
    "Survivor must have status=active", { id: survivor.id, current_status: survivor.status } ); }'
  encoded_at:
  - src/modules/curation/service/merge.service.ts
- node: rules/knowledge-base/metrics-assertion-counts
  conforms: true
  how: 'src/modules/curation/repository/curation.repository.ts: held at the uncertain_count and disputed_count
    queries in aggregateCurationMetrics (lines 875-890) — `(SELECT count(*) FROM knowledge_link_resolved
    WHERE effective_status = ''disputed'') + (SELECT count(*) FROM node_attribute_resolved WHERE effective_status
    = ''disputed'')`'
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
- node: rules/knowledge-base/metrics-disputed-queue-count
  conforms: false
  how: "src/modules/curation/repository/curation.repository.ts, the disputed_queue_count statement and\
    \ its comment, lines 892-912: SELECT DISTINCT 'link' AS k, source_node_id, target_node_id, link_type_id\n\
    \     FROM knowledge_link\n    WHERE status = 'disputed'\n... NOTE: this is an ADVISORY metric and\
    \ is NOT fully consistent with the\n  // queue's dispute grouping (queue.service.groupDisputedLinks),\
    \ which is\n  // cardinality-aware and collapses competing targets of a FUNCTIONAL link\n  // into\
    \ ONE group. For functional multi-target disputes this can over-count — The node says the metric is\
    \ the number of entries the disputed queue holds. The code counts its own grouping, keyed by (source,\
    \ target, link_type) for every link type. The queue's scope leaves the target out for a link type\
    \ that does not allow multiple current links, per the curation contract. The dispute-scope rule is\
    \ implemented a second time, differently, and the reported disputed_queue_count can exceed the number\
    \ of queue entries, as the comment itself admits. The owner reads a number the queue does not back.\n\
    no file of the set holds this fact beside what was found against it"
  observed_at:
  - src/modules/curation/repository/curation.repository.ts
- node: rules/knowledge-base/metrics-review-counts
  conforms: true
  how: 'src/modules/curation/repository/curation.repository.ts: held at the needsReviewRes query and `const
    entityMatchQueueCount = needsReviewCount` in aggregateCurationMetrics (lines 865-871) — `SELECT count(*)::text
    AS total FROM knowledge_node WHERE status = ''needs_review''`'
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
- node: rules/knowledge-base/node-merge-absorbs-active-node
  conforms: true
  how: 'src/modules/curation/service/entity-match.service.ts: held at the `absorbedExpectedStatus: "active"`
    argument mergeNodesService passes to performMerge. The check itself runs in performMerge, outside
    this file. — absorbedExpectedStatus: "active",

    src/modules/curation/service/merge.service.ts: held at The absorbed status guard, where absorbedExpectedStatus
    is active, lines 105 to 117. — throw new BusinessError( "BUSINESS_INVALID_TARGET_NODE", "Both nodes
    must have status=active", { absorbed_id: absorbed.id, absorbed_status: absorbed.status } );'
  encoded_at:
  - src/modules/curation/service/entity-match.service.ts
  - src/modules/curation/service/merge.service.ts
- node: rules/knowledge-base/node-merge-records-curation-action
  conforms: true
  how: 'src/modules/curation/service/entity-match.service.ts: held at the insertCurationAction call in
    mergeNodesService — action: "merge_nodes", target_kind: "node", target_id: absorbedId, payload: {
    survivor_id: survivorId }, reason,'
  encoded_at:
  - src/modules/curation/service/entity-match.service.ts
- node: rules/knowledge-base/node-never-merged-into-itself
  conforms: true
  how: "src/modules/curation/dto/entity-match.dto.ts: held at the superRefine of MergeNodesBodySchema,\
    \ lines 69-77. Nothing in this file applies it to entity-match resolution. — if (value.survivor_id\
    \ === value.absorbed_id) { ctx.addIssue({ code: \"custom\", path: [\"absorbed_id\"], message: \"BUSINESS_SELF_MERGE_FORBIDDEN\"\
    ,\nsrc/modules/curation/mcp/error-envelope.ts: held at the BUSINESS_SELF_MERGE_FORBIDDEN status and\
    \ message in mapZodError (line 106) and messageForZodCustomCode (line 66). The file renders the refusal\
    \ and does not check the rule. — const status = code === \"BUSINESS_SELF_MERGE_FORBIDDEN\" ? 409 :\
    \ 422;\nsrc/modules/curation/service/entity-match.service.ts: held at the target-equals-node guard\
    \ of resolveEntityMatchService. mergeNodesService has no such check here and relies on performMerge\
    \ and the DTO, outside this file. — throw new ConflictError(\n  \"BUSINESS_SELF_MERGE_FORBIDDEN\"\
    ,\n  \"merge_into target equals the node being resolved\",\n  { node_id: nodeId }\n);\nsrc/modules/curation/service/merge.service.ts:\
    \ held at The self-merge guard, lines 56 to 61. — if (args.survivorId === args.absorbedId) { throw\
    \ new ConflictError( \"BUSINESS_SELF_MERGE_FORBIDDEN\", \"survivor_id equals absorbed_id\" ); }"
  encoded_at:
  - src/modules/curation/dto/entity-match.dto.ts
  - src/modules/curation/mcp/error-envelope.ts
  - src/modules/curation/service/entity-match.service.ts
  - src/modules/curation/service/merge.service.ts
- node: rules/knowledge-base/page-defaults
  conforms: true
  how: 'src/modules/curation/dto/queue.dto.ts: held at The `.default(20)` on `limit` and the `.default(0)`
    on `offset` in ListReviewQueueQuerySchema, lines 10-11. — limit: z.coerce.number().int().min(1).max(100).default(20),

    offset: z.coerce.number().int().min(0).default(0),'
  encoded_at:
  - src/modules/curation/dto/queue.dto.ts
- node: rules/knowledge-base/page-limit-bounds
  conforms: true
  how: 'src/modules/curation/dto/queue.dto.ts: held at The `.min(1).max(100)` on `limit` in ListReviewQueueQuerySchema,
    line 10. — limit: z.coerce.number().int().min(1).max(100).default(20),'
  encoded_at:
  - src/modules/curation/dto/queue.dto.ts
- node: rules/knowledge-base/page-offset-non-negative
  conforms: true
  how: 'src/modules/curation/dto/queue.dto.ts: held at The `.min(0)` on `offset` in ListReviewQueueQuerySchema,
    line 11. — offset: z.coerce.number().int().min(0).default(0),'
  encoded_at:
  - src/modules/curation/dto/queue.dto.ts
- node: rules/knowledge-base/prefer-one-outcome
  conforms: true
  how: 'src/modules/curation/repository/curation.repository.ts: held at resolveDisputeWinner and resolveDisputeLosers
    (lines 302-354) — `SET status = ''active'' WHERE id = $1 AND status = ''disputed''` and `SET status
    = ''deleted'', superseded_at = now() WHERE id = ANY($1::uuid[]) AND status = ''disputed''`

    src/modules/curation/service/dispute.service.ts: held at the prefer_one branch, lines 116-197. Validities
    pass through unchanged. The status updates and the supersession stamp sit in the repository functions
    it calls, outside this file. — const winnerUpdated = await resolveDisputeWinner(client, body.item_kind,
    winnerId);

    const losersUpdated = await resolveDisputeLosers(client, body.item_kind, loserIds);

    ...

    resulting_status: "deleted",

    valid_from: r.valid_from,

    valid_to: r.valid_to,'
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
  - src/modules/curation/service/dispute.service.ts
- node: rules/knowledge-base/prefer-one-requires-winner
  conforms: true
  how: "src/modules/curation/dto/dispute.dto.ts: held at the prefer_one branch of the superRefine, lines\
    \ 63-73 — !value.item_ids.includes(value.winner_id) ) { ctx.addIssue({ code: \"custom\", path: [\"\
    winner_id\"], message: \"BUSINESS_DISPUTE_WINNER_REQUIRED\", }); }\nsrc/modules/curation/mcp/error-envelope.ts:\
    \ held at the BUSINESS_DISPUTE_WINNER_REQUIRED case of messageForZodCustomCode, line 68. The file\
    \ renders the refusal and does not check the rule. — case \"BUSINESS_DISPUTE_WINNER_REQUIRED\":\n\
    \  return \"decision=prefer_one requires winner_id (member of item_ids)\";\nsrc/modules/curation/service/dispute.service.ts:\
    \ held at the `if (!winnerId)` guard, lines 117-123. It checks presence only, not membership among\
    \ `item_ids`, and its message differs from the contract's. — const winnerId = body.winner_id;\nif\
    \ (!winnerId) {\n  throw new BusinessError(\n    \"BUSINESS_DISPUTE_WINNER_REQUIRED\",\n    \"decision=prefer_one\
    \ requires winner_id\"\n  );"
  encoded_at:
  - src/modules/curation/dto/dispute.dto.ts
  - src/modules/curation/mcp/error-envelope.ts
  - src/modules/curation/service/dispute.service.ts
- node: rules/knowledge-base/refused-curation-records-nothing
  conforms: true
  how: 'src/modules/curation/service/dispute.service.ts: held at the whole body runs inside `withTransaction`.
    Every refusal is a thrown error raised before or rolling back the `insertCurationAction` call. — return
    withTransaction(deps.pool, async (client) => {

    src/modules/curation/service/entity-match.service.ts: held at the self-target guard that throws before
    `withTransaction` opens, and every throw inside the transaction that comes before `insertCurationAction`,
    so a refusal rolls back and records no action — const action = await insertCurationAction(client,
    {

    src/modules/curation/service/item.service.ts: held at each service''s throws, made before or inside
    the `withTransaction` callback. insertCurationAction is reached only after the checks and the write
    pass. — if (updated !== 1) { throw new ConflictError("BUSINESS_ITEM_NOT_UNCERTAIN", "Item status changed
    under lock", ...) } const action = await insertCurationAction(client, {'
  encoded_at:
  - src/modules/curation/service/dispute.service.ts
  - src/modules/curation/service/entity-match.service.ts
  - src/modules/curation/service/item.service.ts
- node: rules/knowledge-base/reject-rate-by-code
  conforms: true
  how: 'src/modules/curation/repository/curation.repository.ts: held at the rejectsRes query and loop
    in aggregateCurationMetrics (lines 845-859) — `WHERE action = ''reject_item'' AND payload ? ''error_code''
    GROUP BY 1` and `rejectRateByCode[row.code] = Number(row.total) / totalActions;`'
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
- node: rules/knowledge-base/rejection-and-correction-require-live-item
  conforms: true
  how: 'src/modules/curation/repository/curation.repository.ts: held at the `status IN (''active'', ''uncertain'',
    ''disputed'')` guards in rejectItem and supersedePredecessor (lines 283, 294, 413 and 424) — `WHERE
    id = $1 AND status IN (''active'', ''uncertain'', ''disputed'') RETURNING id`

    src/modules/curation/service/item.service.ts: held at the status checks in rejectItemService (line
    134) and correctItemService (lines 201-210) — if (row.status === "deleted" || row.status === "superseded")
    { throw new ConflictError("BUSINESS_ITEM_NOT_DELETABLE",'
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
  - src/modules/curation/service/item.service.ts
- node: rules/knowledge-base/rejection-deletes
  conforms: true
  how: 'src/modules/curation/repository/curation.repository.ts: held at rejectItem (lines 272-299) — `SET
    status = ''deleted'', superseded_at = now() WHERE id = $1 AND status IN (''active'', ''uncertain'',
    ''disputed'')`

    src/modules/curation/service/item.service.ts: held at the `rejectItem(client, body.item_kind, body.item_id)`
    call and the returned `resulting_status: "deleted"` in rejectItemService. The status and supersession-time
    write is in the repository. — const updated = await rejectItem(client, body.item_kind, body.item_id);
    ... resulting_status: "deleted",'
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
  - src/modules/curation/service/item.service.ts
- node: rules/knowledge-base/review-queue-kinds
  conforms: true
  how: 'src/modules/curation/service/queue.service.ts: held at The kind branches in listReviewQueueService,
    lines 92 and 99. — if (kind === undefined || kind === "entity_match") {

    ...

    if (kind === undefined || kind === "disputed") {'
  encoded_at:
  - src/modules/curation/service/queue.service.ts
- node: rules/knowledge-base/review-queue-order
  conforms: true
  how: 'src/modules/curation/repository/curation.repository.ts: held at the ORDER BY clauses of listEntityMatchQueue
    (line 655) and of the two disputed listings (lines 711 and 759). The ordering of kinds against each
    other is not in this file. — `ORDER BY kn.created_at ASC, kn.id ASC, em.similarity DESC NULLS LAST`
    and `ORDER BY kl.recorded_at ASC, kl.id ASC`

    src/modules/curation/service/queue.service.ts: held at Only the sequence of the pushes in listReviewQueueService:
    entity-match entries, then link disputes, then attribute disputes. Ordering within each kind follows
    the row order the repository returns, because the Maps preserve insertion order. No sorting is done
    here. — items.push(...grouped);

    ...

    items.push(...groupDisputedLinks(linkRows));

    items.push(...groupDisputedAttributes(attrRows));'
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
  - src/modules/curation/service/queue.service.ts
- node: rules/knowledge-base/review-queue-page-windows-entries
  conforms: false
  how: 'src/modules/curation/service/queue.service.ts, listReviewQueueService, lines 88-106: the limit
    and offset are handed separately to each of the three listings inside withReadOnly.: const rows =
    await listEntityMatchQueue(client, limit, offset);

    ...

    const linkRows = await listDisputedLinks(client, limit, offset);

    const attrRows = await listDisputedAttributes(client, limit, offset);

    items.push(...groupDisputedLinks(linkRows));

    items.push(...groupDisputedAttributes(attrRows)); — The node says a page skips and returns whole entries
    in listing order, where the listing is the combined one. The code instead windows each source on its
    own. With no kind filter, a page can return up to three times the requested limit. An offset past
    the last entity-match entry skips nothing of the disputes. An offset that falls inside the entity-match
    entries does not carry over into the link disputes. The page a client sees is therefore not a window
    of the ordered listing, and `total` no longer matches what paging through the listing returns. The
    disputed rows are also windowed before `groupDisputedLinks` and `groupDisputedAttributes` fold them
    into entries. A dispute whose sides straddle the page edge can be cut into a partial entry. The repository
    code that would confirm this is outside the file set, so that second point is read from the row types
    only.

    no file of the set holds this fact beside what was found against it'
  observed_at:
  - src/modules/curation/service/queue.service.ts
- node: rules/knowledge-base/review-queue-total-before-pagination
  conforms: true
  how: 'src/modules/curation/repository/curation.repository.ts: held at countEntityMatchQueue (lines 662-669),
    which counts entries before any limit. countDisputedLinks and countDisputedAttributes count items,
    not scope entries. — `SELECT count(*)::text AS total FROM knowledge_node WHERE status = ''needs_review''`
    and `SELECT count(*)::text AS total FROM knowledge_link WHERE status = ''disputed''`

    src/modules/curation/service/queue.service.ts: held at The count calls that sum into `total` in listReviewQueueService,
    lines 96, 104 and 105. They are taken independently of limit and offset. — total += await countEntityMatchQueue(client);

    ...

    total += await countDisputedLinks(client);

    total += await countDisputedAttributes(client);'
  encoded_at:
  - src/modules/curation/repository/curation.repository.ts
  - src/modules/curation/service/queue.service.ts
- node: rules/knowledge-base/stated-start-requires-basis
  conforms: true
  how: "src/modules/curation/dto/item.dto.ts: held at The first branch of the valid_from block in CorrectItemBodySchema.superRefine,\
    \ lines 88-98. — c.valid_from_source === undefined || c.valid_from_source === null ... path: [\"corrected\"\
    , \"valid_from_source\"], message: \"BUSINESS_DATE_UNJUSTIFIED\"\nsrc/modules/curation/mcp/error-envelope.ts:\
    \ held at the BUSINESS_DATE_UNJUSTIFIED case of messageForZodCustomCode, line 76. The file renders\
    \ the refusal and does not check the rule. — case \"BUSINESS_DATE_UNJUSTIFIED\":\n  return \"valid_from\
    \ change requires a justification (stated|document|received)\";"
  encoded_at:
  - src/modules/curation/dto/item.dto.ts
  - src/modules/curation/mcp/error-envelope.ts
- node: rules/knowledge-base/unused-resolution-fields-ignored
  conforms: true
  how: 'src/modules/curation/dto/dispute.dto.ts: held at the superRefine, where winner_id and periods
    are checked only under their own decision and are otherwise left unread. The schema declares both
    fields optional and nullable. — if (value.decision === "prefer_one") { ... } if (value.decision ===
    "adjust_periods") { ... }

    src/modules/curation/service/entity-match.service.ts: held at the keep_separate branch, which never
    reads `body.target_node_id` and returns `target_node_id: null` — resulting_status: "active", target_node_id:
    null, affected: null,'
  encoded_at:
  - src/modules/curation/dto/dispute.dto.ts
  - src/modules/curation/service/entity-match.service.ts
- node: rules/knowledge-base/validity-start-before-end
  conforms: true
  how: "src/modules/curation/dto/dispute.dto.ts: held at the period loop of the adjust_periods branch,\
    \ lines 113-125 — p.valid_from >= p.valid_to ) { ctx.addIssue({ code: \"custom\", path: [\"periods\"\
    ], message: \"BUSINESS_TEMPORAL_INCOHERENT\", }); }\nsrc/modules/curation/dto/item.dto.ts: held at\
    \ The final check of CorrectItemBodySchema.superRefine, lines 113-125. — c.valid_from >= c.valid_to\
    \ ) { ctx.addIssue({ code: \"custom\", path: [\"corrected\"], message: \"BUSINESS_TEMPORAL_INCOHERENT\"\
    \ });\nsrc/modules/curation/mcp/error-envelope.ts: held at the BUSINESS_TEMPORAL_INCOHERENT entry\
    \ of ZOD_CUSTOM_CODE_PRIORITY and its case in messageForZodCustomCode, lines 55 and 72-73. The file\
    \ renders the refusal and does not check the rule. — case \"BUSINESS_TEMPORAL_INCOHERENT\":\n  return\
    \ \"Adjusted periods violate `valid_from < valid_to` or overlap on a functional scope\";"
  encoded_at:
  - src/modules/curation/dto/dispute.dto.ts
  - src/modules/curation/dto/item.dto.ts
  - src/modules/curation/mcp/error-envelope.ts
unstated:
- file: src/modules/curation/dto/item.dto.ts
  where: CorrectedValuesSchema, the `value` field, line 31
  evidence: 'value: z.string().min(1).optional().nullable(),'
  cost: The schema makes a corrected value that is an empty string a format refusal. No node says that.
    The corrected-values node declares `value` as a bare string with no length constraint, and the nearby
    rules (curation-reason-not-blank, alias-not-blank, search-query-not-blank) each name their own non-blank
    constraint. The refusal therefore lives only in this schema. The next reader will look for it in the
    specification and not find it, and it will read as a business decision.
restates:
- file: src/modules/curation/dto/dispute.dto.ts
  where: docstring of ResolveDisputeBodySchema, line 23 (prefer_one, reason required)
  evidence: '- `decision = prefer_one`  -> winner_id required, member of item_ids, reason required'
  cost: The docstring restates that a prefer-one resolution must state a reason. The `BUSINESS_REASON_REQUIRED`
    issue in the `prefer_one` branch of the same superRefine holds that rule in code. The prose is a second
    home for it outside behavior.
  node: rules/knowledge-base/curation-reason-required
- file: src/modules/curation/dto/dispute.dto.ts
  where: docstring of ResolveDisputeBodySchema, line 23 (prefer_one, winner_id required, member of item_ids)
  evidence: '- `decision = prefer_one`  -> winner_id required, member of item_ids, reason required'
  cost: The docstring is a second statement of the winner rule. The `ctx.addIssue` call with BUSINESS_DISPUTE_WINNER_REQUIRED
    in this same file holds that rule in code. If the node moves, this prose stays behind and reads as
    the authority.
  node: rules/knowledge-base/prefer-one-requires-winner
- file: src/modules/curation/dto/dispute.dto.ts
  where: docstring of ResolveDisputeBodySchema, lines 24-25 (adjust_periods, one entry per item_id)
  evidence: "- `decision = adjust_periods` -> periods[] required with one entry per item_id;\n       \
    \                           semi-open invariant (valid_from < valid_to)"
  cost: The docstring restates the one-period-per-item rule while the `periods.length !== value.item_ids.length`
    check and the BUSINESS_DISPUTE_PERIODS_REQUIRED issues in this file hold it in code. Two homes for
    one rule means a reader may take the comment as the decided version.
  node: rules/knowledge-base/adjust-periods-one-per-item
- file: src/modules/curation/dto/dispute.dto.ts
  where: inline comment before the start/end comparison, line 113, and docstring line 25
  evidence: '// Semi-open invariant: valid_from < valid_to when both supplied.'
  cost: The comment states the start-strictly-before-end rule, which the `p.valid_from >= p.valid_to`
    branch with BUSINESS_TEMPORAL_INCOHERENT holds in code in this same file. The prose is a second statement
    of the rule.
  node: rules/knowledge-base/validity-start-before-end
- file: src/modules/curation/dto/entity-match.dto.ts
  where: the docstring above ResolveEntityMatchBodySchema (line 19) and the docstring above MergeNodesBodySchema
    (line 62)
  evidence: '"BR-23 (self-merge forbidden at request shape)." and "BR-23 (self-merge forbidden). */"'
  cost: 'The never-merged-into-itself rule is cited in prose beside code that enforces it only for `merge-nodes`:
    `if (value.survivor_id === value.absorbed_id)` adds BUSINESS_SELF_MERGE_FORBIDDEN. The ResolveEntityMatchBodySchema
    docstring claims the rule is applied at the request shape, but that schema has no check that compares
    `target_node_id` with the node identity. Anyone relying on the comment would believe entity-match
    resolution is guarded here. The comment also cites a back-spec rule number rather than the node.'
  node: rules/knowledge-base/node-never-merged-into-itself
- file: src/modules/curation/dto/entity-match.dto.ts
  where: the docstring above ResolveEntityMatchBodySchema (lines 17-23) and the docstring above MergeNodesBodySchema
    (line 62)
  evidence: '" * ResolveEntityMatchRequest — BR-11 (reason mandatory on merge_into)," and "/** MergeNodesRequest
    — BR-11 (reason required), BR-23 (self-merge forbidden). */"'
  cost: 'The rule that a merge-into decision or a node merge must state a reason is held twice in this
    file. It is in code (the `value.decision === "merge_into"` branch adding BUSINESS_REASON_REQUIRED,
    and `reason: ReasonRequiredSchema`) and again in prose citing back-spec rule numbers. A reader who
    follows the BR-11 citation goes to a document the node does not govern. When the node moves, the prose
    stays behind and claims a rule the code no longer applies.'
  node: rules/knowledge-base/curation-reason-required
- file: src/modules/curation/dto/item.dto.ts
  where: the comment in CorrectItemBodySchema.superRefine, line 112
  evidence: // Semi-open invariant on the new pair when both supplied.
  cost: The comment restates the node's rule. The `c.valid_from >= c.valid_to` check that follows already
    holds it. The prose is a second home that no running system reads.
  node: rules/knowledge-base/validity-start-before-end
- file: src/modules/curation/dto/item.dto.ts
  where: the comment in CorrectItemBodySchema.superRefine, line 53
  evidence: '// BR-18: at least one of value/target_node_id/valid_from/valid_to.'
  cost: The comment restates the node's rule and cites a back-spec rule id. The code below it (`someProvided`,
    then `ctx.addIssue` at path `["corrected"]`) already holds the fact. The prose is a second home that
    no running system reads.
  node: rules/knowledge-base/correction-changes-something
- file: src/modules/curation/dto/item.dto.ts
  where: the comment in CorrectItemBodySchema.superRefine, line 67
  evidence: '// Cross-field: value only on attribute, target_node_id only on link.'
  cost: The comment restates the node's rule. The two `ctx.addIssue` branches that follow (`body.item_kind
    === "link"` with a `value`, and `body.item_kind === "attribute"` with a `target_node_id`) already
    hold it. The prose is a second home that no running system reads.
  node: rules/knowledge-base/correction-fits-assertion-kind
- file: src/modules/curation/dto/item.dto.ts
  where: the comment in CorrectItemBodySchema.superRefine, line 87
  evidence: // valid_from change requires valid_from_source.
  cost: The comment restates the node's rule. The branch below it, which refuses a `valid_from` without
    a `valid_from_source`, already holds it. The prose is a second home that no running system reads.
  node: rules/knowledge-base/stated-start-requires-basis
- file: src/modules/curation/dto/item.dto.ts
  where: the doc comment above RejectItemBodySchema, line 21
  evidence: /** reject_item — reason mandatory (destructive, BR-11). */
  cost: 'The comment states, in prose, that a rejection must carry a reason. That is a fact the node holds,
    and this file''s code already holds it in `reason: ReasonRequiredSchema`, which is declared without
    `.optional()`. The comment also cites a back-spec rule id, "BR-11", as its authority. A reader can
    take that as a second home for the rule, and it will go stale without anything flagging it.'
  node: rules/knowledge-base/curation-reason-required
- file: src/modules/curation/mcp/curation-toolset.ts
  where: the file's header comment, lines 1-6
  evidence: '// service-layer function the REST handler invokes; success is wrapped in the

    // canonical envelope `{ ok: true, result }`, failure flows through the shared

    // `mapErrorToEnvelope` from TC-01 so REST and MCP surface byte-identical

    // `code` / `message` / `details` for the same thrown sentinel (BR-30, BR-32).'
  cost: 'The comment states, as its own claim, that the two transports answer alike. The node already
    holds that fact, and the code holds it too: each handler calls the same service function the REST
    route uses, and `makeHandler` returns `mapErrorToEnvelope(err)` from `./error-envelope.js`. A reader
    who finds the claim here may take the comment as where the rule is decided. It then drifts from the
    node, because the comment has no bind and is never re-checked when the node moves.'
  node: constraints/curation-transports-answer-alike
- file: src/modules/curation/mcp/curation-transport.ts
  where: the header comment, lines 6-8, and the `toolNames` JSDoc on CurationMcpTransportDeps, line 31
  evidence: '"Exposes 8 tools: the 7 owned by this domain (CURATION_TOOL_NAMES) plus `compliance_delete`
    (owned by compliance-audit, registered under the same `curation` toolset key on the shared registry)."
    and "The closed set of tool names this endpoint exposes (7 curation + compliance_delete)."'
  cost: The tool-surface composition (compliance_delete exposed, no audit reads) is written as prose in
    this file. The code that decides it is the `toolNames` list in backend/src/app.ts. A reader looking
    for that composition finds a comment that can drift from the list, and the comment is bound to no
    node.
  node: constraints/llm-toolset-omits-audit-reads
- file: src/modules/curation/mcp/error-envelope.ts
  where: the header comment, lines 3-8, and the docstring of mapErrorToEnvelope, lines 204-208
  evidence: '"BR-30 (curation.back.md): REST and MCP transports surface IDENTICAL error codes / messages
    / details for every thrown service error."'
  cost: 'The same-answer-on-both-transports fact is written here as prose citing a back-spec rule (BR-30).
    The node holding it is the constraint, and its contract lists refusals whose details differ by transport,
    for example a bare list of `{ path, message }` over REST and `details: { issues }` over MCP. A reader
    who trusts this header, and not the contract, will believe the details are identical. The running
    code already holds the fact, because both renderings call one classifier.'
  node: constraints/curation-transports-answer-alike
- file: src/modules/curation/repository/curation.repository.ts
  where: the ACCEPT_ACTIONS docstring (line 786) and the accept_rate comments (lines 820-824) in aggregateCurationMetrics
  evidence: /** Accept actions are the five non-reject curator verbs (BR-33 spec table). */ ... Zero-division
    → 0 at BFF layer
  cost: The accept-rate definition (which five actions count, and 0 when none is recorded) is in prose
    and in the ACCEPT_ACTIONS array plus the totalActions > 0 guard. The prose is a second home for a
    fact the node already holds.
  node: rules/knowledge-base/accept-rate
- file: src/modules/curation/repository/curation.repository.ts
  where: the comment above the pathCompressMergedInto UPDATE, line 85
  evidence: '/** BR-07: path compression — repoint anything that was pointing at absorbed. */'
  cost: The comment states a second time what the statement below it already does (every node merged into
    the absorbed node names the survivor instead). Two homes for one rule means a change to the node leaves
    the prose to drift, and the prose is a place no check reaches.
  node: rules/knowledge-base/merge-compresses-paths
- file: src/modules/curation/repository/curation.repository.ts
  where: the docstring of adjustItemPeriod, line 356
  evidence: '/** UC-06 (adjust_periods): set new (valid_from, valid_to) and status=''active''. */'
  cost: The prose repeats the adjust-periods outcome that the UPDATE already carries (SET valid_from,
    valid_to, status = 'active'). It is a second place to look for a fact the node holds.
  node: rules/knowledge-base/adjust-periods-outcome
- file: src/modules/curation/repository/curation.repository.ts
  where: the docstring of confirmItem, line 245
  evidence: '/** UC-08: confirm_item — flip `uncertain` -> `active`. BR-21. */'
  cost: The prose restates that a confirmation makes its item active and requires it to be uncertain.
    The UPDATE ... SET status = 'active' WHERE id = $1 AND status = 'uncertain' already holds both, so
    the docstring is a second home for the rule.
  node: rules/knowledge-base/confirmation-activates
- file: src/modules/curation/repository/curation.repository.ts
  where: the docstring of copyAliases, lines 105-109
  evidence: "Copy aliases from absorbed -> survivor. The absorbed node's canonical alias\n * is downgraded\
    \ to `kind = 'alias'` on the survivor"
  cost: The alias-copy rule (kind alias, skip forms the survivor already holds) is written in prose as
    well as in the INSERT ... SELECT ... ON CONFLICT (node_id, alias_norm) DO NOTHING. A reader can take
    the docstring for the decision and miss that the node holds it.
  node: rules/knowledge-base/merge-copies-aliases
- file: src/modules/curation/repository/curation.repository.ts
  where: the docstring of insertCorrectedRow, line 431
  evidence: /** UC-10 new row creation — SELECT-then-INSERT with COALESCE overrides. */
  cost: The prose describes the rule that a correction's new item carries the stated values and otherwise
    the predecessor's. The COALESCE($n, column) expressions and the predecessor's confidence already hold
    this, so the docstring is a second home for it.
  node: rules/knowledge-base/corrected-item-values
- file: src/modules/curation/repository/curation.repository.ts
  where: the docstring of rejectItem, line 271
  evidence: '/** UC-09: reject_item — pair status=''deleted'' AND superseded_at=now() (BR-20). */'
  cost: The prose restates that a rejection marks the item deleted and stamps its supersession time. The
    UPDATE in rejectItem does exactly that, so the docstring duplicates the rule outside behavior.
  node: rules/knowledge-base/rejection-deletes
- file: src/modules/curation/repository/curation.repository.ts
  where: the docstring of supersedePredecessor, line 401
  evidence: /** UC-10 predecessor UPDATE — `valid_to` is NOT in the SET list (BR-18). */
  cost: The prose restates that a correction supersedes its item and leaves the validity end alone. The
    UPDATE (SET status = 'superseded', superseded_at = now(), with no valid_to) holds that, so the docstring
    is a second copy.
  node: rules/knowledge-base/correction-supersedes-item
- file: src/modules/curation/repository/curation.repository.ts
  where: the docstrings of copyProvenance and appendProvenanceFragment, lines 510 and 541
  evidence: '/** UC-10 BR-19 provenance copy from predecessor to successor. */ ... /** UC-10 BR-19 (extension):
    append the errata fragment if supplied. */'
  cost: The prose says the new item holds the predecessor's provenance plus the cited fragment. The two
    INSERT ... SELECT / INSERT ... VALUES statements already do that, so the rule is stated twice and
    only one copy is behavior.
  node: rules/knowledge-base/corrected-item-provenance
- file: src/modules/curation/repository/curation.repository.ts
  where: the docstrings of resolveDisputeWinner and resolveDisputeLosers, lines 301 and 327
  evidence: '/** UC-05 (prefer_one, winner): disputed -> active. */ ... /** UC-05 (prefer_one, losers):
    pair status=''deleted'' AND superseded_at=now(). */'
  cost: The prefer-one outcome (winner active, every other item deleted with its supersession time stamped)
    is stated in prose and again in the two UPDATE statements. Nothing reads the prose, so the two can
    diverge unnoticed.
  node: rules/knowledge-base/prefer-one-outcome
- file: src/modules/curation/repository/curation.repository.ts
  where: the needs_review_count comment block, lines 861-864
  evidence: "BR-33: surfaced as two separate fields even though they are logically\n  // equal under BR-10"
  cost: The prose restates that needs-review count and entity-match queue count are both the number of
    nodes in status needs-review. The query and `const entityMatchQueueCount = needsReviewCount` hold
    it, so the comment is a second home.
  node: rules/knowledge-base/metrics-review-counts
- file: src/modules/curation/repository/curation.repository.ts
  where: the reject_rate_by_code comment block, lines 841-844
  evidence: "Today `curation_action.payload` of `reject_item` is `'{}'` (BR-25), so\n  // this map is\
    \ empty in practice. We still surface the field as `{}` rather\n  // than omit it"
  cost: The prose restates that reject_rate_by_code is a per-code share of reject-item actions, empty
    when there is none. The query and the `{}` initialiser already hold that. The comment also asserts
    what the payload holds today, which nothing checks.
  node: rules/knowledge-base/reject-rate-by-code
- file: src/modules/curation/repository/curation.repository.ts
  where: the section header above deleteEntityMatchReviewByNode, line 164
  evidence: // entity_match_review (delete on resolution — BR-10)
  cost: The header says an accepted resolution removes the node's reviews, and the DELETE below it already
    does that. The prose is a second statement of the rule with no check behind it.
  node: rules/knowledge-base/entity-match-resolution-clears-reviews
- file: src/modules/curation/repository/curation.repository.ts
  where: the uncertain_count comment, lines 873-874
  evidence: Sum of resolved-view rows whose effective_status='uncertain' (§5.4/§6.6).
  cost: The prose restates that uncertain count is the number of links and attributes whose effective
    status is uncertain. The query over knowledge_link_resolved and node_attribute_resolved holds it,
    so the comment is a second home.
  node: rules/knowledge-base/metrics-assertion-counts
- file: src/modules/curation/routes/curation.routes.ts
  where: the comment block above the GET /metrics handler, lines 126-136, and the comment inside the catch
    block, lines 152-153
  evidence: '// Wraps the shared mapper with a graceful-degradation override: ANY residual // 500 outcome
    is re-mapped to 503 SYSTEM_SERVICE_UNAVAILABLE so the front // spec MetricsStrip (R1) can fall back
    to per-kind totals from /queue.'
  cost: 'The contract holds this refusal, and the `statusCode === 500 ? 503 : statusCode` branch below
    the comment implements it. The comment is a second home for the rule. When the contract''s metrics
    refusal moves, a reader can follow the comment''s wording instead of the node, and nothing checks
    the comment.'
  node: contracts/knowledge-base/curation
- file: src/modules/curation/routes/curation.routes.ts
  where: the comment inside the GET /metrics try block, lines 145-149
  evidence: // Bare success body — consistent with every other curation REST // endpoint (queue/confirm/reject/...).
    The SPA's httpCuration returns // the raw 2xx JSON, so an `{ ok, result }` wrapper here would surface
  cost: The contract holds "HTTP 200 carrying, with no envelope" for each curation operation, and `reply.status(200).send(result)`
    implements it. The comment restates it as prose with a rationale of its own. That leaves a second,
    unchecked statement of the success shape.
  node: contracts/knowledge-base/curation
- file: src/modules/curation/service/dispute.service.ts
  where: the comment at line 67, above the status loop.
  evidence: '// BR-22: every row must be `disputed`.'
  cost: The prose restates the node's fact, which the loop below it holds with BUSINESS_ITEM_NOT_DISPUTED.
    Two homes stay in step only by discipline. A reader who looks here for the rule, and not in the specification,
    finds a back-spec number that no trace reads.
  node: rules/knowledge-base/dispute-resolution-requires-disputed-items
- file: src/modules/curation/service/dispute.service.ts
  where: the comment at line 78 and the docstring at line 285 above `assertSameScope`.
  evidence: '// BR-14: all items must share the same conflict scope. /** BR-14: all items must share the
    same conflict scope. */'
  cost: The prose restates the single-scope rule, which `assertSameScope` holds in this file. It is a
    second home for the rule outside behavior. It also hides that the code's notion of scope differs from
    the node's, reported separately.
  node: rules/knowledge-base/dispute-resolution-single-scope
- file: src/modules/curation/service/dispute.service.ts
  where: the comment at lines 208-209, above `scopeAllowsMultipleCurrent`.
  evidence: '// BR-16: functional-scope predicate — at most one row may end with

    // valid_to = NULL when the scope''s `allows_multiple_current = false`.'
  cost: The prose restates the single-open rule, which the `openCount > 1` guard directly below holds
    in this file. The rule then has two homes, and only the code is checked by anything.
  node: rules/knowledge-base/adjusted-periods-single-open
- file: src/modules/curation/service/entity-match.service.ts
  where: the comment above the first guard of resolveEntityMatchService, line 45
  evidence: // BR-23 defence in depth on resolveEntityMatch (target == self).
  cost: The self-merge rule is stated a second time as prose beside the guard that enforces it. The comment's
    BR-23 citation is a pointer to a back-spec rule, not to a node. A reader who changes the rule may
    edit the comment or the citation and believe they have touched the decision.
  node: rules/knowledge-base/node-never-merged-into-itself
- file: src/modules/curation/service/entity-match.service.ts
  where: the comment above the review deletion in the keep_separate branch, line 90
  evidence: '// BR-10: drop review-context rows.'
  cost: The fact that an accepted resolution removes the node's entity match reviews is restated as prose
    under a back-spec number. `deleteEntityMatchReviewByNode` already does it, in this file and in the
    merge_into branch.
  node: rules/knowledge-base/entity-match-resolution-clears-reviews
- file: src/modules/curation/service/entity-match.service.ts
  where: the comment at the start of the merge_into branch, line 123
  evidence: // merge_into branch — DTO superRefine guarantees target_node_id+reason exist.
  cost: 'The requirement that merge-into name a target, and state a reason, is restated as prose that
    points at the DTO for enforcement. Code in this file also holds the target requirement, as the defensive
    `BUSINESS_TARGET_NODE_REQUIRED` throw. A reader now finds the rule in three places: the comment, the
    throw and the DTO.'
  node: rules/knowledge-base/merge-into-requires-target
- file: src/modules/curation/service/entity-match.service.ts
  where: the comment at the top of the keep_separate branch, line 60
  evidence: '// BR-26: lock node and assert needs_review.'
  cost: The rule that a resolution needs a node in needs-review is restated as prose under a back-spec
    number. Code that holds it follows at `node.status !== "needs_review"`. The two can drift apart without
    anything noticing.
  node: rules/knowledge-base/entity-match-resolution-requires-pending-review
- file: src/modules/curation/service/item.service.ts
  where: the BR-23 block comment above the attribute-correction checks, lines 231-241, the type leg (1)
  evidence: '// BR-23 (TC-04): when correcting an attribute AND `corrected.value` is // supplied, run
    two legs against the predecessor''s `attribute_key` // BEFORE any DB write: //   (1) parseAttributeValue
    against `value_type` (type leg)'
  cost: 'The comment restates that a corrected attribute value must read as its key''s value type. The
    code holds this in `parseAttributeValue({ value: body.corrected.value, value_type: attrKey.value_type
    })`. A reader may take the comment for the decision, and the rule has a second home outside behavior.'
  node: rules/knowledge-base/attribute-value-parses
- file: src/modules/curation/service/item.service.ts
  where: the comment above supersedePredecessor, line 314
  evidence: // 1. Supersede predecessor — `valid_to` UNCHANGED (BR-18).
  cost: The comment restates that a correction supersedes its item and leaves its validity end as it was.
    The code holds this in the `supersedePredecessor(client, body.item_kind, body.item_id)` call, which
    passes no end date. The prose is a second home for the rule.
  node: rules/knowledge-base/correction-supersedes-item
- file: src/modules/curation/service/item.service.ts
  where: the comment above the fragment check in correctItemService, lines 212-213
  evidence: '// BR-17: when `valid_from_fragment_id` is supplied, the fragment must // exist AND its status
    must be `accepted`.'
  cost: The comment states the node's rule a second time under the back-spec's own rule number. The code
    below it (`if (!fragment || fragment.status !== "accepted")`) already holds the rule. When the node
    changes, this sentence stays behind and says something different.
  node: rules/knowledge-base/correction-fragment-accepted
- file: src/modules/curation/service/item.service.ts
  where: the comments above copyProvenance and appendProvenanceFragment, lines 338 and 341
  evidence: // 3. Copy provenance. // 4. Append the errata fragment if supplied (BR-19).
  cost: The comments restate that the new item holds the superseded item's provenance and the cited fragment.
    The calls `copyProvenance(...)` and `appendProvenanceFragment(...)` already carry the rule, so the
    prose is a second home for it.
  node: rules/knowledge-base/corrected-item-provenance
- file: src/modules/curation/service/item.service.ts
  where: the same BR-23 block comment, lines 231-241 and 288-289, the domain leg (2)
  evidence: '//   (2) assertValueInDomain when the key has a closed domain (domain leg) // Domain leg
    — runs only when the key has a closed domain. Details: // { attribute_key, value, allowed_values }
    (BR-23 second leg).'
  cost: The comments restate that a corrected value for a key with allowed values must be one of them.
    The code already holds this in `if (domain !== null) { assertValueInDomain(body.corrected.value, domain);
    }`. The prose is a second home for the rule.
  node: rules/knowledge-base/attribute-value-in-allowed-values
- file: src/modules/curation/service/merge.service.ts
  where: the comment above the deleted-node guards, line 81
  evidence: '// BR-12: 410 for tombstones; explicit before 409/422 status checks.'
  cost: The comment restates both the refusal of deleted nodes and its place in the check order. The code
    holds both, so the prose is a second home that can drift from curation-refuses-deleted-node.
  node: rules/knowledge-base/curation-refuses-deleted-node
- file: src/modules/curation/service/merge.service.ts
  where: the comment above the node type guard, line 120
  evidence: '// BR-06: matching node_type.'
  cost: The comment restates the same-node-type rule in prose. The guard comparing node_type_id holds
    it, so the prose is a second home.
  node: rules/knowledge-base/merge-requires-same-node-type
- file: src/modules/curation/service/merge.service.ts
  where: the comment above the self-merge guard, lines 54 to 55
  evidence: // Defence in depth (BR-23). Route layer rejects but the service must not // trust upstream.
  cost: The comment states that the route layer already refuses a self-merge and that this guard is a
    second copy. The rule is held by the guard and owned by the node. The prose adds a claim about another
    layer that no node holds and that nothing keeps true.
  node: rules/knowledge-base/node-never-merged-into-itself
- file: src/modules/curation/service/merge.service.ts
  where: the comment above the survivor status guard, line 95
  evidence: // Survivor must be active.
  cost: The comment restates the merge-survivor-active invariant in prose. The guard `survivor.status
    !== "active"` already holds it.
  node: rules/knowledge-base/merge-survivor-active
- file: src/modules/curation/service/merge.service.ts
  where: the doc comment on absorbedExpectedStatus in PerformMergeArgs, lines 39 to 40
  evidence: '/** "needs_review" -> UC-02: the absorbed is in `needs_review`. */'
  cost: The comment restates that an entity-match resolution must resolve a node in needs-review. The
    branch that throws BUSINESS_REVIEW_NOT_PENDING holds that fact, so the prose is a second home.
  node: rules/knowledge-base/entity-match-resolution-requires-pending-review
- file: src/modules/curation/service/merge.service.ts
  where: the header comment, lines 1 to 11
  evidence: '//   2. Inspect status: 404 if missing, 410 if deleted, 409/422 mismatch. //   3. Enforce
    node_type match (BR-06). //   4. UPDATE absorbed node: status=''merged'', merged_into_node_id=survivor.'
  cost: The header states the order of the merge checks and the merge steps a second time, in prose no
    system emits. The code below holds them, so the prose is a second home for the order that the merge-check-order
    node owns. When the node or the code moves, this list goes stale without anything flagging it.
  node: rules/knowledge-base/merge-check-order
- file: src/modules/curation/service/metrics.service.ts
  where: the comments at lines 11-13 and 60-62 on the time source of computed_at
  evidence: '"`computed_at` is the BFF wall clock at the moment the read transaction closed (immediately
    after `withReadOnly` returns)" and, at lines 11-13, "captured INSIDE the open `BEGIN READ ONLY` transaction
    (after the seven SELECTs, before COMMIT)"'
  cost: The contract's rule that computed_at is taken after the metrics were read is restated in prose.
    The two comments describe different capture points, one inside the transaction and one after it closes.
    Only the code decides which is true, so a reader who trusts the comments learns a timing the running
    code may not have.
  node: contracts/knowledge-base/curation
- file: src/modules/curation/service/metrics.service.ts
  where: the header comment (lines 3-6) and the docblock above computeCurationMetricsService (lines 43-48)
  evidence: '"All seven aggregates come from ONE `BEGIN READ ONLY` transaction (via `withReadOnly`) so
    they are mutually coherent" and "Wraps the seven aggregate SELECTs in a single `BEGIN READ ONLY` transaction
    (curation.back.md BR-33 point 1)"'
  cost: The constraint that each metrics read runs in one read-only transaction is written out a second
    time in prose. The prose also adds "seven" and "MVCC" detail that the node does not hold. When the
    node moves, nothing reaches these comments. A later reader can take the comment for the place where
    the consistency rule was decided.
  node: constraints/curation-reads-are-consistent
- file: src/modules/curation/service/queue.service.ts
  where: the comment block at the top of groupDisputedLinks, lines 155-168.
  evidence: '// Group by the CONFLICT SCOPE, which depends on the link type''s cardinality

    // (A10, link_type.allows_multiple_current):

    //   - FUNCTIONAL (allows_multiple_current=false, ...): ... so the scope is (source, link_type) —
    target EXCLUDED, scope.target

    //     null. ...

    //   - MULTI-VALUED (allows_multiple_current=true): ... the target is part of

    //     the scope.'
  cost: The prose restates the dispute-scope rule a second time outside behavior. The node holds that
    rule, and the keying in this file's code already implements it. When the node changes, this comment
    will keep stating the old scope rule.
  node: rules/knowledge-base/dispute-scope
unbound:
- src/modules/curation/index.ts
- src/modules/curation/mcp/curation-transport.ts
- src/modules/curation/service/transaction.ts
adopted: true
unheld:
- node: constraints/llm-toolset-omits-audit-reads
  how: 'read on 1 file(s), and every judge answered `nowhere`: no file of the set holds this fact'
- node: domain/knowledge-base/curation-action-kind
  how: 'read on 3 file(s), and every judge answered `nowhere`: no file of the set holds this fact'
- node: rules/knowledge-base/curation-action-time-is-recording-time
  how: 'read on 1 file(s), and every judge answered `nowhere`: no file of the set holds this fact'
- node: rules/knowledge-base/dispute-entry-time
  how: 'read on 1 file(s), and every judge answered `nowhere`: no file of the set holds this fact'
- node: rules/knowledge-base/dispute-queue-entry
  how: 'read on 1 file(s), and every judge answered `nowhere`: no file of the set holds this fact'
notes: 'Judged by 18 delegation(s), one per file; folded mechanically by trace.py --fold from the returns
  under siegard-reconcile/adopt-curation.returns/.

  Staged as an adoption of source no delivery wrote: 104 candidate node(s) were read on every file, and
  each cleared one is bound to the files whose judgment holds its fact.

  Candidates: 13 opened across 5 of 18 delegation(s); each return lists its own under `candidates_opened`.

  Unstated: 1 fact(s) the source states that no node holds, over 1 file(s), listed under `unstated`. They
  block no binding here and no rebind closes them — the route is the analysis that gives each fact a node.

  Restates: 51 place(s) where text in the source restates a node''s fact the code holds, over 14 file(s),
  listed under `restates`. The pair conforms, so none blocks a binding — the route is removing the text,
  and reconciling the file after.'
---

## Folded
This record was folded by `trace.py --fold` from the delegation returns under `siegard-reconcile/adopt-curation.returns/`, which are the evidence behind every entry above.
