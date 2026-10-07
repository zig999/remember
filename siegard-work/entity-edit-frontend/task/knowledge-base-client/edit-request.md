---
title: Send one entity edit and classify its answer
summary: The client request that sends the owner's edit and reports the knowledge base's answer as accepted, a conflict, another refusal or no answer.
rationale: I cut the write apart from the screen that sends it, so that the request and its consumers do not change in the same breath.
sources:
- intake/scope.md
- intake/wire-facts.md
objective: The client sends one entity edit and reports the answer as accepted, a conflict, another refusal or unreachable.
criteria:
- The edit is sent as POST /api/v1/nodes/{node_id}/edit, with the node identity in the path.
- The node identity in the edit's path is URL-encoded.
- The request carries the owner's token in the Authorization header as Bearer <token>.
- The body carries the reason.
- The body carries the changes as a list.
- Each change in the body carries attribute_key, kind, value, item_id, valid_from and valid_to.
- An HTTP 200 answer is read without an envelope as node_id, action_id and applied.
- An edit answered with a status that is not 2xx and a body carrying a readable error code fails with the answer's status.
- 'An edit answered with a status that is not 2xx and a body carrying a readable error code fails with the code read from error.code in the body { ok: false, error: { code, message, details } }.'
- An edit answered with a status that is not 2xx and a body carrying a readable error code fails with the message read from error.message in that body.
- An edit answered with a status that is not 2xx and a body carrying a readable error code fails with the details read from error.details in that body.
- A refusal with code BUSINESS_ENTITY_EDIT_CONFLICT is reported as a conflict.
- A conflict reports the attribute key its refusal's details name.
- A conflict reports the item its refusal's details name, or none where the details name none.
- An edit cut off after 30000 milliseconds without an answer fails with SYSTEM_TIMEOUT.
- A SYSTEM_TIMEOUT failure reads "Tempo limite excedido na requisição."
- An edit its caller cancels before an answer fails with SYSTEM_ABORTED.
- A SYSTEM_ABORTED failure reads "Requisição cancelada."
- An edit that gets no answer for a cause other than the cutoff or a cancellation fails with SYSTEM_NETWORK.
- A SYSTEM_NETWORK failure reads "Falha de rede ao contactar o servidor."
- An edit whose session refresh fails fails with AUTH_SESSION_EXPIRED.
- An AUTH_SESSION_EXPIRED failure carries status 401.
- An AUTH_SESSION_EXPIRED failure reads "Sua sessão expirou. Faça login novamente."
- An edit answered 2xx with a body that is not JSON fails with SYSTEM_INVALID_RESPONSE.
- A SYSTEM_INVALID_RESPONSE failure carries the answer's status.
- A SYSTEM_INVALID_RESPONSE failure reads "Resposta do servidor não é JSON válido."
- An edit answered with a status that is not 2xx, at 500 or above, and a body carrying no readable error code fails with SYSTEM_UPSTREAM.
- A SYSTEM_UPSTREAM failure carries the answer's status.
- A SYSTEM_UPSTREAM failure reads "Algo deu errado. Tente novamente."
- An edit answered with a status that is not 2xx, below 500, and a body carrying no readable error code fails with SYSTEM_UNKNOWN.
- A 401 answer to an edit repeated after a refresh, whose body carries no readable error code, fails with SYSTEM_UNKNOWN.
- A SYSTEM_UNKNOWN failure carries the answer's status.
- A SYSTEM_UNKNOWN failure reads "Erro desconhecido do servidor."
implements:
- contracts/entity-workspace/bff-entity-edit
- contracts/knowledge-base/entity-editing
- domain/knowledge-base/attribute-change
- rules/entity-workspace/entity-workspace-requests-carry-the-access-token
- rules/entity-workspace/a-401-refreshes-the-token-and-repeats-the-request-once
- rules/entity-workspace/a-change-writes-an-empty-member-as-null
- rules/application-shell/a-request-is-cut-off-after-thirty-seconds
- rules/application-shell/a-failed-refresh-ends-the-session
---
## What it is
The one write the entity workspace makes, together with the four kinds of outcome the screen needs to tell apart.

## Notes
The accepted answer has no envelope, while refusals do; the inventory says http<T>() unwraps envelopes and httpCuration reads bare bodies, and says not to add a third copy of the fetch wrapper.
The wire facts leave open whether a field without a value travels as null or is left out.
No node states whether SYSTEM_SERVICE_UNAVAILABLE counts as "cannot be reached" or as "refuses for any other cause"; this task treats only a request with no answer as unreachable.
UNDERDETERMINED, from the specification — No criterion states that a first-attempt 401 starts one refresh and repeats the edit once with a fresh 30000-millisecond cutoff, never refreshing twice. Passes: an edit request that never refreshes and fails at once on a first-attempt 401, or that refreshes twice.
UNDERDETERMINED, from the specification — The criteria answer only the AUTH_SESSION_EXPIRED code of a failed refresh, not the clearing of the stored token or the redirect to sign-in. Passes: a request that fails with AUTH_SESSION_EXPIRED but leaves the stored token and the page in place.
UNDERDETERMINED, from the specification — The criterion that each change carries the six members does not say that an empty member is JSON null or that a remove change carries null in value, valid_from and valid_to. Passes: a request that writes an empty string in an empty member or sends a remove change with the field's last value.
UNDERDETERMINED, from the specification — No criterion addresses the cutoff's own English timeout wording of the shell rule. Passes: a cutoff whose timeout reads anything other than Request timed out after 30s while still reported as SYSTEM_TIMEOUT.
REMAINDER, from the specification — The read clauses of the access-token and refresh rules belong to the tasks that implement the entity workspace's reads.
ADVISORY, from the specification — The criterion for the accepted answer reads applied only as a member, not its entries of attribute_key, effect, item_id and predecessor_id, and no answer is stated for a 2xx other than 200.
