---
type: invariant
statement: "The pointer a disputed key shows on the entity form MUST be a link to the curation address /curation carrying no search key, reading the text written in the description."
constrains:
- domain/entity-workspace/entity-edit-session
---

## Description

The link reads "Abrir na fila de curadoria" exactly as written, with no closing period.
rules/entity-workspace/a-disputed-key-shows-without-a-field-and-points-to-curation decides which key is disputed and that it shows its values without a field.
rules/application-shell/the-areas-live-at-fixed-addresses decides the curation address, and rules/application-shell/chat-and-curation-keep-one-search-key decides the search key that address accepts.
