---
title: Run answers show the document context
summary: The read-llm-run answers over REST and MCP, and the run-extraction answer, carrying the document context and its status when the run holds them.
rationale: The answers are cut apart from recording because they consume the recorded run shape rather than decide it.
sources:
- intake/scope.md
- intake/material-aliases-fuzzy-contexto.md
objective: The read-llm-run and run-extraction answers show the document context of a run and its status when the run holds them.
criteria:
- The read-llm-run answer over REST carries the document context status of a run that holds one.
- The read-llm-run answer over REST carries the document context of a run that holds one.
- The read-llm-run answer over MCP carries the document context status of a run that holds one.
- The read-llm-run answer over MCP carries the document context of a run that holds one.
- The run-extraction answer carries the document context status of the completed run when it holds one.
- The run-extraction answer carries the document context of the completed run when it holds one.
- A read of a run that holds no document context carries none.
depends_on:
- task/document-context/record-document-context
implements:
- contracts/knowledge-base/ingestion
- domain/knowledge-base/llm-run
- domain/knowledge-base/document-context
- domain/knowledge-base/document-entity
- domain/knowledge-base/document-context-status
---
## What it is
The run-to-response mappings and the run wire schemas gain the document context and its status.

## Notes

toLlmRunResponse in llm-run.service.ts and the inline mapping in readFinalRun in extraction.service.ts both map runs, and both carry the new fields.
GetIngestionStatusOutputSchema and LlmRunResponseSchema mirror each other.
UNDERDETERMINED, from the specification — The criteria say the answers "carry the document context" but never say what that value contains. contracts/knowledge-base/ingestion says the read-llm-run and run-extraction answers carry "its document context". domain/knowledge-base/document-context defines that value as a summary, a list of entities and the model that read it. domain/knowledge-base/document-entity defines each entity as a node type plus the names the document uses for it. A test that only checks a document context field is present cannot tell the whole value from part of it. Passes: The read-llm-run answer (REST and MCP) and the run-extraction answer carry a document context holding only its summary. The entities, with their node types and names, and the model are left out. The answer still has a document context field for a run that holds one and none for a run that holds none, so every criterion is met.
UNDERDETERMINED, from the specification — Each status criterion covers only a run that holds a document context status. Criterion 11 covers only a run with no document context. No criterion covers a run with no document context status, for example a run under prompt version v4 or earlier. contracts/knowledge-base/ingestion carries the status only "when it holds them". rules/knowledge-base/no-document-context-before-v5 says such a run records no document context status. Passes: The read and run-extraction answers report a default document context status, for example single-chunk, for a run that holds none, such as a run under prompt version v4. No document context is carried, so criterion 11 still holds, and no criterion checks the status of a run that holds none.
REMAINDER, from the specification — These candidate rules state how an extraction produces, keeps or shows the document context and its status. This task only shows what the run already holds, so no criterion reaches any clause of them. The rules are rules/knowledge-base/document-context-read-first, rules/knowledge-base/document-context-status-recorded, rules/knowledge-base/document-context-status-kept-on-reuse, rules/knowledge-base/document-context-model, rules/knowledge-base/document-context-summary-lines, rules/knowledge-base/document-context-summary-cut-to-five-lines, rules/knowledge-base/document-context-entity-type-in-catalog, rules/knowledge-base/failed-preliminary-reading-continues, rules/knowledge-base/extraction-reads-chunks-in-order, rules/knowledge-base/extraction-anchors-to-read-chunk and rules/knowledge-base/no-document-context-before-v5. The candidate constraints constraints/document-content-is-data and constraints/extraction-model-call-bounded are in the same position. Belongs: The extraction tasks of the document-context epic, which make the preliminary reading, record the document context and its status on the run, and show the context to the model chunk by chunk.
REMAINDER, from the specification — The statement of rules/knowledge-base/retry-keeps-document-context-status, "Retrying an LLM run leaves its document context status unchanged.", reaches no criterion of this task. This task reads the status; it does not change it on retry. Belongs: The retry-llm-run task, which handles how a retried run keeps its document context status.
ADVISORY, from the specification — Criterion 11, "A read of a run that holds no document context carries none.", does not say which answers it covers. Of the three answers in this task's criteria, the run-extraction answer is not a read; the other two are read-llm-run over REST and over MCP. contracts/knowledge-base/ingestion attaches "when it holds them" to read-llm-run and run-extraction alike. The criterion may need to name each answer for a test to cover all three.
