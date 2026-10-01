# Specification overview

Derived by spec.py from the specification files; never edited.

## Contexts

| context | strategic | elements | rules | contracts | scenarios |
|---|---|---|---|---|---|
| chat | supporting | 17 | 78 | 1 | 0 |
| knowledge-base | core | 75 | 373 | 5 | 10 |

## Aggregates

- chat/conversation — 3 entity(ies) inside, 5 attribute(s) on the root
- knowledge-base/attribute-key — 0 entity(ies) inside, 8 attribute(s) on the root
- knowledge-base/compliance-deletion — 0 entity(ies) inside, 3 attribute(s) on the root
- knowledge-base/curation-action — 0 entity(ies) inside, 6 attribute(s) on the root
- knowledge-base/entity-match-review — 0 entity(ies) inside, 1 attribute(s) on the root
- knowledge-base/information-fragment — 0 entity(ies) inside, 5 attribute(s) on the root
- knowledge-base/knowledge-link — 0 entity(ies) inside, 8 attribute(s) on the root
- knowledge-base/knowledge-node — 1 entity(ies) inside, 2 attribute(s) on the root
- knowledge-base/link-type — 1 entity(ies) inside, 9 attribute(s) on the root
- knowledge-base/llm-run — 1 entity(ies) inside, 8 attribute(s) on the root
- knowledge-base/node-attribute — 0 entity(ies) inside, 9 attribute(s) on the root
- knowledge-base/node-type — 0 entity(ies) inside, 3 attribute(s) on the root
- knowledge-base/raw-information — 1 entity(ies) inside, 11 attribute(s) on the root

## Capabilities

None.

## Constraints

- chat-content-is-data (chat)
- chat-reads-are-consistent (chat)
- chat-toolset (chat)
- compliance-deletion-is-atomic (knowledge-base)
- curation-is-atomic (knowledge-base)
- curation-reads-are-consistent (knowledge-base)
- curation-transports-answer-alike (knowledge-base)
- document-content-is-data (knowledge-base)
- every-operation-requires-owner-authentication (system)
- extraction-acts-only-through-proposals (knowledge-base)
- failures-answer-one-envelope (system)
- ingestion-transports-answer-alike (knowledge-base)
- internal-failure-withholds-cause (system)
- llm-toolset-omits-audit-reads (knowledge-base)
- llm-toolset-omits-curation-metrics (knowledge-base)
- llm-toolset-omits-fragment-listing (knowledge-base)
- llm-toolset-omits-graph-point-reads (knowledge-base)
- local-operator-token-development-only (system)
- mcp-failure-is-tool-error (system)
- retrieval-is-lexical-only (knowledge-base)
- retrieval-is-read-only (knowledge-base)
- retrieval-transports-answer-alike (knowledge-base)
- unreachable-store-answers-unavailable (system)

150 decision(s) disclosed, 2 location(s) retired in the decision logs.
