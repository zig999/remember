---
type: invariant
statement: "An entity edit records its reason trimmed of surrounding whitespace."
constrains:
- domain/knowledge-base/entity-edit
---

## Description

Governs the form the reason takes wherever an entity edit records it: the note's content, the information fragment's text and the curation action's reason. It does not decide how long the reason may be; that belongs to rules/knowledge-base/entity-edit-reason-length.
