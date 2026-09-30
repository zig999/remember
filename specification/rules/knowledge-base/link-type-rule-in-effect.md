---
type: invariant
statement: A link type rule is in effect on a day that falls on or after its validity start, when it has one, and before its validity end, when it has one.
expression: (valid_from is null or valid_from <= day) and (valid_to is null or day < valid_to), where day is the UTC calendar date
constrains:
- domain/knowledge-base/link-type-rule
---

## Description

None.
