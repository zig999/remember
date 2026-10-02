---
type: aggregate-root
attributes:
- name: node_id
  type: string
  required: true
- name: label
  type: string
- name: curation_open
  type: boolean
  required: true
- name: failure
  type: node-detail-failure
- name: origin_failure
  type: origin-failure
operations:
- open-detail
- close-detail
- open-curation
---

## Description

The panel that replaces the graph with what the knowledge base holds about one node.

## Responsibility

It shows the node, its aliases, attributes, relationships and the origin of each item, and offers curation where the node needs it.
