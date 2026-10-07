---
entries:
- field: type
  unstated: The material names no such thing.
  decided: api
  why: The screen consumes the knowledge base reads under their own names and the context map reads that dependency from this contract.
- field: answers
  unstated: No node stated the request path the entity workspace uses for the knowledge base's node-type listing or its node listing.
  found: 'siegard-work/entity-edit-frontend/intake/wire-facts.md: "GET /api/v1/node-types, no parameters." and "GET /api/v1/nodes?node_type=&name_prefix=&status=&limit=&offset="'
- field: answers
  unstated: No node states the REST route of the attribute-key listing, the name of its node-type query parameter, or the order its keys come back in.
  found: 'siegard-work/entity-edit-frontend/intake/wire-facts.md: "GET /api/v1/attribute-keys?node_type= (node_type optional, string 1..200)." and "Ordered by node type name, then key."'
- field: answers
  unstated: No node states the method or path of the entity workspace's node read, how the node identity is carried in it, or which of its optional query parameters the screen sends. The intake gives GET /api/v1/nodes/{node_id}?as_of=&in_effect_only=&include_uncertain= with all three parameters optional, but does not say whether the identity is URL-encoded or which parameters the screen sends.
  decided: GET /api/v1/nodes/{node_id} with the node id URL-encoded in the path and no query parameter
  why: The form needs every attribute the node holds, current, uncertain and disputed alike. A node read that names no as-of date, does not ask for in-effect-only items and does not leave out uncertain items withholds none of them. URL-encoding is how every consumed contract in this specification carries an identity in a path.
- field: answers
  unstated: 'No node and no material states how the entity workspace''s reads of the knowledge base turn a failed answer into a failure: where a refused read''s body carries its code, message and details, or which failure a read reports when the body has no error code, when a 2xx body is not JSON, when the request is cut off, when it is cancelled, when no answer comes or when the session cannot be refreshed. The intake says only that the four reads answer inside { ok: true, result }.'
  decided: 'For each of the four reads, a refused read takes the status and the code, message and details from the body { ok: false, error: { code, message, details } }, for a non-2xx answer and for a 2xx JSON body whose ok is not true. The other failures are SYSTEM_TIMEOUT at the shell''s 30000 millisecond cutoff, SYSTEM_ABORTED for a cancelled request, SYSTEM_NETWORK when no answer comes, HTTP 401 with AUTH_SESSION_EXPIRED when the session cannot be refreshed, SYSTEM_INVALID_RESPONSE for a 2xx body that is not JSON, and, when the body has no error code, SYSTEM_UPSTREAM at status 500 or above and SYSTEM_UNKNOWN below it, a second 401 included. Each failure carries the wording the application already uses for that code.'
  why: The application already reports failures for back-end requests in exactly these codes and wording. Unlike the edit, a read's accepted answer comes inside { ok, result }, so a 2xx body whose ok is not true is also a refused read.
---
