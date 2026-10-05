---
title: Approximate node match
summary: The trigram route of the node layer, which matches a knowledge node through the word similarity of a normalized alias of at least 5 characters.
rationale: 'The match is cut apart from the ranking and from the item field because each changes for its own reason: the decision of what matches, the order of what matched, and the wire shape of an item.'
sources:
- intake/scope.md
- intake/material-aliases-fuzzy-contexto.md
objective: A search returns a knowledge node whose alias approximately matches the query text, and expands from it like any matched node.
criteria:
- A search for "Petrobrass" returns the knowledge node "Petrobras" at hop 0.
- A search for "contrato Petrobrass" returns the knowledge node "Petrobras".
- A search for "contrato Petrobras" returns the knowledge node "Petrobras" when no alias holds the word "contrato".
- A search for "CNPJ" does not return the knowledge node "CNPq" whose only alias is "CNPq".
- An alias shorter than 5 characters once normalized never matches a knowledge node approximately.
- A knowledge node whose aliases all have a word similarity below 0.6 to the query text is not matched approximately.
- The 0.6 threshold is one named constant.
- A search for "PETROBRÁSS" scores the knowledge node "Petrobras" with the same similarity as a search for "petrobrass".
- The similarity of "Petrobras" for "contrato Petrobrass" equals its similarity for "Petrobrass".
- An approximately matched knowledge node scores the highest word similarity of its aliases to the query text, times 0.9.
- A knowledge node matched both exactly and approximately appears once among the search items.
- The node layer keeps at most 200 candidates, counting both routes together.
- A search for "Petrobrass" returns no fragment-layer item for a fragment whose text holds only "Petrobras".
- A search for "Petrobrass" returns no chunk-layer item for a chunk whose text holds only "Petrobras".
- A knowledge link one hop from an approximately matched knowledge node is returned with 0.5 times that node's score.
implements:
- rules/knowledge-base/node-layer-approximate-match
- rules/knowledge-base/node-layer-matches-through-aliases
- rules/knowledge-base/word-similarity
- rules/knowledge-base/name-normalization
- rules/knowledge-base/approximate-match-strength
- rules/knowledge-base/layer-weights
- rules/knowledge-base/search-layer-candidate-cap
- rules/knowledge-base/expansion-decay
- rules/knowledge-base/prose-matching
- scenarios/knowledge-base/misspelled-name-matches-approximately
- scenarios/knowledge-base/misspelled-name-inside-longer-query
- scenarios/knowledge-base/unmatched-term-leaves-approximate-match
- scenarios/knowledge-base/short-alias-never-matches-approximately
---
## What it is
The node-layer query of search gains a second route by word similarity over node_alias.alias_norm, next to the existing full-text route.
Its hits are merged with the full-text hits, and enter graph expansion through the existing matched-node path.

## Notes

PER_LAYER_FETCH_LIMIT, the layer weights in scoring.ts and scoreMatchedNodes are reused, and the expansion path is not duplicated.
A node hit is dropped when listProvenanceForNodes finds no accepted fragment mentioning its alias.
UNDERDETERMINED, from the specification — rules/knowledge-base/node-layer-approximate-match matches a node approximately only when it does not match it exactly. The criterion "A knowledge node matched both exactly and approximately appears once among the search items." requires only that the node appears once. It does not say which match the single item keeps. No criterion of this task requires that a node meeting both conditions keeps the exact match and its exact-match score. Passes: An implementation that removes the duplicate by keeping the approximate entry. The node then scores its highest alias word similarity times 0.9 instead of its exact-match strength. Under rules/knowledge-base/search-ranking it would also fall into the group of items reached only through approximate matches. scenarios/knowledge-base/correct-name-matches-exactly refuses this, since it requires match exact there, but it is not among the nodes this task implements.
UNDERDETERMINED, from the specification — rules/knowledge-base/node-layer-approximate-match sets two inclusive bounds: an alias "at least 5 characters long once normalized" and a word similarity "of at least 0.6". The criteria state only the exclusions: shorter than 5 never matches, and below 0.6 is not matched. The positive examples (Petrobrass, contrato Petrobrass, contrato Petrobras) use a 9-character alias with a similarity well above 0.6, so they never test either boundary. Passes: An implementation that requires a word similarity strictly greater than 0.6, or an alias of at least 6 normalized characters. Every criterion still holds, including a named constant valued 0.6, yet a 5-character alias with a word similarity of exactly 0.6 is refused.
UNDERDETERMINED, from the specification — rules/knowledge-base/name-normalization compares names after lower-casing, removing accents, trimming and collapsing inner whitespace. The only criteria on normalization are the case-and-accent one (PETROBRÁSS vs petrobrass) and the 5-character floor "once normalized". Trimming and collapsing whitespace are reached by no criterion. Passes: An implementation that lower-cases and removes accents but measures the 5-character floor and the word similarity on text that is not trimmed and has not had its whitespace collapsed. A 4-character name stored with surrounding or doubled spaces would then clear the floor.
REMAINDER, from the specification — Two clauses of rules/knowledge-base/name-normalization are not reached by any criterion of this task. One covers entity resolution and the node listing. The other covers alias admission. Belongs: Entity resolution and the node listing belong to the delivered ingestion and node-listing acts. Alias admission belongs to the alias-admission epic of this work.
UNDERDETERMINED, from the specification — rules/knowledge-base/search-layer-candidate-cap says "its total counts the candidates kept". The criterion "The node layer keeps at most 200 candidates, counting both routes together." bounds what is kept. It says nothing about the total the answer reports. Passes: An implementation that caps the node layer at 200 across both routes but computes the reported total from the uncapped exact and approximate candidates.
UNDERDETERMINED, from the specification — rules/knowledge-base/expansion-decay scores a link reached at hop h as 0.5 raised to h, times the matched node's score. The only criterion tests a link one hop from an approximately matched node. Deeper hops from an approximate match are not tested, although the objective says it expands "like any matched node". Passes: An implementation that, for links reached from an approximately matched node, applies a single 0.5 factor whatever the hop. A link at hop 2 would then score 0.5 times the node's score instead of 0.25 times it.
REMAINDER, from the specification — Two kinds of clause in the candidate rules are not reached by this task's criteria. The per-layer cap of rules/knowledge-base/search-layer-candidate-cap for the fragment and chunk layers is one. The fragment-layer weight (1.0) and the chunk-layer weight (0.6) of rules/knowledge-base/layer-weights are the other. Belongs: The delivered fragment-layer and chunk-layer search, which this work leaves full-text only.
REMAINDER, from the specification — rules/knowledge-base/prose-matching backs this task only negatively: fragment text and chunk text are matched lexically with Portuguese stemming, never by trigram. Its positive clauses are not reached here: stemmed, accent-insensitive matching of fragment text, of chunk text, and of the fragments that mention a node. Belongs: The delivered full-text fragment and chunk layers, and the node layer's lookup of supporting fragments.
REMAINDER, from the specification — rules/knowledge-base/search-ranking ranks every item reached only through approximately matched nodes after all others, then by score, recording time and identifier. No criterion of this task reaches any of these clauses. Belongs: The task of the approximate-node-search epic that ranks search items.
REMAINDER, from the specification — Four rules are not reached by this task's criteria. rules/knowledge-base/node-item-shows-match says a hop-0 node item carries its match and the similarity of an approximate match. rules/knowledge-base/approximate-match-similarity says that similarity is unweighted. rules/knowledge-base/exact-node-item-carries-no-similarity says an exact item carries none. rules/knowledge-base/link-and-fragment-items-carry-no-match says link and fragment items carry neither. Belongs: The task of the approximate-node-search epic that makes search items carry their node match and similarity, together with the search answer of contracts/knowledge-base/retrieval.
ADVISORY, from the specification — The criterion "The 0.6 threshold is one named constant." constrains the form of the source, not a fact of the business. No node states it and none should. It is checked by reading the code, not through the search's behavior.
ADVISORY, from the specification — scenarios/knowledge-base/misspelled-name-matches-approximately also says "the item carries the match approximate and its similarity". That clause is answered by the sibling task that adds the match field, not by this task's criteria. An executor reading the scenario should not take it as this task's to deliver.
ADVISORY, from the specification — scenarios/knowledge-base/short-alias-never-matches-approximately gives "CNPq" no accepted information fragment. The other scenarios give each node one, and domain/knowledge-base/search-item requires 1..* provenance fragments. A test of "A search for \"CNPJ\" does not return the knowledge node \"CNPq\" whose only alias is \"CNPq\"." built on that given could pass because the node has no support, not because of the 5-character floor.
