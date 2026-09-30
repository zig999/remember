# Full text

Derived by spec.py from the specification files; never edited. Grep here to locate;
open the node file a match names before claiming anything about it.

=== constraints/document-content-is-data
---
statement: An extraction presents a document's content to the language model marked apart from its instructions as data, never as instruction.
scope: knowledge-base
---

## Description

None.

=== constraints/extraction-acts-only-through-proposals
---
statement: The language model that extracts a document acts on the knowledge base only through the fragment, node, link and attribute proposals.
scope: knowledge-base
---

## Description

None.

=== constraints/ingestion-transports-answer-alike
---
statement: The REST and MCP transports answer every ingestion operation they both expose with the same result on success and the same error code on refusal.
scope: knowledge-base
---

## Description

None.

=== constraints/llm-toolset-omits-fragment-listing
---
statement: The language model's query tool surface exposes search and the three provenance reads and does not expose the accepted-fragment listing.
scope: knowledge-base
---

## Description

None.

=== constraints/retrieval-is-lexical-only
---
statement: Retrieval matches text only lexically and never by embeddings or semantic similarity.
scope: knowledge-base
---

## Description

A synonym or paraphrase that shares no characters with what the knowledge base holds is not found; curation is where such a gap is closed.

=== constraints/retrieval-is-read-only
---
statement: Every retrieval operation runs inside a read-only transaction.
scope: knowledge-base
fitness: each retrieval operation's database transaction is opened read-only
---

## Description

None.

=== constraints/retrieval-requires-owner-authentication
---
statement: Every retrieval operation authenticates the owner before it reads anything.
scope: knowledge-base
---

## Description

None.

=== constraints/retrieval-transports-answer-alike
---
statement: The REST and MCP transports answer every retrieval operation they both expose with the same result on success and the same error code on refusal.
scope: knowledge-base
---

## Description

None.

=== contracts/knowledge-base/ingestion
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
  accepted: HTTP 201 with outcome created, the raw information's identity and content hash, its chunk count and each chunk's identity, index and offsets, and the opened run's identity and idempotency key; HTTP 200 with outcome noop_existing, the held raw information's identity, content hash and chunk count, no chunks, and the run that raw information already has, whatever model or prompt version the request names
  refusals:
  - rule: rules/knowledge-base/content-length
    answer: HTTP 422, error code VALIDATION_INVALID_FORMAT, listing each failing field with its path and message
  - rule: rules/knowledge-base/original-input-length
    answer: HTTP 422, error code VALIDATION_INVALID_FORMAT, listing each failing field with its path and message
  - when: The request names no source type of the closed set, or no model or prompt version.
    answer: HTTP 422, error code VALIDATION_INVALID_FORMAT, listing each failing field with its path and message
- operation: read-raw-information
  accepted: HTTP 200 carrying the raw information's identity, source type, content, storage reference, content hash, reception time and metadata
  refusals:
  - &id001
    when: A named identity is not a well-formed identifier.
    answer: HTTP 422, error code VALIDATION_INVALID_FORMAT, listing each failing field with its path and message
  - when: No raw information is held at the requested identity.
    answer: HTTP 404, error code RESOURCE_NOT_FOUND
- operation: list-raw-chunks
  accepted: HTTP 200 carrying the total and every chunk of the raw information, each with its identity, raw information, index, excerpt, offsets, locator and chunking version
  refusals:
  - *id001
  - when: No raw information is held at the requested identity.
    answer: HTTP 404, error code RESOURCE_NOT_FOUND
- operation: read-llm-run
  accepted: '`{ ok: true, result }` carrying the run''s identity, model, prompt version, start and finish times, status, attempts, raw information, idempotency key and summary, with its affected nodes, each with its identity, canonical name and node type, when it is completed'
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
    answer: error code VALIDATION_INVALID_FORMAT listing each failing field with its path and message, HTTP 422 over REST
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
- operation: ingest-document
  accepted: '`{ ok: true, result }` with outcome ingested, the raw information''s and run''s identities, the chunk count and the extraction''s run summary; with outcome already_ingested, the held raw information''s and run''s identities, its chunk count and its run''s status, when the content is already held'
  refusals:
  - rule: rules/knowledge-base/content-length
    answer: error code VALIDATION_INVALID_FORMAT listing each failing field with its path and message
  - when: The request names no source type of the closed set.
    answer: error code VALIDATION_INVALID_FORMAT listing each failing field with its path and message
  - rule: rules/knowledge-base/extraction-fails-on-repeated-system-errors
    answer: error code SYSTEM_INTERNAL_ERROR carrying the failed run
  - rule: rules/knowledge-base/prompt-version-known
    answer: error code SYSTEM_INTERNAL_ERROR carrying the failed run
  - when: The language model provider fails.
    answer: error code SYSTEM_LLM_PROVIDER_UNAVAILABLE carrying the failed run
- operation: ingest-directed
  accepted: '`{ ok: true, result }` with outcome ingested, the raw information''s and run''s identities, the chunk count, the completed run with its affected nodes, one report entry per item with its reference, kind and status, and a summary counting the items by kind and status'
  refusals:
  - rule: rules/knowledge-base/directed-requires-fragment-and-node
    answer: error code VALIDATION_INVALID_FORMAT listing each failing field with its path and message
  - rule: rules/knowledge-base/directed-reference-length
    answer: error code VALIDATION_INVALID_FORMAT listing each failing field with its path and message
  - rule: rules/knowledge-base/directed-attribute-value-shape
    answer: error code VALIDATION_INVALID_FORMAT listing each failing field with its path and message
  - rule: rules/knowledge-base/directed-source-label-length
    answer: error code VALIDATION_INVALID_FORMAT listing each failing field with its path and message
  - rule: rules/knowledge-base/caller-never-states-received
    answer: error code VALIDATION_INVALID_FORMAT listing each failing field with its path and message
- operation: list-recent-ingestions
  accepted: '`{ ok: true, result }` carrying the recent ingestions, each with its raw information''s identity, source type, status and reception time, the first 80 characters of its content, and its latest run''s identity, status, start and finish times, prompt version and model'
  refusals:
  - rule: rules/knowledge-base/recent-ingestions-limit-bounds
    answer: error code VALIDATION_INVALID_FORMAT listing each failing field with its path and message
---

## Description

The surface through which sources enter the knowledge base and knowledge is proposed from them: intake, the four proposals, one-shot and directed ingestion, and the reads over runs, tool calls, sources and chunks.
The proposals and the run read are carried by both REST and MCP; document and directed ingestion and the recent-ingestions listing by MCP alone; intake, the source and chunk reads, the tool-call listing, extraction and retry by REST alone.

=== contracts/knowledge-base/retrieval
---
type: api
direction: published
operations:
- search
- read-link-provenance
- read-attribute-provenance
- read-fragment-provenance
- list-accepted-fragments
answers:
- operation: search
  accepted: '`{ ok: true, result }` carrying the page of ranked search items, each supporting fragment shown with its text, confidence, raw information, source type, reception time and chunk excerpt, and the total before pagination'
  refusals:
  - &auth
    when: The request carries no valid owner authentication.
    answer: HTTP 401, error code AUTH_UNAUTHORIZED, AUTH_TOKEN_INVALID or AUTH_TOKEN_EXPIRED
  - rule: rules/knowledge-base/search-query-not-blank
    answer: HTTP 422, error code BUSINESS_INVALID_SEARCH_QUERY
  - rule: rules/knowledge-base/search-query-length
    answer: HTTP 422, error code BUSINESS_INVALID_SEARCH_QUERY
  - rule: rules/knowledge-base/search-query-must-parse
    answer: HTTP 422, error code BUSINESS_INVALID_SEARCH_QUERY
  - rule: rules/knowledge-base/search-layer-outside-set-refused
    answer: HTTP 422, error code BUSINESS_INVALID_SEARCH_LAYER, naming the allowed layers
  - rule: rules/knowledge-base/unknown-link-type-refused
    answer: HTTP 422, error code BUSINESS_UNKNOWN_LINK_TYPE
  - rule: rules/knowledge-base/expansion-depth-bounds
    answer: HTTP 422, error code BUSINESS_INVALID_TRAVERSE_DEPTH
  - when: The as-of date is not a calendar date written as year-month-day.
    answer: HTTP 422, error code VALIDATION_INVALID_FORMAT
  - &limit
    rule: rules/knowledge-base/page-limit-bounds
    answer: HTTP 422, error code VALIDATION_OUT_OF_RANGE
  - &offset
    rule: rules/knowledge-base/page-offset-non-negative
    answer: HTTP 422, error code VALIDATION_OUT_OF_RANGE
- operation: read-link-provenance
  accepted: '`{ ok: true, result }` listing the provenance fragments, each with its text, confidence and status and the raw chunks it came from, each chunk with its index, offsets, excerpt, locator and raw information (source type, reception time, metadata, original input)'
  refusals:
  - *auth
  - &id-format
    when: The requested identity is not a well-formed identifier.
    answer: HTTP 422, error code VALIDATION_INVALID_FORMAT
  - when: No knowledge link is held at the requested identity.
    answer: HTTP 404, error code RESOURCE_NOT_FOUND
  - &id001
    rule: rules/knowledge-base/provenance-refused-after-compliance-deletion
    answer: HTTP 410, error code BUSINESS_RAW_INFORMATION_DELETED, naming the earliest compliance deletion
  - &id002
    rule: rules/knowledge-base/empty-provenance-chain-refused
    answer: HTTP 500, error code SYSTEM_INTERNAL_ERROR
- operation: read-attribute-provenance
  accepted: '`{ ok: true, result }` listing the provenance fragments, each with its text, confidence and status and the raw chunks it came from, each chunk with its index, offsets, excerpt, locator and raw information (source type, reception time, metadata, original input)'
  refusals:
  - *auth
  - *id-format
  - when: No node attribute is held at the requested identity.
    answer: HTTP 404, error code RESOURCE_NOT_FOUND
  - *id001
  - *id002
- operation: read-fragment-provenance
  accepted: '`{ ok: true, result }` listing the provenance fragments, each with its text, confidence and status and the raw chunks it came from, each chunk with its index, offsets, excerpt, locator and raw information (source type, reception time, metadata, original input)'
  refusals:
  - *auth
  - *id-format
  - when: No information fragment is held at the requested identity.
    answer: HTTP 404, error code RESOURCE_NOT_FOUND
  - rule: rules/knowledge-base/provenance-requires-accepted-fragment
    answer: HTTP 404, error code BUSINESS_FRAGMENT_NOT_ACCEPTED
  - *id001
  - *id002
- operation: list-accepted-fragments
  accepted: '`{ ok: true, result }` carrying the page of accepted fragments, each with its text, confidence, LLM run, creation time and source (raw information, chunk index, source type, reception time, document title)'
  refusals:
  - *auth
  - rule: rules/knowledge-base/listing-requires-a-filter
    answer: HTTP 422, error code VALIDATION_INVALID_FORMAT, naming the two filters of which one is required
  - when: A named LLM run or raw information is not a well-formed identifier.
    answer: HTTP 422, error code VALIDATION_INVALID_FORMAT, naming the offending filter
  - *limit
  - *offset
---

## Description

The owner's read surface over the knowledge base: search, the three provenance reads, and the accepted-fragment listing.

=== decision-log
---
entries:
- location: domain/knowledge-base/_context.md
  field: strategic
  unstated: The material does not say whether the knowledge base is core, supporting or generic.
  decided: core
  why: Tracing every answer back to its source is what the system exists for, and no off-the-shelf product does it.
- location: domain/knowledge-base/knowledge-node.md
  field: type
  unstated: The material leaves open whether the records the retrieval reads, written by other modules, are upstream contracts or elements of another context.
  decided: aggregate-root in the same knowledge-base context, as every other record the retrieval reads
  why: The retrieval reads those records under the same names and meanings the rest of the system writes them with, so no translation marks a context boundary.
- location: domain/knowledge-base/raw-information.md
  field: relationships.raw-chunk.cardinality
  unstated: The material does not say whether a raw information can hold no chunk.
  decided: 1..*
  why: Every fragment is attributed to a chunk of its raw information, so a raw information without a chunk would yield nothing to read.
- location: domain/knowledge-base/knowledge-node.md
  field: relationships.node-alias.cardinality
  unstated: The material does not say whether a knowledge node can have no alias.
  decided: 1..*
  why: The node layer reaches a node only through its aliases, so a node without one could never be found.
- location: domain/knowledge-base/raw-information.md
  field: attributes.metadata.type
  unstated: The material names a raw information's metadata without giving its shape.
  decided: string
  why: The retrieval only passes the metadata through to the owner and reads nothing inside it.
- location: domain/knowledge-base/information-fragment.md
  field: attributes.llm_run.type
  unstated: The material names the LLM run a fragment came from only as a filter and a listed field.
  decided: string
  why: The retrieval uses the run only as an identifier to filter by and to show, and reads nothing else about it.
- location: domain/knowledge-base/raw-chunk.md
  field: attributes.locator.type
  unstated: The material names a chunk's locator without giving its shape.
  decided: string
  why: The retrieval only passes the locator through to the owner.
- location: rules/knowledge-base/listing-excludes-compliance-deleted.md
  field: consistency
  unstated: The material does not say how this read holds across the separate records it combines.
  decided: eventual
  why: The records it combines are written independently and never change in one transaction, so a read reflects each as last committed.
- location: rules/knowledge-base/listing-one-entry-per-fragment.md
  field: consistency
  unstated: The material does not say how this read holds across the separate records it combines.
  decided: eventual
  why: The records it combines are written independently and never change in one transaction, so a read reflects each as last committed.
- location: rules/knowledge-base/listing-order.md
  field: consistency
  unstated: The material does not say how this read holds across the separate records it combines.
  decided: eventual
  why: The records it combines are written independently and never change in one transaction, so a read reflects each as last committed.
- location: rules/knowledge-base/node-surfaces-only-with-accepted-mention.md
  field: consistency
  unstated: The material does not say how this read holds across the separate records it combines.
  decided: eventual
  why: The records it combines are written independently and never change in one transaction, so a read reflects each as last committed.
- location: rules/knowledge-base/prose-matching.md
  field: consistency
  unstated: The material does not say how this read holds across the separate records it combines.
  decided: eventual
  why: The records it combines are written independently and never change in one transaction, so a read reflects each as last committed.
- location: rules/knowledge-base/search-excludes-compliance-deleted-sources.md
  field: consistency
  unstated: The material does not say how this read holds across the separate records it combines.
  decided: eventual
  why: The records it combines are written independently and never change in one transaction, so a read reflects each as last committed.
- location: rules/knowledge-base/search-excludes-compliance-deleted-sources.md
  field: statement
  unstated: 'The first increment''s material showed search surfacing an accepted fragment whose raw information has a compliance deletion, while the documentation says deleted content never recirculates and that compliance deletion marks the fragments deleted; the two decide differently for an accepted fragment of a compliance-deleted source.'
  decided: Search shows no information fragment whose raw information was deleted for compliance, as an item or as support, replacing the node that said search keeps such fragments.
  why: The documentation states the business's intent for deleted sources, and the first material only described what the code does.
- location: rules/knowledge-base/compliance-refusal-takes-precedence.md
  field: statement
  unstated: The standing node put the compliance refusal ahead of every other, while the documentation puts the refusal of a fragment that is not accepted ahead of it; the two decide differently for a fragment provenance read of a non-accepted fragment whose source was deleted for compliance.
  decided: The compliance refusal comes first except against the refusal of a fragment that is not accepted.
  why: The documentation states this precedence explicitly as the order of the three provenance refusals.
- location: constraints/retrieval-transports-answer-alike.md
  field: statement
  unstated: The standing node had MCP answer in the REST envelope, while the documentation has MCP answer in its own content and error framing with the same payload and the same error codes; the two decide differently for the shape of an MCP success.
  decided: The two transports carry the same result and the same error code, and the constraint no longer fixes the framing.
  why: The documentation states repeatedly that the envelope is REST-only and that only the payload and the codes must match.
- location: domain/knowledge-base/fragment-status.md
  field: values
  unstated: The documentation lists four fragment states and leaves out superseded, which the standing node holds; the two decide differently for a fragment that was superseded.
  decided: The five values stand, superseded included.
  why: The first increment's material is the newer reading of the states fragments are held in, and the documentation's list predates it.
- location: domain/knowledge-base/item-kind.md
  field: values
  unstated: The system specification lists attribute as a search item kind, while the domain documentation says an attribute is never a search item; the two decide differently for a node attribute matching a search.
  decided: node, link and fragment, with attribute not a kind.
  why: The domain documentation states the exclusion deliberately and the standing node already holds it.
- location: domain/knowledge-base/knowledge-link.md
  field: attributes.valid_from.type
  unstated: The material compares a link's validity start with a date without naming its type.
  decided: date
  why: The as-of date it is compared with is a calendar date.
- location: domain/knowledge-base/knowledge-link.md
  field: attributes.valid_to.type
  unstated: The material compares a link's validity end with a date without naming its type.
  decided: date
  why: The as-of date it is compared with is a calendar date.
- location: rules/knowledge-base/compliance-deletion-propagates.md
  field: consistency
  unstated: The material does not say how this propagation holds across the separate records it changes.
  decided: eventual
  why: The records it changes are separate aggregates, and no reader in the material depends on seeing them change together.
- location: domain/knowledge-base/information-fragment.md
  field: attributes.llm_run.type
  retired: The fragment's LLM run is now the reference to domain/knowledge-base/llm-run in information-fragment's relationships.
- location: domain/knowledge-base/llm-run.md
  field: type
  unstated: The material does not say whether LLM runs and their tool calls belong to the knowledge base's context or to a context of their own.
  decided: aggregate-root in the knowledge-base context
  why: Ingestion writes the raw informations, fragments, nodes, links and attributes the retrieval reads under the same names and meanings, so no translation marks a boundary between them.
- location: domain/knowledge-base/tool-call.md
  field: attributes.arguments.type
  unstated: The material records a tool call's arguments as a free-form object without giving them a shape.
  decided: string
  why: Nothing in the material reads inside the arguments; they are kept and shown as recorded.
- location: domain/knowledge-base/tool-call.md
  field: attributes.result.type
  unstated: The material records a tool call's result as a free-form object without giving it a shape.
  decided: string
  why: Nothing in the material reads inside the result except the outcome, which the validation outcome already holds.
- location: domain/knowledge-base/raw-information.md
  field: attributes.document_date.type
  unstated: The material reads a document date from a raw information's metadata without naming its type.
  decided: date
  why: It is used as a validity start, which is a calendar date.
- location: domain/knowledge-base/attribute-key.md
  field: type
  unstated: The material says an attribute key belongs to one node type without saying whether it changes together with it.
  decided: aggregate-root referencing its node type
  why: Node attributes point at their key directly, and a reference only reaches an aggregate root.
- location: domain/knowledge-base/link-type-rule.md
  field: type
  unstated: The material holds link type rules without saying which record owns them.
  decided: entity inside the link-type aggregate
  why: A rule is looked up by its link type and has no meaning apart from it.
- location: domain/knowledge-base/entity-match-review.md
  field: type
  unstated: The material records entity match reviews without saying what owns them.
  decided: aggregate-root
  why: Each review is worked on its own in the curation queue, apart from the nodes it pairs.
- location: domain/knowledge-base/proposal.md
  field: type
  unstated: The material names four proposal operations without naming what they carry as one concept.
  decided: value-object, carrying the kind, confidence, change hint, validity dates and basis, the LLM run and what it cites
  why: Every check and consolidation of the four operations is stated about what is proposed, and a proposal has no identity before it is taken.
- location: domain/knowledge-base/directed-ingestion.md
  field: type
  unstated: The material describes a directed ingestion's request and report without saying whether it has an identity of its own.
  decided: value-object
  why: It is recorded only through the raw information and LLM run it produces.
- location: rules/knowledge-base/name-normalization.md
  field: statement
  unstated: The material says entity resolution compares normalized names without saying what normalizing does.
  decided: Lower-casing, removing accents, trimming and collapsing inner whitespace.
  why: The material names the normalization as the database's own, and one normalization for every name comparison keeps resolution and alias matching from disagreeing about the same name.
- location: rules/knowledge-base/affected-nodes-of-a-run.md
  field: statement
  unstated: The material collects a run's affected nodes from the nodes its link and attribute proposals join or describe on the directed path, while the extraction path and a rebuild from tool calls count only the nodes its node proposals resolved to; the two decide differently for the target node of a link an extraction accepted.
  decided: The nodes that landed link and attribute proposals join or describe are affected nodes on every path.
  why: The collector is built to take those nodes, and only the extraction's results fail to carry them.
- location: rules/knowledge-base/reaffirmation-consolidates.md
  field: statement
  unstated: The material has a multi-valued link re-affirm whatever its validity start while an attribute needs the same start, and a multi-valued proposal with change hint succession that meets a current assertion falls through to a duplicate and a system error; the two decide differently for a multi-valued attribute re-stated with another start.
  decided: For a type that allows multiple current assertions, a proposal with the same target or value that is not a correction re-affirms; for one that does not, it needs change hint none and the same validity start.
  why: A multi-valued type holds only one current assertion per target or value, so a second one with the same target or value can only consolidate into it.
- location: contracts/knowledge-base/ingestion.md
  field: answers
  unstated: The material has re-ingesting held content under another model or prompt version look for a run by the new idempotency key and fail with an internal error when none exists.
  decided: Held content answers HTTP 200 with outcome noop_existing and the run the held raw information already has, whatever model or prompt version the request names.
  why: Intake is idempotent by content hash, and a request that records nothing has nothing to fail on.
- location: rules/knowledge-base/every-proposal-audited.md
  field: statement
  unstated: The material has MCP proposals record a tool call on every outcome and REST proposals record none; the two decide differently for a proposal carried over REST.
  decided: Every proposal within a run records its tool call, whichever transport carried it.
  why: A run's summary is counted from its tool calls, so a proposal without one would vanish from its run's account.
- location: contracts/knowledge-base/ingestion.md
  field: answers
  unstated: The material has a REST proposal refused by validation answer HTTP 200 carrying the refusal, while the shared error registry maps the same codes to 4xx statuses.
  decided: 'A validation refusal of a REST proposal answers HTTP 200 carrying `{ ok: false, error }` with the refusal''s code.'
  why: A validation refusal of a proposal is a result its run records, not a failure of the request that carried it.
- location: contracts/knowledge-base/ingestion.md
  field: answers
  unstated: The material has the MCP proposals accept any non-empty text as the LLM run's identity while REST and the MCP run read demand a UUID; the two decide differently for a malformed run identity over MCP.
  decided: A malformed LLM run identity is refused with VALIDATION_INVALID_FORMAT on both transports.
  why: An LLM run's identity is a UUID everywhere else the material names one.
- location: constraints/ingestion-transports-answer-alike.md
  field: statement
  unstated: The material has an MCP proposal whose service answered a refusal without raising it return that refusal wrapped in a success, while REST returns the refusal itself.
  decided: The two transports carry the same result and the same error code for every ingestion operation both expose, so MCP answers such a refusal as a refusal.
  why: Nothing in the material makes the ingestion transports differ in what they answer, only in how they frame it.
- location: rules/knowledge-base/required-start-fallback.md
  field: statement
  unstated: The material lets a proposal that needs a validity start pass with no start and no basis when its source has a document date, while one whose source has only a reception date takes that date with basis received; the two decide differently for whether a required start may stay empty.
  decided: It takes the document date with basis document or, failing that, the reception date with basis received.
  why: A type that requires a validity start is never left without one, and every start carries its justification.
- location: rules/knowledge-base/attribute-value-parses.md
  field: statement
  unstated: The material leaves to the runtime's date parser whether a well-formed but impossible date such as 2024-02-30 is refused.
  decided: Only a real calendar date is a date value.
  why: A date attribute names a day, and no such day exists.
- location: rules/knowledge-base/directed-defaults.md
  field: statement
  unstated: The material's directed service accepts a change hint and a validity end for attributes and links, while the directed tool's own schema declares neither, so they never arrive.
  decided: A directed attribute or link is proposed with change hint none.
  why: The directed tool is the only way a directed ingestion is made, and it carries no change hint.
- location: rules/knowledge-base/page-defaults.md
  field: statement
  unstated: The standing node gives every page a default limit of 20, while the material's tool-call listing defaults its page to 50; the two decide differently for a tool-call listing that omits its limit.
  decided: The default of 20 holds for search and the accepted-fragment listing, and the tool-call listing defaults to 50.
  why: The tool-call listing's default is stated in its own request schema.
- location: rules/knowledge-base/affected-nodes-of-a-run.md
  field: consistency
  unstated: The material does not say how this read holds across the separate records it combines.
  decided: eventual
  why: The records it combines are written independently and never change in one transaction, so a read reflects each as last committed.
- location: rules/knowledge-base/affected-nodes-follow-merges.md
  field: consistency
  unstated: The material does not say how this read holds across the separate records it combines.
  decided: eventual
  why: The records it combines are written independently and never change in one transaction, so a read reflects each as last committed.
- location: rules/knowledge-base/summary-counts-orphaned-fragments.md
  field: consistency
  unstated: The material does not say how this read holds across the separate records it combines.
  decided: eventual
  why: The records it combines are written independently and never change in one transaction, so a read reflects each as last committed.
- location: rules/knowledge-base/recent-ingestion-latest-run.md
  field: consistency
  unstated: The material does not say how this read holds across the separate records it combines.
  decided: eventual
  why: The records it combines are written independently and never change in one transaction, so a read reflects each as last committed.
- location: rules/knowledge-base/ingestion-records-chunks-and-run.md
  field: consistency
  unstated: The material does not say how this rule holds across the separate records it changes.
  decided: eventual
  why: The records it changes are separate aggregates, and no reader in the material depends on seeing them change together.
- location: rules/knowledge-base/retry-rejects-orphaned-fragments.md
  field: consistency
  unstated: The material does not say how this rule holds across the separate records it changes.
  decided: eventual
  why: The records it changes are separate aggregates, and no reader in the material depends on seeing them change together.
- location: rules/knowledge-base/ambiguous-candidates-need-review.md
  field: consistency
  unstated: The material does not say how this rule holds across the separate records it changes.
  decided: eventual
  why: The records it changes are separate aggregates, and no reader in the material depends on seeing them change together.
- location: rules/knowledge-base/document-ingestion-extracts-new-content.md
  field: consistency
  unstated: The material does not say how this rule holds across the separate records it changes.
  decided: eventual
  why: The records it changes are separate aggregates, and no reader in the material depends on seeing them change together.
- location: rules/knowledge-base/current-assertion.md
  field: consistency
  unstated: The material does not say how this rule holds across the separate records it changes.
  decided: eventual
  why: Each case of this rule concerns one knowledge link or one node attribute and never both, so no reader depends on the two changing together.
- location: rules/knowledge-base/proposal-meets-current-assertion.md
  field: consistency
  unstated: The material does not say how this rule holds across the separate records it changes.
  decided: eventual
  why: Each case of this rule concerns one knowledge link or one node attribute and never both, so no reader depends on the two changing together.
- location: rules/knowledge-base/consolidation-precedence.md
  field: consistency
  unstated: The material does not say how this rule holds across the separate records it changes.
  decided: eventual
  why: Each case of this rule concerns one knowledge link or one node attribute and never both, so no reader depends on the two changing together.
- location: rules/knowledge-base/reaffirmation-consolidates.md
  field: consistency
  unstated: The material does not say how this rule holds across the separate records it changes.
  decided: eventual
  why: Each case of this rule concerns one knowledge link or one node attribute and never both, so no reader depends on the two changing together.
- location: rules/knowledge-base/correction-replaces.md
  field: consistency
  unstated: The material does not say how this rule holds across the separate records it changes.
  decided: eventual
  why: Each case of this rule concerns one knowledge link or one node attribute and never both, so no reader depends on the two changing together.
- location: rules/knowledge-base/succession-closes-previous.md
  field: consistency
  unstated: The material does not say how this rule holds across the separate records it changes.
  decided: eventual
  why: Each case of this rule concerns one knowledge link or one node attribute and never both, so no reader depends on the two changing together.
- location: rules/knowledge-base/succession-before-previous-start.md
  field: consistency
  unstated: The material does not say how this rule holds across the separate records it changes.
  decided: eventual
  why: Each case of this rule concerns one knowledge link or one node attribute and never both, so no reader depends on the two changing together.
- location: rules/knowledge-base/conflict-disputes.md
  field: consistency
  unstated: The material does not say how this rule holds across the separate records it changes.
  decided: eventual
  why: Each case of this rule concerns one knowledge link or one node attribute and never both, so no reader depends on the two changing together.
- location: rules/knowledge-base/new-assertion.md
  field: consistency
  unstated: The material does not say how this rule holds across the separate records it changes.
  decided: eventual
  why: Each case of this rule concerns one knowledge link or one node attribute and never both, so no reader depends on the two changing together.
- location: rules/knowledge-base/new-assertion-status-from-confidence.md
  field: consistency
  unstated: The material does not say how this rule holds across the separate records it changes.
  decided: eventual
  why: Each case of this rule concerns one knowledge link or one node attribute and never both, so no reader depends on the two changing together.
- location: rules/knowledge-base/consolidation-records-provenance.md
  field: consistency
  unstated: The material does not say how this rule holds across the separate records it changes.
  decided: eventual
  why: Each case of this rule concerns one knowledge link or one node attribute and never both, so no reader depends on the two changing together.
- location: rules/knowledge-base/succession-closing-date.md
  field: consistency
  unstated: The material does not say how this rule holds across the separate records it changes.
  decided: eventual
  why: Each case of this rule concerns one knowledge link or one node attribute and never both, so no reader depends on the two changing together.
- location: rules/knowledge-base/one-current-link-per-functional-type.md
  field: statement
  unstated: The material has a dispute record a second current assertion beside the one it disputes while a duplicate guard keeps one current assertion per node and type, without saying whether the guard spares disputed assertions; the two decide differently for the new assertion of a dispute.
  decided: At most one current assertion that is not disputed; disputed assertions are exempt.
  why: A dispute exists to hold both conflicting assertions until curation settles it.
- location: rules/knowledge-base/one-current-link-per-target.md
  field: statement
  unstated: The material has a dispute record a second current assertion beside the one it disputes while a duplicate guard keeps one current assertion per node and type, without saying whether the guard spares disputed assertions; the two decide differently for the new assertion of a dispute.
  decided: At most one current assertion that is not disputed; disputed assertions are exempt.
  why: A dispute exists to hold both conflicting assertions until curation settles it.
- location: rules/knowledge-base/one-current-attribute-per-functional-key.md
  field: statement
  unstated: The material has a dispute record a second current assertion beside the one it disputes while a duplicate guard keeps one current assertion per node and type, without saying whether the guard spares disputed assertions; the two decide differently for the new assertion of a dispute.
  decided: At most one current assertion that is not disputed; disputed assertions are exempt.
  why: A dispute exists to hold both conflicting assertions until curation settles it.
- location: rules/knowledge-base/one-current-attribute-per-value.md
  field: statement
  unstated: The material has a dispute record a second current assertion beside the one it disputes while a duplicate guard keeps one current assertion per node and type, without saying whether the guard spares disputed assertions; the two decide differently for the new assertion of a dispute.
  decided: At most one current assertion that is not disputed; disputed assertions are exempt.
  why: A dispute exists to hold both conflicting assertions until curation settles it.
- location: domain/chat/_context.md
  field: strategic
  unstated: The material does not say whether the chat is core, supporting or generic.
  decided: supporting
  why: Keeping conversations with the assistant serves reading the knowledge base but is not what the system exists for.
- location: domain/chat/tool-call.md
  field: type
  unstated: The material leaves open whether the conversation records belong to the knowledge-base context or to a context of their own.
  decided: entity of a separate chat context
  why: A tool call in a conversation is any tool the assistant used, while a knowledge-base tool call is the audit of one proposal, so the same term carries two meanings.
- location: rules/knowledge-base/source-status-active-or-deleted.md
  field: statement
  unstated: The material types a raw information's and a raw chunk's status with all four node statuses and gives needs-review and merged no meaning for either.
  decided: A raw information and its raw chunks are only ever active or deleted.
  why: Nothing reviews or merges a source, and the only change a source undergoes is its deletion for compliance.
- location: rules/knowledge-base/compliance-deletion-tombstones.md
  field: statement
  unstated: The material gives raw informations, raw chunks and information fragments a supersession time and shows a deleted assertion with no supersession time staying current and blocking an equal new one, without saying what sets these on a compliance deletion.
  decided: A compliance deletion marks its raw information and raw chunks deleted and stamps the moment of the deletion as the supersession time of them, their fragments and every assertion it marks deleted.
  why: A deleted item left without a supersession time keeps counting as current, which is what a deletion exists to end.
- location: domain/knowledge-base/compliance-deletion.md
  field: attributes.affected.type
  unstated: The material holds a compliance deletion's record of what it affected as a structured document without giving its shape.
  decided: string
  why: Nothing in the material reads inside it, so it is carried whole as text.
- location: domain/knowledge-base/curation-action.md
  field: attributes.payload.type
  unstated: The material holds a curation action's payload as a structured document without giving its shape.
  decided: string
  why: Nothing in the material reads inside it, so it is carried whole as text.
- location: domain/chat/message.md
  field: attributes.content.type
  unstated: The material holds a message's content as a structured document without giving its shape.
  decided: string
  why: Nothing in the material reads inside it, so it is carried whole as text.
- location: domain/chat/tool-call.md
  field: attributes.arguments.type
  unstated: The material holds a chat tool call's arguments as a structured document without giving its shape.
  decided: string
  why: Nothing in the material reads inside it, so it is carried whole as text.
- location: domain/chat/tool-call.md
  field: attributes.result.type
  unstated: The material holds a chat tool call's result as a structured document without giving its shape.
  decided: string
  why: Nothing in the material reads inside it, so it is carried whole as text.
- location: domain/chat/graph-view.md
  field: attributes.snapshot.type
  unstated: The material holds a graph view's snapshot as a structured document without giving its shape.
  decided: string
  why: Nothing in the material reads inside it, so it is carried whole as text.
- location: domain/knowledge-base/curation-action.md
  field: attributes.target_id.type
  unstated: The material names the item a curation action acted on without saying what kind of identity it is.
  decided: string
  why: The action targets items of several kinds, so no single element's identity fits it.
- location: domain/knowledge-base/curation-action.md
  field: type
  unstated: The material does not say whether a curation action has an identity of its own or belongs to what it acted on.
  decided: aggregate-root
  why: Each action is recorded once and never changes, and nothing it acted on holds it.
- location: domain/chat/conversation.md
  field: relationships.message.cardinality
  unstated: The material does not say whether a conversation may hold no message.
  decided: 0..*
  why: Nothing in the material requires a message before a conversation exists.
- location: domain/chat/conversation.md
  field: relationships.tool-call.cardinality
  unstated: The material does not say how many tool calls a conversation holds.
  decided: 0..*
  why: A conversation need not call any tool.
- location: rules/knowledge-base/alias-not-blank.md
  field: statement
  unstated: The material refuses a blank alias while a new node holds its proposed name as its canonical alias and the name checks bound only its length; the two decide differently for a node proposal whose name is only whitespace.
  decided: 'The alias rule stands: a node proposal whose name or alias is blank once trimmed records no node or alias.'
  why: The store refuses a blank alias whatever the proposal passed, so no reading in which one is recorded can hold.
- location: rules/knowledge-base/alias-unique-per-node.md
  field: statement
  unstated: The material keeps one alias per normalized form on a node while a node proposal adds each of its proposed aliases; the two decide differently for a proposed alias that differs from one the node holds only in case, accents or spacing.
  decided: 'The uniqueness stands: a proposed name or alias whose normalized form the node already holds is held once.'
  why: Two aliases with one normalized form find the node under the same searches, so the second adds nothing a reader can use.
- location: rules/knowledge-base/alias-unique-per-node.md
  field: statement
  unstated: The material's normalization trims only spaces before collapsing whitespace, so a leading or trailing tab or line break survives as a space, while entity resolution trims every surrounding whitespace; the two give different normalized forms for such a name.
  decided: The normalized form is the one name-normalization states, with every surrounding whitespace trimmed.
  why: A name that differs only by surrounding whitespace names the same entity, so the stricter trim is the one the domain means.
- location: rules/knowledge-base/link-provenance-once-per-fragment.md
  field: statement
  unstated: The material keeps one provenance per fragment on a knowledge link while a re-affirmation adds a provenance for each fragment it cites; the two decide differently for a re-affirmation citing a fragment the knowledge link already holds.
  decided: 'The uniqueness stands: a re-affirmation citing a fragment the assertion already holds adds no second provenance for it.'
  why: A second provenance to the same fragment traces the assertion to no source it was not already traced to.
- location: rules/knowledge-base/attribute-provenance-once-per-fragment.md
  field: statement
  unstated: The material keeps one provenance per fragment on a node attribute while a re-affirmation adds a provenance for each fragment it cites; the two decide differently for a re-affirmation citing a fragment the node attribute already holds.
  decided: 'The uniqueness stands: a re-affirmation citing a fragment the assertion already holds adds no second provenance for it.'
  why: A second provenance to the same fragment traces the assertion to no source it was not already traced to.
---

## Description

Decisions the analysis made where the material was silent.

=== domain/chat/_context
---
strategic: supporting
---

## Description

The chat holds the conversations the owner has with the assistant: their messages, the tools the assistant called while answering, and the view of the knowledge graph each conversation left open.

## Responsibility

It keeps each conversation with the assistant so the owner can return to it.

=== domain/chat/conversation
---
type: aggregate-root
attributes:
- name: title
  type: string
- name: rolling_summary
  type: string
- name: archived_at
  type: datetime
- name: created_at
  type: datetime
  required: true
- name: updated_at
  type: datetime
  required: true
relationships:
- target: message
  type: composition
  cardinality: 0..*
- target: tool-call
  type: composition
  cardinality: 0..*
- target: graph-view
  type: composition
  cardinality: 0..1
---

## Description

One conversation the owner holds with the assistant, with an optional title and running summary, archived once it has an archiving time.

## Responsibility

It is the unit a conversation's messages, tool calls and graph view live and are removed with.

=== domain/chat/graph-view
---
type: entity
aggregate: conversation
attributes:
- name: snapshot
  type: string
  required: true
- name: updated_at
  type: datetime
  required: true
---

## Description

The view of the knowledge graph a conversation last left open.

## Responsibility

It lets the owner return to a conversation and find the graph as they left it.

=== domain/chat/message
---
type: entity
aggregate: conversation
attributes:
- name: role
  type: message-role
  required: true
- name: content
  type: string
  required: true
- name: stop_reason
  type: string
- name: idempotency_key
  type: string
- name: model
  type: string
- name: tokens_in
  type: integer
- name: tokens_out
  type: integer
- name: latency_ms
  type: integer
---

## Description

One turn of a conversation, spoken by the owner or by the assistant.

## Responsibility

It holds what was said in a conversation, in the words it was said.

=== domain/chat/message-role
---
type: enumeration
values:
- user
- assistant
---

## Description

Who spoke a message: the owner, as user, or the assistant.

## Responsibility

It tells the owner's turns from the assistant's.

=== domain/chat/tool-call
---
type: entity
aggregate: conversation
attributes:
- name: tool_name
  type: string
  required: true
- name: arguments
  type: string
  required: true
- name: result
  type: string
- name: is_error
  type: boolean
  required: true
- name: error_message
  type: string
- name: duration_ms
  type: integer
  required: true
relationships:
- target: message
  type: association
  cardinality: 0..1
---

## Description

One call the assistant made to a tool while answering in a conversation, with what it was given, what it returned or the error it met, and how long it took.

## Responsibility

It shows the owner which tools an answer rested on.

=== domain/knowledge-base/_context
---
strategic: core
---

## Description

The knowledge base holds what the owner supplied, the knowledge a language model extracted from it, and the graph of entities and relations built from that extraction.
The owner reads it back by searching it, by asking where an assertion came from, and by listing accepted fragments.

## Responsibility

It lets the owner find what the system knows and trace every answer back to the source it came from.

=== domain/knowledge-base/accepted-fragment-filter
---
type: value-object
attributes:
- name: page
  type: page
relationships:
- target: raw-information
  type: reference
  cardinality: 0..1
- target: llm-run
  type: reference
  cardinality: 0..1
---

## Description

What the owner narrows an accepted-fragment listing to: an LLM run, a raw information, or both, and a page.

## Responsibility

None.

=== domain/knowledge-base/alias-kind
---
type: enumeration
values:
- canonical
- alias
---

## Description

Whether a node alias is its node's canonical name or another name for it.

## Responsibility

None.

=== domain/knowledge-base/allowed-value
---
type: value-object
attributes:
- name: value
  type: string
  required: true
- name: label
  type: string
- name: sort_order
  type: integer
- name: description
  type: string
---

## Description

One value the catalog allows for an attribute key, with the label it is shown by and its place in the key's order.

## Responsibility

It closes the values an attribute of that key may take.

=== domain/knowledge-base/assertion-flag
---
type: enumeration
values:
- uncertain
- disputed
- low-confidence
---

## Description

A warning a search item carries about how far it can be trusted.

## Responsibility

It keeps uncertainty visible instead of hidden.

=== domain/knowledge-base/assertion-status
---
type: enumeration
values:
- active
- uncertain
- disputed
- superseded
- deleted
---

## Description

The state a knowledge link or a node attribute is in.

## Responsibility

None.

=== domain/knowledge-base/attribute-key
---
type: aggregate-root
attributes:
- name: key
  type: string
  required: true
- name: value_type
  type: value-type
  required: true
- name: is_temporal
  type: boolean
- name: allows_multiple_current
  type: boolean
- name: requires_valid_from
  type: boolean
- name: description
  type: string
- name: allowed_values
  type: allowed-value
  many: true
relationships:
- target: node-type
  type: reference
  cardinality: '1'
---

## Description

A named property the catalog allows on the knowledge nodes of one node type, with the type its values take and, where the catalog closes it, the values it allows.

## Responsibility

It fixes which attributes a node may hold and what their values may be.

=== domain/knowledge-base/change-hint
---
type: enumeration
values:
- none
- succession
- correction
---

## Description

What a proposal claims about the current assertion it meets: nothing, that it succeeds it, or that it corrects it.

## Responsibility

None.

=== domain/knowledge-base/compliance-deletion
---
type: aggregate-root
attributes:
- name: executed_at
  type: datetime
  required: true
- name: reason
  type: string
  required: true
- name: affected
  type: string
relationships:
- target: raw-information
  type: reference
  cardinality: '1'
---

## Description

The record that a raw information was deleted to honour a data-protection obligation, and when the deletion was executed.

## Responsibility

It keeps a deleted source's knowledge from being presented as still traceable.

=== domain/knowledge-base/curation-action
---
type: aggregate-root
attributes:
- name: action
  type: string
  required: true
- name: target_kind
  type: string
  required: true
- name: target_id
  type: string
- name: payload
  type: string
- name: reason
  type: string
---

## Description

The record of one action the owner took while curating the knowledge base, naming the kind of item it acted on and, where there is one, that item.

## Responsibility

It keeps an audit trail of what curation changed and why.

=== domain/knowledge-base/directed-ingestion
---
type: value-object
attributes:
- name: source_label
  type: string
- name: items
  type: directed-item
  required: true
  many: true
---

## Description

A batch of fragments, nodes, attributes and links the owner states directly, ingested without a language model reading anything.

## Responsibility

It lets the owner record knowledge exactly as they state it.

=== domain/knowledge-base/directed-item
---
type: value-object
attributes:
- name: ref
  type: string
  required: true
- name: kind
  type: directed-item-kind
  required: true
- name: status
  type: directed-item-status
---

## Description

One fragment, node, attribute or link of a directed ingestion, named by the reference the other items use for it, with how it fared.

## Responsibility

None.

=== domain/knowledge-base/directed-item-kind
---
type: enumeration
values:
- fragment
- node
- attribute
- link
---

## Description

The kind of knowledge a directed item states.

## Responsibility

None.

=== domain/knowledge-base/directed-item-status
---
type: enumeration
values:
- accepted
- consolidated
- superseded-previous
- needs-review
- uncertain
- disputed
- rejected
- error
- dependency-failed
---

## Description

How one directed item fared.

## Responsibility

None.

=== domain/knowledge-base/effective-status
---
type: enumeration
values:
- active
- inactive
- uncertain
- disputed
- superseded
- deleted
---

## Description

The status a knowledge link or node attribute is read with on a given day: its stored assertion status, or inactive where an active assertion has ended.

## Responsibility

It lets an ended assertion read as inactive without that state ever being stored.

=== domain/knowledge-base/entity-match-review
---
type: aggregate-root
attributes:
- name: similarity
  type: decimal
  required: true
relationships:
- target: knowledge-node
  type: reference
  cardinality: '1'
  role: node
- target: knowledge-node
  type: reference
  cardinality: '1'
  role: candidate
---

## Description

The record that a newly created knowledge node resembles an existing one closely enough that the owner must decide whether they are the same entity.

## Responsibility

It is the curation queue's entry for an ambiguous entity.

=== domain/knowledge-base/fragment-status
---
type: enumeration
values:
- proposed
- accepted
- rejected
- superseded
- deleted
---

## Description

The state an information fragment is in.

## Responsibility

None.

=== domain/knowledge-base/information-fragment
---
type: aggregate-root
attributes:
- name: text
  type: string
  required: true
- name: confidence
  type: decimal
  required: true
- name: status
  type: fragment-status
  required: true
- name: created_at
  type: datetime
  required: true
- name: superseded_at
  type: datetime
relationships:
- target: raw-chunk
  type: association
  cardinality: 1..*
  role: source
- target: llm-run
  type: reference
  cardinality: '1'
---

## Description

A piece of knowledge a language model proposed from the chunks of a raw information, with the confidence it gave it.

## Responsibility

It is the link between what a source says and the assertions the graph holds.

=== domain/knowledge-base/ingest-tool
---
type: enumeration
values:
- propose-fragment
- propose-node
- propose-link
- propose-attribute
---

## Description

The kind of proposal a tool call records.
The material spells the values `propose_fragment`, `propose_node`, `propose_link` and `propose_attribute`.

## Responsibility

None.

=== domain/knowledge-base/item-kind
---
type: enumeration
values:
- node
- link
- fragment
---

## Description

What a search item stands for.

## Responsibility

None.

=== domain/knowledge-base/knowledge-link
---
type: aggregate-root
attributes:
- name: status
  type: assertion-status
  required: true
- name: recorded_at
  type: datetime
- name: valid_from
  type: date
- name: valid_to
  type: date
- name: provenance
  type: provenance
  many: true
- name: valid_from_basis
  type: valid-from-basis
- name: confidence
  type: decimal
- name: superseded_at
  type: datetime
relationships:
- target: knowledge-node
  type: reference
  cardinality: '1'
  role: source
- target: knowledge-node
  type: reference
  cardinality: '1'
  role: target
- target: link-type
  type: reference
  cardinality: '1'
- target: llm-run
  type: reference
  cardinality: '1'
- target: knowledge-link
  type: reference
  cardinality: 0..1
  role: supersedes
---

## Description

A relation of one link type asserted from a source knowledge node to a target knowledge node.

## Responsibility

It is the edge the graph is traversed along.

=== domain/knowledge-base/knowledge-node
---
type: aggregate-root
attributes:
- name: canonical_name
  type: string
  required: true
- name: status
  type: node-status
  required: true
relationships:
- target: node-alias
  type: composition
  cardinality: 1..*
- target: knowledge-node
  type: reference
  cardinality: 0..1
  role: merged-into
- target: node-type
  type: reference
  cardinality: '1'
---

## Description

An entity the graph refers to, known by a canonical name and by its aliases.

## Responsibility

It is what links and attributes are asserted about.

=== domain/knowledge-base/link-type
---
type: aggregate-root
attributes:
- name: name
  type: string
  required: true
- name: label
  type: string
  required: true
- name: inverse_name
  type: string
  required: true
- name: description
  type: string
  required: true
- name: is_temporal
  type: boolean
  required: true
- name: allows_multiple_current
  type: boolean
  required: true
- name: requires_valid_from
  type: boolean
  required: true
- name: requires_valid_to_on_change
  type: boolean
  required: true
relationships:
- target: link-type-rule
  type: composition
  cardinality: 0..*
---

## Description

A named kind of relation the catalog holds.

## Responsibility

It fixes which relations a link may assert.

=== domain/knowledge-base/link-type-rule
---
type: entity
aggregate: link-type
attributes:
- name: valid_from
  type: date
- name: valid_to
  type: date
relationships:
- target: node-type
  type: reference
  cardinality: '1'
  role: source
- target: node-type
  type: reference
  cardinality: '1'
  role: target
---

## Description

The catalog's permission for links of one link type from knowledge nodes of one node type to knowledge nodes of another, over a span of days.

## Responsibility

It fixes which pairs of node types a link type may join.

=== domain/knowledge-base/llm-run
---
type: aggregate-root
display: LLMRun
attributes:
- name: model
  type: string
  required: true
- name: prompt_version
  type: string
  required: true
- name: status
  type: run-status
  required: true
- name: attempts
  type: integer
  required: true
- name: started_at
  type: datetime
  required: true
- name: finished_at
  type: datetime
- name: idempotency_key
  type: string
  required: true
- name: summary
  type: run-summary
relationships:
- target: raw-information
  type: reference
  cardinality: '1'
- target: tool-call
  type: composition
  cardinality: 0..*
operations:
- complete
- fail
- retry
---

## Description

One pass of extraction over a raw information, made by a named model under a named prompt version.
Its tool calls are the record of every proposal made within it.

## Responsibility

It is the unit every proposal is made within and accounted for.

=== domain/knowledge-base/node-alias
---
type: entity
aggregate: knowledge-node
attributes:
- name: alias
  type: string
  required: true
- name: kind
  type: alias-kind
  required: true
relationships:
- target: llm-run
  type: reference
  cardinality: 0..1
---

## Description

One name a knowledge node is known by.

## Responsibility

It lets a node be found under any name a source used for it.

=== domain/knowledge-base/node-attribute
---
type: aggregate-root
attributes:
- name: value
  type: string
  required: true
- name: status
  type: assertion-status
  required: true
- name: recorded_at
  type: datetime
- name: provenance
  type: provenance
  many: true
- name: valid_from
  type: date
- name: valid_to
  type: date
- name: valid_from_basis
  type: valid-from-basis
- name: confidence
  type: decimal
- name: superseded_at
  type: datetime
relationships:
- target: knowledge-node
  type: reference
  cardinality: '1'
- target: attribute-key
  type: reference
  cardinality: '1'
- target: llm-run
  type: reference
  cardinality: '1'
- target: node-attribute
  type: reference
  cardinality: 0..1
  role: supersedes
---

## Description

A literal value asserted about a knowledge node.

## Responsibility

It holds what is known about a node that is not a relation to another node.

=== domain/knowledge-base/node-resolution
---
type: enumeration
values:
- matched-existing
- created-new
- needs-review
---

## Description

How a node proposal was resolved against the knowledge nodes already held.

## Responsibility

None.

=== domain/knowledge-base/node-status
---
type: enumeration
values:
- active
- needs-review
- merged
- deleted
---

## Description

The state a knowledge node is in.

## Responsibility

None.

=== domain/knowledge-base/node-type
---
type: aggregate-root
attributes:
- name: name
  type: string
  required: true
- name: description
  type: string
  required: true
---

## Description

A named kind of entity the catalog holds.

## Responsibility

It fixes which kinds of entity a knowledge node may be.

=== domain/knowledge-base/page
---
type: value-object
attributes:
- name: limit
  type: integer
- name: offset
  type: integer
---

## Description

A window over an ordered result: how many items to skip and how many to return.

## Responsibility

None.

=== domain/knowledge-base/prompt-version
---
type: enumeration
values:
- v1
- v2
- v3
- v4
---

## Description

The versions of extraction instructions an extraction can run under.

## Responsibility

None.

=== domain/knowledge-base/proposal
---
type: value-object
attributes:
- name: kind
  type: ingest-tool
  required: true
- name: confidence
  type: decimal
- name: change_hint
  type: change-hint
- name: valid_from
  type: date
- name: valid_to
  type: date
- name: valid_from_basis
  type: valid-from-basis
relationships:
- target: llm-run
  type: reference
  cardinality: '1'
- target: information-fragment
  type: association
  cardinality: 0..*
  role: evidence
- target: raw-chunk
  type: association
  cardinality: 0..*
  role: source
---

## Description

What a language model or the owner puts forward within an LLM run for the knowledge base to take: a fragment, a node, a link or an attribute.
A fragment proposal cites the raw chunks it was read from; a link or attribute proposal cites the information fragments it rests on and may claim validity dates.

## Responsibility

It is what validation judges before anything reaches the knowledge base.

=== domain/knowledge-base/provenance
---
type: value-object
attributes:
- name: recorded_at
  type: datetime
  required: true
relationships:
- target: information-fragment
  type: reference
  cardinality: '1'
---

## Description

The record that a link or an attribute was asserted on the strength of one information fragment, and when that was recorded.

## Responsibility

It lets every assertion be traced back to its source.

=== domain/knowledge-base/raw-chunk
---
type: entity
aggregate: raw-information
attributes:
- name: chunk_index
  type: integer
  required: true
- name: start_offset
  type: integer
- name: end_offset
  type: integer
- name: excerpt
  type: string
  required: true
- name: locator
  type: string
- name: superseded_at
  type: datetime
- name: chunking_version
  type: string
- name: status
  type: node-status
  required: true
---

## Description

One contiguous slice of a raw information's content, at a known position in it.
A chunk with a supersession time has been superseded and is no longer current.

## Responsibility

It anchors an information fragment to the exact place in the source it was read from.

=== domain/knowledge-base/raw-information
---
type: aggregate-root
attributes:
- name: source_type
  type: source-type
  required: true
- name: received_at
  type: datetime
  required: true
- name: content
  type: string
  required: true
- name: title
  type: string
- name: metadata
  type: string
- name: original_input
  type: string
- name: content_hash
  type: string
  required: true
- name: document_date
  type: date
- name: storage_ref
  type: string
- name: status
  type: node-status
  required: true
- name: superseded_at
  type: datetime
relationships:
- target: raw-chunk
  type: composition
  cardinality: 1..*
---

## Description

A piece of unstructured information the owner supplied, preserved as it was received.

## Responsibility

It is the source every extracted piece of knowledge traces back to.

=== domain/knowledge-base/run-status
---
type: enumeration
values:
- running
- completed
- failed
---

## Description

The state an LLM run is in.

## Responsibility

None.

=== domain/knowledge-base/run-summary
---
type: value-object
attributes:
- name: accepted
  type: integer
  required: true
- name: consolidated
  type: integer
  required: true
- name: superseded_previous
  type: integer
  required: true
- name: needs_review
  type: integer
  required: true
- name: uncertain
  type: integer
  required: true
- name: disputed
  type: integer
  required: true
- name: rejected
  type: integer
  required: true
- name: error
  type: integer
  required: true
- name: orphaned_fragments
  type: integer
  required: true
---

## Description

The count of an LLM run's tool calls by validation outcome, with the count of its orphaned information fragments.

## Responsibility

It shows the owner at a glance what a run produced and what it left unused.

=== domain/knowledge-base/search-item
---
type: value-object
attributes:
- name: kind
  type: item-kind
  required: true
- name: layer
  type: search-layer
- name: score
  type: decimal
  required: true
- name: hop
  type: integer
- name: summary
  type: string
- name: flags
  type: assertion-flag
  many: true
relationships:
- target: information-fragment
  type: association
  cardinality: 1..*
  role: provenance
---

## Description

One ranked answer of a search: a knowledge node, a knowledge link or an information fragment, with the fragments that support it.

## Responsibility

It tells the owner what matched, how strongly, and where it came from.

=== domain/knowledge-base/search-layer
---
type: enumeration
values:
- fragment
- node
- chunk
---

## Description

The kinds of knowledge a search matches its text against.

## Responsibility

None.

=== domain/knowledge-base/search-query
---
type: value-object
attributes:
- name: text
  type: string
  required: true
- name: layers
  type: search-layer
  many: true
- name: expand
  type: boolean
- name: expand_depth
  type: integer
- name: link_types
  type: string
  many: true
- name: as_of
  type: date
- name: in_effect_only
  type: boolean
- name: include_uncertain
  type: boolean
- name: page
  type: page
---

## Description

What the owner asks a search for: a text, the layers to read, how to expand through the graph, and which page of results to return.
Link types are named by their catalog name.

## Responsibility

It carries every choice the owner makes about one search.

=== domain/knowledge-base/source-type
---
type: enumeration
values:
- pdf
- email
- meeting-minutes
- chat
- article
- transcript
- other
---

## Description

The kind of source a raw information was received as.
The material's own words for four of the values are `ata` (meeting-minutes), `artigo` (article), `transcricao` (transcript) and `outro` (other).

## Responsibility

It tells the owner what kind of source a piece of knowledge came from.

=== domain/knowledge-base/tool-call
---
type: entity
aggregate: llm-run
attributes:
- name: tool_name
  type: ingest-tool
  required: true
- name: arguments
  type: string
- name: result
  type: string
- name: validation_outcome
  type: validation-outcome
  required: true
- name: created_at
  type: datetime
  required: true
---

## Description

The record of one proposal made within an LLM run: what was proposed, what it was answered and how validation judged it.

## Responsibility

It keeps every proposal accountable, whether it was taken or refused.

=== domain/knowledge-base/valid-from-basis
---
type: enumeration
values:
- stated
- document
- received
---

## Description

What justifies an assertion's validity start: a date the source states, the document's own date, or the date the source was received.

## Responsibility

None.

=== domain/knowledge-base/validation-outcome
---
type: enumeration
values:
- accepted
- consolidated
- superseded-previous
- needs-review
- uncertain
- disputed
- rejected
- error
---

## Description

How validation judged the proposal one tool call records.

## Responsibility

None.

=== domain/knowledge-base/value-type
---
type: enumeration
values:
- date
- number
- text
- bool
---

## Description

The type the values of an attribute key take.

## Responsibility

None.

=== rules/chat/message-idempotency-key-unique
---
type: invariant
statement: A conversation holds at most one message with one idempotency key.
constrains:
- domain/chat/conversation
- domain/chat/message
---

## Description

None.

=== rules/chat/tool-call-outlives-its-message
---
type: invariant
statement: Removing a message keeps the tool calls that named it in their conversation, naming no message.
constrains:
- domain/chat/conversation
- domain/chat/tool-call
- domain/chat/message
---

## Description

None.

=== rules/knowledge-base/affected-nodes-follow-merges
---
type: policy
statement: An affected knowledge node that was merged is listed as the knowledge node it was merged into.
constrains:
- domain/knowledge-base/llm-run
- domain/knowledge-base/knowledge-node
consistency: eventual
---

## Description

None.

=== rules/knowledge-base/affected-nodes-of-a-run
---
type: policy
statement: An LLM run's affected knowledge nodes are those its node proposals resolved to and those joined or described by its link and attribute proposals that were accepted, consolidated, superseded a previous assertion or were disputed, each listed once in the order first reached.
constrains:
- domain/knowledge-base/llm-run
- domain/knowledge-base/knowledge-node
- domain/knowledge-base/proposal
consistency: eventual
---

## Description

None.

=== rules/knowledge-base/affected-nodes-only-when-completed
---
type: invariant
statement: An LLM run lists its affected knowledge nodes only when its status is completed.
constrains:
- domain/knowledge-base/llm-run
- domain/knowledge-base/run-status
---

## Description

None.

=== rules/knowledge-base/alias-matching
---
type: invariant
statement: Aliases are matched without language stemming and without regard to accents.
constrains:
- domain/knowledge-base/knowledge-node
---

## Description

None.

=== rules/knowledge-base/alias-not-blank
---
type: invariant
statement: A node alias MUST NOT be empty once surrounding whitespace is trimmed.
constrains:
- domain/knowledge-base/node-alias
---

## Description

None.

=== rules/knowledge-base/alias-unique-per-node
---
type: invariant
statement: A knowledge node holds at most one alias of one normalized form.
constrains:
- domain/knowledge-base/knowledge-node
- domain/knowledge-base/node-alias
---

## Description

None.

=== rules/knowledge-base/allowed-document-types
---
type: invariant
statement: The allowed values of doc_type of Document, in sort order from 1, are «proposta» labelled «Proposta», «ata» labelled «Ata», «contrato» labelled «Contrato», «relatório» labelled «Relatório» and «outro» labelled «Outro».
constrains:
- domain/knowledge-base/attribute-key
- domain/knowledge-base/allowed-value
---

## Description

None.

=== rules/knowledge-base/allowed-event-types
---
type: invariant
statement: The allowed values of event_type of Event, in sort order from 1, are «reunião» labelled «Reunião», «go-live» labelled «Go-live», «workshop» labelled «Workshop», «outro» labelled «Outro», «cobrança» labelled «Cobrança/Follow-up», «decisão» labelled «Decisão», «escalonamento» labelled «Escalonamento», «bloqueio» labelled «Bloqueio/Impedimento» and «marco» labelled «Marco/Entrega».
constrains:
- domain/knowledge-base/attribute-key
- domain/knowledge-base/allowed-value
---

## Description

None.

=== rules/knowledge-base/allowed-project-statuses
---
type: invariant
statement: The allowed values of status_text of Project, in sort order from 1, are «planejado» labelled «Planejado», «em aprovação» labelled «Em aprovação», «aprovado» labelled «Aprovado», «em andamento» labelled «Em andamento», «pausado» labelled «Pausado», «concluído» labelled «Concluído», «cancelado» labelled «Cancelado» and «outro» labelled «Outro».
constrains:
- domain/knowledge-base/attribute-key
- domain/knowledge-base/allowed-value
---

## Description

None.

=== rules/knowledge-base/allowed-task-priorities
---
type: invariant
statement: The allowed values of priority of Task, in sort order from 1, are «baixa» labelled «Baixa», «média» labelled «Média», «alta» labelled «Alta» and «crítica» labelled «Crítica».
constrains:
- domain/knowledge-base/attribute-key
- domain/knowledge-base/allowed-value
---

## Description

None.

=== rules/knowledge-base/allowed-task-statuses
---
type: invariant
statement: The allowed values of status of Task, in sort order from 1, are «a fazer» labelled «A fazer», «em andamento» labelled «Em andamento», «bloqueada» labelled «Bloqueada», «em revisão» labelled «Em revisão», «concluída» labelled «Concluída», «cancelada» labelled «Cancelada» and «outro» labelled «Outro».
constrains:
- domain/knowledge-base/attribute-key
- domain/knowledge-base/allowed-value
---

## Description

None.

=== rules/knowledge-base/allowed-value-unique-per-key
---
type: invariant
statement: No two allowed values of one attribute key hold the same value.
constrains:
- domain/knowledge-base/attribute-key
- domain/knowledge-base/allowed-value
---

## Description

None.

=== rules/knowledge-base/ambiguous-candidates-need-review
---
type: policy
statement: A node proposal resolved by neither an exact alias nor a single strong candidate, with at least one active knowledge node of its node type at a similarity of 0.55 or more, creates a knowledge node in status needs-review and records an entity match review pairing it with each such node and its similarity.
constrains:
- domain/knowledge-base/proposal
- domain/knowledge-base/knowledge-node
- domain/knowledge-base/entity-match-review
- domain/knowledge-base/node-resolution
- domain/knowledge-base/node-status
consistency: eventual
---

## Description

None.

=== rules/knowledge-base/attribute-confidence-range
---
type: invariant
statement: A node attribute's confidence is between 0 and 1 inclusive.
constrains:
- domain/knowledge-base/node-attribute
---

## Description

None.

=== rules/knowledge-base/attribute-key-for-node-type
---
type: invariant
statement: An attribute proposal MUST name an attribute key the catalog holds for the node type of its knowledge node.
constrains:
- domain/knowledge-base/proposal
- domain/knowledge-base/attribute-key
---

## Description

None.

=== rules/knowledge-base/attribute-key-unique-per-node-type
---
type: invariant
statement: No two attribute keys of one node type hold the same key.
constrains:
- domain/knowledge-base/attribute-key
---

## Description

None.

=== rules/knowledge-base/attribute-never-supersedes-itself
---
type: invariant
statement: A node attribute never names itself as the one it supersedes.
constrains:
- domain/knowledge-base/node-attribute
---

## Description

None.

=== rules/knowledge-base/attribute-proposal-check-order
---
type: invariant
statement: An attribute proposal is checked for an existing knowledge node, then for an attribute key known for its node type, then for a value of the key's type and allowed values, then for cited fragments that exist and belong to its LLM run, then for its dates, then for its confidence, then for the anchoring of its fragments, and stops at the first check it fails.
constrains:
- domain/knowledge-base/proposal
---

## Description

None.

=== rules/knowledge-base/attribute-provenance-once-per-fragment
---
type: invariant
statement: A node attribute holds at most one provenance per information fragment.
constrains:
- domain/knowledge-base/node-attribute
- domain/knowledge-base/provenance
---

## Description

None.

=== rules/knowledge-base/attribute-start-has-basis
---
type: invariant
statement: A node attribute that holds a validity start holds the basis of that start.
constrains:
- domain/knowledge-base/node-attribute
- domain/knowledge-base/valid-from-basis
---

## Description

None.

=== rules/knowledge-base/attribute-validity-ordered
---
type: invariant
statement: A node attribute that holds both a validity start and a validity end holds the start strictly before the end.
constrains:
- domain/knowledge-base/node-attribute
---

## Description

None.

=== rules/knowledge-base/attribute-value-in-allowed-values
---
type: invariant
statement: An attribute proposal for a key that has allowed values MUST carry one of them exactly as written.
constrains:
- domain/knowledge-base/proposal
- domain/knowledge-base/attribute-key
---

## Description

None.

=== rules/knowledge-base/attribute-value-parses
---
type: invariant
statement: 'An attribute proposal''s value MUST read as its key''s value type: a real calendar date written as year-month-day for date, digits with an optional leading minus and an optional decimal part for number, exactly true or false for bool, and any text for text.'
expression: 'date: ^\d{4}-\d{2}-\d{2}$ naming an existing day; number: ^-?\d+(\.\d+)?$ and finite; bool: ^(true|false)$; text: any'
constrains:
- domain/knowledge-base/proposal
- domain/knowledge-base/attribute-key
- domain/knowledge-base/value-type
---

## Description

None.

=== rules/knowledge-base/below-confidence-floor-records-nothing
---
type: invariant
statement: A link or attribute proposal whose confidence is below 0.40 records no knowledge link or node attribute.
constrains:
- domain/knowledge-base/proposal
---

## Description

None.

=== rules/knowledge-base/caller-never-states-received
---
type: invariant
statement: A proposal MUST NOT state the basis received.
constrains:
- domain/knowledge-base/proposal
- domain/knowledge-base/valid-from-basis
---

## Description

None.

=== rules/knowledge-base/candidate-similarity
---
type: invariant
statement: A knowledge node's similarity to a node proposal is the highest trigram similarity between the proposal's name and any of the node's aliases.
constrains:
- domain/knowledge-base/knowledge-node
- domain/knowledge-base/node-alias
---

## Description

None.

=== rules/knowledge-base/catalog-attribute-keys
---
type: invariant
statement: 'The catalog holds exactly nineteen attribute keys, each with its value type: for Project deadline (date), start_date (date), status_text (text) and budget (number); for Event event_date (date), end_date (date) and event_type (text); for Person email (text), phone (text) and birth_date (date); for Organization cnpj (text) and website (text); for Location city (text) and address (text); for Concept definition (text); for Document doc_type (text); and for Task status (text), priority (text) and due_date (date).'
constrains:
- domain/knowledge-base/attribute-key
- domain/knowledge-base/value-type
---

## Description

None.

=== rules/knowledge-base/catalog-link-type-rules
---
type: invariant
statement: 'The catalog permits, each with no validity window, exactly these pairs of source and target node types: participates_in from Person to Project or Event; member_of from Person to Organization; holds_role from Person to Role; responsible_for from Person to Project, Event or Task; reports_to from Person to Person; part_of from Organization to Organization, from Project to Project, from Event to Project and from Task to Project; located_in from Organization or Event to Location; organizes from Organization or Person to Event; belongs_to_category from Person, Organization, Project, Event, Concept or Location to Category; related_to from Concept or Project to Concept; concerns from Document to Project, Event or Organization and from Event to Project; delivered_to from Document to Person; and sponsors from Organization to Project.'
constrains:
- domain/knowledge-base/link-type
- domain/knowledge-base/link-type-rule
---

## Description

None.

=== rules/knowledge-base/catalog-link-types
---
type: invariant
statement: 'The catalog holds exactly thirteen link types, each with its label and its inverse: participates_in «participa de» (has_participant), member_of «é membro de» (has_member), holds_role «exerce o cargo de» (role_held_by), responsible_for «é responsável por» (under_responsibility_of), reports_to «reporta a» (manages), part_of «faz parte de» (has_part), located_in «localizado em» (location_of), organizes «organiza» (organized_by), belongs_to_category «pertence à categoria» (contains), related_to «relacionado a» (related_to), concerns «trata de» (addressed_by), delivered_to «entregue a» (recipient_of) and sponsors «patrocina» (sponsored_by).'
constrains:
- domain/knowledge-base/link-type
---

## Description

None.

=== rules/knowledge-base/catalog-node-types
---
type: invariant
statement: 'The catalog holds exactly ten node types, described as follows: Person «Pessoa física», Organization «Empresa, órgão, time formal», Project «Projeto/iniciativa com objetivo e ciclo de vida», Event «Acontecimento pontual (reunião, go-live, workshop)», Role «Cargo/função (vocabulário controlado)», Category «Rótulo taxonômico para classificação», Concept «Conceito/tema referenciável», Location «Lugar físico ou lógico», Document «Artefato referenciado no conteúdo (proposta, ata, contrato, relatório); não é a fonte ingerida» and Task «Tarefa/atividade com responsável, prazo e ciclo de vida».'
constrains:
- domain/knowledge-base/node-type
---

## Description

None.

=== rules/knowledge-base/chunk-excerpt-is-verbatim
---
type: invariant
statement: A raw chunk's excerpt is exactly the content between its offsets.
constrains:
- domain/knowledge-base/raw-chunk
---

## Description

None.

=== rules/knowledge-base/chunk-index-follows-content
---
type: invariant
statement: A raw information's chunks are indexed from 0 in the order they appear in its content.
constrains:
- domain/knowledge-base/raw-chunk
---

## Description

None.

=== rules/knowledge-base/chunk-layer-matches-current-chunks
---
type: policy
statement: The chunk layer matches only raw chunks that are not superseded.
constrains:
- domain/knowledge-base/search-layer
- domain/knowledge-base/raw-information
---

## Description

None.

=== rules/knowledge-base/chunk-listing-order
---
type: invariant
statement: A raw information's chunks are listed by index ascending.
constrains:
- domain/knowledge-base/raw-chunk
---

## Description

None.

=== rules/knowledge-base/chunk-match-cites-its-fragment
---
type: invariant
statement: A chunk-layer match that supports an information fragment the search matched is shown as that fragment's excerpt in the fragment's search item.
constrains:
- domain/knowledge-base/search-item
---

## Description

None.

=== rules/knowledge-base/chunk-match-never-surfaces
---
type: invariant
statement: A chunk-layer match never surfaces as a search item.
constrains:
- domain/knowledge-base/search-item
---

## Description

None.

=== rules/knowledge-base/chunk-offsets-count-code-points
---
type: invariant
statement: A raw chunk's start and end offsets count Unicode code points, the start inclusive and the end exclusive.
constrains:
- domain/knowledge-base/raw-chunk
---

## Description

None.

=== rules/knowledge-base/chunk-offsets-ordered
---
type: invariant
statement: A raw chunk's start offset is at least 0 and its end offset is greater than its start offset.
constrains:
- domain/knowledge-base/raw-chunk
---

## Description

None.

=== rules/knowledge-base/chunk-position-unique
---
type: invariant
statement: A raw information holds at most one raw chunk of one chunking version at one index.
constrains:
- domain/knowledge-base/raw-information
- domain/knowledge-base/raw-chunk
---

## Description

None.

=== rules/knowledge-base/chunking-version
---
type: invariant
statement: Every raw chunk records the version of the chunking that cut it, and that version is v1.
constrains:
- domain/knowledge-base/raw-chunk
---

## Description

None.

=== rules/knowledge-base/chunks-never-cross-blocks
---
type: invariant
statement: A raw information's content is first cut into blocks at the hard boundaries of its source type, and no raw chunk crosses the edge of a block.
constrains:
- domain/knowledge-base/raw-information
- domain/knowledge-base/raw-chunk
- domain/knowledge-base/source-type
---

## Description

None.

=== rules/knowledge-base/cited-fragments-anchored
---
type: invariant
statement: Every information fragment a link or attribute proposal cites MUST be drawn from a raw chunk of the raw information of the proposal's LLM run.
constrains:
- domain/knowledge-base/proposal
- domain/knowledge-base/information-fragment
---

## Description

None.

=== rules/knowledge-base/cited-fragments-exist
---
type: invariant
statement: Every information fragment a link or attribute proposal cites MUST exist.
constrains:
- domain/knowledge-base/proposal
- domain/knowledge-base/information-fragment
---

## Description

None.

=== rules/knowledge-base/cited-fragments-in-run
---
type: invariant
statement: Every information fragment a link or attribute proposal cites MUST belong to the proposal's LLM run.
constrains:
- domain/knowledge-base/proposal
- domain/knowledge-base/information-fragment
---

## Description

None.

=== rules/knowledge-base/closed-attribute-keys
---
type: invariant
statement: The catalog attribute keys that hold allowed values are exactly doc_type of Document, event_type of Event, status_text of Project, and status and priority of Task.
constrains:
- domain/knowledge-base/attribute-key
- domain/knowledge-base/allowed-value
---

## Description

None.

=== rules/knowledge-base/closing-stamps-finish-time
---
type: invariant
statement: Completing or failing an LLM run sets its finish time to the moment it closed.
constrains:
- domain/knowledge-base/llm-run
---

## Description

None.

=== rules/knowledge-base/compliance-deletion-propagates
---
type: policy
statement: A compliance deletion marks deleted the information fragments of its raw information and every knowledge link and node attribute whose only provenance is one of those fragments.
constrains:
- domain/knowledge-base/compliance-deletion
- domain/knowledge-base/information-fragment
- domain/knowledge-base/knowledge-link
- domain/knowledge-base/node-attribute
consistency: eventual
---

## Description

None.

=== rules/knowledge-base/compliance-deletion-tombstones
---
type: policy
statement: A compliance deletion marks its raw information and each of its raw chunks deleted and gives them, its information fragments and every knowledge link and node attribute it marks deleted the moment of the deletion as their supersession time.
constrains:
- domain/knowledge-base/compliance-deletion
- domain/knowledge-base/raw-information
- domain/knowledge-base/raw-chunk
- domain/knowledge-base/information-fragment
- domain/knowledge-base/knowledge-link
- domain/knowledge-base/node-attribute
consistency: eventual
---

## Description

None.

=== rules/knowledge-base/compliance-refusal-takes-precedence
---
type: policy
statement: A provenance read whose chain reaches a compliance deletion is refused for that deletion ahead of any other refusal the read would meet, except the refusal of a fragment that is not accepted.
constrains:
- domain/knowledge-base/provenance
- domain/knowledge-base/compliance-deletion
---

## Description

None.

=== rules/knowledge-base/conflict-disputes
---
type: policy
statement: A proposal for a type that does not allow multiple current assertions that meets a current assertion as a dispute marks that assertion disputed and records a new assertion in status disputed that supersedes nothing.
constrains:
- domain/knowledge-base/proposal
- domain/knowledge-base/knowledge-link
- domain/knowledge-base/node-attribute
- domain/knowledge-base/assertion-status
consistency: eventual
---

## Description

None.

=== rules/knowledge-base/consolidation-precedence
---
type: policy
statement: A link or attribute proposal is taken as a re-affirmation, else as a correction, else as a succession, else as a dispute, else as a new assertion, by the first of these whose condition it meets.
constrains:
- domain/knowledge-base/proposal
- domain/knowledge-base/knowledge-link
- domain/knowledge-base/node-attribute
consistency: eventual
---

## Description

None.

=== rules/knowledge-base/consolidation-records-provenance
---
type: policy
statement: A taken link or attribute proposal records, on the assertion it lands on, one provenance for each information fragment it cites.
constrains:
- domain/knowledge-base/proposal
- domain/knowledge-base/knowledge-link
- domain/knowledge-base/node-attribute
- domain/knowledge-base/provenance
consistency: eventual
---

## Description

None.

=== rules/knowledge-base/content-hash-is-sha256
---
type: invariant
statement: A raw information's content hash is the SHA-256 digest of its content encoded as UTF-8, written as 64 lowercase hexadecimal characters.
constrains:
- domain/knowledge-base/raw-information
---

## Description

None.

=== rules/knowledge-base/content-hash-unique
---
type: invariant
statement: No two raw informations hold the same content hash.
constrains:
- domain/knowledge-base/raw-information
---

## Description

None.

=== rules/knowledge-base/content-length
---
type: invariant
statement: A raw information's content MUST hold between 1 and 10,485,760 UTF-16 code units.
constrains:
- domain/knowledge-base/raw-information
---

## Description

None.

=== rules/knowledge-base/contentless-blocks-single-chunk
---
type: invariant
statement: Content that is not empty but whose blocks hold nothing is one raw chunk spanning the whole content.
constrains:
- domain/knowledge-base/raw-information
- domain/knowledge-base/raw-chunk
---

## Description

None.

=== rules/knowledge-base/correction-replaces
---
type: policy
statement: A proposal with change hint correction that meets a current assertion supersedes it, leaving its validity end as it was, and records a new assertion that names it as the one it supersedes.
constrains:
- domain/knowledge-base/proposal
- domain/knowledge-base/knowledge-link
- domain/knowledge-base/node-attribute
- domain/knowledge-base/change-hint
- domain/knowledge-base/assertion-status
consistency: eventual
---

## Description

None.

=== rules/knowledge-base/correction-requires-errata-evidence
---
type: invariant
statement: A proposal with change hint correction MUST cite at least one information fragment whose text contains, in any letter case, errata, errado, correção, corrigir, correction or correcao.
constrains:
- domain/knowledge-base/proposal
- domain/knowledge-base/change-hint
- domain/knowledge-base/information-fragment
---

## Description

None.

=== rules/knowledge-base/current-assertion
---
type: policy
statement: A knowledge link or node attribute is current while it has neither a validity end nor a supersession time.
constrains:
- domain/knowledge-base/knowledge-link
- domain/knowledge-base/node-attribute
consistency: eventual
---

## Description

None.

=== rules/knowledge-base/date-check-order
---
type: invariant
statement: A proposal's dates are checked for a start before the end, then for correction evidence, then for a basis to a stated start, then for an available required start, and the proposal is refused at the first check it fails.
constrains:
- domain/knowledge-base/proposal
---

## Description

None.

=== rules/knowledge-base/default-prompt-version
---
type: invariant
statement: A document ingestion that names no prompt version runs under v4.
constrains:
- domain/knowledge-base/llm-run
- domain/knowledge-base/prompt-version
---

## Description

None.

=== rules/knowledge-base/directed-attribute-value-as-text
---
type: invariant
statement: A directed attribute's number or boolean value is proposed as its text form, a boolean as true or false.
constrains:
- domain/knowledge-base/directed-item
- domain/knowledge-base/proposal
---

## Description

None.

=== rules/knowledge-base/directed-attribute-value-shape
---
type: invariant
statement: A directed attribute's value MUST be a text of 1 to 2000 characters, a finite number or a boolean.
constrains:
- domain/knowledge-base/directed-item
---

## Description

None.

=== rules/knowledge-base/directed-defaults
---
type: invariant
statement: A directed attribute or link is proposed with change hint none and, when it states no basis, with basis stated.
constrains:
- domain/knowledge-base/directed-ingestion
- domain/knowledge-base/proposal
- domain/knowledge-base/change-hint
- domain/knowledge-base/valid-from-basis
---

## Description

None.

=== rules/knowledge-base/directed-dependency-failed
---
type: invariant
statement: A directed attribute or link whose node or evidence reference names nothing is not proposed and is reported dependency-failed, naming the first missing reference in the order node then evidence for an attribute and source, target then evidence for a link.
constrains:
- domain/knowledge-base/directed-item
- domain/knowledge-base/directed-item-status
---

## Description

None.

=== rules/knowledge-base/directed-dispatch-order
---
type: invariant
statement: A directed ingestion proposes its fragments, then its nodes, then its attributes, then its links, each group in the order given, and reports its items in that same order.
constrains:
- domain/knowledge-base/directed-ingestion
- domain/knowledge-base/directed-item
- domain/knowledge-base/directed-item-kind
---

## Description

None.

=== rules/knowledge-base/directed-fragments-anchor-first-chunk
---
type: invariant
statement: A directed ingestion anchors every fragment to the first raw chunk of its raw information.
constrains:
- domain/knowledge-base/directed-ingestion
- domain/knowledge-base/raw-chunk
---

## Description

None.

=== rules/knowledge-base/directed-full-confidence
---
type: invariant
statement: A directed ingestion proposes every fragment, attribute and link at confidence 1.0.
constrains:
- domain/knowledge-base/directed-ingestion
- domain/knowledge-base/proposal
---

## Description

None.

=== rules/knowledge-base/directed-ingestion-run
---
type: invariant
statement: A directed ingestion opens an LLM run of model directed and prompt version directed-v1 and calls no language model.
constrains:
- domain/knowledge-base/directed-ingestion
- domain/knowledge-base/llm-run
---

## Description

None.

=== rules/knowledge-base/directed-item-status
---
type: invariant
statement: A directed item's status is accepted for a recorded fragment, needs-review or accepted for a node according to its resolution, its outcome for a taken attribute or link, error for a refusal with a system error and rejected for any other refusal.
constrains:
- domain/knowledge-base/directed-item
- domain/knowledge-base/directed-item-status
- domain/knowledge-base/node-resolution
---

## Description

None.

=== rules/knowledge-base/directed-later-reference-wins
---
type: invariant
statement: When two directed items of one kind share a reference, the reference names the later one.
constrains:
- domain/knowledge-base/directed-item
---

## Description

None.

=== rules/knowledge-base/directed-pinned-node
---
type: invariant
statement: A directed node that names an existing identity resolves to that knowledge node without entity resolution, whatever node type, name or aliases it states, provided the node exists and is active.
constrains:
- domain/knowledge-base/directed-item
- domain/knowledge-base/knowledge-node
- domain/knowledge-base/node-status
---

## Description

None.

=== rules/knowledge-base/directed-reference-length
---
type: invariant
statement: A directed item's reference MUST hold between 1 and 120 characters.
constrains:
- domain/knowledge-base/directed-item
---

## Description

None.

=== rules/knowledge-base/directed-requires-fragment-and-node
---
type: invariant
statement: A directed ingestion MUST carry at least one fragment and one node.
constrains:
- domain/knowledge-base/directed-ingestion
---

## Description

None.

=== rules/knowledge-base/directed-run-completes
---
type: invariant
statement: A directed ingestion completes its LLM run whatever its items' statuses.
constrains:
- domain/knowledge-base/directed-ingestion
- domain/knowledge-base/llm-run
---

## Description

None.

=== rules/knowledge-base/directed-source-content
---
type: invariant
statement: A directed ingestion records a chat raw information whose content lists each fragment as its reference and text, then its label when it has one, then the moment of ingestion and a nonce of its own.
constrains:
- domain/knowledge-base/directed-ingestion
- domain/knowledge-base/raw-information
- domain/knowledge-base/source-type
---

## Description

None.

=== rules/knowledge-base/directed-source-label-length
---
type: invariant
statement: A directed ingestion's label MUST hold between 1 and 200 characters.
constrains:
- domain/knowledge-base/directed-ingestion
---

## Description

None.

=== rules/knowledge-base/directed-turn-is-original-input
---
type: invariant
statement: A directed ingestion made from a chat turn records the turn's excerpt as its raw information's original input.
constrains:
- domain/knowledge-base/directed-ingestion
- domain/knowledge-base/raw-information
---

## Description

None.

=== rules/knowledge-base/document-ingestion-extracts-new-content
---
type: policy
statement: Ingesting a document records it and extracts it through its new LLM run, and extracts nothing when its content is already held.
constrains:
- domain/knowledge-base/raw-information
- domain/knowledge-base/llm-run
consistency: eventual
---

## Description

None.

=== rules/knowledge-base/effective-status
---
type: policy
statement: A knowledge link's or node attribute's effective status is inactive when its status is active and its validity ends on or before today, and is its status otherwise.
constrains:
- domain/knowledge-base/knowledge-link
- domain/knowledge-base/node-attribute
- domain/knowledge-base/effective-status
- domain/knowledge-base/assertion-status
consistency: eventual
---

## Description

None.

=== rules/knowledge-base/email-header-block
---
type: invariant
statement: An email's header block ends at its first blank line, whose line break belongs to no block.
constrains:
- domain/knowledge-base/raw-information
- domain/knowledge-base/source-type
---

## Description

None.

=== rules/knowledge-base/email-quote-blocks
---
type: invariant
statement: After its header block, an email's content starts a new block at every non-blank line whose quotation differs from that of the previous non-blank line, a line being quoted when its first character after leading spaces or tabs is a greater-than sign.
constrains:
- domain/knowledge-base/raw-information
- domain/knowledge-base/source-type
---

## Description

None.

=== rules/knowledge-base/empty-provenance-chain-refused
---
type: invariant
statement: A provenance read of an existing item whose provenance chain is empty is refused.
constrains:
- domain/knowledge-base/provenance
---

## Description

None.

=== rules/knowledge-base/end-on-change-link-types
---
type: invariant
statement: The catalog link types that require a validity end on change are exactly reports_to, part_of and located_in.
constrains:
- domain/knowledge-base/link-type
---

## Description

None.

=== rules/knowledge-base/every-proposal-audited
---
type: invariant
statement: Every proposal made within an LLM run is recorded as one of its tool calls, with its arguments, its result and its validation outcome, whichever transport carried it and whether it was taken, refused or failed.
constrains:
- domain/knowledge-base/llm-run
- domain/knowledge-base/tool-call
- domain/knowledge-base/proposal
---

## Description

None.

=== rules/knowledge-base/exact-alias-resolves
---
type: invariant
statement: A node proposal whose name equals an alias of an active knowledge node of its node type resolves to that node as matched-existing.
constrains:
- domain/knowledge-base/proposal
- domain/knowledge-base/knowledge-node
- domain/knowledge-base/node-alias
- domain/knowledge-base/node-resolution
---

## Description

None.

=== rules/knowledge-base/expanded-link-requires-provenance
---
type: policy
statement: A knowledge link expansion reaches surfaces as a search item only when it holds provenance.
constrains:
- domain/knowledge-base/knowledge-link
- domain/knowledge-base/search-item
---

## Description

None.

=== rules/knowledge-base/expansion-as-of-view
---
type: policy
statement: Expansion under a query that names an as-of date reaches only knowledge links whose validity has no start or starts on or before that date and has no end or ends after it.
constrains:
- domain/knowledge-base/search-query
- domain/knowledge-base/knowledge-link
---

## Description

None.

=== rules/knowledge-base/expansion-current-view
---
type: policy
statement: Expansion under a query that names no as-of date reaches only knowledge links that have no validity end.
constrains:
- domain/knowledge-base/search-query
- domain/knowledge-base/knowledge-link
---

## Description

None.

=== rules/knowledge-base/expansion-decay
---
type: policy
statement: A knowledge link reached at hop h scores 0.5 raised to the power h times the score of the matched knowledge node it was reached from.
constrains:
- domain/knowledge-base/knowledge-link
- domain/knowledge-base/search-item
---

## Description

None.

=== rules/knowledge-base/expansion-depth-bounds
---
type: invariant
statement: A search query's expansion depth MUST be between 1 and 3 hops.
constrains:
- domain/knowledge-base/search-query
---

## Description

None.

=== rules/knowledge-base/expansion-follows-both-directions
---
type: invariant
statement: Expansion follows a knowledge link from either of its ends.
constrains:
- domain/knowledge-base/knowledge-link
---

## Description

None.

=== rules/knowledge-base/expansion-in-effect-only
---
type: policy
statement: Expansion under an in-effect-only query reaches no knowledge link whose validity starts after the query's as-of date, or after today when the query names none.
constrains:
- domain/knowledge-base/search-query
- domain/knowledge-base/knowledge-link
---

## Description

None.

=== rules/knowledge-base/expansion-reaches-merged-node-survivor
---
type: invariant
statement: Expansion that reaches a merged knowledge node reaches the knowledge node it was merged into in its place.
constrains:
- domain/knowledge-base/knowledge-node
---

## Description

None.

=== rules/knowledge-base/expansion-restricted-to-named-link-types
---
type: policy
statement: Expansion under a query that names link types follows only links of those types.
constrains:
- domain/knowledge-base/search-query
- domain/knowledge-base/knowledge-link
---

## Description

None.

=== rules/knowledge-base/expansion-skips-deleted-nodes
---
type: invariant
statement: Expansion never reaches a knowledge node whose status is deleted.
constrains:
- domain/knowledge-base/knowledge-node
---

## Description

None.

=== rules/knowledge-base/expansion-skips-superseded-and-deleted-links
---
type: invariant
statement: Expansion never reaches a knowledge link whose status is superseded or deleted.
constrains:
- domain/knowledge-base/knowledge-link
---

## Description

None.

=== rules/knowledge-base/expansion-starts-from-matched-nodes
---
type: policy
statement: A search that expands does so through the knowledge graph from its matched knowledge nodes.
constrains:
- domain/knowledge-base/search-query
- domain/knowledge-base/knowledge-link
---

## Description

None.

=== rules/knowledge-base/extraction-anchors-to-read-chunk
---
type: invariant
statement: A fragment an extraction proposes is anchored to the raw chunk being read, whatever raw chunks the model names.
constrains:
- domain/knowledge-base/proposal
- domain/knowledge-base/information-fragment
---

## Description

None.

=== rules/knowledge-base/extraction-closes-its-run
---
type: invariant
statement: An extraction completes its LLM run once it has read every chunk and fails it when it stops on an error.
constrains:
- domain/knowledge-base/llm-run
- domain/knowledge-base/run-status
---

## Description

None.

=== rules/knowledge-base/extraction-fails-on-repeated-system-errors
---
type: invariant
statement: An extraction fails its LLM run when three proposals in a row within one chunk fail with a system error.
constrains:
- domain/knowledge-base/llm-run
---

## Description

None.

=== rules/knowledge-base/extraction-reads-chunks-in-order
---
type: invariant
statement: An extraction reads its raw information's chunks one at a time in index order, showing the model each one with the source's type, document date, title and reception time and the last 200 characters of the chunk before it.
constrains:
- domain/knowledge-base/llm-run
---

## Description

None.

=== rules/knowledge-base/extraction-requires-running-run
---
type: invariant
statement: An extraction runs only over an LLM run whose status is running.
constrains:
- domain/knowledge-base/llm-run
- domain/knowledge-base/run-status
---

## Description

None.

=== rules/knowledge-base/fragment-chunks-exist
---
type: invariant
statement: Every raw chunk a fragment proposal cites MUST exist.
constrains:
- domain/knowledge-base/proposal
- domain/knowledge-base/raw-chunk
---

## Description

None.

=== rules/knowledge-base/fragment-chunks-in-run-source
---
type: invariant
statement: Every raw chunk a fragment proposal cites MUST belong to the raw information of the proposal's LLM run.
constrains:
- domain/knowledge-base/proposal
- domain/knowledge-base/raw-chunk
---

## Description

None.

=== rules/knowledge-base/fragment-confidence-range
---
type: invariant
statement: An information fragment's confidence is between 0 and 1 inclusive.
constrains:
- domain/knowledge-base/information-fragment
---

## Description

None.

=== rules/knowledge-base/fragment-item-summary
---
type: invariant
statement: A fragment search item's summary is the information fragment's text.
constrains:
- domain/knowledge-base/search-item
---

## Description

None.

=== rules/knowledge-base/fragment-layer-matches-accepted-only
---
type: policy
statement: The fragment layer matches only information fragments whose status is accepted.
constrains:
- domain/knowledge-base/search-layer
- domain/knowledge-base/information-fragment
---

## Description

None.

=== rules/knowledge-base/fragment-missing-chunk-first
---
type: invariant
statement: A fragment proposal is checked for raw chunks that exist before it is checked for raw chunks of its LLM run's raw information.
constrains:
- domain/knowledge-base/proposal
---

## Description

None.

=== rules/knowledge-base/fragment-recorded-proposed
---
type: invariant
statement: A fragment proposal records an information fragment in status proposed, whatever its confidence.
constrains:
- domain/knowledge-base/information-fragment
- domain/knowledge-base/fragment-status
---

## Description

None.

=== rules/knowledge-base/fragment-text-length
---
type: invariant
statement: An information fragment's text MUST hold between 1 and 1000 characters.
constrains:
- domain/knowledge-base/information-fragment
---

## Description

None.

=== rules/knowledge-base/held-content-records-nothing
---
type: invariant
statement: Ingesting content whose content hash a raw information already holds records no new raw information, raw chunk or LLM run.
constrains:
- domain/knowledge-base/raw-information
---

## Description

None.

=== rules/knowledge-base/idempotency-key
---
type: invariant
statement: An LLM run's idempotency key is the SHA-256 digest, as 64 lowercase hexadecimal characters, of its raw information's content hash, its prompt version, its model and the chunking version joined in that order without separator.
constrains:
- domain/knowledge-base/llm-run
---

## Description

None.

=== rules/knowledge-base/idempotency-key-unique
---
type: invariant
statement: No two LLM runs hold the same idempotency key.
constrains:
- domain/knowledge-base/llm-run
---

## Description

None.

=== rules/knowledge-base/in-effect-assertion
---
type: policy
statement: A knowledge link or node attribute is in effect while it is current and its validity has no start or starts on or before today.
constrains:
- domain/knowledge-base/knowledge-link
- domain/knowledge-base/node-attribute
consistency: eventual
---

## Description

None.

=== rules/knowledge-base/ingestion-records-chunks-and-run
---
type: policy
statement: Ingesting content no raw information holds records its raw information with its raw chunks and opens one LLM run over it in status running.
constrains:
- domain/knowledge-base/raw-information
- domain/knowledge-base/llm-run
- domain/knowledge-base/run-status
consistency: eventual
---

## Description

None.

=== rules/knowledge-base/item-flags
---
type: invariant
statement: A search item is flagged uncertain when its status is uncertain, disputed when its status is disputed, and low-confidence when it is an accepted information fragment whose confidence is below 0.4.
constrains:
- domain/knowledge-base/search-item
- domain/knowledge-base/assertion-flag
---

## Description

None.

=== rules/knowledge-base/layer-weights
---
type: invariant
statement: A match's strength is weighted by 1.0 on the fragment layer, 0.9 on the node layer and 0.6 on the chunk layer.
constrains:
- domain/knowledge-base/search-item
---

## Description

None.

=== rules/knowledge-base/link-confidence-range
---
type: invariant
statement: A knowledge link's confidence is between 0 and 1 inclusive.
constrains:
- domain/knowledge-base/knowledge-link
---

## Description

None.

=== rules/knowledge-base/link-item-summary
---
type: policy
statement: A link search item's summary reads `source -[link type]-> target`, with the canonical names of its source and target knowledge nodes.
constrains:
- domain/knowledge-base/search-item
- domain/knowledge-base/knowledge-link
---

## Description

None.

=== rules/knowledge-base/link-never-supersedes-itself
---
type: invariant
statement: A knowledge link never names itself as the one it supersedes.
constrains:
- domain/knowledge-base/knowledge-link
---

## Description

None.

=== rules/knowledge-base/link-permitted-by-type-rule
---
type: invariant
statement: A link proposal MUST be permitted by a link type rule of its link type, in effect today, for the node types of its source and target knowledge nodes.
constrains:
- domain/knowledge-base/proposal
- domain/knowledge-base/link-type
- domain/knowledge-base/link-type-rule
---

## Description

None.

=== rules/knowledge-base/link-proposal-check-order
---
type: invariant
statement: A link proposal is checked for a known link type, then for existing source and target knowledge nodes, then for cited fragments that exist and belong to its LLM run, then for a permitting link type rule, then for its dates, then for its confidence, then for the anchoring of its fragments, and stops at the first check it fails.
constrains:
- domain/knowledge-base/proposal
---

## Description

None.

=== rules/knowledge-base/link-provenance-once-per-fragment
---
type: invariant
statement: A knowledge link holds at most one provenance per information fragment.
constrains:
- domain/knowledge-base/knowledge-link
- domain/knowledge-base/provenance
---

## Description

None.

=== rules/knowledge-base/link-start-has-basis
---
type: invariant
statement: A knowledge link that holds a validity start holds the basis of that start.
constrains:
- domain/knowledge-base/knowledge-link
- domain/knowledge-base/valid-from-basis
---

## Description

None.

=== rules/knowledge-base/link-type-in-catalog
---
type: invariant
statement: A link proposal MUST name a link type the catalog holds.
constrains:
- domain/knowledge-base/proposal
- domain/knowledge-base/link-type
---

## Description

None.

=== rules/knowledge-base/link-type-name-unique
---
type: invariant
statement: No two link types hold the same name.
constrains:
- domain/knowledge-base/link-type
---

## Description

None.

=== rules/knowledge-base/link-type-rule-in-effect
---
type: invariant
statement: A link type rule is in effect on a day that falls on or after its validity start, when it has one, and before its validity end, when it has one.
expression: (valid_from is null or valid_from <= day) and (valid_to is null or day < valid_to), where day is the UTC calendar date
constrains:
- domain/knowledge-base/link-type-rule
---

## Description

None.

=== rules/knowledge-base/link-type-rule-window-ordered
---
type: invariant
statement: A link type rule that holds both a validity start and a validity end holds the start strictly before the end.
constrains:
- domain/knowledge-base/link-type-rule
---

## Description

None.

=== rules/knowledge-base/link-types-ignored-without-expansion
---
type: invariant
statement: A search query that does not expand ignores the link types it names.
constrains:
- domain/knowledge-base/search-query
---

## Description

None.

=== rules/knowledge-base/link-validity-ordered
---
type: invariant
statement: A knowledge link that holds both a validity start and a validity end holds the start strictly before the end.
constrains:
- domain/knowledge-base/knowledge-link
---

## Description

None.

=== rules/knowledge-base/listing-excludes-compliance-deleted
---
type: policy
statement: The accepted-fragment listing excludes information fragments whose raw information was deleted for compliance.
constrains:
- domain/knowledge-base/information-fragment
- domain/knowledge-base/compliance-deletion
consistency: eventual
---

## Description

None.

=== rules/knowledge-base/listing-holds-accepted-only
---
type: policy
statement: The accepted-fragment listing holds only information fragments whose status is accepted.
constrains:
- domain/knowledge-base/accepted-fragment-filter
- domain/knowledge-base/information-fragment
---

## Description

None.

=== rules/knowledge-base/listing-one-entry-per-fragment
---
type: policy
statement: The accepted-fragment listing shows each information fragment once, attributed to its lowest-index raw chunk.
constrains:
- domain/knowledge-base/information-fragment
- domain/knowledge-base/raw-information
consistency: eventual
---

## Description

None.

=== rules/knowledge-base/listing-order
---
type: policy
statement: The accepted-fragment listing is ordered by source reception time descending, then fragment creation time descending, then fragment identifier ascending.
constrains:
- domain/knowledge-base/information-fragment
- domain/knowledge-base/raw-information
consistency: eventual
---

## Description

None.

=== rules/knowledge-base/listing-requires-a-filter
---
type: invariant
statement: An accepted-fragment listing MUST name an LLM run, a raw information, or both.
constrains:
- domain/knowledge-base/accepted-fragment-filter
---

## Description

None.

=== rules/knowledge-base/listing-total-before-pagination
---
type: invariant
statement: An accepted-fragment listing's total counts every entry before the page is cut.
constrains:
- domain/knowledge-base/accepted-fragment-filter
- domain/knowledge-base/page
---

## Description

None.

=== rules/knowledge-base/llm-run-lifecycle
---
type: state-machine
statement: An LLM run moves only along the declared transitions.
subject: domain/knowledge-base/llm-run
status: domain/knowledge-base/run-status
initial: running
terminal:
- completed
transitions:
- from: running
  trigger: complete
  to: completed
- from: running
  trigger: fail
  to: failed
- from: failed
  trigger: retry
  to: running
rejections:
- from: running
  trigger: retry
- from: failed
  trigger: complete
- from: failed
  trigger: fail
---

## Description

None.

=== rules/knowledge-base/long-block-sentence-chunks
---
type: invariant
statement: A block of more than 4000 code points is cut at its Portuguese sentence boundaries into raw chunks, each closing before the sentence that would take it past 2000 code points.
constrains:
- domain/knowledge-base/raw-chunk
---

## Description

None.

=== rules/knowledge-base/long-sentence-own-chunk
---
type: invariant
statement: A sentence of more than 2000 code points in a block of more than 4000 is one raw chunk on its own, whatever its length.
constrains:
- domain/knowledge-base/raw-chunk
---

## Description

None.

=== rules/knowledge-base/match-review-distinct-nodes
---
type: invariant
statement: An entity match review pairs two different knowledge nodes.
constrains:
- domain/knowledge-base/entity-match-review
---

## Description

None.

=== rules/knowledge-base/match-review-pair-unique
---
type: invariant
statement: At most one entity match review pairs one knowledge node with one candidate knowledge node.
constrains:
- domain/knowledge-base/entity-match-review
---

## Description

None.

=== rules/knowledge-base/match-review-similarity-range
---
type: invariant
statement: An entity match review's similarity is between 0 and 1 inclusive.
constrains:
- domain/knowledge-base/entity-match-review
---

## Description

None.

=== rules/knowledge-base/matched-node-gains-only-aliases
---
type: invariant
statement: A node proposal resolved to an existing knowledge node adds each of its proposed aliases to that node and never its proposed name.
constrains:
- domain/knowledge-base/knowledge-node
- domain/knowledge-base/node-alias
---

## Description

None.

=== rules/knowledge-base/merged-node-names-survivor
---
type: invariant
statement: A knowledge node names the knowledge node it was merged into exactly when its status is merged.
constrains:
- domain/knowledge-base/knowledge-node
- domain/knowledge-base/node-status
---

## Description

None.

=== rules/knowledge-base/model-refusal-skips-chunk
---
type: invariant
statement: A chunk the model declines to read is skipped without failing the LLM run.
constrains:
- domain/knowledge-base/llm-run
---

## Description

None.

=== rules/knowledge-base/multi-current-attribute-keys
---
type: invariant
statement: The catalog attribute keys that allow multiple current values are exactly email and phone of Person.
constrains:
- domain/knowledge-base/attribute-key
---

## Description

None.

=== rules/knowledge-base/name-normalization
---
type: invariant
statement: Entity resolution compares names after lower-casing them, removing their accents, trimming them and collapsing their inner whitespace.
constrains:
- domain/knowledge-base/node-alias
---

## Description

None.

=== rules/knowledge-base/new-assertion
---
type: policy
statement: A link or attribute proposal that meets no current assertion records a new assertion that supersedes nothing.
constrains:
- domain/knowledge-base/proposal
- domain/knowledge-base/knowledge-link
- domain/knowledge-base/node-attribute
consistency: eventual
---

## Description

None.

=== rules/knowledge-base/new-assertion-status-from-confidence
---
type: policy
statement: A knowledge link or node attribute recorded by a proposal other than a dispute is active when the proposal's confidence is at least 0.75 and uncertain when it is at least 0.40 and below 0.75.
constrains:
- domain/knowledge-base/proposal
- domain/knowledge-base/knowledge-link
- domain/knowledge-base/node-attribute
- domain/knowledge-base/assertion-status
consistency: eventual
---

## Description

None.

=== rules/knowledge-base/new-node-aliases
---
type: invariant
statement: A newly created knowledge node holds its proposed name as its canonical alias and each of its proposed aliases as an alias.
constrains:
- domain/knowledge-base/knowledge-node
- domain/knowledge-base/node-alias
- domain/knowledge-base/alias-kind
---

## Description

None.

=== rules/knowledge-base/no-candidate-creates-active-node
---
type: invariant
statement: A node proposal that no active knowledge node of its node type reaches at a similarity of 0.55 creates an active knowledge node as created-new.
constrains:
- domain/knowledge-base/proposal
- domain/knowledge-base/knowledge-node
- domain/knowledge-base/node-resolution
- domain/knowledge-base/node-status
---

## Description

None.

=== rules/knowledge-base/node-item-summary
---
type: invariant
statement: A node search item's summary is the knowledge node's canonical name.
constrains:
- domain/knowledge-base/search-item
---

## Description

None.

=== rules/knowledge-base/node-layer-matches-through-aliases
---
type: policy
statement: The node layer matches a knowledge node when the query text matches any one of its aliases.
constrains:
- domain/knowledge-base/search-layer
- domain/knowledge-base/knowledge-node
---

## Description

None.

=== rules/knowledge-base/node-layer-skips-merged-and-deleted
---
type: policy
statement: The node layer never matches a knowledge node whose status is merged or deleted.
constrains:
- domain/knowledge-base/search-layer
- domain/knowledge-base/knowledge-node
---

## Description

None.

=== rules/knowledge-base/node-name-length
---
type: invariant
statement: A node proposal's name and each of its aliases MUST hold between 1 and 500 characters.
constrains:
- domain/knowledge-base/proposal
---

## Description

None.

=== rules/knowledge-base/node-never-merged-into-itself
---
type: invariant
statement: A knowledge node is never merged into itself.
constrains:
- domain/knowledge-base/knowledge-node
---

## Description

None.

=== rules/knowledge-base/node-surfaces-only-with-accepted-mention
---
type: policy
statement: A matched knowledge node surfaces only when at least one accepted information fragment mentions one of its aliases.
constrains:
- domain/knowledge-base/knowledge-node
- domain/knowledge-base/information-fragment
- domain/knowledge-base/search-item
consistency: eventual
---

## Description

None.

=== rules/knowledge-base/node-type-in-catalog
---
type: invariant
statement: A node proposal MUST name a node type the catalog holds.
constrains:
- domain/knowledge-base/proposal
- domain/knowledge-base/node-type
---

## Description

None.

=== rules/knowledge-base/node-type-name-unique
---
type: invariant
statement: No two node types hold the same name.
constrains:
- domain/knowledge-base/node-type
---

## Description

None.

=== rules/knowledge-base/one-canonical-alias
---
type: invariant
statement: A knowledge node holds at most one canonical alias.
constrains:
- domain/knowledge-base/knowledge-node
- domain/knowledge-base/node-alias
- domain/knowledge-base/alias-kind
---

## Description

None.

=== rules/knowledge-base/one-current-attribute-per-functional-key
---
type: invariant
statement: A knowledge node holds at most one current node attribute that is not disputed of an attribute key that does not allow multiple current values.
constrains:
- domain/knowledge-base/node-attribute
- domain/knowledge-base/assertion-status
---

## Description

None.

=== rules/knowledge-base/one-current-attribute-per-value
---
type: invariant
statement: A knowledge node holds at most one current node attribute that is not disputed of one attribute key with one value.
constrains:
- domain/knowledge-base/node-attribute
- domain/knowledge-base/assertion-status
---

## Description

None.

=== rules/knowledge-base/one-current-link-per-functional-type
---
type: invariant
statement: A source knowledge node holds at most one current knowledge link that is not disputed of a link type that does not allow multiple current links.
constrains:
- domain/knowledge-base/knowledge-link
- domain/knowledge-base/assertion-status
---

## Description

None.

=== rules/knowledge-base/one-current-link-per-target
---
type: invariant
statement: A source knowledge node holds at most one current knowledge link that is not disputed of one link type to one target knowledge node.
constrains:
- domain/knowledge-base/knowledge-link
- domain/knowledge-base/assertion-status
---

## Description

None.

=== rules/knowledge-base/original-input-length
---
type: invariant
statement: A raw information's original input MUST NOT exceed 10,485,760 UTF-16 code units.
constrains:
- domain/knowledge-base/raw-information
---

## Description

None.

=== rules/knowledge-base/orphaned-fragment
---
type: invariant
statement: An information fragment is orphaned when its status is proposed and no provenance cites it.
constrains:
- domain/knowledge-base/information-fragment
- domain/knowledge-base/fragment-status
- domain/knowledge-base/provenance
---

## Description

None.

=== rules/knowledge-base/page-defaults
---
type: invariant
statement: A search or accepted-fragment listing page that omits its limit returns 20 items and one that omits its offset starts at 0.
constrains:
- domain/knowledge-base/page
---

## Description

None.

=== rules/knowledge-base/page-limit-bounds
---
type: invariant
statement: A page's limit MUST be between 1 and 100.
constrains:
- domain/knowledge-base/page
---

## Description

None.

=== rules/knowledge-base/page-offset-non-negative
---
type: invariant
statement: A page's offset MUST be at least 0.
constrains:
- domain/knowledge-base/page
---

## Description

None.

=== rules/knowledge-base/pdf-blocks-at-form-feeds
---
type: invariant
statement: A pdf's content is cut into blocks at every form feed, the form feed belonging to no block and an empty span between two form feeds forming none.
constrains:
- domain/knowledge-base/raw-information
- domain/knowledge-base/source-type
---

## Description

None.

=== rules/knowledge-base/prompt-version-known
---
type: invariant
statement: An extraction's prompt version MUST be one of the prompt versions the system holds.
constrains:
- domain/knowledge-base/llm-run
- domain/knowledge-base/prompt-version
---

## Description

None.

=== rules/knowledge-base/proposal-confidence-range
---
type: invariant
statement: A proposal's confidence MUST be between 0 and 1 inclusive.
constrains:
- domain/knowledge-base/proposal
---

## Description

None.

=== rules/knowledge-base/proposal-meets-current-assertion
---
type: policy
statement: A link or attribute proposal meets the current assertion of its node and its link type or attribute key when that type does not allow multiple current assertions, and the current assertion of its node, its type and its target or value when it does.
constrains:
- domain/knowledge-base/proposal
- domain/knowledge-base/knowledge-link
- domain/knowledge-base/node-attribute
consistency: eventual
---

## Description

None.

=== rules/knowledge-base/proposal-requires-running-run
---
type: invariant
statement: A proposal is taken only within an LLM run whose status is running.
constrains:
- domain/knowledge-base/proposal
- domain/knowledge-base/llm-run
- domain/knowledge-base/run-status
---

## Description

None.

=== rules/knowledge-base/proposal-run-checks-first
---
type: invariant
statement: A proposal is checked for a well-formed request, then for an existing LLM run, then for a running one, before any check of its own.
constrains:
- domain/knowledge-base/proposal
- domain/knowledge-base/llm-run
---

## Description

None.

=== rules/knowledge-base/prose-matching
---
type: policy
statement: Fragment text, chunk excerpts and the fragments that mention a node are matched with Portuguese stemming and without regard to accents.
constrains:
- domain/knowledge-base/information-fragment
- domain/knowledge-base/raw-information
consistency: eventual
---

## Description

None.

=== rules/knowledge-base/provenance-accepts-proposed-fragment
---
type: invariant
statement: Recording a provenance to an information fragment whose status is proposed moves it to accepted, and leaves a fragment in any other status as it was.
constrains:
- domain/knowledge-base/information-fragment
- domain/knowledge-base/fragment-status
- domain/knowledge-base/provenance
---

## Description

None.

=== rules/knowledge-base/provenance-in-recording-order
---
type: invariant
statement: A link's or an attribute's provenance lists its fragments in the order that provenance was recorded.
constrains:
- domain/knowledge-base/provenance
---

## Description

None.

=== rules/knowledge-base/provenance-refused-after-compliance-deletion
---
type: policy
statement: A provenance read whose chain reaches any raw information deleted for compliance is refused.
constrains:
- domain/knowledge-base/provenance
- domain/knowledge-base/compliance-deletion
---

## Description

None.

=== rules/knowledge-base/provenance-requires-accepted-fragment
---
type: invariant
statement: A fragment's provenance is read only when the fragment's status is accepted.
constrains:
- domain/knowledge-base/information-fragment
---

## Description

None.

=== rules/knowledge-base/reaffirmation-consolidates
---
type: policy
statement: A proposal that meets a current assertion with the same target or value re-affirms it, adding its provenance and recording no new assertion, when its change hint is not correction and, for a type that does not allow multiple current assertions, its change hint is none and it states the same validity start.
constrains:
- domain/knowledge-base/proposal
- domain/knowledge-base/knowledge-link
- domain/knowledge-base/node-attribute
- domain/knowledge-base/change-hint
consistency: eventual
---

## Description

None.

=== rules/knowledge-base/recent-ingestion-latest-run
---
type: policy
statement: Each recent ingestion shows the most recently started LLM run of its raw information, or none when it has none.
constrains:
- domain/knowledge-base/raw-information
- domain/knowledge-base/llm-run
consistency: eventual
---

## Description

None.

=== rules/knowledge-base/recent-ingestions-limit-bounds
---
type: invariant
statement: A recent-ingestions listing's limit MUST be between 1 and 50.
constrains:
- domain/knowledge-base/raw-information
---

## Description

None.

=== rules/knowledge-base/recent-ingestions-limit-default
---
type: invariant
statement: A recent-ingestions listing that omits its limit holds 10 entries.
constrains:
- domain/knowledge-base/raw-information
---

## Description

None.

=== rules/knowledge-base/recent-ingestions-order
---
type: invariant
statement: Recent ingestions list raw informations by reception time, newest first.
constrains:
- domain/knowledge-base/raw-information
---

## Description

None.

=== rules/knowledge-base/reception-time-is-recording-time
---
type: invariant
statement: A raw information's reception time is the moment it was recorded.
constrains:
- domain/knowledge-base/raw-information
---

## Description

None.

=== rules/knowledge-base/refused-proposal-records-only-its-tool-call
---
type: invariant
statement: A refused or failed proposal records nothing but its tool call.
constrains:
- domain/knowledge-base/tool-call
- domain/knowledge-base/proposal
---

## Description

None.

=== rules/knowledge-base/required-start-available
---
type: invariant
statement: A proposal for a link type or attribute key that requires a validity start MUST state one or come from a source with a document date or a reception date.
constrains:
- domain/knowledge-base/proposal
- domain/knowledge-base/raw-information
---

## Description

None.

=== rules/knowledge-base/required-start-fallback
---
type: invariant
statement: A proposal for a link type or attribute key that requires a validity start and states none takes the document date of its source with basis document or, when the source has none, the date the source was received with basis received.
constrains:
- domain/knowledge-base/proposal
- domain/knowledge-base/raw-information
- domain/knowledge-base/valid-from-basis
---

## Description

None.

=== rules/knowledge-base/retry-counts-attempts
---
type: invariant
statement: Retrying an LLM run adds one to its attempts and clears its finish time while keeping its start time.
constrains:
- domain/knowledge-base/llm-run
---

## Description

None.

=== rules/knowledge-base/retry-rejects-orphaned-fragments
---
type: policy
statement: Retrying an LLM run rejects every orphaned information fragment of that run.
constrains:
- domain/knowledge-base/llm-run
- domain/knowledge-base/information-fragment
- domain/knowledge-base/fragment-status
consistency: eventual
---

## Description

None.

=== rules/knowledge-base/run-finish-time-when-closed
---
type: invariant
statement: An LLM run holds a finish time exactly when its status is not running.
constrains:
- domain/knowledge-base/llm-run
- domain/knowledge-base/run-status
---

## Description

None.

=== rules/knowledge-base/run-opens-with-one-attempt
---
type: invariant
statement: An LLM run is opened with 1 attempt.
constrains:
- domain/knowledge-base/llm-run
---

## Description

None.

=== rules/knowledge-base/run-start-is-opening-time
---
type: invariant
statement: An LLM run's start time is the moment it was opened.
constrains:
- domain/knowledge-base/llm-run
---

## Description

None.

=== rules/knowledge-base/search-excludes-compliance-deleted-sources
---
type: policy
statement: Search shows no information fragment whose raw information was deleted for compliance, neither as a search item nor as the support of one.
constrains:
- domain/knowledge-base/information-fragment
- domain/knowledge-base/compliance-deletion
consistency: eventual
---

## Description

None.

=== rules/knowledge-base/search-layer-outside-set-refused
---
type: invariant
statement: A search query naming a layer that is not a search layer is refused.
constrains:
- domain/knowledge-base/search-query
- domain/knowledge-base/search-layer
---

## Description

None.

=== rules/knowledge-base/search-option-defaults
---
type: invariant
statement: 'A search option the query omits takes its default: every search layer, expansion on at depth 1, uncertain items included, and in-effect-only off.'
constrains:
- domain/knowledge-base/search-query
---

## Description

None.

=== rules/knowledge-base/search-query-length
---
type: invariant
statement: A search query's text MUST NOT exceed 1000 characters.
constrains:
- domain/knowledge-base/search-query
---

## Description

None.

=== rules/knowledge-base/search-query-must-parse
---
type: invariant
statement: A search query whose lexical parse yields no search term is refused.
constrains:
- domain/knowledge-base/search-query
---

## Description

None.

=== rules/knowledge-base/search-query-not-blank
---
type: invariant
statement: A search query's text MUST NOT be empty once surrounding whitespace is trimmed.
constrains:
- domain/knowledge-base/search-query
---

## Description

None.

=== rules/knowledge-base/search-ranking
---
type: invariant
statement: Search items are ranked by score descending, then by recording time descending with a knowledge node counting as never recorded, then by identifier ascending.
constrains:
- domain/knowledge-base/search-item
---

## Description

None.

=== rules/knowledge-base/search-total-before-pagination
---
type: invariant
statement: A search's total counts every search item before the page is cut.
constrains:
- domain/knowledge-base/search-item
- domain/knowledge-base/page
---

## Description

None.

=== rules/knowledge-base/short-block-one-chunk
---
type: invariant
statement: A block of at most 4000 code points is one raw chunk.
constrains:
- domain/knowledge-base/raw-chunk
---

## Description

None.

=== rules/knowledge-base/single-current-link-types
---
type: invariant
statement: The catalog link types that do not allow multiple current links are exactly reports_to, part_of and located_in.
constrains:
- domain/knowledge-base/link-type
---

## Description

None.

=== rules/knowledge-base/source-status-active-or-deleted
---
type: invariant
statement: A raw information's status and each of its raw chunks' status is active or deleted.
constrains:
- domain/knowledge-base/raw-information
- domain/knowledge-base/raw-chunk
- domain/knowledge-base/node-status
---

## Description

None.

=== rules/knowledge-base/speaker-line
---
type: invariant
statement: A speaker line is a line that, after optional leading whitespace and an optional time stamp written [h:mm], [hh:mm], (hh:mm) or (hh:mm:ss) followed by whitespace, starts with one or two words of letters, digits or underscores separated by one whitespace character and followed by a colon and a whitespace character.
constrains:
- domain/knowledge-base/raw-information
---

## Description

None.

=== rules/knowledge-base/start-requiring-attribute-keys
---
type: invariant
statement: The catalog attribute keys that require a validity start are exactly the temporal ones other than email and phone of Person and website of Organization.
constrains:
- domain/knowledge-base/attribute-key
---

## Description

None.

=== rules/knowledge-base/start-requiring-link-types
---
type: invariant
statement: The catalog link types that require a validity start are exactly the temporal ones other than delivered_to.
constrains:
- domain/knowledge-base/link-type
---

## Description

None.

=== rules/knowledge-base/stated-start-requires-basis
---
type: invariant
statement: A proposal that states a validity start MUST state its basis.
constrains:
- domain/knowledge-base/proposal
- domain/knowledge-base/valid-from-basis
---

## Description

None.

=== rules/knowledge-base/strong-candidate-resolves
---
type: invariant
statement: A node proposal with no exact alias resolves as matched-existing to the one active knowledge node of its node type whose similarity is at least 0.85, when no other active knowledge node of that type reaches 0.55.
constrains:
- domain/knowledge-base/proposal
- domain/knowledge-base/knowledge-node
- domain/knowledge-base/node-resolution
---

## Description

None.

=== rules/knowledge-base/succession-before-previous-start
---
type: policy
statement: A succession whose closing date falls on or before the validity start of the assertion it closes supersedes that assertion without giving it a validity end.
constrains:
- domain/knowledge-base/knowledge-link
- domain/knowledge-base/node-attribute
consistency: eventual
---

## Description

None.

=== rules/knowledge-base/succession-closes-previous
---
type: policy
statement: A proposal for a type that does not allow multiple current assertions that meets a current assertion with a different target or value, and either has change hint succession or cites a fragment that signals succession, closes that assertion as superseded and records a new assertion that names it as the one it supersedes.
constrains:
- domain/knowledge-base/proposal
- domain/knowledge-base/knowledge-link
- domain/knowledge-base/node-attribute
- domain/knowledge-base/change-hint
- domain/knowledge-base/assertion-status
consistency: eventual
---

## Description

None.

=== rules/knowledge-base/succession-closing-date
---
type: policy
statement: A succession gives the assertion it closes a validity end at the new assertion's validity start, or at today when the new assertion has none.
constrains:
- domain/knowledge-base/knowledge-link
- domain/knowledge-base/node-attribute
consistency: eventual
---

## Description

None.

=== rules/knowledge-base/succession-signal
---
type: invariant
statement: An information fragment signals succession when its text contains, in any letter case, deixou de, passou a, novo, nova, substituiu, substituido, substituido por, succeeded or replaced.
constrains:
- domain/knowledge-base/information-fragment
---

## Description

None.

=== rules/knowledge-base/summary-counts-orphaned-fragments
---
type: policy
statement: An LLM run's summary counts the orphaned information fragments of that run.
constrains:
- domain/knowledge-base/llm-run
- domain/knowledge-base/run-summary
- domain/knowledge-base/information-fragment
consistency: eventual
---

## Description

None.

=== rules/knowledge-base/summary-counts-tool-calls
---
type: invariant
statement: An LLM run's summary counts its tool calls by validation outcome, counting zero for an outcome no tool call has.
constrains:
- domain/knowledge-base/run-summary
- domain/knowledge-base/tool-call
- domain/knowledge-base/validation-outcome
---

## Description

None.

=== rules/knowledge-base/temporal-attribute-keys
---
type: invariant
statement: The temporal catalog attribute keys are exactly deadline, start_date, status_text and budget of Project, event_date and end_date of Event, email and phone of Person, website of Organization, and status, priority and due_date of Task.
constrains:
- domain/knowledge-base/attribute-key
---

## Description

None.

=== rules/knowledge-base/temporal-filters-apply-to-expansion-only
---
type: policy
statement: The as-of date and the in-effect-only switch filter the knowledge links expansion reaches and never the fragment, node or chunk layers.
constrains:
- domain/knowledge-base/search-query
- domain/knowledge-base/knowledge-link
---

## Description

None.

=== rules/knowledge-base/temporal-link-types
---
type: invariant
statement: Every catalog link type is temporal except belongs_to_category, related_to and concerns.
constrains:
- domain/knowledge-base/link-type
---

## Description

None.

=== rules/knowledge-base/tool-call-listing-order
---
type: invariant
statement: An LLM run's tool calls are listed by recording time ascending, then by identifier ascending.
constrains:
- domain/knowledge-base/tool-call
---

## Description

None.

=== rules/knowledge-base/tool-call-page-defaults
---
type: invariant
statement: A tool-call listing page that omits its limit holds 50 tool calls and one that omits its offset starts at 0.
constrains:
- domain/knowledge-base/page
- domain/knowledge-base/tool-call
---

## Description

None.

=== rules/knowledge-base/tool-call-total-before-pagination
---
type: invariant
statement: A tool-call listing's total counts every tool call of the LLM run before the page is cut.
constrains:
- domain/knowledge-base/tool-call
---

## Description

None.

=== rules/knowledge-base/tool-call-validation-outcome
---
type: invariant
statement: A tool call's validation outcome is rejected for a refused proposal, error for a failed one, needs-review for a node proposal resolved as needing review, the proposal's outcome for a taken link or attribute proposal, and accepted otherwise.
constrains:
- domain/knowledge-base/tool-call
- domain/knowledge-base/validation-outcome
- domain/knowledge-base/node-resolution
---

## Description

None.

=== rules/knowledge-base/turn-blocks
---
type: invariant
statement: A chat's or a transcript's content starts a new block at every speaker line after its first line.
constrains:
- domain/knowledge-base/raw-information
- domain/knowledge-base/source-type
---

## Description

None.

=== rules/knowledge-base/uncertain-items-excluded-on-request
---
type: invariant
statement: A search query that does not include uncertain items surfaces no search item whose status is uncertain.
constrains:
- domain/knowledge-base/search-query
- domain/knowledge-base/search-item
---

## Description

None.

=== rules/knowledge-base/undivided-sources
---
type: invariant
statement: The content of meeting minutes, of an article and of any other source is one block.
constrains:
- domain/knowledge-base/raw-information
- domain/knowledge-base/source-type
---

## Description

None.

=== rules/knowledge-base/unknown-link-type-refused
---
type: policy
statement: A search query that expands and names a link type the catalog does not hold is refused.
constrains:
- domain/knowledge-base/search-query
- domain/knowledge-base/link-type
---

## Description

None.

=== rules/knowledge-base/validity-start-before-end
---
type: invariant
statement: A proposal that states both a validity start and a validity end MUST state the start strictly before the end.
constrains:
- domain/knowledge-base/proposal
---

## Description

None.

=== scenarios/knowledge-base/email-without-blank-line-is-one-block
---
subject: rules/knowledge-base/email-quote-blocks
given:
- an email with no blank line, whose later lines are quoted
when:
- it is ingested
then:
- its header block never ends
- no quotation change starts a new block
- the whole email is one block
involves:
- rules/knowledge-base/email-header-block
---

## Description

None.

=== scenarios/knowledge-base/form-feed-only-pdf-is-one-chunk
---
subject: rules/knowledge-base/contentless-blocks-single-chunk
given:
- a pdf whose content is only form feeds
when:
- it is ingested
then:
- its blocks hold nothing
- one raw chunk with index 0 spans the whole content
involves:
- rules/knowledge-base/pdf-blocks-at-form-feeds
---

## Description

None.

=== scenarios/knowledge-base/held-content-under-another-model
---
subject: rules/knowledge-base/held-content-records-nothing
given:
- a raw information ingested with one model and its LLM run
when:
- the same content is ingested naming another model
then:
- no raw information, raw chunk or LLM run is recorded
- the answer names the held raw information and the LLM run it already has
involves:
- contracts/knowledge-base/ingestion
---

## Description

None.

=== scenarios/knowledge-base/impossible-calendar-date-refused
---
subject: rules/knowledge-base/attribute-value-parses
given:
- an attribute key whose value type is date
when:
- an attribute proposal carries the value 2024-02-30
then:
- the proposal is refused
- no node attribute is recorded
---

## Description

None.

=== scenarios/knowledge-base/listing-for-unknown-source-is-empty
---
subject: contracts/knowledge-base/retrieval
given:
- no information fragment was produced by the named LLM run or drawn from the named raw information
when:
- the owner lists accepted fragments for that source
then:
- the listing is accepted
- the total is 0
- no entry is listed
---

## Description

None.

=== scenarios/knowledge-base/same-target-succession-is-disputed
---
subject: rules/knowledge-base/conflict-disputes
given:
- a link type that does not allow multiple current links
- a current knowledge link of that type from node A to node B
when:
- a proposal of that link type from A to B arrives with change hint succession, citing no errata
then:
- the proposal does not re-affirm the link, because its change hint is not none
- it does not succeed the link, because its target is the same
- the current link is marked disputed
- a new link from A to B is recorded in status disputed
involves:
- rules/knowledge-base/consolidation-precedence
- rules/knowledge-base/reaffirmation-consolidates
- rules/knowledge-base/succession-closes-previous
---

## Description

None.

=== scenarios/knowledge-base/stop-words-only-query
---
subject: rules/knowledge-base/search-query-must-parse
given:
- the owner writes a search query made only of stop words
when:
- the owner searches with it
then:
- the search is refused
- no search item is returned
---

## Description

The query has characters, so it passes the length and blank checks, and still yields no search term.

=== scenarios/knowledge-base/synonym-without-shared-characters-finds-nothing
---
subject: contracts/knowledge-base/retrieval
given:
- the knowledge base holds knowledge about "Projeto Apollo" and nothing that shares characters with "Iniciativa Lunar"
when:
- the owner searches for "Iniciativa Lunar"
then:
- the search is accepted
- the total is 0
- no search item is returned
---

## Description

None.
