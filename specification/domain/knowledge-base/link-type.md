---
type: aggregate-root
attributes:
- name: name
  type: string
  required: true
- name: is_temporal
  type: boolean
- name: allows_multiple_current
  type: boolean
- name: requires_valid_from
  type: boolean
- name: requires_valid_to_on_change
  type: boolean
relationships:
- target: link-type-rule
  type: composition
  cardinality: 0..*
---

## Description

A named kind of relation the catalog holds.

## Responsibility

It fixes which relations a link may assert.
