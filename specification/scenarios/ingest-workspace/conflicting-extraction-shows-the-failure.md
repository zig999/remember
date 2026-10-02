---
subject: rules/ingest-workspace/connection-drop-is-an-unconflicting-envelope
given:
- "the extraction of a new source is running"
- "the back end answers 409"
when:
- "the extraction call fails"
then:
- "the screen moves to the error phase"
- "the failure shows the code and the message of the answer"
---

## Description

A refusal for a conflict is a real answer, so it is shown.
