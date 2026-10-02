---
subject: rules/application-shell/a-rename-sends-the-trimmed-title
given:
- "the owner is renaming a conversation"
- "the field holds only spaces"
when:
- "the owner presses Enter"
then:
- "nothing is sent"
- "the field closes with no message"
---

## Description

A blank title is dropped silently.
