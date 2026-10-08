---
subject: rules/application-shell/a-failed-renewal-on-the-pending-read-ends-the-session
given:
- "the shell holds an access token that has expired"
- "the identity provider holds no session for the owner"
when:
- "the pending curation read is answered 401"
then:
- "the stored token is cleared"
- "the page is replaced with the sign-in address and the reason session_expired"
---

## Description

A session that cannot be renewed ends where the owner can sign in again.
