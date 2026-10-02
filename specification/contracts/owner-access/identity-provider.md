---
type: api
direction: consumed
upstream: contracts/system/owner-identity
operations:
- sign-in-with-credentials
- obtain-access-token
answers:
- operation: sign-in-with-credentials
  accepted: any 2xx answer to POST /sign-in/email with the JSON body { email, password } and the browser's credentials included, whose body is ignored
  refusals:
  - when: The answer's body names the code INVALID_EMAIL_OR_PASSWORD, at any status.
    answer: the credentials are rejected
  - when: The answer has status 401 with any other code or none.
    answer: the credentials are rejected
  - when: The answer is any other status outside 2xx.
    answer: a failure carrying the code of the answer's JSON body when it has one, otherwise no code
  - when: The identity provider cannot be reached, because the request fails before any answer, offline, by name resolution, by origin policy or by abort.
    answer: no answer
- operation: obtain-access-token
  accepted: a 2xx answer to GET /token with the browser's credentials included, whose JSON object carries a token that is a non-empty string, and that token is the owner's access token
  refusals:
  - when: The answer has status 401.
    answer: the identity provider holds no session for the owner
  - when: The answer is any other status outside 2xx.
    answer: a failure carrying the code of the answer's JSON body when it has one, otherwise no code
  - when: The answer is 2xx and its body is not JSON.
    answer: no access token
  - when: The answer is 2xx and its body is not an object or carries no token that is a non-empty string.
    answer: no access token
  - when: The identity provider cannot be reached, because the request fails before any answer, offline, by name resolution, by origin policy or by abort.
    answer: no answer
---

## Description

The identity provider's own answers to the two requests the application makes to sign the owner in.
The access token request depends on the session the sign-in request established, and both requests carry the browser's credentials to reach it.
An error body of the identity provider has the shape { code, message }, and the code INVALID_EMAIL_OR_PASSWORD is the only one the application recognises.
