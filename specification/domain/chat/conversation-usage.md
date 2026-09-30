---
type: value-object
attributes:
- name: messages
  type: integer
  required: true
- name: tokens_in
  type: integer
  required: true
- name: tokens_out
  type: integer
  required: true
- name: tool_calls
  type: integer
  required: true
---

## Description

How much one conversation has used: its messages, the model tokens its answers consumed and produced, and its tool calls.

## Responsibility

None.
