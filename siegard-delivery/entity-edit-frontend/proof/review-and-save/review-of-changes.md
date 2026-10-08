---
target: frontend
title: Proof of the review of changed fields on the entity form
summary: Through the real EntityForm, tests show when the review is offered, which fields it lists once with their started and new values and validity, and that an unstated start shows as today in the owner's local date.
implementation: sha256:bcfcb97ade33e10806cbe6aa9323e9fbdb7d4eb6b01278f27ceb0caf64dbe9b9
standard:
  at: ../standards/frontend-react.yaml
  pin: sha256:2b03615161995450265523de6bdd9c464b2ca633976e832e36586c1ab1aa2cf7
run: run/review-and-save-review-of-changes-suite
tests:
- file: src/features/entities/components/__tests__/EntityForm.review-offered.spec.tsx
  name: offers the review only while a field differs from the value it started with
  proves: 'Criterion 1, "The form does not offer the review while every field holds the value it started with", at open and after a changed field returns to its start. Criterion 2, "While a field''s value differs from the value it started with, the review is not withheld for want of a changed field". The node rule: no review while no field differs.'
  fails_when: The review is offered at open, is still offered after the changed field is typed back to its started value, or is withheld while a field differs.
  demonstrates: rules/entity-workspace/review-needs-a-changed-field
- file: src/features/entities/components/__tests__/EntityForm.review-offered.spec.tsx
  name: offers no review while a value its key's type refuses stands, even though another field is changed, and offers it again once the value is fixed
  proves: 'entity-screen show-review refusal "no review is offered while the value stands". The gate is the whole form: another field is validly changed while one number field holds "1,5".'
  fails_when: The review is offered while a refused value stands because some other field is changed. Also fails if the gate latches and does not offer the review once the value is fixed.
- file: src/features/entities/components/__tests__/EntityForm.review-offered.spec.tsx
  name: does not offer the review for an added field whose value an active attribute holds or an uncertain attribute holds, and offers it for an added field with a value nothing holds
  proves: 'UNDERDETERMINED note 1: an added field of a multi-valued key whose value an active or an uncertain attribute already holds is not a changed field, so it does not make the review offered. The unheld-value step is a control, so the test is not satisfied by a review that is never offered.'
  fails_when: An added field repeating an active value, or one repeating an uncertain value, counts as a changed field and the review is offered. Also fails if an added field with a value nothing holds does not offer the review.
  demonstrates: rules/entity-workspace/a-field-added-with-a-held-value-is-not-changed
- file: src/features/entities/components/__tests__/EntityForm.review-offered.spec.tsx
  name: does not list an added field that repeats an active or an uncertain value while another field is changed
  proves: 'UNDERDETERMINED note 1, the review-listing side: the wrong pass is a review that lists such an added field with an empty previous value. With another field changed, the review lists only that field.'
  fails_when: The review lists an added field that repeats an active or uncertain value, with an empty previous value or any other.
- file: src/features/entities/components/__tests__/EntityForm.review-offered.spec.tsx
  name: lists an added field whose value only a superseded attribute holds
  proves: 'The boundary of the held-value rule: only an active or uncertain attribute exempts an added field. A value held only by a superseded attribute differs from the empty start, so criterion 2 applies and the review lists it.'
  fails_when: The exemption also covers superseded values, so the added field is not offered or listed.
- file: src/features/entities/components/__tests__/EntityForm.review-offered.spec.tsx
  name: lists a field that started with a value when the owner retypes it to a value another field of the key holds
  proves: 'The boundary of the held-value rule: it exempts an added field, not an existing one. A field that started with a value and now differs is a changed field (criterion 2), with its started value beside the new one, even when the new value is held by another field.'
  fails_when: Any field whose new value matches a held value is exempted, not only a field the owner added.
- file: src/features/entities/components/__tests__/EntityForm.review-listing.spec.tsx
  name: lists each changed field once with the value it started with beside the value it now holds
  proves: Criterion 3, "The review lists each changed field once", and criterion 6, "Each listed field shows the value it started with beside the value it now holds". A field edited twice appears once. Two changed fields of one multi-valued key appear as two entries, each with its own started and new value.
  fails_when: A changed field is listed twice or not at all, two fields of one key are merged into one entry, or an entry shows a started or new value other than the field's own.
  demonstrates: rules/entity-workspace/review-lists-each-changed-field-once
- file: src/features/entities/components/__tests__/EntityForm.review-listing.spec.tsx
  name: does not list a field that holds the value it started with, whether the owner never touched it or returned it to that value
  proves: Criterion 4, "The review does not list a field whose value equals the value it started with". The classes are a field never touched and a field typed away and back.
  fails_when: A field is listed because it was touched, or because it is a temporal key's field typed away and back, though its value equals its started value.
- file: src/features/entities/components/__tests__/EntityForm.review-listing.spec.tsx
  name: does not list a field of a temporal key whose value is the value it started with while the validity it holds differs from the validity it started with
  proves: 'Criterion 5, which excludes a field whose value equals its started value even when its validity differs from the validity it started with. The node rule: a field is changed only by its value, whatever validity it holds.'
  fails_when: A field whose value equals its started value is listed because a validity start or end is held on it.
  demonstrates: rules/entity-workspace/a-field-is-changed-only-by-its-value
- file: src/features/entities/components/__tests__/EntityForm.review-listing.spec.tsx
  name: shows the validity start the field holds
  proves: Criterion 7, "Each listed field of a temporal key shows the validity start it holds".
  fails_when: A listed temporal field does not show the validity start the owner typed, or shows another date.
- file: src/features/entities/components/__tests__/EntityForm.review-listing.spec.tsx
  name: shows the validity end the field holds
  proves: Criterion 8, "Each listed field of a temporal key that holds a validity end shows that validity end". The start is left unstated, so the end is shown on its own.
  fails_when: A listed temporal field that holds a validity end does not show it, for example because the end is shown only when the start is stated.
- file: src/features/entities/components/__tests__/EntityForm.review-listing.spec.tsx
  name: shows a validity start the owner has not stated as the calendar date of today
  proves: Criterion 9, "A validity start the owner has not stated shows as today in the review".
  fails_when: A listed temporal field with no stated start shows no date, an empty value, or a date other than the clock's calendar date.
- file: src/features/entities/components/__tests__/EntityForm.review-local-date.spec.tsx
  name: shows today in the review as the date in the owner's time zone at an hour when UTC is already on the next day
  proves: UNDERDETERMINED note 2, and the node rule that today is the browser clock's calendar date in the owner's local zone. At 2026-01-31 23:30 in America/Sao_Paulo, which is 2026-02-01 in UTC, the review shows 2026-01-31 and not 2026-02-01.
  fails_when: The review formats today from the UTC calendar date, or from any source other than the local calendar date of the browser clock.
  demonstrates: rules/entity-workspace/an-unstated-start-shows-in-the-owners-local-date
files:
- path: src/features/entities/components/__tests__/entity-form-review-support.ts
  effect: New helper shared by the three review specs. It reads whether the review is offered and opens it. It reads each listed field's key, previous value, new value, validity start and validity end from the panel, sorted by key and then previous value so no ordering is pinned. It locates elements by the implementation's data-testids and asserts nothing itself.
not_applicable:
- edge_case: A node that holds no attribute, or a key that started empty
  why: Every field holds its started value, which is the class criterion 1 already covers. The obligations treat empty and non-empty starts alike, so a second representative would repeat that evidence.
- edge_case: Two added fields of one key typed with the same unheld value
  why: No criterion or node decides whether duplicates collapse, and "each changed field once" counts fields. A test would pin a behavior nothing states.
- edge_case: Absent or malformed input to the review
  why: The review takes no input. It reads form state, and a refused value type withholds the review (tested).
- edge_case: A failing or slow dependency, or two operations at once
  why: The review is a local view of form state with no dependency, and no node states behavior under concurrency.
- edge_case: A boundary at each end of a stated range
  why: None of the criteria or nodes states a numeric or date range for the review. Validity order belongs to the validity-order task.
untested:
- Removal of a field from a multi-valued key. The implementation lists such a field (started value, empty new value, no validity) and offers the review when the removal is the only change. None of this task's criteria or nodes states it. It is an inference about behavior, not pinned, so no node holds the fact yet.
- 'Wording and placement of the review: the button and panel labels, the empty-value text, the "Início não informado: hoje." note, the entry order, the layout of previous beside new, and the data-testids the helper reads. No node states them.'
- How a started or new value that is empty is displayed. Criterion 6 shows the value the field started with, but the empty case needs the implementation's wording to assert. The listing tests assert previous and new text only where both are non-empty.
- Whether a listed field of a non-temporal key shows no validity, and whether a field emptied but still in the form shows validity. The criteria say what a temporal key's field shows, not what anything else shows.
- 'Inferences about the review''s behavior: it is a live view that stays open while the owner edits, it closes itself and does not reopen when it stops being offered, and focus moves to the panel and back to the button. No node states them, and no test pins them.'
- The criterion 5 test reaches "equal value, different validity" only if the form keeps the typed validity after the value returns to its start, since validity inputs show only while the field is changed. No node says whether the form keeps it. If it clears it, the test still passes, but it then proves less than the criterion states. It is the only route through the real form, and no unit-level test of the entry function was written because that would pin the arrangement.
- 'contracts/entity-workspace/entity-screen: the review''s effect, reason field, trimmed-reason and start-before-end refusals, show-entity-list and save-edit belong to other tasks. The task reaches only part of show-review (the changed-field listing, the no-changed-field refusal and the value-type refusal), so no test claims the contract whole.'
- 'domain/entity-workspace/entity-edit-session: it spans operations (confirm-save, undo-save, discard-changes), reason and undo_deadline that this task does not reach, so no finite test decides its fact. Only `reviewing` and review-changes are exercised, through the tests above.'
- 'domain/entity-workspace/attribute-field: its shape (key, item id, started value, value, validity) is read across form, review and save, with no finite test over the shape. It is exercised through the tests above and claimed by none.'
- 'rules/entity-workspace/an-unstated-start-shows-as-today-and-is-sent-empty: the "shows as today" half is tested in the review-listing spec. The "sent empty" half belongs to the edit-payload task, so no test here decides the fact whole and none claims the node.'
- The REMAINDER and ADVISORY notes (the sent-empty clause, the review's effects, reason and refusals) name no implementation to exclude and belong to other tasks. No test was invented.
- The displayed today is not refreshed across midnight without a re-render, and no node asks for a live clock.
---
## What it is
Three spec files and one helper. The offered spec holds six tests: the offered gate, the value-type refusal, the held-value exemption for active and uncertain values, its not-listed side, a superseded-value boundary and an existing-field boundary. The listing spec holds six tests: once with started beside new, unchanged and returned fields not listed, validity not deciding listing, start shown, end shown and an unstated start shown as today. The local-date spec holds one test, which sets the owner's zone and fixes the clock at 2026-01-31 23:30 local.

## Notes
Nothing was run. The review is located by the implementation's data-testids (entity-review-button, entity-review, entity-review-item-{key} and its previous, new, valid-from and valid-to children), and no wording is asserted. The existing specs find buttons and inputs only inside a field group or by `input`, and the review has no input, so none of them should be invalidated and none was edited. The local-date spec sets TZ in beforeAll and restores it in afterAll, as EntityForm.validity-local-date.spec.tsx does. No toast is asserted.
