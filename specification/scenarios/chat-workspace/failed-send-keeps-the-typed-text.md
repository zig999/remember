---
subject: rules/chat-workspace/successful-send-empties-the-field
given:
- "the owner typed a message and the back end answers an error frame"
when:
- "the send resolves"
then:
- "the text field still holds the typed text"
---

## Description

A failed send costs the owner nothing they typed.
