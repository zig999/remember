---
type: value-object
attributes:
- name: kind
  type: domain/knowledge-base/review-queue-kind
  required: true
- name: id
  type: string
  required: true
---

## Description

The queue item the owner is looking at, named by its review queue kind and an identifier.

## Responsibility

It lets the address, the list and the decision panel agree on which item is open.
