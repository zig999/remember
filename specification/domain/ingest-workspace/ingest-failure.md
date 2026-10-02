---
type: value-object
attributes:
- name: code
  type: string
  required: true
- name: message
  type: string
  required: true
---

## Description

The code and the message the owner is shown when a step of the ingestion fails.

## Responsibility

It lets the owner tell a failure worth retrying from one that is not.
