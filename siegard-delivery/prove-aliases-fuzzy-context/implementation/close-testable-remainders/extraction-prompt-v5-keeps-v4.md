---
target: backend
title: Implementation of extraction-prompt-v5-keeps-v4, standing
summary: The implementation of rules/knowledge-base/extraction-prompt-v5-keeps-v4 already stands at the files the task lists; this delivery writes no source.
task: sha256:37883998de9e767598ca74d628393e67d35fe8356e03b6efd905df93b07a3d35
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/close-testable-remainders-extraction-prompt-v5-keeps-v4-build
stands:
- src/modules/ingestion/prompts/extraction.v5.ts
files: []
criteria:
- criterion: 'Run the same line-containment comparison of v4 against v5 over more catalogs, one per catalog shape the current test leaves out: a non-temporal link type, a link type allowing several current values, a link type requiring neither valid_from nor valid_to on change, an attribute key of each other value type, an attribute key with no valid values, a node type without a description, and an empty catalog. For each catalog the expected result is that no v4 instruction line is missing from v5.'
  met: true
  how: The implementation stands at src/modules/ingestion/prompts/extraction.v5.ts, and the proof beside this record decides it.
nodes:
- node: rules/knowledge-base/extraction-prompt-v5-keeps-v4
  how: 'As siegard-reconcile/aliases-fuzzy-context-3.md reads it: src/modules/ingestion/prompts/extraction.v5.ts: held at system(), which builds the v5 prompt from the full v4 system prompt. — return `${systemV4(catalog)}\n${OTHER_NAMES_DIRECTIVE}`;'
---
## What it is
This record answers a proof task: the implementation stands at the files under `stands`, and no source was written.
Its build run shows the standing implementation still builds.

## Notes
None.
