---
type: aggregate-root
attributes:
- name: action
  type: failure-action
  required: true
- name: tone
  type: toast-tone
- name: message
  type: string
operations:
- route-failure
- apply-action
---

## Description

The decision of what the owner sees for each failure.

## Responsibility

It maps a failure code to one action and one text.
