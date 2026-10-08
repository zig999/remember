---
title: Refuse a change made from a stale form
summary: A change that names no live attribute of its key, or that adds a second current value to a key that allows only one, is refused as a conflict.
rationale: Planning cut the stale-form refusals away from the dispute refusal. The two answer different reasons, a form opened before another change versus a dispute left to curation, and they carry different codes.
sources:
- intake/scope.md
objective: A change that does not start from the node's live attributes of its key is refused with BUSINESS_ENTITY_EDIT_CONFLICT.
criteria:
- A change naming an attribute of its key whose status is superseded is refused with BUSINESS_ENTITY_EDIT_CONFLICT.
- A change naming an attribute of its key whose status is deleted is refused with BUSINESS_ENTITY_EDIT_CONFLICT.
- A change naming an attribute of another key of the edited node is refused with BUSINESS_ENTITY_EDIT_CONFLICT.
- A change naming an attribute of another node is refused with BUSINESS_ENTITY_EDIT_CONFLICT.
- A change naming an identity at which no attribute is held is refused with BUSINESS_ENTITY_EDIT_CONFLICT.
- A set change naming a project's deadline attribute that was superseded once the owner had opened the form is refused with BUSINESS_ENTITY_EDIT_CONFLICT.
- A set change naming a superseded attribute and stating, character for character, that attribute's own value is refused with BUSINESS_ENTITY_EDIT_CONFLICT.
- A set change naming a deleted attribute and stating, character for character, that attribute's own value is refused with BUSINESS_ENTITY_EDIT_CONFLICT.
- A conflict refusal names the change's attribute key.
- A conflict refusal for a change that names an attribute names that attribute.
- A change naming an uncertain attribute of its key on the edited node is not refused by the live-attribute rule.
- A set change naming an active attribute that carries a supersession time and stating a value other than that attribute's own is refused with BUSINESS_ENTITY_EDIT_CONFLICT.
- A set change naming an uncertain attribute that carries a supersession time and stating a value other than that attribute's own is refused with BUSINESS_ENTITY_EDIT_CONFLICT.
- A set change naming an active attribute that carries a supersession time and stating, character for character, that attribute's own value is not refused by the supersession-time conflict rule.
- A set change naming an active attribute that carries no supersession time and stating another value is not refused by the supersession-time conflict rule.
- A set change naming no attribute, to a key that does not allow multiple current values while the node holds an active attribute of that key, is refused with BUSINESS_ENTITY_EDIT_CONFLICT.
- A set change naming no attribute, to a key that does not allow multiple current values while the node's only attribute of that key is disputed, is refused with BUSINESS_ENTITY_EDIT_CONFLICT.
- A set change naming no attribute, to a key that does not allow multiple current values while every attribute the node holds of that key is superseded or deleted, is not refused by the second-current-value rule.
- A set change naming no attribute, to a key that allows multiple current values while the node holds an active attribute of that key, is not refused by the second-current-value rule.
depends_on:
- task/entity-edit-backend/edit-refusal-codes
implements:
- rules/knowledge-base/entity-edit-names-a-live-attribute
- rules/knowledge-base/entity-edit-changes-no-attribute-with-a-supersession-time
- rules/knowledge-base/entity-edit-adds-no-second-current-value
- scenarios/knowledge-base/edit-of-a-superseded-attribute-is-a-conflict
- contracts/knowledge-base/entity-editing
- domain/knowledge-base/entity-edit
- domain/knowledge-base/attribute-change
- domain/knowledge-base/attribute-change-kind
- domain/knowledge-base/node-attribute
- domain/knowledge-base/attribute-key
- domain/knowledge-base/assertion-status
- domain/knowledge-base/live-assertion-status
---
## What it is
A change that names no live attribute of its key, or that adds a second current value to a key that allows only one, is refused as a conflict.

## Notes
UNDERDETERMINED, from the specification — contracts/knowledge-base/entity-editing sends all three conflict refusals (entity-edit-names-a-live-attribute, entity-edit-changes-no-attribute-with-a-supersession-time, entity-edit-adds-no-second-current-value) to "error code BUSINESS_ENTITY_EDIT_CONFLICT naming the attribute key and, where it has one, the item, HTTP 409 over REST". The criteria name the code, the key and the attribute. None of them names the HTTP status. Implementation that meets every criterion and that the specification refuses: An implementation that answers each conflict refusal with BUSINESS_ENTITY_EDIT_CONFLICT, naming the key and the item, but over REST with HTTP 422 (or any status other than 409).
Decision, beyond the covers — stand: specification is a read-only neighbour this task consults, and its fact is held by that node; this task changes none of it and the epic does not claim it.
UNDERDETERMINED, from the specification — The 'then' of scenarios/knowledge-base/edit-of-a-superseded-attribute-is-a-conflict says "nothing of the edit is recorded". constraints/entity-edit-is-atomic holds the same thing. The criteria only check the refusal code, so they never test that a stale change leaves the store untouched. This may belong to the task that implements constraints/entity-edit-is-atomic. If so, the caller can drop this note once that task's criteria cover a refusal that comes after an earlier change in the same edit. Implementation that meets every criterion and that the specification refuses: An implementation that writes an edit's earlier valid changes (new or superseded attributes, provenance, curation action), then meets a later change that names a superseded attribute and answers BUSINESS_ENTITY_EDIT_CONFLICT without rolling those writes back.
Decision, beyond the covers — stand: specification is a read-only neighbour this task consults, and its fact is held by that node; this task changes none of it and the epic does not claim it.
UNDERDETERMINED, from the specification — The contract has a separate conflict refusal, "when: Another operation changed an attribute the edit names first." It answers BUSINESS_ENTITY_EDIT_CONFLICT too, and it is the stale-form case under concurrency. No criterion covers it, so a check that reads the attributes outside a lock passes every criterion. It may belong to the task for the transactional write or concurrency guard. If so, the caller should name that task. If not, this task needs a criterion for it. Implementation that meets every criterion and that the specification refuses: An implementation that reads the node's attributes of the key, decides the change starts from a live attribute, then writes without locking those rows. A concurrent supersession between the read and the write goes through, and the edit is accepted instead of refused as a conflict.
Decision, beyond the covers — stand: specification is a read-only neighbour this task consults, and its fact is held by that node; this task changes none of it and the epic does not claim it.
UNDERDETERMINED, from the specification — Under rules/knowledge-base/entity-edit-change-check-order, the check against the edited node's attributes of its key runs last inside a change, after the key, value-type, allowed-values and validity checks. The criteria say nothing about order. So a stale change that also has, say, an unparseable value can be answered BUSINESS_ENTITY_EDIT_CONFLICT and still pass. That ordering is probably the subject of the task that implements rules/knowledge-base/entity-edit-change-check-order. This note is here so the caller can confirm that task exists inside the epic. Implementation that meets every criterion and that the specification refuses: An implementation that checks the named attribute's liveness before the value-type check. It refuses a change that names a superseded attribute and carries an unparseable value with BUSINESS_ENTITY_EDIT_CONFLICT instead of BUSINESS_INVALID_ATTRIBUTE_VALUE.
Decision, beyond the covers — stand: specification is a read-only neighbour this task consults, and its fact is held by that node; this task changes none of it and the epic does not claim it.
ADVISORY, from the specification — The criterion about a set change that names no attribute, to a single-current key whose only attribute is disputed, asks for BUSINESS_ENTITY_EDIT_CONFLICT. That matches rules/knowledge-base/entity-edit-adds-no-second-current-value, because domain/knowledge-base/live-assertion-status counts disputed as live. rules/knowledge-base/entity-edit-leaves-disputes-to-curation ("An entity edit MUST NOT change an attribute whose status is disputed") answers BUSINESS_ENTITY_EDIT_DISPUTED. The two read as disjoint only because a change that names no attribute changes no named attribute. Neither node nor rules/knowledge-base/entity-edit-change-check-order says which answer wins if the disputed rule is read to reach such a change. The executor should keep the reading the criterion takes.
Decision, beyond the covers — stand: specification is a read-only neighbour this task consults, and its fact is held by that node; this task changes none of it and the epic does not claim it.
ADVISORY, from the specification — The same per-change check covers rules/knowledge-base/entity-edit-leaves-disputes-to-curation (a change naming a disputed attribute) and rules/knowledge-base/entity-edit-unchanged-records-nothing (a set change stating a live attribute's own value). Both are candidates and both sit next to this task. Neither is implemented here. The executor needs their tasks to keep using the same per-change lookup.
Decision, beyond the covers — stand: specification is a read-only neighbour this task consults, and its fact is held by that node; this task changes none of it and the epic does not claim it.
