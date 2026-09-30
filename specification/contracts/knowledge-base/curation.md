---
type: api
direction: published
operations:
- list-review-queue
- read-curation-metrics
- resolve-entity-match
- merge-nodes
- resolve-dispute
- confirm-item
- reject-item
- correct-item
answers:
- operation: list-review-queue
  accepted: 'HTTP 200 carrying, with no envelope, `total`, the `limit` and `offset` as requested, and `items`: entity-match entries `{ kind: "entity_match", node_id, node_type, canonical_name, candidates, created_at }`, each candidate `{ candidate_node_id, canonical_name, similarity }` with similarity a number, and dispute entries `{ kind: "disputed", item_kind, scope, sides, created_at }`, the scope `{ source_node_id, target_node_id, link_type, node_id, attribute_key }` with the link type by name, the fields its kind does not use null and the target null for a link type that does not allow multiple current links, and each side `{ item_id, value, target_node_id, valid_from, valid_to, valid_from_source, confidence, status }` with a link''s value and an attribute''s target null, dates as `YYYY-MM-DD` and confidence a number; over MCP, `{ ok: true, result }` carrying the same'
  refusals:
  - rule: rules/knowledge-base/page-limit-bounds
    answer: &query-format 'error code VALIDATION_INVALID_FORMAT with message "Request payload failed validation.", HTTP 422 over REST with `details` a bare list of `{ path, message }`, and over MCP with `details: { issues: [{ path, message }] }`'
  - rule: rules/knowledge-base/page-offset-non-negative
    answer: *query-format
  - when: The kind is outside the review-queue kinds, or the limit or offset is not an integer.
    answer: *query-format
  - &unavailable
    when: The store is unreachable or a statement times out.
    answer: 'error code SYSTEM_SERVICE_UNAVAILABLE with message "A backing service is temporarily unavailable.", HTTP 503 over REST'
  - &internal
    when: The operation fails for any other cause.
    answer: 'error code SYSTEM_INTERNAL_ERROR with message "Internal server error.", withholding the cause, HTTP 500 over REST'
- operation: read-curation-metrics
  accepted: 'HTTP 200 carrying, with no envelope, `accept_rate`, `reject_rate_by_code` as an object from error code to rate, `{}` when there is none, `needs_review_count`, `uncertain_count`, `disputed_count`, `entity_match_queue_count`, `disputed_queue_count` and `computed_at`, the ISO-8601 moment the metrics were computed, taken after they were read'
  refusals:
  - when: The metrics cannot be read for a cause that would otherwise answer an unavailable store or an internal failure.
    answer: 'HTTP 503, error code SYSTEM_SERVICE_UNAVAILABLE with message "A backing service is temporarily unavailable."'
- operation: resolve-entity-match
  accepted: 'HTTP 200 carrying, with no envelope, `{ node_id, decision, resulting_status, target_node_id, affected, action_id }`: for keep_separate, resulting status active with target and affected null; for merge_into, resulting status merged, the target node, and `affected` as `{ links_repointed, attributes_repointed, aliases_copied, path_compressed_nodes }`; over MCP, where the node identity travels as `node_id` beside the body, `{ ok: true, result }` carrying the same'
  refusals:
  - when: The node identity in the REST path is not a well-formed identifier.
    answer: 'HTTP 422, error code VALIDATION_INVALID_FORMAT with message "Request payload failed validation." and `details` a bare list of `{ path, message }`, answered before the body is checked'
  - rule: rules/knowledge-base/merge-into-requires-target
    answer: 'error code BUSINESS_TARGET_NODE_REQUIRED with message "decision=merge_into requires target_node_id" and `details: { issues: [{ path, message }] }`, HTTP 422 over REST'
  - rule: rules/knowledge-base/curation-reason-required
    answer: &reason-required 'error code BUSINESS_REASON_REQUIRED with message "reason is required for the requested operation" and `details: { issues }`, HTTP 422 over REST'
  - rule: rules/knowledge-base/curation-reason-not-blank
    answer: 'error code BUSINESS_REASON_REQUIRED where the decision is merge_into and VALIDATION_INVALID_FORMAT otherwise, with `details: { issues }`, HTTP 422 over REST'
  - rule: rules/knowledge-base/curation-action-reason-length
    answer: &format 'error code VALIDATION_INVALID_FORMAT with message "Request payload failed validation." and `details: { issues: [{ path, message }] }`, each path joined by ".", HTTP 422 over REST'
  - rule: rules/knowledge-base/node-never-merged-into-itself
    answer: 'error code BUSINESS_SELF_MERGE_FORBIDDEN naming the node, HTTP 409 over REST'
  - &body-format
    when: A field is missing, null where it may not be, of the wrong type, outside its closed set, or not a well-formed identifier or `YYYY-MM-DD` date.
    answer: *format
  - when: No knowledge node is held at the node's identity or, for merge_into, at the target's.
    answer: 'error code RESOURCE_NOT_FOUND naming the absent node as `node_id` for keep_separate and as `missing_id` for merge_into, the target checked first, HTTP 404 over REST'
  - rule: rules/knowledge-base/curation-refuses-deleted-node
    answer: &deleted 'error code BUSINESS_NODE_DELETED naming the deleted node, the survivor checked first, HTTP 410 over REST'
  - rule: rules/knowledge-base/entity-match-resolution-requires-pending-review
    answer: 'error code BUSINESS_REVIEW_NOT_PENDING naming the node and its current status, HTTP 409 over REST'
  - rule: rules/knowledge-base/merge-survivor-active
    answer: &survivor 'error code BUSINESS_INVALID_TARGET_NODE naming the survivor and its current status, HTTP 422 over REST'
  - rule: rules/knowledge-base/merge-requires-same-node-type
    answer: &same-type 'error code BUSINESS_INVALID_TARGET_NODE with `details.reason` "node_type mismatch", HTTP 422 over REST'
  - when: Another operation changed the node's status first.
    answer: 'error code BUSINESS_REVIEW_NOT_PENDING for keep_separate and BUSINESS_INVALID_TARGET_NODE for merge_into, naming the node, HTTP 409 over REST'
  - &duplicate
    when: A uniqueness guard of the store refuses the write.
    answer: 'error code BUSINESS_TEMPORAL_INCOHERENT with message "A duplicate-guard index rejected the resolution; another row currently occupies this scope." and no details, HTTP 422 over REST'
  - *unavailable
  - *internal
- operation: merge-nodes
  accepted: 'HTTP 200 carrying, with no envelope, `{ survivor_id, absorbed_id, affected, action_id }`, `affected` as `{ links_repointed, attributes_repointed, aliases_copied, path_compressed_nodes }`; over MCP, `{ ok: true, result }` carrying the same'
  refusals:
  - rule: rules/knowledge-base/node-never-merged-into-itself
    answer: 'error code BUSINESS_SELF_MERGE_FORBIDDEN with message "survivor_id equals absorbed_id" and `details: { issues }` at path `absorbed_id`, HTTP 409 over REST'
  - rule: rules/knowledge-base/curation-reason-required
    answer: *format
  - rule: rules/knowledge-base/curation-reason-not-blank
    answer: *format
  - rule: rules/knowledge-base/curation-action-reason-length
    answer: *format
  - *body-format
  - &absent-node
    when: No knowledge node is held at the survivor's or the absorbed node's identity.
    answer: 'error code RESOURCE_NOT_FOUND naming the absent node as `missing_id`, the survivor checked first, HTTP 404 over REST'
  - rule: rules/knowledge-base/curation-refuses-deleted-node
    answer: *deleted
  - rule: rules/knowledge-base/merge-survivor-active
    answer: *survivor
  - rule: rules/knowledge-base/node-merge-absorbs-active-node
    answer: 'error code BUSINESS_INVALID_TARGET_NODE naming the absorbed node and its status, HTTP 422 over REST'
  - rule: rules/knowledge-base/merge-requires-same-node-type
    answer: *same-type
  - when: Another operation changed the absorbed node's status first.
    answer: 'error code BUSINESS_INVALID_TARGET_NODE naming the absorbed node, HTTP 409 over REST'
  - *duplicate
  - *unavailable
  - *internal
- operation: resolve-dispute
  accepted: 'HTTP 200 carrying, with no envelope, `{ item_kind, decision, items, action_id }`, each item `{ item_id, resulting_status, valid_from, valid_to }`, in the order of the periods for adjust_periods; over MCP, `{ ok: true, result }` carrying the same'
  refusals:
  - rule: rules/knowledge-base/dispute-resolution-distinct-items
    answer: *format
  - rule: rules/knowledge-base/curation-reason-required
    answer: *reason-required
  - rule: rules/knowledge-base/curation-reason-not-blank
    answer: 'error code BUSINESS_REASON_REQUIRED where the decision is prefer_one and VALIDATION_INVALID_FORMAT otherwise, with `details: { issues }`, HTTP 422 over REST'
  - rule: rules/knowledge-base/curation-action-reason-length
    answer: *format
  - rule: rules/knowledge-base/prefer-one-requires-winner
    answer: 'error code BUSINESS_DISPUTE_WINNER_REQUIRED with message "decision=prefer_one requires winner_id (member of item_ids)", HTTP 422 over REST'
  - rule: rules/knowledge-base/adjust-periods-one-per-item
    answer: 'error code BUSINESS_DISPUTE_PERIODS_REQUIRED with message "decision=adjust_periods requires periods[] (one entry per item_id)", HTTP 422 over REST'
  - rule: rules/knowledge-base/validity-start-before-end
    answer: 'error code BUSINESS_TEMPORAL_INCOHERENT with message "Adjusted periods violate `valid_from < valid_to` or overlap on a functional scope", HTTP 422 over REST'
  - rule: rules/knowledge-base/adjusted-periods-single-open
    answer: 'error code BUSINESS_TEMPORAL_INCOHERENT naming how many periods are left open, HTTP 422 over REST'
  - *body-format
  - when: No item of the named kind is held at one of the listed identities.
    answer: 'error code RESOURCE_NOT_FOUND naming the first absent identity in the order listed and the item kind, HTTP 404 over REST'
  - rule: rules/knowledge-base/dispute-resolution-requires-disputed-items
    answer: 'error code BUSINESS_ITEM_NOT_DISPUTED naming the offending item and its current status, HTTP 409 over REST'
  - rule: rules/knowledge-base/dispute-resolution-single-scope
    answer: 'error code BUSINESS_ITEM_NOT_DISPUTED with `details.scope_mismatch` true, HTTP 409 over REST'
  - when: Another operation moved one of the items out of disputed first.
    answer: 'error code BUSINESS_ITEM_NOT_DISPUTED naming the offending item, or how many items were reached and how many were expected, HTTP 409 over REST'
  - *duplicate
  - *unavailable
  - *internal
- operation: confirm-item
  accepted: 'HTTP 200 carrying, with no envelope, `{ item_kind, item_id, resulting_status: "active", action_id }`; over MCP, `{ ok: true, result }` carrying the same'
  refusals:
  - rule: rules/knowledge-base/curation-reason-not-blank
    answer: *format
  - rule: rules/knowledge-base/curation-action-reason-length
    answer: *format
  - *body-format
  - &absent-item
    when: No item of the named kind is held at the requested identity.
    answer: 'error code RESOURCE_NOT_FOUND naming the item and its kind, HTTP 404 over REST'
  - rule: rules/knowledge-base/confirmation-requires-uncertain
    answer: 'error code BUSINESS_ITEM_NOT_UNCERTAIN naming the item and its current status, HTTP 409 over REST'
  - when: Another operation changed the item's status first.
    answer: 'error code BUSINESS_ITEM_NOT_UNCERTAIN naming the item, HTTP 409 over REST'
  - *duplicate
  - *unavailable
  - *internal
- operation: reject-item
  accepted: 'HTTP 200 carrying, with no envelope, `{ item_kind, item_id, resulting_status: "deleted", action_id }`; over MCP, `{ ok: true, result }` carrying the same'
  refusals:
  - rule: rules/knowledge-base/curation-reason-required
    answer: *format
  - rule: rules/knowledge-base/curation-reason-not-blank
    answer: *format
  - rule: rules/knowledge-base/curation-action-reason-length
    answer: *format
  - *body-format
  - *absent-item
  - rule: rules/knowledge-base/rejection-and-correction-require-live-item
    answer: &not-deletable 'error code BUSINESS_ITEM_NOT_DELETABLE naming the item and its current status, HTTP 409 over REST'
  - &item-race
    when: Another operation changed the item's status first.
    answer: 'error code BUSINESS_ITEM_NOT_DELETABLE naming the item, HTTP 409 over REST'
  - *duplicate
  - *unavailable
  - *internal
- operation: correct-item
  accepted: 'HTTP 200 carrying, with no envelope, `{ item_kind, predecessor_id, new_item_id, action_id }`; over MCP, `{ ok: true, result }` carrying the same'
  refusals:
  - rule: rules/knowledge-base/curation-reason-required
    answer: *format
  - rule: rules/knowledge-base/curation-reason-not-blank
    answer: *format
  - rule: rules/knowledge-base/curation-action-reason-length
    answer: *format
  - rule: rules/knowledge-base/correction-changes-something
    answer: 'error code BUSINESS_CORRECTION_NO_CHANGES with message "corrected{} must change at least one of value, target_node_id, valid_from, valid_to", HTTP 422 over REST'
  - rule: rules/knowledge-base/correction-fits-assertion-kind
    answer: 'error code VALIDATION_INVALID_FORMAT with `details: { issues }` at path `corrected.value` or `corrected.target_node_id`, HTTP 422 over REST'
  - rule: rules/knowledge-base/stated-start-requires-basis
    answer: &unjustified 'error code BUSINESS_DATE_UNJUSTIFIED with message "valid_from change requires a justification (stated|document|received)", HTTP 422 over REST'
  - rule: rules/knowledge-base/corrected-stated-start-cites-fragment
    answer: *unjustified
  - rule: rules/knowledge-base/validity-start-before-end
    answer: 'error code BUSINESS_TEMPORAL_INCOHERENT, HTTP 422 over REST'
  - *body-format
  - *absent-item
  - rule: rules/knowledge-base/rejection-and-correction-require-live-item
    answer: *not-deletable
  - rule: rules/knowledge-base/correction-fragment-accepted
    answer: 'error code BUSINESS_DATE_UNJUSTIFIED naming the fragment, HTTP 422 over REST'
  - when: The attribute being corrected has no attribute key, or its key is not in the catalog.
    answer: 'error code BUSINESS_INVALID_ATTRIBUTE_VALUE naming the item or the key and the value, HTTP 422 over REST'
  - rule: rules/knowledge-base/attribute-value-parses
    answer: 'error code BUSINESS_INVALID_ATTRIBUTE_VALUE naming the value type and the value, HTTP 422 over REST'
  - rule: rules/knowledge-base/attribute-value-in-allowed-values
    answer: 'error code BUSINESS_INVALID_ATTRIBUTE_VALUE naming the attribute key, the value and the allowed values, an empty list where none is known, HTTP 422 over REST'
  - *item-race
  - *duplicate
  - *unavailable
  - *internal
---

## Description

The owner's curation surface: the review queues, the curation metrics, and the decisions that resolve entity matches, merge nodes, resolve disputes and confirm, reject or correct assertions.
