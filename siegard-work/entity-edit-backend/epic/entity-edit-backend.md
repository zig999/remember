---
title: The owner's entity edit in the backend
summary: Everything the edit-entity operation needs in the backend, from the REST
  request to the attributes, operator note and curation action that an accepted edit
  records.
rationale: The scope names one operation and states no cut. Planning kept the operation
  as one epic because its tasks bind rules that overlap, such as an effect rule that
  both decides a change and records it. A split epic would stop a task from naming
  a node that its neighbour's epic covers.
sources:
- intake/scope.md
covers:
- contracts/knowledge-base/entity-editing
- domain/knowledge-base/entity-edit
- domain/knowledge-base/attribute-change
- domain/knowledge-base/attribute-change-kind
- domain/knowledge-base/applied-change
- domain/knowledge-base/edit-effect
- domain/knowledge-base/live-assertion-status
- domain/knowledge-base/curation-action-kind
- rules/knowledge-base/entity-edit-addition
- rules/knowledge-base/entity-edit-adds-no-second-current-value
- rules/knowledge-base/entity-edit-changes-something
- rules/knowledge-base/entity-edit-correction
- rules/knowledge-base/entity-edit-first-value
- rules/knowledge-base/entity-edit-leaves-disputes-to-curation
- rules/knowledge-base/entity-edit-names-a-live-attribute
- rules/knowledge-base/entity-edit-names-an-active-node
- rules/knowledge-base/entity-edit-new-attribute-state
- rules/knowledge-base/entity-edit-note
- rules/knowledge-base/entity-edit-note-content
- rules/knowledge-base/entity-edit-note-source
- rules/knowledge-base/entity-edit-provenance
- rules/knowledge-base/entity-edit-reason-length
- rules/knowledge-base/entity-edit-records-curation-action
- rules/knowledge-base/entity-edit-removal
- rules/knowledge-base/entity-edit-removal-names-an-attribute
- rules/knowledge-base/entity-edit-run
- rules/knowledge-base/entity-edit-start-defaults-to-today
- rules/knowledge-base/entity-edit-stated-start-is-stated
- rules/knowledge-base/entity-edit-succession
- rules/knowledge-base/entity-edit-succession-closes-the-previous
- rules/knowledge-base/entity-edit-unchanged-records-nothing
- rules/knowledge-base/entity-edit-value-matches-the-kind
- rules/knowledge-base/stable-key-change-states-no-validity
- rules/knowledge-base/attribute-key-for-node-type
- rules/knowledge-base/attribute-value-parses
- rules/knowledge-base/attribute-value-in-allowed-values
- rules/knowledge-base/validity-start-before-end
- rules/knowledge-base/entity-edit-note-run
- rules/knowledge-base/entity-edit-stable-attribute-holds-no-validity
- rules/knowledge-base/entity-edit-stated-end-is-held
- rules/knowledge-base/entity-edit-supersession-time
- rules/knowledge-base/entity-edit-ended-attribute-correction
- rules/knowledge-base/current-assertion
- rules/knowledge-base/a-node-status-and-an-assertion-flag-cross-the-wire-with-underscores
- rules/knowledge-base/entity-edit-reason-trimmed
- rules/knowledge-base/entity-edit-null-field-is-not-stated
- rules/knowledge-base/entity-edit-note-confidence
- rules/knowledge-base/an-edit-effect-crosses-the-wire-with-underscores
- rules/knowledge-base/entity-edit-defaulted-start-precedes-end
- rules/knowledge-base/entity-edit-changes-no-attribute-with-a-supersession-time
- rules/knowledge-base/a-curation-action-kind-is-written-with-underscores
- rules/knowledge-base/entity-edit-change-check-order
- rules/knowledge-base/entity-edit-check-order
- rules/knowledge-base/unrecorded-temporality-is-not-temporal
- domain/knowledge-base/node-status
- domain/knowledge-base/attribute-key
- domain/knowledge-base/node-attribute
- domain/knowledge-base/assertion-status
- domain/knowledge-base/value-type
- domain/knowledge-base/curation-action
- domain/knowledge-base/curation-target-kind
- domain/knowledge-base/curation-action-filter
- contracts/knowledge-base/compliance-audit
- constraints/entity-edit-is-atomic
- constraints/entity-editing-is-not-a-language-model-tool
- constraints/every-operation-requires-owner-authentication
- constraints/unreachable-store-answers-unavailable
- constraints/internal-failure-withholds-cause
- constraints/expected-refusals-not-logged-as-errors
- scenarios/knowledge-base/edit-of-a-superseded-attribute-is-a-conflict
- scenarios/knowledge-base/stable-key-edit-is-a-correction
- scenarios/knowledge-base/temporal-edit-without-a-date-starts-today
- scenarios/knowledge-base/backdated-start-supersedes-without-an-end
- scenarios/knowledge-base/emptying-one-email-rejects-only-that-email
- scenarios/knowledge-base/an-edit-with-no-changes-is-refused-as-changing-nothing
---
## What it is
This epic delivers the owner's edit of a knowledge node's attributes as one backend operation, published over REST alone.
It checks each change against the catalog and against the node's live attributes, and it decides each change's effect.
An accepted edit records its operator note, its attributes and its curation action in one transaction.

## Notes
The entity-workspace nodes, renaming an entity and editing aliases are out of scope, and no covers entry names them.
The scope's rules/knowledge-base/entity-edit-* set has 24 nodes in the specification, and all 24 are covered.
Two scenarios are covered beyond the three the scope lists, backdated-start-supersedes-without-an-end and emptying-one-email-rejects-only-that-email, because their subjects are entity-edit rules.
Five rules written by the decided-fact route during this plan are covered, entity-edit-note-run, entity-edit-stable-attribute-holds-no-validity, entity-edit-stated-end-is-held, entity-edit-supersession-time and entity-edit-ended-attribute-correction.
The elements node-status, attribute-key, node-attribute, assertion-status, value-type, curation-action, curation-target-kind and curation-action-filter, the rules current-assertion and a-node-status-and-an-assertion-flag-cross-the-wire-with-underscores, and the contract compliance-audit are covered because binders found criteria resting on them.
The scenario impossible-calendar-date-refused is not covered because its subject is an ingestion attribute proposal.
The constraints every-operation-requires-owner-authentication, unreachable-store-answers-unavailable, internal-failure-withholds-cause and expected-refusals-not-logged-as-errors are claimed because the edit's own route has to meet them.
