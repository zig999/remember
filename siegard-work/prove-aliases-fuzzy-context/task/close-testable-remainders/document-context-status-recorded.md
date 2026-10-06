---
title: Proof of document-context-status-recorded
summary: A test that decides the fact of rules/knowledge-base/document-context-status-recorded as the record's remainder states it.
sources:
- intake/proof-increment.md
objective: A test fails whenever the fact of rules/knowledge-base/document-context-status-recorded stops holding in the delivered code.
criteria:
- An extraction run under a v5-or-later prompt version over a stored raw information of one chunk whose content is longer than 100000 UTF-16 code units records the document context status single-chunk on its run.
- An extraction run under a v5-or-later prompt version over a stored raw information of more than one chunk whose content exceeds 100000 UTF-16 code units records the document context status too-long on its run.
- An extraction run under a v5-or-later prompt version over a stored raw information of more than one chunk whose content is within 100000 UTF-16 code units, where the preliminary reading fails, records the document context status failed on its run.
- An extraction run under a v5-or-later prompt version over a stored raw information of more than one chunk whose content is within 100000 UTF-16 code units, where the preliminary reading yields a document context, records the document context status produced on its run.
implements:
- rules/knowledge-base/document-context-status-recorded
stands:
- src/modules/ingestion/service/preliminary-reading.ts
---
## What it is
This task writes the test that closes the testable remainder siegard-reconcile/aliases-fuzzy-context-3.md recorded for rules/knowledge-base/document-context-status-recorded.
The implementation stands in the files under `stands` and is not changed.

## Notes
UNDERDETERMINED, from the specification — The statement of rules/knowledge-base/document-context-status-recorded says a run records single-chunk when the raw information "holds one chunk whatever its length". The log entry for `statement` confirms this applies to a one-chunk raw information of any length. The criteria only test this clause for a single chunk longer than 100000 UTF-16 code units. No criterion tests a single chunk whose content is within 100000 UTF-16 code units, so the short single-chunk case is never checked. Passes: An implementation that records single-chunk only when a one-chunk raw information exceeds 100000 UTF-16 code units. For a short one-chunk raw information it runs the preliminary reading anyway and records produced or failed. This passes all four criteria as written, but the statement refuses it because single-chunk applies to a one-chunk raw information of any length.
ADVISORY, from the specification — Criteria three and four depend on when a preliminary reading happens and what counts as it failing or producing a document context. rules/knowledge-base/document-context-status-recorded names the failed and produced outcomes but does not define the reading. The log entry for `statement` points to rules/knowledge-base/document-context-read-first as the rule that governs when the reading happens, and that node is not in the candidate set. The test can be written against the status rule alone. If the proof needs to set up the reading's conditions from that rule, the epic's claim has to include rules/knowledge-base/document-context-read-first.
Decision, beyond the covers — stand: rules/knowledge-base/document-context-read-first is arranged only as the setting of the test, and this proof task implements nothing it states; the proof increment closes the remainder of rules/knowledge-base/document-context-status-recorded alone, so the claim does not grow.
