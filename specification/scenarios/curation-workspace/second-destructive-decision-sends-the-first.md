---
subject: rules/curation-workspace/one-destructive-decision-waits-at-a-time
given:
- "a rejection is waiting for undo"
when:
- "the owner merges another entity match"
then:
- "the rejection is sent at once and its toast closes"
- "the merge now waits for undo"
---

## Description

Only one decision waits for undo, so the next one commits the one before.
