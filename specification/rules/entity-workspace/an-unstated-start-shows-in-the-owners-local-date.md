---
type: invariant
statement: "The today an unstated validity start shows as MUST be the browser clock's calendar date in the owner's local time zone as the browser reports it."
constrains:
- domain/entity-workspace/attribute-field
---

## Description

Names the time zone in which the entity screen reads the calendar date it shows as today for a validity start the owner has not stated. It does not decide that such a start shows as today and is sent empty, which rules/entity-workspace/an-unstated-start-shows-as-today-and-is-sent-empty holds. It also does not decide which date the knowledge base records for that start, which rules/knowledge-base/entity-edit-start-defaults-to-today holds.
