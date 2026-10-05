---
type: api
direction: published
operations:
- search
- read-link-provenance
- read-attribute-provenance
- read-fragment-provenance
- list-accepted-fragments
- list-node-types
- list-link-types
- list-attribute-keys
- list-nodes
- read-node
- read-link
- read-attribute
- read-link-history
- read-attribute-history
- read-attribute-key-history
- traverse
answers:
- operation: search
  accepted: '`{ ok: true, result }` carrying the page of ranked search items, each knowledge node matched directly showing whether it matched exactly or approximately and the similarity of an approximate match, each supporting fragment shown with its text, confidence, raw information, source type, reception time and chunk excerpt, and the total before pagination'
  refusals:
  - &id001
    when: The request carries no valid owner authentication.
    answer: HTTP 401, error code AUTH_UNAUTHORIZED, AUTH_TOKEN_INVALID or AUTH_TOKEN_EXPIRED
  - rule: rules/knowledge-base/search-query-not-blank
    answer: HTTP 422, error code VALIDATION_INVALID_FORMAT
  - when: The request names a parameter the search does not define.
    answer: HTTP 422, error code VALIDATION_INVALID_FORMAT
  - rule: rules/knowledge-base/search-query-length
    answer: HTTP 422, error code VALIDATION_INVALID_FORMAT
  - rule: rules/knowledge-base/search-query-must-parse
    answer: HTTP 422, error code BUSINESS_INVALID_SEARCH_QUERY
  - rule: rules/knowledge-base/search-layer-outside-set-refused
    answer: HTTP 422, error code BUSINESS_INVALID_SEARCH_LAYER, naming the allowed layers
  - rule: rules/knowledge-base/unknown-link-type-refused
    answer: HTTP 422, error code BUSINESS_UNKNOWN_LINK_TYPE
  - rule: rules/knowledge-base/expansion-depth-bounds
    answer: HTTP 422, error code VALIDATION_INVALID_FORMAT
  - when: The as-of date is not a calendar date written as year-month-day.
    answer: HTTP 422, error code VALIDATION_INVALID_FORMAT
  - &id005
    rule: rules/knowledge-base/page-limit-bounds
    answer: HTTP 422, error code VALIDATION_INVALID_FORMAT
  - &id006
    rule: rules/knowledge-base/page-offset-non-negative
    answer: HTTP 422, error code VALIDATION_INVALID_FORMAT
- operation: read-link-provenance
  accepted: '`{ ok: true, result }` listing the provenance fragments, each with its text, confidence and status and the raw chunks it came from, each chunk with its index, offsets, excerpt, locator and raw information (source type, reception time, metadata, original input)'
  refusals:
  - *id001
  - &id002
    when: The requested identity is not a well-formed identifier.
    answer: HTTP 422, error code VALIDATION_INVALID_FORMAT
  - when: No knowledge link is held at the requested identity.
    answer: HTTP 404, error code RESOURCE_NOT_FOUND
  - &id003
    rule: rules/knowledge-base/provenance-refused-after-compliance-deletion
    answer: HTTP 410, error code BUSINESS_RAW_INFORMATION_DELETED, naming the earliest compliance deletion
  - &id004
    rule: rules/knowledge-base/empty-provenance-chain-refused
    answer: HTTP 500, error code SYSTEM_INTERNAL_ERROR
- operation: read-attribute-provenance
  accepted: '`{ ok: true, result }` listing the provenance fragments, each with its text, confidence and status and the raw chunks it came from, each chunk with its index, offsets, excerpt, locator and raw information (source type, reception time, metadata, original input)'
  refusals:
  - *id001
  - *id002
  - when: No node attribute is held at the requested identity.
    answer: HTTP 404, error code RESOURCE_NOT_FOUND
  - *id003
  - *id004
- operation: read-fragment-provenance
  accepted: '`{ ok: true, result }` listing the provenance fragments, each with its text, confidence and status and the raw chunks it came from, each chunk with its index, offsets, excerpt, locator and raw information (source type, reception time, metadata, original input)'
  refusals:
  - *id001
  - *id002
  - when: No information fragment is held at the requested identity.
    answer: HTTP 404, error code RESOURCE_NOT_FOUND
  - rule: rules/knowledge-base/provenance-requires-accepted-fragment
    answer: HTTP 404, error code BUSINESS_FRAGMENT_NOT_ACCEPTED
  - *id003
  - *id004
- operation: list-accepted-fragments
  accepted: '`{ ok: true, result }` carrying the page of accepted fragments, each with its text, confidence, LLM run, creation time and source (raw information, chunk index, source type, reception time, document title)'
  refusals:
  - *id001
  - rule: rules/knowledge-base/listing-requires-a-filter
    answer: HTTP 422, error code VALIDATION_INVALID_FORMAT, naming the two filters of which one is required
  - when: A named LLM run or raw information is not a well-formed identifier.
    answer: HTTP 422, error code VALIDATION_INVALID_FORMAT, naming the offending filter
  - rule: rules/knowledge-base/accepted-fragment-listing-refuses-unknown-parameter
    answer: HTTP 422, error code VALIDATION_INVALID_FORMAT, listing each failing field with its path and message
  - *id005
  - *id006
- operation: list-node-types
  accepted: '`{ ok: true, result }` carrying `total`, the number of items, and `items`: every node type with its identity, name, description and version'
  refusals:
  - *id001
  - &id007
    when: 'A parameter is malformed or unknown: an identity that is not a well-formed identifier, a switch other than true or false, a number that is not an integer, an as-of date not written as year-month-day, a name outside 1 to 200 characters, a value outside its closed set, or a parameter the operation does not define.'
    answer: HTTP 422, error code VALIDATION_INVALID_FORMAT with message "Request payload failed validation.", listing each failing field with its path and message
  - &id008
    when: The store is unavailable, reached over MCP.
    answer: error code SYSTEM_SERVICE_UNAVAILABLE with message "A backing service is temporarily unavailable."
  - &id009
    when: The read fails over MCP for any other cause, a stored status or source type outside its closed set included.
    answer: error code SYSTEM_INTERNAL_ERROR with message "Internal server error." and no details, withholding the cause
- operation: list-link-types
  accepted: '`{ ok: true, result }` carrying `total` and `items`: every link type with its identity, name, label, description, inverse name, whether it is temporal, allows multiple current links, requires a validity start and requires a validity end on change, and its version, and, when rules are asked for, its `rules`, each with its identity, source and target node-type names and validity start and end as year-month-day or null, an empty list for a link type with none'
  refusals:
  - *id001
  - *id007
  - *id008
  - *id009
- operation: list-attribute-keys
  accepted: '`{ ok: true, result }` carrying `total` and `items`: every attribute key with its identity, node-type name, key, value type, whether it is temporal, allows multiple current values and requires a validity start, its description and version, and `valid_values` only for a key the catalog closes'
  refusals:
  - *id001
  - *id007
  - &id010
    rule: rules/knowledge-base/node-type-filter-in-catalog
    answer: HTTP 422, error code BUSINESS_UNKNOWN_NODE_TYPE naming the node type
  - *id008
  - *id009
- operation: list-nodes
  accepted: '`{ ok: true, result }` carrying `total`, the `limit` and `offset` as requested, and `items`: the page of node summaries, each with its identity, node-type name, canonical name, status and the knowledge node it was merged into or null'
  refusals:
  - *id001
  - *id007
  - *id010
  - rule: rules/knowledge-base/page-limit-bounds
    answer: HTTP 422, error code VALIDATION_INVALID_FORMAT
  - rule: rules/knowledge-base/page-offset-non-negative
    answer: HTTP 422, error code VALIDATION_INVALID_FORMAT
  - *id008
  - *id009
- operation: read-node
  accepted: '`{ ok: true, result }` carrying `node`, its node summary, `aliases`, each with its identity, alias, kind and creation time, and `attributes`, each carrying the attribute detail: its identity, knowledge node, attribute-key name, value type and value, validity start and end as year-month-day or null, recording and supersession times, status, effective status, whether it is current and in effect, confidence, validity-start basis, flags, the attribute it supersedes, and its provenance entries as a link detail carries them'
  refusals:
  - *id001
  - *id007
  - &id011
    when: No knowledge node is held at the requested identity.
    answer: HTTP 404, error code RESOURCE_NOT_FOUND naming the entity and identity, and over REST also the requested node
  - &id012
    rule: rules/knowledge-base/deleted-node-read-refused
    answer: HTTP 410, error code BUSINESS_NODE_DELETED naming the node
  - *id008
  - *id009
- operation: read-link
  accepted: 'HTTP 200 carrying `{ ok: true, result }` with the link detail: its identity, source and target knowledge nodes, link-type name and inverse name, validity start and end as year-month-day or null, recording and supersession times, status, effective status, whether it is current and in effect, confidence, validity-start basis, flags, the link it supersedes, and its provenance entries, each with the fragment''s identity, text and confidence, the raw information, its source type and reception time, and the chunk excerpt'
  refusals:
  - *id001
  - &id099
    when: 'A parameter is malformed or unknown: an identity that is not a well-formed identifier, a switch other than true or false, a number that is not an integer, an as-of date not written as year-month-day, a name outside 1 to 200 characters, a value outside its closed set, or, over MCP only, a parameter the operation does not define.'
    answer: HTTP 422, error code VALIDATION_INVALID_FORMAT with message "Request payload failed validation.", listing each failing field with its path and message
  - when: No knowledge link is held at the requested identity.
    answer: HTTP 404, error code RESOURCE_NOT_FOUND naming the entity and identity and the requested link
- operation: read-attribute
  accepted: 'HTTP 200 carrying `{ ok: true, result }` with the attribute detail: its identity, knowledge node, attribute-key name, value type and value, validity start and end as year-month-day or null, recording and supersession times, status, effective status, whether it is current and in effect, confidence, validity-start basis, flags, the attribute it supersedes, and its provenance entries as a link detail carries them'
  refusals:
  - *id001
  - *id099
  - when: No node attribute is held at the requested identity.
    answer: HTTP 404, error code RESOURCE_NOT_FOUND naming the entity and identity and the requested attribute
- operation: read-link-history
  accepted: '`{ ok: true, result }` carrying `versions`, each a link detail as read-link answers it'
  refusals:
  - *id001
  - *id099
  - when: No knowledge link is held at the requested identity.
    answer: HTTP 404, error code RESOURCE_NOT_FOUND naming the entity and identity, and over REST also the requested link
  - *id008
  - *id009
- operation: read-attribute-history
  accepted: '`{ ok: true, result }` carrying `versions`, each an attribute detail as read-attribute answers it'
  refusals:
  - *id001
  - *id099
  - when: No node attribute is held at the requested identity.
    answer: HTTP 404, error code RESOURCE_NOT_FOUND naming the entity and identity, and over REST also the requested attribute
  - *id008
  - *id009
- operation: read-attribute-key-history
  accepted: '`{ ok: true, result }` carrying `versions`, each an attribute detail as read-attribute answers it, an empty list when the knowledge node holds none for the key'
  refusals:
  - *id001
  - *id099
  - *id011
  - *id012
  - rule: rules/knowledge-base/attribute-key-history-requires-registered-key
    answer: HTTP 404, error code BUSINESS_UNKNOWN_ATTRIBUTE_KEY naming the node type and key, and over REST also the requested node and key
  - *id008
  - *id009
- operation: traverse
  accepted: '`{ ok: true, result }` carrying `starting_node_id`, the knowledge node the traversal started from, `nodes` as node summaries, and `links`, each a link detail as read-link answers it with its `hop` and `score`'
  refusals:
  - *id001
  - when: 'A parameter is malformed or unknown: an identity that is not a well-formed identifier, a switch other than true or false, a depth that is not a number, an as-of date not written as year-month-day, an empty link-type name, a direction outside out, in and both, or a parameter the operation does not define.'
    answer: HTTP 422, error code VALIDATION_INVALID_FORMAT with message "Request payload failed validation.", listing each failing field with its path and message
  - rule: rules/knowledge-base/expansion-depth-bounds
    answer: HTTP 422, error code BUSINESS_INVALID_TRAVERSE_DEPTH naming the depth and the maximum of 3, and over REST also the requested node
  - rule: rules/knowledge-base/unknown-link-type-refused
    answer: HTTP 422, error code BUSINESS_UNKNOWN_LINK_TYPE naming the link type, and over REST also the requested node
  - *id011
  - *id012
  - *id008
  - *id009
---

## Description

The owner's read surface over the knowledge base: search, the three provenance reads, the accepted-fragment listing, the catalog listings, the node listing, and the graph reads.
