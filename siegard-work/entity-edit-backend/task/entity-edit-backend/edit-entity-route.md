---
title: Publish edit-entity over REST alone
summary: The authenticated REST route that takes an entity edit and answers it in the shape the entity-editing contract states, with no language-model tool exposing it.
rationale: Planning cut the transport away from the service. The route changes with the contract's wire form and the service changes with the business rules, and keeping them apart keeps the interface and its consumer in separate tasks.
sources:
- intake/scope.md
objective: The owner reaches edit-entity over REST alone, and its answers take the shape the entity-editing contract states.
criteria:
- An accepted edit answers HTTP 200.
- The accepted answer carries node_id, action_id and applied with no envelope.
- A body the request schema refuses answers HTTP 422 with VALIDATION_INVALID_FORMAT.
- A shape refusal's details carry issues of path and message.
- An edit naming no held node answers HTTP 404 with RESOURCE_NOT_FOUND.
- An edit refused for an unknown attribute key answers HTTP 422 with BUSINESS_UNKNOWN_ATTRIBUTE_KEY.
- An edit refused as a conflict answers HTTP 409 with BUSINESS_ENTITY_EDIT_CONFLICT.
- An edit that cannot reach the store answers HTTP 503 with SYSTEM_SERVICE_UNAVAILABLE.
- The unavailable answer carries the message "A backing service is temporarily unavailable.".
- An edit that fails for an unexpected cause answers HTTP 500 with SYSTEM_INTERNAL_ERROR.
- The internal-failure answer carries the message "Internal server error.".
- The internal-failure answer does not carry the cause.
- A request without a valid owner bearer token is refused without the edit running.
- A refusal for a business or validation cause is not logged at error level.
- No language-model tool surface lists a tool that edits an entity.
- An accepted edit's applied entry for a first value carries the effect first_value.
- The edit is served for the POST method.
- The edit is served at the path /api/v1/nodes/{node_id}/edit.
- The edit is applied to the node whose identity the path's node_id segment names.
- The edit's reason is read from the reason field of the JSON request body.
- The edit's changes are read from the changes field of the JSON request body.
depends_on:
- task/entity-edit-backend/edit-request-schema
- task/entity-edit-backend/edit-refusal-codes
- task/entity-edit-backend/apply-entity-edit
implements:
- contracts/knowledge-base/entity-editing
- rules/knowledge-base/an-edit-effect-crosses-the-wire-with-underscores
- domain/knowledge-base/edit-effect
- constraints/entity-editing-is-not-a-language-model-tool
- constraints/every-operation-requires-owner-authentication
- constraints/unreachable-store-answers-unavailable
- constraints/internal-failure-withholds-cause
- constraints/expected-refusals-not-logged-as-errors
---
## What it is
The authenticated REST route that takes an entity edit and answers it in the shape the entity-editing contract states, with no language-model tool exposing it.

## Notes
UNDERDETERMINED, from the specification — constraints/unreachable-store-answers-unavailable and the contracts/knowledge-base/entity-editing refusal "The store is unreachable or a statement times out" both cover two causes: an unreachable store and a statement that times out. The criteria "An edit that cannot reach the store answers HTTP 503 with SYSTEM_SERVICE_UNAVAILABLE." and "The unavailable answer carries the message ..." only test the unreachable store. No criterion tests the statement timeout. Implementation that meets every criterion and that the specification refuses: A route that sends connection failures to HTTP 503 SYSTEM_SERVICE_UNAVAILABLE but lets a statement timeout fall through to HTTP 500 SYSTEM_INTERNAL_ERROR "Internal server error.".
Decision, beyond the covers — stand: specification is a read-only neighbour this task consults, and its fact is held by that node; this task changes none of it and the epic does not claim it.
UNDERDETERMINED, from the specification — For an accepted edit, contracts/knowledge-base/entity-editing gives `applied` as one `{ attribute_key, effect, item_id, predecessor_id }` per change, with `item_id` and `predecessor_id` null where the effect has none. This task's criteria only say the answer carries `applied`, and that a first-value entry's effect is first_value. The sibling service task checks the answer the service returns, not the body sent over the wire. So nothing here tests that the REST serialization keeps those fields. Implementation that meets every criterion and that the specification refuses: A route whose response serialization (for example a Fastify response schema that does not declare `predecessor_id`, or that drops nulls) answers HTTP 200 with `applied` entries that leave out `item_id` or `predecessor_id` when they are null, or that strips them altogether.
Decision, beyond the covers — stand: specification is a read-only neighbour this task consults, and its fact is held by that node; this task changes none of it and the epic does not claim it.
UNDERDETERMINED, from the specification — contracts/knowledge-base/entity-editing refuses with VALIDATION_INVALID_FORMAT (HTTP 422) any field that is "not a well-formed identifier", and the edited node's identity travels in the path. The criteria test the format refusal only for "a body the request schema refuses". The sibling request-schema task covers only the body. No criterion tests a malformed `node_id` path segment. Implementation that meets every criterion and that the specification refuses: A route that sends a `node_id` path segment that is not a well-formed identifier straight to the store, which then answers HTTP 500 SYSTEM_INTERNAL_ERROR (or 404 RESOURCE_NOT_FOUND) instead of HTTP 422 VALIDATION_INVALID_FORMAT.
Decision, beyond the covers — stand: specification is a read-only neighbour this task consults, and its fact is held by that node; this task changes none of it and the epic does not claim it.
REMAINDER, from the specification — The statement of constraints/expected-refusals-not-logged-as-errors makes an exception: "a failure to build the model provider at the start of a chat turn" is logged at error level. This task has no such failure, so no criterion of this task reaches that clause. Belongs to: The chat turn's model-provider construction, which is the chat surface and not entity editing.
Decision, beyond the covers — stand: specification is a read-only neighbour this task consults, and its fact is held by that node; this task changes none of it and the epic does not claim it.
ADVISORY, from the specification — Several refusals of contracts/knowledge-base/entity-editing reach REST through this route but are not tested by its criteria: BUSINESS_NODE_NOT_ACTIVE (409), BUSINESS_INVALID_ATTRIBUTE_VALUE (422), BUSINESS_TEMPORAL_INCOHERENT (422), BUSINESS_ENTITY_EDIT_DISPUTED (409) and BUSINESS_ENTITY_EDIT_NO_CHANGES (422). The same goes for the clauses that make refusals name the node, key, item or node type. The sibling tasks for refusal-code registration and for the service's checks claim these, so the route must send them through the shared error mapping unchanged.
Decision, beyond the covers — stand: specification is a read-only neighbour this task consults, and its fact is held by that node; this task changes none of it and the epic does not claim it.
ADVISORY, from the specification — The criterion "An accepted edit's applied entry for a first value carries the effect first_value." depends on rules/knowledge-base/entity-edit-first-value to decide which change records first-value. This task does not implement that rule. It relies on the sibling task that assigns each change's effect, and only checks the wire spelling that rules/knowledge-base/an-edit-effect-crosses-the-wire-with-underscores states.
Decision, beyond the covers — stand: specification is a read-only neighbour this task consults, and its fact is held by that node; this task changes none of it and the epic does not claim it.
