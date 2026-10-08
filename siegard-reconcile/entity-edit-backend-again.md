---
contract_version: siegard-reconcile/9
title: Second review of the backend delivery of the owner's entity edit (entity-edit-backend)
summary: The tasks refuse-inactive-node and record-correction of the entity-edit-backend initiative wrote
  these backend files, as their implementation and proof records state.
target: backend
files:
- path: src/__tests__/unit/curation/entity-edit-correction.spec.ts
  change: written by the delivery of the task whose proof record lists it (see siegard-delivery/entity-edit-backend/proof)
- path: src/__tests__/unit/curation/entity-edit-node.spec.ts
  change: written by the delivery of the task whose proof record lists it (see siegard-delivery/entity-edit-backend/proof)
- path: src/modules/curation/service/entity-edit-correction.ts
  change: 'written by the delivery of record-correction: Adds recordCorrection(client, input). It supersedes
    the predecessor with supersedeAttributeAtEdit, passing validTo null and supersededAt equal to the
    edit moment, so its validity end is never touched. It then records the new attribute through recordNewAttribute
    with supersedes set to the predecessor''s id, and copies the predecessor''s provenance onto it with
    copyProvenance. It returns the new attribute''s id. It refuses with an InvariantError when the predecessor
    was not live, before the new attribute is inserted. It runs in the caller''s transaction and reads
    no clock.'
- path: src/modules/curation/service/entity-edit-node.ts
  change: 'written by the delivery of refuse-inactive-node: Exports loadActiveNodeForEdit(client, nodeId),
    which locks the knowledge node row through the existing loadNodesForUpdate. It throws ResourceNotFoundError
    (404) naming the node in the message and in details.node_id when no row is held. It throws ConflictError
    with BUSINESS_NODE_NOT_ACTIVE (409) naming the node and its current status, in the message and in
    details.node_id and details.status, when the status is needs_review, merged or deleted. It returns
    the locked row for an active node.'
nodes:
- node: contracts/knowledge-base/entity-editing
  conforms: true
  how: 'src/modules/curation/service/entity-edit-node.ts: held at loadActiveNodeForEdit, lines 15-27.
    It holds the RESOURCE_NOT_FOUND refusal (404) and the BUSINESS_NODE_NOT_ACTIVE refusal (409) of this
    contract. The other operations and refusals of the contract are not this file''s. — throw new ResourceNotFoundError(`Knowledge
    node ''${nodeId}'' is not held.`, { node_id: nodeId }); and throw new ConflictError(NODE_NOT_ACTIVE_CODE,
    `Knowledge node ''${nodeId}'' has status ''${node.status}'' and only an active node can be edited.`,
    { node_id: nodeId, status: node.status }); with const NODE_NOT_ACTIVE_CODE = "BUSINESS_NODE_NOT_ACTIVE".
    errors.ts gives ResourceNotFoundError statusCode 404 and code "RESOURCE_NOT_FOUND", and ConflictError
    statusCode 409.'
  encoded_at:
  - src/modules/curation/service/entity-edit-node.ts
- node: domain/knowledge-base/assertion-status
  conforms: false
  how: 'no named file holds this fact now: src/modules/curation/service/entity-edit-correction.ts read
    `nowhere` — The file declares no enumeration and names no status value. The new attribute''s status
    is set inside `recordNewAttribute`, which lives in another file: `const attributeId = await recordNewAttribute(client,
    {`.'
  observed_at:
  - src/modules/curation/service/entity-edit-correction.ts
- node: domain/knowledge-base/node-attribute
  conforms: false
  how: 'no named file holds this fact now: src/modules/curation/service/entity-edit-correction.ts read
    `nowhere` — The file declares no shape for the attribute. It passes values along (`attributeId: predecessor.id`,
    `supersedes: predecessor.id`) and reads one field of a row type declared in the repository (`ItemLockedRow`).'
  observed_at:
  - src/modules/curation/service/entity-edit-correction.ts
- node: domain/knowledge-base/node-status
  conforms: false
  how: 'no named file holds this fact now: src/modules/curation/service/entity-edit-node.ts read `nowhere.
    The file does not declare the enumeration. It only compares against the value, in const ACTIVE_STATUS
    = "active" and node.status !== ACTIVE_STATUS.` — const ACTIVE_STATUS = "active"; if (node.status !==
    ACTIVE_STATUS) {. The enumeration''s shape is declared in the database enum, (''active'', ''needs_review'',
    ''merged'', ''deleted'') in migrations/0001_init.sql.'
  observed_at:
  - src/modules/curation/service/entity-edit-node.ts
- node: rules/knowledge-base/a-node-status-and-an-assertion-flag-cross-the-wire-with-underscores
  conforms: false
  how: 'no named file holds this fact now: src/modules/curation/service/entity-edit-node.ts read `nowhere.
    This file does not convert a status. It passes the stored status unchanged into the error details,
    { node_id: nodeId, status: node.status }. The stored enum values are already written with underscores
    (needs_review) in migrations/0001_init.sql.` — { node_id: nodeId, status: node.status }'
  observed_at:
  - src/modules/curation/service/entity-edit-node.ts
- node: rules/knowledge-base/entity-edit-correction
  conforms: true
  how: "src/modules/curation/service/entity-edit-correction.ts: held at The recording half of `recordCorrection`:\
    \ the predecessor is superseded, then the new attribute is recorded naming it as the one it supersedes.\
    \ The decision to correct (key not temporal, different value) is not in this file. — `const attributeId\
    \ = await recordNewAttribute(client, {\n    ...recorded,\n    supersedes: predecessor.id,\n  });`"
  encoded_at:
  - src/modules/curation/service/entity-edit-correction.ts
- node: rules/knowledge-base/entity-edit-ended-attribute-correction
  conforms: false
  how: 'no named file holds this fact now: src/modules/curation/service/entity-edit-correction.ts read
    `nowhere` — The file does not select a live attribute with a validity end and no supersession time,
    and it has no branch on the attribute''s key or its validity end. The caller supplies `predecessor:
    ItemLockedRow`.'
  observed_at:
  - src/modules/curation/service/entity-edit-correction.ts
- node: rules/knowledge-base/entity-edit-names-an-active-node
  conforms: true
  how: 'src/modules/curation/service/entity-edit-node.ts: held at the status check at lines 21-27 of loadActiveNodeForEdit
    — if (node.status !== ACTIVE_STATUS) { throw new ConflictError(NODE_NOT_ACTIVE_CODE, ...'
  encoded_at:
  - src/modules/curation/service/entity-edit-node.ts
  decided_by: test
  step: test
  proof:
  - src/__tests__/unit/curation/entity-edit-node.spec.ts
- node: rules/knowledge-base/entity-edit-provenance
  conforms: true
  how: 'src/modules/curation/service/entity-edit-correction.ts: held at The `copyProvenance` call, which
    carries over the predecessor''s provenance. The fragment''s own provenance is not written in this
    file. — `await copyProvenance(client, "attribute", predecessor.id, attributeId);`'
  encoded_at:
  - src/modules/curation/service/entity-edit-correction.ts
  decided_by: test
  step: test
  proof:
  - src/__tests__/unit/curation/entity-edit-correction.spec.ts
- node: rules/knowledge-base/entity-edit-supersession-time
  conforms: true
  how: "src/modules/curation/service/entity-edit-correction.ts: held at The `supersedeAttributeAtEdit`\
    \ call in `recordCorrection`. It gives the predecessor the moment of the edit as its supersession\
    \ time and states no validity end of its own. — `validTo: null,\n    supersededAt: input.editedAt,`"
  encoded_at:
  - src/modules/curation/service/entity-edit-correction.ts
- node: scenarios/knowledge-base/stable-key-edit-is-a-correction
  conforms: true
  how: 'src/modules/curation/service/entity-edit-correction.ts: held at `recordCorrection`. It supersedes
    the earlier attribute with no validity end given by the edit and records a new attribute that names
    it as its predecessor. The effect label is not produced in this file. — `validTo: null,` and `supersedes:
    predecessor.id,`'
  encoded_at:
  - src/modules/curation/service/entity-edit-correction.ts
unbound:
- src/__tests__/unit/curation/entity-edit-correction.spec.ts
- src/__tests__/unit/curation/entity-edit-node.spec.ts
notes: 'Judged by 4 delegation(s), one per file; folded mechanically by trace.py --fold from the returns
  under siegard-reconcile/entity-edit-backend-again.returns/.

  Certified rules/knowledge-base/entity-edit-names-an-active-node as decided by step `test`: src/__tests__/unit/curation/entity-edit-node.spec.ts
  (is refused for needs_review, merged and deleted and not refused for active); src/__tests__/unit/curation/entity-edit-node.spec.ts
  (is refused with RESOURCE_NOT_FOUND); src/__tests__/unit/curation/entity-edit-node.spec.ts (is applied
  to an active node, and refused with the node left as it stood for a node in needs_review, merged or
  deleted and for an identity at which no node is held) would fail if the fact stopped holding.

  Certified rules/knowledge-base/entity-edit-provenance as decided by step `test`: src/__tests__/unit/curation/entity-edit-correction.spec.ts
  (holds the edit''s information fragment, and for a correction every provenance of the superseded attribute
  and no other) would fail if the fact stopped holding.

  Staged by a review over files a delivery wrote: every pair a delivery or a hand stamped was judged,
  and a pair was omitted only where a reconciliation''s judgment had cleared it at these very bytes; the
  plan''s node(s) contracts/knowledge-base/entity-editing, domain/knowledge-base/assertion-status, domain/knowledge-base/entity-edit,
  domain/knowledge-base/node-attribute, domain/knowledge-base/node-status, rules/knowledge-base/a-node-status-and-an-assertion-flag-cross-the-wire-with-underscores,
  rules/knowledge-base/entity-edit-correction, rules/knowledge-base/entity-edit-ended-attribute-correction,
  rules/knowledge-base/entity-edit-names-an-active-node, rules/knowledge-base/entity-edit-provenance,
  rules/knowledge-base/entity-edit-supersession-time, scenarios/knowledge-base/stable-key-edit-is-a-correction
  were read on every file and answered for, and bound from nowhere here — a binding this record writes
  is one the trace already held.

  A finding in src/__tests__/unit/curation/entity-edit-correction.spec.ts names domain/knowledge-base/live-assertion-status,
  which no file of this set is bound to: line 36, the LIVE_STATUSES constant, used by supersedeStatement
  at line 128: const LIVE_STATUSES: readonly string[] = ["active", "uncertain", "disputed"]; — This is
  the enumeration that domain/knowledge-base/live-assertion-status holds, declared a second time in a
  file that node is not bound to. The test double decides which rows the supersede statement touches from
  this copy. If the node''s values move, the double keeps applying the old set. The tests then pass against
  a vocabulary nobody decided, and `--check` never reaches this file through the node.. It blocks nothing
  here; it is owed a route of its own.

  Candidates: 1 opened across 1 of 4 delegation(s); each return lists its own under `candidates_opened`.'
---

## Folded
This record was folded by `trace.py --fold` from the delegation returns under `siegard-reconcile/entity-edit-backend-again.returns/`, which are the evidence behind every entry above.
