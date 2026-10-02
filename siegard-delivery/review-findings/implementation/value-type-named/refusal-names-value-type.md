---
target: backend
title: Number and bool refusals name the value type
summary: The two refusals in parseAttributeValue that carried only the value (a number that is not finite, a bool that is not true or false) now carry the value and its value type in their details, as the regex-shape number refusal and the date refusals already did.
task: sha256:d4f8c3f2fa25ccae76c1230517a5fddeaa8e2b88d9e93cb5d136131c0f3f8b00
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/value-type-named-refusal-names-value-type-build
files:
- path: src/modules/ingestion/validation/structural.ts
  effect: parseAttributeValue's "value is not a finite number." refusal (string of digits that overflows to Infinity) and its "value does not parse as a bool" refusal (any value other than "true"/"false", including "1") now raise VALIDATION_INVALID_FORMAT with details { value, value_type } instead of { value } alone. Codes, messages, regexes and control flow are unchanged.
criteria:
- criterion: An attribute proposal for a key whose value type is number, carrying a string of digits too large to be a finite number, is refused with the error code VALIDATION_INVALID_FORMAT naming the value and its value type.
  met: true
  how: 'In parseAttributeValue''s number case, an overflowing digit string passes the shape regex and fails Number.isFinite; that ValidationFailure("VALIDATION_INVALID_FORMAT", ...) now carries { value: v, value_type: args.value_type } (structural.ts). propose-attribute.service.ts calls parseAttributeValue with the resolved key''s value_type before any later layer.'
- criterion: An attribute proposal for a key whose value type is bool, carrying the value 1, is refused with the error code VALIDATION_INVALID_FORMAT naming the value and its value type.
  met: true
  how: 'In the bool case, "1" is neither "true" nor "false", so the ValidationFailure("VALIDATION_INVALID_FORMAT", ...) is raised, and it now carries { value: v, value_type: args.value_type } (structural.ts). The proposal''s value is text per domain/knowledge-base/proposal, so "1" is the value judged.'
nodes:
- node: rules/knowledge-base/attribute-value-parses
  encoded_at:
  - src/modules/ingestion/validation/structural.ts
  how: The number clause (^-?\d+(\.\d+)?$ and finite) and the bool clause (exactly true or false) are held in parseAttributeValue; every refusal of either now names the value and its value type. The date and text clauses and the correction clause were not touched.
- node: contracts/knowledge-base/ingestion
  encoded_at:
  - src/modules/ingestion/validation/structural.ts
  how: 'The propose-attribute refusal for attribute-value-parses is VALIDATION_INVALID_FORMAT naming the value and its value type; the details of the two refusals this task reaches now carry both. The HTTP 200 carrying { ok: false, error } mapping lives in the transport layer and was not touched.'
- node: domain/knowledge-base/proposal
  how: 'Honored, not reached by a change: the proposal''s value is carried as text and the parser takes a string; the source already treats it so.'
- node: domain/knowledge-base/attribute-key
  how: 'Honored: the value type is the one resolved from the attribute key and passed in by the caller; nothing about the key was changed.'
- node: domain/knowledge-base/value-type
  how: 'Honored: the closed set date, number, text and bool is the parser''s own argument type; unchanged.'
- node: constraints/ingestion-transports-answer-alike
  how: 'Honored: the correction sits in the shared validation layer both REST and MCP reach, so both answer the same code and details. No transport code was touched.'
inferences:
- inferred: The message strings of the two refusals ("value is not a finite number.", "value does not parse as a bool (expected 'true' or 'false').") stay as they were, and only the details change.
  from: The contract and rule fix the code and what the refusal names (value and value type) and state no message for these refusals; the existing messages are emitted text nobody asked to change.
preserved:
- the number shape refusal ("value does not parse as a number.") already named value and value_type and is unchanged
- the date refusals (shape and calendar-validity) are unchanged, as the sibling task delivers them
- the accepted values ("true", "false", finite numbers, text of any content) are still accepted
- curation's attribute correction in src/modules/curation/service/item.service.ts catches any ValidationFailure from parseAttributeValue and answers BUSINESS_INVALID_ATTRIBUTE_VALUE with its own details, so it is unaffected by the added detail
deferred:
- what: 'The transport status of the propose-attribute refusal (contract: HTTP 200 carrying { ok: false, error } over REST) was not examined or changed.'
  why: The task's Notes mark it underdetermined by the criteria, and the correction is confined to the parser's refusal details in structural.ts, the file the human named.
- what: Whether non-text attribute values and runtime-numeric acceptance such as "1e3" or "TRUE" are refused at other layers.
  why: The parser's regexes already refuse them (the number regex is ^-?\d+(\.\d+)?$ and the bool comparison is exact), and the boundary Zod schema is outside the named file and this task's objective.
---

## What it is

The two refusals in parseAttributeValue that carried only the value (a number that is not finite, a bool that is not true or false) now carry the value and its value type in their details, as the regex-shape number refusal and the date refusals already did.

## Notes

The two refusals changed carry the details the contract names, value and value type.
The transport status of the propose-attribute refusal and the layers outside structural.ts were not examined, as the task's underdetermined notes record.
