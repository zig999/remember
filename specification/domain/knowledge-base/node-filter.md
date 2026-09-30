---
type: value-object
attributes:
- name: name_prefix
  type: string
- name: status
  type: node-status
- name: page
  type: page
relationships:
- target: node-type
  type: reference
  cardinality: 0..1
---

## Description

What a listing of knowledge nodes is narrowed to: a node type, the start of a name, a node status, and the page.

## Responsibility

None.
