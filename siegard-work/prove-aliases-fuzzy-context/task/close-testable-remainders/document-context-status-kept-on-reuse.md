---
title: Proof of document-context-status-kept-on-reuse
summary: A test that decides the fact of rules/knowledge-base/document-context-status-kept-on-reuse as the record's remainder states it.
sources:
- intake/proof-increment.md
objective: A test fails whenever the fact of rules/knowledge-base/document-context-status-kept-on-reuse stops holding in the delivered code.
criteria:
- Two cases would close it. In each, a run holding a document context is extracted with no preliminary reading, and its status must still equal the held value afterwards. The first run has prompt version v5. The second has a version later than v5. In both, the held status must be one that a preliminary reading of the run's document would not record.
implements:
- rules/knowledge-base/document-context-status-kept-on-reuse
stands:
- src/modules/ingestion/service/preliminary-reading.ts
---
## What it is
This task writes the test that closes the testable remainder siegard-reconcile/aliases-fuzzy-context-3.md recorded for rules/knowledge-base/document-context-status-kept-on-reuse.
The implementation stands in the files under `stands` and is not changed.

## Notes
ADVISORY, from the specification — To pick the held status, the criterion needs to know which statuses a preliminary reading of the run's document would record (the held status must be one a reading would not record). The candidate does not state those statuses. It points elsewhere for them: its Description says "rules/knowledge-base/document-context-status-recorded decides that". That node is not in the candidate set. The status values themselves belong to domain/knowledge-base/document-context-status, and the run's prompt version belongs to domain/knowledge-base/llm-run. Both appear in the candidate's `constrains`, and neither is a candidate. Writing the test would mean reaching outside the candidates, so the caller should decide whether the epic's claim grows to include these nodes.
ADVISORY, from the specification — The criterion's second case needs a prompt version "later than v5". That only makes sense if prompt versions have an order. The candidate's statement ("Under prompt version v5 and later") assumes that order without stating it. If any node states it, it would be domain/knowledge-base/llm-run, which is outside the candidate set. Choosing the test's later-than-v5 version therefore rests on a node this task cannot name in `implements`.
Decision, beyond the covers — stand: domain/knowledge-base/document-context-status is arranged only as the setting of the test, and this proof task implements nothing it states; the proof increment closes the remainder of rules/knowledge-base/document-context-status-kept-on-reuse alone, so the claim does not grow.
Decision, beyond the covers — stand: domain/knowledge-base/llm-run is arranged only as the setting of the test, and this proof task implements nothing it states; the proof increment closes the remainder of rules/knowledge-base/document-context-status-kept-on-reuse alone, so the claim does not grow.
