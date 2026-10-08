---
target: frontend
title: Other save failures keep what the owner typed
summary: A refusal other than a conflict shows its own message, an edit that could not be sent shows the fixed could-not-be-sent text, a lapsed session shows no alert, and the form keeps every typed value on the first two. To follow the rule exactly, SYSTEM_ABORTED now counts as unreachable and AUTH_SESSION_EXPIRED has an outcome of its own.
task: sha256:9b96c33c184f69f823056a446da48f47b831f54ec04369cb917b6df6b2471ed3
standard:
  at: ../standards/frontend-react.yaml
  pin: sha256:2b03615161995450265523de6bdd9c464b2ca633976e832e36586c1ab1aa2cf7
run: run/review-and-save-other-save-failures-build
files:
- path: src/features/entities/types.ts
  effect: 'Adds EditSessionEnded ({ kind: "session-ended" }) and includes it in the EditOutcome union, so a lapsed session is neither a refusal nor an edit that could not be sent. No existing member changed.'
- path: src/features/entities/api/edit.hooks.ts
  effect: 'Fixes the failure classification to match rules/entity-workspace/a-save-failure-is-classified-by-its-code. SYSTEM_ABORTED joins SYSTEM_NETWORK and SYSTEM_TIMEOUT as "unreachable". AUTH_SESSION_EXPIRED now returns the value { kind: "session-ended" }. Every other EnvelopeError stays "refused" with code, status, message and details. That covers SYSTEM_INVALID_RESPONSE, SYSTEM_UPSTREAM, SYSTEM_UNKNOWN, SYSTEM_SERVICE_UNAVAILABLE and any readable body code. The conflict, the accepted-only invalidation and the rethrow of non-EnvelopeError errors are unchanged.'
- path: src/features/entities/components/entity-save-alert.tsx
  effect: EntitySaveAlert gains two cases and exports COULD_NOT_BE_SENT_ALERT_TEXT ("Não foi possível enviar a edição. Tente novamente."). "refused" renders the ui-kit Alert (variant destructive, role="alert", data-testid="entity-save-refused") holding only outcome.failure.message, with no code, status or details. "unreachable" renders Alert (variant destructive, role="alert", data-testid="entity-save-unreachable") holding only the fixed text, with no message of the failure's own. The conflict case (warning, "entity-save-conflict") is untouched. null, accepted and session-ended fall to the default branch and render nothing.
criteria:
- criterion: A refusal other than a conflict shows an alert carrying the refusal's message.
  met: true
  how: EntitySaveAlert's "refused" case renders Alert (role="alert", data-testid="entity-save-refused") with outcome.failure.message as its only content. For a body with a readable code, that message is error.message read in _edit-request.ts refusalOf. Without a readable code it is the contract's fixed text, "Algo deu errado. Tente novamente." for SYSTEM_UPSTREAM or "Erro desconhecido do servidor." for SYSTEM_UNKNOWN. SYSTEM_INVALID_RESPONSE carries "Resposta do servidor não é JSON válido.". EntityForm already feeds save.outcome to the component.
- criterion: A refusal other than a conflict leaves every typed value in the form.
  met: true
  how: The refused path writes no form state. useUndoableSave.send calls setOutcome(result) and calls review.clearReason() only for "accepted". useEditEntity.onSuccess invalidates entityKeys.node only for "accepted", so nothing is refetched and the node reference that triggers reset(values) in use-entity-edit-form.ts does not change. The fields, the reason and the review state stay as they were.
- criterion: An edit that cannot reach the knowledge base shows an alert saying the edit could not be sent.
  met: true
  how: EntitySaveAlert's "unreachable" case renders Alert (role="alert", data-testid="entity-save-unreachable") reading exactly COULD_NOT_BE_SENT_ALERT_TEXT, "Não foi possível enviar a edição. Tente novamente.". The failure's own message and code are not rendered, as the wording rule requires. useEditEntity now gives "unreachable" for SYSTEM_NETWORK, SYSTEM_TIMEOUT and SYSTEM_ABORTED, and gives "refused" for SYSTEM_UPSTREAM, SYSTEM_INVALID_RESPONSE and SYSTEM_UNKNOWN.
- criterion: An edit that cannot reach the knowledge base leaves every typed value in the form.
  met: true
  how: The same value path as for a refusal. The outcome is stored as a value, with no clearReason, no invalidation and no reset, so the form keeps its fields, reason and review.
nodes:
- node: contracts/entity-workspace/entity-screen
  encoded_at:
  - src/features/entities/components/entity-save-alert.tsx
  - src/features/entities/components/EntityForm.tsx
  how: The two remaining save-edit refusals are encoded. "Any other cause" gives an alert carrying the refusal's message. "Cannot be reached" gives an alert saying the edit could not be sent. Both keep every typed value. The reload after an accepted edit is not reached, since it belongs to reload-after-save.
- node: contracts/entity-workspace/bff-entity-edit
  encoded_at:
  - src/features/entities/api/edit.hooks.ts
  - src/features/entities/api/_edit-request.ts
  - src/features/entities/types.ts
  how: 'The request already reports each failure as the contract states. This task fixes how the hook classifies those reports: SYSTEM_TIMEOUT, SYSTEM_ABORTED and SYSTEM_NETWORK as unreachable, AUTH_SESSION_EXPIRED as session-ended, and every other code as a refusal whose message is the one read from the body or the contract''s fixed text. _edit-request.ts was not modified.'
- node: rules/entity-workspace/a-save-failure-is-classified-by-its-code
  encoded_at:
  - src/features/entities/api/edit.hooks.ts
  - src/features/entities/types.ts
  how: toFailureOutcome in edit.hooks.ts follows the rule's three clauses. UNREACHABLE_CODES holds SYSTEM_TIMEOUT, SYSTEM_ABORTED and SYSTEM_NETWORK. SESSION_ENDED_CODE (AUTH_SESSION_EXPIRED) returns the "session-ended" outcome, which is neither a refusal nor an edit that could not be sent. Everything else, including SYSTEM_INVALID_RESPONSE, SYSTEM_UPSTREAM and SYSTEM_UNKNOWN, is "refused". The "typed values are not kept" clause is honored by writing no persistence and no restore for that outcome. See the inference.
- node: rules/entity-workspace/a-failed-save-reads-its-wording
  encoded_at:
  - src/features/entities/components/entity-save-alert.tsx
  how: The could-not-be-sent clause is encoded as COULD_NOT_BE_SENT_ALERT_TEXT, ending as written, and the "unreachable" alert carries it and no message of the failure's own. The "neither alert carries a message of the failure's own" clause also holds for the conflict alert, which was already delivered. The refusal alert carries the refusal's own message because contracts/entity-workspace/entity-screen decides that alert.
- node: domain/entity-workspace/entity-edit-session
  encoded_at:
  - src/features/entities/components/use-undoable-save.ts
  - src/features/entities/components/use-entity-edit-form.ts
  - src/features/entities/components/entity-save-alert.tsx
  how: The session holds what the owner typed until the edit is sent. On a refusal or an unreachable outcome the session's fields, reason and reviewing state stay as they were, because nothing on the path resets them. The two use-* files were not modified, and their accepted-only clearReason and reset-on-data-change behavior is what keeps the values. The session's members are unchanged, and discard-changes and the reload are not reached.
inferences:
- inferred: 'The outcome for AUTH_SESSION_EXPIRED is a new value kind { kind: "session-ended" } and not a thrown error. EntitySaveAlert renders nothing for it and the form takes no action to keep or restore values. The typed values are discarded because the request has already cleared the token and replaced the page with /sign-in?reason=session_expired. The form keeps its typed values only in component state and writes them nowhere.'
  from: a-save-failure-is-classified-by-its-code (neither a refusal nor an edit that could not be sent, values not kept), a-failed-refresh-ends-the-session (the page is replaced) and the earlier decision that outcomes are values. Throwing would send the failure to the global MutationCache.onError, which would toast "Sua sessão expirou. Faça login novamente." on top of the redirect.
- inferred: The refusal and unreachable alerts use the ui-kit Alert variant "destructive", not the "warning" used for the conflict. The testids are "entity-save-refused" and "entity-save-unreachable", and both alerts sit in the existing EntitySaveAlert slot after EntityReview.
  from: No node states the variant. Alert's destructive variant is the kit's failure tone and defaults to role="alert". The conflict's warning tone marks a recoverable change, whereas these two are failures of the save. The testid naming follows "entity-save-conflict".
- inferred: The alerts have no dismiss control and leave only when the next confirmation runs setOutcome(null), the same as the conflict alert.
  from: The delivered conflict alert behavior in use-undoable-save.ts, and no node says when these alerts end.
- inferred: A refusal whose body carries a readable code and an empty-string message would render an empty alert body. No text is invented for that case.
  from: The entity-screen answer says the alert carries the refusal's message, and the specification holds no fallback for an empty one. The earlier inference in the edit-request record covers only an absent or non-string message.
- inferred: SYSTEM_SERVICE_UNAVAILABLE stays a refusal. The edit request never produces it, and if a body carried it as a readable code it would be a refusal showing the body's message.
  from: The rule names three codes for each class and no others. The entity-screen "any other cause" clause covers every remaining code.
divergences:
- from: records/knowledge-base-client/edit-request (inference that only SYSTEM_NETWORK and SYSTEM_TIMEOUT are unreachable and that SYSTEM_ABORTED and AUTH_SESSION_EXPIRED are refused)
  departure: edit.hooks.ts now classifies SYSTEM_ABORTED as unreachable and AUTH_SESSION_EXPIRED as session-ended, which reverses that earlier inference.
  why: The classification rule, written after that inference, states the opposite for both codes. The declared rule wins over the earlier reading.
preserved:
- The conflict path is unchanged. BUSINESS_ENTITY_EDIT_CONFLICT is still "conflict" and EntitySaveAlert's conflict case (warning, "entity-save-conflict", CONFLICT_ALERT_TEXT) is untouched.
- The accepted path is unchanged. Only "accepted" calls review.clearReason and invalidates entityKeys.node(nodeId).
- The five-second undo window, the single send, the busy guard and the clearing of the outcome at each new confirmation in use-undoable-save.ts are untouched, and the file was not modified.
- The review, the reason field and its 1 to 1000 gate, the validity-order gate, buildEntityEdit and the payload, the field groups, multi-valued fields, closed choices, disputed keys and outside-catalog values are untouched.
- zodIssueResolver is still the form's resolver.
- _edit-request.ts is unchanged, so every failure code, status and fixed text it produces is as before.
- The outcomes stay returned as values and never thrown, so the global MutationCache.onError in query-client.ts cannot raise its BUSINESS_* warning toast or SYSTEM_* danger toast for a refusal, an unreachable edit or a lapsed session. Only a non-EnvelopeError is still rethrown to it.
- backend/, vendor/, package.json, src/lib/http.ts, src/lib/query-client.ts and src/lib/error-routing.ts are untouched. No dependency was added, no forwardRef, no GlassSurface, no sibling-feature import, no header menu entry or graph-panel button, and no comment was written.
deferred:
- what: Existing specs that encode the classification. src/features/entities/api/__tests__/edit-outcomes.spec.ts asserts "unreachable" for SYSTEM_NETWORK and SYSTEM_TIMEOUT, and "refused" for BUSINESS_ENTITY_EDIT_DISPUTED at 409. All three stay valid after this change. No existing spec asserts the old classification of SYSTEM_ABORTED or AUTH_SESSION_EXPIRED as refused. edit-request-failures.spec.ts, edit-request-session.spec.ts and edit-request-cutoff.spec.ts check what the request throws, not the hook's outcome. They do not need adjusting.
  why: The proof adds cases for SYSTEM_ABORTED (unreachable), AUTH_SESSION_EXPIRED (session-ended), SYSTEM_UPSTREAM, SYSTEM_INVALID_RESPONSE and SYSTEM_UNKNOWN (refused). Tests are another judge's role.
- what: No test covers the refusal alert, the exact could-not-be-sent text, the absence of the failure's own message on the unreachable alert, the absence of any alert for a lapsed session, or the form keeping its values after these outcomes.
  why: Writing tests is another judge's role.
- what: A refetch of the node caused by something other than the edit (a reconnect, a remount) would reset the form regardless of the outcome. Not changed.
  why: It sits in the delivered reset behavior of use-entity-edit-form.ts, not in the save-failure path.
- what: The sonner close button in AppToaster is not touched by these alerts. The alerts are inline and carry no toast.
  why: It is shell code outside this task.
---
## What it is


## Notes
None.
