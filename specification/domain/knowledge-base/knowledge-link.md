---
type: aggregate-root
attributes:
- name: status
  type: assertion-status
  required: true
- name: recorded_at
  type: datetime
- name: valid_from
  type: date
- name: valid_to
  type: date
- name: provenance
  type: provenance
  many: true
- name: valid_from_basis
  type: valid-from-basis
- name: confidence
  type: decimal
- name: superseded_at
  type: datetime
relationships:
- target: knowledge-node
  type: reference
  cardinality: '1'
  role: source
- target: knowledge-node
  type: reference
  cardinality: '1'
  role: target
- target: link-type
  type: reference
  cardinality: '1'
- target: llm-run
  type: reference
  cardinality: 0..1
- target: knowledge-link
  type: reference
  cardinality: 0..1
  role: supersedes
---

## Description

A relation of one link type asserted from a source knowledge node to a target knowledge node.

## Responsibility

It is the edge the graph is traversed along.
