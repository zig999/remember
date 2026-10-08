---
target: backend
title: Proof for refusing a change made from a stale form
summary: Unit tests over a fake pg client prove that a change naming no live attribute of its key, a value change to an attribute carrying a supersession time, and a second current value on a single-current key are each refused as BUSINESS_ENTITY_EDIT_CONFLICT, naming the key and the attribute, with HTTP 409 and the read rows locked.
implementation: sha256:1992e106829c5e039e297996f27994d2d4436a0047a8874e21be20f722f1680c
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/entity-edit-backend-refuse-stale-change-suite
tests:
- file: src/__tests__/unit/curation/entity-edit-attributes.spec.ts
  name: a change naming an attribute, by what the node holds at that identity > is accepted only for a live attribute of the edited node and key, and refused as a conflict for every other identity
  proves: Criteria 1 to 5 and 11. A change naming a superseded or deleted attribute of its key, an attribute of another key of the edited node, an attribute of another node, or an identity at which none is held is refused with BUSINESS_ENTITY_EDIT_CONFLICT. A live attribute of the edited node and key is not refused by the live-attribute rule.
  fails_when: The liveness check drops any one of its three conditions (the node, the key, or a live status), or an absent identity is accepted instead of refused. Any one of the six outcomes then differs from the expected map.
  demonstrates: rules/knowledge-base/entity-edit-names-a-live-attribute
- file: src/__tests__/unit/curation/entity-edit-attributes.spec.ts
  name: a change naming an attribute, by what the node holds at that identity > is accepted for the active, uncertain and disputed statuses and refused as a conflict for the superseded and deleted statuses
  proves: Criterion 11, and the live statuses as the node declares them. Of the five assertion statuses, a named attribute of the edited node and key is accepted for active, uncertain and disputed and refused as a conflict for superseded and deleted.
  fails_when: The set of statuses treated as live differs from active, uncertain and disputed. For example, uncertain or disputed is refused, or superseded or deleted is accepted.
  demonstrates: domain/knowledge-base/live-assertion-status
- file: src/__tests__/unit/curation/entity-edit-attributes.spec.ts
  name: a change naming an attribute that is no longer live > is refused as a conflict when a set change states another value for the superseded deadline attribute
  proves: Criterion 6. A set change that states a new deadline for an attribute superseded after the form was opened is refused with BUSINESS_ENTITY_EDIT_CONFLICT.
  fails_when: A set change stating a value other than a superseded attribute's own is accepted, or is refused with another code.
- file: src/__tests__/unit/curation/entity-edit-attributes.spec.ts
  name: a change naming an attribute that is no longer live > is refused as a conflict when a set change names a %s attribute and states that attribute's own value (superseded, deleted)
  proves: Criteria 7 and 8. Stating the attribute's own value, character for character, does not exempt a set change that names a superseded or a deleted attribute from the conflict refusal.
  fails_when: A value comparison runs before the liveness check, or exempts an own-value change, so a set change naming a superseded or deleted attribute with its own value is accepted.
- file: src/__tests__/unit/curation/entity-edit-attributes.spec.ts
  name: a remove change naming an attribute > is refused as a conflict when the attribute is superseded
  proves: The live-attribute rule reaches every change that names an attribute, whatever its kind. A remove change naming a superseded attribute is refused with BUSINESS_ENTITY_EDIT_CONFLICT.
  fails_when: The liveness check is applied to set changes only, so a remove change naming a superseded attribute is accepted.
- file: src/__tests__/unit/curation/entity-edit-attributes.spec.ts
  name: a set change naming an attribute that carries a supersession time > is refused as a conflict only when the attribute is active or uncertain and the change states a value other than its own
  proves: Criteria 12 to 15. Over active and uncertain, each with and without a supersession time, stating its own value or another, a set change is refused with BUSINESS_ENTITY_EDIT_CONFLICT only where a supersession time is carried and another value is stated.
  fails_when: The supersession-time rule skips the uncertain status, refuses an own-value change, refuses an attribute that carries no supersession time, or accepts a value change to a timed attribute.
  demonstrates: rules/knowledge-base/entity-edit-changes-no-attribute-with-a-supersession-time
- file: src/__tests__/unit/curation/entity-edit-attributes.spec.ts
  name: a set change naming no attribute > is refused as a conflict only when a single-current key already holds a live attribute of the edited node
  proves: Criteria 16 to 19. Without an item named, a set change is refused with BUSINESS_ENTITY_EDIT_CONFLICT when the key does not allow multiple current values and the edited node holds an active, uncertain or disputed attribute of it. It is accepted when the node holds only superseded or deleted attributes, none, a live attribute only on another node or another key, or when the key allows multiple current values.
  fails_when: The second-current-value check ignores disputed or uncertain attributes, counts superseded or deleted rows, counts another node's or another key's attributes, or applies to a key that allows multiple current values.
  demonstrates: rules/knowledge-base/entity-edit-adds-no-second-current-value
- file: src/__tests__/unit/curation/entity-edit-attributes.spec.ts
  name: a conflict refusal naming the key > for %s names the change's attribute key (three refusal kinds)
  proves: Criterion 9. Each of the three conflict refusals (no live attribute, value change on a timed attribute, second current value) names the change's attribute key.
  fails_when: Any of the three refusals leaves the attribute key out of its message and details.
- file: src/__tests__/unit/curation/entity-edit-attributes.spec.ts
  name: a conflict refusal naming the attribute > for %s names the attribute the change names (live-attribute refusal, supersession-time refusal)
  proves: Criterion 10. A conflict refusal for a change that names an attribute names that attribute, for the live-attribute refusal and for the supersession-time refusal.
  fails_when: A refusal for a change naming an attribute leaves the named item identity out of its message and details.
- file: src/__tests__/unit/curation/entity-edit-attributes.spec.ts
  name: a conflict refusal over REST > for %s is answered HTTP 409 (three refusal kinds)
  proves: 'UNDERDETERMINED entry on contracts/knowledge-base/entity-editing: all three conflict refusals are answered BUSINESS_ENTITY_EDIT_CONFLICT with HTTP 409 over REST.'
  fails_when: Any of the three conflict refusals is raised as an error that maps to a status other than 409, such as the 422 of a business error.
- file: src/__tests__/unit/curation/entity-edit-attributes.spec.ts
  name: the rows a stale-form check reads > are locked when the change names an attribute
  proves: UNDERDETERMINED entry on the concurrent refusal. The attribute a change names is read under a row lock, so a concurrent supersession cannot slip in between the read and the write.
  fails_when: The named attribute is read without a row lock (the SELECT lacks FOR UPDATE), so no lock is recorded on its identity.
- file: src/__tests__/unit/curation/entity-edit-attributes.spec.ts
  name: the rows a stale-form check reads > include the live attributes of the key, locked, when a set change names none
  proves: UNDERDETERMINED entry on the concurrent refusal. When a set change names no attribute, the node's live attributes of the key are read under a row lock.
  fails_when: The live attributes of the key are read without a row lock, so the live row's identity is not among the locked rows.
not_applicable:
- edge_case: Absent or empty input (a set change with no value, a remove change with no item, a null item)
  why: The DTO refuses these before this check is reached, and that is the edit-request-schema task's. This check receives a change already parsed. The tests build their changes through the real AttributeChangeSchema.
- edge_case: A dependency that fails or answers slowly (store unreachable, statement timeout)
  why: No criterion or node of this task states a behavior for it. The contract assigns it to the system-unavailable and internal-error answers of the surrounding service, and this helper neither handles nor translates driver errors.
- edge_case: A duplicate or uniqueness violation
  why: This check writes nothing, so no uniqueness guard of the store can be raised by it. The contract's uniqueness refusal belongs to the write.
- edge_case: Boundaries of a stated range
  why: No criterion or node of this task states a range. The only partitions are the status set, the node and key match, the supersession time present or absent, and the key's multiplicity, and each is covered as a class in the matrix tests.
- edge_case: A value with surrounding whitespace or differing case compared with the attribute's own value
  why: The criteria say only "character for character". Any normalization or its absence is an implementation inference, listed under untested and not pinned.
untested:
- 'scenarios/knowledge-base/edit-of-a-superseded-attribute-is-a-conflict: the refusal half is exercised, but the ''then'' also says nothing of the edit is recorded. That belongs to the transactional edit service and constraints/entity-edit-is-atomic. This helper issues only reads, so a finite test over it would assert part of the fact as the whole. No test claims the node.'
- 'UNDERDETERMINED, from the specification (nothing of the edit is recorded, and no rollback of an earlier valid change when a later change is refused): no test excludes the implementation it names. No edit service exists in the tree to compose changes and roll back, and the note says the matter may belong to the task for constraints/entity-edit-is-atomic. The binder''s pass left no home for it in this task.'
- 'UNDERDETERMINED, from the specification (concurrency refusal ''Another operation changed an attribute the edit names first''): only the lock behavior is tested, as FOR UPDATE reads recorded by the fake. Whether a real database makes a concurrent supersession wait or fail needs a real Postgres with two sessions. The database is shared and untouchable, and no unit over a fake can decide it.'
- 'UNDERDETERMINED, from the specification (order of the checks inside one change, entity-edit-change-check-order): no test excludes the implementation it names. The helper is one check, and the composer that would run it after the key, value-type, allowed-values and validity checks does not exist yet. A test here would pin a guess. The ordering is for the task that implements that rule.'
- 'contracts/knowledge-base/entity-editing: only the three conflict refusals and their 409 status fall to this task. The contract''s accepted answer, route, other refusals and system answers belong to other tasks, so no finite test over this task decides the contract whole. No test claims it.'
- 'domain/knowledge-base/assertion-status: the node''s fact is the declaration of five values. This task''s tests exercise the live subset through the live-assertion-status test, but a behavioral test cannot decide the enumeration''s membership, which the DTO enums hold. Left to a reading.'
- 'domain/knowledge-base/entity-edit, domain/knowledge-base/attribute-change, domain/knowledge-base/attribute-change-kind, domain/knowledge-base/node-attribute and domain/knowledge-base/attribute-key: shape declarations held by the DTO and the schema, not decided by a behavior of this check. The check''s own use of them (the set-only rules, allows_multiple_current) is exercised through the three rule tests, which each name one rule and not these nodes.'
- 'Inference, behavior: the conflict details carry attribute_key always and item_id only when the change names an attribute, and a second-current-value refusal does not name the live attribute it collided with. No node decides it, and the tests assert only that the key and the named item appear.'
- 'Inference, behavior: an attribute''s own value is compared as a strict string match with no trimming or normalization. No node decides it, and the tests use only exactly equal and plainly different values.'
- 'Inference, behavior: a remove change naming an attribute is checked by the live-attribute rule only, so a remove naming a live attribute that carries a supersession time is accepted by this helper. No node decides it, and only the refusal of a remove naming a superseded attribute is tested.'
- 'Inference, behavior: a named row that fails for any reason (absent, another node, another key, not live) is answered with one message that names only the edited node and the stated item. The wording is emitted text and no node fixes it, so it is not pinned.'
- 'Not pinned: a disputed attribute that carries a supersession time and is named by a set change stating another value. The supersession-time rule excludes disputed, and the helper accepts it only because entity-edit-leaves-disputes-to-curation is another task''s. Pinning acceptance would fix a choice that rule will reverse.'
- 'ADVISORY note, a set change naming no attribute on a single-current key whose only attribute is disputed: the test takes the reading the criterion states (BUSINESS_ENTITY_EDIT_CONFLICT). Which answer wins against BUSINESS_ENTITY_EDIT_DISPUTED is not decided by any node.'
- 'ADVISORY note, entity-edit-leaves-disputes-to-curation and entity-edit-unchanged-records-nothing: not implemented by this task, so no test covers them.'
---
## What it is
Unit tests over a fake pg client prove that a change naming no live attribute of its key, a value change to an attribute carrying a supersession time, and a second current value on a single-current key are each refused as BUSINESS_ENTITY_EDIT_CONFLICT, naming the key and the attribute, with HTTP 409 and the read rows locked.

## Notes
None.
