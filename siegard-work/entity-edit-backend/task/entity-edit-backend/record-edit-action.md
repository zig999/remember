---
title: Record the edit's curation action
summary: An accepted edit records one curation action of kind edit-entity on the edited node, carrying the reason and the applied changes.
rationale: Planning cut the audit record into its own task. It changes with the audit's shape rather than with how attributes are recorded, and it can be shown working given a reason and a list of applied changes.
sources:
- intake/scope.md
objective: An accepted edit's curation action is recorded at the edited node with the edit's reason and its applied changes.
criteria:
- The curation action's kind is recorded as edit_entity.
- The curation action's target kind is node.
- The curation action's target identity is the edited node's.
- The curation action's reason is the edit's reason.
- The curation action's payload is an object whose applied field lists one entry for each applied change of the edit.
- The payload's applied entries are in the order in which the edit's changes were given.
- Each payload entry carries exactly the fields attribute_key, effect, item_id and predecessor_id.
- Each payload entry's values are those of the applied change it lists.
- A first-value entry of the payload carries the effect first_value.
- An unchanged entry of the payload carries item_id as null rather than omitting it.
- A first-value entry of the payload carries predecessor_id as null rather than omitting it.
- Recording the action returns the identity of the curation action it recorded.
implements:
- rules/knowledge-base/entity-edit-records-curation-action
- rules/knowledge-base/a-curation-action-kind-is-written-with-underscores
- rules/knowledge-base/entity-edit-reason-trimmed
- domain/knowledge-base/curation-action
- domain/knowledge-base/curation-action-kind
- domain/knowledge-base/curation-target-kind
- domain/knowledge-base/entity-edit
- domain/knowledge-base/applied-change
- domain/knowledge-base/edit-effect
- contracts/knowledge-base/entity-editing
---
## What it is
An accepted edit records one curation action of kind edit-entity on the edited node, carrying the reason and the applied changes.

## Notes
UNDERDETERMINED, from the specification — rules/knowledge-base/entity-edit-reason-trimmed says an entity edit records its reason with surrounding whitespace trimmed. Its Description names the curation action's reason as one of the places this applies. The criterion "The curation action's reason is the edit's reason." does not say whether the reason is the trimmed one or the raw one, and no criterion requires trimming. Implementation that meets every criterion and that the specification refuses: A recorder that writes the reason exactly as the owner sent it, with leading and trailing whitespace kept, into the curation action's reason. Every criterion is still met, because that is literally the edit's reason.
Decision, beyond the covers — stand: specification is a read-only neighbour this task consults, and its fact is held by that node; this task changes none of it and the epic does not claim it.
UNDERDETERMINED, from the specification — rules/knowledge-base/entity-edit-records-curation-action says an accepted edit records ONE curation action. Every criterion talks about "the curation action", and none limits how many actions one edit records. Implementation that meets every criterion and that the specification refuses: A recorder that inserts the same edit_entity action twice for one accepted edit and returns the identity of one of them. Each recorded action meets every criterion, but the specification allows one action per edit.
Decision, beyond the covers — stand: specification is a read-only neighbour this task consults, and its fact is held by that node; this task changes none of it and the epic does not claim it.
REMAINDER, from the specification — rules/knowledge-base/a-curation-action-kind-is-written-with-underscores has a second clause, "wherever a listing of curation actions filters by it". It requires that a listing filtered by kind accepts and matches edit_entity. No criterion of this task reaches it, because this task only records the action. Belongs to: The list-curation-actions operation of contracts/knowledge-base/compliance-audit, where filtering by kind must accept and match edit_entity. That is a separate task over that contract.
Decision, beyond the covers — stand: specification is a read-only neighbour this task consults, and its fact is held by that node; this task changes none of it and the epic does not claim it.
ADVISORY, from the specification — The payload's type differs between nodes. domain/knowledge-base/curation-action declares the payload attribute as type string, and its log says it is carried whole as text. rules/knowledge-base/entity-edit-records-curation-action and the criteria require the payload to be an object with an `applied` field. contracts/knowledge-base/compliance-audit reads the payload back as an object. These fit together if the string is the stored text form of the object. The executor should record the payload in the same form as the existing curation action kinds, so that reading actions back returns an object and never an object encoded inside a string.
Decision, beyond the covers — stand: specification is a read-only neighbour this task consults, and its fact is held by that node; this task changes none of it and the epic does not claim it.
ADVISORY, from the specification — constraints/entity-edit-is-atomic says the curation action takes effect together with the edit's raw information, chunk, fragment, LLM run, attributes and provenance, or not at all. No criterion of this task addresses that, and the constraint is not in implements. The recorder has to run inside the edit's transaction, on the caller's connection and never its own. The task that runs the whole edit write is where atomicity is proven.
Decision, beyond the covers — stand: specification is a read-only neighbour this task consults, and its fact is held by that node; this task changes none of it and the epic does not claim it.
ADVISORY, from the specification — Criteria 14 and 15 rely on reading the nodes together. The criteria are "An unchanged entry of the payload carries item_id as null rather than omitting it." and "A first-value entry of the payload carries predecessor_id as null rather than omitting it." rules/knowledge-base/entity-edit-records-curation-action only says null "where the effect has none". The reading that an unchanged effect has no item and a first-value effect has no predecessor comes from three places. domain/knowledge-base/applied-change reads item_id as the attribute the change recorded and predecessor_id as the one it superseded or rejected. rules/knowledge-base/entity-edit-unchanged-records-nothing says unchanged records nothing. rules/knowledge-base/entity-edit-first-value says a first value supersedes nothing. The last two are not in implements, because they decide the effect and not the record. The executor takes each entry's values from the applied change it is handed and does not work them out again.
Decision, beyond the covers — stand: specification is a read-only neighbour this task consults, and its fact is held by that node; this task changes none of it and the epic does not claim it.
