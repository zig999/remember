---
entries:
- field: relationships.message.cardinality
  unstated: The material does not say whether a conversation may hold no message.
  decided: 0..*
  why: Nothing in the material requires a message before a conversation exists.
- field: relationships.tool-call.cardinality
  unstated: The material does not say how many tool calls a conversation holds.
  decided: 0..*
  why: A conversation need not call any tool.
---
