---
target: backend
title: Proof that an edit naming an absent or not-active knowledge node is refused
summary: A fake pg client holds nodes in each of the four statuses, and the tests decide both refusals' codes, the node and status they name, the underscore spelling of needs_review, the HTTP 404 and 409 answers, and the not-active invariant over every node-status value.
implementation: sha256:5288bef8570f79fb1a342f493300ff8fe5070ae4a1845f95b10f334f9aeba9a9
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/entity-edit-backend-refuse-inactive-node-suite
tests:
- file: src/__tests__/unit/curation/entity-edit-node.spec.ts
  name: an edit naming an identity at which no knowledge node is held is refused with RESOURCE_NOT_FOUND
  proves: An edit naming an identity at which no knowledge node is held is refused with RESOURCE_NOT_FOUND.
  fails_when: an absent node is refused with any other code, or is not refused, or surfaces as a driver or generic error
- file: src/__tests__/unit/curation/entity-edit-node.spec.ts
  name: an edit naming an identity at which no knowledge node is held is refused with a message and details that name the node
  proves: An absent-node refusal names the node.
  fails_when: neither the refusal's message nor its details carry the requested node identity
- file: src/__tests__/unit/curation/entity-edit-node.spec.ts
  name: an edit naming an identity at which no knowledge node is held is answered HTTP 404 over REST
  proves: 'UNDERDETERMINED entry on contracts/knowledge-base/entity-editing: the absent-node refusal answers HTTP 404, rendered through the curation REST error mapping with code RESOURCE_NOT_FOUND.'
  fails_when: the absent-node refusal maps to HTTP 400, 422 or any status other than 404, or its envelope code is not RESOURCE_NOT_FOUND
- file: src/__tests__/unit/curation/entity-edit-node.spec.ts
  name: an edit naming a node, by the status the node holds is refused for needs_review, merged and deleted and not refused for active
  proves: The three status criteria (needs-review, merged, deleted refused with BUSINESS_NODE_NOT_ACTIVE) and the criterion that an active node is not refused by the active-node rule, over every value of the node-status enumeration. The same test is the proof of the invariant that an entity edit must name a knowledge node whose status is active.
  fails_when: any of needs_review, merged or deleted is accepted or refused with another code, or an active node is refused; the diff names the status that broke
  demonstrates: rules/knowledge-base/entity-edit-names-an-active-node
- file: src/__tests__/unit/curation/entity-edit-node.spec.ts
  name: a not-active refusal for a needs_review node names the node
  proves: A not-active refusal names the node, for the needs-review status.
  fails_when: the needs_review refusal's message and details carry no node identity
- file: src/__tests__/unit/curation/entity-edit-node.spec.ts
  name: a not-active refusal for a merged node names the node
  proves: A not-active refusal names the node, for the merged status.
  fails_when: the merged refusal's message and details carry no node identity
- file: src/__tests__/unit/curation/entity-edit-node.spec.ts
  name: a not-active refusal for a deleted node names the node
  proves: A not-active refusal names the node, for the deleted status.
  fails_when: the deleted refusal's message and details carry no node identity
- file: src/__tests__/unit/curation/entity-edit-node.spec.ts
  name: a not-active refusal for a merged node names that status
  proves: A not-active refusal names the node's current status, for merged.
  fails_when: the merged refusal's message and details do not carry the status merged
- file: src/__tests__/unit/curation/entity-edit-node.spec.ts
  name: a not-active refusal for a deleted node names that status
  proves: A not-active refusal names the node's current status, for deleted.
  fails_when: the deleted refusal's message and details do not carry the status deleted
- file: src/__tests__/unit/curation/entity-edit-node.spec.ts
  name: a not-active refusal for a node under review names the status as needs_review with its underscore, never as needs-review
  proves: 'UNDERDETERMINED entry on rules/knowledge-base/a-node-status-and-an-assertion-flag-cross-the-wire-with-underscores: the refusal names the status of a node under review as needs_review, and A not-active refusal names the node''s current status.'
  fails_when: the refusal carries the hyphenated enumeration value needs-review, or does not carry needs_review
- file: src/__tests__/unit/curation/entity-edit-node.spec.ts
  name: a not-active refusal is answered HTTP 409 over REST
  proves: 'UNDERDETERMINED entry on contracts/knowledge-base/entity-editing: the not-active refusal answers HTTP 409, rendered through the curation REST error mapping with code BUSINESS_NODE_NOT_ACTIVE.'
  fails_when: the not-active refusal maps to HTTP 400, 422 or any status other than 409, or its envelope code is not BUSINESS_NODE_NOT_ACTIVE
not_applicable:
- edge_case: absent or empty node identity (undefined, empty string, a malformed uuid)
  why: Form of the request is checked before the node guard, at the validation boundary. The helper receives a typed identity, and the DTO (a prior task) owns malformed identities. No criterion here decides what the guard does with one.
- edge_case: a status outside the four enumerated values
  why: The node_status database enum and the NodeStatus type admit only the four. No criterion or node states behavior for a fifth, and a test would pin an unstated behavior.
- edge_case: two edits of one node at once
  why: No criterion or node of this task states concurrent behavior. Only a real database with row locks could decide it, and the shared database must not be touched.
- edge_case: store unreachable or statement timeout
  why: The criteria of this task do not reach it. Contract refusals for SYSTEM_SERVICE_UNAVAILABLE belong to the error mapping, not to this guard.
untested:
- 'contracts/knowledge-base/entity-editing: the node lists the accepted answer and about twenty refusals, and this task owns only the absent-node and not-active ones, whose codes, names and HTTP statuses are tested. No finite test of this task decides the whole contract, so no test claims it.'
- 'domain/knowledge-base/node-status: the node is an enumeration of four values and this task ships no declaration of it. The helper only compares against active, and the enumeration itself lives in a prior task''s DTO. It is exercised in use by the whole-enumeration test but no test of this task decides the enumeration whole.'
- 'domain/knowledge-base/entity-edit: the value object''s reason and changes attributes are carried by the already delivered edit-entity DTO, which this task does not touch. The reference to one knowledge node is exercised only as the node identity the guard receives.'
- 'rules/knowledge-base/a-node-status-and-an-assertion-flag-cross-the-wire-with-underscores: the assertion-flag clause reaches nothing in this task (the task''s REMAINDER note), so no test here decides the rule whole. Only the node-status clause is tested, for needs_review, and the test does not claim the node.'
- 'Inference, behavior: the helper locks the knowledge node row with FOR UPDATE through loadNodesForUpdate. No node decides a lock for the edit, and the fake client does not assert the statement text. A lock is only decidable against a real database.'
- 'Inference, behavior: the refusal''s message wording and the details keys node_id and status are the implementation''s choice, and no node decides them. The tests check only that the node and status appear somewhere in the message or details.'
- 'Advisory, deferred: the order of the edit''s checks (rules/knowledge-base/entity-edit-check-order) and keeping expected refusals out of error-level logs (constraints/expected-refusals-not-logged-as-errors). Neither is implemented here and no criterion of this task reaches them.'
- 'Behavior only a real database could decide, with the shared Neon database off-limits: that the lock holds until the edit''s transaction ends, and that the real knowledge_node query returns the stored needs_review spelling.'
---
## What it is
A fake pg client holds nodes in each of the four statuses, and the tests decide both refusals' codes, the node and status they name, the underscore spelling of needs_review, the HTTP 404 and 409 answers, and the not-active invariant over every node-status value.

## Notes
None.
