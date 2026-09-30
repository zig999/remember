---
type: aggregate-root
attributes:
- name: title
  type: string
- name: rolling_summary
  type: string
- name: archived_at
  type: datetime
- name: created_at
  type: datetime
  required: true
- name: updated_at
  type: datetime
  required: true
relationships:
- target: message
  type: composition
  cardinality: 0..*
- target: tool-call
  type: composition
  cardinality: 0..*
- target: graph-view
  type: composition
  cardinality: 0..1
---

## Description

One conversation the owner holds with the assistant, with an optional title and running summary, archived once it has an archiving time.

## Responsibility

It is the unit a conversation's messages, tool calls and graph view live and are removed with.
