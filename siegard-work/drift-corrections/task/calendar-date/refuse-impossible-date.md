---
title: A date value naming no existing day is refused
summary: An attribute proposal for a date key whose value names no existing day is refused and records nothing.
sources:
- intake/scope.md
objective: An attribute proposal carrying the value 2024-02-30 for a date-typed key is refused.
criteria:
- An attribute proposal for a key whose value type is date, carrying the value 2024-02-30, is refused with the error code VALIDATION_INVALID_FORMAT naming the value and its value type.
- The same refused proposal records no node attribute.
- An attribute proposal for a date key carrying the value 2024-02-29 is accepted, because that day exists in a leap year.
implements:
- rules/knowledge-base/attribute-value-parses
- scenarios/knowledge-base/impossible-calendar-date-refused
- contracts/knowledge-base/ingestion
- domain/knowledge-base/proposal
- domain/knowledge-base/attribute-key
- domain/knowledge-base/value-type
---


## What it is

A test-first correction of the date check in the attribute value parser.

## Notes

UNDERDETERMINED, from the specification — Criterion 1 names only the error code, but contracts/knowledge-base/ingestion fixes the REST answer of this refusal as HTTP 200 carrying { ok: false, error }; an implementation answering HTTP 422 meets every criterion as written and the contract does not allow it.
UNDERDETERMINED, from the specification — Criteria 1 and 3 test only 2024-02-30 and 2024-02-29; a check that accepts any day up to 29 in February and up to 31 in any month meets them and still accepts 2023-02-29 and 2024-04-31, which rules/knowledge-base/attribute-value-parses refuses.
REMAINDER, from the specification — The clause on an attribute correction's value reaches no criterion here; it belongs to the correct-item task under contracts/knowledge-base/curation.
REMAINDER, from the specification — The number, bool, text and date-shape clauses reach no criterion here; they belong to sibling propose-attribute tasks, one per value type.
ADVISORY, from the specification — Criterion 3 says accepted; the proposal outcome depends on confidence and held assertions, so any non-refusal outcome passes this rule.
Decision, beyond the covers — stand: contracts/knowledge-base/curation is not claimed; the correct-item clause is a remainder for a sibling task and this task implements the propose-attribute refusal only.
