---
type: api
direction: published
operations:
- show-conversation
- compose-message
- read-history
- show-turn-progress
- show-usage
answers:
- operation: show-conversation
  accepted: "the conversation section named \"Conversa\", the message list named \"Mensagens da conversa\" and the composer named \"Compositor de mensagem\""
  refusals:
  - when: "No conversation is active."
    answer: "\"Selecione ou crie uma conversa para começar.\""
  - rule: "rules/chat-workspace/archived-conversation-offers-no-input"
    answer: "the banner \"Conversa arquivada\" reading \"Esta conversa está arquivada. Reative para enviar novas mensagens.\" with the action \"Reativar\""
- operation: compose-message
  accepted: "the text field labelled \"Mensagem para o assistente\", the send button named \"Enviar mensagem\" and the stop button named \"Parar geração\", in a band named \"Compositor de mensagem\""
  refusals:
  - rule: "rules/chat-workspace/content-needs-a-character"
    answer: "an inline alert \"Digite uma mensagem antes de enviar.\" and nothing sent"
  - rule: "rules/chat-workspace/content-has-at-most-32768-characters"
    answer: "an inline alert \"A mensagem é muito longa. Reduza o texto.\" while typing and nothing sent"
  - when: "The last send ended with BUSINESS_CHAT_DISABLED."
    answer: "the text field and the send button disabled with the inline notice \"O chat está temporariamente indisponível (desativado).\""
  - when: "The last send ended with BUSINESS_CHAT_PROVIDER_UNAVAILABLE."
    answer: "the text field and the send button disabled with the inline notice \"O provedor do chat está indisponível. Tente novamente em instantes.\""
  - rule: "rules/chat-workspace/any-other-code-leaves-the-composer-usable"
    answer: "the composer stays usable, the typed text is kept and no notice is shown"
- operation: read-history
  accepted: "the messages as bubbles in a list named \"Mensagens da conversa\""
  refusals:
  - rule: "rules/chat-workspace/loading-history-shows-three-placeholders"
    answer: "three placeholder bubbles and the list marked busy"
  - when: "The history cannot be loaded."
    answer: "the inline alert \"Não foi possível carregar o histórico. Tente novamente.\" with the action \"Tentar novamente\""
  - when: "The conversation has no messages and no turn is streaming."
    answer: "\"Nenhuma mensagem ainda. Envie uma mensagem para começar.\""
- operation: show-turn-progress
  accepted: "while the assistant is thinking the hint \"pensando…\", while a tool call runs the hint \"consultando a memória… (<tool>)\" naming the most recent tool still waiting or \"consultando a memória…\" when none waits, and each tool-call chip with the tool's name, the summary of its arguments, the status \"em andamento\", \"concluído\" or \"erro\" and the accessible name \"<tool> — <status>\""
- operation: show-usage
  accepted: "the three counts of the conversation usage under the accessible name \"Uso: X tokens de entrada, Y tokens de saída, Z chamadas de ferramenta\""
---

## Description

What the owner reads and can do on the chat screen.
The graph pane beside it belongs to the graph feature.
