---
target: backend
title: Decide each accepted change's effect
summary: A pure decision function gives every accepted set or remove change of an entity edit the one effect its rules state, from the node's live attributes of the edited key. Nothing is written to the store.
task: sha256:a37fbe4d6c369bbcf0cfac60146fc3940b6c3c822fdcbda17b005ae0e98f784d
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/entity-edit-backend-assign-change-effect-build
files:
- path: src/modules/curation/service/entity-edit-effect.ts
  effect: 'New. decideChangeEffect(attributeKey, change, attributesOfKey) is a pure function. It reads no clock, store or client. It returns removal for a remove change. For a set change it keeps only the attributes with a live status (active, uncertain, disputed) and decides from those. Naming no attribute: first-value when none is live; unchanged when the key allows multiple current values and an active or uncertain attribute holds the stated value character for character; addition otherwise, which includes the case where only a disputed attribute holds the value. Naming an attribute: unchanged when the value equals the named attribute''s own, whatever the stated validity; correction when the named attribute has a validity end and no supersession time, whatever its status and key; for a current attribute (no end, no supersession time), succession when the key is temporal and correction otherwise. It throws InvariantError for states the checks refuse before the decision: a second value for a single-current key, a named attribute that is not live, and a named attribute that carries a supersession time.'
- path: src/modules/curation/dto/edit-entity.dto.ts
  effect: Adds EditEffectSchema, a Zod enum of the six values of the edit-effect enumeration, and the inferred EditEffect type. The existing change schema and body schema are unchanged.
- path: src/modules/curation/service/entity-edit-attributes.ts
  effect: LIVE_STATUSES is now exported so the effect decision reuses the single definition of live statuses. The checks behave as before.
criteria:
- criterion: A set change naming no attribute, to a key of which the node holds no live attribute, gets the effect first-value.
  met: true
  how: effectOfUnnamedSet returns first-value when no attribute with a live status remains after the filter. Superseded and deleted attributes passed in do not count.
- criterion: A set change naming no attribute, whose value no active or uncertain attribute of its key holds, to a key that allows multiple current values of which the node holds a live attribute, gets the effect addition.
  met: true
  how: effectOfUnnamedSet, with a live attribute present and allows_multiple_current set, returns addition when holdsValue finds no active or uncertain attribute with the stated value.
- criterion: A set change naming no attribute, whose value only a disputed attribute of its key holds, to a key that allows multiple current values, gets the effect addition.
  met: true
  how: holdsValue considers only the active and uncertain statuses (VALUE_HOLDING_STATUSES), so a disputed holder does not make the change unchanged and the result is addition.
- criterion: A set change naming a current attribute of a temporal key with another value gets the effect succession.
  met: true
  how: effectOfNamedSet takes the isCurrent branch (no validity end, no supersession time) and returns succession when attributeKey.is_temporal is true.
- criterion: A set change naming a current attribute of a temporal key that allows multiple current values with another value gets the effect succession.
  met: true
  how: The named branch tests only is_temporal and never allows_multiple_current, so a temporal multi-current key gives succession.
- criterion: A set change naming a current attribute of a key that is not temporal with another value gets the effect correction.
  met: true
  how: The isCurrent branch of effectOfNamedSet returns correction when is_temporal is false.
- criterion: A set change naming an active attribute of a temporal key that holds a validity end and no supersession time, with another value, gets the effect correction.
  met: true
  how: effectOfNamedSet tests hasEndWithoutSupersession before the temporality test and returns correction, so this case never reaches succession.
- criterion: A set change whose value is, character for character, the value of the attribute it names gets the effect unchanged.
  met: true
  how: effectOfNamedSet compares the value to the named attribute's value with strict equality as its first test and returns unchanged.
- criterion: A set change naming a current attribute of a key that is not temporal, with a value that differs from that attribute's own only in letter case, gets the effect correction.
  met: true
  how: The comparison is strict string equality with no case folding, so a case-only difference is another value. It falls to the isCurrent branch and returns correction for a non-temporal key.
- criterion: A set change naming an attribute with that attribute's own value and another validity start gets the effect unchanged.
  met: true
  how: The decision never reads valid_from or valid_to of the change, and equal value returns unchanged first.
- criterion: A set change naming no attribute, whose value an active attribute of its key holds, to a key that allows multiple current values, gets the effect unchanged.
  met: true
  how: holdsValue finds an active attribute with the stated value, and effectOfUnnamedSet returns unchanged.
- criterion: A set change naming no attribute, whose value an uncertain attribute of its key holds, to a key that allows multiple current values, gets the effect unchanged.
  met: true
  how: uncertain is in VALUE_HOLDING_STATUSES, so holdsValue matches and the result is unchanged.
- criterion: A remove change gets the effect removal.
  met: true
  how: decideChangeEffect returns removal for kind remove before reading any attribute.
nodes:
- node: domain/knowledge-base/edit-effect
  encoded_at:
  - src/modules/curation/dto/edit-entity.dto.ts
  how: EditEffectSchema holds the six values of the enumeration, and decideChangeEffect returns exactly that type.
- node: domain/knowledge-base/attribute-change
  encoded_at:
  - src/modules/curation/service/entity-edit-effect.ts
  how: The decision reads attribute_key, kind, value and item_id of the existing AttributeChange. valid_from and valid_to deliberately play no part in choosing the effect.
- node: domain/knowledge-base/attribute-change-kind
  encoded_at:
  - src/modules/curation/service/entity-edit-effect.ts
  how: kind remove yields removal and kind set goes to the attribute-driven decision.
- node: domain/knowledge-base/attribute-key
  encoded_at:
  - src/modules/curation/service/entity-edit-effect.ts
  how: is_temporal separates succession from correction for a current named attribute. allows_multiple_current separates addition and unchanged from a refused second value.
- node: domain/knowledge-base/node-attribute
  encoded_at:
  - src/modules/curation/service/entity-edit-effect.ts
  how: The decision reads value, status, valid_to and superseded_at of the held attribute rows (ItemLockedRow).
- node: domain/knowledge-base/assertion-status
  encoded_at:
  - src/modules/curation/service/entity-edit-effect.ts
  how: Status decides which attributes count as live and which can hold a value for the unchanged test. The decision never writes a status.
- node: domain/knowledge-base/live-assertion-status
  encoded_at:
  - src/modules/curation/service/entity-edit-attributes.ts
  - src/modules/curation/service/entity-edit-effect.ts
  how: LIVE_STATUSES (active, uncertain, disputed) is declared once in entity-edit-attributes.ts and reused here to select the attributes the decision considers.
- node: rules/knowledge-base/entity-edit-first-value
  encoded_at:
  - src/modules/curation/service/entity-edit-effect.ts
  how: The effect clause is encoded in effectOfUnnamedSet, which returns first-value when no live attribute exists. The recording clause belongs to the writing act and was not reached.
- node: rules/knowledge-base/entity-edit-addition
  encoded_at:
  - src/modules/curation/service/entity-edit-effect.ts
  how: The effect clause is encoded in effectOfUnnamedSet for a multi-current key with a live attribute and no active or uncertain holder of the value. The recording clause was not reached.
- node: rules/knowledge-base/entity-edit-succession
  encoded_at:
  - src/modules/curation/service/entity-edit-effect.ts
  how: The effect clause is encoded in the isCurrent branch of effectOfNamedSet for a temporal key. The supersede-and-record clause was not reached.
- node: rules/knowledge-base/entity-edit-correction
  encoded_at:
  - src/modules/curation/service/entity-edit-effect.ts
  how: The effect clause is encoded in the isCurrent branch of effectOfNamedSet for a key that is not temporal. The supersede-and-record clause was not reached.
- node: rules/knowledge-base/entity-edit-ended-attribute-correction
  encoded_at:
  - src/modules/curation/service/entity-edit-effect.ts
  how: effectOfNamedSet gives correction to any live named attribute with a validity end and no supersession time and another value. It does not depend on the attribute's status or on the key. This includes an uncertain attribute and a key that is not temporal, the cases the task's UNDERDETERMINED note says the specification refuses to let fall through.
- node: rules/knowledge-base/entity-edit-unchanged-records-nothing
  encoded_at:
  - src/modules/curation/service/entity-edit-effect.ts
  how: The effect clause is encoded in both unchanged paths, the named attribute's own value and, for an unnamed change, an active or uncertain holder on a multi-current key. The records-nothing clause belongs to the writing act and was not reached.
- node: rules/knowledge-base/entity-edit-removal
  encoded_at:
  - src/modules/curation/service/entity-edit-effect.ts
  how: The effect clause is encoded as removal for every remove change. Rejecting the attribute and giving it a supersession time was not reached.
- node: rules/knowledge-base/current-assertion
  encoded_at:
  - src/modules/curation/service/entity-edit-effect.ts
  how: isCurrent is exactly the rule, no validity end and no supersession time. An attribute with an end is not treated as current, which is why it goes to the ended-attribute branch.
- node: rules/knowledge-base/unrecorded-temporality-is-not-temporal
  how: Honored by reading is_temporal from the catalog's AttributeKeyRow, which is boolean. The decision adds no default of its own, and treating an unrecorded temporality as false is the catalog snapshot's concern.
- node: scenarios/knowledge-base/stable-key-edit-is-a-correction
  encoded_at:
  - src/modules/curation/service/entity-edit-effect.ts
  how: A named current attribute of a key that is not temporal, such as an organization's cnpj, with another value gets correction. Superseding it and recording the new attribute was not reached.
- node: scenarios/knowledge-base/emptying-one-email-rejects-only-that-email
  encoded_at:
  - src/modules/curation/service/entity-edit-effect.ts
  how: The remove change gets removal, whichever other attributes of the key are held. Rejecting only the named email was not reached.
inferences:
- inferred: The decision takes the node's attributes of the key as input and keeps only those with a live status. Scoping them to the node and the key is the caller's job. The function is pure and adds no repository query.
  from: The task's objective and notes say the decision is shown working on given attributes without the store. The existing checks load rows with loadItemsForUpdate and loadAttributeIdsOfKeyForUpdate.
- inferred: allows_multiple_current is read from the catalog row's boolean, and no special case is made for the keys named by rules/knowledge-base/multi-current-attribute-keys.
  from: The AttributeKeyRow shape in the ingestion catalog. The ADVISORY note says that node is outside the candidates, and the existing checks already read the field this way.
- inferred: A set change naming no attribute, to a single-current key that already holds a live attribute, throws InvariantError instead of getting an effect. So does a set change naming an attribute that is not live or that carries a supersession time while its value changes.
  from: checkChangeAgainstHeldAttributes in entity-edit-attributes.ts refuses the first two cases (no second current value, not a live attribute of the key) and checkNamedAttribute refuses the third. The specification assigns no effect to them, and this task's criteria cover only changes that passed the checks.
- inferred: A disputed attribute counts as live for the named branches and for first-value and addition, but cannot make an unnamed change unchanged.
  from: domain/knowledge-base/live-assertion-status counts disputed as live. rules/knowledge-base/entity-edit-unchanged-records-nothing limits the unnamed case to active or uncertain. Whether a change naming a disputed attribute reaches this decision is settled by the checks, as the ADVISORY note says.
- inferred: The ended-attribute test is a validity end with no supersession time, whatever the attribute's status and key, and it is applied before the temporality test. A named attribute whose value equals the stated one is unchanged before that test.
  from: rules/knowledge-base/entity-edit-ended-attribute-correction ("whatever its key", live status). The UNDERDETERMINED note says an implementation that narrows it to active status and temporal keys is refused by the specification. rules/knowledge-base/entity-edit-unchanged-records-nothing covers a named attribute with a live status and its own value.
- inferred: EditEffectSchema is placed in the edit-entity DTO beside AttributeChangeKindSchema, and LIVE_STATUSES is exported from entity-edit-attributes.ts, instead of declaring either again.
  from: The existing DTO convention (DTO-02, a Zod enum plus its inferred type, as AttributeChangeKindSchema does) and MNT-03 (call existing logic, do not copy it).
preserved:
- checkChangeAgainstHeldAttributes and its refusals (BUSINESS_ENTITY_EDIT_CONFLICT, BUSINESS_ENTITY_EDIT_DISPUTED) behave as before. Only the export keyword on LIVE_STATUSES changed.
- AttributeChangeSchema and EditEntityBodySchema keep their shape and refinements. Only an enum and its type were added.
- Nothing in the ingestion validators, graph consolidation, the item service, routes, MCP toolsets, error-mapping or the compliance-audit action enum was touched.
- No migration, DDL or store write was added.
deferred:
- what: 'Writing each effect to the store: the new active attribute that names the superseded one, the addition beside the others, recording nothing for unchanged, and rejecting the attribute for removal with the moment of the edit as its supersession time.'
  why: The task's REMAINDER note assigns these clauses to the act that writes each accepted change. No criterion of this task reaches them.
- what: Loading the node's live attributes of the key for the decision, which means combining loadAttributeIdsOfKeyForUpdate with loadItemsForUpdate or adding a repository read.
  why: The decision is delivered pure and the loading belongs with the writing act, which holds the locked transaction. A repository change would widen this task.
---
## What it is
A pure decision function gives every accepted set or remove change of an entity edit the one effect its rules state, from the node's live attributes of the edited key. Nothing is written to the store.

## Notes
Inferred: The decision takes the node's attributes of the key as input and keeps only those with a live status. Scoping them to the node and the key is the caller's job. The function is pure and adds no repository query.
Inferred: allows_multiple_current is read from the catalog row's boolean, and no special case is made for the keys named by rules/knowledge-base/multi-current-attribute-keys.
Inferred: A set change naming no attribute, to a single-current key that already holds a live attribute, throws InvariantError instead of getting an effect. So does a set change naming an attribute that is not live or that carries a supersession time while its value changes.
Inferred: A disputed attribute counts as live for the named branches and for first-value and addition, but cannot make an unnamed change unchanged.
Inferred: The ended-attribute test is a validity end with no supersession time, whatever the attribute's status and key, and it is applied before the temporality test. A named attribute whose value equals the stated one is unchanged before that test.
Inferred: EditEffectSchema is placed in the edit-entity DTO beside AttributeChangeKindSchema, and LIVE_STATUSES is exported from entity-edit-attributes.ts, instead of declaring either again.
Deferred: Writing each effect to the store: the new active attribute that names the superseded one, the addition beside the others, recording nothing for unchanged, and rejecting the attribute for removal with the moment of the edit as its supersession time.
Deferred: Loading the node's live attributes of the key for the decision, which means combining loadAttributeIdsOfKeyForUpdate with loadItemsForUpdate or adding a repository read.
