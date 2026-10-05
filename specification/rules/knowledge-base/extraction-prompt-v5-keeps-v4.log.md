---
entries:
- field: statement
  unstated: The material creates prompt version v5 and makes it the default, but it does not say whether the v5 extraction system prompt keeps every instruction of the v4 one.
  decided: The extraction system prompt of prompt version v5 contains every instruction that the extraction system prompt of prompt version v4 contains.
  why: Earlier decisions already treat v5 as v4 plus the alias and document-context instructions. Those decisions scoped the v4 relative-date rules (extraction-prompt-names-relative-date-words, extraction-relative-date-falls-back-to-reception) to "v4 and later", so the same answer holds here. Dropping any v4 instruction would make the new default prompt regress.
---
