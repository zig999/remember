---
type: invariant
statement: A sign-in failure MUST be shown to the owner only as the message of its failure kind, never as a message of the identity provider.
constrains:
- domain/owner-access/sign-in-attempt
- domain/owner-access/sign-in-failure-kind
---

## Description

None.
