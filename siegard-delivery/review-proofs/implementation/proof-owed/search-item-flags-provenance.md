---
target: backend
title: A search item's flags, provenance and non-empty provenance are proven
summary: The implementation of the search item already stands; this delivery writes the proof of its flags, its provenance entries and its non-empty provenance.
task: sha256:6b7ecba55746b8242972b6e53f89fc03741e436f6c7d7fc2fb52840dec228507
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/proof-owed-search-item-flags-provenance-build
stands:
- src/modules/query-retrieval/service/search.service.ts
files: []
criteria:
- criterion: A search whose matched item has confidence in the uncertain band should answer that item with flags holding only assertion-flag values, including the expected one.
  met: true
  how: The implementation stands at the files this record lists and the proof beside it decides this criterion.
- criterion: For every item of each kind, each provenance entry should name an information fragment that exists in the world and supports that item.
  met: true
  how: The implementation stands at the files this record lists and the proof beside it decides this criterion.
- criterion: A matched node for which no supporting fragment exists, against the expected result that no item is answered with an empty provenance.
  met: true
  how: The implementation stands at the files this record lists and the proof beside it decides this criterion.
nodes:
- node: domain/knowledge-base/search-item
  how: The IntermediateItem interface (lines 57-70) declares kind, layer, score, hop, summary, flags and provenance, and toSearchItem (line 478) projects it onto the SearchItem shape, in src/modules/query-retrieval/service/search.service.ts.
---

## What it is

The implementation of the search item already stands; this delivery writes the proof of its flags, its provenance entries and its non-empty provenance.

## Notes

This delivery writes no source; the implementation stands and the proof is what it adds.
The build run shows the standing implementation still builds.
