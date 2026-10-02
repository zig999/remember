---
type: api
direction: consumed
upstream: contracts/knowledge-base/retrieval
operations:
- read-node
- read-link-history
- read-attribute-history
- read-link-provenance
- read-attribute-provenance
- read-fragment-provenance
- list-accepted-fragments
answers:
- operation: read-node
  accepted: "GET /api/v1/nodes/{id} with the id path-encoded, read through the { ok, result } envelope as node (id, node_type, canonical_name, status and an optional merged_into_node_id), aliases (id, alias, kind and an optional created_at) and attributes (id, node_id, attribute_key, value_type, value, valid_from, valid_to, recorded_at, superseded_at, status, effective_status, is_current, is_in_effect, confidence and the optional valid_from_source, flags and supersedes_attribute_id)"
- operation: read-link-history
  accepted: "GET /api/v1/links/{id}/history read as versions each with id, source_node_id, target_node_id, link_type, link_inverse_name, valid_from, valid_to, recorded_at, superseded_at, status, effective_status, is_current, is_in_effect, confidence and the optional valid_from_source and supersedes_link_id"
- operation: read-attribute-history
  accepted: "GET /api/v1/attributes/{id}/history read as versions each shaped as an attribute of the node detail"
- operation: read-link-provenance
  accepted: "GET /api/v1/provenance/links/{id} read as fragments each with id, text, confidence, status and chunks, each chunk with id, chunk_index, offset_start, offset_end, excerpt, an optional locator and its raw information (id, source_type, received_at and optional metadata)"
- operation: read-attribute-provenance
  accepted: "GET /api/v1/provenance/attributes/{id} read as the link provenance is read"
- operation: read-fragment-provenance
  accepted: "GET /api/v1/provenance/fragments/{id} read as the link provenance is read"
- operation: list-accepted-fragments
  accepted: "GET /api/v1/fragments/accepted with llm_run_id, raw_information_id, limit and offset sent only when given, read as total, limit, offset and items each with fragment_id, text, confidence, llm_run_id, created_at and a source (raw_information_id, chunk_index, source_type, received_at and an optional document_title)"
---

## Description

The reads of the knowledge base the curation screen makes to show evidence and history.
