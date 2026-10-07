---
type: policy
statement: "An accepted entity edit records one curation action of kind edit-entity on target kind node at the edited node's identity, with its reason as the reason and its applied changes as the payload."
constrains:
- domain/knowledge-base/entity-edit
- domain/knowledge-base/applied-change
- domain/knowledge-base/curation-action
- domain/knowledge-base/curation-action-kind
- domain/knowledge-base/curation-target-kind
consistency: eventual
---

## Description

None.
