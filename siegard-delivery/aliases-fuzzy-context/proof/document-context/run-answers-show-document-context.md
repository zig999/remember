---
target: backend
implementation: sha256:9103635c25385f75779c192fbff48316e0e057d548b44f4d2ac5526e9e6afc95
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/document-context-run-answers-show-document-context-suite
title: Proof for run answers showing the document context
summary: Proves that the read-llm-run answers over REST and MCP and the run-extraction answer carry a run's document context status and its whole document context (summary, entities, model) when the run holds them, and carry neither when it holds none.
tests:
- file: src/__tests__/integration/ingestion/run-answers-document-context-routes.spec.ts
  name: carries the document context status of a run that holds one over REST
  proves: The read-llm-run answer over REST carries the document context status of a run that holds one. The run's status is too-long, which is not the single-chunk default that the second UNDERDETERMINED entry names, and its context is null, so the status is shown on its own.
  fails_when: GET /llm-runs/:id drops document_context_status, shows a value other than the one the run holds, or shows it only when a context is also held.
- file: src/__tests__/integration/ingestion/run-answers-document-context-routes.spec.ts
  name: carries the whole document context of a run that holds one over REST
  proves: 'The read-llm-run answer over REST carries the document context of a run that holds one, as the whole value: summary, entities and the model that read it. This is the first UNDERDETERMINED entry; no other task of the plan has a criterion that answers it, and the delivered record-document-context proof only covers the repository.'
  fails_when: The REST answer carries a document context holding only its summary, or loses the entities or the model, or replaces the context model with the run's own model.
  demonstrates: domain/knowledge-base/document-context
- file: src/__tests__/integration/ingestion/run-answers-document-context-routes.spec.ts
  name: carries each entity of the document context with its node type and every name in the recorded order over REST
  proves: Each entity of the context shown by the REST read-llm-run answer keeps its node type and all the names the document uses for it, in the recorded order.
  fails_when: The answer shows an entity without its node type, drops a name or keeps only the first, reorders the names, or leaves out an entity.
  demonstrates: domain/knowledge-base/document-entity
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
files:
- path: src/__tests__/unit/ingestion/run-document-context-fixture.ts
  effect: A shared fixture for the three spec files. It holds a whole document context with two entities of several names each, whose model differs from the run's own model. It also holds a run row builder, and a stand-in pool that serves one llm_run row, an empty tool-call aggregate and a zero orphan count. It holds no assertion.
not_applicable:
- edge_case: A run identity that is malformed or names no run
  why: The refusals of read-llm-run (VALIDATION_INVALID_FORMAT, RESOURCE_NOT_FOUND) are existing behavior that no criterion of this task changes. The existing llm-run-routes and ingest-ops-tools specs already cover them.
- edge_case: A run that is running or failed, and the partial failed-run answers of run-extraction
  why: Every criterion says "completed run" or "a run that holds one". Whether the answer shows the context does not depend on run status, so a second status would be the same class as the completed representative.
- edge_case: A document context with an empty entities list, an empty summary, or an entity with no names
  why: No criterion or node states a boundary for these. document-context declares entities as optional and many, and the tests pass the value through whole, so these fall in the class of the listed-entity case already tested.
- edge_case: Each of the four status values (produced, single-chunk, too-long, failed) as its own case
  why: The answers treat every status alike, so one representative per class is enough. The tests use too-long and produced, and neither is the single-chunk default that the second UNDERDETERMINED entry names. The value set itself is decided by the enumeration test of the record-document-context proof.
- edge_case: A run that holds a context but no status, or a status but no context, as separate absent cases
  why: A run that holds a status and no context is covered by the REST and MCP status tests (too-long, context null) and by the no-context tests (failed, context null). A context without a status cannot arise under the specification, since the status is recorded with the context. The only absent-status fixture is a run that holds neither (v4).
- edge_case: The store failing or answering slowly, and two reads of one run at once
  why: No criterion or node of this task states behavior for a failing store or for concurrency. A test would assert a guarantee nobody made.
untested:
- 'contracts/knowledge-base/ingestion: its fact spans fourteen operations (intake, the four proposals, ingest-document, ingest-directed, the reads, extraction, retry), with answers and refusals this task does not touch. No finite test decides it whole, and a test over the read-llm-run and run-extraction fields would assert part of it as the whole.'
- 'domain/knowledge-base/llm-run: its fact spans model, prompt_version, status, attempts, the timestamps, the run summary, document_context, document_context_status and the complete, fail and retry operations. This task only shows two of those attributes, so no test decides it whole.'
- 'domain/knowledge-base/document-context-status: the enumeration holds exactly produced, single-chunk, too-long and failed. The answers pass the recorded value through and do not validate it, so no test of this task fails if the value set changes. The delivered proof proof/document-context/record-document-context holds the test over the set.'
- GetIngestionStatusOutputSchema in mcp-schemas.ts gains the two fields, but nothing at runtime parses the get_ingestion_status result through it, since the handler returns getLlmRunById's result as it is. No behavior observable at the answer depends on it, so no test claims it. The MCP tests exercise the answer the handler returns.
- 'Inference about behavior: an absent context or status is omitted from the answer rather than sent as null. The criteria say ''carries none'', and both an absent key and null meet that, so the tests tolerate either and do not pin the omission. No node decides it.'
- 'Inference about behavior: the shared mapper also makes the retry-llm-run and close answers carry the status and context of the run they return. The retry criteria belong to the retry-llm-run task, and no node decides this, so it is left unproven.'
- 'ADVISORY note on criterion 11: it names only reads, but the tests cover the run-extraction answer as well, because contracts/knowledge-base/ingestion attaches ''when it holds them'' to both. Whether the criterion should name each answer is the plan''s to settle.'
- 'REMAINDER entries of the task''s Notes (the extraction rules that produce, keep and show the context, and retry-keeps-document-context-status): no criterion of this task reaches them, so no test is owed here. Producing the context and the retry belong to the other tasks of the document-context epic.'
- The v5 run-extraction tests start from a run that already holds a context, so the preliminary reading does not run. They prove the answer shows what the run holds. They do not prove that an extraction records a context, which is the recording tasks' proof.
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
---

## What it is

Proves that the read-llm-run answers over REST and MCP and the run-extraction answer carry a run's document context status and its whole document context (summary, entities, model) when the run holds them, and carry neither when it holds none.

## Notes

None.
