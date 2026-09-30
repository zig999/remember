---
type: value-object
attributes:
- name: links_repointed
  type: integer
  required: true
- name: attributes_repointed
  type: integer
  required: true
- name: aliases_copied
  type: integer
  required: true
- name: path_compressed_nodes
  type: integer
  required: true
---

## Description

How many knowledge links and node attributes one merge moved to the survivor, how many aliases it copied, and how many previously merged knowledge nodes it made name the survivor.

## Responsibility

It records the reach of a merge.
