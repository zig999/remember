---
entries:
- field: statement
  unstated: The specification held owner authentication only for retrieval, while the material authenticates the owner the same way before every operation.
  decided: One system constraint for every operation; constraints/retrieval-requires-owner-authentication is removed, as it held no binding and no log entry.
  why: The same gate over every operation is one fact, and two constraints stating it for overlapping scopes would be two homes.
- field: statement
  unstated: The constraint said every operation authenticates the owner, while the local process transport serves the query and ingest toolsets with no authentication.
  decided: The constraint holds for operations reached over the network.
  why: The local process transport has no network surface and its documented model trusts the owner of the local process, so the gate cannot apply there.
---
