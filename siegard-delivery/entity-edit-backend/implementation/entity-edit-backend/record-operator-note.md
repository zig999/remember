---
target: backend
title: Record the edit's operator note and its run
summary: Adds a transaction-scoped helper that records one completed operator run, one operator-note raw information, one whole-content chunk and one accepted confidence-1.0 fragment carrying the trimmed reason, plus the repository statement that accepts the fragment.
task: sha256:8941ad8482c6d389d31c4c24379e22b007909c1df6eed43f5b82bac2198ef308
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/entity-edit-backend-record-operator-note-build
files:
- path: src/modules/curation/service/entity-edit-note.ts
  effect: 'Adds recordOperatorNote(client, { nodeId, reason, editedAt }). On the caller''s client and transaction it trims the reason. It builds the note content from the reason, the edit moment and a fresh UUID nonce. It inserts one raw information of source type outro with metadata { operator_note: true, node_id }, and one chunk holding the whole content. It opens an llm_run of model operator and prompt version operator-edit-v1 on that raw information, then inserts a fragment anchored to the chunk with the trimmed reason as text and confidence 1.0, and accepts it. Last, it closes the run as completed. It returns the run, raw information, chunk and fragment ids. It reads no clock, calls no language model and opens no transaction.'
- path: src/modules/curation/repository/curation.repository.ts
  effect: Adds acceptInformationFragment, a parameterized UPDATE that moves one fragment from proposed to accepted and returns the affected row count. Every existing function is unchanged.
criteria:
- criterion: The run's model is operator.
  met: true
  how: openOperatorRun passes OPERATOR_NOTE_MODEL ("operator") to insertLlmRun in src/modules/curation/service/entity-edit-note.ts.
- criterion: The run's prompt version is operator-edit-v1.
  met: true
  how: openOperatorRun passes OPERATOR_NOTE_PROMPT_VERSION ("operator-edit-v1") to insertLlmRun.
- criterion: The run is recorded as completed.
  met: true
  how: completeOperatorRun calls closeLlmRunRow with outcome "completed", which sets status and finished_at. It throws InvariantError if the run was not running.
- criterion: Recording the note calls no language model.
  met: true
  how: The helper imports only the ingestion repositories, the hash helpers, the chunker config and node:crypto. It makes no call to @anthropic-ai/sdk and no network call.
- criterion: The raw information's source type is other.
  met: true
  how: OPERATOR_NOTE_SOURCE_TYPE is "outro", the stored value of source-type's other, which the node's Description names as the material's word for it. insertNoteSource passes it to insertRawInformation.
- criterion: The raw information's metadata records that it is an operator note.
  met: true
  how: 'insertNoteSource writes metadata { operator_note: true, node_id }, the exact key and value rules/knowledge-base/entity-edit-note-source states.'
- criterion: The raw information's metadata records the edited node's identity.
  met: true
  how: The same metadata object carries node_id set to input.nodeId.
- criterion: The raw information's content holds the edit's reason.
  met: true
  how: composeNoteContent places the trimmed reason as the first line of the content.
- criterion: The raw information's content holds the moment of the edit.
  met: true
  how: composeNoteContent places input.editedAt.toISOString() as the second line. The caller supplies editedAt, so the helper reads no clock.
- criterion: The raw information's content holds a nonce no other note's content holds.
  met: true
  how: recordOperatorNote passes a fresh randomUUID() from node:crypto to composeNoteContent as the third line.
- criterion: Two notes with the same reason are recorded as two raw informations.
  met: true
  how: The nonce makes the content, and therefore the sha256 content_hash, differ between calls. The raw_information content_hash UNIQUE constraint therefore never collapses two notes into one, and the helper has no no-op branch.
- criterion: One raw chunk holds all of the raw information's content.
  met: true
  how: wholeContentChunk builds a single chunk with chunk_index 0, text equal to the whole content, offset_start 0 and offset_end equal to the code-point length. insertNoteSource inserts it directly instead of through chunkV1, so a long content can never be split.
- criterion: One information fragment is anchored to that chunk.
  met: true
  how: insertAcceptedNoteFragment calls insertFragmentWithSources with chunk_ids [chunkId], which inserts the information_fragment row and its one fragment_source row. The fragment belongs to the run opened in the same call.
- criterion: That fragment's status is accepted.
  met: true
  how: insertAcceptedNoteFragment calls acceptInformationFragment, which sets status 'accepted' on the proposed fragment, and throws InvariantError unless exactly one row changed.
- criterion: That fragment's confidence is 1.0.
  met: true
  how: OPERATOR_NOTE_CONFIDENCE = 1.0 is passed as the fragment's confidence.
- criterion: That fragment's text is the edit's reason.
  met: true
  how: The fragment text is the trimmed reason, the same value placed in the content. It is at most 1000 characters because the DTO bounds the reason, so the information_fragment text CHECK holds.
nodes:
- node: domain/knowledge-base/entity-edit
  encoded_at:
  - src/modules/curation/service/entity-edit-note.ts
  how: The helper takes the edit's reason and the edited node's identity, the two entity-edit attributes the note needs, and records the note for one edit. The changes attribute belongs to other tasks.
- node: rules/knowledge-base/entity-edit-note
  encoded_at:
  - src/modules/curation/service/entity-edit-note.ts
  - src/modules/curation/repository/curation.repository.ts
  how: The helper records one raw information, one chunk with the whole content and one accepted fragment anchored to that chunk with the reason as text. The accepting statement is acceptInformationFragment.
- node: rules/knowledge-base/entity-edit-note-content
  encoded_at:
  - src/modules/curation/service/entity-edit-note.ts
  how: composeNoteContent builds the content from the reason, the edit moment and a nonce of its own.
- node: rules/knowledge-base/entity-edit-note-source
  encoded_at:
  - src/modules/curation/service/entity-edit-note.ts
  how: 'OPERATOR_NOTE_SOURCE_TYPE is "outro" and the metadata is exactly { operator_note: true, node_id: <edited node id> }.'
- node: rules/knowledge-base/entity-edit-note-run
  encoded_at:
  - src/modules/curation/service/entity-edit-note.ts
  how: recordOperatorNote opens the run on the note's own raw information and inserts the fragment under that run's id, in one call. The note's raw information and fragment therefore belong to the run the edit opened, and no other run is reachable from the helper's inputs.
- node: rules/knowledge-base/entity-edit-note-confidence
  encoded_at:
  - src/modules/curation/service/entity-edit-note.ts
  how: OPERATOR_NOTE_CONFIDENCE = 1.0 is the fragment's confidence.
- node: rules/knowledge-base/entity-edit-run
  encoded_at:
  - src/modules/curation/service/entity-edit-note.ts
  how: The run has model operator and prompt version operator-edit-v1 and is closed as completed, with no model call in the helper.
- node: rules/knowledge-base/entity-edit-reason-trimmed
  encoded_at:
  - src/modules/curation/service/entity-edit-note.ts
  how: recordOperatorNote trims the reason once, before building the content and the fragment text. Trimming the curation action's reason belongs to the task that records that action.
inferences:
- inferred: The note content is three lines joined by a newline, in the order reason, ISO-8601 edit moment, nonce.
  from: rules/knowledge-base/entity-edit-note-content names the three parts and no layout. A reader of the source or a test can still locate each part.
- inferred: The stored source-type value for other is outro, a TypeScript SourceType the ingestion DTO already declares and the source_type enum in migrations/0001_init.sql defines.
  from: domain/knowledge-base/source-type's Description, which names `outro` as the material's word for other, and src/modules/ingestion/dto/source-type.ts.
- inferred: The single chunk is built directly with chunking_version v1 and code-point offsets rather than through chunkV1.
  from: chunkV1 can split content over its hard maximum, which would violate 'one chunk holds all of the content'. The chunk shape and offset convention follow RawChunkInput, the schema comments in migrations/0001_init.sql and CLAUDE.md's code-point convention.
- inferred: The fragment is inserted through the existing insertFragmentWithSources and then promoted from proposed to accepted by a new repository statement.
  from: insertFragmentWithSources leaves the table default 'proposed', and ingestion promotes with the same proposed-to-accepted UPDATE in graph-consolidation.service.ts, where it is private. Reusing the insert avoids duplicating it.
- inferred: The run's idempotency_key is composeIdempotencyKey over the note's content hash, the model, the prompt version and chunking version v1.
  from: llm_run.idempotency_key is NOT NULL UNIQUE in migrations/0001_init.sql and ingestRawInformation composes it this way. The nonce keeps every note's key distinct.
- inferred: The nonce is a random UUID from node:crypto.
  from: No node says what a nonce is. A UUID makes content collisions practically impossible, and node:crypto is already how src/modules/ingestion/hash.ts hashes.
- inferred: The helper trims the reason itself even though EditEntityBodySchema already trims it through ReasonRequiredSchema.
  from: rules/knowledge-base/entity-edit-reason-trimmed holds for whatever the helper receives, and the helper is a separate entry point from the DTO.
- inferred: The helper takes the edit moment as an argument and leaves transaction scope to the caller, as attribute-change-validity.ts does.
  from: 'The helper style the task named: suffix-less helper files under service/ with no clock reads, and constraints/entity-edit-is-atomic placing the transaction on the edit''s write operation.'
preserved:
- The curation.repository.ts functions, including insertCurationAction, loadItemsForUpdate and the supersession and provenance copy functions, keep their signatures and SQL.
- The ingestion repositories (insertRawInformation, insertRawChunks, insertLlmRun, closeLlmRunRow, insertFragmentWithSources) and hash.ts are only called, not edited, so the ingestion and propose-tool paths are unchanged.
- No route, MCP toolset, app wiring, error-mapping table or DTO is touched, so the closed curation tool whitelist and its count assertions are unchanged.
- The raw_information content_hash uniqueness and the llm_run idempotency_key uniqueness still guard every other caller. The note's own nonce does not weaken them.
deferred:
- what: The single transaction that holds this note's records together with the attributes, provenance and curation action, per constraints/entity-edit-is-atomic. The helper takes the caller's client and opens no transaction.
  why: It belongs to the task that writes the edit operation. This task's objective is only the note and its run.
- what: Trimming the curation action's reason, which rules/knowledge-base/entity-edit-reason-trimmed also covers.
  why: It belongs to the task that records the curation action under rules/knowledge-base/entity-edit-records-curation-action, as the task's advisory note says.
- what: Linking the recorded fragment as provenance to the new attribute rows, and using the run id as their created_by_run_id.
  why: It belongs to the tasks that write attributes. recordOperatorNote returns llmRunId and fragmentId for them.
---
## What it is
Adds a transaction-scoped helper that records one completed operator run, one operator-note raw information, one whole-content chunk and one accepted confidence-1.0 fragment carrying the trimmed reason, plus the repository statement that accepts the fragment.

## Notes
Inferred: The note content is three lines joined by a newline, in the order reason, ISO-8601 edit moment, nonce.
Inferred: The stored source-type value for other is outro, a TypeScript SourceType the ingestion DTO already declares and the source_type enum in migrations/0001_init.sql defines.
Inferred: The single chunk is built directly with chunking_version v1 and code-point offsets rather than through chunkV1.
Inferred: The fragment is inserted through the existing insertFragmentWithSources and then promoted from proposed to accepted by a new repository statement.
Inferred: The run's idempotency_key is composeIdempotencyKey over the note's content hash, the model, the prompt version and chunking version v1.
Inferred: The nonce is a random UUID from node:crypto.
Inferred: The helper trims the reason itself even though EditEntityBodySchema already trims it through ReasonRequiredSchema.
Inferred: The helper takes the edit moment as an argument and leaves transaction scope to the caller, as attribute-change-validity.ts does.
Deferred: The single transaction that holds this note's records together with the attributes, provenance and curation action, per constraints/entity-edit-is-atomic. The helper takes the caller's client and opens no transaction.
Deferred: Trimming the curation action's reason, which rules/knowledge-base/entity-edit-reason-trimmed also covers.
Deferred: Linking the recorded fragment as provenance to the new attribute rows, and using the run id as their created_by_run_id.
