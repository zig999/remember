---
entries:
- field: type
  unstated: No node and no material names a rule for a set change to a temporal key that states a validity end on or before today and no validity start. The scope material is silent on it. rules/knowledge-base/validity-start-before-end holds only a change that states both dates, and rules/knowledge-base/entity-edit-start-defaults-to-today would record such a change with a start on or after its own end.
  decided: invariant
  why: 'A start defaulted to today ahead of an end on or before today records a period that is empty or reversed, so the edit is refused as temporally incoherent, the way a stated start after a stated end already is: error code BUSINESS_TEMPORAL_INCOHERENT, HTTP 422 over REST.'
---
