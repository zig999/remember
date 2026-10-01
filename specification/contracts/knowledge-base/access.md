---
type: api
direction: published
operations:
- authenticate-owner
- route-request
- read-health
answers:
- operation: authenticate-owner
  accepted: the request proceeds as the owner, identified by the token's `sub` claim, or as `local-operator` for the local operator token
  refusals:
  - when: The Authorization header is absent or not `Bearer <token>`.
    answer: HTTP 401, error code AUTH_UNAUTHORIZED with message "Missing or malformed Authorization header (expected `Bearer <jwt>`)." and no details
  - when: The token has expired.
    answer: HTTP 401, error code AUTH_TOKEN_EXPIRED with message "Authentication token expired." and no details
  - when: 'The token fails verification: a bad signature, a malformed token, a failed claim, a disallowed algorithm, no matching key or a key set that cannot be fetched.'
    answer: HTTP 401, error code AUTH_TOKEN_INVALID with message "Invalid authentication token." and no details
  - when: The verified token names no owner in its `sub` claim.
    answer: HTTP 401, error code AUTH_TOKEN_INVALID with message "JWT missing required `sub` claim." and no details
- operation: route-request
  accepted: the request reaches the operation it names, whose own contract answers it
  refusals:
  - when: No operation is served at the method and path.
    answer: HTTP 404, error code RESOURCE_NOT_FOUND with the framework's message
  - when: The request fails the validation of the operation it names.
    answer: HTTP 422, error code VALIDATION_INVALID_FORMAT with message "Request payload failed validation." and `details` a bare list of `{ path, message }`, each path joined by "."
  - when: The framework refuses the request with status 401, 403 or 409.
    answer: that status, with error code AUTH_UNAUTHORIZED, AUTH_FORBIDDEN or RESOURCE_CONFLICT respectively and the framework's message
  - when: The framework refuses the request with another status below 500.
    answer: that status, with error code SYSTEM_INTERNAL_ERROR and the framework's message
  - when: The framework fails the request with status 503.
    answer: HTTP 503, error code SYSTEM_SERVICE_UNAVAILABLE with message "Internal server error."
  - when: The framework fails the request with another status of 500 or above.
    answer: that status, with error code SYSTEM_INTERNAL_ERROR and message "Internal server error."
  - when: The store is unreachable or a statement times out.
    answer: HTTP 503, error code SYSTEM_SERVICE_UNAVAILABLE with message "A backing service is temporarily unavailable."
  - when: The request fails for any other cause.
    answer: HTTP 500, error code SYSTEM_INTERNAL_ERROR with message "Internal server error.", withholding the cause
- operation: read-health
  accepted: the health report `{ ok, service, database, checked_at }` with `service` "remember-bff", `database` "ok" or "unreachable", `ok` true exactly when the store answered, and `checked_at` an ISO-8601 UTC time; the same report over REST and as the `health` tool
---

## Description

The answers every request can receive before or apart from the operation it names: the owner's authentication, the routing and validation of a request, and the health probe.
Every other contract's answers apply once a request has passed through these.
