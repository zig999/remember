---
title: Read the knowledge base's answers by the member names it sends
summary: A correction of three members of the knowledge base's answers that the client read under names the backend does not send.
rationale: 'A corrective increment named by the person: the wrong behavior was observed by reading the backend now on main, and it answers to no criterion of the epics already delivered.'
sources:
- intake/wire-names-correction.md
covers:
- contracts/entity-workspace/bff-entity-reads
- contracts/knowledge-base/retrieval
- contracts/entity-workspace/bff-entity-edit
- contracts/knowledge-base/entity-editing
- domain/knowledge-base/attribute-key
- domain/knowledge-base/knowledge-node
- domain/knowledge-base/edit-effect
- rules/knowledge-base/an-edit-effect-crosses-the-wire-with-underscores
---
## What it is
The client's reading of three members of the knowledge base's answers: the multiple-current-values flag of an attribute key, the merged-into identity of a listed node and the effect of an applied change.

## Notes
The epic exists apart from the delivered knowledge-base-client epic so that the correction claims exactly what it answers to and re-opens no delivered task.
