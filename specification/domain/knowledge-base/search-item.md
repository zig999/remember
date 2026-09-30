---
type: value-object
attributes:
- name: kind
  type: item-kind
  required: true
- name: layer
  type: search-layer
- name: score
  type: decimal
  required: true
- name: hop
  type: integer
- name: summary
  type: string
- name: flags
  type: assertion-flag
  many: true
relationships:
- target: information-fragment
  type: association
  cardinality: 1..*
  role: provenance
---

## Description

One ranked answer of a search: a knowledge node, a knowledge link or an information fragment, with the fragments that support it.

## Responsibility

It tells the owner what matched, how strongly, and where it came from.
