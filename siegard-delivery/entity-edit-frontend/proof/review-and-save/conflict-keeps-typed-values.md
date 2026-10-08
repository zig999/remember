---
target: frontend
title: Proof for the conflict alert with typed values kept
summary: Four form tests drive the real form and the real undo timer against a stubbed 409 BUSINESS_ENTITY_EDIT_CONFLICT. They hold the typed status, the typed reason and the exact alert sentence after a conflict, and no alert before the send or after an accepted answer. None of them has been run.
implementation: sha256:77a0a2947149e1b5631f11708a551f3406429b5c954021eb3c1a44825f176d4c
standard:
  at: ../standards/frontend-react.yaml
  pin: sha256:2b03615161995450265523de6bdd9c464b2ca633976e832e36586c1ab1aa2cf7
run: run/review-and-save-conflict-keeps-typed-values-suite
tests:
- file: src/features/entities/components/__tests__/EntityForm.conflict.spec.tsx
  name: still holds the status the owner typed and alerts that the node changed since the form was opened, though the status was superseded elsewhere
  proves: 'The scenario "a conflict keeps what the owner typed", both of its then-lines. After a conflict, the form still holds the status the owner typed, even though a second read of the node would return another current status. The only alert in the form reads exactly "Este nó mudou desde que você abriu o formulário." Because the alert text is compared whole, it also settles the task''s UNDERDETERMINED entry: neither the wrong sentence ("O nó foi alterado por outra operação.") nor the conflict sentence followed by the server''s own message passes. It also covers the criteria "A conflict answer leaves every typed value in the form" and "A conflict answer shows an alert saying the node changed since the form was opened", and the conflict clause of the wording rule.'
  fails_when: A conflict resets the form or reloads the node, so the typed status is replaced by the superseding one or by the held one. Or no alert appears. Or the alert reads anything other than the exact sentence, including the sentence plus the server's message, code, attribute_key or item_id, or the wrong-pass sentence. Or a second alert appears.
  demonstrates: scenarios/entity-workspace/a-conflict-keeps-what-the-owner-typed
- file: src/features/entities/components/__tests__/EntityForm.conflict.spec.tsx
  name: leaves the reason as the owner typed it
  proves: Criterion "A conflict answer leaves every typed value in the form", for the reason typed in the review. The reason control is still found in the open review and still holds the typed text.
  fails_when: A conflict clears the reason, as an accepted answer does, or closes the review panel, or resets the form.
- file: src/features/entities/components/__tests__/EntityForm.conflict.spec.tsx
  name: shows no conflict alert while the edit has not been sent
  proves: Criterion "A conflict answer shows an alert saying the node changed ...", read as tied to the conflict answer. Pressing Salvar and waiting 4999 ms, one millisecond short of the undo window, produces no outcome and no alert.
  fails_when: The alert is rendered whenever Salvar has been pressed, or before any answer, or from the start.
- file: src/features/entities/components/__tests__/EntityForm.conflict.spec.tsx
  name: shows no conflict alert when the edit is accepted
  proves: The same criterion, read as tied to the conflict kind. After an accepted answer, the one POST has been sent and the form holds no alert.
  fails_when: The alert is rendered for any non-null outcome, so that an accepted edit tells the owner the node changed since the form was opened.
files:
- path: src/features/entities/components/__tests__/entity-form-conflict-support.tsx
  effect: New helper for EntityForm.conflict.spec.tsx. It mounts EntityForm inside a router and QueryClientProvider with no global MutationCache. The form is fed from a TanStack Query on entityKeys.node("n-1"), whose second read returns a node whose status was superseded elsewhere, so a reload after the conflict would replace the typed status. It stubs fetch so the edit POST answers either a 409 BUSINESS_ENTITY_EDIT_CONFLICT envelope (with message and details) or the accepted wire. It reuses typeInto, openReviewIn and typeReason to arrive at a reviewed edit of status_text with a reason. Then it presses Salvar and either advances the 5000 ms undo window under fake timers (setTimeout and clearTimeout only) and lets the answer arrive, or stays at 4999 ms. It throws if the edit POST was not recorded exactly once, so the absence assertions cannot pass vacuously. It tears down its roots and query clients.
not_applicable:
- edge_case: absent or empty input to the alert (a null outcome)
  why: Covered by the test "shows no conflict alert while the edit has not been sent", where the outcome is null. EntitySaveAlert has no other input, and the form always passes it the save outcome.
- edge_case: the conflict carrying details with item_id null, or details absent
  why: No criterion or bound node gives the alert any use of the details. The alert is exact-text only, and the tests assert that details are not shown. How the hook reads the details is the earlier delivered edit-hook task's behavior, and that task's tests decide it.
- edge_case: two Salvar presses, or a press during the window
  why: That is the undo-window task's busy guard, already proven by its tests. Nothing in this task's criteria or nodes concerns it.
- edge_case: a dependency that fails (network, timeout, refusal with its own message)
  why: Those answers render nothing in this task and belong to the other-save-failures task, per the task's REMAINDER note. A test here would pin the absence that task replaces.
- edge_case: boundaries of a stated range
  why: The conflict behavior states no range. The undo-window boundary at 5000 ms is the undo-window task's; only 4999 ms is used here, as "before the send".
- edge_case: duplicates where uniqueness is claimed
  why: No criterion or node of this task claims uniqueness.
untested:
- 'rules/entity-workspace/a-conflict-keeps-the-typed-values: the invariant covers every typed value (multi-valued entries, validity dates, removed values, the reason). The tests exercise one changed status field and the reason. A finite test would be a partial claim presented as the whole, so no `demonstrates` names this node. The scenario test is its representative example only.'
- 'rules/entity-workspace/a-failed-save-reads-its-wording: the could-not-be-sent clause is not delivered here (next task, the REMAINDER note). The conflict clause is exercised inside the scenario test, not as a whole-node demonstration, because the node''s single fact also states the other clause.'
- 'contracts/entity-workspace/entity-screen: it spans show-entity-list, show-entity-form, show-review and save-edit and their other refusals. Only the conflict refusal of save-edit is reached here, so no finite test over this task decides the whole contract.'
- 'contracts/entity-workspace/bff-entity-edit: the contract covers the whole wire and failure table. The conflict code mapping lives in the previously delivered edit hook and its API tests. The form tests exercise it end to end through a 409 body but decide only the conflict row, so no `demonstrates` is claimed.'
- 'domain/entity-workspace/entity-edit-session: an aggregate root whose responsibility ("holds what the owner typed until the edit is sent") has no finite test beyond what the other tests show. Nothing here decides it whole.'
- 'ADVISORY about the global MutationCache onError turning BUSINESS_* codes into a warning toast: the test QueryClient has no global MutationCache or error routing, so the toast route is not exercised. No test asserts about toasts, so a toast over the conflict alert is neither proven nor refuted here. The implementation record''s argument that a conflict resolves rather than rejects remains an unproven reading.'
- Implementation inference, a new confirmation clearing the alert (useUndoableSave.confirm calls setOutcome(null)), and the alert having no dismiss control. This is a behavior choice no node decides, so it is left unpinned.
- 'Implementation inferences about arrangement or presentation: the Alert warning variant, its position after EntityReview, the data-testid "entity-save-conflict", and the CONFLICT_ALERT_TEXT export. They are not pinned. The tests find the alert by role="alert" only.'
- The server's message, code and conflict details appearing elsewhere in the form than the alert. No node states it, and the exact-text assertion on the alert already fails over any addition to the alert, so a form-wide text scan was not written (it would be the same evidence twice).
- 'A separate pure test of EntitySaveAlert: the conflict text is already decided through the real form. The behavior for the refused, unreachable and accepted kinds is not stated by any node reached here (next task and reload-after-save), so nothing is pinned for them.'
- 'A refetch of the node caused by something other than the edit (reconnect, remount) resetting the form: it is the delivered load behavior of use-entity-edit-form.ts and no criterion of this task states it.'
---
## What it is
This record proves task/review-and-save/conflict-keeps-typed-values.
It holds the specs and helpers listed in its tests and files.

## Notes
The suite passed on its first run, run/review-and-save-conflict-keeps-typed-values-suite.
