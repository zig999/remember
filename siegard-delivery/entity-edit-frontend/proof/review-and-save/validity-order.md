---
target: frontend
title: Proof for validity start precedes the end
summary: Through the real EntityForm, a start equal to or later than a stated end puts the exact message "O início deve ser anterior ao fim." on the validity end field and withholds the save, and a strictly earlier start, no end, or an unstated start with an end raises nothing and leaves the save offered.
implementation: sha256:fd826de2a19ad05318b32e4a5376ce832f0e3a89bb76800654e6844ac7d62089
standard:
  at: ../standards/frontend-react.yaml
  pin: sha256:2b03615161995450265523de6bdd9c464b2ca633976e832e36586c1ab1aa2cf7
run: run/review-and-save-validity-order-suite
tests:
- file: src/features/entities/components/__tests__/EntityForm.validity-order.spec.tsx
  name: puts the fixed message on the validity end field when the start is $label the end
  proves: 'Criterion 1, "A start that is not strictly earlier than the end shows a message on the validity end field", for both a start one day later than the end and a start equal to it, which is the boundary of "strictly earlier". It also proves UNDERDETERMINED note 1: the text on the end field (the role=alert element and the end input''s described-by) is exactly "O início deve ser anterior ao fim.". The test writes the expected text as a literal and does not import the implementation''s constant.'
  fails_when: An equal start is accepted (the comparison becomes <= instead of <), a later start raises no message, the message is shown on a field other than the end field, or the text on the end field is anything other than the exact contract text.
  demonstrates: rules/entity-workspace/validity-start-precedes-the-end
- file: src/features/entities/components/__tests__/EntityForm.validity-order.spec.tsx
  name: raises no message when the start is one day earlier than the end
  proves: Criterion 3, "A start strictly earlier than the end does not raise this message", at the boundary just inside the order.
  fails_when: A start strictly earlier than the end, even by one day, puts a message on the end field.
- file: src/features/entities/components/__tests__/EntityForm.validity-order.spec.tsx
  name: raises no message when no end is stated and there is $label
  proves: Criterion 4, "A field that states no validity end does not raise this message", for a stated start and for no start. These are the two classes of start when the end is empty.
  fails_when: A field with an empty end raises the message, whether its start is stated or left unstated.
- file: src/features/entities/components/__tests__/EntityForm.validity-order.spec.tsx
  name: raises no message for an end earlier than today when the start is left unstated
  proves: UNDERDETERMINED note 2, no message. The rule applies only when the owner gives both a start and an end. A field with an end and an unstated start, which is shown as today, is not compared. The clock is fixed at 2026-06-15 and the end is 2026-06-10, so today is later than the end.
  fails_when: An implementation compares the start shown as today with the end and shows the message on an end earlier than today when the start is unstated.
- file: src/features/entities/components/__tests__/EntityForm.validity-order.spec.tsx
  name: offers the save with a valid reason for an end earlier than today when the start is left unstated
  proves: UNDERDETERMINED note 2, save not withheld. A field with an end earlier than today and an unstated start does not withhold the save for order.
  fails_when: An unstated start shown as today is compared with the end and the save is withheld for order.
- file: src/features/entities/components/__tests__/EntityForm.validity-order.spec.tsx
  name: offers the save with a valid reason when the start is strictly earlier than the end
  proves: Criterion 3 for the save. A start strictly earlier than the end does not withhold the save.
  fails_when: A correctly ordered pair of dates withholds the save.
- file: src/features/entities/components/__tests__/EntityForm.validity-order.spec.tsx
  name: withholds the save despite a valid reason once the start becomes $label the end
  proves: Criterion 2, "A start that is not strictly earlier than the end withholds the save", for a later start and for an equal start. The test first shows the save offered with a valid reason for an ordered pair, then breaks the order and shows the save no longer offered.
  fails_when: The save stays offered with a valid reason once the start is later than or equal to the end, or the save was never offered for the ordered pair, so the withdrawal proves nothing.
- file: src/features/entities/components/__tests__/EntityForm.validity-order.spec.tsx
  name: offers the save again once a violated order is corrected
  proves: The save is withheld only while the order stands violated. After the start is corrected to an earlier date and the review is open with a valid reason, the save is offered again. The helper reopens the review only if the implementation closed it, so the test does not depend on whether it stayed open.
  fails_when: The save stays withheld after the order is corrected, because the violation is remembered and not recomputed from the live dates.
files:
- path: src/features/entities/components/__tests__/entity-form-order-support.ts
  effect: New helper shared by the validity-order spec. It reads the order message on the end field (the alert element and the end input's described-by). It types a change on the temporal key role and sets its start and end dates. It opens the review if closed and types a valid reason. It carries the literal contract text and a valid reason. It reuses the existing validity, review, reason and multi-valued support helpers.
not_applicable:
- edge_case: A changed field of a key that is not temporal raising the message
  why: Such a field offers no validity inputs, so the owner cannot give it a start and an end, and the form cannot produce an order violation there. A test would pass under any implementation and protect nothing, so none is written under SPEC-004 R5.
- edge_case: A start or end that is malformed or not a date
  why: The native date input yields a YYYY-MM-DD value or an empty one. No criterion or node states behavior for other input.
- edge_case: Two operations on one field at once, a failing dependency, a slow dependency
  why: The check is a synchronous derivation from the live form values. It calls no dependency and holds no shared state.
- edge_case: A pure-function table test of validityOrderMessage
  why: Equal, later, earlier, empty end and empty start are already decided through the real form. A second test over the same pairings would be the same evidence twice (SPEC-004 R5).
untested:
- The inference that the review stays offered and open while the order is violated, so that only the save is withheld. No node states it. The entity-screen contract's answer says "the message ... and no save" and names no state for the review, so no test pins it. The correction test is written to pass whether or not the review stays open.
- The inference that an unchanged field of a temporal key that still holds typed violating dates is not checked and does not withhold the save. No node decides the behavior of an unchanged field's validity, so it is recorded as unproven.
- The inference that an emptied (removed) field of a temporal key is checked like any changed field. No node states it.
- The inference that the end input's aria-invalid and aria-describedby carry the error, and that the review panel shows no order message. The rule says only that the message shows on the end field. The tests find it as the end field's described-by text and the role=alert element, and do not pin aria-invalid or the review panel's content.
- The node domain/entity-workspace/attribute-field. It declares the shape of one editable value (its key, item identity, starting value, current value and validity members). It states no behavior a finite test decides whole here, and this task reads only the validity members. Its order fact is demonstrated under the rule node.
- The node contracts/entity-workspace/entity-screen, whose other operations (listing, form, save-edit and their refusals) this task does not reach. Its show-review answer for this rule is exercised by the tests above, but a test exercising one refusal of a multi-operation contract is only a part of its fact. It is not claimed under demonstrates.
- Six-digit years that some browsers accept in date inputs and that compare wrongly under string ordering, which the implementation recorded as deferred. No node decides them.
---
## What it is
This record proves task/review-and-save/validity-order.
It holds one spec over the real EntityForm and one shared helper.

## Notes
The implementation record's `deferred` says that no test covers the order check and that existing specs are unaffected unless they type an equal or inverted pair. The existing specs that set both a start and an end (EntityForm.review-listing.spec.tsx) type 2026-03-01 with 2026-12-31, an ordered pair, so no existing test is expected to fail. I could not run the suite.
The tests call no hook and add no comments. They use relative imports and no msw. Date-only fake timers come from the existing fixClockAt and releaseClock helpers. The tests change no vitest or vite version. The `standard` pin and the `implementation` pin are for the caller to stamp.
The suite passed on its first run, run/review-and-save-validity-order-suite.
