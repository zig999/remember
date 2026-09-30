---
contract_version: siegard-reconcile/8
title: Adoption of the compliance-audit context of the backend
summary: The owner adopts the compliance-audit module as it stands; the source did not change and is taken
  as the running system's behavior, surveyed in siegard-survey/adopt-compliance-audit and analysed into
  the knowledge-base specification.
target: backend
files:
- path: src/modules/compliance-audit/dto/compliance-delete.dto.ts
  change: Unchanged; declares the compliance deletion request, its answer and the compliance-deletion
    listing query.
- path: src/modules/compliance-audit/dto/curation-action.dto.ts
  change: Unchanged; declares the curation-action listing query, its closed action and target kinds, and
    the curation action as answered.
- path: src/modules/compliance-audit/index.ts
  change: Unchanged; re-exports the module's routes, tool registration and request schema.
- path: src/modules/compliance-audit/mcp/compliance-toolset.ts
  change: Unchanged; offers compliance deletion as the one curation tool of this module and maps its refusals.
- path: src/modules/compliance-audit/repository/compliance-audit.repository.ts
  change: Unchanged; locks, redacts and tombstones the raw information, cascades the deletion, writes
    the audit records and lists them.
- path: src/modules/compliance-audit/routes/compliance-audit.routes.ts
  change: Unchanged; exposes compliance deletion and the four audit reads over REST and maps their refusals.
- path: src/modules/compliance-audit/service/compliance-audit.service.ts
  change: Unchanged; orders the compliance deletion's checks, runs its cascade and records it, and serves
    the audit reads.
- path: src/modules/compliance-audit/service/errors.ts
  change: Unchanged; declares the not-found, validation and internal-failure refusals.
- path: src/modules/compliance-audit/service/transaction.ts
  change: Unchanged; re-exports the shared transaction wrapper.
nodes:
- node: constraints/compliance-deletion-is-atomic
  conforms: true
  how: "src/modules/compliance-audit/mcp/compliance-toolset.ts: held at the handler's call to withTransaction\
    \ around complianceDelete, lines 156-158 — const result = await withTransaction(deps.pool, (client)\
    \ =>\n  complianceDelete({ logger: deps.logger }, client, body)\n);\nsrc/modules/compliance-audit/routes/compliance-audit.routes.ts:\
    \ held at the POST /compliance/deletions handler, line 76, where complianceDelete runs inside the\
    \ callback passed to withTransaction — const result = await withTransaction(deps.pool, (client) =>\n\
    \      complianceDelete({ logger: deps.logger }, client, body)\n    );"
  encoded_at:
  - src/modules/compliance-audit/mcp/compliance-toolset.ts
  - src/modules/compliance-audit/routes/compliance-audit.routes.ts
- node: constraints/llm-toolset-omits-audit-reads
  conforms: true
  how: "src/modules/compliance-audit/mcp/compliance-toolset.ts: held at registerComplianceToolset, lines\
    \ 137-184. It registers exactly one tool under the curation toolset, and registers no deletion-list,\
    \ deletion-read, action-list or action-read tool. — deps.mcp.registerTool(\"curation\", {\n  name:\
    \ \"compliance_delete\","
  encoded_at:
  - src/modules/compliance-audit/mcp/compliance-toolset.ts
- node: contracts/knowledge-base/compliance-audit
  conforms: true
  how: "src/modules/compliance-audit/dto/compliance-delete.dto.ts: held at ComplianceDeleteRequestSchema,\
    \ ComplianceDeleteOutcomeSchema, ComplianceDeleteResponseSchema, ComplianceDeletionSchema, ListComplianceDeletionsQuerySchema,\
    \ ComplianceDeletionListSchema, ComplianceDeletionIdParamSchema. Partial: the file declares the request\
    \ and response shapes and the field-level validations, not the error codes, messages or HTTP statuses.\
    \ — export const ComplianceDeleteResponseSchema = z.object({ outcome: ComplianceDeleteOutcomeSchema,\
    \ deletion: ComplianceDeletionSchema, }); ... export const ComplianceDeletionIdParamSchema = z.object({\
    \ complianceDeletionId: UuidSchema, });\nsrc/modules/compliance-audit/dto/curation-action.dto.ts:\
    \ held at This file holds only the curation-action part of the contract, in three places. ListCurationActionsQuerySchema\
    \ declares the list request. CurationActionSchema and CurationActionListSchema declare the response\
    \ shapes. CurationActionIdParamSchema declares the read request. The compliance-deletion operations\
    \ are held elsewhere. — export const CurationActionSchema = z.object({ id: UuidSchema, action: z.string(),\
    \ target_kind: z.string(), target_id: UuidSchema.nullable(), payload: z.record(z.string(), z.unknown()),\
    \ reason: z.string().max(1000).nullable(), created_at: z.string(), });\nsrc/modules/compliance-audit/mcp/compliance-toolset.ts:\
    \ held at mapZodErrorToEnvelope (lines 73-135) holds the validation refusals and their messages. The\
    \ handler (lines 144-183) holds the ok/result envelope, the pass-through of service errors, and the\
    \ generic SYSTEM_INTERNAL_ERROR with the cause withheld. The MCP surface covers only the compliance-delete\
    \ operation. The list and read operations are REST-only and sit in other files. — return renderErrorEnvelope(\n\
    \  \"VALIDATION_REQUIRED_FIELD\",\n  `Field '${reqField.path.join(\".\")}' is required.`,\n  { issues\
    \ }\n).envelope; ... \"Field 'reason' must be non-empty after trim and ≤ 1000 characters.\" ... \"\
    Request payload failed validation.\" ... return renderErrorEnvelope(\n  \"SYSTEM_INTERNAL_ERROR\"\
    ,\n  \"Unexpected internal error.\"\n).envelope;\nsrc/modules/compliance-audit/routes/compliance-audit.routes.ts:\
    \ held at the route handlers (status selection at line 79, 200 on the reads), handleZodError (lines\
    \ 193-267) and handleAuditError (lines 277-297). The refusal codes, messages and the 422 status sit\
    \ in handleZodError and in VALIDATION_STATUS. The 404 and 500 answers reach handleAuditError from\
    \ the service errors. — const status = result.outcome === \"deleted\" ? 201 : 200; const VALIDATION_STATUS\
    \ = 422; message: `Field '${reqField.path.join(\".\")}' is required.`, \"Field 'reason' must be non-empty\
    \ after trim and ≤ 1000 characters.\" message: \"Time range bounds must satisfy `from < to`.\", message:\
    \ \"Request payload failed validation.\",\nsrc/modules/compliance-audit/service/compliance-audit.service.ts:\
    \ held at complianceDelete (lines 81-199) and the four read functions listComplianceDeletions, getComplianceDeletionById,\
    \ listCurationActions and getCurationActionById (lines 205-295) — `throw new ResourceNotFoundError(`RawInformation\
    \ ${body.raw_information_id} not found.`, { entity: \"raw_information\", id: body.raw_information_id\
    \ })`; `return { outcome: \"noop_already_deleted\", deletion: rowToDto(existing) }`; `throw new InternalFailure(\"\
    legacy_orphan_tombstone\", { raw_information_id: body.raw_information_id })`; `throw new InternalFailure(\"\
    raw_tombstone_mismatch\", { raw_information_id: body.raw_information_id, rows_updated: rawTombstoned\
    \ })`; `CurationAction ${id} not found.`; `payload: (row.payload ?? {})`; `executed_at: toIso(row.executed_at)`\n\
    src/modules/compliance-audit/service/errors.ts: held at the three error classes: ResourceNotFoundError\
    \ (404, RESOURCE_NOT_FOUND), ValidationFailure (422, caller-supplied code and message) and InternalFailure\
    \ (500, SYSTEM_INTERNAL_ERROR, fixed message). The specific VALIDATION_* codes and the per-refusal\
    \ messages are supplied by callers in other files, not here. — export class ResourceNotFoundError\
    \ extends ComplianceAuditError {\n  public readonly statusCode = 404;\n  public readonly code = \"\
    RESOURCE_NOT_FOUND\" as const;\n} export class ValidationFailure extends ComplianceAuditError {\n\
    \  public readonly statusCode = 422;\n... export class InternalFailure extends ComplianceAuditError\
    \ {\n  public readonly statusCode = 500;\n  public readonly code = \"SYSTEM_INTERNAL_ERROR\" as const;\n\
    ...\n    super(\"Unexpected internal error.\", details);"
  encoded_at:
  - src/modules/compliance-audit/dto/compliance-delete.dto.ts
  - src/modules/compliance-audit/dto/curation-action.dto.ts
  - src/modules/compliance-audit/mcp/compliance-toolset.ts
  - src/modules/compliance-audit/routes/compliance-audit.routes.ts
  - src/modules/compliance-audit/service/compliance-audit.service.ts
  - src/modules/compliance-audit/service/errors.ts
- node: domain/knowledge-base/affected-counts
  conforms: true
  how: 'src/modules/compliance-audit/dto/compliance-delete.dto.ts: held at ComplianceDeletionAffectedSchema,
    lines 41-46 — export const ComplianceDeletionAffectedSchema = z.object({ chunks: z.number().int().min(0),
    fragments: z.number().int().min(0), links: z.number().int().min(0), attributes: z.number().int().min(0),
    });'
  encoded_at:
  - src/modules/compliance-audit/dto/compliance-delete.dto.ts
- node: domain/knowledge-base/compliance-deletion
  conforms: true
  how: "src/modules/compliance-audit/dto/compliance-delete.dto.ts: held at ComplianceDeletionSchema, lines\
    \ 52-58 — export const ComplianceDeletionSchema = z.object({ id: UuidSchema, raw_information_id: UuidSchema,\
    \ reason: ReasonSchema, executed_at: z.string(), affected: ComplianceDeletionAffectedSchema, });\n\
    src/modules/compliance-audit/repository/compliance-audit.repository.ts: held at interface ComplianceDeletionRow,\
    \ lines 213-219 — export interface ComplianceDeletionRow {\n  readonly id: string;\n  readonly raw_information_id:\
    \ string;\n  readonly reason: string;\n  readonly executed_at: Date;\n  readonly affected: ComplianceDeletionAffected;\n\
    }"
  encoded_at:
  - src/modules/compliance-audit/dto/compliance-delete.dto.ts
  - src/modules/compliance-audit/repository/compliance-audit.repository.ts
- node: domain/knowledge-base/compliance-deletion-filter
  conforms: true
  how: "src/modules/compliance-audit/dto/compliance-delete.dto.ts: held at ListComplianceDeletionsQuerySchema,\
    \ lines 80-98. The page appears as flat `limit` and `offset` fields. — raw_information_id: UuidSchema.optional(),\
    \ executed_from: z.string().datetime({ offset: true }).optional(), executed_to: z.string().datetime({\
    \ offset: true }).optional(), limit: z.coerce.number().int().min(1).max(100).default(50), offset:\
    \ z.coerce.number().int().min(0).default(0),\nsrc/modules/compliance-audit/repository/compliance-audit.repository.ts:\
    \ held at interface ListComplianceDeletionsFilters, lines 293-299 — readonly raw_information_id?:\
    \ string;\n  readonly executed_from?: string;\n  readonly executed_to?: string;\n  readonly limit:\
    \ number;\n  readonly offset: number;"
  encoded_at:
  - src/modules/compliance-audit/dto/compliance-delete.dto.ts
  - src/modules/compliance-audit/repository/compliance-audit.repository.ts
- node: domain/knowledge-base/compliance-deletion-outcome
  conforms: true
  how: 'src/modules/compliance-audit/dto/compliance-delete.dto.ts: held at ComplianceDeleteOutcomeSchema,
    lines 32-35 — export const ComplianceDeleteOutcomeSchema = z.enum([ "deleted", "noop_already_deleted",
    ]);'
  encoded_at:
  - src/modules/compliance-audit/dto/compliance-delete.dto.ts
- node: domain/knowledge-base/curation-action
  conforms: true
  how: "src/modules/compliance-audit/repository/compliance-audit.repository.ts: held at interface CurationActionRow,\
    \ lines 360-368, and CurationActionInsertArgs, lines 352-358 — export interface CurationActionRow\
    \ {\n  readonly id: string;\n  readonly action: string;\n  readonly target_kind: string;\n  readonly\
    \ target_id: string | null;\n  readonly payload: Record<string, unknown>;\n  readonly reason: string\
    \ | null;\n  readonly created_at: Date;\n}"
  encoded_at:
  - src/modules/compliance-audit/repository/compliance-audit.repository.ts
- node: domain/knowledge-base/curation-action-filter
  conforms: true
  how: "src/modules/compliance-audit/dto/curation-action.dto.ts: held at ListCurationActionsQuerySchema,\
    \ lines 38-47, which declares action, target_kind, target_id, created_from, created_to, limit and\
    \ offset. — action: CurationActionNameSchema.optional(),\n    target_kind: TargetKindSchema.optional(),\n\
    \    target_id: UuidSchema.optional(),\n    created_from: z.string().datetime({ offset: true }).optional(),\n\
    \    created_to: z.string().datetime({ offset: true }).optional(),\nsrc/modules/compliance-audit/repository/compliance-audit.repository.ts:\
    \ held at interface ListCurationActionsFilters, lines 411-419 — readonly action?: string;\n  readonly\
    \ target_kind?: string;\n  readonly target_id?: string;\n  readonly created_from?: string;\n  readonly\
    \ created_to?: string;\n  readonly limit: number;\n  readonly offset: number;"
  encoded_at:
  - src/modules/compliance-audit/dto/curation-action.dto.ts
  - src/modules/compliance-audit/repository/compliance-audit.repository.ts
- node: domain/knowledge-base/curation-action-kind
  conforms: true
  how: "src/modules/compliance-audit/dto/curation-action.dto.ts: held at CurationActionNameSchema, lines\
    \ 12-20. It is a z.enum with the node's seven kinds. The values are spelled snake_case, where the\
    \ node spells them kebab-case. — export const CurationActionNameSchema = z.enum([\n  \"resolve_entity_match\"\
    ,\n  \"merge_nodes\",\n  \"resolve_dispute\",\n  \"confirm_item\",\n  \"reject_item\",\n  \"correct_item\"\
    ,\n  \"compliance_delete\",\n]);"
  encoded_at:
  - src/modules/compliance-audit/dto/curation-action.dto.ts
- node: domain/knowledge-base/curation-target-kind
  conforms: true
  how: "src/modules/compliance-audit/dto/curation-action.dto.ts: held at TargetKindSchema, lines 24-30.\
    \ It is a z.enum with the node's five kinds, spelled snake_case. — export const TargetKindSchema =\
    \ z.enum([\n  \"node\",\n  \"link\",\n  \"attribute\",\n  \"fragment\",\n  \"raw_information\",\n\
    ]);"
  encoded_at:
  - src/modules/compliance-audit/dto/curation-action.dto.ts
- node: domain/knowledge-base/node-status
  conforms: true
  how: 'src/modules/compliance-audit/repository/compliance-audit.repository.ts: held at the status member
    of RawInformationLockedRow, line 23, partially — readonly status: "active" | "needs_review" | "merged"
    | "deleted";'
  encoded_at:
  - src/modules/compliance-audit/repository/compliance-audit.repository.ts
- node: rules/knowledge-base/audit-filter-checks-order
  conforms: true
  how: "src/modules/compliance-audit/mcp/compliance-toolset.ts: held at the sequence of checks in mapZodErrorToEnvelope:\
    \ the window marker first (line 80), then the required field (line 93), then the reason length (line\
    \ 116), then the fallback (line 130) — err.issues.some(\n  (i) => i.code === \"custom\" && i.message\
    \ === \"VALIDATION_OUT_OF_RANGE\"\n) ... if (reqField) { ... (i.code === \"too_small\" || i.code ===\
    \ \"too_big\") && i.path[0] === \"reason\"\nsrc/modules/compliance-audit/routes/compliance-audit.routes.ts:\
    \ held at the order of the three guards in handleZodError. The custom VALIDATION_OUT_OF_RANGE window\
    \ issue is tested first, then the required-field issue, then the too_small or too_big issue on path\
    \ \"reason\", then the VALIDATION_INVALID_FORMAT fallback. — err.issues.some((i) => i.code === \"\
    custom\" && i.message === \"VALIDATION_OUT_OF_RANGE\") const reqField = err.issues.find((i) => { (i.code\
    \ === \"too_small\" || i.code === \"too_big\") &&\n        i.path[0] === \"reason\"\ncode: \"VALIDATION_INVALID_FORMAT\"\
    ,"
  encoded_at:
  - src/modules/compliance-audit/mcp/compliance-toolset.ts
  - src/modules/compliance-audit/routes/compliance-audit.routes.ts
- node: rules/knowledge-base/audit-filters-match-exactly
  conforms: true
  how: 'src/modules/compliance-audit/repository/compliance-audit.repository.ts: held at the where-clause
    builders of listComplianceDeletions (lines 317-320) and listCurationActions (lines 437-448) — where.push(`raw_information_id
    = $${i++}`);

    where.push(`action = $${i++}`);

    where.push(`target_kind = $${i++}`);

    where.push(`target_id = $${i++}`);'
  encoded_at:
  - src/modules/compliance-audit/repository/compliance-audit.repository.ts
- node: rules/knowledge-base/audit-listing-order
  conforms: true
  how: 'src/modules/compliance-audit/repository/compliance-audit.repository.ts: held at the data queries
    of listComplianceDeletions (line 335) and listCurationActions (line 463) — ORDER BY executed_at DESC

    ORDER BY created_at DESC'
  encoded_at:
  - src/modules/compliance-audit/repository/compliance-audit.repository.ts
- node: rules/knowledge-base/audit-listing-total-before-pagination
  conforms: true
  how: "src/modules/compliance-audit/repository/compliance-audit.repository.ts: held at the countSql of\
    \ listComplianceDeletions (lines 339-342) and listCurationActions (lines 467-470) — const countSql\
    \ = `SELECT count(*)::int AS total\n                    FROM compliance_deletion\n               \
    \     ${whereClause}`;\nconst countRes = await client.query<{ total: number }>(countSql, params);"
  encoded_at:
  - src/modules/compliance-audit/repository/compliance-audit.repository.ts
- node: rules/knowledge-base/audit-listing-window-half-open
  conforms: true
  how: 'src/modules/compliance-audit/repository/compliance-audit.repository.ts: held at the window predicates
    of listComplianceDeletions (lines 321-328) and listCurationActions (lines 449-456) — where.push(`executed_at
    >= $${i++}`);

    where.push(`executed_at < $${i++}`);

    where.push(`created_at >= $${i++}`);

    where.push(`created_at < $${i++}`);'
  encoded_at:
  - src/modules/compliance-audit/repository/compliance-audit.repository.ts
- node: rules/knowledge-base/audit-page-defaults
  conforms: true
  how: "src/modules/compliance-audit/dto/compliance-delete.dto.ts: held at ListComplianceDeletionsQuerySchema,\
    \ the `limit` and `offset` fields, lines 85-86 — limit: z.coerce.number().int().min(1).max(100).default(50),\
    \ offset: z.coerce.number().int().min(0).default(0),\nsrc/modules/compliance-audit/dto/curation-action.dto.ts:\
    \ held at ListCurationActionsQuerySchema, lines 45-46. — limit: z.coerce.number().int().min(1).max(100).default(50),\n\
    \    offset: z.coerce.number().int().min(0).default(0),"
  encoded_at:
  - src/modules/compliance-audit/dto/compliance-delete.dto.ts
  - src/modules/compliance-audit/dto/curation-action.dto.ts
- node: rules/knowledge-base/audit-window-ordered
  conforms: true
  how: "src/modules/compliance-audit/dto/compliance-delete.dto.ts: held at the superRefine of ListComplianceDeletionsQuerySchema,\
    \ lines 88-98 — if (Date.parse(value.executed_from) >= Date.parse(value.executed_to)) { ctx.addIssue({\
    \ code: \"custom\", path: [\"executed_to\"], message: \"VALIDATION_OUT_OF_RANGE\", }); }\nsrc/modules/compliance-audit/dto/curation-action.dto.ts:\
    \ held at the superRefine of ListCurationActionsQuerySchema, lines 48-58. — if (Date.parse(value.created_from)\
    \ >= Date.parse(value.created_to)) {\n        ctx.addIssue({\n          code: \"custom\",\n      \
    \    path: [\"created_to\"],\n          message: \"VALIDATION_OUT_OF_RANGE\",\n        });"
  encoded_at:
  - src/modules/compliance-audit/dto/compliance-delete.dto.ts
  - src/modules/compliance-audit/dto/curation-action.dto.ts
- node: rules/knowledge-base/compliance-deletion-check-order
  conforms: true
  how: "src/modules/compliance-audit/routes/compliance-audit.routes.ts: held at Only the first of the\
    \ three checks sits in this file. The POST handler parses the body before any service call, and withTransaction\
    \ is reached only after a successful parse. The checks for an existing raw information and for one\
    \ already deleted are in the service, which this file calls but does not declare. — body = ComplianceDeleteRequestSchema.parse(request.body\
    \ ?? {}); } catch (err) {\n  return handleZodError(err, reply);\n} ... const result = await withTransaction(deps.pool,\
    \ (client) =>\nsrc/modules/compliance-audit/service/compliance-audit.service.ts: held at the order\
    \ of statements in complianceDelete, lines 87-136 — `const raw = await loadRawInformationForUpdate(client,\
    \ body.raw_information_id); if (!raw) { throw new ResourceNotFoundError(...) } if (raw.status ===\
    \ \"deleted\") {` precede the first `tombstoneRawInformation` call. Request well-formedness is checked\
    \ upstream, before the service is called."
  encoded_at:
  - src/modules/compliance-audit/routes/compliance-audit.routes.ts
  - src/modules/compliance-audit/service/compliance-audit.service.ts
- node: rules/knowledge-base/compliance-deletion-counts-what-it-marked
  conforms: true
  how: "src/modules/compliance-audit/repository/compliance-audit.repository.ts: held at the RETURNING\
    \ and rowCount of the four tombstone functions, lines 89-207, and the jsonb_build_object of insertComplianceDeletion,\
    \ lines 235-241 — RETURNING id`, [rawInformationId]);\n  return res.rowCount ?? 0;\nsrc/modules/compliance-audit/service/compliance-audit.service.ts:\
    \ held at lines 153-164 in complianceDelete — `const chunks = await tombstoneRawChunksOfRaw(...);\
    \ const fragments = await tombstoneCascadedFragments(...); const links = await tombstoneCascadedLinks(...);\
    \ const attributes = await tombstoneCascadedAttributes(...); const affected = { chunks, fragments,\
    \ links, attributes };`"
  encoded_at:
  - src/modules/compliance-audit/repository/compliance-audit.repository.ts
  - src/modules/compliance-audit/service/compliance-audit.service.ts
- node: rules/knowledge-base/compliance-deletion-flags-metadata
  conforms: true
  how: 'src/modules/compliance-audit/repository/compliance-audit.repository.ts: held at the metadata assignment
    in the UPDATE of tombstoneRawInformation, line 70 — metadata       = metadata || jsonb_build_object(''compliance_deleted'',
    true),'
  encoded_at:
  - src/modules/compliance-audit/repository/compliance-audit.repository.ts
- node: rules/knowledge-base/compliance-deletion-keeps-content-hash
  conforms: true
  how: "src/modules/compliance-audit/repository/compliance-audit.repository.ts: held at the SET list of\
    \ the UPDATE in tombstoneRawInformation, lines 68-72, which never names content_hash — SET content\
    \        = '[REDACTED]',\n            original_input = CASE WHEN original_input IS NULL THEN NULL\
    \ ELSE '[REDACTED]' END,\n            metadata       = metadata || jsonb_build_object('compliance_deleted',\
    \ true),\n            status         = 'deleted',\n            superseded_at  = now()"
  encoded_at:
  - src/modules/compliance-audit/repository/compliance-audit.repository.ts
- node: rules/knowledge-base/compliance-deletion-propagates
  conforms: true
  how: "src/modules/compliance-audit/repository/compliance-audit.repository.ts: held at the UPDATE statements\
    \ of tombstoneCascadedFragments (lines 117-133), tombstoneCascadedLinks (lines 150-168) and tombstoneCascadedAttributes\
    \ (lines 185-203) — AND NOT EXISTS (\n          SELECT 1 FROM fragment_source fs\n            JOIN\
    \ raw_chunk rc ON rc.id = fs.raw_chunk_id\n            JOIN raw_information ri ON ri.id = rc.raw_information_id\n\
    \           WHERE fs.fragment_id = f.id\n             AND ri.id <> $1\n             AND ri.status\
    \ <> 'deleted')\n    AND f.status <> 'deleted'"
  encoded_at:
  - src/modules/compliance-audit/repository/compliance-audit.repository.ts
- node: rules/knowledge-base/compliance-deletion-reason-length
  conforms: true
  how: 'src/modules/compliance-audit/dto/compliance-delete.dto.ts: held at ReasonSchema, line 20 — export
    const ReasonSchema = z.string().trim().min(1).max(1000);'
  encoded_at:
  - src/modules/compliance-audit/dto/compliance-delete.dto.ts
- node: rules/knowledge-base/compliance-deletion-reason-trimmed
  conforms: true
  how: 'src/modules/compliance-audit/dto/compliance-delete.dto.ts: held at ReasonSchema, line 20. The
    `.trim()` transform makes the parsed request record the trimmed reason. — export const ReasonSchema
    = z.string().trim().min(1).max(1000);'
  encoded_at:
  - src/modules/compliance-audit/dto/compliance-delete.dto.ts
- node: rules/knowledge-base/compliance-deletion-records-curation-action
  conforms: true
  how: 'src/modules/compliance-audit/service/compliance-audit.service.ts: held at the insertCurationAction
    call, lines 175-181 — `await insertCurationAction(client, { action: "compliance_delete", target_kind:
    "raw_information", target_id: body.raw_information_id, payload: { reason: body.reason, affected },
    reason: body.reason });`'
  encoded_at:
  - src/modules/compliance-audit/service/compliance-audit.service.ts
- node: rules/knowledge-base/compliance-deletion-redacts-content
  conforms: false
  how: 'src/modules/compliance-audit/service/compliance-audit.service.ts, the exported constant REDACTED_LITERAL,
    line 57: export const REDACTED_LITERAL = "[REDACTED]" as const; — The literal is declared a second
    time as a constant that nothing reads. The repository redacts with its own inline ''[REDACTED]'' in
    SQL, and the constant is only re-exported from the module index and pinned by tests. If the node''s
    literal changes, the constant and its test can keep passing while the real redaction stays as it was,
    or the reverse. Nobody can tell which value was decided. This file does not perform the redaction
    at all.'
  observed_at:
  - src/modules/compliance-audit/service/compliance-audit.service.ts
- node: rules/knowledge-base/compliance-deletion-tombstones
  conforms: false
  how: "src/modules/compliance-audit/repository/compliance-audit.repository.ts, docstring of tombstoneCascadedFragments,\
    \ lines 105-107, and the predicate of tombstoneRawChunksOfRaw, lines 94-98: WHERE raw_information_id\
    \ = $1\n  AND superseded_at IS NULL\nRETURNING id — The node says a compliance deletion marks deleted\
    \ each of its raw information's raw chunks. This query marks only chunks whose superseded_at is null,\
    \ and no node states that restriction. A chunk of the raw information that already carries a supersession\
    \ time is left un-deleted, and the chunk count in the audit record omits it. The next reader looks\
    \ for the chunk rule in the specification and finds no such guard."
  observed_at:
  - src/modules/compliance-audit/repository/compliance-audit.repository.ts
- node: rules/knowledge-base/curation-action-reason-length
  conforms: true
  how: 'src/modules/compliance-audit/dto/curation-action.dto.ts: held at the `reason` field of CurationActionSchema,
    line 70. — reason: z.string().max(1000).nullable(),'
  encoded_at:
  - src/modules/compliance-audit/dto/curation-action.dto.ts
- node: rules/knowledge-base/curation-action-time-is-recording-time
  conforms: true
  how: "src/modules/compliance-audit/repository/compliance-audit.repository.ts: held at the INSERT of\
    \ insertCurationAction, lines 379-381, which names no creation time and returns created_at — INSERT\
    \ INTO curation_action (action, target_kind, target_id, payload, reason)\n     VALUES ($1, $2, $3,\
    \ $4::jsonb, $5)\n     RETURNING id, action, target_kind, target_id, payload, reason, created_at"
  encoded_at:
  - src/modules/compliance-audit/repository/compliance-audit.repository.ts
- node: rules/knowledge-base/deleted-source-deletion-records-nothing
  conforms: true
  how: 'src/modules/compliance-audit/service/compliance-audit.service.ts: held at the `raw.status ===
    "deleted"` branch, lines 101-121 — `if (existing) { logger.info({...}, "compliance_delete_noop");
    return { outcome: "noop_already_deleted", deletion: rowToDto(existing) }; }` returns before any insert
    call.'
  encoded_at:
  - src/modules/compliance-audit/service/compliance-audit.service.ts
- node: rules/knowledge-base/deletion-execution-time-is-recording-time
  conforms: true
  how: "src/modules/compliance-audit/repository/compliance-audit.repository.ts: held at the INSERT of\
    \ insertComplianceDeletion, lines 235-241, which names no execution time and returns executed_at —\
    \ INSERT INTO compliance_deletion (raw_information_id, reason, affected)\n     VALUES ($1, $2, jsonb_build_object(\n\
    \     ...\n     RETURNING id, raw_information_id, reason, executed_at, affected"
  encoded_at:
  - src/modules/compliance-audit/repository/compliance-audit.repository.ts
- node: rules/knowledge-base/page-limit-bounds
  conforms: true
  how: 'src/modules/compliance-audit/dto/compliance-delete.dto.ts: held at the `limit` field of ListComplianceDeletionsQuerySchema,
    line 85 — limit: z.coerce.number().int().min(1).max(100).default(50),

    src/modules/compliance-audit/dto/curation-action.dto.ts: held at the `limit` field of ListCurationActionsQuerySchema,
    line 45. — limit: z.coerce.number().int().min(1).max(100).default(50),'
  encoded_at:
  - src/modules/compliance-audit/dto/compliance-delete.dto.ts
  - src/modules/compliance-audit/dto/curation-action.dto.ts
- node: rules/knowledge-base/page-offset-non-negative
  conforms: true
  how: 'src/modules/compliance-audit/dto/compliance-delete.dto.ts: held at the `offset` field of ListComplianceDeletionsQuerySchema,
    line 86 — offset: z.coerce.number().int().min(0).default(0),

    src/modules/compliance-audit/dto/curation-action.dto.ts: held at the `offset` field of ListCurationActionsQuerySchema,
    line 46. — offset: z.coerce.number().int().min(0).default(0),'
  encoded_at:
  - src/modules/compliance-audit/dto/compliance-delete.dto.ts
  - src/modules/compliance-audit/dto/curation-action.dto.ts
- node: rules/knowledge-base/source-status-active-or-deleted
  conforms: false
  how: 'src/modules/compliance-audit/repository/compliance-audit.repository.ts, the status member of interface
    RawInformationLockedRow, line 23: readonly status: "active" | "needs_review" | "merged" | "deleted";
    — The node says a raw information''s status is active or deleted, and this row type, which is the
    only declaration of a raw information''s status in the file, admits four values. A reader taking the
    vocabulary from the type would treat needs_review and merged as states a source can be in, and that
    is what the node denies.

    no file of the set holds this fact beside what was found against it'
  observed_at:
  - src/modules/compliance-audit/repository/compliance-audit.repository.ts
unstated:
- file: src/modules/compliance-audit/dto/compliance-delete.dto.ts
  where: ComplianceDeletionListSchema, line 108 (the list envelope key)
  evidence: 'items: z.array(ComplianceDeletionSchema),'
  cost: The contract says the listing carries "the total, the limit, the offset and the page of compliance
    deletions". It gives no name for the key that holds the page, and no node in the specification root
    names it. The wire name `items` is decided only in this schema. A reader looking in the specification
    for what the REST and MCP callers receive will not find it.
- file: src/modules/compliance-audit/routes/compliance-audit.routes.ts
  where: the five route registrations in registerComplianceAuditRoutes (lines 65-175)
  evidence: "app.post(\n    \"/compliance/deletions\",\napp.get(\n    \"/compliance/deletions\",\napp.get(\n\
    \    \"/compliance/deletions/:complianceDeletionId\",\napp.get(\n    \"/audit/curation-actions\",\n\
    app.get(\n    \"/audit/curation-actions/:curationActionId\","
  cost: The URL and verb for each of the five operations are stated only in this file. The contract names
    the operations and their answers but never a path. The next reader who looks in the specification
    for where compliance-delete or the audit reads are exposed will not find it, and a client can only
    learn the paths from the code.
restates:
- file: src/modules/compliance-audit/dto/compliance-delete.dto.ts
  where: the doc comment above ListComplianceDeletionsQuerySchema, lines 74-79
  evidence: When both bounds are supplied, the parser rejects `from >= to` with `VALIDATION_OUT_OF_RANGE`.
  cost: The start-strictly-before-end rule is restated in prose beside the `superRefine` that enforces
    it. The two can drift apart, and the comment cites BR-09 as its authority instead of the node.
  node: rules/knowledge-base/audit-window-ordered
- file: src/modules/compliance-audit/dto/compliance-delete.dto.ts
  where: the doc comment above ReasonSchema, lines 12-19
  evidence: /** `reason` — non-empty after trim, ≤ 1000 chars (BR-01). ... `z.string().trim().min(1).max(1000)`
    runs `trim()` then checks the length AFTER the trim. */
  cost: The 1..1000 trimmed-length bound is written twice in this file, once as prose and once as `z.string().trim().min(1).max(1000)`.
    If the node moves, the comment keeps stating the old number. It also cites the back-spec rule id BR-01
    as its authority. The next reader may take the comment, not the node, as where the bound was decided.
  node: rules/knowledge-base/compliance-deletion-reason-length
- file: src/modules/compliance-audit/dto/curation-action.dto.ts
  where: the doc comment above CurationActionNameSchema, line 11
  evidence: /** 7 curation-tool names of §14.4 (BR-10). */
  cost: The count and the source of the closed set of action kinds is restated in prose beside the enumeration
    that holds it. If the node's set changes, the comment keeps claiming seven names from a section the
    node no longer cites.
  node: domain/knowledge-base/curation-action-kind
- file: src/modules/compliance-audit/dto/curation-action.dto.ts
  where: the doc comment above ListCurationActionsQuerySchema, lines 33-37
  evidence: "BR-09 semi-open\n * time-range honored (`from` inclusive, `to` exclusive); BR-10 action enum\n\
    \ * validated here."
  cost: The half-open window rule is written here as prose next to a schema that only parses and orders
    the two bounds. The rule itself runs in another file, so a reader of this DTO may take the comment
    for where it is enforced. The comment also says that enforcement sits in this file, which is wrong.
  node: rules/knowledge-base/audit-listing-window-half-open
- file: src/modules/compliance-audit/mcp/compliance-toolset.ts
  where: the docblock of mapZodErrorToEnvelope, lines 57-72 (the numbered priority list)
  evidence: '*   1. Explicit `superRefine` `VALIDATION_OUT_OF_RANGE` marker (semi-open range *      guard
    on the list endpoint ... *   2. Missing / undefined field -> `VALIDATION_REQUIRED_FIELD`. ... *   3.
    `reason` length / trim violation (`too_small` / `too_big` on the `reason` *      path) -> `VALIDATION_OUT_OF_RANGE`.
    *   4. Everything else -> `VALIDATION_INVALID_FORMAT`.'
  cost: 'The docblock restates the order in which form checks are refused: time window, then missing field,
    then reason out of range, then anything else. The code in this file holds that order in the four sequential
    branches of the same function. A second statement of the order in prose can drift from the node without
    anything noticing.'
  node: rules/knowledge-base/audit-filter-checks-order
- file: src/modules/compliance-audit/mcp/compliance-toolset.ts
  where: the header comment, lines 11-16 ("Per BR-15 (P2.1 canonical taxonomy ...)")
  evidence: '// Per BR-15 (P2.1 canonical taxonomy — same codes on REST and MCP): //   - Zod parse failure
    -> VALIDATION_REQUIRED_FIELD | VALIDATION_INVALID_FORMAT //                         | VALIDATION_OUT_OF_RANGE
    (Zod-discriminated) //   - raw_information_id resolves to no row -> RESOURCE_NOT_FOUND'
  cost: The comment restates the contract's refusal codes for compliance-delete as prose. The code in
    this file already holds the validation codes in mapZodErrorToEnvelope and passes the service errors
    through renderErrorEnvelope. If the contract's codes change, this comment goes on claiming the old
    ones, and a reader may take it for the place the codes are decided.
  node: contracts/knowledge-base/compliance-audit
- file: src/modules/compliance-audit/repository/compliance-audit.repository.ts
  where: docstring of listComplianceDeletions, line 307, and of listCurationActions, line 427
  evidence: UC-02 — list ComplianceDeletion rows newest-first with optional filters.
  cost: The prose restates the listing order, which the ORDER BY clauses hold (`ORDER BY executed_at DESC`,
    `ORDER BY created_at DESC`). The docstring is a second home outside behavior.
  node: rules/knowledge-base/audit-listing-order
- file: src/modules/compliance-audit/repository/compliance-audit.repository.ts
  where: docstring of listComplianceDeletions, lines 306-309 (line 427-428 for listCurationActions)
  evidence: "UC-02 — list ComplianceDeletion rows newest-first with optional filters.\n * BR-09: `executed_from`\
    \ inclusive, `executed_to` exclusive (semi-open)."
  cost: The prose states both the newest-first order and the half-open window, and the queries hold both
    (`ORDER BY executed_at DESC`, `executed_at >= $`, `executed_at < $`). The prose is a second home that
    can go stale against the nodes.
  node: rules/knowledge-base/audit-listing-window-half-open
- file: src/modules/compliance-audit/repository/compliance-audit.repository.ts
  where: docstring of tombstoneCascadedFragments, lines 105-111, against the UPDATE at lines 117-133
  evidence: "BR-06 — tombstones every fragment whose `fragment_source` chain anchors\n * ONLY chunks of\
    \ the deleted raw. Cross-source fragments survive."
  cost: The prose restates the propagation rule, and the paired UPDATE holds it with its EXISTS and NOT
    EXISTS predicates. The same applies to the link and attribute docstrings at lines 139-143 and 174-178.
    A second home for the rule sits outside behavior.
  node: rules/knowledge-base/compliance-deletion-propagates
- file: src/modules/compliance-audit/repository/compliance-audit.repository.ts
  where: docstring of tombstoneRawInformation, lines 45-61, sentence on content_hash (line 49) and the
    UPDATE at lines 67-74
  evidence: content_hash is intentionally left untouched (BR-04).
  cost: A comment restates the node's fact while the UPDATE holds it by never naming content_hash in its
    SET list. The prose is a second home that can go stale without any check noticing.
  node: rules/knowledge-base/compliance-deletion-keeps-content-hash
- file: src/modules/compliance-audit/repository/compliance-audit.repository.ts
  where: docstring of tombstoneRawInformation, lines 51-60, the [REDACTED] and original_input paragraphs
  evidence: The `[REDACTED]` literal is hardcoded — never read from config
  cost: The prose restates the redaction rule and the original_input treatment at length, while the UPDATE
    (`content = '[REDACTED]'`, `original_input = CASE WHEN original_input IS NULL THEN NULL ELSE '[REDACTED]'
    END`) holds them. The two homes will drift when the node moves.
  node: rules/knowledge-base/compliance-deletion-redacts-content
- file: src/modules/compliance-audit/routes/compliance-audit.routes.ts
  where: the docstring above handleZodError (lines 182-189) and the comments "Priority 1", "Priority 2"
    and "Priority 3" inside it (lines 197, 210, 239)
  evidence: // Priority 1 — explicit semi-open range refinement. // Priority 2 — required-field detection.
    // Priority 3 — `reason` length / trim violations.
  cost: The refusal order (time window, then missing field, then reason out of range, then other) is written
    out a second time as prose. The docstring above it lists only two "special-case mappings" and then
    a third bullet, so it already differs from the code. The comments stay in the file after the node
    binds, and a reader can take them for the place the order was decided.
  node: rules/knowledge-base/audit-filter-checks-order
- file: src/modules/compliance-audit/service/compliance-audit.service.ts
  where: the doc comment above REDACTED_LITERAL, lines 51-56
  evidence: "The literal `[REDACTED]` is hardcoded by spec (constraint #4 of TC-08:\n * \"[REDACTED] literal\
    \ is hardcoded in the service (not config); a Vitest test\n *  must pin its exact byte value\")."
  cost: The prose claims the literal is held "in the service". The redaction that runs is SQL in the repository
    (`SET content = '[REDACTED]'`), so a reader following the comment looks in the wrong file. The comment
    also cites a task constraint as though it were the authority for the value.
  node: rules/knowledge-base/compliance-deletion-redacts-content
- file: src/modules/compliance-audit/service/compliance-audit.service.ts
  where: the header comment, lines 7-11 (Transaction policy (BR-02))
  evidence: 'The CALLER (route or MCP handler) opens BEGIN / COMMIT / ROLLBACK and

    //     hands the live `client` to `complianceDelete`. Every DB statement of

    //     UC-01 runs on that same client; commit is reached only after BR-08 has

    //     written BOTH audit rows.'
  cost: The atomicity of a compliance deletion is written out in prose here, beside code that does not
    hold it. A reader who edits this comment, or the function, believes they changed the guarantee. The
    guarantee is actually in src/shared/pg-transaction.ts (`withTransaction`), which the route and the
    MCP toolset call.
  node: constraints/compliance-deletion-is-atomic
- file: src/modules/compliance-audit/service/errors.ts
  where: the header comment, lines 1-16, and the doc comments on ResourceNotFoundError (line 34) and InternalFailure
    (lines 54-59)
  evidence: "// Three families: //   - ResourceNotFoundError -> 404 / RESOURCE_NOT_FOUND //   - ValidationFailure\
    \     -> 422 / VALIDATION_*  (code set by the caller) //   - InternalFailure       -> 500 / SYSTEM_INTERNAL_ERROR\
    \ (BR-17 legacy-orphan alarm) and /** 404 — RESOURCE_NOT_FOUND. UC-01 alt 4a / UC-03 / UC-05. */ and\
    \ BR-17 mandates an\n * operational alarm (already emitted at the service layer) and a generic\n *\
    \ 500 to the client."
  cost: The status and code pairs the contract refuses with (404 RESOURCE_NOT_FOUND, 500 SYSTEM_INTERNAL_ERROR,
    422 VALIDATION_*) are written a second time as prose beside the classes that hold them. The comments
    also cite back-spec rules (BR-15 v1.4.0, BR-17, UC-01 alt 4a/4c) as their authority, so a reader can
    take that document to be where the taxonomy is decided instead of the node. When the node moves, these
    comments stay behind and read as current. The same header also claims what another file does (the
    shared `renderErrorEnvelope` mapper producing byte-identical envelopes on both transports). That is
    prose about code outside this file, and it is not evidence of anything here.
  node: contracts/knowledge-base/compliance-audit
unbound:
- src/modules/compliance-audit/index.ts
- src/modules/compliance-audit/service/transaction.ts
adopted: true
unheld:
- node: domain/knowledge-base/raw-information
  how: 'read on 1 file(s), and every judge answered `nowhere`: no file of the set holds this fact'
notes: 'Judged by 8 delegation(s), one per file; folded mechanically by trace.py --fold from the returns
  under siegard-reconcile/adopt-compliance-audit.returns/.

  Staged as an adoption of source no delivery wrote: 37 candidate node(s) were read on every file, and
  each cleared one is bound to the files whose judgment holds its fact.

  Candidates: 0 opened across 0 of 8 delegation(s); each return lists its own under `candidates_opened`.

  Unstated: 2 fact(s) the source states that no node holds, over 2 file(s), listed under `unstated`. They
  block no binding here and no rebind closes them — the route is the analysis that gives each fact a node.

  Restates: 15 place(s) where text in the source restates a node''s fact the code holds, over 7 file(s),
  listed under `restates`. The pair conforms, so none blocks a binding — the route is removing the text,
  and reconciling the file after.'
---

## Folded
This record was folded by `trace.py --fold` from the delegation returns under `siegard-reconcile/adopt-compliance-audit.returns/`, which are the evidence behind every entry above.
