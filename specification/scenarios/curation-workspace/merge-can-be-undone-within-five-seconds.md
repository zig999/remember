---
subject: rules/curation-workspace/undo-restores-the-item-and-sends-nothing
given:
- "the owner merged an entity match and the undo toast is open"
when:
- "the owner undoes within five seconds"
then:
- "the item is back in the queue"
- "nothing was sent to the server"
---

## Description

A merge costs the owner nothing for five seconds.
