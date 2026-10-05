---
title: Record the document context on the run
summary: The persistence of the document context of an LLM run, and of its document context status, through the llm_run repository.
rationale: Recording is cut apart from producing the context and from the run answers, because the stored shape is the interface the extraction writes through and the reads consume.
sources:
- intake/scope.md
- intake/material-aliases-fuzzy-contexto.md
objective: An LLM run holds a document context and a document context status that read back as they were recorded.
criteria:
- A run whose document context was recorded reads back with that context's summary.
- A run whose document context was recorded reads back with each listed entity's node type.
- A run whose document context was recorded reads back with each listed entity's names.
- A run whose document context was recorded reads back with the model that produced the context.
- A run whose document context status was recorded reads back with that status.
- A run with no recorded document context reads back holding none.
- A run with no recorded document context status reads back holding none.
implements:
- domain/knowledge-base/llm-run
- domain/knowledge-base/document-context
- domain/knowledge-base/document-entity
- domain/knowledge-base/document-context-status
---
## What it is
The llm_run repository writes and reads a document context, with its summary, entities and model, and a document context status.

## Notes

The llm_run columns this task reads and writes belong to the database target at migrations/, outside this backend target, and the material states that the schema change follows the explicit-approval rule of the project.
Run columns are listed by name in findLlmRunById, retryLlmRunRow and closeLlmRunRow.
UNDERDETERMINED, from the specification — rules/knowledge-base/retry-keeps-document-context-status states "Retrying an LLM run leaves its document context status unchanged." scenarios/knowledge-base/retried-run-reuses-context needs a retried run to keep the document context it held, so that each chunk is shown with that context and no second preliminary reading is made. No criterion of this task makes a retry keep either value. The criteria only check reading back what was recorded. Passes: An llm_run repository that stores the document context and its status and reads both back correctly, but whose retry operation sets document_context and document_context_status back to null. That breaks rules/knowledge-base/retry-keeps-document-context-status and makes the retried extraction read the whole document again, which scenarios/knowledge-base/retried-run-reuses-context refuses.
REMAINDER, from the specification — These candidate Rules decide whether a run's document context is produced and what it contains. No criterion of this task covers them: rules/knowledge-base/document-context-read-first (one reading before the first chunk, only under v5 and later, more than one chunk, at most 100000 UTF-16 code units, only when the run holds none), rules/knowledge-base/document-context-model (configured context model, else claude-haiku-4-5), rules/knowledge-base/document-context-summary-lines (summary at most 5 lines, with its line-counting clauses), rules/knowledge-base/document-context-summary-cut-to-five-lines (keep the first 5 lines) and rules/knowledge-base/document-context-entity-type-in-catalog (drop entities whose node type is not in the catalog). Belongs: The extraction act that makes the preliminary reading and builds the document context from what that reading returns, before the context is stored on the run.
REMAINDER, from the specification — These candidate Rules decide which document context status an extraction records, or that it records none. No criterion of this task covers them: rules/knowledge-base/document-context-status-recorded (single-chunk, too-long, failed or produced, each under its condition), rules/knowledge-base/document-context-status-kept-on-reuse (status left as it was when the context is reused), rules/knowledge-base/no-document-context-before-v5 (no reading, context or status under v4 and earlier) and rules/knowledge-base/failed-preliminary-reading-continues (a failed reading still goes on to read the chunks). Belongs: The extraction act that decides and records the run's document context status, in the extraction orchestration task.
REMAINDER, from the specification — These candidate Rules govern how chunks are read and how fragments are anchored. No criterion of this task covers them: rules/knowledge-base/extraction-reads-chunks-in-order (chunks in index order, each shown with the source's type, document date, title, reception time, the previous chunk's last 200 code points and the run's document context when it holds one) and rules/knowledge-base/extraction-anchors-to-read-chunk (a fragment is anchored to the chunk being read). Belongs: The extraction act that reads each chunk with the document context shown to the model and anchors the fragments it proposes.
REMAINDER, from the specification — The candidate constraints constraints/document-content-is-data (document content and its document context are shown to the model as data, kept apart from its instructions) and constraints/extraction-model-call-bounded (a model call waits at most five minutes and is retried at most twice) are about calling the model. No criterion of this task, which only stores data, covers them. Belongs: The extraction act that calls the language model for the preliminary reading and for each chunk.
ADVISORY, from the specification — contracts/knowledge-base/ingestion requires the run read responses (the MCP/REST run result and the HTTP 200 completed run) to carry "its document context status and document context when it holds them". This task stores the values and reads them back through the repository. It does not cover what the API returns.
