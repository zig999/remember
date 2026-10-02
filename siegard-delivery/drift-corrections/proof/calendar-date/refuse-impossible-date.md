---
target: backend
title: Proof that a date value naming no existing day is refused
summary: Four REST-level tests and two table-driven parser tests hold that a date value naming no existing day is refused with VALIDATION_INVALID_FORMAT as an HTTP 200 envelope and records no node attribute, while 2024-02-29 is accepted.
implementation: sha256:66d1ddf7fefea1ede77cda26a6cb53ceffda21485863d3567059edec6a04e37a
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/calendar-date-refuse-impossible-date-suite
tests:
- file: src/__tests__/integration/ingestion/propose-attribute-date.spec.ts
  name: refuses the value 2024-02-30 with VALIDATION_INVALID_FORMAT naming the value and its value type
  proves: An attribute proposal for a key whose value type is date, carrying the value 2024-02-30, is refused with the error code VALIDATION_INVALID_FORMAT naming the value and its value type.
  fails_when: the proposal for 2024-02-30 on a date key is not refused, is refused under another code, or its error details do not carry the value 2024-02-30 and the value type date
- file: src/__tests__/integration/ingestion/propose-attribute-date.spec.ts
  name: refuses the value 2024-02-30 for a date key and records no node attribute
  proves: The same refused proposal records no node attribute. Also the scenario given a date key, when a proposal carries 2024-02-30, then the proposal is refused and no node attribute is recorded.
  fails_when: the proposal for 2024-02-30 on a date key is answered with anything but the VALIDATION_INVALID_FORMAT refusal, or an INSERT INTO node_attribute is issued before or despite the refusal
  demonstrates: scenarios/knowledge-base/impossible-calendar-date-refused
- file: src/__tests__/integration/ingestion/propose-attribute-date.spec.ts
  name: answers the refusal of an impossible date as HTTP 200 carrying ok false and an error
  proves: 'UNDERDETERMINED entry 1: contracts/knowledge-base/ingestion fixes the REST answer of this refusal as HTTP 200 carrying { ok: false, error }; an implementation answering HTTP 422 meets every criterion as written and the contract does not allow it.'
  fails_when: the refusal of 2024-02-30 over REST is answered with an HTTP status other than 200, for example 422, or without ok false and an error object
- file: src/__tests__/integration/ingestion/propose-attribute-date.spec.ts
  name: accepts the value 2024-02-29 for a date key and records the node attribute
  proves: An attribute proposal for a date key carrying the value 2024-02-29 is accepted, because that day exists in a leap year.
  fails_when: 2024-02-29 on a date key is refused as an impossible date, or is let through without a node attribute being recorded
- file: src/__tests__/unit/ingestion/structural.spec.ts
  name: refuses %s (2023-02-29, 2024-04-31, 2024-13-01, 2024-01-00)
  proves: 'UNDERDETERMINED entry 2: a check accepting any day up to 29 in February and up to 31 in any month meets criteria 1 and 3 yet accepts 2023-02-29 and 2024-04-31, which rules/knowledge-base/attribute-value-parses refuses. The month past December and day zero cases are the remaining boundaries of the rule''s expression, a date naming an existing day.'
  fails_when: a well-shaped value naming a 29th of February in a non-leap year, a 31st in a thirty-day month, a month 13 or a day 00 is accepted, or is refused with another code or without the value and value type in its details
- file: src/__tests__/unit/ingestion/structural.spec.ts
  name: accepts %s (2023-02-28, 2024-12-31)
  proves: 'The boundaries just inside the rule''s expression, a date naming an existing day: the last day of February in a non-leap year and the 31st of a 31-day month are not refused, so the check turns exactly where the calendar does.'
  fails_when: the check is tightened beyond the calendar, refusing 2023-02-28 or the 31st of December
not_applicable:
- edge_case: absent or empty value on a date key
  why: Refused at the Zod boundary of the proposal (value is a required non-empty string), before the structural layer this task changes; no criterion or node of this task states it.
- edge_case: a date key carrying a value not in YYYY-MM-DD shape, such as "tomorrow"
  why: The date-shape clause belongs to the sibling propose-attribute task per the task's REMAINDER note; structural.spec.ts already holds a test for it.
- edge_case: number, bool and text values
  why: Their clauses belong to sibling propose-attribute tasks per the task's REMAINDER notes, and the implementation did not change those branches.
- edge_case: two proposals for one date key at once
  why: The refusal fires in the structural layer before any consolidation or lock, so concurrency cannot alter what this task requires; the consolidation race is a different rule.
- edge_case: store or run unavailable while a refused proposal is in flight
  why: The refusal is decided from the value and the key's type alone; unreachable-store and unknown-run answers are other rules of the contract that this task does not implement.
- edge_case: an empty collection or a duplicate value
  why: The refusal answers one scalar value; no criterion or node states a collection or a uniqueness claim over it, and re-affirmation of an accepted date belongs to the consolidation rules.
untested:
- 'rules/knowledge-base/attribute-value-parses: no finite test of this task decides the rule whole. Its number, bool and text clauses belong to sibling propose-attribute tasks and its attribute-correction clause to the correct-item task under contracts/knowledge-base/curation, so a test over the date clause alone would assert part of it as the whole and carries no demonstrates.'
- 'contracts/knowledge-base/ingestion: the contract spans fourteen operations and their refusals; this task reaches only the propose-attribute refusal for an impossible date, so no finite test within it decides the contract whole.'
- 'domain/knowledge-base/proposal, domain/knowledge-base/attribute-key and domain/knowledge-base/value-type: they declare shapes (attributes, relationships, the four members date, number, text, bool) that the implementation honored and did not change; no behavior of this task decides them, and a test over them would pin the arrangement of the code, not an obligation.'
- 'Inference about behavior: ''naming an existing day'' is decided by the proleptic Gregorian calendar with year 0000 accepted and the leap rule taken from the platform''s UTC arithmetic. No node decides the century cases (1900-02-29, 2000-02-29) or year 0000, so none is pinned by a test; the fact needs a home in the specification.'
- 'Inference about behavior: the refusal for an impossible day keeps the message text ''value is not a calendar-valid date.''. No node holds that wording, so no test pins it.'
- 'The MCP rendering of this refusal (content and isError) is not tested: contracts/knowledge-base/ingestion states the HTTP 200 answer over REST for this rule and no node or criterion of this task states the MCP form.'
- An attribute correction's value now also gets the existing-day refusal through the shared parseAttributeValue (src/modules/curation/service/item.service.ts). The correction clause is a remainder for the correct-item task and its refusal shape against contracts/knowledge-base/curation is unverified here.
- 'The ADVISORY note on criterion 3: the proposal outcome depends on confidence and held assertions, so the test asserts only that the proposal is not refused and a node attribute is recorded, and pins no outcome label.'
divergences:
- cites: MNT-03
  file: src/__tests__/integration/ingestion/propose-attribute-date.spec.ts
  departure: the Fastify test harness (JWT key fixture, environment fixture and a fake pg client) is rebuilt in this file in compact form instead of being called from propose-routes.spec.ts.
  why: those helpers are private to that spec and not exported; sharing them would mean refactoring an existing test file outside this task, so a copy was the smaller change.
- cites: TYP-02
  file: src/__tests__/integration/ingestion/propose-attribute-date.spec.ts
  departure: the fake pg client and pool and the JWKS resolver result are asserted into their types without a narrowing guard.
  why: a structural double of PoolClient and Pool cannot be narrowed by a guard, and the existing integration specs in the same directory do the same.
- cites: TST-04
  file: src/__tests__/integration/ingestion/propose-attribute-date.spec.ts
  departure: the file is named for the behavior it proves rather than mirroring ingestion.routes.ts, the unit under test.
  why: the neighbouring integration specs in src/__tests__/integration/ingestion follow the same naming, and the REST route mirror is shared by four proposals.
---

## What it is

Four REST-level tests and two table-driven parser tests hold that a date value naming no existing day is refused with VALIDATION_INVALID_FORMAT as an HTTP 200 envelope and records no node attribute, while 2024-02-29 is accepted.

## Notes

None.
