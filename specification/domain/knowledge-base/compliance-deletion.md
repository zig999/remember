---
type: aggregate-root
attributes:
- name: executed_at
  type: datetime
  required: true
- name: reason
  type: string
  required: true
- name: affected
  type: string
relationships:
- target: raw-information
  type: reference
  cardinality: '1'
---

## Description

The record that a raw information was deleted to honour a data-protection obligation, and when the deletion was executed.

## Responsibility

It keeps a deleted source's knowledge from being presented as still traceable.
