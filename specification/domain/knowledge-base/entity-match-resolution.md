---
type: value-object
attributes:
- name: decision
  type: entity-match-decision
  required: true
- name: reason
  type: string
relationships:
- target: knowledge-node
  type: reference
  cardinality: '1'
  role: node
- target: knowledge-node
  type: reference
  cardinality: 0..1
  role: target
---

## Description

The owner's decision about one knowledge node awaiting an entity-match decision, naming the node it merges into when it merges, and why.

## Responsibility

It carries the decision that closes an entity-match review.
