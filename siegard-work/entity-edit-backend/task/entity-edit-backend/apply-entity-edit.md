---
title: Apply an entity edit as one whole
summary: The edit service checks, decides and records every change of one edit inside one transaction and answers the node, the action and each applied change.
rationale: Planning cut the joining of checks, decisions and writes into one task of its own. Atomicity, the changes-something refusal and the applied answer belong to the edit as a whole and to no single change.
sources:
- intake/scope.md
objective: An entity edit takes effect whole or not at all, and an accepted edit answers node_id, action_id and one applied entry per change.
criteria:
- An accepted edit answers the edited node's identity as node_id.
- An accepted edit answers the identity of the curation action it recorded as action_id.
- An accepted edit answers exactly one applied entry for each change it was given.
- An accepted edit answers its applied entries in the order in which its changes were given.
- Each applied entry names its change's attribute key.
- Each applied entry carries its change's effect.
- An unchanged entry carries a null item_id.
- An unchanged entry carries a null predecessor_id.
- A first-value entry carries a null predecessor_id.
- A removal entry carries a null item_id.
- A removal entry carries the removed attribute as its predecessor_id.
- A succession entry carries the new attribute as its item_id.
- A succession entry carries the superseded attribute as its predecessor_id.
- An unchanged change records no attribute.
- An edit whose every change is unchanged is refused with BUSINESS_ENTITY_EDIT_NO_CHANGES.
- An edit refused for changing nothing records no raw information.
- An edit with one unchanged change and one first value is not refused by the changes-something rule.
- An edit of an active node with a reason and an empty list of changes is refused with BUSINESS_ENTITY_EDIT_NO_CHANGES.
- An edit with an empty list of changes records no raw information.
- An edit with an empty list of changes records no LLM run.
- An edit with an empty list of changes records no curation action.
- An accepted edit of several changes records one raw information.
- An accepted edit of several changes records one LLM run.
- An accepted edit records one curation action.
- An accepted edit whose reason was sent surrounded by whitespace records its curation action's reason trimmed of that whitespace.
- An accepted edit whose reason was sent surrounded by whitespace records its information fragment's text trimmed of that whitespace.
- An accepted edit whose reason was sent surrounded by whitespace records note content that holds the reason trimmed of that whitespace.
- An edit whose second change is refused leaves no attribute its first change would have recorded.
- A refused edit leaves no LLM run.
- A refused edit leaves no curation action.
- An edit refused because its set change names a superseded deadline attribute leaves no raw information.
- A change naming an attribute that another operation superseded while the edit waited for its lock is refused with BUSINESS_ENTITY_EDIT_CONFLICT.
- A write that a uniqueness guard of the store refuses answers BUSINESS_TEMPORAL_INCOHERENT.
- The edit's writes run inside one database transaction.
- A change whose valid_from is not written YYYY-MM-DD and whose key the catalog does not hold for the edited node's type is refused with VALIDATION_INVALID_FORMAT.
- A change naming a key the catalog does not hold for the edited node's type and whose validity start falls later than its validity end is refused with BUSINESS_UNKNOWN_ATTRIBUTE_KEY.
- A change naming a key the catalog does not hold for the edited node's type and naming an attribute whose status is superseded is refused with BUSINESS_UNKNOWN_ATTRIBUTE_KEY.
- A set change whose value does not read as its key's value type and whose validity start falls later than its validity end is refused with BUSINESS_INVALID_ATTRIBUTE_VALUE.
- A set change whose value is none of its key's allowed values and that names an attribute whose status is superseded is refused with BUSINESS_INVALID_ATTRIBUTE_VALUE.
- A change whose validity start falls later than its validity end and that names an attribute whose status is superseded is refused with BUSINESS_TEMPORAL_INCOHERENT.
- An edit whose body has no reason and that names an identity at which no knowledge node is held is refused with VALIDATION_INVALID_FORMAT.
- An edit whose reason holds 1001 characters once trimmed and that names a node whose status is merged is refused with VALIDATION_INVALID_FORMAT.
- An edit carrying a change whose valid_from is not written YYYY-MM-DD and naming an identity at which no knowledge node is held is refused with VALIDATION_INVALID_FORMAT.
- An edit whose first change names a key the catalog does not hold for the edited node's type and whose second change's kind is neither set nor remove is refused with VALIDATION_INVALID_FORMAT.
- An edit naming an identity at which no knowledge node is held and carrying a change whose validity start falls later than its validity end is refused with RESOURCE_NOT_FOUND.
- An edit naming a node whose status is needs-review and carrying a change naming a key the catalog does not hold for that node's type is refused with BUSINESS_NODE_NOT_ACTIVE.
- An edit whose first change names a key the catalog does not hold for the edited node's type and whose second change's validity start falls later than its validity end is refused with BUSINESS_UNKNOWN_ATTRIBUTE_KEY.
- An edit whose first change's validity start falls later than its validity end and whose second change names a key the catalog does not hold for the edited node's type is refused with BUSINESS_TEMPORAL_INCOHERENT.
depends_on:
- task/entity-edit-backend/edit-refusal-codes
- task/entity-edit-backend/check-change-key-and-value
- task/entity-edit-backend/check-change-validity
- task/entity-edit-backend/refuse-inactive-node
- task/entity-edit-backend/refuse-stale-change
- task/entity-edit-backend/refuse-disputed-change
- task/entity-edit-backend/assign-change-effect
- task/entity-edit-backend/record-operator-note
- task/entity-edit-backend/record-new-attribute
- task/entity-edit-backend/record-succession
- task/entity-edit-backend/record-correction
- task/entity-edit-backend/record-removal
- task/entity-edit-backend/record-edit-action
implements:
- contracts/knowledge-base/entity-editing
- constraints/entity-edit-is-atomic
- domain/knowledge-base/entity-edit
- domain/knowledge-base/applied-change
- domain/knowledge-base/edit-effect
- rules/knowledge-base/an-edit-effect-crosses-the-wire-with-underscores
- rules/knowledge-base/entity-edit-changes-something
- scenarios/knowledge-base/an-edit-with-no-changes-is-refused-as-changing-nothing
- rules/knowledge-base/entity-edit-check-order
- rules/knowledge-base/entity-edit-change-check-order
- scenarios/knowledge-base/edit-of-a-superseded-attribute-is-a-conflict
- rules/knowledge-base/entity-edit-unchanged-records-nothing
- rules/knowledge-base/entity-edit-first-value
- rules/knowledge-base/entity-edit-removal
- rules/knowledge-base/entity-edit-succession
- rules/knowledge-base/entity-edit-records-curation-action
- rules/knowledge-base/entity-edit-reason-trimmed
- rules/knowledge-base/entity-edit-note
- rules/knowledge-base/entity-edit-note-content
- rules/knowledge-base/entity-edit-run
---
## What it is
The edit service checks, decides and records every change of one edit inside one transaction and answers the node, the action and each applied change.

## Notes
UNDERDETERMINED, from the specification — contracts/knowledge-base/entity-editing's accepted answer says `item_id` and `predecessor_id` are null only where the effect has none, and domain/knowledge-base/applied-change says item_id is the attribute the change recorded and predecessor_id the one it superseded or rejected. The criteria check entry identities for unchanged, first-value (predecessor only), removal and succession. They never check a first-value entry's item_id, and they check no correction or addition entry at all. Implementation that meets every criterion and that the specification refuses: An edit service that answers a first-value or addition entry with item_id null, or a correction entry with item_id and predecessor_id both null, while still answering unchanged, removal and succession entries correctly.
Decision, beyond the covers — stand: specification is a read-only neighbour this task consults, and its fact is held by that node; this task changes none of it and the epic does not claim it.
UNDERDETERMINED, from the specification — rules/knowledge-base/an-edit-effect-crosses-the-wire-with-underscores requires every effect in the answer to be written with underscores, for example first_value. The criterion 'Each applied entry carries its change's effect' does not fix how the effect is spelled. Implementation that meets every criterion and that the specification refuses: An edit service that answers each applied entry's effect in its enumeration form, with hyphens (`first-value`), instead of `first_value`.
Decision, beyond the covers — stand: specification is a read-only neighbour this task consults, and its fact is held by that node; this task changes none of it and the epic does not claim it.
UNDERDETERMINED, from the specification — rules/knowledge-base/entity-edit-records-curation-action requires the curation action to have kind edit-entity (written edit_entity under rules/knowledge-base/a-curation-action-kind-is-written-with-underscores), target kind node, target_id equal to the edited node's identity, and a payload object whose `applied` field lists the applied entries with underscore effects and nulls. The criteria check only that exactly one action is recorded, that action_id is its identity, and that its reason is trimmed. Implementation that meets every criterion and that the specification refuses: An edit service that records one curation action with kind correct_item, target kind attribute, no target_id and an empty payload, with a trimmed reason, and answers its identity as action_id.
Decision, beyond the covers — stand: specification is a read-only neighbour this task consults, and its fact is held by that node; this task changes none of it and the epic does not claim it.
UNDERDETERMINED, from the specification — rules/knowledge-base/entity-edit-note requires one raw chunk that holds all of the raw information's content, and one information fragment anchored to that chunk with status accepted. rules/knowledge-base/entity-edit-note-content requires the content to also hold the moment of the edit and a nonce of its own. The criteria check only that there is one raw information, that the fragment's text is the trimmed reason, and that the content holds the trimmed reason. Implementation that meets every criterion and that the specification refuses: An edit service whose raw information content is only the trimmed reason, with no moment and no nonce, chunked into two raw chunks, with a fragment left in a non-accepted status.
Decision, beyond the covers — stand: specification is a read-only neighbour this task consults, and its fact is held by that node; this task changes none of it and the epic does not claim it.
UNDERDETERMINED, from the specification — rules/knowledge-base/entity-edit-run requires the LLM run to have model operator and prompt version operator-edit-v1, and to be completed without calling a language model. The criteria check only that an accepted edit records one LLM run and that a refused edit leaves none. Implementation that meets every criterion and that the specification refuses: An edit service that opens one LLM run with any other model or prompt version, or leaves it open and never completes it.
Decision, beyond the covers — stand: specification is a read-only neighbour this task consults, and its fact is held by that node; this task changes none of it and the epic does not claim it.
UNDERDETERMINED, from the specification — rules/knowledge-base/entity-edit-unchanged-records-nothing reports a change as unchanged only when its value matches character for character. For a change that names an attribute, that attribute must have a live status. For a change that names none, the key must allow multiple current values and an active or uncertain attribute must hold the value. The criteria check only what an unchanged entry answers and that it records nothing, not when a change is unchanged. Implementation that meets every criterion and that the specification refuses: An edit service that compares values after normalization, reporting a value that differs only in case or accents as unchanged, or that reports a change naming a superseded attribute with that attribute's own value as unchanged instead of refusing it as a conflict.
Decision, beyond the covers — stand: specification is a read-only neighbour this task consults, and its fact is held by that node; this task changes none of it and the epic does not claim it.
UNDERDETERMINED, from the specification — rules/knowledge-base/entity-edit-first-value, rules/knowledge-base/entity-edit-removal and rules/knowledge-base/entity-edit-succession say what each effect writes. First-value records a new active attribute. Removal marks the named attribute deleted and gives it the moment of the edit as its supersession time. Succession supersedes the named attribute and records a new active attribute that names it as superseded. The criteria check only the identities each entry answers. Implementation that meets every criterion and that the specification refuses: An edit service that answers a removal entry with the named attribute as predecessor_id but leaves that attribute active, or answers a succession entry with the new and the old attribute but leaves the old one active, or records the new one without pointing it at the old one.
Decision, beyond the covers — stand: specification is a read-only neighbour this task consults, and its fact is held by that node; this task changes none of it and the epic does not claim it.
ADVISORY, from the specification — The precedence criteria (39–52) depend on checks whose conditions belong to rules outside this task's implements, as rules/knowledge-base/entity-edit-check-order and rules/knowledge-base/entity-edit-change-check-order themselves say. Those rules are rules/knowledge-base/entity-edit-reason-length, rules/knowledge-base/entity-edit-value-matches-the-kind, rules/knowledge-base/entity-edit-names-an-active-node, rules/knowledge-base/attribute-key-for-node-type, rules/knowledge-base/attribute-value-parses, rules/knowledge-base/attribute-value-in-allowed-values, rules/knowledge-base/validity-start-before-end and rules/knowledge-base/entity-edit-names-a-live-attribute. This task orders the checks and does not define them, so the tasks that implement those checks have to come first, or the ordering cannot be shown.
Decision, beyond the covers — stand: specification is a read-only neighbour this task consults, and its fact is held by that node; this task changes none of it and the epic does not claim it.
ADVISORY, from the specification — The criterion 'An edit whose reason holds 1001 characters once trimmed and that names a node whose status is merged is refused with VALIDATION_INVALID_FORMAT' counts in characters. rules/knowledge-base/entity-edit-reason-length, as narrowed by the second entry of its log, counts UTF-16 code units. The two agree only for text inside the Basic Multilingual Plane. The test should use such text, or the criterion should say code units.
Decision, beyond the covers — stand: specification is a read-only neighbour this task consults, and its fact is held by that node; this task changes none of it and the epic does not claim it.
ADVISORY, from the specification — The criterion 'A change naming an attribute that another operation superseded while the edit waited for its lock is refused with BUSINESS_ENTITY_EDIT_CONFLICT' names a lock that no node states. contracts/knowledge-base/entity-editing states only the outcome: another operation changed an attribute the edit names first. The lock is how this task gets there, not a specified fact. Testing it needs a concurrent writer.
Decision, beyond the covers — stand: specification is a read-only neighbour this task consults, and its fact is held by that node; this task changes none of it and the epic does not claim it.
ADVISORY, from the specification — This task describes the edit service. contracts/knowledge-base/entity-editing's transport clauses go untested here: POST /api/v1/nodes/{node_id}/edit, HTTP 200 with no envelope, the HTTP status of each refusal, the VALIDATION_INVALID_FORMAT message and its `details.issues`, and the attribute key, item and status that the conflict and not-active refusals name. The task that mounts the REST route must reach them.
Decision, beyond the covers — stand: specification is a read-only neighbour this task consults, and its fact is held by that node; this task changes none of it and the epic does not claim it.
