---
title: Client of the knowledge base's entity reads and edit
summary: The four reads and the one write the entity workspace makes of the knowledge base, mapped from the wire the backend answers.
rationale: The scope lists the two consumed contracts with the rest of the context and does not say how to cut them. I gave the reads and the edit an epic of their own so that the screens that consume them sit on the other side of one seam, and the client changes only when the wire changes.
sources:
- intake/scope.md
- intake/wire-facts.md
covers:
- contracts/entity-workspace/bff-entity-reads
- contracts/entity-workspace/bff-entity-edit
- contracts/knowledge-base/retrieval
- contracts/knowledge-base/entity-editing
- domain/knowledge-base/attribute-change
- rules/entity-workspace/entity-workspace-requests-carry-the-access-token
- rules/entity-workspace/the-listing-request-carries-its-narrowings-by-name
- rules/application-shell/a-request-is-cut-off-after-thirty-seconds
- rules/application-shell/a-failed-refresh-ends-the-session
- rules/entity-workspace/a-401-refreshes-the-token-and-repeats-the-request-once
- rules/entity-workspace/an-empty-narrowing-is-a-narrowing-not-given
- rules/entity-workspace/a-change-writes-an-empty-member-as-null
---
## What it is
The client requests that list node types and nodes, read one node, list the catalog's attribute keys and send one entity edit.
It is the only place in the frontend that knows the paths, parameters and answer shapes of these five operations.

## Notes
The retrieval and entity-editing contracts are covered because their answers are what the client reads; the backend that publishes them is outside the scope.
The wire facts were supplied by the person from the backend session, and their response item field names were read from contract prose without being checked against the backend.
