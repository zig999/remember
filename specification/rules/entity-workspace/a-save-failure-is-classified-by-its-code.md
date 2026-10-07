---
type: invariant
statement: "A failed save MUST count as an edit that could not be sent for SYSTEM_TIMEOUT, SYSTEM_ABORTED and SYSTEM_NETWORK, as a refusal of the edit for SYSTEM_INVALID_RESPONSE, SYSTEM_UPSTREAM and SYSTEM_UNKNOWN, and as neither for AUTH_SESSION_EXPIRED, whose typed values are not kept."
constrains:
- domain/entity-workspace/entity-edit-session
---

## Description

Which of the two save failures the entity form treats each failure of the edit request as, and what happens to the typed values when the session cannot be refreshed.
The save-edit answers of contracts/entity-workspace/entity-screen decide what the screen shows for a refusal and for an edit that could not be sent.
contracts/entity-workspace/bff-entity-edit decides how the request reports each failure.
rules/entity-workspace/a-conflict-keeps-the-typed-values decides how a conflict is treated.
rules/application-shell/a-failed-refresh-ends-the-session decides how the page is replaced when the session ends.
