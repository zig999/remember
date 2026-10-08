---
title: Check a change's key and value against the catalog
summary: A change whose key the node's type does not hold, or a set change whose value its key does not accept, is refused with the code the contract states.
rationale: Planning cut the catalog checks away from the edit's other refusals. They are the widened shared rules that ingestion and correction already apply, and they change with the catalog rather than with the edit.
sources:
- intake/scope.md
objective: A change the catalog does not accept for the edited node's type is refused with the catalog code the entity-editing contract states.
criteria:
- A set change naming a key the catalog does not hold for the edited node's type is refused with BUSINESS_UNKNOWN_ATTRIBUTE_KEY.
- A remove change naming a key the catalog does not hold for the edited node's type is refused with BUSINESS_UNKNOWN_ATTRIBUTE_KEY.
- An unknown-key refusal names the key.
- An unknown-key refusal names the node type.
- A set change of 2024-02-30 for a key whose value type is date is refused with BUSINESS_INVALID_ATTRIBUTE_VALUE.
- A set change of 1e3 for a key whose value type is number is refused with BUSINESS_INVALID_ATTRIBUTE_VALUE.
- A set change of True for a key whose value type is bool is refused with BUSINESS_INVALID_ATTRIBUTE_VALUE.
- A refusal for a value that does not read as its type names the value type.
- A refusal for a value that does not read as its type names the value.
- A set change whose value is none of its key's allowed values is refused with BUSINESS_INVALID_ATTRIBUTE_VALUE.
- A set change whose value differs from an allowed value only in letter case is refused with BUSINESS_INVALID_ATTRIBUTE_VALUE.
- A refusal for a value outside the allowed values names the attribute key.
- A refusal for a value outside the allowed values names the value.
- A refusal for a value outside the allowed values names the allowed values.
- A set change of any text for a text key that has no allowed values is not refused by these rules.
implements:
- contracts/knowledge-base/entity-editing
- rules/knowledge-base/attribute-key-for-node-type
- rules/knowledge-base/attribute-value-parses
- rules/knowledge-base/attribute-value-in-allowed-values
- domain/knowledge-base/attribute-key
- domain/knowledge-base/value-type
---
## What it is
A change whose key the node's type does not hold, or a set change whose value its key does not accept, is refused with the code the contract states.

## Notes
UNDERDETERMINED, from the specification — The contract contracts/knowledge-base/entity-editing gives HTTP 422 over REST as part of the answer for rules/knowledge-base/attribute-key-for-node-type, rules/knowledge-base/attribute-value-parses and rules/knowledge-base/attribute-value-in-allowed-values. No criterion states a status. The objective says the change is refused with what the contract states, but the criteria only check the error code and the parts of the message it names. Implementation that meets every criterion and that the specification refuses: A handler that answers BUSINESS_UNKNOWN_ATTRIBUTE_KEY or BUSINESS_INVALID_ATTRIBUTE_VALUE with HTTP 400, or with HTTP 409, and the right fields named.
Decision, beyond the covers — stand: specification is a read-only neighbour this task consults, and its fact is held by that node; this task changes none of it and the epic does not claim it.
UNDERDETERMINED, from the specification — rules/knowledge-base/attribute-value-parses defines a value type by what it accepts: a real calendar date written as year-month-day, digits with an optional leading minus and an optional decimal part, exactly true or false. The criteria only test three refusals (2024-02-30, 1e3, True). No criterion says a well-formed date, number or bool is accepted. No criterion rules out other malformed shapes. Implementation that meets every criterion and that the specification refuses: A check that refuses every set change on a date, number or bool key. Or a lenient parser that refuses 2024-02-30, 1e3 and True but accepts 2024/03/15, 15-03-2024, +5, .5, 0x10, Infinity, 1 or yes.
Decision, beyond the covers — stand: specification is a read-only neighbour this task consults, and its fact is held by that node; this task changes none of it and the epic does not claim it.
UNDERDETERMINED, from the specification — rules/knowledge-base/attribute-value-in-allowed-values requires one of the allowed values exactly as written. The criteria refuse a value outside the set and a value that differs only in letter case. No criterion says that a value equal to an allowed value, exactly as written, is accepted. Implementation that meets every criterion and that the specification refuses: A check that refuses every set change on a key that has allowed values, including one that carries an allowed value exactly as written.
Decision, beyond the covers — stand: specification is a read-only neighbour this task consults, and its fact is held by that node; this task changes none of it and the epic does not claim it.
UNDERDETERMINED, from the specification — rules/knowledge-base/entity-edit-change-check-order orders the checks inside one change: attribute key first, then value type, then allowed values. Its log records that the value-type check comes before the allowed-values check. Those two checks give different answers under the same code: one names the value type and the value, the other names the attribute key, the value and the allowed values. No criterion of this task fixes which check wins when a change fails more than one of these three checks. The rule is not in implements here. Either the task that implements that rule covers this order, or this task takes the rule on. Implementation that meets every criterion and that the specification refuses: A check that tests allowed values before the value type. For a key with allowed values, a value that neither parses nor is allowed is then refused naming the attribute key, the value and the allowed values, instead of the value type and the value. Or a check that tests the value before the key, so it reads a value type for a key the catalog does not hold.
Decision, beyond the covers — stand: specification is a read-only neighbour this task consults, and its fact is held by that node; this task changes none of it and the epic does not claim it.
REMAINDER, from the specification — The proposal clause of rules/knowledge-base/attribute-key-for-node-type ('An attribute proposal ... MUST name an attribute key the catalog holds for the node type of its knowledge node') reaches no criterion of this task. Belongs to: The proposal-validation act of ingestion (an attribute proposal checked by the ingest toolset), not the entity edit.
Decision, beyond the covers — stand: specification is a read-only neighbour this task consults, and its fact is held by that node; this task changes none of it and the epic does not claim it.
REMAINDER, from the specification — The attribute-proposal and attribute-correction clauses of rules/knowledge-base/attribute-value-parses and rules/knowledge-base/attribute-value-in-allowed-values reach no criterion of this task. Only their set-change clause is answered here. Belongs to: The proposal-validation act of ingestion for the attribute proposal, and the curation correction act for the attribute correction.
Decision, beyond the covers — stand: specification is a read-only neighbour this task consults, and its fact is held by that node; this task changes none of it and the epic does not claim it.
REMAINDER, from the specification — The other clauses of rules/knowledge-base/entity-edit-change-check-order (well-formed change first, validity after allowed values, then the check against the edited node's attributes) and the change-by-change order of rules/knowledge-base/entity-edit-check-order are next to this task and are not part of it. Belongs to: The task that implements the check order of an entity edit and of its changes.
Decision, beyond the covers — stand: specification is a read-only neighbour this task consults, and its fact is held by that node; this task changes none of it and the epic does not claim it.
ADVISORY, from the specification — constraints/expected-refusals-not-logged-as-errors says no refusal for a business or validation cause is logged at error level. It applies to both refusal codes this task produces, and no criterion of this task addresses it.
Decision, beyond the covers — stand: specification is a read-only neighbour this task consults, and its fact is held by that node; this task changes none of it and the epic does not claim it.
