---
target: frontend
title: Proof of the undo window before an edit is sent
summary: Eleven tests over the entity form with the five-second undo window. They cover the exact notice and undo wording, the five-second duration, no send at 4999 ms, one send at 5000 ms, and a single send under a double press. They also cover an undo that sends nothing and leaves the values, the typed reason and the open review, and a Salvar that works again afterward. Nothing was run.
implementation: sha256:4e0ed0265ca61f40f3cd9497635bc859c8aee30efde268766e34e14b4833267e
standard:
  at: ../standards/frontend-react.yaml
  pin: sha256:2b03615161995450265523de6bdd9c464b2ca633976e832e36586c1ab1aa2cf7
run: run/review-and-save-undo-window-suite
tests:
- file: src/features/entities/components/__tests__/EntityForm.undo-window.spec.tsx
  name: shows the notice 'Edição registrada.' once Salvar confirms the review
  proves: 'Criterion: Confirming the review shows a notice that the edit is recorded. Also the notice text of UNDERDETERMINED entry 1, asserted verbatim: ''Edição registrada.'' including the final full stop. The assertion covers every message toast received across the whole sequence (type, open review, type reason, press Salvar), so the notice appears once and only on confirmation.'
  fails_when: The notice is worded otherwise (for example 'Alterações salvas!'), is missing, is shown more than once, or is shown before Salvar is pressed, for instance when the review opens.
- file: src/features/entities/components/__tests__/EntityForm.undo-window.spec.tsx
  name: offers the undo action labelled 'Desfazer' with the notice
  proves: 'Criterion: The notice offers an undo. Also the undo label of UNDERDETERMINED entry 1, asserted verbatim: ''Desfazer''.'
  fails_when: The notice carries no action, or the action is labelled otherwise (for example 'Voltar').
- file: src/features/entities/components/__tests__/EntityForm.undo-window.spec.tsx
  name: offers the undo for five seconds
  proves: 'Criterion: The undo is offered for five seconds. The notice that carries the undo is shown with a duration of 5000 ms.'
  fails_when: The notice is shown with any duration other than 5000, or with none.
- file: src/features/entities/components/__tests__/EntityForm.undo-window.spec.tsx
  name: sends no edit before five seconds have passed
  proves: 'Criterion: No edit is sent before five seconds have passed. At 4999 ms after Salvar, no POST to the node''s edit address has been recorded.'
  fails_when: The edit is sent at confirmation, or at any point before 5000 ms.
- file: src/features/entities/components/__tests__/EntityForm.undo-window.spec.tsx
  name: sends the edit once, as a POST to the node's edit address, when five seconds pass without an undo
  proves: 'Criterion: The edit is sent once five seconds pass without an undo. At 5000 ms, exactly one request exists, method POST to /api/v1/nodes/n-1/edit.'
  fails_when: Nothing is sent when the window ends, more than one request is sent, or the request is not a POST to the node's edit path.
- file: src/features/entities/components/__tests__/EntityForm.undo-window.spec.tsx
  name: 'sends the confirmed edit: the trimmed reason and one change for the changed field'
  proves: 'Criterion: The edit is sent once five seconds pass without an undo, meaning the edit the owner confirmed. The body carries the reason with its surrounding spaces trimmed and exactly one change holding the changed field''s attribute_key. Payload detail belongs to the edit-payload task and is not asserted.'
  fails_when: The body carries the untrimmed reason, no change or more than one change for the single changed field, or a change for a different key.
- file: src/features/entities/components/__tests__/EntityForm.undo-window.spec.tsx
  name: schedules no second send when Salvar is pressed again during the window
  proves: 'Criterion: The edit is sent once five seconds pass without an undo (''once''). A second Salvar press two seconds into the window, followed by 10 s, leaves exactly one edit request.'
  fails_when: A second press schedules its own timer and sends a second edit.
- file: src/features/entities/components/__tests__/EntityForm.undo-window.spec.tsx
  name: sends nothing and leaves the typed values when the owner undoes three seconds after confirming
  proves: 'Criteria: An undo within the five seconds sends no edit, and leaves the form holding the owner''s typed values. Scenario: confirm a one-field edit, undo three seconds later, so no edit is sent (still none 10 s later) and the form still holds the typed value.'
  fails_when: An edit request is recorded after the undo, the undo does not stop the pending send, or the field no longer holds the typed value 'Beta' after the undo.
  demonstrates: scenarios/entity-workspace/undo-within-five-seconds-sends-nothing
- file: src/features/entities/components/__tests__/EntityForm.undo-window.spec.tsx
  name: leaves the reason as typed and the review open after an undo
  proves: 'UNDERDETERMINED entry 2: an undo leaves the form as it was beyond the typed values. The reason text in the review is exactly as typed (untrimmed) and the review is still open after the undo.'
  fails_when: An undo clears or alters the reason, or closes the review or returns the owner to a blank review, while keeping the field values.
- file: src/features/entities/components/__tests__/EntityForm.undo-window.spec.tsx
  name: lets the owner press Salvar again after an undo, and sends that edit once its own five seconds pass
  proves: 'UNDERDETERMINED entry 2 and the rule''s ''leave the form as it was'': after an undo Salvar is offered again and works. A new press starts a new window and exactly one edit is sent when it ends.'
  fails_when: Salvar is gone after an undo, the second press is ignored because the in-flight guard was not released, or the second window sends nothing.
- file: src/features/entities/components/__tests__/EntityForm.undo-window.spec.tsx
  name: sends the edit only after five seconds without an undo, and an undo sends nothing and leaves the form as it was
  proves: 'The invariant read whole as one timeline. Undo at 4999 ms: nothing sent, still nothing 10 s later, and the field values, the typed reason and the open review equal their state before Salvar. Pressing Salvar again then sends nothing at 4999 ms and exactly one edit at 5000 ms.'
  fails_when: 'Any of these breaks: the edit goes out before the window ends, an undo still lets an edit go out, an undo changes the values, the reason or the review state, or the edit is not sent once five seconds pass without an undo.'
  demonstrates: rules/entity-workspace/saving-waits-for-undo
files:
- path: src/features/entities/components/__tests__/entity-form-undo-support.ts
  effect: New helper for the undo-window spec. It renders a form with one changed field, opens the review and types a padded reason against a stubbed fetch that accepts the edit. It also exposes Salvar presses and the recorded edit requests.
- path: src/features/entities/components/__tests__/entity-form-router-support.tsx
  effect: Existing shared mount helper, adjusted. mountFormInRouter now renders the routed form inside a QueryClientProvider with a fresh QueryClient (retry off for queries and mutations) per mount, because EntityForm now calls useEditEntity. Every existing form spec mounts through it and keeps its assertions unchanged. The provider adds no toaster and no fetch stub.
not_applicable:
- edge_case: The edit is refused, conflicts, or the knowledge base is unreachable after the send
  why: The reload and the conflict, refusal and unreachable alerts belong to other tasks (ADVISORY note). No criterion or node implemented here states them, so no test is written.
- edge_case: Salvar pressed while saveOffered is false (empty reason, over-long reason, nothing changed)
  why: The control is absent in those states. That is the review-reason task's obligation and is already tested in EntityForm.review-reason.spec.tsx.
- edge_case: Undo exactly at, or after, the five-second boundary
  why: From the five-second mark the window has ended. Undo is then no longer offered. The tests cover 3000 and 4999 ms for the undo and 4999 and 5000 ms for the send, which are the boundaries these criteria state.
- edge_case: Salvar pressed with a changed field of each value type, temporal keys, removed or multi-valued fields
  why: These affect what the payload contains, not when it is sent. The payload content belongs to the edit-payload task. The timing obligations here read none of these dimensions.
- edge_case: Network failure, slow answer or timeout of the POST
  why: Timing of the send is the obligation here. How a failed send is shown belongs to the other-save-failures task.
untested:
- 'domain/entity-workspace/entity-edit-session: an aggregate-root whose operations are only named (open-entity, change-field, review-changes, confirm-save, undo-save, discard-changes). It states no fact that a finite test decides whole, so it is exercised only through the criteria above.'
- 'contracts/entity-workspace/entity-screen: only the save-edit answer ''a notice that the edit is recorded with an undo that lasts five seconds'' is reached. The same answer also states the reload, and the contract holds the loading, not-found, load-failure and refusal answers and the other operations. All belong to other tasks, so no test claims the contract whole.'
- 'rules/entity-workspace/the-listing-and-page-states-read-their-wording: only the recorded-edit clause (notice and undo label) is tested, in the first two tests. The rule is a conjunction of many more texts that the listing and page tasks own. A test of one clause would approximate it, so no test claims the rule.'
- 'Inference: leaving the page during the window. The timer outlives the component and the edit is still sent. No node states it (ADVISORY), so no test pins it.'
- 'Inference: the edit is snapshotted at confirmation, so a field changed during the five seconds is not sent. No node decides it.'
- 'Inference: after an accepted send the hook calls review.clearReason() and nothing else. The reload after saving belongs to another task.'
- 'Inference: the typed outcome (accepted, conflict, refused or unreachable) is stored in save.outcome. No component reads it and no node states it.'
- 'Inference: a changed field with no change effect is sent as a set change with its own itemId. The payload belongs to the edit-payload task.'
- 'Inference: the order of changes follows the catalog position of the attribute key. No node states it (ADVISORY in edit-payload).'
- 'Inference: an unexpected throw is swallowed and the outcome becomes null. It is reported only by the global handler.'
- 'Inference: the toast id (useId) and the absence of a countdown. They are arrangement, not behavior.'
- The undo is not shown after the window, which the criterion 'The undo is offered for five seconds' also implies. The implementation dismisses the toast when the timer fires, but sonner is mocked, so only the toast's duration option is checked. The real Toaster, and a toast kept open by hover, are not exercised. The closeButton of AppToaster that dismisses without undoing is not asserted either.
---
## What it is
The mount helper of the form specs now supplies a QueryClientProvider, because EntityForm calls useEditEntity. The new spec stubs the global fetch as the entities specs do, with no msw, and mocks lib/env as edit-request-sending.spec.ts does. Timers are faked for setTimeout and clearTimeout only, and only after the form is mounted and the review is prepared, so the mount's own real setTimeout(0) still resolves.

I mocked the sonner module (vi.mock) instead of mounting `<Toaster />`. This lets the tests read the message, the action label, the duration and the action's onClick that the form handed to toast. A mounted Toaster would show the text and the button, but it could not show the duration. The implementation dismisses the toast when the timer fires, so a toast that vanished from the DOM would pass whether or not duration was 5000. The cost is that sonner's rendering of the button, and the action click it wires, are not exercised. The undo is invoked by calling the captured action.onClick inside act, which is the handler the form registered. No assertion is made about other toasts, the toast id, closeButton, or toast.dismiss.


## Notes
Four things are not run and were not read from a run: timing, act, and the shared-helper change. The suite has not been executed.

- Timing under act. The tests assume `act` plus `vi.advanceTimersByTimeAsync` settles TanStack's mutation microtasks, so the POST is recorded by the time `advance(5000)` returns. The existing edit-outcomes spec relies on the same pairing.
- Real vs faked timers. The helper that mounts the form keeps real timers, and `vi.useFakeTimers` is called only afterwards, in `reviewedEdit`.
- Shared mount helper. Wrapping the routed form in a provider is the only change to existing spec infrastructure. No existing assertion was touched.
- The "second Salvar press" test is tolerant. If an implementation hides Salvar during the window, the press is skipped, because the guard is then trivially satisfied.

The suite passed on its first run, run/review-and-save-undo-window-suite; sonner is mocked so the toast's duration and action are read from the call the form made.
