---
type: invariant
statement: "The first unauthorized answer to an ingestion request MUST obtain a new access token from the identity provider, store it and resend the request once with it."
constrains:
- domain/ingest-workspace/ingest-session
---

## Description

None.
