---
title: Read the node types and the node listing
summary: The client requests that list the catalog's node types and a page of knowledge nodes narrowed by name prefix and node type.
rationale: I cut the listing's two reads apart from the node and catalog reads because they serve a different screen and change when that screen's narrowing changes.
sources:
- intake/scope.md
- intake/wire-facts.md
objective: The client returns the knowledge base's node types and the nodes it lists for a given name prefix and node type.
criteria:
- Node types are requested as GET /api/v1/node-types with no parameter.
- Each node type returned carries its identity, name, description and version.
- Nodes are requested as GET /api/v1/nodes.
- A name prefix given is sent as the name_prefix parameter.
- A node type given is sent by its name, not its identity, as the node_type parameter.
- A name prefix not given is left out of the request.
- An empty name prefix is left out of the request.
- A node type not given is left out of the request.
- An empty node type is left out of the request.
- Each node returned carries its identity, node-type name, canonical name, status and the node it was merged into, or null.
- The node listing returns the total the knowledge base reports.
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
- rules/entity-workspace/the-listing-request-carries-its-narrowings-by-name
- rules/entity-workspace/an-empty-narrowing-is-a-narrowing-not-given
- rules/application-shell/a-request-is-cut-off-after-thirty-seconds
- rules/application-shell/a-failed-refresh-ends-the-session
- rules/entity-workspace/a-401-refreshes-the-token-and-repeats-the-request-once
---
## What it is
The two reads the listing screen needs, mapped from the wire to the shape the screen consumes.

## Notes
It reuses http<T>() and authHeader() as the inventory names them, at src/lib/http.ts and src/features/curation/api/_request.ts, and adds no new fetch wrapper.
No node states whether the screen pages through more nodes than the default limit of 20, so this task sends no limit and no offset.
The wire facts say the response item field names were not checked against the backend.
UNDERDETERMINED, from the specification — No criterion requires the refresh that a first-attempt 401 starts, nor the repeat with the new token, the same options and a fresh cutoff, nor forbids a second refresh, and no task of the epic does. Passes: a client that never refreshes after a first 401.
UNDERDETERMINED, from the specification — The clauses of the failed-refresh rule that clear the stored token and replace the page with the sign-in address reach no criterion. Passes: a client that fails with AUTH_SESSION_EXPIRED but leaves the stored token and the page in place.
UNDERDETERMINED, from the specification — No criterion answers the cutoff's own English timeout wording of the shell rule. Passes: a client whose cutoff uses another abort reason and still reports SYSTEM_TIMEOUT in Portuguese.
REMAINDER, from the specification — The edit clause of the access-token rule belongs to the edit-request task.
ADVISORY, from the specification — No criterion sends or returns a limit or offset, so the page is whatever the knowledge base answers by default.
