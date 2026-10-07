---
title: Entity listing screen
summary: The screen at /entities where the owner finds a knowledge node by name prefix and node type and opens it.
rationale: The scope names the listing as the first step of the screen and does not say how to cut it. I gave it its own epic because its one rule and its listing answer change independently of the form.
sources:
- intake/scope.md
covers:
- rules/entity-workspace/the-screen-lists-nodes-by-prefix-and-type
- contracts/entity-workspace/entity-screen
- rules/entity-workspace/the-screen-lives-at-the-entities-addresses
- contracts/entity-workspace/bff-entity-reads
- rules/application-shell/every-other-address-is-guarded
- rules/entity-workspace/the-node-listing-stands-without-the-node-types
- rules/entity-workspace/an-empty-narrowing-is-a-narrowing-not-given
- rules/entity-workspace/the-listing-request-carries-its-narrowings-by-name
- rules/entity-workspace/the-listing-and-page-states-read-their-wording
---
## What it is
The listing that shows the nodes the knowledge base lists, each with its name, type and status.
It can be narrowed by name prefix and node type, and it opens the node the owner picks.

## Notes
The scope decided that no header menu entry and no graph-panel button lead to /entities, so the screen is reached only by its address.
