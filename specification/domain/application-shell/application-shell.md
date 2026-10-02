---
type: aggregate-root
attributes:
- name: health
  type: shell-health
  required: true
- name: curation_pending
  type: integer
  required: true
- name: as_of
  type: string
- name: palette_open
  type: boolean
  required: true
- name: address
  type: string
  required: true
- name: reason
  type: string
operations:
- open-address
- toggle-palette
- choose-as-of
- show-failure
---

## Description

The frame around the workspaces, with its header, footer and command palette.

## Responsibility

It guards the addresses and shows the system's status around the workspace.
