---
entries:
- field: statement
  unstated: Whether an unused winner or periods value is format-checked
  decided: A malformed value of either is still refused
  why: The request schema validates both fields whatever the decision, so a malformed unused field is refused, not ignored.
---
