---
target: backend
title: Refuse an edit of a node that is absent or not active
summary: A new service helper loads the named knowledge node under row lock and refuses it with RESOURCE_NOT_FOUND when none is held, or with BUSINESS_NODE_NOT_ACTIVE when its status is not active.
task: sha256:9efa3c749ac54d9c22082a6743c5e7f0d3fa7afe2c8c1ac9e37c26fd19fcd06e
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/entity-edit-backend-refuse-inactive-node-build
files:
- path: src/modules/curation/service/entity-edit-node.ts
  effect: Exports loadActiveNodeForEdit(client, nodeId), which locks the knowledge node row through the existing loadNodesForUpdate. It throws ResourceNotFoundError (404) naming the node in the message and in details.node_id when no row is held. It throws ConflictError with BUSINESS_NODE_NOT_ACTIVE (409) naming the node and its current status, in the message and in details.node_id and details.status, when the status is needs_review, merged or deleted. It returns the locked row for an active node.
criteria:
- criterion: An edit naming an identity at which no knowledge node is held is refused with RESOURCE_NOT_FOUND.
  met: true
  how: loadActiveNodeForEdit throws ResourceNotFoundError, whose code is RESOURCE_NOT_FOUND, when loadNodesForUpdate returns no row (src/modules/curation/service/entity-edit-node.ts).
- criterion: An absent-node refusal names the node.
  met: true
  how: The ResourceNotFoundError message quotes the node identity and its details carry node_id.
- criterion: An edit naming a node whose status is needs-review is refused with BUSINESS_NODE_NOT_ACTIVE.
  met: true
  how: Any status other than active makes the helper throw ConflictError with code BUSINESS_NODE_NOT_ACTIVE. The stored value needs_review is not active.
- criterion: An edit naming a node whose status is merged is refused with BUSINESS_NODE_NOT_ACTIVE.
  met: true
  how: The same status check refuses merged.
- criterion: An edit naming a node whose status is deleted is refused with BUSINESS_NODE_NOT_ACTIVE.
  met: true
  how: The same status check refuses deleted.
- criterion: A not-active refusal names the node.
  met: true
  how: The ConflictError message quotes the node identity and its details carry node_id.
- criterion: A not-active refusal names the node's current status.
  met: true
  how: The ConflictError message and details.status carry the row's status. NodeStatus in src/modules/curation/dto/enums.dto.ts and the node_status enum in the database already spell it with underscores (needs_review), so the wire spelling the rule requires is what is emitted.
- criterion: An edit naming an active node is not refused by the active-node rule.
  met: true
  how: When the status equals active the helper returns the locked row without throwing.
nodes:
- node: contracts/knowledge-base/entity-editing
  encoded_at:
  - src/modules/curation/service/entity-edit-node.ts
  how: Answers the two refusals this task owns. RESOURCE_NOT_FOUND names the node. BUSINESS_NODE_NOT_ACTIVE names the node and its current status. HTTP 404 and 409 come from the typed errors' statusCode and from the shared mapErrorToHttpResponse (ResourceNotFoundError 404, ConflictError 409), consistent with codeToHttpStatus in src/shared/error-mapping.ts. No route is wired here, so the accepted answer and the other refusals are not reached.
- node: rules/knowledge-base/entity-edit-names-an-active-node
  encoded_at:
  - src/modules/curation/service/entity-edit-node.ts
  how: The invariant is the condition node.status !== "active", checked while the row is locked and before any write.
- node: domain/knowledge-base/node-status
  encoded_at:
  - src/modules/curation/service/entity-edit-node.ts
  how: Only the value active passes. needs-review, merged and deleted are refused, read from the existing NodeStatus type, which holds the same four values with underscores.
- node: domain/knowledge-base/entity-edit
  how: The edit's reference to one knowledge node is honored by resolving that node first. The reason and changes attributes are carried by the already delivered edit-entity.dto.ts, and this task does not touch them.
- node: rules/knowledge-base/a-node-status-and-an-assertion-flag-cross-the-wire-with-underscores
  encoded_at:
  - src/modules/curation/service/entity-edit-node.ts
  how: The refusal's status is the row's NodeStatus value, already spelled needs_review, and no hyphenated form is produced. The assertion-flag clause reaches nothing in this task.
inferences:
- inferred: The helper takes the node row with FOR UPDATE, through the existing loadNodesForUpdate, so the status that was checked still holds when the later edit writes.
  from: The inventory convention that a write service locks the target row, and loadNodesForUpdate already used by merge.service.ts and entity-match.service.ts. No node states a lock for the edit.
- inferred: The helper receives a PoolClient and returns the locked KnowledgeNodeLockedRow, leaving the transaction to the future edit service.
  from: The inventory convention that a write service opens one transaction with withTransaction. The returned row gives the later node-type catalog check its node_type_id.
- inferred: The refusals reuse ResourceNotFoundError and ConflictError from service/errors.ts, with the message wording and details keys node_id and status.
  from: item.service.ts, which raises these classes with details objects. The statuses 404 and 409 agree with the contract and with codeToHttpStatus.
preserved:
- loadNodesForUpdate and every existing caller (merge.service.ts, entity-match.service.ts) are unchanged.
- The shared error table src/shared/error-mapping.ts and the curation error classes are unchanged.
- No existing route, MCP toolset, DTO or migration was touched. The task adds one new helper file.
deferred:
- what: The order of the edit's checks, with the form check first, then node existence, then node activity, then the changes (rules/knowledge-base/entity-edit-check-order).
  why: The edit service that composes the checks is outside this task. The helper only provides the existence and activity step.
- what: Keeping the expected refusals out of error-level logs (constraints/expected-refusals-not-logged-as-errors).
  why: mapErrorToHttpResponse already logs these refusals as warn. The constraint is system-wide and is not implemented by this task.
---
## What it is
A new service helper loads the named knowledge node under row lock and refuses it with RESOURCE_NOT_FOUND when none is held, or with BUSINESS_NODE_NOT_ACTIVE when its status is not active.

## Notes
Inferred: The helper takes the node row with FOR UPDATE, through the existing loadNodesForUpdate, so the status that was checked still holds when the later edit writes.
Inferred: The helper receives a PoolClient and returns the locked KnowledgeNodeLockedRow, leaving the transaction to the future edit service.
Inferred: The refusals reuse ResourceNotFoundError and ConflictError from service/errors.ts, with the message wording and details keys node_id and status.
Deferred: The order of the edit's checks, with the form check first, then node existence, then node activity, then the changes (rules/knowledge-base/entity-edit-check-order).
Deferred: Keeping the expected refusals out of error-level logs (constraints/expected-refusals-not-logged-as-errors).
