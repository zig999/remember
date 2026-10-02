---
type: aggregate-root
attributes:
- name: include_archived
  type: boolean
  required: true
- name: rename_draft
  type: string
- name: delete_pending
  type: boolean
  required: true
operations:
- create
- select
- rename
- archive
- unarchive
- delete
---

## Description

The menu from which the owner manages conversations.

## Responsibility

It lets the owner pick, create, rename, archive and delete conversations.
