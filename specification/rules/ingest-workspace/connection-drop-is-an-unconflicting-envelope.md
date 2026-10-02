---
type: invariant
statement: "An extraction failure MUST count as a connection drop when it is a failure envelope whose status is neither 409 nor 422 and whose code is not SYSTEM_LLM_PROVIDER_UNAVAILABLE, AUTH_SESSION_EXPIRED or SYSTEM_ABORTED."
constrains:
- domain/ingest-workspace/ingest-session
- domain/ingest-workspace/ingest-failure
---

## Description

None.
