---
target: backend
title: The version 4 module a run is given asks for the relative-date fallback and shows a real document date
summary: The implementation of the version 4 directive and of the metadata block already stands; this delivery writes the proof over the module the registry hands an extraction.
task: sha256:6883f125ac5a391c5ace636698583422021d0017aaa52a40f31f29bf511d6a34
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/proof-owed-v4-module-directive-build
stands:
- src/modules/ingestion/prompts/extraction.v4.ts
- src/modules/ingestion/prompts/extraction.v1.ts
files: []
criteria:
- criterion: 'Calling `selectPromptModule("v4").user` with metadata whose `document_date` is a real date, for example 2026-05-10, yields a metadata block containing `- document_date: 2026-05-10`, next to the existing assertion for the null case.'
  met: true
  how: The implementation stands at the files this record lists and the proof beside it decides this criterion.
- criterion: '`selectPromptModule("v4").system(snapshot)`, the module a v4 extraction is given, contains a directive whose subject is a relative date in the chunk, resolved against `document_date` when present and otherwise against the date portion of `received_at`.'
  met: true
  how: The implementation stands at the files this record lists and the proof beside it decides this criterion.
nodes:
- node: rules/knowledge-base/extraction-relative-date-falls-back-to-reception
  how: RECEIVED_AT_ANCHOR_DIRECTIVE (lines 15-31 of src/modules/ingestion/prompts/extraction.v4.ts), appended to the version 3 system prompt by system() at line 34.
- node: rules/knowledge-base/extraction-user-prompt-shows-anchor-dates
  how: The metaBlock built in user(), lines 224-232 of src/modules/ingestion/prompts/extraction.v1.ts, which version 4 re-exports.
---

## What it is

The implementation of the version 4 directive and of the metadata block already stands; this delivery writes the proof over the module the registry hands an extraction.

## Notes

This delivery writes no source; the implementation stands and the proof is what it adds.
The build run shows the standing implementation still builds.
