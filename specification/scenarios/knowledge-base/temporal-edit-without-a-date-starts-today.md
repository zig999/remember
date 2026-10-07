---
subject: rules/knowledge-base/entity-edit-start-defaults-to-today
given:
- "a project holds an active deadline of 2026-11-30 starting on 2026-03-01"
- "today is 2026-10-07"
when:
- "the owner edits the project, setting a set change that names that attribute with the value 2026-12-15 and states no validity start"
then:
- "the new deadline starts on 2026-10-07 with the basis received"
- "the earlier deadline is superseded with a validity end of 2026-10-07"
- "the change is reported with the effect succession"
---

## Description

An unstated start is today, and today is also where the earlier value ends.
