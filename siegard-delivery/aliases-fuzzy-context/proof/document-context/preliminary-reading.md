---
target: backend
implementation: sha256:9f1b7239b9a3e6942c270663581068ebd22d84eb860ab05655d4af33929a9586
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/document-context-preliminary-reading-suite
title: Proof for the preliminary reading that produces the document context
summary: Eighteen behavior tests over a v5 three-chunk extraction, driven through runLlmExtraction with the model and the store stood in for, prove that one tool-less reading is made first with the whole content under the configured context model, and that the cut, filtered and labelled context and the status produced are recorded.
tests:
- file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
  name: makes exactly one preliminary reading for a v5 extraction of 3 chunks holding no document context
  proves: Under v5, an extraction whose run holds no document context, over a raw information of 3 chunks and at most 100000 characters, makes exactly one preliminary reading.
  fails_when: the extraction makes no reading, or makes a second one, for a 3-chunk v5 run with no stored context (for example one reading per chunk)
- file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
  name: makes the preliminary reading before the first chunk is read
  proves: The preliminary reading is made before the first chunk is read.
  fails_when: the first model call of the extraction is a chunk call, because the reading is made after the chunk loop begins or not at all
- file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
  name: gives the preliminary reading the whole content of the raw information
  proves: The preliminary reading is given the whole content of the raw information.
  fails_when: the request of the reading carries a truncated, sliced or first-chunk-only content instead of the full raw information content
- file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
  name: calls the configured context model for the preliminary reading rather than the run's extraction model
  proves: The preliminary reading calls the configured context model.
  fails_when: the reading is requested under the run's extraction model, under a hard-coded model, or under any model other than the CONTEXT_MODEL handed to the orchestrator
- file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
  name: records on the run a document context that names the model that produced it
  proves: The recorded document context names the model that produced it.
  fails_when: the recorded context's model field is absent or holds any model other than the one the reading was requested under
- file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
  name: records on the run the summary and the entities the preliminary reading yielded
  proves: The run records the document context the preliminary reading yields.
  fails_when: the run's document_context is not written, or holds a summary or entity list (node type and names, in order) different from what the reading answered
- file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
  name: records the document context status produced when the preliminary reading yields a context
  proves: The run records the document context status produced.
  fails_when: the run's document_context_status stays empty or is set to any value other than produced after a reading that yielded a context
- file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
  name: records the first 5 lines of a 7-line summary as the document context summary
  proves: A preliminary reading whose summary runs to 7 lines yields a recorded document context whose summary is the first 5 lines of that summary; no recorded document context holds a summary of more than 5 lines.
  fails_when: a 7-line summary is recorded whole, cut to a count other than 5 lines, or has its first 5 lines altered
  demonstrates: rules/knowledge-base/document-context-summary-cut-to-five-lines
- file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
  name: counts an empty line as a line when it cuts a summary to 5 lines
  proves: 'The UNDERDETERMINED entry on rules/knowledge-base/document-context-summary-lines: the summary ''a\n\nb\nc\nd\ne'' counts 6 lines and is cut to ''a\n\nb\nc\nd''.'
  fails_when: lines are counted after dropping empty lines, so the 6-line summary is kept whole as 5 lines or is cut to 'a\nb\nc\nd\ne'
- file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
  name: lets a carriage return end no line when it cuts a summary to 5 lines
  proves: 'The clause of rules/knowledge-base/document-context-summary-lines that a carriage return ends no line: a CRLF-separated 6-line summary is cut to its first 5 lines with their carriage returns intact.'
  fails_when: a carriage return is treated as a line end, or lines are split on CRLF and rejoined with a bare newline, so the cut summary differs from 'a\r\nb\r\nc\r\nd\r\ne\r'
- file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
  name: records a document context without an entity listed under a node type the catalog does not hold
  proves: A preliminary reading that lists an entity under a node type the catalog does not hold yields a recorded document context without that entity.
  fails_when: an entity under an unknown node type is recorded, or an entity under a held node type is dropped or reordered
  demonstrates: rules/knowledge-base/document-context-entity-type-in-catalog
- file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
  name: proposes nothing and writes nothing but the run's own context columns before its first chunk is read
  proves: The preliminary reading records no tool call; before the first chunk is read the knowledge base holds no knowledge node, information fragment, knowledge link or node attribute read from the raw information (a reading that lists two entities).
  fails_when: before the first chunk call the reading has issued any write other than the llm_run context updates, such as a tool_call insert or a node, fragment, link or attribute write from a proposal
  demonstrates: scenarios/knowledge-base/preliminary-reading-proposes-nothing
- file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
  name: presents the content to the model in the user turn, bracketed and labelled as data, and not among the instructions
  proves: The preliminary reading presents the content to the model marked apart from its instructions as data.
  fails_when: the content, injection sentence included, appears in the system instructions, or the user turn carries it with no data label before it or nothing closing it after it
- file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
  name: makes the preliminary reading of a content of exactly 100000 UTF-16 code units
  proves: 'The boundary of the objective''s ''at most 100000 characters'' under the unit rules/knowledge-base/document-context-read-first fixes (UTF-16 code units): 100000 units is read.'
  fails_when: a content of exactly 100000 UTF-16 code units gets no reading, because the limit is applied as strictly less than
- file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
  name: makes no preliminary reading of a content of 3 chunks past 100000 UTF-16 code units though within 100000 code points
  proves: 'The UNDERDETERMINED entry on the unit of the 100000 limit: a 3-chunk content of about 50000 code points but over 100000 UTF-16 code units gets no reading.'
  fails_when: the content is measured in Unicode code points instead of UTF-16 code units, so the astral content is read
- file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
  name: makes no preliminary reading and records no document context and no status under any prompt version before v5
  proves: Under v4, an extraction makes no preliminary reading; and under v4 or any earlier prompt version no reading is made and no document context or document context status is recorded.
  fails_when: any of v1, v2, v3 or v4 makes a reading, or leaves a document context or a document context status on the run
  demonstrates: rules/knowledge-base/no-document-context-before-v5
- file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
  name: makes every model call of an extraction, the preliminary reading included, through a client bounded to five minutes and two retries
  proves: The model call of the preliminary reading waits at most five minutes; it is retried at most twice. Observed on the client options of every call of a 3-chunk v5 run built through the default factory (one reading, three chunks).
  fails_when: the reading is sent through a client built with a timeout above five minutes or none, or with more than two retries, or the number of calls differs from one reading plus three chunk calls
  demonstrates: constraints/extraction-model-call-bounded
not_applicable:
- edge_case: absent or empty raw information content
  why: a three-chunk raw information cannot hold empty content, and no criterion or bound node says what the reading does on it
- edge_case: a reading answer with no entities, duplicate entities, or entities with empty names
  why: no criterion or node states what the extraction does with them; the implementation record lists the choice as an inference, which is not pinned
- edge_case: two extractions of one run at the same time
  why: no criterion or bound node states concurrent behavior, and the run is already guarded by its running status
- edge_case: a write failing between the context write and the status write
  why: neither a criterion nor a bound node states atomicity of the two records
- edge_case: a provider failure or a slow answer during the reading
  why: the failure path is assigned to task/document-context/failed-reading-continues, whose criteria own it; the five-minute and two-retry bounds are proved here
untested:
- 'UNDERDETERMINED entry 1 (one-chunk raw information, content over the limit and run already holding a context get no reading): owed in task/document-context/skip-preliminary-reading (criteria 1 and 3 for one chunk and over the limit) and task/document-context/retry-reuses-document-context (criterion 3 for a held context); no test here. The over-limit case is exercised here only through the UTF-16 unit test, which pins the unit and not the skip path.'
- 'UNDERDETERMINED entry 3 (the claude-haiku-4-5 fallback where no context model is configured): the default is yielded by the environment and is owed in task/document-context/context-model-setting criterion 1; here the orchestrator is handed the resolved model and the ''calls the configured context model'' test covers the configured case, so an orchestrator that ignores an unconfigured default cannot be told apart from the environment''s.'
- 'rules/knowledge-base/document-context-read-first: only the positive branch and the over-limit boundaries are exercised here; the one-chunk and held-context negatives are owed to task/document-context/skip-preliminary-reading and task/document-context/retry-reuses-document-context, and the ''v5 and later'' clause cannot be run since no prompt version after v5 exists (v1 to v5 are the known modules). No finite test of this task decides it whole.'
- 'rules/knowledge-base/document-context-status-recorded: only the produced clause is exercised; single-chunk and too-long belong to task/document-context/skip-preliminary-reading and failed to task/document-context/failed-reading-continues, as the task''s REMAINDER entries say.'
- 'rules/knowledge-base/document-context-summary-lines: the empty-line and carriage-return clauses are exercised by the two summary tests, but the clause that a newline ending the summary starts no further line is observable only by pinning that a summary of at most 5 lines is kept byte for byte, which neither this rule nor the cut rule states; the node is claimed by no test.'
- 'rules/knowledge-base/document-context-model: the configured-model clause is exercised by the ''calls the configured context model'' and ''names the model'' tests; the default clause is owed in task/document-context/context-model-setting, so the fact is not decided whole here.'
- 'constraints/document-content-is-data: the preliminary reading''s presentation of the content is tested, but the statement also covers presenting the document context read from it to each chunk, which the task''s REMAINDER entry assigns to task/document-context/chunk-prompt-shows-context; the node is claimed by no test.'
- 'domain/knowledge-base/llm-run, domain/knowledge-base/document-context, domain/knowledge-base/document-entity and domain/knowledge-base/document-context-status: structural declarations of attributes, relationships and an enumeration with no behavior of their own for a finite test to decide whole. What this task writes into them (the context, its entities and the status produced) is exercised by the criterion tests above, and the closed set of status values is asserted by the earlier task''s llm-run-repository-document-context.spec.ts.'
- 'Inference about behavior, no node decides it: a reading answer that is not a parseable document context, or a provider failure, fails the run through the existing catch and records no status failed. Left unpinned because task/document-context/failed-reading-continues changes exactly this behavior.'
- 'Inference about behavior, no node decides it: the model answers with one JSON object in plain text, parsed from the first ''{'' to the last ''}''. The tests'' model stand-in answers in that form, so an implementation reading the answer another way (for example a forced tool_use) would fail them although no node states the form.'
- 'Inference about behavior, no node decides it: entities with empty names and duplicate entities are kept as the model returned them, and the reading''s prompt omits the document metadata block. No test pins either choice.'
- Inferences about arrangement (request max_tokens 4000, system as a string, no thinking, ContextMessageRequest type) get no test because a test would pin the shape of the code.
- Existing unit specs that call runLlmExtraction (extraction-orchestrator.spec.ts, extraction-affected-nodes.spec.ts, extraction-orchestrator-prompt-v5.spec.ts) pass env without CONTEXT_MODEL. None of them is a v5 run of more than one chunk (v1 and v3 prompt versions, or one chunk), so none meets the extra model call, and tsc excludes spec files; none was changed.
divergences:
- cites: TST-04
  file: src/__tests__/unit/ingestion/preliminary-reading.spec.ts
  departure: the spec sits flat in src/__tests__/unit/ingestion/ and drives the unit through runLlmExtraction, rather than mirroring src/modules/ingestion/service/preliminary-reading.ts under a service subdirectory.
  why: every spec of the ingestion module sits flat in that directory, and moving one file would split the suite across two layouts
---

## What it is

Eighteen behavior tests over a v5 three-chunk extraction, driven through runLlmExtraction with the model and the store stood in for, prove that one tool-less reading is made first with the whole content under the configured context model, and that the cut, filtered and labelled context and the status produced are recorded.

## Notes

None.
