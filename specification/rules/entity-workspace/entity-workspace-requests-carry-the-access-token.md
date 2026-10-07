---
type: invariant
statement: "Every read and every edit the entity workspace makes of the knowledge base MUST carry the owner's access token as a bearer in the Authorization header."
constrains:
- domain/entity-workspace/entity-edit-session
---

## Description

This rule covers the requests the entity workspace sends through the bff-entity-reads and bff-entity-edit contracts, and the header each one carries. It does not cover what such a request does when the application holds no token.
