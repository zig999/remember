---
type: enumeration
values:
- end-turn
- max-tokens
- stop-sequence
- max-iterations
- turn-timeout
- cancelled
- provider-error
- internal-error
---

## Description

How a turn ended: as the model ended it (end-turn, max-tokens, stop-sequence), at the model-call limit, past the turn time limit, cancelled by the owner, or failed at the model provider or inside the system.

## Responsibility

None.
