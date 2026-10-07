---
subject: rules/knowledge-base/conflict-disputes
given:
- a link type that does not allow multiple current links
- a current knowledge link of that type from node A to node B
when:
- a proposal of that link type from A to node C arrives with change hint none, citing no fragment that signals succession
then:
- the current link is marked disputed
- a new link from A to C is recorded in status disputed
- the new link supersedes nothing
involves:
- rules/knowledge-base/consolidation-precedence
- rules/knowledge-base/succession-closes-previous
---

## Description

None.
