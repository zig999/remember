---
type: value-object
attributes:
- name: tool
  type: string
  required: true
- name: args_summary
  type: string
  required: true
- name: outcome
  type: tool-chip-outcome
  required: true
---

## Description

One tool call of the turn as the screen shows it, with its name, a summary of its arguments and its outcome.

## Responsibility

It lets the owner see what the assistant looked up and whether it worked.
