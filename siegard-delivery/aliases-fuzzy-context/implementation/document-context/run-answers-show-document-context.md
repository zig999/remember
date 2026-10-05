---
target: backend
task: sha256:249cc04e5087d53fdadf4f50781892fbf57a9088b5bfb260d8f3d2001cb67ea9
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/document-context-run-answers-show-document-context-build
title: Run answers show the document context
summary: The read-llm-run answers (REST and MCP) and the run-extraction answer now carry a run's document context status and its whole document context (summary, entities, model) when the run holds them, and omit each key when it does not.
files:
- path: src/modules/ingestion/dto/llm-run.dto.ts
  effect: LlmRunResponseSchema gains optional document_context_status and document_context, using the DocumentContextStatusSchema and DocumentContextSchema already declared in the file. The inferred LlmRunResponse type therefore accepts both fields and every answer built as LlmRunResponse can carry them.
- path: src/modules/ingestion/service/run-document-context.ts
  effect: New. documentContextFields(row) returns an object holding document_context_status only when the run row holds a status and document_context only when it holds a context. A run that holds neither yields no keys. It is the single shared mapping from run row to the two answer fields.
- path: src/modules/ingestion/service/llm-run.service.ts
  effect: toLlmRunResponse spreads documentContextFields(row). getLlmRunById (REST GET /llm-runs/:id, the get_ingestion_status MCP tool, and the ingest_document already-ingested read) now answers with the document context status and context of a run that holds them. The file was delivered whole without comments, per the project's comment rule. Behavior is otherwise unchanged.
- path: src/modules/ingestion/service/extraction.service.ts
  effect: readFinalRun, the run-extraction mapping, spreads documentContextFields(row). The completed run returned by POST /llm-runs/:llmRunId/run and by runLlmExtraction carries the status and context recorded on the run. Partial failed-run answers read through the same function carry them as well.
- path: src/modules/ingestion/mcp/mcp-schemas.ts
  effect: GetIngestionStatusOutputSchema, the MCP result schema that mirrors LlmRunResponseSchema, gains optional document_context_status and document_context, reusing the dto schemas instead of redeclaring them. The file was delivered whole without comments. All describe() strings, which are emitted tool text, are unchanged.
criteria:
- criterion: The read-llm-run answer over REST carries the document context status of a run that holds one.
  met: true
  how: GET /llm-runs/:llmRunId in ingestion.routes.ts sends the body of getLlmRunById. toLlmRunResponse spreads documentContextFields(row), which sets document_context_status whenever the row's status is non-null. findLlmRunById already selects document_context_status.
- criterion: The read-llm-run answer over REST carries the document context of a run that holds one.
  met: true
  how: The same spread sets document_context from row.document_context when it is non-null. The value is the whole document context, with summary, entities and model.
- criterion: The read-llm-run answer over MCP carries the document context status of a run that holds one.
  met: true
  how: The get_ingestion_status handler in ingest-toolset.ts returns getLlmRunById as the result, so it takes the same mapping. GetIngestionStatusOutputSchema now declares document_context_status.
- criterion: The read-llm-run answer over MCP carries the document context of a run that holds one.
  met: true
  how: The same result carries document_context. GetIngestionStatusOutputSchema declares it with DocumentContextSchema.
- criterion: The run-extraction answer carries the document context status of the completed run when it holds one.
  met: true
  how: readFinalRun in extraction.service.ts, which builds the answer of runLlmExtraction, spreads documentContextFields(row) over the row it re-reads after the run closes. The status recorded during extraction is therefore included.
- criterion: The run-extraction answer carries the document context of the completed run when it holds one.
  met: true
  how: The same spread carries document_context in readFinalRun.
- criterion: A read of a run that holds no document context carries none.
  met: true
  how: documentContextFields omits the document_context key when row.document_context is null, so a run under v4 or earlier, or one that produced no context, answers without the key. The key is omitted, never null, following the affected_nodes convention in the same mappers.
nodes:
- node: contracts/knowledge-base/ingestion
  encoded_at:
  - src/modules/ingestion/service/llm-run.service.ts
  - src/modules/ingestion/service/extraction.service.ts
  - src/modules/ingestion/service/run-document-context.ts
  - src/modules/ingestion/mcp/mcp-schemas.ts
  - src/modules/ingestion/dto/llm-run.dto.ts
  how: The read-llm-run answer (REST and MCP) and the run-extraction answer carry "its document context status and document context when it holds them". The mappings add each field only when the run holds it, and the wire schemas declare them. The other operations of the contract were not reached.
- node: domain/knowledge-base/llm-run
  encoded_at:
  - src/modules/ingestion/dto/llm-run.dto.ts
  how: The LLMRun attributes document_context and document_context_status, already recorded on the run row by the preceding task, are now exposed on the run's wire shape, LlmRunResponseSchema. Both stay optional there, as they are on the node.
- node: domain/knowledge-base/document-context
  encoded_at:
  - src/modules/ingestion/dto/llm-run.dto.ts
  - src/modules/ingestion/mcp/mcp-schemas.ts
  how: The document context is shown as its whole value, summary, entities and model, through DocumentContextSchema, which already declares that shape. It is shown unaltered and never treated as a source of knowledge.
- node: domain/knowledge-base/document-entity
  encoded_at:
  - src/modules/ingestion/dto/llm-run.dto.ts
  how: Each entity of the shown context keeps its node type and its names, as DocumentEntitySchema declares. Nothing in this task changes that schema.
- node: domain/knowledge-base/document-context-status
  encoded_at:
  - src/modules/ingestion/dto/llm-run.dto.ts
  - src/modules/ingestion/mcp/mcp-schemas.ts
  how: The status is shown with the four values of the enumeration (produced, single-chunk, too-long, failed) through DocumentContextStatusSchema. It is shown exactly as recorded, with no default for a run that holds none.
inferences:
- inferred: The answers carry the whole document context (summary, entities and model), not only the summary.
  from: domain/knowledge-base/document-context defines the value as a summary, the entities and the model that read it, and contracts/knowledge-base/ingestion says the answers carry "its document context". The task's UNDERDETERMINED note names a summary-only value as the least that would pass the criteria, not as what the node holds.
- inferred: A run that holds no document context status answers without the status key. No default such as single-chunk is reported.
  from: contracts/knowledge-base/ingestion carries the status only "when it holds them", and the note says a run under v4 or earlier records none. A default would state a fact the specification does not hold.
- inferred: An absent context or status is omitted from the wire rather than sent as null.
  from: The convention of toLlmRunResponse and readFinalRun for affected_nodes, which omit the key instead of emitting null.
- inferred: The shared mapper also makes the retry-llm-run and internal close answers carry the status and context of the run they return.
  from: The task note says toLlmRunResponse carries the new fields, and retryLlmRun and closeLlmRun use it. The addition is optional and additive, and the retry-llm-run answer in the contract does not forbid it.
- inferred: The row-to-fields mapping lives in one new non-service file, called by both mappers, rather than being written into each.
  from: The inventory's must_not_duplicate entry for the run-to-response mapping, and MNT-03. The file is not a .service.ts, so LAY-04 is not engaged.
preserved:
- The existing fields of the run answer (id, model, prompt_version, started_at, finished_at, status, attempts, input_raw_information_id, idempotency_key, summary) keep their values and shapes in both mappers.
- affected_nodes is still attached only to a completed run, and is still omitted rather than null when absent, in both getLlmRunById and readFinalRun.
- The derive and cache path of affected nodes in getLlmRunById, including its best-effort catch, is unchanged.
- The retry and close paths (retryLlmRun, closeLlmRun) keep their errors and their transitions. Only the mapped answer gains the optional fields.
- The tool descriptions and every describe() text in mcp-schemas.ts, which are emitted tool text, are unchanged, and so are the input schemas and INGEST_TOOL_NAMES.
- The error classes and error codes in llm-run.service.ts (RunNotRetryableError, RunNotRunningError) are unchanged.
deferred:
- what: The run-extraction criterion for a run without a context, and criterion 11 as a whole, name only reads, so the run-extraction and MCP read answers are not each named by it.
  why: This is the ADVISORY note on the task about the criterion's wording, which is the task's and the plan's to settle. The implementation omits the context on all three answers.
---

## What it is

The read-llm-run answers (REST and MCP) and the run-extraction answer now carry a run's document context status and its whole document context (summary, entities, model) when the run holds them, and omit each key when it does not.

## Notes

An absent context or status is omitted from the answer rather than sent as null; the shared mapper also makes the retry answer carry them.
