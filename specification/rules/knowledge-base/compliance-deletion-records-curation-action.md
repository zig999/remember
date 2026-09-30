---
type: policy
statement: A compliance deletion that deletes its raw information records one curation action of kind compliance-delete on target kind raw-information at that raw information's identity, with the deletion's reason as its reason and the reason and affected counts as its payload.
constrains:
- domain/knowledge-base/compliance-deletion
- domain/knowledge-base/curation-action
- domain/knowledge-base/curation-action-kind
- domain/knowledge-base/curation-target-kind
consistency: eventual
---

## Description

None.
