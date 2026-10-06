---
target: backend
title: Implementation of extraction-anchors-to-read-chunk, standing
summary: The implementation of rules/knowledge-base/extraction-anchors-to-read-chunk already stands at the files the task lists; this delivery writes no source.
task: sha256:5c8ab8cafefa5fdb18a9c868469212e171dbfcc13cb2858ff32bf3a3b9df778c
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/close-testable-remainders-extraction-anchors-to-read-chunk-build
stands:
- src/modules/ingestion/service/extraction.service.ts
files: []
criteria:
- criterion: 'Two fragments, each proposed while reading chunk 2. One names chunk 2 and chunk 3. The other names a chunk of a different raw information. Expected result: each fragment is anchored to chunk 2 alone, [[chunk 2], [chunk 2]].'
  met: true
  how: The implementation stands at src/modules/ingestion/service/extraction.service.ts, and the proof beside this record decides it.
nodes:
- node: rules/knowledge-base/extraction-anchors-to-read-chunk
  how: 'As siegard-reconcile/aliases-fuzzy-context-3.md reads it: src/modules/ingestion/service/extraction.service.ts: held at the propose_fragment case of dispatchToolUse, which overrides the chunk ids with the chunk being read, and buildTool, which strips chunk_ids from the schema shown to the model — const withChunk = { ...(rawInput as Record<string, unknown>), chunk_ids: [chunkId], }; if (name === "propose_fragment") { schema = stripProperty(schema, "chunk_ids"); }'
---
## What it is
This record answers a proof task: the implementation stands at the files under `stands`, and no source was written.
Its build run shows the standing implementation still builds.

## Notes
None.
