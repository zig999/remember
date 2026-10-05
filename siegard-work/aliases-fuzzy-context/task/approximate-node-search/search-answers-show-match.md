---
title: Search answers show how a node matched
summary: The REST search answer and the MCP search tool answer carrying the match and similarity of each hop-0 knowledge node item.
rationale: The transport answers are cut apart from the item field because they consume the item the search service builds rather than decide it.
sources:
- intake/scope.md
- intake/material-aliases-fuzzy-contexto.md
objective: Both search transports answer the match and similarity of each directly matched knowledge node.
criteria:
- The REST search answer carries the match on each hop-0 knowledge node item.
- The REST search answer carries the similarity on each approximately matched knowledge node item.
- The MCP search answer carries the match on each hop-0 knowledge node item.
- The MCP search answer carries the similarity on each approximately matched knowledge node item.
depends_on:
- task/approximate-node-search/search-item-shows-match
implements:
- contracts/knowledge-base/retrieval
- domain/knowledge-base/search-item
- domain/knowledge-base/node-match
- rules/knowledge-base/node-item-shows-match
- rules/knowledge-base/exact-node-item-carries-no-similarity
- rules/knowledge-base/approximate-match-similarity
- rules/knowledge-base/link-and-fragment-items-carry-no-match
- scenarios/knowledge-base/misspelled-name-matches-approximately
---
## What it is
The REST route and the MCP query toolset expose the new item fields in their search answers.

## Notes

The MCP search input reuses SearchQuerySchema, and the same searchKnowledgeService serves REST and MCP.
The chat graph normalizer reads search items to hydrate node identities.
UNDERDETERMINED, from the specification — rules/knowledge-base/exact-node-item-carries-no-similarity states that an exactly matched knowledge node search item carries no similarity, even when one of its aliases reaches the approximate threshold. No criterion says what an exactly matched item must leave out. The criteria only require a similarity on approximately matched items. Passes: Both transports put a similarity on every hop-0 knowledge node item. For an exact item they use the best alias word similarity, or 1.0. Every criterion still holds, because each hop-0 item carries a match and each approximate item carries a similarity.
UNDERDETERMINED, from the specification — rules/knowledge-base/link-and-fragment-items-carry-no-match states that knowledge link items and information fragment items carry no node match and no similarity. This includes links reached by expansion and fragments surfaced by the chunk layer. No criterion speaks about link or fragment items. Passes: Both transports serialize match and similarity on every search item. Knowledge link items and information fragment items get a default value, for example match "exact" or a null similarity, or inherit the values of the approximately matched node they were reached from. Every criterion still holds, because the criteria only look at knowledge node items.
UNDERDETERMINED, from the specification — rules/knowledge-base/approximate-match-similarity fixes the value of the similarity. It is the highest word similarity of the node's aliases to the query text, with no layer weight applied. The criteria only require that a similarity is carried, not what its value is. Passes: For an approximately matched item, both transports carry the item's weighted strength or its score as its similarity, for example 0.9 times the word similarity under rules/knowledge-base/layer-weights. Every criterion still holds, because a similarity is present on every approximate item.
ADVISORY, from the specification — Several scenarios check the match through the search answer's match field, but each one's subject is rules/knowledge-base/node-layer-approximate-match, the node layer's matching decision, and not the field this task carries. Those scenarios are scenarios/knowledge-base/correct-name-matches-exactly, scenarios/knowledge-base/misspelled-name-inside-longer-query, scenarios/knowledge-base/unmatched-term-leaves-approximate-match and scenarios/knowledge-base/short-alias-never-matches-approximately. They were left out of implements as neighbors. scenarios/knowledge-base/misspelled-name-matches-approximately is included because it involves rules/knowledge-base/node-item-shows-match and its outcome is the item carrying the match approximate and its similarity. Whether the scenarios left out are proven by this task or by the task that implements the node layer's matching is for the caller to decide.
