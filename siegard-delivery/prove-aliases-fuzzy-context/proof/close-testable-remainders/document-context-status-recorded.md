---
target: backend
title: Proof of document-context-status-recorded
summary: 'Six tests over the document context status a v5-or-later extraction records on its run: one per criterion, one for the short single-chunk case the UNDERDETERMINED entry names, and one table over every status and both prompt-version cases that demonstrates the node. None of them has been run.'
implementation: sha256:6ffd89d96c852b51aa03f2b1e0083c1017e6b63cf7a40f323395ff7a77396c09
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/close-testable-remainders-document-context-status-recorded-suite
tests:
- file: src/__tests__/unit/ingestion/document-context-status-recorded.spec.ts
  name: records single-chunk on the run when the stored raw information holds one chunk longer than 100000 UTF-16 code units
  proves: Criterion 1 and the first remainder assertion. An extraction run under v5 over a stored raw information of one chunk whose content is longer than 100000 UTF-16 code units records the document context status single-chunk on its run.
  fails_when: A one-chunk raw information over the limit records too-long, produced, failed or no status at all. The single-chunk branch could also be dropped, or reordered behind the too-long check, so that the content length decides first.
- file: src/__tests__/unit/ingestion/document-context-status-recorded.spec.ts
  name: records single-chunk on the run when the stored raw information holds one chunk within 100000 UTF-16 code units
  proves: The UNDERDETERMINED entry in the task's Notes. The node says single-chunk applies to one chunk "whatever its length", so a short one-chunk raw information must also record single-chunk.
  fails_when: Single-chunk is recorded only when a one-chunk raw information exceeds 100000 UTF-16 code units. For a short one-chunk raw information that implementation would run the preliminary reading and record produced or failed, or record nothing.
- file: src/__tests__/unit/ingestion/document-context-status-recorded.spec.ts
  name: records too-long on the run when the stored raw information holds several chunks whose content exceeds 100000 UTF-16 code units
  proves: Criterion 2 and the second remainder assertion. A v5 run over several chunks whose content is 100001 code units, one past the limit, records too-long on its run.
  fails_when: The over-limit multi-chunk case records produced, failed, single-chunk or nothing. The boundary could also move up by a unit, so that 100001 is treated as within the limit.
- file: src/__tests__/unit/ingestion/document-context-status-recorded.spec.ts
  name: records failed on the run when the stored raw information holds several chunks within 100000 UTF-16 code units and the preliminary reading fails
  proves: Criterion 3 and the third remainder assertion. When the reading throws for a multi-chunk raw information within the limit, the run records failed.
  fails_when: A failing reading records produced, too-long or single-chunk, records nothing, or lets the error escape without recording failed.
- file: src/__tests__/unit/ingestion/document-context-status-recorded.spec.ts
  name: records produced on the run when the stored raw information holds several chunks of exactly 100000 UTF-16 code units and the preliminary reading yields a document context
  proves: Criterion 4 and the fourth remainder assertion. At the upper boundary (exactly 100000 units, which is within the limit) a reading that yields a context records produced.
  fails_when: A successful reading records anything but produced. It also fails if the limit is applied inclusively, so that exactly 100000 units is treated as too-long and the reading is skipped.
- file: src/__tests__/unit/ingestion/document-context-status-recorded.spec.ts
  name: records each of the four document context statuses by chunk count, content length in UTF-16 code units and reading outcome under v5 and under a later prompt version
  proves: The whole statement of the node. Under v5 and under v6, single-chunk is recorded for one chunk of any length (short and over the limit). Too-long is recorded for several chunks over the limit, including a content past the limit in UTF-16 code units but within it in code points. Failed is recorded when the reading fails. Produced is recorded when it yields a context.
  fails_when: Any one of the four statuses stops being recorded for its stated condition under v5 or v6. The over-limit length is counted in code points instead of UTF-16 code units. The v5-and-later rule is narrowed to v5 only.
  demonstrates: rules/knowledge-base/document-context-status-recorded
files:
- path: src/__tests__/unit/ingestion/document-context-status-recorded-world.ts
  effect: A helper the spec shares. It runs produceDocumentContext over an in-memory stand-in for the store and a stand-in for the model provider. It returns the last document_context_status the run was written with, and it builds content of a given length in UTF-16 code units, including content past the limit in units but within it in code points.
not_applicable:
- edge_case: Empty content or an absent raw information.
  why: No criterion and no node states a status for them. A stored raw information always holds at least one chunk, and the node's fact turns on chunk count and content length, not on emptiness.
- edge_case: A run holding a document context already, or a retried run.
  why: Whether a held status is kept on reuse is the fact of another task (the one whose delivery is document-context-status-kept-on-reuse), and not of this node.
- edge_case: A prompt version below v5, or one that does not parse as vN.
  why: This node states its fact only "under prompt version v5 and later". What happens below v5 is a separate rule and is not an obligation here.
- edge_case: A provider that is slow, or two operations against one run at once.
  why: The node distinguishes only a reading that fails from one that yields a context, and the failure test covers that. Latency and concurrency have no stated outcome in the node.
- edge_case: A duplicate reading or a duplicate status record.
  why: The node states no uniqueness claim over the status.
untested:
- That the extraction service passes the stored raw information's chunk count and content to the preliminary reading (chunks.length and rawInfo.content in extraction.service.ts). The task's stands names only preliminary-reading.ts, so the tests drive produceDocumentContext directly with those two values. They do not drive a whole run through runLlmExtraction over a stored raw information, so a mistake in that wiring would not fail any of them.
- That the status is persisted in llm_run.document_context_status. That includes the document_context_status enum cast, and the transaction that writes document_context and the produced status together. This can only be closed against a real PostgreSQL. The tests use an in-memory stand-in that captures the status parameter of the UPDATE, and no real database was touched.
- The ADVISORY in the task's Notes. When the reading happens, and what counts as it failing or producing a context, is the fact of rules/knowledge-base/document-context-read-first, which this task does not implement. The tests set the reading up only as a stand-in for the provider answering or throwing. They pin nothing about how the reading is carried out, and the implementation record states no inference about behavior.
divergences:
- cites: TST-04
  file: src/__tests__/unit/ingestion/document-context-status-recorded.spec.ts
  departure: The spec sits in src/__tests__/unit/ingestion/, beside the existing ingestion specs. It does not mirror the path of the unit under test (src/modules/ingestion/service/preliminary-reading.ts) as a unit/modules/ingestion/service/ subtree.
  why: Every ingestion spec already in the tree sits flat in unit/ingestion/, so mirroring would split the suite across two layouts. The helper file beside it follows the same layout.
- cites: TST-04
  file: src/__tests__/unit/ingestion/document-context-status-recorded-world.ts
  departure: The helper sits in src/__tests__/unit/ingestion/ and not under a mirrored path of the unit it supports.
  why: It shares the spec's directory, like the other *-world.ts helpers already in that directory.
---
## What it is
This proof answers a proof task over a standing implementation: it closes the testable remainder siegard-reconcile/aliases-fuzzy-context-3.md recorded for the node the task implements.

## Notes
None.
