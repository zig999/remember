---
type: value-object
attributes:
- name: executed_from
  type: datetime
- name: executed_to
  type: datetime
- name: page
  type: page
relationships:
- target: raw-information
  type: reference
  cardinality: 0..1
---

## Description

What a listing of compliance deletions is narrowed to: the raw information deleted, a window over execution times, and the page.

## Responsibility

None.
