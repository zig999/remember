---
entries:
- field: statement
  unstated: The material requires a reason without bounding it.
  decided: Between 1 and 1000 characters once trimmed.
  why: The reason is recorded as a curation action reason, which holds at most 1000 characters, and a blank one is refused as in every other curation request.
- field: statement
  unstated: The unit the 1000 limit on an entity edit's trimmed reason is counted in. The statement says only "characters", and the intake scope does not mention it. Unicode code points and UTF-16 code units give different counts when the reason holds characters outside the Basic Multilingual Plane, such as an emoji.
  decided: The trimmed reason is counted in UTF-16 code units and holds between 1 and 1000 of them.
  why: The reason is one whole text bounded as a single field the owner sends. The specification counts whole-text lengths in UTF-16 code units (content-length, original-input-length, document-context-read-first) and keeps Unicode code points for positions and sizes inside chunks, which is not what this limit measures.
---
