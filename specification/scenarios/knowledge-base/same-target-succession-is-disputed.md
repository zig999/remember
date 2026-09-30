---
subject: rules/knowledge-base/conflict-disputes
given:
- a link type that does not allow multiple current links
- a current knowledge link of that type from node A to node B
when:
- a proposal of that link type from A to B arrives with change hint succession, citing no errata
then:
- the proposal does not re-affirm the link, because its change hint is not none
- it does not succeed the link, because its target is the same
- the current link is marked disputed
- a new link from A to B is recorded in status disputed
involves:
- rules/knowledge-base/consolidation-precedence
- rules/knowledge-base/reaffirmation-consolidates
- rules/knowledge-base/succession-closes-previous
---

## Description

None.
