---
title: Rank approximate reach last
summary: The search ordering that puts every item reached only through approximately matched nodes after all the others.
rationale: Ranking is cut apart from the match because the ordering rule changes for a different reason than the decision of what matches.
sources:
- intake/scope.md
- intake/material-aliases-fuzzy-contexto.md
objective: Every search item the search reached only through approximately matched knowledge nodes ranks after all the other items.
criteria:
- An approximately matched knowledge node ranks after an exactly matched knowledge node whose score is lower.
- A knowledge link reached only through approximately matched knowledge nodes ranks after every item not reached only through them.
- A knowledge link reached from both an exactly matched and an approximately matched knowledge node ranks among the items not reached only through approximate matches.
- Within each group, items order by score descending.
- Within each group, items of equal score order by recording time descending, with a knowledge node counting as never recorded.
- Within each group, items of equal score and recording time order by identifier ascending.
depends_on:
- task/approximate-node-search/approximate-node-match
implements:
- rules/knowledge-base/search-ranking
- domain/knowledge-base/search-item
- domain/knowledge-base/node-match
---
## What it is
The ordering of merged search items gains a first key: whether the item was reached only through approximately matched nodes.

## Notes

The current sort is by score, recorded_at and id over IntermediateItem in search.service.ts.
UNDERDETERMINED, from the specification — The clause of rules/knowledge-base/search-ranking that puts "every item the search reached only through knowledge nodes it matched approximately after all the others" is answered for knowledge links by criterion 2. For approximately matched knowledge nodes, it is answered only by criterion 1, which compares them with exactly matched knowledge nodes. No criterion puts an approximately matched knowledge node after the knowledge links and information fragments not reached only through approximate matches. Passes: An ordering that puts every exactly matched knowledge node ahead of every approximately matched one and puts links reached only through approximate matches last, but otherwise interleaves approximately matched knowledge nodes by score with the other items. For example, an approximately matched knowledge node of score 0.8 ranks ahead of an information fragment of score 0.5 found by the fragment layer, while every exactly matched knowledge node stays ahead of both.
UNDERDETERMINED, from the specification — rules/knowledge-base/search-ranking states that a knowledge node, counting as never recorded, sorts "after every knowledge link and information fragment of equal score". The decision log beside it (search-ranking.log.md, field statement) records that this direction was decided into this node. Criterion 5 says only "with a knowledge node counting as never recorded", which fixes no direction for a never-recorded item in a most-recent-first order. Passes: An ordering by recording time descending that places items with no recording time first, as a descending sort that puts nulls first does. Among items of equal score it then ranks every knowledge node ahead of the knowledge links and information fragments.
UNDERDETERMINED, from the specification — rules/knowledge-base/search-ranking states that an information fragment search item counts as recorded at its creation time. The decision log beside it (search-ranking.log.md, field statement) records this as decided into this node. No criterion says which time a fragment item is ordered by when scores are equal. Passes: An ordering that ties information fragment items on equal score by their supersession time, or treats them as never recorded like knowledge nodes, and then orders them by identifier ascending.
ADVISORY, from the specification — The statement of rules/knowledge-base/search-ranking and the objective cover "every item" reached only through approximately matched knowledge nodes. The criteria name only knowledge nodes and knowledge links. None of the candidates states whether an information fragment item can be reached through a node-layer match. If it can, no criterion places such a fragment in the trailing group.
