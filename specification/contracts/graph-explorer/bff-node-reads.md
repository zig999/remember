---
type: api
direction: consumed
upstream: contracts/knowledge-base/retrieval
operations:
- read-node
- traverse
- read-link-provenance
- read-attribute-provenance
answers:
- operation: read-node
  accepted: "GET /api/v1/nodes/{id} with the id URL-encoded, read through the { ok, result } envelope as node, aliases and attributes"
  refusals:
  - when: "The request fails."
    answer: "the failure the request helper raises, with its code, unchanged"
- operation: traverse
  accepted: "GET /api/v1/nodes/{id}/traverse?depth=1&direction=both read as starting_node_id, nodes and links, each link with its inverse name, effective status and confidence"
  refusals:
  - when: "The request fails."
    answer: "the failure the request helper raises, with its code, unchanged"
- operation: read-link-provenance
  accepted: "GET /api/v1/provenance/links/{id} with the id URL-encoded, read as fragments with their chunks and raw information"
  refusals:
  - when: "The request fails."
    answer: "the failure the request helper raises, with its code, unchanged"
- operation: read-attribute-provenance
  accepted: "GET /api/v1/provenance/attributes/{id} with the id URL-encoded, read as fragments with their chunks and raw information"
  refusals:
  - when: "The request fails."
    answer: "the failure the request helper raises, with its code, unchanged"
---

## Description

The node, relationship and origin reads the node detail panel makes against the knowledge base.
