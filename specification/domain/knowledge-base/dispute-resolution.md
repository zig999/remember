---
type: value-object
attributes:
- name: assertion_kind
  type: assertion-kind
  required: true
- name: item_ids
  type: string
  required: true
  many: true
- name: decision
  type: dispute-decision
  required: true
- name: winner_id
  type: string
- name: periods
  type: adjusted-period
  many: true
- name: reason
  type: string
---

## Description

The owner's decision about the disputed assertions of one dispute scope, naming the one that holds or the period each holds over, and why.

## Responsibility

It carries the decision that closes or keeps a dispute.
