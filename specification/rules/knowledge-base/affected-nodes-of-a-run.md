---
type: policy
statement: An LLM run's affected knowledge nodes are those its node proposals resolved to and those joined or described by its link and attribute proposals whose outcome was accepted, consolidated, superseded a previous assertion, disputed, created, matched an existing node or needs review, each listed once in the order first reached.
constrains:
- domain/knowledge-base/llm-run
- domain/knowledge-base/knowledge-node
- domain/knowledge-base/proposal
consistency: eventual
---

## Description

None.
