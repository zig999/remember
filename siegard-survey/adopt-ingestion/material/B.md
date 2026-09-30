---
contract_version: siegard-survey/0-prototype
target: backend
files:
  - src/modules/ingestion/catalog/catalog.ts
  - src/modules/ingestion/mcp/directed-ingest.handler.ts
  - src/modules/ingestion/mcp/handler-base.ts
  - src/modules/ingestion/mcp/ingest-document.handler.ts
  - src/modules/ingestion/mcp/ingest-toolset.ts
  - src/modules/ingestion/mcp/mcp-schemas.ts
  - src/modules/ingestion/mcp/propose-attribute.handler.ts
  - src/modules/ingestion/mcp/propose-fragment.handler.ts
  - src/modules/ingestion/mcp/propose-link.handler.ts
  - src/modules/ingestion/mcp/propose-node.handler.ts
  - src/modules/ingestion/mcp/transport.ts
  - src/modules/ingestion/routes/ingestion.routes.ts
read_outside_area:
  - src/modules/ingestion/dto/source-type.ts — the values of the source-type enumeration that the ingest_document and ingest_directed schemas use
  - src/modules/ingestion/dto/llm-run.dto.ts — the run-status, validation-outcome and tool-name enumerations, the tool-call list query bounds, the retry body
  - src/modules/ingestion/service/llm-run.service.ts (lines 1-120) — the codes, statuses and details of RunNotRetryableError and RunNotRunningError
  - src/modules/ingestion/service/ingestion.service.ts (lines 1-90) — the code and details of ResourceNotFoundError, and the 201/200 intake statuses
  - src/shared/error-mapping.ts — the code-to-HTTP-status registry and the generic 503/500 envelopes used by the read-only ingest tools
  - src/middleware/error-handler.ts — what a ZodError thrown from a REST route becomes (status, code, details shape)
---

## Facts

### Catalog snapshot (node types, link types, link rules, attribute keys, closed value domains)
- The catalog is read once, as a whole snapshot, from node_type, link_type, link_type_rule, attribute_key and attribute_valid_value. Later changes to those tables are not seen until the snapshot is loaded again. `src/modules/ingestion/catalog/catalog.ts` (`loadCatalog`).
- Node types and link types are looked up by exact name and by id. `src/modules/ingestion/catalog/catalog.ts` (`buildSnapshot`, `nodeTypeByName`, `linkTypeByName`).
- An attribute key belongs to one node type. It is looked up by the pair (node type id, key) and also by its own id. `src/modules/ingestion/catalog/catalog.ts` (`attributeKeyCacheKey`, `attributeKeyByNodeTypeAndKey`, `attributeKeyById`).
- A link type carries the flags is_temporal, allows_multiple_current, requires_valid_from and requires_valid_to_on_change. `src/modules/ingestion/catalog/catalog.ts` (`LinkTypeRow`).
- An attribute key carries value_type, is_temporal, allows_multiple_current and requires_valid_from. `src/modules/ingestion/catalog/catalog.ts` (`AttributeKeyRow`).
- An attribute key's value domain is open when it has no allowed-value rows, or an empty set. It is closed when it has one or more allowed values, and then only those values apply. `src/modules/ingestion/catalog/catalog.ts` (`domainOf`).
- A link rule is active for a (source node type, link type, target node type) triple when some rule matches all three and today, taken as a UTC calendar date, falls in its window [valid_from, valid_to). A null bound is unbounded: today < valid_from excludes the rule, today >= valid_to excludes it. `src/modules/ingestion/catalog/catalog.ts` (`isLinkRuleActive`, `stripTime`).
- Every link rule is held in the snapshot. The date filter runs at lookup time, so a rule that expires after loading stops counting without a reload. `src/modules/ingestion/catalog/catalog.ts` (`isLinkRuleActive`).

### The four proposal tools over MCP (propose_fragment, propose_node, propose_link, propose_attribute)
- Each MCP proposal tool takes its business input plus a required llm_run_id: a string of at least one character. It is not checked as a UUID. `src/modules/ingestion/mcp/mcp-schemas.ts` (`LlmRunIdField`, `Propose*McpInputSchema`).
- Order of checks for every MCP proposal tool: (1) the whole tool schema, business fields and llm_run_id together, is parsed first; (2) the run must exist; (3) the run must be in status running; (4) the business service runs. `src/modules/ingestion/mcp/ingest-toolset.ts` (lines 143-153, 168-178, 194-204, 221-231); `src/modules/ingestion/mcp/handler-base.ts` (`assertRunIsRunning`, lines 108-121); `src/modules/ingestion/mcp/propose-*.handler.ts` (`run` closure).
- One failed schema parse yields one VALIDATION_INVALID_FORMAT answer that lists every issue, a missing llm_run_id and malformed business fields alike. `src/modules/ingestion/mcp/ingest-toolset.ts` (`runZodFailureAudit`).
- A missing run is refused before a run that is not running (the not-found check is at line 108, the status check at line 115). Both come before any business validation. `src/modules/ingestion/mcp/handler-base.ts` (`assertRunIsRunning`).
- Each proposal runs in one transaction. If it succeeds, a tool-call audit row is written in the same transaction, holding the tool name, the arguments (the business input without llm_run_id), the result and a validation outcome. `src/modules/ingestion/mcp/handler-base.ts` (`runIngestHandler`, `insertToolCall`).
- When a validation refusal is raised, the business transaction rolls back. The audit row is then written in a separate transaction with outcome rejected, and its result is the error answer itself. `src/modules/ingestion/mcp/handler-base.ts` (`safeWriteAuditOnRollback`, `"rejected"`).
- When any other error occurs, the transaction rolls back and an audit row is written with outcome error. `src/modules/ingestion/mcp/handler-base.ts` (`"error"`).
- A failure to write the audit row is swallowed. The caller still receives the original answer. `src/modules/ingestion/mcp/handler-base.ts` (`safeWriteAuditOnRollback` catch).
- When the MCP schema parse fails, the audit row records the raw arguments exactly as sent. The run is taken from the raw llm_run_id if that is a string, otherwise from the empty string. If no run matches, the audit write fails and is swallowed, so no audit row exists. `src/modules/ingestion/mcp/ingest-toolset.ts` (`extractLlmRunIdFromRaw`, `runZodFailureAudit`).
- The audit outcome of a successful proposal comes from result.outcome, or from result.resolution when outcome is absent. rejected, consolidated, superseded_previous, disputed, needs_review and uncertain are recorded as themselves. Every other tag, or no tag, is recorded as accepted. `src/modules/ingestion/mcp/handler-base.ts` (`deriveValidationOutcome`).
- When the business service returns an ok:false answer instead of raising a refusal, the audit outcome is rejected and the transaction commits. `src/modules/ingestion/mcp/propose-*.handler.ts` (`if (!envelope.ok)`).
- The service proposals are scoped to the run's input source. The run's input_raw_information_id is passed to the service as the source. `src/modules/ingestion/mcp/propose-*.handler.ts` (`rawInformationId: run.input_raw_information_id`).
- propose_link and propose_attribute receive a clock ("now") and the catalog. propose_node receives the catalog only. propose_fragment receives neither. `src/modules/ingestion/mcp/ingest-toolset.ts` (handler wiring).

### ingest_document (one-shot ingestion with server-side extraction)
- Input: content, a string of 1 to 10×1024×1024 characters, required; source_type from the source-type enumeration, required; metadata, an optional free-form object; model, an optional non-empty string; prompt_version, an optional non-empty string. It takes no llm_run_id. `src/modules/ingestion/mcp/mcp-schemas.ts` (`IngestDocumentMcpInputSchema`).
- Defaults: metadata is {}, storage_ref is null, model is the caller's value or else the server's configured ingest model or else "claude-sonnet-4-6", prompt_version is the caller's value or else the server's default prompt version. `src/modules/ingestion/mcp/ingest-document.handler.ts` (`body`, `DEFAULT_INGEST_MODEL`).
- Order: (1) the schema parse; a failure answers at once and writes no audit row, because no run exists yet. (2) The source, its chunks and a running run are persisted and committed. (3) If the same content was already ingested, no extraction runs. (4) Otherwise the server-side extraction runs over the new run. `src/modules/ingestion/mcp/ingest-toolset.ts` (lines 253-268); `src/modules/ingestion/mcp/ingest-document.handler.ts` (Steps 1-3).
- Already-ingested content is a success, not an error. It answers outcome "already_ingested" with raw_information_id, llm_run_id, chunk_count, the existing run's run_status (null when it cannot be read) and a message. The message differs depending on whether the run status is completed. `src/modules/ingestion/mcp/ingest-document.handler.ts` (`outcome === "noop_existing"`).
- A new ingestion answers outcome "ingested" with raw_information_id, llm_run_id, chunk_count and the extraction's run summary. `src/modules/ingestion/mcp/ingest-document.handler.ts` (Step 3).

### ingest_directed (deterministic ingestion without an LLM)
- Input: fragments, at least 1, each with ref (1 to 120 characters) and text (1 to 1000 characters). nodes, at least 1, each with ref, node_type (non-empty), name (1 to 500 characters), optional node_id (UUID) and optional aliases (each 1 to 500 characters). attributes, optional, each with node_ref, key (non-empty), value, evidence_ref, optional valid_from and optional valid_from_basis. links, optional, each with source_ref, target_ref, link_type (non-empty), evidence_ref, optional valid_from and optional valid_from_basis. source_label, optional, 1 to 200 characters. `src/modules/ingestion/mcp/mcp-schemas.ts` (`IngestDirectedMcpInputSchema` and its item schemas).
- An attribute value is one of: a string of 1 to 2000 characters, a finite number, or a boolean. `src/modules/ingestion/mcp/mcp-schemas.ts` (`IngestDirectedAttributeValueSchema`).
- valid_from must match YYYY-MM-DD (checked by pattern only). valid_from_basis accepts only stated or document. `src/modules/ingestion/mcp/mcp-schemas.ts` (`IngestDirectedIsoDateSchema`, `IngestDirectedValidFromBasisSchema`).
- No item accepts a confidence field. The directed schemas declare no confidence. `src/modules/ingestion/mcp/mcp-schemas.ts` (item schemas).
- The tool takes no llm_run_id. The parse runs first, and a failure answers without calling the service and without an audit row. `src/modules/ingestion/mcp/directed-ingest.handler.ts` (Step 1).
- When invoked with a context, the verbatim source excerpt is passed on as the text to store. A conversation pointer is passed on only when both conversation_id and message_id are strings; a partial pointer is dropped. `src/modules/ingestion/mcp/directed-ingest.handler.ts` (`sourceExcerpt`, `metadataPointer`).
- The service's answer, success or failure, is passed to the caller unchanged. `src/modules/ingestion/mcp/directed-ingest.handler.ts` (`return envelope`).

### Read-only operational tools (health, get_ingestion_status, list_recent_ingestions)
- health takes no arguments and always answers ok:true. The health report is the result. `src/modules/ingestion/mcp/ingest-toolset.ts` (`health`).
- get_ingestion_status takes llm_run_id as a UUID and answers with that run: id, model, prompt_version, started_at, finished_at (nullable), status, attempts (at least 1), input_raw_information_id, idempotency_key (64 lowercase hex characters), a summary of per-outcome counts (accepted, consolidated, superseded_previous, needs_review, uncertain, disputed, rejected, error, orphaned_fragments, each a non-negative integer) and optional affected_nodes (each with id, canonical_name, node_type). `src/modules/ingestion/mcp/mcp-schemas.ts` (`GetIngestionStatusMcpInputSchema`, `GetIngestionStatusOutputSchema`); `src/modules/ingestion/mcp/ingest-toolset.ts`.
- The affected nodes are attached only when the run is completed. `src/modules/ingestion/service/llm-run.service.ts` (`getLlmRunById`, `row.status === "completed"`) — read outside the area.
- list_recent_ingestions takes limit, an integer from 1 to 50, default 10, and answers { items }. `src/modules/ingestion/mcp/mcp-schemas.ts` (`ListRecentIngestionsMcpInputSchema`); `src/modules/ingestion/mcp/ingest-toolset.ts`.
- These tools write no audit row. `src/modules/ingestion/mcp/ingest-toolset.ts` (no `runIngestHandler`).

### MCP ingest toolset surface
- The ingest toolset registers propose_fragment, propose_node, propose_link, propose_attribute, ingest_document, ingest_directed, health, get_ingestion_status and list_recent_ingestions. `src/modules/ingestion/mcp/ingest-toolset.ts` (`registerIngestToolset`).
- The endpoint lists only the tools named in its allowed-names list that are also registered. An allowed name that is not registered is left out without notice. `src/modules/ingestion/mcp/transport.ts` (`getTools` filter).

### REST: POST raw-information (source intake)
- The body is parsed with the intake request schema. A new source answers 201. Content already ingested answers 200. Both answer raw_information_id, llm_run_id, chunk_count and outcome. `src/modules/ingestion/routes/ingestion.routes.ts` (`/raw-information`); `src/modules/ingestion/service/ingestion.service.ts` (`IngestRawInformationResult`) — read outside the area.

### REST: reading sources, chunks, runs and tool calls
- GET a source by id and GET its chunks: the id must be a UUID. `src/modules/ingestion/routes/ingestion.routes.ts` (`RawInformationIdParamSchema`).
- GET a run by id: the id must be a UUID. `src/modules/ingestion/routes/ingestion.routes.ts` (`LlmRunIdParamSchema`).
- GET a run's tool calls: limit is coerced to an integer from 1 to 100, default 50. offset is coerced to an integer of at least 0, default 0. The answer holds total, limit, offset and items. `src/modules/ingestion/dto/llm-run.dto.ts` (`ListToolCallsQuerySchema`, `ListToolCallsResponseSchema`); `src/modules/ingestion/routes/ingestion.routes.ts`.
- Order for the tool-call list: the path id is parsed first (line 249), then the query (line 250), then the lookup. `src/modules/ingestion/routes/ingestion.routes.ts`.

### REST: POST run (synchronous extraction trigger)
- The body must be empty or {}. Any field is refused because the schema is strict. The route exists only when both the catalog and the Anthropic key are configured. Order: the path id (line 287), then the body (line 290), then the extraction. `src/modules/ingestion/routes/ingestion.routes.ts` (`RunLlmExtractionRequestSchema`, `/llm-runs/:llmRunId/run`).

### REST: POST retry
- The body may be empty. It holds an optional reason of at most 500 characters. On success the route answers 200 with the run. Order: the path id (line 363), then the body (line 365), then the retry. `src/modules/ingestion/routes/ingestion.routes.ts` (`/llm-runs/:llmRunId/retry`); `src/modules/ingestion/dto/llm-run.dto.ts` (`RetryLlmRunRequestSchema`).

### REST: the four propose routes (propose-fragment, propose-node, propose-link, propose-attribute)
- The run is named in the URL and must be a UUID. The body is the business input, with no llm_run_id. `src/modules/ingestion/routes/ingestion.routes.ts` (propose-* routes).
- Order: the path id (line 432 and equivalents), then the body (line 433), then, inside one transaction, the run must exist (line 515), then it must be running (line 518), then the service runs. `src/modules/ingestion/routes/ingestion.routes.ts` (`handleProposeMirror`).
- A refusal raised by the service rolls the transaction back and answers HTTP 200 with { ok:false, error:{code, message, details} }. A service answer, ok:true or ok:false, is sent unchanged with HTTP 200 and the transaction commits. `src/modules/ingestion/routes/ingestion.routes.ts` (`handleProposeMirror`, `ProposeMirrorEnvelopeReject`).
- The REST propose routes write no tool-call audit row. `src/modules/ingestion/routes/ingestion.routes.ts` (`handleProposeMirror` — no audit insert).
- propose-node, propose-link and propose-attribute exist only when a catalog is configured. propose-fragment always exists. `src/modules/ingestion/routes/ingestion.routes.ts` (`if (deps.catalog !== undefined)`).

## Answers
- MCP propose_* — the schema parse fails (including a missing or empty llm_run_id) → isError `VALIDATION_INVALID_FORMAT` ("MCP tool args failed Zod parse.", details { issues:[{path, message}] }); a rejected audit row is attempted. `src/modules/ingestion/mcp/ingest-toolset.ts` (`runZodFailureAudit`).
- MCP propose_* — the llm_run_id matches no run → isError `RESOURCE_NOT_FOUND` (details { llm_run_id }); a rejected audit row is written. `src/modules/ingestion/mcp/handler-base.ts` (`assertRunIsRunning`).
- MCP propose_* — the run exists but is not running → isError `BUSINESS_RUN_NOT_RUNNING` (message naming the status; details { llm_run_id, status }); a rejected audit row is written. `src/modules/ingestion/mcp/handler-base.ts` (`assertRunIsRunning`).
- MCP propose_* — the service raises a validation refusal → isError with that refusal's code, message and details; the transaction rolls back; a rejected audit row is written. `src/modules/ingestion/mcp/handler-base.ts` (`validationFailure`).
- MCP propose_* — any other error → isError `SYSTEM_INTERNAL_ERROR` ("Internal error in MCP handler.", no details); an audit row with outcome error is written. `src/modules/ingestion/mcp/handler-base.ts` (`internalError`).
- ingest_document — the schema parse fails → isError `VALIDATION_INVALID_FORMAT` ("ingest_document arguments failed validation.", details { issues }); no audit row. `src/modules/ingestion/mcp/ingest-toolset.ts` (`ingest_document`).
- ingest_document — intake fails because the database is unavailable → isError `SYSTEM_SERVICE_UNAVAILABLE` ("A backing service is temporarily unavailable."). `src/modules/ingestion/mcp/ingest-document.handler.ts` (`pgDown`).
- ingest_document — intake fails for any other reason → isError `SYSTEM_INTERNAL_ERROR` ("Failed to persist the document before extraction.", no details). `src/modules/ingestion/mcp/ingest-document.handler.ts`.
- ingest_document — the extraction fails on a provider fatal or an extraction fatal → isError with the error's own code (details { llm_run_id, raw_information_id, partial_run }). `src/modules/ingestion/mcp/ingest-document.handler.ts` (`LlmProviderFatalError`, `ExtractionFatalError`).
- ingest_document — the extraction fails in any other way → isError `SYSTEM_INTERNAL_ERROR` ("Unexpected error during document ingestion.", details { llm_run_id, raw_information_id }). `src/modules/ingestion/mcp/ingest-document.handler.ts`.
- ingest_directed — the schema parse fails → isError `VALIDATION_INVALID_FORMAT` ("ingest_directed arguments failed validation.", details { issues }); the service is not called. `src/modules/ingestion/mcp/directed-ingest.handler.ts` (Step 1).
- ingest_directed — the service throws unexpectedly → isError `SYSTEM_INTERNAL_ERROR` ("Unexpected error during directed ingestion.", no details). `src/modules/ingestion/mcp/directed-ingest.handler.ts` (catch).
- get_ingestion_status / list_recent_ingestions — the schema parse fails (llm_run_id not a UUID; limit not an integer in 1..50) → isError `VALIDATION_INVALID_FORMAT` ("Request payload failed validation.", details a bare array of {path, message}). `src/modules/ingestion/mcp/ingest-toolset.ts` (`mapReadError`).
- get_ingestion_status — the run is not found → isError `RESOURCE_NOT_FOUND` (details { entity:"llm_run", id }). `src/modules/ingestion/mcp/ingest-toolset.ts` (`mapReadError`).
- get_ingestion_status / list_recent_ingestions — the database is unavailable → isError `SYSTEM_SERVICE_UNAVAILABLE`; any other error → isError `SYSTEM_INTERNAL_ERROR` ("Internal server error."). `src/modules/ingestion/mcp/ingest-toolset.ts` (`mapReadError`); `src/shared/error-mapping.ts`.
- REST, any route — a path id that is not a UUID, a body failing its schema, a query failing its schema, or a field in the run body → 422 `VALIDATION_INVALID_FORMAT` ("Request payload failed validation.", details a bare array of {path, message}). `src/modules/ingestion/routes/ingestion.routes.ts` (`.parse`); `src/middleware/error-handler.ts` (`classify`).
- REST GET source / chunks / run / tool calls — the entity is not found → 404 `RESOURCE_NOT_FOUND` (details { entity, id }). `src/modules/ingestion/routes/ingestion.routes.ts`.
- REST POST run — the run is not found → 404 `RESOURCE_NOT_FOUND` (details { entity, id }). `src/modules/ingestion/routes/ingestion.routes.ts`.
- REST POST run — the run cannot be run → 409 with the error's code (details { llm_run_id, current_status }); the code is registered as `BUSINESS_RUN_NOT_RUNNABLE`, but the class itself was not read. `src/modules/ingestion/routes/ingestion.routes.ts` (`RunNotRunnableError`); `src/shared/error-mapping.ts`.
- REST POST run — the LLM provider fails fatally → 502 with the error's code (details { llm_run_id, partial_run }). `src/modules/ingestion/routes/ingestion.routes.ts` (`LlmProviderFatalError`).
- REST POST run — the extraction fails fatally → 500 with the error's code (details { llm_run_id, partial_run }). `src/modules/ingestion/routes/ingestion.routes.ts` (`ExtractionFatalError`).
- REST POST retry — the run is not found → 404 `RESOURCE_NOT_FOUND`. `src/modules/ingestion/routes/ingestion.routes.ts`.
- REST POST retry — the run is running or completed → 409 `BUSINESS_RUN_NOT_RETRYABLE` (details { llm_run_id, current_status }). `src/modules/ingestion/routes/ingestion.routes.ts`; `src/modules/ingestion/service/llm-run.service.ts` (`RunNotRetryableError`).
- REST propose-* — the run is not found → 404 `RESOURCE_NOT_FOUND` (details { entity:"llm_run", id }). `src/modules/ingestion/routes/ingestion.routes.ts` (`handleProposeMirror`).
- REST propose-* — the run is completed or failed → 409 `BUSINESS_RUN_NOT_RUNNING` (details { llm_run_id, current_status }). `src/modules/ingestion/routes/ingestion.routes.ts`; `src/modules/ingestion/service/llm-run.service.ts` (`RunNotRunningError`).
- REST propose-* — the service raises a validation refusal → 200 { ok:false } with that refusal's code, message and details; the transaction rolls back. `src/modules/ingestion/routes/ingestion.routes.ts` (`ProposeMirrorEnvelopeReject`).
- REST, any route — the database is unavailable → 503 `SYSTEM_SERVICE_UNAVAILABLE`; any other error → 500 `SYSTEM_INTERNAL_ERROR`. `src/middleware/error-handler.ts` (`classify`).

## Vocabularies
- Source type: pdf, email, ata, chat, artigo, transcricao, outro. `src/modules/ingestion/dto/source-type.ts`.
- Run status: running, completed, failed. `src/modules/ingestion/dto/llm-run.dto.ts`; `src/modules/ingestion/mcp/mcp-schemas.ts` (`GetIngestionStatusOutputSchema.status`).
- Validation outcome (tool-call audit): accepted, consolidated, superseded_previous, needs_review, uncertain, disputed, rejected, error. `src/modules/ingestion/dto/llm-run.dto.ts`.
- Audited ingest tool name: propose_fragment, propose_node, propose_link, propose_attribute. `src/modules/ingestion/mcp/mcp-schemas.ts` (`INGEST_TOOL_NAMES`); `src/modules/ingestion/dto/llm-run.dto.ts` (`IngestToolNameSchema`).
- ingest_document outcome: ingested, already_ingested. `src/modules/ingestion/mcp/ingest-document.handler.ts`.
- Directed valid_from basis accepted from callers: stated, document. `src/modules/ingestion/mcp/mcp-schemas.ts`.
- Attribute value type: date, number, text, bool. `src/modules/ingestion/catalog/catalog.ts` (`AttributeKeyRow.value_type`).
- Result tags collapsed to accepted in the audit: accepted, matched_existing, created_new, proposed, or no tag. `src/modules/ingestion/mcp/handler-base.ts` (`deriveValidationOutcome`).

## Upstream artifacts
- node_type (id, name, description), link_type (id, name and the four flags), link_type_rule (link_type_id, source/target node type ids, valid_from, valid_to) and attribute_key (id, node_type_id, key, value_type and three flags), all read into the catalog snapshot. `src/modules/ingestion/catalog/catalog.ts`.
- attribute_valid_value (attribute_key_id, value) is read only here; the code puts the table under the knowledge-graph domain. `src/modules/ingestion/catalog/catalog.ts` (`loadCatalog`).
- The run row (llm_run) is read for existence, status and input_raw_information_id. `src/modules/ingestion/mcp/handler-base.ts`; `src/modules/ingestion/routes/ingestion.routes.ts`.
- Tool-call audit rows (tool_call) are written with llm_run_id, tool_name, arguments, result and validation_outcome. `src/modules/ingestion/mcp/handler-base.ts`.
- The Anthropic API, through the server's ANTHROPIC_API_KEY, is used by the server-side extraction that ingest_document and REST POST run drive. `src/modules/ingestion/mcp/ingest-document.handler.ts`; `src/modules/ingestion/routes/ingestion.routes.ts`.
- These SQLSTATEs and errnos are classified as "database unavailable": 57P03, 57014, 08000, 08003, 08006, ECONNREFUSED, ETIMEDOUT, ENOTFOUND, ECONNRESET. `src/shared/error-mapping.ts` — read outside the area.
- directedIngestionService, runLlmExtraction, ingestRawInformation and the four propose services (all in service/, outside this area) own the business behavior these transports delegate to. `src/modules/ingestion/mcp/*.ts`; `src/modules/ingestion/routes/ingestion.routes.ts`.

## Outside the domain
- Transport paths: POST /mcp/ingest; REST under /raw-information and /llm-runs/:llmRunId/{run,retry,tool-calls,propose-*}. `src/modules/ingestion/mcp/transport.ts`; `src/modules/ingestion/routes/ingestion.routes.ts`.
- MCP server name "remember-bff-ingest" and version "0.1.0". `src/modules/ingestion/mcp/transport.ts`.
- 11 MiB body limit on POST raw-information. `src/modules/ingestion/routes/ingestion.routes.ts` (`POST_INGEST_BODY_LIMIT`).
- Registering a tool twice throws; the registry is wired once. `src/modules/ingestion/mcp/ingest-toolset.ts`.
- Log events (ingest_toolset_registered, mcp_handler_internal_error, tool_call_audit_write_failed, ingest_document_*, ingest_directed_unexpected_error, ingest_raw_information_ok, llm_run_retried, propose_node_link_attribute_mirrors_skipped_no_catalog). Various files.
- Test seams: anthropicFactory, ingestRaw, runExtraction, readRunStatus, directedIngestion, the propose* and verifyNodePin overrides, buildSnapshot. Various files.
- The build*Handler factories in the propose-*.handler.ts files, which parse the business schema without llm_run_id. The toolset does not use them. `src/modules/ingestion/mcp/propose-*.handler.ts`.
- The ASCII unit-separator key format for attribute lookups. `src/modules/ingestion/catalog/catalog.ts` (`attributeKeyCacheKey`).
- Rendering the logical answer as MCP content/isError. `src/modules/ingestion/mcp/transport.ts` (`mountMcpEndpoint`).

## Observed and not decided here
- The two transports audit proposals differently. MCP propose_* writes a tool-call audit row on success, on refusal and on error (`src/modules/ingestion/mcp/handler-base.ts` `runIngestHandler`). REST propose-* writes none (`src/modules/ingestion/routes/ingestion.routes.ts` `handleProposeMirror`).
- A service refusal answers differently on the two transports. REST propose-* sends HTTP 200 with ok:false (`src/modules/ingestion/routes/ingestion.routes.ts` `reply.status(200).send(err.envelope)`). The shared registry maps the same codes to 4xx, for example `BUSINESS_LINK_RULE_VIOLATION: 422` (`src/shared/error-mapping.ts` `codeToHttpStatus`).
- The "run not found" details differ. MCP propose_* sends `{ llm_run_id }` (`src/modules/ingestion/mcp/handler-base.ts`). REST propose-* sends `{ entity:"llm_run", id }` (`src/modules/ingestion/routes/ingestion.routes.ts`).
- The "run not running" details differ. MCP sends `{ llm_run_id, status }` (`src/modules/ingestion/mcp/handler-base.ts`). REST sends `{ llm_run_id, current_status }` (`src/modules/ingestion/routes/ingestion.routes.ts`).
- The run id format differs. MCP propose_* accepts any non-empty string (`z.string().min(1)`, `src/modules/ingestion/mcp/mcp-schemas.ts` `LlmRunIdField`). REST propose-* and get_ingestion_status require a UUID (`src/modules/ingestion/routes/ingestion.routes.ts` `LlmRunIdParamSchema`; `mcp-schemas.ts` `GetIngestionStatusMcpInputSchema`). What a non-UUID MCP id produces at the run lookup was not read.
- The details of VALIDATION_INVALID_FORMAT take two shapes. Some answers send `{ issues:[…] }`: `src/modules/ingestion/mcp/ingest-toolset.ts` (`runZodFailureAudit`, `ingest_document`) and `src/modules/ingestion/mcp/directed-ingest.handler.ts`. Others send a bare array: `src/modules/ingestion/mcp/ingest-toolset.ts` (`mapReadError`) and `src/middleware/error-handler.ts` (`classify`).
- When a proposal service returns an ok:false answer instead of raising a refusal, the audit records rejected, but `runIngestHandler` returns `{ ok: true, result: outcome.result }` with the error envelope as the result. The MCP caller then receives ok:true wrapping ok:false. REST propose-* passes the same ok:false answer through unwrapped. `src/modules/ingestion/mcp/propose-*.handler.ts` (`if (!envelope.ok)`); `src/modules/ingestion/mcp/handler-base.ts` (line 204); `src/modules/ingestion/routes/ingestion.routes.ts` (`reply.status(200).send(envelope)`).
- The toolset's dependencies declare a `CHAT_INGEST_ENABLED` switch for a tool called start_async_ingestion, and `StartAsyncIngestionMcpInputSchema` is declared (`src/modules/ingestion/mcp/ingest-toolset.ts` `IngestToolsetDeps.env`; `src/modules/ingestion/mcp/mcp-schemas.ts`). `registerIngestToolset` never reads the switch and registers no such tool (`src/modules/ingestion/mcp/ingest-toolset.ts`).
