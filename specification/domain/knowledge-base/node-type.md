---
type: aggregate-root
attributes:
- name: name
  type: string
  required: true
- name: description
  type: string
  required: true
- name: version
  type: integer
  required: true
---

## Description

A named kind of entity the catalog holds.

## Responsibility

It fixes which kinds of entity a knowledge node may be.
