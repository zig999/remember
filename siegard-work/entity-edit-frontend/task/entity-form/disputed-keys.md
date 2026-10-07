---
title: A disputed key shows without a field and points to curation
summary: A key with a disputed attribute is shown read-only with a pointer to the curation workspace.
rationale: I cut this rule apart from attributes outside the catalog because it changes with curation's ownership of disputes.
sources:
- intake/scope.md
objective: A key whose attribute is disputed shows its values without a field and points the owner to the curation workspace.
criteria:
- A key with a disputed attribute shows its values.
- A key with a disputed attribute shows no field.
- A key with a disputed attribute shows a pointer to the curation workspace.
depends_on:
- task/entity-form/field-groups
implements:
- rules/entity-workspace/a-disputed-key-shows-without-a-field-and-points-to-curation
- rules/entity-workspace/a-disputed-key-links-to-the-curation-queue
- contracts/entity-workspace/entity-screen
- domain/entity-workspace/entity-edit-session
---
## What it is
The disputed-key rendering inside the form's groups.

## Notes
UNDERDETERMINED, from the specification — The criteria never say what makes an attribute disputed, which the rule decided as its status in the node read, whether or not it is current or in effect, ignoring effective status and flags. Passes: a form that withholds the field only for a current, in-effect disputed attribute, or that decides by effective status or flags.
UNDERDETERMINED, from the specification — The pointer criterion accepts any pointer, while the rule requires a link to /curation with no search key reading "Abrir na fila de curadoria". Passes: plain text with no link, a link carrying an item search key, or a link reading "Ver na curadoria."
ADVISORY, from the specification — The rule reads the attribute status from the read-node operation of contracts/entity-workspace/bff-entity-reads, which another task delivers.
ADVISORY, from the specification — The disputed-key pointer applies only on the form of an active node.
