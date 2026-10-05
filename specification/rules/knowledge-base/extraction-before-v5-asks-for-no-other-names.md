---
type: invariant
statement: Under prompt versions v1 to v4, an extraction does not ask the model to propose other names of an entity with each node.
constrains:
- domain/knowledge-base/llm-run
- domain/knowledge-base/prompt-version
---

## Description

Governs what an extraction under prompt versions v1 to v4 leaves out of its instructions about a node's other names. What an extraction under v5 and later asks for is governed by rules/knowledge-base/extraction-asks-for-other-names. Whether a proposed alias is recorded on its node is governed by rules/knowledge-base/new-node-aliases and rules/knowledge-base/matched-node-gains-only-aliases.
