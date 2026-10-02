---
type: aggregate-root
attributes:
- name: state
  type: domain/graph-explorer/confidence-state
  required: true
- name: icon_only
  type: boolean
  required: true
operations:
- show-state
---

## Description

The mark that tells the owner how much to trust an item.

## Responsibility

It names a confidence state in words and for assistive technology.
