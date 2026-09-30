---
type: value-object
attributes:
- name: direction
  type: traversal-direction
- name: link_types
  type: string
  many: true
- name: depth
  type: integer
- name: as_of
  type: date
- name: in_effect_only
  type: boolean
relationships:
- target: knowledge-node
  type: reference
  cardinality: '1'
---

## Description

What the owner asks a traversal for: the knowledge node it starts from, which way to follow links, which link types, how many hops, and as of which day.
Link types are named by their catalog name.

## Responsibility

None.
