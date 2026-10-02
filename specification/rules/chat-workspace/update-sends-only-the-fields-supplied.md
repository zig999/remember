---
type: invariant
statement: "An update MUST carry title only when supplied, a null title as null, and archived_at only when supplied, a timestamp archiving and null un-archiving, and with neither it MUST still send an empty body."
constrains:
- domain/chat-workspace/chat-session
---

## Description

None.
