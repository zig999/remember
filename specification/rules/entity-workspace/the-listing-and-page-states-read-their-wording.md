---
type: invariant
statement: "The entity listing and the entity page MUST show the could-not-load-nodes alert, the no-node statement, the node-not-found alert, the could-not-load-form alert, their loading indications and the recorded-edit notice in the wording written in the description, with their try-again and undo actions labelled as written there, and no alert carries a code or message of the failure's own."
constrains:
- domain/entity-workspace/entity-edit-session
---

## Description

The could-not-load-nodes alert on the listing reads "Não foi possível carregar os nós. Tente novamente." and its try-again action reads "Tentar novamente".
The no-node statement on the listing reads "Nenhum nó encontrado."
The node-not-found alert on the page reads "Nó não encontrado."
The could-not-load-form alert on the page reads "Não foi possível carregar o formulário. Tente novamente." and its try-again action reads "Tentar novamente".
The listing's loading indication reads "Carregando nós…" and the page's loading indication reads "Carregando formulário…".
The recorded-edit notice reads "Edição registrada." and its undo action reads "Desfazer".
Each text ends as written.
contracts/entity-workspace/entity-screen decides when each of these is shown.
rules/entity-workspace/a-deleted-node-shows-its-own-alert decides the alert for a deleted node.
rules/entity-workspace/the-node-listing-stands-without-the-node-types decides what is shown in place of the node-type choice.
rules/entity-workspace/a-failed-save-reads-its-wording decides the alerts for a conflict and for an edit that could not be sent.
rules/entity-workspace/saving-waits-for-undo decides how long the undo lasts and what an undo sends.
