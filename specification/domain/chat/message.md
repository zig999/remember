---
type: entity
aggregate: conversation
attributes:
- name: role
  type: message-role
  required: true
- name: content
  type: string
  required: true
- name: stop_reason
  type: string
- name: idempotency_key
  type: string
- name: model
  type: string
- name: tokens_in
  type: integer
- name: tokens_out
  type: integer
- name: latency_ms
  type: integer
---

## Description

One turn of a conversation, spoken by the owner or by the assistant.

## Responsibility

It holds what was said in a conversation, in the words it was said.
