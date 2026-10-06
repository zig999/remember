---
target: backend
title: Implementation of extraction-asks-for-other-names, standing
summary: The implementation of rules/knowledge-base/extraction-asks-for-other-names already stands at the files the task lists; this delivery writes no source.
task: sha256:c750a0733ef525d88d5e4d32fa27de54ed8dd26bdebdce64a0381313099472ac
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/close-testable-remainders-extraction-asks-for-other-names-build
stands:
- src/modules/ingestion/prompts/extraction.v5.ts
files: []
criteria:
- criterion: For each held version from v5 on, run one extraction and capture the system text it sends. Assert that a single instruction does all of the following. It asks for the other names proposed with each node to be names the text itself gives for that same entity. It gives an acronym, a short name and another spelling as examples of such names. It excludes a pronoun alone and a role alone from them. The test should fail when any one of these is missing from that instruction, even if the same words appear elsewhere in the prompt.
  met: true
  how: The implementation stands at src/modules/ingestion/prompts/extraction.v5.ts, and the proof beside this record decides it.
nodes:
- node: rules/knowledge-base/extraction-asks-for-other-names
  how: 'As siegard-reconcile/aliases-fuzzy-context-3.md reads it: src/modules/ingestion/prompts/extraction.v5.ts: held at OTHER_NAMES_DIRECTIVE, appended to the prompt by system(). — "- With each `propose_node`, ALSO send in `aliases` every OTHER name the text", " itself gives that same entity: an acronym (\"PMO\" for \"Escritório de", "- A pronoun alone (\"ele\", \"ela\", \"isso\") is NOT another name of the entity.", "- A role alone (\"o gerente\", \"o cliente\", \"a diretora\") is NOT another name of"'
---
## What it is
This record answers a proof task: the implementation stands at the files under `stands`, and no source was written.
Its build run shows the standing implementation still builds.

## Notes
None.
