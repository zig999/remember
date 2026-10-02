---
type: invariant
statement: "A send answered 401 before the stream opens MUST fail like any other refusal, with no token refresh and no redirect to sign-in."
constrains:
- domain/chat-workspace/chat-session
---

## Description

None.
