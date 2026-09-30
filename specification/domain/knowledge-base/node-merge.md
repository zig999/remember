---
type: value-object
attributes:
- name: reason
  type: string
  required: true
relationships:
- target: knowledge-node
  type: reference
  cardinality: '1'
  role: survivor
- target: knowledge-node
  type: reference
  cardinality: '1'
  role: absorbed
---

## Description

The owner's request that one active knowledge node be absorbed into another, found to be the same entity, and why.

## Responsibility

It carries the merge of two nodes the owner found to be one entity.
