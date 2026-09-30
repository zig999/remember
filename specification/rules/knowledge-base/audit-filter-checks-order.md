---
type: invariant
statement: A compliance deletion or an audit listing whose request fails several checks of form is refused for an unordered time window first, then for a missing field, then for a reason out of range, then for any other malformed field.
constrains:
- domain/knowledge-base/compliance-deletion
- domain/knowledge-base/compliance-deletion-filter
- domain/knowledge-base/curation-action-filter
---

## Description

An audit listing is a listing of compliance deletions or of curation actions.
