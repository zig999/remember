---
type: entity
aggregate: raw-information
attributes:
- name: chunk_index
  type: integer
  required: true
- name: start_offset
  type: integer
- name: end_offset
  type: integer
- name: excerpt
  type: string
  required: true
- name: locator
  type: string
- name: superseded_at
  type: datetime
- name: chunking_version
  type: string
- name: status
  type: node-status
  required: true
---

## Description

One contiguous slice of a raw information's content, at a known position in it.
A chunk with a supersession time has been superseded and is no longer current.

## Responsibility

It anchors an information fragment to the exact place in the source it was read from.
