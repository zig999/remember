---
type: policy
statement: "The information fragment an entity edit records, and the raw information that fragment is anchored in, are recorded under the LLM run that the same entity edit opened."
constrains:
- domain/knowledge-base/entity-edit
- domain/knowledge-base/information-fragment
- domain/knowledge-base/raw-information
- domain/knowledge-base/llm-run
consistency: eventual
---

## Description

This rule governs which run holds the note an entity edit records. The model and prompt version of that run are set by rules/knowledge-base/entity-edit-run, and what the note holds is set by rules/knowledge-base/entity-edit-note.
