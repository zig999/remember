---
target: backend
implementation: sha256:17724a0fb19ca7fbdc38383d1f62750a15596bd25a8c3370caab70c882cf732b
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/document-context-failed-reading-continues-suite
title: Proof for the failed preliminary reading that continues
summary: Seven tests added to the existing preliminary-reading unit spec prove that a failed preliminary reading leaves the run completed, with every chunk read, status failed and no document context, whether the failure is a provider error, a timeout or an unparseable answer.
tests:
- file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
  name: reads every chunk of the raw information when the preliminary reading answers a provider error
  proves: When the preliminary reading answers a provider error, every chunk of the raw information is read.
  fails_when: A provider error from the preliminary reading stops the chunk loop. For example, the error propagates to runLlmExtraction's catch and the run is closed failed before or during the chunks, or fewer than the 3 chunk texts reach the model.
- file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
  name: completes the run when the preliminary reading answers a provider error
  proves: When the preliminary reading answers a provider error, the run completes.
  fails_when: The run is closed as failed, or left running, after the preliminary reading answers a provider error. A thrown typed sentinel also fails it, because the awaited extraction rejects.
- file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
  name: records the document context status failed when the preliminary reading answers a provider error
  proves: When the preliminary reading answers a provider error, the run records the document context status failed.
  fails_when: The status is left unset, or is recorded as any value other than failed (produced, too-long or single-chunk), after a provider error from the reading.
- file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
  name: leaves the run holding no document context when the preliminary reading answers a provider error
  proves: When the preliminary reading answers a provider error, the run holds no document context.
  fails_when: The failure path stores any document context on the run, for example an empty or placeholder one.
- file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
  name: reads the 3 chunks, completes the run and records status failed with no document context when the preliminary reading of a 3-chunk v5 raw information answers a provider error
  proves: 'The scenario as the node states it: a raw information of 3 chunks under prompt version v5, the preliminary reading answers a provider error, then the 3 chunks are read, the run completes, and the run records the document context status failed and holds no document context. This test protects the four outcomes holding together in one run, which each single-criterion test above does not.'
  fails_when: 'Any of the scenario''s four outcomes stops holding in the same run: a chunk count other than 3, a run status other than completed, a context status other than failed, or a non-null document context.'
  demonstrates: scenarios/knowledge-base/failed-context-reading-keeps-extracting
- file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
  name: records the document context status failed when the preliminary reading answers text that is not a document context
  proves: 'UNDERDETERMINED entry: the continue-and-record-failed path is not limited to a provider error. A preliminary reading whose answer cannot be parsed into a document context still ends with status failed.'
  fails_when: An implementation that continues and records failed only on a provider error. For an unparseable answer it either fails the LLM run (the extraction rejects and the test errors) or leaves the document context status unset.
- file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
  name: records the document context status failed when the model call of the preliminary reading times out
  proves: 'UNDERDETERMINED entry: the continue-and-record-failed path is not limited to a provider error. A preliminary reading whose model call exceeds its time bound still ends with status failed.'
  fails_when: An implementation that continues and records failed only on a provider error. For a timed-out call it either fails the LLM run (the extraction rejects and the test errors) or leaves the document context status unset.
files:
- path: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
  effect: Besides the new tests, the file's model stand-in now takes two optional Scenario fields, readingError and readingText, so a scenario can make the preliminary reading reject or answer arbitrary text. buildModel's behavior is unchanged for scenarios that set neither, and the existing tests' behavior is unchanged.
not_applicable:
- edge_case: absent or empty input to the extraction
  why: The failure path takes no input of its own. Its only trigger is the outcome of the model call. Raw information with no chunks, or with one chunk, never reaches the reading, and that is the skip task's obligation.
- edge_case: boundary of the 100000 UTF-16 code unit limit and the one-chunk boundary
  why: These decide whether a reading is made at all. They belong to the skip and status tasks, not to what happens once a reading has been made and fails.
- edge_case: a retried run that already holds a document context or the status failed
  why: The retry criteria belong to task/document-context/retry-reuses-document-context. No criterion or node of this task states retry behavior.
- edge_case: duplicate failure or two operations against one run at once
  why: No criterion or implemented node states concurrent behavior or uniqueness for the failed status. A test would assert a guarantee nobody made.
- edge_case: a provider error versus the error left after the allowed retries
  why: The task's ADVISORY note records that constraints/extraction-model-call-bounded allows either reading. The stand-in boundary rejects once, which is the post-retry outcome the SDK would surface, and the bound itself is proved by the existing five-minute and two-retry test.
untested:
- rules/knowledge-base/failed-preliminary-reading-continues is not demonstrated by any test. Its statement, that an extraction whose reading fails goes on to read its chunks, quantifies over every way a reading can fail, and no node enumerates those ways. The provider-error, timeout and unparseable-answer tests cover three cases and would be part of the fact taken as the whole, so no test names it under demonstrates.
- rules/knowledge-base/document-context-status-recorded is not demonstrated. This task owns only its failed clause, and the single-chunk, too-long and produced clauses plus the v5-and-later condition belong to other tasks of the epic. A test here would assert one clause as the whole rule.
- domain/knowledge-base/document-context-status is not demonstrated. It is an enumeration of four values, and only failed is exercised here. A test asserting the whole set would pin the type declaration in source rather than behavior this task owes.
- domain/knowledge-base/llm-run is not demonstrated. It is an aggregate of many attributes and three operations, and no finite test decides it whole. This task touches only document_context, document_context_status and the complete operation.
- The implementation's inference that a failure to record the failed status (the llm_run row missing, or a database error) propagates to the run's catch and fails the run is behavior no node decides. It is not pinned by a test.
- The implementation's inference that the failure is logged at warn level as document_context_reading_failed, carrying cause name and message, is not pinned. No node states a log event.
- The implementation's inference that the failed status is recorded as a single UPDATE on a short connection without a transaction is an arrangement, so no test pins it.
- The UNDERDETERMINED entry is answered for the unparseable-answer and timeout cases only. The tests use one representative of an unparseable answer (text holding no JSON object). The other two parse failures (invalid JSON, wrong shape) pass through the same catch and are not given tests of their own.
- The task's ADVISORY items are left unproven because no criterion or implemented node states them. Each chunk's prompt carrying no document context on this path (rules/knowledge-base/extraction-reads-chunks-in-order) belongs to the chunk-reading task. The run-extraction answer showing status failed and no document context (contracts/knowledge-base/ingestion) belongs to task/document-context/run-answers-show-document-context. The implementation record itself defers that answer.
---

## What it is

Seven tests added to the existing preliminary-reading unit spec prove that a failed preliminary reading leaves the run completed, with every chunk read, status failed and no document context, whether the failure is a provider error, a timeout or an unparseable answer.

## Notes

None.
