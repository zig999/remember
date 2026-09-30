---
type: aggregate-root
attributes:
- name: action
  type: string
  required: true
- name: target_kind
  type: string
  required: true
- name: target_id
  type: string
- name: payload
  type: string
- name: reason
  type: string
---

## Description

The record of one action the owner took while curating the knowledge base, naming the kind of item it acted on and, where there is one, that item.

## Responsibility

It keeps an audit trail of what curation changed and why.
