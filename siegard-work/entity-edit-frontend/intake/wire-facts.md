# Wire facts for the entity workspace, supplied by the person from the backend session

The person pasted the backend session's answer and chose to adopt it as the fact this plan reads.
The four reads are fixed in the backend's code; the edit is the backend session's proposal, not yet committed there, and the person adopted it.

All operations sit under the prefix /api/v1, require the bearer token, and the four reads answer inside the envelope { ok: true, result }.

## list-node-types
GET /api/v1/node-types, no parameters.
200 { ok, result: { total, items: [{ id, name, description, version }] } }, ordered by name ascending.

## list-nodes
GET /api/v1/nodes?node_type=&name_prefix=&status=&limit=&offset=
- node_type: string 1..200, optional, the node type's name and not its id.
- name_prefix: string 1..200, optional.
- status: optional, the node status vocabulary.
- limit: integer 1..100, optional, default 20.
- offset: integer 0 or more, optional, default 0.
- An unknown parameter is refused with 422 VALIDATION_INVALID_FORMAT.
200 { ok, result: { total, limit, offset, items: [{ id, node_type, canonical_name, status, merged_into }] } }
Pagination is by limit and offset; there is no ordering parameter.

## read-node
GET /api/v1/nodes/{node_id}?as_of=&in_effect_only=&include_uncertain= (all query parameters optional).
200 { ok, result: { node, aliases, attributes } }
404 RESOURCE_NOT_FOUND, 410 BUSINESS_NODE_DELETED, 422 VALIDATION_INVALID_FORMAT.

## list-attribute-keys
GET /api/v1/attribute-keys?node_type= (node_type optional, string 1..200).
200 { ok, result: { total, items: [{ id, node_type, key, value_type, is_temporal, allows_multiple, requires_valid_from, description, version, valid_values? }] } }
Ordered by node type name, then key.

## edit-entity (the backend session's proposal, adopted by the person)
POST /api/v1/nodes/{node_id}/edit, the node identity in the path.
Body JSON { reason, changes: [{ attribute_key, kind, value, item_id, valid_from, valid_to }] }.
Refusals answer in the body { ok: false, error: { code, message, details } }.
A conflict answers with details { attribute_key, item_id }, item_id null where there is none.
The accepted answer is the one the entity-editing contract states: HTTP 200 with no envelope, { node_id, action_id, applied }.
Whether a field without a value travels as null or absent is not stated anywhere and remains open.

## Open points the backend session flagged
The exact names of the response item fields were read from the contract's prose and not checked against the backend's services.
Whether each valid_values entry carries a label and a sort_order is not stated by the retrieval contract; the backend session has this isolated as a contradiction in its own task about closed-key labels and order.
