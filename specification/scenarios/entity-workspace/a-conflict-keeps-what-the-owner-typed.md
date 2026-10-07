---
subject: rules/entity-workspace/a-conflict-keeps-the-typed-values
given:
- "the owner changed the status of a project and another operation superseded its current status after the form was opened"
when:
- "the knowledge base answers the edit with a conflict"
then:
- "the form still holds the status the owner typed"
- "an alert says the node changed since the form was opened"
---

## Description

A conflict never costs the owner what they typed.
