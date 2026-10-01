---
type: api
direction: published
operations:
- ingest-raw-information
- read-raw-information
- list-raw-chunks
- read-llm-run
- list-tool-calls
- run-extraction
- retry-llm-run
- propose-fragment
- propose-node
- propose-link
- propose-attribute
- ingest-document
- ingest-directed
- list-recent-ingestions
answers:
- operation: ingest-raw-information
  accepted: HTTP 201 with outcome created, the raw information's identity and content hash, its chunk count and each chunk's identity, index and offsets, and the opened run's identity and idempotency key; HTTP 200 with outcome noop_existing, the held raw information's identity, content hash and chunk count, no chunks, and the run opened for that content under the model and prompt version the request names
  refusals:
  - rule: rules/knowledge-base/content-length
    answer: HTTP 422, error code VALIDATION_INVALID_FORMAT, listing each failing field with its path and message
  - rule: rules/knowledge-base/original-input-length
    answer: HTTP 422, error code VALIDATION_INVALID_FORMAT, listing each failing field with its path and message
  - when: The request names no source type of the closed set, or no model or prompt version.
    answer: HTTP 422, error code VALIDATION_INVALID_FORMAT, listing each failing field with its path and message
  - when: Held content is sent under a model or prompt version for which no LLM run was opened.
    answer: HTTP 500, error code SYSTEM_INTERNAL_ERROR
- operation: read-raw-information
  accepted: HTTP 200 carrying the raw information's identity, source type, content, storage reference, content hash, reception time and metadata
  refusals:
  - &id001
    when: A named identity is not a well-formed identifier.
    answer: HTTP 422, error code VALIDATION_INVALID_FORMAT, listing each failing field with its path and message
  - when: No raw information is held at the requested identity.
    answer: HTTP 404, error code RESOURCE_NOT_FOUND
- operation: list-raw-chunks
  accepted: HTTP 200 carrying the total and every chunk of the raw information, each with its identity, raw information, index, text, offsets, locator and chunking version
  refusals:
  - *id001
  - when: No raw information is held at the requested identity.
    answer: HTTP 404, error code RESOURCE_NOT_FOUND
- operation: read-llm-run
  accepted: '`{ ok: true, result }` carrying the run''s identity, model, prompt version, start and finish times, status, attempts, raw information, idempotency key and summary, with its affected nodes, each with its identity, canonical name and node type, when it is completed and they can be derived'
  refusals:
  - &id003
    when: The named LLM run is not a well-formed identifier.
    answer: error code VALIDATION_INVALID_FORMAT listing each failing field with its path and message, HTTP 422 over REST
  - &id002
    when: No LLM run is held at the named identity.
    answer: error code RESOURCE_NOT_FOUND, HTTP 404 over REST
- operation: list-tool-calls
  accepted: HTTP 200 carrying the total, the limit, the offset and the page of tool calls, each with its identity, run, tool name, arguments, result, validation outcome and recording time
  refusals:
  - *id001
  - rule: rules/knowledge-base/page-limit-bounds
    answer: HTTP 422, error code VALIDATION_INVALID_FORMAT, listing each failing field with its path and message
  - rule: rules/knowledge-base/page-offset-non-negative
    answer: HTTP 422, error code VALIDATION_INVALID_FORMAT, listing each failing field with its path and message
  - *id002
- operation: run-extraction
  accepted: 'HTTP 200 carrying the completed run: the run''s identity, model, prompt version, start and finish times, status, attempts, raw information, idempotency key and summary, with its affected nodes, each with its identity, canonical name and node type, when it is completed'
  refusals:
  - *id001
  - when: The request carries a body with any field.
    answer: HTTP 422, error code VALIDATION_INVALID_FORMAT, listing each failing field with its path and message
  - *id002
  - rule: rules/knowledge-base/extraction-requires-running-run
    answer: HTTP 409, error code BUSINESS_RUN_NOT_RUNNABLE naming the run's status
  - rule: rules/knowledge-base/extraction-fails-on-repeated-system-errors
    answer: error code SYSTEM_INTERNAL_ERROR carrying the failed run, HTTP 500 over REST
  - rule: rules/knowledge-base/prompt-version-known
    answer: error code SYSTEM_INTERNAL_ERROR carrying the failed run, HTTP 500 over REST
  - when: The language model provider fails.
    answer: error code SYSTEM_LLM_PROVIDER_UNAVAILABLE carrying the failed run, HTTP 502 over REST
- operation: retry-llm-run
  accepted: HTTP 200 carrying the run, running again, with its summary
  refusals:
  - *id001
  - when: The request's reason exceeds 500 characters.
    answer: HTTP 422, error code VALIDATION_INVALID_FORMAT, listing each failing field with its path and message
  - *id002
  - rule: rules/knowledge-base/llm-run-lifecycle
    answer: HTTP 409, error code BUSINESS_RUN_NOT_RETRYABLE naming the run's status
- operation: propose-fragment
  accepted: '`{ ok: true, result }` carrying the fragment''s identity and status proposed'
  refusals:
  - *id003
  - &id004
    when: The proposal is missing a required field or holds one of the wrong shape.
    answer: 'error code VALIDATION_INVALID_FORMAT listing each failing field with its path and message, HTTP 422 over REST, and over MCP the message "MCP tool args failed Zod parse."'
  - *id002
  - &id005
    rule: rules/knowledge-base/proposal-requires-running-run
    answer: error code BUSINESS_RUN_NOT_RUNNING naming the run's status, HTTP 409 over REST
  - &id006
    rule: rules/knowledge-base/proposal-confidence-range
    answer: error code VALIDATION_INVALID_FORMAT listing each failing field with its path and message, HTTP 422 over REST
  - rule: rules/knowledge-base/fragment-text-length
    answer: error code VALIDATION_INVALID_FORMAT listing each failing field with its path and message, HTTP 422 over REST
  - rule: rules/knowledge-base/fragment-chunks-exist
    answer: 'error code RESOURCE_NOT_FOUND naming the chunks, HTTP 200 carrying `{ ok: false, error }` over REST'
  - rule: rules/knowledge-base/fragment-chunks-in-run-source
    answer: 'error code VALIDATION_INVALID_FORMAT naming the chunks and the expected raw information, HTTP 200 carrying `{ ok: false, error }` over REST'
  - &id015
    when: A proposal fails for a cause no other refusal names, other than an unreachable store.
    answer: 'error code SYSTEM_INTERNAL_ERROR carrying no details, HTTP 500 over REST with the message "Internal server error.", and over MCP the message "Internal error in MCP handler."'
- operation: propose-node
  accepted: '`{ ok: true, result }` carrying the node''s identity and its resolution matched_existing, created_new or needs_review'
  refusals:
  - *id003
  - *id004
  - *id002
  - *id005
  - rule: rules/knowledge-base/node-name-length
    answer: error code VALIDATION_INVALID_FORMAT listing each failing field with its path and message, HTTP 422 over REST
  - rule: rules/knowledge-base/node-type-in-catalog
    answer: 'error code BUSINESS_UNKNOWN_NODE_TYPE naming the node type, HTTP 200 carrying `{ ok: false, error }` over REST'
  - *id015
- operation: propose-link
  accepted: '`{ ok: true, result }` carrying the link''s identity and its outcome consolidated, accepted, superseded_previous with the superseded link''s identity, or disputed; below the confidence floor, outcome rejected with no identity and reason BELOW_CONFIDENCE_FLOOR'
  refusals:
  - *id003
  - *id004
  - *id002
  - *id005
  - *id006
  - rule: rules/knowledge-base/link-type-in-catalog
    answer: 'error code BUSINESS_UNKNOWN_LINK_TYPE naming the link type, HTTP 200 carrying `{ ok: false, error }` over REST'
  - when: No knowledge node is held at the named source or target identity.
    answer: 'error code RESOURCE_NOT_FOUND naming the node, HTTP 200 carrying `{ ok: false, error }` over REST'
  - &id007
    rule: rules/knowledge-base/cited-fragments-exist
    answer: 'error code RESOURCE_NOT_FOUND naming the fragments, HTTP 200 carrying `{ ok: false, error }` over REST'
  - &id008
    rule: rules/knowledge-base/cited-fragments-in-run
    answer: 'error code VALIDATION_INVALID_FORMAT naming the fragment and the run, HTTP 200 carrying `{ ok: false, error }` over REST'
  - rule: rules/knowledge-base/link-permitted-by-type-rule
    answer: 'error code BUSINESS_LINK_RULE_VIOLATION naming the source node type, link type and target node type, HTTP 200 carrying `{ ok: false, error }` over REST'
  - &id009
    rule: rules/knowledge-base/validity-start-before-end
    answer: 'error code BUSINESS_TEMPORAL_INCOHERENT, HTTP 200 carrying `{ ok: false, error }` over REST'
  - &id010
    rule: rules/knowledge-base/correction-requires-errata-evidence
    answer: 'error code BUSINESS_TEMPORAL_INCOHERENT, HTTP 200 carrying `{ ok: false, error }` over REST'
  - &id011
    rule: rules/knowledge-base/stated-start-requires-basis
    answer: 'error code BUSINESS_DATE_UNJUSTIFIED, HTTP 200 carrying `{ ok: false, error }` over REST'
  - &id012
    rule: rules/knowledge-base/required-start-available
    answer: 'error code BUSINESS_DATE_UNJUSTIFIED, HTTP 200 carrying `{ ok: false, error }` over REST'
  - &id013
    rule: rules/knowledge-base/caller-never-states-received
    answer: error code VALIDATION_INVALID_FORMAT listing each failing field with its path and message, HTTP 422 over REST
  - &id014
    rule: rules/knowledge-base/cited-fragments-anchored
    answer: 'error code VALIDATION_INVALID_FORMAT naming the fragments and the expected raw information, HTTP 200 carrying `{ ok: false, error }` over REST'
  - &id016
    rule: rules/knowledge-base/link-or-attribute-cites-a-fragment
    answer: error code VALIDATION_INVALID_FORMAT listing each failing field with its path and message, HTTP 422 over REST
  - rule: rules/knowledge-base/consolidation-race-refuses-second-collision
    answer: 'error code SYSTEM_INTERNAL_ERROR with the message "graph consolidation: dup-guard constraint hit on retry; a concurrent transaction committed a conflicting row." and the scope knowledge_link in its details, HTTP 200 carrying `{ ok: false, error }` over REST'
  - *id015
- operation: propose-attribute
  accepted: '`{ ok: true, result }` carrying the attribute''s identity and its outcome consolidated, accepted, superseded_previous with the superseded attribute''s identity, or disputed; below the confidence floor, outcome rejected with no identity and reason BELOW_CONFIDENCE_FLOOR'
  refusals:
  - *id003
  - *id004
  - *id002
  - *id005
  - *id006
  - when: No knowledge node is held at the named identity.
    answer: 'error code RESOURCE_NOT_FOUND naming the node, HTTP 200 carrying `{ ok: false, error }` over REST'
  - rule: rules/knowledge-base/attribute-key-for-node-type
    answer: 'error code BUSINESS_UNKNOWN_ATTRIBUTE_KEY naming the key, HTTP 200 carrying `{ ok: false, error }` over REST'
  - rule: rules/knowledge-base/attribute-value-parses
    answer: 'error code VALIDATION_INVALID_FORMAT naming the value and its value type, HTTP 200 carrying `{ ok: false, error }` over REST'
  - rule: rules/knowledge-base/attribute-value-in-allowed-values
    answer: 'error code VALIDATION_INVALID_FORMAT naming the value and the allowed values in sorted order, HTTP 200 carrying `{ ok: false, error }` over REST'
  - *id007
  - *id008
  - *id009
  - *id010
  - *id011
  - *id012
  - *id013
  - *id014
  - *id016
  - rule: rules/knowledge-base/consolidation-race-refuses-second-collision
    answer: 'error code SYSTEM_INTERNAL_ERROR with the message "graph consolidation: dup-guard constraint hit on retry; a concurrent transaction committed a conflicting row." and the scope node_attribute in its details, HTTP 200 carrying `{ ok: false, error }` over REST'
  - *id015
- operation: ingest-document
  accepted: '`{ ok: true, result }` with outcome ingested, the raw information''s and run''s identities, the chunk count and the extraction''s run summary; with outcome already_ingested, when the content is already held, the held raw information''s and run''s identities, its chunk count, its run''s status or null where that cannot be read, and a message: for a completed run "This exact content was already ingested and its extraction completed; returning the existing run. No new extraction was triggered.", for any other status "This exact content was already ingested, but its run is ''<status>'' (not completed) — the prior extraction did not finish. No new extraction was triggered; recovery requires re-running that LLMRun.", naming the status or unknown where it cannot be read'
  refusals:
  - rule: rules/knowledge-base/content-length
    answer: error code VALIDATION_INVALID_FORMAT with the message "ingest_document arguments failed validation." listing each failing field with its path and message
  - when: The request names no source type of the closed set.
    answer: error code VALIDATION_INVALID_FORMAT with the message "ingest_document arguments failed validation." listing each failing field with its path and message
  - rule: rules/knowledge-base/extraction-fails-on-repeated-system-errors
    answer: error code SYSTEM_INTERNAL_ERROR carrying the failed run
  - rule: rules/knowledge-base/prompt-version-known
    answer: error code SYSTEM_INTERNAL_ERROR carrying the failed run
  - when: The language model provider fails.
    answer: error code SYSTEM_LLM_PROVIDER_UNAVAILABLE carrying the failed run
  - when: Persisting the document before extraction fails for a cause other than an unreachable store.
    answer: error code SYSTEM_INTERNAL_ERROR with the message "Failed to persist the document before extraction.", carrying no run
  - when: The extraction fails for a cause no other refusal names.
    answer: error code SYSTEM_INTERNAL_ERROR with the message "Unexpected error during document ingestion.", carrying the run's and the raw information's identities
- operation: ingest-directed
  accepted: '`{ ok: true, result }` with outcome ingested, the raw information''s and run''s identities, the chunk count, the completed run, reported completed even where closing it failed, with its affected nodes, an empty list where they cannot be read, one report entry per item with its reference, kind and status, a link''s reference being its source reference, its link type and its target reference joined by "->", and a summary counting the items by kind and status; a node whose pinned identity names no knowledge node is reported rejected with error code RESOURCE_NOT_FOUND, the message "node_id pin does not resolve to an existing knowledge_node row." and the details node_id and reason not_found; a node whose pinned identity names a knowledge node that is not active is reported rejected with error code VALIDATION_INVALID_FORMAT, the message "node_id pin resolves to a knowledge_node row whose status is ''<status>'' (only ''active'' is accepted)." and the details node_id, reason inactive and current_status'
  refusals:
  - rule: rules/knowledge-base/directed-requires-fragment-and-node
    answer: 'error code VALIDATION_INVALID_FORMAT with the message "ingest_directed arguments failed validation." listing each failing field with its path and message'
  - rule: rules/knowledge-base/directed-reference-length
    answer: 'error code VALIDATION_INVALID_FORMAT with the message "ingest_directed arguments failed validation." listing each failing field with its path and message'
  - rule: rules/knowledge-base/directed-attribute-value-shape
    answer: 'error code VALIDATION_INVALID_FORMAT with the message "ingest_directed arguments failed validation." listing each failing field with its path and message'
  - rule: rules/knowledge-base/directed-source-label-length
    answer: 'error code VALIDATION_INVALID_FORMAT with the message "ingest_directed arguments failed validation." listing each failing field with its path and message'
  - rule: rules/knowledge-base/caller-never-states-received
    answer: 'error code VALIDATION_INVALID_FORMAT with the message "ingest_directed arguments failed validation." listing each failing field with its path and message'
  - rule: rules/knowledge-base/directed-validity-start-shape
    answer: 'error code VALIDATION_INVALID_FORMAT with the message "ingest_directed arguments failed validation." listing each failing field with its path and message'
  - when: The store cannot be reached while the directed payload is persisted before dispatch.
    answer: error code SYSTEM_SERVICE_UNAVAILABLE with the message "A backing service is temporarily unavailable."
  - when: Persisting the directed payload before dispatch fails for a cause other than an unreachable store.
    answer: error code SYSTEM_INTERNAL_ERROR with the message "Failed to persist the directed payload before dispatch.", carrying no details
  - when: The directed payload's content is found already held when it is persisted before dispatch.
    answer: 'error code SYSTEM_INTERNAL_ERROR with the message "Directed ingestion intake returned ''noop_existing''; the per-call nonce should make this unreachable.", carrying the raw information''s and run''s identities'
  - when: Persisting the directed payload before dispatch produces no chunk.
    answer: error code SYSTEM_INTERNAL_ERROR with the message "Directed ingestion intake produced no chunks.", carrying the raw information's and run's identities
  - when: The directed ingestion fails for a cause no other refusal names.
    answer: error code SYSTEM_INTERNAL_ERROR with the message "Unexpected error during directed ingestion.", carrying no details
- operation: list-recent-ingestions
  accepted: '`{ ok: true, result }` carrying the recent ingestions, each with its raw information''s identity, source type, status and reception time, the first 80 characters of its content, and its latest run''s identity, status, start and finish times, prompt version and model'
  refusals:
  - rule: rules/knowledge-base/recent-ingestions-limit-bounds
    answer: error code VALIDATION_INVALID_FORMAT listing each failing field with its path and message
---

## Description

The surface through which sources enter the knowledge base and knowledge is proposed from them: intake, the four proposals, one-shot and directed ingestion, and the reads over runs, tool calls, sources and chunks.
The proposals and the run read are carried by both REST and MCP; document and directed ingestion and the recent-ingestions listing by MCP alone; intake, the source and chunk reads, the tool-call listing, extraction and retry by REST alone.
