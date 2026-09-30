---
type: aggregate-root
attributes:
- name: similarity
  type: decimal
  required: true
relationships:
- target: knowledge-node
  type: reference
  cardinality: '1'
  role: node
- target: knowledge-node
  type: reference
  cardinality: '1'
  role: candidate
---

## Description

The record that a newly created knowledge node resembles an existing one closely enough that the owner must decide whether they are the same entity.

## Responsibility

It is the curation queue's entry for an ambiguous entity.
