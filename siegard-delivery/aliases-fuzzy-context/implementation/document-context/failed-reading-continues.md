---
target: backend
task: sha256:6ffaeea75ade5625d84c3c8377e21e8e4df1c1d8e57d7056ad3b8a9b6a515b5a
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/document-context-failed-reading-continues-build
title: Failed preliminary reading continues
summary: A preliminary reading that fails is caught and logged, the run's document context status is recorded as failed with no document context stored, and the extraction goes on to read every chunk and complete.
files:
- path: src/modules/ingestion/service/preliminary-reading.ts
  effect: 'produceDocumentContext now catches any failure of the preliminary reading (provider error, timeout, or an answer that does not parse into a document context). It logs the failure as document_context_reading_failed, records document_context_status failed on the llm_run through recordDocumentContextStatus (new helper recordFailedReading), writes no document_context, and returns normally. Before this change the error propagated to runLlmExtraction''s catch, which closed the run as failed and threw a typed sentinel. extraction.service.ts is unchanged: with no throw it runs its chunk loop over every chunk, then closeRunSafe(..., "completed").'
criteria:
- criterion: When the preliminary reading answers a provider error, every chunk of the raw information is read.
  met: true
  how: produceDocumentContext (preliminary-reading.ts) catches the error from readDocumentContext and returns instead of rethrowing. The call in runLlmExtraction (extraction.service.ts) therefore does not leave the try block, and the existing "for (const chunk of chunks)" loop runs for every chunk.
- criterion: When the preliminary reading answers a provider error, the run completes.
  met: true
  how: The error no longer reaches the isAnthropicSdkError / uncaught branches of runLlmExtraction's catch, which were the only paths that closed the run as failed for this cause. Execution reaches closeRunSafe(pool, llmRunId, "completed") after the chunk loop.
- criterion: When the preliminary reading answers a provider error, the run records the document context status failed.
  met: true
  how: recordFailedReading calls recordDocumentContextStatus with document_context_status "failed" on the run's llm_run row, on its own short connection, which is released in a finally block.
- criterion: When the preliminary reading answers a provider error, the run holds no document context.
  met: true
  how: The failure path never calls recordDocumentContext or recordProducedContext. The document_context column stays as it was, null on a run that passed shouldReadDocument.
nodes:
- node: rules/knowledge-base/failed-preliminary-reading-continues
  encoded_at:
  - src/modules/ingestion/service/preliminary-reading.ts
  how: produceDocumentContext turns a failed reading into a recorded outcome instead of an exception. That is what lets runLlmExtraction go on to read the chunks.
- node: scenarios/knowledge-base/failed-context-reading-keeps-extracting
  encoded_at:
  - src/modules/ingestion/service/preliminary-reading.ts
  how: The scenario (3 chunks, v5, provider error from the reading) is the path produceDocumentContext now takes. The 3 chunks are read by the unchanged chunk loop, the run closes completed, and the status is failed with no document context.
- node: rules/knowledge-base/document-context-status-recorded
  encoded_at:
  - src/modules/ingestion/service/preliminary-reading.ts
  how: Only the "failed when the preliminary reading fails" clause is encoded here, in recordFailedReading. The produced clause was already written by recordProducedContext in the preceding task. The single-chunk and too-long clauses belong to other tasks and are not reached. shouldReadDocument still returns early for those cases without recording anything.
- node: domain/knowledge-base/document-context-status
  encoded_at:
  - src/modules/ingestion/service/preliminary-reading.ts
  how: The failed value is written through the existing DocumentContextStatus type and the document_context_status enum cast in recordDocumentContextStatus. No new value or type was added.
- node: domain/knowledge-base/llm-run
  encoded_at:
  - src/modules/ingestion/service/preliminary-reading.ts
  how: The document_context_status attribute of LLMRun is set to failed and document_context is left unset. Both attributes already existed on the llm_run row and in LlmRunRow. The complete operation is reached through the unchanged closeRunSafe call.
inferences:
- inferred: 'Every failure of the reading step is treated as "the preliminary reading fails": a provider error, a timeout, or an answer that does not parse into a document context. The catch is not restricted to provider errors.'
  from: The statements of rules/knowledge-base/failed-preliminary-reading-continues and rules/knowledge-base/document-context-status-recorded do not limit the failure to a provider error. The task's UNDERDETERMINED note says a narrower catch would leave the status unset or fail the run on the other failure modes. Recorded for review, since the criteria only test the provider-error case.
- inferred: The failure is logged at warn level with the event name document_context_reading_failed, carrying the cause name and message and no content.
  from: The extraction_affected_nodes_resolution_failed warn log in extraction.service.ts, which handles a non-fatal failure the same way. No node states a log event.
- inferred: A failure to record the failed status (the llm_run row missing, or a database error) is not swallowed. It propagates to runLlmExtraction's existing catch, which closes the run as failed.
  from: The sibling recordProducedContext, which throws InvariantError when the row has vanished. The specification does not say what happens when the status itself cannot be recorded.
- inferred: Recording the failed status runs as a single UPDATE on a short connection, without BEGIN/COMMIT.
  from: The conventions in the inventory (fresh short connections for run writes). A single statement is atomic, so a transaction would add nothing.
preserved:
- A run whose prompt version is before v5, or with one chunk, or with content over 100000 UTF-16 code units, or that already holds a document context, still returns early from produceDocumentContext and records nothing.
- A successful reading still stores the document context and the status produced in one transaction (recordProducedContext, untouched).
- Provider failures during chunk reading still close the run as failed and throw LlmProviderFatalError or ExtractionFatalError (the catch in runLlmExtraction, untouched).
- The signature and exports of produceDocumentContext, shouldReadDocument and the other preliminary-reading exports are unchanged.
deferred:
- what: The run-extraction answer (readFinalRun and toLlmRunResponse) does not carry document_context_status or document_context, so the completed run's answer does not show status failed.
  why: The contract in contracts/knowledge-base/ingestion is not implemented by this task and no criterion checks the answer. The task's ADVISORY note leaves it out as a neighbor.
- what: Chunk reading does not yet show the run's document context to the model when the run holds one.
  why: That is rules/knowledge-base/extraction-reads-chunks-in-order, owned by the chunk-reading task. The failed path correctly shows no context because none exists.
- what: No test was written or changed for the failed-reading path. The existing preliminary-reading.spec.ts has no case that makes the reading fail.
  why: Tests are another judge's work, so none were written here.
---

## What it is

A preliminary reading that fails is caught and logged, the run's document context status is recorded as failed with no document context stored, and the extraction goes on to read every chunk and complete.

## Notes

Every failure of the reading step counts as the preliminary reading failing (provider error, timeout, unparseable answer), not only a provider error.
