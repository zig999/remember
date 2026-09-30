---
type: value-object
attributes:
- name: accepted
  type: integer
  required: true
- name: consolidated
  type: integer
  required: true
- name: superseded_previous
  type: integer
  required: true
- name: needs_review
  type: integer
  required: true
- name: uncertain
  type: integer
  required: true
- name: disputed
  type: integer
  required: true
- name: rejected
  type: integer
  required: true
- name: error
  type: integer
  required: true
- name: orphaned_fragments
  type: integer
  required: true
---

## Description

The count of an LLM run's tool calls by validation outcome, with the count of its orphaned information fragments.

## Responsibility

It shows the owner at a glance what a run produced and what it left unused.
