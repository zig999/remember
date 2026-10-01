---
entries:
- field: statement
  unstated: No node holds the output ceiling of a chat turn's model call.
  decided: Each model call of a turn asks the model for at most 4096 tokens.
  why: It decides when an answer is cut and the turn ends as max-tokens, so it is observable.
---
