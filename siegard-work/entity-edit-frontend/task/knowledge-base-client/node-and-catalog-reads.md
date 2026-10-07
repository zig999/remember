---
title: Read one node and the catalog's attribute keys
summary: The client requests that read one knowledge node with its attributes and list the attribute keys the catalog holds for a node type.
rationale: I cut the form's two reads apart from the listing's because they serve the form and change when what the form draws from the node or the catalog changes.
sources:
- intake/scope.md
- intake/wire-facts.md
objective: The client returns one knowledge node with its attributes and the catalog's attribute keys for that node's type.
criteria:
- A node is requested as GET /api/v1/nodes/{node_id}, with the node identity in the path.
- The node identity in the node read's path is URL-encoded.
- The node read carries no query parameter.
- The node read returns the node's summary, its aliases and its attributes.
- Each attribute returned carries its identity, attribute-key name, value, validity start, validity end, status and whether it is current.
- Attribute keys are requested as GET /api/v1/attribute-keys, with the node type's name as the node_type parameter.
- Each attribute key returned carries its key, value type, whether it is temporal, whether it allows multiple current values and its description.
- An attribute key the catalog closes is returned with its allowed values.
- Attribute keys are returned in the order the catalog lists them.
- A node read refused with RESOURCE_NOT_FOUND fails with that code.
- Every request carries the owner's token in the Authorization header as Bearer <token>.
- A read answered 2xx with a JSON body whose ok is not true is a refused read, not an accepted one.
- A refused read whose body carries a readable error code fails with the answer's status.
- 'A refused read whose body carries a readable error code fails with the code read from error.code in the body { ok: false, error: { code, message, details } }.'
- A refused read whose body carries a readable error code fails with the message read from error.message in that body.
- A refused read whose body carries a readable error code fails with the details read from error.details in that body.
- A read cut off after 30000 milliseconds without an answer fails with SYSTEM_TIMEOUT.
- A SYSTEM_TIMEOUT failure reads "Tempo limite excedido na requisição."
- A read its caller cancels before an answer fails with SYSTEM_ABORTED.
- A SYSTEM_ABORTED failure reads "Requisição cancelada."
- A read that gets no answer for a cause other than the cutoff or a cancellation fails with SYSTEM_NETWORK.
- A SYSTEM_NETWORK failure reads "Falha de rede ao contactar o servidor."
- A read whose session refresh fails fails with AUTH_SESSION_EXPIRED.
- An AUTH_SESSION_EXPIRED failure carries status 401.
- An AUTH_SESSION_EXPIRED failure reads "Sua sessão expirou. Faça login novamente."
- A read answered 2xx with a body that is not JSON fails with SYSTEM_INVALID_RESPONSE.
- A SYSTEM_INVALID_RESPONSE failure carries the answer's status.
- A SYSTEM_INVALID_RESPONSE failure reads "Resposta do servidor não é JSON válido."
- A refused read at status 500 or above whose body carries no readable error code fails with SYSTEM_UPSTREAM.
- A SYSTEM_UPSTREAM failure carries the answer's status.
- A SYSTEM_UPSTREAM failure reads "Algo deu errado. Tente novamente."
- A refused read below status 500 whose body carries no readable error code fails with SYSTEM_UNKNOWN.
- A 401 answer to a read repeated after a refresh, whose body carries no readable error code, fails with SYSTEM_UNKNOWN.
- A SYSTEM_UNKNOWN failure carries the answer's status.
- A SYSTEM_UNKNOWN failure reads "Erro desconhecido do servidor."
implements:
- contracts/entity-workspace/bff-entity-reads
- contracts/knowledge-base/retrieval
- rules/entity-workspace/entity-workspace-requests-carry-the-access-token
- rules/application-shell/a-request-is-cut-off-after-thirty-seconds
- rules/application-shell/a-failed-refresh-ends-the-session
- rules/entity-workspace/a-401-refreshes-the-token-and-repeats-the-request-once
---
## What it is
The two reads the entity form is drawn from, mapped from the wire to the shape the form consumes.

## Notes
The wire facts say the response item field names were not checked against the backend.
No node states whether each allowed value carries a label and a sort order; the backend session isolated this as a contradiction.
The inventory records that graph and curation already read node detail under the "nodes" query prefix.
UNDERDETERMINED, from the specification — No criterion requires the refresh itself that a first-attempt 401 starts, nor the repeat with the new token, the same options and a fresh 30000-millisecond cutoff, nor forbids a second refresh. Passes: a read client that never refreshes after a first 401.
UNDERDETERMINED, from the specification — The clauses of the failed-refresh rule that clear the stored token and replace the page with the sign-in address reach no criterion. Passes: a read client that fails with AUTH_SESSION_EXPIRED but leaves the stored token in place and the page where it is.
UNDERDETERMINED, from the specification — No criterion answers the cutoff's own English timeout wording of the shell rule. Passes: a read client whose cutoff at 30000 milliseconds uses another abort reason and still reports SYSTEM_TIMEOUT in Portuguese.
ADVISORY, from the specification — The criterion that attribute keys come in the order the catalog lists them is read as bff-entity-reads states it, by node type name and then by key.
