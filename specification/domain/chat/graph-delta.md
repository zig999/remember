---
type: value-object
attributes:
- name: source_tool
  type: string
  required: true
- name: nodes
  type: graph-delta-node
  many: true
- name: links
  type: graph-delta-link
  many: true
---

## Description

The part of the knowledge graph one successful tool call of a turn showed, streamed to the owner so the graph view can draw it.

## Responsibility

It lets the owner see, as the assistant works, the knowledge its answer rests on.
