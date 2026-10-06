---
target: backend
title: Proof of link-and-fragment-items-carry-no-match, closing the testable remainder
summary: Two tests in one new file decide that link and fragment items carry no node match and no similarity. The first covers links reached from an exact and from an approximate node, plus a fragment the fragment layer matched directly. The second covers the chunk-only input the remainder names.
implementation: sha256:1e100eb49a50027281deab0ab203cb045c92cc8433ee0fb5a265b66c9856dcb8
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/close-testable-remainders-link-and-fragment-items-carry-no-match-suite
tests:
- file: src/__tests__/unit/query-retrieval/search-service-link-fragment-no-match-by-layer.spec.ts
  name: 'searchKnowledgeService: the match and similarity of link and fragment items answers a link reached from an exactly matched node, a link reached from an approximately matched node, and a fragment the fragment layer matched directly, each with no match and no similarity'
  proves: 'The statement of rules/knowledge-base/link-and-fragment-items-carry-no-match, "A search item for a knowledge link or an information fragment carries no node match and no similarity.", for both item kinds it names. It also discharges both UNDERDETERMINED entries in the task''s Notes. First entry: a link reached by expansion, from an exactly or an approximately matched node, carries neither field. Second entry: a fragment item the fragment layer itself matched carries neither field. A store matches an exact node, an approximate node with similarity 0.8, and a fragment the fragment layer matches. One link hangs from each node. The test expects the non-node items to be exactly the fragment and the two links, with match and similarity absent on all of them. The input is a stand-in for the store only, so the real expansion, ranking and item-building run.'
  fails_when: A link item reached by expansion carries the match or similarity of the node it was expanded from, or a fragment item the fragment layer matched carries a match or a similarity. It also fails when an expected link or fragment item is not answered, because the expected list names all three by kind and id.
  demonstrates: rules/knowledge-base/link-and-fragment-items-carry-no-match
- file: src/__tests__/unit/query-retrieval/search-service-link-fragment-no-match-by-layer.spec.ts
  name: 'searchKnowledgeService: the match and similarity of link and fragment items answers no fragment item carrying a match or a similarity when the chunk layer matches a raw chunk that supports a fragment the fragment layer does not match'
  proves: 'The task''s single criterion as the remainder states it: "a search whose chunk layer matches a raw chunk that supports a fragment the fragment layer itself does not match" answers no fragment item carrying a match or a similarity.'
  fails_when: Any code path answers a fragment item for a chunk-only match and gives it a match or a similarity (for example copying a node-layer match or a trigram similarity onto a fragment a chunk surfaced).
not_applicable:
- edge_case: A link or fragment item excluded by the uncertain filter, by missing provenance or by pagination
  why: No criterion and no node bound here states what such an item carries. Those behaviors belong to other rules (uncertain-items-excluded-on-request, expanded-link-requires-provenance), and an item that is not answered cannot carry a match.
- edge_case: A knowledge node item carrying match and similarity
  why: The rule says explicitly that it does not state what a node item carries (rules/knowledge-base/node-item-shows-match covers that), and this task does not implement that node.
- edge_case: Empty or absent query, unknown layer name, unknown expand link type
  why: These are refusals of the search request, which this rule does not reach; it constrains only the items of an answered search.
- edge_case: A link reached from two matched nodes, one exact and one approximate
  why: Which of the two paths wins is the business of ranking and approximate-match rules. Either way the link item is a link item and carries neither field, which the first test already decides for each origin.
untested:
- The remainder's own input (a chunk-layer match supporting a fragment the fragment layer does not match) answers no fragment item at all in the delivered code. searchKnowledgeService builds items only from the fragment, node and expansion layers, and uses chunk hits only to count dedup collapses. So the second test's assertion currently holds over an empty set of fragment items. It fails only if a future implementation surfaces such a fragment and gives it a match or similarity. No test requires such a fragment to be present, because the specification's rules/knowledge-base/chunk-match-never-surfaces ("A chunk-layer match never surfaces as a search item") points the other way.
- Whether the real SQL of the fragment, chunk, node-alias and expansion layers returns the rows the stand-in supplies. Closing that needs a real Postgres, which this proof does not use. The stand-in answers by SQL fragment, as the neighbouring specs do, so it proves the service's item-building behavior and not the repository's queries.
contested:
- what: The Description of rules/knowledge-base/link-and-fragment-items-carry-no-match speaks of "fragments the chunk layer surfaces", and the remainder's assertion speaks of "the fragment item that search answers" for a chunk-only match.
  why: The delivered code answers no fragment item for a chunk-only match, and rules/knowledge-base/chunk-match-never-surfaces requires exactly that. The Description's wording appears to describe the fragment the chunk-layer excerpt is shown on (chunk-match-cites-its-fragment), which the fragment layer matched anyway. The second test states the assertion as written and is therefore vacuous against the current code. The wording is the rule's and the remainder's to settle; the implementation is not at fault.
divergences:
- from: The project standard's TYP-02 (a type assertion is accompanied by a guard that narrows it), in src/__tests__/unit/query-retrieval/search-service-link-fragment-no-match-by-layer.spec.ts. Cited by prose because this record carries no standard pin to resolve a citation against.
  departure: The stand-in client is cast with `standIn as unknown as PoolClient` and no guard narrows it.
  why: A store stand-in implements only the query and release methods of PoolClient, and no guard can narrow it to the full type. The neighbouring specs under src/__tests__/unit/query-retrieval/ make the same cast for the same reason.
---
## What it is
This proof answers a proof task over a standing implementation: it closes the testable remainder siegard-reconcile/aliases-fuzzy-context-3.md recorded for the node the task implements.

## Notes
None.
