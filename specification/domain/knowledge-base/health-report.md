---
type: value-object
attributes:
- name: ok
  type: boolean
  required: true
- name: service
  type: string
  required: true
- name: database
  type: database-status
  required: true
- name: checked_at
  type: datetime
  required: true
---

## Description

What the health probe reports: whether the system is healthy, the service's name, whether the store answered, and when the probe ran.

## Responsibility

It lets the owner and the operator see whether the system can serve.
