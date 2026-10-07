---
type: invariant
statement: "A conflict answer to a save MUST be alerted with the conflict text and an edit that could not be sent with the could-not-be-sent text, both written in the description, and neither alert carries a message of the failure's own."
constrains:
- domain/entity-workspace/entity-edit-session
---

## Description

The conflict text reads "Este nó mudou desde que você abriu o formulário." and the could-not-be-sent text reads "Não foi possível enviar a edição. Tente novamente.", each ending as written.
rules/entity-workspace/a-save-failure-is-classified-by-its-code decides which failures count as an edit that could not be sent.
rules/entity-workspace/a-conflict-keeps-the-typed-values decides what the form keeps on a conflict.
contracts/entity-workspace/bff-entity-edit decides how the request reports each failure, and contracts/entity-workspace/entity-screen decides the alert that carries a refusal's own message.
