---
target: backend
title: Proof for the number and bool refusals naming the value type
summary: 'Tests that a refused number-typed or bool-typed attribute proposal is refused with VALIDATION_INVALID_FORMAT naming the value and its value type, over REST as HTTP 200 carrying { ok: false, error }, with the value judged as text by the stated number and bool expressions.'
implementation: sha256:163de50240a2a691ca5236da7dc93cf01c0ba36acb26bcd6ca0a19a7c9b51dfd
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/value-type-named-refusal-names-value-type-suite
tests:
- file: src/__tests__/integration/ingestion/propose-attribute-value-type.spec.ts
  name: refuses a string of digits too large to be a finite number with VALIDATION_INVALID_FORMAT naming the value and its value type
  proves: An attribute proposal for a key whose value type is number, carrying a string of digits too large to be a finite number, is refused with the error code VALIDATION_INVALID_FORMAT naming the value and its value type.
  fails_when: the overflowing digit string (1 followed by 309 zeros) is accepted, is refused under another code, or is refused without details carrying both the value and the value type number
- file: src/__tests__/integration/ingestion/propose-attribute-value-type.spec.ts
  name: refuses the value 1 for a bool key with VALIDATION_INVALID_FORMAT naming the value and its value type
  proves: An attribute proposal for a key whose value type is bool, carrying the value 1, is refused with the error code VALIDATION_INVALID_FORMAT naming the value and its value type.
  fails_when: the text "1" is accepted for a bool-typed key, is refused under another code, or is refused without details carrying both the value and the value type bool
- file: src/__tests__/integration/ingestion/propose-attribute-value-type.spec.ts
  name: answers the refusal of the bool value 1 as HTTP 200 carrying ok false and an error
  proves: 'UNDERDETERMINED entry on contracts/knowledge-base/ingestion, operation propose-attribute: the attribute-value-parses refusal is answered over REST as HTTP 200 carrying { ok: false, error }.'
  fails_when: 'the refusal of a bool value 1 over REST is answered with any status other than 200 (for instance HTTP 422), or the body is not { ok: false, error } with VALIDATION_INVALID_FORMAT'
- file: src/__tests__/integration/ingestion/propose-attribute-value-type.spec.ts
  name: refuses a value carried as the number 1 instead of text as a malformed proposal with HTTP 422 listing the value field
  proves: 'UNDERDETERMINED entry on domain/knowledge-base/proposal: an attribute proposal carries its value as text whatever the value type of its key, so a value that is not text is a proposal of the wrong shape (HTTP 422, VALIDATION_INVALID_FORMAT listing the failing field) and never reaches the value-type check.'
  fails_when: a non-text value (the JSON number 1) for a bool-typed key is accepted at the boundary and refused later in the value-type check (HTTP 200 naming the value type), or is accepted, or the 422 refusal does not list the value field
- file: src/__tests__/unit/ingestion/structural.spec.ts
  name: parseAttributeValue for a number key refuses %s naming the value and its value type
  proves: 'UNDERDETERMINED entries on rules/knowledge-base/attribute-value-parses: a number reads only as ^-?\d+(\.\d+)?$ and finite (no exponent, hexadecimal, space, empty string, bare decimal point, leading dot or plus sign), and every number refusal names the value and its value type, including a plain word. One row per class of non-matching shape or boundary of the expression.'
  fails_when: a number is judged by a runtime numeric conversion so that 1e3, 0x1F, a leading space, the empty string, 5., .5 or +1 is accepted; or any refusal of a number-typed value, such as abc, carries details without both the value and the value type number
- file: src/__tests__/unit/ingestion/structural.spec.ts
  name: parseAttributeValue for a number key accepts the largest power of ten that is still a finite number
  proves: 'The finiteness boundary of rules/knowledge-base/attribute-value-parses for number: 1 followed by 308 zeros is finite and is accepted, so the refusal of 1 followed by 309 zeros (criterion 1) is the turn at the boundary and not a rejection of long digit strings in general.'
  fails_when: a digit string that is still a finite number is refused, for instance a length cap on digits or a finiteness check that treats 1e308 as non-finite
- file: src/__tests__/unit/ingestion/structural.spec.ts
  name: parseAttributeValue for a bool key refuses %s naming the value and its value type
  proves: 'UNDERDETERMINED entries on rules/knowledge-base/attribute-value-parses: a bool reads exactly as true or false (case-sensitive, no surrounding space), and every bool refusal names the value and its value type, including a plain word.'
  fails_when: a bool is judged case-insensitively or after trimming so that TRUE or "true " is accepted; or any refusal of a bool-typed value, such as yes, carries details without both the value and the value type bool
not_applicable:
- edge_case: absent value, and empty value for a bool-typed key
  why: an absent or empty attribute value is refused at the Zod boundary of the proposal (required, minimum length one) before the value-type check, which no criterion of this task and no clause of the rule decides; the empty string for a number key is held at the parser level where the rule's expression decides it
- edge_case: a refused proposal leaving a partial write
  why: no criterion or node of this task states what a refused number or bool proposal leaves in the store; the refusal is raised in the structural layer before any statement that writes, and the sibling date proof already holds the no-attribute-recorded assertion for the same layer
- edge_case: a dependency that fails or answers slowly, and two proposals against one subject at once
  why: the value-type check is a pure function of the value and the key's value type; it reads no dependency and no shared state, and no criterion or node here states a concurrent behavior
- edge_case: a duplicate where uniqueness is claimed, and an empty collection returned
  why: the refusals concern one value of one proposal; neither the criteria nor the nodes claim uniqueness or return a collection here
- edge_case: accepted values (true, false, finite numbers, any text)
  why: unchanged by this task and already held by the existing accepts-integer-and-decimal and accepts-only-true-false tests of structural.spec.ts; one new accepting boundary (the largest finite power of ten) was added only because the finiteness expression turns there
untested:
- 'rules/knowledge-base/attribute-value-parses: no finite test of this task decides its whole fact; the invariant also covers the date clause (held by the sibling task''s tests), the text clause (refuses nothing) and an attribute correction''s value (answered by the curation contract with BUSINESS_INVALID_ATTRIBUTE_VALUE, a separate task), so the number and bool clauses are proven and the node is not claimed'
- 'contracts/knowledge-base/ingestion: the contract spans fourteen operations and their answers; no finite test decides it whole, and the propose-attribute value-parse answer (code, naming, HTTP 200 over REST) is exercised by the tests above without claiming the contract'
- 'domain/knowledge-base/proposal: the node holds several facts (kinds, confidence, change hint, validity dates, evidence citations) beyond the value-as-text one; the value-as-text fact is exercised by the HTTP 422 test but the node is not claimed whole'
- 'domain/knowledge-base/attribute-key: an aggregate holding catalog facts (key, value type, flags, allowed values, version, node type); this task does not change them and no finite test of the number and bool refusals decides the aggregate'
- 'domain/knowledge-base/value-type: the closed set date, number, text, bool is held as a type of the parser''s argument; no finite test can decide that no fifth value exists'
- 'constraints/ingestion-transports-answer-alike: a totality over every ingestion operation both transports expose; no test here decides it, and the MCP rendering of the number and bool refusals was not exercised, since the correction sits in the validation layer both transports reach and no criterion names the MCP answer'
- 'inference recorded by the implementation about behavior: the message strings ''value is not a finite number.'' and ''value does not parse as a bool (expected ''true'' or ''false'').'' stay as they were; no node decides the wording of these refusals, so no test pins it'
- 'behavior the implementation deferred: whether non-text attribute values are refused at the boundary of the MCP transport and the directed-ingestion path was not exercised; only the REST propose-attribute route is covered by the HTTP 422 test'
divergences:
- cites: MNT-03
  file: src/__tests__/integration/ingestion/propose-attribute-value-type.spec.ts
  departure: the file repeats the signed-token fixture, the fake pool's transaction and run lookups, the environment fixture and the application assembly that propose-attribute-date.spec.ts already holds, trimmed to what a refusal path needs.
  why: the existing spec holds that harness inline and exports nothing, and extracting it would mean rewriting an existing test that cannot be run from here; the repository's other integration specs follow the same self-contained arrangement
---

## What it is

Tests that a refused number-typed or bool-typed attribute proposal is refused with VALIDATION_INVALID_FORMAT naming the value and its value type, over REST as HTTP 200 carrying { ok: false, error }, with the value judged as text by the stated number and bool expressions.

## Notes

None.
