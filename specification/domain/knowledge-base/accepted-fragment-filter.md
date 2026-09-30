---
type: value-object
attributes:
- name: page
  type: page
relationships:
- target: raw-information
  type: reference
  cardinality: 0..1
- target: llm-run
  type: reference
  cardinality: 0..1
---

## Description

What the owner narrows an accepted-fragment listing to: an LLM run, a raw information, or both, and a page.

## Responsibility

None.
