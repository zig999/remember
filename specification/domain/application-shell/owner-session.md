---
type: aggregate-root
attributes:
- name: access_token
  type: string
- name: subject
  type: string
- name: expires_at
  type: integer
- name: name
  type: string
- name: email
  type: string
operations:
- set-token
- clear
- check-freshness
---

## Description

The access token the owner's browser holds and what it says about the owner.

## Responsibility

It tells the client whether the owner may open a guarded address.
