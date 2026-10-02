---
type: value-object
attributes:
- name: caption
  type: string
  required: true
- name: dispatch_kind
  type: dispatch-kind
  required: true
- name: deadline
  type: datetime
  required: true
---

## Description

A destructive decision that has not yet been sent, waiting for the owner to undo it.

## Responsibility

It keeps the decision, its caption and the moment its undo window ends.
