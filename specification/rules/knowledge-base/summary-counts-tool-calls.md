---
type: invariant
statement: An LLM run's summary counts its tool calls by validation outcome, counting zero for an outcome no tool call has.
constrains:
- domain/knowledge-base/run-summary
- domain/knowledge-base/tool-call
- domain/knowledge-base/validation-outcome
---

## Description

None.
