---
type: value-object
attributes:
- name: link_type
  type: string
  required: true
- name: link_type_label
  type: string
- name: is_temporal
  type: boolean
  required: true
- name: is_in_effect
  type: boolean
- name: status
  type: string
- name: flags
  type: domain/knowledge-base/assertion-flag
  many: true
relationships:
- target: domain/knowledge-base/knowledge-link
  type: reference
  cardinality: '1'
- target: domain/knowledge-base/knowledge-node
  type: reference
  cardinality: '1'
  role: source
- target: domain/knowledge-base/knowledge-node
  type: reference
  cardinality: '1'
  role: target
---

## Description

One knowledge link a tool call showed, as the graph view draws it.

## Responsibility

None.
