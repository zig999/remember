---
target: backend
title: Proof of the REST edit-entity route
summary: Drives POST /api/v1/nodes/{node_id}/edit through the real Fastify app, the real edit service and the transactional in-memory store of the previous task. It holds the accepted answer, every refusal of the entity-editing contract with its status, code and naming, the five format-before-node precedence cases, owner authentication, error-level logging and the absence of an edit tool on every language-model surface.
implementation: sha256:ef976da25d0281a6fed053efd0b43777a556f6d7516948db43b363452678707e
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/entity-edit-backend-edit-entity-route-suite
tests:
- file: src/__tests__/integration/curation/edit-entity.routes.spec.ts
  name: an accepted entity edit over REST > answers HTTP 200
  proves: An accepted edit answers HTTP 200. Also, because the request is a POST to /api/v1/nodes/{node_id}/edit, the criteria 'The edit is served for the POST method.' and 'The edit is served at the path /api/v1/nodes/{node_id}/edit.'
  fails_when: The route is not mounted for POST at /api/v1/nodes/{node_id}/edit under the /api/v1 scope, or an accepted edit answers any status other than 200.
- file: src/__tests__/integration/curation/edit-entity.routes.spec.ts
  name: an accepted entity edit over REST > answers node_id, action_id and applied with no envelope around them
  proves: The accepted answer carries node_id, action_id and applied with no envelope.
  fails_when: The accepted body is wrapped (for example { ok, result }) or lacks any of node_id, action_id, applied, or carries a further top-level field.
- file: src/__tests__/integration/curation/edit-entity.routes.spec.ts
  name: an accepted entity edit over REST > writes the effect of a first value as first_value
  proves: An accepted edit's applied entry for a first value carries the effect first_value.
  fails_when: The route answers the first-value effect as first-value, or any spelling other than first_value.
- file: src/__tests__/integration/curation/edit-entity.routes.spec.ts
  name: the edit a request carries > is applied to the node whose identity the path names, %s (an active node; a node in needs_review)
  proves: The edit is applied to the node whose identity the path's node_id segment names.
  fails_when: The route hands the service an identity other than the path's node_id segment, so the answer or the refusal names another node.
- file: src/__tests__/integration/curation/edit-entity.routes.spec.ts
  name: the edit a request carries > takes the reason of the recorded curation action from the reason field of the JSON body
  proves: The edit's reason is read from the reason field of the JSON request body.
  fails_when: The route hands the service a reason that is not the body's reason field, so the recorded curation action carries a different reason.
- file: src/__tests__/integration/curation/edit-entity.routes.spec.ts
  name: the edit a request carries > takes the changes it applies from the changes field of the JSON body
  proves: The edit's changes are read from the changes field of the JSON request body.
  fails_when: The route hands the service changes that are not the body's changes field, so the applied entries do not name the body's keys in the body's order.
- file: src/__tests__/integration/curation/edit-entity.routes.spec.ts
  name: the applied entries of an accepted edit on the wire > writes every effect with an underscore for each hyphen of its enumeration value
  proves: rules/knowledge-base/an-edit-effect-crosses-the-wire-with-underscores. An edit that produces all six effects answers them as first_value, unchanged, succession, removal, addition and correction.
  fails_when: Any effect crosses the wire with a hyphen kept (first-value) or with any spelling other than its enumeration value with each hyphen written as an underscore.
  demonstrates: rules/knowledge-base/an-edit-effect-crosses-the-wire-with-underscores
- file: src/__tests__/integration/curation/edit-entity.routes.spec.ts
  name: the applied entries of an accepted edit on the wire > keeps item_id and predecessor_id on every entry, null where the effect has none
  proves: UNDERDETERMINED note 2. The REST serialization keeps the applied entry fields attribute_key, item_id and predecessor_id for every effect, with null where the effect has none.
  fails_when: The route serializes the answer through a response schema or a null-dropping step so an entry leaves item_id or predecessor_id out (undefined instead of null), or strips them.
- file: src/__tests__/integration/curation/edit-entity.routes.spec.ts
  name: the edit effect enumeration > holds exactly first-value, addition, succession, correction, removal and unchanged
  proves: domain/knowledge-base/edit-effect. The enumeration holds exactly the six values first-value, addition, succession, correction, removal, unchanged.
  fails_when: A value is added to, removed from or renamed in the edit effect enumeration the route's answers are drawn from.
  demonstrates: domain/knowledge-base/edit-effect
- file: src/__tests__/integration/curation/edit-entity.routes.spec.ts
  name: a shape refusal over REST > carries issues of path and message in its details, each path joined by a dot
  proves: A shape refusal's details carry issues of path and message.
  fails_when: The format refusal's details lack issues, an issue lacks path or message, or a nested path is not joined by dots (changes.0.valid_from).
- file: src/__tests__/integration/curation/edit-entity.routes.spec.ts
  name: a shape refusal over REST > answers HTTP 422 VALIDATION_INVALID_FORMAT for a node_id path segment that is not a well-formed identifier
  proves: UNDERDETERMINED note 3. A node_id path segment that is not a well-formed identifier is refused as 422 VALIDATION_INVALID_FORMAT, not left to the store.
  fails_when: The route sends a malformed node_id path segment to the store, so it answers 500 SYSTEM_INTERNAL_ERROR or 404 RESOURCE_NOT_FOUND instead of 422 VALIDATION_INVALID_FORMAT.
- file: src/__tests__/integration/curation/edit-entity.routes.spec.ts
  name: an edit whose statement times out > answers HTTP 503 SYSTEM_SERVICE_UNAVAILABLE, as an unreachable store does
  proves: UNDERDETERMINED note 1. A statement that times out (SQLSTATE 57014) answers 503 SYSTEM_SERVICE_UNAVAILABLE.
  fails_when: The route sends connection failures to 503 but lets a statement timeout fall through to 500 SYSTEM_INTERNAL_ERROR.
- file: src/__tests__/integration/curation/edit-entity.routes.spec.ts
  name: a request without a valid owner bearer token > carrying %s is refused without the edit running (no Authorization header; a token signed by a key the provider did not publish; an expired token; a token that names no owner)
  proves: A request without a valid owner bearer token is refused without the edit running. A valid edit is sent, and the store shows no connection and no change.
  fails_when: The route is mounted outside the authenticated /api/v1 scope, or any of the four credential classes reaches the edit service or answers other than 401.
- file: src/__tests__/integration/curation/edit-entity.routes.spec.ts
  name: the language-model tool surfaces > list no tool that edits an entity on the %s transport (ingest, query, curation)
  proves: No language-model tool surface lists a tool that edits an entity. The tools/list of each of the three MCP transports names none, and the list is non-empty.
  fails_when: An MCP tool whose name contains edit is added to the ingest, query or curation transport, or a transport answers an empty list so the check passes vacuously.
- file: src/__tests__/integration/curation/edit-entity.routes.spec.ts
  name: the language-model tool surfaces > list no tool that edits an entity in the chat tool catalog
  proves: No language-model tool surface lists a tool that edits an entity. The chat tool catalog names (query and ingest_directed) include none.
  fails_when: A tool whose name contains edit is added to CHAT_TOOL_NAMES or CHAT_INGEST_TOOL_NAMES.
- file: src/__tests__/integration/curation/edit-entity-contract.routes.spec.ts
  name: the answers the entity-editing contract states > answers %s (one case per row of CONTRACT_ROWS)
  proves: 'contracts/knowledge-base/entity-editing whole. The accepted answer (six changes of all six effects, ids and nulls) and every refusal row with its HTTP status, code, fixed message or naming, and issue shape: reason length, value-matches-the-kind (set without value, remove with value), removal names an attribute, missing, null, wrong-type, closed-set, identifier, date and no-body fields, malformed node_id path, not found, not active, unknown key, value type, allowed values, non-temporal key with validity, start not before end, defaulted start, four conflicts, disputed, no changes, uniqueness guard, unreachable store, statement timeout, unexpected cause. Also covers the criteria for 422 format, 404, 422 unknown key, 409 conflict, 503, its message, 500, its message and its withheld cause.'
  fails_when: Any row's status, code, message, details naming, issue shape (path joined by dots, message) or an accepted entry changes, or the 500 and 503 envelopes carry anything beyond code and message (a leaked cause or details).
  demonstrates: contracts/knowledge-base/entity-editing
- file: src/__tests__/integration/curation/edit-entity-contract.routes.spec.ts
  name: an edit failing a format check and a later check > is refused as VALIDATION_INVALID_FORMAT when it carries %s (five cases)
  proves: The five VALIDATION_INVALID_FORMAT precedence criteria that apply-entity-edit recorded as unmet (valid_from format with unknown key; missing reason with unheld node; reason of 1001 characters with merged node; valid_from format with unheld node; unknown key then a kind that is neither set nor remove), now through the route's body parse.
  fails_when: The format check runs after the node lookup or after the per-change checks, so any of the five edits answers 404, 409 or a BUSINESS_* code instead of 422 VALIDATION_INVALID_FORMAT.
- file: src/__tests__/integration/curation/edit-entity-contract.routes.spec.ts
  name: a refusal for a business or validation cause > is not logged at error level - %s (every 4xx row of CONTRACT_ROWS)
  proves: A refusal for a business or validation cause is not logged at error level.
  fails_when: A 4xx refusal of the route (format, not found, not active, business or conflict) makes the route or the shared error renderer write a log record at error level (pino level 50) or above.
files:
- path: src/__tests__/integration/curation/edit-entity-routing.ts
  effect: Test helper that adds no assertions. It supplies the forwarding module that replaces the edit-service module for a spec, so the route's call, made with the route's served pool handle, reaches the real editEntityService through the transactional world of the previous task. Any other pool reaches the real service directly.
- path: src/__tests__/integration/curation/edit-entity-route-harness.ts
  effect: Test helper that builds the real Fastify app (buildApp) with both catalogs, a capturing pino logger, a test JWKS and tokens signed with generated keys. It sends edit requests by inject, binds the world to the served pool, offers an unreachable pool, and lists error-level log records.
not_applicable:
- edge_case: A reason of exactly 1000 characters, the accepted side of the reason-length boundary
  why: The boundary is owned by the request-schema task and its rule. This task's criteria and the contract state the 1001 refusal through the route, which is covered. An accepted-at-1000 case would restate the schema task's fact.
- edge_case: Methods other than POST on /api/v1/nodes/{node_id}/edit, and an absent node_id segment
  why: The criteria state only that the edit is served for POST at that path. No node or criterion states what other methods answer, and that is Fastify's behavior, not a fact of this task.
- edge_case: A payload above the body size limit
  why: The limit is set once in app.ts for every route, and no criterion or node of this task states it.
- edge_case: A duplicate edit of the same node
  why: The route states no uniqueness. Duplicate current values are refused by the service as BUSINESS_ENTITY_EDIT_CONFLICT, which the contract table covers as the second-current-value case.
- edge_case: A slow dependency that still succeeds
  why: Only the statement timeout and the unreachable store are stated, and both are covered. A slow success changes no required answer.
untested:
- 'constraints/every-operation-requires-owner-authentication: the node states a totality over every operation reached over the network. No finite test of this task enumerates those operations, and a test over this route alone would assert part of it as the whole. The route''s own criterion is tested (four classes of refused credential, the edit never running), but the node stays under a reading.'
- 'constraints/unreachable-store-answers-unavailable: the node covers every operation of the system. This proof exercises only edit-entity (a rejected connection, and a 57014 timeout mid-write), so it holds the route''s criterion and not the node.'
- 'constraints/internal-failure-withholds-cause: the node covers every operation of the system. This proof shows only that edit-entity answers the fixed message with no cause for an unexpected store error. That is the route''s criterion, not the node.'
- 'constraints/expected-refusals-not-logged-as-errors: the node covers every refusal of the system, with a stated exception for a model-provider failure in a chat turn that this task never reaches (the REMAINDER note). Only the edit route''s 4xx refusals are shown not to log at error level.'
- 'constraints/entity-editing-is-not-a-language-model-tool: whether a tool exposes entity editing is a property of what the tool does, which no finite enumeration decides. The tests list the tool names of the three MCP transports and the chat tool catalog and refuse any name containing edit, which proves the criterion''s listing and leaves the node''s wider fact to a reading.'
- Real-database behavior the in-memory store only imitates. The FOR UPDATE row locks, SQL text, the real uniqueness index, a server-side statement timeout and a concurrent writer racing the edit are simulated by SQLSTATE codes and a one-shot supersession in the fake pool. The real Neon database was deliberately not touched.
- The route's own wiring of the ingestion catalog into editEntityService (the inference 'O servico recebe o catalogo do ingestion'). The specs forward the route's service call to the world, which brings its own catalog, so the catalog app.ts passes is never consulted. The catalog itself is exercised in the service task.
- The inference that node_id is validated before the body. Both failures answer the same 422 VALIDATION_INVALID_FORMAT, so no behavior observes the order, and no node decides it. Not pinned.
- The inference that an absent body is treated as {}. The no-body request is tested only as the contract's missing-field row (422 VALIDATION_INVALID_FORMAT), not as the treatment of the body as an empty object, which is an arrangement.
- The inference that the route is registered directly under /api/v1 and outside /curation. It is an arrangement, and only the published path /api/v1/nodes/{node_id}/edit is tested.
- BUSINESS_UNKNOWN_ATTRIBUTE_KEY keeps status 404 in the shared codeToHttpStatus for the other surfaces (MCP and other REST routes) while this route answers 422. The 422 on this route is tested, and the other surfaces are outside this task, so the disagreement between the two renderers stays recorded as deferred.
- The REMAINDER note about the model-provider failure of a chat turn. It belongs to the chat surface, so no test is written here.
divergences:
- cites: TST-03
  file: src/__tests__/integration/curation/edit-entity.routes.spec.ts
  departure: The edit-service module is replaced with a forwarding module. For the route's served pool handle it forwards the call to world.edit of the previous task, and for any other pool it calls the real editEntityService.
  why: The previous task's transactional fake pool is not exposed (buildWorld closes over its pool and catalog), and the spec may not edit it. The real service and the real SQL-level rules still run, and only the pool handle the route passes is swapped. The route's call into the service is therefore a stand-in at a module boundary.
- cites: TST-03
  file: src/__tests__/integration/curation/edit-entity-contract.routes.spec.ts
  departure: The same forwarding replacement of the edit-service module is used.
  why: Same reason as for edit-entity.routes.spec.ts. The business rules under test are real, and only the store handle is faked.
- cites: TST-04
  file: src/__tests__/integration/curation/edit-entity-contract.routes.spec.ts
  departure: The file is named for the contract it holds, beside the route spec, and not as a one-to-one mirror of src/modules/curation/routes/edit-entity.routes.ts.
  why: The two specs share the same unit and one helper pair, and a single file would have outgrown the thirty-line function limit through its data tables. Splitting by obligation kept each describe small. Existing curation specs in this directory are named the same way.
- cites: TST-04
  file: src/__tests__/integration/curation/edit-entity-routing.ts
  departure: A helper that is not a spec and mirrors no unit sits under src/__tests__/integration.
  why: A vi.mock factory cannot import from a module that itself imports the mocked service without a cycle, so the forwarding code needs a leaf module of its own.
- cites: TST-04
  file: src/__tests__/integration/curation/edit-entity-route-harness.ts
  departure: A shared harness that is not a spec and mirrors no unit sits under src/__tests__/integration.
  why: Both specs need the same app, auth and request fixtures, and copying them into each would break MNT-03.
---
## What it is
Drives POST /api/v1/nodes/{node_id}/edit through the real Fastify app, the real edit service and the transactional in-memory store of the previous task. It holds the accepted answer, every refusal of the entity-editing contract with its status, code and naming, the five format-before-node precedence cases, owner authentication, error-level logging and the absence of an edit tool on every language-model surface.

## Notes
None.
