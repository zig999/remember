---
subject: rules/chat-workspace/first-graph-delta-replaces-and-later-ones-add
given:
- "the pane holds the graph of the last turn"
- "two graph_delta frames with nodes arrive in the new turn"
when:
- "the second frame is applied"
then:
- "the first frame replaced the old graph"
- "the second was added onto it"
---

## Description

One turn builds one graph, replacing the old one only once.
