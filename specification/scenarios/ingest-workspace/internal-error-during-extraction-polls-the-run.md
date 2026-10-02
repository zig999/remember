---
subject: rules/ingest-workspace/connection-drop-is-an-unconflicting-envelope
given:
- "the extraction of a new source is running"
- "the back end answers 500 with the code SYSTEM_INTERNAL_ERROR"
when:
- "the extraction call fails"
then:
- "no failure is shown"
- "the screen moves to polling and shows \"Verificando extração…\""
---

## Description

An internal error of the back end is treated as a lost connection, so the screen watches the run instead of failing.
