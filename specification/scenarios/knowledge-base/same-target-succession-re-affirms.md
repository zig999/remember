---
subject: rules/knowledge-base/reaffirmation-consolidates
given:
- a link type that does not allow multiple current links
- a current knowledge link of that type from node A to node B, valid from 2024-01-01
when:
- a proposal of that link type from A to B arrives with change hint succession, valid from 2024-06-01
then:
- the proposal re-affirms the link
- the provenance of the proposal is added to the link
- no new link is recorded
- the link is not marked disputed
- the link stays valid from 2024-01-01
involves:
- rules/knowledge-base/consolidation-precedence
- rules/knowledge-base/succession-closes-previous
---

## Description

None.
