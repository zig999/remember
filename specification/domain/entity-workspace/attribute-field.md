---
type: value-object
attributes:
- name: attribute_key
  type: string
  required: true
- name: item_id
  type: string
- name: started_with
  type: string
- name: value
  type: string
- name: valid_from
  type: date
- name: valid_to
  type: date
---

## Description

One value the owner can edit on the form: the key it belongs to, the current attribute it started from, the value it started with and the value and validity it holds now.

## Responsibility

It lets the form tell what the owner changed from what the node already held.
