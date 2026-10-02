---
subject: rules/graph-explorer/the-neighbour-is-the-other-end
given:
- "a relationship whose neighbour is missing from the answer's nodes"
when:
- "the relationships are shown"
then:
- "the neighbour is named by its id"
- "its type is empty"
---

## Description

A missing neighbour is not an error.
