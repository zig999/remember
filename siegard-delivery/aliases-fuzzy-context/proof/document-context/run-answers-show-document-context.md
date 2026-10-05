---
target: backend
implementation: sha256:9103635c25385f75779c192fbff48316e0e057d548b44f4d2ac5526e9e6afc95
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/prove-aliases-fuzzy-context-2
title: Proof for run answers showing the document context
summary: Proves that the read-llm-run answers over REST and MCP and the run-extraction answer carry a run's document context status and whole document context when the run holds them, and, over a stand-in store and model, that an extraction shows each chunk the document context it records.
tests:
- file: src/__tests__/integration/ingestion/run-answers-document-context-routes.spec.ts
  name: carries the document context status of a run that holds one over REST
  proves: The read-llm-run answer over REST carries the document context status of a run that holds one. The run's status is too-long, which is not the single-chunk default that the second UNDERDETERMINED entry names, and its context is null, so the status is shown on its own.
  fails_when: GET /llm-runs/:id drops document_context_status, shows a value other than the one the run holds, or shows it only when a context is also held.
- file: src/__tests__/integration/ingestion/run-answers-document-context-routes.spec.ts
  name: carries the whole document context of a run that holds one over REST
  proves: 'The read-llm-run answer over REST carries the document context of a run that holds one, as the whole value: summary, entities and the model that read it. This is the first UNDERDETERMINED entry; no other task of the plan has a criterion that answers it, and the delivered record-document-context proof only covers the repository.'
  fails_when: The REST answer carries a document context holding only its summary, or loses the entities or the model, or replaces the context model with the run's own model.
- file: src/__tests__/integration/ingestion/run-answers-document-context-routes.spec.ts
  name: carries each entity of the document context with its node type and every name in the recorded order over REST
  proves: Each entity of the context shown by the REST read-llm-run answer keeps its node type and all the names the document uses for it, in the recorded order.
  fails_when: The answer shows an entity without its node type, drops a name or keeps only the first, reorders the names, or leaves out an entity.
- file: src/__tests__/integration/ingestion/run-answers-document-context-routes.spec.ts
  name: carries no document context for a run that holds none over REST
  proves: A read of a run that holds no document context carries none over REST. The run holds the failed status and a null context, a run that read nothing.
  fails_when: The REST answer carries a document context, such as an empty or placeholder one, for a run whose context is null.
- file: src/__tests__/integration/ingestion/run-answers-document-context-routes.spec.ts
  name: carries no document context status for a run that holds none over REST
  proves: The second UNDERDETERMINED entry over REST. A run under prompt version v4 holds no document context status, and the answer reports none for it, not a default.
  fails_when: The REST answer reports a status, such as a default of single-chunk, for a run that holds no document context status.
- file: src/__tests__/unit/ingestion/run-answers-document-context-mcp.spec.ts
  name: carries the document context status of a run that holds one over MCP
  proves: The read-llm-run answer over MCP, the get_ingestion_status result, carries the document context status of a run that holds one.
  fails_when: The get_ingestion_status result drops document_context_status or shows a value other than the one the run holds.
- file: src/__tests__/unit/ingestion/run-answers-document-context-mcp.spec.ts
  name: carries the whole document context of a run that holds one over MCP
  proves: The read-llm-run answer over MCP carries the document context of a run that holds one, whole (summary, entities, model). This is the first UNDERDETERMINED entry over MCP.
  fails_when: The get_ingestion_status result carries a summary-only context, or loses the entities or the model.
- file: src/__tests__/unit/ingestion/run-answers-document-context-mcp.spec.ts
  name: carries no document context for a run that holds none over MCP
  proves: A read of a run that holds no document context carries none over MCP, which the ADVISORY note says criterion 11 does not name.
  fails_when: The get_ingestion_status result carries a document context for a run whose context is null.
- file: src/__tests__/unit/ingestion/run-answers-document-context-mcp.spec.ts
  name: carries no document context status for a run that holds none over MCP
  proves: The second UNDERDETERMINED entry over MCP. A run under v4 holds no status, and the get_ingestion_status result reports none, not a default.
  fails_when: The get_ingestion_status result reports a default status, such as single-chunk, for a run that holds none.
- file: src/__tests__/unit/ingestion/run-answers-document-context-extraction.spec.ts
  name: carries the document context status of the completed run when it holds one
  proves: The run-extraction answer carries the document context status of the completed run when it holds one. The run is under v5 with a recorded context, and its status is produced.
  fails_when: The run-extraction answer, built by readFinalRun, drops document_context_status or shows another value.
- file: src/__tests__/unit/ingestion/run-answers-document-context-extraction.spec.ts
  name: carries the whole document context of the completed run when it holds one
  proves: The run-extraction answer carries the document context of the completed run when it holds one, as the whole value. This is the first UNDERDETERMINED entry for this answer.
  fails_when: The run-extraction answer carries a summary-only context, or loses the entities or the model.
- file: src/__tests__/unit/ingestion/run-answers-document-context-extraction.spec.ts
  name: carries no document context for a completed run that holds none
  proves: The run-extraction answer, like the reads, carries no document context for a run that holds none. A v4 run records none.
  fails_when: The run-extraction answer carries a document context for a run that holds none.
- file: src/__tests__/unit/ingestion/run-answers-document-context-extraction.spec.ts
  name: carries no document context status for a completed run that holds none
  proves: The second UNDERDETERMINED entry for the run-extraction answer. A completed v4 run holds no status, and the answer reports none, not a default.
  fails_when: The run-extraction answer reports a default status, such as single-chunk, for a run that holds none.
- file: src/__tests__/unit/ingestion/document-context-value-in-extraction.spec.ts
  name: refuses a context lacking its summary or its model and records nothing, shows every chunk the produced summary and entities, records the context it showed, and creates nothing for an entity no chunk mentions
  proves: 'The four assertions the certification named for domain/knowledge-base/document-context, as one labelled observation so a failure names the assertion. (1) A preliminary reading that answers without a summary leaves the run holding no document context, and DocumentContextSchema accepts neither a value without a summary nor one without a model. (2) A three-chunk v5 extraction whose reading produced a context shows every chunk''s extraction the first summary line and every name of the listed entities. (3) The context recorded on the run equals the context shown: every string of the reading answer (each summary line, each entity name) is in a chunk''s input exactly when it is in the recorded context, including strings the extraction chose to cut or drop, and the recorded model is the model the reading call was made with. (4) A context naming an entity that no chunk mentions, with the model proposing nothing, leaves the store with no insert into knowledge_node, node_alias, knowledge_link, node_attribute or provenance and none carrying that entity''s name, while the entity is shown to every chunk. The two earlier tests over the whole context (REST and extraction answer) prove what the answers show; this one is the node''s test and carries its claim, so the node is claimed on this one test only.'
  fails_when: A reading without a summary records a context; the schema accepts a context missing its summary or model; a chunk of the document is read without the summary or an entity name; the recorded context holds a summary line, entity or name the chunks were not shown, or the chunks were shown one the record lacks, or the recorded model is not the reader's; or an entity no chunk mentions yields a write to a knowledge table or a write naming it.
  demonstrates: domain/knowledge-base/document-context
- file: src/__tests__/unit/ingestion/document-entity-in-extraction.spec.ts
  name: shows every chunk each entity of the document context with its node type and all its names, and records no context for an entity with no names, an empty names list or no node type
  proves: The three assertions the certification named for domain/knowledge-base/document-entity, as one labelled observation. (1) A run holding a context that lists a Person named "Maria Souza", "M. Souza" and "Maria" hands the model, for each of the three chunks, one line carrying that node type and all three names. (2) A reading whose entity has an empty names list, or no names, records no document context. (3) A reading whose entity has no node type records no document context; an entity under a node type the catalog does not hold is left out of the recorded context and never shown to a chunk, as rules/knowledge-base/document-context-entity-type-in-catalog states, while the catalog entity beside it is kept. It is the node's test and carries its claim; the earlier REST test over the entity fields proves the answer only.
  fails_when: A chunk is read without a line carrying the entity's node type and every one of its names; an entity with an empty names list, with no names or with no node type is recorded in a document context; an entity of a node type the catalog does not hold is recorded or shown to a chunk; or the catalog entity listed beside it is lost.
  demonstrates: domain/knowledge-base/document-entity
files:
- path: src/__tests__/unit/ingestion/run-document-context-fixture.ts
  effect: A shared fixture for the three earlier spec files and the two new ones. It holds a whole document context with two entities of several names each, whose model differs from the run's own model. It also holds a run row builder, and a stand-in pool that serves one llm_run row, an empty tool-call aggregate and a zero orphan count. It holds no assertion.
- path: src/__tests__/unit/ingestion/document-context-extraction-world.ts
  effect: New. A shared stand-in world for the two extraction specs. It stands in for the store (one running v5 run row that applies the document context, status and close updates, one raw information of three chunks, every insert recorded with its table and parameters) and for the model provider (the preliminary reading answers the text the test hands it, each chunk answers end of turn without proposing anything, every call recorded with its model and input). It exposes the extraction call and the observations the specs read. It holds no assertion and no rule of the system.
not_applicable:
- edge_case: A run identity that is malformed or names no run
  why: The refusals of read-llm-run (VALIDATION_INVALID_FORMAT, RESOURCE_NOT_FOUND) are existing behavior that no criterion of this task changes. The existing llm-run-routes and ingest-ops-tools specs already cover them.
- edge_case: A run that is running or failed, and the partial failed-run answers of run-extraction
  why: Every criterion says "completed run" or "a run that holds one". Whether the answer shows the context does not depend on run status, so a second status would be the same class as the completed representative.
- edge_case: A document context with an empty entities list or an empty summary
  why: No criterion or node states a boundary for these. document-context declares entities as optional and many, and the tests pass the value through whole, so these fall in the class of the listed-entity case already tested.
- edge_case: Each of the four status values (produced, single-chunk, too-long, failed) as its own case
  why: The answers treat every status alike, so one representative per class is enough. The tests use too-long and produced, and neither is the single-chunk default that the second UNDERDETERMINED entry names. The value set itself is decided by the enumeration test of the record-document-context proof.
- edge_case: A run that holds a context but no status, or a status but no context, as separate absent cases
  why: A run that holds a status and no context is covered by the REST and MCP status tests (too-long, context null) and by the no-context tests (failed, context null). A context without a status cannot arise under the specification, since the status is recorded with the context. The only absent-status fixture is a run that holds neither (v4).
- edge_case: The store failing or answering slowly, and two reads of one run at once
  why: No criterion or node of this task states behavior for a failing store or for concurrency. A test would assert a guarantee nobody made.
- edge_case: A preliminary reading that answers a provider error or text that is not JSON, a single-chunk document, a document over the reading length limit, a prompt version before v5, and a summary of more than five lines
  why: Each belongs to a rule of the extraction tasks of the document-context epic (failed-preliminary-reading-continues, document-context-status-recorded, no-document-context-before-v5, document-context-summary-cut-to-five-lines). The two extraction specs use a seven-line summary and a failed reading only as discriminators and assert the equality of what was shown and recorded, never the cut or the status.
untested:
- 'contracts/knowledge-base/ingestion: its fact spans fourteen operations (intake, the four proposals, ingest-document, ingest-directed, the reads, extraction, retry), with answers and refusals this task does not touch. No finite test decides it whole, and a test over the read-llm-run and run-extraction fields would assert part of it as the whole.'
- 'domain/knowledge-base/llm-run: its fact spans model, prompt_version, status, attempts, the timestamps, the run summary, document_context, document_context_status and the complete, fail and retry operations. This task only shows two of those attributes, so no test decides it whole.'
- 'domain/knowledge-base/document-context-status: the enumeration holds exactly produced, single-chunk, too-long and failed. The answers pass the recorded value through and do not validate it, so no test of this task fails if the value set changes. The delivered proof proof/document-context/record-document-context holds the test over the set.'
- GetIngestionStatusOutputSchema in mcp-schemas.ts gains the two fields, but nothing at runtime parses the get_ingestion_status result through it, since the handler returns getLlmRunById's result as it is. No behavior observable at the answer depends on it, so no test claims it. The MCP tests exercise the answer the handler returns.
- 'Inference about behavior: an absent context or status is omitted from the answer rather than sent as null. The criteria say ''carries none'', and both an absent key and null meet that, so the tests tolerate either and do not pin the omission. No node decides it.'
- 'Inference about behavior: the shared mapper also makes the retry-llm-run and close answers carry the status and context of the run they return. The retry criteria belong to the retry-llm-run task, and no node decides this, so it is left unproven.'
- 'ADVISORY note on criterion 11: it names only reads, but the tests cover the run-extraction answer as well, because contracts/knowledge-base/ingestion attaches ''when it holds them'' to both. Whether the criterion should name each answer is the plan''s to settle.'
- 'REMAINDER entries of the task''s Notes (the extraction rules that produce, keep and show the context, and retry-keeps-document-context-status): no criterion of this task reaches them, so no test is owed here. Producing the context and the retry belong to the other tasks of the document-context epic.'
- The v5 run-extraction tests of run-answers-document-context-extraction.spec.ts start from a run that already holds a context, so the preliminary reading does not run. They prove the answer shows what the run holds. The two new extraction specs cover the reading running over a stand-in model; neither proves the extraction against a real database or a real model provider.
- 'domain/knowledge-base/document-context, assertion (1) in part: the model of a context cannot be missing on any path that records one, because the preliminary reading stamps the configured model itself, so the only decision that a context without a model is refused is DocumentContextSchema over the value. recordDocumentContext in llm-run.repository.ts takes a typed value and validates nothing at runtime, so no test decides that a model-less value handed to it records nothing; the type system and the schema stand there. The new test claims the node on the refusal observable at the reading and at the schema.'
- 'domain/knowledge-base/document-context, assertion (4) in part: the test proves no write to a knowledge table is issued by an extraction whose model proposes nothing, observed at a stand-in store. Whether the real database also holds no knowledge_node, node_alias, knowledge_link, node_attribute or provenance row for the entity is evaluated by the database and cannot be closed without a real Postgres, which this re-delivery may not touch.'
contested:
- what: The implementation records a document context whose entity has an empty names list.
  why: The certification names, for domain/knowledge-base/document-entity, a refusal with nothing recorded when the entity has an empty names list, and the node declares names as required and many. DocumentEntitySchema declares names as z.array(z.string()) with no minimum, and the preliminary reading keeps such an entity, so a reading that lists one yields a recorded context holding it. The new document-entity test states the requirement as the certification named it (the case "an entity whose names list is empty" expects no recorded context) and is expected to fail against the implementation until the specification or the schema decides whether many and required mean at least one name. The node itself does not say it.
- what: An entity under a node type the catalog does not hold is left out of the context, not refused with nothing recorded.
  why: The certification's third assertion names a refusal with nothing recorded for a node type that does not exist. rules/knowledge-base/document-context-entity-type-in-catalog states that the reading yields a document context without that entity. The two disagree on whether the rest of the context is recorded. The new test states the rule as written (the context is recorded without the unknown entity and the entity is not shown to a chunk) and states the certification's wording only for an entity with no node type at all, which the schema refuses.
divergences:
- cites: TST-04
  file: src/__tests__/integration/ingestion/run-answers-document-context-routes.spec.ts
  departure: The file sits flat in src/__tests__/integration/ingestion/ under a name made from the task's subject, not at a path mirroring modules/ingestion/routes/ingestion.routes.ts. It also imports its fixture across the unit and integration subtrees.
  why: Every ingestion spec sits flat in these directories, and a distinct name keeps this task's tests from colliding with sibling tasks' tests over the same route and services. The fixture is shared with two unit specs, so it sits in the unit subtree.
- cites: TST-04
  file: src/__tests__/unit/ingestion/run-answers-document-context-mcp.spec.ts
  departure: The file sits flat in src/__tests__/unit/ingestion/ under a task-subject name, not at a path mirroring modules/ingestion/mcp/ingest-toolset.ts.
  why: Every ingestion unit test in the tree sits flat in that directory, and a distinct name avoids colliding with sibling tasks' tests.
- cites: TST-04
  file: src/__tests__/unit/ingestion/run-answers-document-context-extraction.spec.ts
  departure: The file sits flat in src/__tests__/unit/ingestion/ under a task-subject name, not at a path mirroring modules/ingestion/service/extraction.service.ts.
  why: Every ingestion unit test in the tree sits flat in that directory, and a distinct name avoids colliding with the existing extraction specs.
- cites: TST-04
  file: src/__tests__/unit/ingestion/document-context-value-in-extraction.spec.ts
  departure: The file sits flat in src/__tests__/unit/ingestion/ under a name made from the node it claims, not at a path mirroring modules/ingestion/service/extraction.service.ts, and it shares a world helper beside it.
  why: Every ingestion unit test sits flat in that directory, and a sibling re-delivery writes into the same directory at the same time, so a distinct name avoids a collision.
- cites: TST-04
  file: src/__tests__/unit/ingestion/document-entity-in-extraction.spec.ts
  departure: The file sits flat in src/__tests__/unit/ingestion/ under a name made from the node it claims, not at a path mirroring modules/ingestion/service/extraction.service.ts.
  why: Every ingestion unit test sits flat in that directory, and a sibling re-delivery writes into the same directory at the same time, so a distinct name avoids a collision.
- cites: TST-04
  file: src/__tests__/unit/ingestion/document-context-extraction-world.ts
  departure: The shared helper sits flat in src/__tests__/unit/ingestion/ and mirrors no unit under test.
  why: It is shared by two specs, and the neighbouring fixtures of this task sit in the same directory.
- cites: TST-01
  file: src/__tests__/unit/ingestion/document-context-value-in-extraction.spec.ts
  departure: The test body is one observation call and one assertion. The arrangement (the stand-in store and model) and the actions (the extractions) sit in the observe functions the body calls, not in the body.
  why: The test asserts four labelled assertions in one observed record so a failure names which assertion broke, and the thirty-line limit of MNT-01 does not allow the four extractions in one function.
- cites: TST-01
  file: src/__tests__/unit/ingestion/document-entity-in-extraction.spec.ts
  departure: The test body is one observation call and one assertion. The arrangement and the actions sit in the observe functions the body calls, not in the body.
  why: The test asserts three labelled assertions in one observed record so a failure names which assertion broke, and the thirty-line limit of MNT-01 does not allow the extractions in one function.
---

## What it is

Proves that the read-llm-run answers over REST and MCP and the run-extraction answer carry a run's document context status and whole document context when the run holds them, and, over a stand-in store and model, that an extraction shows each chunk the document context it records.

## Notes

Proof-only re-delivery for the testable remainders the review aliases-fuzzy-context left; green on run/prove-aliases-fuzzy-context-2.
Red run run/prove-aliases-fuzzy-context failed on the empty-names-list tests; the diagnosis read cause code, the implementer gave DocumentEntitySchema names a minimum of one element, and run/prove-aliases-fuzzy-context-2 is green.
