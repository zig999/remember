---
target: backend
implementation: sha256:2a9bd1851a1c47f511672ff2cc15f9fe737e2f5c0ecfab2c9c09c81aad1711d7
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/directed-envelope-order-summary-before-run-and-report-suite
title: Directed-ingestion result field order
summary: Four tests over the serialized directed-ingestion result. They hold the summary ahead of the run and the report, the run ahead of the report, and the whole summary inside the first 8000 characters of a result longer than that.
tests:
- file: src/__tests__/unit/ingestion/directed-ingestion.spec.ts
  name: directed-ingestion / result field order > serializes the summary before the run
  proves: In the serialized directed-ingestion result, the summary field comes before the run field.
  fails_when: The serialized result carries summary after run, or carries no summary key.
- file: src/__tests__/unit/ingestion/directed-ingestion.spec.ts
  name: directed-ingestion / result field order > serializes the summary before the report
  proves: In the serialized directed-ingestion result, the summary field comes before the report field.
  fails_when: The serialized result carries summary after report, or carries no summary key.
- file: src/__tests__/unit/ingestion/directed-ingestion.spec.ts
  name: directed-ingestion / result field order > serializes the completed run before the report
  proves: 'UNDERDETERMINED, from the specification: the criteria put the summary ahead of the run and the report, but none says the run comes before the report, which the ingest-directed answer in contracts/knowledge-base/ingestion requires.'
  fails_when: The result emits summary, then report, then run. That serializer meets all five criteria and the contract refuses it. The test also fails if run is missing or follows report in any other arrangement.
- file: src/__tests__/unit/ingestion/directed-ingestion.spec.ts
  name: directed-ingestion / result field order > keeps the whole summary in the first 8000 characters of a result longer than 8000
  proves: A directed-ingestion result whose serialization exceeds 8000 characters, cut to its first 8000 characters, still contains the whole summary.
  fails_when: The summary is serialized after the report or the run, so that a 200-item report pushes it past character 8000. It also fails if the summary is split by the cut, or if the result no longer exceeds 8000 characters, which makes the guard assertion fail instead of letting the test pass vacuously.
not_applicable:
- edge_case: 'Criteria 4 and 5: the parsed result still carries run.affected_nodes and report, one entry per item.'
  why: 'Both are regression guards over names and nesting this task left unchanged. The existing test ''affected_nodes: collected from propose-* envelopes; populated on result.run'' asserts run.affected_nodes. The happy-path test in the same file asserts report, one entry per item in caller order. A parsed-JSON copy of either would be the same evidence twice, so none was written (SPEC-004 R5). The graph normalizer''s reading of those paths is covered by its own tests.'
- edge_case: Absent or empty input, boundaries at the 8000-character cut, an empty report.
  why: The task changes only the position of one key in the success literal. Input validation and refusals are untouched and already covered by existing tests. The 8000 limit belongs to the chat truncation helper and its own spec, and this task owns only that the summary falls inside it.
- edge_case: Dependency failure while closing the run or resolving affected nodes.
  why: No criterion or node fact reached by this task changes what those paths return. The implementation record's inference about logging a swallowed ROLLBACK is a behavior no node decides.
- edge_case: Existing tests comparing serialized key order, which the task Notes and the caller warned about.
  why: directed-ingest-handler.spec.ts and original-input-chat-integration.spec.ts contain no JSON.stringify, snapshot or Object.keys comparison, so I adjusted neither.
untested:
- The node contracts/knowledge-base/ingestion is not decided whole by any finite test here. It states the intake, read, proposal, extraction and listing answers of fourteen operations, and the ingest-directed answer alone carries pin rejections, the refusals and the report entry shape. The four tests decide only the order part of the ingest-directed answer, so none carries `demonstrates`. A partial test claiming the node would be refused downstream (SPEC-004 R12).
- 'rules/chat/tool-result-truncated, the chat turn''s cut and its marking of the full length: the task Notes record it as relied on and not implemented here. It sits in domain/chat/turn, and the existing truncate-tool-result.spec.ts covers the helper.'
- The record's inference that the outcome, raw_information_id, llm_run_id and chunk_count fields stay ahead of summary, so that summary sits directly before run. No node or criterion decides it, and no test pins it.
- The record's inference that the ROLLBACK failure in closeRunCompletedSafe now logs a warning under directed_ingestion_rollback_failed. It is a behavior no node decides, so it is recorded as unproven and not pinned.
- The record's claim that the error envelopes (Zod failure, intake unavailable, noop_existing, no chunks) are byte-identical. It is a preservation claim over refusals the task did not change. Existing tests exercise those refusals, but none was written here.
divergences:
- cites: TST-04
  file: src/__tests__/unit/ingestion/directed-ingestion.spec.ts
  departure: 'The new tests are appended to the existing directed-ingestion.spec.ts. That file already sits under src/__tests__/unit/ingestion/ and covers directed-ingestion.service.ts, so the departure is one of file naming only: the existing spec is not named after the unit as directed-ingestion.service.spec.ts.'
  why: Appending reuses the file's stub pool and intake helpers and keeps all of the unit's tests together. A new sibling spec would copy those helpers (MNT-03).
---

## What it is
Four tests appended to the existing directed-ingestion unit spec prove the order of the serialized directed-ingestion result.
The suite run that passed is the one this record points at.

## Notes
No earlier suite run failed before this one passed.
The test author recorded no disagreement with the implementation.
