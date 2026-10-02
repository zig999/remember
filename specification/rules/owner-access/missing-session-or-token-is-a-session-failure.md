---
type: invariant
statement: A sign-in failure MUST be classified as session when the identity provider holds no session for the owner or answers the token request without a usable access token.
constrains:
- domain/owner-access/sign-in-attempt
- domain/owner-access/sign-in-failure-kind
---

## Description

None.
