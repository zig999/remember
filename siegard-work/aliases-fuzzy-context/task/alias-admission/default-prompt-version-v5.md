---
title: Default prompt version is v5
summary: The prompt version a document ingestion runs under when it names none.
rationale: The default switch is cut apart from the v5 module because it changes the version recorded on every new run, a reason to change that the content of the prompt does not share.
sources:
- intake/scope.md
- intake/material-aliases-fuzzy-contexto.md
objective: A document ingestion that names no prompt version opens its run under v5.
criteria:
- An ingest_document call that names no prompt version opens its LLM run under prompt version v5.
depends_on:
- task/alias-admission/prompt-v5-asks-for-other-names
implements:
- rules/knowledge-base/default-prompt-version
- domain/knowledge-base/prompt-version
---
## What it is
The default prompt version constant moves from v4 to v5.

## Notes

The ingest_document handler reads the default when it creates a run.
