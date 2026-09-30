---
type: invariant
statement: A compliance-deletion or curation-action listing holds only records whose recorded time is at or after its window's start and strictly before its window's end.
constrains:
- domain/knowledge-base/compliance-deletion-filter
- domain/knowledge-base/curation-action-filter
---

## Description

A compliance deletion's recorded time is its execution time, and a curation action's is its creation time.
