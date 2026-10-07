---
title: Directed-ingestion result carries its summary ahead of run and report
summary: Moves the summary in the directed-ingestion result ahead of the run and the report, so it survives the chat's cut of long tool results.
rationale: The planner asked for one epic per behavior. The scope's item (3) changes only the order of the result's fields and is separate from how the tool is described, so it gets its own epic.
sources:
- intake/scope.md
covers:
- domain/knowledge-base/directed-ingestion
- contracts/knowledge-base/ingestion
- rules/knowledge-base/directed-run-completes
- rules/chat/tool-result-truncated
uncovered:
- node: rules/knowledge-base/directed-run-completes
  why: The run is still reported completed whatever its items' statuses. Only the run's position among the result's fields changes, so this plan leaves the rule untouched.
- node: domain/knowledge-base/directed-ingestion
  why: It describes the request batch the owner states, not the result whose field order changes.
- node: rules/chat/tool-result-truncated
  why: The chat's cut of a long tool result stays as it is; this plan only places the summary where the cut leaves it whole.
---

## What it is
The directed-ingestion result keeps every field it carries today and puts the summary ahead of the run and the report.
The chat cuts long tool results, and with this order a cut no longer removes the summary.

## Notes
The chat's cut of tool results is held by rules/chat/tool-result-truncated, which is outside the impact set; this plan does not change it.
The ingest-directed accepted answer in contracts/knowledge-base/ingestion lists the result's contents but not their order.
