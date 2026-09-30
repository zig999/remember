---
type: aggregate-root
attributes:
- name: value
  type: string
  required: true
- name: status
  type: assertion-status
  required: true
- name: recorded_at
  type: datetime
- name: provenance
  type: provenance
  many: true
- name: valid_from
  type: date
- name: valid_to
  type: date
- name: valid_from_source
  type: valid-from-basis
- name: confidence
  type: decimal
- name: superseded_at
  type: datetime
relationships:
- target: knowledge-node
  type: reference
  cardinality: '1'
- target: attribute-key
  type: reference
  cardinality: '1'
- target: llm-run
  type: reference
  cardinality: 0..1
- target: node-attribute
  type: reference
  cardinality: 0..1
  role: supersedes
---

## Description

A literal value asserted about a knowledge node.

## Responsibility

It holds what is known about a node that is not a relation to another node.
