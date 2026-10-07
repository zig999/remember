---
type: aggregate-root
attributes:
- name: node_id
  type: string
  required: true
- name: fields
  type: attribute-field
  many: true
- name: reason
  type: string
- name: reviewing
  type: boolean
  required: true
- name: undo_deadline
  type: datetime
operations:
- open-entity
- change-field
- review-changes
- confirm-save
- undo-save
- discard-changes
---

## Description

One sitting of the owner at the entity form, from opening a knowledge node to saving or discarding the edit.

## Responsibility

It holds what the owner typed until the edit is sent, so that nothing reaches the knowledge base before the owner has reviewed it.
