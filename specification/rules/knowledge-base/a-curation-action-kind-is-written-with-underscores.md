---
type: invariant
statement: "A curation action kind MUST be written with each hyphen of its enumeration value as an underscore wherever a curation action records it and wherever a listing of curation actions filters by it."
constrains:
- domain/knowledge-base/curation-action-kind
---

## Description

How the kind of a curation action is spelled when the action is recorded and when a listing of curation actions is filtered by that kind, so edit-entity is written edit_entity and resolve-entity-match is written resolve_entity_match. This rule does not decide which kind an action records. The rules that record each curation action decide that. It also does not decide what a listing answers when its filter names a kind outside the closed set. The contract contracts/knowledge-base/compliance-audit decides that.
