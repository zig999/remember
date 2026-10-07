---
entries:
- field: statement
  unstated: The unit of the 1000-character limit on the review's trimmed reason, which says only "characters".
  decided: The limit is counted in UTF-16 code units, the unit decided for rules/knowledge-base/entity-edit-reason-length.
  why: The screen's limit and the knowledge base's limit on the same reason must be counted in one unit, or a reason near the limit holding characters outside the Basic Multilingual Plane would pass one and fail the other.
---
