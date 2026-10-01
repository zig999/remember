---
entries:
- field: statement
  unstated: No node holds the number of candidates each search layer contributes.
  decided: Each layer keeps at most 200 candidates before ranking, and the total counts those kept.
  why: The code applies the cap before the count, so the total is bounded by it.
---
