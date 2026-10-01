---
entries:
- field: statement
  unstated: The material answers a tool result the graph delta cannot read with an empty graph delta for the traversal, the node read, the node listing and search, and with no graph delta for directed ingestion.
  decided: An unreadable result yields a graph delta with no nodes and no links, whatever the tool.
  why: One condition gets one answer, and four of the five tools already give it.
- field: statement
  unstated: The earlier decision gave every tool the empty graph delta, but the tests show a directed ingestion result that is not a well-formed object yielding no graph delta, while a well-formed empty one still yields an empty graph delta.
  decided: An unreadable result yields a graph delta with no nodes and no links, except a directed ingestion's, which yields none.
  why: The tests pass and state the exception, so the earlier unification contradicted what the system does and what its tests protect.
---
