---
title: Order the exact-alias lookup by oldest alias, then node identity
summary: Makes the exact-alias lookup choose among homonym nodes by the creation time of the matching alias, and then by node identity.
rationale: The scope states the expected tie-break but not how to cut it. It is one lookup with one reason to change, so it is one task. The single-match and no-migration criteria come from the exact-alias-resolves invariant and from the scope's "no database change".
sources:
- intake/scope.md
objective: A node proposal whose name equals an alias of several active nodes of its type resolves to the same node every time it is made against the same graph.
criteria:
- Where two active nodes of the proposal's node type each hold an alias equal to the proposed name, the proposal resolves as matched-existing to the node whose matching alias has the earliest creation time.
- Where two active nodes of the proposal's node type hold matching aliases with equal creation times, the proposal resolves as matched-existing to the node with the lower node identity.
- Repeating the same homonym proposal against an unchanged graph resolves to the same node on every repetition.
- A proposal whose name equals an alias of exactly one active node of its node type still resolves as matched-existing to that node.
- The change adds no file under migrations/.
implements:
- rules/knowledge-base/exact-alias-earliest-alias-wins
- rules/knowledge-base/exact-alias-resolves
- domain/knowledge-base/node-resolution
- domain/knowledge-base/node-alias
- domain/knowledge-base/knowledge-node
- scenarios/knowledge-base/admitted-acronym-resolves-later-proposal
---

## What it is
The one exact-alias lookup (`findExactMatch`) gains a deterministic order for its single row.
Proposals that match one node, or no node, resolve exactly as before.

## Notes
Existing tests that mock this query or assert its SQL text will see the new ordering.
UNDERDETERMINED, from the specification — rules/knowledge-base/exact-alias-earliest-alias-wins counts an alias with no recorded creation time as created after every alias that has one, and no criterion reaches that clause.
Passes: a lookup ordered by creation time ascending with the missing times first, or one that filters out aliases with no creation time, meets every criterion as written and the rule refuses both.
ADVISORY, from the specification — criteria 1 and 2 speak of two active nodes while the rule governs more than one, so three or more homonyms are tested by no criterion.
ADVISORY, from the specification — the criterion that adds no file under migrations/ rests on no specification node; it is a delivery condition.
