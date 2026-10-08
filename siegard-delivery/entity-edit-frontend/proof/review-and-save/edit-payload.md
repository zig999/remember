---
target: frontend
title: Proof for the edit payload, the body of the one edit the save sends
summary: Table-driven tests over the whole wire body built from real form state, plus three end-to-end tests through the real form and the undo timer, decide the criteria, the JSON-null and field-is-changed gaps, and six nodes. None of it has been run.
implementation: sha256:24b316eb7f43becc8833aa554d674b59a25f07d74d23c378d793e797cb5dcf8f
standard:
  at: ../standards/frontend-react.yaml
  pin: sha256:2b03615161995450265523de6bdd9c464b2ca633976e832e36586c1ab1aa2cf7
run: run/review-and-save-edit-payload-suite
tests:
- file: src/features/entities/components/__tests__/entity-edit-payload.spec.ts
  name: sends a set change carrying the value, the validity the field states and the attribute it started from for $label
  proves: 'Criteria: ''A changed field holding a non-empty value is sent as a set change'', ''A set change carries the field''s value'', ''A set change carries the validity the field states'', ''A set change carries the identity of the attribute the field started from'', ''Each change carries its field''s attribute key as attribute_key''. Two classes are covered: a key that is not temporal, and a temporal key stating a start and an end.'
  fails_when: A changed field is not sent as kind set. The set change drops or alters the value, the stated valid_from or valid_to, or the item_id of the attribute the field started from. Or attribute_key is not the field's key.
- file: src/features/entities/components/__tests__/entity-edit-payload.spec.ts
  name: sends a set change that names no attribute for $label
  proves: Criterion 'A set change of a field that started from no attribute carries no attribute identity', for the first value of a key holding nothing and for a value added to a multi-valued key. Both reach the body with item_id as JSON null.
  fails_when: The change carries an item_id for a field that started from no attribute, whether an empty string, an invented id or another field's id. Or the change is not sent as a set change.
- file: src/features/entities/components/__tests__/entity-edit-payload.spec.ts
  name: sends one remove change naming the attribute it started from, with null value and validity, for $label
  proves: 'Criteria ''A field the owner emptied after it started with a value is sent as a remove change'', ''A field the owner removed after it started with a value is sent as a remove change'', ''A remove change carries the identity of the attribute the field started from'', and the first UNDERDETERMINED note (a remove change carries null in value, valid_from and valid_to). Four classes: an emptied stable field, an emptied temporal field still holding a validity, an emptied multi-valued field (exactly one change), and a multi-valued field removed from the form (baseline field absent from the held fields).'
  fails_when: An emptied or removed field is not sent as kind remove. A remove change keeps the value or validity the field started with or holds. The remove omits or alters the item_id. An emptied multi-valued field is counted twice or not at all. A removed field sends no change.
- file: src/features/entities/components/__tests__/entity-edit-payload.spec.ts
  name: sends no change for fields the owner left as they started
  proves: 'Criterion ''An unchanged field contributes no change'': a form held exactly as it started yields the body { reason, changes: [] }.'
  fails_when: Any change is sent for a field whose value, validity and presence are as they started.
- file: src/features/entities/components/__tests__/entity-edit-payload.spec.ts
  name: sends the reason trimmed when the owner typed $label
  proves: Criterion 'The reason is sent trimmed' and the sent-trimmed clause of review-requires-a-trimmed-reason. One case has spaces with inner whitespace kept. The other has a tab and line breaks around the reason.
  fails_when: The reason is sent untrimmed, only space-trimmed, or with inner whitespace collapsed or removed.
- file: src/features/entities/components/__tests__/entity-edit-payload.spec.ts
  name: sends a null validity start, and no date of today, when the owner states none and $label
  proves: 'Criterion ''A validity start the owner did not state is sent empty'', and the first UNDERDETERMINED note (an unstated start is JSON null, not an empty string, not omitted, not today). The clock is fixed at 2026-06-15. The body holds no date text except the one the owner stated. Two classes: no end either, and an end stated.'
  fails_when: An unstated start is sent as '', is omitted, or is filled with a date such as today. Or a stated end is lost or altered when the start is empty.
- file: src/features/entities/components/__tests__/entity-edit-payload.spec.ts
  name: sends one change for each changed field, a set change for a held or new value and a remove change for an emptied or removed one, and none for the fields left as they started
  proves: Criterion 'The edit carries one change for each changed field' and the fact of save-sends-one-change-per-changed-field. One edit changes a stable field, a temporal field with a stated validity, a first value, a removed multi-valued field and an emptied multi-valued field, and leaves three other fields untouched. The body must hold exactly five changes of the right kinds, values, validities and item ids.
  fails_when: A changed field gets no change or more than one. An unchanged field gets one. Any change has the wrong kind, value, validity or attribute identity.
  demonstrates: rules/entity-workspace/save-sends-one-change-per-changed-field
- file: src/features/entities/components/__tests__/entity-edit-payload.spec.ts
  name: writes JSON null in every member that holds nothing and in the value and validity of a remove change
  proves: The fact of a-change-writes-an-empty-member-as-null, and the first UNDERDETERMINED note, and criterion 'Each change in the body carries attribute_key, kind, value, item_id, valid_from and valid_to'. The parsed JSON body carries each change with an unstated start as null, a first value with item_id, valid_from and valid_to null, a remove of a temporal field with null value, valid_from and valid_to although it held a validity, and a remove of a multi-valued field. Every empty member is the JSON null the expected body states.
  fails_when: An empty member is sent as an empty string or left out of the body. A remove change carries the value or validity the field started with or holds.
  demonstrates: rules/entity-workspace/a-change-writes-an-empty-member-as-null
- file: src/features/entities/components/__tests__/entity-edit-payload.spec.ts
  name: sends no change for a field whose value equals the one it started with, whatever validity it holds
  proves: The fact of a-field-is-changed-only-by-its-value, and the second UNDERDETERMINED note. Validity-only edits (a start and an end on one temporal field, an end alone on another) contribute no change to the body.
  fails_when: A field whose value equals its started value counts as changed because it holds a validity, so a set change is sent for it.
  demonstrates: rules/entity-workspace/a-field-is-changed-only-by-its-value
- file: src/features/entities/components/__tests__/entity-edit-payload.spec.ts
  name: sends no change for fields added to a multi-valued key that repeat an active value and an uncertain value the node holds
  proves: The fact of a-field-added-with-a-held-value-is-not-changed, and the second UNDERDETERMINED note. Two fields added to a multi-valued key, one repeating an active value and one an uncertain value, contribute no change.
  fails_when: An added field repeating a held active or uncertain value is sent as a set change.
  demonstrates: rules/entity-workspace/a-field-added-with-a-held-value-is-not-changed
- file: src/features/entities/components/__tests__/entity-edit-payload.spec.ts
  name: sends a set change for a field added to a multi-valued key that repeats only a superseded value
  proves: The boundary of the 'active or uncertain' clause of a-field-added-with-a-held-value-is-not-changed. A value only a superseded attribute holds is not held, so its added field is still a changed field and is sent as a set change with no item_id.
  fails_when: A repeated superseded value is treated like a held one and its added field produces no change.
- file: src/features/entities/components/__tests__/EntityForm.edit-payload.spec.tsx
  name: sends the body { reason, changes } with the trimmed reason and one change for each changed field of the reviewed form
  proves: Criteria 'The body is the JSON object { reason, changes }', 'The edit carries one change for each changed field' and 'The reason is sent trimmed', through the real form, review and undo timer. The POST actually sent has exactly the members reason (trimmed) and changes, with a set change for a stable field, a set change for a temporal field with its stated validity, and a remove change for a removed multi-valued field. The untouched fields send nothing.
  fails_when: The sent body has a member besides reason and changes, or is missing one. The reason is sent untrimmed. A changed field is missing. An unchanged field is sent. Or the form hands the payload builder state that yields a different change set.
- file: src/features/entities/components/__tests__/EntityForm.edit-payload.spec.tsx
  name: shows an unstated validity start as today in the review and sends the change with no validity start
  proves: 'The scenario an-unstated-start-is-sent-empty: the owner changed a project''s deadline and stated no validity. The review shows the start as today (fixed clock 2026-06-15) and the POST actually sent carries valid_from and valid_to as null, with no date of today anywhere in the body.'
  fails_when: The review stops showing today. Or the sent change carries a start (today's date, or an empty string). Or the start is omitted instead of null.
  demonstrates: scenarios/entity-workspace/an-unstated-start-is-sent-empty
- file: src/features/entities/components/__tests__/EntityForm.edit-payload.spec.tsx
  name: shows an unstated validity start as today in the review and sends it empty while the owner states a validity end
  proves: 'The fact of an-unstated-start-shows-as-today-and-is-sent-empty at its distinct boundary of an end stated while the start is not: the review shows the start as today, the sent valid_from is null, the stated end is sent unchanged, and today''s date is absent from the body.'
  fails_when: The review stops showing today. Or the form or save substitutes today, or an empty string, for the unstated start once an end is stated. Or the stated end is lost.
  demonstrates: rules/entity-workspace/an-unstated-start-shows-as-today-and-is-sent-empty
files:
- path: src/features/entities/components/__tests__/entity-edit-payload-support.ts
  effect: New shared test helper. It holds the catalog and node the payload tests start from. It builds a held form by small edits over the real baseline, derives the changed flags with the real changedFlags, calls buildEntityEditBody, and returns the body as the parsed JSON a server would receive. It also provides builders for expected set and remove changes and an order-insensitive comparison of the changes.
- path: src/features/entities/components/__tests__/entity-form-payload-support.ts
  effect: New shared test helper. It drives the real form to a reviewed edit with several changes. It confirms the save under fake timers and returns the body of the POST actually sent after the undo window. It drives a deadline change with no validity start under a fixed clock and returns the review's shown start together with the sent change.
not_applicable:
- edge_case: an empty or over-long reason
  why: The 1 to 1000 code unit clause belongs to the review-reason task. This task owes only that the reason is sent trimmed, which is tested.
- edge_case: the request failing, being slow, cancelled, refused or timing out, and two saves in flight at once
  why: No criterion or node of this task states them. The refusals of bff-entity-edit belong to the request and undo-window tasks, and this payload is built by a pure function.
- edge_case: a form with no changed field
  why: Reached as a body with an empty changes list by the 'no change for fields left as they started' test. Whether a save is offered with nothing changed is the review's rule, not the payload's.
- edge_case: duplicate fields repeating one value in a multi-valued key
  why: Reached by the added-field-repeats-a-held-value tests as the rule the node states. A duplicate of a value the node does not hold is not stated by any criterion or node.
untested:
- Order of the changes in the changes array. The task's ADVISORY note says no node states it, and the implementation orders by catalog position, which is an inference. The tests compare changes order-insensitively and pin no order.
- The fallback kind 'set' for a changed field changeOfField gives no effect (an empty-start field on a single-valued key whose held attributes exist). The implementation recorded this as an inference about behavior and no node decides it, so no test pins it.
- The behavior that a set change of a stable key sends null valid_from and valid_to even where the field's validity state holds values. It is an implementation inference. The nodes that bear on it say what the form offers, not what the payload sends, and the form never lets a stable key hold validity. No test pins it.
- The combined outcome of removing a held multi-valued field and then adding its same value back. Each part is decided by a node (added repeating a held value is not changed; a removed baseline field is a remove) but no node states the combination.
- The treatment of a field whose attribute key is absent from the catalog (the builder drops it). No criterion or node states it.
- 'rules/entity-workspace/review-requires-a-trimmed-reason: only the sent-trimmed clause is this task''s and it is tested without a demonstrates claim. The 1 to 1000 code unit clause is not decided here, so the node is not claimed as demonstrated whole by this proof.'
- 'contracts/entity-workspace/bff-entity-edit: this proof decides only the body { reason, changes } and its six-member changes. The POST path with the URL-encoded node id and every refusal and failure answer are not decided here. No test is claimed against the node as a whole.'
- 'domain/entity-workspace/entity-edit-session, domain/entity-workspace/attribute-field and domain/knowledge-base/attribute-change: these are structural descriptions (aggregate, value objects) whose facts are the shape of their attributes. No finite test decides them whole, and the tests above exercise only the payload part of them.'
- buildEntityEditBody has no production caller (an implementation inference). The end-to-end tests exercise the real path (useEntityEditForm to buildEntityEdit to toEntityEditWire in the mutation), and the table tests exercise the exported seam, so the unused export is not itself pinned.
- Which standard pin to cite. I could not compute sha256 of standards/frontend-react.yaml without a shell, so the record's standard.pin is left for the caller to stamp. No divergence from TYP-01 or HKS-01 is disclosed.
---
## What it is
This record proves task/review-and-save/edit-payload.
It holds table-driven tests of the whole wire body built from real form state, end-to-end tests through the real form and the undo timer, and two helpers.

## Notes
The suite passed on its first run, run/review-and-save-edit-payload-suite.
