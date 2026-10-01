---
entries:
- field: statement
  unstated: The material states that resolution takes a lock per node type and normalized name before reading any alias and before the similarity lookup, and not what the lock is for in domain terms.
  decided: Concurrent proposals of one node name under one node type are resolved one after another, each reading the aliases the earlier one left.
  why: The lock is the means and the serialization is the observable condition a test can fail, and the domain states conditions, not mechanisms.
---
