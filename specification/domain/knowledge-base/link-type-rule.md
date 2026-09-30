---
type: entity
aggregate: link-type
attributes:
- name: valid_from
  type: date
- name: valid_to
  type: date
relationships:
- target: node-type
  type: reference
  cardinality: '1'
  role: source
- target: node-type
  type: reference
  cardinality: '1'
  role: target
---

## Description

The catalog's permission for links of one link type from knowledge nodes of one node type to knowledge nodes of another, over a span of days.

## Responsibility

It fixes which pairs of node types a link type may join.
