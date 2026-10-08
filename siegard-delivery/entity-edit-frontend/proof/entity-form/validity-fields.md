---
target: frontend
title: Proof of the validity inputs of a changed field of a temporal key
summary: Tests that a changed field of a temporal key offers a start and an optional end, that a stable key and an unchanged field offer neither, that an unstated start shows as today's local date while the start input stays empty, and how the changed-field decision reads.
implementation: sha256:ee9960db45aad882ccb30409c52d33a54568bdefd6c5c8a86eede98d1ef9832e
standard:
  at: ../standards/frontend-react.yaml
  pin: sha256:2b03615161995450265523de6bdd9c464b2ca633976e832e36586c1ab1aa2cf7
run: run/entity-form-validity-fields-suite
tests:
- file: src/features/entities/components/__tests__/EntityForm.validity.spec.tsx
  name: offers a validity start and a validity end for a changed field of a temporal key and accepts the end left empty
  proves: Criteria "A changed field of a temporal key offers a validity start", "... offers a validity end" and "The validity end ... may be left empty". The catalog has a stable key first and the temporal key second, so the field's global index differs from its position in its own group. After the owner edits the temporal key's value both date inputs exist, the end is not required or marked invalid, and the form's value-type gate stays accepted with the end empty.
  fails_when: the start or the end input is not rendered for a changed field of an is_temporal key, including when the changed flag is indexed by position in the group instead of by field index; the end input is required or marked invalid when empty; or an empty end makes valueTypesAccepted false.
  demonstrates: rules/entity-workspace/a-changed-temporal-field-offers-its-validity
- file: src/features/entities/components/__tests__/EntityForm.validity.spec.tsx
  name: offers no validity start and no validity end for a changed field of a key that is not temporal
  proves: Criteria "A changed field of a key that is not temporal offers no validity start" and "... no validity end". The field really is changed, because the typed value is read back, so absence is not vacuous; neither marked input exists and the group holds no date input at all.
  fails_when: a changed field of a key whose is_temporal is false renders any date input, whether the start, the end or a differently marked one.
  demonstrates: rules/entity-workspace/a-changed-stable-field-offers-no-validity
- file: src/features/entities/components/__tests__/EntityForm.validity.spec.tsx
  name: offers no validity for an unchanged field of a temporal key while another field of the form is changed
  proves: The nodes and criteria say "changed field" and the task's ADVISORY says the inputs follow the form's changed-field decision; an unchanged temporal field beside a changed field of another key offers neither input.
  fails_when: the validity inputs of a temporal key appear because some other field changed, for example because changed is read at the wrong index or the form's overall dirtiness is used instead of the field's own change.
- file: src/features/entities/components/__tests__/EntityForm.validity.spec.tsx
  name: withdraws the validity of a temporal field when its value goes back to the value it started with
  proves: A field whose value equals the value it started with is not changed (the sibling rule a-field-is-changed-only-by-its-value, which the attribute-field node's record cites); the inputs appear while the temporal field is changed and are withdrawn once the value returns to its started value.
  fails_when: the inputs are tied to the field having once been touched or edited rather than to its value differing from the value it started with, so they stay after the owner reverts.
- file: src/features/entities/components/__tests__/EntityForm.validity.spec.tsx
  name: shows a validity start the owner has not stated as the calendar date of today
  proves: Criterion "A validity start the owner has not stated shows as today". With the clock fixed at 2026-06-15 midday local time the note under the start of a changed temporal field contains 2026-06-15.
  fails_when: an unstated start shows no today, shows a date other than the browser clock's date, or the note is not rendered for a changed temporal field.
- file: src/features/entities/components/__tests__/EntityForm.validity.spec.tsx
  name: keeps the validity start empty in the form while it shows as today, even after the owner states an end
  proves: 'UNDERDETERMINED entry 1: The clause that an unstated validity start is sent empty reaches no criterion here. Passes: a form that writes today''s date into valid_from when the owner leaves the start unstated and sends that date with the change. The form state is observed through the controlled start input, which holds the empty string both after the field becomes changed and after the owner types only an end date; the payload itself does not exist yet.'
  fails_when: the form writes today's date, or any date, into the start field's value when the field becomes changed or when the owner states only an end, so the start input is no longer empty.
- file: src/features/entities/components/__tests__/EntityForm.validity.spec.tsx
  name: stops showing today once the owner states a validity start and keeps the start the owner typed
  proves: 'The "unstated" qualifier of the last criterion: a start the owner has stated keeps its typed value and no longer shows as today, so the note belongs only to an unstated start.'
  fails_when: the today note stays after a start is typed, or the typed start is overwritten or lost.
- file: src/features/entities/components/__tests__/EntityForm.validity-local-date.spec.tsx
  name: shows today as the date in the owner's time zone at an hour when UTC is already on the next day
  proves: 'UNDERDETERMINED entry 2: No criterion fixes which calendar date today means, which the rule decided as the browser clock''s date in the owner''s local time zone. Passes: a form that formats the browser clock in UTC, which in the evening in Brazil shows tomorrow''s date. It also proves the rule an-unstated-start-shows-in-the-owners-local-date. The spec sets process.env.TZ to America/Sao_Paulo in beforeAll and restores it in afterAll; the instant is built from local components (2026-01-31 23:30) and falls on 2026-02-01 in UTC, so a UTC formatter is caught on any machine; a first assertion checks that the zone took effect; the note must show 2026-01-31 and not 2026-02-01.'
  fails_when: the shown today is formatted from the UTC date of the clock (toISOString, getUTC*) or any other zone than the browser's local one, so it reads 2026-02-01.
  demonstrates: rules/entity-workspace/an-unstated-start-shows-in-the-owners-local-date
- file: src/features/entities/components/__tests__/entity-field-changed.spec.ts
  name: reads a field as changed $expected when $label
  proves: 'The changed-field decision that the validity criteria''s "changed field" rests on, per row, following a-field-is-changed-only-by-its-value, a-field-added-with-a-held-value-is-not-changed and save-sends-one-change-per-changed-field: (1) a value equal to the started value is not changed even with validity typed; (2) a different value is changed; (3) a field emptied from a held value is changed; (4)-(5) an added field of a multi-valued key repeating an active or an uncertain held value is not changed; (6) the same repeating a superseded value is changed; (7) an added field with a value no attribute holds is changed; (8) a field started from an attribute and edited to another held value is changed, the boundary of added; (9) an added field of a single-valued key repeating the held value is changed, the boundary of multi-valued; reached through changedFlags, so the catalog''s allows_multiple lookup is part of what is checked.'
  fails_when: the changed flag counts validity in its decision, treats an emptied field as unchanged, exempts an added field repeating a superseded or other-status value, fails to exempt one repeating an active or uncertain value, applies the held-value exemption to a field that started from an attribute or to a key that allows one value, or reads allows_multiple from the wrong key.
files:
- path: src/features/entities/components/__tests__/entity-form-validity-support.ts
  effect: 'a helper shared by the validity specs: it builds a temporal catalog key and finds the start input, end input and today note of a key''s group by the implementation''s data-testids, lists the date inputs of a group, reports which validity inputs a key offers, sets a date input the way the browser does under act, and fixes or releases the clock with vitest fake timers on Date only; it reuses entity-form-support, entity-form-multi-support and the typeInto of entity-form-value-type-support.'
- path: src/features/entities/components/__tests__/entity-form-schema.multi-valued.spec.ts
  effect: 'existing spec adjusted minimally and no test added: its two exact-entry assertions, the entries of buildFormValues and the result of emptyField, now include the new members validFrom and validTo as empty strings, because the implementation added those members to every field entry; expected values and everything else are unchanged; entity-form-schema.spec.ts selects its members and did not need a change.'
not_applicable:
- edge_case: a start that comes after the end
  why: the task's rationale places start-before-end in the review epic, because the contract places its refusal on the review; this task's criteria require only that the end may stay empty.
- edge_case: a date the owner types that is not a valid calendar date
  why: the inputs are native date inputs that yield a valid date or an empty string; no criterion or implemented node states a refusal for validity members, so there is no behavior to prove.
- edge_case: an added field of a multi-valued temporal key, and the numbered "valor N" accessible names
  why: the criteria treat a changed field alike whatever the key's multiplicity; the two-key catalog already proves the offer is per field by global index, and multi-valued add and remove are proven by the existing multi-valued specs.
- edge_case: a disputed key, which has no field
  why: it has no field and so no validity inputs, which the earlier field-groups task owns; no criterion here reaches it.
- edge_case: empty and absent input (a node holding nothing of a temporal key, an empty end)
  why: the empty end is a stated criterion and is covered; a temporal key holding nothing starts as an empty added field, which is changed as soon as a value is typed, the same class as the changed field covered by the first test.
- edge_case: the clock crossing midnight while the form stays rendered
  why: no node asks for a live clock; the implementation records that the date is read at render time and that is not an obligation.
- edge_case: two operations against one subject at once
  why: local form state with one owner; no obligation of this task reaches concurrency.
untested:
- 'rules/entity-workspace/an-unstated-start-shows-as-today-and-is-sent-empty has no demonstrates: its fact has two halves, shows as today and is sent empty, and the second half belongs to the edit payload task; no payload exists to observe, so no finite test here decides the fact whole; shows-as-today is proven by the criterion test and the empty form state by the UNDERDETERMINED test, but neither is claimed for the node.'
- 'UNDERDETERMINED entry 1 is only half provable here: the test observes that the form state holds an empty start; whether the payload sends the start empty (JSON null, no today) cannot be observed until the edit payload task exists; the implementation record defers it to a-change-writes-an-empty-member-as-null and save-sends-one-change-per-changed-field.'
- 'domain/entity-workspace/attribute-field has no demonstrates: its fact is a value-object description (key, item, started-with value, value and validity) that nothing finite decides whole; the tests cover its validity members through the validity rules and its changed state through the sibling rules, but not the fact as a whole.'
- 'Inference not pinned: a field whose key is absent from the catalog counts as not changed; a behavior the implementation chose (its record says so) that no node decides, so the specification does not hold it and a test would make the suite its only home; it needs a home in the specification.'
- 'Inference not pinned: every field starts with validFrom and validTo empty, including a field started from an attribute that holds its own validity (the held validity is not copied); the earlier-task spec adjustment asserts empty members only for fields built from attributes with null validity; no node decides what a held validity starts as.'
- 'Inference not pinned: validity already typed stays in the field state, not cleared, when the field stops being changed and reappears if it changes again; the revert test deliberately types no validity, and no node states retention.'
- 'Inference not pinned: an emptied field of a temporal key offers validity inputs even though it sends a removal; the pure rows prove an emptied field is changed (a remove change is sent for it), but the offer on the screen for a removal is the record''s own deferred question to the specification.'
- 'Not pinned: the wording of the notes, labels, group names and aria-labels, the position of the note, and the choice to show today as helper text rather than a placeholder; the tests locate inputs by the implementation''s data-testids, as the existing helpers do, and never read wording; the displayed date''s YYYY-MM-DD form is the implementer''s and is asserted only as the form of the expected local date, since no node fixes a format.'
- 'Not asserted: toasts, and the review gate beyond data-value-types-accepted staying true with an empty end.'
---
## What it is
This record proves task/entity-form/validity-fields.
It holds two validity specs over the real EntityForm, one pure spec of the changed-field decision, one shared helper and one minimal adjustment of an existing spec.

## Notes
The suite passed on its first run, run/entity-form-validity-fields-suite.
