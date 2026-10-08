---
target: backend
title: Proof for checking a change's key and value against the catalog
summary: Unit tests build an in-memory catalog snapshot and show that checkChangeAgainstCatalog refuses an unknown key, an unparsable value and a value outside the allowed values with the contract's codes, names the parts the criteria require, and accepts well-formed values.
implementation: sha256:3d9571be94dcf353d4a26a84ad321fcaa9f85a07ed6bc01f56b572a7f98adf72
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/entity-edit-backend-check-change-key-and-value-suite
tests:
- file: src/__tests__/unit/curation/attribute-change-catalog.spec.ts
  name: refuses a set change naming a key the catalog does not hold for the node type
  proves: A set change naming a key the catalog does not hold for the edited node's type is refused with BUSINESS_UNKNOWN_ATTRIBUTE_KEY.
  fails_when: a set change on a key absent from the catalog is accepted, or is refused with any code other than BUSINESS_UNKNOWN_ATTRIBUTE_KEY.
- file: src/__tests__/unit/curation/attribute-change-catalog.spec.ts
  name: refuses a remove change naming a key the catalog does not hold for the node type
  proves: A remove change naming a key the catalog does not hold for the edited node's type is refused with BUSINESS_UNKNOWN_ATTRIBUTE_KEY.
  fails_when: the key check is skipped for remove changes, or a remove on an absent key is refused with another code.
- file: src/__tests__/unit/curation/attribute-change-catalog.spec.ts
  name: refuses a key the catalog holds only for another node type
  proves: The class of keys the catalog holds for a different node type. The key is scoped to the edited node's type, so such a key is unknown (rules/knowledge-base/attribute-key-for-node-type, change clause).
  fails_when: the lookup ignores the node type and matches a key by name alone.
- file: src/__tests__/unit/curation/attribute-change-catalog.spec.ts
  name: refuses an unknown key before reading a value type its name would have under another node type
  proves: 'UNDERDETERMINED entry on rules/knowledge-base/entity-edit-change-check-order: the key is checked before the value, so a value is never read against a type for a key the node''s type does not hold.'
  fails_when: the value is checked before the key (or the key is matched across node types), so an unparsable value on an unknown key is refused as BUSINESS_INVALID_ATTRIBUTE_VALUE or not refused as unknown.
- file: src/__tests__/unit/curation/attribute-change-catalog.spec.ts
  name: names the key in an unknown-key refusal
  proves: An unknown-key refusal names the key.
  fails_when: neither the message nor the details of the unknown-key refusal carry the key.
- file: src/__tests__/unit/curation/attribute-change-catalog.spec.ts
  name: names the node type in an unknown-key refusal
  proves: An unknown-key refusal names the node type. It is exercised with a node type other than the default so a fixed name would fail.
  fails_when: neither the message nor the details carry the name of the node type that was passed in.
- file: src/__tests__/unit/curation/attribute-change-catalog.spec.ts
  name: refuses $label with the invalid-value code
  proves: The three criterion cases (2024-02-30 for a date key, 1e3 for a number key, True for a bool key) are each refused with BUSINESS_INVALID_ATTRIBUTE_VALUE.
  fails_when: any of the three values is accepted, or is refused with a code other than BUSINESS_INVALID_ATTRIBUTE_VALUE.
- file: src/__tests__/unit/curation/attribute-change-catalog.spec.ts
  name: refuses $label
  proves: 'UNDERDETERMINED entry on rules/knowledge-base/attribute-value-parses: other malformed shapes (2024/03/15, 15-03-2024, 2023-02-29, +5, .5, 0x10, Infinity, a number beyond finite range, 1 and yes for bool) are refused with BUSINESS_INVALID_ATTRIBUTE_VALUE.'
  fails_when: a lenient parser accepts any listed malformed shape, or the calendar check ignores leap years, or the finiteness check is dropped.
- file: src/__tests__/unit/curation/attribute-change-catalog.spec.ts
  name: accepts $label
  proves: 'UNDERDETERMINED entry on rules/knowledge-base/attribute-value-parses: well-formed dates (including 29 February of a leap year), numbers and bools are not refused.'
  fails_when: the check refuses every set change on a date, number or bool key, or refuses a leap day, a negative decimal, or either bool literal.
- file: src/__tests__/unit/curation/attribute-change-catalog.spec.ts
  name: names the value type in a refusal for a value that does not read as its type
  proves: A refusal for a value that does not read as its type names the value type.
  fails_when: neither the message nor the details carry the key's value type.
- file: src/__tests__/unit/curation/attribute-change-catalog.spec.ts
  name: names the value in a refusal for a value that does not read as its type
  proves: A refusal for a value that does not read as its type names the value.
  fails_when: neither the message nor the details carry the offending value.
- file: src/__tests__/unit/curation/attribute-change-catalog.spec.ts
  name: refuses a value that neither reads as its type nor is allowed by naming the value type
  proves: 'UNDERDETERMINED entry on rules/knowledge-base/entity-edit-change-check-order: the value-type check comes before the allowed-values check, so such a value is refused naming the value type.'
  fails_when: the allowed values are tested before the value type, so the refusal names the attribute key and the allowed values instead of the value type.
- file: src/__tests__/unit/curation/attribute-change-catalog.spec.ts
  name: refuses $label with the invalid-value code
  proves: A set change whose value is none of its key's allowed values, and one that differs only in letter case, are each refused with BUSINESS_INVALID_ATTRIBUTE_VALUE.
  fails_when: a value outside the allowed values is accepted, the comparison folds letter case, or the refusal carries another code.
- file: src/__tests__/unit/curation/attribute-change-catalog.spec.ts
  name: accepts a value equal to an allowed value exactly as written
  proves: 'UNDERDETERMINED entry on rules/knowledge-base/attribute-value-in-allowed-values: a value that carries an allowed value exactly as written is not refused.'
  fails_when: every set change on a key that has allowed values is refused, including one carrying an allowed value exactly as written.
- file: src/__tests__/unit/curation/attribute-change-catalog.spec.ts
  name: names the attribute key in a refusal for a value outside the allowed values
  proves: A refusal for a value outside the allowed values names the attribute key.
  fails_when: neither the message nor the details carry the attribute key.
- file: src/__tests__/unit/curation/attribute-change-catalog.spec.ts
  name: names the value in a refusal for a value outside the allowed values
  proves: A refusal for a value outside the allowed values names the value.
  fails_when: neither the message nor the details carry the refused value.
- file: src/__tests__/unit/curation/attribute-change-catalog.spec.ts
  name: names every allowed value in a refusal for a value outside the allowed values
  proves: A refusal for a value outside the allowed values names the allowed values.
  fails_when: the refusal omits any of the key's allowed values from both its message and its details.
- file: src/__tests__/unit/curation/attribute-change-catalog.spec.ts
  name: does not refuse $label for a text key with no allowed values
  proves: A set change of any text for a text key that has no allowed values is not refused by these rules.
  fails_when: a text key with no allowed values refuses text, for example by applying a date or number reading to it.
- file: src/__tests__/unit/curation/attribute-change-catalog.spec.ts
  name: renders a refusal for $label as HTTP 422
  proves: 'UNDERDETERMINED entry on contracts/knowledge-base/entity-editing: all three catalog refusals (unknown key, value that does not read as its type, value outside the allowed values) are answered HTTP 422 over REST.'
  fails_when: any of the three refusals renders with a status other than 422, for example the 404 that the code table gives BUSINESS_UNKNOWN_ATTRIBUTE_KEY, 400, or 409.
not_applicable:
- edge_case: absent or empty input (a missing key name, a missing value on a set change)
  why: The helper receives an AttributeChange the DTO has already validated. A set change without a value and a remove change that states one are refused at the format boundary by rules/knowledge-base/entity-edit-value-matches-the-kind, which is not implemented by this task (DTO-01, EDG-01).
- edge_case: an empty collection (a catalog with no keys, or a key with no allowed values)
  why: A key with no allowed values is the open-domain class and is covered by the text-key test. A catalog with no keys for the node type is the unknown-key class, already represented.
- edge_case: a duplicate where uniqueness is claimed
  why: No criterion or bound node states uniqueness for the check. The catalog snapshot builder owns it, and this task did not change that.
- edge_case: an operation against state that forbids it, or two operations on one subject at once
  why: The helper is a pure function over an in-memory snapshot. It reads and writes no stored state, so node state and concurrency belong to other tasks of the epic (entity-edit-names-an-active-node, conflict refusals).
- edge_case: a dependency that fails or answers slowly
  why: The helper has no dependency that can fail, since the catalog is a boot-time snapshot passed in by the caller. The one defensive wrap of an unexpected validator error is an inference, listed under untested.
- edge_case: a refusal's wire shape beyond the HTTP status
  why: No bound node fixes message wording or details field names beyond which parts a refusal names. The tests therefore read the message and the details together.
untested:
- 'contracts/knowledge-base/entity-editing: the contract''s fact spans every answer of the edit (200 body, format, node-state, temporal, conflict and no-change refusals). No finite test within this task decides it whole. This task proves only the three catalog refusals and their HTTP 422 status, and the other answers belong to other tasks of the epic.'
- 'rules/knowledge-base/attribute-key-for-node-type: the invariant also binds an attribute proposal, which belongs to ingestion''s proposal validation and which this helper does not reach. A test of the change clause alone would approximate the fact as the whole, so the change clause is evidenced by tests that name no node.'
- 'rules/knowledge-base/attribute-value-parses: the invariant also binds an attribute proposal and an attribute correction, which belong to ingestion and curation correction. Only the set-change clause is exercised here, so no test claims the node.'
- 'rules/knowledge-base/attribute-value-in-allowed-values: the invariant also binds an attribute proposal and an attribute correction, which are outside this task. Only the set-change clause is exercised here, so no test claims the node.'
- 'domain/knowledge-base/attribute-key: an aggregate-root declaration (attributes, relationships) that no behavior test decides. The helper only reads the catalog''s existing row shape.'
- 'domain/knowledge-base/value-type: an enumeration of four values. Tests through the helper show how date, number, bool and text keys behave, but none fails if a fifth value were added to the declaration, so none decides the enumeration whole.'
- A remove change on a key the catalog holds is accepted. No criterion or node states acceptance; the criteria and the key rule state only the refusal.
- 'Inference about behavior: an unexpected non-validation error thrown by a shared validator is rethrown as a plain Error wrapping the original as its cause. No node decides it, and reaching it needs a stand-in for business logic, which TST-03 forbids.'
- 'Inference about behavior: the refusal details field names (attribute_key, node_type, value_type, value, allowed_values). No node fixes them, so the tests read message and details together and never pin a field name.'
- REMAINDER notes (proposal clause, correction clause, check order across a change and across an edit) and the ADVISORY note on logging refusals below error level (constraints/expected-refusals-not-logged-as-errors) name no implementation. Nothing in this task's criteria excludes them, and the helper does not log, so no test is written.
divergences:
- cites: TST-04
  file: src/__tests__/unit/curation/attribute-change-catalog.spec.ts
  departure: The file sits at src/__tests__/unit/curation/ and not at the full mirror of the unit's path, src/__tests__/unit/modules/curation/service/.
  why: Every existing curation spec (dto.spec.ts, edit-entity.dto.spec.ts) sits directly under unit/curation/, so mirroring the full path would split the suite across two layouts.
---
## What it is
Unit tests build an in-memory catalog snapshot and show that checkChangeAgainstCatalog refuses an unknown key, an unparsable value and a value outside the allowed values with the contract's codes, names the parts the criteria require, and accepts well-formed values.

## Notes
None.
