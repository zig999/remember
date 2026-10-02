---
type: value-object
attributes:
- name: stop_reason
  type: domain/chat/assistant-stop-reason
- name: error_code
  type: string
- name: error_message
  type: string
- name: idempotency_key
  type: string
  required: true
---

## Description

How a send ended, with the stop reason of a finished turn or the code and message of a failed one.

## Responsibility

It tells the composer whether the owner can try again or must wait.
