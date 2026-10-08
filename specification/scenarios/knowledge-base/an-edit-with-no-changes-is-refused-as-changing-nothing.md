---
subject: rules/knowledge-base/entity-edit-changes-something
given:
- "a person is an active knowledge node"
when:
- "the owner edits the person with a reason and an empty list of changes"
then:
- "the edit is refused as changing nothing, not as a malformed request"
- "nothing of the edit is recorded"
involves:
- domain/knowledge-base/entity-edit
---

## Description

An edit that carries no change at all is refused for changing nothing. What the edit answers for that refusal belongs to contracts/knowledge-base/entity-editing.
