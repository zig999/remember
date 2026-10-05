---
type: aggregate-root
display: LLMRun
attributes:
- name: model
  type: string
  required: true
- name: prompt_version
  type: string
  required: true
- name: status
  type: run-status
  required: true
- name: attempts
  type: integer
  required: true
- name: started_at
  type: datetime
  required: true
- name: finished_at
  type: datetime
- name: idempotency_key
  type: string
  required: true
- name: document_context
  type: document-context
- name: document_context_status
  type: document-context-status
- name: summary
  type: run-summary
relationships:
- target: raw-information
  type: reference
  cardinality: '1'
- target: tool-call
  type: composition
  cardinality: 0..*
operations:
- complete
- fail
- retry
---

## Description

One pass of extraction over a raw information, made by a named model under a named prompt version.
Its tool calls are the record of every proposal made within it.

## Responsibility

It is the unit every proposal is made within and accounted for.
