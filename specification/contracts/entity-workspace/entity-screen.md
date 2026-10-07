---
type: api
direction: published
operations:
- show-entity-list
- show-entity-form
- show-review
- save-edit
answers:
- operation: show-entity-list
  accepted: the nodes the knowledge base lists, each with its name, type and status, narrowed by the name prefix and node type the owner gave
  refusals:
  - when: The listing is being fetched.
    answer: a loading indication in place of the list
  - when: The listing fails.
    answer: an alert saying the nodes could not be loaded, with the action to try again
  - when: The listing holds no node.
    answer: a statement that no node was found
- operation: show-entity-form
  accepted: the node's name, type and status above one group of fields per attribute key of its type, each field holding the node's current value, its help text and, for a key the catalog closes, its allowed values
  refusals:
  - rule: rules/entity-workspace/the-form-is-offered-only-for-an-active-node
    answer: the node's attributes with no form and no field
  - rule: rules/entity-workspace/a-disputed-key-shows-without-a-field-and-points-to-curation
    answer: the key's values with no field and a pointer to the curation workspace
  - when: The node or the catalog is being fetched.
    answer: a loading indication in place of the form
  - when: No knowledge node is held at the identity in the address.
    answer: an alert saying the node was not found
  - when: The node or the catalog fails to load for any other cause.
    answer: an alert saying the form could not be loaded, with the action to try again
- operation: show-review
  accepted: each changed field once, with its previous value beside its new value, the effect its change will have, the validity it states and a field for the reason
  refusals:
  - rule: rules/entity-workspace/review-needs-a-changed-field
    answer: no review is offered
  - rule: rules/entity-workspace/review-requires-a-trimmed-reason
    answer: the save is not offered until the reason holds a character
  - rule: rules/entity-workspace/validity-start-precedes-the-end
    answer: a message on the validity end field and no save
- operation: save-edit
  accepted: a notice that the edit is recorded with an undo that lasts five seconds, then the form reloaded from the values now current
  refusals:
  - rule: rules/entity-workspace/a-conflict-keeps-the-typed-values
    answer: an alert saying the node changed since the form was opened, with every typed value kept
  - when: The knowledge base refuses the edit for any other cause.
    answer: an alert carrying the refusal's message, with every typed value kept
  - when: The knowledge base cannot be reached.
    answer: an alert saying the edit could not be sent, with every typed value kept
---

## Description

The screen where the owner edits the attributes of one knowledge node.
