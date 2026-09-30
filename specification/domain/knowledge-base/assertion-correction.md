---
type: value-object
attributes:
- name: assertion_kind
  type: assertion-kind
  required: true
- name: item_id
  type: string
  required: true
- name: corrected
  type: corrected-values
  required: true
- name: reason
  type: string
  required: true
---

## Description

The owner's correction of one knowledge link or node attribute, and why.

## Responsibility

It carries the replacement of a wrong assertion by a corrected one.
