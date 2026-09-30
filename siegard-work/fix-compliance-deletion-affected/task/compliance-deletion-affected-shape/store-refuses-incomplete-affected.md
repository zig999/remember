---
title: The store refuses a compliance deletion whose affected counts are incomplete
summary: A new migration makes compliance_deletion.affected hold the four counts of a compliance deletion's reach, and nothing less.
sources:
- intake/scope.md
- intake/negative-count.md
objective: A compliance deletion is recorded only when its affected value carries the four counts it marked deleted.
criteria:
- Recording a compliance deletion whose affected value lacks the chunks count is refused by the store.
- Recording a compliance deletion whose affected value lacks the fragments count is refused by the store.
- Recording a compliance deletion whose affected value lacks the links count is refused by the store.
- Recording a compliance deletion whose affected value lacks the attributes count is refused by the store.
- Recording a compliance deletion whose affected value carries a count that is not an integer is refused by the store.
- Recording a compliance deletion whose affected value carries a negative count is refused by the store.
- Recording a compliance deletion that states no affected value is refused by the store.
- Recording a compliance deletion whose affected value carries the four counts as non-negative integers is accepted by the store.
implements:
- domain/knowledge-base/compliance-deletion
- domain/knowledge-base/affected-counts
- rules/knowledge-base/compliance-deletion-counts-what-it-marked
---

## What it is

A corrective task over migrations/0001_init.sql: a new versioned migration hardens compliance_deletion.affected, presented to the owner for approval before it runs against any database.
The refusal of a negative count was added by the owner on 2026-09-30.

## Notes

UNDERDETERMINED, from the specification — rules/knowledge-base/compliance-deletion-counts-what-it-marked makes each count the number of raw chunks, information fragments, knowledge links and node attributes the deletion marked deleted, while the criteria test only the shape of the value, so the rule's equality clause belongs to the operation that computes the counts. Passes: a store constraint that accepts any four non-negative integers, such as a deletion recorded with chunks 0, fragments 0, links 0, attributes 0 when it marked 3 raw chunks and 5 fragments deleted.
ADVISORY, from the specification — domain/knowledge-base/affected-counts declares exactly four attributes and no criterion covers an affected value carrying a fifth, undeclared key, so whether the store refuses extra keys is left open for a reviewer to decide.
