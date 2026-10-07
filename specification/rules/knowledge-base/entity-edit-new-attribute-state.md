---
type: policy
statement: "An entity edit records every new attribute as active at confidence 1.0 under the LLM run it opened."
constrains:
- domain/knowledge-base/entity-edit
- domain/knowledge-base/node-attribute
- domain/knowledge-base/assertion-status
- domain/knowledge-base/llm-run
consistency: eventual
---

## Description

None.
