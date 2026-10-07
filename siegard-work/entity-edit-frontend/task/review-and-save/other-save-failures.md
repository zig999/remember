---
title: Other save failures keep what the owner typed
summary: An edit the knowledge base refuses for a reason other than conflict, or that cannot reach it, shows an alert and keeps every typed value.
rationale: I grouped the non-conflict refusal and the unreachable case because both are the contract's fallback answers to a failed save and change together; the conflict is separate because it has its own rule.
sources:
- intake/scope.md
objective: A save refused for any cause other than a conflict, or that cannot reach the knowledge base, tells the owner why and keeps every typed value.
criteria:
- A refusal other than a conflict shows an alert carrying the refusal's message.
- A refusal other than a conflict leaves every typed value in the form.
- An edit that cannot reach the knowledge base shows an alert saying the edit could not be sent.
- An edit that cannot reach the knowledge base leaves every typed value in the form.
depends_on:
- task/review-and-save/undo-window
implements:
- contracts/entity-workspace/entity-screen
- contracts/entity-workspace/bff-entity-edit
- rules/entity-workspace/a-save-failure-is-classified-by-its-code
- rules/entity-workspace/a-failed-save-reads-its-wording
- domain/entity-workspace/entity-edit-session
---
## What it is
The form's answer to every failed save that is not a conflict.

## Notes
The inventory flags the same global BUSINESS_* warning toast for these refusals.
UNDERDETERMINED, from the specification — The criteria never say which failure codes count as a refusal and which as an edit that could not be sent. Passes: an implementation that treats SYSTEM_UPSTREAM as an edit that could not be reached, or SYSTEM_TIMEOUT as a refusal showing its own message.
UNDERDETERMINED, from the specification — No criterion answers the clause that AUTH_SESSION_EXPIRED is neither a refusal nor an edit that could not be sent, whose typed values are not kept. Passes: an implementation that treats it as a refusal, alerts Sua sessão expirou. Faça login novamente. and keeps every typed value.
UNDERDETERMINED, from the specification — The criterion for the edit that could not be sent says only an alert saying so, while the wording rule fixes the text "Não foi possível enviar a edição. Tente novamente." and no message of the failure's own. Passes: an alert reading Não foi possível salvar. followed by the failure's own message.
REMAINDER, from the specification — The conflict clause of the wording rule belongs to the conflict task.
ADVISORY, from the specification — The refusal's message is the one bff-entity-edit reads from the body, and the fixed text it gives SYSTEM_INVALID_RESPONSE, SYSTEM_UPSTREAM and SYSTEM_UNKNOWN.
