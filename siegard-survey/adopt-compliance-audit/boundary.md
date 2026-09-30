---
contract_version: siegard-survey/1
target: backend
files:
  - src/modules/compliance-audit/dto/compliance-delete.dto.ts
  - src/modules/compliance-audit/dto/curation-action.dto.ts
  - src/modules/compliance-audit/index.ts
  - src/modules/compliance-audit/mcp/compliance-toolset.ts
  - src/modules/compliance-audit/repository/compliance-audit.repository.ts
  - src/modules/compliance-audit/routes/compliance-audit.routes.ts
read_outside_area:
  - src/modules/compliance-audit/service/errors.ts — to learn which status and code the three service error families that the routes and the tool re-raise actually carry
  - src/modules/compliance-audit/service/compliance-audit.service.ts — to learn which service calls the routes and the tool make, and in what order the repository functions run
  - src/shared/error-mapping.ts — to confirm the code-to-status table `renderErrorEnvelope` resolves for the codes the tool emits
  - src/mcp/server.ts, src/mcp/sdk-http-transport.ts — to confirm whether the MCP kernel checks a tool's input schema before the handler runs (it only turns the schema into a descriptor, so the handler's own parse is the only check)
---

## Facts

### Compliance deletion request
- A compliance deletion request carries two fields: the identifier of the raw information to delete and a reason. `src/modules/compliance-audit/dto/compliance-delete.dto.ts` (`ComplianceDeleteRequestSchema`).
- The raw information identifier must be a UUID. `src/modules/compliance-audit/dto/compliance-delete.dto.ts` (`UuidSchema`, `ComplianceDeleteRequestSchema.raw_information_id`).
- The reason is trimmed, then must be at least 1 and at most 1000 characters long. A reason of only whitespace is refused. `src/modules/compliance-audit/dto/compliance-delete.dto.ts` (`ReasonSchema`).
- The reason handed on to the deletion is the trimmed value, not the value as sent. `src/modules/compliance-audit/dto/compliance-delete.dto.ts` (`z.string().trim()`), `src/modules/compliance-audit/routes/compliance-audit.routes.ts` (`ComplianceDeleteRequestSchema.parse`), `src/modules/compliance-audit/mcp/compliance-toolset.ts` (`ComplianceDeleteRequestSchema.parse`).
- Unknown fields in a compliance deletion request are dropped silently, not refused. `src/modules/compliance-audit/dto/compliance-delete.dto.ts` (`z.object`, default strip).
- A REST compliance deletion with no body is checked as an empty object, so each missing field is refused as required. `src/modules/compliance-audit/routes/compliance-audit.routes.ts` (`request.body ?? {}`).
- Each compliance deletion runs inside one database transaction, on both REST and MCP. `src/modules/compliance-audit/routes/compliance-audit.routes.ts` (`withTransaction`), `src/modules/compliance-audit/mcp/compliance-toolset.ts` (`withTransaction`).
- A compliance deletion checks the request first. Only a request that passes reaches the transaction and the lookup of the raw information. `src/modules/compliance-audit/routes/compliance-audit.routes.ts` (POST `/compliance/deletions` handler), `src/modules/compliance-audit/mcp/compliance-toolset.ts` (`handler`).

### Compliance deletion answer
- A compliance deletion answers with an outcome and the compliance deletion record. `src/modules/compliance-audit/dto/compliance-delete.dto.ts` (`ComplianceDeleteResponseSchema`).
- A compliance deletion record carries an identifier, the raw information identifier, the reason, the execution time as a string, and the affected counts. `src/modules/compliance-audit/dto/compliance-delete.dto.ts` (`ComplianceDeletionSchema`).
- The affected counts are four non-negative integers: chunks, fragments, links and attributes. `src/modules/compliance-audit/dto/compliance-delete.dto.ts` (`ComplianceDeletionAffectedSchema`).
- On REST, the outcome `deleted` answers HTTP 201 and the outcome `noop_already_deleted` answers HTTP 200. `src/modules/compliance-audit/routes/compliance-audit.routes.ts` (`result.outcome === "deleted" ? 201 : 200`).
- On MCP, both outcomes are success answers `{ ok: true, result }`. Repeating a deletion is not an error. `src/modules/compliance-audit/mcp/compliance-toolset.ts` (`return { ok: true, result }`).
- On MCP, compliance deletion is the tool `compliance_delete` in the `curation` toolset. `src/modules/compliance-audit/mcp/compliance-toolset.ts` (`registerTool("curation", { name: "compliance_delete" })`).
- The tool's input schema is the compliance deletion request schema. `src/modules/compliance-audit/mcp/compliance-toolset.ts` (`inputSchema: ComplianceDeleteRequestSchema`), `src/modules/compliance-audit/index.ts` (re-export `ComplianceDeleteRequestSchema`).
- The tool is described to callers as "Tombstone a RawInformation under LGPD or owner request. Idempotent." `src/modules/compliance-audit/mcp/compliance-toolset.ts` (`description`).

### Compliance deletion effects on the source
- The raw information to delete is read and locked for the rest of the transaction, and its status is returned. `src/modules/compliance-audit/repository/compliance-audit.repository.ts` (`loadRawInformationForUpdate`, `FOR UPDATE`).
- Deleting a raw information replaces its content with the literal `[REDACTED]`. `src/modules/compliance-audit/repository/compliance-audit.repository.ts` (`tombstoneRawInformation`, `content = '[REDACTED]'`).
- Deleting a raw information replaces its original input with `[REDACTED]` when there was one. An original input that was empty (null) stays empty. `src/modules/compliance-audit/repository/compliance-audit.repository.ts` (`tombstoneRawInformation`, `CASE WHEN original_input IS NULL`).
- Deleting a raw information adds `compliance_deleted: true` to its metadata and keeps the other metadata keys. `src/modules/compliance-audit/repository/compliance-audit.repository.ts` (`metadata || jsonb_build_object('compliance_deleted', true)`).
- Deleting a raw information sets its status to `deleted` and its superseded time to the current time. `src/modules/compliance-audit/repository/compliance-audit.repository.ts` (`tombstoneRawInformation`, `status = 'deleted'`, `superseded_at = now()`).
- Deleting a raw information leaves its content hash unchanged. `src/modules/compliance-audit/repository/compliance-audit.repository.ts` (`tombstoneRawInformation`, `content_hash` absent from `SET`).
- The redaction, the metadata flag, the status and the superseded time are written in one statement. `src/modules/compliance-audit/repository/compliance-audit.repository.ts` (`tombstoneRawInformation`).

### Compliance deletion cascade
- Every current raw chunk of the deleted raw information (no superseded time) gets status `deleted` and a superseded time of now. The number of such chunks is the affected chunks count. `src/modules/compliance-audit/repository/compliance-audit.repository.ts` (`tombstoneRawChunksOfRaw`, `AND superseded_at IS NULL`).
- An information fragment is deleted when at least one of its source chunks belongs to the deleted raw information and none of its source chunks belongs to another raw information whose status is not `deleted`. `src/modules/compliance-audit/repository/compliance-audit.repository.ts` (`tombstoneCascadedFragments`, `EXISTS` / `NOT EXISTS` over `fragment_source`).
- A fragment that also rests on another raw information that is not deleted survives. `src/modules/compliance-audit/repository/compliance-audit.repository.ts` (`tombstoneCascadedFragments`, `ri.id &lt;&gt; $1 AND ri.status &lt;&gt; 'deleted'`).
- A fragment already `deleted` is neither touched nor counted. Each fragment that is deleted gets status `deleted`, a superseded time of now, and one count in the affected fragments. `src/modules/compliance-audit/repository/compliance-audit.repository.ts` (`tombstoneCascadedFragments`, `f.status &lt;&gt; 'deleted'`).
- A knowledge link is deleted when at least one of its provenance fragments rests on a chunk of the deleted raw information and none of its provenance fragments rests on a chunk of another raw information that is not deleted. `src/modules/compliance-audit/repository/compliance-audit.repository.ts` (`tombstoneCascadedLinks`).
- A knowledge link already `deleted` is not touched. Each link deleted gets status `deleted`, a superseded time of now, and one count in the affected links. `src/modules/compliance-audit/repository/compliance-audit.repository.ts` (`tombstoneCascadedLinks`, `kl.status &lt;&gt; 'deleted'`).
- A node attribute is deleted under the same provenance rule as a link: at least one provenance fragment rests on the deleted raw information and none rests on another raw information that is not deleted. `src/modules/compliance-audit/repository/compliance-audit.repository.ts` (`tombstoneCascadedAttributes`).
- A node attribute already `deleted` is not touched. Each attribute deleted gets status `deleted`, a superseded time of now, and one count in the affected attributes. `src/modules/compliance-audit/repository/compliance-audit.repository.ts` (`tombstoneCascadedAttributes`, `na.status &lt;&gt; 'deleted'`).
- The link and attribute cascades judge whether another source survives by that raw information's status only. They do not look at the status of the fragment or chunk in between. `src/modules/compliance-audit/repository/compliance-audit.repository.ts` (`tombstoneCascadedLinks`, `tombstoneCascadedAttributes`, `NOT EXISTS` clauses).

### Compliance deletion record
- A deletion writes one compliance deletion record with the raw information identifier, the reason and the four affected counts. The identifier and the execution time are assigned by the database and returned. `src/modules/compliance-audit/repository/compliance-audit.repository.ts` (`insertComplianceDeletion`, `RETURNING id, raw_information_id, reason, executed_at, affected`).
- When a raw information has more than one compliance deletion record, the lookup by raw information returns the one with the latest execution time. `src/modules/compliance-audit/repository/compliance-audit.repository.ts` (`findComplianceDeletionByRawId`, `ORDER BY executed_at DESC LIMIT 1`).
- A curation action record is written with an action name, a target kind, an optional target identifier, a JSON payload and an optional reason. Its identifier and creation time are assigned by the database. `src/modules/compliance-audit/repository/compliance-audit.repository.ts` (`insertCurationAction`, `RETURNING ... created_at`).

### Listing compliance deletions
- Compliance deletions can be filtered by raw information identifier (a UUID, exact match). `src/modules/compliance-audit/dto/compliance-delete.dto.ts` (`ListComplianceDeletionsQuerySchema.raw_information_id`), `src/modules/compliance-audit/repository/compliance-audit.repository.ts` (`listComplianceDeletions`, `raw_information_id = $n`).
- The execution-time window is half-open: the start bound is inclusive and the end bound exclusive. `src/modules/compliance-audit/repository/compliance-audit.repository.ts` (`listComplianceDeletions`, `executed_at &gt;= $n`, `executed_at &lt; $n`).
- Each execution-time bound must be an ISO 8601 date-time with a time zone, either `Z` or a numeric offset. `src/modules/compliance-audit/dto/compliance-delete.dto.ts` (`z.string().datetime({ offset: true })`).
- When both bounds are given, a start that is not earlier than the end is refused. Equal bounds are refused. The refusal is placed on the end bound. `src/modules/compliance-audit/dto/compliance-delete.dto.ts` (`superRefine`, `Date.parse(executed_from) &gt;= Date.parse(executed_to)`, `path: ["executed_to"]`).
- Page limit: an integer from 1 to 100, 50 when omitted. Page offset: an integer of 0 or more, 0 when omitted. Both are taken from text as numbers. `src/modules/compliance-audit/dto/compliance-delete.dto.ts` (`limit: z.coerce.number().int().min(1).max(100).default(50)`, `offset: ...min(0).default(0)`).
- Compliance deletions are listed newest first by execution time, with no tie-breaker. `src/modules/compliance-audit/repository/compliance-audit.repository.ts` (`listComplianceDeletions`, `ORDER BY executed_at DESC`).
- The total counts every compliance deletion that matches the filters, regardless of the page. `src/modules/compliance-audit/repository/compliance-audit.repository.ts` (`listComplianceDeletions`, `countSql` without `LIMIT`).
- The list answer carries the total, the limit, the offset and the items. `src/modules/compliance-audit/dto/compliance-delete.dto.ts` (`ComplianceDeletionListSchema`).
- Unknown query parameters are dropped silently. `src/modules/compliance-audit/dto/compliance-delete.dto.ts` (`z.object`, default strip).
- A successful list answers HTTP 200. `src/modules/compliance-audit/routes/compliance-audit.routes.ts` (GET `/compliance/deletions`, `reply.status(200)`).

### Reading one compliance deletion
- A compliance deletion is read by its identifier, which must be a UUID. `src/modules/compliance-audit/dto/compliance-delete.dto.ts` (`ComplianceDeletionIdParamSchema`), `src/modules/compliance-audit/repository/compliance-audit.repository.ts` (`findComplianceDeletionById`).
- The identifier format is checked before the lookup. A found record answers HTTP 200. `src/modules/compliance-audit/routes/compliance-audit.routes.ts` (GET `/compliance/deletions/:complianceDeletionId`).

### Listing curation actions
- Curation actions can be filtered by action name, by target kind (both closed lists) and by target identifier (a UUID). Each is an exact match. `src/modules/compliance-audit/dto/curation-action.dto.ts` (`ListCurationActionsQuerySchema`), `src/modules/compliance-audit/repository/compliance-audit.repository.ts` (`listCurationActions`).
- The creation-time window is half-open: the start bound is inclusive and the end bound exclusive. Each bound must be an ISO 8601 date-time with a time zone. `src/modules/compliance-audit/dto/curation-action.dto.ts` (`created_from`, `created_to`), `src/modules/compliance-audit/repository/compliance-audit.repository.ts` (`created_at &gt;= $n`, `created_at &lt; $n`).
- When both bounds are given, a start that is not earlier than the end is refused, and the refusal is placed on the end bound. `src/modules/compliance-audit/dto/curation-action.dto.ts` (`superRefine`, `path: ["created_to"]`).
- Page limit: an integer from 1 to 100, 50 when omitted. Page offset: an integer of 0 or more, 0 when omitted. `src/modules/compliance-audit/dto/curation-action.dto.ts` (`limit`, `offset`).
- Curation actions are listed newest first by creation time, with no tie-breaker. The total counts every match regardless of the page. `src/modules/compliance-audit/repository/compliance-audit.repository.ts` (`listCurationActions`, `ORDER BY created_at DESC`, `countSql`).
- A curation action as answered carries an identifier, an action name, a target kind, a target identifier (a UUID or null), a JSON payload, a reason (at most 1000 characters, or null) and a creation time. `src/modules/compliance-audit/dto/curation-action.dto.ts` (`CurationActionSchema`).
- The list answer carries the total, the limit, the offset and the items. A successful list answers HTTP 200. `src/modules/compliance-audit/dto/curation-action.dto.ts` (`CurationActionListSchema`), `src/modules/compliance-audit/routes/compliance-audit.routes.ts` (GET `/audit/curation-actions`).

### Reading one curation action
- A curation action is read by its identifier, which must be a UUID. The format is checked before the lookup, and a found record answers HTTP 200. `src/modules/compliance-audit/dto/curation-action.dto.ts` (`CurationActionIdParamSchema`), `src/modules/compliance-audit/routes/compliance-audit.routes.ts` (GET `/audit/curation-actions/:curationActionId`).

### What is exposed
- Of the five operations in this area, only compliance deletion writes. The other four only read. `src/modules/compliance-audit/routes/compliance-audit.routes.ts` (one `app.post`, four `app.get`).
- Compliance deletion is the only operation in this area offered on MCP. The two compliance deletion reads and the two curation action reads are REST only. `src/modules/compliance-audit/mcp/compliance-toolset.ts` (single `registerTool`), `src/modules/compliance-audit/index.ts`.

### Which validation code is chosen
- In every operation of this area, when the request fails its schema, one code is picked from all the issues in this order: (1) the from-before-to window marker gives `VALIDATION_OUT_OF_RANGE`; (2) otherwise a missing field gives `VALIDATION_REQUIRED_FIELD`, naming the first missing field; (3) otherwise a reason too short or too long gives `VALIDATION_OUT_OF_RANGE`; (4) anything else gives `VALIDATION_INVALID_FORMAT`. `src/modules/compliance-audit/routes/compliance-audit.routes.ts` (`handleZodError`), `src/modules/compliance-audit/mcp/compliance-toolset.ts` (`mapZodErrorToEnvelope`).
- A field counts as missing when its issue is a type mismatch where the value received was undefined. A field sent as null or with the wrong type is a format refusal. `src/modules/compliance-audit/routes/compliance-audit.routes.ts` (`handleZodError`, `received undefined`), `src/modules/compliance-audit/mcp/compliance-toolset.ts` (`mapZodErrorToEnvelope`).
- Every validation refusal lists each issue, with its dotted path and message, under `details.issues`. `src/modules/compliance-audit/routes/compliance-audit.routes.ts` (`zodIssuesAsDetails`), `src/modules/compliance-audit/mcp/compliance-toolset.ts` (`issues`).

## Answers
- Any operation (REST) — schema failure with the from-before-to window marker (start not earlier than end) → 422 `VALIDATION_OUT_OF_RANGE` ("Time range bounds must satisfy `from &lt; to`.", `details.issues`). `src/modules/compliance-audit/routes/compliance-audit.routes.ts` (`handleZodError`, priority 1).
- Any operation (REST) — no window marker, and a field missing → 422 `VALIDATION_REQUIRED_FIELD` ("Field '&lt;path&gt;' is required.", `details.issues`). `src/modules/compliance-audit/routes/compliance-audit.routes.ts` (`handleZodError`, priority 2).
- Compliance deletion (REST) — reason empty after trimming, or longer than 1000 characters, with no field missing → 422 `VALIDATION_OUT_OF_RANGE` ("Field 'reason' must be non-empty after trim and ≤ 1000 characters.", `details.issues`). `src/modules/compliance-audit/routes/compliance-audit.routes.ts` (`handleZodError`, priority 3).
- Any operation (REST) — any other schema failure: an identifier that is not a UUID, a bound that is not a date-time with a time zone, a limit outside 1–100, an offset below 0, a limit or offset that is not an integer, an unknown action name, an unknown target kind, a field of the wrong type or null → 422 `VALIDATION_INVALID_FORMAT` ("Request payload failed validation.", `details.issues`). `src/modules/compliance-audit/routes/compliance-audit.routes.ts` (`handleZodError`, fallback).
- Compliance deletion (MCP) — the same four validation cases, in the same priority → `VALIDATION_OUT_OF_RANGE` / `VALIDATION_REQUIRED_FIELD` / `VALIDATION_OUT_OF_RANGE` / `VALIDATION_INVALID_FORMAT`, with the same messages and `details.issues`, as a failure answer. The HTTP status is not used. `src/modules/compliance-audit/mcp/compliance-toolset.ts` (`mapZodErrorToEnvelope`, `.envelope`).
- Compliance deletion, reading one compliance deletion, reading one curation action (REST) — the service raises a not-found error → answered with that error's own status, code, message and details. `src/modules/compliance-audit/routes/compliance-audit.routes.ts` (`handleAuditError`, `ResourceNotFoundError`).
- Any operation (REST) — the service raises a validation error → answered with that error's own status, code, message and details. `src/modules/compliance-audit/routes/compliance-audit.routes.ts` (`handleAuditError`, `ValidationFailure`).
- Any operation (REST) — the service raises an internal failure → answered with that error's own status, code, message and details. `src/modules/compliance-audit/routes/compliance-audit.routes.ts` (`handleAuditError`, `InternalFailure`).
- Any operation (REST) — any other exception, whether during validation or during the operation → re-thrown to the framework's error handler. This area does not decide the answer. `src/modules/compliance-audit/routes/compliance-audit.routes.ts` (`handleZodError` `throw err`, `handleAuditError` `throw err`).
- Compliance deletion (MCP) — the service raises a not-found error, a validation error or an internal failure → failure answer with that error's code, message and details. `src/modules/compliance-audit/mcp/compliance-toolset.ts` (`renderErrorEnvelope(err.code, err.message, err.details)`).
- Compliance deletion (MCP) — any other exception during the deletion → `SYSTEM_INTERNAL_ERROR` ("Unexpected internal error."), with the cause withheld from the caller. `src/modules/compliance-audit/mcp/compliance-toolset.ts` (`renderErrorEnvelope("SYSTEM_INTERNAL_ERROR", "Unexpected internal error.")`).
- Compliance deletion (MCP) — an exception during validation that is not a schema error → re-thrown to the MCP kernel. This area does not decide the answer. `src/modules/compliance-audit/mcp/compliance-toolset.ts` (`throw err` in parse `catch`).
- Compliance deletion — the database returns no row after writing the compliance deletion record or the curation action record → internal invariant error, re-thrown (REST to the framework handler; MCP answers `SYSTEM_INTERNAL_ERROR`). `src/modules/compliance-audit/repository/compliance-audit.repository.ts` (`InvariantError` in `insertComplianceDeletion`, `insertCurationAction`).

## Vocabularies
- Compliance deletion outcome: `deleted`, `noop_already_deleted`. `src/modules/compliance-audit/dto/compliance-delete.dto.ts` (`ComplianceDeleteOutcomeSchema`).
- Curation action name (as accepted by the filter): `resolve_entity_match`, `merge_nodes`, `resolve_dispute`, `confirm_item`, `reject_item`, `correct_item`, `compliance_delete`. `src/modules/compliance-audit/dto/curation-action.dto.ts` (`CurationActionNameSchema`).
- Curation action target kind (as accepted by the filter): `node`, `link`, `attribute`, `fragment`, `raw_information`. `src/modules/compliance-audit/dto/curation-action.dto.ts` (`TargetKindSchema`).
- Raw information status (as the locking read types it): `active`, `needs_review`, `merged`, `deleted`. `src/modules/compliance-audit/repository/compliance-audit.repository.ts` (`RawInformationLockedRow.status`).
- Affected count keys of a compliance deletion: `chunks`, `fragments`, `links`, `attributes`. `src/modules/compliance-audit/dto/compliance-delete.dto.ts` (`ComplianceDeletionAffectedSchema`), `src/modules/compliance-audit/repository/compliance-audit.repository.ts` (`insertComplianceDeletion`, `jsonb_build_object`).
- Error codes this boundary emits itself: `VALIDATION_OUT_OF_RANGE`, `VALIDATION_REQUIRED_FIELD`, `VALIDATION_INVALID_FORMAT`, `SYSTEM_INTERNAL_ERROR`. `src/modules/compliance-audit/routes/compliance-audit.routes.ts` (`handleZodError`), `src/modules/compliance-audit/mcp/compliance-toolset.ts` (`mapZodErrorToEnvelope`, catch-all).

## Upstream artifacts
- Table `raw_information`. Read: `id`, `status`, locked. Written: `content`, `original_input`, `metadata`, `status`, `superseded_at`. Left alone: `content_hash`. `src/modules/compliance-audit/repository/compliance-audit.repository.ts` (`loadRawInformationForUpdate`, `tombstoneRawInformation`).
- Table `raw_chunk`. Read: `raw_information_id`, `superseded_at`. Written: `status`, `superseded_at`. `src/modules/compliance-audit/repository/compliance-audit.repository.ts` (`tombstoneRawChunksOfRaw`).
- Table `information_fragment`. Read and written: `status`, `superseded_at`. `src/modules/compliance-audit/repository/compliance-audit.repository.ts` (`tombstoneCascadedFragments`).
- Table `fragment_source` (`fragment_id`, `raw_chunk_id`), read only, to link fragments to chunks. `src/modules/compliance-audit/repository/compliance-audit.repository.ts` (`tombstoneCascadedFragments`, `tombstoneCascadedLinks`, `tombstoneCascadedAttributes`).
- Table `provenance` (`fragment_id`, `link_id`, `attribute_id`), read only, to link links and attributes to fragments. `src/modules/compliance-audit/repository/compliance-audit.repository.ts` (`tombstoneCascadedLinks`, `tombstoneCascadedAttributes`).
- Tables `knowledge_link` and `node_attribute`. Read and written: `status`, `superseded_at`. `src/modules/compliance-audit/repository/compliance-audit.repository.ts` (`tombstoneCascadedLinks`, `tombstoneCascadedAttributes`).
- Table `compliance_deletion` (`id`, `raw_information_id`, `reason`, `executed_at`, `affected` jsonb), inserted into and read. `id` and `executed_at` are filled by the database. `src/modules/compliance-audit/repository/compliance-audit.repository.ts` (`insertComplianceDeletion`, `findComplianceDeletionByRawId`, `findComplianceDeletionById`, `listComplianceDeletions`).
- Table `curation_action` (`id`, `action`, `target_kind`, `target_id`, `payload` jsonb, `reason`, `created_at`), inserted into and read. `id` and `created_at` are filled by the database. `src/modules/compliance-audit/repository/compliance-audit.repository.ts` (`insertCurationAction`, `findCurationActionById`, `listCurationActions`).
- The MCP server's `curation` toolset, where the compliance deletion tool is registered. `src/modules/compliance-audit/mcp/compliance-toolset.ts` (`deps.mcp.registerTool("curation", …)`).
- The shared failure-answer renderer, which turns a code, message and details into a failure answer. `src/modules/compliance-audit/mcp/compliance-toolset.ts` (`renderErrorEnvelope`).
- The compliance-audit service, which the routes and the tool call for each operation and whose errors they map. `src/modules/compliance-audit/routes/compliance-audit.routes.ts` (imports from `../service/compliance-audit.service.js`, `../service/errors.js`), `src/modules/compliance-audit/mcp/compliance-toolset.ts` (same imports).

## Outside the domain
- Transport paths `/compliance/deletions`, `/compliance/deletions/:complianceDeletionId`, `/audit/curation-actions`, `/audit/curation-actions/:curationActionId`: routing. `src/modules/compliance-audit/routes/compliance-audit.routes.ts`.
- Fastify registration, dependency interfaces and the transaction helper: wiring. `src/modules/compliance-audit/routes/compliance-audit.routes.ts`, `src/modules/compliance-audit/mcp/compliance-toolset.ts`.
- Log events `compliance_delete_internal_error` and `compliance_delete_tool_registered`: logging. `src/modules/compliance-audit/mcp/compliance-toolset.ts`.
- The module's public exports, including `REDACTED_LITERAL` and the re-export of the request schema for the tool descriptor: packaging. `src/modules/compliance-audit/index.ts`.
- The TypeScript row and argument interfaces and the parameter-numbering helper in the list queries: internal helpers. `src/modules/compliance-audit/repository/compliance-audit.repository.ts`.
- Row locking with `FOR UPDATE` as the concurrency mechanism: implementation (its observable effect is recorded above). `src/modules/compliance-audit/repository/compliance-audit.repository.ts`.
- The `VALIDATION_STATUS` constant name: an internal helper (its value 422 is recorded as an answer). `src/modules/compliance-audit/routes/compliance-audit.routes.ts`.

## Observed and not decided here
- A successful compliance deletion is answered in two shapes. REST sends the bare result `{ outcome, deletion }`: `src/modules/compliance-audit/routes/compliance-audit.routes.ts` (`reply.status(status).send(result)`). MCP wraps it as `{ ok: true, result }`: `src/modules/compliance-audit/mcp/compliance-toolset.ts` (`return { ok: true, result }`). Their failure answers share the shape `{ ok: false, error: { code, message, details } }`.
- An unexpected failure during a compliance deletion is answered in two ways. REST re-throws it to the framework's error handler: `src/modules/compliance-audit/routes/compliance-audit.routes.ts` (`handleAuditError` → `throw err`). MCP answers `SYSTEM_INTERNAL_ERROR` "Unexpected internal error." itself: `src/modules/compliance-audit/mcp/compliance-toolset.ts` (catch-all `renderErrorEnvelope`).
- Breaking a length or size bound gets two different codes depending on the field, in the same function. A reason outside 1–1000 characters gets `VALIDATION_OUT_OF_RANGE` (`i.path[0] === "reason"`), while a page limit outside 1–100 or an offset below 0 falls through to `VALIDATION_INVALID_FORMAT`: `src/modules/compliance-audit/routes/compliance-audit.routes.ts` (`handleZodError`), `src/modules/compliance-audit/mcp/compliance-toolset.ts` (`mapZodErrorToEnvelope`).
- The curation action vocabularies are closed in one place and open in another. The listing filter accepts only seven action names and five target kinds: `src/modules/compliance-audit/dto/curation-action.dto.ts` (`CurationActionNameSchema`, `TargetKindSchema`). The answered record declares both as free strings: `src/modules/compliance-audit/dto/curation-action.dto.ts` (`CurationActionSchema.action: z.string()`, `target_kind: z.string()`). The write path takes any string: `src/modules/compliance-audit/repository/compliance-audit.repository.ts` (`CurationActionInsertArgs.action: string`).
- The cascade uses two different tests for "already gone". Chunks are selected by having no superseded time: `src/modules/compliance-audit/repository/compliance-audit.repository.ts` (`tombstoneRawChunksOfRaw`, `superseded_at IS NULL`). Fragments, links and attributes are selected by status not `deleted`: `src/modules/compliance-audit/repository/compliance-audit.repository.ts` (`tombstoneCascadedFragments` / `Links` / `Attributes`, `status &lt;&gt; 'deleted'`).
- The lock read types raw information status as four values, `active`, `needs_review`, `merged`, `deleted`: `src/modules/compliance-audit/repository/compliance-audit.repository.ts` (`RawInformationLockedRow.status`). The cascades, though, treat every status other than `deleted` as a surviving source, including `merged` and `needs_review`: `src/modules/compliance-audit/repository/compliance-audit.repository.ts` (`ri.status &lt;&gt; 'deleted'`).
