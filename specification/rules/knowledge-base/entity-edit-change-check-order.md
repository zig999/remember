---
type: invariant
statement: A change of an entity edit is checked for a well-formed change, then for an attribute key the catalog holds for the edited node's type, then for a value that reads as the key's value type, then for a value among the key's allowed values, then for its validity, then against the edited node's attributes of its key, and the edit is refused at the first check it fails.
constrains:
- domain/knowledge-base/entity-edit
- domain/knowledge-base/attribute-change
---

## Description

Covers which check refuses one change of an entity edit when that change fails more than one. The condition of each check belongs to its own rule, and what the edit answers for each belongs to contracts/knowledge-base/entity-editing. This rule does not order the checks of the edit as a whole, which are its reason and its knowledge node.
