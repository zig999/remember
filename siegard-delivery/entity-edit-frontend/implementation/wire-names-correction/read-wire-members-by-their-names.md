---
title: Read the wire members by the names the knowledge base answers them under
summary: The client reads allows_multiple_current from attribute-key listing entries and merged_into_node_id from node listing entries, and reads an applied change's effect as the answer states it.
target: frontend
task: sha256:c86435dcc776a114420f59a516bd7d181151e6af8fa778f3f02a02053b009d5d
standard:
  at: ../standards/frontend-react.yaml
  pin: sha256:2b03615161995450265523de6bdd9c464b2ca633976e832e36586c1ab1aa2cf7
run: run/wire-names-correction-read-wire-members-by-their-names-build
files:
- path: src/features/entities/types.ts
  effect: AttributeKeyWire now declares the multiple-current-values flag as allows_multiple_current. ListedNodeWire now declares the merged-into identity as merged_into_node_id, a string or null. The old names are no longer part of the wire types.
- path: src/features/entities/api/_transforms.ts
  effect: toAttributeKey sets AttributeKey.allowsMultiple from wire.allows_multiple_current, so true and false are read as the key allowing or not allowing multiple current values. toListedNode sets ListedNode.mergedInto from wire.merged_into_node_id, so a null member reads as a node merged into none.
criteria:
- criterion: An attribute-key listing entry whose `allows_multiple_current` member is true is read as a key that allows multiple current values.
  met: true
  how: toAttributeKey in src/features/entities/api/_transforms.ts reads allowsMultiple from wire.allows_multiple_current, and AttributeKeyWire in src/features/entities/types.ts declares that member. The form and the effect derivation read the same allowsMultiple field (components/entity-field-group.tsx, components/entity-change-effect.ts).
- criterion: An attribute-key listing entry whose `allows_multiple_current` member is false is read as a key that does not allow multiple current values.
  met: true
  how: The same read, with no coercion and no default. A false member gives allowsMultiple false.
- criterion: A node listing entry's `merged_into_node_id` member is read as the identity the listed node was merged into.
  met: true
  how: toListedNode in src/features/entities/api/_transforms.ts reads mergedInto from wire.merged_into_node_id, and ListedNodeWire in src/features/entities/types.ts declares it.
- criterion: A node listing entry whose `merged_into_node_id` member is null is read as a node merged into none.
  met: true
  how: ListedNodeWire types the member as string or null, and toListedNode passes null through unchanged as mergedInto null.
- criterion: An applied change's `effect` is read as the answer states it, one of first_value, addition, succession, correction, removal and unchanged.
  met: true
  how: toAppliedChange in src/features/entities/api/_transforms.ts copies wire.effect to AppliedChange.effect verbatim. The client applies no hyphen or underscore mapping to the answered effect, so first_value stays first_value. This criterion needed no edit, and the existing pass-through already reads the member as stated.
nodes:
- node: contracts/entity-workspace/bff-entity-reads
  encoded_at:
  - src/features/entities/types.ts
  - src/features/entities/api/_transforms.ts
  how: The list-attribute-keys answer carries allows_multiple_current per item. AttributeKeyWire declares that name, and toAttributeKey reads it.
- node: contracts/knowledge-base/retrieval
  encoded_at:
  - src/features/entities/types.ts
  - src/features/entities/api/_transforms.ts
  how: The list-nodes answer carries merged_into_node_id per item, null when the node was merged into none. ListedNodeWire declares it, and toListedNode reads it. The node summaries of read-node and traverse are outside this task's criteria and were not changed (see deferred).
- node: contracts/entity-workspace/bff-entity-edit
  encoded_at:
  - src/features/entities/api/_transforms.ts
  how: The edit answer is read through toEditAccepted and toAppliedChange. The effect of each applied change is carried as the answer states it. The request side and the failure classification are untouched.
- node: contracts/knowledge-base/entity-editing
  encoded_at:
  - src/features/entities/types.ts
  - src/features/entities/api/_transforms.ts
  how: The accepted answer { node_id, action_id, applied } with applied entries { attribute_key, effect, item_id, predecessor_id } is what AppliedChangeWire and EditAcceptedWire declare. The effect is read unchanged.
- node: domain/knowledge-base/attribute-key
  encoded_at:
  - src/features/entities/types.ts
  how: The attribute key's allows_multiple_current attribute is the wire member AttributeKeyWire now carries. The client's own AttributeKey.allowsMultiple is unchanged.
- node: domain/knowledge-base/knowledge-node
  encoded_at:
  - src/features/entities/types.ts
  how: The node's merged-into reference, 0..1, is the wire member ListedNodeWire now carries as merged_into_node_id, string or null.
- node: domain/knowledge-base/edit-effect
  how: The enumeration's six values are what the answered effect is read as. The client does not narrow the member to a union, because the existing test fixtures type it as a plain string. This is recorded as an inference. Nothing a delivery writes encodes the enumeration beyond the pass-through, so no encoded_at is given.
- node: rules/knowledge-base/an-edit-effect-crosses-the-wire-with-underscores
  how: The rule governs how the knowledge base spells the effect. The client honors it by not translating the member, and reads first_value with its underscore as the answer sends it. No source line encodes the rule, because the pass-through in toAppliedChange already did what it requires.
inferences:
- inferred: AppliedChange.effect and AppliedChangeWire.effect stay typed as plain strings rather than a union of the six underscore-spelled effects.
  from: The shared fixture ACCEPTED_WIRE in src/features/entities/api/__tests__/edit-support.ts types its wire as AppliedChangeWire with effect "created". A narrowing union would fail typecheck in a fixture owned by the test author. The criterion is met by the verbatim pass-through, which already reads the effect as stated.
- inferred: The old wire names allows_multiple and merged_into are removed from the listing wire types, with no fallback to them.
  from: contracts/entity-workspace/bff-entity-reads and contracts/knowledge-base/retrieval name only allows_multiple_current and merged_into_node_id, and the task's criteria describe reading these members by the names the answers carry.
preserved:
- The client-side domain fields AttributeKey.allowsMultiple and ListedNode.mergedInto keep their names and shapes, so components and hooks that read them are unchanged.
- The wire-to-domain transform structure in api/_transforms.ts, covering node types, aliases, attributes, allowed values, the edit request body composition and the accepted-answer mapping.
- The tolerant read of the read-node summary in toNodeSummary, which accepts merged_into_node_id or merged_into.
- The client's own predicted edit-effect vocabulary in components/entity-change-effect.ts, which is a client concept and is not the answered effect.
deferred:
- what: Existing test fixtures still use the old wire names allows_multiple (api/__tests__/attribute-keys.spec.ts, components/__tests__/page-support.tsx) and merged_into (api/__tests__/listing-requests.spec.ts, components/__tests__/list-support.tsx), and they use effect "created" (api/__tests__/edit-support.ts, edit-outcomes.spec.ts). Typed fixtures and specs asserting the old names will fail typecheck or the suite until the test author updates them.
  why: Tests and fixtures under __tests__ belong to the test author, and this delivery writes none.
- what: toNodeSummary (the read-node node) and the NodeSummaryWire type in types.ts still carry the optional merged_into fallback next to merged_into_node_id. The graph and curation features keep their own NodeSummaryWire types.
  why: The task's criteria cover only the node listing entry, and retrieval's read-node and traverse summaries are advisory per the task's Notes. Changing them would widen the task.
---
## What it is
The client's reading of three members of the knowledge base's answers, corrected to the names the answers carry.

## Notes
This was a corrective increment; the installed set is empty and the build ran typecheck and lint only, as the registry's build phase names them.
The existing test fixtures still spell the old member names; the proof rewrites them.
