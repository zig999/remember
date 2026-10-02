---
subject: rules/application-shell/a-repeated-request-never-refreshes-again
given:
- "a request answered 401"
- "the identity provider returns a fresh token"
when:
- "the request is repeated and answered 401 again"
then:
- "no second refresh is asked"
- "the answer is judged like any answer below 500"
---

## Description

A second 401 is not refreshed.
