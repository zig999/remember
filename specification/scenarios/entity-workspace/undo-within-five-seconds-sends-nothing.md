---
subject: rules/entity-workspace/saving-waits-for-undo
given:
- "the owner confirmed the review of an edit that changes one field"
when:
- "the owner undoes the edit three seconds later"
then:
- "no edit is sent to the knowledge base"
- "the form still holds the owner's typed values"
---

## Description

An undo inside the five seconds leaves the knowledge base as it was.
