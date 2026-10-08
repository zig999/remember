---
target: backend
title: Proof for reading and filtering edit_entity curation actions on the audit surface
summary: Tests show the audit action filter admits all eight curation action kinds in underscore spelling and refuses their hyphen spellings. The audit listing returns and filters edit_entity actions, and reading one edit_entity action answers 200.
implementation: sha256:6e1a48930d065f3c3327069bf5f906c66c17210ab2ffcf9d253652c8dc90ca4e
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/entity-edit-backend-read-edit-entity-actions-suite
tests:
- file: src/__tests__/unit/compliance-audit/curation-action.dto.spec.ts
  name: admits $written as the action filter
  proves: The audit listing's action filter admits each of the eight kinds of curation-action-kind written with each hyphen as an underscore. The case for edit_entity also covers 'The audit listing's action filter admits edit_entity.'
  fails_when: The action filter stops admitting any one of the eight underscore spellings, so that kind is refused or parsed to a different value. This includes edit_entity falling out of the closed set again.
  demonstrates: domain/knowledge-base/curation-action-kind
- file: src/__tests__/unit/compliance-audit/curation-action.dto.spec.ts
  name: refuses the hyphen spelling $enumerated as the action filter
  proves: UNDERDETERMINED note 1 and the underscore-only half of the spelling rule. The action filter is a closed set, so no hyphen spelling of any of the eight kinds is accepted.
  fails_when: The filter accepts the hyphen spelling of a kind, either directly or by normalising hyphens to underscores. It would then admit text outside the closed set.
- file: src/__tests__/integration/compliance-audit/edit-entity-actions.routes.spec.ts
  name: returns an edit_entity curation action held in the store
  proves: An audit listing over a store holding a curation action recorded with kind edit_entity returns that action.
  fails_when: The listing omits, drops or errors on a stored row whose action is edit_entity, for example if a closed-set check were applied to stored rows.
- file: src/__tests__/integration/compliance-audit/edit-entity-actions.routes.spec.ts
  name: returns only edit_entity actions when filtered by action=edit_entity
  proves: Filtering the audit listing by edit_entity returns no action of another kind. The filter value is also admitted over the route, answering 200.
  fails_when: The filter ignores the action value, matches loosely, or the route refuses edit_entity. The page or the total would then include merge_nodes or compliance_delete rows, or the request would not answer 200.
- file: src/__tests__/integration/compliance-audit/edit-entity-actions.routes.spec.ts
  name: answers 422 VALIDATION_INVALID_FORMAT for action=edit-entity
  proves: UNDERDETERMINED note 1. list-curation-actions refuses an action outside its closed set, including the hyphen spelling edit-entity, with HTTP 422 VALIDATION_INVALID_FORMAT.
  fails_when: The route answers 200, with an empty or filtered page, for the hyphen spelling edit-entity. It would also fail if the refusal changed status or error code.
- file: src/__tests__/integration/compliance-audit/edit-entity-actions.routes.spec.ts
  name: answers 200 carrying the edit_entity action and its recorded fields
  proves: UNDERDETERMINED note 2. read-curation-action answers HTTP 200 with the curation action, including its action, for an edit_entity action held.
  fails_when: The read path rejects or errors on an edit_entity row, because its validation or mapping knows only the earlier kinds. It would also fail if the answer lost or altered the recorded identity, target, payload, reason or timestamp.
not_applicable:
- edge_case: Absent filter, empty store, or a page past the end of the listing
  why: No criterion or bound node changes behavior for these in this task. The task only admits a new value in the action filter. Page bounds and ordering belong to the existing listing behavior and its existing specs.
- edge_case: Filter combined with target_kind, target_id or a creation-time window
  why: The task changes only the action member of the filter. The other members are untouched, and the contract's existing refusals for them are not criteria here.
- edge_case: Two concurrent listings or reads of the same action
  why: The paths are read-only and carry no ordering or locking behavior any obligation states.
- edge_case: A dependency that fails or answers slowly on the audit read
  why: No criterion or bound node states behavior for it in this task. The task changes no repository code.
- edge_case: Read of an unknown or malformed curation action identity
  why: This is existing behavior covered by the existing routes spec. The task changes nothing about it.
untested:
- 'domain/knowledge-base/curation-action: its fact is an aggregate declaring attributes and an audit-trail responsibility. No finite test decides it whole. The read-path test covers only the fields a read returns, not the aggregate.'
- 'domain/knowledge-base/curation-action-filter: its fact spans action, target_kind, target_id, created_from, created_to and page. This task changes only the action member, and the other members belong to existing behavior. A test of the action member alone would be partial, so no demonstrates is claimed.'
- 'rules/knowledge-base/a-curation-action-kind-is-written-with-underscores: the filtering half is exercised by the admit and refuse tests. The recording half (''wherever a curation action records it'') belongs to the task that records an accepted entity edit and reaches no criterion here, as the REMAINDER note says. No test here decides the rule whole.'
- 'contracts/knowledge-base/compliance-audit: the contract spans five operations, including compliance-delete, list-compliance-deletions and read-compliance-deletion, and many refusals the task does not touch. The tests cover only the list-curation-actions closed-set refusal and the read-curation-action 200 for an edit_entity action. No finite test of this task decides the contract whole.'
- 'Behavior inference, left unpinned: the spelling of action in list and read answers is the stored underscore text. The specification states no response spelling (see the ADVISORY note), so no test asserts the spelling. The read test asserts only that action is a string and that the other recorded fields are returned.'
- 'Inference about arrangement: the DTO spells the eighth member as a literal rather than importing ENTITY_EDIT_ACTION_KIND. No test is written over the arrangement.'
- 'Against a real database: the integration tests run over an in-memory stand-in that interprets the repository''s SQL templates. They do not show that the real Postgres curation_action column or any DB constraint accepts edit_entity. That needs a real database and was not attempted under the shared-Neon constraint.'
divergences:
- cites: MNT-03
  file: src/__tests__/integration/compliance-audit/edit-entity-actions.routes.spec.ts
  departure: The auth fixture, the JWT signing, the env fixture and the fake-pool scaffolding repeat the setup in the existing routes.spec.ts.
  why: The existing spec does not export that setup and must not be edited. Extracting a shared helper would mean changing the existing spec, so the setup is copied in a reduced form limited to the curation_action reads.
- cites: TYP-02
  file: src/__tests__/integration/compliance-audit/edit-entity-actions.routes.spec.ts
  departure: Type assertions (`as Env`, `as unknown as Pool`, `as never`) stand without a narrowing guard.
  why: The fake pool and the injected JWKS resolver are stand-ins that cannot satisfy the real driver and key types. This is the same pattern the existing routes spec uses.
- cites: MNT-01
  file: src/__tests__/integration/compliance-audit/edit-entity-actions.routes.spec.ts
  departure: The first describe callback runs over thirty lines.
  why: It holds two tests that each build a store and assert. The shared request helper keeps each test body short, but the describe callback still exceeds the limit.
---
## What it is
Tests show the audit action filter admits all eight curation action kinds in underscore spelling and refuses their hyphen spellings. The audit listing returns and filters edit_entity actions, and reading one edit_entity action answers 200.

## Notes
None.
