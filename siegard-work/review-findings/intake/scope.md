# Corrective increment: attribute proposals refused for a number or bool value name no value type

Source of the observation: the review siegard-delivery/drift-corrections/review/drift-corrections.md, conformance finding over backend/src/modules/ingestion/validation/structural.ts.

Observed behavior, in the human's words: an attribute proposal whose key has value type number and whose value is a string of digits too large to be a finite number is refused with VALIDATION_INVALID_FORMAT, and the refusal names only the value. An attribute proposal whose key has value type bool and whose value is not exactly true or false, for example 1, is refused with VALIDATION_INVALID_FORMAT, and the refusal names only the value.

Expected, in the human's words: the contract contracts/knowledge-base/ingestion says the refusal of rules/knowledge-base/attribute-value-parses names the value and its value type.

Reproduction: propose an attribute for a number-typed key with a value of 400 digits, and for a bool-typed key with the value 1; read the error details of each refusal.

File the wrong behavior lives in: backend/src/modules/ingestion/validation/structural.ts
