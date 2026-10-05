---
title: Search item shows how a node matched
summary: The match and similarity fields on a hop-0 knowledge node search item, kept apart from the assertion flags.
rationale: The item field is cut apart from the match because it is the interface of the search service, and apart from the transport answers because those consume it.
sources:
- intake/scope.md
- intake/material-aliases-fuzzy-contexto.md
objective: Each hop-0 knowledge node item the search service builds says whether it matched exactly or approximately.
criteria:
- An exactly matched hop-0 knowledge node item carries the match exact.
- An approximately matched hop-0 knowledge node item carries the match approximate.
- An approximately matched hop-0 knowledge node item carries its similarity.
- An exactly matched knowledge node item carries no similarity.
- A search for "petrobras" over the knowledge nodes "Petrobras" and "Petrobrás Distribuidora", each with an accepted information fragment mentioning it, returns both knowledge nodes.
- In a search for "petrobras" over the knowledge nodes "Petrobras" and "Petrobrás Distribuidora", both returned knowledge node items carry the match exact.
- A knowledge node matched both exactly and approximately carries the match exact.
- The flags of an approximately matched knowledge node item hold no value describing its match.
- A knowledge link item reached by expansion carries no match.
depends_on:
- task/approximate-node-search/approximate-node-match
implements:
- domain/knowledge-base/search-item
- domain/knowledge-base/node-match
- domain/knowledge-base/assertion-flag
- rules/knowledge-base/node-item-shows-match
- rules/knowledge-base/exact-node-item-carries-no-similarity
- rules/knowledge-base/approximate-match-similarity
- rules/knowledge-base/link-and-fragment-items-carry-no-match
- rules/knowledge-base/node-layer-approximate-match
- rules/knowledge-base/node-layer-matches-through-aliases
- scenarios/knowledge-base/correct-name-matches-exactly
- contracts/knowledge-base/retrieval
---
## What it is
The search item gains a match field and a similarity field, set by toSearchItem for knowledge node items at hop 0.

## Notes

computeFlags carries only assertion signals and stays unchanged.
UNDERDETERMINED, from the specification — rules/knowledge-base/approximate-match-similarity says what the similarity's value is. It is the highest word similarity among the node's aliases to the query text, with no layer weight applied. The criterion "An approximately matched hop-0 knowledge node item carries its similarity." only requires that some similarity is present. No criterion pins its value. Passes: An approximately matched hop-0 knowledge node item whose similarity is the weighted strength (0.9 times the word similarity, which is the node-layer score input), or any other number such as the trigram similarity of the whole query, meets every criterion. rules/knowledge-base/approximate-match-similarity refuses it.
UNDERDETERMINED, from the specification — rules/knowledge-base/link-and-fragment-items-carry-no-match says that a knowledge link item and an information fragment item carry no node match and no similarity. The criterion "A knowledge link item reached by expansion carries no match." covers only the match, and only on link items. No criterion covers fragment items, and no criterion covers similarity on link or fragment items. Passes: An implementation can set a match on information fragment items that mention an approximately matched node. It can also attach the source node's similarity to link items that expansion reaches from an approximately matched node. Either meets every criterion, and rules/knowledge-base/link-and-fragment-items-carry-no-match refuses both.
UNDERDETERMINED, from the specification — contracts/knowledge-base/retrieval publishes this for the search operation. Its accepted answer shows each knowledge node matched directly, with whether it matched exactly or approximately and the similarity of an approximate match. Every criterion is phrased at the level of the item the search service builds. No criterion requires the published search answer to carry match and similarity. Passes: The search service builds match and similarity on each hop-0 knowledge node item. The REST or MCP search answer then leaves those fields out, for example because a response schema strips unknown properties. This meets every criterion, and the search answer of contracts/knowledge-base/retrieval refuses it.
REMAINDER, from the specification — The statement of rules/knowledge-base/node-layer-approximate-match has more clauses than this task's criteria reach. One clause is that an approximate match needs an alias at least 5 characters long once normalized. Another is that the alias's word similarity to the query text must be at least 0.6. Only the clause "when it does not match it exactly" is answered here, by "A knowledge node matched both exactly and approximately carries the match exact." Belongs: The task that implements the node layer's approximate match of knowledge nodes, meaning the alias length floor and the 0.6 word-similarity threshold. It sits in the same approximate-node-search epic.
ADVISORY, from the specification — scenarios/knowledge-base/misspelled-name-matches-approximately (a search for "Petrobrass" over "Petrobras") has this then-clause - "the item carries the match approximate and its similarity". That clause is the concrete case of this task's criteria for approximate match and similarity. Its other then-clause, that the node is returned at hop 0, depends on the approximate match itself. The scenario is not named in implements here. The caller decides which task carries it, and whether this task's approximate criteria need it as a concrete case.
