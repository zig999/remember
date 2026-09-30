---
type: entity
aggregate: llm-run
attributes:
- name: tool_name
  type: ingest-tool
  required: true
- name: arguments
  type: string
- name: result
  type: string
- name: validation_outcome
  type: validation-outcome
  required: true
- name: created_at
  type: datetime
  required: true
---

## Description

The record of one proposal made within an LLM run: what was proposed, what it was answered and how validation judged it.

## Responsibility

It keeps every proposal accountable, whether it was taken or refused.
