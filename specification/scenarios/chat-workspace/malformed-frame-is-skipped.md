---
subject: rules/chat-workspace/malformed-frames-are-skipped-silently
given:
- "the stream carries a text_delta frame whose data is not JSON between two good ones"
when:
- "the stream is read"
then:
- "the bad frame is skipped silently"
- "the good frames are applied"
---

## Description

One bad frame does not end the turn.
