---
title: Proof of link-and-fragment-items-carry-no-match
summary: A test that decides the fact of rules/knowledge-base/link-and-fragment-items-carry-no-match as the record's remainder states it.
sources:
- intake/proof-increment.md
objective: A test fails whenever the fact of rules/knowledge-base/link-and-fragment-items-carry-no-match stops holding in the delivered code.
criteria:
- 'One input: a search whose chunk layer matches a raw chunk that supports a fragment the fragment layer itself does not match. One expected result: the fragment item that search answers carries no match and no similarity.'
implements:
- rules/knowledge-base/link-and-fragment-items-carry-no-match
stands:
- src/modules/query-retrieval/service/search.service.ts
---
## What it is
This task writes the test that closes the testable remainder siegard-reconcile/aliases-fuzzy-context-3.md recorded for rules/knowledge-base/link-and-fragment-items-carry-no-match.
The implementation stands in the files under `stands` and is not changed.

## Notes
UNDERDETERMINED, from the specification — The statement of rules/knowledge-base/link-and-fragment-items-carry-no-match, "A search item for a knowledge link or an information fragment carries no node match and no similarity.", covers two item kinds. Its Description also names "link items, including links a search's expansion reaches". The only criterion covers one fragment item, the one the chunk layer surfaces. No criterion makes the test fail when a knowledge link item carries a node match or a similarity. That includes a link reached by expansion from an approximately matched knowledge node. If the record's remainder leaves the link clause to a proof that already exists, the caller can say so. Without that, the objective ("fails whenever the fact ... stops holding") is not met for this clause. Passes: Delivered code that puts the node match and similarity of the knowledge node a search expanded from onto each knowledge link item it reaches. It also leaves both fields empty on fragment items the chunk layer surfaces. That code passes the criterion, and the rule refuses it.
UNDERDETERMINED, from the specification — The criterion tests only a fragment item that the chunk layer surfaces and the fragment layer does not match. No criterion tests a fragment item that the fragment layer matches directly. The statement of rules/knowledge-base/link-and-fragment-items-carry-no-match says that item also carries no node match and no similarity. Passes: Delivered code that gives a fragment item a similarity, or a node match, only when the fragment layer's own full-text match found it. It leaves both fields empty when the item comes only from a chunk-layer match. That code passes the criterion, and the rule refuses it.
