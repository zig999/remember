---
target: frontend
title: Entity listing reads, node types and node listing
summary: A new entities feature folder holds the TanStack Query hooks that read the node types and a page of nodes narrowed by name prefix and node type, all through the shared http function and with a bearer header that follows a refreshed token.
task: sha256:4cfcf39a822daa404322bb756959537088f3254087b54732e1a1032ecb9743e1
standard:
  at: ../standards/frontend-react.yaml
  pin: sha256:2b03615161995450265523de6bdd9c464b2ca633976e832e36586c1ab1aa2cf7
run: run/knowledge-base-client-listing-reads-build-4
files:
- path: src/features/entities/types.ts
  effect: declares the wire shapes of the node-type list and the node listing (snake_case, as the knowledge base answers) and the domain shapes the screen consumes (NodeType, ListedNode, NodeListing, NodeListingNarrowing).
- path: src/features/entities/api/keys.ts
  effect: holds the query-key factory entityKeys under the entities prefix, with separate keys for the node types and for each (name prefix, node type) listing, sharing no prefix with the graph or curation nodes keys.
- path: src/features/entities/api/_request.ts
  effect: defines bearerHeaders(), which builds the Authorization header on top of the curation feature's authHeader() and re-reads the token each time fetch reads the headers, and entityGet<T>(), a GET that calls http<T>() from src/lib/http.ts with that header and the caller's abort signal and returns or throws exactly what http<T>() does, adding no fetch, timeout, refresh or error logic of its own.
- path: src/features/entities/api/_transforms.ts
  effect: maps the wire shapes to domain shapes (toNodeType, toNodeTypes, toListedNode, toNodeListing), renaming node_type, canonical_name and merged_into and keeping the total.
- path: src/features/entities/api/listing.hooks.ts
  effect: defines useNodeTypes(), which requests GET /api/v1/node-types with no parameter, and useNodeListing(narrowing), which requests GET /api/v1/nodes with name_prefix and node_type only when each is a non-empty string, both passing the query's abort signal.
criteria:
- criterion: Node types are requested as GET /api/v1/node-types with no parameter.
  met: true
  how: useNodeTypes in listing.hooks.ts calls entityGet with the literal path /api/v1/node-types, with no query string and method GET.
- criterion: Each node type returned carries its identity, name, description and version.
  met: true
  how: toNodeType in _transforms.ts returns id, name, description and version, and toNodeTypes maps every item of the answer.
- criterion: Nodes are requested as GET /api/v1/nodes.
  met: true
  how: useNodeListing requests /api/v1/nodes plus the query string built by buildListingQs, with method GET, through entityGet.
- criterion: A name prefix given is sent as the name_prefix parameter.
  met: true
  how: buildListingQs sets name_prefix on a URLSearchParams when the prefix has length above zero.
- criterion: A node type given is sent by its name, not its identity, as the node_type parameter.
  met: true
  how: buildListingQs sets node_type to the string the hook was given, sent unchanged, so the caller passes the node type's name.
- criterion: A name prefix not given is left out of the request.
  met: true
  how: A null or undefined prefix becomes an empty string in useNodeListing, and buildListingQs does not set name_prefix for it.
- criterion: An empty name prefix is left out of the request.
  met: true
  how: A zero-length prefix fails the length check in buildListingQs, so name_prefix is not set.
- criterion: A node type not given is left out of the request.
  met: true
  how: A null or undefined node type becomes an empty string in useNodeListing, and buildListingQs does not set node_type for it.
- criterion: An empty node type is left out of the request.
  met: true
  how: A zero-length node type fails the length check in buildListingQs, so node_type is not set.
- criterion: Each node returned carries its identity, node-type name, canonical name, status and the node it was merged into, or null.
  met: true
  how: toListedNode returns id, nodeType, canonicalName, status and mergedInto, with mergedInto passed through from merged_into as a string or null.
- criterion: The node listing returns the total the knowledge base reports.
  met: true
  how: toNodeListing returns total taken unchanged from the answer's total, next to the mapped items.
- criterion: Every request carries the owner's token in the Authorization header as Bearer <token>.
  met: true
  how: entityGet always sends headers from bearerHeaders(), which wraps authHeader() from the curation feature's _request module, so the header is Bearer <token> when the store holds a token.
- criterion: Every read is made through the http function of src/lib/http.ts, not through a fetch wrapper of its own.
  met: true
  how: entityGet in src/features/entities/api/_request.ts is the only caller of the network and it calls http<T>() imported from @/lib/http, both hooks reach the network only through entityGet, the feature calls fetch nowhere and src/lib/http.ts is untouched.
- criterion: A failed read fails with the status the http function gives for that answer.
  met: true
  how: entityGet returns the promise of http<T>() as it is and the hooks and transforms catch nothing, so the httpStatus of the failure is the one http<T>() gave.
- criterion: A failed read fails with the code the http function gives for that answer.
  met: true
  how: 'The same pass-through: nothing in src/features/entities/ rewrites, wraps or catches the error, so the code is the one http<T>() gave.'
- criterion: A failed read fails with the message the http function gives for that answer.
  met: true
  how: 'The same pass-through: the message is the one http<T>() gave.'
- criterion: A failed read fails with the details the http function gives for that answer.
  met: true
  how: 'The same pass-through: the details are the ones http<T>() gave.'
nodes:
- node: contracts/entity-workspace/bff-entity-reads
  encoded_at:
  - src/features/entities/api/listing.hooks.ts
  - src/features/entities/api/_request.ts
  - src/features/entities/api/_transforms.ts
  - src/features/entities/types.ts
  how: The list-node-types and list-nodes operations are the two requests in listing.hooks.ts, their accepted answers are the wire and domain types and transforms, and their refusals are the failure the application's request helper gives, so entityGet passes the failures of http<T>() through unread and states none of its own. The read-node and list-attribute-keys operations belong to other tasks.
- node: contracts/knowledge-base/retrieval
  encoded_at:
  - src/features/entities/types.ts
  - src/features/entities/api/_transforms.ts
  how: 'The published side of the same two reads: the client consumes total and items for the node types and for the nodes, each item as the contract lists it, with limit and offset in the wire type but neither sent nor returned.'
- node: rules/entity-workspace/entity-workspace-requests-carry-the-access-token
  encoded_at:
  - src/features/entities/api/_request.ts
  how: Every request goes through entityGet, which always sends bearerHeaders(), so the bearer token travels in the Authorization header; the edit clause belongs to the edit-request task.
- node: rules/entity-workspace/the-listing-request-carries-its-narrowings-by-name
  encoded_at:
  - src/features/entities/api/listing.hooks.ts
  how: buildListingQs puts the prefix under name_prefix and the node type, as given and therefore by name, under node_type, and leaves out a narrowing that is not given.
- node: rules/entity-workspace/an-empty-narrowing-is-a-narrowing-not-given
  encoded_at:
  - src/features/entities/api/listing.hooks.ts
  how: A zero-length prefix or node type is treated like null or undefined and left out of the request by the length check in buildListingQs.
- node: rules/entity-workspace/a-401-refreshes-the-token-and-repeats-the-request-once
  encoded_at:
  - src/features/entities/api/_request.ts
  how: http<T>() starts one refresh on a first 401 and repeats the request once, marked __retried so that it starts no second refresh, with a fresh 30000 ms cutoff, and because it repeats with the same options a fixed header would resend the stale token, so bearerHeaders() returns an Authorization property read when fetch reads the headers and the repeat carries the refreshed token; the edit clause of the rule belongs to the edit-request task.
inferences:
- inferred: The item field names are the ones the wire facts state (id, name, description, version; id, node_type, canonical_name, status, merged_into; total and items), with version a number, description a string and status a plain string with no closed set.
  from: intake/wire-facts.md, which the person adopted and which records that the names were read from the contract's prose and not checked against the backend.
- inferred: An empty narrowing means a string of length zero, and a value of spaces is sent as given and not trimmed.
  from: rules/entity-workspace/an-empty-narrowing-is-a-narrowing-not-given states empty and no node defines trimming.
- inferred: The hooks set no staleTime and take the QueryClient default of 5 minutes, and the listing key normalises a missing narrowing to an empty string so that a missing and an empty narrowing share one cache entry, as they share one request.
  from: src/lib/query-client.ts sets that default and the project's rule is not to invent per-file values.
- inferred: The entities keys sit under the entities prefix and none starts with nodes.
  from: The inventory risk that graph and curation node-detail keys collide under the nodes prefix.
- inferred: bearerHeaders() defines Authorization as an enumerable getter that reads the store at fetch time, and defines no Authorization property when the store holds no token.
  from: The 401 rule says the repeat is sent with the new token and src/lib/http.ts repeats with the same options; the task Notes record that no criterion requires this and a fixed header passes, so this is an addition beyond the criteria.
- inferred: useNodeTypes returns the array of node types and useNodeListing returns total and items, neither returning limit or offset, and the hooks send no limit and no offset.
  from: The task objective and its Notes, which say no node states that the screen pages.
- inferred: The queries pass the AbortSignal TanStack Query provides to the request so that a query cancelled by its caller stops its request, and how http<T>() reports a cancellation is its own and is passed through unread.
  from: The cancellation criterion and the signal option of http<T>().
divergences:
- from: 'CLAUDE.md Conventions: a feature never imports from a sibling feature, and src/features/entities/api/_request.ts imports authHeader from src/features/curation/api/_request.'
  departure: The entities feature imports authHeader from the curation feature's api module.
  why: The inventory (must_not_duplicate) names that module as the home of authHeader() and asks for no second copy, and no ESLint zone covers the entities feature, so the lint step does not report it.
deferred:
- what: http<T>() repeats a request after a refresh with the options it was first given, so other callers that pass a fixed authHeader(), the curation reads for example, resend the stale token.
  why: It sits outside this task's criteria and in shared code this task must not touch, and the entities reads work around it in bearerHeaders().
- what: The listing screen does not page.
  why: No node says the screen pages, and the task Notes record it as advisory.
---
## What it is
This record answers task/knowledge-base-client/listing-reads.
It holds the entities feature's listing reads, written over the shared http client.

## Notes
The first build run, run/knowledge-base-client-listing-reads-build, was red at the lint step because the project's ESLint configuration declared no TypeScript parser, which failed 351 parsing errors over files this delivery did not write.
The person authorized typescript-eslint, and the configuration was repaired in commit 115859a, after which builds 2, 3 and 4 passed both steps.
An earlier version of this delivery corrected src/lib/http.ts to the failure contract, and the person then chose to align the entity workspace's reads to the shell's rules instead, so that change was discarded and the task's failure criteria were re-cut to pass the helper's failures through.
The suite runs before the re-cut are history under run/, and run/knowledge-base-client-listing-reads-suite-6 passed against the re-cut task.
