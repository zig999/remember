---
target: backend
title: Proof for refusing disputed attribute changes in an entity edit
summary: Unit tests over a fake pg client show that the held-attribute check refuses BUSINESS_ENTITY_EDIT_DISPUTED for a remove or a set stating another value on a disputed attribute, and does not refuse the other cases. Nothing was run.
implementation: sha256:7bf72a9e06f82a9f78db6224f7baf210734fec17f397dcde219c2a582fdb08f8
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/entity-edit-backend-refuse-disputed-change-suite
tests:
- file: src/__tests__/unit/curation/entity-edit-attributes-disputed.spec.ts
  name: a set change naming a disputed attribute is refused as disputed when it states a value other than the attribute's own
  proves: 'Criterion 1: a set change naming a disputed attribute and stating a value other than its own is refused with BUSINESS_ENTITY_EDIT_DISPUTED.'
  fails_when: A set change with another value on a disputed attribute is accepted, or is refused with a code other than BUSINESS_ENTITY_EDIT_DISPUTED, for example the stale-form conflict code.
- file: src/__tests__/unit/curation/entity-edit-attributes-disputed.spec.ts
  name: a set change naming a disputed attribute is refused as disputed when it states a value differing from the attribute's own only in letter case
  proves: 'Criterion 2: a case-only difference counts as another value, so the change is refused with BUSINESS_ENTITY_EDIT_DISPUTED.'
  fails_when: The comparison folds case or normalises the value, so 'alpha team' against the held 'Alpha Team' is treated as the same value and accepted.
- file: src/__tests__/unit/curation/entity-edit-attributes-disputed.spec.ts
  name: a set change naming a disputed attribute is not refused as disputed when it states the attribute's own value character for character
  proves: 'Criterion 3: a set change stating the disputed attribute''s own value, character for character, is not refused by the dispute rule. The held-attribute check completes with no refusal and issues no statement other than reads.'
  fails_when: The dispute check refuses every set change on a disputed attribute, including one stating its own value. It also fails if the check tries a write, because the fake client rejects any statement that is not a node_attribute SELECT. That would be the implementation recording a succession for an unchanged value.
- file: src/__tests__/unit/curation/entity-edit-attributes-disputed.spec.ts
  name: a remove change naming a disputed attribute is refused as disputed
  proves: 'Criterion 4: a remove change naming a disputed attribute is refused with BUSINESS_ENTITY_EDIT_DISPUTED.'
  fails_when: A remove on a disputed attribute is accepted, or is refused with another code. Examples are treating remove as unchanged because it states no value, or answering the stale-form conflict.
- file: src/__tests__/unit/curation/entity-edit-attributes-disputed.spec.ts
  name: a disputed refusal names the attribute key of the change
  proves: 'Criterion 5: the disputed refusal names the attribute key, in its message or its details.'
  fails_when: The refusal's message and details carry no mention of the change's attribute key.
- file: src/__tests__/unit/curation/entity-edit-attributes-disputed.spec.ts
  name: a disputed refusal names the disputed item
  proves: 'Criterion 6: the disputed refusal names the item, the identity of the disputed attribute the change names.'
  fails_when: The refusal's message and details carry no mention of the disputed attribute's identity.
- file: src/__tests__/unit/curation/entity-edit-attributes-disputed.spec.ts
  name: a disputed refusal is answered HTTP 409 over REST with the disputed code
  proves: 'UNDERDETERMINED note 2: contracts/knowledge-base/entity-editing answers the dispute rule with BUSINESS_ENTITY_EDIT_DISPUTED and HTTP 409 over REST. The test maps the refusal through the REST error mapping and asserts status 409 and that code.'
  fails_when: The refusal is a BusinessError, which maps to 422, or any error class that maps to a status other than 409. It also fails if the code reaching the envelope is not BUSINESS_ENTITY_EDIT_DISPUTED.
- file: src/__tests__/unit/curation/entity-edit-attributes-disputed.spec.ts
  name: a change naming a live attribute that is not disputed is not refused as disputed when it sets another value on an active attribute
  proves: 'Criterion 7: a set change naming an active attribute is not refused by the dispute rule. This is the it.each case for ''active''.'
  fails_when: The dispute rule refuses a set change with another value on an active attribute.
- file: src/__tests__/unit/curation/entity-edit-attributes-disputed.spec.ts
  name: a change naming a live attribute that is not disputed is not refused as disputed when it sets another value on an uncertain attribute
  proves: 'UNDERDETERMINED note 1: an uncertain attribute is live but not disputed, so a set change naming it is not refused as disputed. This is the it.each case for ''uncertain''.'
  fails_when: The implementation refuses any named attribute whose status is not active, so that uncertain is treated like disputed. The check must refuse only a status of disputed.
- file: src/__tests__/unit/curation/entity-edit-attributes-disputed.spec.ts
  name: a change naming a live attribute that is not disputed is not refused as disputed when it removes an active attribute
  proves: 'Criterion 7 for the remove kind: a remove change naming an active attribute is not refused by the dispute rule. This is the it.each case for ''active''.'
  fails_when: The dispute rule refuses a remove change on an active attribute, for example by refusing every remove regardless of status.
- file: src/__tests__/unit/curation/entity-edit-attributes-disputed.spec.ts
  name: a change naming a live attribute that is not disputed is not refused as disputed when it removes an uncertain attribute
  proves: 'UNDERDETERMINED note 1 for the remove kind: an uncertain attribute is not disputed, so a remove naming it is not refused as disputed. This is the it.each case for ''uncertain''.'
  fails_when: The implementation refuses a remove on any named attribute that is not active, so that it also refuses uncertain.
not_applicable:
- edge_case: 'Absent or empty input: a change naming no item, or a change with no value or an empty value'
  why: The change's form, key and value checks belong to the other refusal tasks and run before the dispute check (entity-edit-change-check-order). The remove DTO always names an item. The dispute rule starts only from a named attribute, and no criterion of this task reaches an empty input.
- edge_case: A boundary at each end of a stated range
  why: The dispute rule states no numeric or date range. Its only boundary is character-for-character value equality, and tests 2 and 3 cover both sides of it.
- edge_case: A named attribute that is not a live attribute of the edited node and key, such as a superseded or deleted one, one on another key or node, or an unknown identity
  why: That is the stale-form conflict, decided by the earlier task and already covered by the existing entity-edit-attributes.spec.ts. This task's criteria cover only a disputed attribute that passes the live check.
- edge_case: A duplicate or repeated named attribute across the changes of one edit
  why: The rule and the criteria speak of one change checked against held rows. Checking changes in order belongs to the edit orchestration task.
- edge_case: A dependency that fails or answers slowly, such as the store being unreachable
  why: The task criteria state no store-failure behavior for this check. The unavailable-store answer belongs to the contract's SYSTEM_SERVICE_UNAVAILABLE entry and the error mapping, outside this task.
- edge_case: Two operations against one subject at once, such as a concurrent operation that made the attribute disputed
  why: Recorded as an ADVISORY in the task's Notes. No node says whether BUSINESS_ENTITY_EDIT_DISPUTED or BUSINESS_ENTITY_EDIT_CONFLICT answers, and a real concurrent race needs a real database. This is a hard constraint of this run, so it appears under untested.
untested:
- 'rules/knowledge-base/entity-edit-leaves-disputes-to-curation, whole fact (an entity edit MUST NOT change a disputed attribute): the held-attribute check is only one piece of the edit. The edit orchestration that applies changes is delivered by another task. A test over this helper would assert part of the fact as the whole, so no demonstrates is claimed. The refusal tests above are evidence for this task''s criteria.'
- 'contracts/knowledge-base/entity-editing, whole contract: it holds about twenty refusals plus the accepted answer. This task delivers one of them, and only the 409 status and the code of the dispute entry are tested above, under note 2. No finite test of this task decides the whole contract.'
- 'rules/knowledge-base/entity-edit-unchanged-records-nothing: the task names it only for the character-for-character boundary, which tests 2 and 3 exercise. The unchanged effect and recording nothing are delivered by another task.'
- 'rules/knowledge-base/entity-edit-change-check-order and rules/knowledge-base/entity-edit-check-order: ordering the checks of a whole change or edit is decided by the orchestration across the other refusal tasks. This task''s helper is the last stage of one change and orders nothing against the earlier checks.'
- 'domain/knowledge-base/entity-edit, attribute-change, attribute-change-kind, node-attribute, assertion-status, live-assertion-status: these nodes declare shapes and enumerations the source reads through existing types. No finite behavioral test of this task decides them, and a test would pin the types'' arrangement.'
- 'UNDERDETERMINED note 3 (a set change stating a disputed attribute''s own value, later recorded as a succession): the effect of that change belongs to the task delivering the unchanged effect. Inside this unit only the absence of a refusal and of any write is observable, and test 3 covers that. The note''s remainder says the Notes assign the effect elsewhere, so no test of this task excludes the implementation it names.'
- 'UNDERDETERMINED note 4 (atomicity of a refused edit, constraints/entity-edit-is-atomic): the helper only checks and throws before any write. Writing earlier changes and then refusing a later one happens in the transaction of the edit orchestration, not in this unit. A test would need that orchestration and a real database, so no test of this task excludes it.'
- 'Inference about behavior: an unnamed set change on a key holding a disputed attribute is not a dispute refusal and keeps BUSINESS_ENTITY_EDIT_CONFLICT from the second-current-value check. No node or criterion decides it, so it is not pinned. The existing spec already asserts the conflict for a single-current key whose only attribute is disputed, as an incidental part of an earlier task.'
- 'Inference about behavior: the exact shape of the refusal''s details ({ attribute_key, item_id }) and its English message. The tests assert only that the key and the item identity appear in the refusal, which is what criteria 5 and 6 state.'
- 'Inference about arrangement: a ConflictError rather than a new class, and the statesOtherValueThan helper. Neither is pinned, apart from the 409 status the contract requires (note 2).'
- 'The concurrent-operation case (the named attribute was made disputed by another operation first, so DISPUTED or CONFLICT): the ADVISORY note says no node decides it, and it needs a real database.'
- Any behavior only a real database could decide, such as the SELECT ... FOR UPDATE locking or the shape of the SQL. Every test here uses an in-memory fake client, because the shared Neon database must not be touched.
divergences:
- cites: TST-04
  file: src/__tests__/unit/curation/entity-edit-attributes-disputed.spec.ts
  departure: The file mirrors the unit's directory under src/__tests__/unit/curation/ but not its file name. The unit is entity-edit-attributes.ts and this file is entity-edit-attributes-disputed.spec.ts, sitting beside the existing entity-edit-attributes.spec.ts.
  why: The earlier spec for the same unit already holds the mirrored name, and this delegation forbids editing it. A second spec for the dispute rule needs another file name.
- cites: MNT-03
  file: src/__tests__/unit/curation/entity-edit-attributes-disputed.spec.ts
  departure: A reduced copy of the fake pg client and the attribute-row builder from entity-edit-attributes.spec.ts (a node_attribute SELECT-only client matched on WHERE id = ANY) is written here instead of imported.
  why: The existing spec does not export its helpers, and sharing them would mean editing that file, which is not allowed. The copy is cut to the one read this task's check performs.
---
## What it is
Unit tests over a fake pg client show that the held-attribute check refuses BUSINESS_ENTITY_EDIT_DISPUTED for a remove or a set stating another value on a disputed attribute, and does not refuse the other cases. Nothing was run.

## Notes
None.
