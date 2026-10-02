---
target: backend
title: Refuse a date value naming no existing day
summary: The date branch of parseAttributeValue now refuses a well-shaped value that names no calendar day (2024-02-30, 2023-02-29, 2024-04-31), accepts 2024-02-29, and names the value and its value type in the refusal's details.
task: sha256:ecb1fce0d385181cc3bc26e3b04d58ca3e7120843e984e7bf0a56a5408dc621a
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/calendar-date-refuse-impossible-date-build
files:
- path: src/modules/ingestion/validation/structural.ts
  effect: The date branch of parseAttributeValue matches the shape YYYY-MM-DD and then checks the year, month and day against the calendar through a new helper, namesExistingDay. The helper builds a UTC date from the three parts and compares them back, so any day that would roll into another month fails, and 02-29 passes only in a leap year. Previously the check was Date.parse, which accepts a day that rolls over, so the refusal almost never fired. A value that names no existing day is now refused with VALIDATION_INVALID_FORMAT and details { value, value_type }; before, the details carried only the value. The helper also adds two named constants. Every comment in the file was removed (header block, inline and JSDoc), under the source-comment rule. The other branches, assertValueInDomain, assertFound and assertKnownType behave as before.
criteria:
- criterion: An attribute proposal for a key whose value type is date, carrying the value 2024-02-30, is refused with the error code VALIDATION_INVALID_FORMAT naming the value and its value type.
  met: true
  how: '2024-02-30 passes the shape regex, then namesExistingDay(2024, 2, 30) is false because the UTC date rolls to 1 March. parseAttributeValue throws ValidationFailure("VALIDATION_INVALID_FORMAT", ..., { value, value_type }). propose-attribute.service.ts calls parseAttributeValue at line 83, and the REST mirror in ingestion.routes.ts (about line 453) sends a ValidationFailure back as HTTP 200 with { ok: false, error }, which is the contract''s answer for this refusal. I did not touch either file.'
- criterion: The same refused proposal records no node attribute.
  met: true
  how: The throw happens in the structural layer, before any consolidation or write in propose-attribute.service.ts, and the REST mirror runs the call inside withTransaction and rolls back on the rejection. I changed no write path; I only made the existing early refusal fire for this value.
- criterion: An attribute proposal for a date key carrying the value 2024-02-29 is accepted, because that day exists in a leap year.
  met: true
  how: namesExistingDay(2024, 2, 29) is true, since the UTC date stays on 29 February 2024. The date branch returns without throwing, so the proposal moves on to the later layers. This criterion only requires the proposal not to be refused by this rule.
nodes:
- node: rules/knowledge-base/attribute-value-parses
  encoded_at:
  - src/modules/ingestion/validation/structural.ts
  how: 'The date clause is encoded in full: the shape ^\d{4}-\d{2}-\d{2}$ followed by the existing-day check, refused with VALIDATION_INVALID_FORMAT carrying the value and its value type. The number, bool and text clauses were already encoded and I did not change them (they belong to sibling tasks per the task''s Notes). The attribute-correction clause is reached incidentally, because src/modules/curation/service/item.service.ts calls the same parseAttributeValue; it belongs to the correct-item task and I made no change there.'
- node: scenarios/knowledge-base/impossible-calendar-date-refused
  encoded_at:
  - src/modules/ingestion/validation/structural.ts
  how: Given a date key and the value 2024-02-30, the proposal is refused (the throw) and no node attribute is recorded (the throw precedes every write).
- node: contracts/knowledge-base/ingestion
  encoded_at:
  - src/modules/ingestion/validation/structural.ts
  how: 'The propose-attribute refusal for attribute-value-parses is VALIDATION_INVALID_FORMAT naming the value and its value type, HTTP 200 with { ok: false, error } over REST. The code and details are produced here. The 200 envelope comes from the existing ingestion.routes.ts mirror, unchanged. The other operations and refusals of the contract were not reached.'
- node: domain/knowledge-base/proposal
  how: Honored, not changed. The date value of an attribute proposal is what this validation judges, in the role the node gives it ("what validation judges before anything reaches the knowledge base"); the proposal's shape is declared elsewhere and untouched.
- node: domain/knowledge-base/attribute-key
  how: Honored, not changed. The key's value_type decides which branch of parseAttributeValue runs; the key's shape is declared elsewhere and untouched.
- node: domain/knowledge-base/value-type
  how: Honored, not changed. The date member selects the branch I corrected; the other members' branches are untouched.
inferences:
- inferred: '"Naming an existing day" is decided by the proleptic Gregorian calendar, year 0000 included (so 0000-01-01 stays accepted), with the leap rule coming from the platform''s UTC date arithmetic rather than a table.'
  from: the node's expression says only "naming an existing day"; the previous Date.parse check already accepted year 0000, so behavior outside impossible days is unchanged.
- inferred: The refusal for an impossible day keeps its existing message text ("value is not a calendar-valid date.") and gains value_type in its details, to match the shape refusal beside it and the contract's "naming the value and its value type".
  from: the sibling shape refusal in the same branch, which already carried { value, value_type }; contracts/knowledge-base/ingestion for propose-attribute.
- inferred: 'The Notes'' two UNDERDETERMINED entries are answered as follows. The status is HTTP 200 with { ok: false, error } as the contract fixes it, and 2023-02-29 and 2024-04-31 are refused as well as 2024-02-30. This follows from the rule''s own wording, a real calendar date, and not from a criterion.'
  from: rules/knowledge-base/attribute-value-parses and the answers of contracts/knowledge-base/ingestion.
divergences:
- departure: 'Prose in a delivered file: the header block, the inline comment in the text and date branches, and the JSDoc on assertFound in src/modules/ingestion/validation/structural.ts'
  from: the source carries no comments, seen at src/modules/ingestion/validation/structural.ts
  why: The comment rule says a session that writes a source file delivers it whole under the rule. I removed the comments with the edit. They described layer order and cross-table checks, and the node and the contract already hold those facts.
preserved:
- parseAttributeValue still refuses a date not in YYYY-MM-DD shape (for example "tomorrow" or "2026-06-12 " with a trailing space) with VALIDATION_INVALID_FORMAT, the value and its value type.
- parseAttributeValue still accepts an ordinary valid date such as 2026-06-12.
- The number branch (shape and finiteness), the bool branch (true or false) and the text branch (any text) are unchanged.
- assertValueInDomain, assertFound and assertKnownType keep their codes, messages and details.
- The export names and signatures of structural.ts are unchanged, so propose-attribute.service.ts, item.service.ts (curation) and the tests under src/__tests__/unit/ingestion keep importing them as before.
deferred:
- what: Other prose comments elsewhere in the tree that cite parseAttributeValue (for example in directed-ingestion.service.ts and in the spec file propose-attribute-domain.spec.ts) were left alone.
  why: They sit in files this task does not write; the comment rule lands them through its own route, and removing them here would widen the task.
- what: src/modules/curation/service/item.service.ts also calls parseAttributeValue, so an attribute correction's value now gets the same existing-day refusal. I did not verify its refusal shape against contracts/knowledge-base/curation.
  why: The correct-item clause belongs to a sibling task per the task's Notes; this task implements the propose-attribute refusal only.
---

## What it is

The date branch of parseAttributeValue now refuses a well-shaped value that names no calendar day (2024-02-30, 2023-02-29, 2024-04-31), accepts 2024-02-29, and names the value and its value type in the refusal's details.

## Notes

None.
