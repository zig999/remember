---
entries:
- field: statement
  unstated: The material replays a turn recorded as provider-error or internal-error as a done event with stop reason end_turn, while the live turn ended in an error event.
  decided: A replay of a failed turn ends in the error event the live turn ended in, never in done.
  why: A failure answer is an answer, and a replay exists to say again what the turn said.
- field: statement
  unstated: A judgment shows the replay of a turn recorded as provider-error or internal-error ending in a done event with stop reason end-turn.
  decided: A replay of such a turn ends in a done event with stop reason end-turn.
  why: The owner decided the source's behavior is the truth, and the replay maps those two stop reasons to end-turn.
---
