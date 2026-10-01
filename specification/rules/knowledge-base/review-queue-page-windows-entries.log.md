---
entries:
- field: statement
  unstated: The material applies the page's limit and offset separately to three listings and, for the entity-match queue, to node-candidate rows, so a page can hold more entries than its limit and split one node's candidates across pages.
  decided: The page skips and returns whole entries in listing order.
  why: The owner reads the queue as a list of entries, and a limit that does not bound the entries returned does not page it.
- field: statement
  unstated: A judgment shows the page's limit and offset applied to each of the three underlying listings separately, the entity-match one over candidate rows.
  decided: The limit and offset apply separately to the entity-match rows, the disputed links and the disputed attributes.
  why: The owner decided the source's behavior is the truth, and it pages those three listings separately.
---
