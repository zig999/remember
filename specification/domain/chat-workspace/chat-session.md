---
type: aggregate-root
attributes:
- name: conversation_id
  type: string
- name: draft
  type: string
- name: chat_status
  type: chat-status
  required: true
- name: streamed_text
  type: string
  required: true
- name: tool_chips
  type: tool-chip
  many: true
- name: idempotency_key
  type: string
- name: is_streaming
  type: boolean
  required: true
- name: last_outcome
  type: send-outcome
- name: history_state
  type: message-list-state
operations:
- select-conversation
- send-message
- stop-turn
- cancel-turn
- reactivate-conversation
---

## Description

One sitting of the owner at the chat screen, from the conversation chosen to the turn being streamed.

## Responsibility

It keeps the conversation shown, what the owner typed, the turn in flight and the outcome of the last send, so that the screen shows one consistent state.
