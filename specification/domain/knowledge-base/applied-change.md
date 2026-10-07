---
type: value-object
attributes:
- name: attribute_key
  type: string
  required: true
- name: effect
  type: edit-effect
  required: true
- name: item_id
  type: string
- name: predecessor_id
  type: string
---

## Description

How one change of an entity edit was recorded: its effect, the attribute it recorded and the attribute it superseded or rejected.

## Responsibility

It tells the owner what each change of an edit did.
