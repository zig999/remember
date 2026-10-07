---
title: Place the summary ahead of run and report in the directed result
summary: Reorders the directed-ingestion result so that its summary is serialized before its run and its report, with every field name and nesting unchanged.
rationale: 'The scope''s order names three fields (run, report, summary), so I read "summary first" as summary ahead of those two and left the outcome and identity fields where they are. The criterion that the field names stay the same follows from the inventory: the graph normalizer reads run.affected_nodes and report[] by name.'
sources:
- intake/scope.md
objective: The summary of a directed-ingestion result survives the chat's cut of a long tool result.
criteria:
- In the serialized directed-ingestion result, the summary field comes before the run field.
- In the serialized directed-ingestion result, the summary field comes before the report field.
- A directed-ingestion result whose serialization exceeds 8000 characters, cut to its first 8000 characters, still contains the whole summary.
- The parsed directed-ingestion result still carries the run's affected nodes at run.affected_nodes.
- The parsed directed-ingestion result still carries one report entry per item at report.
implements:
- contracts/knowledge-base/ingestion
---

## What it is
The literal object that ends `directedIngestionService` places its fields in a new order, and nothing else changes.
The chat's existing truncation helper and its limit stay as they are.

## Notes
Tests or consumers that compare the serialized text rather than the parsed object will see the new key order.
UNDERDETERMINED, from the specification — the criteria put the summary ahead of the run and of the report, but none says the run comes before the report, which the ingest-directed answer in contracts/knowledge-base/ingestion requires.
Passes: a serializer that emits the summary first, then the report, then the run, keeping every field name and nesting, meets all five criteria and the contract refuses it.
REMAINDER, from the specification — rules/chat/tool-result-truncated states the cut of a long tool result and the marking of its full length, which this task relies on and does not implement.
Belongs: the chat turn's tool-result handling (domain/chat/turn), not directed ingestion's result.
Decision, beyond the covers — stand: domain/chat/turn is where the cut is handled, and this plan does not touch the chat turn.
ADVISORY, from the specification — the third criterion fixes the cut at 8000 characters, which rules/chat/tool-result-truncated makes only the default; it contradicts neither node, because the default is 8000.
ADVISORY, from the specification — the field paths in the criteria are the existing serialization, kept on purpose, and the fourth and fifth criteria guard against regression in that shape.
