# Specification overview

Derived by spec.py from the specification files; never edited.

## Contexts

| context | strategic | elements | rules | contracts | scenarios |
|---|---|---|---|---|---|
| knowledge-base | core | 21 | 42 | 1 | 1 |

## Aggregates

- knowledge-base/compliance-deletion — 0 entity(ies) inside, 1 attribute(s) on the root
- knowledge-base/information-fragment — 0 entity(ies) inside, 5 attribute(s) on the root
- knowledge-base/knowledge-link — 0 entity(ies) inside, 3 attribute(s) on the root
- knowledge-base/knowledge-node — 1 entity(ies) inside, 2 attribute(s) on the root
- knowledge-base/link-type — 0 entity(ies) inside, 1 attribute(s) on the root
- knowledge-base/node-attribute — 0 entity(ies) inside, 2 attribute(s) on the root
- knowledge-base/raw-information — 1 entity(ies) inside, 5 attribute(s) on the root

## Capabilities

None.

## Constraints

- llm-toolset-omits-fragment-listing (knowledge-base)
- retrieval-is-read-only (knowledge-base)
- retrieval-transports-answer-alike (knowledge-base)

13 decision(s) disclosed in the decision log.
