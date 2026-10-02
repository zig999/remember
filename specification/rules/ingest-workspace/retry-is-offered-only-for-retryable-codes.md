---
type: invariant
statement: "A failure MUST offer a retry only when its code is SYSTEM_LLM_PROVIDER_UNAVAILABLE, SYSTEM_INTERNAL_ERROR, SYSTEM_UPSTREAM, SYSTEM_TIMEOUT, SYSTEM_NETWORK or RUN_FAILED."
constrains:
- domain/ingest-workspace/ingest-failure
---

## Description

None.
