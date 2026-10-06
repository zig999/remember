---
target: backend
title: Proof that the document context status is kept when a run's context is reused
summary: One test shows that a run holding a document context, extracted under v5 and under a later version, keeps the status it already held, with the status set to one a reading of the run's document would not record.
implementation: sha256:d5889598a505924106b9b5ec2e56829172d85f419226a6e109e3bc43e560d0bd
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/close-testable-remainders-document-context-status-kept-on-reuse-suite
tests:
- file: src/__tests__/unit/ingestion/preliminary-reading-status-kept-on-reuse.spec.ts
  name: leaves the held document context status unchanged when a run holding a document context is extracted under v5 and under a later prompt version
  proves: Both cases of the remainder. A run holding a document context is extracted with no preliminary reading, once under prompt version v5 and once under v6, and its status still equals the held value afterwards. The held status is "produced". The run's document has three chunks and 100001 UTF-16 code units, so a reading of it would record "too-long", which is not the held value.
  fails_when: produceDocumentContext writes a document context status for a run that already holds a context. This covers writing the skipped-reading status ("too-long" for this document) before honouring the held context, or writing "produced" or "failed" after a reading. It also fails if the held-context behavior stops applying under v5 or under a later version, since either case then no longer returns the held status.
  demonstrates: rules/knowledge-base/document-context-status-kept-on-reuse
not_applicable:
- edge_case: prompt versions before v5
  why: The node's statement is scoped to "v5 and later", so no obligation states what the status is for earlier versions.
- edge_case: a run holding no document context
  why: The node does not govern the status an extraction records when it makes a reading or cannot make one. rules/knowledge-base/document-context-status-recorded owns that, and the existing spec preliminary-reading-status-by-prompt-version.spec.ts covers it.
- edge_case: other documents (a single chunk, or content within the limit) under a held context
  why: They are the same class for this node. The held context is returned before the document's shape is read, so a second document would prove the same thing a second time.
- edge_case: concurrent extractions of one run
  why: no criterion and no node states behavior for two extractions of one run at the same time.
untested:
- That the stored llm_run.document_context_status column in a real Postgres row is unchanged. The test observes the status through a stand-in pool that records writes naming document_context_status, so it fails if the code issues such a write. It cannot show that the real UPDATE or the column behave the same way, and closing that would need a real database.
- The ordering of prompt versions ("later than v5"). The task's ADVISORY notes say that no candidate node states the order and that domain/knowledge-base/llm-run lies outside the claim. The test chooses v6 as the later version and pins no order beyond that. The same notes say the status values belong to domain/knowledge-base/document-context-status, which the task does not implement; the test uses only its values "produced" and "too-long" as setting. Neither node is claimed.
- The task's `## Notes` hold no entry opening "UNDERDETERMINED, from the specification", so no test is owed on that account. The implementation record states no behavioral inference.
---
## What it is
This proof answers a proof task over a standing implementation: it closes the testable remainder siegard-reconcile/aliases-fuzzy-context-3.md recorded for the node the task implements.

## Notes
None.
