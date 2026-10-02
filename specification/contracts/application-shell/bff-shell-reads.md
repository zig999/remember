---
type: api
direction: consumed
upstream: contracts/knowledge-base/access
operations:
- read-health
- read-pending-curation
answers:
- operation: read-health
  accepted: "GET /health with no bearer, answered with a body whose database or result.database is ok when the store is reachable"
  refusals:
  - when: "The request fails or the body is not JSON."
    answer: "no parsed answer and the health left as verificando…"
- operation: read-pending-curation
  accepted: "GET /api/v1/curation/queue?limit=1 with the access token as a bearer, answered with a total or a result.total"
  refusals:
  - when: "The answer has no total or no token is held."
    answer: "0 pending and the segment hidden"
---

## Description

The two status reads the footer makes.
