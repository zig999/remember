---
title: The version 4 prompt does not ask for the basis received
summary: The version 4 extraction prompt keeps resolving a relative date against the date of reception and no longer names the basis received.
sources:
- intake/scope.md
objective: The system prompt of version 4 does not instruct the model to state the basis received.
criteria:
- The system prompt of version 4 tells the model to resolve a relative date against the date of reception when the source has no document date.
- The system prompt of version 4 contains no instruction to state the basis received on a proposal.
stands:
- src/modules/ingestion/prompts/extraction.v4.ts
implements:
- rules/knowledge-base/caller-never-states-received
- rules/knowledge-base/extraction-relative-date-falls-back-to-reception
---


## What it is

A test-first correction of the version 4 directive text.

## Notes

UNDERDETERMINED, from the specification — Criterion 1 covers only the reception fallback; a prompt resolving every relative date against reception even when the source has a document date meets both criteria and the node requires the document date first.
UNDERDETERMINED, from the specification — Criterion 2 only removes the instruction to state received; a rewrite asking for another basis on the fallback meets it.
UNDERDETERMINED, from the specification — No criterion checks that the instruction never to invent a date survives the edit (rules/knowledge-base/extraction-never-invents-a-date).
Decision, beyond the covers — stand: rules/knowledge-base/extraction-never-invents-a-date is not claimed; this task edits only the directive named in the scope.
REMAINDER, from the specification — Refusing a proposal that states received belongs to the validation of proposals, which the rule's log records as already done by the proposal schema.
