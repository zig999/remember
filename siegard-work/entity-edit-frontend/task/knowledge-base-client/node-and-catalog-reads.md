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
- Attribute keys are requested as GET /api/v1/attribute-keys.
- The node type is sent by its name, not its identity, as the node_type parameter of the attribute-key listing.
- Each attribute key returned carries its key, value type, whether it is temporal, whether it allows multiple current values and its description.
- An attribute key the catalog closes is returned with its allowed values.
- Attribute keys are returned in the order the catalog lists them.
- A node read refused with RESOURCE_NOT_FOUND fails with that code.
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
- rules/entity-workspace/a-401-refreshes-the-token-and-repeats-the-request-once
---
## What it is
The two reads the entity form is drawn from, mapped from the wire to the shape the form consumes.

## Notes
The wire facts say the response item field names were not checked against the backend.
No node states whether each allowed value carries a label and a sort order; the backend session isolated this as a contradiction.
The inventory records that graph and curation already read node detail under the "nodes" query prefix.
UNDERDETERMINED, from the specification — No criterion answers the refresh and repeat of a first-attempt 401 with the new token. Passes: a read that builds the Authorization header once and passes it in the request options, so the helper's repeat sends the refused token.
REMAINDER, from the specification — The edit clause and the node-type and node-listing reads of the access-token rule belong to other tasks of the epic.
REMAINDER, from the specification — The helper's cutoff and its failed-refresh clauses belong to the application shell's request helper, and this task gets them by delegating to the http function.
ADVISORY, from the specification — The criteria name fewer members of a read-node attribute and an attribute-key item than the retrieval contract gives, which is a narrowing the skeleton chose.
ADVISORY, from the specification — contracts/entity-workspace/bff-entity-reads defers every read failure to the application's request helper, citing rules/application-shell/a-request-is-judged-in-a-fixed-order, which is not among the candidates.
Decision, beyond the covers — stand: rules/application-shell/a-request-is-judged-in-a-fixed-order is not claimed by the epic, because the shell's request helper carries it out for every screen and the contract bff-entity-reads cites it, and no task of this epic implements it.
