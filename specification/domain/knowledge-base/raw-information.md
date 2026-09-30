---
type: aggregate-root
attributes:
- name: source_type
  type: source-type
  required: true
- name: received_at
  type: datetime
  required: true
- name: content
  type: string
  required: true
- name: title
  type: string
- name: metadata
  type: string
- name: original_input
  type: string
- name: content_hash
  type: string
  required: true
- name: document_date
  type: date
- name: storage_ref
  type: string
- name: status
  type: node-status
  required: true
- name: superseded_at
  type: datetime
relationships:
- target: raw-chunk
  type: composition
  cardinality: 1..*
---

## Description

A piece of unstructured information the owner supplied, preserved as it was received.

## Responsibility

It is the source every extracted piece of knowledge traces back to.
