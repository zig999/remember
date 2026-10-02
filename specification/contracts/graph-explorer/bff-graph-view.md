---
type: api
direction: consumed
upstream: contracts/chat/conversations
operations:
- read-graph-view
- save-graph-view
answers:
- operation: read-graph-view
  accepted: "GET /api/v1/conversations/{id}/graph with the id URL-encoded, answered with a saved view or null"
  refusals:
  - when: "The request fails."
    answer: "nothing shown to the owner and the pane left as it was"
- operation: save-graph-view
  accepted: "PUT /api/v1/conversations/{id}/graph with a JSON body holding the version, nodes, links, positions, pinned nodes and layout algorithm"
  refusals:
  - when: "The request fails."
    answer: "nothing shown to the owner and no retry"
---

## Description

The saved graph view the pane reads when a conversation opens and writes when the graph changes.
