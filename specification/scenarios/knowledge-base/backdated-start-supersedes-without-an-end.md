---
subject: rules/knowledge-base/entity-edit-succession-closes-the-previous
given:
- "a project holds an active status starting on 2026-10-01 with no validity end"
when:
- "the owner edits the project, setting a set change that names that status with another status and states a validity start of 2026-09-01"
then:
- "the earlier status is superseded and is given no validity end"
- "the new status starts on 2026-09-01 with the basis stated"
---

## Description

A start on or before the earlier start leaves no period to close.
