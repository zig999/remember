---
target: backend
title: Apply an entity edit as one whole
summary: editEntityService opens one transaction, checks and records each change of an edit in the order given through the already delivered check, decision and record helpers, refuses an edit that changes nothing, and answers node_id, action_id and one applied entry per change.
task: sha256:d6411c2b66b54783121ac1ab023fcc6c7ef677dbcb3517389ff4dc3f86fe4e8f
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/entity-edit-backend-apply-entity-edit-build
files:
- path: src/modules/curation/service/edit-entity.service.ts
  effect: New write service editEntityService(deps, nodeId, body). Inside one withTransaction it locks and loads the active node, then for each change in order resolves the key, checks the value against the catalog, checks validity, checks the change against the held attributes, decides the effect and records it. It records the operator note once, lazily, when the first effectful change is written. It then refuses an all-unchanged or empty edit with BUSINESS_ENTITY_EDIT_NO_CHANGES, records one curation action and answers { node_id, action_id, applied } with underscore effects. A store uniqueness violation becomes TemporalIncoherentError.
- path: src/modules/curation/service/entity-edit-action.ts
  effect: AppliedEntry and appliedEntry are now exported, so the answer's applied entries use the same underscore spelling as the action payload. Behavior of recordEditAction is unchanged.
criteria:
- criterion: An accepted edit answers the edited node's identity as node_id.
  met: true
  how: editWithin returns node_id from the node row loaded by loadActiveNodeForEdit (edit-entity.service.ts).
- criterion: An accepted edit answers the identity of the curation action it recorded as action_id.
  met: true
  how: editWithin returns the id that recordEditAction returned from insertCurationAction.
- criterion: An accepted edit answers exactly one applied entry for each change it was given.
  met: true
  how: applyChanges pushes exactly one AppliedChange per change, and the answer maps that list through appliedEntry.
- criterion: An accepted edit answers its applied entries in the order in which its changes were given.
  met: true
  how: applyChanges is a sequential for-of over body.changes, and the list is never reordered.
- criterion: Each applied entry names its change's attribute key.
  met: true
  how: recordChange sets attribute_key from change.attribute_key.
- criterion: Each applied entry carries its change's effect.
  met: true
  how: recordChange sets effect from decideChangeEffect's result, and appliedEntry rewrites hyphens to underscores (first_value).
- criterion: An unchanged entry carries a null item_id.
  met: true
  how: recordChange returns item_id null for the unchanged effect.
- criterion: An unchanged entry carries a null predecessor_id.
  met: true
  how: recordChange returns predecessor_id null for the unchanged effect.
- criterion: A first-value entry carries a null predecessor_id.
  met: true
  how: A first-value change names no attribute, so recordChange returns predecessor_id as change.item_id ?? null, which is null.
- criterion: A removal entry carries a null item_id.
  met: true
  how: The removal branch of recordChange returns item_id null.
- criterion: A removal entry carries the removed attribute as its predecessor_id.
  met: true
  how: The removal branch returns predecessor_id as the named attribute id that recordRemoval rejected.
- criterion: A succession entry carries the new attribute as its item_id.
  met: true
  how: writeNewAttribute returns the id recordSuccession returns from recordNewAttribute, and recordChange puts it in item_id.
- criterion: A succession entry carries the superseded attribute as its predecessor_id.
  met: true
  how: A succession change names its predecessor, and recordChange returns change.item_id as predecessor_id.
- criterion: An unchanged change records no attribute.
  met: true
  how: The unchanged branch of recordChange returns before any write, and the note is not requested for it.
- criterion: An edit whose every change is unchanged is refused with BUSINESS_ENTITY_EDIT_NO_CHANGES.
  met: true
  how: assertSomethingChanged throws BusinessError with that code when every applied effect is unchanged.
- criterion: An edit refused for changing nothing records no raw information.
  met: true
  how: The note is recorded lazily by scope.noteOf(), only from the effectful branch. An all-unchanged edit never calls it, and the transaction rolls back on the throw.
- criterion: An edit with one unchanged change and one first value is not refused by the changes-something rule.
  met: true
  how: assertSomethingChanged refuses only when every effect is unchanged, and the first-value entry is not.
- criterion: An edit of an active node with a reason and an empty list of changes is refused with BUSINESS_ENTITY_EDIT_NO_CHANGES.
  met: true
  how: The node is loaded and checked active first. An empty applied list satisfies every(), so assertSomethingChanged throws with that code.
- criterion: An edit with an empty list of changes records no raw information.
  met: true
  how: No change reaches recordChange, so the lazy note is never recorded.
- criterion: An edit with an empty list of changes records no LLM run.
  met: true
  how: The LLM run is opened inside recordOperatorNote, which is never reached.
- criterion: An edit with an empty list of changes records no curation action.
  met: true
  how: assertSomethingChanged throws before recordEditAction.
- criterion: An accepted edit of several changes records one raw information.
  met: true
  how: scope.noteOf memoizes one recordOperatorNote promise per edit, and every effectful change shares it.
- criterion: An accepted edit of several changes records one LLM run.
  met: true
  how: The run is opened inside the single memoized recordOperatorNote call.
- criterion: An accepted edit records one curation action.
  met: true
  how: editWithin calls recordEditAction exactly once, after all changes are applied.
- criterion: An accepted edit whose reason was sent surrounded by whitespace records its curation action's reason trimmed of that whitespace.
  met: true
  how: The raw body.reason is passed to recordEditAction, which trims it (entity-edit-action.ts).
- criterion: An accepted edit whose reason was sent surrounded by whitespace records its information fragment's text trimmed of that whitespace.
  met: true
  how: The raw body.reason is passed to recordOperatorNote, which trims it and uses the trimmed text as the fragment text.
- criterion: An accepted edit whose reason was sent surrounded by whitespace records note content that holds the reason trimmed of that whitespace.
  met: true
  how: recordOperatorNote composes the content from the trimmed reason.
- criterion: An edit whose second change is refused leaves no attribute its first change would have recorded.
  met: true
  how: Every write runs in the single withTransaction client, and the refusal throws out of the callback, which rolls back.
- criterion: A refused edit leaves no LLM run.
  met: true
  how: Any refusal throws inside withTransaction and the whole transaction, including the run, rolls back.
- criterion: A refused edit leaves no curation action.
  met: true
  how: The action is written last in the same transaction, and any earlier refusal rolls it back or never reaches it.
- criterion: An edit refused because its set change names a superseded deadline attribute leaves no raw information.
  met: true
  how: checkChangeAgainstHeldAttributes refuses the change before recordChange asks for the note, and the rollback covers any other case.
- criterion: A change naming an attribute that another operation superseded while the edit waited for its lock is refused with BUSINESS_ENTITY_EDIT_CONFLICT.
  met: true
  how: The node row is locked FOR UPDATE first. checkNamedAttribute then reads the named attribute FOR UPDATE and refuses a non-live one with the conflict code, so it sees the committed state after the wait.
- criterion: A write that a uniqueness guard of the store refuses answers BUSINESS_TEMPORAL_INCOHERENT.
  met: true
  how: editEntityService catches isPgUniqueViolation after the rollback and throws TemporalIncoherentError, which carries that code.
- criterion: The edit's writes run inside one database transaction.
  met: true
  how: editEntityService runs editWithin through withTransaction with a single pooled client, and every helper receives that client.
- criterion: A change whose valid_from is not written YYYY-MM-DD and whose key the catalog does not hold for the edited node's type is refused with VALIDATION_INVALID_FORMAT.
  met: false
  how: The date format is refused by IsoDateSchema in EditEntityBodySchema at the boundary, which parses the whole body before the service is reached (DTO-01). The route that parses it is the next task. This service orders node, then changes, and receives typed input only.
- criterion: A change naming a key the catalog does not hold for the edited node's type and whose validity start falls later than its validity end is refused with BUSINESS_UNKNOWN_ATTRIBUTE_KEY.
  met: true
  how: checkChange calls resolveAttributeKey before checkChangeValidity, so the unknown key is refused first.
- criterion: A change naming a key the catalog does not hold for the edited node's type and naming an attribute whose status is superseded is refused with BUSINESS_UNKNOWN_ATTRIBUTE_KEY.
  met: true
  how: The key is resolved before checkChangeAgainstHeldAttributes.
- criterion: A set change whose value does not read as its key's value type and whose validity start falls later than its validity end is refused with BUSINESS_INVALID_ATTRIBUTE_VALUE.
  met: true
  how: checkChangeAgainstCatalog, which covers value type and allowed values, runs before checkChangeValidity.
- criterion: A set change whose value is none of its key's allowed values and that names an attribute whose status is superseded is refused with BUSINESS_INVALID_ATTRIBUTE_VALUE.
  met: true
  how: The catalog check runs before the held-attributes check.
- criterion: A change whose validity start falls later than its validity end and that names an attribute whose status is superseded is refused with BUSINESS_TEMPORAL_INCOHERENT.
  met: true
  how: checkChangeValidity runs before checkChangeAgainstHeldAttributes.
- criterion: An edit whose body has no reason and that names an identity at which no knowledge node is held is refused with VALIDATION_INVALID_FORMAT.
  met: false
  how: A missing reason is refused by EditEntityBodySchema at the route boundary, before the service loads the node (DTO-01). The route is not part of this task, and the service only receives a typed body.
- criterion: An edit whose reason holds 1001 characters once trimmed and that names a node whose status is merged is refused with VALIDATION_INVALID_FORMAT.
  met: false
  how: The reason length is refused by EditEntityBodySchema (ENTITY_EDIT_REASON_MAX_LENGTH) at the boundary, before the service reaches loadActiveNodeForEdit. The route that runs the parse is the next task.
- criterion: An edit carrying a change whose valid_from is not written YYYY-MM-DD and naming an identity at which no knowledge node is held is refused with VALIDATION_INVALID_FORMAT.
  met: false
  how: The date format is a boundary refusal in EditEntityBodySchema, ahead of the service's node lookup. It cannot be shown until the route parses first.
- criterion: An edit whose first change names a key the catalog does not hold for the edited node's type and whose second change's kind is neither set nor remove is refused with VALIDATION_INVALID_FORMAT.
  met: false
  how: The kind enum is part of EditEntityBodySchema, which parses every change before any is checked, so the boundary refuses the second change first. The service has no raw body to refuse, and the route is the next task.
- criterion: An edit naming an identity at which no knowledge node is held and carrying a change whose validity start falls later than its validity end is refused with RESOURCE_NOT_FOUND.
  met: true
  how: loadActiveNodeForEdit runs first in editWithin and throws ResourceNotFoundError before any change is checked.
- criterion: An edit naming a node whose status is needs-review and carrying a change naming a key the catalog does not hold for that node's type is refused with BUSINESS_NODE_NOT_ACTIVE.
  met: true
  how: loadActiveNodeForEdit throws ConflictError BUSINESS_NODE_NOT_ACTIVE before any change is checked.
- criterion: An edit whose first change names a key the catalog does not hold for the edited node's type and whose second change's validity start falls later than its validity end is refused with BUSINESS_UNKNOWN_ATTRIBUTE_KEY.
  met: true
  how: applyChanges checks and records change by change in order and stops at the first refusal, so the first change's unknown key is thrown before the second is examined.
- criterion: An edit whose first change's validity start falls later than its validity end and whose second change names a key the catalog does not hold for the edited node's type is refused with BUSINESS_TEMPORAL_INCOHERENT.
  met: true
  how: The first change is refused by checkChangeValidity before the second change is reached.
nodes:
- node: contracts/knowledge-base/entity-editing
  encoded_at:
  - src/modules/curation/service/edit-entity.service.ts
  how: 'The service realises the accepted answer { node_id, action_id, applied } and the service-level refusals: node not found, node not active, key, value, validity, conflict, disputed, no changes and the uniqueness guard. The transport clauses (path, HTTP statuses, boundary VALIDATION_INVALID_FORMAT details) belong to the route task and are not reached here.'
- node: constraints/entity-edit-is-atomic
  encoded_at:
  - src/modules/curation/service/edit-entity.service.ts
  how: The note, run, attributes, provenance and action are all written through the one client of withTransaction in editEntityService. A refusal or failure at any point rolls back the whole.
- node: domain/knowledge-base/entity-edit
  encoded_at:
  - src/modules/curation/dto/edit-entity.dto.ts
  - src/modules/curation/service/edit-entity.service.ts
  how: The edit's shape (reason, changes) is the delivered EditEntityBody. The service takes the whole edit as one unit under one reason, one note and one action.
- node: domain/knowledge-base/applied-change
  encoded_at:
  - src/modules/curation/service/entity-edit-action.ts
  - src/modules/curation/service/edit-entity.service.ts
  how: AppliedChange and AppliedEntry declare attribute_key, effect, item_id and predecessor_id, and recordChange fills one per change. The service now exports the wire form for the answer.
- node: domain/knowledge-base/edit-effect
  encoded_at:
  - src/modules/curation/dto/edit-entity.dto.ts
  - src/modules/curation/service/edit-entity.service.ts
  how: The enumeration is the delivered EditEffectSchema. The service branches on its values and assigns each applied entry its decided effect.
- node: rules/knowledge-base/an-edit-effect-crosses-the-wire-with-underscores
  encoded_at:
  - src/modules/curation/service/entity-edit-action.ts
  - src/modules/curation/service/edit-entity.service.ts
  how: The answer maps each entry through the exported appliedEntry, which turns each hyphen into an underscore (first_value). The same function builds the action payload, so the two spellings cannot diverge.
- node: rules/knowledge-base/entity-edit-changes-something
  encoded_at:
  - src/modules/curation/service/edit-entity.service.ts
  how: assertSomethingChanged refuses with BUSINESS_ENTITY_EDIT_NO_CHANGES when no applied entry has an effect other than unchanged, and an empty list is included. It runs before the action is recorded.
- node: scenarios/knowledge-base/an-edit-with-no-changes-is-refused-as-changing-nothing
  encoded_at:
  - src/modules/curation/service/edit-entity.service.ts
  how: An empty list of changes on an active node reaches assertSomethingChanged and is refused as changing nothing, not as malformed. Nothing is written because the note is lazy and the transaction rolls back.
- node: rules/knowledge-base/entity-edit-check-order
  encoded_at:
  - src/modules/curation/service/edit-entity.service.ts
  how: editWithin loads the node (not found, then not active) before any change, and applyChanges then goes change by change in order, stopping at the first refusal. The well-formed request and reason-length checks belong to the boundary parse and are not in the service.
- node: rules/knowledge-base/entity-edit-change-check-order
  encoded_at:
  - src/modules/curation/service/edit-entity.service.ts
  how: checkChange runs key, then value type and allowed values, then validity, then the held-attributes check, which is the order the rule states. The well-formed change check is the DTO's.
- node: scenarios/knowledge-base/edit-of-a-superseded-attribute-is-a-conflict
  encoded_at:
  - src/modules/curation/service/edit-entity.service.ts
  how: checkChangeAgainstHeldAttributes, composed in checkChange, refuses a set change naming a superseded attribute with BUSINESS_ENTITY_EDIT_CONFLICT. The refusal comes before the note is recorded, and the rollback leaves nothing.
- node: rules/knowledge-base/entity-edit-unchanged-records-nothing
  encoded_at:
  - src/modules/curation/service/edit-entity.service.ts
  how: decideChangeEffect yields unchanged by exact string comparison. recordChange then returns before any write, with null item_id and predecessor_id, and the unchanged entry stays in applied.
- node: rules/knowledge-base/entity-edit-first-value
  encoded_at:
  - src/modules/curation/service/edit-entity.service.ts
  how: The first-value effect goes through recordNewAttribute with no predecessor, and the entry carries the new attribute as item_id and a null predecessor_id.
- node: rules/knowledge-base/entity-edit-removal
  encoded_at:
  - src/modules/curation/service/edit-entity.service.ts
  how: The removal effect goes through recordRemoval at the edit's moment. The entry carries a null item_id and the removed attribute as predecessor_id.
- node: rules/knowledge-base/entity-edit-succession
  encoded_at:
  - src/modules/curation/service/edit-entity.service.ts
  how: The succession effect goes through recordSuccession with the named, locked predecessor row. The entry carries the new attribute as item_id and the superseded one as predecessor_id.
- node: rules/knowledge-base/entity-edit-records-curation-action
  encoded_at:
  - src/modules/curation/service/edit-entity.service.ts
  - src/modules/curation/service/entity-edit-action.ts
  how: editWithin calls recordEditAction once with the node id, the reason and the applied list. Kind, target kind, trimmed reason and payload with underscore effects are fixed in recordEditAction.
- node: rules/knowledge-base/entity-edit-reason-trimmed
  encoded_at:
  - src/modules/curation/service/edit-entity.service.ts
  how: The service passes the reason through untouched to recordOperatorNote and recordEditAction, which each trim it. It does not recompute a trimmed form of its own.
- node: rules/knowledge-base/entity-edit-note
  encoded_at:
  - src/modules/curation/service/edit-entity.service.ts
  how: lazyNote invokes recordOperatorNote once per accepted edit, which records the raw information, the single chunk and the accepted fragment.
- node: rules/knowledge-base/entity-edit-note-content
  how: Honored by delegation. recordOperatorNote composes the content from the reason, the edit moment and a nonce, and the service passes the single editedAt it created per edit.
- node: rules/knowledge-base/entity-edit-run
  how: Honored by delegation. recordOperatorNote opens and completes the LLM run with model operator and prompt version operator-edit-v1, and the service only triggers it once per accepted edit.
inferences:
- inferred: The note, and with it the raw information, LLM run, chunk and fragment, is recorded lazily at the first effectful change instead of up front.
  from: entity-edit-changes-something and its scenario say a no-change edit records nothing, and EDG-04 says a refusal comes before any write. No node says when the note is written.
- inferred: Each change is checked and then recorded before the next is checked, so a later change sees the state the earlier changes left. For example, two changes naming the same attribute refuse the second with BUSINESS_ENTITY_EDIT_CONFLICT, because the attribute is no longer live.
  from: entity-edit-check-order says changes are checked one by one in the order given, and entity-edit-names-a-live-attribute requires a named attribute to be live. A check-all-then-write pass would let the second change hit an InvariantError and answer 500.
- inferred: The changes-something refusal is evaluated after every change has passed its checks, so every per-change refusal takes precedence over BUSINESS_ENTITY_EDIT_NO_CHANGES.
  from: entity-edit-check-order lists no position for it, and the effects it judges are only known once every change is checked.
- inferred: A single new Date() taken when the edit begins is the moment of the edit for validity defaults, supersession times and the note content.
  from: The delivered helpers all take editedAt as a parameter, and no node specifies the clock source.
- inferred: The service signature is editEntityService(deps { pool, logger, catalog }, nodeId, body), with the ingestion CatalogSnapshot, and it logs one info line with route, operation, node_id, action_id and the change count.
  from: item.service.ts and the inventory convention for curation write services. The route string is the one the contract names.
- inferred: A pg unique violation is caught in the service after the rollback and thrown as TemporalIncoherentError, using the shared isPgUniqueViolation.
  from: The contract's refusal 'A uniqueness guard of the store refuses the write' maps to BUSINESS_TEMPORAL_INCOHERENT, the existing TemporalIncoherentError, and standard rule EDG-03.
- inferred: A node type absent from the catalog snapshot is an InvariantError (500), not a domain refusal.
  from: The catalog is boot-loaded and node.node_type_id is a foreign key, so absence is corrupted state. This matches how the delivered helpers treat impossible states.
- inferred: The five criteria that expect VALIDATION_INVALID_FORMAT ahead of the node checks are left to the boundary parse that the route task performs. The service receives only a typed EditEntityBody.
  from: Standard rule DTO-01 forbids a service from validating a raw body, and the schemas in edit-entity.dto.ts already encode those refusals.
divergences:
- from: src/modules/curation/service/entity-edit-action.ts
  departure: A previously delivered file was edited to export appliedEntry and AppliedEntry, which were file-private.
  why: The answer must carry the same underscore effect spelling as the action payload. Re-implementing the hyphen-to-underscore rewrite in the service would copy a rule that already exists (MNT-03).
preserved:
- 'Behavior of recordEditAction, the action payload and its underscore effects: the export is the only change to entity-edit-action.ts.'
- item.service.ts, curation.repository.ts, error-mapping.ts, edit-entity.dto.ts and every delivered entity-edit-* helper are untouched.
- The curation module's public index.ts, routes and MCP toolset are unchanged, so the closed tool whitelist and its counts are unaffected.
deferred:
- what: The REST route POST /api/v1/nodes/{node_id}/edit, its boundary parse and error rendering, and the module index export of editEntityService.
  why: The task forbids wiring the route and assigns it to edit-entity-route. The five boundary VALIDATION_INVALID_FORMAT precedence criteria can only be shown there.
- what: BUSINESS_UNKNOWN_ATTRIBUTE_KEY is registered in codeToHttpStatus as 404 (shared/error-mapping.ts), while contracts/knowledge-base/entity-editing states HTTP 422 over REST.
  why: Changing the table would shift existing REST and MCP statuses for other callers, which is outside this task. The route task or a corrective increment should settle it.
---
## What it is
editEntityService opens one transaction, checks and records each change of an edit in the order given through the already delivered check, decision and record helpers, refuses an edit that changes nothing, and answers node_id, action_id and one applied entry per change.

## Notes
Inferred: The note, and with it the raw information, LLM run, chunk and fragment, is recorded lazily at the first effectful change instead of up front.
Inferred: Each change is checked and then recorded before the next is checked, so a later change sees the state the earlier changes left. For example, two changes naming the same attribute refuse the second with BUSINESS_ENTITY_EDIT_CONFLICT, because the attribute is no longer live.
Inferred: The changes-something refusal is evaluated after every change has passed its checks, so every per-change refusal takes precedence over BUSINESS_ENTITY_EDIT_NO_CHANGES.
Inferred: A single new Date() taken when the edit begins is the moment of the edit for validity defaults, supersession times and the note content.
Inferred: The service signature is editEntityService(deps { pool, logger, catalog }, nodeId, body), with the ingestion CatalogSnapshot, and it logs one info line with route, operation, node_id, action_id and the change count.
Inferred: A pg unique violation is caught in the service after the rollback and thrown as TemporalIncoherentError, using the shared isPgUniqueViolation.
Inferred: A node type absent from the catalog snapshot is an InvariantError (500), not a domain refusal.
Inferred: The five criteria that expect VALIDATION_INVALID_FORMAT ahead of the node checks are left to the boundary parse that the route task performs. The service receives only a typed EditEntityBody.
Departure: A previously delivered file was edited to export appliedEntry and AppliedEntry, which were file-private.
Deferred: The REST route POST /api/v1/nodes/{node_id}/edit, its boundary parse and error rendering, and the module index export of editEntityService.
Deferred: BUSINESS_UNKNOWN_ATTRIBUTE_KEY is registered in codeToHttpStatus as 404 (shared/error-mapping.ts), while contracts/knowledge-base/entity-editing states HTTP 422 over REST.
