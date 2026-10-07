---
target: backend
task: sha256:4fe5d404c7f77de53ede7b30ab9cc46a7d0e4580f48a756d7791420a6165d6ed
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/directed-envelope-order-summary-before-run-and-report-build
title: Directed-ingestion result with the summary placed ahead of run and report
summary: The literal result object of directedIngestionService now serializes outcome, identities, chunk count, summary, run and report in that order, with names and nesting unchanged, and the file is delivered with its comments removed.
files:
- path: src/modules/ingestion/service/directed-ingestion.service.ts
  effect: The success result of directedIngestionService now places `summary` after `chunk_count` and before `run` and `report`. `DirectedIngestionResult` declares its fields in the same order. Every comment in the file is removed under the no-comments rule. The `ROLLBACK` catch in `closeRunCompletedSafe`, which held only a comment, now logs a warning. No other code was changed.
criteria:
- criterion: In the serialized directed-ingestion result, the summary field comes before the run field.
  met: true
  how: In the returned literal at the end of `directedIngestionService`, `summary` is listed immediately after `chunk_count` and before `run`. The `JSON.stringify(toolEnvelope)` at chat-agent.service.ts:451 emits keys in insertion order.
- criterion: In the serialized directed-ingestion result, the summary field comes before the report field.
  met: true
  how: The literal's order is outcome, raw_information_id, llm_run_id, chunk_count, summary, run, report. `summary` therefore precedes `report`, and `report` stays after `run` as the ingest-directed answer in contracts/knowledge-base/ingestion requires.
- criterion: A directed-ingestion result whose serialization exceeds 8000 characters, cut to its first 8000 characters, still contains the whole summary.
  met: true
  how: The serialized envelope now opens `{"ok":true,"result":{"outcome":...,"raw_information_id":...,"llm_run_id":...,"chunk_count":...,"summary":{...}`. The summary is a fixed block of 13 integer counters and the prefix is a few hundred characters (two UUIDs and short strings), so the whole summary falls within the first 8000 characters. The size of `run.affected_nodes` and `report` can no longer push it out. I added no truncation code. `truncateToolResult` and `TOOL_RESULT_MAX_CHARS` are untouched.
- criterion: The parsed directed-ingestion result still carries the run's affected nodes at run.affected_nodes.
  met: true
  how: 'The `run` object is unchanged and still has `affected_nodes: resolvedAffected`. Only its position among the result keys moved.'
- criterion: The parsed directed-ingestion result still carries one report entry per item at report.
  met: true
  how: The `report` key and the array built by the dispatch loops are unchanged. Only its position moved.
nodes:
- node: contracts/knowledge-base/ingestion
  encoded_at:
  - src/modules/ingestion/service/directed-ingestion.service.ts
  how: The ingest-directed answer orders the result as summary, then completed run with affected nodes, then report. The returned literal and the `DirectedIngestionResult` interface now follow that order. Both the criteria and the task Notes left the run-before-report order unstated, so I kept `run` before `report` as the contract requires. The other ingest-directed refusals and answers (pin rejections, error messages, report entry shape) are carried by code paths I did not change.
inferences:
- inferred: The outcome, raw_information_id, llm_run_id and chunk_count fields stay ahead of `summary`, which sits directly before `run`.
  from: The task rationale reads "summary first" as summary ahead of run and report only. The contract's "outcome ingested, the identities, the chunk count, a summary" has the same order.
- inferred: The `ROLLBACK` failure in `closeRunCompletedSafe` is now logged at warn level under the event `directed_ingestion_rollback_failed` instead of being swallowed silently.
  from: The catch held only the comment `/* swallow */`. Removing the comment would leave an empty catch, which `no-empty` (error) in eslint.config.js and COR-01 forbid. A catch must handle the error or rethrow it, and this one cannot rethrow because it sits inside the best-effort close. The close failure is logged one statement later in the same way.
- inferred: Removing the existing comments from this file is part of the task, and the `__testing__` export stays.
  from: Siegard's comment rule, which says a session that writes a source file delivers it whole. The inventory note says the plan's tasks deliver the files they edit under that rule. The unit tests import `__testing__`.
divergences:
- cites: MNT-01
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  departure: '`directedIngestionService` is far longer than thirty lines, and `directedIngestionService` and `readClosedRunSafe` carry a long body or deps parameters beyond the limit. This was not decomposed.'
  why: The function was already this length, and splitting it into helpers is a refactor this task does not reach. eslint reports it as a warning (`max-lines-per-function` is `warn`), not an error.
- cites: TYP-04
  file: src/modules/ingestion/service/directed-ingestion.service.ts
  departure: The literals `1.0`, `"stated"`, `"none"` and `"chat"` remain spelled out where they are used.
  why: They existed before this task, and naming them would widen it.
preserved:
- run.affected_nodes and report[] keep their names and nesting, because graph-normalizer.ts reads them by path.
- The fields summary, outcome, raw_information_id, llm_run_id, chunk_count, run.* and every report entry keep the same names, types and values.
- The error envelopes (Zod failure, intake unavailable, noop_existing, no chunks) are byte-identical.
- Dispatch order (fragments, nodes, attributes, links), the cascade rule, pin verification and the `tool_call` audit trail are unchanged.
- '`buildSummary`, the other `__testing__` members and the `DIRECTED_MODEL` and `DIRECTED_PROMPT_VERSION` re-exports are unchanged, so directed-ingestion.spec.ts still compiles against them.'
- The chat truncation helper and its limit are untouched.
deferred:
- what: Tests or consumers that compare the serialized result text now see the new key order, for example directed-ingest-handler.spec.ts and original-input-chat-integration.spec.ts.
  why: Tests are written by a separate judge. This task writes no tests.
- what: The marking and handling of a truncated tool result (rules/chat/tool-result-truncated, domain/chat/turn) is not implemented here.
  why: The task Notes place it in the chat turn, outside directed ingestion's result. The task relies on it and does not change it.
- what: '`directedIngestionService` is a single function of about 500 lines, with several parameters beyond three in nested helpers.'
  why: Decomposing it is a refactor outside this task. See the MNT-01 divergence.
- what: The comment in graph-normalizer.ts that cites `refForLink()` at `directed-ingestion.service.ts:932` is now off by line number.
  why: It is prose in a file this task does not touch, and editing it would widen the task.
---

## What it is
The literal result of `directedIngestionService` now carries `summary` ahead of `run` and `report`, and the file is delivered whole without comments.
No other file was written.

## Notes
The build run installed, typechecked, linted and secret-scanned over the changed tree and passed.
The `ROLLBACK` catch now logs a warning because removing its only content, a comment, would have left an empty catch the standard forbids.
