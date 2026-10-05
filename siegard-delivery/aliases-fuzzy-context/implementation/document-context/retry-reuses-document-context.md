---
target: backend
task: sha256:812032722ac9a9521b85161d29b9ce33fdcc6837060075565fae96a076c7cf5d
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/document-context-retry-reuses-document-context-build
title: Retry reuses the document context
summary: A run that already holds a document context keeps it through retry and through the next extraction, which makes no preliminary reading and shows each chunk with that context. A run that holds none, including one whose status is failed, gets a reading.
files:
- path: src/modules/ingestion/service/preliminary-reading.ts
  effect: produceDocumentContext now returns the context the run already holds before any other decision. An extraction under a run that holds a context therefore makes no preliminary reading and writes no document context status, whatever the chunk count or content length. A run that holds none goes through the existing skip, read and failure paths unchanged.
criteria:
- criterion: Retrying a run that holds a document context leaves that context recorded.
  met: true
  how: retryLlmRunRow in src/modules/ingestion/repository/llm-run.repository.ts sets only status, attempts and finished_at, so document_context is not written. Its RETURNING list includes document_context, and retryLlmRun passes the row through toLlmRunResponse and documentContextFields, so the retried run still reports its context. No change was needed there.
- criterion: Retrying a run whose document context status is produced leaves that status recorded.
  met: true
  how: retryLlmRunRow does not write document_context_status, and RETURNING includes it, so the retry response and the stored row keep produced. No change was needed there.
- criterion: When a retried run holding a document context is extracted again, no preliminary reading is made.
  met: true
  how: runLlmExtraction loads the run through findLlmRunById, which selects document_context, and passes it to produceDocumentContext. The first statement there now returns the held context, so skippedReadingStatus, shouldReadDocument and readDocumentContext are never reached and no model call is made.
- criterion: When a retried run holding a document context is extracted again, each chunk is shown with the context the run already held.
  met: true
  how: produceDocumentContext returns the held DocumentContext. runLlmExtraction passes it as documentContext to runChunkLoop for every chunk, which hands it to prompt.user(). That prompt path was delivered by the earlier task chunk-prompt-shows-context.
- criterion: When a retried run whose document context status is failed is extracted again, a preliminary reading is made.
  met: true
  how: A failed status leaves document_context null, so the held-context check does not return. For a v5 or later run with more than one chunk and at most 100000 UTF-16 code units, shouldReadDocument is true and readDocumentContext calls the model. On success recordProducedContext records the context and the status produced.
nodes:
- node: domain/knowledge-base/llm-run
  encoded_at:
  - src/modules/ingestion/repository/llm-run.repository.ts
  - src/modules/ingestion/service/preliminary-reading.ts
  how: The run's document_context and document_context_status are read and returned by the existing queries. retryLlmRunRow leaves both untouched. produceDocumentContext honours a context the run holds.
- node: domain/knowledge-base/document-context-status
  encoded_at:
  - src/modules/ingestion/repository/llm-run.repository.ts
  how: The status values are declared by the earlier tasks. This task only keeps whatever value the run holds through retry and through reuse, and adds no value.
- node: rules/knowledge-base/retry-keeps-document-context-status
  encoded_at:
  - src/modules/ingestion/repository/llm-run.repository.ts
  how: retryLlmRunRow's UPDATE names no document context column, so the status survives every retry, whether produced, failed, too-long, single-chunk or empty. I did not change this, because it already holds.
- node: rules/knowledge-base/document-context-status-kept-on-reuse
  encoded_at:
  - src/modules/ingestion/service/preliminary-reading.ts
  how: The early return in produceDocumentContext means an extraction that reuses a held context writes no status, so it stays as it was. Before, a held context combined with a single-chunk or over-limit raw information would have reached recordSkippedReading and overwritten the status.
- node: rules/knowledge-base/document-context-read-first
  encoded_at:
  - src/modules/ingestion/service/preliminary-reading.ts
  how: The task reaches only the clause "when the run holds none". An existing context blocks any reading, and shouldReadDocument still requires a null context as well. The other clauses (v5 scope, more than one chunk, the 100000 ceiling, whole content read once before the first chunk) were delivered by the earlier preliminary-reading task and are unchanged.
- node: rules/knowledge-base/extraction-reads-chunks-in-order
  encoded_at:
  - src/modules/ingestion/service/extraction.service.ts
  how: The task reaches only the clause "and the run's document context when it holds one". The chunk loop passes the context returned by produceDocumentContext to every chunk. extraction.service.ts was not edited in this task.
- node: scenarios/knowledge-base/retried-run-reuses-context
  encoded_at:
  - src/modules/ingestion/service/preliminary-reading.ts
  - src/modules/ingestion/repository/llm-run.repository.ts
  how: Given a failed run that holds a context, retryLlmRunRow reopens it with the context intact. On the rerun produceDocumentContext makes no second reading, and each chunk is shown with the held context.
inferences:
- inferred: A held document context takes precedence over the skip statuses (single-chunk, too-long). A run that holds one is treated as reusing it, and no status is written.
  from: rules/knowledge-base/document-context-status-kept-on-reuse says an extraction that makes no reading because the run holds a context leaves the status as it was. Raw information is immutable, so the combination should not arise in practice. The ordering only makes the rule hold in every case.
- inferred: A run holding a context under a prompt version before v5 also returns the held context unchanged and writes nothing.
  from: The previous code already returned run.document_context for any run where shouldReadDocument was false. The new early return preserves that outcome.
preserved:
- retryLlmRunRow resets status to running, increments attempts, clears finished_at and rejects orphaned proposed fragments, and still touches no document context column.
- A run that holds no context and is v5 or later with a single chunk still records single-chunk and makes no reading.
- A run that holds no context and is v5 or later with more than one chunk and over 100000 UTF-16 code units still records too-long and makes no reading.
- A run that holds no context and is v5 or later with more than one chunk within the limit still makes a reading, records produced on success, and records failed on a provider error, an unparseable answer or a timeout.
- A run before v5 still makes no reading and records no status.
- Chunk prompts still show the held context, and the run responses (retry, get, extraction result) still surface document_context and document_context_status through documentContextFields.
deferred:
- what: The status a retried run with failed status records after a fresh reading. The code records produced on success through the existing recordProducedContext.
  why: rules/knowledge-base/document-context-status-recorded decides it, and no criterion here reaches that node. The task's Notes list it as a candidate. Its outcome already holds in the tree.
- what: shouldReadDocument still tests for a held context, which the early return in produceDocumentContext now makes redundant on that path.
  why: shouldReadDocument is exported and may be exercised by earlier tasks' tests. Removing the check would change an exported predicate and reach past this task's objective.
---

## What it is

A run that already holds a document context keeps it through retry and through the next extraction, which makes no preliminary reading and shows each chunk with that context. A run that holds none, including one whose status is failed, gets a reading.

## Notes

None.
