---
subject: rules/application-shell/the-guard-needs-a-fresh-token
given:
- "the access token expires in 20 seconds"
when:
- "the owner opens the curation address"
then:
- "the owner is sent to the sign-in address with the reason session_expired"
---

## Description

A token about to expire is not fresh.
