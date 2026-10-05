---
title: Failed preliminary reading continues
summary: The path where the preliminary reading fails and the extraction goes on to read its chunks without a context.
rationale: The failure path is cut apart from producing the context because it changes with how provider failures are handled, a reason the successful reading does not share.
sources:
- intake/scope.md
- intake/material-aliases-fuzzy-contexto.md
objective: An extraction whose preliminary reading fails reads its chunks, completes, and records the failure.
criteria:
- When the preliminary reading answers a provider error, every chunk of the raw information is read.
- When the preliminary reading answers a provider error, the run completes.
- When the preliminary reading answers a provider error, the run records the document context status failed.
- When the preliminary reading answers a provider error, the run holds no document context.
depends_on:
- task/document-context/preliminary-reading
implements:
- rules/knowledge-base/failed-preliminary-reading-continues
- scenarios/knowledge-base/failed-context-reading-keeps-extracting
- rules/knowledge-base/document-context-status-recorded
- domain/knowledge-base/document-context-status
- domain/knowledge-base/llm-run
---
## What it is
A failure of the preliminary reading is caught and recorded on the run, and the chunk loop runs as it would without a context.

## Notes

Today provider failures during chunk reading close the run as failed and throw typed sentinels, and the preliminary reading must not reach that path.
UNDERDETERMINED, from the specification — The statement of rules/knowledge-base/failed-preliminary-reading-continues is "An extraction whose preliminary reading fails goes on to read its chunks". Its "failed" clause in rules/knowledge-base/document-context-status-recorded reads "failed when the preliminary reading fails". Neither rule limits the failure to a provider error. Every criterion is conditioned on "the preliminary reading answers a provider error", so the criteria never test any other way a preliminary reading can fail to yield a document context. Passes: The extraction continues and records failed only when the provider returns an error. When the preliminary reading returns an answer that cannot be parsed into a document context, or the call exceeds its time bound, the implementation fails the LLM run or leaves the document context status unset. For a run under v5 with more than one chunk and at most 100000 UTF-16 code units, rules/knowledge-base/document-context-status-recorded allows only "failed" when no document context is produced. rules/knowledge-base/failed-preliminary-reading-continues requires reading the chunks after any failed preliminary reading.
REMAINDER, from the specification — The statement of rules/knowledge-base/document-context-status-recorded has four status clauses and the condition "Under prompt version v5 and later". This task answers only the "failed" clause. The "single-chunk", "too-long" and "produced" clauses reach no criterion here. The v5-and-later condition is assumed by the criteria but never tested. Belongs: The other tasks under the document-context epic that record single-chunk (scenarios/knowledge-base/single-chunk-document-has-no-context), too-long and produced. The v5 condition belongs to the task implementing rules/knowledge-base/document-context-read-first and rules/knowledge-base/no-document-context-before-v5.
ADVISORY, from the specification — The summary says the chunks are read "without a context". The criteria check only that every chunk is read, not what each chunk is shown. What a chunk is shown, including "the run's document context when it holds one", is stated by rules/knowledge-base/extraction-reads-chunks-in-order. That node is left out of implements as a neighbor, because its other clauses (index order, source metadata, the 200-code-point tail of the previous chunk) belong to the chunk-reading task.
ADVISORY, from the specification — The run-extraction answer in contracts/knowledge-base/ingestion carries "its document context status and document context when it holds them". On this path the completed run should be answered with status failed and no document context. No criterion checks the answer, so the contract is left out of implements as a neighbor.
ADVISORY, from the specification — constraints/extraction-model-call-bounded says an extraction model call waits at most five minutes and is retried at most twice. The criteria do not say whether "answers a provider error" means the first provider error or the error left after the allowed retries. Under that constraint either reading is allowed. The constraint is left out of implements.
