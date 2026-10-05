---
entries:
- field: statement
  unstated: The unit in which the extraction counts the 200-character tail of the previous chunk that it shows the model with each chunk. The statement says only "the last 200 characters of the chunk before it". The material says the same ("os últimos 200 caracteres do chunk anterior", "Os 200 caracteres do chunk anterior continuam"). Unicode code points and UTF-16 code units give different results when the chunk holds characters outside the Basic Multilingual Plane.
  decided: The tail shown is the last 200 Unicode code points of the chunk before the one being read.
  why: The tail is measured inside a chunk. Every other measure inside a chunk already uses Unicode code points. That includes the chunk offsets in rules/knowledge-base/chunk-offsets-count-code-points and the chunk sizes in rules/knowledge-base/short-block-one-chunk, rules/knowledge-base/long-block-sentence-chunks and rules/knowledge-base/long-sentence-own-chunk. The entry in rules/knowledge-base/document-context-read-first.log.md also keeps UTF-16 code units for lengths of the whole content and code points for measures inside chunks. Counting in code points also means the cut never splits a surrogate pair. No log entry decided this unit before.
---
