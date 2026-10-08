---
target: frontend
title: Proof for the node read and the catalog attribute-key reads of the entities feature
summary: Specs under src/features/entities/api/__tests__ run the two hooks through a stubbed fetch and the real http function and hold up every criterion and the underdetermined refresh entry.
implementation: sha256:880a2f68f9d51f49ba23d6a397b43ddfb1e6f1bf2d5838695c056a81d8218ad3
standard:
  at: ../standards/frontend-react.yaml
  pin: sha256:2b03615161995450265523de6bdd9c464b2ca633976e832e36586c1ab1aa2cf7
run: run/knowledge-base-client-node-and-catalog-reads-suite
tests:
- file: src/features/entities/api/__tests__/node-read.spec.ts
  name: node read requests the node as GET /api/v1/nodes/{node_id} with the node identity in the path
  proves: A node is requested as GET /api/v1/nodes/{node_id}, with the node identity in the path.
  fails_when: the node read uses a method other than GET, or puts the identity anywhere but the path segment after /api/v1/nodes/.
- file: src/features/entities/api/__tests__/node-read.spec.ts
  name: node read URL-encodes the node identity in the path
  proves: The node identity in the node read's path is URL-encoded.
  fails_when: an identity with a slash, space, question mark, hash or non-ASCII letter reaches the path unencoded, so the request path splits or truncates.
- file: src/features/entities/api/__tests__/node-read.spec.ts
  name: node read carries no query parameter
  proves: The node read carries no query parameter.
  fails_when: the node read appends any query string, such as as_of, in_effect_only or include_uncertain.
- file: src/features/entities/api/__tests__/node-read.spec.ts
  name: node read returns the node's summary, its aliases and its attributes
  proves: The node read returns the node's summary, its aliases and its attributes.
  fails_when: the answer drops the node summary, an alias or an attribute, reorders them, or maps the summary's identity, node type, canonical name or status from the wrong wire member.
- file: src/features/entities/api/__tests__/node-read.spec.ts
  name: node read returns each attribute with its identity, attribute-key name, value, validity start, validity end, status and whether it is current
  proves: Each attribute returned carries its identity, attribute-key name, value, validity start, validity end, status and whether it is current.
  fails_when: an attribute loses one of those members, swaps validity start and end, turns a null date into a string or the reverse, or reads is_current wrongly.
- file: src/features/entities/api/__tests__/node-read.spec.ts
  name: node read fails with RESOURCE_NOT_FOUND when the knowledge base refuses the node with that code
  proves: A node read refused with RESOURCE_NOT_FOUND fails with that code.
  fails_when: a 404 envelope carrying RESOURCE_NOT_FOUND reaches the query with another code, or the read does not fail.
- file: src/features/entities/api/__tests__/attribute-keys.spec.ts
  name: attribute-key read requests the attribute keys as GET /api/v1/attribute-keys
  proves: Attribute keys are requested as GET /api/v1/attribute-keys.
  fails_when: the method is not GET or the path is not /api/v1/attribute-keys.
- file: src/features/entities/api/__tests__/attribute-keys.spec.ts
  name: attribute-key read sends the node type by the name it is given as the node_type parameter and no other parameter
  proves: The node type is sent by its name, not its identity, as the node_type parameter of the attribute-key listing.
  fails_when: the name is sent under another parameter, is left unencoded so that a name with an ampersand or a space splits into other parameters, or an extra parameter travels with it.
- file: src/features/entities/api/__tests__/attribute-keys.spec.ts
  name: attribute-key read returns each attribute key with its key, value type, whether it is temporal, whether it allows multiple current values and its description
  proves: Each attribute key returned carries its key, value type, whether it is temporal, whether it allows multiple current values and its description.
  fails_when: a key loses one of those members, or the two booleans are swapped or read from the wrong wire member.
- file: src/features/entities/api/__tests__/attribute-keys.spec.ts
  name: attribute-key read returns an attribute key the catalog closes with its allowed values
  proves: An attribute key the catalog closes is returned with its allowed values.
  fails_when: a key whose wire carries valid_values is returned without them, or with values missing or altered.
- file: src/features/entities/api/__tests__/attribute-keys.spec.ts
  name: attribute-key read returns the attribute keys in the order the catalog lists them
  proves: Attribute keys are returned in the order the catalog lists them.
  fails_when: the keys are sorted, in either direction, or reordered; the wire order m_key, z_key, a_key is neither ascending nor descending.
- file: src/features/entities/api/__tests__/node-catalog-token.spec.ts
  name: owner's token is sent as Bearer <token> in the Authorization header by $name
  proves: Every request carries the owner's token in the Authorization header as Bearer <token>.
  fails_when: either read sends no Authorization header, sends the token without the Bearer prefix, or sends a token other than the one the application holds.
- file: src/features/entities/api/__tests__/node-catalog-through-http.spec.ts
  name: read is made through the http function and uses no other fetch for $name
  proves: Every read is made through the http function of src/lib/http.ts, not through a fetch wrapper of its own.
  fails_when: a read does not call the http function, calls it with another target, or issues a fetch that did not come through it.
- file: src/features/entities/api/__tests__/node-catalog-failures.spec.ts
  name: failed read fails with the status, code, message and details the http function gives for $name
  proves: 'A failed read fails with the status the http function gives for that answer. A failed read fails with the code the http function gives for that answer. A failed read fails with the message the http function gives for that answer. A failed read fails with the details the http function gives for that answer. Each of the four members is compared in five cases: a 410 envelope, a 422 envelope, a 500 envelope, a non-JSON answer below 500 and no answer.'
  fails_when: a read catches or rewraps the failure so that its httpStatus, code, message or details differs from what calling http directly gives for the same stubbed answer.
- file: src/features/entities/api/__tests__/node-catalog-refresh.spec.ts
  name: read answered 401 on its first attempt starts one refresh and repeats $name once with the new token, the same options and a fresh cutoff, never starting a second refresh
  proves: 'The refresh and repeat of a first-attempt 401 with the new token on the reads'' side of the 401 rule: one refresh, one repeat to the same method and URL, a fresh cutoff, and no second refresh when the repeat is answered 401.'
  fails_when: a read builds the Authorization header once and passes it in the request options so the repeat after the refresh sends the refused old token, or the refresh runs more than once, the repeat is not sent exactly once, the repeat goes to another method or URL, or the repeat's cutoff is not fresh.
files:
- path: src/features/entities/api/__tests__/node-catalog-cases.ts
  effect: 'a table the token, through-http and refresh specs share: the node read and the attribute-key read, each with the path it must request, the hook that makes it and a minimal accepted wire, while support.ts is reused unchanged.'
not_applicable:
- edge_case: an empty collection coming back, a node with no aliases or attributes or an empty attribute-key list
  why: no criterion or node requires anything different for an empty answer and the transforms are plain maps.
- edge_case: a duplicate where uniqueness is claimed
  why: no criterion or node claims uniqueness for anything these reads return.
- edge_case: two operations against one subject at once
  why: the reads are idempotent and stateless and no criterion or node states concurrent behavior.
- edge_case: a dependency that answers slowly on the first attempt
  why: the 30000 millisecond cutoff of the first attempt belongs to the http function, and the repeat's fresh cutoff is covered by the refresh test.
- edge_case: a request made while the application holds no token
  why: the access-token rule says it does not cover that case and no criterion states it.
- edge_case: an empty or malformed node identity
  why: no criterion or node states what the node read does for one, the identity is URL-encoded and a test covers it, and the refusal of a malformed identity is the knowledge base's 422, which the failure comparison already covers as an answer class.
untested:
- 'contracts/entity-workspace/bff-entity-reads: no finite test decides it whole from this task, because two of its four operations belong to the listing task and its refusals defer to the shell''s rule, which no task of this epic implements.'
- 'contracts/knowledge-base/retrieval: the published contract states sixteen operations, of which this task consumes two and narrows the members it reads, and whether the backend answers as it states is the backend''s to prove.'
- 'rules/entity-workspace/entity-workspace-requests-carry-the-access-token: the rule covers every read and every edit, and the Bearer header of the two reads here is proved by the token test without claiming the rule''s totality.'
- 'rules/entity-workspace/a-401-refreshes-the-token-and-repeats-the-request-once: the rule covers every read and every edit and no edit exists in this task, so the reads'' side is proved by the refresh test without claiming the node.'
- 'Inferred behavior decided by no node: mergedInto taken from merged_into_node_id, then merged_into, then null; a valid_values entry accepted as a string or an object; allowedValues null for a key without valid_values; useAttributeKeys disabled while the node type is null or empty; no staleTime and no enabled guard on useNodeRead, so the tests assert the values only, never label, sort order or mergedInto.'
- 'How the form orders a closed key''s allowed values: the implementation recorded it as deferred and the specification states two orders for it, so the proof states none.'
- Members of the domain types beyond the ones the criteria list, which are arrangement, and the tests use toMatchObject so extra members are neither required nor forbidden.
- 'The query keys of the new hooks and their placement under the entities prefix: arrangement with no criterion or node behind it.'
- The wire field names of an alias, an attribute and an attribute key are inferences the wire facts say were not checked against the backend, and the tests feed those names as the fixture's shape only.
---
## What it is
This record proves task/knowledge-base-client/node-and-catalog-reads.
It holds seven spec files and one shared case table, reusing the harness of the listing reads.

## Notes
The suite passed on its first run, run/knowledge-base-client-node-and-catalog-reads-suite.
