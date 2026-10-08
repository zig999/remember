---
title: Refuse an edit of a node that is absent or not active
summary: An edit naming no held node, or a node whose status is not active, is refused with the code the contract states.
rationale: Planning cut the node guard into its own task. It answers to a rule of its own and to the contract's absent-node answer, and it can be shown working without any change being checked.
sources:
- intake/scope.md
objective: An edit naming a node that is absent or not active is refused with the code the entity-editing contract states.
criteria:
- An edit naming an identity at which no knowledge node is held is refused with RESOURCE_NOT_FOUND.
- An absent-node refusal names the node.
- An edit naming a node whose status is needs-review is refused with BUSINESS_NODE_NOT_ACTIVE.
- An edit naming a node whose status is merged is refused with BUSINESS_NODE_NOT_ACTIVE.
- An edit naming a node whose status is deleted is refused with BUSINESS_NODE_NOT_ACTIVE.
- A not-active refusal names the node.
- A not-active refusal names the node's current status.
- An edit naming an active node is not refused by the active-node rule.
depends_on:
- task/entity-edit-backend/edit-refusal-codes
implements:
- contracts/knowledge-base/entity-editing
- rules/knowledge-base/entity-edit-names-an-active-node
- domain/knowledge-base/node-status
- domain/knowledge-base/entity-edit
- rules/knowledge-base/a-node-status-and-an-assertion-flag-cross-the-wire-with-underscores
---
## What it is
An edit naming no held node, or a node whose status is not active, is refused with the code the contract states.

## Notes
UNDERDETERMINED, from the specification — contracts/knowledge-base/entity-editing gives HTTP statuses for both refusals in this task: 'error code RESOURCE_NOT_FOUND naming the node, HTTP 404 over REST' and 'error code BUSINESS_NODE_NOT_ACTIVE naming the node and its current status, HTTP 409 over REST'. The criteria require only the error codes. No criterion requires the HTTP status, so a wrong transport status passes. Implementation that meets every criterion and that the specification refuses: An implementation that refuses an absent node with RESOURCE_NOT_FOUND and a needs-review, merged or deleted node with BUSINESS_NODE_NOT_ACTIVE, names the node and the status, but answers HTTP 400 or 422 over REST instead of 404 and 409.
Decision, beyond the covers — stand: specification is a read-only neighbour this task consults, and its fact is held by that node; this task changes none of it and the epic does not claim it.
UNDERDETERMINED, from the specification — rules/knowledge-base/a-node-status-and-an-assertion-flag-cross-the-wire-with-underscores states 'A node status and an assertion flag MUST cross the wire with each hyphen of their enumeration value written as an underscore.' The criterion 'A not-active refusal names the node's current status.' does not say how the status is spelled, so a refusal can carry the hyphenated enumeration value. Implementation that meets every criterion and that the specification refuses: A BUSINESS_NODE_NOT_ACTIVE refusal for a node under review that names its status as 'needs-review' rather than 'needs_review'.
Decision, beyond the covers — stand: specification is a read-only neighbour this task consults, and its fact is held by that node; this task changes none of it and the epic does not claim it.
REMAINDER, from the specification — The clause of rules/knowledge-base/a-node-status-and-an-assertion-flag-cross-the-wire-with-underscores about an assertion flag reaches no criterion of this task. Only the node-status clause applies to the not-active refusal. Belongs to: Whichever task puts assertion flags on the wire (the graph stream or node-reading surfaces that carry assertion flags), not this refusal.
Decision, beyond the covers — stand: specification is a read-only neighbour this task consults, and its fact is held by that node; this task changes none of it and the epic does not claim it.
ADVISORY, from the specification — domain/knowledge-base/knowledge-node holds the 'status' attribute of type node-status, and rules/knowledge-base/entity-edit-names-an-active-node constrains it. It is not among the candidates. This task reads a held knowledge node and its status, so the epic's claim may need to include domain/knowledge-base/knowledge-node, or the task leans on a node it cannot name.
Decision, beyond the covers — stand: domain/knowledge-base/knowledge-node, specification is a read-only neighbour this task consults, and its fact is held by that node; this task changes none of it and the epic does not claim it.
ADVISORY, from the specification — rules/knowledge-base/entity-edit-check-order states that an edit is checked for a well-formed request, then for an existing knowledge node, then for an active one, then change by change, and is refused at the first check it fails. This task does not implement that rule and no criterion here fixes where the existence and activity checks sit relative to the form and change checks. The task that implements rules/knowledge-base/entity-edit-check-order must cover that position, or an implementation that checks changes before node activity goes unexcluded.
Decision, beyond the covers — stand: specification is a read-only neighbour this task consults, and its fact is held by that node; this task changes none of it and the epic does not claim it.
ADVISORY, from the specification — constraints/expected-refusals-not-logged-as-errors ('A refusal for a business or validation cause is never logged at error level ...') covers both refusals in this task. It is not implemented here and is assumed to belong to a system-wide task.
Decision, beyond the covers — stand: specification is a read-only neighbour this task consults, and its fact is held by that node; this task changes none of it and the epic does not claim it.
