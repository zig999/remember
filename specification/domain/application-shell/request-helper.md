---
type: aggregate-root
attributes:
- name: base_url
  type: string
  required: true
- name: failure_code
  type: string
operations:
- send-request
- refresh-token
---

## Description

The one way the client sends a request to the back end.

## Responsibility

It sends the request with the owner's token and turns whatever comes back into an answer or one failure.
