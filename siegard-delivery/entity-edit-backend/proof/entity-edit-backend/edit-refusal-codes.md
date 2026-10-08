---
target: backend
title: Proof for the entity edit's refusal codes in the shared status table
summary: Eight tests over the shared code-to-status table and the curation mapper show the five new refusal codes render at the contract's statuses, that the retrieval 404 for BUSINESS_UNKNOWN_ATTRIBUTE_KEY is unchanged, and that no new refusal logs at error level.
implementation: sha256:6b50cacad68028908cb77a2c66f5b693ba94577d6a10e27648bf3885f8178313
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/entity-edit-backend-edit-refusal-codes-suite
tests:
- file: src/__tests__/unit/shared/error-mapping.entity-edit.spec.ts
  name: renders BUSINESS_NODE_NOT_ACTIVE as HTTP 409
  proves: BUSINESS_NODE_NOT_ACTIVE renders as HTTP 409 over REST.
  fails_when: renderErrorEnvelope resolves BUSINESS_NODE_NOT_ACTIVE to any status other than 409, including the 500 fallback for an unregistered code.
- file: src/__tests__/unit/shared/error-mapping.entity-edit.spec.ts
  name: renders BUSINESS_ENTITY_EDIT_CONFLICT as HTTP 409
  proves: BUSINESS_ENTITY_EDIT_CONFLICT renders as HTTP 409 over REST.
  fails_when: renderErrorEnvelope resolves BUSINESS_ENTITY_EDIT_CONFLICT to any status other than 409, including the 500 fallback for an unregistered code.
- file: src/__tests__/unit/shared/error-mapping.entity-edit.spec.ts
  name: renders BUSINESS_ENTITY_EDIT_DISPUTED as HTTP 409
  proves: BUSINESS_ENTITY_EDIT_DISPUTED renders as HTTP 409 over REST.
  fails_when: renderErrorEnvelope resolves BUSINESS_ENTITY_EDIT_DISPUTED to any status other than 409, including the 500 fallback for an unregistered code.
- file: src/__tests__/unit/shared/error-mapping.entity-edit.spec.ts
  name: renders BUSINESS_ENTITY_EDIT_NO_CHANGES as HTTP 422
  proves: BUSINESS_ENTITY_EDIT_NO_CHANGES renders as HTTP 422 over REST.
  fails_when: renderErrorEnvelope resolves BUSINESS_ENTITY_EDIT_NO_CHANGES to any status other than 422, including the 500 fallback for an unregistered code.
- file: src/__tests__/unit/shared/error-mapping.entity-edit.spec.ts
  name: renders BUSINESS_UNKNOWN_ATTRIBUTE_KEY raised as a curation business error as HTTP 422 keeping its code and details
  proves: BUSINESS_UNKNOWN_ATTRIBUTE_KEY raised by an entity edit renders as HTTP 422 over REST. The entity edit's own raise path is not in this task, so the edit is represented by the curation BusinessError class, the path the implementation record names.
  fails_when: The curation mapper renders a BusinessError carrying BUSINESS_UNKNOWN_ATTRIBUTE_KEY at any status other than 422, for example by looking the code up in the shared table that holds 404. It also fails if the mapper drops the code or the details (attribute key and node type).
- file: src/__tests__/unit/shared/error-mapping.entity-edit.spec.ts
  name: renders BUSINESS_INVALID_ATTRIBUTE_VALUE as HTTP 422 instead of an internal failure
  proves: UNDERDETERMINED entry 1. The contract gives BUSINESS_INVALID_ATTRIBUTE_VALUE HTTP 422, and a registration of only the five named codes would leave it unregistered, so it fell through to 500.
  fails_when: BUSINESS_INVALID_ATTRIBUTE_VALUE is absent from the shared table or mapped to anything but 422, so a code-keyed render answers 500.
- file: src/__tests__/unit/shared/error-mapping.entity-edit.spec.ts
  name: keeps BUSINESS_UNKNOWN_ATTRIBUTE_KEY at HTTP 404 when rendered by code for the retrieval surface
  proves: UNDERDETERMINED entry 2. The retrieval contract states 404 for BUSINESS_UNKNOWN_ATTRIBUTE_KEY, and criterion 5 must not be met by flipping the single shared table entry to 422 for every surface. The existing table spec asserts this value only inside a broad catalog test, whose failure does not name this obligation.
  fails_when: The shared table entry for BUSINESS_UNKNOWN_ATTRIBUTE_KEY is changed to 422 or any other status than 404.
- file: src/__tests__/unit/shared/error-mapping.entity-edit.spec.ts
  name: logs %s as a warning and never at error level
  proves: UNDERDETERMINED entry 4. The new business refusals fall under constraints/expected-refusals-not-logged-as-errors. This test covers the five codes the task registers, in a table over BUSINESS_NODE_NOT_ACTIVE, BUSINESS_ENTITY_EDIT_CONFLICT, BUSINESS_ENTITY_EDIT_DISPUTED, BUSINESS_ENTITY_EDIT_NO_CHANGES and BUSINESS_INVALID_ATTRIBUTE_VALUE.
  fails_when: Rendering any of these codes yields logLevel error. That happens if the code is unregistered and falls to the 500 default, or is registered at a 5xx status, or the level derivation stops mapping statuses below 500 to warn.
not_applicable:
- edge_case: absent or empty input to the status lookup, such as an empty or unknown code string
  why: The unregistered-code fallback to 500 with error level is existing behavior this task does not change, and the existing error-mapping spec already tests it. No criterion or node states a different behavior for these new codes.
- edge_case: two renders of one code at once, or ordering between renders
  why: The table lookup is a pure function over a constant table. No obligation states a concurrent behavior.
- edge_case: a duplicate registration of a code in the table
  why: A duplicate key in an object literal is a compile-time concern with no behavior of its own. No criterion claims uniqueness of entries.
- edge_case: a store failure or slow dependency while rendering
  why: Rendering a code to a status touches no store. The contract's 503 and 500 terminals were not changed by this task, and the existing error-mapping spec asserts them.
untested:
- contracts/knowledge-base/entity-editing, as a whole. No finite test decides it. It spans the route, the request and response shapes, every rule's refusal and the details each refusal names, none of which this task implements. This task covers only the code-to-status slice, and the five criteria's tests prove that slice without demonstrating the node.
- constraints/expected-refusals-not-logged-as-errors, as a whole. It is a totality over every business or validation refusal in the system, which nothing enumerates, so no finite test decides it. Only the log level of the six entity-edit codes is proven. A test over the whole table would also meet BUSINESS_CHAT_DISABLED, BUSINESS_CHAT_PROVIDER_UNAVAILABLE and BUSINESS_CHAT_INGEST_DISABLED at 503, which render with logLevel error through renderErrorEnvelope. Whether that conflicts with the constraint belongs to the chat tasks, not this one.
- UNDERDETERMINED entry 1, the store uniqueness-guard half (a refused write must answer BUSINESS_TEMPORAL_INCOHERENT 422 and not SYSTEM_INTERNAL_ERROR). Nothing in this task makes that mapping, and the edit surface that would apply it is the raising task's. The curation mapper's existing spec already asserts SQLSTATE 23505 maps to 422 BUSINESS_TEMPORAL_INCOHERENT, so no new test is written here. The edit surface's own use of that mapping is unproven until the task that raises the refusals.
- UNDERDETERMINED entry 1, the other contract codes (VALIDATION_INVALID_FORMAT, RESOURCE_NOT_FOUND, BUSINESS_TEMPORAL_INCOHERENT, SYSTEM_SERVICE_UNAVAILABLE, SYSTEM_INTERNAL_ERROR). They were already registered at the contract's statuses, and the existing error-mapping spec and curation mapper spec already assert them. A test here would repeat that evidence.
- 'UNDERDETERMINED entry 2, the ingestion surface''s HTTP 200 carrying { ok: false, error } for BUSINESS_UNKNOWN_ATTRIBUTE_KEY. That path is rendered in the ingestion module, which this task does not touch, and the entry''s named implementation (the table flipped to 422) is excluded by the 404 test. The retrieval class path (knowledge-graph UnknownAttributeKeyError to 404) is already asserted in the knowledge-graph mapper''s spec.'
- UNDERDETERMINED entry 3, the details each refusal names (node and status, attribute key and item, key and node type). The errors that carry them are not defined in this task, as the implementation record's deferred list says, so the settling code sits in the tasks that raise the refusals. Nothing in this task can exclude an implementation that defines the errors without details. The test for criterion 5 asserts the curation mapper forwards details it is given, which proves the mapper and not that any raiser fills them.
- Criterion 5's raise path. It is proven only through the curation BusinessError class status, which the implementation record names as the mechanism. Whether the task that adds the entity-edit route raises BUSINESS_UNKNOWN_ATTRIBUTE_KEY as a curation BusinessError, and not the knowledge-graph error class that renders 404, is unproven here. The implementation record's inference that it must is behavior no node states, and it is not pinned beyond that test.
- The inference that BUSINESS_UNKNOWN_ATTRIBUTE_KEY stays 404 in the table, with the edit surface's 422 resting on the class-based status. It is an arrangement choice, not a node's fact. The 404 test is written for the retrieval contract's stated status and not for this arrangement, and no test pins that the edit's 422 comes from a class rather than the table.
divergences:
- cites: TST-04
  file: src/__tests__/unit/shared/error-mapping.entity-edit.spec.ts
  departure: The file mirrors the unit's directory (src/__tests__/unit/shared/) but not its file name. The unit src/shared/error-mapping.ts already has src/__tests__/unit/shared/error-mapping.spec.ts, and this proof's tests sit beside it in a separate spec.
  why: The existing spec carries source comments and was not written by this delivery. Editing it would oblige delivering it whole under the no-comments rule, a sweep outside this task. A separate file keeps the task's tests together and leaves the existing spec byte-identical.
---
## What it is
Eight tests over the shared code-to-status table and the curation mapper show the five new refusal codes render at the contract's statuses, that the retrieval 404 for BUSINESS_UNKNOWN_ATTRIBUTE_KEY is unchanged, and that no new refusal logs at error level.

## Notes
None.
