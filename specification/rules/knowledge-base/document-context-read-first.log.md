---
entries:
- field: statement
  unstated: The unit the 100000 limit on a raw information's content is counted in, which decides whether the preliminary reading is made. The statement and the material ("mais de 100.000 caracteres") both say only "characters", and these differ from Unicode code points when the content has characters outside the Basic Multilingual Plane.
  decided: The 100000 limit counts the raw information's content in UTF-16 code units, the same unit in both rules/knowledge-base/document-context-read-first and rules/knowledge-base/document-context-status-recorded.
  why: The limit measures the same field that rules/knowledge-base/content-length already bounds in UTF-16 code units. Using that unit means a raw information's content has one length everywhere it is checked. Unicode code points are the unit for chunk offsets and chunk sizes, which measure positions inside chunks, not the whole content. No log entry decided this unit before.
---
