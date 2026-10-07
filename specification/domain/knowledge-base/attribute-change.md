---
type: value-object
attributes:
- name: attribute_key
  type: string
  required: true
- name: kind
  type: attribute-change-kind
  required: true
- name: value
  type: string
- name: item_id
  type: string
- name: valid_from
  type: date
- name: valid_to
  type: date
---

## Description

One change the owner asks for to one attribute key of an entity: the value put in place or the removal, the current attribute it replaces or removes, and the validity it states.

## Responsibility

It carries one field of the entity form to the knowledge base.
