---
type: value-object
attributes:
- name: node_type
  type: string
  required: true
- name: canonical_name
  type: string
  required: true
- name: status
  type: domain/knowledge-base/node-status
  required: true
relationships:
- target: domain/knowledge-base/knowledge-node
  type: reference
  cardinality: '1'
---

## Description

One knowledge node a tool call showed, as the graph view draws it.

## Responsibility

None.
