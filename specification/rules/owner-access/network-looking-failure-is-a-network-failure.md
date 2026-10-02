---
type: invariant
statement: A sign-in failure that did not come out of the exchange with the identity provider MUST be classified as network when it is a type error or its message mentions a failed fetch or the network.
constrains:
- domain/owner-access/sign-in-attempt
- domain/owner-access/sign-in-failure-kind
---

## Description

None.
