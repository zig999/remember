---
target: backend
title: Implementation of extraction-reads-chunks-in-order, standing
summary: The implementation of rules/knowledge-base/extraction-reads-chunks-in-order already stands at the files the task lists; this delivery writes no source.
task: sha256:4f798582e67fdf4dd3e167362def34395fb4d256c155d8c1b9b2e2136afe2b6d
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/close-testable-remainders-extraction-reads-chunks-in-order-build
stands:
- src/modules/ingestion/prompts/extraction.v1.ts
- src/modules/ingestion/prompts/extraction.v5.ts
- src/modules/ingestion/service/extraction.service.ts
files: []
criteria:
- criterion: An extraction over raw information whose received_at differs from the run's started_at shows received_at, and not started_at, in every chunk prompt.
  met: true
  how: The implementation stands at src/modules/ingestion/prompts/extraction.v1.ts, src/modules/ingestion/prompts/extraction.v5.ts, src/modules/ingestion/service/extraction.service.ts, and the proof beside this record decides it.
- criterion: An extraction of a multi-chunk run that holds no document context (a v4 run, or one whose preliminary reading failed) never has two chunk model calls in flight at the same time.
  met: true
  how: The implementation stands at src/modules/ingestion/prompts/extraction.v1.ts, src/modules/ingestion/prompts/extraction.v5.ts, src/modules/ingestion/service/extraction.service.ts, and the proof beside this record decides it.
nodes:
- node: rules/knowledge-base/extraction-reads-chunks-in-order
  how: 'As siegard-reconcile/aliases-fuzzy-context-3.md reads it: src/modules/ingestion/prompts/extraction.v5.ts: held at user(), for the part about showing the run''s document context when it holds one. The chunk order, the 200-code-point carry-over and the per-source fields are not stated in this file. — const blocks = userV1(args); if (args.documentContext === undefined || args.documentContext === null) { return blocks; } const context = contextBlock(args.documentContext); return blocks.flatMap((block, index) => index === 0 ? [block, context] : [block]); src/modules/ingestion/service/extraction.service.ts: held at the chunk loop in runLlmExtraction, with PREV_TAIL_CHARS and lastCodePoints, and loadRunContext, which builds the source metadata. runChunkLoop hands the model the metadata, the previous tail and the document context. — for (const chunk of chunks) { ... prevTail, documentContext, ... } prevTail = lastCodePoints(chunk.text, PREV_TAIL_CHARS); export const PREV_TAIL_CHARS = 200 as const; source_type: rawInfo.source_type, document_date: stringOrNull(metadataObj["document_date"]), title: stringOrNull(metadataObj["title"]), received_at: rawInfo.received_at.toISOString()'
---
## What it is
This record answers a proof task: the implementation stands at the files under `stands`, and no source was written.
Its build run shows the standing implementation still builds.

## Notes
The binding of rules/knowledge-base/extraction-reads-chunks-in-order on src/modules/ingestion/prompts/extraction.v1.ts carries moved drift (the node changed since that file was last judged); the file itself is unchanged, so the implementation was taken as standing.
