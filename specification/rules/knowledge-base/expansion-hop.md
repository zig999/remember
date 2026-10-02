---
type: policy
statement: A search's expansion reaches a knowledge link at the hop equal to the number of knowledge links on the expansion path from the matched knowledge node up to and including that link, so a link with the matched knowledge node as one endpoint is reached at hop 1.
constrains:
- domain/knowledge-base/knowledge-link
- domain/knowledge-base/search-item
---

## Description

This rule sets how a search's expansion counts the hop at which it reaches a knowledge link along one expansion path.
It does not set the score a link gets at that hop. rules/knowledge-base/expansion-decay sets that.
It does not choose among several paths that reach the same link. rules/knowledge-base/expansion-link-once covers that.
It does not count the hops of a traversal.
