---
target: backend
title: Record the entity edit's curation action
summary: A new recorder writes one edit_entity curation action on the edited node, carrying the trimmed reason and the applied changes, and returns the action's identity.
task: sha256:221c370314965f8c02d5f91178964f66ed639d65af142aa59dad71214f428881
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/entity-edit-backend-record-edit-action-build
files:
- path: src/modules/curation/service/entity-edit-action.ts
  effect: 'Declares AppliedChange and recordEditAction. Given the caller''s pg client, the edited node''s id, the reason and the applied changes, it inserts one curation_action row through the existing insertCurationAction. The row has action edit_entity, target kind node, the node id as target, the trimmed reason, and a payload object `{ applied: [...] }`. Each applied entry has exactly attribute_key, effect (hyphens turned into underscores), item_id and predecessor_id, in the order given. It returns the new action''s id and runs only on the connection it is handed.'
criteria:
- criterion: The curation action's kind is recorded as edit_entity.
  met: true
  how: recordEditAction passes the constant ENTITY_EDIT_ACTION_KIND = "edit_entity" as `action` to insertCurationAction.
- criterion: The curation action's target kind is node.
  met: true
  how: recordEditAction passes ENTITY_EDIT_ACTION_TARGET_KIND = "node" as `target_kind`.
- criterion: The curation action's target identity is the edited node's.
  met: true
  how: recordEditAction passes input.nodeId as `target_id`.
- criterion: The curation action's reason is the edit's reason.
  met: true
  how: The reason is input.reason.trim(), passed as `reason`. This is the edit's reason in the trimmed form rules/knowledge-base/entity-edit-reason-trimmed requires, the same form recordOperatorNote writes into the note and the fragment.
- criterion: The curation action's payload is an object whose applied field lists one entry for each applied change of the edit.
  met: true
  how: 'The payload is `{ applied: input.applied.map(appliedEntry) }`, so it holds one entry per applied change. insertCurationAction stores it as jsonb, so reading it back gives an object, not an object encoded as a string.'
- criterion: The payload's applied entries are in the order in which the edit's changes were given.
  met: true
  how: Array.prototype.map keeps the order of input.applied, and the recorder neither sorts nor filters it.
- criterion: Each payload entry carries exactly the fields attribute_key, effect, item_id and predecessor_id.
  met: true
  how: appliedEntry builds a new object with exactly those four fields, and the AppliedEntry interface declares only those four. Any other field on the handed change is dropped.
- criterion: Each payload entry's values are those of the applied change it lists.
  met: true
  how: appliedEntry copies attribute_key, item_id and predecessor_id unchanged from the handed AppliedChange. It writes the effect in its stored underscore form, as rules/knowledge-base/entity-edit-records-curation-action requires, and decides nothing again.
- criterion: A first-value entry of the payload carries the effect first_value.
  met: true
  how: storedEffect replaces every hyphen of the effect with an underscore, so "first-value" is written as "first_value".
- criterion: An unchanged entry of the payload carries item_id as null rather than omitting it.
  met: true
  how: appliedEntry always sets the item_id property from the handed change's `string | null` value. A null is serialized by JSON.stringify as null, never omitted. The caller hands null for an unchanged change.
- criterion: A first-value entry of the payload carries predecessor_id as null rather than omitting it.
  met: true
  how: appliedEntry always sets the predecessor_id property from the handed change's `string | null` value. A null is serialized as null, never omitted. The caller hands null for a first-value change.
- criterion: Recording the action returns the identity of the curation action it recorded.
  met: true
  how: recordEditAction returns the `id` from the row insertCurationAction returned for its single insert.
nodes:
- node: rules/knowledge-base/entity-edit-records-curation-action
  encoded_at:
  - src/modules/curation/service/entity-edit-action.ts
  how: 'recordEditAction makes one insert of kind edit_entity, target kind node, at the edited node, with the reason and the `{ applied: [{ attribute_key, effect, item_id, predecessor_id }] }` payload in the order given. Effects are written with underscores, and the null item_id and predecessor_id come through unchanged.'
- node: rules/knowledge-base/a-curation-action-kind-is-written-with-underscores
  encoded_at:
  - src/modules/curation/service/entity-edit-action.ts
  how: The recorded kind is the underscore spelling edit_entity. The payload's effects get the same hyphen-to-underscore conversion. The second clause, filtering a listing by kind, is not reached here. It belongs to the list-curation-actions operation, and the task's own REMAINDER note gives it to a separate task (see deferred).
- node: rules/knowledge-base/entity-edit-reason-trimmed
  encoded_at:
  - src/modules/curation/service/entity-edit-action.ts
  how: The curation action's reason is written as input.reason.trim(). The note and the fragment keep their own trimming in entity-edit-note.ts, which this task did not change.
- node: domain/knowledge-base/curation-action
  encoded_at:
  - src/modules/curation/service/entity-edit-action.ts
  how: The recorder fills the action, target_kind, target_id, payload and reason attributes through the existing insertCurationAction. created_at stays with the table's own default, so the recorder reads no clock. Payload is the stored text form of an object, as for the existing action kinds.
- node: domain/knowledge-base/curation-action-kind
  encoded_at:
  - src/modules/curation/service/entity-edit-action.ts
  how: ENTITY_EDIT_ACTION_KIND names the edit-entity member of the enumeration, in its underscore spelling edit_entity.
- node: domain/knowledge-base/curation-target-kind
  encoded_at:
  - src/modules/curation/service/entity-edit-action.ts
  how: ENTITY_EDIT_ACTION_TARGET_KIND names the node member of the enumeration.
- node: domain/knowledge-base/entity-edit
  encoded_at:
  - src/modules/curation/service/entity-edit-action.ts
  how: The edit's reason and the node it edits are the recorder's input (EditActionInput.reason and nodeId), and the edit's changes arrive as applied changes. Orchestrating the whole edit is not this task.
- node: domain/knowledge-base/applied-change
  encoded_at:
  - src/modules/curation/service/entity-edit-action.ts
  how: The AppliedChange interface declares the value object's four fields, attribute_key, effect, item_id and predecessor_id, with item_id and predecessor_id nullable. Each payload entry is built from one.
- node: domain/knowledge-base/edit-effect
  encoded_at:
  - src/modules/curation/service/entity-edit-action.ts
  how: AppliedChange.effect is typed with the EditEffect enumeration already declared in edit-entity.dto.ts, and the recorder writes each member with underscores. It does not decide the effect.
- node: contracts/knowledge-base/entity-editing
  encoded_at:
  - src/modules/curation/service/entity-edit-action.ts
  how: The contract's accepted answer carries the recorded action's identity as action_id and the applied list. recordEditAction returns that identity for the assembling operation to use, and the payload carries the applied list in the same shape. The route, the refusals and the response are not part of this task.
inferences:
- inferred: The curation action's reason is the edit's reason trimmed of surrounding whitespace, not the raw text the owner sent.
  from: rules/knowledge-base/entity-edit-reason-trimmed, whose Description names the curation action's reason as a place the trimming applies, and the existing recordOperatorNote in entity-edit-note.ts, which trims the same way.
- inferred: The recorder takes already-applied changes with item_id and predecessor_id as `string | null` and copies them as given. It does not recompute them from the effect.
  from: The task's ADVISORY note saying the executor takes each entry's values from the applied change it is handed, and the nodes domain/knowledge-base/applied-change and rules/knowledge-base/entity-edit-first-value.
- inferred: The payload is passed to insertCurationAction as a plain object, which stores it as jsonb like the other kinds.
  from: The existing CurationActionInsertArgs.payload (Record<string, unknown>) and its JSON.stringify(...)::jsonb insert, and the task's ADVISORY note about storing the payload in the same form as the existing action kinds.
- inferred: AppliedChange and EditActionInput are declared as interfaces in the new service file, not as a Zod DTO.
  from: The helpers already delivered (entity-edit-note.ts, entity-edit-removal.ts and others) declare their inputs as interfaces in the service file. The value never crosses a boundary, so STK-08 and DTO-02 do not reach it.
- inferred: The recorder is a suffix-less helper file, entity-edit-action.ts, that takes the caller's PoolClient and opens no transaction of its own.
  from: The convention of the sibling helpers in service/ and the task's ADVISORY note citing constraints/entity-edit-is-atomic.
divergences:
- from: 'siegard-delivery inventory conventions: src/modules/compliance-audit/dto/curation-action.dto.ts (CurationActionNameSchema) lacks edit_entity, and the caller''s brief asked for it'
  departure: CurationActionNameSchema was not edited. edit_entity is not added to the Zod enum the audit listing uses to filter by action.
  why: The task's REMAINDER note assigns the listing filter clause of rules/knowledge-base/a-curation-action-kind-is-written-with-underscores to a separate task over contracts/knowledge-base/compliance-audit. No criterion here reaches it, and widening the task is forbidden. The change is a one-line enum addition in a file that also carries comments, which would have to be removed with it. See deferred.
deferred:
- what: Add "edit_entity" to CurationActionNameSchema in src/modules/compliance-audit/dto/curation-action.dto.ts, so list-curation-actions accepts and matches the kind as a filter. Update src/__tests__/unit/compliance-audit/dto.spec.ts and src/__tests__/integration/compliance-audit/routes.spec.ts to cover it. The comments in that DTO file go with the edit.
  why: The task's REMAINDER note names it as a separate task over the compliance-audit contract. Until then the edit_entity rows are written but cannot be requested through the `action` filter. Reading an unfiltered listing still works, because CurationActionSchema types `action` as z.string(). No migration is needed, as curation_action.action is free text.
- what: Calling recordEditAction from the edit operation, inside the edit's single transaction, with the applied changes in the order given. The route and the service that assemble the edit also belong there.
  why: Assembling the whole edit write, and proving atomicity (constraints/entity-edit-is-atomic), belong to the task that runs the whole edit, not to this recorder.
- what: The recorder does not itself enforce that an edit records exactly one action. It inserts once per call, and the caller must call it once per accepted edit.
  why: The count of calls per edit is decided where the edit is assembled, outside this task.
---
## What it is
A new recorder writes one edit_entity curation action on the edited node, carrying the trimmed reason and the applied changes, and returns the action's identity.

## Notes
Inferred: The curation action's reason is the edit's reason trimmed of surrounding whitespace, not the raw text the owner sent.
Inferred: The recorder takes already-applied changes with item_id and predecessor_id as `string | null` and copies them as given. It does not recompute them from the effect.
Inferred: The payload is passed to insertCurationAction as a plain object, which stores it as jsonb like the other kinds.
Inferred: AppliedChange and EditActionInput are declared as interfaces in the new service file, not as a Zod DTO.
Inferred: The recorder is a suffix-less helper file, entity-edit-action.ts, that takes the caller's PoolClient and opens no transaction of its own.
Departure: CurationActionNameSchema was not edited. edit_entity is not added to the Zod enum the audit listing uses to filter by action.
Deferred: Add "edit_entity" to CurationActionNameSchema in src/modules/compliance-audit/dto/curation-action.dto.ts, so list-curation-actions accepts and matches the kind as a filter. Update src/__tests__/unit/compliance-audit/dto.spec.ts and src/__tests__/integration/compliance-audit/routes.spec.ts to cover it. The comments in that DTO file go with the edit.
Deferred: Calling recordEditAction from the edit operation, inside the edit's single transaction, with the applied changes in the order given. The route and the service that assemble the edit also belong there.
Deferred: The recorder does not itself enforce that an edit records exactly one action. It inserts once per call, and the caller must call it once per accepted edit.
