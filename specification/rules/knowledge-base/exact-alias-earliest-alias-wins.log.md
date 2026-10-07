---
entries:
- field: statement
  unstated: No node says which knowledge node a proposal resolves to when its name equals an alias of several active knowledge nodes of its node type, and node-alias declares created_at as optional, so nothing says where an alias with no creation time falls in an earliest-first order.
  decided: The node whose matching alias was created earliest wins. An alias with no recorded creation time counts as created after every alias that has one. Equal creation times, including two aliases that both have none, go to the lowest knowledge node identity.
  why: The intake scope (item 2) asks for a deterministic tie-break of oldest alias first, then node identity. Putting an alias with no creation time last follows the search-ranking rule, where an item that was never recorded falls after every recorded item with the same score. It is also the order an ascending sort on creation time and then node identity gives, so a node with a known creation time is never passed over for one whose age is unknown.
---
