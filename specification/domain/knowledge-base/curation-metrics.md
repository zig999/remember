---
type: value-object
attributes:
- name: accept_rate
  type: decimal
  required: true
- name: reject_rate_by_code
  type: reject-rate
  many: true
- name: needs_review_count
  type: integer
  required: true
- name: uncertain_count
  type: integer
  required: true
- name: disputed_count
  type: integer
  required: true
- name: entity_match_queue_count
  type: integer
  required: true
- name: disputed_queue_count
  type: integer
  required: true
- name: computed_at
  type: datetime
  required: true
---

## Description

A snapshot of how curation stands: how often actions accept, how often they reject by error code, and how many nodes and assertions await the owner.

## Responsibility

It is what the owner calibrates the confidence thresholds against.
