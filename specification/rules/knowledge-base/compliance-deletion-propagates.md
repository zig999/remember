---
type: policy
statement: A compliance deletion marks deleted every information fragment, knowledge link and node attribute not already deleted that rests on its raw information and on no other raw information that is not deleted.
constrains:
- domain/knowledge-base/compliance-deletion
- domain/knowledge-base/information-fragment
- domain/knowledge-base/knowledge-link
- domain/knowledge-base/node-attribute
consistency: eventual
---

## Description

An information fragment rests on the raw information its source chunks belong to.
A knowledge link or a node attribute rests on the raw information its provenance fragments rest on.
