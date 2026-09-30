---
type: entity
aggregate: conversation
attributes:
- name: snapshot
  type: string
  required: true
- name: updated_at
  type: datetime
  required: true
- name: layout_algorithm
  type: graph-layout
---

## Description

The view of the knowledge graph a conversation last left open.

## Responsibility

It lets the owner return to a conversation and find the graph as they left it.
