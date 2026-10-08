---
title: Proof for reading the wire members by the names the knowledge base answers them under
summary: Three tests pin the multiple-current-values flag, the merged-into identity and the applied-change effect to the member names the answers carry. The fixtures behind them were rewritten to carry only those names.
target: frontend
implementation: sha256:f57b57bc4e1e3a5106404be607c5867a785c2efa126daf4f941aff91fee5885c
standard:
  at: ../standards/frontend-react.yaml
  pin: sha256:2b03615161995450265523de6bdd9c464b2ca633976e832e36586c1ab1aa2cf7
run: run/wire-names-correction-read-wire-members-by-their-names-suite
tests:
- file: src/features/entities/api/__tests__/attribute-keys.spec.ts
  name: reads an entry whose allows_multiple_current member is true as a key that allows multiple current values
  proves: An attribute-key listing entry whose `allows_multiple_current` member is true is read as a key that allows multiple current values.
  fails_when: the client reads the flag under any name other than allows_multiple_current (the old allows_multiple, for one), or ignores it, or defaults it to false. The entry then reads as allowsMultiple undefined or false instead of true.
- file: src/features/entities/api/__tests__/attribute-keys.spec.ts
  name: reads an entry whose allows_multiple_current member is false as a key that does not allow multiple current values
  proves: An attribute-key listing entry whose `allows_multiple_current` member is false is read as a key that does not allow multiple current values.
  fails_when: the client reads the flag under another name (the entry then reads as undefined, not false), or coerces or defaults a false member to true.
- file: src/features/entities/api/__tests__/listing-requests.spec.ts
  name: reads an entry's merged_into_node_id member as the identity the listed node was merged into
  proves: A node listing entry's `merged_into_node_id` member is read as the identity the listed node was merged into.
  fails_when: the client reads the merge target under any other name (the old merged_into, for one) or drops it. The merged node then reads with mergedInto undefined or null instead of "n-1".
- file: src/features/entities/api/__tests__/listing-requests.spec.ts
  name: reads an entry whose merged_into_node_id member is null as a node merged into none
  proves: A node listing entry whose `merged_into_node_id` member is null is read as a node merged into none.
  fails_when: a null member is turned into anything other than null, such as undefined or an empty string, or is read under a different name so the member comes back undefined.
- file: src/features/entities/api/__tests__/edit-outcomes.spec.ts
  name: reads an applied change answered with the effect %s as that effect
  proves: An applied change's `effect` is read as the answer states it, one of first_value, addition, succession, correction, removal and unchanged. The test runs once for each of the six values.
  fails_when: the client maps, narrows, renames or drops any of the six answered effects. The case that most plausibly breaks is first_value turned into first-value, or into a value from the client's own vocabulary. The failing row names the effect.
files:
- path: src/features/entities/api/__tests__/edit-support.ts
  effect: The accepted-answer fixture ACCEPTED_WIRE now answers its applied change with the effect first_value instead of "created", so every edit test that reads it is fed an effect the knowledge base can send.
- path: src/features/entities/components/__tests__/page-support.tsx
  effect: The attribute-keys answer fixture (keysAnswer) now carries allows_multiple_current instead of allows_multiple, so the entity page tests read the member under the name the answer carries.
- path: src/features/entities/components/__tests__/list-support.tsx
  effect: The node-listing answer fixture (nodesListing) now carries merged_into_node_id instead of merged_into, so the list page tests read the member under the name the answer carries.
not_applicable:
- edge_case: allows_multiple_current or merged_into_node_id absent from an entry
  why: Both contracts state each member as always present, a boolean and a string or null. No criterion reads an absent member, so a test would pin a behavior nothing states.
- edge_case: an effect string outside the six values
  why: The criterion covers the six answered values. The client does not validate the enumeration (the implementation recorded this as an inference). Nothing states what happens to a seventh value, so it is not pinned.
- edge_case: an empty listing, an empty applied list, or several applied changes in one answer
  why: The criteria concern the reading of one member of one entry. Collection size does not change what any criterion requires, and the existing listing and edit tests already own the collection shapes.
- edge_case: a refused, unreachable or timed-out read or edit
  why: Failure classification belongs to other tasks (the request helper and the save). This task changes only how three members of accepted answers are read.
- edge_case: two reads or edits at once
  why: No criterion concerns concurrency, and the changed code is a pure per-entry transform.
untested:
- 'contracts/entity-workspace/bff-entity-reads: its fact also states the request (path, node_type parameter, envelope, ordering) and the failures through the request helper, which other tasks own. A test of the flag member alone would assert part of the fact as the whole, so none is claimed. The two flag tests prove the criteria, not the node.'
- 'contracts/knowledge-base/retrieval: its fact spans a dozen operations, and this task reads only the list-nodes entry and the list-attribute-keys flag. The read-node and traverse summaries are outside the criteria, and no finite test of this task decides the node whole.'
- 'contracts/entity-workspace/bff-entity-edit: its fact is the request body, the refusal readings, the cutoff and the session end. Only the accepted answer''s effect is a criterion here, so no test of this task decides the node whole.'
- 'contracts/knowledge-base/entity-editing: it publishes the knowledge base''s answers and refusals (rules the backend enforces). The client can only prove how it reads the accepted answer, so a test here would claim part of the fact as the whole.'
- 'domain/knowledge-base/attribute-key: an aggregate-root declaration of what the knowledge base holds. The client reads one member of its listing, and no finite test of the client decides the declaration.'
- 'domain/knowledge-base/knowledge-node: an aggregate-root declaration of what the knowledge base holds, including the merged-into reference. The client reads that reference from the listing, and no finite test of the client decides the declaration.'
- 'domain/knowledge-base/edit-effect: an enumeration the knowledge base owns. The effect test shows the client passes each of the six values through, but it does not show that the enumeration is exactly those six (hyphenated in the node), so the node is not claimed.'
- 'rules/knowledge-base/an-edit-effect-crosses-the-wire-with-underscores: it constrains how the knowledge base spells the effect it sends, which is the backend''s behavior. The client test can show only that an underscore-spelled effect is read unchanged. Whether the answer spells it that way is not decidable from the client.'
- 'Implementation inference, behavior: the old wire names allows_multiple and merged_into are no longer read on the listing wire types, with no fallback. The contracts name only the new names, so what an entry carrying only the old names reads as is a fact no node decides. It is left unpinned.'
- 'Implementation inference, arrangement: AppliedChange.effect stays a plain string rather than a union of the six. This is a shape choice and gets no test.'
- 'Observation, outside the criteria: the client''s own predicted edit-effect vocabulary (components/entity-change-effect.ts) spells first-value with a hyphen, while the answered effect is first_value. No criterion or node relates the two, so no test compares them.'
- 'Observation, outside the criteria: toNodeSummary (the read-node summary) still tolerates both merged_into_node_id and merged_into. The task''s criteria cover only the listing entry, so that read is proven by no test of this task.'
---
## What it is
The tests that fail if the client reads the multiple-current-values flag, the merged-into identity or an applied change's effect under a name other than the one the knowledge base's answers carry.

## Notes
The suite ran green on its first attempt (run/wire-names-correction-read-wire-members-by-their-names-suite).
The test author had no shell and ran nothing; the run above was captured afterwards by the delivery.
Two existing tests were adjusted: the multi-field attribute-key test no longer asserts allowsMultiple, and the accepted-outcome test asserts the effect first_value instead of created.
