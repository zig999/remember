---
entries:
- field: statement
  unstated: The material applies the page's limit and offset separately to three listings and, for the entity-match queue, to node-candidate rows, so a page can hold more entries than its limit and split one node's candidates across pages.
  decided: The page skips and returns whole entries in listing order.
  why: The owner reads the queue as a list of entries, and a limit that does not bound the entries returned does not page it.
---
