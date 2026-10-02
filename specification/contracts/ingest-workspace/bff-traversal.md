---
type: api
direction: consumed
upstream: contracts/knowledge-base/retrieval
operations:
- traverse-node
answers:
- operation: traverse-node
  accepted: "GET /api/v1/nodes/{id}/traverse?depth=1&direction=both read through the { ok, result } envelope, whose result is read as starting_node_id, nodes each with id, node_type, canonical_name and status, and links each with id, source_node_id, target_node_id, link_type, link_type_label, is_temporal, is_in_effect, status and flags"
  refusals:
  - rule: "rules/ingest-workspace/failed-traversal-leaves-the-graph-as-it-was"
    answer: "the graph is left as it was and the assembly reports an error"
---

## Description

The traversal request the ingest screen makes for each affected node to assemble the graph of an ingestion.
