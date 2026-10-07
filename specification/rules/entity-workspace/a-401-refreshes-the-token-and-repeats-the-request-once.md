---
type: invariant
statement: "Every read and every edit the entity workspace makes of the knowledge base that is answered 401 on its first attempt MUST start one token refresh and, when the refresh succeeds, be sent once more with the new token, the same options and a fresh cutoff of 30000 milliseconds, without the repeated request ever starting a second refresh."
constrains:
- domain/entity-workspace/entity-edit-session
---

## Description

This rule covers what happens when the knowledge base answers 401 to the first attempt of a request the entity workspace sends through the bff-entity-reads and bff-entity-edit contracts.
It does not decide what a failed refresh does to the stored token and the page. rules/application-shell/a-failed-refresh-ends-the-session decides that.
It does not decide how a 401 on the repeated request is reported. contracts/entity-workspace/bff-entity-reads and contracts/entity-workspace/bff-entity-edit decide that.
