---
target: backend
title: A search item's flags, provenance entries and non-empty provenance are proven
summary: Three tests in the existing search-service-expansion spec decide that an uncertain link is answered with the uncertain flag, that every provenance entry of a node, link and fragment item names a fragment supporting that very item, and that a matched node no fragment supports yields no item with empty provenance.
implementation: sha256:c6ea78c19874c76987dd42d44e1127ad3193e9cd4c9c8f19d3371b439a53bad1
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/proof-owed-search-item-flags-provenance-suite
tests:
- file: src/__tests__/unit/query-retrieval/search-service-expansion.spec.ts
  name: 'searchKnowledgeService: the flags of a search item > answers a link whose confidence is in the uncertain band with the uncertain flag and no other'
  proves: A search whose matched item has confidence in the uncertain band should answer that item with flags holding only assertion-flag values, including the expected one. The store stand-in holds a link at confidence 0.6 with status uncertain, and the answered item must carry exactly ["uncertain"].
  fails_when: The item is answered with empty flags, with a flag besides uncertain, or with a value outside the assertion-flag enumeration, for example a status or confidence number leaking into flags.
  demonstrates: domain/knowledge-base/search-item
- file: src/__tests__/unit/query-retrieval/search-service-expansion.spec.ts
  name: 'searchKnowledgeService: the provenance entries of a search item > names, in every entry of a node, a link and a fragment item, only fragments that support that very item'
  proves: For every item of each kind, each provenance entry should name an information fragment that exists in the world and supports that item. The stand-in world has two matched nodes, two expanded links and one fragment hit, each with its own distinct supporting fragments, and the test collects every entry naming a fragment that is not a supporter of the item it sits on. Because supporters are fragments of the world, a supporting entry also exists in the world.
  fails_when: 'Any item''s provenance names a fragment that does not support it: provenance grouped under the wrong anchor, one item receiving another item''s supporters, or an invented fragment id. It also fails if any of the five items (two nodes, two links, the fragment) is not answered.'
  demonstrates: domain/knowledge-base/search-item
- file: src/__tests__/unit/query-retrieval/search-service-expansion.spec.ts
  name: 'searchKnowledgeService: a matched node no fragment supports > answers no item with an empty provenance'
  proves: A matched node for which no supporting fragment exists, against the expected result that no item is answered with an empty provenance. It asserts no handling of that node beyond that no answered item has an empty provenance, as the task's ADVISORY note requires.
  fails_when: The matched node with no supporting fragment is answered as an item whose provenance is an empty list.
  demonstrates: domain/knowledge-base/search-item
not_applicable:
- edge_case: a search whose tsquery is empty after parsing, an unknown layer or an unknown link type
  why: These are refusals of the search request. None of this task's three criteria or its node's fact reaches them; the node describes the item answered, not the refusal.
- edge_case: limit, offset and total over the answered items
  why: Pagination does not change what a search item must carry, and no criterion or node fact of this task states it.
- edge_case: includeUncertain false, which filters uncertain items out
  why: Criterion 1 concerns the flags of an item that is answered. The filtering of uncertain items is not a criterion here, and testing it would pin behavior this task does not own.
- edge_case: a link with no provenance, or a link with no metadata, dropped during expansion
  why: Criterion 3 and the ADVISORY note require only that no answered item has an empty provenance. Which items are dropped, and how, is handling no node here decides, so no test pins it.
- edge_case: a node hit whose status makes the item flagged uncertain or disputed
  why: Node hits arrive with status active or needs_review, so the uncertain flag on a node item cannot arise. Link items carry the uncertain flag, and that is the representative tested.
untested:
- Which flag an uncertain-band confidence produces, and the low-confidence flag on an accepted fragment below 0.4. Both rest on the node rules/knowledge-base/item-flags, which is outside this task and is not claimed. The test for criterion 1 exercises the uncertain flag through a link whose status is uncertain, and does not pin how a confidence becomes a status.
- The spelling of the third assertion-flag value. The specification node domain/knowledge-base/assertion-flag lists low-confidence, while the response type in the code spells it low_confidence. No test reaches that value, so the spelling is neither pinned nor decided.
- That a node match with no supporting fragment is dropped from the answer, as the implementation does. The ADVISORY note says the node does not decide the handling, so the third test asserts only that no empty provenance is answered.
- The support relation as the real store computes it. Node provenance is derived in the store from accepted fragments whose text matches the node's alias, and link provenance from the provenance rows. The stand-in at the store boundary only decides that the service attributes each item's rows to that item and does not fabricate any.
- domain/knowledge-base/search-item is claimed by each of the three tests as the remainder directed. Each decides part of the node's fact (flags, provenance entries, non-empty provenance). The decision is the auditor's whether the three together decide the fact whole.
divergences:
- cites: TST-04
  file: src/__tests__/unit/query-retrieval/search-service-expansion.spec.ts
  departure: The tests were added to the existing search-service-expansion.spec.ts. Its name does not mirror the path of search.service.ts, although the directory mirrors the module under src/__tests__/unit.
  why: The file is the existing proof file named for this task, and it already holds the store stand-in the new tests extend. A new file would copy that stand-in and split the suite for one unit across two files.
---

## What it is

Three tests in the existing search-service-expansion spec decide that an uncertain link is answered with the uncertain flag, that every provenance entry of a node, link and fragment item names a fragment supporting that very item, and that a matched node no fragment supports yields no item with empty provenance.

## Notes

The binder returned a compound note over criterion 1 of this task after the skeleton had been split once, and the criterion proceeded as last written; its test decides the uncertain flag of a link answered as uncertain.
