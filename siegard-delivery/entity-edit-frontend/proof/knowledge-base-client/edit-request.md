---
target: frontend
title: Proof for the entity edit request and its typed outcomes
summary: Six spec files under src/features/entities/api/__tests__ send the edit through a stubbed fetch, drive the real entityEdit and useEditEntity, and hold up each criterion and the four UNDERDETERMINED entries.
implementation: sha256:2c18e1938fffbc1995eef23a7e45373a2debad5f5cf4837cca4b25e7f4695274
standard:
  at: ../standards/frontend-react.yaml
  pin: sha256:2b03615161995450265523de6bdd9c464b2ca633976e832e36586c1ab1aa2cf7
run: run/knowledge-base-client-edit-request-suite-2
tests:
- file: src/features/entities/api/__tests__/edit-request-sending.spec.ts
  name: is sent as POST /api/v1/nodes/{node_id}/edit with the node identity in the path
  proves: The edit is sent as POST /api/v1/nodes/{node_id}/edit, with the node identity in the path.
  fails_when: the method is not POST, or the path is not /api/v1/nodes/{node_id}/edit with the identity in that segment.
- file: src/features/entities/api/__tests__/edit-request-sending.spec.ts
  name: URL-encodes the node identity in the path
  proves: The node identity in the edit's path is URL-encoded.
  fails_when: an identity holding a slash, space, question mark, hash or non-ASCII letter reaches the path unencoded, so the path splits or truncates.
- file: src/features/entities/api/__tests__/edit-request-sending.spec.ts
  name: carries the owner's token in the Authorization header as Bearer <token>
  proves: The request carries the owner's token in the Authorization header as Bearer <token>.
  fails_when: the edit sends no Authorization header, sends the token without the Bearer prefix, or sends a token other than the one the store holds.
- file: src/features/entities/api/__tests__/edit-request-sending.spec.ts
  name: reads an HTTP 200 answer without an envelope as node_id, action_id and applied
  proves: An HTTP 200 answer is read without an envelope as node_id, action_id and applied.
  fails_when: the answer is read through an envelope (ok/result), or node_id, action_id or applied is dropped, renamed or altered.
- file: src/features/entities/api/__tests__/edit-request-wire.spec.ts
  name: carries the reason
  proves: The body carries the reason.
  fails_when: the body omits the reason or carries a different text than the one given to the hook.
- file: src/features/entities/api/__tests__/edit-request-wire.spec.ts
  name: carries the changes as a list
  proves: The body carries the changes as a list.
  fails_when: the changes member is absent, is not an array, or drops a change.
- file: src/features/entities/api/__tests__/edit-request-wire.spec.ts
  name: writes the six members of every change, JSON null in every empty member and null in value and validity of a remove change
  proves: 'Each change in the body carries attribute_key, kind, value, item_id, valid_from and valid_to. UNDERDETERMINED entry 3: an empty member is JSON null, and a remove change carries null in value, valid_from and valid_to. The five changes cover an empty member that is absent, null and the empty string, a set change that keeps every member it holds, and a remove change that was handed its last value, item and dates.'
  fails_when: a member is omitted instead of null, an empty string is written for an empty member, a remove change sends the field's last value or validity, a set change loses a member it holds, or item_id is nulled on a remove change.
  demonstrates: rules/entity-workspace/a-change-writes-an-empty-member-as-null
- file: src/features/entities/api/__tests__/edit-request-failures.spec.ts
  name: fails with the status, code, message and details read from $name
  proves: A non-2xx answer whose body carries a readable error code fails with the answer's status, the code read from error.code, the message read from error.message and the details read from error.details. The two cases are a 422 refusal and a 500 refusal, so a readable code at 500 or above is not replaced by SYSTEM_UPSTREAM.
  fails_when: the failure carries a status other than the answer's, a code other than error.code, a message other than error.message, details other than error.details, or a readable code at 500 or above is replaced by SYSTEM_UPSTREAM.
- file: src/features/entities/api/__tests__/edit-request-failures.spec.ts
  name: fails with SYSTEM_INVALID_RESPONSE carrying the answer's status when a 2xx answer is not JSON
  proves: An edit answered 2xx with a body that is not JSON fails with SYSTEM_INVALID_RESPONSE, carries the answer's status, and reads "Resposta do servidor não é JSON válido."
  fails_when: a non-JSON 2xx is accepted, fails with another code, carries a status other than the answer's, or reads another message.
- file: src/features/entities/api/__tests__/edit-request-failures.spec.ts
  name: fails with $code, the answer's status and its fixed message when the answer is $name
  proves: A non-2xx answer with no readable error code fails with SYSTEM_UPSTREAM at 500 or above and with SYSTEM_UNKNOWN below 500, each carrying the answer's status and its fixed message ("Algo deu errado. Tente novamente." and "Erro desconhecido do servidor."). The cases are 500 and 499 with a non-JSON body, 502 with a JSON body that has no error member, and 404 with an error.code that is not a string.
  fails_when: the 500 boundary moves, a body without a readable code takes the wrong code, the status differs from the answer's, or the fixed message differs.
- file: src/features/entities/api/__tests__/edit-request-failures.spec.ts
  name: reads the fixed upstream message when a 5xx body carries a message but no readable error code
  proves: A SYSTEM_UPSTREAM failure reads "Algo deu errado. Tente novamente." when the body carries no readable error code, whatever else it carries.
  fails_when: a body with error.message and no error.code makes the SYSTEM_UPSTREAM failure read the body's message instead of the fixed text.
- file: src/features/entities/api/__tests__/edit-request-failures.spec.ts
  name: fails with SYSTEM_ABORTED reading Requisição cancelada. when its caller cancels before an answer
  proves: An edit its caller cancels before an answer fails with SYSTEM_ABORTED reading "Requisição cancelada."
  fails_when: a caller's cancellation is reported as SYSTEM_NETWORK or SYSTEM_TIMEOUT, is not relayed to the request, or reads another message.
- file: src/features/entities/api/__tests__/edit-request-failures.spec.ts
  name: fails with SYSTEM_NETWORK reading Falha de rede ao contactar o servidor. when it gets no answer for another cause
  proves: An edit that gets no answer for a cause other than the cutoff or a cancellation fails with SYSTEM_NETWORK reading "Falha de rede ao contactar o servidor."
  fails_when: a rejected fetch is reported as SYSTEM_ABORTED or SYSTEM_TIMEOUT, is rethrown raw, or reads another message.
- file: src/features/entities/api/__tests__/edit-request-session.spec.ts
  name: starts one refresh and repeats the edit once with the new token, the same options and a fresh cutoff, never starting a second refresh
  proves: 'UNDERDETERMINED entry 1: a first-attempt 401 starts exactly one refresh and one repeat with a fresh 30000 ms cutoff, the new token and the same method, URL and body, and never a second refresh. The first attempt is answered 401 at 20 s and the repeat at 29 s, so the repeat outlives the first attempt''s cutoff only if its own cutoff is fresh, and the repeat is answered 401 so that a second refresh would show.'
  fails_when: the edit never refreshes and fails on the first 401, refreshes twice, repeats more than once, repeats with the old token, repeats a different method, URL or body, or repeats under the first attempt's remaining cutoff.
- file: src/features/entities/api/__tests__/edit-request-session.spec.ts
  name: fails with SYSTEM_UNKNOWN carrying status 401 when the repeat after a refresh is answered 401 with no readable error code
  proves: A 401 answer to an edit repeated after a refresh, whose body carries no readable error code, fails with SYSTEM_UNKNOWN, carries status 401 and reads "Erro desconhecido do servidor."
  fails_when: the second 401 fails with AUTH_SESSION_EXPIRED or triggers another refresh, or the failure carries another status or message.
- file: src/features/entities/api/__tests__/edit-request-session.spec.ts
  name: clears the stored token, replaces the page with /sign-in?reason=session_expired and fails with AUTH_SESSION_EXPIRED
  proves: 'UNDERDETERMINED entry 2 and the rule that a failed refresh ends the session: the stored token is cleared, the page is replaced with the sign-in address and the reason session_expired exactly once, and the caller gets AUTH_SESSION_EXPIRED.'
  fails_when: the stored token stays, the page is not replaced, the address or the reason differs, the page is replaced more than once, or the failure carries another code.
  demonstrates: rules/application-shell/a-failed-refresh-ends-the-session
- file: src/features/entities/api/__tests__/edit-request-session.spec.ts
  name: fails carrying status 401 and reading Sua sessão expirou. Faça login novamente.
  proves: An AUTH_SESSION_EXPIRED failure carries status 401 and reads "Sua sessão expirou. Faça login novamente."
  fails_when: the failure carries a status other than 401 or reads another message.
- file: src/features/entities/api/__tests__/edit-request-cutoff.spec.ts
  name: is cut off at 30000 ms and not before, with the abort reading Request timed out after 30s and the failure SYSTEM_TIMEOUT
  proves: 'An edit cut off after 30000 milliseconds without an answer fails with SYSTEM_TIMEOUT. UNDERDETERMINED entry 4: the cutoff''s own abort reads "Request timed out after 30s" while the failure is SYSTEM_TIMEOUT. The abort is observed at 29999 ms (not aborted) and at 30000 ms (aborted).'
  fails_when: the cutoff fires before or after 30000 ms, the abort reads other than "Request timed out after 30s", or the cutoff is reported with a code other than SYSTEM_TIMEOUT.
  demonstrates: rules/application-shell/a-request-is-cut-off-after-thirty-seconds
- file: src/features/entities/api/__tests__/edit-request-cutoff.spec.ts
  name: fails with SYSTEM_TIMEOUT reading Tempo limite excedido na requisição.
  proves: A SYSTEM_TIMEOUT failure reads "Tempo limite excedido na requisição."
  fails_when: the timeout failure reads another message, for example the English abort wording.
- file: src/features/entities/api/__tests__/edit-outcomes.spec.ts
  name: is accepted with the node, the action and what was applied when the edit is answered 200
  proves: The client reports an HTTP 200 answer as accepted, with the node, the action and each applied change (attribute key, effect, item, predecessor with null kept).
  fails_when: a 200 is reported as a refusal or throws, or the node, the action or an applied entry is dropped or mapped from the wrong wire member.
- file: src/features/entities/api/__tests__/edit-outcomes.spec.ts
  name: is a conflict naming the attribute key and the item its refusal's details name
  proves: A refusal with code BUSINESS_ENTITY_EDIT_CONFLICT is reported as a conflict, and the conflict reports the attribute key and the item its refusal's details name.
  fails_when: the conflict code is reported as a refusal or thrown, or the key or the item is read from the wrong member of the details.
- file: src/features/entities/api/__tests__/edit-outcomes.spec.ts
  name: is a conflict with no item where its refusal's details name none
  proves: A conflict reports no item where the refusal's details name none (item_id null).
  fails_when: a null item_id turns into a string, an empty string or an undefined item instead of none, or the conflict becomes a refusal.
- file: src/features/entities/api/__tests__/edit-outcomes.spec.ts
  name: is a refusal carrying the status, code, message and details when another code is refused, even at 409
  proves: Any other refusal is reported as a refusal with the status, code, message and details, and the conflict is told by its code, not by the 409 status (BUSINESS_ENTITY_EDIT_DISPUTED at 409).
  fails_when: another 409 is reported as a conflict, the refusal drops its code, status, message or details, or the refusal is thrown.
- file: src/features/entities/api/__tests__/edit-outcomes.spec.ts
  name: is unreachable with SYSTEM_NETWORK when the edit gets no answer
  proves: An edit with no answer for a cause other than the cutoff is reported as unreachable with SYSTEM_NETWORK.
  fails_when: SYSTEM_NETWORK is reported as a refusal, or thrown instead of returned as an outcome.
- file: src/features/entities/api/__tests__/edit-outcomes.spec.ts
  name: is unreachable with SYSTEM_TIMEOUT when the edit is cut off
  proves: An edit cut off after 30000 ms is reported as unreachable with SYSTEM_TIMEOUT.
  fails_when: SYSTEM_TIMEOUT is reported as a refusal, or thrown instead of returned as an outcome.
- file: src/features/entities/api/__tests__/edit-outcomes.spec.ts
  name: invalidates the node's queries when the edit is accepted
  proves: An accepted edit invalidates the queries under entityKeys.node(nodeId), so the screen reloads what the edit changed.
  fails_when: an accepted edit leaves the node's cached read marked fresh, or invalidates another key than the edited node's.
files:
- path: src/features/entities/api/__tests__/edit-support.ts
  effect: 'a helper the edit specs share, beside support.ts, which stays unchanged: the fixture edit and accepted answer, a refusal-body builder, failureOf (an edit''s failure as facts), sentBody (the JSON body fetch received), and a mount of useEditEntity under a QueryClientProvider with outcomeOf (the outcome inside act, optionally advancing fake timers).'
not_applicable:
- edge_case: a caller that cancelled before the request starts (an already-aborted signal)
  why: it is the same class as cancelling in flight, "before an answer", and one representative is tested; a second test would be the same evidence twice.
- edge_case: an empty reason or an empty list of changes
  why: no criterion or node of this task states what the client does for either, and the refusal of one is the knowledge base's 422, which the readable-code failure test covers as an answer class.
- edge_case: a request made while the application holds no token
  why: the access-token rule says it does not cover that case and no criterion states it; the implementation's choice goes to untested.
- edge_case: a 2xx other than 200
  why: the task's advisory says no answer is stated for one; the implementation's choice goes to untested.
- edge_case: a successful refresh also redirecting, or a refresh succeeding and the page staying
  why: the rules constrain only what a failed refresh does, and the first-attempt test already ends with no redirect-bearing failure; no criterion states what a successful refresh leaves alone.
- edge_case: two edits against one node at once
  why: no criterion or node states concurrent behavior of the client; the conflict outcome is the knowledge base's answer to the case and is covered as an answer class.
- edge_case: a duplicate where uniqueness is claimed, and an empty collection coming back
  why: no criterion or node claims uniqueness, and an empty applied list is only a map over the answer, which the accepted test covers.
- edge_case: a slow dependency
  why: the slow answer is the 30000 ms cutoff, tested at 29999 and 30000 ms, and the repeat's fresh cutoff is tested in the 401 test.
untested:
- 'contracts/entity-workspace/bff-entity-edit: its fact is the request form plus eleven answers, each needing its own setup (timers, cancellation, a refresh that fails, a 2xx that is not JSON). Each row is proved by its own test above, but no single test decides the whole without becoming a sequence of unrelated setups, so the node is claimed by no test.'
- 'contracts/knowledge-base/entity-editing: it is the backend''s published contract, of which this client reads only the 200 answer and the conflict refusal, so whether the knowledge base answers as it states belongs to the publisher''s proof.'
- 'domain/knowledge-base/attribute-change: it declares the six members of a change. The null test asserts all six on the wire, but it demonstrates the empty-member rule, and a test names one node, so the shape is not claimed a second time.'
- 'rules/entity-workspace/entity-workspace-requests-carry-the-access-token: the rule covers every read and every edit. The edit''s Bearer header is proved here and the reads'' by the earlier tasks'' tests, so no test of this task claims the node''s totality.'
- 'rules/entity-workspace/a-401-refreshes-the-token-and-repeats-the-request-once: the rule covers every read and every edit. The edit''s one refresh and repeat is proved here (UNDERDETERMINED entry 1) and the reads'' by the earlier tasks, so no test of this task claims the node''s totality.'
- 'Inferred behavior decided by no node: only SYSTEM_NETWORK and SYSTEM_TIMEOUT are unreachable, and SYSTEM_ABORTED, SYSTEM_SERVICE_UNAVAILABLE, SYSTEM_INVALID_RESPONSE, AUTH_SESSION_EXPIRED, SYSTEM_UPSTREAM and SYSTEM_UNKNOWN are refusals. No test asserts those, because the task''s note says no node decides SYSTEM_SERVICE_UNAVAILABLE.'
- 'Inferred behavior decided by no node: a conflict whose details carry no readable attribute_key is a conflict with attributeKey null; a refusal with a readable code and no string message takes the fixed text of the status branch; any 2xx is read as accepted; a request with no token goes without the Authorization header; an accepted edit invalidates only entityKeys.node(nodeId) and not the listing.'
- 'Inferred channel: the hook returns outcomes as the mutation''s value and never throws one. Every outcome test observes the value, but no test pins that the global MutationCache error handler (the toast for BUSINESS_*) is never reached, because the handler is not part of this task.'
- 'Arrangement of the typed outcomes: the member names kind, nodeId, actionId, applied, attributeKey, itemId, predecessorId and failure are the implementation''s naming. The tests read them as the interface later screens use, with toMatchObject, so extra members are neither required nor forbidden. The ADVISORY on the entries of applied is passed through only.'
- 'The REMAINDER of the task: the read clauses of the access-token and refresh rules belong to the tasks that implement the entity workspace''s reads.'
---
## What it is
This record proves task/knowledge-base-client/edit-request.
It holds six spec files and one shared helper, and reuses the entities harness (support.ts) unchanged.

## Notes
The run run/knowledge-base-client-edit-request-suite was red on one test, the fixed upstream message when a body carries a message but no readable error code; the test author had recorded it as contested, the implementation was revised to the fixed text the criterion states, and run/knowledge-base-client-edit-request-suite-2 passed with no contested entry left.
