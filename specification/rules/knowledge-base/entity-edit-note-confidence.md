---
type: policy
statement: "The information fragment an entity edit records is recorded at confidence 1.0."
constrains:
- domain/knowledge-base/entity-edit
- domain/knowledge-base/information-fragment
consistency: eventual
---

## Description

This rule sets the confidence of the note an entity edit records. What that note holds is set by rules/knowledge-base/entity-edit-note. The run that holds it is set by rules/knowledge-base/entity-edit-note-run. The confidence of the attributes the edit records is set by rules/knowledge-base/entity-edit-new-attribute-state.
