---
target: backend
title: Refuse a change made from a stale form
summary: A per-change check, written against the edited node's held attributes, refuses a change that names no live attribute of its key, or one that sets a value on a supersession-time attribute, or one that adds a second current value to a single-current key, all as BUSINESS_ENTITY_EDIT_CONFLICT.
task: sha256:8507520f03c343ca93926e91591c496545b09a033e773aaab2310eedd5c854e4
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/entity-edit-backend-refuse-stale-change-build
files:
- path: src/modules/curation/service/entity-edit-attributes.ts
  effect: Adds checkChangeAgainstHeldAttributes(client, { node, attributeKey }, change), the last check inside one change. A change naming an attribute loads that row FOR UPDATE and answers BUSINESS_ENTITY_EDIT_CONFLICT (409, attribute_key and item_id in the details) unless the row belongs to the edited node, to the change's key, and holds a live status (active, uncertain or disputed). A set change that names an active or uncertain attribute carrying a supersession time and states any value other than the attribute's own is refused with the same code. A set change naming no attribute, to a key that does not allow multiple current values, is refused with the same code (attribute_key only) when the node holds a live attribute of that key. Nothing else is refused here.
- path: src/modules/curation/repository/curation.repository.ts
  effect: Adds loadAttributeIdsOfKeyForUpdate(client, { nodeId, attributeKeyId, statuses }), a parameterized SELECT ... FOR UPDATE returning the ids of a node's attributes of one key whose status is in the given set. Nothing existing is changed.
criteria:
- criterion: A change naming an attribute of its key whose status is superseded is refused with BUSINESS_ENTITY_EDIT_CONFLICT.
  met: true
  how: checkNamedAttribute loads the row and isLiveAttributeOf tests its status against LIVE_STATUSES (active, uncertain, disputed); superseded fails and conflictOf is thrown, in src/modules/curation/service/entity-edit-attributes.ts.
- criterion: A change naming an attribute of its key whose status is deleted is refused with BUSINESS_ENTITY_EDIT_CONFLICT.
  met: true
  how: Same path as superseded; deleted is not in LIVE_STATUSES, so isLiveAttributeOf is false and the conflict is thrown.
- criterion: A change naming an attribute of another key of the edited node is refused with BUSINESS_ENTITY_EDIT_CONFLICT.
  met: true
  how: isLiveAttributeOf compares the held row's attribute_key_id with the edited key's id, and a mismatch throws the conflict.
- criterion: A change naming an attribute of another node is refused with BUSINESS_ENTITY_EDIT_CONFLICT.
  met: true
  how: isLiveAttributeOf compares the held row's node_id with the edited node's id, and a mismatch throws the conflict.
- criterion: A change naming an identity at which no attribute is held is refused with BUSINESS_ENTITY_EDIT_CONFLICT.
  met: true
  how: loadItemsForUpdate returns no row, so held is undefined and checkNamedAttribute throws the conflict.
- criterion: A set change naming a project's deadline attribute that was superseded once the owner had opened the form is refused with BUSINESS_ENTITY_EDIT_CONFLICT.
  met: true
  how: The superseded attribute's stored status is superseded, so the live-attribute check refuses it whatever key it belongs to.
- criterion: A set change naming a superseded attribute and stating, character for character, that attribute's own value is refused with BUSINESS_ENTITY_EDIT_CONFLICT.
  met: true
  how: The liveness check runs before any comparison of values, so stating the attribute's own value does not exempt it.
- criterion: A set change naming a deleted attribute and stating, character for character, that attribute's own value is refused with BUSINESS_ENTITY_EDIT_CONFLICT.
  met: true
  how: Same as the superseded case; a deleted status fails the liveness check regardless of the stated value.
- criterion: A conflict refusal names the change's attribute key.
  met: true
  how: conflictOf puts attribute_key, from change.attribute_key, in the details of every conflict this file throws.
- criterion: A conflict refusal for a change that names an attribute names that attribute.
  met: true
  how: conflictOf adds item_id, from change.item_id, to the details when the change names an attribute. The message of the named-attribute refusals also carries the item id.
- criterion: A change naming an uncertain attribute of its key on the edited node is not refused by the live-attribute rule.
  met: true
  how: uncertain is in LIVE_STATUSES, so isLiveAttributeOf is true for such a row and checkNamedAttribute throws nothing.
- criterion: A set change naming an active attribute that carries a supersession time and stating a value other than that attribute's own is refused with BUSINESS_ENTITY_EDIT_CONFLICT.
  met: true
  how: assertSupersessionTimeLeavesValue finds superseded_at not null, status active, kind set and value different from the held value (strict string inequality), and throws the conflict.
- criterion: A set change naming an uncertain attribute that carries a supersession time and stating a value other than that attribute's own is refused with BUSINESS_ENTITY_EDIT_CONFLICT.
  met: true
  how: SUPERSESSION_TIME_STATUSES holds active and uncertain, so the same check refuses it.
- criterion: A set change naming an active attribute that carries a supersession time and stating, character for character, that attribute's own value is not refused by the supersession-time conflict rule.
  met: true
  how: statesOtherValue is false when change.value === held.value, so assertSupersessionTimeLeavesValue does not throw and the change goes on to the later rules.
- criterion: A set change naming an active attribute that carries no supersession time and stating another value is not refused by the supersession-time conflict rule.
  met: true
  how: carriesSupersessionTime is false when superseded_at is null, so assertSupersessionTimeLeavesValue does not throw.
- criterion: A set change naming no attribute, to a key that does not allow multiple current values while the node holds an active attribute of that key, is refused with BUSINESS_ENTITY_EDIT_CONFLICT.
  met: true
  how: assertNoSecondCurrentValue finds that allows_multiple_current is false, locks and loads the node's live attributes of the key through loadAttributeIdsOfKeyForUpdate, finds at least one, and throws the conflict.
- criterion: A set change naming no attribute, to a key that does not allow multiple current values while the node's only attribute of that key is disputed, is refused with BUSINESS_ENTITY_EDIT_CONFLICT.
  met: true
  how: LIVE_STATUSES includes disputed, so the disputed row is returned by the query and the conflict is thrown. This is the reading the task's advisory note asks for.
- criterion: A set change naming no attribute, to a key that does not allow multiple current values while every attribute the node holds of that key is superseded or deleted, is not refused by the second-current-value rule.
  met: true
  how: The query filters on LIVE_STATUSES, so superseded and deleted rows are not returned and liveIds is empty; nothing is thrown.
- criterion: A set change naming no attribute, to a key that allows multiple current values while the node holds an active attribute of that key, is not refused by the second-current-value rule.
  met: true
  how: assertNoSecondCurrentValue returns at once when attributeKey.allows_multiple_current is true, before any query runs.
nodes:
- node: rules/knowledge-base/entity-edit-names-a-live-attribute
  encoded_at:
  - src/modules/curation/service/entity-edit-attributes.ts
  how: checkNamedAttribute and isLiveAttributeOf require the named row to belong to the edited node and key and to hold one of the three live statuses, and conflictOf refuses it otherwise.
- node: rules/knowledge-base/entity-edit-changes-no-attribute-with-a-supersession-time
  encoded_at:
  - src/modules/curation/service/entity-edit-attributes.ts
  how: assertSupersessionTimeLeavesValue refuses a set change that states a value other than the attribute's own when an active or uncertain attribute carries superseded_at. Disputed attributes, own-value changes and attributes with no superseded_at are left to the rules that cover them.
- node: rules/knowledge-base/entity-edit-adds-no-second-current-value
  encoded_at:
  - src/modules/curation/service/entity-edit-attributes.ts
  - src/modules/curation/repository/curation.repository.ts
  how: assertNoSecondCurrentValue refuses a set change that names no attribute, on a key that does not allow multiple current values, when loadAttributeIdsOfKeyForUpdate finds a live attribute of that key on the node.
- node: scenarios/knowledge-base/edit-of-a-superseded-attribute-is-a-conflict
  encoded_at:
  - src/modules/curation/service/entity-edit-attributes.ts
  how: The set change naming the superseded deadline attribute is refused with BUSINESS_ENTITY_EDIT_CONFLICT by checkNamedAttribute. "Nothing of the edit is recorded" belongs to the transactional edit service and is not written here. The helper writes nothing and throws before any mutation.
- node: contracts/knowledge-base/entity-editing
  encoded_at:
  - src/modules/curation/service/entity-edit-attributes.ts
  how: The three conflict refusals answer BUSINESS_ENTITY_EDIT_CONFLICT naming the attribute key and, where the change has one, the item. The thrown ConflictError carries statusCode 409, and the mapping already delivered in src/shared/error-mapping.ts also holds 409. The route and the accepted answer are not part of this task.
- node: domain/knowledge-base/entity-edit
  how: The edit's shape is held by the DTO delivered earlier. This task only checks, one change at a time, against the node's held attributes, and does not reach the edit as a whole.
- node: domain/knowledge-base/attribute-change
  how: Reads the change's attribute_key, kind, value and item_id as the DTO declares them. It declares no shape of its own and adds a type predicate NamingChange only to narrow item_id.
- node: domain/knowledge-base/attribute-change-kind
  encoded_at:
  - src/modules/curation/service/entity-edit-attributes.ts
  how: The supersession-time rule and the second-current-value rule apply to kind set only. The live-attribute rule applies to every change that names an attribute.
- node: domain/knowledge-base/node-attribute
  how: Reads node_id, attribute_key_id, value, status and superseded_at of the row through the existing loadItemsForUpdate and the new filtered loader. The shape stays declared by the schema and migrations.
- node: domain/knowledge-base/attribute-key
  how: Reads the catalog row's id, key and allows_multiple_current, which decides whether a second current value is refused.
- node: domain/knowledge-base/assertion-status
  encoded_at:
  - src/modules/curation/service/entity-edit-attributes.ts
  how: The five statuses are the AssertionStatus values already in the DTO enums. The helper tells live from not live and, within live, tells which statuses can carry a supersession-time refusal (active and uncertain).
- node: domain/knowledge-base/live-assertion-status
  encoded_at:
  - src/modules/curation/service/entity-edit-attributes.ts
  how: The LIVE_STATUSES constant (active, uncertain, disputed) is this node's value set, and it drives both the named-attribute liveness check and the second-current-value query.
inferences:
- inferred: The conflict details carry attribute_key always and item_id only when the change names an attribute. A second-current-value refusal, which names none, carries attribute_key alone and does not name the live attribute it collided with.
  from: contracts/knowledge-base/entity-editing, "naming the attribute key and, where it has one, the item", read as the change's own item.
- inferred: checkChangeAgainstHeldAttributes receives its node and key as one object, { node, attributeKey } (EditedKey), and a client, and leaves the order among checks and the lookup of the node and key to the caller. The node is the one loadActiveNodeForEdit returns and the key the one resolveAttributeKey returns.
  from: The earlier helpers in src/modules/curation/service (entity-edit-node.ts, attribute-change-catalog.ts), the rule entity-edit-change-check-order that puts this check last, and the standard's rule MNT-01 limiting positional parameters to three.
- inferred: An attribute's own value is compared as a strict string match between change.value and the row's stored value, with no normalization or trimming.
  from: The criteria's wording "character for character" and node_attribute.value being text.
- inferred: A named row is refused for every way it can fail (absent, another node, another key, not live) with one message that names only the edited node and the stated item, so a refusal does not describe another node's row.
  from: The contract gives one answer for the rule, and the criteria ask only for the code, the key and the attribute.
- inferred: A remove change that names an attribute is checked by the live-attribute rule only. The supersession-time rule and the second-current-value rule do not apply to it, and a remove change with no item is left to the DTO, which refuses it.
  from: The statements of the three rules (the supersession-time rule says "set change", and the second-current rule says "set change that names no attribute") and the superRefine in edit-entity.dto.ts.
divergences:
- from: 'The task note on entity-edit-change-check-order (UNDERDETERMINED, from the specification): the order among checks inside one change.'
  departure: The helper is one check and does not itself run after the key, value-type, allowed-values and validity checks. It cannot enforce that order alone.
  why: The order belongs to whichever service composes the checks. No edit service exists in the tree yet, and this task's objective is only the stale-form refusals.
preserved:
- checkChangeValidity and checkChangeAgainstCatalog in src/modules/curation/service, untouched.
- loadItemsForUpdate, loadNodesForUpdate, correct_item, confirm_item, reject_item and the dispute services of the curation repository, untouched; the new loader is added beside them and nothing existing is edited.
- The REST routes, the MCP toolset whitelist and its count assertions, the compliance-audit action enum, and src/shared/error-mapping.ts were not touched.
- No migration, no DDL and no seed were written.
deferred:
- what: Atomicity of an edit ("nothing of the edit is recorded"), and rolling back earlier writes when a later change is refused.
  why: Belongs to the task for the transactional edit service and to constraints/entity-edit-is-atomic. This helper writes nothing, so a refusal from it leaves the store untouched.
- what: The concurrency refusal ("Another operation changed an attribute the edit names first") beyond the row locks the helper takes.
  why: The named row and the key's live rows are read FOR UPDATE inside the caller's transaction, which is as far as this task reaches. The node lock and the ordering with ingestion consolidation are the edit service's.
- what: Ordering of this check after the key, value-type, allowed-values and validity checks, and of the disputed-attribute refusal (BUSINESS_ENTITY_EDIT_DISPUTED) relative to this one.
  why: entity-edit-change-check-order and entity-edit-leaves-disputes-to-curation sit with the task that composes the per-change checks and are not implemented here. This helper deliberately does not refuse a disputed named attribute, and a disputed attribute makes a no-attribute set change on a single-current key a conflict, as the task's advisory note asks.
- what: The rule that a set change stating a live attribute's own value records nothing (entity-edit-unchanged-records-nothing).
  why: Another task's rule; this helper only lets an own-value change pass the supersession-time rule.
---
## What it is
A per-change check, written against the edited node's held attributes, refuses a change that names no live attribute of its key, or one that sets a value on a supersession-time attribute, or one that adds a second current value to a single-current key, all as BUSINESS_ENTITY_EDIT_CONFLICT.

## Notes
Inferred: The conflict details carry attribute_key always and item_id only when the change names an attribute. A second-current-value refusal, which names none, carries attribute_key alone and does not name the live attribute it collided with.
Inferred: checkChangeAgainstHeldAttributes receives its node and key as one object, { node, attributeKey } (EditedKey), and a client, and leaves the order among checks and the lookup of the node and key to the caller. The node is the one loadActiveNodeForEdit returns and the key the one resolveAttributeKey returns.
Inferred: An attribute's own value is compared as a strict string match between change.value and the row's stored value, with no normalization or trimming.
Inferred: A named row is refused for every way it can fail (absent, another node, another key, not live) with one message that names only the edited node and the stated item, so a refusal does not describe another node's row.
Inferred: A remove change that names an attribute is checked by the live-attribute rule only. The supersession-time rule and the second-current-value rule do not apply to it, and a remove change with no item is left to the DTO, which refuses it.
Departure: The helper is one check and does not itself run after the key, value-type, allowed-values and validity checks. It cannot enforce that order alone.
Deferred: Atomicity of an edit ("nothing of the edit is recorded"), and rolling back earlier writes when a later change is refused.
Deferred: The concurrency refusal ("Another operation changed an attribute the edit names first") beyond the row locks the helper takes.
Deferred: Ordering of this check after the key, value-type, allowed-values and validity checks, and of the disputed-attribute refusal (BUSINESS_ENTITY_EDIT_DISPUTED) relative to this one.
Deferred: The rule that a set change stating a live attribute's own value records nothing (entity-edit-unchanged-records-nothing).
