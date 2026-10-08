---
target: frontend
title: Undo window before the edit is sent
summary: Confirming the review shows the notice "Edição registrada." with the undo "Desfazer". The edit is sent once, only after five seconds without an undo, and an undo sends nothing and leaves the form, the reason and the review as they were.
task: sha256:442cc2741378a77e58bf1e22c4585c469f81c759839f2f703ecef8231ddccb4d
standard:
  at: ../standards/frontend-react.yaml
  pin: sha256:2b03615161995450265523de6bdd9c464b2ca633976e832e36586c1ab1aa2cf7
run: run/review-and-save-undo-window-build
files:
- path: src/features/entities/components/use-undoable-save.ts
  effect: New. It exports useUndoableSave, UNDO_WINDOW_MS (5000), RECORDED_NOTICE ("Edição registrada.") and UNDO_ACTION_LABEL ("Desfazer"). confirm() returns at once if a window or a send is already running, or if review.saveOffered is false. Otherwise it snapshots the edit through the buildEdit callback and starts a setTimeout of UNDO_WINDOW_MS. It also shows a sonner toast with id, duration 5000 and an action labelled Desfazer. The undo action clears the timer and releases the guard, and touches nothing else, so no send happens and the form, the reason and the review keep their state. When the timer fires it dismisses the toast and sends the snapshot through useEditEntity().mutateAsync, exactly once. The typed outcome (accepted, conflict, refused or unreachable) is stored in state and returned as outcome. An accepted outcome also calls review.clearReason. An unexpected throw is left to the global MutationCache handler and clears the outcome. The guard is released when the send settles.
- path: src/features/entities/components/entity-edit-payload.ts
  effect: New. buildEntityEdit(reason, held, changed, baseline, attributeKeys, attributes) is a pure function returning an EntityEdit. The reason is trimmedReason(reason). There is one AttributeChange per changed field (changed flags) plus one per removed baseline field (removedFieldsOf). Kind and itemId come from changeOfField. A remove change carries null value, validFrom and validTo. A set change carries the field's value, and its validity only for a temporal key. Every empty member is written as null, so an unstated start is sent empty. Changes are ordered by catalog key position, like the review.
- path: src/features/entities/components/entity-review-entries.ts
  effect: Modified. The removed-field rule (a baseline field that started with a value and whose item no held field keeps) is extracted into the exported removedFieldsOf. reviewEntriesOf now calls it, so review and payload share one rule. The entries it returns are unchanged.
- path: src/features/entities/components/use-entity-edit-form.ts
  effect: Modified. It now calls useUndoableSave with the node id, the review state and a closure over buildEntityEdit. The closure reads review.reason, the held values, the changed flags, the baseline values, the catalog keys and the node's attributes. The hook returns the new member save, and its other members are unchanged.
- path: src/features/entities/components/EntityForm.tsx
  effect: Modified. It reads save from useEntityEditForm and passes save.confirm as onConfirm to EntityReview, so the Salvar control now runs the delayed send.
criteria:
- criterion: Confirming the review shows a notice that the edit is recorded.
  met: true
  how: useUndoableSave.confirm calls toast(RECORDED_NOTICE, ...) with the text "Edição registrada." taken verbatim from the wording rule. EntityForm wires it to the Salvar control through onConfirm.
- criterion: The notice offers an undo.
  met: true
  how: 'The same toast carries the sonner action { label: UNDO_ACTION_LABEL ("Desfazer"), onClick }. The onClick clears the timer.'
- criterion: The undo is offered for five seconds.
  met: true
  how: The toast has duration UNDO_WINDOW_MS (5000), and the send timer has the same length. The toast is also dismissed when the timer fires, so a toast kept open by hover cannot offer an undo after the send.
- criterion: No edit is sent before five seconds have passed.
  met: true
  how: mutateAsync is called only inside the setTimeout callback of UNDO_WINDOW_MS. confirm() sends nothing itself, and the window is a timer with no Date.now captured, so fake timers control it.
- criterion: The edit is sent once five seconds pass without an undo.
  met: true
  how: The timer callback calls send(variables) once with the snapshot built at confirmation. A busy ref stays true from confirm until the send settles, so a second Salvar click during the window or the send schedules nothing.
- criterion: An undo within the five seconds sends no edit.
  met: true
  how: The undo action runs clearTimeout(timer), so the callback that calls mutateAsync never runs. It resets the busy ref so that Salvar works again.
- criterion: An undo within the five seconds leaves the form holding the owner's typed values.
  met: true
  how: Nothing in confirm or in the undo writes the form values, the reason or the review state. The edit is a snapshot, the fields stay in react-hook-form, and the reason and review open state stay in useEntityReview. The saveOffered gate still holds, so Salvar is shown again.
nodes:
- node: rules/entity-workspace/saving-waits-for-undo
  encoded_at:
  - src/features/entities/components/use-undoable-save.ts
  how: The edit is sent only from the five-second timer. The undo clears that timer and mutates nothing, which gives "an undo MUST send nothing and leave the form as it was". The reason and review state are left alone as well, which is the stricter reading of that clause.
- node: scenarios/entity-workspace/undo-within-five-seconds-sends-nothing
  encoded_at:
  - src/features/entities/components/use-undoable-save.ts
  how: The scenario path is confirm, then the undo action three seconds later. No request is made, because the timer is cleared before it fires, and the form still holds the typed values.
- node: domain/entity-workspace/entity-edit-session
  encoded_at:
  - src/features/entities/components/use-undoable-save.ts
  - src/features/entities/components/use-entity-edit-form.ts
  - src/features/entities/components/entity-edit-payload.ts
  how: confirm-save is useUndoableSave.confirm. It builds the edit from the session's fields and reason, and the undo_deadline is the live five-second timer. undo-save is the toast action. The session's node_id, fields, reason and reviewing members are unchanged. discard-changes is not reached.
- node: contracts/entity-workspace/entity-screen
  encoded_at:
  - src/features/entities/components/use-undoable-save.ts
  - src/features/entities/components/EntityForm.tsx
  how: 'The save-edit answer ''a notice that the edit is recorded with an undo that lasts five seconds'' is encoded. The reload of the form and the refusal alerts (conflict, other refusal, unreachable) are not reached: the typed outcome is only stored in outcome for the tasks that implement them.'
- node: rules/entity-workspace/the-listing-and-page-states-read-their-wording
  encoded_at:
  - src/features/entities/components/use-undoable-save.ts
  how: 'Only the recorded-edit clause is reached: the notice reads "Edição registrada." and its undo action reads "Desfazer", with the text ending as written. The listing and page alerts, loading indications and try-again labels belong to the listing and page tasks.'
inferences:
- inferred: If the owner leaves the page during the window, the timer is not cleared and the edit is not sent early. The edit is still sent when the five seconds end, and the toast and its undo stay available because the toaster is mounted at the app root.
  from: No node says what leaving does (ADVISORY). Sending on unmount, as curation does, would break 'sent only after five seconds without an undo' and the 'No edit is sent before five seconds' criterion. Dropping would make the notice "Edição registrada." untrue. A timer that outlives the component honors both. TanStack's useMutation options (onSuccess invalidation) still run after unmount.
- inferred: The edit is snapshotted when Salvar is confirmed. Field changes made during the five seconds are not sent.
  from: The rule says the edit the owner confirmed is what is sent. The deferred note of review-reason says to build the payload on confirm. The review.saveOffered re-check is made at confirmation, and the timer cannot re-read a closure from an older render.
- inferred: On an accepted outcome the hook calls review.clearReason() and nothing else. The review is not closed and the fields are not reset.
  from: The deferred note of review-reason says to clear the reason on success only through review.clearReason. The side effect is that saveOffered goes false until the reload resets the form, so the accepted edit cannot be sent twice. The reset of fields, item ids and review state is the reload-after-save task's.
- inferred: A changed field for which changeOfField returns null is sent as a set change with the field's own itemId (null for a field that started from no attribute).
  from: isFieldChanged counts such a field as changed, for example an empty non-multi field of a key whose current value is not held, and the rule says one change per changed field. changeOfField returns null there only because it names no effect for it.
- inferred: A set change of a non-temporal key sends null valid_from and valid_to, and a temporal key sends the field's validFrom and validTo with an empty member as null. The unstated start is sent as null, never today's date.
  from: a-changed-stable-field-offers-no-validity, the rule a-change-writes-an-empty-member-as-null and an-unstated-start-shows-as-today-and-is-sent-empty. heldEntry in entity-review-entries.ts applies the same temporal test.
- inferred: Changes are ordered by the position of their attribute key in the catalog, changed fields before removed ones for the same key.
  from: No node states the order of the changes (ADVISORY in edit-payload). The review lists entries in this order, so the sent edit matches what the owner reviewed.
- inferred: The outcome state is exposed as save.outcome of useEntityEditForm and is cleared at each new confirmation. No component reads it yet.
  from: The task asks to hand the typed outcome to state that the reload, conflict and failure tasks will consume, and not to build their UI.
- inferred: A throw that is not a typed outcome is swallowed in send, and the outcome becomes null.
  from: The global MutationCache.onError (src/lib/query-client.ts) already reports it. An unhandled rejection from a timer callback would add nothing.
- inferred: The undo-notice id is React's useId value, so one pending notice per form instance.
  from: Curation builds its toast id from useId plus the item. The entities form has one pending edit at a time.
- inferred: The toast is a plain sonner toast with an action button and a five-second duration. There is no countdown.
  from: The criteria ask only for the notice, the undo and its duration.
divergences:
- from: 'task Notes of task/review-and-save/undo-window, and inventory must_not_duplicate (src/features/curation/components/UndoToast/UndoToast.tsx): reuse the curation UndoToast and its five-second constant'
  departure: The feature does not import UndoToast or UNDO_WINDOW_MS from curation. It defines UNDO_WINDOW_MS = 5000 in use-undoable-save.ts and fires a sonner toast with an action.
  why: Importing them is a sibling-feature import, which CLAUDE.md forbids ("Nunca importar de uma feature irmã"). No src/shared or vendor/ui-kit export gives a toast with an action. useDecisionDispatch calls sonner's toast directly, as the rest of the app does. The constant is five seconds, as saving-waits-for-undo fixes.
- from: the orchestration of src/features/curation/hooks/useDecisionDispatch.tsx (commit on unmount)
  departure: No send on unmount, and no cleanup that clears the timer.
  why: Sending on unmount would send before five seconds. See the inference about leaving the page.
preserved:
- The review is offered only while a field is changed and every value reads as its key's type. The Revisar alterações button, the Revisão das alterações panel, the auto-close and the focus moves are unchanged.
- The reason field and the gate on Salvar (1 to 1000 UTF-16 code units of the trimmed reason) and the validity-order gate are unchanged. Salvar is shown exactly when review.saveOffered holds.
- The review entries (previous value, new value, effect, validity, 'Sem valor', removed fields, order) are unchanged. reviewEntriesOf returns the same entries, and its removed-field rule moved into removedFieldsOf.
- The field groups, multi-valued add and remove, closed choices, validity inputs, disputed keys and outside-catalog values are untouched.
- zodIssueResolver is still the form's resolver. entityFormSchema, buildFormValues, changedFlags, useEditEntity, toEntityEditWire and the types of the edit are untouched.
- backend/, vendor/, package.json, src/lib/http.ts, src/lib/query-client.ts and src/lib/error-routing.ts are untouched. No dependency was added, no forwardRef, no GlassSurface, no sibling-feature import, no header entry or graph button, and no comment written.
deferred:
- what: The payload criteria are the edit-payload task's. buildEntityEdit is a working builder that already covers one change per changed field, kind, item identity, validity, null members and the trimmed reason. That task may revise its tests, the ordering and the fallback for a changed field with no effect.
  why: Sending needs a payload now, and the plan places the payload criteria in task/review-and-save/edit-payload.
- what: The reload after an accepted edit, the closing of the review and the reset of the fields with fresh item ids belong to reload-after-save. The conflict alert with its typed values kept belongs to conflict-keeps-typed-values. The refusal and unreachable alerts belong to other-save-failures. save.outcome is the value they consume.
  why: The task says outcome handling after the send is not this task.
- what: Existing EntityForm specs mount EntityForm through mountFormInRouter in entity-form-router-support.tsx with no QueryClientProvider. EntityForm now calls useEditEntity, which uses useQueryClient, so the mount helper needs a provider. A run of the suite will show those specs red until it has one.
  why: Tests belong to another judge, and the form now has to send. The EntityPage specs already wrap a provider.
- what: The sonner close button (closeButton in AppToaster) dismisses the notice without undoing. The send still happens at five seconds.
  why: The task fixes the undo action only, and the AppToaster configuration is shell code outside this task.
- what: 'Tests: none cover the undo window, the payload or the removed-fields extraction.'
  why: Writing tests is another judge's role.
---
## What it is


## Notes
None.
