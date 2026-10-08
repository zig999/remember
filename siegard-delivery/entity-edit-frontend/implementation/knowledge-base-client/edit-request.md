---
target: frontend
title: Entity edit request and answer classification
summary: Writes the request that sends an entity edit to the BFF, the single session refresh and repeat, the typed outcomes (accepted, conflict, refused, unreachable) and the mutation hook that returns them.
task: sha256:6ed9891e65325ef8bfdb2834e7a0ce3da9147e48f6bb93890ace6d6f43d744e5
standard:
  at: ../standards/frontend-react.yaml
  pin: sha256:2b03615161995450265523de6bdd9c464b2ca633976e832e36586c1ab1aa2cf7
run: run/knowledge-base-client-edit-request-build-2
files:
- path: src/features/entities/api/_edit-request.ts
  effect: 'new: entityEdit sends POST /api/v1/nodes/{node_id}/edit with the id URL-encoded, a JSON body and a Bearer header re-read on each attempt; each attempt has its own 30000 ms cutoff and relays the caller''s cancellation; a 2xx is read without an envelope as { node_id, action_id, applied }; a non-2xx with a readable error.code fails with the status, code, message (when a string) and details read from the body; without a readable code it always fails with the fixed text of its branch, ignoring any body message, and without details, as SYSTEM_UPSTREAM (500 or above) or SYSTEM_UNKNOWN (below 500); a non-JSON 2xx fails with SYSTEM_INVALID_RESPONSE; no answer fails with SYSTEM_TIMEOUT, SYSTEM_ABORTED or SYSTEM_NETWORK; a first-attempt 401 starts one refresh and one repeat, and a failed refresh clears the token, goes to /sign-in?reason=session_expired and fails with AUTH_SESSION_EXPIRED (401). Exports entityEdit and __setEditRedirectForTests.'
- path: src/features/entities/api/edit.hooks.ts
  effect: 'new: useEditEntity, a useMutation returning as a value, never thrown, the typed outcome accepted, conflict, refused or unreachable; BUSINESS_ENTITY_EDIT_CONFLICT becomes conflict with the key and item of the details (item null where none); SYSTEM_NETWORK and SYSTEM_TIMEOUT become unreachable; any other failure becomes refused with code, status, message and details; an accepted edit invalidates entityKeys.node(nodeId).'
- path: src/features/entities/api/_transforms.ts
  effect: 'extended: adds toEntityEditWire, which writes the six members of every change always present with null for an empty member and null in value, valid_from and valid_to on a remove change, and toEditAccepted and toAppliedChange, which map the accepted answer to camelCase.'
- path: src/features/entities/types.ts
  effect: 'extended: adds the wire and domain types of the edit (AttributeChange, EntityEdit, EntityEditWire, EditAcceptedWire, AppliedChange, EditFailure, EditAccepted, EditConflict, EditRefused, EditUnreachable, EditOutcome, EditVariables).'
criteria:
- criterion: The edit is sent as POST /api/v1/nodes/{node_id}/edit, with the node identity in the path.
  met: true
  how: editUrl in _edit-request.ts builds `${VITE_BFF_URL}/api/v1/nodes/${id}/edit` and sendOnce uses method POST.
- criterion: The node identity in the edit's path is URL-encoded.
  met: true
  how: editUrl applies encodeURIComponent to the node identity.
- criterion: The request carries the owner's token in the Authorization header as Bearer <token>.
  met: true
  how: sendOnce spreads authHeader() from curation/api/_request.ts into the headers on every attempt, giving Authorization Bearer with the token the store holds then; the repeat carries the refreshed token.
- criterion: The body carries the reason.
  met: true
  how: toEntityEditWire copies edit.reason into the reason member and entityEdit serialises the object with JSON.stringify.
- criterion: The body carries the changes as a list.
  met: true
  how: toEntityEditWire maps edit.changes to the changes member, a list.
- criterion: Each change in the body carries attribute_key, kind, value, item_id, valid_from and valid_to.
  met: true
  how: toAttributeChangeWire always returns the six members, and empty ones leave as null, never omitted.
- criterion: An HTTP 200 answer is read without an envelope as node_id, action_id and applied.
  met: true
  how: answerOf returns the JSON body of an ok answer as EditAcceptedWire without looking for ok or result, and toEditAccepted maps it to nodeId, actionId and applied.
- criterion: An edit answered with a status that is not 2xx and a body carrying a readable error code fails with the answer's status.
  met: true
  how: refusalOf uses response.status as the httpStatus of the EnvelopeError.
- criterion: 'An edit answered with a status that is not 2xx and a body carrying a readable error code fails with the code read from error.code in the body { ok: false, error: { code, message, details } }.'
  met: true
  how: refusalOf reads error.code from the body through errorMemberOf when it is a string and uses it as code.
- criterion: An edit answered with a status that is not 2xx and a body carrying a readable error code fails with the message read from error.message in that body.
  met: true
  how: refusalOf uses error.message when a readable code exists and the message is a string.
- criterion: An edit answered with a status that is not 2xx and a body carrying a readable error code fails with the details read from error.details in that body.
  met: true
  how: refusalOf passes error.details as details when a readable code exists.
- criterion: A refusal with code BUSINESS_ENTITY_EDIT_CONFLICT is reported as a conflict.
  met: true
  how: 'toFailureOutcome in edit.hooks.ts returns { kind: ''conflict'' } for that code.'
- criterion: A conflict reports the attribute key its refusal's details name.
  met: true
  how: conflictFacts reads details.attribute_key into attributeKey.
- criterion: A conflict reports the item its refusal's details name, or none where the details name none.
  met: true
  how: conflictFacts reads details.item_id into itemId and returns null when item_id is null or absent.
- criterion: An edit cut off after 30000 milliseconds without an answer fails with SYSTEM_TIMEOUT.
  met: true
  how: sendOnce arms a timer of DEFAULT_TIMEOUT_MS (30000) per attempt that aborts the fetch with a TimeoutError, and noAnswer classifies it as SYSTEM_TIMEOUT.
- criterion: A SYSTEM_TIMEOUT failure reads "Tempo limite excedido na requisição."
  met: true
  how: The fixed message is in noAnswer.
- criterion: An edit its caller cancels before an answer fails with SYSTEM_ABORTED.
  met: true
  how: sendOnce relays the caller signal's abort to its controller and noAnswer classifies it as SYSTEM_ABORTED when the caller's signal is aborted or the error is named AbortError.
- criterion: A SYSTEM_ABORTED failure reads "Requisição cancelada."
  met: true
  how: The fixed message is in noAnswer.
- criterion: An edit that gets no answer for a cause other than the cutoff or a cancellation fails with SYSTEM_NETWORK.
  met: true
  how: The last branch of noAnswer returns SYSTEM_NETWORK for any other fetch rejection.
- criterion: A SYSTEM_NETWORK failure reads "Falha de rede ao contactar o servidor."
  met: true
  how: The fixed message is in noAnswer.
- criterion: An edit whose session refresh fails fails with AUTH_SESSION_EXPIRED.
  met: true
  how: In entityEdit, when refreshSession returns false, it throws an EnvelopeError with code AUTH_SESSION_EXPIRED.
- criterion: An AUTH_SESSION_EXPIRED failure carries status 401.
  met: true
  how: That EnvelopeError is created with httpStatus 401.
- criterion: An AUTH_SESSION_EXPIRED failure reads "Sua sessão expirou. Faça login novamente."
  met: true
  how: The fixed message is in entityEdit.
- criterion: An edit answered 2xx with a body that is not JSON fails with SYSTEM_INVALID_RESPONSE.
  met: true
  how: In answerOf, a failure of response.json() on an ok answer becomes SYSTEM_INVALID_RESPONSE.
- criterion: A SYSTEM_INVALID_RESPONSE failure carries the answer's status.
  met: true
  how: The httpStatus is response.status.
- criterion: A SYSTEM_INVALID_RESPONSE failure reads "Resposta do servidor não é JSON válido."
  met: true
  how: The fixed message is in answerOf.
- criterion: An edit answered with a status that is not 2xx, at 500 or above, and a body carrying no readable error code fails with SYSTEM_UPSTREAM.
  met: true
  how: refusalOf picks SYSTEM_UPSTREAM when no readable code exists and the status is 500 or above.
- criterion: A SYSTEM_UPSTREAM failure carries the answer's status.
  met: true
  how: The httpStatus is response.status.
- criterion: A SYSTEM_UPSTREAM failure reads "Algo deu errado. Tente novamente."
  met: true
  how: In refusalOf, without a readable code the message is always the fallback text of the upstream branch, even when the body carries error.message; the body supplies the message only with a readable code.
- criterion: An edit answered with a status that is not 2xx, below 500, and a body carrying no readable error code fails with SYSTEM_UNKNOWN.
  met: true
  how: refusalOf picks SYSTEM_UNKNOWN when no readable code exists and the status is below 500.
- criterion: A 401 answer to an edit repeated after a refresh, whose body carries no readable error code, fails with SYSTEM_UNKNOWN.
  met: true
  how: entityEdit repeats once and hands the second answer to answerOf with no further 401 branch, so without a readable code it reaches refusalOf with status 401 and becomes SYSTEM_UNKNOWN.
- criterion: A SYSTEM_UNKNOWN failure carries the answer's status.
  met: true
  how: The httpStatus is response.status.
- criterion: A SYSTEM_UNKNOWN failure reads "Erro desconhecido do servidor."
  met: true
  how: In refusalOf, without a readable code the message is always the fallback text of the unknown branch, even when the body carries error.message.
nodes:
- node: contracts/entity-workspace/bff-entity-edit
  encoded_at:
  - src/features/entities/api/_edit-request.ts
  - src/features/entities/api/edit.hooks.ts
  - src/features/entities/api/_transforms.ts
  - src/features/entities/types.ts
  how: The accepted route is the POST with the encoded id and the body { reason, changes } with six members; each refusal of the contract has a branch (those without a readable code always use the contract's fixed text) in _edit-request.ts and the typed outcomes of edit.hooks.ts report conflict, refusal and unreachable.
- node: contracts/knowledge-base/entity-editing
  encoded_at:
  - src/features/entities/types.ts
  - src/features/entities/api/_transforms.ts
  how: 'The published contract: the client reads the 200 answer without envelope as { node_id, action_id, applied } and the refusal BUSINESS_ENTITY_EDIT_CONFLICT with details { attribute_key, item_id }; other codes pass through uninterpreted.'
- node: domain/knowledge-base/attribute-change
  encoded_at:
  - src/features/entities/types.ts
  - src/features/entities/api/_transforms.ts
  how: AttributeChange and AttributeChangeWire declare the six members attribute_key, kind, value, item_id, valid_from and valid_to, and toAttributeChangeWire always writes them.
- node: rules/entity-workspace/entity-workspace-requests-carry-the-access-token
  encoded_at:
  - src/features/entities/api/_edit-request.ts
  how: The edit clause is in sendOnce, which sends Authorization Bearer read from the store on each attempt; the reads' clause belongs to the reads' tasks.
- node: rules/entity-workspace/a-401-refreshes-the-token-and-repeats-the-request-once
  encoded_at:
  - src/features/entities/api/_edit-request.ts
  how: entityEdit handles a first-attempt 401 with one refreshSession and one repeat (a new sendOnce with a new 30000 ms cutoff and the new token); the repeat has no refresh branch, so no second refresh starts.
- node: rules/entity-workspace/a-change-writes-an-empty-member-as-null
  encoded_at:
  - src/features/entities/api/_transforms.ts
  how: memberOrNull turns absent, null and the empty string into null; a remove change writes null in value, valid_from and valid_to.
- node: rules/application-shell/a-request-is-cut-off-after-thirty-seconds
  encoded_at:
  - src/features/entities/api/_edit-request.ts
  how: The DEFAULT_TIMEOUT_MS (30000) cutoff is armed per attempt in sendOnce and the abort carries the DOMException 'Request timed out after 30s' (TimeoutError); an edit is not an ingestion.
- node: rules/application-shell/a-failed-refresh-ends-the-session
  encoded_at:
  - src/features/entities/api/_edit-request.ts
  how: On failure refreshSession runs useAuthStore.clear(), replaces the page with /sign-in?reason=session_expired and returns false; entityEdit then fails with AUTH_SESSION_EXPIRED.
inferences:
- inferred: The session refresh of the edit is rewritten in _edit-request.ts with fetchAccessToken and useAuthStore, and the redirect calls window.location.replace through a function of its own with a test hook, __setEditRedirectForTests.
  from: Neither src/lib/http.ts nor src/state/auth.ts exports a refresh helper (trySilentRefresh and redirectImpl are private in http.ts) and src/lib/http.ts could not be changed; the copy mirrors curation/api/_request.ts.
- inferred: Only SYSTEM_NETWORK and SYSTEM_TIMEOUT count as unreachable; SYSTEM_ABORTED, SYSTEM_SERVICE_UNAVAILABLE, SYSTEM_INVALID_RESPONSE, AUTH_SESSION_EXPIRED, SYSTEM_UPSTREAM and SYSTEM_UNKNOWN count as refused.
  from: The plan's note says only a request without an answer is unreachable and that SYSTEM_SERVICE_UNAVAILABLE is decided by no node; timeout and network are the two cases without an answer and a cancellation is the caller's act.
- inferred: The outcomes return as the value of mutationFn, never as a thrown error; only an error that is not an EnvelopeError is rethrown.
  from: 'The inventory''s risk: the global MutationCache.onError turns every BUSINESS_* into a warning toast, which would duplicate the inline handling of the conflict.'
- inferred: A conflict whose details carry no readable attribute_key is reported as a conflict with attributeKey null, not as a refusal.
  from: The criterion says every refusal with code BUSINESS_ENTITY_EDIT_CONFLICT is reported as a conflict; no node says what to do with malformed details.
- inferred: A refusal with a readable code but no string message uses the fixed text of the status branch (upstream or unknown).
  from: No node covers an absent message when a readable code exists; the fixed texts are those of the bff-entity-edit contract.
- inferred: Any 2xx, not only the 200, is read as the accepted answer, and an empty member is absent, null or the empty string.
  from: The advisory note says no 2xx beyond 200 has a declared answer; the UNDERDETERMINED note on null forbids the empty string for an empty member.
- inferred: A request with no token in the store goes without the Authorization header instead of failing before it is sent.
  from: The token rule does not decide what happens without a token and authHeader() already returns {} then.
- inferred: An accepted edit invalidates only entityKeys.node(nodeId), not the listing.
  from: The edit alters only the node's attributes (DAT-03 requires invalidating the affected keys and the screen reloads the form); no node says the listing shows any attribute.
divergences:
- from: 'inventory must_not_duplicate: the http<T>() wrapper and its refresh (src/lib/http.ts), plus the note ''do not add a third copy of the fetch wrapper'''
  departure: _edit-request.ts is a request of its own with a 30000 ms cutoff, refresh and failure reading, instead of calling http<T>().
  why: http<T>() returns a result only for an envelope with ok true and the accepted answer of the edit has no envelope; src/lib/http.ts may not be changed. The request reuses EnvelopeError, DEFAULT_TIMEOUT_MS, authHeader, fetchAccessToken and useAuthStore and copies only what is not exported.
preserved:
- src/lib/http.ts is unchanged (http, EnvelopeError, DEFAULT_TIMEOUT_MS, __setRedirectForTests).
- The reads of the entities feature (useNodeTypes, useNodeListing, useNodeRead, useAttributeKeys) keep their keys, transforms and behavior; _request.ts and keys.ts were not touched.
- The existing exports of types.ts and _transforms.ts stay as they were; the edits only add.
- authHeader() of curation/api/_request.ts is unchanged.
- The existing tests of entities/api/__tests__ and lib/__tests__/http.spec.ts stay valid because no file they exercise changed behavior.
deferred:
- what: The session refresh and the redirect to sign-in now exist in three private copies (http.ts, curation/_request.ts and _edit-request.ts).
  why: Unifying them would require exporting the shell's helper from src/lib/http.ts, which is outside this task and governed by the shell's rules.
- what: The edit screen that uses useEditEntity, the 5-second undo and the display of conflict and refusal.
  why: They belong to the tasks that implement the screen; this task delivers only the request and the hook.
---
## What it is
This record answers task/knowledge-base-client/edit-request.
It holds the edit request of the entities feature, its typed outcomes and the mutation hook.

## Notes
The first build, run/knowledge-base-client-edit-request-build, passed; the first suite run was red on one test over the message of a failure without a readable code, and the implementation was revised to the fixed text, after which run/knowledge-base-client-edit-request-build-2 passed.
