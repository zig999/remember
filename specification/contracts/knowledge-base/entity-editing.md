---
type: api
direction: published
operations:
- edit-entity
answers:
- operation: edit-entity
  accepted: 'Over REST, `POST /api/v1/nodes/{node_id}/edit` with the edited node''s identity in the path and a JSON body carrying the edit''s `reason` and `changes`, answered HTTP 200 carrying, with no envelope, `{ node_id, action_id, applied }`, `node_id` the edited node''s identity, `action_id` the identity of the curation action the edit recorded, `applied` listing one `{ attribute_key, effect, item_id, predecessor_id }` per change in the order given, `item_id` and `predecessor_id` null where the effect has none'
  refusals:
  - rule: rules/knowledge-base/entity-edit-reason-length
    answer: &format 'error code VALIDATION_INVALID_FORMAT with message "Request payload failed validation." and `details: { issues: [{ path, message }] }`, each path joined by ".", HTTP 422 over REST'
  - rule: rules/knowledge-base/entity-edit-value-matches-the-kind
    answer: *format
  - rule: rules/knowledge-base/entity-edit-removal-names-an-attribute
    answer: *format
  - when: A field is missing, null where it may not be, of the wrong type, outside its closed set, or not a well-formed identifier or `YYYY-MM-DD` date.
    answer: *format
  - when: No knowledge node is held at the requested identity.
    answer: 'error code RESOURCE_NOT_FOUND naming the node, HTTP 404 over REST'
  - rule: rules/knowledge-base/entity-edit-names-an-active-node
    answer: 'error code BUSINESS_NODE_NOT_ACTIVE naming the node and its current status, HTTP 409 over REST'
  - rule: rules/knowledge-base/attribute-key-for-node-type
    answer: 'error code BUSINESS_UNKNOWN_ATTRIBUTE_KEY naming the key and the node type, HTTP 422 over REST'
  - rule: rules/knowledge-base/attribute-value-parses
    answer: 'error code BUSINESS_INVALID_ATTRIBUTE_VALUE naming the value type and the value, HTTP 422 over REST'
  - rule: rules/knowledge-base/attribute-value-in-allowed-values
    answer: 'error code BUSINESS_INVALID_ATTRIBUTE_VALUE naming the attribute key, the value and the allowed values, HTTP 422 over REST'
  - rule: rules/knowledge-base/stable-key-change-states-no-validity
    answer: &incoherent 'error code BUSINESS_TEMPORAL_INCOHERENT, HTTP 422 over REST'
  - rule: rules/knowledge-base/validity-start-before-end
    answer: *incoherent
  - rule: rules/knowledge-base/entity-edit-defaulted-start-precedes-end
    answer: *incoherent
  - rule: rules/knowledge-base/entity-edit-names-a-live-attribute
    answer: &conflict 'error code BUSINESS_ENTITY_EDIT_CONFLICT naming the attribute key and, where it has one, the item, HTTP 409 over REST'
  - rule: rules/knowledge-base/entity-edit-changes-no-attribute-with-a-supersession-time
    answer: *conflict
  - rule: rules/knowledge-base/entity-edit-adds-no-second-current-value
    answer: *conflict
  - when: Another operation changed an attribute the edit names first.
    answer: *conflict
  - rule: rules/knowledge-base/entity-edit-leaves-disputes-to-curation
    answer: 'error code BUSINESS_ENTITY_EDIT_DISPUTED naming the attribute key and the item, HTTP 409 over REST'
  - rule: rules/knowledge-base/entity-edit-changes-something
    answer: 'error code BUSINESS_ENTITY_EDIT_NO_CHANGES, HTTP 422 over REST'
  - when: A uniqueness guard of the store refuses the write.
    answer: *incoherent
  - &unavailable
    when: The store is unreachable or a statement times out.
    answer: 'error code SYSTEM_SERVICE_UNAVAILABLE with message "A backing service is temporarily unavailable.", HTTP 503 over REST'
  - &internal
    when: The operation fails for any other cause.
    answer: 'error code SYSTEM_INTERNAL_ERROR with message "Internal server error.", withholding the cause, HTTP 500 over REST'
---

## Description

The owner's surface for editing the attributes of a knowledge node: one edit carrying every change the owner made to the node, under one reason.
