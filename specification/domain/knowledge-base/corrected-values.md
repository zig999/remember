---
type: value-object
attributes:
- name: value
  type: string
- name: valid_from
  type: date
- name: valid_to
  type: date
- name: valid_from_basis
  type: valid-from-basis
relationships:
- target: knowledge-node
  type: reference
  cardinality: 0..1
  role: target
- target: information-fragment
  type: reference
  cardinality: 0..1
  role: errata
---

## Description

The values a correction puts in place of an assertion's: its value or target node, its validity start and end, the basis of the start, and the information fragment that justifies it.

## Responsibility

None.
