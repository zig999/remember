---
title: Approximate node search
summary: The node layer of search also matches a knowledge node by the trigram word similarity of its aliases, ranks such matches last and says how each node matched.
rationale: The epic follows the second section of the material. The candidate cap and the expansion decay are covered because the approximate route has to honour both, just as the exact route already does.
sources:
- intake/scope.md
- intake/material-aliases-fuzzy-contexto.md
covers:
- domain/knowledge-base/node-match
- domain/knowledge-base/search-item
- rules/knowledge-base/word-similarity
- rules/knowledge-base/node-layer-approximate-match
- rules/knowledge-base/approximate-match-strength
- rules/knowledge-base/node-item-shows-match
- rules/knowledge-base/node-layer-matches-through-aliases
- rules/knowledge-base/search-ranking
- rules/knowledge-base/name-normalization
- rules/knowledge-base/search-layer-candidate-cap
- rules/knowledge-base/expansion-decay
- contracts/knowledge-base/retrieval
- scenarios/knowledge-base/misspelled-name-matches-approximately
- scenarios/knowledge-base/correct-name-matches-exactly
- scenarios/knowledge-base/misspelled-name-inside-longer-query
- scenarios/knowledge-base/unmatched-term-leaves-approximate-match
- scenarios/knowledge-base/short-alias-never-matches-approximately
- rules/knowledge-base/exact-node-item-carries-no-similarity
- rules/knowledge-base/link-and-fragment-items-carry-no-match
- rules/knowledge-base/approximate-match-similarity
- rules/knowledge-base/layer-weights
- rules/knowledge-base/prose-matching
- domain/knowledge-base/assertion-flag
---
## What it is
The node layer matches a knowledge node approximately when one of its aliases, at least 5 characters long once normalized, has a word similarity of at least 0.6 to the query text.
Items reached only through approximately matched nodes rank after all the others.
Each hop-0 knowledge node item says whether it matched exactly or approximately, and the similarity of an approximate match.
The REST and MCP search answers carry that field.

## Notes
The fragment and chunk layers stay full-text only.
The frontend search screen consumes the search answer, and it lies outside the backend target of this plan.
The trigram index node_alias_norm_trgm_idx on node_alias.alias_norm already exists in migrations/0001_init.sql, built with gin_trgm_ops.
