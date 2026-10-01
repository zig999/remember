---
entries:
- field: statement
  unstated: The material replays a turn recorded as provider-error or internal-error as a done event with stop reason end_turn, while the live turn ended in an error event.
  decided: A replay of a failed turn ends in the error event the live turn ended in, never in done.
  why: A failure answer is an answer, and a replay exists to say again what the turn said.
---
