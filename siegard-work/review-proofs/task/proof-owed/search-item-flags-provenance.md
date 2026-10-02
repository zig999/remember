---
title: A search item's flags, provenance and non-empty provenance are proven
summary: A search item carries only assertion-flag values in its flags, names existing supporting fragments in its provenance, and is never answered with empty provenance.
sources:
- intake/scope.md
objective: The flags, the provenance entries and the non-empty provenance of a search item are decided by a test.
criteria:
- A search whose matched item has confidence in the uncertain band should answer that item with flags holding only assertion-flag values, including the expected one.
- For every item of each kind, each provenance entry should name an information fragment that exists in the world and supports that item.
- A matched node for which no supporting fragment exists, against the expected result that no item is answered with an empty provenance.
implements:
- domain/knowledge-base/search-item
stands:
- src/modules/query-retrieval/service/search.service.ts
---

## What it is

A proof of a delivered fact, owed by the record siegard-reconcile/drift-corrections.md.

## Notes

ADVISORY, from the specification — domain/knowledge-base/search-item backs criterion 3 by the 1..* cardinality of its provenance relationship; the node does not say what happens to a matched node that has no supporting fragment, and the criterion tests only that no item has empty provenance, so a test written for it asserts no particular handling of that node.
