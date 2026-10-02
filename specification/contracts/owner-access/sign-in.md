---
type: api
direction: published
operations:
- open-sign-in
- submit-sign-in
answers:
- operation: open-sign-in
  accepted: the sign-in form with the e-mail and password fields empty, preceded by the notice "Sua sessão expirou. Faça login novamente." when the caller reports that the owner's session expired, and by no notice otherwise
- operation: submit-sign-in
  accepted: the owner is taken to the sign-in destination, with no notice
  refusals:
  - rule: rules/owner-access/sign-in-requires-valid-email
    answer: the e-mail field shows "Informe um e-mail válido." and nothing is sent to the identity provider
  - rule: rules/owner-access/sign-in-requires-password
    answer: the password field shows "Informe a senha." and nothing is sent to the identity provider
  - rule: rules/owner-access/rejected-credentials-are-a-credential-failure
    answer: a form-level alert and an error notice, both reading "E-mail ou senha incorretos."
  - rule: rules/owner-access/unreachable-provider-is-a-network-failure
    answer: a form-level alert and an error notice, both reading "Erro de conexão. Verifique sua rede e tente novamente."
  - rule: rules/owner-access/network-looking-failure-is-a-network-failure
    answer: a form-level alert and an error notice, both reading "Erro de conexão. Verifique sua rede e tente novamente."
  - rule: rules/owner-access/missing-session-or-token-is-a-session-failure
    answer: a form-level alert and an error notice, both reading "Erro ao obter sessão. Tente novamente."
  - rule: rules/owner-access/any-other-sign-in-failure-is-unknown
    answer: a form-level alert and an error notice, both reading "Erro inesperado. Tente novamente."
---

## Description

What the owner reads and can do at the sign-in screen.
The notice about an expired session and the alert of a failed attempt each depend on their own condition, so both can be shown together.
