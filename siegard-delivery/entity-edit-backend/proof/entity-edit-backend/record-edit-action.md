---
target: backend
title: Proof for recording the entity edit's curation action
summary: Unit tests over a fake pg client show that recordEditAction writes one edit_entity action on the edited node, with the trimmed reason and the ordered applied entries, and returns its identity.
implementation: sha256:0dab0b983c48288d9390ef23c90cf11081df46757d0ebbdcea9c5bc1f7098ee2
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/entity-edit-backend-record-edit-action-suite
tests:
- file: src/__tests__/unit/curation/entity-edit-action.spec.ts
  name: the kind of the curation action an edit records is written edit_entity
  proves: The curation action's kind is recorded as edit_entity.
  fails_when: the inserted action column holds anything but the underscore spelling edit_entity, for example edit-entity or another kind.
- file: src/__tests__/unit/curation/entity-edit-action.spec.ts
  name: the target of the curation action an edit records is of the kind node
  proves: The curation action's target kind is node.
  fails_when: the inserted target_kind is anything but node, for example attribute or link.
- file: src/__tests__/unit/curation/entity-edit-action.spec.ts
  name: the target of the curation action an edit records is the edited node's identity
  proves: The curation action's target identity is the edited node's.
  fails_when: the inserted target_id is not the node id the recorder was handed, for example an attribute id, an action id or null.
- file: src/__tests__/unit/curation/entity-edit-action.spec.ts
  name: the reason of the curation action an edit records is the edit's reason, inner whitespace kept
  proves: The curation action's reason is the edit's reason.
  fails_when: the recorded reason is not the reason given, for example null, a constant, or a text with inner whitespace collapsed or altered.
- file: src/__tests__/unit/curation/entity-edit-action.spec.ts
  name: the reason of the curation action an edit records is the edit's reason without its surrounding whitespace
  proves: 'UNDERDETERMINED, from the specification: rules/knowledge-base/entity-edit-reason-trimmed says the curation action''s reason is recorded trimmed, while the criterion does not say it.'
  fails_when: the recorder writes the reason exactly as sent, with leading or trailing whitespace kept in the curation action's reason.
- file: src/__tests__/unit/curation/entity-edit-action.spec.ts
  name: the payload of the curation action an edit records is an object holding an applied list
  proves: The curation action's payload is an object whose applied field is a list (and, through the jsonb round trip, not an object encoded inside a string).
  fails_when: the payload is a bare list, a string holding encoded JSON, or an object with no applied list.
- file: src/__tests__/unit/curation/entity-edit-action.spec.ts
  name: the payload of the curation action an edit records lists one entry for each applied change
  proves: The payload's applied field lists one entry for each applied change of the edit.
  fails_when: the applied list drops a change (for example an unchanged one) or lists a change twice.
- file: src/__tests__/unit/curation/entity-edit-action.spec.ts
  name: the payload of the curation action an edit records lists the entries in the order the changes were given
  proves: The payload's applied entries are in the order in which the edit's changes were given.
  fails_when: the recorder sorts, groups or reverses the entries, so that role, email and phone no longer come out in the order handed.
- file: src/__tests__/unit/curation/entity-edit-action.spec.ts
  name: the payload of the curation action an edit records gives each entry exactly attribute_key, effect, item_id and predecessor_id
  proves: Each payload entry carries exactly the fields attribute_key, effect, item_id and predecessor_id.
  fails_when: an entry carries a field beyond the four (for example a spread copy of the handed change) or lacks one of them.
- file: src/__tests__/unit/curation/entity-edit-action.spec.ts
  name: the payload of the curation action an edit records gives an entry the values of the applied change it lists
  proves: Each payload entry's values are those of the applied change it lists.
  fails_when: an entry's attribute_key, item_id or predecessor_id differs from the handed change's, for example item_id and predecessor_id swapped or recomputed.
- file: src/__tests__/unit/curation/entity-edit-action.spec.ts
  name: the payload of the curation action an edit records writes the effect of a first-value entry as first_value
  proves: A first-value entry of the payload carries the effect first_value.
  fails_when: the effect is written with its hyphen as first-value, or in any other spelling.
- file: src/__tests__/unit/curation/entity-edit-action.spec.ts
  name: the payload of the curation action an edit records carries item_id as null on an unchanged entry rather than omitting it
  proves: An unchanged entry of the payload carries item_id as null rather than omitting it.
  fails_when: an unchanged entry has no item_id property after serialization, for example when a null item_id is turned into undefined, or when it carries a value other than null.
- file: src/__tests__/unit/curation/entity-edit-action.spec.ts
  name: the payload of the curation action an edit records carries predecessor_id as null on a first-value entry rather than omitting it
  proves: A first-value entry of the payload carries predecessor_id as null rather than omitting it.
  fails_when: a first-value entry has no predecessor_id property after serialization, or carries a value other than null.
- file: src/__tests__/unit/curation/entity-edit-action.spec.ts
  name: recording the curation action of an edit returns the identity of the action it recorded
  proves: Recording the action returns the identity of the curation action it recorded.
  fails_when: recordEditAction returns the node id, the whole row, undefined, or any value other than the id the insert returned.
- file: src/__tests__/unit/curation/entity-edit-action.spec.ts
  name: recording the curation action of an edit records one action for one accepted edit however many changes it applied
  proves: 'UNDERDETERMINED, from the specification: rules/knowledge-base/entity-edit-records-curation-action says an accepted edit records one curation action, and no criterion limits the count.'
  fails_when: one call inserts the edit_entity action twice (or once per change) and returns the identity of one of them.
- file: src/__tests__/unit/curation/entity-edit-action.spec.ts
  name: recording the curation action of an edit records the edit_entity action on the edited node with the reason and every applied change
  proves: 'The whole fact of the rule: one curation action of kind edit_entity, target kind node, at the edited node, with the reason and a payload whose applied list holds one entry per change in the order given, effects with underscores, and null item_id and predecessor_id where the effect has none.'
  fails_when: any part of the rule stops holding, whether the kind, target kind, target id, reason, the applied entries, their order, their effect spelling or their nulls, or when more or fewer than one action is recorded.
  demonstrates: rules/knowledge-base/entity-edit-records-curation-action
not_applicable:
- edge_case: an edit with no applied changes (empty applied list)
  why: rules/knowledge-base/entity-edit-changes-something refuses an edit with no changes before any record is written, in another task. No criterion or implemented node says what this recorder does with an empty list, so a test would pin an unstated behavior.
- edge_case: absent or empty reason
  why: the reason's presence and length are decided at the validation boundary by rules/knowledge-base/entity-edit-reason-length, which this task does not implement. The recorder is handed a validated reason.
- edge_case: a change with an effect of removal, correction or addition
  why: 'the recorder does the same thing for these as for succession: it copies the values and applies the hyphen-to-underscore conversion. None contains a hyphen, so they fall in the class the succession and unchanged representatives already cover (SPEC-004 R6).'
- edge_case: the store failing or answering slowly during the insert
  why: no criterion or implemented node states what this recorder does when the insert fails. Failure answers belong to the contract's SYSTEM_* refusals, assembled by the task that runs the whole edit.
- edge_case: two edits against one node at once
  why: concurrency of edits is decided by the edit-conflict rules and the transaction of the task that runs the whole edit. This recorder is one insert on the caller's connection.
untested:
- 'rules/knowledge-base/a-curation-action-kind-is-written-with-underscores: the first clause (a recorded action''s kind is written edit_entity) is exercised by the kind test. The second clause, a listing of curation actions filtered by kind accepts and matches edit_entity, belongs to the list-curation-actions operation of contracts/knowledge-base/compliance-audit. No test decides the whole fact here, so no demonstrates is claimed. The task''s REMAINDER note and the implementation''s deferred entry name the separate task that owes it.'
- 'rules/knowledge-base/entity-edit-reason-trimmed: the node governs three places, the note''s content, the information fragment''s text and the curation action''s reason. This task reaches only the action''s reason, which the trimming test checks. A test of that alone would assert part of the fact as the whole (SPEC-004 R12), so no demonstrates is claimed. The note and fragment are owned by the note task.'
- 'domain/knowledge-base/curation-action, domain/knowledge-base/curation-action-kind, domain/knowledge-base/curation-target-kind, domain/knowledge-base/entity-edit, domain/knowledge-base/applied-change, domain/knowledge-base/edit-effect: structural declarations of attributes and enumerations, with no behavior of their own that a finite test decides whole. Each is exercised only in the part the criteria reach, namely edit_entity, node, the four applied-change fields, and first-value to first_value. No test claims the node.'
- 'contracts/knowledge-base/entity-editing: the contract is a REST surface (route, HTTP 200 body, a long list of refusals). This task implements only the recording of the action whose identity the answer carries, so no finite test over recordEditAction decides the contract''s fact. The route, refusals and response belong to the tasks that assemble the edit.'
- 'constraints/entity-edit-is-atomic (task ADVISORY, not implemented here): that the recorder runs on the caller''s connection inside the edit''s transaction is not asserted. Atomicity is proven by the task that runs the whole edit.'
- 'the note''s ADVISORY that the stored payload text has the same form as other action kinds: a real jsonb column is needed to decide it, and the fake client only checks that the payload reaches the insert as one JSON text that parses to an object. The Neon database is shared with another session and was not touched.'
- 'behavior inference: AppliedChange.item_id and predecessor_id are copied as handed and not recomputed from the effect. The task''s ADVISORY note and the implementation record this as a choice. The tests of criterion 8 show that values are copied, but no test pins a case where a handed value disagrees with the effect, because no node decides that.'
- 'the departure the implementation disclosed, edit_entity missing from CurationActionNameSchema, and the deferred call from the edit operation: both belong to other tasks and no criterion of this one reaches them.'
divergences:
- cites: TST-04
  file: src/__tests__/unit/curation/entity-edit-action.spec.ts
  departure: the file sits directly under src/__tests__/unit/curation/ and does not mirror the unit's service/ subdirectory (src/__tests__/unit/curation/service/).
  why: every sibling spec of the entity-edit helpers (entity-edit-removal.spec.ts, entity-edit-correction.spec.ts and the others) sits flat under unit/curation/. Putting one file in a service/ subtree would split the delivery across two layouts and make the sibling convention harder to find.
---
## What it is
Unit tests over a fake pg client show that recordEditAction writes one edit_entity action on the edited node, with the trimmed reason and the ordered applied entries, and returns its identity.

## Notes
None.
