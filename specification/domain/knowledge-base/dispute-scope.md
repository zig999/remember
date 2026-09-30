---
type: value-object
attributes:
- name: assertion_kind
  type: assertion-kind
  required: true
relationships:
- target: knowledge-node
  type: reference
  cardinality: 0..1
  role: source
- target: knowledge-node
  type: reference
  cardinality: 0..1
  role: target
- target: link-type
  type: reference
  cardinality: 0..1
- target: knowledge-node
  type: reference
  cardinality: 0..1
  role: node
- target: attribute-key
  type: reference
  cardinality: 0..1
---

## Description

The ground on which disputed assertions compete.

## Responsibility

It is what one dispute is about, so the assertions that compete are listed and resolved together.
