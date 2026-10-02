---
type: aggregate-root
attributes:
- name: content
  type: string
  required: true
- name: source_type
  type: domain/knowledge-base/source-type
- name: phase
  type: ingest-phase
  required: true
- name: llm_run_id
  type: string
- name: affected_node_ids
  type: string
  many: true
- name: summary
  type: domain/knowledge-base/run-summary
- name: failure
  type: ingest-failure
- name: validation_message
  type: string
operations:
- submit-ingest
- record-source
- run-extraction
- poll-run
- retry-run
- assemble-graph
- reset-session
---

## Description

One ingestion the owner follows on the screen, from the document typed or dropped to the graph it produced.

## Responsibility

It keeps what the owner submitted, the phase the ingestion is in, the run it opened and the failure shown, so the screen shows one consistent state.
