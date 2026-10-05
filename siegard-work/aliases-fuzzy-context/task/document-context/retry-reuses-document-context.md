---
title: Retry reuses the document context
summary: The retry path, which keeps a recorded document context and makes a preliminary reading again only when the previous attempt produced none.
rationale: Retry is cut apart from the first reading because it changes with the retry lifecycle in the llm_run repository, a reason the first reading does not share.
sources:
- intake/scope.md
- intake/material-aliases-fuzzy-contexto.md
objective: A retried run reuses the document context it already holds and makes a preliminary reading only when it holds none.
criteria:
- Retrying a run that holds a document context leaves that context recorded.
- Retrying a run whose document context status is produced leaves that status recorded.
- When a retried run holding a document context is extracted again, no preliminary reading is made.
- When a retried run holding a document context is extracted again, each chunk is shown with the context the run already held.
- When a retried run whose document context status is failed is extracted again, a preliminary reading is made.
depends_on:
- task/document-context/preliminary-reading
- task/document-context/chunk-prompt-shows-context
implements:
- domain/knowledge-base/llm-run
- domain/knowledge-base/document-context-status
- rules/knowledge-base/retry-keeps-document-context-status
- rules/knowledge-base/document-context-status-kept-on-reuse
- rules/knowledge-base/document-context-read-first
- rules/knowledge-base/extraction-reads-chunks-in-order
- scenarios/knowledge-base/retried-run-reuses-context
---
## What it is
retryLlmRunRow keeps the document context, and the orchestrator skips the preliminary reading for a run that already holds one.

## Notes

runLlmExtraction loads the run through findLlmRunById, and both have to agree on what a recorded context means.
UNDERDETERMINED, from the specification — rules/knowledge-base/retry-keeps-document-context-status states "Retrying an LLM run leaves its document context status unchanged." That covers every status. The criterion "Retrying a run whose document context status is produced leaves that status recorded." covers only produced. No criterion checks what a retry does to a failed, too-long or single-chunk status. Passes: A retry that keeps a produced status but clears a failed, too-long or single-chunk status to empty, so that a run is left running with no document context status until its extraction runs again.
UNDERDETERMINED, from the specification — rules/knowledge-base/document-context-status-kept-on-reuse states "Under prompt version v5 and later, an extraction that makes no preliminary reading because its run already holds a document context leaves the run's document context status as it was." Every criterion about the status speaks of the retry itself. None checks the status after the retried run's extraction has reused the context it holds. Passes: An extraction under a retried run that holds a document context makes no preliminary reading, shows each chunk with the held context, and then clears the run's document context status or overwrites it.
UNDERDETERMINED, from the specification — The criterion "When a retried run whose document context status is failed is extracted again, a preliminary reading is made." stops at the reading. The status the run records after that reading is governed by rules/knowledge-base/document-context-status-recorded ("... failed when the preliminary reading fails and produced when it yields a document context"). The log beside rules/knowledge-base/retry-keeps-document-context-status says the same: "An extraction that does read again after an earlier failure still records its own outcome under that rule." That node is a candidate but is not in implements, because no criterion reaches it. A criterion on this outcome would bring it in. Passes: A retried run with a failed status reads the whole document again, the reading yields a document context, and the run keeps the status failed because the retry path keeps statuses as they were.
REMAINDER, from the specification — Of the clauses in the statement of rules/knowledge-base/document-context-read-first, this task reaches only "when the run holds none". The other clauses are not reached by any criterion here. They are the v5-and-later scope, the more-than-one-chunk condition, the 100000 UTF-16 code unit ceiling, reading the whole content once, and reading it before the first chunk. Belongs: The task that implements the first preliminary reading of a document (producing the run's document context before the first chunk is read), under the same document-context epic.
REMAINDER, from the specification — Of the clauses in the statement of rules/knowledge-base/extraction-reads-chunks-in-order, this task reaches only "and the run's document context when it holds one". The other clauses are not reached by any criterion here. They are reading the chunks one at a time in index order, and showing the source's type, document date, title and reception time and the last 200 Unicode code points of the chunk before. Belongs: The task that implements how an extraction presents each chunk to the model (the chunk-reading loop of the extraction).
ADVISORY, from the specification — No candidate Rule states that a retry keeps the run's document context. The criterion "Retrying a run that holds a document context leaves that context recorded." is backed only by scenarios/knowledge-base/retried-run-reuses-context ("each chunk is shown with the document context the run already held") together with "when the run holds none" in rules/knowledge-base/document-context-read-first. The statement of rules/knowledge-base/retry-keeps-document-context-status names the status, not the context. That the retry keeps the context appears only in that node's log, as a reading of the material.
ADVISORY, from the specification — The constraint constraints/extraction-model-call-bounded ("... is retried at most twice") is about retrying a single language-model call. That is a different act from retrying an LLM run, so it neighbors this task and does not govern it. The retry-llm-run answer in contracts/knowledge-base/ingestion is unchanged by this task, so that contract is not named either.
