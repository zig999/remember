---
type: api
direction: published
operations:
- show-failure
- show-shell
- show-page-state
answers:
- operation: show-failure
  accepted: "the toast, inline state or redirect the failure routes to, with the wording of its code"
  refusals:
  - rule: "rules/application-shell/any-other-system-failure-hides-its-message"
    answer: "a danger toast reading \"Algo deu errado. Tente novamente.\""
  - rule: "rules/application-shell/a-forbidden-failure-reads-access-denied"
    answer: "a danger toast reading \"Acesso negado.\""
  - rule: "rules/application-shell/an-invalid-format-is-a-form-error"
    answer: "a form error with the server's message or \"Há campos inválidos no formulário.\""
  - rule: "rules/application-shell/a-missing-conversation-returns-to-chat"
    answer: "a warning toast reading \"Conversa não encontrada.\" and the chat address"
  - rule: "rules/application-shell/a-missing-resource-elsewhere-is-an-empty-state"
    answer: "an inline state with the server's message or \"Nenhum resultado encontrado.\""
  - rule: "rules/application-shell/a-gone-resource-reads-removed-for-compliance"
    answer: "an inline state reading \"Esta fonte foi removida por conformidade.\""
  - rule: "rules/application-shell/a-network-failure-reads-no-connection"
    answer: "a warning toast reading \"Sem conexão.\""
  - rule: "rules/application-shell/a-business-failure-shows-its-message"
    answer: "a warning toast with the server's message or \"Operação não pôde ser concluída.\""
  - when: "The session expired failure is raised by the request helper."
    answer: "the failure \"Sua sessão expirou. Faça login novamente.\" with HTTP status 401"
- operation: show-shell
  accepted: "the banner \"Cabeçalho\" with the navigation \"Áreas\", the palette toggle \"Abrir paleta de comandos (⌘K)\" and the theme choice \"Tema\", the workspace, and the footer \"Rodapé\" with the health state, the pending curation total and the as-of date \"Como em: hoje\""
  refusals:
  - when: "The access token is missing or expiring."
    answer: "the sign-in address with the reason session_expired"
- operation: show-page-state
  accepted: "the workspace of the address"
  refusals:
  - rule: "rules/application-shell/an-unknown-address-says-page-not-found"
    answer: "\"Página não encontrada.\" with \"O endereço solicitado não existe ou foi removido.\""
  - rule: "rules/application-shell/a-render-failure-replaces-the-screen"
    answer: "\"Algo deu errado.\" reading \"A página não pôde ser renderizada. Recarregue para tentar novamente.\" with the action \"Recarregar\""
  - rule: "rules/application-shell/some-addresses-show-only-a-placeholder"
    answer: "the title of the area with \"Conteúdo em breve.\""
  - rule: "rules/application-shell/the-palette-offers-five-destinations"
    answer: "\"Nada encontrado.\" in the palette"
---

## Description

What the owner reads around every workspace and when a request fails.
