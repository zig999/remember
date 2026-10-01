---
entries:
- field: type
  unstated: The material leaves open whether the conversation records belong to the knowledge-base context or to a context of their own.
  decided: entity of a separate chat context
  why: A tool call in a conversation is any tool the assistant used, while a knowledge-base tool call is the audit of one proposal, so the same term carries two meanings.
- field: attributes.arguments.type
  unstated: The material holds a chat tool call's arguments as a structured document without giving its shape.
  decided: string
  why: Nothing in the material reads inside it, so it is carried whole as text.
- field: attributes.result.type
  unstated: The material holds a chat tool call's result as a structured document without giving its shape.
  decided: string
  why: Nothing in the material reads inside it, so it is carried whole as text.
---
