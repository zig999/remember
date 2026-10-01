---
entries:
- field: attributes.valid_from.type
  unstated: The material compares a link's validity start with a date without naming its type.
  decided: date
  why: The as-of date it is compared with is a calendar date.
- field: attributes.valid_to.type
  unstated: The material compares a link's validity end with a date without naming its type.
  decided: date
  why: The as-of date it is compared with is a calendar date.
- field: relationships.llm-run.cardinality
  unstated: The standing node gives every knowledge link exactly one run, while the material's correction records the new link with no run; the two decide differently for a link a correction records.
  decided: 0..1
  why: A correction is an owner's act outside any extraction run, and the material records its new link with the run left empty.
---
