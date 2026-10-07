---
type: invariant
statement: "While the node-type listing is being fetched or after it has failed, the screen MUST keep offering the name prefix and the node listing with no node-type narrowing, showing a loading indication in place of the node-type choice while it is fetched and, once it has failed, the could-not-load-types alert written in the description with an action that fetches the node-type listing again."
constrains:
- domain/entity-workspace/entity-edit-session
---

## Description

The could-not-load-types alert reads "Não foi possível carregar os tipos de nó. Tente novamente.", ending as written, and carries no code or message of the failure's own.
This rule covers only what the screen shows in place of the node-type choice while the node-type listing is pending or failed, and that the node listing stays offered meanwhile.
rules/entity-workspace/the-screen-lists-nodes-by-prefix-and-type decides which nodes the screen lists and opens.
rules/entity-workspace/the-listing-request-carries-its-narrowings-by-name decides how the node listing request carries a narrowing and leaves out one not given.
contracts/entity-workspace/entity-screen decides what the screen shows while the node listing itself is fetched, fails or holds no node.
contracts/entity-workspace/bff-entity-reads decides how the node-type listing request reports each failure.
