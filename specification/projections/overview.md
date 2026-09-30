# Specification overview

Derived by spec.py from the specification files; never edited.

## Contexts

| context | strategic | elements | rules | contracts | scenarios |
|---|---|---|---|---|---|
| knowledge-base | core | 42 | 179 | 2 | 8 |

## Aggregates

- knowledge-base/attribute-key — 0 entity(ies) inside, 6 attribute(s) on the root
- knowledge-base/compliance-deletion — 0 entity(ies) inside, 1 attribute(s) on the root
- knowledge-base/entity-match-review — 0 entity(ies) inside, 1 attribute(s) on the root
- knowledge-base/information-fragment — 0 entity(ies) inside, 4 attribute(s) on the root
- knowledge-base/knowledge-link — 0 entity(ies) inside, 8 attribute(s) on the root
- knowledge-base/knowledge-node — 1 entity(ies) inside, 2 attribute(s) on the root
- knowledge-base/link-type — 1 entity(ies) inside, 5 attribute(s) on the root
- knowledge-base/llm-run — 1 entity(ies) inside, 8 attribute(s) on the root
- knowledge-base/node-attribute — 0 entity(ies) inside, 8 attribute(s) on the root
- knowledge-base/node-type — 0 entity(ies) inside, 2 attribute(s) on the root
- knowledge-base/raw-information — 1 entity(ies) inside, 8 attribute(s) on the root

## Capabilities

None.

## Constraints

- document-content-is-data (knowledge-base)
- extraction-acts-only-through-proposals (knowledge-base)
- ingestion-transports-answer-alike (knowledge-base)
- llm-toolset-omits-fragment-listing (knowledge-base)
- retrieval-is-lexical-only (knowledge-base)
- retrieval-is-read-only (knowledge-base)
- retrieval-requires-owner-authentication (knowledge-base)
- retrieval-transports-answer-alike (knowledge-base)

66 decision(s) disclosed, 1 location(s) retired in the decision log.
