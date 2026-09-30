---
subject: rules/knowledge-base/dispute-scope
given:
- knowledge node Ana holds two disputed reports_to links, one to Bruno and one to Carla
- reports_to does not allow multiple current links
when:
- the owner resolves the dispute naming both links, deciding prefer-one with the link to Bruno as winner
then:
- the resolution is accepted
- the link to Bruno is active
- the link to Carla is deleted
- one curation action of kind resolve-dispute is recorded at the link to Bruno
involves:
- rules/knowledge-base/dispute-resolution-single-scope
- rules/knowledge-base/prefer-one-outcome
- rules/knowledge-base/dispute-resolution-records-curation-action
---

## Description

The two links compete for the same ground although their targets differ, because the link type admits a single current link.
