---
title: The store refuses a compliance deletion whose affected counts are incomplete
summary: A new migration makes compliance_deletion.affected hold the four counts of a compliance deletion's reach, and nothing less.
sources:
- intake/scope.md
- intake/negative-count.md
- intake/non-negative-rule.md
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
- rules/knowledge-base/affected-counts-non-negative
- rules/knowledge-base/compliance-deletion-counts-what-it-marked
---

## What it is

A corrective task over migrations/0001_init.sql: a new versioned migration hardens compliance_deletion.affected, presented to the owner for approval before it runs against any database.
The refusal of a negative count was added by the owner on 2026-09-30.

## Notes

REMAINDER, from the specification — The part of rules/knowledge-base/compliance-deletion-counts-what-it-marked that each count equals what the deletion actually marked deleted reaches no criterion here; it belongs to the backend's compliance deletion, where task/compliance-deletion-counts-proof/counts-match-marked of initiative proof-compliance-counts owes its proof.
ADVISORY, from the specification — domain/knowledge-base/affected-counts declares exactly four attributes and no criterion says what happens to an affected value carrying an extra member.
ADVISORY, from the specification — The candidates say nothing about rows already stored that do not meet the four-count shape; the migration settles it (NOT VALID), and production held no compliance_deletion row when 0007 was applied and validated.
The task gained rules/knowledge-base/affected-counts-non-negative after its delivery, on the owner's ask in intake/non-negative-rule.md, so that the rule binds to migration 0007, which already enforces it.
