---
type: invariant
statement: Every proposal made within an LLM run is recorded as one of its tool calls, with its arguments, its result and its validation outcome, whichever transport carried it and whether it was taken, refused or failed, unless recording the tool call of a refused or failed proposal itself fails.
constrains:
- domain/knowledge-base/llm-run
- domain/knowledge-base/tool-call
- domain/knowledge-base/proposal
---

## Description

None.
