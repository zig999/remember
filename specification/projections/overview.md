# Specification overview

Derived by spec.py from the specification files; never edited.

## Contexts

| context | strategic | elements | rules | contracts | scenarios |
|---|---|---|---|---|---|
| application-shell | supporting | 10 | 121 | 2 | 4 |
| chat | supporting | 17 | 131 | 1 | 0 |
| chat-workspace | supporting | 6 | 126 | 2 | 4 |
| curation-workspace | supporting | 10 | 218 | 3 | 9 |
| entity-workspace | supporting | 2 | 41 | 3 | 3 |
| graph-explorer | supporting | 10 | 170 | 3 | 4 |
| ingest-workspace | supporting | 3 | 58 | 3 | 4 |
| knowledge-base | core | 85 | 452 | 6 | 33 |
| owner-access | supporting | 4 | 14 | 2 | 4 |

## Aggregates

- application-shell/application-shell — 0 entity(ies) inside, 6 attribute(s) on the root
- application-shell/conversation-menu — 0 entity(ies) inside, 3 attribute(s) on the root
- application-shell/failure-router — 0 entity(ies) inside, 3 attribute(s) on the root
- application-shell/message-bubble — 0 entity(ies) inside, 4 attribute(s) on the root
- application-shell/owner-session — 0 entity(ies) inside, 5 attribute(s) on the root
- application-shell/request-helper — 0 entity(ies) inside, 2 attribute(s) on the root
- application-shell/state-badge — 0 entity(ies) inside, 2 attribute(s) on the root
- chat-workspace/chat-session — 0 entity(ies) inside, 9 attribute(s) on the root
- chat/conversation — 3 entity(ies) inside, 5 attribute(s) on the root
- curation-workspace/curation-session — 0 entity(ies) inside, 8 attribute(s) on the root
- entity-workspace/entity-edit-session — 0 entity(ies) inside, 5 attribute(s) on the root
- graph-explorer/graph-pane — 0 entity(ies) inside, 13 attribute(s) on the root
- graph-explorer/node-detail — 0 entity(ies) inside, 5 attribute(s) on the root
- ingest-workspace/ingest-session — 0 entity(ies) inside, 8 attribute(s) on the root
- knowledge-base/attribute-key — 0 entity(ies) inside, 8 attribute(s) on the root
- knowledge-base/compliance-deletion — 0 entity(ies) inside, 3 attribute(s) on the root
- knowledge-base/curation-action — 0 entity(ies) inside, 6 attribute(s) on the root
- knowledge-base/entity-match-review — 0 entity(ies) inside, 1 attribute(s) on the root
- knowledge-base/information-fragment — 0 entity(ies) inside, 5 attribute(s) on the root
- knowledge-base/knowledge-link — 0 entity(ies) inside, 8 attribute(s) on the root
- knowledge-base/knowledge-node — 1 entity(ies) inside, 2 attribute(s) on the root
- knowledge-base/link-type — 1 entity(ies) inside, 9 attribute(s) on the root
- knowledge-base/llm-run — 1 entity(ies) inside, 10 attribute(s) on the root
- knowledge-base/node-attribute — 0 entity(ies) inside, 9 attribute(s) on the root
- knowledge-base/node-type — 0 entity(ies) inside, 3 attribute(s) on the root
- knowledge-base/raw-information — 1 entity(ies) inside, 11 attribute(s) on the root
- owner-access/sign-in-attempt — 0 entity(ies) inside, 3 attribute(s) on the root

## Capabilities

- owner-identity — consumed by owner-access

## Constraints

- answers-carry-allowed-origin (system)
- anthropic-key-required (system)
- chat-content-is-data (chat)
- chat-directed-ingestion-description-matches-mcp (chat)
- chat-reads-are-consistent (chat)
- chat-toolset (chat)
- compliance-deletion-is-atomic (knowledge-base)
- curation-is-atomic (knowledge-base)
- curation-mcp-needs-no-run-identity (knowledge-base)
- curation-reads-are-consistent (knowledge-base)
- curation-transports-answer-alike (knowledge-base)
- curation-write-failure-logged (knowledge-base)
- document-content-is-data (knowledge-base)
- entity-edit-is-atomic (knowledge-base)
- entity-editing-is-not-a-language-model-tool (knowledge-base)
- every-operation-requires-owner-authentication (system)
- expected-refusals-not-logged-as-errors (system)
- extraction-acts-only-through-proposals (knowledge-base)
- extraction-model-call-bounded (knowledge-base)
- failures-answer-one-envelope (system)
- ingest-toolset-offers-no-async-ingestion (knowledge-base)
- ingestion-transports-answer-alike (knowledge-base)
- internal-failure-withholds-cause (system)
- llm-toolset-omits-audit-reads (knowledge-base)
- llm-toolset-omits-curation-metrics (knowledge-base)
- llm-toolset-omits-fragment-listing (knowledge-base)
- llm-toolset-omits-graph-point-reads (knowledge-base)
- local-operator-token-development-only (system)
- local-operator-token-minimum-length (system)
- local-operator-token-needs-explicit-development (system)
- local-process-transport-needs-no-authentication (system)
- logs-redact-text-fields (system)
- mcp-endpoint-serves-only-its-toolset (system)
- mcp-failure-is-tool-error (system)
- mcp-transport-failure-answers-empty-500 (system)
- owner-time-zone-must-be-known (system)
- preflight-needs-no-authentication (system)
- request-body-ceiling (system)
- retrieval-is-lexical-only (knowledge-base)
- retrieval-is-read-only (knowledge-base)
- retrieval-transports-answer-alike (knowledge-base)
- unreachable-store-answers-unavailable (system)

388 decision(s) disclosed, 8 fact(s) recorded as read, 2 location(s) retired in the decision logs.
