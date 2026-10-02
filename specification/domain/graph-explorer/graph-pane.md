---
type: aggregate-root
attributes:
- name: nodes
  type: graph-node-view
  many: true
- name: links
  type: graph-link-view
  many: true
- name: positions
  type: string
- name: user_pinned
  type: string
  many: true
- name: reveal_queue
  type: string
  many: true
- name: revealed
  type: string
  many: true
- name: status
  type: graph-pane-status
  required: true
- name: error_message
  type: string
- name: received_delta_this_turn
  type: boolean
  required: true
- name: layout_algorithm
  type: domain/chat/graph-layout
  required: true
- name: layout_nonce
  type: integer
  required: true
- name: last_turn_end
  type: turn-end
- name: snapshot_version
  type: graph-snapshot-version
operations:
- add-delta
- replace-delta
- remove-nodes
- move-node
- reorganize
- choose-layout
- settle-turn
- restore-view
- clear
---

## Description

The knowledge graph the owner is looking at, from the nodes drawn to the arrangement and the phase the pane is in.

## Responsibility

It keeps the nodes, the links, their positions and the status so that the pane shows one consistent graph.
