---
subject: rules/chat-workspace/escape-aborts-the-turn-from-anywhere
given:
- "a turn is streaming and focus is on the graph pane"
when:
- "the owner presses Escape"
then:
- "the turn is aborted"
---

## Description

Escape stops the turn even when focus is elsewhere.
