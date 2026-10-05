---
target: backend
task: sha256:997fa153a01f92527f75f959c9a07661cd5bcdc732839387b2a39c194af74258
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/prove-aliases-fuzzy-context-2
title: Record the document context on the run
summary: The llm_run repository can now write a run's document context and its document context status separately, and every query that returns a run row reads both back, null when none was recorded. An entity in a document context must list at least one name.
files:
- path: src/modules/ingestion/dto/llm-run.dto.ts
  effect: Declares DocumentContextStatusSchema (produced, single-chunk, too-long, failed), DocumentEntitySchema ({ node_type, names }, with names a string array of at least one element, so an entity listed with no name is refused with the issue on the path "names"), DocumentContextSchema ({ summary, entities, model }, which inherits that refusal through its entities) and their inferred types. The file's comments were removed, since it was delivered whole.
- path: src/modules/ingestion/repository/ingestion.repository.ts
  effect: LlmRunRow now carries document_context (DocumentContext | null) and document_context_status (DocumentContextStatus | null). insertLlmRun and findLlmRunByIdempotencyKey return both columns. The file's comments were removed.
- path: src/modules/ingestion/repository/llm-run.repository.ts
  effect: Adds recordDocumentContext, which writes document_context as jsonb, and recordDocumentContextStatus, which writes document_context_status. Each updates one column only. findLlmRunById and the RETURNING lists of retryLlmRunRow and closeLlmRunRow now return both columns. retryLlmRunRow's SET clause is unchanged, so a retry neither sets nor clears either value. Comments were removed.
criteria:
- criterion: A run whose document context was recorded reads back with that context's summary.
  met: true
  how: recordDocumentContext stores the whole DocumentContext as jsonb, summary included. findLlmRunById selects document_context, and LlmRunRow.document_context.summary is the stored value.
- criterion: A run whose document context was recorded reads back with each listed entity's node type.
  met: true
  how: Each entry of entities is stored as { node_type, names } in the same jsonb. It reads back through findLlmRunById, retryLlmRunRow and closeLlmRunRow as document_context.entities[].node_type.
- criterion: A run whose document context was recorded reads back with each listed entity's names.
  met: true
  how: entities[].names, a string array, is stored and returned unchanged in the same jsonb, in the same order. DocumentEntitySchema (src/modules/ingestion/dto/llm-run.dto.ts) now requires at least one name per entity, so a context whose entity lists none is refused with the issue on "names" and is never recorded.
- criterion: A run whose document context was recorded reads back with the model that produced the context.
  met: true
  how: DocumentContext.model is stored in the jsonb. It is separate from llm_run.model, which is the extraction model.
- criterion: A run whose document context status was recorded reads back with that status.
  met: true
  how: recordDocumentContextStatus sets the column through a ::document_context_status cast. The four values are the enum of migrations/0008_llm_run_document_context.sql. The run reads back with LlmRunRow.document_context_status equal to it.
- criterion: A run with no recorded document context reads back holding none.
  met: true
  how: The column is nullable with no default, and no insert path writes it. Every run query returns document_context, which is null, and LlmRunRow types it DocumentContext | null.
- criterion: A run with no recorded document context status reads back holding none.
  met: true
  how: Same as above for document_context_status. It is null until recordDocumentContextStatus writes it, and the two columns are written independently, so a run can hold a status without a context (for example too-long).
nodes:
- node: domain/knowledge-base/llm-run
  encoded_at:
  - src/modules/ingestion/repository/ingestion.repository.ts
  - src/modules/ingestion/repository/llm-run.repository.ts
  how: LlmRunRow gains the attributes document_context and document_context_status, optional in the node and so nullable here. Every llm_run query typed to LlmRunRow selects or returns both. recordDocumentContext and recordDocumentContextStatus are the write path. The retry operation leaves both columns untouched (rules/knowledge-base/retry-keeps-document-context-status, honored by omission from the UPDATE's SET list). The summary attribute and the response mapping were not reached.
- node: domain/knowledge-base/document-context
  encoded_at:
  - src/modules/ingestion/dto/llm-run.dto.ts
  how: 'DocumentContextSchema declares its shape: summary, entities (many) and model. It is stored as one jsonb value on the run. Its entities are DocumentEntitySchema, so the minimum of one name per entity applies to every entity it lists.'
- node: domain/knowledge-base/document-entity
  encoded_at:
  - src/modules/ingestion/dto/llm-run.dto.ts
  how: DocumentEntitySchema declares the entity as names plus its node type. names is a string array that requires at least one element, because an entity listed with no name gives the model nothing to recognise in a chunk (the node's decision log). The node type is held as the node-type's name string, under the key node_type.
- node: domain/knowledge-base/document-context-status
  encoded_at:
  - src/modules/ingestion/dto/llm-run.dto.ts
  how: DocumentContextStatusSchema is the closed enumeration produced, single-chunk, too-long, failed, the same four values as the database enum.
inferences:
- inferred: 'The jsonb shape is { summary, entities: [{ node_type, names }], model }, with node type stored as the node-type''s name string under the key node_type, and entities always an array (empty when the document lists none).'
  from: domain/knowledge-base/document-context and document-entity, whose attributes are summary, entities, model and names, with a reference to node-type. node-type is identified by its name attribute. The ingestion DTOs already carry node types as name strings under node_type (AffectedNodeSchema, propose_node).
- inferred: The two columns are written by two separate functions that each update one column. They do not require status = 'running', and they overwrite whatever the column held.
  from: The criteria treat context and status as independent. The rules for when each is written (document-context-read-first, document-context-status-recorded, status-kept-on-reuse) belong to the extraction task. closeLlmRunRow is the precedent for a one-purpose UPDATE ... RETURNING returning LlmRunRow | null.
- inferred: The jsonb read is typed through the pg query generic (DocumentContext | null), with no runtime Zod parse. The write serializes with JSON.stringify and a ::jsonb cast.
  from: The inventory's convention for lifecycle rows. tool_call.arguments and raw_information.metadata are handled this way in the same repository files.
- inferred: insertToolCallStandalone's empty catch around ROLLBACK, which only held a comment, now marks the connection for discard and calls client.release(true). A client whose rollback failed is destroyed by the pool instead of being returned to it.
  from: The comment rule forces the comment out of the file, and COR-01 and ESLint's no-empty forbid leaving the catch empty. The pg release(err) argument is the handling that keeps the original error propagating.
- inferred: The names minimum is expressed as .min(1) on the array alone. Each name string is not constrained to be non-blank.
  from: The node's decision log requires that names is required and that an entity with no name is useless, which is a rule about the list. No node states a rule about the content of an individual name, so none was added.
divergences:
- from: the project's comment rule (siegard framework) applied to the files this task writes; the inventory's note that the tree carries many comments
  departure: The comments of the three files written whole (llm-run.dto.ts, ingestion.repository.ts, llm-run.repository.ts) were removed, including JSDoc and the header notes that cited BR-19, BR-23 and CLAUDE.md.
  why: The framework rule is that a session writing a source file delivers it without comments. The facts those comments carried live in the specification, and deferred below are the ones the code alone no longer states.
preserved:
- Every existing query of llm_run.repository.ts and ingestion.repository.ts keeps its filter, ordering and parameters; only column lists grew.
- retryLlmRunRow still resets status, attempts and finished_at only where status = 'failed', rejects orphaned proposed fragments, and does not touch the document context columns.
- closeLlmRunRow still closes only a running run and sets finished_at.
- insertToolCallStandalone still writes the audit row in its own transaction, rolls back and rethrows the original error on failure, and releases the client in every path.
- The exported names and signatures of the repository functions that existed are unchanged. LlmRunRow's existing fields and the LlmRunResponse wire schemas are unchanged.
deferred:
- what: aggregateToolCallOutcomes exceeds the thirty-line function limit (MNT-01, flagged by the lint step's max-lines-per-function as a warning).
  why: It predates this task and splitting it is a refactor outside recording the document context.
- what: The run read responses (LlmRunResponseSchema, toLlmRunResponse, the inline mapping in readFinalRun, get_ingestion_status) do not yet carry document_context or document_context_status.
  why: contracts/knowledge-base/ingestion requires it, but the task states it only stores and reads back through the repository, and the inventory marks the copies to be kept in step.
- what: Nothing yet calls recordDocumentContext or recordDocumentContextStatus. The preliminary reading, the choice of status, and context reuse on retry are the extraction task's.
  why: rules/knowledge-base/document-context-read-first and document-context-status-recorded decide what is written and when; no criterion here covers them.
- what: 'Tests: none written, by role. The new write functions and the read-back criteria need proof tests, and the existing mocked-row tests omit the two new fields.'
  why: Another judge's work.
---

## What it is

The llm_run repository can now write a run's document context and its document context status separately, and every query that returns a run row reads both back, null when none was recorded. An entity in a document context must list at least one name.

## Notes

Re-delivered after red run run/prove-aliases-fuzzy-context, whose diagnosis read cause code: DocumentEntitySchema names gained a minimum of one element.
