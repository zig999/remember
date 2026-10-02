---
type: value-object
attributes:
- name: value
  type: string
- name: target_node_id
  type: string
- name: valid_from
  type: date
- name: valid_to
  type: date
- name: valid_from_basis
  type: domain/knowledge-base/valid-from-basis
  required: true
- name: valid_from_fragment_id
  type: string
- name: reason
  type: string
  required: true
---

## Description

The values and the reason the owner writes on the correction form before saving.

## Responsibility

It holds the correction until it passes the form's checks and is handed to the caller.
