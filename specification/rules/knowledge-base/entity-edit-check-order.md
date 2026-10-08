---
type: invariant
statement: An entity edit is checked for a well-formed request, its reason's length and every change's form included, then for an existing knowledge node, then for an active one, then change by change in the order given, and is refused at the first check it fails.
constrains:
- domain/knowledge-base/entity-edit
- domain/knowledge-base/attribute-change
- domain/knowledge-base/knowledge-node
---

## Description

Covers which check refuses an entity edit that fails more than one, across its request, its knowledge node and its changes. The order of the checks inside one change belongs to rules/knowledge-base/entity-edit-change-check-order. The condition of each check belongs to its own rule. What the edit answers for each refusal belongs to contracts/knowledge-base/entity-editing.
