---
type: aggregate-root
attributes:
- name: key
  type: string
  required: true
- name: value_type
  type: value-type
  required: true
- name: is_temporal
  type: boolean
- name: allows_multiple_current
  type: boolean
- name: requires_valid_from
  type: boolean
- name: description
  type: string
- name: allowed_values
  type: allowed-value
  many: true
- name: version
  type: integer
  required: true
relationships:
- target: node-type
  type: reference
  cardinality: '1'
---

## Description

A named property the catalog allows on the knowledge nodes of one node type, with the type its values take and, where the catalog closes it, the values it allows.

## Responsibility

It fixes which attributes a node may hold and what their values may be.
