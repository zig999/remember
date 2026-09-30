---
type: entity
aggregate: conversation
attributes:
- name: tool_name
  type: string
  required: true
- name: arguments
  type: string
  required: true
- name: result
  type: string
- name: is_error
  type: boolean
  required: true
- name: error_message
  type: string
- name: duration_ms
  type: integer
  required: true
relationships:
- target: message
  type: association
  cardinality: 0..1
---

## Description

One call the assistant made to a tool while answering in a conversation, with what it was given, what it returned or the error it met, and how long it took.

## Responsibility

It shows the owner which tools an answer rested on.
