---
type: invariant
statement: "The entity listing MUST live at /entities and the form for one knowledge node at /entities/{node identity}, the code of each of these two pages being fetched only when its address is first opened and never with the application's initial load."
constrains:
- domain/entity-workspace/entity-edit-session
---

## Description

This rule sets the two addresses of the entity workspace, and when the code of each of its two pages is fetched. It does not decide the guarded layout these addresses sit under (rules/application-shell/every-other-address-is-guarded decides that). It does not decide the addresses of the other areas (rules/application-shell/the-areas-live-at-fixed-addresses decides those). It does not decide which areas the header lists (rules/application-shell/the-header-lists-six-areas decides that).
