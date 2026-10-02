---
type: aggregate-root
attributes:
- name: credentials
  type: sign-in-credentials
  required: true
- name: failure_kind
  type: sign-in-failure-kind
- name: destination
  type: sign-in-destination
operations:
- submit-credentials
- request-access-token
- classify-failure
- resolve-destination
---

## Description

One try of the owner at signing in, from the credentials typed to the destination reached.

## Responsibility

It keeps what the owner typed, the kind of the failure shown and the destination chosen, so that each try starts clean.
