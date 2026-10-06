---
target: backend
title: Proof of extraction-reads-chunks-in-order, closing the reception-time and one-at-a-time remainders
summary: Two tests over runLlmExtraction, using a stand-in pool and model, check that every chunk prompt shows received_at and never started_at, and that a multi-chunk run holding no document context never has two chunk model calls in flight at once.
implementation: sha256:3fb5d61f9ae66313f8267b06cbe2a6d24edec232364bb10d420ae21ee109181e
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/close-testable-remainders-extraction-reads-chunks-in-order-suite
tests:
- file: src/__tests__/unit/ingestion/extraction-chunk-reception-time-and-sequence.spec.ts
  name: shows received_at and never the run's started_at in every chunk prompt when the two differ
  proves: 'Remainder assertion of rules/knowledge-base/extraction-reads-chunks-in-order and criterion 1: an extraction over raw information whose received_at differs from the run''s started_at shows received_at, and not started_at, in every chunk prompt. The run''s started_at (2026-10-06T08:30:00Z) is set apart from the raw information''s received_at (2026-10-05T12:00:00Z) over a three-chunk run. This is done for a v5 run holding a document context and for a v4 run. The test checks that each of the three chunk prompts contains the received_at instant and contains neither the started_at date nor its time.'
  fails_when: A chunk prompt shows the run's started_at in place of, or beside, received_at, or omits the reception time. This covers any chunk, not only the first. It also covers the v5 path with a context and the v4 path.
  demonstrates: rules/knowledge-base/extraction-reads-chunks-in-order
- file: src/__tests__/unit/ingestion/extraction-chunk-reception-time-and-sequence.spec.ts
  name: never has two chunk model calls in flight at once for a multi-chunk run holding no document context
  proves: 'Remainder assertion of rules/knowledge-base/extraction-reads-chunks-in-order and criterion 2: an extraction of a multi-chunk run that holds no document context never has two chunk model calls in flight at the same time. The two shapes are a v4 run and a v5 run whose preliminary reading failed. Each has three chunks. A call counts as in flight from the moment the model stream is opened until its final message resolves. Only chunk calls are counted, not the preliminary reading. The test also checks that all three chunks were prompted, so a run with no chunk calls cannot pass.'
  fails_when: The extraction opens the model calls for several chunks before the earlier ones settle, for example by running the chunk loop concurrently, in either no-context shape. The largest in-flight count then exceeds one. The test also fails if fewer than three chunks are prompted.
  demonstrates: rules/knowledge-base/extraction-reads-chunks-in-order
not_applicable:
- edge_case: absent or empty reception time, title or document date
  why: The node and the criteria do not say what the prompt shows for a missing field. The (unknown) wording is an implementation choice, so a test would pin it.
- edge_case: a one-chunk run, or a run with zero chunks
  why: The second criterion is stated for multi-chunk runs. With one chunk there is nothing to overlap, and no criterion or node states anything about an empty run.
- edge_case: two extractions of one run at the same time
  why: The node states the order inside one extraction. It states nothing about concurrent extractions of the same run.
- edge_case: a model call that fails or answers slowly
  why: Failure handling is not stated by this node or by the two criteria. The slowness the second criterion needs is simulated by the stand-in model so that overlap would show.
- edge_case: a run holding a document context, for the one-at-a-time clause
  why: The second criterion is limited to runs holding no context. The existing certified test already observes the in-flight maximum for a run with a context.
untested:
- The node's fact as a whole is not decided by these two tests alone. The clauses for index order, the source type, document date and title, the 200-code-point tail of the previous chunk, and showing the run's context are proved by the existing test in src/__tests__/unit/ingestion/chunk-prompt-document-context-remainders.spec.ts, which a recorded certification marks partial. This proof does not duplicate them. Each test carries the node under demonstrates because the remainder asked each assertion to name the node. Whether the node is closed depends on the auditor combining them with that existing test.
- Reading the chunks from a real Postgres in chunk_index order, which depends on the ORDER BY of the real query, is not proved here. The stand-in pool answers the chunk query directly and could only reimplement the rule, so no test is written. The existing test models the ordering at the stand-in boundary.
- The exact textual format of the reception time in the prompt is not pinned. The test checks only that the instant (to the second) appears and that the started_at date and time do not, because the node says only "reception time".
divergences:
- from: TST-04, the test file's path mirroring the unit under test (the standard pin could not be computed without a shell, so the rule is named in prose rather than cited by identifier)
  departure: The file src/__tests__/unit/ingestion/extraction-chunk-reception-time-and-sequence.spec.ts is named for the two behaviors it proves. It does not take the extraction.service.spec.ts name that mirrors the unit.
  why: The behavior spans the prompt modules and the extraction service. The sibling test file for the same unit (chunk-prompt-document-context-remainders.spec.ts) is also named for the behavior. The file sits in the same unit/ingestion subtree.
---
## What it is
This proof answers a proof task over a standing implementation: it closes the testable remainder siegard-reconcile/aliases-fuzzy-context-3.md recorded for the node the task implements.

## Notes
None.
