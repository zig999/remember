---
entries:
- field: statement
  unstated: The material has a retry reopen the run and reuse its recorded document context, without saying whether the retry keeps, clears or resets the run's recorded document context status.
  decided: Retrying an LLM run leaves its document context status unchanged.
  why: The status is the record of whether the run holds a context and why not, and the retry keeps the context, so it keeps the status as well. Clearing it would leave a reused context with no status, because rules/knowledge-base/document-context-status-recorded records produced only when a preliminary reading yields a context. An extraction that does read again after an earlier failure still records its own outcome under that rule.
---
