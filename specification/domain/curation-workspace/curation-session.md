---
type: aggregate-root
attributes:
- name: selected_item
  type: selected-item
- name: evidence_viewed
  type: boolean
  required: true
- name: session_resolved
  type: integer
  required: true
- name: last_seen_total
  type: integer
- name: checked_item_ids
  type: string
  many: true
- name: pending_decision
  type: pending-decision
- name: draft
  type: decision-draft
- name: correction
  type: correction-draft
operations:
- select-item
- decide
- undo-decision
- move-on
- reset-session
---

## Description

One sitting of the owner at the curation screen, from the first queue read to the last decision.

## Responsibility

It keeps the selected item, whether its evidence was viewed, the decision waiting for undo and the draft the owner is writing, so that the screen shows one consistent state.
