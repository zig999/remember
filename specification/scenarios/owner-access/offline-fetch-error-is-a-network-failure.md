---
subject: rules/owner-access/network-looking-failure-is-a-network-failure
given:
- a failure that did not come out of the exchange with the identity provider, whose message says "Failed to fetch"
when:
- the owner's sign-in attempt ends with that failure
then:
- the failure is classified as network
- the owner reads "Erro de conexão. Verifique sua rede e tente novamente."
---

## Description

The message of a failure outside the exchange decides its kind, and only there.
