---
type: invariant
statement: "A frame MUST carry the fields its event requires: none for llm_start, delta for text_delta, tool and args_summary for tool_start, ok for tool_result, stop_reason for done, code and message for error and source_tool, nodes and links for graph_delta."
constrains:
- domain/chat-workspace/chat-session
---

## Description

None.
