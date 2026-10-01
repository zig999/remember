---
entries:
- field: statement
  unstated: No node holds the largest request body the system accepts.
  decided: The system refuses a request body larger than 11 MiB before any operation answers it.
  why: Two files set the same figure, and it exceeds the 10 MiB content limit on purpose.
---
