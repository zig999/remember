---
type: api
direction: consumed
upstream: contracts/knowledge-base/retrieval
operations:
- list-node-types
- list-nodes
- read-node
- list-attribute-keys
answers:
- operation: list-node-types
  accepted: "GET /api/v1/node-types with no query parameter"
  refusals:
  - rule: "rules/application-shell/a-request-is-judged-in-a-fixed-order"
    answer: "the failure the application's request helper gives for it, with the status, code, message and details that the rules of the application shell state"
- operation: list-nodes
  accepted: "GET /api/v1/nodes"
  refusals:
  - rule: "rules/application-shell/a-request-is-judged-in-a-fixed-order"
    answer: "the failure the application's request helper gives for it, with the status, code, message and details that the rules of the application shell state"
- operation: read-node
  accepted: "GET /api/v1/nodes/{node_id} with the node id URL-encoded in the path and no query parameter"
  refusals:
  - rule: "rules/application-shell/a-request-is-judged-in-a-fixed-order"
    answer: "the failure the application's request helper gives for it, with the status, code, message and details that the rules of the application shell state"
- operation: list-attribute-keys
  accepted: "GET /api/v1/attribute-keys with the node type named by its name in the node_type query parameter, read through the { ok, result } envelope as total and items, the items ordered by node type name and then by key"
  refusals:
  - rule: "rules/application-shell/a-request-is-judged-in-a-fixed-order"
    answer: "the failure the application's request helper gives for it, with the status, code, message and details that the rules of the application shell state"
---

## Description

The reads the entity workspace makes of the knowledge base: the node types, the nodes, one node with its attributes and the catalog's attribute keys with their closed values.
Every read goes through the application's request helper, so every failure of a read is the failure that helper gives, and this contract states no failure of its own.
