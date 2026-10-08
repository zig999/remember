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
- Every read is made through the http function of src/lib/http.ts, not through a fetch wrapper of its own.
- A failed read fails with the status the http function gives for that answer.
- A failed read fails with the code the http function gives for that answer.
- A failed read fails with the message the http function gives for that answer.
- A failed read fails with the details the http function gives for that answer.
implements:
- contracts/entity-workspace/bff-entity-reads
- contracts/knowledge-base/retrieval
- rules/entity-workspace/entity-workspace-requests-carry-the-access-token
- rules/entity-workspace/the-listing-request-carries-its-narrowings-by-name
- rules/entity-workspace/an-empty-narrowing-is-a-narrowing-not-given
- rules/entity-workspace/a-401-refreshes-the-token-and-repeats-the-request-once
---
## What it is
The two reads the listing screen needs, mapped from the wire to the shape the screen consumes.

## Notes
It reuses http<T>() and authHeader() as the inventory names them, at src/lib/http.ts and src/features/curation/api/_request.ts, and adds no new fetch wrapper.
No node states whether the screen pages through more nodes than the default limit of 20, so this task sends no limit and no offset.
The wire facts say the response item field names were not checked against the backend.
UNDERDETERMINED, from the specification — No criterion requires the refresh that a first-attempt 401 starts, nor the repeat with the new token, the same options and a fresh cutoff. Passes: a read that builds the Authorization header once from the stored token and hands it to the http function as a fixed header, so a repeat after a refresh sends the stale token.
REMAINDER, from the specification — The edit clauses of the access-token rule and of the 401 rule belong to the edit-request task.
ADVISORY, from the specification — contracts/entity-workspace/bff-entity-reads states the failures as the application's request helper, backed by rules/application-shell/a-request-is-judged-in-a-fixed-order, outside the candidates, and the criteria pass the helper's failures through without reading them.
ADVISORY, from the specification — No criterion sends a limit or offset, so the listing returns the knowledge base's first page at its default size.
Decision, beyond the covers — stand: rules/application-shell/a-request-is-judged-in-a-fixed-order is not claimed by the epic, because the shell's request helper carries it out for every screen and the contract bff-entity-reads cites it, and no task of this epic implements it.
