---
target: frontend
title: Proof for the review reason gate
summary: Through the real EntityForm, the proof pins that the open review holds a labelled reason field and offers the save only while the trimmed reason holds 1 to 1000 UTF-16 code units. It covers the empty, whitespace-only, BMP, astral and padded cases, and the dependence on the review being offered.
implementation: sha256:2126fdde2b1274a5ea67ae0475395a1f35d28bf2db0aecd7c194a90ce151a96b
standard:
  at: ../standards/frontend-react.yaml
  pin: sha256:2b03615161995450265523de6bdd9c464b2ca633976e832e36586c1ab1aa2cf7
run: run/review-and-save-review-reason-suite
tests:
- file: src/features/entities/components/__tests__/EntityForm.review-reason.spec.tsx
  name: entity form review holding a reason > holds a labelled text control for the reason in the open review
  proves: The review holds a field for the reason. A text control tied by a label's for/id sits inside the open review panel.
  fails_when: The open review renders no text control tied to a label, or renders it outside the review panel.
- file: src/features/entities/components/__tests__/EntityForm.review-reason.spec.tsx
  name: entity form review holding a reason > does not offer the save while no reason has been typed
  proves: The save is not offered while the trimmed reason holds no character, for the empty reason a fresh review starts with.
  fails_when: The save control is rendered in an open review whose reason is still empty.
- file: src/features/entities/components/__tests__/EntityForm.review-reason.spec.tsx
  name: entity form review holding a reason > does not offer the save for a reason of $label
  proves: '"The save is not offered while the trimmed reason holds no character" and "while the trimmed reason holds more than 1000 characters", plus the UNDERDETERMINED note (limit counted in UTF-16 code units).

    Six representatives:

    - spaces only

    - tabs only

    - newlines only

    - 1001 BMP characters

    - 1000 astral characters (2000 code units)

    - 1001 characters wrapped in whitespace padding, so the count is taken after trimming

    '
  fails_when: 'The save is offered for any of the six reasons. That happens if:

    - whitespace is not trimmed before the lower bound is checked

    - the upper bound is off by one

    - the length counts Unicode code points (the astral case then reads as 1000 and passes)

    - the length is counted before trimming (the padded case then also passes, but a different implementation could fail the other way)

    '
- file: src/features/entities/components/__tests__/EntityForm.review-reason.spec.tsx
  name: entity form review holding a reason > offers the save for a reason of $label
  proves: '"A trimmed reason of 1 to 1000 characters does not withhold the save", at both ends of the range, in both counting units and with padding.

    Four representatives:

    - exactly 1 character

    - exactly 1000 BMP characters

    - 500 astral characters (1000 code units)

    - 1000 characters padded so that the untrimmed text is longer than 1000

    '
  fails_when: 'The save is withheld for any of the four reasons. That happens if:

    - the lower bound is exclusive

    - the upper bound is exclusive

    - the length counts code points in a way that rejects the astral case, or counts bytes

    - the untrimmed length is checked against 1000

    '
- file: src/features/entities/components/__tests__/EntityForm.review-reason.spec.tsx
  name: entity form review holding a reason > offers the save only while the reason stands within the limits, withdrawing and offering it again as the reason changes
  proves: The gate follows the reason as it changes. The save is offered for a reason within the limits, withdrawn at 1001, offered again at 1000, and withdrawn when the reason is emptied to whitespace.
  fails_when: The save is decided once and kept, or only ever withdrawn or only ever offered, so a later edit of the reason does not change whether it is offered.
- file: src/features/entities/components/__tests__/EntityForm.review-reason.spec.tsx
  name: entity form review holding a reason > offers no save and no reason field once the changed field returns to its starting value, whatever reason was typed
  proves: The gate needs the review itself offered. A valid reason typed in an open review does not keep the review or the save once no field is changed.
  fails_when: A typed, valid reason keeps the review panel, the reason field or the save control alive after the last changed field has been returned to the value it started with.
files:
- path: src/features/entities/components/__tests__/entity-form-reason-support.ts
  effect: New helper shared by the reason specs. It finds the review's reason control through a label's for/id inside the open panel, so it pins no label wording. It types into that control through the native value setter and an input event, and reports whether the data-testid entity-review-confirm control is rendered.
not_applicable:
- edge_case: A reason of exactly 1001 code units at the boundary together with 1000 as a pair, for each counting unit
  why: BMP gives 1000 against 1001 directly, and astral gives 1000 code points (2000 units) against 500 code points (1000 units). Together these decide whether the unit is code units, so a third pair adds nothing.
- edge_case: Absent reason (undefined or null)
  why: The reason is local string state that starts as the empty string. The absent case is the empty case, already covered.
- edge_case: Two operations against one subject at once, or a dependency that fails or answers slowly
  why: The gate is synchronous local state over a string. No dependency is reached and no criterion or node states concurrent behavior.
- edge_case: A duplicate where uniqueness is claimed
  why: No criterion or node claims uniqueness of the reason.
- edge_case: A review offered but closed (the "Revisar alterações" button only), with a reason typed
  why: There is no reason field to type into, and the save is rendered only inside the open panel. That is arrangement of the control, not a stated behavior. The revert test covers the review not being offered.
untested:
- 'rules/entity-workspace/review-requires-a-trimmed-reason, whole. Its fact has two clauses: require a reason of 1 to 1000 UTF-16 code units once trimmed, and send it trimmed. The first clause is decided through the form by the tests above. The second belongs to the edit-payload task (the REMAINDER note), and nothing is sent in this task. A test over the first clause alone would assert part of the fact as the whole, so no test carries `demonstrates` for this node.'
- domain/entity-workspace/entity-edit-session. It declares six operations (open-entity, change-field, review-changes, confirm-save, undo-save, discard-changes) and the members node_id, fields, reason, reviewing and undo_deadline. This task reaches only the reason member and the gate over it. No finite test over this task decides the aggregate whole, and the tests assert only the reason member's effect on the save. No `demonstrates`.
- contracts/entity-workspace/entity-screen. It states four operations with many refusals. This task reaches only the show-review answer's field for the reason and its refusal for review-requires-a-trimmed-reason. The other refusals and the save-edit operation belong to other tasks. No `demonstrates`.
- 'The ADVISORY: the contract words no message for the over-length case, and none must be invented. No node states that no message appears, so the absence of a message is not asserted and nothing is pinned about the over-length cue (the aria-invalid mark and the destructive border).'
- 'Inference: the reason is kept across closing the review, across its auto-closing and across reopening, and is emptied only by clearReason. This is behavior no node decides, so it is recorded as unproven and not pinned. The clearing itself belongs to the later undo-window, reload and conflict tasks.'
- 'Inference: trimming is String.prototype.trim. The rule defines no whitespace set, so a reason of non-ASCII whitespace only (for example a no-break space) is left unproven. The tests use space, tab and newline.'
- 'Inference: the ''Salvar'' wording and primary variant, the ''Motivo'' label wording, and ''Salvar'' rendering with no onConfirm wired (a click does nothing). These are arrangement or behavior no node states, so none is pinned. The tests find the save by data-testid and the field by a label''s for/id.'
- The onConfirm wiring and everything after the click (confirm-save, the five-second undo, the payload). These belong to the undo-window and edit-payload tasks.
- The pure functions in entity-review-reason.ts (trimmedReason, isReasonAccepted, isReasonTooLong, REASON_MAX_CODE_UNITS) get no table test of their own. Every boundary they decide is already failed over through the real EntityForm, so a table over them would be the same evidence twice (SPEC-004 R5).
- The notes said no toast assertions, so none were written.
---
## What it is
This record proves task/review-and-save/review-reason.
It holds one spec over the real EntityForm and one shared helper.

## Notes
The suite passed on its first run, run/review-and-save-review-reason-suite.
