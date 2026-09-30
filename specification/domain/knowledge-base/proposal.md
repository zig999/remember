---
type: value-object
attributes:
- name: kind
  type: ingest-tool
  required: true
- name: confidence
  type: decimal
- name: change_hint
  type: change-hint
- name: valid_from
  type: date
- name: valid_to
  type: date
- name: valid_from_basis
  type: valid-from-basis
relationships:
- target: llm-run
  type: reference
  cardinality: '1'
- target: information-fragment
  type: association
  cardinality: 0..*
  role: evidence
- target: raw-chunk
  type: association
  cardinality: 0..*
  role: source
---

## Description

What a language model or the owner puts forward within an LLM run for the knowledge base to take: a fragment, a node, a link or an attribute.
A fragment proposal cites the raw chunks it was read from; a link or attribute proposal cites the information fragments it rests on and may claim validity dates.

## Responsibility

It is what validation judges before anything reaches the knowledge base.
