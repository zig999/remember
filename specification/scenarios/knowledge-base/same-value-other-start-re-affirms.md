---
subject: rules/knowledge-base/reaffirmation-consolidates
given:
- an attribute key that does not allow multiple current values
- a current node attribute of that key holding the value V, valid from 2026-01-01
when:
- a proposal of that key for the same node arrives with change hint none, the value V and valid from 2026-03-01
then:
- the proposal re-affirms the attribute
- the provenance of the proposal is added to the attribute
- no new attribute is recorded
- the attribute stays valid from 2026-01-01
involves:
- rules/knowledge-base/consolidation-precedence
- rules/knowledge-base/conflict-disputes
---

## Description

None.
