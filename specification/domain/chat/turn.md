---
type: value-object
attributes:
- name: content
  type: string
  required: true
- name: model
  type: string
  required: true
- name: idempotency_key
  type: string
  required: true
- name: stop_reason
  type: assistant-stop-reason
- name: tokens_in
  type: integer
- name: tokens_out
  type: integer
relationships:
- target: conversation
  type: reference
  cardinality: '1'
---

## Description

One exchange the owner opens by sending a message to a conversation: the message, the model that answers it, the key that makes resending it safe, and how the answer ended.

## Responsibility

It is what the assistant answers, one at a time per conversation.
