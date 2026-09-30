---
type: api
direction: published
operations:
- compliance-delete
- list-compliance-deletions
- read-compliance-deletion
- list-curation-actions
- read-curation-action
answers:
- operation: compliance-delete
  accepted: 'HTTP 201 carrying outcome deleted and the compliance deletion just recorded, or HTTP 200 carrying outcome noop_already_deleted and the latest compliance deletion on record for the raw information, each deletion with its identity, raw information, reason, execution time as an ISO-8601 timestamp and its chunk, fragment, link and attribute counts, ignoring any field the request does not define; over MCP, `{ ok: true, result }` carrying the same outcome and deletion'
  refusals:
  - when: The request omits the raw information or the reason.
    answer: 'error code VALIDATION_REQUIRED_FIELD with message "Field ''<path>'' is required.", listing each failing field with its path and message, HTTP 422 over REST'
  - rule: rules/knowledge-base/compliance-deletion-reason-length
    answer: 'error code VALIDATION_OUT_OF_RANGE with message "Field ''reason'' must be non-empty after trim and ≤ 1000 characters.", listing each failing field with its path and message, HTTP 422 over REST'
  - when: The named raw information is not a well-formed identifier, or a field is null or of the wrong type.
    answer: 'error code VALIDATION_INVALID_FORMAT with message "Request payload failed validation.", listing each failing field with its path and message, HTTP 422 over REST'
  - when: No raw information is held at the requested identity.
    answer: 'error code RESOURCE_NOT_FOUND with message "RawInformation <id> not found.", naming the entity raw_information and the identity, HTTP 404 over REST'
  - when: The raw information is already deleted and no compliance deletion of it is on record.
    answer: 'error code SYSTEM_INTERNAL_ERROR with message "Unexpected internal error.", naming the raw information, HTTP 500 over REST'
  - when: Marking the raw information deleted reaches other than exactly that one raw information.
    answer: 'error code SYSTEM_INTERNAL_ERROR with message "Unexpected internal error.", naming the raw information and how many were reached, HTTP 500 over REST'
  - when: The deletion fails over MCP for any other cause.
    answer: error code SYSTEM_INTERNAL_ERROR with message "Unexpected internal error.", withholding the cause
- operation: list-compliance-deletions
  accepted: HTTP 200 carrying the total, the limit, the offset and the page of compliance deletions, each with its identity, raw information, reason, execution time as an ISO-8601 timestamp and its chunk, fragment, link and attribute counts, ignoring any query parameter the request does not define
  refusals:
  - &window
    rule: rules/knowledge-base/audit-window-ordered
    answer: 'HTTP 422, error code VALIDATION_OUT_OF_RANGE with message "Time range bounds must satisfy `from < to`.", listing each failing field with its path and message'
  - &limit
    rule: rules/knowledge-base/page-limit-bounds
    answer: 'HTTP 422, error code VALIDATION_INVALID_FORMAT with message "Request payload failed validation.", listing each failing field with its path and message'
  - &offset
    rule: rules/knowledge-base/page-offset-non-negative
    answer: 'HTTP 422, error code VALIDATION_INVALID_FORMAT with message "Request payload failed validation.", listing each failing field with its path and message'
  - when: The named raw information is not a well-formed identifier, a window bound is not a date-time carrying a time zone, or the limit or offset is not an integer.
    answer: 'HTTP 422, error code VALIDATION_INVALID_FORMAT with message "Request payload failed validation.", listing each failing field with its path and message'
- operation: read-compliance-deletion
  accepted: HTTP 200 carrying the compliance deletion with its identity, raw information, reason, execution time as an ISO-8601 timestamp and its chunk, fragment, link and attribute counts
  refusals:
  - &malformed-id
    when: The requested identity is not a well-formed identifier.
    answer: 'HTTP 422, error code VALIDATION_INVALID_FORMAT with message "Request payload failed validation.", listing each failing field with its path and message'
  - when: No compliance deletion is held at the requested identity.
    answer: 'HTTP 404, error code RESOURCE_NOT_FOUND with message "ComplianceDeletion <id> not found.", naming the entity compliance_deletion and the identity'
- operation: list-curation-actions
  accepted: HTTP 200 carrying the total, the limit, the offset and the page of curation actions, each with its identity, action, target kind, target identity or null, payload, an empty object where none is held, reason or null and creation time as an ISO-8601 timestamp, ignoring any query parameter the request does not define
  refusals:
  - *window
  - *limit
  - *offset
  - when: The named target is not a well-formed identifier, a window bound is not a date-time carrying a time zone, the limit or offset is not an integer, or the action or target kind is outside its closed set.
    answer: 'HTTP 422, error code VALIDATION_INVALID_FORMAT with message "Request payload failed validation.", listing each failing field with its path and message'
- operation: read-curation-action
  accepted: HTTP 200 carrying the curation action with its identity, action, target kind, target identity or null, payload, an empty object where none is held, reason or null and creation time as an ISO-8601 timestamp
  refusals:
  - *malformed-id
  - when: No curation action is held at the requested identity.
    answer: 'HTTP 404, error code RESOURCE_NOT_FOUND with message "CurationAction <id> not found.", naming the entity curation_action and the identity'
---

## Description

The owner's surface for deleting a raw information for compliance and for reading the compliance deletions and curation actions on record.
