---
type: aggregate-root
attributes:
- name: name
  type: string
  required: true
- name: label
  type: string
  required: true
- name: inverse_name
  type: string
  required: true
- name: description
  type: string
  required: true
- name: is_temporal
  type: boolean
  required: true
- name: allows_multiple_current
  type: boolean
  required: true
- name: requires_valid_from
  type: boolean
  required: true
- name: requires_valid_to_on_change
  type: boolean
  required: true
relationships:
- target: link-type-rule
  type: composition
  cardinality: 0..*
---

## Description

A named kind of relation the catalog holds.

## Responsibility

It fixes which relations a link may assert.
