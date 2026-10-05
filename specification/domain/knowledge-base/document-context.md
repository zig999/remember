---
type: value-object
attributes:
- name: summary
  type: string
  required: true
- name: entities
  type: document-entity
  many: true
- name: model
  type: string
  required: true
---

## Description

What a preliminary reading of a whole document yields before an extraction reads its chunks: a short summary and the entities the document speaks of, with the model that read it.
It is a reading aid shown to the model and never a source of knowledge.

## Responsibility

It lets each chunk be read knowing what the rest of the document says, and keeps on record what the model was shown.
