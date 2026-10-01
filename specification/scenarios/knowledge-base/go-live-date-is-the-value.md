---
subject: rules/knowledge-base/extraction-event-date-is-the-value
given:
- a document dated 2026-06-20 announces a go-live on 2026-08-01
when:
- an extraction under prompt version v2 or later reads it
then:
- the model is asked to propose event_date 2026-08-01 for the go-live
- the model is asked to give 2026-06-20 as that proposal's validity start with the basis document
involves:
- rules/knowledge-base/extraction-dates-events
- domain/knowledge-base/valid-from-basis
---

## Description

None.
