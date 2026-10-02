---
title: A refused number or bool attribute value names its value type
summary: An attribute proposal refused because its value is not a finite number, or is not true or false, is refused naming the value and its value type.
sources:
- intake/scope.md
objective: A refusal of an attribute proposal for a number-typed or bool-typed key names the value and its value type.
criteria:
- An attribute proposal for a key whose value type is number, carrying a string of digits too large to be a finite number, is refused with the error code VALIDATION_INVALID_FORMAT naming the value and its value type.
- An attribute proposal for a key whose value type is bool, carrying the value 1, is refused with the error code VALIDATION_INVALID_FORMAT naming the value and its value type.
implements:
- rules/knowledge-base/attribute-value-parses
- contracts/knowledge-base/ingestion
- domain/knowledge-base/proposal
- domain/knowledge-base/attribute-key
- domain/knowledge-base/value-type
- constraints/ingestion-transports-answer-alike
---

## What it is

A test-first correction of the number and bool refusals in the attribute value parser.

## Notes

UNDERDETERMINED, from the specification — contracts/knowledge-base/ingestion, operation propose-attribute, answers the rules/knowledge-base/attribute-value-parses refusal with "error code VALIDATION_INVALID_FORMAT naming the value and its value type, HTTP 200 carrying `{ ok: false, error }` over REST"; neither criterion names the transport status, so an implementation that refuses both proposals naming the value and its value type but answers over REST with HTTP 422 instead of HTTP 200 carrying `{ ok: false, error }` meets every criterion as written and the contract does not allow it.
UNDERDETERMINED, from the specification — domain/knowledge-base/proposal states that an attribute proposal carries its value as text, whatever the value type of its attribute key; criterion 2 says "carrying the value 1" without saying the value is the text "1", so an implementation that still accepts a non-text attribute value and refuses the numeric value 1 for a bool-typed key in the value-type check meets criterion 2 and the node refuses it.
UNDERDETERMINED, from the specification — the rules/knowledge-base/attribute-value-parses expression is "number: ^-?\d+(\.\d+)?$ and finite; bool: ^(true|false)$" and the criteria test only an overflowing string of digits and the value 1; an implementation that judges a number by whether a runtime numeric conversion is finite, and so accepts "1e3", "0x1F", " 12" or the empty string, or one that judges a bool case-insensitively and accepts "TRUE", meets both criteria and the node refuses it.
UNDERDETERMINED, from the specification — the objective covers every refusal of a number-typed or bool-typed attribute proposal and the contract names the value and its value type for every refusal of rules/knowledge-base/attribute-value-parses, but the criteria exercise only two refusal paths; an implementation that names the value and its value type only when a string of digits overflows and when a bool value is 1, and refuses "abc" for a number-typed key or "yes" for a bool-typed key naming neither, meets both criteria and the contract refuses it.
REMAINDER, from the specification — The date clause and the text clause of rules/knowledge-base/attribute-value-parses reach no criterion here; the date refusal belongs to the task carrying scenarios/knowledge-base/impossible-calendar-date-refused and the text clause refuses nothing.
Decision, beyond the covers — stand: scenarios/knowledge-base/impossible-calendar-date-refused is not claimed; the date refusal is delivered by a sibling task and this task implements the number and bool refusals only.
REMAINDER, from the specification — The clause of rules/knowledge-base/attribute-value-parses about an attribute correction's value reaches no criterion here; contracts/knowledge-base/curation answers it with "error code BUSINESS_INVALID_ATTRIBUTE_VALUE naming the value type and the value, HTTP 422 over REST", and it belongs to the attribute-correction operation of contracts/knowledge-base/curation, a separate task.
Decision, beyond the covers — stand: contracts/knowledge-base/curation is not claimed; the attribute-correction clause is a remainder for a sibling task and this task implements the propose-attribute refusal only.
Decision, beyond the covers — stand: domain/knowledge-base/corrected-values is not claimed; it types an attribute correction's value, which this task does not touch.
