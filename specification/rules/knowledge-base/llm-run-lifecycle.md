---
type: state-machine
statement: An LLM run moves only along the declared transitions.
subject: domain/knowledge-base/llm-run
status: domain/knowledge-base/run-status
initial: running
terminal:
- completed
transitions:
- from: running
  trigger: complete
  to: completed
- from: running
  trigger: fail
  to: failed
- from: failed
  trigger: retry
  to: running
rejections:
- from: running
  trigger: retry
- from: failed
  trigger: complete
- from: failed
  trigger: fail
---

## Description

None.
