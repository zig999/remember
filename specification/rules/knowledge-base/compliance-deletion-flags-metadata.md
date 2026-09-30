---
type: policy
statement: A compliance deletion adds compliance_deleted set to true to its raw information's metadata and keeps every other metadata key.
constrains:
- domain/knowledge-base/compliance-deletion
- domain/knowledge-base/raw-information
consistency: eventual
---

## Description

None.
