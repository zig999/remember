---
type: value-object
attributes:
- name: reason
  type: string
  required: true
- name: changes
  type: attribute-change
  required: true
  many: true
relationships:
- target: knowledge-node
  type: reference
  cardinality: '1'
---

## Description

The owner's edit of one knowledge node's attributes in one saving, and why.

## Responsibility

It carries every change the owner made to an entity's attributes, so that they are recorded together under one reason.
