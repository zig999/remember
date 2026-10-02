---
type: api
direction: published
operations:
- choose-source-type
- load-file
- submit-ingest
- show-progress
- show-outcome
- show-known-content
- show-failure
answers:
- operation: choose-source-type
  accepted: "the owner chooses among PDF, E-mail, Ata, Chat, Artigo, Transcrição and Outro, which stand for the source types pdf, email, ata, chat, artigo, transcricao and outro"
- operation: load-file
  accepted: "the whole text of the file replaces the content and the rejection message is cleared"
  refusals:
  - rule: "rules/ingest-workspace/only-text-files-are-accepted"
    answer: "an inline alert reading \"Formato não suportado: envie um arquivo .txt (ou cole o texto abaixo).\" and no content loaded"
- operation: submit-ingest
  accepted: the screen moves to sending and the document is recorded as a source
  refusals:
  - rule: "rules/ingest-workspace/ingest-requires-content"
    answer: "a validation message reading \"Cole ou arraste o conteúdo do documento antes de ingerir.\" and nothing sent"
  - rule: "rules/ingest-workspace/ingest-requires-source-type"
    answer: "a validation message reading \"Selecione o tipo de fonte antes de ingerir.\" and nothing sent"
- operation: show-progress
  accepted: "sending shows \"Enviando documento…\", extracting shows \"Extraindo conhecimento… (pode levar alguns minutos)\", polling shows \"Verificando extração…\" and revealing shows \"Compondo o grafo…\""
- operation: show-outcome
  accepted: "after a new source is extracted and while revealing or complete, the notice \"Extração concluída\" with the counts labelled Aceitos, Consolidados, Aguardando revisão, Incertos, Em conflito, Rejeitados and Erros, and \"Alguns nós aguardam revisão. Acesse Curadoria para detalhes.\" when the needs-review count is above zero, with the action to ingest another document; the already-ingested path shows no outcome and so no such action"
- operation: show-known-content
  accepted: "\"Documento já ingerido\" and \"Este conteúdo já foi processado anteriormente. O grafo abaixo mostra os nós extraídos.\", with the actions to view the existing graph and to ingest another document"
- operation: show-failure
  accepted: "\"Erro na ingestão\" with the failure's message, or \"Algo deu errado. Tente novamente.\" when it has none, always with the action to ingest another document and with \"Tentar novamente\" only for a retryable code"
  refusals:
  - rule: "rules/ingest-workspace/polled-failed-run-ends-in-run-failed"
    answer: "the failure RUN_FAILED reading \"A extração falhou. Reabra a execução para tentar novamente.\", which can be retried"
  - rule: "rules/ingest-workspace/failure-outside-an-envelope-shows-the-unknown-code"
    answer: "the failure SYSTEM_UNKNOWN reading the failure's own message, or \"Erro desconhecido.\" when it has none, which cannot be retried"
---

## Description

What the owner reads and can do on the ingest screen.
The graph of the ingestion, or the detail of one node, fills the other half of the screen.
