---
entries:
- field: statement
  unstated: The excerpt rule is scoped to graph reads and search is not a graph read.
  decided: A search item's excerpt is cut from the chunk's own text at its start offset, as long as the chunk.
  why: The search SQL applies the same cut in four queries.
---
