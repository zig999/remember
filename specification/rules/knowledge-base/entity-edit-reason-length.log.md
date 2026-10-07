---
entries:
- field: statement
  unstated: The material requires a reason without bounding it.
  decided: Between 1 and 1000 characters once trimmed.
  why: The reason is recorded as a curation action reason, which holds at most 1000 characters, and a blank one is refused as in every other curation request.
- field: statement
  unstated: The unit of the 1000-character limit on an entity edit's trimmed reason. Both this rule and rules/entity-workspace/review-requires-a-trimmed-reason say only "characters", and neither the material nor any node says whether that means Unicode code points or UTF-16 code units. The two counts differ when the reason holds characters outside the Basic Multilingual Plane.
  decided: The trimmed reason's 1000 limit is counted in UTF-16 code units, the same unit in this rule and in rules/entity-workspace/review-requires-a-trimmed-reason.
  why: Each Unicode code point is one or two UTF-16 code units, so a reason that holds within 1000 UTF-16 code units also holds within 1000 code points, and it fits the 1000-character curation action reason it is recorded as, whichever of the two units that limit counts in.
---
