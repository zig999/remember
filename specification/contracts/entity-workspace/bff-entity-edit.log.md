---
entries:
- field: type
  unstated: The material names no such thing.
  decided: api
  why: The screen consumes the write under its own name and the context map reads that dependency from this contract.
- field: answers
  unstated: No node states the method or path of the edit, or how the node identity is carried in it; the intake gives the method and path and puts the identity in the path, but says nothing about encoding it.
  decided: POST /api/v1/nodes/{node_id}/edit with the node id URL-encoded in the path
  why: The person adopted POST /api/v1/nodes/{node_id}/edit with the node identity in the path (intake wire-facts.md), and URL-encoding is how every consumed contract in this specification carries an identity in a path.
- field: answers
  unstated: No node stated the body the edit is sent with, the body a refused edit carries over REST, or the keys under which a conflict refusal names the attribute key and the item.
  found: 'siegard-work/entity-edit-frontend/intake/wire-facts.md: "Body JSON { reason, changes: [{ attribute_key, kind, value, item_id, valid_from, valid_to }] }. Refusals answer in the body { ok: false, error: { code, message, details } }. A conflict answers with details { attribute_key, item_id }, item_id null where there is none."'
- field: answers
  unstated: No node and no material says how the entity workspace's edit request reports a request with no answer, a request its caller cancelled, a non-2xx answer with no error code, a 2xx answer whose body is not JSON, or a session that cannot be refreshed. The shell's request helper states these failures for itself, but its envelope check refuses the edit's accepted answer, which has no envelope.
  decided: 'The same failures, codes and wording the curation and ingest requests answer: SYSTEM_TIMEOUT at the shell''s 30000 millisecond cutoff, SYSTEM_ABORTED for a cancelled request, SYSTEM_NETWORK when no answer comes, HTTP 401 with AUTH_SESSION_EXPIRED for a session that cannot be refreshed, SYSTEM_INVALID_RESPONSE for a 2xx body that is not JSON, and, when the body has no error code, SYSTEM_UPSTREAM at status 500 or above and SYSTEM_UNKNOWN below it.'
  why: The edit is accepted as an HTTP 200 body with no envelope. The application already reports failures for requests of that shape in exactly these terms, and the shell helper's envelope reading cannot accept such an answer.
---
