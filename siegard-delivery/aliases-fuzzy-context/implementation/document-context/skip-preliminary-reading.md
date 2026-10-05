---
target: backend
task: sha256:07617f6875ed55a99c4ab507b3760cb7335ed0d4c2bb54078b27197900779021
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/document-context-skip-preliminary-reading-build-2
title: Skip the preliminary reading and record why
summary: Under v5 and later, an extraction over a single-chunk raw information, or over a multi-chunk one whose content exceeds 100000 UTF-16 code units, makes no preliminary reading and records the document context status single-chunk or too-long, then reads its chunks as before, each shown the last 200 Unicode code points of the chunk before it.
files:
- path: src/modules/ingestion/service/preliminary-reading.ts
  effect: produceDocumentContext now classifies the run before deciding to read. The new exported skippedReadingStatus returns single-chunk for a v5-or-later run holding exactly one chunk whatever its length, too-long for a v5-or-later run holding more than one chunk whose content length exceeds PRELIMINARY_READING_MAX_CONTENT_UNITS, and null otherwise (including every prompt version before v5). On a non-null result, recordSkippedReading stores the status on the llm_run row through recordDocumentContextStatus, logs document_context_reading_skipped, and produceDocumentContext returns without a model call and without storing a document context. The status write is the former recordFailedReading persistence, extracted into recordReadingStatus and reused by the failed path with the same behavior and the same error text.
- path: src/modules/ingestion/service/extraction.service.ts
  effect: The previous-chunk tail shown to the model for the next chunk is now the last PREV_TAIL_CHARS (200) Unicode code points of the chunk, computed by the new lastCodePoints helper (Array.from(text).slice(-count).join("")), instead of the last 200 UTF-16 code units. A chunk ending in astral characters now carries all 200 code points, and the tail can no longer start on a lone surrogate. For BMP-only text the result is unchanged. The chunk loop, its order and everything else in the file are untouched, so every skipped extraction still reads all of its chunks.
criteria:
- criterion: Under v5, an extraction over a raw information of 1 chunk makes no preliminary reading.
  met: true
  how: skippedReadingStatus returns single-chunk when chunkCount === SINGLE_CHUNK_COUNT and the prompt version reads document first. produceDocumentContext then returns after recordSkippedReading and never reaches readDocumentContext, so no model call is made. The check precedes the length test, so a one-chunk content above 100000 units also makes none.
- criterion: Under v5, an extraction over a raw information of 1 chunk records the document context status single-chunk.
  met: true
  how: recordSkippedReading calls recordReadingStatus, which calls recordDocumentContextStatus with "single-chunk" on the run row.
- criterion: Under v5, an extraction over more than one chunk whose content exceeds 100000 characters makes no preliminary reading.
  met: true
  how: skippedReadingStatus returns too-long when chunkCount > 1 and content.length > PRELIMINARY_READING_MAX_CONTENT_UNITS (100_000). produceDocumentContext returns before readDocumentContext. shouldReadDocument already required content.length <= the limit, so the two branches are exclusive.
- criterion: Under v5, an extraction over more than one chunk whose content exceeds 100000 characters records the document context status too-long.
  met: true
  how: The too-long result of skippedReadingStatus is written to the run by recordReadingStatus through recordDocumentContextStatus.
- criterion: Under v5, an extraction whose content exceeds 100000 characters reads every chunk.
  met: true
  how: produceDocumentContext only returns on the skip path, and runLlmExtraction in extraction.service.ts goes on to its for-loop over all chunks in index order. Each chunk after the first is shown the last 200 Unicode code points of the chunk before it (lastCodePoints), with the source's type, document date, title and reception time as before.
- criterion: Under v4, an extraction records no document context status.
  met: true
  how: skippedReadingStatus returns null when readsDocumentFirst(prompt_version) is false (v4 and every earlier version, and any string not of the form v<N>). shouldReadDocument is also false, so produceDocumentContext writes nothing.
nodes:
- node: rules/knowledge-base/document-context-status-recorded
  encoded_at:
  - src/modules/ingestion/service/preliminary-reading.ts
  how: The single-chunk and too-long clauses are skippedReadingStatus, with the 100000 UTF-16 code-unit count taken as String.length and single-chunk taking precedence whatever the length. They are written by recordSkippedReading. The failed and produced clauses were delivered by earlier tasks in the same file and are unchanged.
- node: rules/knowledge-base/document-context-read-first
  encoded_at:
  - src/modules/ingestion/service/preliminary-reading.ts
  how: The skip branch sits before the read decision and is exclusive with shouldReadDocument, which remains the one place deciding that a multi-chunk content of at most 100000 units is read once before the first chunk. This task adds no reading, so it honors the rule's boundary and adds the complement.
- node: rules/knowledge-base/no-document-context-before-v5
  encoded_at:
  - src/modules/ingestion/service/preliminary-reading.ts
  how: skippedReadingStatus opens with the readsDocumentFirst guard, so under v4 and earlier no status is written. The existing shouldReadDocument guard already kept those versions from reading or storing a context.
- node: rules/knowledge-base/extraction-reads-chunks-in-order
  encoded_at:
  - src/modules/ingestion/service/extraction.service.ts
  how: Chunks are read one at a time in index order, as before. The previous-chunk tail was cut by UTF-16 code units and so contradicted the node's "last 200 Unicode code points"; it is now cut by code points in lastCodePoints, which this task owes because the node is one it implements and the skip paths rely on that loop. The other parts of the node (source metadata, the document context shown when one exists) are delivered by the chunk-prompt tasks and are untouched.
- node: domain/knowledge-base/llm-run
  encoded_at:
  - src/modules/ingestion/dto/llm-run.dto.ts
  - src/modules/ingestion/repository/ingestion.repository.ts
  how: The document_context_status attribute was already declared by the record-document-context task. This task is a new writer of it, through the existing recordDocumentContextStatus in the llm-run repository, and changes no shape.
- node: domain/knowledge-base/document-context-status
  encoded_at:
  - src/modules/ingestion/dto/llm-run.dto.ts
  how: DocumentContextStatusSchema already holds produced, single-chunk, too-long and failed. This task starts producing single-chunk and too-long and adds no value.
- node: scenarios/knowledge-base/single-chunk-document-has-no-context
  encoded_at:
  - src/modules/ingestion/service/preliminary-reading.ts
  how: Given a 1-chunk raw information under v5, produceDocumentContext makes no model call and the run row gets single-chunk. The one chunk is then read by the unchanged loop.
inferences:
- inferred: The 100000 limit is counted in UTF-16 code units (String.length), not Unicode code points, for the too-long test.
  from: rules/knowledge-base/document-context-status-recorded and document-context-read-first state the unit explicitly, and the existing shouldReadDocument already uses content.length. The task's criteria say "characters" and do not fix the unit (UNDERDETERMINED note in the task), so the rule's unit was followed.
- inferred: A raw information holding zero chunks records no status under v5.
  from: The status rule names single-chunk for one chunk and too-long for more than one chunk, and names nothing for zero chunks. The skip test uses chunkCount === 1 and chunkCount > 1, so nothing is written.
- inferred: The branch tests the prompt version with the existing readsDocumentFirst (major >= 5), not equality with v5.
  from: The rules say "v5 and later" (ADVISORY note in the task), and readsDocumentFirst is the helper the earlier tasks used for the same decision.
- inferred: Re-running a skipped extraction (retry) writes the same status again, and a retry whose run already holds a document context leaves the stored status alone.
  from: The status is a function of the raw information and prompt version alone, so rewriting is idempotent. The retry path for a stored context belongs to the retry-reuses-document-context task.
- inferred: A failure while writing the skipped status fails the extraction through the existing catch in runLlmExtraction.
  from: recordProducedContext already propagates its write errors the same way. The status write is a required audit fact rather than a best-effort one, and the specification states no tolerance for it.
- inferred: The event name document_context_reading_skipped and its fields (llm_run_id, document_context_status).
  from: The sibling log events document_context_produced and document_context_reading_failed in the same file and the project's pino convention of snake_case event strings.
- inferred: The constant PREV_TAIL_CHARS keeps its name and its exported status while now counting code points, so no importer changes.
  from: The node fixes the count at 200 and the unit at Unicode code points. Renaming an exported constant reaches beyond what the node requires.
divergences:
- from: src/modules/ingestion/prompts/extraction.v1.ts (comment on prev_tail, line 22)
  departure: The comment there still says the tail is the last 200 "characters". It was left as it is, although the tail is now counted in code points.
  why: The file is not part of this delivery's source, and the comment rule's route is a separate finding against prose. Editing it here would widen the task.
preserved:
- A v5 extraction over more than one chunk with content of at most 100000 units and no stored context still makes the preliminary reading and records produced.
- A failed preliminary reading still records failed and the extraction still reads its chunks (failed-reading-continues).
- A run that already holds a document context is not read again, and no skip status overwrites its produced status.
- Under v4 and every earlier prompt version, no preliminary reading is made and no context or status is written.
- The failed-status write keeps its connection handling and its InvariantError text, "vanished before its failed document context status was recorded".
- For chunk text made only of BMP characters, the previous-chunk tail is identical to what it was (the last 200 characters, or the whole chunk when shorter).
- The turn cap, the fatal-burst handling and the usage logging in the chunk loop are unchanged.
- The wire shape of the run and tool-call responses is unchanged.
deferred:
- what: Unit and integration tests for the skip paths (single-chunk, too-long, a one-chunk content over 100000 units, v4 and v3 recording nothing, and the code-point versus code-unit boundary).
  why: The implementer writes no tests, and another judge proves the work. The astral-tail test already in preliminary-reading.spec.ts covers the tail correction.
- what: Surfacing document_context_status in the run answers (get_ingestion_status, GET /llm-runs/:id).
  why: It belongs to the run-answers-show-document-context task. readFinalRun and toLlmRunResponse are untouched here.
- what: The wording "characters" in the comment at src/modules/ingestion/prompts/extraction.v1.ts line 22, now inaccurate for the tail.
  why: Prose in a file nobody is editing is a finding for the comment route, not a change inside this task.
- what: The task's UNDERDETERMINED notes on the reach of criteria 3 to 5 (character unit, reading the single chunk, order and tail of the skip-path chunks, v4 and v3 clauses).
  why: They are the binder's findings on the task, and this record states how each was resolved under inferences. Settling the unit in the criteria's wording is for the scope or the specification.
---

## What it is

Under v5 and later, an extraction over a single-chunk raw information, or over a multi-chunk one whose content exceeds 100000 UTF-16 code units, makes no preliminary reading and records the document context status single-chunk or too-long, then reads its chunks as before, each shown the last 200 Unicode code points of the chunk before it.

## Notes

The 100000 limit is counted in UTF-16 code units (String.length), the unit the rules state; a raw information of zero chunks records no status.
The previous-chunk tail is now cut by Unicode code points, as rules/knowledge-base/extraction-reads-chunks-in-order states; the first suite run went red on that tail and the diagnosis read cause code.
