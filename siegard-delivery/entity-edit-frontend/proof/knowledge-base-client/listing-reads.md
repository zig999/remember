---
target: frontend
title: Proof for the entity listing reads, node types and node listing
summary: Six test files under src/features/entities/api/__tests__ prove the listing reads' request shape, narrowings, token, mapping and total, that every read goes through the shell's http function, that a failed read fails exactly as that function does, and that a first-attempt 401 refreshes and repeats with the new token.
implementation: sha256:b2efe66136b12d4548cdd550a6ba6b2eebb52dd09792e7fd130517f12d3676fc
standard:
  at: ../standards/frontend-react.yaml
  pin: sha256:2b03615161995450265523de6bdd9c464b2ca633976e832e36586c1ab1aa2cf7
run: run/knowledge-base-client-listing-reads-suite-6
tests:
- file: src/features/entities/api/__tests__/listing-requests.spec.ts
  name: requests the node types as GET /api/v1/node-types with no parameter
  proves: Node types are requested as GET /api/v1/node-types with no parameter.
  fails_when: the node types read uses another method or path, or sends any query string.
- file: src/features/entities/api/__tests__/listing-requests.spec.ts
  name: returns each node type with its identity, name, description and version
  proves: Each node type returned carries its identity, name, description and version.
  fails_when: a returned node type drops any of the four wire values or the read returns fewer or more items than the answer holds.
- file: src/features/entities/api/__tests__/listing-requests.spec.ts
  name: requests the nodes as GET /api/v1/nodes
  proves: Nodes are requested as GET /api/v1/nodes.
  fails_when: the listing read uses another method or path.
- file: src/features/entities/api/__tests__/listing-requests.spec.ts
  name: returns each node with its identity, node-type name, canonical name, status and merge target or null
  proves: Each node returned carries its identity, node-type name, canonical name, status and the node it was merged into, or null.
  fails_when: a returned node loses one of its five wire values, or a node with merged_into null no longer carries null, or a merged node loses its merge target.
- file: src/features/entities/api/__tests__/listing-requests.spec.ts
  name: returns the total the knowledge base reports, not the size of the page
  proves: The node listing returns the total the knowledge base reports.
  fails_when: the listing's total is computed from the number of items returned, or dropped, instead of being the total the answer reports (57 against two items).
- file: src/features/entities/api/__tests__/listing-requests.spec.ts
  name: carries each narrowing given under its parameter and leaves out each not given
  proves: A name prefix given is sent as the name_prefix parameter. A node type given is sent by its name, not its identity, as the node_type parameter. A name prefix not given is left out of the request. A node type not given is left out of the request.
  fails_when: the prefix travels under another parameter name or is not URL-encoded, the node type travels under another name or is altered, or a narrowing that is not given is sent as an empty value or any other value.
  demonstrates: rules/entity-workspace/the-listing-request-carries-its-narrowings-by-name
- file: src/features/entities/api/__tests__/listing-requests.spec.ts
  name: treats an empty name prefix or an empty node type as a narrowing not given
  proves: An empty name prefix is left out of the request. An empty node type is left out of the request.
  fails_when: an empty name prefix is sent as name_prefix= or an empty node type is sent as node_type=, so the request differs from the one for a narrowing not given.
  demonstrates: rules/entity-workspace/an-empty-narrowing-is-a-narrowing-not-given
- file: src/features/entities/api/__tests__/listing-requests.spec.ts
  name: is sent as Bearer <token> in the Authorization header by $name
  proves: Every request carries the owner's token in the Authorization header as Bearer <token>.
  fails_when: either read omits the Authorization header, sends it without the Bearer scheme, or sends a token other than the one the store holds.
- file: src/features/entities/api/__tests__/listing-through-http.spec.ts
  name: is made through the http function and uses no other fetch for $name
  proves: Every read is made through the http function of src/lib/http.ts, not through a fetch wrapper of its own.
  fails_when: a read stops calling the http function and reaches the network by another route, or makes a second fetch beside the one the http function makes.
- file: src/features/entities/api/__tests__/listing-failures.spec.ts
  name: fails with the status, code, message and details the http function gives for $name
  proves: A failed read fails with the status the http function gives for that answer. A failed read fails with the code the http function gives for that answer. A failed read fails with the message the http function gives for that answer. A failed read fails with the details the http function gives for that answer.
  fails_when: for any of the representative answers the read's failure differs from the http function's own in its status, code, message or details, because the read maps, rewrites or replaces the failure instead of passing it through.
- file: src/features/entities/api/__tests__/listing-session.spec.ts
  name: fails with the status, code, message and details the http function gives when the session refresh fails
  proves: A failed read fails with the status, code, message and details the http function gives for a 401 answer whose session refresh fails.
  fails_when: the read's failure to a 401 whose refresh fails differs from the http function's own in status, code, message or details.
- file: src/features/entities/api/__tests__/listing-session.spec.ts
  name: fails with the status, code, message and details the http function gives when the repeat after a refresh is answered 401
  proves: A failed read fails with the status, code, message and details the http function gives for a 401 answer to the read repeated after a successful refresh.
  fails_when: the read's failure to a second 401 differs from the http function's own in status, code, message or details.
- file: src/features/entities/api/__tests__/listing-timing.spec.ts
  name: starts one refresh and repeats the read once with the new token, the same options and a fresh cutoff, never starting a second refresh
  proves: 'The refresh a first-attempt 401 starts, the repeat with the new token, the same options and a fresh cutoff, and no second refresh: one refresh, two requests, the old token on the first and the new on the repeat, the same method and URL, and the repeat''s answer arriving instead of a cutoff.'
  fails_when: the read builds its Authorization header once and hands it to the http function as a fixed header so the repeat sends the stale token, or never refreshes after a first 401, refreshes more than once, repeats with other options, repeats without a fresh 30000 ms cutoff, or sends a third request.
files:
- path: src/features/entities/api/__tests__/support.ts
  effect: 'shares the harness of the six listing specs: it stubs the global fetch and records each request, builds JSON, text, failing and delayed answers, mounts a hook inside a QueryClientProvider with retry off, advances fake timers inside act, and compares the failure a mounted read ends in with the failure of calling the http function directly for the same stubbed answer, field by field.'
not_applicable:
- edge_case: a request when the store holds no token
  why: the access-token rule's own description says it does not cover what a request does when the application holds no token, and no criterion states it.
- edge_case: an empty listing and an empty list of node types
  why: no criterion states a behavior specific to an empty answer, and the mapping is a plain map over the items.
- edge_case: the particular status, code, message and details of each failure
  why: the criteria state that a failed read fails with what the http function gives, and the contract points at rules of the application shell this task does not implement, so the tests compare the read's failure with the http function's own for representative answers.
- edge_case: every failure answer run against both reads
  why: both reads reach the http function through the same helper and differ only in the path, so the 422 answer is run against both.
- edge_case: the same read made twice at once, or a missing and an empty narrowing sharing one cache entry
  why: no criterion or node states concurrency or caching.
- edge_case: the node type given by identity instead of by name
  why: the client forwards the string it is given and cannot tell a name from an identity, which is the screen task's criterion.
untested:
- 'contracts/entity-workspace/bff-entity-reads: its four operations are list-node-types, list-nodes, read-node and list-attribute-keys, and this task implements the first two, and its refusal clauses point at the shell''s rules, which this task does not implement.'
- 'contracts/knowledge-base/retrieval: the published contract of the backend, of which this client consumes two operations, so which answers the knowledge base gives is the publisher''s fact.'
- 'rules/entity-workspace/entity-workspace-requests-carry-the-access-token: the read clause is tested by the token test without claiming the node, and the edit clause belongs to the edit-request task.'
- 'rules/entity-workspace/a-401-refreshes-the-token-and-repeats-the-request-once: the read clause is tested by the refresh-and-repeat test without claiming the node, and the edit clause belongs to the edit-request task.'
- 'Implementation inference, the camelCase field names of the domain shapes and the array container of useNodeTypes: the tests assert the wire values reach the returned items and do not pin the names, because no node states them.'
- 'Implementation inference, a whitespace-only name prefix or node type is sent as given and not trimmed: no node decides trimming.'
- 'Implementation inference, the QueryClient default staleTime and the shared cache entry for a missing and an empty narrowing: cache policy that no node states.'
- 'Implementation inference, the Authorization header reflects the token held when fetch reads it and none is defined when the store holds no token: only its observable consequence, the repeat carrying the refreshed token, is tested.'
- 'No limit and no offset are sent, and the page is whatever the knowledge base answers by default: no criterion sends or returns a limit or offset.'
---
## What it is
This record proves task/knowledge-base-client/listing-reads.
It holds six spec files and one shared harness that stub the global fetch.

## Notes
The run run/knowledge-base-client-listing-reads-suite was red at the lint step on the spec files before the task was re-cut, because callbacks that call hooks were not named with the use prefix, and the test author renamed them.
The run run/knowledge-base-client-listing-reads-suite-2 was red before the re-cut with the diagnosis cause code for six tests against src/lib/http.ts and cause test for three spec files that imported by the @/ alias, and the code cause was withdrawn when the person aligned the reads to the shell's rules.
The runs run/knowledge-base-client-listing-reads-suite-3 and run/knowledge-base-client-listing-reads-suite-4 were red with the diagnosis cause setup, a timeout of the existing routes.ingest.dom.spec.tsx, and the person raised the global test timeout.
The run run/knowledge-base-client-listing-reads-suite-5 passed the earlier version of this proof, and the proof was then rewritten against the re-cut task, which run/knowledge-base-client-listing-reads-suite-6 passed.
