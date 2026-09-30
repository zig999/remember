---
type: entity
aggregate: knowledge-node
attributes:
- name: alias
  type: string
  required: true
- name: kind
  type: alias-kind
  required: true
relationships:
- target: llm-run
  type: reference
  cardinality: 0..1
---

## Description

One name a knowledge node is known by.

## Responsibility

It lets a node be found under any name a source used for it.
