---
subject: contracts/owner-access/sign-in
given:
- the caller reported that the owner's session expired and the owner submitted wrong credentials
when:
- the identity provider rejects the credentials
then:
- the notice "Sua sessão expirou. Faça login novamente." is still shown
- the alert "E-mail ou senha incorretos." is shown beside it
---

## Description

A failed attempt does not clear the notice about the expired session, and neither hides the other.
