---
target: frontend
title: Node read and catalog attribute-key reads of the entities feature
summary: Two query hooks, useNodeRead and useAttributeKeys, read one node with its aliases and attributes and the catalog's attribute keys for a node type, through the existing entityGet wrapper, mapping the wire to domain types.
task: sha256:8a659916b1ddc3eae8e2bc272009d36f581fb1dd783344f2b1bea8359b38cf96
standard:
  at: ../standards/frontend-react.yaml
  pin: sha256:2b03615161995450265523de6bdd9c464b2ca633976e832e36586c1ab1aa2cf7
run: run/knowledge-base-client-node-and-catalog-reads-build
files:
- path: src/features/entities/api/node.hooks.ts
  effect: 'new: useNodeRead(nodeId) sends GET /api/v1/nodes/{encodeURIComponent(nodeId)} with no query string through entityGet and maps the answer with toNodeRead under the key entityKeys.node(nodeId).'
- path: src/features/entities/api/catalog.hooks.ts
  effect: 'new: useAttributeKeys(nodeType) sends GET /api/v1/attribute-keys?node_type=<name> through entityGet and maps the items with toAttributeKeys in wire order, and the query is disabled while nodeType is null or empty.'
- path: src/features/entities/api/_transforms.ts
  effect: 'extended: adds toNodeSummary, toNodeAlias, toNodeAttribute, toNodeRead, toAllowedValue, toAttributeKey and toAttributeKeys, leaving the node-type and listing transforms unchanged.'
- path: src/features/entities/api/keys.ts
  effect: 'extended: adds node(nodeId) and attributeKeys(nodeType) under the entities prefix, leaving the graph and curation nodes prefix untouched.'
- path: src/features/entities/types.ts
  effect: 'extended: adds the wire types and the domain types NodeAlias, NodeAttribute, NodeRead, AllowedValue and AttributeKey, leaving the existing exports unchanged.'
criteria:
- criterion: A node is requested as GET /api/v1/nodes/{node_id}, with the node identity in the path.
  met: true
  how: node.hooks.ts builds /api/v1/nodes/ followed by encodeURIComponent(nodeId), and entityGet sends it with method GET.
- criterion: The node identity in the node read's path is URL-encoded.
  met: true
  how: node.hooks.ts applies encodeURIComponent to nodeId before it joins the path.
- criterion: The node read carries no query parameter.
  met: true
  how: The path in node.hooks.ts is the encoded identity alone, with no question mark and no URLSearchParams.
- criterion: The node read returns the node's summary, its aliases and its attributes.
  met: true
  how: toNodeRead in _transforms.ts returns node, aliases and attributes from the wire's node, aliases and attributes, typed NodeRead.
- criterion: Each attribute returned carries its identity, attribute-key name, value, validity start, validity end, status and whether it is current.
  met: true
  how: toNodeAttribute maps id, attribute_key, value, valid_from, valid_to, status and is_current to id, attributeKey, value, validFrom, validTo, status and isCurrent, with dates kept as year-month-day strings or null.
- criterion: Attribute keys are requested as GET /api/v1/attribute-keys.
  met: true
  how: catalog.hooks.ts requests /api/v1/attribute-keys with the node_type query through entityGet, which sends method GET.
- criterion: The node type is sent by its name, not its identity, as the node_type parameter of the attribute-key listing.
  met: true
  how: useAttributeKeys takes the node type's name and sets it as node_type with URLSearchParams, so it is encoded and no identity is passed.
- criterion: Each attribute key returned carries its key, value type, whether it is temporal, whether it allows multiple current values and its description.
  met: true
  how: toAttributeKey maps key, value_type, is_temporal, allows_multiple and description to key, valueType, isTemporal, allowsMultiple and description.
- criterion: An attribute key the catalog closes is returned with its allowed values.
  met: true
  how: toAttributeKey maps valid_values through toAllowedValue into allowedValues, each a value, label and sortOrder, and a key without valid_values gets allowedValues null.
- criterion: Attribute keys are returned in the order the catalog lists them.
  met: true
  how: toAttributeKeys is a plain map over the wire items and nothing sorts it.
- criterion: A node read refused with RESOURCE_NOT_FOUND fails with that code.
  met: true
  how: entityGet calls http, which throws EnvelopeError with the envelope's code, and useNodeRead adds no catch, so the query's error carries RESOURCE_NOT_FOUND.
- criterion: Every request carries the owner's token in the Authorization header as Bearer <token>.
  met: true
  how: Both hooks call entityGet from the existing api/_request.ts, which passes bearerHeaders(), reading authHeader() and giving Bearer <token>.
- criterion: Every read is made through the http function of src/lib/http.ts, not through a fetch wrapper of its own.
  met: true
  how: entityGet is the existing one-line call to http, no fetch and no second wrapper appears in the new files, and src/lib/http.ts is unchanged.
- criterion: A failed read fails with the status the http function gives for that answer.
  met: true
  how: The hooks let the EnvelopeError of http reach the query unchanged, so httpStatus is http's.
- criterion: A failed read fails with the code the http function gives for that answer.
  met: true
  how: The same EnvelopeError reaches the query unchanged, so code is http's.
- criterion: A failed read fails with the message the http function gives for that answer.
  met: true
  how: The same EnvelopeError reaches the query unchanged, so message is http's.
- criterion: A failed read fails with the details the http function gives for that answer.
  met: true
  how: The same EnvelopeError reaches the query unchanged, so details is http's.
nodes:
- node: contracts/entity-workspace/bff-entity-reads
  encoded_at:
  - src/features/entities/api/node.hooks.ts
  - src/features/entities/api/catalog.hooks.ts
  - src/features/entities/api/_transforms.ts
  - src/features/entities/types.ts
  how: The read-node operation is GET /api/v1/nodes/{id} with the id URL-encoded and no query parameter, the list-attribute-keys operation is GET /api/v1/attribute-keys with node_type as a name, read as total and items and kept in wire order, and every failure is http's, so the contract's deferral to the request helper holds; the node-type and node-listing operations were delivered by the listing task.
- node: contracts/knowledge-base/retrieval
  encoded_at:
  - src/features/entities/types.ts
  - src/features/entities/api/_transforms.ts
  how: 'The published side: the wire types and transforms read the read-node members node, aliases and attributes and the list-attribute-keys members key, value type, is_temporal, allows_multiple, description and valid_values only for a closed key, taking fewer members than the contract gives, which is the narrowing the task''s advisory note records.'
- node: rules/entity-workspace/entity-workspace-requests-carry-the-access-token
  encoded_at:
  - src/features/entities/api/node.hooks.ts
  - src/features/entities/api/catalog.hooks.ts
  how: Both new reads go through entityGet, which carries the owner's bearer token, and the new files add no request path that skips it; the edit clause and the node-type and listing reads belong to other tasks.
- node: rules/entity-workspace/a-401-refreshes-the-token-and-repeats-the-request-once
  how: 'Honored by delegation: the hooks call http, which owns the refresh and the single repeat, and the existing entityGet gives the repeated request a header whose Authorization is read when the request options are copied; this task adds no refresh code and no test of the repeat.'
inferences:
- inferred: The wire field names of an alias and an attribute are id, alias, kind, created_at, and id, attribute_key, value, valid_from, valid_to, status, is_current, and the attribute-key fields are key, value_type, is_temporal, allows_multiple, description, valid_values.
  from: The adopted wire facts name the attribute-key fields and the graph and curation features already read the same read-node answer with the alias and attribute fields; the wire facts say the names were not checked against the backend.
- inferred: The node summary inside a read-node answer is mapped to the existing ListedNode domain type, with mergedInto taken from merged_into_node_id, then merged_into, then null.
  from: The contract describes the node summary identically for list-nodes and read-node, the listing wire uses merged_into and the graph and curation reads use merged_into_node_id, so both are accepted.
- inferred: An entry of valid_values is accepted either as a string or as an object with value and optional label and sort_order, mapped to value, label and sortOrder with null where absent, in wire order and never sorted.
  from: domain/knowledge-base/allowed-value holds value, label and sort_order but the retrieval contract does not state the wire shape of an entry and the wire facts mark it open.
- inferred: useAttributeKeys takes the node type as a string or null and disables the query while it is null or empty, and the key description is typed string or null.
  from: The form learns the node type from the node read, so the attribute-key read depends on it and a hook cannot be called conditionally, and an empty node_type would be refused 422.
- inferred: Neither hook sets staleTime and no enabled guard is placed on useNodeRead.
  from: The existing listing hooks set none and rely on the QueryClient default, and the route always supplies a node identity.
- inferred: The new query keys sit under the entities prefix and not under nodes.
  from: The inventory risk about the collision between the graph and curation nodes keys.
- inferred: The domain shapes carry exactly the members the criteria list, with no value_type, confidence, effective status or provenance on an attribute and no id, node type or requires_valid_from on an attribute key.
  from: The task's criteria, and the advisory note recording that they are narrower than the retrieval contract.
preserved:
- useNodeTypes and useNodeListing in listing.hooks.ts, unchanged.
- entityKeys.all, entityKeys.nodeTypes and entityKeys.nodeListing keep their exact shapes.
- toNodeType, toNodeTypes, toListedNode and toNodeListing behave as before.
- entityGet and bearerHeaders in api/_request.ts, and src/lib/http.ts, are not modified.
- The nodes key prefixes of the graph and curation features are not touched.
deferred:
- what: 'The node read''s members the retrieval contract gives and the criteria omit: value_type, confidence, effective status, in-effect and provenance on an attribute, and requires_valid_from, id and node type on an attribute key.'
  why: The criteria state the narrower set, and the edit form's task can extend the types and transforms if it needs them.
- what: 'How the form orders a closed key''s allowed values: wire order, sort_order or ascending string order.'
  why: The specification states two orders for it and the backend session flagged this as a contradiction, so the transform carries the wire order and sortOrder for the form's task to choose once the specification settles it.
---
## What it is
This record answers task/knowledge-base-client/node-and-catalog-reads.
It holds the entities feature's node read and attribute-key reads, written over the existing entityGet wrapper.

## Notes
The build passed on its first run after the lint repair of commit 115859a.
