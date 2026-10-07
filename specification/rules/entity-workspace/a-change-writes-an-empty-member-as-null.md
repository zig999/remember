---
type: invariant
statement: "The save MUST send each change with its value, item_id, valid_from and valid_to members always present, writing JSON null in every member that holds nothing, and MUST send a remove change with null in its value, valid_from and valid_to."
constrains:
- domain/entity-workspace/entity-edit-session
---

## Description

This rule covers how each change in the edit request writes a member that holds nothing, and what a remove change carries in its value and validity. Which changes the save sends, and what a set change carries, is set by rules/entity-workspace/save-sends-one-change-per-changed-field. The attribute a remove change names in item_id is set by rules/knowledge-base/entity-edit-removal-names-an-attribute. How the knowledge base refuses a malformed member is set by contracts/knowledge-base/entity-editing.
