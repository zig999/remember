---
type: policy
statement: A search lists a knowledge link its expansion reaches by more than one path once, scored by the path whose decayed score is highest and at the lowest hop among the paths that give that score.
constrains:
- domain/knowledge-base/knowledge-link
- domain/knowledge-base/search-item
---

## Description

This rule covers a knowledge link that a search's expansion reaches more than once, whether at different hops or from different matched knowledge nodes.
It does not set the decayed score of a single path. rules/knowledge-base/expansion-decay sets that.
It also does not cover how a traversal lists the links it reaches. rules/knowledge-base/traversal-link-once covers that.
