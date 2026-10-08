---
target: frontend
title: Edit payload builder separated into named decisions, with a form-state-to-body composition
summary: The audit found entity-edit-payload.ts already faithful to every criterion; the delivery splits its decisions into named exported functions and adds buildEntityEditBody, which goes from form state straight to the JSON body.
task: sha256:d1b06761697aa96abd98c2a4a6b048203eeeffc2abf38f2bc71beac57ab13978
standard:
  at: ../standards/frontend-react.yaml
  pin: sha256:2b03615161995450265523de6bdd9c464b2ca633976e832e36586c1ab1aa2cf7
run: run/review-and-save-edit-payload-build
files:
- path: src/features/entities/components/entity-edit-payload.ts
  effect: 'Modified, behavior kept. The what-the-field-states decisions are now small exported pure functions. memberOf maps an empty text to null. changeKindOf takes the kind from the shared changeOfField mapping, with set as the fallback. validityStatedBy returns the field''s validity only for a temporal key, with an empty member as null (an unstated start is null, never today), and null for a stable key. fieldsToSend lists the changed fields followed by the removed baseline fields. changeOf builds a remove change (null value, valid_from and valid_to, the field''s item id) or a set change (the field''s value, the validity it states, the item id it started from, null for none). buildEntityEdit keeps its signature and its output: the trimmed reason, and changes ordered by catalog key position. New export buildEntityEditBody(...) returns toEntityEditWire(buildEntityEdit(...)), the exact { reason, changes } body with six members per change. The item id of any change is now read straight from the field, which is identical to what changeOfField returned in every reachable case, so the former fallback branch is gone.'
criteria:
- criterion: The edit carries one change for each changed field.
  met: true
  how: fieldsToSend in entity-edit-payload.ts takes one entry per field flagged in changed[] (the flags of changedFlags/isFieldChanged, which count a field once) and one per field removedFieldsOf names. The two sets cannot overlap, because removedFieldsOf only returns baseline fields whose item id no held field keeps. buildEntityEdit then maps each entry to exactly one change.
- criterion: An unchanged field contributes no change.
  met: true
  how: Only fields with changed[index] === true enter fieldsToSend. isFieldChanged in entity-field-changed.ts returns false for a value equal to startedWith, whatever validity it holds, and for an added multi-valued field repeating an active or uncertain held value. A field with an unknown key is not changed either, because changedFlags needs the key in the catalog.
- criterion: A changed field holding a non-empty value is sent as a set change.
  met: true
  how: changeKindOf asks changeOfField, which returns set for a succession, correction, first value or addition. Where changeOfField returns null for a changed field (an empty-start field on a single-valued key whose held attributes exist) the kind falls back to set, so the field is still sent. changeOf then builds it with setChangeOf.
- criterion: A set change carries the field's value.
  met: true
  how: 'setChangeOf writes value: memberOf(field.value). A set change only arises from a non-empty value, so the value is the field''s own text. toAttributeChangeWire (api/_transforms.ts) passes it on.'
- criterion: A set change carries the validity the field states.
  met: true
  how: 'setChangeOf spreads validityStatedBy(field, attributeKey): the field''s validFrom and validTo for a temporal key, and null for both on a stable key. That matches a-changed-stable-field-offers-no-validity, which offers no validity there.'
- criterion: A set change carries the identity of the attribute the field started from.
  met: true
  how: 'setChangeOf writes itemId: field.itemId, the id buildFormValues put on the field from the attribute it started from. Every non-null FieldChange.itemId from changeOfField equals field.itemId, so the shared mapping and the payload agree.'
- criterion: A set change of a field that started from no attribute carries no attribute identity.
  met: true
  how: A field that started from no attribute has itemId null (emptyField), and setChangeOf copies null. toAttributeChangeWire writes it as JSON null through memberOrNull.
- criterion: A field the owner emptied after it started with a value is sent as a remove change.
  met: true
  how: An emptied field (itemId non-null, value empty, startedWith non-empty) is changed. changeOfField returns kind remove for it, and changeOf calls removeChangeOf with the field's item id.
- criterion: A field the owner removed after it started with a value is sent as a remove change.
  met: true
  how: 'removedFieldsOf supplies the baseline field, and fieldsToSend marks it removed: true. changeKindOf evaluates it with value '''' and changeOfField returns remove, so removeChangeOf builds the change with the baseline item id.'
- criterion: A remove change carries the identity of the attribute the field started from.
  met: true
  how: 'removeChangeOf writes itemId: field.itemId, taken from the held field or from the baseline field.'
- criterion: A validity start the owner did not state is sent empty.
  met: true
  how: validityStatedBy turns an empty validFrom into null with memberOf. The form never writes today into the field (entity-validity-fields.tsx only displays it, entity-review.tsx substitutes it for display only). toAttributeChangeWire writes it as JSON null.
- criterion: The reason is sent trimmed.
  met: true
  how: 'buildEntityEdit sets reason: trimmedReason(reason) (entity-review-reason.ts, String.trim). toEntityEditWire copies it unchanged.'
- criterion: Each change carries its field's attribute key as attribute_key.
  met: true
  how: 'Both removeChangeOf and setChangeOf write attributeKey: field.attributeKey, and toAttributeChangeWire maps it to attribute_key.'
- criterion: The body is the JSON object { reason, changes }.
  met: true
  how: toEntityEditWire returns { reason, changes }, which entityEdit serialises. buildEntityEditBody now exposes that exact object from form state in one pure call.
- criterion: Each change in the body carries attribute_key, kind, value, item_id, valid_from and valid_to.
  met: true
  how: toAttributeChangeWire always writes the six members, with null for an empty one and null in value, valid_from and valid_to on a remove. buildEntityEditBody returns that wire shape.
nodes:
- node: rules/entity-workspace/save-sends-one-change-per-changed-field
  encoded_at:
  - src/features/entities/components/entity-edit-payload.ts
  how: 'fieldsToSend and changeOf: one change per changed field. A set change carries the value, the stated validity and the item id the field started from. A remove change is sent where the field was emptied or removed after starting with a value.'
- node: rules/entity-workspace/a-change-writes-an-empty-member-as-null
  encoded_at:
  - src/features/entities/components/entity-edit-payload.ts
  - src/features/entities/api/_transforms.ts
  how: memberOf, validityStatedBy and removeChangeOf write null for every empty member and for the value and validity of a remove. toAttributeChangeWire (kept as it was) always emits the six members with JSON null.
- node: rules/entity-workspace/review-requires-a-trimmed-reason
  encoded_at:
  - src/features/entities/components/entity-edit-payload.ts
  how: 'Only the sent-trimmed clause is reached: buildEntityEdit sends trimmedReason(reason). The 1 to 1000 code unit clause belongs to the review-reason task.'
- node: rules/entity-workspace/an-unstated-start-shows-as-today-and-is-sent-empty
  encoded_at:
  - src/features/entities/components/entity-edit-payload.ts
  how: 'The sent-empty clause: validityStatedBy sends an empty validFrom as null. The show-as-today clause is the review and form tasks''. entity-review.tsx and entity-validity-fields.tsx display it without writing it into the field.'
- node: scenarios/entity-workspace/an-unstated-start-is-sent-empty
  encoded_at:
  - src/features/entities/components/entity-edit-payload.ts
  how: A changed temporal field with no validity start becomes a set change whose valid_from is null. buildEntityEditBody returns that body without the timer.
- node: rules/entity-workspace/a-field-is-changed-only-by-its-value
  encoded_at:
  - src/features/entities/components/entity-field-changed.ts
  how: 'The payload honors the rule through the changed flags: fieldsToSend sends a field only when isFieldChanged held, so a validity-only edit contributes nothing. The rule''s own code (isFieldChanged) was not modified.'
- node: rules/entity-workspace/a-field-added-with-a-held-value-is-not-changed
  encoded_at:
  - src/features/entities/components/entity-field-changed.ts
  how: 'Honored the same way: an added multi-valued field repeating an active or uncertain held value is flagged unchanged by isFieldChanged and holdsValue, so fieldsToSend leaves it out. entity-field-changed.ts was not modified.'
- node: contracts/entity-workspace/bff-entity-edit
  encoded_at:
  - src/features/entities/components/entity-edit-payload.ts
  - src/features/entities/api/_transforms.ts
  how: The body is { reason, changes }, each change with attribute_key, kind, value, item_id, valid_from and valid_to. buildEntityEditBody composes the payload builder with toEntityEditWire, so the sent body is the contract's body. The request itself (_edit-request.ts) is untouched.
- node: domain/entity-workspace/entity-edit-session
  encoded_at:
  - src/features/entities/components/entity-edit-payload.ts
  how: The session's reason and fields (the held values, the changed flags and the baseline) are the inputs from which the edit is built at confirm-save. The session's members and the use-entity-edit-form.ts call are unchanged.
- node: domain/entity-workspace/attribute-field
  encoded_at:
  - src/features/entities/components/entity-form-schema.ts
  - src/features/entities/components/entity-edit-payload.ts
  how: The field's shape (attribute_key, item_id, started_with, value, valid_from, valid_to) is declared in entity-form-schema.ts, which was not touched. The payload reads item_id as the attribute the field started from, value as the value to set, and valid_from and valid_to as the validity the field states.
- node: domain/knowledge-base/attribute-change
  encoded_at:
  - src/features/entities/types.ts
  - src/features/entities/api/_transforms.ts
  - src/features/entities/components/entity-edit-payload.ts
  how: The shape of one change (attribute_key, kind, value, item_id, valid_from, valid_to) is declared in types.ts (AttributeChange, AttributeChangeWire), which was not touched. setChangeOf and removeChangeOf produce it, and toAttributeChangeWire writes all six members.
inferences:
- inferred: A changed field for which changeOfField returns null is sent as a set change with the field's itemId. This is unchanged from undo-window and is now an explicit default of changeKindOf. The itemId branch of the old fallback is dropped. A changed field with a non-null itemId always has value different from startedWith, so changeOfField never returns null for it. The item id of a change is therefore read from the field.
  from: rules/entity-workspace/save-sends-one-change-per-changed-field says one change per changed field, and the set change is the kind that carries a value. The case is reachable only for an empty-start field on a single-valued key whose held attributes exist (entity-change-effect.ts names no effect for it). attribute-change and bff-entity-edit allow set with a null item_id.
- inferred: The changes array is ordered by the catalog position of the attribute key, with changed fields before removed fields of the same key, and held-field order within each group. The sort is stable and deterministic. No node states an order.
  from: The ADVISORY note of the task and the order reviewEntriesOf uses, so the edit matches what the owner reviewed.
- inferred: A set change's validity is sent only for a temporal key. A stable key sends null valid_from and valid_to.
  from: rules/entity-workspace/a-changed-stable-field-offers-no-validity and a-changed-temporal-field-offers-its-validity, which say which fields offer validity.
- inferred: entity-edit-payload.ts imports toEntityEditWire from ../api/_transforms for buildEntityEditBody, although the underscore marks that module as private to api/.
  from: features/graph/components/NodeDetailPanel/NodeRelationshipRow.tsx imports from ../../api/_transforms. entities/api has no barrel, and the wire writer must stay in one place so the body is not written twice.
- inferred: buildEntityEditBody has no production caller. useEntityEditForm still builds the EntityEdit and the mutation hook converts it with toEntityEditWire at send time. The export exists so the whole body can be asserted without the timer.
  from: The caller's instruction not to move the send. Calling the body builder in the hook would change where the wire conversion happens.
preserved:
- buildEntityEdit's signature and output (trimmed reason, one change per changed or removed field, catalog order, null members) are unchanged, and use-entity-edit-form.ts still calls it as before.
- use-undoable-save.ts (the 5000 ms timer, the Desfazer undo, the single send, the busy guard, clearReason on accepted) was not touched.
- toEntityEditWire and toAttributeChangeWire in api/_transforms.ts were not touched. types.ts, entity-change-effect.ts, entity-field-changed.ts and entity-review-entries.ts were not touched either, so the review, the removed-field rule and the changed flags are as before.
- backend/, src/lib/http.ts, src/lib/query-client.ts, src/lib/error-routing.ts, package.json and vendor/ are untouched. No dependency added, no forwardRef, no GlassSurface, no sibling-feature import, no header entry or graph button, no comment written.
- The form keeps zodIssueResolver, and the gates on Salvar (reason and validity order) are unchanged.
deferred:
- what: No test covers the payload builder, the wire body or the removed-field extraction.
  why: Writing tests is another judge's role. The exported pure functions (buildEntityEditBody, changeOf, validityStatedBy, fieldsToSend) are the seams a test can use without the timer.
- what: The order of the changes is deterministic but no node states it.
  why: The task records it as ADVISORY. Closing it would extend the specification.
- what: The sonner close button still dismisses the undo notice without undoing (carried from undo-window).
  why: AppToaster configuration is shell code outside this task.
---
## What it is


## Notes
None.
