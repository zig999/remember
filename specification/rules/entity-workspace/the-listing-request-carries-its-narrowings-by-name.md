---
type: invariant
statement: "The screen MUST request the node listing with the name prefix in the query parameter name_prefix and the node type, by its name rather than its identity, in the query parameter node_type, and MUST leave out of the request each narrowing the owner has not given."
constrains:
- domain/entity-workspace/entity-edit-session
---

## Description

This rule covers how the screen's node listing request carries its two narrowings. Which nodes the screen lists and opens is set by rules/entity-workspace/the-screen-lists-nodes-by-prefix-and-type. How the knowledge base matches a name prefix is set by rules/knowledge-base/node-listing-name-prefix.
