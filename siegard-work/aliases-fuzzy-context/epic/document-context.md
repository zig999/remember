---
title: Document context before chunk reading
summary: Under v5, an extraction over a multi-chunk document first reads it whole into a document context, records the context and its status on the run, and shows it with every chunk.
rationale: The epic follows the third section of the material. The call-bound constraint is covered because the preliminary reading is a model call made by an extraction.
sources:
- intake/scope.md
- intake/material-aliases-fuzzy-contexto.md
covers:
- domain/knowledge-base/document-context
- domain/knowledge-base/document-entity
- domain/knowledge-base/document-context-status
- domain/knowledge-base/llm-run
- rules/knowledge-base/document-context-read-first
- rules/knowledge-base/document-context-status-recorded
- rules/knowledge-base/document-context-summary-lines
- rules/knowledge-base/document-context-model
- rules/knowledge-base/failed-preliminary-reading-continues
- rules/knowledge-base/extraction-reads-chunks-in-order
- constraints/document-content-is-data
- constraints/extraction-model-call-bounded
- contracts/knowledge-base/ingestion
- scenarios/knowledge-base/context-links-later-mention
- scenarios/knowledge-base/single-chunk-document-has-no-context
- scenarios/knowledge-base/failed-context-reading-keeps-extracting
- scenarios/knowledge-base/retried-run-reuses-context
- scenarios/knowledge-base/preliminary-reading-proposes-nothing
- rules/knowledge-base/no-document-context-before-v5
- rules/knowledge-base/retry-keeps-document-context-status
- rules/knowledge-base/document-context-status-kept-on-reuse
- rules/knowledge-base/document-context-summary-cut-to-five-lines
- rules/knowledge-base/extraction-anchors-to-read-chunk
- rules/knowledge-base/document-context-entity-type-in-catalog
---
## What it is
Under v5, an extraction whose raw information holds more than one chunk and at most 100000 characters reads the whole content once before its first chunk, and so produces a document context.
The run records its document context and its document context status, and the run reads answer with both.
Each chunk is shown with the document context alongside what it is shown today.
A failed preliminary reading never fails the extraction, and a retried run reuses a context it already holds.

## Notes
Directed ingestion reads no chunks and calls no model, so it stays outside this epic.
Recording the context on the run needs new llm_run columns, which belong to the database target at migrations/ and not to this backend target.
