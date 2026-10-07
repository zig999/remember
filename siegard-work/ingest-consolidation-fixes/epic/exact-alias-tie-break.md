---
title: Deterministic exact-alias resolution among homonyms
summary: Picks the same node every time when a node proposal's name equals an alias held by more than one active node of its type.
rationale: The planner asked for one epic per behavior. The scope's item (2) is one behavior, and the lookup it changes is used by no other item, so it gets its own epic.
sources:
- intake/scope.md
covers:
- rules/knowledge-base/exact-alias-resolves
- domain/knowledge-base/node-resolution
- domain/knowledge-base/node-alias
- domain/knowledge-base/knowledge-node
- scenarios/knowledge-base/admitted-acronym-resolves-later-proposal
- rules/knowledge-base/exact-alias-earliest-alias-wins
---

## What it is
The exact-alias lookup used to resolve a node proposal stops returning an arbitrary node when two active nodes of one type share an alias.
It chooses the node with the oldest matching alias, and the node identity breaks any remaining tie.

## Notes
None of the impact set's nodes states a tie-break among homonyms; the order (oldest alias, then node identity) comes from the scope.
The scope rules out any database change, and the inventory finds `node_alias.created_at` and `node_alias.id` already in place for the ordering.
