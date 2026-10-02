---
subject: rules/ingest-workspace/first-unauthorized-answer-refreshes-the-token-once
given:
- "the owner's access token expired"
- "the identity provider can issue a new one"
when:
- "an ingestion request is answered 401"
then:
- "a new access token is stored"
- "the same request is sent again once with the new token as its bearer"
---

## Description

An expired token costs the owner nothing when the identity provider can issue a new one.
