---
entries:
- field: answers
  unstated: The material has the REST node-type listing ignore unknown parameters while the MCP one refuses them, so the two transports answer the same request with a success and a refusal.
  decided: The node-type listing refuses an unknown parameter on both transports, like every other graph read.
  why: Every other catalog and graph read refuses an unknown parameter, and the transports answer each shared operation alike.
- field: answers
  unstated: The material for the catalog listings, the node listing and the graph reads does not show how they authenticate their caller.
  decided: Each of these operations refuses an unauthenticated caller with the same answer as the other retrieval operations.
  why: They are served on the same owner-only surface as search, including the one query tool endpoint they share with it.
---
