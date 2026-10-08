---
target: backend
title: Proof for recording an entity edit's operator note and its run
summary: Unit tests over an in-memory pg stand-in decide the note's run, source, content, chunk, fragment, confidence, run attribution and trimmed reason, without touching any database.
implementation: sha256:7e562ca9309c68edca9e639310d9803b85a54d8a329c6451d61481696b5ed6a2
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/entity-edit-backend-record-operator-note-suite
tests:
- file: src/__tests__/unit/curation/entity-edit-note.spec.ts
  name: the run an entity edit's note opens is one run of model operator and prompt version operator-edit-v1, completed, with no network call to a language model
  proves: 'Criteria: the run''s model is operator; its prompt version is operator-edit-v1; it is recorded as completed; recording the note calls no language model. Also the node''s fact that the edit opens one such run and completes it without a model call.'
  fails_when: The run is recorded with another model or prompt version, is left running or failed, more than one run is opened, or recordOperatorNote makes a network call (the SDK's fetch) while recording.
  demonstrates: rules/knowledge-base/entity-edit-run
- file: src/__tests__/unit/curation/entity-edit-note.spec.ts
  name: the raw information an entity edit's note records has source type other and metadata of operator_note true and the edited node's identity under node_id
  proves: 'Criteria: the raw information''s source type is other (stored as outro); its metadata records that it is an operator note; its metadata records the edited node''s identity. Also the UNDERDETERMINED entry on the exact metadata keys and marking value.'
  fails_when: 'Source type is anything but outro, or the metadata uses other keys or values (for example { kind: ''operator-note'', nodeId } or { is_operator_note: ''yes'', edited_node }), or lacks operator_note true or node_id equal to the edited node.'
  demonstrates: rules/knowledge-base/entity-edit-note-source
- file: src/__tests__/unit/curation/entity-edit-note.spec.ts
  name: the raw information an entity edit's note records holds in its content the reason, the moment of the edit and a nonce that keeps two notes of one reason and moment apart as two raw informations
  proves: 'Criteria: the content holds the reason; it holds the moment of the edit; it holds a nonce no other note''s content holds; two notes with the same reason are recorded as two raw informations. Also the node''s fact of reason, moment and a nonce of its own.'
  fails_when: A note's content omits the reason, the date or the time of day of the edit, or two notes of one reason and moment get equal content (no nonce), or the second note does not become a second raw information.
  demonstrates: rules/knowledge-base/entity-edit-note-content
- file: src/__tests__/unit/curation/entity-edit-note.spec.ts
  name: what an entity edit's note records is one raw information, one chunk holding all of its content and one accepted fragment anchored to that chunk whose text is the reason
  proves: 'Criteria: one raw chunk holds all of the raw information''s content; one information fragment is anchored to that chunk; its status is accepted; its text is the edit''s reason. Also the node''s fact of one raw information, one whole-content chunk and one accepted anchored fragment.'
  fails_when: More or fewer than one raw information, chunk or fragment is recorded; the chunk's text differs from the content or does not span from 0 to the content's end; the fragment is left proposed, is not anchored to that chunk, or its text is not the reason.
  demonstrates: rules/knowledge-base/entity-edit-note
- file: src/__tests__/unit/curation/entity-edit-note.spec.ts
  name: what an entity edit's note records records the information fragment at confidence 1.0
  proves: 'Criterion: the fragment''s confidence is 1.0, and the node''s fact that the note''s fragment is recorded at confidence 1.0.'
  fails_when: The fragment is recorded with any confidence other than 1.0.
  demonstrates: rules/knowledge-base/entity-edit-note-confidence
- file: src/__tests__/unit/curation/entity-edit-note.spec.ts
  name: the run that holds an entity edit's note is the run the edit opened, never a run that already existed, for both the fragment and the raw information it is anchored in
  proves: 'The UNDERDETERMINED entry on the run: the note''s fragment is recorded under the operator run the edit opened, and that run''s input is the note''s own raw information, even with another run already in the store.'
  fails_when: The fragment is recorded under a run that already existed, or the run the fragment belongs to takes as input a raw information other than the note's own (a new operator run is opened but the note is recorded under a different one).
  demonstrates: rules/knowledge-base/entity-edit-note-run
- file: src/__tests__/unit/curation/entity-edit-note.spec.ts
  name: a reason with whitespace around it is recorded as the information fragment's text without that whitespace
  proves: The UNDERDETERMINED entry on trimming, for the fragment's text, which must equal the reason without leading and trailing whitespace; also the criterion that the fragment's text is the edit's reason.
  fails_when: The fragment's text keeps leading or trailing whitespace of the reason as received, or only one side is trimmed.
- file: src/__tests__/unit/curation/entity-edit-note.spec.ts
  name: a reason with whitespace around it is recorded in the raw information's content without that whitespace on either side
  proves: 'The UNDERDETERMINED entry on trimming, for the raw information''s content: the reason appears in the content with no surrounding whitespace on either side; also the criterion that the content holds the edit''s reason.'
  fails_when: The content carries the reason with its received leading or trailing whitespace, or only one side is trimmed.
not_applicable:
- edge_case: absent, empty or whitespace-only reason
  why: Refusal belongs to the request boundary (the reason's required and length rules), not to this task's criteria or implemented nodes; the helper's inputs here are already validated and the task states no refusal.
- edge_case: a reason longer than the chunker's hard maximum, to expose a split chunk
  why: The reason is bounded at 1000 characters by the request schema, far below the chunker's 4000-character hard maximum, so no reachable input could be split; a test would assert over inputs the system never receives.
- edge_case: two notes recorded at once against one subject
  why: No criterion or node states concurrent behavior; uniqueness is by random nonce and by a database constraint no unit test can decide.
- edge_case: a dependency that fails or answers slowly
  why: No criterion states what the note does when the store fails; the transaction that rolls the note back belongs to the task that owns constraints/entity-edit-is-atomic.
- edge_case: a duplicate note
  why: 'Covered as a criterion: two notes of one reason and moment are two raw informations, tested in the content test.'
untested:
- 'domain/knowledge-base/entity-edit: the value object (a reason and the attribute changes, relating to one knowledge node) is held by the whole edit, including its changes, which other tasks implement. No finite test over this task decides it, and a test of the note''s reason alone would assert part of it as the whole.'
- 'rules/knowledge-base/entity-edit-reason-trimmed: the node also covers the curation action''s reason, which the task''s advisory leaves to the task recording the curation action. The note''s content and the fragment''s text are tested, but the node''s fact whole is not decided here, so no test names it.'
- 'Inference about behavior, pinned by no test and decided by no node: the note content layout (three newline-joined lines in the order reason, moment, nonce). The content tests accept any layout.'
- 'Inference about behavior, no node decides it: the moment''s textual form (ISO-8601 from toISOString). The content test checks only that the UTC calendar date and the time of day appear, so another format with both also passes.'
- 'Inference about behavior, no node decides it: the nonce is a random UUID; the test shows only that two notes of one reason and moment differ.'
- 'Inference about behavior, no node decides it: the run''s idempotency_key is composed from the content hash, model, prompt version and chunking version; its uniqueness per note is not tested.'
- 'Inference about behavior, no node decides it: the helper throws InvariantError when the fragment is not proposed or the run is not running; neither refusal is a criterion, so neither is tested.'
- 'Inference about behavior, no node decides it: the chunk''s chunking_version v1 and its offsets as code-point counts. Only an ASCII span of 0 to the content''s length is tested, so a non-BMP content''s offset unit is untested and no implemented node decides it.'
- 'Inference about behavior: the helper returns the run, raw information, chunk and fragment ids. No criterion states this return, so the tests read the in-memory store instead of the return value.'
- 'Inference about arrangement: the helper opens no transaction and reads no clock; transaction scope belongs to constraints/entity-edit-is-atomic and to the edit operation task.'
- Whether the real database accepts these statements and their constraints (raw_information.content_hash UNIQUE, llm_run.idempotency_key UNIQUE, the source_type enum accepting outro, the information_fragment text CHECK, the fragment_status transition) can only be decided against a real database. The stand-in mimics the two uniqueness constraints, but the tests prove behavior at the pg boundary, not the schema.
- 'Whether a language model is reached through some channel other than the global fetch (the Anthropic SDK''s transport) is not decided: the no-model-call test watches fetch only.'
- The ADVISORY notes about nodes this task does not implement (raw-information, raw-chunk, information-fragment, fragment-status, llm-run, source-type, entity-edit-is-atomic) are not obligations here and are not tested.
divergences:
- cites: TST-04
  file: src/__tests__/unit/curation/entity-edit-note.spec.ts
  departure: The spec sits at src/__tests__/unit/curation/entity-edit-note.spec.ts, mirroring the module (curation) but not the unit's service/ subdirectory.
  why: Every existing unit spec in this tree sits flat under its module (for example src/__tests__/unit/curation/dto.spec.ts and src/__tests__/unit/ingestion/*), so adding a service/ level for one file would split the suite across two layouts.
---
## What it is
Unit tests over an in-memory pg stand-in decide the note's run, source, content, chunk, fragment, confidence, run attribution and trimmed reason, without touching any database.

## Notes
None.
