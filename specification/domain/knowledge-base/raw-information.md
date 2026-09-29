---
type: aggregate-root
attributes:
- name: source_type
  type: source-type
  required: true
- name: received_at
  type: datetime
  required: true
- name: title
  type: string
- name: metadata
  type: string
- name: original_input
  type: string
relationships:
- target: raw-chunk
  type: composition
  cardinality: 1..*
---

## Description

A piece of unstructured information the owner supplied, preserved as it was received.

## Responsibility

It is the source every extracted piece of knowledge traces back to.
