---
type: value-object
attributes:
- name: page
  type: integer
- name: line
  type: integer
- name: speaker
  type: string
- name: ts
  type: string
---

## Description

A readable anchor to a place in a source, made of a page, a line, a speaker and a ts, each of which may be absent.

## Responsibility

It names where a chunk sits in its source in the terms the source itself uses.
