---
type: aggregate-root
attributes:
- name: role
  type: domain/chat/message-role
  required: true
- name: streaming
  type: boolean
  required: true
- name: errored
  type: boolean
  required: true
- name: stop_notice
  type: string
operations:
- show-message
---

## Description

One message of a conversation drawn as a bubble.

## Responsibility

It shows the message text, its tool calls and why a reply stopped.
