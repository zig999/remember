---
title: Entity form drawn from the catalog
summary: The screen at /entities/$nodeId that shows one node and, for an active node, a form with one field group per catalog key, starting from the node's current values.
rationale: The scope says the screen opens a form generated from the catalog and does not say how to cut it. I grouped the rules that decide what the form shows and what each field accepts, apart from the rules that decide review and save, because the two halves change for different reasons.
sources:
- intake/scope.md
covers:
- domain/entity-workspace/entity-edit-session
- domain/entity-workspace/attribute-field
- contracts/entity-workspace/entity-screen
- rules/entity-workspace/the-form-is-offered-only-for-an-active-node
- rules/entity-workspace/the-form-has-a-field-group-per-catalog-key
- rules/entity-workspace/fields-start-from-the-current-values
- rules/entity-workspace/a-multi-valued-key-is-a-list-of-fields
- rules/entity-workspace/attributes-outside-the-catalog-show-without-a-field
- rules/entity-workspace/a-disputed-key-shows-without-a-field-and-points-to-curation
- rules/entity-workspace/a-field-accepts-only-its-value-type
- rules/entity-workspace/a-closed-key-offers-only-its-allowed-values
- rules/entity-workspace/a-changed-temporal-field-offers-its-validity
- rules/entity-workspace/a-changed-stable-field-offers-no-validity
- rules/entity-workspace/an-unstated-start-shows-as-today-and-is-sent-empty
- rules/knowledge-base/attribute-value-parses
- rules/entity-workspace/the-screen-lives-at-the-entities-addresses
- rules/entity-workspace/a-field-shows-its-key-description-as-help-text
- rules/entity-workspace/an-unstated-start-shows-in-the-owners-local-date
- rules/entity-workspace/a-field-added-with-a-held-value-is-not-changed
- contracts/entity-workspace/bff-entity-reads
- rules/application-shell/every-other-address-is-guarded
- rules/entity-workspace/a-field-added-to-a-multi-valued-key-starts-empty
- rules/entity-workspace/a-disputed-key-links-to-the-curation-queue
- rules/entity-workspace/a-value-of-the-wrong-type-reads-its-wording
- rules/entity-workspace/a-deleted-node-shows-its-own-alert
- rules/entity-workspace/the-listing-and-page-states-read-their-wording
uncovered:
- node: rules/entity-workspace/a-field-added-with-a-held-value-is-not-changed
  why: The rule decides when a field the owner added counts as changed, which the review-and-save epic implements in its review and save tasks, and no entity-form task builds it.
---
## What it is
The node's screen shows its name, type and status, its loading and failure states, and its attributes without a form when the node is not active.
For an active node, the form holds one group per catalog key, with fields typed by value type, closed keys, multi-valued keys and validity.
Values the form must not edit, because their key is outside the catalog or disputed, are shown without a field.

## Notes
rules/knowledge-base/attribute-value-parses is covered because it is the only node that states what reading as a value type means, and the field rule depends on that wording.
