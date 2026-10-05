---
entries:
- field: statement
  unstated: Which document context status a run records when its raw information holds one chunk and its content also exceeds 100000 characters. The statement lists single-chunk and too-long as separate conditions and does not say which one wins when both hold.
  decided: single-chunk applies to a one-chunk raw information of any length, and too-long applies only to a raw information of more than one chunk whose content exceeds 100000 characters.
  why: Under rules/knowledge-base/document-context-read-first, a one-chunk raw information never gets a preliminary reading, whatever its length, and the material says a one-chunk document has no preliminary reading. So the reason no context exists is the single chunk. The 100000-character limit only stops a reading that would otherwise happen, which is true only when there is more than one chunk.
---
