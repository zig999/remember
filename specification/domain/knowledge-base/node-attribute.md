---
type: aggregate-root
attributes:
- name: status
  type: assertion-status
  required: true
- name: provenance
  type: provenance
  many: true
relationships:
- target: knowledge-node
  type: reference
  cardinality: '1'
---

## Description

A literal value asserted about a knowledge node.

## Responsibility

It holds what is known about a node that is not a relation to another node.
