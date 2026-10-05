---
target: backend
implementation: sha256:76585b36ebbafdcc10ea1f53d733e33e98e666802728b47d63410cc2afab405c
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/prove-aliases-fuzzy-context-2
title: Proof for recording the document context on an LLM run
summary: Tests that a run's document context and its status read back through findLlmRunById as recorded and null when none was recorded, that the status enumeration holds exactly four values, and that the context and entity schemas refuse an entity with no node type or names and a context with no summary or model.
tests:
- file: src/__tests__/unit/ingestion/llm-run-repository-document-context.spec.ts
  name: reads back with the summary of that context
  proves: A run whose document context was recorded reads back with that context's summary.
  fails_when: recordDocumentContext drops or alters the summary, or findLlmRunById stops returning the document_context column.
- file: src/__tests__/unit/ingestion/llm-run-repository-document-context.spec.ts
  name: reads back with the node type of each listed entity
  proves: A run whose document context was recorded reads back with each listed entity's node type.
  fails_when: the stored context loses an entity's node_type, attaches it to the wrong entity, or reorders the entities.
- file: src/__tests__/unit/ingestion/llm-run-repository-document-context.spec.ts
  name: reads back with the names of each listed entity
  proves: A run whose document context was recorded reads back with each listed entity's names.
  fails_when: the stored context loses, truncates or reorders an entity's names, or keeps only the first name.
- file: src/__tests__/unit/ingestion/llm-run-repository-document-context.spec.ts
  name: reads back with the model that produced the context
  proves: A run whose document context was recorded reads back with the model that produced the context.
  fails_when: the context's model is not stored, or the read returns the run's own extraction model (llm_run.model) in its place.
- file: src/__tests__/unit/ingestion/llm-run-repository-document-context.spec.ts
  name: reads back the document context with its summary, every entity and its model
  proves: The document-context value object (summary, many entities, model) reads back whole as it was recorded. This is the read-back part of the node only, so it carries no demonstrates.
  fails_when: any of summary, entities or model is lost, added to or altered between recordDocumentContext and findLlmRunById.
- file: src/__tests__/unit/ingestion/llm-run-repository-document-context.spec.ts
  name: reads back an entity with its one node type and all of its names in the recorded order
  proves: The document-entity value object (one node type, many names) reads back whole as it was recorded. This is the read-back part of the node only, so it carries no demonstrates.
  fails_when: an entity reads back with a different node type, a missing or extra name, or its names in a different order.
- file: src/__tests__/unit/ingestion/llm-run-repository-document-context.spec.ts
  name: reads back with the status that was recorded
  proves: A run whose document context status was recorded reads back with that status.
  fails_when: recordDocumentContextStatus does not store the status, stores a different value, or findLlmRunById stops returning document_context_status.
- file: src/__tests__/unit/ingestion/llm-run-repository-document-context.spec.ts
  name: reads back holding no document context when none was recorded
  proves: A run with no recorded document context reads back holding none.
  fails_when: a run with no recorded context reads back with a value other than null, or findLlmRunById omits the column so the field is undefined.
- file: src/__tests__/unit/ingestion/llm-run-repository-document-context.spec.ts
  name: reads back holding no document context status when none was recorded
  proves: A run with no recorded document context status reads back holding none.
  fails_when: a run with no recorded status reads back with a value other than null, such as a default status, or findLlmRunById omits the column so the field is undefined.
- file: src/__tests__/unit/ingestion/llm-run-repository-document-context.spec.ts
  name: accepts produced, single-chunk, too-long and failed and nothing else
  proves: The schema accepts the four declared statuses and refuses near-spellings and other words. This is a sample of candidates, not the complete list, so its demonstrates claim moved to the new enumeration test below.
  fails_when: DocumentContextStatusSchema drops one of the four values, accepts a fifth among the candidates, or accepts a near-spelling such as single_chunk or Produced.
- file: src/__tests__/unit/ingestion/document-context-dto.spec.ts
  name: holds exactly produced, single-chunk, too-long and failed
  proves: One input, the complete list of members the schema declares, against one expected result, the four values the document-context-status enumeration declares, with no fifth member.
  fails_when: DocumentContextStatusSchema gains a fifth member, loses one of the four, or renames one.
  demonstrates: domain/knowledge-base/document-context-status
- file: src/__tests__/unit/ingestion/document-context-dto.spec.ts
  name: is refused when it lacks a summary
  proves: A document context lacking its summary, a required attribute of document-context, is refused by the schema that declares the context, and the refusal names the summary.
  fails_when: DocumentContextSchema accepts a context with no summary, or refuses it for a reason other than the summary.
- file: src/__tests__/unit/ingestion/document-context-dto.spec.ts
  name: is refused when it lacks the model that produced it
  proves: A document context lacking its model, a required attribute of document-context, is refused by the schema that declares the context, and the refusal names the model.
  fails_when: DocumentContextSchema accepts a context with no model, or refuses it for a reason other than the model.
- file: src/__tests__/unit/ingestion/document-context-dto.spec.ts
  name: is refused when it lacks a node type
  proves: A document entity lacking its node type, the one reference document-entity requires, is refused by the schema that declares the entity, and the refusal names node_type.
  fails_when: DocumentEntitySchema accepts an entity with no node_type, or refuses it for a reason other than the node type.
- file: src/__tests__/unit/ingestion/document-context-dto.spec.ts
  name: is refused when it carries no names at all
  proves: A document entity whose names are absent, names being required on document-entity, is refused, and the refusal names the names field.
  fails_when: DocumentEntitySchema accepts an entity with no names field, or refuses it for a reason other than the names.
- file: src/__tests__/unit/ingestion/document-context-dto.spec.ts
  name: is refused when its names list is empty
  proves: A document entity with an empty names list is refused. The decision log of document-entity makes names required because an entity listed with no name gives the model nothing to recognise.
  fails_when: DocumentEntitySchema accepts an entity whose names list is empty.
not_applicable:
- edge_case: recording against a run id that does not exist
  why: No criterion or bound node states what the repository does for an unknown run. The null return is the implementation's own choice, and a test would pin it.
- edge_case: an empty entities list or an empty summary
  why: document-context declares entities as optional and many, and no criterion or node states a boundary for them. Each is the same class as the listed-entity case the tests cover. An empty names list is a different matter, and it is tested.
- edge_case: overwriting a context or status already recorded
  why: No criterion or node says whether a second record replaces the first. The implementation's overwrite is recorded as an inference and is not pinned.
- edge_case: two writers recording to one run at once
  why: No criterion or node states concurrent behavior for the context or status columns, so a test would assert a guarantee nobody made.
- edge_case: the store failing or answering slowly
  why: The task criteria only cover read-back of recorded values. Failure handling of the driver belongs to no obligation of this task.
untested:
- 'UNDERDETERMINED entry (a repository that stores and reads back the context and status but whose retry sets document_context and document_context_status to null): owed in task/document-context/retry-reuses-document-context, not here. Its criteria "Retrying a run that holds a document context leaves that context recorded" and "Retrying a run whose document context status is produced leaves that status recorded" exclude exactly that implementation. No test of this task covers retry.'
- 'domain/knowledge-base/llm-run: its fact spans model, prompt_version, status, attempts, the timestamps, the run summary and the complete, fail and retry operations. No finite test decides it whole, and this task only touches the document_context and document_context_status attributes. The tests read those two attributes back and do not claim the node.'
- 'domain/knowledge-base/document-context, remainder assertions 2 to 4: that each chunk of a multi-chunk document is extracted showing that context''s summary and entities, that the context recorded on the run equals the context shown to the model, and that a context entity no chunk mentions yields no node, alias, link, attribute or provenance. All three are behavior of the extraction orchestration, outside this task (rules/knowledge-base/extraction-reads-chunks-in-order and document-context-read-first). The last also needs the database. The node therefore carries no demonstrates, and the earlier demonstrates claim on the read-back test was withdrawn, because it covered the node only in part.'
- 'domain/knowledge-base/document-context, remainder assertion 1, the part "nothing is recorded": recordDocumentContext parses nothing and writes what it is handed, so no test here can show a refused context leaving the run holding none. Only the schema-level refusal of a missing summary or model is proven. No node says the repository itself refuses.'
- 'domain/knowledge-base/document-entity, remainder assertion 1: that the input handed to the model for a chunk carries the entity with its node type and every name. This is the extraction orchestration''s clause, owed to the tasks that build the chunk input, and is not tested here. The node therefore carries no demonstrates, and the earlier claim on the read-back test was withdrawn.'
- 'domain/knowledge-base/document-entity, remainder assertion 3 in its second half: a node type that names one that does not exist is refused. Whether a node type exists is decided against the catalog, which is database content (rules/knowledge-base/document-context-entity-type-in-catalog). A stand-in catalog would reimplement the rule, so it is not tested here. Only the absent node type is proven, at the schema.'
- 'domain/knowledge-base/document-entity, remainder assertions 2 and 3 in their "nothing recorded on the run" part: as for the context, the repository performs no parse, so only the schema-level refusals are proven.'
- 'That the stored column accepts all four enum values: the document_context_status enum belongs to migrations/0008, outside this target, and the stand-in store has no enum. Only the TypeScript enumeration is proven, through domain/knowledge-base/document-context-status.'
- 'Read-back through the RETURNING lists of recordDocumentContext, recordDocumentContextStatus, retryLlmRunRow and closeLlmRunRow, and through insertLlmRun and findLlmRunByIdempotencyKey: only findLlmRunById is read back, because it is the read the extraction loads. The criteria name no other path, and a retry keeping the values belongs to the retry task.'
- 'Inference about behavior: recordDocumentContext and recordDocumentContextStatus each update one column, ignore the run''s status (no running guard), and overwrite what the column held. No node decides this, so it is left unproven rather than pinned.'
- 'Inference about shape: the jsonb keys summary, entities[].node_type, entities[].names and model, with the node type held as its name string. No node fixes the key names. The tests read through the DTO''s field names, so they follow whichever shape the DTO declares.'
- 'Inference about behavior: the jsonb read is typed through the pg generic with no runtime Zod parse, so a malformed stored value is not refused on read. No criterion or node says it should be, and the stand-in store cannot show the real driver''s jsonb parsing.'
- 'Inference about behavior: insertToolCallStandalone now discards the connection with release(true) when ROLLBACK fails. This is unrelated to the criteria and no node decides it, so no test covers it.'
contested:
- what: DocumentEntitySchema (src/modules/ingestion/dto/llm-run.dto.ts) declares names as z.array(z.string()) and so accepts an entity whose names list is empty. The test "is refused when its names list is empty" is expected to fail against the current implementation.
  why: The decision log of domain/knowledge-base/document-entity makes names required because an entity listed with no name gives the model nothing to recognise, and the certification's assertion 2 for that node expects a refusal. The implementation record lists no refusal of an empty list. The test states what the node requires, and the implementation was left unchanged.
- what: recordDocumentContext writes any context it is handed and refuses nothing, so a context missing its summary or model, or an entity with no names, would be recorded.
  why: The certification's assertions for document-context (1) and document-entity (2 and 3) expect that nothing is recorded. No node says whether the refusal sits in the schema or the repository, so only the schema refusals are tested and the "nothing recorded" part is left in untested.
divergences:
- cites: TST-04
  file: src/__tests__/unit/ingestion/llm-run-repository-document-context.spec.ts
  departure: The file sits at src/__tests__/unit/ingestion/ under a name made from the task's subject, not at a path that mirrors modules/ingestion/repository/llm-run.repository.ts.
  why: Every ingestion unit test in the tree sits flat in that directory. A different name keeps this task's tests from colliding with a sibling task's tests over the same repository file.
- cites: TST-04
  file: src/__tests__/unit/ingestion/document-context-dto.spec.ts
  departure: The file sits at src/__tests__/unit/ingestion/ under a name made from the DTO's subject, not at a path that mirrors modules/ingestion/dto/llm-run.dto.ts.
  why: Every ingestion unit test in the tree sits flat in that directory, and a mirrored path would split the suite across two layouts.
---

## What it is

Tests that a run's document context and its status read back through findLlmRunById as recorded and null when none was recorded, that the status enumeration holds exactly four values, and that the context and entity schemas refuse an entity with no node type or names and a context with no summary or model.

## Notes

The UNDERDETERMINED entry about retry is owed in task/document-context/retry-reuses-document-context, whose criteria exclude the implementation it names.
Red run run/document-context-record-document-context-suite failed at lint on a parse error in the new spec, sent back to the test author; green on suite-2.
Proof-only re-delivery for the testable remainders the review aliases-fuzzy-context left; green on run/prove-aliases-fuzzy-context-2.
Red run run/prove-aliases-fuzzy-context failed on the empty-names-list tests; the diagnosis read cause code, the implementer gave DocumentEntitySchema names a minimum of one element, and run/prove-aliases-fuzzy-context-2 is green.
