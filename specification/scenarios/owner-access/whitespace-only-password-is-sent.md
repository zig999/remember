---
subject: rules/owner-access/sign-in-requires-password
given:
- the owner typed a valid e-mail address and a password made only of spaces
when:
- the owner submits the sign-in form
then:
- the attempt is sent to the identity provider
---

## Description

A password made only of spaces is not empty, so the form does not hold it back.
