---
title: Proof of extraction-anchors-to-read-chunk
summary: A test that decides the fact of rules/knowledge-base/extraction-anchors-to-read-chunk as the record's remainder states it.
sources:
- intake/proof-increment.md
objective: A test fails whenever the fact of rules/knowledge-base/extraction-anchors-to-read-chunk stops holding in the delivered code.
criteria:
- 'Two fragments, each proposed while reading chunk 2. One names chunk 2 and chunk 3. The other names a chunk of a different raw information. Expected result: each fragment is anchored to chunk 2 alone, [[chunk 2], [chunk 2]].'
implements:
- rules/knowledge-base/extraction-anchors-to-read-chunk
stands:
- src/modules/ingestion/service/extraction.service.ts
---
## What it is
This task writes the test that closes the testable remainder siegard-reconcile/aliases-fuzzy-context-3.md recorded for rules/knowledge-base/extraction-anchors-to-read-chunk.
The implementation stands in the files under `stands` and is not changed.

## Notes
UNDERDETERMINED, from the specification — The criterion's only fragment that names a chunk of the same raw information lists chunk 2, the chunk being read, first. So an implementation that anchors by order rather than to the read chunk produces [[chunk 2], [chunk 2]] and passes. rules/knowledge-base/extraction-anchors-to-read-chunk states that a fragment is anchored to the raw chunk being read, whatever raw chunks the model names. That covers a fragment naming only another chunk of the same raw information, such as chunk 3, or naming chunk 3 before chunk 2, and the criterion exercises neither case. Passes: An implementation that anchors each fragment to the first chunk the model names that belongs to the raw information being read, and falls back to the chunk being read only when no named chunk belongs to it. It yields [[chunk 2], [chunk 2]] for the criterion's two fragments, but it anchors a fragment that names only chunk 3 to chunk 3.
UNDERDETERMINED, from the specification — The rule's clause 'whatever raw chunks the model names' includes a fragment for which the model names no chunk at all. The criterion only exercises fragments that name at least one chunk. So no criterion checks that a fragment with no named chunk is still anchored to the chunk being read. Passes: An implementation that anchors to the chunk being read only when the model names at least one chunk, and leaves a fragment with no named chunk unanchored or anchored to nothing. It still yields [[chunk 2], [chunk 2]] for the criterion's two fragments.
