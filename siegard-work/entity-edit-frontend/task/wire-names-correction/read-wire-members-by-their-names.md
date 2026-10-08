---
title: Read the knowledge base's wire members by the names it answers them under
summary: The client reads the multiple-current-values flag of an attribute key, the merged-into identity of a listed node and the effect of an applied change under the names the knowledge base's answers carry.
rationale: 'A corrective increment: the behavior was observed after the client was delivered and answers to no criterion of the delivered tasks.'
sources:
- intake/wire-names-correction.md
objective: The client reads these three members of the knowledge base's answers under the names the answers carry.
criteria:
- An attribute-key listing entry whose `allows_multiple_current` member is true is read as a key that allows multiple current values.
- An attribute-key listing entry whose `allows_multiple_current` member is false is read as a key that does not allow multiple current values.
- A node listing entry's `merged_into_node_id` member is read as the identity the listed node was merged into.
- A node listing entry whose `merged_into_node_id` member is null is read as a node merged into none.
- An applied change's `effect` is read as the answer states it, one of first_value, addition, succession, correction, removal and unchanged.
implements:
- contracts/entity-workspace/bff-entity-reads
- contracts/knowledge-base/retrieval
- contracts/entity-workspace/bff-entity-edit
- contracts/knowledge-base/entity-editing
- domain/knowledge-base/attribute-key
- domain/knowledge-base/knowledge-node
- domain/knowledge-base/edit-effect
- rules/knowledge-base/an-edit-effect-crosses-the-wire-with-underscores
---
## What it is
The client reads each of three answer members under the name the knowledge base sends it under.

## Notes
ADVISORY, from the specification — Criteria 1 and 2 rest on contracts/entity-workspace/bff-entity-reads, whose list-attribute-keys answer is the only candidate that names allows_multiple_current; criteria 3 and 4 rest on contracts/knowledge-base/retrieval, whose list-nodes answer names merged_into_node_id and its null case; criterion 5 rests on contracts/knowledge-base/entity-editing, domain/knowledge-base/edit-effect and rules/knowledge-base/an-edit-effect-crosses-the-wire-with-underscores.
ADVISORY, from the specification — contracts/knowledge-base/retrieval also gives the node of read-node and the nodes of traverse as node summaries carrying merged_into_node_id; this task's criteria cover only the node listing entry.
REMAINDER, from the specification — rules/knowledge-base/multi-current-attribute-keys, rules/knowledge-base/merged-node-names-survivor, rules/knowledge-base/merged-node-read-as-itself and rules/knowledge-base/node-listing-one-entry-per-node state what the knowledge base holds and answers, not how the client reads it; belongs to the knowledge base's catalog, merge, node read and node listing operations.
REMAINDER, from the specification — rules/entity-workspace/a-change-writes-an-empty-member-as-null and rules/entity-workspace/a-save-failure-is-classified-by-its-code cover how the save composes the edit request and classifies its failures; belongs to the entity workspace's save.
The decided-fact route wrote two entries into the specification before this task was composed: the wire name allows_multiple_current in contracts/entity-workspace/bff-entity-reads and the wire name merged_into_node_id in contracts/knowledge-base/retrieval, both read from intake/wire-names-correction.md.
Decision, beyond the covers — stand: rules/knowledge-base/multi-current-attribute-keys is not claimed, because it states what the knowledge base holds or answers and the client only reads the answer.
Decision, beyond the covers — stand: rules/knowledge-base/merged-node-names-survivor is not claimed, because it states what the knowledge base holds or answers and the client only reads the answer.
Decision, beyond the covers — stand: rules/knowledge-base/merged-node-read-as-itself is not claimed, because it states what the knowledge base holds or answers and the client only reads the answer.
Decision, beyond the covers — stand: rules/knowledge-base/node-listing-one-entry-per-node is not claimed, because it states what the knowledge base holds or answers and the client only reads the answer.
Decision, beyond the covers — stand: rules/entity-workspace/a-change-writes-an-empty-member-as-null is not claimed, because it governs how the save composes and classifies the edit, which the entity workspace's save tasks implement.
Decision, beyond the covers — stand: rules/entity-workspace/a-save-failure-is-classified-by-its-code is not claimed, because it governs how the save composes and classifies the edit, which the entity workspace's save tasks implement.
