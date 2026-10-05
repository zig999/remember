---
target: backend
implementation: sha256:b4c3d25312c5682abc9aebecdb156b68141837dffe5f1a1fcb1b7e312f258345
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/prove-aliases-fuzzy-context-2
title: Proof that a retried run reuses the document context it holds
summary: Seven tests chain the real retry and the real extraction over an in-memory run store, and show that retry keeps the held context and every status. They also show that a retried run holding a context makes no second reading, shows each chunk that context and keeps its status under v5 and under a later prompt version, and that a retried run holding none reads again.
tests:
- file: src/__tests__/unit/ingestion/retry-reuses-document-context.spec.ts
  name: leaves the document context recorded when a failed run holding one is retried
  proves: Criterion "Retrying a run that holds a document context leaves that context recorded." The run is a failed v5 run holding a produced status and a whole context. After retryLlmRun, the stored row still holds that whole context.
  fails_when: The retry clears, overwrites or rewrites the run's document_context, for example an UPDATE that sets document_context to NULL or to another value.
- file: src/__tests__/unit/ingestion/retry-reuses-document-context.spec.ts
  name: leaves the document context status as it was when a failed run is retried, whichever status it held
  proves: Criterion "Retrying a run whose document context status is produced leaves that status recorded." It also covers UNDERDETERMINED entry 1, which names a retry that keeps produced but clears failed, too-long or single-chunk. Every value of the document-context-status enumeration, and the absent status, is retried and read back unchanged. The fact of rules/knowledge-base/retry-keeps-document-context-status is decided whole by this finite set, and the failure diff is keyed by status.
  fails_when: A retry changes or clears the document_context_status of a run holding produced, single-chunk, too-long or failed, or of a run holding none. This includes a retry that keeps only produced.
  demonstrates: rules/knowledge-base/retry-keeps-document-context-status
- file: src/__tests__/unit/ingestion/retry-reuses-document-context.spec.ts
  name: makes no preliminary reading and shows each chunk the context the run held when a retried run holding a document context is extracted again
  proves: Criteria "When a retried run holding a document context is extracted again, no preliminary reading is made." and "... each chunk is shown with the context the run already held." It also covers the scenario scenarios/knowledge-base/retried-run-reuses-context whole. A failed v5 run of 3 chunks holds a produced context, is retried by the real retryLlmRun and is extracted again. The observed object is keyed readings, chunksRead and chunksShownTheHeldContext, so a failure names which part broke. chunksRead is asserted so the test cannot pass because no chunk was read.
  fails_when: The extraction makes a second preliminary reading, or any chunk of the retried run is read without the held summary or without any name of a held entity, or a chunk is not read.
  demonstrates: scenarios/knowledge-base/retried-run-reuses-context
- file: src/__tests__/unit/ingestion/retry-reuses-document-context.spec.ts
  name: leaves the document context status as it was after a retried run holding a document context is extracted again, whichever status it held
  proves: UNDERDETERMINED entry 2. A v5 run of 3 chunks within the content limit holds a context, so the extraction makes no reading because it holds one. For each status of the enumeration and for the absent status, the status read back after retry and extraction equals the one held. This is the v5 table; the node's claim sits on the test for the later prompt version below, which closes the clause "v5 and later" that this v5-only table leaves open.
  fails_when: An extraction that reuses a held context clears the run's document context status, overwrites it with another value, or always writes produced or any other constant.
- file: src/__tests__/unit/ingestion/retry-reuses-document-context-later-prompt-version.spec.ts
  name: leaves the document context status as it was when a retried run under a later prompt version holding a document context is extracted with no preliminary reading
  proves: The assertion that closes rules/knowledge-base/document-context-status-kept-on-reuse, one input against one expected result. A run at prompt version v6, later than v5, is failed, holds a document context and the status single-chunk, which an extraction never produces for a run holding a context. It is retried by the real retryLlmRun and extracted by the real runLlmExtraction with no preliminary reading, and the status read back is still single-chunk. The one stand-in is the prompt registry, which maps v6 to the existing v5 module because no v6 prompt module exists yet.
  fails_when: An extraction that reuses a held context under a prompt version later than v5 clears the run's document context status or overwrites it, for example because the early return of a held context applies only to v5, or because a status such as produced or a skip status is written after the reuse.
  demonstrates: rules/knowledge-base/document-context-status-kept-on-reuse
- file: src/__tests__/unit/ingestion/retry-reuses-document-context.spec.ts
  name: makes a preliminary reading when a retried run whose document context status is failed is extracted again
  proves: Criterion "When a retried run whose document context status is failed is extracted again, a preliminary reading is made." The run is a failed v5 run of 3 chunks within the limit, holding the status failed and no context. It is retried and extracted again, and exactly one preliminary reading is made.
  fails_when: A retried run holding no context and the status failed is extracted without a preliminary reading, or the reading is made more than once, for example because the failed status is treated as a skip.
- file: src/__tests__/unit/ingestion/retry-reuses-document-context.spec.ts
  name: records the status produced when the preliminary reading made for a retried run whose status was failed yields a document context
  proves: UNDERDETERMINED entry 3, which names a retried run with the status failed that reads again, yields a context and keeps the status failed because the retry path keeps statuses. The reading yields a context, and the status read back after the extraction is produced.
  fails_when: After the retried run's fresh reading yields a context, the run still holds the status failed, because the status the retry kept is not replaced by the extraction's own outcome.
files:
- path: src/__tests__/unit/ingestion/retried-run-world.ts
  effect: A shared helper for the specs. It builds an in-memory stand-in for the store that holds one failed llm_run row. It answers the retry UPDATE and the extraction's UPDATEs by interpreting the SET and WHERE clauses the production repository issues, and fails loudly on an expression it cannot interpret. It serves a 3-chunk raw information, and a model stand-in that records each call and tells a preliminary reading from a chunk call by whether the whole content is shown. It reuses RUN_ID, DOCUMENT_CONTEXT and llmRunRow from run-document-context-fixture.ts. It holds no assertion. It is unchanged in this re-delivery; the new spec imports it and sets the run's prompt_version on the exposed row.
not_applicable:
- edge_case: A run that is running or completed being retried, and a run id that names no run
  why: The refusals of retry (BUSINESS_RUN_NOT_RETRYABLE, RESOURCE_NOT_FOUND) are existing behavior that no criterion or node of this task changes, and the existing llm-run-routes spec covers them.
- edge_case: A retried run under a prompt version before v5 holding a context, and a retried run under v5 holding none whose raw information has one chunk or exceeds 100000 UTF-16 code units
  why: Neither the criteria nor the nodes this task reaches decide them. The v5 scope, the chunk-count condition and the length ceiling belong to the preliminary-reading and skip-preliminary-reading tasks, already proven in their delivered proofs.
- edge_case: The preliminary reading of a retried run failing, timing out or answering an unparseable text
  why: failed-reading-continues and its delivered proof own what a failed reading does. Nothing of this task states it, so a test here would claim another task's clause.
- edge_case: Two retries or two extractions of one run at once
  why: No criterion or node of this task states concurrent behavior, and a test would assert a guarantee nobody made.
- edge_case: The store failing or answering slowly during retry or extraction
  why: No criterion or node of this task states behavior on a failing store, and the orchestrator's failure handling is not changed by it.
- edge_case: A retried run holding a context and a status other than produced as separate extraction cases under v5
  why: Covered as the table of the fourth test. The enumeration members are one class each only where the obligation reads the status, and there it does. The later prompt version is a second class of the clause "v5 and later" and has its own test, with one representative status, because the obligation reads the version and not the status within it.
untested:
- 'domain/knowledge-base/llm-run: the aggregate spans model, prompt_version, status, attempts, timestamps, the run summary, document_context, document_context_status and the complete, fail and retry operations. This task touches only two attributes and the retry operation, so no finite test decides the fact whole. Other proofs of the plan leave the same node untested.'
- 'domain/knowledge-base/document-context-status: the enumeration of exactly produced, single-chunk, too-long and failed is decided by the delivered proof proof/document-context/record-document-context (its test over the value set). This task only keeps whatever value the run holds, adds no value, and would only repeat that evidence.'
- 'rules/knowledge-base/document-context-read-first: this task reaches only the clause "when the run holds none". The other clauses (v5 and later, more than one chunk, 100000 UTF-16 code units, the whole content once, before the first chunk) belong to the preliminary-reading and skip-preliminary-reading tasks, and a test here would assert part of the fact as the whole. The sixth test exercises the retained clause but claims no node.'
- 'rules/knowledge-base/extraction-reads-chunks-in-order: this task reaches only the clause "and the run''s document context when it holds one". The delivered proof proof/document-context/chunk-prompt-shows-context already demonstrates the rule whole, and the third test shows only that the held context reaches each chunk of a retried run.'
- 'REMAINDER entries 4 and 5 and the two ADVISORY entries of the task''s Notes: the REMAINDERs are the clauses of the two rules named just above, which belong to other tasks. The ADVISORYs observe that no rule states that a retry keeps the context, which the criterion is backed by only through the scenario and the log, and that extraction-model-call-bounded is a neighboring constraint. None names an implementation to exclude, so no test is invented for them.'
- 'Inference about behavior (implementation record): a held document context takes precedence over the skip statuses single-chunk and too-long, so a run that holds one writes no status even when its raw information has one chunk or exceeds the ceiling. It is an inference no node decides, so the tests use only the 3-chunk, within-limit shape, where the held context is the sole reason no reading is made.'
- 'Inference about behavior (implementation record): a run under a prompt version before v5 that holds a context returns it unchanged and writes nothing. No node decides it, and no test pins it.'
- 'What the retry answer itself (the retryLlmRun return value) shows of the context and status: the mapper change belongs to run-answers-show-document-context, whose delivered proof leaves it unproven. The first two tests read the stored row, not the answer.'
- 'The clause of rules/knowledge-base/document-context-status-kept-on-reuse that the database evaluates, namely that the stored llm_run row keeps document_context_status through the extraction UPDATEs: the tests read the status from an in-memory interpretation of the repository SET and WHERE clauses, not from a real Postgres, and no test of this task connects to one. What is decided is that the service writes no status when it reuses a held context.'
- 'The prompt version v6 itself: no v6 prompt module is registered, so the later-prompt-version test maps v6 to the v5 module through a stand-in of the registry. Which prompt a future v6 would select is not decided by this task, and the test does not pin it.'
divergences:
- cites: TST-04
  file: src/__tests__/unit/ingestion/retry-reuses-document-context.spec.ts
  departure: The spec sits flat in src/__tests__/unit/ingestion/ under a name made from the task's subject, and does not mirror the path of one unit under test. It exercises retryLlmRun and runLlmExtraction together.
  why: Every ingestion unit spec of the suite sits flat in that directory, and the behavior chains the retry service and the extraction service, so no single source path can be mirrored. Mirroring one would split the suite across two layouts.
- cites: TST-04
  file: src/__tests__/unit/ingestion/retry-reuses-document-context-later-prompt-version.spec.ts
  departure: The spec sits flat in src/__tests__/unit/ingestion/ under a name made from the task's subject and does not mirror one unit's path. It chains retryLlmRun and runLlmExtraction as the first spec does.
  why: It sits beside the spec for the same task and the helper it imports, in the directory every ingestion unit spec uses, and it is a new file because this re-delivery may not edit an existing spec.
- cites: TST-03
  file: src/__tests__/unit/ingestion/retry-reuses-document-context-later-prompt-version.spec.ts
  departure: The test replaces selectPromptModule of the prompt registry so that the version v6 selects the v5 module. A registry lookup is module logic and not a boundary of the system.
  why: The assertion needs a run under a prompt version later than v5, and the registry registers no module for v6, so extraction would refuse the run before reaching the rule under test. The stand-in changes only which existing prompt module a version string selects. The rule under test, produceDocumentContext and the real retry and extraction services, run unreplaced.
- cites: TST-07
  file: src/__tests__/unit/ingestion/retry-reuses-document-context.spec.ts
  departure: The invariants retry-keeps-document-context-status and document-context-status-kept-on-reuse have tests that try to change the status and expect it unchanged, not a refusal.
  why: Neither invariant is a refusal. They state what is left untouched, so the violating input is a retry or an extraction that would clear or overwrite the status, and the expected result is the status as held.
- cites: TST-07
  file: src/__tests__/unit/ingestion/retry-reuses-document-context-later-prompt-version.spec.ts
  departure: The invariant document-context-status-kept-on-reuse is tested by a case that would clear or overwrite the status, and the expected result is the status as held, not a refusal.
  why: The invariant states what is left untouched, so there is no refusal to expect.
- cites: TYP-02
  file: src/__tests__/unit/ingestion/retried-run-world.ts
  departure: Three `as unknown as` assertions build a partial PoolClient, a partial Pool and a partial Anthropic Message with no narrowing guard.
  why: The stand-ins implement only the members the code under test uses, and cannot satisfy the full driver and SDK types. The existing ingestion specs build the same stand-ins the same way.
---

## What it is

Seven tests chain the real retry and the real extraction over an in-memory run store, and show that retry keeps the held context and every status. They also show that a retried run holding a context makes no second reading, shows each chunk that context and keeps its status under v5 and under a later prompt version, and that a retried run holding none reads again.

## Notes

Proof-only re-delivery for the testable remainders the review aliases-fuzzy-context left; green on run/prove-aliases-fuzzy-context-2.
