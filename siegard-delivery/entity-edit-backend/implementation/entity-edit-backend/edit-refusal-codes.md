---
target: backend
title: Register the entity edit's refusal codes in the shared status table
summary: Five entity-edit refusal codes are added to the shared code-to-status table, and BUSINESS_UNKNOWN_ATTRIBUTE_KEY stays 404 there. The comments in the file were removed.
task: sha256:0d93c29bb9696f70cef3b775b8caf97d0bec96547a7bf31c5dccd7dc8e4ef632
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/entity-edit-backend-edit-refusal-codes-build
files:
- path: src/shared/error-mapping.ts
  effect: 'The shared code-to-HTTP-status table now holds five new entries. BUSINESS_NODE_NOT_ACTIVE, BUSINESS_ENTITY_EDIT_CONFLICT and BUSINESS_ENTITY_EDIT_DISPUTED render 409. BUSINESS_ENTITY_EDIT_NO_CHANGES renders 422. BUSINESS_INVALID_ATTRIBUTE_VALUE renders 422. It had no entry before, so a code-keyed render of it fell back to 500. The status-to-log-level derivation is unchanged: every status below 500 logs at warn, so the new refusals never log at error. The existing BUSINESS_UNKNOWN_ATTRIBUTE_KEY entry stays 404 for the retrieval surface. Every comment and doc block was removed from the file, as the no-comments rule requires of a file this edit writes. All exports, signatures and messages are unchanged, including the fixed 503 and 500 messages.'
criteria:
- criterion: BUSINESS_NODE_NOT_ACTIVE renders as HTTP 409 over REST.
  met: true
  how: codeToHttpStatus.BUSINESS_NODE_NOT_ACTIVE is 409, so renderErrorEnvelope resolves it to 409. The curation mapper renders a ConflictError at its class status of 409, so the same status holds on the curation REST path.
- criterion: BUSINESS_ENTITY_EDIT_CONFLICT renders as HTTP 409 over REST.
  met: true
  how: codeToHttpStatus.BUSINESS_ENTITY_EDIT_CONFLICT is 409. The curation mapper renders a ConflictError at 409.
- criterion: BUSINESS_ENTITY_EDIT_DISPUTED renders as HTTP 409 over REST.
  met: true
  how: codeToHttpStatus.BUSINESS_ENTITY_EDIT_DISPUTED is 409. The curation mapper renders a ConflictError at 409.
- criterion: BUSINESS_ENTITY_EDIT_NO_CHANGES renders as HTTP 422 over REST.
  met: true
  how: codeToHttpStatus.BUSINESS_ENTITY_EDIT_NO_CHANGES is 422. The curation mapper renders a BusinessError at 422.
- criterion: BUSINESS_UNKNOWN_ATTRIBUTE_KEY raised by an entity edit renders as HTTP 422 over REST.
  met: true
  how: 'I changed no source for this criterion. The curation mapper in src/modules/curation/mcp/error-envelope.ts already renders a BusinessError at its class status of 422, whatever its code. An edit that raises BUSINESS_UNKNOWN_ATTRIBUTE_KEY as a curation BusinessError therefore renders 422. The shared table entry stays 404, so the retrieval surface, which renders through the knowledge-graph error class at 404, is untouched. The ingestion surface answers HTTP 200 with { ok: false, error }, and nothing here reaches it. The code-keyed table cannot hold two statuses for one code, which is why the 422 rests on the mapper and not on the table. The task that raises the error must use BusinessError and not the knowledge-graph error class.'
nodes:
- node: contracts/knowledge-base/entity-editing
  encoded_at:
  - src/shared/error-mapping.ts
  how: This task covers only the statuses the contract gives each refusal code. The shared table holds BUSINESS_NODE_NOT_ACTIVE, BUSINESS_ENTITY_EDIT_CONFLICT and BUSINESS_ENTITY_EDIT_DISPUTED at 409, and BUSINESS_ENTITY_EDIT_NO_CHANGES and BUSINESS_INVALID_ATTRIBUTE_VALUE at 422. BUSINESS_TEMPORAL_INCOHERENT (422), RESOURCE_NOT_FOUND (404) and VALIDATION_INVALID_FORMAT (422) were already registered with the contract's statuses. The fixed 503 and 500 terminals and their messages were already registered, and I kept them verbatim. BUSINESS_UNKNOWN_ATTRIBUTE_KEY at 422 on the edit surface is carried by the curation mapper's BusinessError class status, not by the table. The details each refusal names (node status, attribute key, item, node type), the "uniqueness guard becomes BUSINESS_TEMPORAL_INCOHERENT" mapping and the "Request payload failed validation." issues format were not touched. The curation mapper already renders the uniqueness-guard mapping and the issues format. Raising the refusals with those details belongs to the tasks that raise them.
- node: constraints/expected-refusals-not-logged-as-errors
  encoded_at:
  - src/shared/error-mapping.ts
  how: renderErrorEnvelope derives logLevel from the resolved status, with warn below 500 and error from 500 up. Every new code is registered as 409 or 422, so rendering it never logs at error. I added the new codes to the table specifically so none falls through to the unregistered-code default of 500 with error logging. That default would otherwise have hit BUSINESS_INVALID_ATTRIBUTE_VALUE.
inferences:
- inferred: The task covers the five named codes plus BUSINESS_INVALID_ATTRIBUTE_VALUE. I registered BUSINESS_INVALID_ATTRIBUTE_VALUE (422) beyond the five criteria.
  from: The task's Notes flag that the objective covers every code the contract names while the criteria name five. The contract gives BUSINESS_INVALID_ATTRIBUTE_VALUE 422 and the table had no entry for it. Leaving it out would let a code-keyed render of it answer 500, which the contract refuses. The other codes the contract names were already registered at the contract's statuses.
- inferred: BUSINESS_UNKNOWN_ATTRIBUTE_KEY stays 404 in the shared table. The edit surface's 422 rests on the curation mapper's class-based status for BusinessError.
  from: The task's Notes say retrieval answers 404 and ingestion answers 200 with an error body, and neither may move. src/__tests__/unit/shared/error-mapping.spec.ts asserts the 404 entry. src/modules/curation/mcp/error-envelope.ts renders BusinessError at 422 and ConflictError at 409 by class. The curation correct-item path already raises this code as a BusinessError.
divergences:
- from: Comments in src/shared/error-mapping.ts (the existing header, doc blocks, section markers and inline SQLSTATE and status notes)
  departure: I deleted all of them, although the task's own change was only table entries. CLAUDE.md Rule 3 (surgical changes) and the inventory's convention of annotated tables would keep them.
  why: The framework's no-comments rule says a session that writes a source file delivers it whole under that rule, and the comments go with the edit. The system prompt and the owner's constraint say source carries no comments. I judged the rule that binds this delivery to outweigh Rule 3 and the inventory's annotation convention.
preserved:
- Every previously registered entry in codeToHttpStatus, with the same status.
- BUSINESS_UNKNOWN_ATTRIBUTE_KEY at 404, which the retrieval surface and the existing unit spec rely on.
- The deprecated short codes are still absent from the table.
- renderErrorEnvelope still falls back to 500 with logLevel error for an unregistered code.
- The exports isPgUnavailable, isPgUniqueViolation, mapped, serviceUnavailableError, internalError and toMcpToolResult, and the ErrorEnvelope, MappedError and McpToolErrorResult types, keep their signatures and behavior. The per-domain mappers and the global error handler import them.
- The fixed messages "A backing service is temporarily unavailable." and "Internal server error." are unchanged.
deferred:
- what: The typed errors that carry the contract's details are not written. Those details are the node and its status on NODE_NOT_ACTIVE, the key and item on EDIT_CONFLICT and EDIT_DISPUTED, and the key and node type on UNKNOWN_ATTRIBUTE_KEY. Nothing in this task checks that the details are filled.
  why: The tasks that raise these refusals own the errors and their details. This task registers only the statuses.
- what: src/modules/curation/mcp/error-envelope.ts and src/middleware/error-handler.ts still carry comments, and the unit spec src/__tests__/unit/shared/error-mapping.spec.ts has no assertions for the new entries. Neither was edited.
  why: Neither is in this task's file scope, and no test is written by the implementer. Their comments go to the comment route when a session next writes them.
---
## What it is
Five entity-edit refusal codes are added to the shared code-to-status table, and BUSINESS_UNKNOWN_ATTRIBUTE_KEY stays 404 there. The comments in the file were removed.

## Notes
Inferred: The task covers the five named codes plus BUSINESS_INVALID_ATTRIBUTE_VALUE. I registered BUSINESS_INVALID_ATTRIBUTE_VALUE (422) beyond the five criteria.
Inferred: BUSINESS_UNKNOWN_ATTRIBUTE_KEY stays 404 in the shared table. The edit surface's 422 rests on the curation mapper's class-based status for BusinessError.
Departure: I deleted all of them, although the task's own change was only table entries. CLAUDE.md Rule 3 (surgical changes) and the inventory's convention of annotated tables would keep them.
Deferred: The typed errors that carry the contract's details are not written. Those details are the node and its status on NODE_NOT_ACTIVE, the key and item on EDIT_CONFLICT and EDIT_DISPUTED, and the key and node type on UNKNOWN_ATTRIBUTE_KEY. Nothing in this task checks that the details are filled.
Deferred: src/modules/curation/mcp/error-envelope.ts and src/middleware/error-handler.ts still carry comments, and the unit spec src/__tests__/unit/shared/error-mapping.spec.ts has no assertions for the new entries. Neither was edited.
