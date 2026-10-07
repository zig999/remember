---
type: invariant
statement: "The screen MUST treat an empty name prefix or an empty node type as a narrowing the owner has not given in the node listing request."
constrains:
- domain/entity-workspace/entity-edit-session
---

## Description

This rule covers when the name prefix or the node type the owner leaves empty counts as a narrowing of the node listing. It does not set which query parameters carry the narrowings, or that a narrowing not given is left out of the request. rules/entity-workspace/the-listing-request-carries-its-narrowings-by-name sets both. Which nodes the screen lists and opens is set by rules/entity-workspace/the-screen-lists-nodes-by-prefix-and-type.
