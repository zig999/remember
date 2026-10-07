---
subject: rules/entity-workspace/an-unstated-start-shows-as-today-and-is-sent-empty
given:
- "the owner changed the deadline of a project and gave no validity start"
when:
- "the owner confirms the review"
then:
- "the validity start shows as today in the review"
- "the change is sent with no validity start"
---

## Description

The knowledge base, not the form, records today with the basis received.
