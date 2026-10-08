---
target: backend
title: Refuse changes to disputed attributes in an entity edit
summary: The held-attribute check of an entity edit now refuses, with BUSINESS_ENTITY_EDIT_DISPUTED, a remove change or a set change stating another value when it names a disputed attribute.
task: sha256:d1f31a9585b4295c29c7df57cf81f5afef6e8eb8a24ddebb6195b5d647a1e4a0
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/entity-edit-backend-refuse-disputed-change-build
files:
- path: src/modules/curation/service/entity-edit-attributes.ts
  effect: checkNamedAttribute now calls assertDisputeLeftToCuration after the live-attribute check and before the supersession-time check. For a named attribute whose status is disputed, a remove change, or a set change stating a value other than the held one by strict string comparison (so case-only differences count), throws a ConflictError (HTTP 409 through the shared table) with code BUSINESS_ENTITY_EDIT_DISPUTED. The details carry attribute_key and item_id, which is the held item's id. A set change stating the held value character for character, and any change naming an active or uncertain attribute, passes this check. The comparison that decided whether a set change states another value is now one helper, statesOtherValueThan, shared with the supersession-time check, so that check behaves as before.
criteria:
- criterion: A set change naming an attribute whose status is disputed and stating a value other than that attribute's own is refused with BUSINESS_ENTITY_EDIT_DISPUTED, in an edit whose request, knowledge node and earlier changes pass their checks, when the change itself passes its form, attribute key, value and validity checks.
  met: true
  how: checkNamedAttribute in src/modules/curation/service/entity-edit-attributes.ts calls assertDisputeLeftToCuration. That function throws disputedOf(...) when held.status is disputed and statesOtherValueThan(held, change) is true. The check sits in checkChangeAgainstHeldAttributes, the last of the per-change checks, so earlier refusals (form, key, value, validity) fire first, and earlier changes of the edit are checked first. The disputed attribute is live, so it passes the live-attribute conflict check and reaches the dispute check.
- criterion: A set change naming an attribute whose status is disputed and stating a value that differs from that attribute's own only in letter case is refused with BUSINESS_ENTITY_EDIT_DISPUTED, in an edit whose request, knowledge node and earlier changes pass their checks, when the change itself passes its form, attribute key, value and validity checks.
  met: true
  how: statesOtherValueThan compares change.value !== held.value with strict string inequality and no case folding or normalisation, so a case-only difference counts as another value and is refused.
- criterion: A set change naming an attribute whose status is disputed and stating, character for character, that attribute's own value is not refused by the dispute rule.
  met: true
  how: For a set change with value === held.value, statesOtherValueThan is false and the change is not a remove, so assertDisputeLeftToCuration throws nothing. What the edit then does with this change is outside this task.
- criterion: A remove change naming an attribute whose status is disputed is refused with BUSINESS_ENTITY_EDIT_DISPUTED, in an edit whose request, knowledge node and earlier changes pass their checks, when the change itself passes its form, attribute key, value and validity checks.
  met: true
  how: assertDisputeLeftToCuration treats change.kind === "remove" as changing the held attribute, so a remove naming a disputed attribute is refused. A remove always names an item (EditEntity DTO), so it always reaches checkNamedAttribute.
- criterion: A disputed refusal names the attribute key.
  met: true
  how: disputedOf puts attribute_key (change.attribute_key) in the error details.
- criterion: A disputed refusal names the item.
  met: true
  how: disputedOf puts item_id (held.id, the id of the named item) in the error details and in the message.
- criterion: A change naming an active attribute is not refused by the dispute rule.
  met: true
  how: assertDisputeLeftToCuration throws only when held.status equals "disputed". An active attribute, and an uncertain one too, passes straight through.
nodes:
- node: rules/knowledge-base/entity-edit-leaves-disputes-to-curation
  encoded_at:
  - src/modules/curation/service/entity-edit-attributes.ts
  how: 'assertDisputeLeftToCuration holds the invariant: a disputed attribute is not changed by an edit. The refusal is raised before any write, inside the held-attribute check.'
- node: contracts/knowledge-base/entity-editing
  encoded_at:
  - src/modules/curation/service/entity-edit-attributes.ts
  how: 'The refusal answers the contract''s entry for the dispute rule: code BUSINESS_ENTITY_EDIT_DISPUTED, naming the attribute key and the item, as a ConflictError. The 409 over REST comes from the existing mapping in src/shared/error-mapping.ts, delivered earlier and unchanged here.'
- node: rules/knowledge-base/entity-edit-unchanged-records-nothing
  encoded_at:
  - src/modules/curation/service/entity-edit-attributes.ts
  how: Only its boundary is honoured. The character-for-character comparison decides whether a set change changes a disputed attribute, and an identical value is not refused by the dispute rule. The unchanged effect itself is not produced here.
- node: rules/knowledge-base/entity-edit-change-check-order
  how: Honoured, with no fact of its own written. The dispute check sits inside checkChangeAgainstHeldAttributes, the last per-change check, after the form, key, value, allowed-value and validity checks that other delivered helpers make earlier.
- node: rules/knowledge-base/entity-edit-check-order
  how: Honoured, with no fact of its own written. The dispute check is a per-change check that runs once the request, node and earlier changes have passed. Ordering the whole edit belongs to the orchestration that calls these helpers.
- node: domain/knowledge-base/entity-edit
  how: Governed the work without a fact reaching the source in its own right. The edit's refusal is raised by a helper the edit runs per change.
- node: domain/knowledge-base/attribute-change
  how: Read through the existing AttributeChange DTO type (kind, value, item_id). No shape was added or changed.
- node: domain/knowledge-base/attribute-change-kind
  how: The remove and set kinds are the existing AttributeChangeKind. The dispute check branches on them without redeclaring them.
- node: domain/knowledge-base/node-attribute
  how: Read through the existing ItemLockedRow (status, value, id) that loadItemsForUpdate returns. No row shape was changed.
- node: domain/knowledge-base/assertion-status
  how: The disputed status is the existing AssertionStatus member, held as DISPUTED_STATUS. The enum itself is unchanged.
- node: domain/knowledge-base/live-assertion-status
  how: Disputed stays inside the existing LIVE_STATUSES list, so a disputed attribute passes the live-attribute check and reaches the dispute check. The list is unchanged.
inferences:
- inferred: The refusal's details are exactly { attribute_key, item_id }, with item_id the id of the held item the change names, and the message is English prose built from those.
  from: The contract says the refusal names the attribute key and the item, and the sibling BUSINESS_ENTITY_EDIT_CONFLICT refusal in the same file carries the same two detail fields.
- inferred: The refusal is a ConflictError from src/modules/curation/service/errors.ts rather than a new error class.
  from: The sibling conflict refusal in the same file and the inventory's convention that business refusals are ConflictError or BusinessError. The HTTP status comes from the error-mapping table, which already registers 409.
- inferred: An unnamed set change on a key with a disputed attribute is not a dispute refusal. It keeps the existing BUSINESS_ENTITY_EDIT_CONFLICT from assertNoSecondCurrentValue.
  from: The dispute rule and every criterion speak of a change naming the disputed attribute, and the contract lists the second-current-value rule under the conflict code.
divergences:
- from: src/modules/curation/service/entity-edit-attributes.ts, the earlier inline comparison in assertSupersessionTimeLeavesValue
  departure: The "set change states a value other than the held one" comparison was moved out of assertSupersessionTimeLeavesValue into the shared statesOtherValueThan helper, so this change touches the supersession-time check's body.
  why: The dispute check needs the same comparison, and copying it would be a duplicate block of logic. The behaviour of the supersession-time check is unchanged.
preserved:
- A change naming an attribute that is not live, or not of the edited key or node, is still refused with BUSINESS_ENTITY_EDIT_CONFLICT.
- A set change that changes the value of an active or uncertain attribute carrying a supersession time is still refused with BUSINESS_ENTITY_EDIT_CONFLICT.
- An unnamed set change on a single-current-value key that already holds a live value is still refused with BUSINESS_ENTITY_EDIT_CONFLICT.
- src/shared/error-mapping.ts, src/modules/curation/service/errors.ts and the edit-entity DTO are untouched.
deferred:
- what: 'Atomicity of a refused edit (constraints/entity-edit-is-atomic): that earlier valid changes of the edit leave nothing written when a later change is refused as disputed.'
  why: The helper only checks and throws before any write, and the transaction and edit orchestration belong to a task that assembles the edit. This task's nodes do not include the constraint.
- what: The effect "unchanged" and recording nothing for a set change that states a disputed attribute's own value.
  why: The task's notes assign it to the task that delivers the unchanged effect. This task only guarantees the dispute rule does not refuse that change.
- what: 'Which refusal answers when a concurrent operation made the named attribute disputed: BUSINESS_ENTITY_EDIT_DISPUTED or BUSINESS_ENTITY_EDIT_CONFLICT.'
  why: The task's advisory note says the specification does not settle it. This helper checks the status it locks and reads, and records no choice beyond that.
- what: src/modules/curation/service/errors.ts carries comments that predate this task, and the file sits outside what this task wrote.
  why: This task did not edit that file. The comment removal belongs to whichever delivery next writes it.
---
## What it is
The held-attribute check of an entity edit now refuses, with BUSINESS_ENTITY_EDIT_DISPUTED, a remove change or a set change stating another value when it names a disputed attribute.

## Notes
Inferred: The refusal's details are exactly { attribute_key, item_id }, with item_id the id of the held item the change names, and the message is English prose built from those.
Inferred: The refusal is a ConflictError from src/modules/curation/service/errors.ts rather than a new error class.
Inferred: An unnamed set change on a key with a disputed attribute is not a dispute refusal. It keeps the existing BUSINESS_ENTITY_EDIT_CONFLICT from assertNoSecondCurrentValue.
Departure: The "set change states a value other than the held one" comparison was moved out of assertSupersessionTimeLeavesValue into the shared statesOtherValueThan helper, so this change touches the supersession-time check's body.
Deferred: Atomicity of a refused edit (constraints/entity-edit-is-atomic): that earlier valid changes of the edit leave nothing written when a later change is refused as disputed.
Deferred: The effect "unchanged" and recording nothing for a set change that states a disputed attribute's own value.
Deferred: Which refusal answers when a concurrent operation made the named attribute disputed: BUSINESS_ENTITY_EDIT_DISPUTED or BUSINESS_ENTITY_EDIT_CONFLICT.
Deferred: src/modules/curation/service/errors.ts carries comments that predate this task, and the file sits outside what this task wrote.
