---
subject: rules/application-shell/an-expired-token-is-renewed-by-the-pending-read
given:
- "the shell holds an access token that has expired"
- "the owner's session cookie is still valid"
when:
- "the pending curation read is answered 401"
then:
- "the identity provider is asked once for a fresh access token"
- "the read is asked once more with the fresh token"
- "the footer shows the total of that answer"
---

## Description

An expired token costs the owner nothing while the session lives.
