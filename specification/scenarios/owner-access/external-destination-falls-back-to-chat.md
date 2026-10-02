---
subject: rules/owner-access/sign-in-destination-defaults-to-chat
given:
- the address of the sign-in screen asks for the destination //other.example/page
when:
- the owner signs in successfully
then:
- the owner is taken to /chat
---

## Description

A requested destination that leaves the application is replaced, never followed.
