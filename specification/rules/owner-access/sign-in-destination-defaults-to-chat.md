---
type: invariant
statement: After a successful sign-in the owner MUST be taken to the destination the address requested in its redirect parameter, or to /chat when the address requested none or one that is not a valid sign-in destination.
constrains:
- domain/owner-access/sign-in-attempt
- domain/owner-access/sign-in-destination
---

## Description

None.
