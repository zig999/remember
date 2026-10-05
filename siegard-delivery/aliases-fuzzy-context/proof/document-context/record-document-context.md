---
target: backend
implementation: sha256:77cee0f7fff13b1bba0cecd0eab172aca0546f5a34a1a2764ce4eb6fcb026f22
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/document-context-record-document-context-suite-2
title: Proof for recording the document context on an LLM run
summary: Tests that a run's document context and its document context status read back through findLlmRunById as they were recorded, and null when none was recorded.
tests:
- file: src/__tests__/unit/ingestion/llm-run-repository-document-context.spec.ts
  name: reads back with the summary of that context
  proves: A run whose document context was recorded reads back with that context's summary.
  fails_when: recordDocumentContext drops or alters the summary, or findLlmRunById stops returning the document_context column.
- file: src/__tests__/unit/ingestion/llm-run-repository-document-context.spec.ts
  name: reads back with the node type of each listed entity
  proves: A run whose document context was recorded reads back with each listed entity's node type.
  fails_when: the stored context loses an entity's node_type, attaches it to the wrong entity, or reorders the entities.
- file: src/__tests__/unit/ingestion/llm-run-repository-document-context.spec.ts
  name: reads back with the names of each listed entity
  proves: A run whose document context was recorded reads back with each listed entity's names.
  fails_when: the stored context loses, truncates or reorders an entity's names, or keeps only the first name.
- file: src/__tests__/unit/ingestion/llm-run-repository-document-context.spec.ts
  name: reads back with the model that produced the context
  proves: A run whose document context was recorded reads back with the model that produced the context.
  fails_when: the context's model is not stored, or the read returns the run's own extraction model (llm_run.model) in its place.
- file: src/__tests__/unit/ingestion/llm-run-repository-document-context.spec.ts
  name: reads back the document context with its summary, every entity and its model
  proves: The document-context value object (summary, many entities, model) reads back whole as it was recorded.
  fails_when: any of summary, entities or model is lost, added to or altered between recordDocumentContext and findLlmRunById.
  demonstrates: domain/knowledge-base/document-context
- file: src/__tests__/unit/ingestion/llm-run-repository-document-context.spec.ts
  name: reads back an entity with its one node type and all of its names in the recorded order
  proves: The document-entity value object (one node type, many names) reads back whole as it was recorded.
  fails_when: an entity reads back with a different node type, a missing or extra name, or its names in a different order.
  demonstrates: domain/knowledge-base/document-entity
- file: src/__tests__/unit/ingestion/llm-run-repository-document-context.spec.ts
  name: reads back with the status that was recorded
  proves: A run whose document context status was recorded reads back with that status.
  fails_when: recordDocumentContextStatus does not store the status, stores a different value, or findLlmRunById stops returning document_context_status.
- file: src/__tests__/unit/ingestion/llm-run-repository-document-context.spec.ts
  name: reads back holding no document context when none was recorded
  proves: A run with no recorded document context reads back holding none.
  fails_when: a run with no recorded context reads back with a value other than null, or findLlmRunById omits the column so the field is undefined.
- file: src/__tests__/unit/ingestion/llm-run-repository-document-context.spec.ts
  name: reads back holding no document context status when none was recorded
  proves: A run with no recorded document context status reads back holding none.
  fails_when: a run with no recorded status reads back with a value other than null, such as a default status, or findLlmRunById omits the column so the field is undefined.
- file: src/__tests__/unit/ingestion/llm-run-repository-document-context.spec.ts
  name: accepts produced, single-chunk, too-long and failed and nothing else
  proves: The document-context-status enumeration holds exactly produced, single-chunk, too-long and failed.
  fails_when: DocumentContextStatusSchema drops one of the four values, accepts a fifth, or accepts a near-spelling such as single_chunk or Produced.
  demonstrates: domain/knowledge-base/document-context-status
not_applicable:
- edge_case: recording against a run id that does not exist
  why: No criterion or bound node states what the repository does for an unknown run. The null return is the implementation's own choice, and a test would pin it.
- edge_case: an empty entities list, an empty summary, or an entity with no names
  why: document-context declares entities as optional and many, but no criterion or node states a boundary on these. Each is the same class as the listed-entity case the tests cover.
- edge_case: overwriting a context or status already recorded
  why: No criterion or node says whether a second record replaces the first. The implementation's overwrite is recorded as an inference and is not pinned.
- edge_case: two writers recording to one run at once
  why: No criterion or node states concurrent behavior for the context or status columns, so a test would assert a guarantee nobody made.
- edge_case: the store failing or answering slowly
  why: The task criteria only cover read-back of recorded values. Failure handling of the driver belongs to no obligation of this task.
untested:
- 'UNDERDETERMINED entry (a repository that stores and reads back the context and status but whose retry sets document_context and document_context_status to null): owed in task/document-context/retry-reuses-document-context, not here. Its criteria ''Retrying a run that holds a document context leaves that context recorded'' and ''Retrying a run whose document context status is produced leaves that status recorded'' exclude exactly that implementation. No test of this task covers retry.'
- 'domain/knowledge-base/llm-run: its fact spans model, prompt_version, status, attempts, the timestamps, the run summary and the complete, fail and retry operations. No finite test decides it whole, and this task only touches the document_context and document_context_status attributes. The tests read those two attributes back and do not claim the node.'
- 'That the stored column accepts all four enum values: the document_context_status enum belongs to migrations/0008, outside this target, and the stand-in store has no enum. Only the TypeScript enumeration is proven, through domain/knowledge-base/document-context-status.'
- 'Read-back through the RETURNING lists of recordDocumentContext, recordDocumentContextStatus, retryLlmRunRow and closeLlmRunRow, and through insertLlmRun and findLlmRunByIdempotencyKey: only findLlmRunById is read back, because it is the read the extraction loads. The criteria name no other path, and a retry keeping the values belongs to the retry task.'
- 'Inference about behavior: recordDocumentContext and recordDocumentContextStatus each update one column, ignore the run''s status (no running guard), and overwrite what the column held. No node decides this, so it is left unproven rather than pinned.'
- 'Inference about shape: the jsonb keys summary, entities[].node_type, entities[].names and model, with the node type held as its name string. No node fixes the key names. The tests read through the DTO''s field names, so they follow whichever shape the DTO declares.'
- 'Inference about behavior: the jsonb read is typed through the pg generic with no runtime Zod parse, so a malformed stored value is not refused on read. No criterion or node says it should be, and the stand-in store cannot show the real driver''s jsonb parsing.'
- 'Inference about behavior: insertToolCallStandalone now discards the connection with release(true) when ROLLBACK fails. This is unrelated to the criteria and no node decides it, so no test covers it.'
divergences:
- cites: TST-04
  file: src/__tests__/unit/ingestion/llm-run-repository-document-context.spec.ts
  departure: The file sits at src/__tests__/unit/ingestion/ under a name made from the task's subject, not at a path that mirrors modules/ingestion/repository/llm-run.repository.ts.
  why: Every ingestion unit test in the tree sits flat in that directory. A different name keeps this task's tests from colliding with a sibling task's tests over the same repository file.
---

## What it is

Tests that a run's document context and its document context status read back through findLlmRunById as they were recorded, and null when none was recorded.

## Notes

The UNDERDETERMINED entry about retry is owed in task/document-context/retry-reuses-document-context, whose criteria exclude the implementation it names.
Red run run/document-context-record-document-context-suite failed at lint on a parse error in the new spec, sent back to the test author; green on suite-2.
