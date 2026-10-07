---
subject: rules/knowledge-base/entity-edit-names-a-live-attribute
given:
- "a project's deadline attribute was superseded after the owner opened the form"
when:
- "the owner saves an edit whose set change names that superseded attribute"
then:
- "the edit is refused as a conflict"
- "nothing of the edit is recorded"
---

## Description

A form opened before another change cannot overwrite what that change recorded.
