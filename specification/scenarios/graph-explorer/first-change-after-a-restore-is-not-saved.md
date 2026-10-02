---
subject: rules/graph-explorer/a-change-saves-only-with-a-conversation-and-nodes
given:
- "a saved view was just restored for the active conversation"
when:
- "the first graph change with at least one node happens"
then:
- "nothing is saved"
- "the next change is saved after 800 milliseconds"
---

## Description

A restore does not write itself back.
