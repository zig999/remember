---
type: value-object
attributes:
- name: names
  type: string
  required: true
  many: true
relationships:
- target: node-type
  type: reference
  cardinality: '1'
---

## Description

One entity a document context lists: its node type and the names the document uses for it.

## Responsibility

It tells the model, while it reads any one chunk, which names elsewhere in the document denote the same entity.
