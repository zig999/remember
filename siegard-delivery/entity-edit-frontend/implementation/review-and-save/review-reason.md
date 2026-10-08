---
target: frontend
title: Review reason gate
summary: The open review holds a labelled reason field, and offers "Salvar" only while the trimmed reason holds 1 to 1000 UTF-16 code units.
task: sha256:2a032d7c5a085216578a0c8797912d3f66310eb289214cd274749bd2337d5983
standard:
  at: ../standards/frontend-react.yaml
  pin: sha256:2b03615161995450265523de6bdd9c464b2ca633976e832e36586c1ab1aa2cf7
run: run/review-and-save-review-reason-build
files:
- path: src/features/entities/components/entity-review-reason.ts
  effect: New. It exports REASON_MAX_CODE_UNITS (1000), trimmedReason (String.prototype.trim), isReasonTooLong and isReasonAccepted. Both predicates count the trimmed string with .length, which is UTF-16 code units. They never spread, never use Array.from and never use Intl.Segmenter. isReasonAccepted is true exactly when the trimmed length is from 1 to 1000. The later payload task can reuse trimmedReason to send the reason trimmed.
- path: src/features/entities/components/use-entity-review.ts
  effect: Modified. The hook now holds the session's reason as local state beside the reviewing flag. EntityReviewState gains reason, setReason, clearReason, reasonTooLong and saveOffered. saveOffered is `open && isReasonAccepted(reason)`, and open already means offered, which means value types accepted and at least one entry. The reason is kept when the review closes or stops being offered, and it is emptied only by clearReason. The parameters, entries, offered, open, openReview and closeReview behave as before.
- path: src/features/entities/components/entity-review.tsx
  effect: 'Modified. The open review panel now holds a "Motivo" field: a ui-kit Label tied by htmlFor/id to a controlled Textarea (data-testid entity-review-reason, aria-required, aria-invalid only while the trimmed reason is over the limit). A "Salvar" button (data-testid entity-review-confirm, type=button, onClick = the optional onConfirm prop) is rendered only while review.saveOffered. A click with no onConfirm does nothing. "Voltar à edição" now sits in the same button row. EntityReviewProps gains an optional onConfirm. The button, effects, validity display, ''Sem valor'' and focus handling are unchanged.'
criteria:
- criterion: The review holds a field for the reason.
  met: true
  how: entity-review.tsx renders a Label "Motivo" and a Textarea (id entity-review-reason) inside the open review panel, bound to review.reason and review.setReason. It follows CorrectionForm's Label, Textarea and aria-invalid pattern.
- criterion: The save is not offered while the trimmed reason holds no character.
  met: true
  how: isReasonAccepted requires trimmed length >= 1, so saveOffered in use-entity-review.ts is false for an empty or all-whitespace reason. EntityReview then renders no "Salvar" button (data-testid entity-review-confirm is absent).
- criterion: The save is not offered while the trimmed reason holds more than 1000 characters.
  met: true
  how: isReasonAccepted requires trimmed `.length` <= 1000 code units, so 1001 units gives saveOffered false and no "Salvar" button. This answers the UNDERDETERMINED note. 1000 code points outside the BMP are 2000 units and withhold the save, because the count is .length and never code points.
- criterion: A trimmed reason of 1 to 1000 characters does not withhold the save.
  met: true
  how: With a trimmed length from 1 to 1000 code units, the open review (value types accepted, at least one changed field) has saveOffered true and EntityReview renders the "Salvar" button. A reason of exactly 1 or exactly 1000 units is accepted.
nodes:
- node: rules/entity-workspace/review-requires-a-trimmed-reason
  encoded_at:
  - src/features/entities/components/entity-review-reason.ts
  - src/features/entities/components/use-entity-review.ts
  - src/features/entities/components/entity-review.tsx
  how: The 1 to 1000 UTF-16 code unit gate over the trimmed reason lives in entity-review-reason.ts. It is applied through saveOffered in use-entity-review.ts and shown by the conditional "Salvar" button in entity-review.tsx. The "MUST send it trimmed" clause is the edit-payload task's, per the REMAINDER note. trimmedReason is exported for it and nothing is sent here.
- node: domain/entity-workspace/entity-edit-session
  encoded_at:
  - src/features/entities/components/use-entity-review.ts
  how: The session's `reason` member is the useState value in useEntityReview, beside `reviewing`. It is read as review.reason, which useEntityEditForm already returns as `review`. It is written by review.setReason and cleared by review.clearReason. undo_deadline, confirm-save, undo-save and discard-changes are not reached.
- node: contracts/entity-workspace/entity-screen
  encoded_at:
  - src/features/entities/components/entity-review.tsx
  - src/features/entities/components/use-entity-review.ts
  how: 'The show-review answer now includes the field for the reason. The refusal for review-requires-a-trimmed-reason is answered as the contract words it: the save is not offered until the reason holds a character. The contract words no message text, so none is shown. The validity-order refusal, the save-edit operation and its refusals are not reached.'
inferences:
- inferred: The reason lives in the review state (useState in useEntityReview), not in the React Hook Form values. The schema (entityFormSchema, buildEntityFormSchema), buildFormValues and the `fields` entries are untouched.
  from: The session holds `reviewing` in the same hook, and the reason is edited only inside the review. A `reason` member in the Zod schema would also change valueTypesAccepted (schema.safeParse({ fields })) and the values shape that the existing schema and form specs build. The later tasks read review.reason and call clearReason.
- inferred: '"Trimmed" is String.prototype.trim, and the length checked is the trimmed string''s .length.'
  from: The rule says "once trimmed" and "UTF-16 code units", which is what .length counts. It defines no other whitespace set. The rule's log ties the unit to entity-edit-reason-length.
- inferred: The reason is kept across closing the review ("Voltar à edição"), across the review auto-closing and across reopening it. It is emptied only by clearReason.
  from: The session holds one reason for the whole sitting, with no snapshot member. The conflict-keeps-the-typed-values and reload-after-save tasks need to keep it or clear it deliberately.
- inferred: The save control is labelled "Salvar", in the primary variant, inside the review panel beside "Voltar à edição".
  from: 'No node words the control: the contract names the operation save-edit and the session names confirm-save. The task suggested "Salvar". The delivered review uses short pt-BR verbs.'
- inferred: The field's label is "Motivo", with no placeholder and no visible hint. It is marked aria-required, and aria-invalid is set only while the trimmed reason is over 1000 units.
  from: The CorrectionForm pattern uses the label "Motivo" and aria-invalid. The contract words no message for either side of the limit, and the ADVISORY forbids inventing one for the over-length case, so the over-length state is only non-textual. aria-invalid:border-destructive in the ui-kit Textarea gives the visual cue.
- inferred: No message is shown for the empty side either. The save simply is not offered. The task allowed a message for the empty side only if the contract worded it, and the contract's refusal answer is a statement about the save, not a message text.
  from: 'contracts/entity-workspace/entity-screen show-review refusal for review-requires-a-trimmed-reason: "the save is not offered until the reason holds a character".'
- inferred: '"Salvar" renders whenever saveOffered holds, even when no onConfirm is supplied. In that case the click does nothing. EntityForm passes no handler yet.'
  from: The task asks for the gate and the control position now, with the save action belonging to the undo-window task. Existing specs mount EntityForm, which is where the gate can be observed.
preserved:
- The review is offered only while a field is changed and every value reads as its key's type. "Revisar alterações", the Panel "Revisão das alterações", the reviewing flag, the auto-close and the focus move to the panel and back to the button are unchanged.
- Each entry shows 'Valor anterior', 'Novo valor', 'Efeito', the validity start with the unstated-start-as-today note, the validity end and 'Sem valor'. Which fields are listed, their order, the removed entries and the item keys are unchanged.
- The "Voltar à edição" control and its data-testid entity-review-close are kept. They now sit in a button row with the optional "Salvar".
- entityFormSchema, buildEntityFormSchema, buildFormValues, zodIssueResolver (still the form's resolver), valueTypesAccepted and the changed flags are unchanged. use-entity-edit-form.ts and EntityForm.tsx are untouched. useEntityEditForm still returns form, valueTypesAccepted, changed and review.
- Field groups, multi-valued add and remove, closed choices, validity inputs, disputed keys and outside-catalog values are untouched.
- backend/, vendor/, package.json, src/lib/http.ts, src/lib/query-client.ts and src/lib/error-routing.ts are untouched. No dependency was added, no forwardRef, no GlassSurface, no sibling-feature import, no header entry or graph button, and no comment written. Styling uses semantic tokens only.
deferred:
- what: 'The save action itself. The undo-window task must pass `onConfirm` to <EntityReview> in EntityForm.tsx. That handler runs confirm-save: build the payload, send it after the five-second undo window and clear the typed state through review.clearReason. It reads the reason as trimmedReason(review.reason) from entity-review-reason.ts. It must also re-check review.saveOffered before sending.'
  why: The task's objective is the gate and the control position. confirm-save and the 5 s undo are the undo-window task's.
- what: Sending the reason trimmed in the edit payload, and keeping the reason across a conflict or refusal. A successful save reload must call review.clearReason.
  why: REMAINDER note, and the sibling tasks edit-payload, reload-after-save and conflict-keeps-typed-values.
- what: The reason is not cleared when the owner discards changes or when the node reloads. Nothing clears it yet, so a typed reason survives until a later task calls clearReason.
  why: Discard-changes and reload belong to later tasks. The hook exposes clearReason for them.
- what: An over-length reason shows only aria-invalid and the destructive border, with no text. That is a thin cue for WCAG 3.3.1 (error identification) and visible only through the missing "Salvar" button.
  why: The ADVISORY forbids inventing an over-length message, and the contract words none. A message needs the specification extended first.
- what: 'Tests: none cover the reason field or the gate. The existing review specs that mount EntityForm are unaffected because the reason starts empty and "Salvar" is absent.'
  why: Writing tests is another judge's role.
---
## What it is
Adds the reason gate to the entity review. entity-review-reason.ts holds the pure 1 to 1000 UTF-16 code unit check over the trimmed reason. useEntityReview holds the reason in the session state and exposes saveOffered. EntityReview renders a "Motivo" textarea in the open panel and a "Salvar" button only while the save is offered. Nothing was run, built or tested.

## Notes
The UNDERDETERMINED note is honored by counting .length of the trimmed string. The REMAINDER note is left to the edit-payload task, and the ADVISORY is honored by showing no over-length message. The record carries no task pin, run or standard at/pin, since the caller stamps them. No file under backend/ or vendor/ was touched.
