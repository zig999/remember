---
target: backend
title: Proof for the validity check of an entity-edit attribute change
summary: Unit tests over checkChangeValidity decide each criterion, the defaulted-start and stable-key rules, and the two underdetermined findings (HTTP 422 and the UTC today) against fixed in-memory keys and a fixed edit moment.
implementation: sha256:7c6b349b928bf8361e5d8bf56bf1e250d198b8f33273cfc29062960bacac7857
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/entity-edit-backend-check-change-validity-suite
tests:
- file: src/__tests__/unit/curation/attribute-change-validity.spec.ts
  name: a change to a key that is not temporal is refused with BUSINESS_TEMPORAL_INCOHERENT when it states $label
  proves: Criteria 1 and 2 (a change to a non-temporal key that states a validity start, or a validity end, is refused with BUSINESS_TEMPORAL_INCOHERENT). It is run for a start, an end and both together, on a set change and on a remove change, which is every combination of what such a change can state.
  fails_when: A change to a key whose is_temporal is false that states a start, an end, or both is accepted, or is refused with any code other than BUSINESS_TEMPORAL_INCOHERENT, for a set or a remove change.
  demonstrates: rules/knowledge-base/stable-key-change-states-no-validity
- file: src/__tests__/unit/curation/attribute-change-validity.spec.ts
  name: a change to a key that records no temporality is refused with BUSINESS_TEMPORAL_INCOHERENT when it states $label
  proves: Criteria 4 and 5 (a change to a key that records no temporality that states a validity start, or a validity end, is refused with BUSINESS_TEMPORAL_INCOHERENT). The key has is_temporal null, as the catalog yields it for an unrecorded temporality.
  fails_when: A key whose is_temporal is null is read as temporal, so a stated start or end on a change to it is accepted, or is refused with another code.
- file: src/__tests__/unit/curation/attribute-change-validity.spec.ts
  name: a change that states no validity to a key that accepts none is not refused when the key $label
  proves: Criteria 3 and 6 (a change to a non-temporal key, and to a key that records no temporality, that states no validity is not refused by the stable-key rule).
  fails_when: The stable-key check refuses a change that states neither a start nor an end, for a key with is_temporal false or null.
- file: src/__tests__/unit/curation/attribute-change-validity.spec.ts
  name: a change that states both a validity start and a validity end is refused with BUSINESS_TEMPORAL_INCOHERENT when its start is $label
  proves: Criteria 7 and 8 (a start equal to the end, and a start later than the end by one day, are refused with BUSINESS_TEMPORAL_INCOHERENT), and the same for a remove change. A start equal to the end is the boundary, and one day later is the nearest case past it.
  fails_when: The comparison becomes non-strict (start equal to end accepted), is reversed (a later start accepted), or is applied only to set changes.
- file: src/__tests__/unit/curation/attribute-change-validity.spec.ts
  name: a change that states both a validity start and a validity end is not refused when its start is one day earlier than its end
  proves: Criterion 9 (a change to a temporal key whose validity start falls earlier than its validity end is not refused by these rules), at the boundary one day below the end and with both dates after the edit moment.
  fails_when: A start earlier than the end is refused, which shows as the strict comparison turned the wrong way or widened past equality.
- file: src/__tests__/unit/curation/attribute-change-validity.spec.ts
  name: a change that states both a validity start and a validity end is not held to the defaulted-start rule when its end is not after today
  proves: 'Rules/knowledge-base/entity-edit-defaulted-start-precedes-end applies only where no validity start is stated: a set change to a temporal key with a start earlier than an end, both before the edit moment, is not refused.'
  fails_when: The defaulted-start check applies to a change that states a start, so a start-and-end change whose end is not after today is refused.
- file: src/__tests__/unit/curation/attribute-change-validity.spec.ts
  name: a set change to a temporal key that states a validity end and no validity start answers $expected when the end is $label
  proves: Criteria 10, 11 and 12 (a set change to a temporal key with an end of today, or earlier than today, and no start is refused with BUSINESS_TEMPORAL_INCOHERENT; an end later than today is not refused), with the edit moment fixed at 2026-06-15T12:00Z. Today, one day before and one day after are the boundary cases.
  fails_when: An end equal to today is accepted, an earlier end is accepted, or a later end is refused.
  demonstrates: rules/knowledge-base/entity-edit-defaulted-start-precedes-end
- file: src/__tests__/unit/curation/attribute-change-validity.spec.ts
  name: a set change to a temporal key that states a validity end and no validity start takes today as the UTC calendar date when the server zone is behind UTC
  proves: 'UNDERDETERMINED note on which day is today: the edit moment 2026-06-15T00:00Z, with the process zone stubbed to America/Sao_Paulo where the local date is 2026-06-14, has the UTC date 2026-06-15 as today, so an end of 2026-06-15 is refused.'
  fails_when: Today is taken from the server's local zone (a zone behind UTC) rather than the UTC calendar date of the edit moment, so an end that is the UTC today is accepted.
- file: src/__tests__/unit/curation/attribute-change-validity.spec.ts
  name: a set change to a temporal key that states a validity end and no validity start takes today as the UTC calendar date when the server zone is ahead of UTC
  proves: 'UNDERDETERMINED note on which day is today: the edit moment 2026-06-14T23:59:59Z, with the process zone stubbed to Pacific/Kiritimati where the local date is 2026-06-15, has the UTC date 2026-06-14 as today, so an end of 2026-06-15 (the UTC tomorrow) is not refused.'
  fails_when: Today is taken from the server's local zone (a zone ahead of UTC), so an end that is the UTC tomorrow is refused.
- file: src/__tests__/unit/curation/attribute-change-validity.spec.ts
  name: a set change to a temporal key that states a validity end and no validity start is not refused when it states neither a validity start nor a validity end
  proves: 'The defaulted-start rule is reached only where an end is stated: a set change to a temporal key with no validity at all is not refused.'
  fails_when: A set change to a temporal key with no stated end is refused by the defaulted-start check, for instance by treating a missing end as not after today.
- file: src/__tests__/unit/curation/attribute-change-validity.spec.ts
  name: the refusal of a change over REST answers HTTP 422 for the refusal of $label
  proves: 'UNDERDETERMINED note on the transport answer: each of the three refusals, rendered through the REST error mapping, answers HTTP 422 (the contract''s answer for the stable-key, start-before-end and defaulted-start rules).'
  fails_when: A refusal of any of the three kinds carries a status other than 422, such as 400 or 409, once rendered through the REST mapping.
not_applicable:
- edge_case: A validity start or end sent as null
  why: Null is read as not stated by AttributeChangeSchema (a rule of the DTO, not of this helper), so the helper never receives a null. The advisory note says so, and the DTO's own spec is where that reading belongs.
- edge_case: A date that is not a real calendar date, or a malformed date string
  why: A date reaches the helper only after IsoDateSchema accepted it. The helper compares YYYY-MM-DD strings, and no criterion or node gives it a refusal for a malformed date.
- edge_case: The store failing, slow answers, and two edits to one node at once
  why: The helper is a pure function over a key row, a change and a moment. It reads no store and no clock, and holds no state.
- edge_case: Absent or empty collections, and duplicates
  why: The helper takes one change. A collection of changes and duplicates among them belong to the orchestration of the edit.
- edge_case: A change naming an attribute key the catalog does not hold
  why: The helper takes an already resolved key row. The unknown key refusal belongs to the catalog check delivered earlier.
untested:
- 'rules/knowledge-base/unrecorded-temporality-is-not-temporal: the fact is how an attribute key that records no temporality is read, wherever a key''s temporality is read. This task''s helper is one reader of it, and no finite test can reach the others. The tests for criteria 4 to 6 show that reading in this helper only, and none is claimed as the node''s.'
- 'rules/knowledge-base/validity-start-before-end: the node also constrains a proposal, an adjusted period and a correction, none of which this task touches. Only the entity-edit change clause is exercised, so no test claims the node whole.'
- 'contracts/knowledge-base/entity-editing: the contract spans the route, the response, the order of the checks and every other refusal. This task''s helper answers only the three temporal refusals, and only their HTTP 422 is tested.'
- 'domain/knowledge-base/attribute-change and domain/knowledge-base/attribute-key: both are shape declarations with no behavior for a finite test to decide.'
- 'Inference, behavior chosen and not decided by any node: a remove change to a temporal key that states only a validity end is not refused by the defaulted-start rule. The rule names a set change only, so it is left unpinned.'
- Inference, messages and details of the three refusals (attribute_key, valid_from, valid_to) are not asserted. The contract gives only code and status.
- 'ADVISORY, check order: the position of the validity check after the allowed-values check and before the checks against the node''s attributes, and the order in which changes run, belong to the orchestrating task.'
- 'ADVISORY, null as not stated: the helper receives undefined only, and the null reading is held by the DTO and the task implementing it.'
divergences:
- cites: TST-04
  file: src/__tests__/unit/curation/attribute-change-validity.spec.ts
  departure: The file sits flat in src/__tests__/unit/curation/, not mirroring the path of the unit under test (modules/curation/service/attribute-change-validity.ts) under the unit subtree.
  why: The existing curation specs (dto.spec.ts, edit-entity.dto.spec.ts, attribute-change-catalog.spec.ts) sit flat in this directory. A mirrored path for one file would split the curation suite across two layouts.
---
## What it is
Unit tests over checkChangeValidity decide each criterion, the defaulted-start and stable-key rules, and the two underdetermined findings (HTTP 422 and the UTC today) against fixed in-memory keys and a fixed edit moment.

## Notes
None.
