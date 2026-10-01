---
entries:
- field: statement
  unstated: The material has MCP proposals record a tool call on every outcome and REST proposals record none; the two decide differently for a proposal carried over REST.
  decided: Every proposal within a run records its tool call, whichever transport carried it.
  why: A run's summary is counted from its tool calls, so a proposal without one would vanish from its run's account.
- field: statement
  unstated: The material has a refused or failed proposal always recorded as a tool call, while the code keeps none when recording that tool call itself fails.
  decided: A refused or failed proposal whose tool call cannot be recorded is the one exception to being recorded.
  why: The owner holds the code as the truth, and the handler logs the failed recording and answers the original refusal.
---
