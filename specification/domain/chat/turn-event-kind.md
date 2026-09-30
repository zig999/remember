---
type: enumeration
values:
- llm-start
- text-delta
- tool-start
- tool-result
- graph-delta
- done
- error
---

## Description

What the owner is streamed while a turn runs: a model call starting, a piece of the answer's text, a tool call starting, its result, the part of the knowledge graph it showed, and the turn ending as done or in error.

## Responsibility

None.
