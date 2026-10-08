---
target: frontend
title: Conflict alert with typed values kept
summary: A conflict answer to the edit now shows the alert "Este nó mudou desde que você abriu o formulário." in the form, and nothing on that path resets, reloads or clears what the owner typed.
task: sha256:187a527d7bccb2c79f67085b7d9cab60ab659434042a1661dbe83e3dc4ae96b7
standard:
  at: ../standards/frontend-react.yaml
  pin: sha256:2b03615161995450265523de6bdd9c464b2ca633976e832e36586c1ab1aa2cf7
run: run/review-and-save-conflict-keeps-typed-values-build
files:
- path: src/features/entities/components/entity-save-alert.tsx
  effect: New. It exports EntitySaveAlert, which takes the save outcome (EditOutcome | null) and renders by the outcome's kind, and CONFLICT_ALERT_TEXT, which is "Este nó mudou desde que você abriu o formulário." (the wording rule's conflict text, ending with its period). For the conflict kind it renders the ui-kit Alert (variant warning, role="alert", data-testid="entity-save-conflict") holding that sentence and nothing else. The server's code, its message, attribute_key and item_id are not shown. For null, accepted, refused and unreachable it renders nothing.
- path: src/features/entities/components/EntityForm.tsx
  effect: Modified. It renders EntitySaveAlert with save.outcome inside the form, directly after EntityReview, which holds the Salvar control. The fields, the review panel, the reason and the gates are untouched. The alert is visible while save.outcome is a conflict.
criteria:
- criterion: A conflict answer leaves every typed value in the form.
  met: true
  how: 'The conflict path writes no form state. In use-undoable-save.ts, send() stores the outcome with setOutcome(result) and calls review.clearReason() only for kind "accepted", so a conflict keeps the reason, the review state and the fields. The reset(values) effect in use-entity-edit-form.ts runs only when the node or catalog data reference changes. useEditEntity (api/edit.hooks.ts) turns BUSINESS_ENTITY_EDIT_CONFLICT into the value { kind: "conflict", ... } and its onSuccess calls invalidateQueries(entityKeys.node(nodeId)) only when outcome.kind === "accepted". A conflict therefore invalidates and refetches nothing, and the node reference stays the same, so reset is not triggered. EntityForm.tsx only adds a sibling element and does not remount the fields.'
- criterion: A conflict answer shows an alert saying the node changed since the form was opened.
  met: true
  how: EntitySaveAlert (entity-save-alert.tsx) renders Alert with role="alert" and the exact text in CONFLICT_ALERT_TEXT when outcome.kind === "conflict". EntityForm.tsx places it after the review panel, next to Salvar, and feeds it save.outcome. The alert stays while the outcome stays a conflict. useUndoableSave.confirm() does setOutcome(null) at the start of each new confirmation, so the alert goes away when the owner confirms a new attempt. Nothing else was added to clear it.
nodes:
- node: rules/entity-workspace/a-conflict-keeps-the-typed-values
  encoded_at:
  - src/features/entities/components/entity-save-alert.tsx
  - src/features/entities/components/use-undoable-save.ts
  - src/features/entities/api/edit.hooks.ts
  how: Both clauses of the invariant. "Leave every typed value in the form" holds because the conflict outcome is returned as a value that causes no invalidation or reset and no clearReason (the accepted-only branches in use-undoable-save.ts and edit.hooks.ts). "Tell the owner the node changed since the form was opened" is EntitySaveAlert's conflict case. use-undoable-save.ts and edit.hooks.ts were already delivered and were not modified here.
- node: scenarios/entity-workspace/a-conflict-keeps-what-the-owner-typed
  encoded_at:
  - src/features/entities/components/entity-save-alert.tsx
  - src/features/entities/components/EntityForm.tsx
  how: Given a status the owner changed and a conflict answer, the form still holds that status, because the answer resets nothing, and EntityForm renders the alert reading the conflict sentence. This is the "then" of both lines of the scenario.
- node: rules/entity-workspace/a-failed-save-reads-its-wording
  encoded_at:
  - src/features/entities/components/entity-save-alert.tsx
  how: Only the conflict clause is reached. The alert reads "Este nó mudou desde que você abriu o formulário." ending as written, and carries no message of the failure's own. The could-not-be-sent text ("Não foi possível enviar a edição. Tente novamente.") belongs to the other-save-failures task and is not written, so EntitySaveAlert renders nothing for unreachable.
- node: contracts/entity-workspace/entity-screen
  encoded_at:
  - src/features/entities/components/entity-save-alert.tsx
  - src/features/entities/components/EntityForm.tsx
  how: The save-edit refusal "an alert saying the node changed since the form was opened, with every typed value kept" is encoded. The refusal with its own message and the could-not-be-sent alert are not reached (next task), and the reload after an accepted edit is not either (reload-after-save).
- node: contracts/entity-workspace/bff-entity-edit
  encoded_at:
  - src/features/entities/api/edit.hooks.ts
  how: The conflict is told apart by the code BUSINESS_ENTITY_EDIT_CONFLICT, which useEditEntity already maps to kind "conflict" (CONFLICT_CODE in edit.hooks.ts, not modified here). The new component reads only that kind. It does not read the conflict's details { attribute_key, item_id } and does not show them.
- node: domain/entity-workspace/entity-edit-session
  encoded_at:
  - src/features/entities/components/EntityForm.tsx
  - src/features/entities/components/use-entity-edit-form.ts
  how: The session holds what the owner typed until the edit is sent. On a conflict that state (fields, reason, review open or closed) stays as it was, because nothing on the path resets it. The session's members are unchanged. discard-changes and the reload are not reached.
inferences:
- inferred: The conflict alert uses the ui-kit Alert variant "warning" with role="alert", placed after EntityReview inside the form.
  from: Alert is used with role="alert" in entity-page-parts.tsx and entity-list-parts.tsx, and warning is the tone the app already gives BUSINESS_* codes. No node states the variant or the position beyond "an alert" near the save.
- inferred: The alert goes away only when a new confirmation clears the outcome (useUndoableSave.confirm calls setOutcome(null)). It does not go away when the owner changes a field, and the alert has no dismiss control.
  from: The task asks for the minimum rule, and no node says when the alert ends. The rule says it tells the owner the node changed since the form was opened, which stays true while the form stays open.
- inferred: The alert's data-testid is "entity-save-conflict" and the text constant is exported as CONFLICT_ALERT_TEXT.
  from: The feature's data-testid naming (entity-not-found, entity-load-error) and the RECORDED_NOTICE constant pattern in use-undoable-save.ts.
- inferred: EntitySaveAlert takes the whole outcome and switches on its kind, with a default branch that renders nothing, so the next task adds cases for "refused" and "unreachable" without changing EntityForm.
  from: The caller's instruction to design it for extension; EditOutcome is already a discriminated union by kind.
preserved:
- The review (Revisar alterações, the panel, the entries, the auto-close and the focus moves), the reason field and the gates on Salvar (reason 1 to 1000 code units, validity order) are unchanged. Salvar is still shown exactly when review.saveOffered holds.
- The five-second undo window (UNDO_WINDOW_MS, the Desfazer action, the single send, the busy guard, and clearReason only on an accepted outcome) is unchanged; use-undoable-save.ts was not touched.
- buildEntityEdit and the payload, the validity inputs, the field groups, multi-valued add and remove, disputed keys and outside-catalog values are unchanged.
- zodIssueResolver is still the form's resolver. useEditEntity, the typed outcomes and entityKeys invalidation (accepted only) are unchanged.
- backend/, vendor/, package.json, src/lib/http.ts, src/lib/query-client.ts and src/lib/error-routing.ts are untouched. No dependency was added, no forwardRef, no GlassSurface, no sibling-feature import, no header entry or graph-panel button, and no comment was written.
deferred:
- what: 'The alert with the refusal''s own message and the "Não foi possível enviar a edição. Tente novamente." alert, which EntitySaveAlert renders as nothing for the refused and unreachable kinds. The accepted kind also renders nothing: the reload after an accepted edit belongs to the reload-after-save task.'
  why: The task's REMAINDER note assigns them to the other-save-failures task.
- what: 'The advisory about the global MutationCache.onError. Verified, no change made: the toast route cannot apply to a conflict. In api/edit.hooks.ts the mutationFn catches an EnvelopeError and returns toFailureOutcome(error) as a resolved value, and rethrows only errors that are not EnvelopeError. MutationCache.onError in src/lib/query-client.ts runs only when the mutation rejects, and a conflict resolves, so routeError never turns BUSINESS_ENTITY_EDIT_CONFLICT into a warning toast. use-undoable-save.ts calls mutateAsync inside try/catch and receives the value.'
  why: Nothing needed to change. It is recorded here because the inventory flagged the risk and the answer rests on edit.hooks.ts as already delivered.
- what: No test covers the conflict alert, the exact text, the absence of the failure's own message, or the form keeping its typed values after a conflict.
  why: Writing tests is another judge's role.
- what: A refetch of the node caused by something other than the edit (a reconnect, a remount) would change the node reference and reset the form, with or without a conflict. Not changed here.
  why: It is not caused by the conflict answer and it sits in the delivered load and reset behavior of use-entity-edit-form.ts, outside this task.
---
## What it is


## Notes
None.
