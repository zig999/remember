# Full text

Derived by spec.py from the specification files; never edited. Grep here to locate;
open the node file a match names before claiming anything about it.

=== constraints/answers-carry-allowed-origin
---
statement: An answer to a request from an allowed origin, a refusal included, carries that origin as the allowed origin, and an answer to any other origin carries none.
scope: system
---

## Description

None.

=== constraints/anthropic-key-required
---
statement: The system does not start without the key of the language model provider.
scope: system
---

## Description

None.

=== constraints/chat-content-is-data
---
statement: The assistant is instructed to treat the content of documents and tool results as data, never as instruction.
scope: chat
---

## Description

None.

=== constraints/chat-directed-ingestion-description-matches-mcp
---
statement: The description of directed ingestion offered to the chat assistant is the same text that the MCP ingest endpoint lists for that tool.
scope: chat
---

## Description

This governs only whether the chat assistant and the MCP ingest endpoint describe directed ingestion with the same text.
It does not decide what that text says.
It does not decide when the assistant may call directed ingestion, which rules/chat/assistant-writes-only-on-owner-request decides.
It does not decide whether the chat offers the tool at all, which constraints/chat-toolset decides.

=== constraints/chat-directed-ingestion-description-matches-mcp.log
---
entries:
- field: statement
  unstated: No node says whether the description of directed ingestion offered to the chat assistant is the same text that the MCP ingest endpoint lists for that tool, or a wording of its own.
  decided: The chat assistant is offered the same description text that the MCP ingest endpoint lists for directed ingestion.
  why: Both surfaces offer one operation, ingest-directed, to a model that decides when to call it from that description. A separate chat wording would let the two surfaces tell a model different things about when to write, and correcting one would not correct the other.
---

=== constraints/chat-reads-are-consistent
---
statement: Each conversation usage read and each history built for a turn sees one consistent state of its conversation.
scope: chat
fitness: each conversation usage read and each model-context build runs inside one read-only database transaction
---

## Description

None.

=== constraints/chat-toolset
---
statement: The assistant's tools are the node read, the traversal, the three histories, the node listing, the three catalog listings, search and the three provenance reads, and directed ingestion only where chat ingestion is enabled and directed ingestion is available.
scope: chat
---

## Description

None.

=== constraints/compliance-deletion-is-atomic
---
statement: A compliance deletion's changes to its raw information, raw chunks, information fragments, knowledge links, node attributes and audit records take effect together or not at all.
scope: knowledge-base
fitness: each compliance deletion, over either transport, runs inside one database transaction
---

## Description

None.

=== constraints/curation-is-atomic
---
statement: Each curation operation's changes to knowledge nodes, aliases, entity match reviews, knowledge links, node attributes, provenance and its curation action take effect together or not at all.
scope: knowledge-base
fitness: each curation write operation, over either transport, runs inside one database transaction
---

## Description

None.

=== constraints/curation-mcp-needs-no-run-identity
---
statement: A curation call over MCP is served without the identity of an LLM run.
scope: knowledge-base
---

## Description

None.

=== constraints/curation-reads-are-consistent
---
statement: Each review queue listing and each curation metrics read sees one consistent state of the knowledge base.
scope: knowledge-base
fitness: each review queue listing and each curation metrics read runs inside one read-only database transaction
---

## Description

None.

=== constraints/curation-transports-answer-alike
---
statement: The REST and MCP transports answer every curation operation they both expose with the same result on success and the same error code on refusal.
scope: knowledge-base
---

## Description

None.

=== constraints/curation-write-failure-logged
---
statement: A curation write that fails because the store is unreachable is logged at error level as curation_request_failed with its error code and its cause.
scope: knowledge-base
---

## Description

None.

=== constraints/document-content-is-data
---
statement: An extraction presents a document's content, and the document context read from it, to the language model marked apart from its instructions as data, never as instruction and never in the system prompt.
scope: knowledge-base
---

## Description

It does not cover the source's metadata shown with each chunk.

=== constraints/document-content-is-data.log
---
entries:
- field: statement
  unstated: The material shows a document context to the model with every chunk without saying how it is presented.
  decided: The document context is presented to the model marked apart from its instructions as data, like the content it was read from.
  why: The context is a model reading of the document, so an instruction planted in the document can reach it.
- field: statement
  unstated: Nothing said where the document's content and the context read from it are carried in the call to the model, so a change that put them in the system prompt beside the instructions would still read as marked apart.
  decided: They are never carried in the system prompt, which holds the instructions alone. Which marks set the content apart inside the call (a data label, a closing delimiter) is how a project arranges its source and stays out of this node.
  why: The system prompt is the channel the model reads as instruction, so content placed there is no longer apart from the instructions whatever mark surrounds it; the label and the closing delimiter are one way to mark and a project's own arrangement.
- field: statement
  unstated: Nothing said whether the source's metadata shown with each chunk (source type, reception date, document date, title) is document content.
  decided: It is the source's trusted record, not document content, so this node does not cover it.
  why: The owner decided it is trusted record data; it is not text read from the document.
---

=== constraints/every-operation-requires-owner-authentication
---
statement: Every operation reached over the network authenticates the owner before it runs, by a bearer token the auth provider signed, that has not expired and that names the owner.
scope: system
---

## Description

None.

=== constraints/every-operation-requires-owner-authentication.log
---
entries:
- field: statement
  unstated: The specification held owner authentication only for retrieval, while the material authenticates the owner the same way before every operation.
  decided: One system constraint for every operation; constraints/retrieval-requires-owner-authentication is removed, as it held no binding and no log entry.
  why: The same gate over every operation is one fact, and two constraints stating it for overlapping scopes would be two homes.
- field: statement
  unstated: The constraint said every operation authenticates the owner, while the local process transport serves the query and ingest toolsets with no authentication.
  decided: The constraint holds for operations reached over the network.
  why: The local process transport has no network surface and its documented model trusts the owner of the local process, so the gate cannot apply there.
---

=== constraints/expected-refusals-not-logged-as-errors
---
statement: A refusal for a business or validation cause is never logged at error level, except a failure to build the model provider at the start of a chat turn.
scope: system
---

## Description

None.

=== constraints/expected-refusals-not-logged-as-errors.log
---
entries:
- field: statement
  unstated: The constraint said a business refusal is never logged at error and the code logs one.
  decided: The provider-build failure at turn start is the exception.
  why: The factory failure is logged at error and refused as provider unavailable, and the streaming case logs at warn.
---

=== constraints/extraction-acts-only-through-proposals
---
statement: The language model that extracts a document acts on the knowledge base only through the fragment, node, link and attribute proposals.
scope: knowledge-base
---

## Description

None.

=== constraints/extraction-model-call-bounded
---
statement: A call to the language model for extraction waits at most five minutes and is retried at most twice.
scope: knowledge-base
---

## Description

None.

=== constraints/failures-answer-one-envelope
---
statement: Every refused or failed operation answers an error code and a message, with details only where the refusal gives them, and never as a success.
scope: system
---

## Description

None.

=== constraints/ingest-toolset-offers-no-async-ingestion
---
statement: The ingest toolset offers no tool that starts an ingestion and returns before it completes.
scope: knowledge-base
---

## Description

None.

=== constraints/ingest-toolset-offers-no-async-ingestion.log
---
entries:
- field: statement
  unstated: The material says the ingest toolset does not announce start_async_ingestion, and does not say whether the exclusion is of that tool alone or of the kind of tool.
  decided: The toolset offers no tool that starts an ingestion and returns before it completes.
  why: The tool is retired because ingestion is one-shot, and a different name for the same behavior would breach the same reason.
---

=== constraints/ingestion-transports-answer-alike
---
statement: The REST and MCP transports answer every ingestion operation they both expose with the same result on success and the same error code on refusal.
scope: knowledge-base
---

## Description

None.

=== constraints/ingestion-transports-answer-alike.log
---
entries:
- field: statement
  unstated: The material has an MCP proposal whose service answered a refusal without raising it return that refusal wrapped in a success, while REST returns the refusal itself.
  decided: The two transports carry the same result and the same error code for every ingestion operation both expose, so MCP answers such a refusal as a refusal.
  why: Nothing in the material makes the ingestion transports differ in what they answer, only in how they frame it.
---

=== constraints/internal-failure-withholds-cause
---
statement: An operation that fails for an unexpected cause answers a fixed message and never the cause.
scope: system
---

## Description

None.

=== constraints/llm-toolset-omits-audit-reads
---
statement: The language model's curation tool surface exposes compliance deletion and none of the compliance-deletion or curation-action reads.
scope: knowledge-base
---

## Description

None.

=== constraints/llm-toolset-omits-curation-metrics
---
statement: The language model's curation tool surface exposes the review queue listing and the six curation decisions and not the curation metrics read.
scope: knowledge-base
---

## Description

None.

=== constraints/llm-toolset-omits-fragment-listing
---
statement: The language model's query tool surface exposes search and the three provenance reads and does not expose the accepted-fragment listing.
scope: knowledge-base
---

## Description

None.

=== constraints/llm-toolset-omits-graph-point-reads
---
statement: The language model's query tool surface exposes the catalog listings, the node listing, the node read, the three histories and the traversal, and does not expose the reads of one knowledge link or node attribute by identity.
scope: knowledge-base
---

## Description

None.

=== constraints/local-operator-token-development-only
---
statement: Only while the system runs in development does the configured local operator token, compared in constant time, admit the owner without a signed token.
scope: system
---

## Description

None.

=== constraints/local-operator-token-minimum-length
---
statement: A local operator token shorter than 16 characters is refused.
scope: system
---

## Description

None.

=== constraints/local-operator-token-needs-explicit-development
---
statement: The system does not start when a local operator token is configured and the environment is not explicitly development.
scope: system
---

## Description

None.

=== constraints/local-process-transport-needs-no-authentication
---
statement: An operation reached over the local process transport runs without authentication, the owner of the local process being its trust boundary.
scope: system
---

## Description

None.

=== constraints/local-process-transport-needs-no-authentication.log
---
entries:
- field: statement
  unstated: No node said how an operation reached over the local process transport is authenticated.
  decided: It runs without authentication, the owner of the local process being its trust boundary.
  why: The transport entry point starts no network listener and its documentation, the owner's deviation recorded as Emenda v7.5, states this trust model.
---

=== constraints/logs-redact-text-fields
---
statement: Logs show the content, text and value fields of a logged object, of its direct members and of its request body as [REDACTED], show an authorization header as [REDACTED] and show every other field as it is.
scope: system
---

## Description

None.

=== constraints/logs-redact-text-fields.log
---
entries:
- field: statement
  unstated: The constraint said nested fields are redacted at every depth and the paths go one level, and the code also redacts authorization.
  decided: The statement names the covered levels and the authorization header.
  why: The owner decided the source's behavior is the truth, and the judge read it in the code.
---

=== constraints/mcp-endpoint-serves-only-its-toolset
---
statement: Over MCP a call naming a tool outside the endpoint's own toolset answers a tool error, with code NOT_FOUND and the message "Tool '<name>' is not available on this endpoint." on the curation endpoint.
scope: system
---

## Description

None.

=== constraints/mcp-endpoint-serves-only-its-toolset.log
---
entries:
- field: statement
  unstated: The node gave the code and no message for an unknown tool.
  decided: The statement adds the message "Tool '<name>' is not available on this endpoint.".
  why: The kernel emits it on every endpoint.
---

=== constraints/mcp-failure-is-tool-error
---
statement: Over MCP a refused or failed operation answers a tool error result carrying its error code, message and details as JSON text.
scope: system
---

## Description

None.

=== constraints/mcp-transport-failure-answers-empty-500
---
statement: Over MCP a failure of the transport itself, before any response has begun, answers HTTP 500 with no body.
scope: system
---

## Description

None.

=== constraints/mcp-transport-failure-answers-empty-500.log
---
entries:
- field: statement
  unstated: No node holds what the MCP endpoint answers when the transport itself fails.
  decided: The endpoint answers HTTP 500 with no body where no response has begun.
  why: The owner decided the source's behavior is the truth, and the judge read it in the code.
---

=== constraints/owner-time-zone-must-be-known
---
statement: The system does not start when the configured owner time zone is not a known IANA zone.
scope: system
---

## Description

None.

=== constraints/preflight-needs-no-authentication
---
statement: A cross-origin preflight request for a protected operation is answered without authentication and names the allowed origin.
scope: system
---

## Description

None.

=== constraints/request-body-ceiling
---
statement: The system refuses a request body larger than 11 MiB before any operation answers it.
scope: system
---

## Description

None.

=== constraints/request-body-ceiling.log
---
entries:
- field: statement
  unstated: No node holds the largest request body the system accepts.
  decided: The system refuses a request body larger than 11 MiB before any operation answers it.
  why: Two files set the same figure, and it exceeds the 10 MiB content limit on purpose.
---

=== constraints/retrieval-is-lexical-only
---
statement: Retrieval matches text only lexically and never by embeddings or semantic similarity.
scope: knowledge-base
---

## Description

A synonym or paraphrase that shares no characters with what the knowledge base holds is not found; curation is where such a gap is closed.

=== constraints/retrieval-is-read-only
---
statement: Every retrieval operation runs inside a read-only transaction.
scope: knowledge-base
fitness: each retrieval operation's database transaction is opened read-only
---

## Description

None.

=== constraints/retrieval-transports-answer-alike
---
statement: The REST and MCP transports answer every retrieval operation they both expose with the same result on success and the same error code on refusal, an undefined parameter of the node-type listing, the link and attribute reads and the three history reads excepted, which only MCP refuses.
scope: knowledge-base
---

## Description

None.

=== constraints/retrieval-transports-answer-alike.log
---
entries:
- field: statement
  unstated: The standing node had MCP answer in the REST envelope, while the documentation has MCP answer in its own content and error framing with the same payload and the same error codes; the two decide differently for the shape of an MCP success.
  decided: The two transports carry the same result and the same error code, and the constraint no longer fixes the framing.
  why: The documentation states repeatedly that the envelope is REST-only and that only the payload and the codes must match.
- field: statement
  unstated: A judgment shows REST not refusing an undefined parameter on six retrieval reads that MCP refuses.
  decided: The transports answer alike, the six reads' undefined parameter excepted, which only MCP refuses.
  why: The owner decided the source's behavior is the truth, and REST does not parse a query for those six reads.
---

=== constraints/unreachable-store-answers-unavailable
---
statement: An operation that cannot reach the store, or whose statement times out, answers that a backing service is unavailable, never an internal failure.
scope: system
---

## Description

None.

=== contracts/application-shell/bff-shell-reads
---
type: api
direction: consumed
upstream: contracts/knowledge-base/access
operations:
- read-health
- read-pending-curation
answers:
- operation: read-health
  accepted: "GET /health with no bearer, answered with a body whose database or result.database is ok when the store is reachable"
  refusals:
  - when: "The request fails or the body is not JSON."
    answer: "no parsed answer and the health left as verificando…"
- operation: read-pending-curation
  accepted: "GET /api/v1/curation/queue?limit=1 with the access token as a bearer, answered with a total or a result.total"
  refusals:
  - when: "The answer has no total or no token is held."
    answer: "0 pending and the segment hidden"
---

## Description

The two status reads the footer makes.

=== contracts/application-shell/shell-screen
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

=== contracts/application-shell/shell-screen.log
---
entries:
- field: answers
  unstated: Which texts of the shell and of the failure routing the owner learns from.
  decided: The failure, empty, loading and notice wordings and the accessible names of the shell regions are held; navigation and control labels are not
  why: Policy P1 of the frontend adoption runbook keeps text that changes what the owner learns or does.
---

=== contracts/chat-workspace/bff-conversations
---
type: api
direction: consumed
upstream: contracts/chat/conversations
operations:
- send-message
- cancel-turn
- create-conversation
- list-conversations
- read-conversation
- update-conversation
- delete-conversation
- list-messages
- read-conversation-usage
answers:
- operation: send-message
  accepted: "POST /api/v1/conversations/{id}/messages with the id URL-encoded, the JSON body { content } with model only when the caller names one, Content-Type application/json, Accept text/event-stream and an Idempotency-Key header, answered by a stream of event and data frames read as llm_start, text_delta (delta), tool_start (tool, args_summary), tool_result (ok), done (stop_reason), error (code, message) and graph_delta (source_tool, nodes, links)"
  refusals:
  - when: "The request cannot be sent and was not aborted."
    answer: "an error frame SYSTEM_NETWORK reading \"Falha de rede ao contactar o servidor.\""
  - when: "The owner aborts before the answer arrives or while the stream is read."
    answer: "no frame, the stream ending quietly"
  - when: "The answer has no body, whatever its status."
    answer: "an error frame SYSTEM_INVALID_RESPONSE reading \"Resposta do servidor sem corpo.\""
  - when: "The answer is not 2xx and its body is the failure envelope."
    answer: "an error frame with the envelope's own code and message, a missing or non-string field falling back to the fallback for the status"
  - when: "The answer has status 500 or above and no readable envelope."
    answer: "an error frame SYSTEM_UPSTREAM reading \"Algo deu errado. Tente novamente.\""
  - when: "The answer is not 2xx, is below status 500 and has no readable envelope, a 401 included."
    answer: "an error frame SYSTEM_UNKNOWN reading \"Erro desconhecido do servidor.\""
  - when: "Reading the stream fails and was not aborted."
    answer: "an error frame SYSTEM_NETWORK reading \"Falha de rede durante o streaming.\" and the stream ending"
- operation: cancel-turn
  accepted: "POST /api/v1/conversations/{id}/cancel with no body, answered { cancelled: true }"
- operation: create-conversation
  accepted: "POST /api/v1/conversations with the JSON body { title } or {}, answered with a conversation read as id, title, archived_at and created_at, the rolling summary and the update time not kept"
- operation: list-conversations
  accepted: "GET /api/v1/conversations with limit, cursor and include_archived sent only when given, answered with items and next_cursor"
- operation: read-conversation
  accepted: "GET /api/v1/conversations/{id} with the id URL-encoded, answered with a conversation"
- operation: update-conversation
  accepted: "PATCH /api/v1/conversations/{id} with the JSON body of title and archived_at as supplied, answered with a conversation"
- operation: delete-conversation
  accepted: "DELETE /api/v1/conversations/{id} with no body, where only HTTP 204 is a success"
  refusals:
  - when: "The request is aborted."
    answer: "a failure SYSTEM_ABORTED with HTTP status 0 reading \"Requisição cancelada.\""
  - when: "The request cannot be sent."
    answer: "a failure SYSTEM_NETWORK with HTTP status 0 reading \"Falha de rede ao contactar o servidor.\""
  - when: "The answer is not 204 and its body is the failure envelope."
    answer: "a failure carrying the answer's status and the envelope's code, message and details"
  - when: "The answer is not 204, has status 500 or above and no envelope."
    answer: "a failure SYSTEM_UPSTREAM with the answer's status reading \"Algo deu errado. Tente novamente.\""
  - when: "The answer is not 204, is below status 500 and has no envelope, a 200 included."
    answer: "a failure SYSTEM_UNKNOWN with the answer's status reading \"Erro desconhecido do servidor.\""
- operation: list-messages
  accepted: "GET /api/v1/conversations/{id}/messages with limit and before sent only when given, answered with items, each read as id, conversation_id, role, content blocks, stop_reason, idempotency_key, model, tokens_in, tokens_out, latency_ms and created_at, and next_before"
- operation: read-conversation-usage
  accepted: "GET /api/v1/conversations/{id}/usage answered with messages (kept as the message count), tokens_in, tokens_out and tool_calls"
---

## Description

The requests the chat screen makes to the back end and how it reads the answers.
The upstream publishes what each answer carries, and this contract states only how the screen sends and reads it.

=== contracts/chat-workspace/bff-conversations.log
---
entries:
- field: answers
  unstated: The material does not say whether the send stream and the delete, which skip the shared request helper, are bound by the same transport behaviour as the other chat requests.
  decided: The consumed contract states the send stream and the no-body delete with the failures they report themselves, and the other requests as the shared request helper answers them.
  why: The code sends the stream and the delete without the shared helper, so only the shared helper's requests inherit its cutoff and refresh.
---

=== contracts/chat-workspace/chat-screen
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

=== contracts/chat-workspace/chat-screen.log
---
entries:
- field: answers
  unstated: The material does not say which boundary holds the texts, notices and accessible names of the chat screen.
  decided: The chat screen is a published api whose caller is the owner, and every text or accessible name that tells the owner what happened, was refused or what a control is called is an answer of it.
  why: A text or an accessible name changes what the owner learns or can do, while a colour, a spacing or an icon does not.
---

=== contracts/chat/conversations
---
type: api
direction: published
operations:
- create-conversation
- list-conversations
- read-conversation
- update-conversation
- delete-conversation
- send-message
- list-messages
- read-conversation-usage
- read-graph-view
- save-graph-view
- cancel-turn
answers:
- operation: create-conversation
  accepted: 'HTTP 201 with `{ ok: true, result }` carrying the conversation `{ id, title, summary_rolling, archived_at, created_at, updated_at }`, the body optional and unknown keys ignored'
  refusals:
  - &id001
    when: The chat is disabled.
    answer: HTTP 503, error code BUSINESS_CHAT_DISABLED with message "chat surface is disabled by CHAT_ENABLED=false" and no details, answered before anything else is checked
  - rule: rules/chat/conversation-title-length
    answer: HTTP 422, error code VALIDATION_INVALID_FORMAT with message "Request payload failed validation." and `details` a bare list of `{ path, message }`
  - when: The title is null or not a string, or the body is not an object.
    answer: HTTP 422, error code VALIDATION_INVALID_FORMAT with message "Request payload failed validation." and `details` a bare list of `{ path, message }`
  - &id002
    when: The store is unreachable or a statement times out.
    answer: HTTP 503, error code SYSTEM_SERVICE_UNAVAILABLE with message "A backing service is temporarily unavailable."
  - &id003
    when: The operation fails for any other cause.
    answer: HTTP 500, error code SYSTEM_INTERNAL_ERROR with message "Internal server error.", withholding the cause
- operation: list-conversations
  accepted: 'HTTP 200 with `{ ok: true, result: { items, next_cursor } }`, each item the conversation `{ id, title, summary_rolling, archived_at, created_at, updated_at }`, and `next_cursor` an opaque cursor after the last item when more conversations follow and null otherwise'
  refusals:
  - *id001
  - rule: rules/chat/conversation-listing-limit
    answer: HTTP 422, error code VALIDATION_INVALID_FORMAT with message "Request payload failed validation." and `details` a bare list of `{ path, message }`
  - when: '`include_archived` is neither a boolean nor "true" or "false".'
    answer: HTTP 422, error code VALIDATION_INVALID_FORMAT with message "Request payload failed validation." and `details` a bare list of `{ path, message }`
  - when: The cursor does not decode to a creation time and an identity written as text.
    answer: 'HTTP 422, error code VALIDATION_INVALID_FORMAT with a message naming why the cursor is invalid and `details: { param: "cursor" }`'
  - *id002
  - *id003
- operation: read-conversation
  accepted: 'HTTP 200 with `{ ok: true, result }` carrying the conversation `{ id, title, summary_rolling, archived_at, created_at, updated_at }`, archived or not'
  refusals:
  - *id001
  - &id004
    when: The conversation identity is not a well-formed identifier.
    answer: HTTP 422, error code VALIDATION_INVALID_FORMAT with message "Request payload failed validation." and `details` a bare list of `{ path, message }`
  - &id005
    when: No conversation is held at the identity.
    answer: 'HTTP 404, error code RESOURCE_NOT_FOUND with message "conversation not found" and `details: { id }`'
  - *id002
  - *id003
- operation: update-conversation
  accepted: 'HTTP 200 with `{ ok: true, result }` carrying the conversation `{ id, title, summary_rolling, archived_at, created_at, updated_at }` as updated'
  refusals:
  - *id001
  - *id004
  - when: The body is empty.
    answer: 'HTTP 422, error code VALIDATION_REQUIRED_FIELD with message "at least one of title or archived_at must be present" and `details: { body: "PATCH /conversations/:id" }`'
  - rule: rules/chat/conversation-update-names-a-field
    answer: HTTP 422, error code VALIDATION_INVALID_FORMAT with message "Request payload failed validation." and `details` a bare list of `{ path, message }`
  - rule: rules/chat/conversation-title-length
    answer: HTTP 422, error code VALIDATION_INVALID_FORMAT with message "Request payload failed validation." and `details` a bare list of `{ path, message }`
  - when: The archiving time is neither an ISO-8601 datetime nor null.
    answer: HTTP 422, error code VALIDATION_INVALID_FORMAT with message "Request payload failed validation." and `details` a bare list of `{ path, message }`
  - *id005
  - *id002
  - *id003
- operation: delete-conversation
  accepted: HTTP 204 with no body, the conversation removed with its messages, tool calls and graph view
  refusals:
  - *id001
  - *id004
  - *id005
  - *id002
  - *id003
- operation: send-message
  accepted: 'HTTP 200 as a server-sent event stream (`text/event-stream; charset=utf-8`), each frame `event: <name>` then `data: <json>`: `llm_start { iteration }`, `text_delta { delta }`, `tool_start { tool, args_summary }`, `tool_result { tool, ok }`, `graph_delta { source_tool, nodes, links }` with each node `{ id, node_type, canonical_name, status }` and each link `{ id, source_node_id, target_node_id, link_type, is_temporal }` plus `link_type_label`, `is_in_effect`, `status` and `flags` where known, and exactly one closing `done { stop_reason, model, tokens_in, tokens_out }` or `error { code, message }`, the stop reason as `end_turn`, `max_tokens`, `stop_sequence`, `max_iterations`, `turn_timeout` or `cancelled`, tool arguments, tool results and content blocks never sent; a replay streams `llm_start { iteration: 1 }`, the recorded text as one `text_delta` when it is not empty, and `done` with the recorded stop reason, model (`""` when none) and tokens (0 when none), the stop reason being `end_turn` for a turn recorded as provider-error or internal-error, which is never replayed as an `error` frame'
  refusals:
  - when: The chat is disabled.
    answer: HTTP 503, error code BUSINESS_CHAT_DISABLED with message "chat surface is disabled by CHAT_ENABLED=false" and no details
  - when: The Idempotency-Key header is missing or empty.
    answer: 'HTTP 422, error code VALIDATION_REQUIRED_FIELD with message "Idempotency-Key header is required" and `details: { header: "Idempotency-Key" }`'
  - when: The Idempotency-Key header is not a well-formed identifier.
    answer: 'HTTP 422, error code VALIDATION_INVALID_FORMAT with message "Idempotency-Key must be a valid UUID" and `details: { header: "Idempotency-Key", received }`'
  - *id004
  - when: The content is empty or longer than the configured maximum, or the model is empty.
    answer: HTTP 422, error code VALIDATION_INVALID_FORMAT with message "Request payload failed validation." and `details` a bare list of `{ path, message }`, the messages "content must be a non-empty string" and "content must be at most N characters"
  - *id005
  - &id006
    rule: rules/chat/archived-conversation-takes-no-turn
    answer: 'HTTP 409, error code BUSINESS_CONVERSATION_ARCHIVED with message "conversation is archived; un-archive via PATCH /conversations/:id { archived_at: null }" and no details'
  - rule: rules/chat/one-turn-in-flight
    answer: HTTP 409, error code BUSINESS_TURN_IN_PROGRESS with message "another turn is currently in progress on this conversation" and no details, also when a concurrent request under the same key recorded the message first and its turn has not ended
  - rule: rules/chat/idempotency-match
    answer: HTTP 409, error code BUSINESS_IDEMPOTENCY_MISMATCH with message "Idempotency-Key matches an existing request with different content or model" and no details
  - rule: rules/chat/chat-toolset-requires-every-query-tool
    answer: HTTP 404, error code RESOURCE_NOT_FOUND with message "chat surface is not available on this deployment" and no details
  - when: The model provider cannot be reached when the turn starts.
    answer: HTTP 503, error code BUSINESS_CHAT_PROVIDER_UNAVAILABLE with message "chat provider is temporarily unavailable" and no details
  - when: The model provider fails while the turn streams.
    answer: 'an `error` frame `{ code: "BUSINESS_CHAT_PROVIDER_UNAVAILABLE", message: "chat provider is temporarily unavailable" }` in the HTTP 200 stream'
  - when: The model stream ends with no final message.
    answer: 'an `error` frame `{ code: "SYSTEM_INTERNAL_ERROR", message: "chat stream produced no final message" }` in the HTTP 200 stream'
  - when: The turn fails for any other cause after streaming started.
    answer: 'an `error` frame `{ code: "SYSTEM_INTERNAL_ERROR", message: "chat encountered an internal error" }` in the HTTP 200 stream'
  - *id002
  - *id003
- operation: list-messages
  accepted: 'HTTP 200 with `{ ok: true, result: { items, next_before } }`, each item `{ id, conversation_id, role, content, stop_reason, idempotency_key, model, tokens_in, tokens_out, latency_ms, created_at }` with `content` a list of content blocks, and `next_before` the creation time of the oldest item when older messages remain and null otherwise'
  refusals:
  - *id001
  - *id004
  - rule: rules/chat/message-listing-limit
    answer: HTTP 422, error code VALIDATION_INVALID_FORMAT with message "Request payload failed validation." and `details` a bare list of `{ path, message }`
  - when: '`before` is not an ISO-8601 datetime.'
    answer: HTTP 422, error code VALIDATION_INVALID_FORMAT with message "Request payload failed validation." and `details` a bare list of `{ path, message }`
  - *id005
  - *id002
  - *id003
- operation: read-conversation-usage
  accepted: 'HTTP 200 with `{ ok: true, result: { messages, tokens_in, tokens_out, tool_calls } }`, zeros for a conversation with no messages'
  refusals:
  - *id001
  - *id004
  - *id005
  - *id002
  - *id003
- operation: read-graph-view
  accepted: 'HTTP 200 with `{ ok: true, result }` carrying the saved snapshot, or null when none was saved'
  refusals:
  - *id001
  - *id004
  - *id005
  - *id002
  - *id003
- operation: save-graph-view
  accepted: 'HTTP 200 with `{ ok: true, result: { updated_at } }`; the snapshot is `{ version, nodes, links, positions, user_pinned }`, version 1 or 2, `nodes` and `links` lists of objects each with a string `id` and kept whole, `positions` an object from node identity to `{ x, y }`, `user_pinned` a list of strings, and for version 2 `layout_algorithm` one of `force`, `tree` or `radial`, unknown top-level keys dropped'
  refusals:
  - *id001
  - *id004
  - rule: rules/chat/graph-view-snapshot-bounds
    answer: HTTP 422, error code VALIDATION_INVALID_FORMAT with message "invalid graph view snapshot" and `details` the flattened validation issues
  - when: The snapshot names an unknown version, or its positions, pinned nodes or version-2 layout are malformed.
    answer: HTTP 422, error code VALIDATION_INVALID_FORMAT with message "invalid graph view snapshot" and `details` the flattened validation issues, answered before the conversation is looked up
  - *id005
  - *id002
  - *id003
- operation: cancel-turn
  accepted: 'HTTP 202 with `{ ok: true, result: { cancelled: true } }`'
  refusals:
  - *id001
  - *id004
  - *id005
  - *id006
  - rule: rules/chat/cancel-requires-turn-in-flight
    answer: 'HTTP 404, error code RESOURCE_NOT_FOUND with message "no in-flight turn for this conversation" and `details: { id }`'
  - *id002
  - *id003
---

## Description

The owner's conversation surface: creating, listing, reading, updating and deleting conversations, sending a message and streaming the assistant's answer, listing messages, reading usage, reading and saving the graph view, and cancelling a turn.
It is carried by REST alone.

=== contracts/chat/conversations.log
---
entries:
- field: answers
  unstated: The material answers an update naming neither a title nor an archiving time with VALIDATION_REQUIRED_FIELD when the body is empty and with VALIDATION_INVALID_FORMAT when the body holds only other keys.
  decided: Every update naming neither field answers HTTP 422 VALIDATION_REQUIRED_FIELD with message "at least one of title or archived_at must be present".
  why: One condition gets one answer, and unknown keys are ignored everywhere else on this surface.
- field: answers
  unstated: The material answers a conversation cursor with the right shape but a creation time that is not a timestamp or an identity that is not an identifier with an internal error, and any other malformed cursor with VALIDATION_INVALID_FORMAT.
  decided: 'Every cursor that does not decode to a creation time and a well-formed identity answers HTTP 422 VALIDATION_INVALID_FORMAT with `details: { param: "cursor" }`.'
  why: A malformed cursor is the caller's error, never the system's.
- field: answers
  unstated: A judgment shows a cursor accepted when it decodes to two strings, an update body of other keys answered as invalid format, and the disabled chat checked after the key on a sent message.
  decided: The cursor needs a creation time and an identity as text, a body of other keys answers VALIDATION_INVALID_FORMAT, and a sent message is not disabled-first.
  why: The owner decided the source's behavior is the truth, and it answers those three that way.
- field: answers
  unstated: The material's replay sentence says a turn recorded as provider-error or internal-error replays as the error frame that turn closed with, while the source replays it as done with stop reason end_turn.
  decided: A replay of a turn recorded as provider-error or internal-error closes with done carrying stop reason end_turn, never an error frame.
  why: The owner decided the source's behavior is the truth, and rules/chat/replay-reports-failure already states the same end.
---

=== contracts/curation-workspace/bff-curation
---
type: api
direction: consumed
upstream: contracts/knowledge-base/curation
operations:
- send-curation-request
- list-review-queue
- read-curation-metrics
- resolve-entity-match
- merge-nodes
- resolve-dispute
- confirm-item
- reject-item
- correct-item
answers:
- operation: send-curation-request
  accepted: "the 2xx JSON body of the answer is the answer itself and is never unwrapped from { ok, result }, and a 204 answer gives no value"
  refusals:
  - rule: "rules/curation-workspace/curation-request-times-out-after-thirty-seconds"
    answer: "a failure SYSTEM_TIMEOUT reading \"Tempo limite excedido na requisição.\""
  - when: "The request is cancelled by its caller before an answer."
    answer: "a failure SYSTEM_ABORTED reading \"Requisição cancelada.\""
  - when: "The request gets no answer for any other cause."
    answer: "a failure SYSTEM_NETWORK reading \"Falha de rede ao contactar o servidor.\""
  - rule: "rules/curation-workspace/unrefreshable-curation-session-ends-at-sign-in"
    answer: "HTTP 401 with the failure AUTH_SESSION_EXPIRED reading \"Sua sessão expirou. Faça login novamente.\""
  - when: "The answer is 2xx and its body is not JSON."
    answer: "that status with the failure SYSTEM_INVALID_RESPONSE reading \"Resposta do servidor não é JSON válido.\""
  - when: "The answer is not 2xx and its body carries an error object with a string code."
    answer: "that status with the code, the details and, when it is a string, the message of the error object, otherwise a message for the status"
  - when: "The answer has status 500 or above and its body carries no readable error code."
    answer: "that status with the failure SYSTEM_UPSTREAM reading \"Algo deu errado. Tente novamente.\""
  - when: "The answer is not 2xx, is below status 500 and its body carries no readable error code, a second 401 included."
    answer: "that status with the failure SYSTEM_UNKNOWN reading \"Erro desconhecido do servidor.\""
- operation: list-review-queue
  accepted: "GET /api/v1/curation/queue with kind, limit and offset sent only when given, read as total, limit, offset and items, an entity-match entry with its node id, node type, canonical name, candidates (candidate node id, canonical name and similarity) and creation time, and any other entry as a dispute with its item kind, scope (source node id, target node id, link type, node id and attribute key), sides (item id, value, target node id, valid-from, valid-to, valid-from basis, confidence and status) and creation time"
- operation: read-curation-metrics
  accepted: "GET /api/v1/curation/metrics read as accept_rate, reject_rate_by_code, needs_review_count, uncertain_count, disputed_count, entity_match_queue_count, disputed_queue_count and computed_at"
- operation: resolve-entity-match
  accepted: "POST /api/v1/curation/entity-matches/{node_id}/resolve with the node id path-encoded and a JSON body of decision, an optional target_node_id and an optional reason, read as node_id, decision, resulting_status, an optional target_node_id, action_id and optional counts links_repointed, attributes_repointed, aliases_copied and path_compressed_nodes"
- operation: merge-nodes
  accepted: "POST /api/v1/curation/nodes/merge with a JSON body of survivor_id, absorbed_id and reason, read as survivor_id, absorbed_id, the four counts and action_id"
- operation: resolve-dispute
  accepted: "POST /api/v1/curation/disputes/resolve with a JSON body of item_kind, item_ids, decision, an optional winner_id, an optional reason and optional periods, read as item_kind, decision, action_id and items each with item_id, resulting_status and optional valid_from and valid_to"
- operation: confirm-item
  accepted: "POST /api/v1/curation/items/confirm with a JSON body of item_kind, item_id and an optional reason, read as item_kind, item_id, resulting_status and action_id"
- operation: reject-item
  accepted: "POST /api/v1/curation/items/reject with a JSON body of item_kind, item_id and a required reason, read as item_kind, item_id, resulting_status and action_id"
- operation: correct-item
  accepted: "POST /api/v1/curation/items/correct with a JSON body of item_kind, item_id, a required reason and the corrected values value, target_node_id, valid_from, valid_to, valid_from_source and valid_from_fragment_id, all optional, read as item_kind, predecessor_id, new_item_id and action_id"
---

## Description

The requests the curation screen makes to the back end and how it reads the answers.
The upstream publishes what each answer carries, and this contract states only how the screen sends and reads it.

=== contracts/curation-workspace/bff-curation-reads
---
type: api
direction: consumed
upstream: contracts/knowledge-base/retrieval
operations:
- read-node
- read-link-history
- read-attribute-history
- read-link-provenance
- read-attribute-provenance
- read-fragment-provenance
- list-accepted-fragments
answers:
- operation: read-node
  accepted: "GET /api/v1/nodes/{id} with the id path-encoded, read through the { ok, result } envelope as node (id, node_type, canonical_name, status and an optional merged_into_node_id), aliases (id, alias, kind and an optional created_at) and attributes (id, node_id, attribute_key, value_type, value, valid_from, valid_to, recorded_at, superseded_at, status, effective_status, is_current, is_in_effect, confidence and the optional valid_from_source, flags read as an empty list when absent, and supersedes_attribute_id)"
- operation: read-link-history
  accepted: "GET /api/v1/links/{id}/history read as versions each with id, source_node_id, target_node_id, link_type, link_inverse_name, valid_from, valid_to, recorded_at, superseded_at, status, effective_status, is_current, is_in_effect, confidence and the optional valid_from_source and supersedes_link_id"
- operation: read-attribute-history
  accepted: "GET /api/v1/attributes/{id}/history read as versions each shaped as an attribute of the node detail"
- operation: read-link-provenance
  accepted: "GET /api/v1/provenance/links/{id} read as fragments each with id, text, confidence, status and chunks, each chunk with id, chunk_index, offset_start, offset_end, excerpt, an optional locator read as an empty object when absent and its raw information (id, source_type, received_at and optional metadata read as an empty object when absent)"
- operation: read-attribute-provenance
  accepted: "GET /api/v1/provenance/attributes/{id} read as the link provenance is read"
- operation: read-fragment-provenance
  accepted: "GET /api/v1/provenance/fragments/{id} read as the link provenance is read"
- operation: list-accepted-fragments
  accepted: "GET /api/v1/fragments/accepted with llm_run_id, raw_information_id, limit and offset sent only when given, read as total, limit, offset and items each with fragment_id, text, confidence, llm_run_id, created_at and a source (raw_information_id, chunk_index, source_type, received_at and an optional document_title)"
---

## Description

The reads of the knowledge base the curation screen makes to show evidence and history.

=== contracts/curation-workspace/bff-curation-reads.log
---
entries:
- field: answers
  unstated: The node says metadata, locator and flags are optional and not what an absent one reads as.
  decided: An absent flags reads as an empty list and an absent locator or metadata as an empty object.
  why: The running reader normalises them that way so that every consumer sees a list or an object.
---

=== contracts/curation-workspace/bff-curation.log
---
entries:
- field: answers
  unstated: The material does not say whether the transport behaviour of the curation request helper, which repeats the ingest helper's, is held once or twice.
  decided: The curation contract states its own transport behaviour in its own rules, the same as the ingest contract does, until the shared transport is adopted.
  why: Each feature owns its own request helper in the code, and a rule shared across them would bind a file nobody has judged yet.
---

=== contracts/curation-workspace/curation-screen
---
type: api
direction: published
operations:
- show-queue
- show-metrics
- decide-item
- undo-decision
- read-decision-panel
- correct-item
- show-evidence
- use-batch-bar
- open-drawer
answers:
- operation: show-queue
  accepted: "the tabs Tudo, Entidades and Disputas and, for the tab chosen, each entry with a badge (Para revisar for an entity match, Disputado for a dispute), its age and its scope line (the node's canonical name for an entity match, \"Link · <link type>\" or \"Link\" and \"Atributo · <attribute key>\" or \"Atributo\" for a dispute), and the pill \"1 novo\" or \"N novos\" when entries arrived since the baseline"
  refusals:
  - when: "The queue read fails."
    answer: "the banner \"Não foi possível carregar a fila. Tente novamente.\" replaces the list, with a retry that reads the queue again and no status or code shown"
  - when: "The queue read succeeds with no entries."
    answer: "\"Nada pendente\" with \"A fila está limpa.\", the same on every tab"
  - when: "Nothing is selected or the selection is not in the loaded queue."
    answer: "the decision column reads \"Selecione um item da fila para começar.\""
- operation: show-metrics
  accepted: "the labels Aceitação, Em revisão, Incertos, Disputados and Fila entidades over the acceptance rate as a percentage and the four counts"
  refusals:
  - rule: "rules/curation-workspace/failed-metrics-fall-back-to-the-queue-totals"
    answer: "a dash for Aceitação, Em revisão and Incertos and the queue totals for Disputados and Fila entidades, with no error shown"
- operation: decide-item
  accepted: "an immediate decision answers the notice \"Confirmado.\" for two seconds and moves to the next item, and a destructive decision answers the undo toast and moves to the next item at once"
  refusals:
  - when: "The failure carries no error envelope."
    answer: "the notice \"Algo deu errado. Tente novamente.\""
  - when: "The failure is one of the authentication codes AUTH_UNAUTHORIZED, AUTH_TOKEN_EXPIRED, AUTH_TOKEN_INVALID or AUTH_SESSION_EXPIRED."
    answer: "no notice and no field error"
  - when: "The failure is BUSINESS_REVIEW_NOT_PENDING or BUSINESS_ITEM_NOT_DISPUTED."
    answer: "the warning \"Já resolvido em outro lugar.\" with the item removed and the stale signal raised"
  - when: "The failure is BUSINESS_ITEM_NOT_UNCERTAIN."
    answer: "the warning \"Este item já não está incerto.\" with the item removed"
  - when: "The failure is BUSINESS_ITEM_NOT_DELETABLE."
    answer: "the warning \"Este item já foi rejeitado ou substituído.\" with the item removed"
  - when: "The failure is BUSINESS_NODE_DELETED."
    answer: "the warning \"Este nó foi excluído por conformidade.\" with the item removed"
  - when: "The failure is RESOURCE_NOT_FOUND."
    answer: "the warning \"Item não encontrado.\" with the item removed"
  - when: "The failure is one of BUSINESS_REASON_REQUIRED, BUSINESS_SELF_MERGE_FORBIDDEN, BUSINESS_TARGET_NODE_REQUIRED, BUSINESS_INVALID_TARGET_NODE, BUSINESS_DISPUTE_WINNER_REQUIRED, BUSINESS_DISPUTE_PERIODS_REQUIRED, BUSINESS_TEMPORAL_INCOHERENT, BUSINESS_DATE_UNJUSTIFIED, BUSINESS_CORRECTION_NO_CHANGES or BUSINESS_FRAGMENT_NOT_ACCEPTED."
    answer: "the code, the message and the status shown as a field error in the decision panel, with no notice"
  - when: "The failure has status 503 and any other code."
    answer: "the notice \"Serviço temporariamente indisponível. Tente novamente em instantes.\""
  - when: "The failure has a status of 500 or above other than 503 and any other code."
    answer: "the notice \"Algo deu errado. Tente novamente.\""
  - when: "The failure is any other enveloped code below status 500."
    answer: "the code, the message and the status shown as a field error in the decision panel"
  - rule: "rules/curation-workspace/leaving-sends-the-pending-decision-at-once"
    answer: "the notice \"Ação comprometida ao sair.\""
- operation: undo-decision
  accepted: "the undo toast shows the caption Item fundido, Lado preferido or Item rejeitado and the whole seconds left as \"Ns\", announced as \"Tempo restante para desfazer: N segundos\", and offers Desfazer"
- operation: read-decision-panel
  accepted: "the labels Fundir neste and Manter separados for an entity match and Preferir este, Manter em disputa and Corrigir… for a dispute; the evidence indicator Ver evidência then Evidência vista; a blocked decision carrying the hint \"Veja a evidência antes de decidir.\"; for a single high-similarity candidate \"Candidato com alta similaridade (≥ 90%): podemos fundir diretamente.\", for several candidates \"Múltiplos candidatos — escolha qual representa a mesma entidade.\", for none \"Nenhum candidato sugerido. Você pode manter separados ou fundir ad-hoc por busca.\"; for a link dispute \"Há N alvos conflitantes para o vínculo <link type>:\" with \"“<link type>” admite apenas um destino vigente por vez, e as vigências abaixo se sobrepõem. Escolha qual vale (os perdedores são arquivados) ou ajuste os períodos para que não se sobreponham.\"; for an attribute dispute \"Há N valores conflitantes para <attribute key>:\" with \"Apenas um valor pode vigorar por vez no mesmo período. Escolha qual vale ou ajuste os períodos.\"; the instruction \"Selecione qual lado prefere.\" in summary and \"Selecione qual lado prefere ou ajuste os períodos.\" otherwise; the period lines \"Lado X: sem datas registradas\", \"Lado X: vigente de <from> em diante\", \"Lado X: vigente até <to>\" and \"Lado X: vigente de <from> a <to>\"; the basis labels Declarada, Doc. and Receb.; and, for a stale item, \"Este item mudou desde que você o abriu.\" with Recarregar"
  refusals:
  - rule: "rules/curation-workspace/blank-reason-blocks-a-destructive-decision"
    answer: "\"Informe um motivo para continuar.\" under the reason field"
  - rule: "rules/curation-workspace/self-merge-refusal-shows-the-fixed-text"
    answer: "the fixed alert \"Não é possível fundir um nó com ele mesmo.\""
- operation: correct-item
  accepted: "the date justification bases Declarada no fragmento (\"A própria fonte diz a data — selecione o fragmento.\"), Data do documento (\"Derivada da data do documento de origem.\") and Data de recebimento (\"Quando o sistema recebeu a informação.\")"
  refusals:
  - rule: "rules/curation-workspace/attribute-correction-needs-a-value"
    answer: "the message \"Informe o valor corrigido.\" on the value field"
  - rule: "rules/curation-workspace/link-correction-needs-a-target"
    answer: "the message \"Selecione o nó-alvo da fusão.\" on the target field"
  - rule: "rules/curation-workspace/correction-dates-have-the-iso-shape"
    answer: "the message \"Data inválida. Use o formato AAAA-MM-DD.\" on the date field"
  - rule: "rules/curation-workspace/correction-start-precedes-the-end"
    answer: "the message \"O início deve ser anterior ao fim.\" on the end field"
  - rule: "rules/curation-workspace/stated-basis-needs-a-fragment"
    answer: "the message \"Selecione o fragmento que justifica a data.\" on the fragment field and Salvar correção disabled"
  - rule: "rules/curation-workspace/correction-reason-is-required-and-trimmed"
    answer: "the message \"Informe um motivo para continuar.\" on the reason field"
  - rule: "rules/curation-workspace/picker-falls-back-to-a-manual-fragment-id"
    answer: "the manual fragment-id input with \"Listagem de fragmentos indisponível — informe o id manualmente.\""
  - when: "The server answers BUSINESS_CORRECTION_NO_CHANGES."
    answer: "the fixed message \"Nenhuma alteração detectada. Modifique pelo menos um campo.\" at the top of the form"
  - when: "The server answers BUSINESS_TEMPORAL_INCOHERENT."
    answer: "the server's message on the end-date field"
  - when: "The server answers BUSINESS_DATE_UNJUSTIFIED."
    answer: "the server's message set on the date-basis field, which no element shows"
  - when: "The server answers BUSINESS_FRAGMENT_NOT_ACCEPTED."
    answer: "the server's message under the fragment picker or the manual input, visible only under stated"
  - when: "The server answers BUSINESS_REASON_REQUIRED."
    answer: "the server's message on the reason field"
- operation: show-evidence
  accepted: "each fragment as \"Fragmento · confiança N%\" with its text and, under it, each chunk with its source type label (Documento, E-mail, Reunião, Conversa, Artigo or Transcrição), the received date and \"trecho <start>–<end>\""
  refusals:
  - when: "The provenance is loading."
    answer: "a placeholder labelled \"Carregando evidência\""
  - when: "The source was removed by compliance deletion."
    answer: "\"A fonte original foi excluída por conformidade. Sem proveniência disponível.\" and no viewed signal"
  - when: "The provenance fails to load for any other reason."
    answer: "\"Não foi possível carregar a evidência.\" and no viewed signal"
  - when: "The provenance loads with no fragments."
    answer: "\"Nenhuma proveniência disponível.\""
- operation: use-batch-bar
  accepted: "the count \"N selecionados\" with the actions \"Manter separados N\" for entity matches and \"Confirmar N\" and \"Rejeitar N\" for uncertain items"
  refusals:
  - rule: "rules/curation-workspace/batch-bar-actions-follow-the-kind"
    answer: "for disputed items no action and the note \"Disputas devem ser resolvidas individualmente.\""
  - rule: "rules/curation-workspace/rejecting-five-or-more-asks-first"
    answer: "for five or more items the inline \"Você está rejeitando N itens. Confirmar?\" with Confirmar and Cancelar"
- operation: open-drawer
  accepted: "an overlay titled \"Curadoria\" holding the decision panel for one item"
  refusals:
  - when: "The queue is loading."
    answer: "\"Carregando item de curadoria…\""
  - when: "The queue read fails."
    answer: "the inline alert \"Não foi possível carregar a evidência.\" with the link \"Abrir na fila de curadoria\""
  - when: "The item is not in the queue listing."
    answer: "the inline alert \"Este item não está mais disponível na fila.\" with the link \"Abrir na fila de curadoria\""
---

## Description

What the owner reads and can do on the curation screen.
The queue column lists the entries and the decision column holds the panel for the selected one.

=== contracts/curation-workspace/curation-screen.log
---
entries:
- field: answers
  unstated: The material does not say which boundary holds the notices, banners and toasts the owner reads on the curation screen.
  decided: The curation screen is a published api whose caller is the owner, and every notice that tells the owner what happened or was refused is an answer of it.
  why: A notice changes what the owner learns, while a control label, a heading or a placeholder keeps the control doing what it did.
---

=== contracts/graph-explorer/bff-graph-view
---
type: api
direction: consumed
upstream: contracts/chat/conversations
operations:
- read-graph-view
- save-graph-view
answers:
- operation: read-graph-view
  accepted: "GET /api/v1/conversations/{id}/graph with the id URL-encoded, answered with a saved view or null"
  refusals:
  - when: "The request fails."
    answer: "nothing shown to the owner and the pane left as it was"
- operation: save-graph-view
  accepted: "PUT /api/v1/conversations/{id}/graph with a JSON body holding the version, nodes, links, positions, pinned nodes and layout algorithm"
  refusals:
  - when: "The request fails."
    answer: "nothing shown to the owner and no retry"
---

## Description

The saved graph view the pane reads when a conversation opens and writes when the graph changes.

=== contracts/graph-explorer/bff-node-reads
---
type: api
direction: consumed
upstream: contracts/knowledge-base/retrieval
operations:
- read-node
- traverse
- read-link-provenance
- read-attribute-provenance
answers:
- operation: read-node
  accepted: "GET /api/v1/nodes/{id} with the id URL-encoded, read through the { ok, result } envelope as node, aliases and attributes"
  refusals:
  - when: "The request fails."
    answer: "the failure the request helper raises, with its code, unchanged"
- operation: traverse
  accepted: "GET /api/v1/nodes/{id}/traverse?depth=1&direction=both read as starting_node_id, nodes and links, each link with its inverse name, effective status and confidence"
  refusals:
  - when: "The request fails."
    answer: "the failure the request helper raises, with its code, unchanged"
- operation: read-link-provenance
  accepted: "GET /api/v1/provenance/links/{id} with the id URL-encoded, read as fragments with their chunks and raw information"
  refusals:
  - when: "The request fails."
    answer: "the failure the request helper raises, with its code, unchanged"
- operation: read-attribute-provenance
  accepted: "GET /api/v1/provenance/attributes/{id} with the id URL-encoded, read as fragments with their chunks and raw information"
  refusals:
  - when: "The request fails."
    answer: "the failure the request helper raises, with its code, unchanged"
---

## Description

The node, relationship and origin reads the node detail panel makes against the knowledge base.

=== contracts/graph-explorer/graph-screen
---
type: api
direction: published
operations:
- show-graph
- show-node-detail
- show-relationships
- show-origin
answers:
- operation: show-graph
  accepted: "the region named \"Grafo de conhecimento\" holding the canvas with the nodes revealed so far, the layout picker named \"Algoritmo de layout do grafo\" and the reorganize control named \"Reorganizar o layout do grafo\""
  refusals:
  - rule: "rules/graph-explorer/empty-status-without-nodes-shows-only-the-empty-state"
    answer: "\"A memória aparecerá aqui conforme você conversa.\" with no canvas"
  - when: "The graph is being fetched."
    answer: "the overlay \"Carregando grafo\" reading \"Buscando na memória…\" over the canvas"
  - when: "The graph failed and the pane has an error message."
    answer: "the overlay \"Erro do grafo\" over the canvas reading that message, with no action"
  - when: "The graph failed and the pane has no error message."
    answer: "the overlay \"Erro do grafo\" over the canvas reading \"Não foi possível carregar o grafo agora.\", with no action"
- operation: show-node-detail
  accepted: "the complementary region \"Detalhes do nó: <label>\" with the close button \"Fechar detalhes do nó\", the node's name, type and state badge, its aliases and its attributes, and the action \"Curar\" where the node needs curation"
  refusals:
  - when: "The node detail is loading."
    answer: "the text \"Carregando detalhes…\" with a spinner"
  - rule: "rules/graph-explorer/a-node-failure-is-classified-by-its-code"
    answer: "an alert reading \"Nó não encontrado.\" for RESOURCE_NOT_FOUND, \"Este nó foi removido por conformidade.\" for BUSINESS_NODE_DELETED and \"Não foi possível carregar os detalhes. Tente novamente.\" with the action \"Tentar novamente\" for any other failure"
  - when: "The node has no aliases."
    answer: "\"Nenhum alias adicional.\""
  - when: "The node has no attributes."
    answer: "\"Nenhum atributo registrado.\""
- operation: show-relationships
  accepted: "the section named \"Relações\" with one row per link showing its direction arrow, link type, neighbour, confidence and status badge"
  refusals:
  - when: "The relationships are loading."
    answer: "\"Carregando relações…\""
  - when: "The node has no links."
    answer: "\"Nenhuma relação encontrada.\""
  - rule: "rules/graph-explorer/a-failed-relationships-read-always-offers-a-retry"
    answer: "an alert \"Não foi possível carregar as relações.\" with the action \"Tentar novamente\""
- operation: show-origin
  accepted: "the fragments with their confidence, status and text, each chunk with its index, offsets, excerpt and source, and the original text of the operator in a disclosure"
  refusals:
  - when: "The origin is loading."
    answer: "\"Carregando origem…\""
  - when: "The origin read finds no fragments or the item is not found."
    answer: "\"Origem não encontrada.\" with the action \"Tentar novamente\" when it was a failure"
  - when: "The origin read fails with BUSINESS_RAW_INFORMATION_DELETED."
    answer: "an alert \"Documento original removido por conformidade.\" with no retry"
  - when: "The origin read fails with any other code."
    answer: "an alert \"Não foi possível carregar a origem.\" with the action \"Tentar novamente\""
  - rule: "rules/graph-explorer/a-redacted-original-input-is-never-shown"
    answer: "\"Texto original redigido.\" in place of the original text"
---

## Description

What the owner reads and can do in the graph pane and in a node's detail.
The chat screen that hosts the pane belongs to the chat workspace.

=== contracts/graph-explorer/graph-screen.log
---
entries:
- field: answers
  unstated: Which interface texts the owner learns from, and which are only control labels.
  decided: Failure, empty, loading and outcome texts and the accessible names of regions and controls are held; headings and column labels are not
  why: policy P1 of the frontend adoption runbook keeps text that changes what the owner learns or does and leaves control labels as surface
---

=== contracts/ingest-workspace/bff-ingestion
---
type: api
direction: consumed
upstream: contracts/knowledge-base/ingestion
operations:
- send-ingestion-request
- ingest-raw-information
- run-extraction
- retry-llm-run
- read-llm-run
answers:
- operation: send-ingestion-request
  accepted: "the 2xx JSON body of the answer is the answer itself and is never unwrapped from { ok, result }, and a 204 answer gives no value"
  refusals:
  - rule: "rules/ingest-workspace/ingestion-request-times-out-after-thirty-seconds"
    answer: "a failure SYSTEM_TIMEOUT reading \"Tempo limite excedido na requisição.\""
  - when: "The request is aborted by a signal of its caller."
    answer: "a failure SYSTEM_ABORTED reading \"Requisição cancelada.\""
  - when: "The request gets no answer for any other cause."
    answer: "a failure SYSTEM_NETWORK reading \"Falha de rede ao contactar o servidor.\""
  - rule: "rules/ingest-workspace/unrefreshable-session-ends-at-sign-in"
    answer: "HTTP 401 with the failure AUTH_SESSION_EXPIRED reading \"Sua sessão expirou. Faça login novamente.\""
  - when: "The answer is 2xx and its body is not JSON."
    answer: "that status with the failure SYSTEM_INVALID_RESPONSE reading \"Resposta do servidor não é JSON válido.\""
  - when: "The answer is not 2xx and its body carries an error object with a string code."
    answer: "that status with the code, the details and, when it is a string, the message of the error object, otherwise a message for the status"
  - when: "The answer has status 500 or above and its body carries no readable error code."
    answer: "that status with the failure SYSTEM_UPSTREAM reading \"Algo deu errado. Tente novamente.\""
  - when: "The answer is not 2xx, is below status 500 and its body carries no readable error code."
    answer: "that status with the failure SYSTEM_UNKNOWN reading \"Erro desconhecido do servidor.\""
- operation: ingest-raw-information
  accepted: "POST /api/v1/ingest/raw-information with the JSON body of source_type, content, model, prompt_version and an optional metadata sent as given and checked by nothing in the client, whose answer is read as outcome, raw_information_id, content_hash, chunk_count, chunks, llm_run_id, idempotency_key and an optional list of affected nodes, each with id, node_type and canonical_name"
- operation: run-extraction
  accepted: "POST /api/v1/ingest/llm-runs/{llm_run_id}/run with the JSON body {}, whose answer is read as an LLM run"
- operation: retry-llm-run
  accepted: "POST /api/v1/ingest/llm-runs/{llm_run_id}/retry with the JSON body { reason } when a reason is given and {} otherwise, with no bound on the reason, whose answer is read as an LLM run and starts no extraction"
- operation: read-llm-run
  accepted: "GET /api/v1/ingest/llm-runs/{llm_run_id}, whose answer is read as an LLM run with its identity, model, prompt version, status, started_at, finished_at, attempts, raw information identity, idempotency key, run summary of nine counts and an optional list of affected nodes, the status passed on as received"
  refusals:
  - when: The started_at or a non-null finished_at of the answer cannot be parsed as a date.
    answer: 'a failure with no code reading "Invalid ISO date string: <value>"'
---

## Description

The requests the ingest screen makes to the back end and how it reads the answers.
The upstream publishes what each answer carries, and this contract states only how the screen sends and reads it.

=== contracts/ingest-workspace/bff-ingestion.log
---
entries:
- field: answers
  unstated: The material does not say how much of the back end's answers the screen's own contract restates, since the ingestion contract already publishes them.
  decided: The consumed contract states only how the screen sends each request and reads each answer, and the failures the client itself reports, never the fields the upstream publishes.
  why: A field stated in both contracts is held twice with nothing to keep the two in agreement.
---

=== contracts/ingest-workspace/bff-traversal
---
type: api
direction: consumed
upstream: contracts/knowledge-base/retrieval
operations:
- traverse-node
answers:
- operation: traverse-node
  accepted: "GET /api/v1/nodes/{id}/traverse?depth=1&direction=both read through the { ok, result } envelope, whose result is read as starting_node_id, nodes each with id, node_type, canonical_name and status, and links each with id, source_node_id, target_node_id, link_type, link_type_label, is_temporal, is_in_effect, status and flags"
  refusals:
  - rule: "rules/ingest-workspace/failed-traversal-leaves-the-graph-as-it-was"
    answer: "the graph is left as it was and the assembly reports an error"
---

## Description

The traversal request the ingest screen makes for each affected node to assemble the graph of an ingestion.

=== contracts/ingest-workspace/ingest-screen
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

=== contracts/ingest-workspace/ingest-screen.log
---
entries:
- field: answers
  unstated: The material does not say which boundary holds the notices and messages of the ingest screen.
  decided: The ingest screen is a published api whose caller is the owner, and every notice or message that tells the owner what happened or was refused is an answer of it.
  why: A notice changes what the owner learns, while a control label, a heading or a placeholder keeps the control doing what it did.
---

=== contracts/knowledge-base/access
---
type: api
direction: published
operations:
- authenticate-owner
- route-request
- read-health
answers:
- operation: authenticate-owner
  accepted: the request proceeds as the owner, identified by the token's `sub` claim, or as `local-operator` for the local operator token
  refusals:
  - when: The Authorization header is absent or not `Bearer <token>`.
    answer: HTTP 401, error code AUTH_UNAUTHORIZED with message "Missing or malformed Authorization header (expected `Bearer <jwt>`)." and no details
  - when: The token has expired.
    answer: HTTP 401, error code AUTH_TOKEN_EXPIRED with message "Authentication token expired." and no details
  - when: 'The token fails verification: a bad signature, a malformed token, a failed claim, a disallowed algorithm, no matching key or a key set that cannot be fetched.'
    answer: HTTP 401, error code AUTH_TOKEN_INVALID with message "Invalid authentication token." and no details
  - when: The verified token names no owner in its `sub` claim.
    answer: HTTP 401, error code AUTH_TOKEN_INVALID with message "JWT missing required `sub` claim." and no details
- operation: route-request
  accepted: the request reaches the operation it names, whose own contract answers it
  refusals:
  - when: No operation is served at the method and path.
    answer: HTTP 404, error code RESOURCE_NOT_FOUND with the framework's message
  - when: The request fails the validation of the operation it names.
    answer: HTTP 422, error code VALIDATION_INVALID_FORMAT with message "Request payload failed validation." and `details` a bare list of `{ path, message }`, each path joined by "."
  - when: A route schema of the framework rejects the request.
    answer: HTTP 422, error code VALIDATION_INVALID_FORMAT with the framework's message and `details` the framework's own list of validation failures
  - when: The framework refuses the request with status 422.
    answer: HTTP 422, error code VALIDATION_INVALID_FORMAT with the framework's message
  - when: The framework refuses the request with status 401, 403 or 409.
    answer: that status, with error code AUTH_UNAUTHORIZED, AUTH_FORBIDDEN or RESOURCE_CONFLICT respectively and the framework's message
  - when: The framework refuses the request with a status below 500 other than 401, 403, 409 and 422.
    answer: that status, with error code SYSTEM_INTERNAL_ERROR and the framework's message
  - when: The framework fails the request with status 503.
    answer: HTTP 503, error code SYSTEM_SERVICE_UNAVAILABLE with message "Internal server error."
  - when: The framework fails the request with another status of 500 or above.
    answer: that status, with error code SYSTEM_INTERNAL_ERROR and message "Internal server error."
  - when: The store is unreachable or a statement times out.
    answer: HTTP 503, error code SYSTEM_SERVICE_UNAVAILABLE with message "A backing service is temporarily unavailable."
  - when: The request fails for any other cause.
    answer: HTTP 500, error code SYSTEM_INTERNAL_ERROR with message "Internal server error.", withholding the cause
- operation: read-health
  accepted: the health report `{ ok, service, database, checked_at }` with `service` "remember-bff", `database` "ok" or "unreachable", `ok` true exactly when the store answered, and `checked_at` an ISO-8601 UTC time; the same report over REST, with HTTP 200 when `ok` is true and HTTP 503 when it is false, and as the `health` tool
---

## Description

The answers every request can receive before or apart from the operation it names: the owner's authentication, the routing and validation of a request, and the health probe.
Every other contract's answers apply once a request has passed through these.

=== contracts/knowledge-base/access.log
---
entries:
- field: operations
  unstated: The material gives the authentication refusals, the framework's routing and validation answers and the health probe without saying which contract holds these answers, since they come before or apart from any operation.
  decided: One published api, knowledge-base access, with authenticate-owner, route-request and read-health.
  why: They are what a caller of every operation reads, and they belong to no single operation's contract.
- field: answers
  unstated: The material answers SYSTEM_SERVICE_UNAVAILABLE with "A backing service is temporarily unavailable." for an unreachable store and with "Internal server error." for a framework 503.
  decided: Every SYSTEM_SERVICE_UNAVAILABLE answers "A backing service is temporarily unavailable."
  why: One code carries one message, and a 503 is never an internal failure.
- field: answers
  unstated: The material answers a failed validation with `details` a list of `{ path, message }` and a fixed message for one validator, and with the framework's raw validation array and its own message for the other.
  decided: Every validation failure answers "Request payload failed validation." with `details` a bare list of `{ path, message }`.
  why: The operations' contracts already promise that shape, and a caller cannot tell which validator ran.
- field: answers
  unstated: The material answers a failure to fetch the auth provider's key set as an invalid token, while an unreachable store answers that a backing service is unavailable.
  decided: A key set that cannot be fetched answers HTTP 503 SYSTEM_SERVICE_UNAVAILABLE.
  why: The owner's token was not found invalid, and reporting it so hides an outage behind a refusal.
- field: answers
  unstated: The material answers a framework refusal with a status below 500 other than 401, 403, 404, 409 and 422 with that status and SYSTEM_INTERNAL_ERROR, which the code registry otherwise maps to 500.
  decided: Such a refusal keeps its status, with SYSTEM_INTERNAL_ERROR and the framework's message.
  why: The status tells the caller the request was theirs to fix, and no domain code names those framework refusals.
- field: answers
  unstated: A judgment shows a key set that cannot be fetched answered as an invalid token, and a framework 503 carrying the message Internal server error.
  decided: A key set that cannot be fetched answers AUTH_TOKEN_INVALID, and a framework 503 answers that message.
  why: The owner decided the source's behavior is the truth, and it answers those two that way.
- field: answers
  unstated: The contract answered every validation failure with a bare list and gave no health status or framework 422.
  decided: It adds the framework schema refusal, the framework 422 and the health 200 and 503.
  why: The error handler forwards the framework's message and list, maps 422 to VALIDATION_INVALID_FORMAT and the route sends 503 when not ok.
---

=== contracts/knowledge-base/compliance-audit
---
type: api
direction: published
operations:
- compliance-delete
- list-compliance-deletions
- read-compliance-deletion
- list-curation-actions
- read-curation-action
answers:
- operation: compliance-delete
  accepted: 'HTTP 201 carrying outcome deleted and the compliance deletion just recorded, or HTTP 200 carrying outcome noop_already_deleted and the latest compliance deletion on record for the raw information, each deletion with its identity, raw information, reason, execution time as an ISO-8601 timestamp and its chunk, fragment, link and attribute counts, ignoring any field the request does not define; over MCP, as the `compliance_delete` tool of the curation toolset, `{ ok: true, result }` carrying the same outcome and deletion'
  refusals:
  - when: The request omits the raw information or the reason.
    answer: 'error code VALIDATION_REQUIRED_FIELD with message "Field ''<path>'' is required.", carrying `details` `{ issues }` listing each failing field with its path and message, HTTP 422 over REST'
  - rule: rules/knowledge-base/compliance-deletion-reason-length
    answer: 'error code VALIDATION_OUT_OF_RANGE with message "Field ''reason'' must be non-empty after trim and ≤ 1000 characters.", carrying `details` `{ issues }` listing each failing field with its path and message, HTTP 422 over REST'
  - when: The named raw information is not a well-formed identifier, or a field is null or of the wrong type.
    answer: 'error code VALIDATION_INVALID_FORMAT with message "Request payload failed validation.", carrying `details` `{ issues }` listing each failing field with its path and message, HTTP 422 over REST'
  - when: No raw information is held at the requested identity.
    answer: 'error code RESOURCE_NOT_FOUND with message "RawInformation <id> not found.", naming the entity raw_information and the identity, HTTP 404 over REST'
  - when: The raw information is already deleted and no compliance deletion of it is on record.
    answer: 'error code SYSTEM_INTERNAL_ERROR with message "Unexpected internal error.", naming the raw information, HTTP 500 over REST'
  - when: Marking the raw information deleted reaches other than exactly that one raw information.
    answer: 'error code SYSTEM_INTERNAL_ERROR with message "Unexpected internal error.", naming the raw information and how many were reached, HTTP 500 over REST'
  - when: The deletion fails over MCP for any other cause.
    answer: error code SYSTEM_INTERNAL_ERROR with message "Unexpected internal error.", withholding the cause
- operation: list-compliance-deletions
  accepted: HTTP 200 carrying the total, the limit, the offset and the page of compliance deletions, each with its identity, raw information, reason, execution time as an ISO-8601 timestamp and its chunk, fragment, link and attribute counts, ignoring any query parameter the request does not define
  refusals:
  - &window
    rule: rules/knowledge-base/audit-window-ordered
    answer: 'HTTP 422, error code VALIDATION_OUT_OF_RANGE with message "Time range bounds must satisfy `from < to`.", carrying `details` `{ issues }` listing each failing field with its path and message'
  - &limit
    rule: rules/knowledge-base/page-limit-bounds
    answer: 'HTTP 422, error code VALIDATION_INVALID_FORMAT with message "Request payload failed validation.", carrying `details` `{ issues }` listing each failing field with its path and message'
  - &offset
    rule: rules/knowledge-base/page-offset-non-negative
    answer: 'HTTP 422, error code VALIDATION_INVALID_FORMAT with message "Request payload failed validation.", carrying `details` `{ issues }` listing each failing field with its path and message'
  - when: The named raw information is not a well-formed identifier, a window bound is not a date-time carrying a time zone, or the limit or offset is not an integer.
    answer: 'HTTP 422, error code VALIDATION_INVALID_FORMAT with message "Request payload failed validation.", carrying `details` `{ issues }` listing each failing field with its path and message'
- operation: read-compliance-deletion
  accepted: HTTP 200 carrying the compliance deletion with its identity, raw information, reason, execution time as an ISO-8601 timestamp and its chunk, fragment, link and attribute counts
  refusals:
  - &malformed-id
    when: The requested identity is not a well-formed identifier.
    answer: 'HTTP 422, error code VALIDATION_INVALID_FORMAT with message "Request payload failed validation.", carrying `details` `{ issues }` listing each failing field with its path and message'
  - when: No compliance deletion is held at the requested identity.
    answer: 'HTTP 404, error code RESOURCE_NOT_FOUND with message "ComplianceDeletion <id> not found.", naming the entity compliance_deletion and the identity'
- operation: list-curation-actions
  accepted: HTTP 200 carrying the total, the limit, the offset and the page of curation actions, each with its identity, action, target kind, target identity or null, payload, an empty object where none is held, reason or null and creation time as an ISO-8601 timestamp, ignoring any query parameter the request does not define
  refusals:
  - *window
  - *limit
  - *offset
  - when: The named target is not a well-formed identifier, a window bound is not a date-time carrying a time zone, the limit or offset is not an integer, or the action or target kind is outside its closed set.
    answer: 'HTTP 422, error code VALIDATION_INVALID_FORMAT with message "Request payload failed validation.", carrying `details` `{ issues }` listing each failing field with its path and message'
- operation: read-curation-action
  accepted: HTTP 200 carrying the curation action with its identity, action, target kind, target identity or null, payload, an empty object where none is held, reason or null and creation time as an ISO-8601 timestamp
  refusals:
  - *malformed-id
  - when: No curation action is held at the requested identity.
    answer: 'HTTP 404, error code RESOURCE_NOT_FOUND with message "CurationAction <id> not found.", naming the entity curation_action and the identity'
---

## Description

The owner's surface for deleting a raw information for compliance and for reading the compliance deletions and curation actions on record.

=== contracts/knowledge-base/compliance-audit.log
---
entries:
- field: answers
  unstated: The contract did not say how a validation failure lists its fields or the MCP tool name.
  decided: Validation answers carry details { issues }, and the MCP operation is the compliance_delete tool of the curation toolset.
  why: The REST handler and the MCP tool both wrap the list under issues, and the tool registers in the curation toolset.
---

=== contracts/knowledge-base/curation
---
type: api
direction: published
operations:
- list-review-queue
- read-curation-metrics
- resolve-entity-match
- merge-nodes
- resolve-dispute
- confirm-item
- reject-item
- correct-item
answers:
- operation: list-review-queue
  accepted: 'HTTP 200 carrying, with no envelope, `total`, the `limit` and `offset` as requested, and `items`: entity-match entries `{ kind: "entity_match", node_id, node_type, canonical_name, candidates, created_at }`, each candidate `{ candidate_node_id, canonical_name, similarity }` with similarity a number, and dispute entries `{ kind: "disputed", item_kind, scope, sides, created_at }`, the scope `{ source_node_id, target_node_id, link_type, node_id, attribute_key }` with the link type by name, the fields its kind does not use null and the target null for a link type that does not allow multiple current links, and each side `{ item_id, value, target_node_id, valid_from, valid_to, valid_from_source, confidence, status }` with a link''s value and an attribute''s target null, dates as `YYYY-MM-DD` and confidence a number; over MCP, `{ ok: true, result }` carrying the same'
  refusals:
  - rule: rules/knowledge-base/page-limit-bounds
    answer: &query-format 'error code VALIDATION_INVALID_FORMAT with message "Request payload failed validation.", HTTP 422 over REST with `details` a bare list of `{ path, message }`, and over MCP with `details: { issues: [{ path, message }] }`'
  - rule: rules/knowledge-base/page-offset-non-negative
    answer: *query-format
  - when: The kind is outside the review-queue kinds, or the limit or offset is not an integer.
    answer: *query-format
  - &unavailable
    when: The store is unreachable or a statement times out.
    answer: 'error code SYSTEM_SERVICE_UNAVAILABLE with message "A backing service is temporarily unavailable.", HTTP 503 over REST'
  - &internal
    when: The operation fails for any other cause.
    answer: 'error code SYSTEM_INTERNAL_ERROR with message "Internal server error.", withholding the cause, HTTP 500 over REST'
- operation: read-curation-metrics
  accepted: 'HTTP 200 carrying, with no envelope, `accept_rate`, `reject_rate_by_code` as an object from error code to rate, `{}` when there is none, `needs_review_count`, `uncertain_count`, `disputed_count`, `entity_match_queue_count`, `disputed_queue_count` and `computed_at`, the ISO-8601 moment the metrics were computed, taken after they were read'
  refusals:
  - when: The metrics cannot be read for a cause that would otherwise answer an unavailable store or an internal failure.
    answer: 'HTTP 503, error code SYSTEM_SERVICE_UNAVAILABLE with message "A backing service is temporarily unavailable."'
- operation: resolve-entity-match
  accepted: 'HTTP 200 carrying, with no envelope, `{ node_id, decision, resulting_status, target_node_id, affected, action_id }`: for keep_separate, resulting status active with target and affected null; for merge_into, resulting status merged, the target node, and `affected` as `{ links_repointed, attributes_repointed, aliases_copied, path_compressed_nodes }`; over MCP, where the node identity travels as `node_id` beside the body, `{ ok: true, result }` carrying the same'
  refusals:
  - when: The node identity in the REST path is not a well-formed identifier.
    answer: 'HTTP 422, error code VALIDATION_INVALID_FORMAT with message "Request payload failed validation." and `details` a bare list of `{ path, message }`, answered before the body is checked'
  - rule: rules/knowledge-base/merge-into-requires-target
    answer: 'error code BUSINESS_TARGET_NODE_REQUIRED with message "decision=merge_into requires target_node_id" and `details: { issues: [{ path, message }] }`, HTTP 422 over REST'
  - rule: rules/knowledge-base/curation-reason-required
    answer: &reason-required 'error code BUSINESS_REASON_REQUIRED with message "reason is required for the requested operation" and `details: { issues }`, HTTP 422 over REST'
  - rule: rules/knowledge-base/curation-reason-not-blank
    answer: 'error code BUSINESS_REASON_REQUIRED where the decision is merge_into and VALIDATION_INVALID_FORMAT otherwise, with `details: { issues }`, HTTP 422 over REST'
  - rule: rules/knowledge-base/curation-action-reason-length
    answer: &format 'error code VALIDATION_INVALID_FORMAT with message "Request payload failed validation." and `details: { issues: [{ path, message }] }`, each path joined by ".", HTTP 422 over REST'
  - rule: rules/knowledge-base/node-never-merged-into-itself
    answer: 'error code BUSINESS_SELF_MERGE_FORBIDDEN naming the node, HTTP 409 over REST'
  - &body-format
    when: A field is missing, null where it may not be, of the wrong type, outside its closed set, or not a well-formed identifier or `YYYY-MM-DD` date.
    answer: *format
  - when: No knowledge node is held at the node's identity or, for merge_into, at the target's.
    answer: 'error code RESOURCE_NOT_FOUND naming the absent node as `node_id` for keep_separate and as `missing_id` for merge_into, the target checked first, HTTP 404 over REST'
  - rule: rules/knowledge-base/curation-refuses-deleted-node
    answer: &deleted 'error code BUSINESS_NODE_DELETED naming the deleted node, the survivor checked first, HTTP 410 over REST'
  - rule: rules/knowledge-base/entity-match-resolution-requires-pending-review
    answer: 'error code BUSINESS_REVIEW_NOT_PENDING naming the node and its current status, HTTP 409 over REST'
  - rule: rules/knowledge-base/merge-survivor-active
    answer: &survivor 'error code BUSINESS_INVALID_TARGET_NODE naming the survivor and its current status, HTTP 422 over REST'
  - rule: rules/knowledge-base/merge-requires-same-node-type
    answer: &same-type 'error code BUSINESS_INVALID_TARGET_NODE with `details.reason` "node_type mismatch", HTTP 422 over REST'
  - when: Another operation changed the node's status first.
    answer: 'error code BUSINESS_REVIEW_NOT_PENDING for keep_separate and BUSINESS_INVALID_TARGET_NODE for merge_into, naming the node, HTTP 409 over REST'
  - &duplicate
    when: A uniqueness guard of the store refuses the write.
    answer: 'error code BUSINESS_TEMPORAL_INCOHERENT with message "A duplicate-guard index rejected the resolution; another row currently occupies this scope." and no details, HTTP 422 over REST'
  - *unavailable
  - *internal
- operation: merge-nodes
  accepted: 'HTTP 200 carrying, with no envelope, `{ survivor_id, absorbed_id, affected, action_id }`, `affected` as `{ links_repointed, attributes_repointed, aliases_copied, path_compressed_nodes }`; over MCP, `{ ok: true, result }` carrying the same'
  refusals:
  - rule: rules/knowledge-base/node-never-merged-into-itself
    answer: 'error code BUSINESS_SELF_MERGE_FORBIDDEN with message "survivor_id equals absorbed_id" and `details: { issues }` at path `absorbed_id`, HTTP 409 over REST'
  - rule: rules/knowledge-base/curation-reason-required
    answer: *format
  - rule: rules/knowledge-base/curation-reason-not-blank
    answer: *format
  - rule: rules/knowledge-base/curation-action-reason-length
    answer: *format
  - *body-format
  - &absent-node
    when: No knowledge node is held at the survivor's or the absorbed node's identity.
    answer: 'error code RESOURCE_NOT_FOUND naming the absent node as `missing_id`, the survivor checked first, HTTP 404 over REST'
  - rule: rules/knowledge-base/curation-refuses-deleted-node
    answer: *deleted
  - rule: rules/knowledge-base/merge-survivor-active
    answer: *survivor
  - rule: rules/knowledge-base/node-merge-absorbs-active-node
    answer: 'error code BUSINESS_INVALID_TARGET_NODE naming the absorbed node and its status, HTTP 422 over REST'
  - rule: rules/knowledge-base/merge-requires-same-node-type
    answer: *same-type
  - when: Another operation changed the absorbed node's status first.
    answer: 'error code BUSINESS_INVALID_TARGET_NODE naming the absorbed node, HTTP 409 over REST'
  - *duplicate
  - *unavailable
  - *internal
- operation: resolve-dispute
  accepted: 'HTTP 200 carrying, with no envelope, `{ item_kind, decision, items, action_id }`, each item `{ item_id, resulting_status, valid_from, valid_to }`, in the order of the periods for adjust_periods; over MCP, `{ ok: true, result }` carrying the same'
  refusals:
  - rule: rules/knowledge-base/dispute-resolution-distinct-items
    answer: *format
  - rule: rules/knowledge-base/curation-reason-required
    answer: *reason-required
  - rule: rules/knowledge-base/curation-reason-not-blank
    answer: 'error code BUSINESS_REASON_REQUIRED where the decision is prefer_one and VALIDATION_INVALID_FORMAT otherwise, with `details: { issues }`, HTTP 422 over REST'
  - rule: rules/knowledge-base/curation-action-reason-length
    answer: *format
  - rule: rules/knowledge-base/prefer-one-requires-winner
    answer: 'error code BUSINESS_DISPUTE_WINNER_REQUIRED with message "decision=prefer_one requires winner_id (member of item_ids)", HTTP 422 over REST'
  - rule: rules/knowledge-base/adjust-periods-one-per-item
    answer: 'error code BUSINESS_DISPUTE_PERIODS_REQUIRED with message "decision=adjust_periods requires periods[] (one entry per item_id)", HTTP 422 over REST'
  - rule: rules/knowledge-base/validity-start-before-end
    answer: 'error code BUSINESS_TEMPORAL_INCOHERENT with message "Adjusted periods violate `valid_from < valid_to` or overlap on a functional scope", HTTP 422 over REST'
  - rule: rules/knowledge-base/adjusted-periods-single-open
    answer: 'error code BUSINESS_TEMPORAL_INCOHERENT naming how many periods are left open, HTTP 422 over REST'
  - *body-format
  - when: No item of the named kind is held at one of the listed identities.
    answer: 'error code RESOURCE_NOT_FOUND naming the first absent identity in the order listed and the item kind, HTTP 404 over REST'
  - rule: rules/knowledge-base/dispute-resolution-requires-disputed-items
    answer: 'error code BUSINESS_ITEM_NOT_DISPUTED naming the offending item and its current status, HTTP 409 over REST'
  - rule: rules/knowledge-base/dispute-resolution-single-scope
    answer: 'error code BUSINESS_ITEM_NOT_DISPUTED with `details.scope_mismatch` true, HTTP 409 over REST'
  - when: Another operation moved one of the items out of disputed first.
    answer: 'error code BUSINESS_ITEM_NOT_DISPUTED naming the offending item, or how many items were reached and how many were expected, HTTP 409 over REST'
  - *duplicate
  - *unavailable
  - *internal
- operation: confirm-item
  accepted: 'HTTP 200 carrying, with no envelope, `{ item_kind, item_id, resulting_status: "active", action_id }`; over MCP, `{ ok: true, result }` carrying the same'
  refusals:
  - rule: rules/knowledge-base/curation-reason-not-blank
    answer: *format
  - rule: rules/knowledge-base/curation-action-reason-length
    answer: *format
  - *body-format
  - &absent-item
    when: No item of the named kind is held at the requested identity.
    answer: 'error code RESOURCE_NOT_FOUND naming the item and its kind, HTTP 404 over REST'
  - rule: rules/knowledge-base/confirmation-requires-uncertain
    answer: 'error code BUSINESS_ITEM_NOT_UNCERTAIN naming the item and its current status, HTTP 409 over REST'
  - when: Another operation changed the item's status first.
    answer: 'error code BUSINESS_ITEM_NOT_UNCERTAIN naming the item, HTTP 409 over REST'
  - *duplicate
  - *unavailable
  - *internal
- operation: reject-item
  accepted: 'HTTP 200 carrying, with no envelope, `{ item_kind, item_id, resulting_status: "deleted", action_id }`; over MCP, `{ ok: true, result }` carrying the same'
  refusals:
  - rule: rules/knowledge-base/curation-reason-required
    answer: *format
  - rule: rules/knowledge-base/curation-reason-not-blank
    answer: *format
  - rule: rules/knowledge-base/curation-action-reason-length
    answer: *format
  - *body-format
  - *absent-item
  - rule: rules/knowledge-base/rejection-and-correction-require-live-item
    answer: &not-deletable 'error code BUSINESS_ITEM_NOT_DELETABLE naming the item and its current status, HTTP 409 over REST'
  - &item-race
    when: Another operation changed the item's status first.
    answer: 'error code BUSINESS_ITEM_NOT_DELETABLE naming the item, HTTP 409 over REST'
  - *duplicate
  - *unavailable
  - *internal
- operation: correct-item
  accepted: 'HTTP 200 carrying, with no envelope, `{ item_kind, predecessor_id, new_item_id, action_id }`; over MCP, `{ ok: true, result }` carrying the same'
  refusals:
  - rule: rules/knowledge-base/curation-reason-required
    answer: *format
  - rule: rules/knowledge-base/curation-reason-not-blank
    answer: *format
  - rule: rules/knowledge-base/curation-action-reason-length
    answer: *format
  - rule: rules/knowledge-base/correction-changes-something
    answer: 'error code BUSINESS_CORRECTION_NO_CHANGES with message "corrected{} must change at least one of value, target_node_id, valid_from, valid_to", HTTP 422 over REST'
  - rule: rules/knowledge-base/correction-fits-assertion-kind
    answer: 'error code VALIDATION_INVALID_FORMAT with `details: { issues }` at path `corrected.value` or `corrected.target_node_id`, HTTP 422 over REST'
  - rule: rules/knowledge-base/stated-start-requires-basis
    answer: &unjustified 'error code BUSINESS_DATE_UNJUSTIFIED with message "valid_from change requires a justification (stated|document|received)", HTTP 422 over REST'
  - rule: rules/knowledge-base/corrected-stated-start-cites-fragment
    answer: *unjustified
  - rule: rules/knowledge-base/validity-start-before-end
    answer: 'error code BUSINESS_TEMPORAL_INCOHERENT, HTTP 422 over REST'
  - *body-format
  - *absent-item
  - rule: rules/knowledge-base/rejection-and-correction-require-live-item
    answer: *not-deletable
  - rule: rules/knowledge-base/correction-fragment-accepted
    answer: 'error code BUSINESS_DATE_UNJUSTIFIED naming the fragment, HTTP 422 over REST'
  - when: The attribute being corrected has no attribute key, or its key is not in the catalog.
    answer: 'error code BUSINESS_INVALID_ATTRIBUTE_VALUE naming the item or the key and the value, HTTP 422 over REST'
  - rule: rules/knowledge-base/attribute-value-parses
    answer: 'error code BUSINESS_INVALID_ATTRIBUTE_VALUE naming the value type and the value, HTTP 422 over REST'
  - rule: rules/knowledge-base/attribute-value-in-allowed-values
    answer: 'error code BUSINESS_INVALID_ATTRIBUTE_VALUE naming the attribute key, the value and the allowed values, an empty list where none is known, HTTP 422 over REST'
  - *item-race
  - *duplicate
  - *unavailable
  - *internal
---

## Description

The owner's curation surface: the review queues, the curation metrics, and the decisions that resolve entity matches, merge nodes, resolve disputes and confirm, reject or correct assertions.

=== contracts/knowledge-base/curation.log
---
entries:
- field: answers
  unstated: The standing rule limits every curation action's reason to 1000 characters, while the material's curation requests accept a reason of any length; the two decide differently for a rejection whose reason holds 1500 characters.
  decided: The rule stands for every curation action, and each curation decision refuses a longer reason with VALIDATION_INVALID_FORMAT, HTTP 422 over REST, as it refuses any other malformed field.
  why: The audit record carries one reason whichever operation wrote it, and a malformed field of these requests is answered that way.
---

=== contracts/knowledge-base/ingestion
---
type: api
direction: published
operations:
- ingest-raw-information
- read-raw-information
- list-raw-chunks
- read-llm-run
- list-tool-calls
- run-extraction
- retry-llm-run
- propose-fragment
- propose-node
- propose-link
- propose-attribute
- ingest-document
- ingest-directed
- list-recent-ingestions
answers:
- operation: ingest-raw-information
  accepted: HTTP 201 with outcome created, the raw information's identity and content hash, its chunk count and each chunk's identity, index and offsets, and the opened run's identity and idempotency key; HTTP 200 with outcome noop_existing, the held raw information's identity, content hash and chunk count, no chunks, and the run opened for that content under the model and prompt version the request names
  refusals:
  - rule: rules/knowledge-base/content-length
    answer: HTTP 422, error code VALIDATION_INVALID_FORMAT, listing each failing field with its path and message
  - rule: rules/knowledge-base/original-input-length
    answer: HTTP 422, error code VALIDATION_INVALID_FORMAT, listing each failing field with its path and message
  - when: The request names no source type of the closed set, or no model or prompt version.
    answer: HTTP 422, error code VALIDATION_INVALID_FORMAT, listing each failing field with its path and message
  - when: Held content is sent under a model or prompt version for which no LLM run was opened.
    answer: HTTP 500, error code SYSTEM_INTERNAL_ERROR
- operation: read-raw-information
  accepted: HTTP 200 carrying the raw information's identity, source type, content, storage reference, content hash, reception time and metadata
  refusals:
  - &id001
    when: A named identity is not a well-formed identifier.
    answer: HTTP 422, error code VALIDATION_INVALID_FORMAT, listing each failing field with its path and message
  - when: No raw information is held at the requested identity.
    answer: HTTP 404, error code RESOURCE_NOT_FOUND
- operation: list-raw-chunks
  accepted: HTTP 200 carrying the total and every chunk of the raw information, each with its identity, raw information, index, text, offsets, locator and chunking version
  refusals:
  - *id001
  - when: No raw information is held at the requested identity.
    answer: HTTP 404, error code RESOURCE_NOT_FOUND
- operation: read-llm-run
  accepted: '`{ ok: true, result }` carrying the run''s identity, model, prompt version, start and finish times, status, attempts, raw information, idempotency key and summary, its document context status and document context when it holds them, with its affected nodes, each with its identity, canonical name and node type, when it is completed and they can be derived'
  refusals:
  - &id003
    when: The named LLM run is not a well-formed identifier.
    answer: error code VALIDATION_INVALID_FORMAT listing each failing field with its path and message, HTTP 422 over REST
  - &id002
    when: No LLM run is held at the named identity.
    answer: error code RESOURCE_NOT_FOUND, HTTP 404 over REST
- operation: list-tool-calls
  accepted: HTTP 200 carrying the total, the limit, the offset and the page of tool calls, each with its identity, run, tool name, arguments, result, validation outcome and recording time
  refusals:
  - *id001
  - rule: rules/knowledge-base/page-limit-bounds
    answer: HTTP 422, error code VALIDATION_INVALID_FORMAT, listing each failing field with its path and message
  - rule: rules/knowledge-base/page-offset-non-negative
    answer: HTTP 422, error code VALIDATION_INVALID_FORMAT, listing each failing field with its path and message
  - *id002
- operation: run-extraction
  accepted: 'HTTP 200 carrying the completed run: the run''s identity, model, prompt version, start and finish times, status, attempts, raw information, idempotency key and summary, its document context status and document context when it holds them, with its affected nodes, each with its identity, canonical name and node type, when it is completed'
  refusals:
  - *id001
  - when: The request carries a body with any field.
    answer: HTTP 422, error code VALIDATION_INVALID_FORMAT, listing each failing field with its path and message
  - *id002
  - rule: rules/knowledge-base/extraction-requires-running-run
    answer: HTTP 409, error code BUSINESS_RUN_NOT_RUNNABLE naming the run's status
  - rule: rules/knowledge-base/extraction-fails-on-repeated-system-errors
    answer: error code SYSTEM_INTERNAL_ERROR carrying the failed run, HTTP 500 over REST
  - rule: rules/knowledge-base/prompt-version-known
    answer: error code SYSTEM_INTERNAL_ERROR carrying the failed run, HTTP 500 over REST
  - when: The language model provider fails while a chunk is read.
    answer: error code SYSTEM_LLM_PROVIDER_UNAVAILABLE carrying the failed run, HTTP 502 over REST
- operation: retry-llm-run
  accepted: HTTP 200 carrying the run, running again, with its summary
  refusals:
  - *id001
  - when: The request's reason exceeds 500 characters.
    answer: HTTP 422, error code VALIDATION_INVALID_FORMAT, listing each failing field with its path and message
  - *id002
  - rule: rules/knowledge-base/llm-run-lifecycle
    answer: HTTP 409, error code BUSINESS_RUN_NOT_RETRYABLE naming the run's status
- operation: propose-fragment
  accepted: '`{ ok: true, result }` carrying the fragment''s identity and status proposed'
  refusals:
  - *id003
  - &id004
    when: The proposal is missing a required field or holds one of the wrong shape.
    answer: 'error code VALIDATION_INVALID_FORMAT listing each failing field with its path and message, HTTP 422 over REST, and over MCP the message "MCP tool args failed Zod parse."'
  - *id002
  - &id005
    rule: rules/knowledge-base/proposal-requires-running-run
    answer: error code BUSINESS_RUN_NOT_RUNNING naming the run's status, HTTP 409 over REST
  - &id006
    rule: rules/knowledge-base/proposal-confidence-range
    answer: error code VALIDATION_INVALID_FORMAT listing each failing field with its path and message, HTTP 422 over REST
  - rule: rules/knowledge-base/fragment-text-length
    answer: error code VALIDATION_INVALID_FORMAT listing each failing field with its path and message, HTTP 422 over REST
  - rule: rules/knowledge-base/fragment-chunks-exist
    answer: 'error code RESOURCE_NOT_FOUND naming the chunks, HTTP 200 carrying `{ ok: false, error }` over REST'
  - rule: rules/knowledge-base/fragment-chunks-in-run-source
    answer: 'error code VALIDATION_INVALID_FORMAT naming the chunks and the expected raw information, HTTP 200 carrying `{ ok: false, error }` over REST'
  - &id015
    when: A proposal fails for a cause no other refusal names, other than an unreachable store.
    answer: 'error code SYSTEM_INTERNAL_ERROR carrying no details, HTTP 500 over REST with the message "Internal server error.", and over MCP the message "Internal error in MCP handler."'
- operation: propose-node
  accepted: '`{ ok: true, result }` carrying the node''s identity, its resolution matched_existing, created_new or needs_review, and each proposed alias that was not admitted, with the reason ALIAS_NOT_IN_SOURCE'
  refusals:
  - *id003
  - *id004
  - *id002
  - *id005
  - rule: rules/knowledge-base/node-name-length
    answer: error code VALIDATION_INVALID_FORMAT listing each failing field with its path and message, HTTP 422 over REST
  - rule: rules/knowledge-base/node-type-in-catalog
    answer: 'error code BUSINESS_UNKNOWN_NODE_TYPE naming the node type, HTTP 200 carrying `{ ok: false, error }` over REST'
  - *id015
- operation: propose-link
  accepted: '`{ ok: true, result }` carrying the link''s identity and its outcome consolidated, accepted, superseded_previous with the superseded link''s identity, or disputed; below the confidence floor, outcome rejected with no identity and reason BELOW_CONFIDENCE_FLOOR'
  refusals:
  - *id003
  - *id004
  - *id002
  - *id005
  - *id006
  - rule: rules/knowledge-base/link-type-in-catalog
    answer: 'error code BUSINESS_UNKNOWN_LINK_TYPE naming the link type, HTTP 200 carrying `{ ok: false, error }` over REST'
  - when: No knowledge node is held at the named source or target identity.
    answer: 'error code RESOURCE_NOT_FOUND naming the node, HTTP 200 carrying `{ ok: false, error }` over REST'
  - &id007
    rule: rules/knowledge-base/cited-fragments-exist
    answer: 'error code RESOURCE_NOT_FOUND naming the fragments, HTTP 200 carrying `{ ok: false, error }` over REST'
  - &id008
    rule: rules/knowledge-base/cited-fragments-in-run
    answer: 'error code VALIDATION_INVALID_FORMAT naming the fragment and the run, HTTP 200 carrying `{ ok: false, error }` over REST'
  - rule: rules/knowledge-base/link-permitted-by-type-rule
    answer: 'error code BUSINESS_LINK_RULE_VIOLATION naming the source node type, link type and target node type, HTTP 200 carrying `{ ok: false, error }` over REST'
  - &id009
    rule: rules/knowledge-base/validity-start-before-end
    answer: 'error code BUSINESS_TEMPORAL_INCOHERENT, HTTP 200 carrying `{ ok: false, error }` over REST'
  - &id010
    rule: rules/knowledge-base/correction-requires-errata-evidence
    answer: 'error code BUSINESS_TEMPORAL_INCOHERENT, HTTP 200 carrying `{ ok: false, error }` over REST'
  - &id011
    rule: rules/knowledge-base/stated-start-requires-basis
    answer: 'error code BUSINESS_DATE_UNJUSTIFIED, HTTP 200 carrying `{ ok: false, error }` over REST'
  - &id012
    rule: rules/knowledge-base/required-start-available
    answer: 'error code BUSINESS_DATE_UNJUSTIFIED, HTTP 200 carrying `{ ok: false, error }` over REST'
  - &id013
    rule: rules/knowledge-base/caller-never-states-received
    answer: error code VALIDATION_INVALID_FORMAT listing each failing field with its path and message, HTTP 422 over REST
  - &id014
    rule: rules/knowledge-base/cited-fragments-anchored
    answer: 'error code VALIDATION_INVALID_FORMAT naming the fragments and the expected raw information, HTTP 200 carrying `{ ok: false, error }` over REST'
  - &id016
    rule: rules/knowledge-base/link-or-attribute-cites-a-fragment
    answer: error code VALIDATION_INVALID_FORMAT listing each failing field with its path and message, HTTP 422 over REST
  - rule: rules/knowledge-base/consolidation-race-refuses-second-collision
    answer: 'error code SYSTEM_INTERNAL_ERROR with the message "graph consolidation: dup-guard constraint hit on retry; a concurrent transaction committed a conflicting row." and the scope knowledge_link in its details, HTTP 200 carrying `{ ok: false, error }` over REST'
  - *id015
- operation: propose-attribute
  accepted: '`{ ok: true, result }` carrying the attribute''s identity and its outcome consolidated, accepted, superseded_previous with the superseded attribute''s identity, or disputed; below the confidence floor, outcome rejected with no identity and reason BELOW_CONFIDENCE_FLOOR'
  refusals:
  - *id003
  - *id004
  - *id002
  - *id005
  - *id006
  - when: No knowledge node is held at the named identity.
    answer: 'error code RESOURCE_NOT_FOUND naming the node, HTTP 200 carrying `{ ok: false, error }` over REST'
  - rule: rules/knowledge-base/attribute-key-for-node-type
    answer: 'error code BUSINESS_UNKNOWN_ATTRIBUTE_KEY naming the key, HTTP 200 carrying `{ ok: false, error }` over REST'
  - rule: rules/knowledge-base/attribute-value-parses
    answer: 'error code VALIDATION_INVALID_FORMAT naming the value and its value type, HTTP 200 carrying `{ ok: false, error }` over REST'
  - rule: rules/knowledge-base/attribute-value-in-allowed-values
    answer: 'error code VALIDATION_INVALID_FORMAT with the message "attribute value not in closed domain" and details naming the value as value and the allowed values as allowed_values in sorted order, HTTP 200 carrying `{ ok: false, error }` over REST'
  - *id007
  - *id008
  - *id009
  - *id010
  - *id011
  - *id012
  - *id013
  - *id014
  - *id016
  - rule: rules/knowledge-base/consolidation-race-refuses-second-collision
    answer: 'error code SYSTEM_INTERNAL_ERROR with the message "graph consolidation: dup-guard constraint hit on retry; a concurrent transaction committed a conflicting row." and the scope node_attribute in its details, HTTP 200 carrying `{ ok: false, error }` over REST'
  - *id015
- operation: ingest-document
  accepted: '`{ ok: true, result }` with outcome ingested, the raw information''s and run''s identities, the chunk count and the extraction''s run summary; with outcome already_ingested, when the content is already held, the held raw information''s and run''s identities, its chunk count, its run''s status or null where that cannot be read, and a message: for a completed run "This exact content was already ingested and its extraction completed; returning the existing run. No new extraction was triggered.", for any other status "This exact content was already ingested, but its run is ''<status>'' (not completed) — the prior extraction did not finish. No new extraction was triggered; recovery requires re-running that LLMRun.", naming the status or unknown where it cannot be read'
  refusals:
  - rule: rules/knowledge-base/content-length
    answer: error code VALIDATION_INVALID_FORMAT with the message "ingest_document arguments failed validation." listing each failing field with its path and message
  - when: The request names no source type of the closed set.
    answer: error code VALIDATION_INVALID_FORMAT with the message "ingest_document arguments failed validation." listing each failing field with its path and message
  - rule: rules/knowledge-base/extraction-fails-on-repeated-system-errors
    answer: error code SYSTEM_INTERNAL_ERROR carrying the failed run
  - rule: rules/knowledge-base/prompt-version-known
    answer: error code SYSTEM_INTERNAL_ERROR carrying the failed run
  - when: The language model provider fails while a chunk is read.
    answer: error code SYSTEM_LLM_PROVIDER_UNAVAILABLE carrying the failed run
  - when: Persisting the document before extraction fails for a cause other than an unreachable store.
    answer: error code SYSTEM_INTERNAL_ERROR with the message "Failed to persist the document before extraction.", carrying no run
  - when: The extraction fails for a cause no other refusal names.
    answer: error code SYSTEM_INTERNAL_ERROR with the message "Unexpected error during document ingestion.", carrying the run's and the raw information's identities
- operation: ingest-directed
  accepted: '`{ ok: true, result }` with outcome ingested, the raw information''s and run''s identities, the chunk count, a summary counting the items by kind and status, placed before the completed run and the report so that a result cut to the tool-result length limit still carries it whole, then the completed run, reported completed even where closing it failed, with its affected nodes, an empty list where they cannot be read, and then the report, one entry per item with its reference, kind and status, a link''s reference being its source reference, its link type and its target reference joined by "->"; a node whose pinned identity names no knowledge node is reported rejected with error code RESOURCE_NOT_FOUND, the message "node_id pin does not resolve to an existing knowledge_node row." and the details node_id and reason not_found; a node whose pinned identity names a knowledge node that is not active is reported rejected with error code VALIDATION_INVALID_FORMAT, the message "node_id pin resolves to a knowledge_node row whose status is ''<status>'' (only ''active'' is accepted)." and the details node_id, reason inactive and current_status'
  refusals:
  - rule: rules/knowledge-base/directed-requires-fragment-and-node
    answer: 'error code VALIDATION_INVALID_FORMAT with the message "ingest_directed arguments failed validation." listing each failing field with its path and message'
  - rule: rules/knowledge-base/directed-reference-length
    answer: 'error code VALIDATION_INVALID_FORMAT with the message "ingest_directed arguments failed validation." listing each failing field with its path and message'
  - rule: rules/knowledge-base/directed-attribute-value-shape
    answer: 'error code VALIDATION_INVALID_FORMAT with the message "ingest_directed arguments failed validation." listing each failing field with its path and message'
  - rule: rules/knowledge-base/directed-source-label-length
    answer: 'error code VALIDATION_INVALID_FORMAT with the message "ingest_directed arguments failed validation." listing each failing field with its path and message'
  - rule: rules/knowledge-base/caller-never-states-received
    answer: 'error code VALIDATION_INVALID_FORMAT with the message "ingest_directed arguments failed validation." listing each failing field with its path and message'
  - rule: rules/knowledge-base/directed-validity-start-shape
    answer: 'error code VALIDATION_INVALID_FORMAT with the message "ingest_directed arguments failed validation." listing each failing field with its path and message'
  - when: The store cannot be reached while the directed payload is persisted before dispatch.
    answer: error code SYSTEM_SERVICE_UNAVAILABLE with the message "A backing service is temporarily unavailable."
  - when: Persisting the directed payload before dispatch fails for a cause other than an unreachable store.
    answer: error code SYSTEM_INTERNAL_ERROR with the message "Failed to persist the directed payload before dispatch.", carrying no details
  - when: The directed payload's content is found already held when it is persisted before dispatch.
    answer: 'error code SYSTEM_INTERNAL_ERROR with the message "Directed ingestion intake returned ''noop_existing''; the per-call nonce should make this unreachable.", carrying the raw information''s and run''s identities'
  - when: Persisting the directed payload before dispatch produces no chunk.
    answer: error code SYSTEM_INTERNAL_ERROR with the message "Directed ingestion intake produced no chunks.", carrying the raw information's and run's identities
  - when: The directed ingestion fails for a cause no other refusal names.
    answer: error code SYSTEM_INTERNAL_ERROR with the message "Unexpected error during directed ingestion.", carrying no details
- operation: list-recent-ingestions
  accepted: '`{ ok: true, result }` carrying the recent ingestions, each with its raw information''s identity, source type, status and reception time, the first 80 characters of its content, and its latest run''s identity, status, start and finish times, prompt version and model'
  refusals:
  - rule: rules/knowledge-base/recent-ingestions-limit-bounds
    answer: error code VALIDATION_INVALID_FORMAT listing each failing field with its path and message
---

## Description

The surface through which sources enter the knowledge base and knowledge is proposed from them: intake, the four proposals, one-shot and directed ingestion, and the reads over runs, tool calls, sources and chunks.
The proposals and the run read are carried by both REST and MCP; document and directed ingestion and the recent-ingestions listing by MCP alone; intake, the source and chunk reads, the tool-call listing, extraction and retry by REST alone.

=== contracts/knowledge-base/ingestion.log
---
entries:
- field: answers
  unstated: The material has re-ingesting held content under another model or prompt version look for a run by the new idempotency key and fail with an internal error when none exists.
  decided: Held content answers HTTP 200 with outcome noop_existing and the run the held raw information already has, whatever model or prompt version the request names.
  why: Intake is idempotent by content hash, and a request that records nothing has nothing to fail on.
- field: answers
  unstated: The material has a REST proposal refused by validation answer HTTP 200 carrying the refusal, while the shared error registry maps the same codes to 4xx statuses.
  decided: 'A validation refusal of a REST proposal answers HTTP 200 carrying `{ ok: false, error }` with the refusal''s code.'
  why: A validation refusal of a proposal is a result its run records, not a failure of the request that carried it.
- field: answers
  unstated: The material has the MCP proposals accept any non-empty text as the LLM run's identity while REST and the MCP run read demand a UUID; the two decide differently for a malformed run identity over MCP.
  decided: A malformed LLM run identity is refused with VALIDATION_INVALID_FORMAT on both transports.
  why: An LLM run's identity is a UUID everywhere else the material names one.
- field: answers
  unstated: The earlier decision had held content sent under another model or prompt version answer HTTP 200 noop_existing with the run it already has, while the code looks the run up by the request's own key and fails with an internal error when none exists.
  decided: Held content sent under a model or prompt version for which no run was opened answers HTTP 500 with SYSTEM_INTERNAL_ERROR, and records nothing.
  why: The owner holds the code as the truth over the earlier decision, which had named this behavior as the one to correct.
- field: answers
  unstated: The material does not say what ingest-document answers when persisting the document fails for a cause other than an unreachable store, or when the extraction fails for a cause no other refusal names.
  decided: Persisting failure answers SYSTEM_INTERNAL_ERROR with the message "Failed to persist the document before extraction." and no run; any other extraction failure answers SYSTEM_INTERNAL_ERROR with the message "Unexpected error during document ingestion." and the run's and the raw information's identities.
  why: The owner holds the code as the truth, and the code answers exactly these two on those conditions.
- field: answers
  unstated: The material does not say what ingest-document tells a caller whose content is already held beyond the identities, the chunk count and the run's status.
  decided: The already_ingested answer also carries a message, one wording for a completed run and one naming the status for any other, and a status of null where the run's status cannot be read.
  why: The owner holds the code as the truth, and callers act on that message to recover a run that did not finish.
- field: answers
  unstated: The material does not say what message ingest-directed answers when its arguments fail validation, while other contracts fix "Request payload failed validation." for the same code.
  decided: Every validation refusal of ingest-directed answers the message "ingest_directed arguments failed validation." with the failing fields.
  why: The owner holds the code as the truth, and the directed tool's handler answers exactly that message on a failed parse.
- field: answers
  unstated: The material does not say what ingest-directed answers when persisting its payload fails, finds its content already held, produces no chunk or fails for any other cause.
  decided: Each of these answers SYSTEM_INTERNAL_ERROR with its own fixed message and no cause, and an unreachable store answers SYSTEM_SERVICE_UNAVAILABLE.
  why: The owner holds the code as the truth, and the directed service and handler answer exactly these on those conditions.
- field: answers
  unstated: The material does not say what a directed ingestion reports for a node whose pinned identity names no node or an inactive one.
  decided: The node is reported rejected, with RESOURCE_NOT_FOUND for an absent node and VALIDATION_INVALID_FORMAT for an inactive one, each with its message and details.
  why: The owner holds the code as the truth, and the pin check reports exactly these inside an accepted ingestion.
- field: answers
  unstated: The material does not say what message a proposal refused for its shape answers over MCP.
  decided: Over MCP the message is "Input failed Zod parse." for all four proposals, while REST answers HTTP 422.
  why: The owner holds the code as the truth, and the four MCP proposal handlers answer exactly that message.
- field: answers
  unstated: The material does not say what a proposal answers when it fails for a cause no other refusal names.
  decided: It answers SYSTEM_INTERNAL_ERROR with no details, HTTP 500 and "Internal server error." over REST, and "Internal error in MCP handler." over MCP.
  why: The owner holds the code as the truth, and the shared handler and the global error handler answer exactly these.
- field: answers
  unstated: The material does not say what a link or attribute proposal answers when it meets a concurrently committed current assertion a second time.
  decided: It answers SYSTEM_INTERNAL_ERROR with a fixed message and the scope knowledge_link or node_attribute, HTTP 200 carrying the refusal over REST.
  why: The owner holds the code as the truth, and the consolidation answers exactly this after its second attempt.
- field: answers
  unstated: A fixed message that never names the cause is required of an unexpected failure, while the second-collision refusal's message names a concurrent commit.
  decided: A second collision is a named cause and not an unexpected one, so its message names it.
  why: The owner holds the code as the truth, and the consolidation refuses on a cause it recognises by name.
- field: answers
  unstated: The unreachable store answers unavailable and never an internal failure, while the shared proposal handler answers an internal failure for any cause it does not recognise.
  decided: The proposal's internal failure answer is stated for a cause other than an unreachable store.
  why: Stating it for an unreachable store would contradict a constraint no finding asked to change.
- field: answers
  unstated: A judgment of the source shows a proposal refused for its shape over MCP with the message "MCP tool args failed Zod parse." and not the "Input failed Zod parse." the contract held.
  decided: Over MCP the message is "MCP tool args failed Zod parse." for the four proposals.
  why: The owner decided the source's behavior is the truth, and callers read the message the source sends.
- field: answers
  unstated: The contract gave no message for ingest-document validation, no fallback when affected nodes or the run close fail, and no link reference form.
  decided: It adds the ingest-document message, the empty list, the completed report and the reference form.
  why: The code returns the run completed and the list empty on those failures and builds the reference as stated.
- field: answers
  unstated: The material did not state the message and the detail names of the propose-attribute refusal for a value outside the allowed values.
  decided: The message attribute value not in closed domain, with details value and allowed_values.
  why: The structural layer raises that message and those details, and the contract already states messages verbatim for other refusals.
- field: answers
  unstated: The material has propose_node list each alias it did not record and why, without naming the reason, and keeps the document context for audit without saying which answers show it.
  decided: A refused alias is answered with the reason ALIAS_NOT_IN_SOURCE; read-llm-run and run-extraction show the run's document context status and document context when it holds them.
  why: A below-floor link is already answered with a reason code, and the run reads are where an auditor looks at what the model was given.
- field: answers
  unstated: The material lets an extraction go on when its preliminary reading fails, while run-extraction and ingest-document answered a failed run whenever the language model provider failed; a provider error during the preliminary reading was decided both ways.
  decided: The provider-failure refusal of run-extraction and ingest-document applies only when the provider fails while a chunk is read.
  why: The material states that a failed preliminary reading never fails the extraction, so that failure cannot also answer a failed run.
- field: answers
  unstated: No node said in what order ingest-directed's accepted answer carries its summary, its completed run and its report. The contract only listed them, in the order run, report, summary.
  found: '/home/siegfriedneto/projects/eternal/siegard-work/ingest-consolidation-fixes/intake/scope.md, item (3): "the result envelope: the order is run, report, summary, and the chat truncates tool results at 8000 characters so the summary is lost. Expected: summary first."'
---

=== contracts/knowledge-base/retrieval
---
type: api
direction: published
operations:
- search
- read-link-provenance
- read-attribute-provenance
- read-fragment-provenance
- list-accepted-fragments
- list-node-types
- list-link-types
- list-attribute-keys
- list-nodes
- read-node
- read-link
- read-attribute
- read-link-history
- read-attribute-history
- read-attribute-key-history
- traverse
answers:
- operation: search
  accepted: '`{ ok: true, result }` carrying the page of ranked search items, each knowledge node matched directly showing whether it matched exactly or approximately and the similarity of an approximate match, each supporting fragment shown with its text, confidence, raw information, source type, reception time and chunk excerpt, and the total before pagination'
  refusals:
  - &id001
    when: The request carries no valid owner authentication.
    answer: HTTP 401, error code AUTH_UNAUTHORIZED, AUTH_TOKEN_INVALID or AUTH_TOKEN_EXPIRED
  - rule: rules/knowledge-base/search-query-not-blank
    answer: HTTP 422, error code VALIDATION_INVALID_FORMAT
  - when: The request names a parameter the search does not define.
    answer: HTTP 422, error code VALIDATION_INVALID_FORMAT
  - rule: rules/knowledge-base/search-query-length
    answer: HTTP 422, error code VALIDATION_INVALID_FORMAT
  - rule: rules/knowledge-base/search-query-must-parse
    answer: HTTP 422, error code BUSINESS_INVALID_SEARCH_QUERY
  - rule: rules/knowledge-base/search-layer-outside-set-refused
    answer: HTTP 422, error code BUSINESS_INVALID_SEARCH_LAYER, naming the allowed layers
  - rule: rules/knowledge-base/unknown-link-type-refused
    answer: HTTP 422, error code BUSINESS_UNKNOWN_LINK_TYPE
  - rule: rules/knowledge-base/expansion-depth-bounds
    answer: HTTP 422, error code VALIDATION_INVALID_FORMAT
  - when: The as-of date is not a calendar date written as year-month-day.
    answer: HTTP 422, error code VALIDATION_INVALID_FORMAT
  - &id005
    rule: rules/knowledge-base/page-limit-bounds
    answer: HTTP 422, error code VALIDATION_INVALID_FORMAT
  - &id006
    rule: rules/knowledge-base/page-offset-non-negative
    answer: HTTP 422, error code VALIDATION_INVALID_FORMAT
- operation: read-link-provenance
  accepted: '`{ ok: true, result }` listing the provenance fragments, each with its text, confidence and status and the raw chunks it came from, each chunk with its index, offsets, excerpt, locator and raw information (source type, reception time, metadata, original input)'
  refusals:
  - *id001
  - &id002
    when: The requested identity is not a well-formed identifier.
    answer: HTTP 422, error code VALIDATION_INVALID_FORMAT
  - when: No knowledge link is held at the requested identity.
    answer: HTTP 404, error code RESOURCE_NOT_FOUND
  - &id003
    rule: rules/knowledge-base/provenance-refused-after-compliance-deletion
    answer: HTTP 410, error code BUSINESS_RAW_INFORMATION_DELETED, naming the earliest compliance deletion
  - &id004
    rule: rules/knowledge-base/empty-provenance-chain-refused
    answer: HTTP 500, error code SYSTEM_INTERNAL_ERROR
- operation: read-attribute-provenance
  accepted: '`{ ok: true, result }` listing the provenance fragments, each with its text, confidence and status and the raw chunks it came from, each chunk with its index, offsets, excerpt, locator and raw information (source type, reception time, metadata, original input)'
  refusals:
  - *id001
  - *id002
  - when: No node attribute is held at the requested identity.
    answer: HTTP 404, error code RESOURCE_NOT_FOUND
  - *id003
  - *id004
- operation: read-fragment-provenance
  accepted: '`{ ok: true, result }` listing the provenance fragments, each with its text, confidence and status and the raw chunks it came from, each chunk with its index, offsets, excerpt, locator and raw information (source type, reception time, metadata, original input)'
  refusals:
  - *id001
  - *id002
  - when: No information fragment is held at the requested identity.
    answer: HTTP 404, error code RESOURCE_NOT_FOUND
  - rule: rules/knowledge-base/provenance-requires-accepted-fragment
    answer: HTTP 404, error code BUSINESS_FRAGMENT_NOT_ACCEPTED
  - *id003
  - *id004
- operation: list-accepted-fragments
  accepted: '`{ ok: true, result }` carrying the page of accepted fragments, each with its text, confidence, LLM run, creation time and source (raw information, chunk index, source type, reception time, document title)'
  refusals:
  - *id001
  - rule: rules/knowledge-base/listing-requires-a-filter
    answer: HTTP 422, error code VALIDATION_INVALID_FORMAT, naming the two filters of which one is required
  - when: A named LLM run or raw information is not a well-formed identifier.
    answer: HTTP 422, error code VALIDATION_INVALID_FORMAT, naming the offending filter
  - rule: rules/knowledge-base/accepted-fragment-listing-refuses-unknown-parameter
    answer: HTTP 422, error code VALIDATION_INVALID_FORMAT, listing each failing field with its path and message
  - *id005
  - *id006
- operation: list-node-types
  accepted: '`{ ok: true, result }` carrying `total`, the number of items, and `items`: every node type with its identity, name, description and version'
  refusals:
  - *id001
  - &id007
    when: 'A parameter is malformed or unknown: an identity that is not a well-formed identifier, a switch other than true or false, a number that is not an integer, an as-of date not written as year-month-day, a name outside 1 to 200 characters, a value outside its closed set, or a parameter the operation does not define.'
    answer: HTTP 422, error code VALIDATION_INVALID_FORMAT with message "Request payload failed validation.", listing each failing field with its path and message
  - &id008
    when: The store is unavailable, reached over MCP.
    answer: error code SYSTEM_SERVICE_UNAVAILABLE with message "A backing service is temporarily unavailable."
  - &id009
    when: The read fails over MCP for any other cause, a stored status or source type outside its closed set included.
    answer: error code SYSTEM_INTERNAL_ERROR with message "Internal server error." and no details, withholding the cause
- operation: list-link-types
  accepted: '`{ ok: true, result }` carrying `total` and `items`: every link type with its identity, name, label, description, inverse name, whether it is temporal, allows multiple current links, requires a validity start and requires a validity end on change, and its version, and, when rules are asked for, its `rules`, each with its identity, source and target node-type names and validity start and end as year-month-day or null, an empty list for a link type with none'
  refusals:
  - *id001
  - *id007
  - *id008
  - *id009
- operation: list-attribute-keys
  accepted: '`{ ok: true, result }` carrying `total` and `items`: every attribute key with its identity, node-type name, key, value type, whether it is temporal, allows multiple current values and requires a validity start, its description and version, and `valid_values` only for a key the catalog closes'
  refusals:
  - *id001
  - *id007
  - &id010
    rule: rules/knowledge-base/node-type-filter-in-catalog
    answer: HTTP 422, error code BUSINESS_UNKNOWN_NODE_TYPE naming the node type
  - *id008
  - *id009
- operation: list-nodes
  accepted: '`{ ok: true, result }` carrying `total`, the `limit` and `offset` as requested, and `items`: the page of node summaries, each with its identity, node-type name, canonical name, status and the knowledge node it was merged into or null'
  refusals:
  - *id001
  - *id007
  - *id010
  - rule: rules/knowledge-base/page-limit-bounds
    answer: HTTP 422, error code VALIDATION_INVALID_FORMAT
  - rule: rules/knowledge-base/page-offset-non-negative
    answer: HTTP 422, error code VALIDATION_INVALID_FORMAT
  - *id008
  - *id009
- operation: read-node
  accepted: '`{ ok: true, result }` carrying `node`, its node summary, `aliases`, each with its identity, alias, kind and creation time, and `attributes`, each carrying the attribute detail: its identity, knowledge node, attribute-key name, value type and value, validity start and end as year-month-day or null, recording and supersession times, status, effective status, whether it is current and in effect, confidence, validity-start basis, flags, the attribute it supersedes, and its provenance entries as a link detail carries them'
  refusals:
  - *id001
  - *id007
  - &id011
    when: No knowledge node is held at the requested identity.
    answer: HTTP 404, error code RESOURCE_NOT_FOUND naming the entity and identity, and over REST also the requested node
  - &id012
    rule: rules/knowledge-base/deleted-node-read-refused
    answer: HTTP 410, error code BUSINESS_NODE_DELETED naming the node
  - *id008
  - *id009
- operation: read-link
  accepted: 'HTTP 200 carrying `{ ok: true, result }` with the link detail: its identity, source and target knowledge nodes, link-type name and inverse name, validity start and end as year-month-day or null, recording and supersession times, status, effective status, whether it is current and in effect, confidence, validity-start basis, flags, the link it supersedes, and its provenance entries, each with the fragment''s identity, text and confidence, the raw information, its source type and reception time, and the chunk excerpt'
  refusals:
  - *id001
  - &id099
    when: 'A parameter is malformed or unknown: an identity that is not a well-formed identifier, a switch other than true or false, a number that is not an integer, an as-of date not written as year-month-day, a name outside 1 to 200 characters, a value outside its closed set, or, over MCP only, a parameter the operation does not define.'
    answer: HTTP 422, error code VALIDATION_INVALID_FORMAT with message "Request payload failed validation.", listing each failing field with its path and message
  - when: No knowledge link is held at the requested identity.
    answer: HTTP 404, error code RESOURCE_NOT_FOUND naming the entity and identity and the requested link
- operation: read-attribute
  accepted: 'HTTP 200 carrying `{ ok: true, result }` with the attribute detail: its identity, knowledge node, attribute-key name, value type and value, validity start and end as year-month-day or null, recording and supersession times, status, effective status, whether it is current and in effect, confidence, validity-start basis, flags, the attribute it supersedes, and its provenance entries as a link detail carries them'
  refusals:
  - *id001
  - *id099
  - when: No node attribute is held at the requested identity.
    answer: HTTP 404, error code RESOURCE_NOT_FOUND naming the entity and identity and the requested attribute
- operation: read-link-history
  accepted: '`{ ok: true, result }` carrying `versions`, each a link detail as read-link answers it'
  refusals:
  - *id001
  - *id099
  - when: No knowledge link is held at the requested identity.
    answer: HTTP 404, error code RESOURCE_NOT_FOUND naming the entity and identity, and over REST also the requested link
  - *id008
  - *id009
- operation: read-attribute-history
  accepted: '`{ ok: true, result }` carrying `versions`, each an attribute detail as read-attribute answers it'
  refusals:
  - *id001
  - *id099
  - when: No node attribute is held at the requested identity.
    answer: HTTP 404, error code RESOURCE_NOT_FOUND naming the entity and identity, and over REST also the requested attribute
  - *id008
  - *id009
- operation: read-attribute-key-history
  accepted: '`{ ok: true, result }` carrying `versions`, each an attribute detail as read-attribute answers it, an empty list when the knowledge node holds none for the key'
  refusals:
  - *id001
  - *id099
  - *id011
  - *id012
  - rule: rules/knowledge-base/attribute-key-history-requires-registered-key
    answer: HTTP 404, error code BUSINESS_UNKNOWN_ATTRIBUTE_KEY naming the node type and key, and over REST also the requested node and key
  - *id008
  - *id009
- operation: traverse
  accepted: '`{ ok: true, result }` carrying `starting_node_id`, the knowledge node the traversal started from, `nodes` as node summaries, and `links`, each a link detail as read-link answers it with its `hop` and `score`'
  refusals:
  - *id001
  - when: 'A parameter is malformed or unknown: an identity that is not a well-formed identifier, a switch other than true or false, a depth that is not a number, an as-of date not written as year-month-day, an empty link-type name, a direction outside out, in and both, or a parameter the operation does not define.'
    answer: HTTP 422, error code VALIDATION_INVALID_FORMAT with message "Request payload failed validation.", listing each failing field with its path and message
  - rule: rules/knowledge-base/expansion-depth-bounds
    answer: HTTP 422, error code BUSINESS_INVALID_TRAVERSE_DEPTH naming the depth and the maximum of 3, and over REST also the requested node
  - rule: rules/knowledge-base/unknown-link-type-refused
    answer: HTTP 422, error code BUSINESS_UNKNOWN_LINK_TYPE naming the link type, and over REST also the requested node
  - *id011
  - *id012
  - *id008
  - *id009
---

## Description

The owner's read surface over the knowledge base: search, the three provenance reads, the accepted-fragment listing, the catalog listings, the node listing, and the graph reads.

=== contracts/knowledge-base/retrieval.log
---
entries:
- field: answers
  unstated: The material has the REST node-type listing ignore unknown parameters while the MCP one refuses them, so the two transports answer the same request with a success and a refusal.
  decided: The node-type listing refuses an unknown parameter on both transports, like every other graph read.
  why: Every other catalog and graph read refuses an unknown parameter, and the transports answer each shared operation alike.
- field: answers
  unstated: The material for the catalog listings, the node listing and the graph reads does not show how they authenticate their caller.
  decided: Each of these operations refuses an unauthenticated caller with the same answer as the other retrieval operations.
  why: They are served on the same owner-only surface as search, including the one query tool endpoint they share with it.
- field: answers
  unstated: The material says a listing of accepted fragments naming an unknown query parameter is refused by strict validation, and does not say what the surface answers.
  decided: 'The refusal answers as every other malformed parameter of the surface does: HTTP 422, error code VALIDATION_INVALID_FORMAT, listing each failing field with its path and message.'
  why: The surface answers a strict-validation refusal one way, and nothing in the material gives this one a different answer.
- field: answers
  unstated: A judgment shows search and the accepted-fragment listing refusing a blank or long query, a depth or a page bound with VALIDATION_INVALID_FORMAT, and six reads accepting an undefined parameter over REST.
  decided: Those refusals answer VALIDATION_INVALID_FORMAT, and the six reads refuse an undefined parameter over MCP only.
  why: The owner decided the source's behavior is the truth, and the global handler maps every schema failure to that code.
- field: answers
  unstated: The search operation listed no refusal for an undefined parameter.
  decided: It adds HTTP 422 with VALIDATION_INVALID_FORMAT for an undefined parameter.
  why: The search schema is strict and serves both transports.
---

=== contracts/owner-access/identity-provider
---
type: api
direction: consumed
upstream: contracts/system/owner-identity
operations:
- sign-in-with-credentials
- obtain-access-token
answers:
- operation: sign-in-with-credentials
  accepted: any 2xx answer to POST /sign-in/email with the JSON body { email, password } and the browser's credentials included, whose body is ignored
  refusals:
  - when: The answer's body names the code INVALID_EMAIL_OR_PASSWORD, at any status.
    answer: the credentials are rejected
  - when: The answer has status 401 with any other code or none.
    answer: the credentials are rejected
  - when: The answer is any other status outside 2xx.
    answer: a failure carrying the code of the answer's JSON body when it has one, otherwise no code
  - when: The identity provider cannot be reached, because the request fails before any answer, offline, by name resolution, by origin policy or by abort.
    answer: no answer
- operation: obtain-access-token
  accepted: a 2xx answer to GET /token with the browser's credentials included, whose JSON object carries a token that is a non-empty string, and that token is the owner's access token
  refusals:
  - when: The answer has status 401.
    answer: the identity provider holds no session for the owner
  - when: The answer is any other status outside 2xx.
    answer: a failure carrying the code of the answer's JSON body when it has one, otherwise no code
  - when: The answer is 2xx and its body is not JSON.
    answer: no access token
  - when: The answer is 2xx and its body is not an object or carries no token that is a non-empty string.
    answer: no access token
  - when: The identity provider cannot be reached, because the request fails before any answer, offline, by name resolution, by origin policy or by abort.
    answer: no answer
---

## Description

The identity provider's own answers to the two requests the application makes to sign the owner in.
The access token request depends on the session the sign-in request established, and both requests carry the browser's credentials to reach it.
An error body of the identity provider has the shape { code, message }, and the code INVALID_EMAIL_OR_PASSWORD is the only one the application recognises.

=== contracts/owner-access/sign-in
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

=== contracts/owner-access/sign-in.log
---
entries:
- field: answers
  unstated: The material does not say which boundary holds the messages the owner reads at the sign-in screen, nor whether a message is a fact of the domain or only a label.
  decided: The sign-in screen is a published api whose caller is the owner, and every message that tells the owner what was refused or what happened is an answer of it, while control labels, headings and placeholders are held by no node.
  why: A message changes what the owner learns, which is what separates a fact from presentation, whereas a relabelled control keeps doing the same thing.
---

=== contracts/system/owner-identity
---
type: capability
---

## Description

An external identity provider recognises the owner by e-mail address and password and issues the access token the application's back end verifies.

=== domain/application-shell/_context
---
strategic: supporting
---

## Description

The application shell holds what every screen of the owner's client shares: how a request is sent and its failure told, who is signed in, where each address leads and the frame around the workspaces.

## Responsibility

It sends requests with the owner's token, turns failures into what the owner sees, guards the addresses and shows the status of the system around the workspaces.

=== domain/application-shell/_context.log
---
entries:
- field: strategic
  unstated: The material does not say whether the application shell is where the business differs or a solved problem.
  decided: supporting
  why: The shell carries every workspace and the transport beneath it and adds no business difference of its own.
---

=== domain/application-shell/application-shell
---
type: aggregate-root
attributes:
- name: health
  type: shell-health
  required: true
- name: curation_pending
  type: integer
  required: true
- name: as_of
  type: string
- name: palette_open
  type: boolean
  required: true
- name: address
  type: string
  required: true
- name: reason
  type: string
operations:
- open-address
- toggle-palette
- choose-as-of
- show-failure
---

## Description

The frame around the workspaces, with its header, footer and command palette.

## Responsibility

It guards the addresses and shows the system's status around the workspace.

=== domain/application-shell/conversation-menu
---
type: aggregate-root
attributes:
- name: include_archived
  type: boolean
  required: true
- name: rename_draft
  type: string
- name: delete_pending
  type: boolean
  required: true
operations:
- create
- select
- rename
- archive
- unarchive
- delete
---

## Description

The menu from which the owner manages conversations.

## Responsibility

It lets the owner pick, create, rename, archive and delete conversations.

=== domain/application-shell/failure-action
---
type: enumeration
values:
- redirect
- toast-and-navigate
- boundary
- set-error
- inline-empty
- inline-gone
- toast
- silent
---

## Description

What the client does with a failure so that the owner sees it.

## Responsibility

None.

=== domain/application-shell/failure-router
---
type: aggregate-root
attributes:
- name: action
  type: failure-action
  required: true
- name: tone
  type: toast-tone
- name: message
  type: string
operations:
- route-failure
- apply-action
---

## Description

The decision of what the owner sees for each failure.

## Responsibility

It maps a failure code to one action and one text.

=== domain/application-shell/message-bubble
---
type: aggregate-root
attributes:
- name: role
  type: domain/chat/message-role
  required: true
- name: streaming
  type: boolean
  required: true
- name: errored
  type: boolean
  required: true
- name: stop_notice
  type: string
operations:
- show-message
---

## Description

One message of a conversation drawn as a bubble.

## Responsibility

It shows the message text, its tool calls and why a reply stopped.

=== domain/application-shell/owner-session
---
type: aggregate-root
attributes:
- name: access_token
  type: string
- name: subject
  type: string
- name: expires_at
  type: integer
- name: name
  type: string
- name: email
  type: string
operations:
- set-token
- clear
- check-freshness
---

## Description

The access token the owner's browser holds and what it says about the owner.

## Responsibility

It tells the client whether the owner may open a guarded address.

=== domain/application-shell/request-helper
---
type: aggregate-root
attributes:
- name: base_url
  type: string
  required: true
- name: failure_code
  type: string
operations:
- send-request
- refresh-token
---

## Description

The one way the client sends a request to the back end.

## Responsibility

It sends the request with the owner's token and turns whatever comes back into an answer or one failure.

=== domain/application-shell/shell-health
---
type: enumeration
values:
- ok
- down
- checking
---

## Description

The states the footer tells the owner the system is in.

## Responsibility

None.

=== domain/application-shell/state-badge
---
type: aggregate-root
attributes:
- name: state
  type: domain/graph-explorer/confidence-state
  required: true
- name: icon_only
  type: boolean
  required: true
operations:
- show-state
---

## Description

The mark that tells the owner how much to trust an item.

## Responsibility

It names a confidence state in words and for assistive technology.

=== domain/application-shell/toast-tone
---
type: enumeration
values:
- warning
- danger
---

## Description

How strongly a toast tells the owner of a failure.

## Responsibility

None.

=== domain/chat-workspace/_context
---
strategic: supporting
---

## Description

The chat workspace holds the screen where the owner talks to the assistant about the knowledge base, follows each answer as it streams and keeps the conversations that came out of it.

## Responsibility

It lets the owner pick or create a conversation, send a message, watch the turn stream and stop it, and see the graph the assistant showed while it answered.

=== domain/chat-workspace/_context.log
---
entries:
- field: strategic
  unstated: The material does not say whether the chat screen is where the business differs or a solved problem.
  decided: supporting
  why: The screen carries the owner's questions to the assistant the business builds elsewhere, so it serves the core without being it.
---

=== domain/chat-workspace/chat-session
---
type: aggregate-root
attributes:
- name: conversation_id
  type: string
- name: draft
  type: string
- name: chat_status
  type: chat-status
  required: true
- name: streamed_text
  type: string
  required: true
- name: tool_chips
  type: tool-chip
  many: true
- name: idempotency_key
  type: string
- name: is_streaming
  type: boolean
  required: true
- name: last_outcome
  type: send-outcome
- name: history_state
  type: message-list-state
operations:
- select-conversation
- send-message
- stop-turn
- cancel-turn
- reactivate-conversation
---

## Description

One sitting of the owner at the chat screen, from the conversation chosen to the turn being streamed.

## Responsibility

It keeps the conversation shown, what the owner typed, the turn in flight and the outcome of the last send, so that the screen shows one consistent state.

=== domain/chat-workspace/chat-status
---
type: enumeration
values:
- idle
- thinking
- streaming
- tool-running
- error
---

## Description

The phases the screen shows a turn in.

## Responsibility

It names the one phase the owner is told about.

=== domain/chat-workspace/chat-status.log
---
entries:
- field: values
  unstated: A survey found the screen compares tool_running where the enumeration holds tool-running, and nothing said which spelling the business decided.
  decided: tool-running stays the value and tool_running is its derived code form.
  why: The element schema keeps enumeration values in kebab-case and derives code forms, and the status never crosses the wire.
---

=== domain/chat-workspace/message-list-state
---
type: enumeration
values:
- loading
- error
- streaming
- empty
- success
---

## Description

The states the message list can be in.

## Responsibility

It names the one state the owner sees.

=== domain/chat-workspace/send-outcome
---
type: value-object
attributes:
- name: stop_reason
  type: domain/chat/assistant-stop-reason
- name: error_code
  type: string
- name: error_message
  type: string
- name: idempotency_key
  type: string
  required: true
---

## Description

How a send ended, with the stop reason of a finished turn or the code and message of a failed one.

## Responsibility

It tells the composer whether the owner can try again or must wait.

=== domain/chat-workspace/tool-chip
---
type: value-object
attributes:
- name: tool
  type: string
  required: true
- name: args_summary
  type: string
  required: true
- name: outcome
  type: tool-chip-outcome
  required: true
---

## Description

One tool call of the turn as the screen shows it, with its name, a summary of its arguments and its outcome.

## Responsibility

It lets the owner see what the assistant looked up and whether it worked.

=== domain/chat-workspace/tool-chip-outcome
---
type: enumeration
values:
- pending
- succeeded
- failed
---

## Description

Where a tool call stands.

## Responsibility

It names the one outcome a chip shows.

=== domain/chat/_context
---
strategic: supporting
---

## Description

The chat holds the conversations the owner has with the assistant: their messages, the tools the assistant called while answering, and the view of the knowledge graph each conversation left open.

## Responsibility

It keeps each conversation with the assistant so the owner can return to it.

=== domain/chat/_context.log
---
entries:
- field: strategic
  unstated: The material does not say whether the chat is core, supporting or generic.
  decided: supporting
  why: Keeping conversations with the assistant serves reading the knowledge base but is not what the system exists for.
---

=== domain/chat/assistant-stop-reason
---
type: enumeration
values:
- end-turn
- max-tokens
- stop-sequence
- max-iterations
- turn-timeout
- cancelled
- provider-error
- internal-error
---

## Description

How a turn ended: as the model ended it (end-turn, max-tokens, stop-sequence), at the model-call limit, past the turn time limit, cancelled by the owner, or failed at the model provider or inside the system.

## Responsibility

None.

=== domain/chat/chat-prompt-version
---
type: enumeration
values:
- v1
- v2
- v3
- v4
---

## Description

The versions of the instructions the assistant answers under.

## Responsibility

None.

=== domain/chat/conversation
---
type: aggregate-root
attributes:
- name: title
  type: string
- name: rolling_summary
  type: string
- name: archived_at
  type: datetime
- name: created_at
  type: datetime
  required: true
- name: updated_at
  type: datetime
  required: true
relationships:
- target: message
  type: composition
  cardinality: 0..*
- target: tool-call
  type: composition
  cardinality: 0..*
- target: graph-view
  type: composition
  cardinality: 0..1
---

## Description

One conversation the owner holds with the assistant, with an optional title and running summary, archived once it has an archiving time.

## Responsibility

It is the unit a conversation's messages, tool calls and graph view live and are removed with.

=== domain/chat/conversation-listing
---
type: value-object
attributes:
- name: limit
  type: integer
- name: cursor
  type: string
- name: include_archived
  type: boolean
---

## Description

What a conversation listing asks for: how many conversations, where the previous page ended, and whether archived conversations are included.

## Responsibility

None.

=== domain/chat/conversation-usage
---
type: value-object
attributes:
- name: messages
  type: integer
  required: true
- name: tokens_in
  type: integer
  required: true
- name: tokens_out
  type: integer
  required: true
- name: tool_calls
  type: integer
  required: true
---

## Description

How much one conversation has used: its messages, the model tokens its answers consumed and produced, and its tool calls.

## Responsibility

None.

=== domain/chat/conversation.log
---
entries:
- field: relationships.message.cardinality
  unstated: The material does not say whether a conversation may hold no message.
  decided: 0..*
  why: Nothing in the material requires a message before a conversation exists.
- field: relationships.tool-call.cardinality
  unstated: The material does not say how many tool calls a conversation holds.
  decided: 0..*
  why: A conversation need not call any tool.
---

=== domain/chat/graph-delta
---
type: value-object
attributes:
- name: source_tool
  type: string
  required: true
- name: nodes
  type: graph-delta-node
  many: true
- name: links
  type: graph-delta-link
  many: true
---

## Description

The part of the knowledge graph one successful tool call of a turn showed, streamed to the owner so the graph view can draw it.

## Responsibility

It lets the owner see, as the assistant works, the knowledge its answer rests on.

=== domain/chat/graph-delta-link
---
type: value-object
attributes:
- name: link_type
  type: string
  required: true
- name: link_type_label
  type: string
- name: is_temporal
  type: boolean
  required: true
- name: is_in_effect
  type: boolean
- name: status
  type: string
- name: flags
  type: domain/knowledge-base/assertion-flag
  many: true
relationships:
- target: domain/knowledge-base/knowledge-link
  type: reference
  cardinality: '1'
- target: domain/knowledge-base/knowledge-node
  type: reference
  cardinality: '1'
  role: source
- target: domain/knowledge-base/knowledge-node
  type: reference
  cardinality: '1'
  role: target
---

## Description

One knowledge link a tool call showed, as the graph view draws it.

## Responsibility

None.

=== domain/chat/graph-delta-node
---
type: value-object
attributes:
- name: node_type
  type: string
  required: true
- name: canonical_name
  type: string
  required: true
- name: status
  type: domain/knowledge-base/node-status
  required: true
relationships:
- target: domain/knowledge-base/knowledge-node
  type: reference
  cardinality: '1'
---

## Description

One knowledge node a tool call showed, as the graph view draws it.

## Responsibility

None.

=== domain/chat/graph-layout
---
type: enumeration
values:
- force
- tree
- radial
---

## Description

How a graph view arranges the knowledge graph it shows.

## Responsibility

None.

=== domain/chat/graph-view
---
type: entity
aggregate: conversation
attributes:
- name: snapshot
  type: string
  required: true
- name: updated_at
  type: datetime
  required: true
- name: layout_algorithm
  type: graph-layout
---

## Description

The view of the knowledge graph a conversation last left open.

## Responsibility

It lets the owner return to a conversation and find the graph as they left it.

=== domain/chat/graph-view.log
---
entries:
- field: attributes.snapshot.type
  unstated: The material holds a graph view's snapshot as a structured document without giving its shape.
  decided: string
  why: Nothing in the material reads inside it, so it is carried whole as text.
---

=== domain/chat/message
---
type: entity
aggregate: conversation
attributes:
- name: role
  type: message-role
  required: true
- name: content
  type: string
  required: true
- name: stop_reason
  type: assistant-stop-reason
- name: idempotency_key
  type: string
- name: model
  type: string
- name: tokens_in
  type: integer
- name: tokens_out
  type: integer
- name: latency_ms
  type: integer
- name: created_at
  type: datetime
  required: true
---

## Description

One turn of a conversation, spoken by the owner or by the assistant.

## Responsibility

It holds what was said in a conversation, in the words it was said.

=== domain/chat/message-listing
---
type: value-object
attributes:
- name: limit
  type: integer
- name: before
  type: datetime
---

## Description

What a message listing asks for: how many messages, and the moment the page ends before.

## Responsibility

None.

=== domain/chat/message-role
---
type: enumeration
values:
- user
- assistant
---

## Description

Who spoke a message: the owner, as user, or the assistant.

## Responsibility

It tells the owner's turns from the assistant's.

=== domain/chat/message.log
---
entries:
- field: attributes.content.type
  unstated: The material holds a message's content as a structured document without giving its shape.
  decided: string
  why: Nothing in the material reads inside it, so it is carried whole as text.
---

=== domain/chat/summary-prompt-version
---
type: enumeration
values:
- v1
- v2
---

## Description

The versions of the instructions a conversation's rolling summary is refolded under.

## Responsibility

None.

=== domain/chat/tool-call
---
type: entity
aggregate: conversation
attributes:
- name: tool_name
  type: string
  required: true
- name: arguments
  type: string
  required: true
- name: result
  type: string
- name: is_error
  type: boolean
  required: true
- name: error_message
  type: string
- name: duration_ms
  type: integer
  required: true
relationships:
- target: message
  type: association
  cardinality: 0..1
---

## Description

One call the assistant made to a tool while answering in a conversation, with what it was given, what it returned or the error it met, and how long it took.

## Responsibility

It shows the owner which tools an answer rested on.

=== domain/chat/tool-call.log
---
entries:
- field: type
  unstated: The material leaves open whether the conversation records belong to the knowledge-base context or to a context of their own.
  decided: entity of a separate chat context
  why: A tool call in a conversation is any tool the assistant used, while a knowledge-base tool call is the audit of one proposal, so the same term carries two meanings.
- field: attributes.arguments.type
  unstated: The material holds a chat tool call's arguments as a structured document without giving its shape.
  decided: string
  why: Nothing in the material reads inside it, so it is carried whole as text.
- field: attributes.result.type
  unstated: The material holds a chat tool call's result as a structured document without giving its shape.
  decided: string
  why: Nothing in the material reads inside it, so it is carried whole as text.
---

=== domain/chat/turn
---
type: value-object
attributes:
- name: content
  type: string
  required: true
- name: model
  type: string
  required: true
- name: idempotency_key
  type: string
  required: true
- name: stop_reason
  type: assistant-stop-reason
- name: tokens_in
  type: integer
- name: tokens_out
  type: integer
relationships:
- target: conversation
  type: reference
  cardinality: '1'
---

## Description

One exchange the owner opens by sending a message to a conversation: the message, the model that answers it, the key that makes resending it safe, and how the answer ended.

## Responsibility

It is what the assistant answers, one at a time per conversation.

=== domain/chat/turn-event-kind
---
type: enumeration
values:
- llm-start
- text-delta
- tool-start
- tool-result
- graph-delta
- done
- error
---

## Description

What the owner is streamed while a turn runs: a model call starting, a piece of the answer's text, a tool call starting, its result, the part of the knowledge graph it showed, and the turn ending as done or in error.

## Responsibility

None.

=== domain/chat/turn.log
---
entries:
- field: type
  unstated: The material does not say whether a turn has an identity of its own or is a value carried by the messages it records.
  decided: value-object
  why: 'A turn is never stored or read as itself: what persists of it is its messages and tool calls.'
---

=== domain/curation-workspace/_context
---
strategic: supporting
---

## Description

The curation workspace holds the screen where the owner works the review queues, decides each pending item and corrects what the knowledge base holds.

## Responsibility

It lets the owner see the evidence behind an item, decide it with a reason, undo a destructive decision for a short while and keep the queue and the metrics honest about what is still pending.

=== domain/curation-workspace/_context.log
---
entries:
- field: strategic
  unstated: The material does not say whether the curation screen is where the business differs or a solved problem.
  decided: supporting
  why: Curation only exposes to the owner the review the knowledge base asks for, so it serves the core without being it.
---

=== domain/curation-workspace/batch-kind
---
type: enumeration
values:
- entity-match
- disputed
- uncertain
---

## Description

The kinds of selection the batch bar acts on.

## Responsibility

It names the one kind a batch selection holds.

=== domain/curation-workspace/correction-draft
---
type: value-object
attributes:
- name: value
  type: string
- name: target_node_id
  type: string
- name: valid_from
  type: date
- name: valid_to
  type: date
- name: valid_from_basis
  type: domain/knowledge-base/valid-from-basis
  required: true
- name: valid_from_fragment_id
  type: string
- name: reason
  type: string
  required: true
---

## Description

The values and the reason the owner writes on the correction form before saving.

## Responsibility

It holds the correction until it passes the form's checks and is handed to the caller.

=== domain/curation-workspace/curation-session
---
type: aggregate-root
attributes:
- name: selected_item
  type: selected-item
- name: evidence_viewed
  type: boolean
  required: true
- name: session_resolved
  type: integer
  required: true
- name: last_seen_total
  type: integer
- name: checked_item_ids
  type: string
  many: true
- name: pending_decision
  type: pending-decision
- name: draft
  type: decision-draft
- name: correction
  type: correction-draft
operations:
- select-item
- decide
- undo-decision
- move-on
- reset-session
---

## Description

One sitting of the owner at the curation screen, from the first queue read to the last decision.

## Responsibility

It keeps the selected item, whether its evidence was viewed, the decision waiting for undo and the draft the owner is writing, so that the screen shows one consistent state.

=== domain/curation-workspace/curation-shortcut
---
type: enumeration
values:
- next
- previous
- toggle-check
- evidence
- merge
- keep-separate
- confirm
- reject
- undo
- toggle-help
- select-index
---

## Description

The actions a key can trigger on the curation screen.

## Responsibility

It names every action the keyboard can reach.

=== domain/curation-workspace/decision-draft
---
type: value-object
attributes:
- name: candidate_id
  type: string
- name: side_id
  type: string
- name: reason
  type: string
---

## Description

What the owner has chosen and written on the decision panel before deciding.

## Responsibility

It holds the selected candidate or side and the reason until a decision is sent or the item changes.

=== domain/curation-workspace/dispatch-kind
---
type: enumeration
values:
- destructive
- immediate
---

## Description

How a decision is sent to the server.

## Responsibility

It tells a decision that waits for undo from one sent at once.

=== domain/curation-workspace/display-mode
---
type: enumeration
values:
- summary
- full-diff
---

## Description

How much of a queue item the decision panel shows.

## Responsibility

It names the one presentation chosen for an item.

=== domain/curation-workspace/pending-decision
---
type: value-object
attributes:
- name: caption
  type: string
  required: true
- name: dispatch_kind
  type: dispatch-kind
  required: true
- name: deadline
  type: datetime
  required: true
---

## Description

A destructive decision that has not yet been sent, waiting for the owner to undo it.

## Responsibility

It keeps the decision, its caption and the moment its undo window ends.

=== domain/curation-workspace/queue-tab
---
type: enumeration
values:
- all
- entities
- disputes
---

## Description

The tabs that choose which review queue the page lists.

## Responsibility

It names the one queue the owner is looking at.

=== domain/curation-workspace/selected-item
---
type: value-object
attributes:
- name: kind
  type: domain/knowledge-base/review-queue-kind
  required: true
- name: id
  type: string
  required: true
---

## Description

The queue item the owner is looking at, named by its review queue kind and an identifier.

## Responsibility

It lets the address, the list and the decision panel agree on which item is open.

=== domain/graph-explorer/_context
---
strategic: supporting
---

## Description

The graph explorer holds the pane where the owner sees the knowledge graph a conversation showed and reads, node by node, what the knowledge base holds about it.

## Responsibility

It draws the graph the assistant showed, lets the owner arrange it, and opens a node's detail, relationships and origin.

=== domain/graph-explorer/_context.log
---
entries:
- field: strategic
  unstated: The material does not say whether the graph explorer is where the business differs or a solved problem.
  decided: supporting
  why: The pane draws what the knowledge base already holds and carries no business difference of its own.
---

=== domain/graph-explorer/confidence-state
---
type: enumeration
values:
- accepted
- uncertain
- low-confidence
- disputed
- superseded
---

## Description

How much trust a node or link of the graph is drawn with.

## Responsibility

None.

=== domain/graph-explorer/confidence-state.log
---
entries:
- field: values
  unstated: The survey lists five confidence states shown but the specification held no enumeration for them.
  decided: accepted, uncertain, low-confidence, disputed and superseded, spelled as the screen spells them
  why: the shown spelling uses a hyphen in low-confidence where the back end's flag uses an underscore, and the enumeration records what the screen shows
---

=== domain/graph-explorer/graph-link-view
---
type: value-object
attributes:
- name: id
  type: string
  required: true
- name: source
  type: string
  required: true
- name: target
  type: string
  required: true
- name: label
  type: string
  required: true
- name: link_type_label
  type: string
  required: true
- name: is_temporal
  type: boolean
  required: true
- name: in_effect
  type: boolean
- name: state
  type: confidence-state
---

## Description

One link as the graph pane draws it.

## Responsibility

None.

=== domain/graph-explorer/graph-node-view
---
type: value-object
attributes:
- name: id
  type: string
  required: true
- name: type
  type: string
  required: true
- name: label
  type: string
  required: true
- name: state
  type: confidence-state
- name: subtitle
  type: string
---

## Description

One node as the graph pane draws it.

## Responsibility

None.

=== domain/graph-explorer/graph-pane
---
type: aggregate-root
attributes:
- name: nodes
  type: graph-node-view
  many: true
- name: links
  type: graph-link-view
  many: true
- name: positions
  type: string
- name: user_pinned
  type: string
  many: true
- name: reveal_queue
  type: string
  many: true
- name: revealed
  type: string
  many: true
- name: status
  type: graph-pane-status
  required: true
- name: error_message
  type: string
- name: received_delta_this_turn
  type: boolean
  required: true
- name: layout_algorithm
  type: domain/chat/graph-layout
  required: true
- name: layout_nonce
  type: integer
  required: true
- name: last_turn_end
  type: turn-end
- name: snapshot_version
  type: graph-snapshot-version
operations:
- add-delta
- replace-delta
- remove-nodes
- move-node
- reorganize
- choose-layout
- settle-turn
- restore-view
- clear
---

## Description

The knowledge graph the owner is looking at, from the nodes drawn to the arrangement and the phase the pane is in.

## Responsibility

It keeps the nodes, the links, their positions and the status so that the pane shows one consistent graph.

=== domain/graph-explorer/graph-pane-status
---
type: enumeration
values:
- empty
- loading
- revealing
- ready
- error
---

## Description

The phases the graph pane is shown in.

## Responsibility

None.

=== domain/graph-explorer/graph-pane.log
---
entries:
- field: operations
  unstated: The survey names the graph store's actions but no domain operation names.
  decided: add-delta, replace-delta, remove-nodes, move-node, reorganize, choose-layout, settle-turn, restore-view and clear
  why: each is one action of the store the survey describes and the rules constrain, so a reader of the aggregate can find which action a rule governs
---

=== domain/graph-explorer/graph-snapshot-version
---
type: enumeration
values:
- "1"
- "2"
---

## Description

The versions a saved graph view is written in.

## Responsibility

None.

=== domain/graph-explorer/node-detail
---
type: aggregate-root
attributes:
- name: node_id
  type: string
  required: true
- name: label
  type: string
- name: curation_open
  type: boolean
  required: true
- name: failure
  type: node-detail-failure
- name: origin_failure
  type: origin-failure
operations:
- open-detail
- close-detail
- open-curation
---

## Description

The panel that replaces the graph with what the knowledge base holds about one node.

## Responsibility

It shows the node, its aliases, attributes, relationships and the origin of each item, and offers curation where the node needs it.

=== domain/graph-explorer/node-detail-failure
---
type: enumeration
values:
- not-found
- deleted
- generic
---

## Description

The ways reading a node's detail can fail, as the panel tells them apart.

## Responsibility

None.

=== domain/graph-explorer/origin-failure
---
type: enumeration
values:
- not-found
- deleted
- generic
- unknown
---

## Description

The ways reading the full origin of an item can fail, as the panel tells them apart.

## Responsibility

None.

=== domain/graph-explorer/turn-end
---
type: enumeration
values:
- done
- error
---

## Description

How a turn ends, as the graph pane settles it.

## Responsibility

None.

=== domain/ingest-workspace/_context
---
strategic: supporting
---

## Description

The ingest workspace holds the screen where the owner hands a document to the knowledge base and follows its ingestion to the graph it produced.

## Responsibility

It guides the owner from a typed or dropped document to a recorded source, an extraction and a graph, and tells the owner what went wrong when a step fails.

=== domain/ingest-workspace/_context.log
---
entries:
- field: strategic
  unstated: The material does not say whether the ingest screen is where the business differs or a solved problem.
  decided: supporting
  why: The screen only carries a document to the knowledge base the business differs on, so it serves the core without being it.
---

=== domain/ingest-workspace/ingest-failure
---
type: value-object
attributes:
- name: code
  type: string
  required: true
- name: message
  type: string
  required: true
---

## Description

The code and the message the owner is shown when a step of the ingestion fails.

## Responsibility

It lets the owner tell a failure worth retrying from one that is not.

=== domain/ingest-workspace/ingest-phase
---
type: enumeration
values:
- idle
- ready
- sending
- noop
- extracting
- polling
- revealing
- complete
- error
---

## Description

The steps the screen shows an ingestion in.

## Responsibility

It names the one step the owner is told about at any moment.

=== domain/ingest-workspace/ingest-session
---
type: aggregate-root
attributes:
- name: content
  type: string
  required: true
- name: source_type
  type: domain/knowledge-base/source-type
- name: phase
  type: ingest-phase
  required: true
- name: llm_run_id
  type: string
- name: affected_node_ids
  type: string
  many: true
- name: summary
  type: domain/knowledge-base/run-summary
- name: failure
  type: ingest-failure
- name: validation_message
  type: string
operations:
- submit-ingest
- record-source
- run-extraction
- poll-run
- retry-run
- assemble-graph
- reset-session
---

## Description

One ingestion the owner follows on the screen, from the document typed or dropped to the graph it produced.

## Responsibility

It keeps what the owner submitted, the phase the ingestion is in, the run it opened and the failure shown, so the screen shows one consistent state.

=== domain/knowledge-base/_context
---
strategic: core
---

## Description

The knowledge base holds what the owner supplied, the knowledge a language model extracted from it, and the graph of entities and relations built from that extraction.
The owner reads it back by searching it, by asking where an assertion came from, and by listing accepted fragments.

## Responsibility

It lets the owner find what the system knows and trace every answer back to the source it came from.

=== domain/knowledge-base/_context.log
---
entries:
- field: strategic
  unstated: The material does not say whether the knowledge base is core, supporting or generic.
  decided: core
  why: Tracing every answer back to its source is what the system exists for, and no off-the-shelf product does it.
---

=== domain/knowledge-base/accepted-fragment-filter
---
type: value-object
attributes:
- name: page
  type: page
relationships:
- target: raw-information
  type: reference
  cardinality: 0..1
- target: llm-run
  type: reference
  cardinality: 0..1
---

## Description

What the owner narrows an accepted-fragment listing to: an LLM run, a raw information, or both, and a page.

## Responsibility

None.

=== domain/knowledge-base/adjusted-period
---
type: value-object
attributes:
- name: item_id
  type: string
  required: true
- name: valid_from
  type: date
  required: true
- name: valid_to
  type: date
---

## Description

The validity period the owner gives one disputed assertion when the dispute is resolved by adjusting periods.

## Responsibility

None.

=== domain/knowledge-base/adjusted-period.log
---
entries:
- field: attributes
  unstated: A judgment of the source shows an adjusted period refused when it omits its validity start key, while its validity end key may be omitted.
  decided: The validity start is required and may be empty; the validity end stays optional.
  why: The owner decided the source's behavior is the truth, and the source requires the start key and not the end key.
---

=== domain/knowledge-base/affected-counts
---
type: value-object
attributes:
- name: chunks
  type: integer
  required: true
- name: fragments
  type: integer
  required: true
- name: links
  type: integer
  required: true
- name: attributes
  type: integer
  required: true
---

## Description

How many raw chunks, information fragments, knowledge links and node attributes one compliance deletion marked deleted.

## Responsibility

It records the reach of a compliance deletion.

=== domain/knowledge-base/alias-kind
---
type: enumeration
values:
- canonical
- alias
---

## Description

Whether a node alias is its node's canonical name or another name for it.

## Responsibility

None.

=== domain/knowledge-base/allowed-value
---
type: value-object
attributes:
- name: value
  type: string
  required: true
- name: label
  type: string
- name: sort_order
  type: integer
- name: description
  type: string
---

## Description

One value the catalog allows for an attribute key, with the label it is shown by and its place in the key's order.

## Responsibility

It closes the values an attribute of that key may take.

=== domain/knowledge-base/assertion-correction
---
type: value-object
attributes:
- name: assertion_kind
  type: assertion-kind
  required: true
- name: item_id
  type: string
  required: true
- name: corrected
  type: corrected-values
  required: true
- name: reason
  type: string
  required: true
---

## Description

The owner's correction of one knowledge link or node attribute, and why.

## Responsibility

It carries the replacement of a wrong assertion by a corrected one.

=== domain/knowledge-base/assertion-flag
---
type: enumeration
values:
- uncertain
- disputed
- low-confidence
---

## Description

A warning a search item carries about how far it can be trusted.

## Responsibility

It keeps uncertainty visible instead of hidden.

=== domain/knowledge-base/assertion-kind
---
type: enumeration
values:
- link
- attribute
---

## Description

Which kind of assertion a curation request names: a knowledge link or a node attribute.

## Responsibility

None.

=== domain/knowledge-base/assertion-review
---
type: value-object
attributes:
- name: assertion_kind
  type: assertion-kind
  required: true
- name: item_id
  type: string
  required: true
- name: reason
  type: string
---

## Description

The owner's confirmation or rejection of one knowledge link or node attribute, and why.

## Responsibility

None.

=== domain/knowledge-base/assertion-status
---
type: enumeration
values:
- active
- uncertain
- disputed
- superseded
- deleted
---

## Description

The state a knowledge link or a node attribute is in.

## Responsibility

None.

=== domain/knowledge-base/attribute-key
---
type: aggregate-root
attributes:
- name: key
  type: string
  required: true
- name: value_type
  type: value-type
  required: true
- name: is_temporal
  type: boolean
- name: allows_multiple_current
  type: boolean
- name: requires_valid_from
  type: boolean
- name: description
  type: string
- name: allowed_values
  type: allowed-value
  many: true
- name: version
  type: integer
  required: true
relationships:
- target: node-type
  type: reference
  cardinality: '1'
---

## Description

A named property the catalog allows on the knowledge nodes of one node type, with the type its values take and, where the catalog closes it, the values it allows.

## Responsibility

It fixes which attributes a node may hold and what their values may be.

=== domain/knowledge-base/attribute-key.log
---
entries:
- field: type
  unstated: The material says an attribute key belongs to one node type without saying whether it changes together with it.
  decided: aggregate-root referencing its node type
  why: Node attributes point at their key directly, and a reference only reaches an aggregate root.
---

=== domain/knowledge-base/change-hint
---
type: enumeration
values:
- none
- succession
- correction
---

## Description

What a proposal claims about the current assertion it meets: nothing, that it succeeds it, or that it corrects it.

## Responsibility

None.

=== domain/knowledge-base/chunk-locator
---
type: value-object
attributes:
- name: page
  type: integer
- name: line
  type: integer
- name: speaker
  type: string
- name: ts
  type: string
---

## Description

A readable anchor to a place in a source, made of a page, a line, a speaker and a ts, each of which may be absent.

## Responsibility

It names where a chunk sits in its source in the terms the source itself uses.

=== domain/knowledge-base/compliance-deletion
---
type: aggregate-root
attributes:
- name: executed_at
  type: datetime
  required: true
- name: reason
  type: string
  required: true
- name: affected
  type: affected-counts
  required: true
relationships:
- target: raw-information
  type: reference
  cardinality: '1'
---

## Description

The record that a raw information was deleted to honour a data-protection obligation, and when the deletion was executed.

## Responsibility

It keeps a deleted source's knowledge from being presented as still traceable.

=== domain/knowledge-base/compliance-deletion-filter
---
type: value-object
attributes:
- name: executed_from
  type: datetime
- name: executed_to
  type: datetime
- name: page
  type: page
relationships:
- target: raw-information
  type: reference
  cardinality: 0..1
---

## Description

What a listing of compliance deletions is narrowed to: the raw information deleted, a window over execution times, and the page.

## Responsibility

None.

=== domain/knowledge-base/compliance-deletion-outcome
---
type: enumeration
values:
- deleted
- noop-already-deleted
---

## Description

How a requested compliance deletion ended: the raw information was deleted by it, or it was already deleted and nothing changed.

## Responsibility

None.

=== domain/knowledge-base/compliance-deletion.log
---
entries:
- field: attributes.affected.type
  unstated: The material holds a compliance deletion's record of what it affected as a structured document without giving its shape.
  decided: string
  why: Nothing in the material reads inside it, so it is carried whole as text.
- field: attributes.affected.type
  retired: The material now states what a compliance deletion affected as four counts, held by domain/knowledge-base/affected-counts, which compliance-deletion's affected attribute is typed by.
---

=== domain/knowledge-base/corrected-values
---
type: value-object
attributes:
- name: value
  type: string
- name: valid_from
  type: date
- name: valid_to
  type: date
- name: valid_from_source
  type: valid-from-basis
relationships:
- target: knowledge-node
  type: reference
  cardinality: 0..1
  role: target
- target: information-fragment
  type: reference
  cardinality: 0..1
  role: errata
---

## Description

The values a correction puts in place of an assertion's: its value or target node, its validity start and end, the basis of the start, and the information fragment that justifies it.

## Responsibility

None.

=== domain/knowledge-base/corrected-values.log
---
entries:
- field: attributes.valid_from_source.name
  unstated: The owner named the attribute valid_from_source on a knowledge link and a node attribute, and did not say whether the values a correction puts in place of an assertion's carry the same name.
  decided: valid_from_source, the same name as the assertion attribute it replaces; a proposal keeps valid_from_basis.
  why: A correction writes the basis straight onto the assertion, and the curation surface already carries valid_from_source.
---

=== domain/knowledge-base/curation-action
---
type: aggregate-root
attributes:
- name: action
  type: curation-action-kind
  required: true
- name: target_kind
  type: curation-target-kind
  required: true
- name: target_id
  type: string
- name: payload
  type: string
- name: reason
  type: string
- name: created_at
  type: datetime
  required: true
---

## Description

The record of one action the owner took while curating the knowledge base, naming the kind of item it acted on and, where there is one, that item.

## Responsibility

It keeps an audit trail of what curation changed and why.

=== domain/knowledge-base/curation-action-filter
---
type: value-object
attributes:
- name: action
  type: curation-action-kind
- name: target_kind
  type: curation-target-kind
- name: target_id
  type: string
- name: created_from
  type: datetime
- name: created_to
  type: datetime
- name: page
  type: page
---

## Description

What a listing of curation actions is narrowed to: the kind of action, the kind and identity of the item acted on, a window over creation times, and the page.

## Responsibility

None.

=== domain/knowledge-base/curation-action-kind
---
type: enumeration
values:
- resolve-entity-match
- merge-nodes
- resolve-dispute
- confirm-item
- reject-item
- correct-item
- compliance-delete
---

## Description

The kinds of action a curation action records.

## Responsibility

None.

=== domain/knowledge-base/curation-action.log
---
entries:
- field: attributes.payload.type
  unstated: The material holds a curation action's payload as a structured document without giving its shape.
  decided: string
  why: Nothing in the material reads inside it, so it is carried whole as text.
- field: attributes.target_id.type
  unstated: The material names the item a curation action acted on without saying what kind of identity it is.
  decided: string
  why: The action targets items of several kinds, so no single element's identity fits it.
- field: type
  unstated: The material does not say whether a curation action has an identity of its own or belongs to what it acted on.
  decided: aggregate-root
  why: Each action is recorded once and never changes, and nothing it acted on holds it.
- field: attributes.action.type
  unstated: The material closes the action a curation-action listing filters by to seven kinds, while the recorded action and the value written take any text; the two decide differently for a curation action recorded under a kind outside the seven.
  decided: curation-action-kind
  why: An action recorded under a kind no listing can filter for is one the audit trail cannot find by its kind.
- field: attributes.target_kind.type
  unstated: The material closes the target kind a curation-action listing filters by to five kinds, while the recorded target kind and the value written take any text; the two decide differently for a curation action recorded on a target kind outside the five.
  decided: curation-target-kind
  why: An action recorded on a target kind no listing can filter for is one the audit trail cannot find by what it acted on.
---

=== domain/knowledge-base/curation-metrics
---
type: value-object
attributes:
- name: accept_rate
  type: decimal
  required: true
- name: reject_rate_by_code
  type: reject-rate
  many: true
- name: needs_review_count
  type: integer
  required: true
- name: uncertain_count
  type: integer
  required: true
- name: disputed_count
  type: integer
  required: true
- name: entity_match_queue_count
  type: integer
  required: true
- name: disputed_queue_count
  type: integer
  required: true
- name: computed_at
  type: datetime
  required: true
---

## Description

A snapshot of how curation stands: how often actions accept, how often they reject by error code, and how many nodes and assertions await the owner.

## Responsibility

It is what the owner calibrates the confidence thresholds against.

=== domain/knowledge-base/curation-metrics.log
---
entries:
- field: attributes.reject_rate_by_code.type
  unstated: The material gives the reject rate by code as a map from error code to rate without a shape the model can name.
  decided: reject-rate, many
  why: Each entry of the map pairs one code with one rate.
---

=== domain/knowledge-base/curation-target-kind
---
type: enumeration
values:
- node
- link
- attribute
- fragment
- raw-information
---

## Description

The kinds of item a curation action can act on.

## Responsibility

None.

=== domain/knowledge-base/database-status
---
type: enumeration
values:
- ok
- unreachable
---

## Description

Whether the store answered the health probe.

## Responsibility

None.

=== domain/knowledge-base/directed-ingestion
---
type: value-object
attributes:
- name: source_label
  type: string
- name: items
  type: directed-item
  required: true
  many: true
---

## Description

A batch of fragments, nodes, attributes and links the owner states directly, ingested without a language model reading anything.

## Responsibility

It lets the owner record knowledge exactly as they state it.

=== domain/knowledge-base/directed-ingestion.log
---
entries:
- field: type
  unstated: The material describes a directed ingestion's request and report without saying whether it has an identity of its own.
  decided: value-object
  why: It is recorded only through the raw information and LLM run it produces.
---

=== domain/knowledge-base/directed-item
---
type: value-object
attributes:
- name: ref
  type: string
  required: true
- name: kind
  type: directed-item-kind
  required: true
- name: status
  type: directed-item-status
---

## Description

One fragment, node, attribute or link of a directed ingestion, named by the reference the other items use for it, with how it fared.

## Responsibility

None.

=== domain/knowledge-base/directed-item-kind
---
type: enumeration
values:
- fragment
- node
- attribute
- link
---

## Description

The kind of knowledge a directed item states.

## Responsibility

None.

=== domain/knowledge-base/directed-item-status
---
type: enumeration
values:
- accepted
- consolidated
- superseded-previous
- needs-review
- uncertain
- disputed
- rejected
- error
- dependency-failed
---

## Description

How one directed item fared.

## Responsibility

None.

=== domain/knowledge-base/dispute-decision
---
type: enumeration
values:
- prefer-one
- adjust-periods
- keep-disputed
---

## Description

What the owner decides about disputed assertions: that one of them holds, that each holds over its own validity period, or that the dispute stands.

## Responsibility

None.

=== domain/knowledge-base/dispute-resolution
---
type: value-object
attributes:
- name: assertion_kind
  type: assertion-kind
  required: true
- name: item_ids
  type: string
  required: true
  many: true
- name: decision
  type: dispute-decision
  required: true
- name: winner_id
  type: string
- name: periods
  type: adjusted-period
  many: true
- name: reason
  type: string
---

## Description

The owner's decision about the disputed assertions of one dispute scope, naming the one that holds or the period each holds over, and why.

## Responsibility

It carries the decision that closes or keeps a dispute.

=== domain/knowledge-base/dispute-resolution.log
---
entries:
- field: attributes.item_ids.type
  unstated: The material names the items a dispute resolution acts on by identity without saying what kind of identity that is.
  decided: string
  why: The items are knowledge links or node attributes by the resolution's kind, so no single element's identity fits them.
---

=== domain/knowledge-base/dispute-scope
---
type: value-object
attributes:
- name: assertion_kind
  type: assertion-kind
  required: true
relationships:
- target: knowledge-node
  type: reference
  cardinality: 0..1
  role: source
- target: knowledge-node
  type: reference
  cardinality: 0..1
  role: target
- target: link-type
  type: reference
  cardinality: 0..1
- target: knowledge-node
  type: reference
  cardinality: 0..1
  role: node
- target: attribute-key
  type: reference
  cardinality: 0..1
---

## Description

The ground on which disputed assertions compete.

## Responsibility

It is what one dispute is about, so the assertions that compete are listed and resolved together.

=== domain/knowledge-base/document-context
---
type: value-object
attributes:
- name: summary
  type: string
  required: true
- name: entities
  type: document-entity
  many: true
- name: model
  type: string
  required: true
---

## Description

What a preliminary reading of a whole document yields before an extraction reads its chunks: a short summary and the entities the document speaks of, with the model that read it.
It is a reading aid shown to the model and never a source of knowledge.

## Responsibility

It lets each chunk be read knowing what the rest of the document says, and keeps on record what the model was shown.

=== domain/knowledge-base/document-context-status
---
type: enumeration
values:
- produced
- single-chunk
- too-long
- failed
---

## Description

Whether an extraction produced a document context before reading its chunks, and why not when it did not.

## Responsibility

None.

=== domain/knowledge-base/document-context.log
---
entries:
- field: attributes.model
  unstated: The material gives the preliminary reading its own configured model without saying whether the run records which model produced its context.
  decided: The document context records the model that produced it.
  why: The context is kept for audit, and the extraction model recorded on the run is not the one that read the document first.
---

=== domain/knowledge-base/document-entity
---
type: value-object
attributes:
- name: names
  type: string
  required: true
  many: true
relationships:
- target: node-type
  type: reference
  cardinality: '1'
---

## Description

One entity a document context lists: its node type and the names the document uses for it.

## Responsibility

It tells the model, while it reads any one chunk, which names elsewhere in the document denote the same entity.

=== domain/knowledge-base/document-entity.log
---
entries:
- field: attributes.names.required
  unstated: The material lists each entity with the names the document uses for it without saying whether an entity may carry none.
  decided: 'true'
  why: An entity listed with no name gives the model nothing to recognise in a chunk.
---

=== domain/knowledge-base/effective-status
---
type: enumeration
values:
- active
- inactive
- uncertain
- disputed
- superseded
- deleted
---

## Description

The status a knowledge link or node attribute is read with on a given day: its stored assertion status, or inactive where an active assertion has ended.

## Responsibility

It lets an ended assertion read as inactive without that state ever being stored.

=== domain/knowledge-base/entity-match-decision
---
type: enumeration
values:
- merge-into
- keep-separate
---

## Description

What the owner decides about a knowledge node awaiting an entity-match decision: that it is another node and merges into it, or that it is an entity of its own.

## Responsibility

None.

=== domain/knowledge-base/entity-match-resolution
---
type: value-object
attributes:
- name: decision
  type: entity-match-decision
  required: true
- name: reason
  type: string
relationships:
- target: knowledge-node
  type: reference
  cardinality: '1'
  role: node
- target: knowledge-node
  type: reference
  cardinality: 0..1
  role: target
---

## Description

The owner's decision about one knowledge node awaiting an entity-match decision, naming the node it merges into when it merges, and why.

## Responsibility

It carries the decision that closes an entity-match review.

=== domain/knowledge-base/entity-match-review
---
type: aggregate-root
attributes:
- name: similarity
  type: decimal
  required: true
relationships:
- target: knowledge-node
  type: reference
  cardinality: '1'
  role: node
- target: knowledge-node
  type: reference
  cardinality: '1'
  role: candidate
---

## Description

The record that a newly created knowledge node resembles an existing one closely enough that the owner must decide whether they are the same entity.

## Responsibility

It is the curation queue's entry for an ambiguous entity.

=== domain/knowledge-base/entity-match-review.log
---
entries:
- field: type
  unstated: The material records entity match reviews without saying what owns them.
  decided: aggregate-root
  why: Each review is worked on its own in the curation queue, apart from the nodes it pairs.
---

=== domain/knowledge-base/fragment-status
---
type: enumeration
values:
- proposed
- accepted
- rejected
- superseded
- deleted
---

## Description

The state an information fragment is in.

## Responsibility

None.

=== domain/knowledge-base/fragment-status.log
---
entries:
- field: values
  unstated: The documentation lists four fragment states and leaves out superseded, which the standing node holds; the two decide differently for a fragment that was superseded.
  decided: The five values stand, superseded included.
  why: The first increment's material is the newer reading of the states fragments are held in, and the documentation's list predates it.
---

=== domain/knowledge-base/graph-read
---
type: enumeration
values:
- node-read
- link-read
- attribute-read
- link-history
- attribute-history
- attribute-key-history
- traversal
---

## Description

The reads that show knowledge links and node attributes with their provenance: a knowledge node with its attributes, one knowledge link or node attribute, the history of one, the history of one attribute key on a node, and a traversal.

## Responsibility

None.

=== domain/knowledge-base/health-report
---
type: value-object
attributes:
- name: ok
  type: boolean
  required: true
- name: service
  type: string
  required: true
- name: database
  type: database-status
  required: true
- name: checked_at
  type: datetime
  required: true
---

## Description

What the health probe reports: whether the system is healthy, the service's name, whether the store answered, and when the probe ran.

## Responsibility

It lets the owner and the operator see whether the system can serve.

=== domain/knowledge-base/health-report.log
---
entries:
- field: type
  unstated: The material gives the health report's shape without saying whether it has an identity or which context it belongs to.
  decided: value-object in the knowledge-base context
  why: Nothing identifies one report, and the system has no context of its own for operating it.
---

=== domain/knowledge-base/information-fragment
---
type: aggregate-root
attributes:
- name: text
  type: string
  required: true
- name: confidence
  type: decimal
  required: true
- name: status
  type: fragment-status
  required: true
- name: created_at
  type: datetime
  required: true
- name: superseded_at
  type: datetime
relationships:
- target: raw-chunk
  type: association
  cardinality: 1..*
  role: source
- target: llm-run
  type: reference
  cardinality: '1'
---

## Description

A piece of knowledge a language model proposed from the chunks of a raw information, with the confidence it gave it.

## Responsibility

It is the link between what a source says and the assertions the graph holds.

=== domain/knowledge-base/information-fragment.log
---
entries:
- field: attributes.llm_run.type
  unstated: The material names the LLM run a fragment came from only as a filter and a listed field.
  decided: string
  why: The retrieval uses the run only as an identifier to filter by and to show, and reads nothing else about it.
- field: attributes.llm_run.type
  retired: The fragment's LLM run is now the reference to domain/knowledge-base/llm-run in information-fragment's relationships.
---

=== domain/knowledge-base/ingest-tool
---
type: enumeration
values:
- propose-fragment
- propose-node
- propose-link
- propose-attribute
---

## Description

The kind of proposal a tool call records.
The material spells the values `propose_fragment`, `propose_node`, `propose_link` and `propose_attribute`.

## Responsibility

None.

=== domain/knowledge-base/item-kind
---
type: enumeration
values:
- node
- link
- fragment
---

## Description

What a search item stands for.

## Responsibility

None.

=== domain/knowledge-base/item-kind.log
---
entries:
- field: values
  unstated: The system specification lists attribute as a search item kind, while the domain documentation says an attribute is never a search item; the two decide differently for a node attribute matching a search.
  decided: node, link and fragment, with attribute not a kind.
  why: The domain documentation states the exclusion deliberately and the standing node already holds it.
---

=== domain/knowledge-base/knowledge-link
---
type: aggregate-root
attributes:
- name: status
  type: assertion-status
  required: true
- name: recorded_at
  type: datetime
- name: valid_from
  type: date
- name: valid_to
  type: date
- name: provenance
  type: provenance
  many: true
- name: valid_from_source
  type: valid-from-basis
- name: confidence
  type: decimal
- name: superseded_at
  type: datetime
relationships:
- target: knowledge-node
  type: reference
  cardinality: '1'
  role: source
- target: knowledge-node
  type: reference
  cardinality: '1'
  role: target
- target: link-type
  type: reference
  cardinality: '1'
- target: llm-run
  type: reference
  cardinality: 0..1
- target: knowledge-link
  type: reference
  cardinality: 0..1
  role: supersedes
---

## Description

A relation of one link type asserted from a source knowledge node to a target knowledge node.

## Responsibility

It is the edge the graph is traversed along.

=== domain/knowledge-base/knowledge-link.log
---
entries:
- field: attributes.valid_from.type
  unstated: The material compares a link's validity start with a date without naming its type.
  decided: date
  why: The as-of date it is compared with is a calendar date.
- field: attributes.valid_to.type
  unstated: The material compares a link's validity end with a date without naming its type.
  decided: date
  why: The as-of date it is compared with is a calendar date.
- field: relationships.llm-run.cardinality
  unstated: The standing node gives every knowledge link exactly one run, while the material's correction records the new link with no run; the two decide differently for a link a correction records.
  decided: 0..1
  why: A correction is an owner's act outside any extraction run, and the material records its new link with the run left empty.
---

=== domain/knowledge-base/knowledge-node
---
type: aggregate-root
attributes:
- name: canonical_name
  type: string
  required: true
- name: status
  type: node-status
  required: true
relationships:
- target: node-alias
  type: composition
  cardinality: 1..*
- target: knowledge-node
  type: reference
  cardinality: 0..1
  role: merged-into
- target: node-type
  type: reference
  cardinality: '1'
---

## Description

An entity the graph refers to, known by a canonical name and by its aliases.

## Responsibility

It is what links and attributes are asserted about.

=== domain/knowledge-base/knowledge-node.log
---
entries:
- field: type
  unstated: The material leaves open whether the records the retrieval reads, written by other modules, are upstream contracts or elements of another context.
  decided: aggregate-root in the same knowledge-base context, as every other record the retrieval reads
  why: The retrieval reads those records under the same names and meanings the rest of the system writes them with, so no translation marks a context boundary.
- field: relationships.node-alias.cardinality
  unstated: The material does not say whether a knowledge node can have no alias.
  decided: 1..*
  why: The node layer reaches a node only through its aliases, so a node without one could never be found.
---

=== domain/knowledge-base/link-type
---
type: aggregate-root
attributes:
- name: name
  type: string
  required: true
- name: label
  type: string
  required: true
- name: inverse_name
  type: string
  required: true
- name: description
  type: string
  required: true
- name: is_temporal
  type: boolean
  required: true
- name: allows_multiple_current
  type: boolean
  required: true
- name: requires_valid_from
  type: boolean
  required: true
- name: requires_valid_to_on_change
  type: boolean
  required: true
- name: version
  type: integer
  required: true
relationships:
- target: link-type-rule
  type: composition
  cardinality: 0..*
---

## Description

A named kind of relation the catalog holds.

## Responsibility

It fixes which relations a link may assert.

=== domain/knowledge-base/link-type-rule
---
type: entity
aggregate: link-type
attributes:
- name: valid_from
  type: date
- name: valid_to
  type: date
relationships:
- target: node-type
  type: reference
  cardinality: '1'
  role: source
- target: node-type
  type: reference
  cardinality: '1'
  role: target
---

## Description

The catalog's permission for links of one link type from knowledge nodes of one node type to knowledge nodes of another, over a span of days.

## Responsibility

It fixes which pairs of node types a link type may join.

=== domain/knowledge-base/link-type-rule.log
---
entries:
- field: type
  unstated: The material holds link type rules without saying which record owns them.
  decided: entity inside the link-type aggregate
  why: A rule is looked up by its link type and has no meaning apart from it.
---

=== domain/knowledge-base/llm-run
---
type: aggregate-root
display: LLMRun
attributes:
- name: model
  type: string
  required: true
- name: prompt_version
  type: string
  required: true
- name: status
  type: run-status
  required: true
- name: attempts
  type: integer
  required: true
- name: started_at
  type: datetime
  required: true
- name: finished_at
  type: datetime
- name: idempotency_key
  type: string
  required: true
- name: document_context
  type: document-context
- name: document_context_status
  type: document-context-status
- name: summary
  type: run-summary
relationships:
- target: raw-information
  type: reference
  cardinality: '1'
- target: tool-call
  type: composition
  cardinality: 0..*
operations:
- complete
- fail
- retry
---

## Description

One pass of extraction over a raw information, made by a named model under a named prompt version.
Its tool calls are the record of every proposal made within it.

## Responsibility

It is the unit every proposal is made within and accounted for.

=== domain/knowledge-base/llm-run.log
---
entries:
- field: type
  unstated: The material does not say whether LLM runs and their tool calls belong to the knowledge base's context or to a context of their own.
  decided: aggregate-root in the knowledge-base context
  why: Ingestion writes the raw informations, fragments, nodes, links and attributes the retrieval reads under the same names and meanings, so no translation marks a boundary between them.
---

=== domain/knowledge-base/merge-counts
---
type: value-object
attributes:
- name: links_repointed
  type: integer
  required: true
- name: attributes_repointed
  type: integer
  required: true
- name: aliases_copied
  type: integer
  required: true
- name: path_compressed_nodes
  type: integer
  required: true
---

## Description

How many knowledge links and node attributes one merge moved to the survivor, how many aliases it copied, and how many previously merged knowledge nodes it made name the survivor.

## Responsibility

It records the reach of a merge.

=== domain/knowledge-base/node-alias
---
type: entity
aggregate: knowledge-node
attributes:
- name: alias
  type: string
  required: true
- name: kind
  type: alias-kind
  required: true
- name: created_at
  type: datetime
relationships:
- target: llm-run
  type: reference
  cardinality: 0..1
---

## Description

One name a knowledge node is known by.

## Responsibility

It lets a node be found under any name a source used for it.

=== domain/knowledge-base/node-attribute
---
type: aggregate-root
attributes:
- name: value
  type: string
  required: true
- name: status
  type: assertion-status
  required: true
- name: recorded_at
  type: datetime
- name: provenance
  type: provenance
  many: true
- name: valid_from
  type: date
- name: valid_to
  type: date
- name: valid_from_source
  type: valid-from-basis
- name: confidence
  type: decimal
- name: superseded_at
  type: datetime
relationships:
- target: knowledge-node
  type: reference
  cardinality: '1'
- target: attribute-key
  type: reference
  cardinality: '1'
- target: llm-run
  type: reference
  cardinality: 0..1
- target: node-attribute
  type: reference
  cardinality: 0..1
  role: supersedes
---

## Description

A literal value asserted about a knowledge node.

## Responsibility

It holds what is known about a node that is not a relation to another node.

=== domain/knowledge-base/node-attribute.log
---
entries:
- field: relationships.llm-run.cardinality
  unstated: The standing node gives every node attribute exactly one run, while the material's correction records the new attribute with no run; the two decide differently for an attribute a correction records.
  decided: 0..1
  why: A correction is an owner's act outside any extraction run, and the material records its new attribute with the run left empty.
---

=== domain/knowledge-base/node-filter
---
type: value-object
attributes:
- name: name_prefix
  type: string
- name: status
  type: node-status
- name: page
  type: page
relationships:
- target: node-type
  type: reference
  cardinality: 0..1
---

## Description

What a listing of knowledge nodes is narrowed to: a node type, the start of a name, a node status, and the page.

## Responsibility

None.

=== domain/knowledge-base/node-match
---
type: enumeration
values:
- exact
- approximate
---

## Description

How the node layer matched a knowledge node: through the lexical parse of the query text, or by the trigram similarity of one of its aliases to it.

## Responsibility

None.

=== domain/knowledge-base/node-merge
---
type: value-object
attributes:
- name: reason
  type: string
  required: true
relationships:
- target: knowledge-node
  type: reference
  cardinality: '1'
  role: survivor
- target: knowledge-node
  type: reference
  cardinality: '1'
  role: absorbed
---

## Description

The owner's request that one active knowledge node be absorbed into another, found to be the same entity, and why.

## Responsibility

It carries the merge of two nodes the owner found to be one entity.

=== domain/knowledge-base/node-resolution
---
type: enumeration
values:
- matched-existing
- created-new
- needs-review
---

## Description

How a node proposal was resolved against the knowledge nodes already held.

## Responsibility

None.

=== domain/knowledge-base/node-status
---
type: enumeration
values:
- active
- needs-review
- merged
- deleted
---

## Description

The state a knowledge node is in.

## Responsibility

None.

=== domain/knowledge-base/node-type
---
type: aggregate-root
attributes:
- name: name
  type: string
  required: true
- name: description
  type: string
  required: true
- name: version
  type: integer
  required: true
---

## Description

A named kind of entity the catalog holds.

## Responsibility

It fixes which kinds of entity a knowledge node may be.

=== domain/knowledge-base/node-view
---
type: value-object
attributes:
- name: as_of
  type: date
- name: in_effect_only
  type: boolean
- name: include_uncertain
  type: boolean
---

## Description

How a node read shows its knowledge node's attributes: as of which day, whether only those in effect, and whether uncertain ones are included.

## Responsibility

None.

=== domain/knowledge-base/page
---
type: value-object
attributes:
- name: limit
  type: integer
- name: offset
  type: integer
---

## Description

A window over an ordered result: how many items to skip and how many to return.

## Responsibility

None.

=== domain/knowledge-base/prompt-version
---
type: enumeration
values:
- v1
- v2
- v3
- v4
- v5
---

## Description

The versions of extraction instructions an extraction can run under.

## Responsibility

None.

=== domain/knowledge-base/proposal
---
type: value-object
attributes:
- name: kind
  type: ingest-tool
  required: true
- name: confidence
  type: decimal
- name: change_hint
  type: change-hint
- name: value
  type: string
- name: valid_from
  type: date
- name: valid_to
  type: date
- name: valid_from_basis
  type: valid-from-basis
relationships:
- target: llm-run
  type: reference
  cardinality: '1'
- target: information-fragment
  type: association
  cardinality: 0..*
  role: evidence
- target: raw-chunk
  type: association
  cardinality: 0..*
  role: source
---

## Description

What a language model or the owner puts forward within an LLM run for the knowledge base to take: a fragment, a node, a link or an attribute.
A fragment proposal cites the raw chunks it was read from; a link or attribute proposal cites the information fragments it rests on and may claim validity dates.
An attribute proposal carries its value as text, whatever the value type of its attribute key.

## Responsibility

It is what validation judges before anything reaches the knowledge base.

=== domain/knowledge-base/proposal.log
---
entries:
- field: type
  unstated: The material names four proposal operations without naming what they carry as one concept.
  decided: value-object, carrying the kind, confidence, change hint, validity dates and basis, the LLM run and what it cites
  why: Every check and consolidation of the four operations is stated about what is proposed, and a proposal has no identity before it is taken.
- field: attributes.value.type
  unstated: No node said in what form an attribute proposal carries its value, or whether that form follows its attribute key's value type.
  decided: string — an attribute proposal carries its value as text, whatever the value type of its attribute key.
  why: rules/knowledge-base/attribute-value-parses judges every value as written text, against a pattern for each value type, and an attribute correction's value is already declared as a string in corrected-values. A value that came in already typed as a number or a boolean could not be checked against those patterns.
---

=== domain/knowledge-base/provenance
---
type: value-object
attributes:
- name: recorded_at
  type: datetime
  required: true
relationships:
- target: information-fragment
  type: reference
  cardinality: '1'
---

## Description

The record that a link or an attribute was asserted on the strength of one information fragment, and when that was recorded.

## Responsibility

It lets every assertion be traced back to its source.

=== domain/knowledge-base/raw-chunk
---
type: entity
aggregate: raw-information
attributes:
- name: chunk_index
  type: integer
  required: true
- name: offset_start
  type: integer
- name: offset_end
  type: integer
- name: text
  type: string
  required: true
- name: locator
  type: chunk-locator
- name: superseded_at
  type: datetime
- name: chunking_version
  type: string
- name: status
  type: node-status
  required: true
---

## Description

One contiguous slice of a raw information's content, at a known position in it.
A chunk with a supersession time has been superseded and is no longer current.

## Responsibility

It anchors an information fragment to the exact place in the source it was read from.

=== domain/knowledge-base/raw-chunk.log
---
entries:
- field: attributes.locator.type
  unstated: The material names a chunk's locator without giving its shape.
  decided: string
  why: The retrieval only passes the locator through to the owner.
- field: attributes.locator.type
  unstated: The earlier decision read a chunk's locator as an opaque string the retrieval passes through, while the code declares it as an object of the optional keys page, line, speaker and ts, the whole nullable.
  decided: chunk-locator
  why: The owner holds the code as the truth, and a plain string fails the object the code declares.
- field: attributes
  unstated: The earlier decision named the chunk's text and offsets excerpt, start_offset and end_offset, while the code names them text, offset_start and offset_end in every shape that carries a chunk.
  decided: The chunk's attributes are named text, offset_start and offset_end.
  why: The owner holds the code as the truth, and no shape in the code uses the earlier names.
---

=== domain/knowledge-base/raw-information
---
type: aggregate-root
attributes:
- name: source_type
  type: source-type
  required: true
- name: received_at
  type: datetime
  required: true
- name: content
  type: string
  required: true
- name: title
  type: string
- name: metadata
  type: string
- name: original_input
  type: string
- name: content_hash
  type: string
  required: true
- name: document_date
  type: date
- name: storage_ref
  type: string
- name: status
  type: node-status
  required: true
- name: superseded_at
  type: datetime
relationships:
- target: raw-chunk
  type: composition
  cardinality: 1..*
---

## Description

A piece of unstructured information the owner supplied, preserved as it was received.
Its metadata is a free-form set of named values.

## Responsibility

It is the source every extracted piece of knowledge traces back to.

=== domain/knowledge-base/raw-information.log
---
entries:
- field: relationships.raw-chunk.cardinality
  unstated: The material does not say whether a raw information can hold no chunk.
  decided: 1..*
  why: Every fragment is attributed to a chunk of its raw information, so a raw information without a chunk would yield nothing to read.
- field: attributes.metadata.type
  unstated: The material names a raw information's metadata without giving its shape.
  decided: string
  why: The retrieval only passes the metadata through to the owner and reads nothing inside it.
- field: attributes.document_date.type
  unstated: The material reads a document date from a raw information's metadata without naming its type.
  decided: date
  why: It is used as a validity start, which is a calendar date.
- field: attributes.metadata.type
  unstated: The earlier decision read metadata as an opaque string, while the code carries it as an object of named values of any kind.
  decided: string
  why: The type vocabulary has no free-form set of named values, so the type stays string as it does for a tool call's arguments, and the node's description states the shape.
---

=== domain/knowledge-base/reject-rate
---
type: value-object
attributes:
- name: code
  type: string
  required: true
- name: rate
  type: decimal
  required: true
---

## Description

The share of curation actions that are rejections carrying one error code.

## Responsibility

None.

=== domain/knowledge-base/review-queue-filter
---
type: value-object
attributes:
- name: kind
  type: review-queue-kind
- name: page
  type: page
---

## Description

What a review queue listing is narrowed to: which queue, and the page.

## Responsibility

None.

=== domain/knowledge-base/review-queue-kind
---
type: enumeration
values:
- entity-match
- disputed
---

## Description

The two review queues the owner works: knowledge nodes awaiting an entity-match decision, and disputed assertions.

## Responsibility

None.

=== domain/knowledge-base/run-status
---
type: enumeration
values:
- running
- completed
- failed
---

## Description

The state an LLM run is in.

## Responsibility

None.

=== domain/knowledge-base/run-summary
---
type: value-object
attributes:
- name: accepted
  type: integer
  required: true
- name: consolidated
  type: integer
  required: true
- name: superseded_previous
  type: integer
  required: true
- name: needs_review
  type: integer
  required: true
- name: uncertain
  type: integer
  required: true
- name: disputed
  type: integer
  required: true
- name: rejected
  type: integer
  required: true
- name: error
  type: integer
  required: true
- name: orphaned_fragments
  type: integer
  required: true
---

## Description

The count of an LLM run's tool calls by validation outcome, with the count of its orphaned information fragments.

## Responsibility

It shows the owner at a glance what a run produced and what it left unused.

=== domain/knowledge-base/search-item
---
type: value-object
attributes:
- name: kind
  type: item-kind
  required: true
- name: layer
  type: search-layer
  required: true
- name: score
  type: decimal
  required: true
- name: hop
  type: integer
  required: true
- name: summary
  type: string
  required: true
- name: flags
  type: assertion-flag
  many: true
- name: match
  type: node-match
- name: similarity
  type: decimal
relationships:
- target: information-fragment
  type: association
  cardinality: 1..*
  role: provenance
---

## Description

One ranked answer of a search: a knowledge node, a knowledge link or an information fragment, with the fragments that support it.

## Responsibility

It tells the owner what matched, how strongly, and where it came from.

=== domain/knowledge-base/search-item.log
---
entries:
- field: attributes.layer.required
  unstated: The material does not say whether every search item carries a layer.
  decided: A search item always carries a layer.
  why: The search service assigns a layer to every node, link and fragment item it returns.
- field: attributes.hop.required
  unstated: The material does not say whether every search item carries a hop.
  decided: A search item always carries a hop, 0 for an item matched directly.
  why: The search service gives every item a hop and its tests assert one on node, link and fragment items alike.
- field: attributes.summary.required
  unstated: The material does not say whether every search item carries a summary.
  decided: A search item always carries a summary.
  why: The search service builds a summary for every node, link and fragment item it returns.
---

=== domain/knowledge-base/search-layer
---
type: enumeration
values:
- fragment
- node
- chunk
---

## Description

The kinds of knowledge a search matches its text against.

## Responsibility

None.

=== domain/knowledge-base/search-query
---
type: value-object
attributes:
- name: text
  type: string
  required: true
- name: layers
  type: search-layer
  many: true
- name: expand
  type: boolean
- name: expand_depth
  type: integer
- name: link_types
  type: string
  many: true
- name: as_of
  type: date
- name: in_effect_only
  type: boolean
- name: include_uncertain
  type: boolean
- name: page
  type: page
---

## Description

What the owner asks a search for: a text, the layers to read, how to expand through the graph, and which page of results to return.
Link types are named by their catalog name.

## Responsibility

It carries every choice the owner makes about one search.

=== domain/knowledge-base/source-type
---
type: enumeration
values:
- pdf
- email
- meeting-minutes
- chat
- article
- transcript
- other
---

## Description

The kind of source a raw information was received as.
The material's own words for four of the values are `ata` (meeting-minutes), `artigo` (article), `transcricao` (transcript) and `outro` (other).

## Responsibility

It tells the owner what kind of source a piece of knowledge came from.

=== domain/knowledge-base/tool-call
---
type: entity
aggregate: llm-run
attributes:
- name: tool_name
  type: ingest-tool
  required: true
- name: arguments
  type: string
- name: result
  type: string
- name: validation_outcome
  type: validation-outcome
  required: true
- name: created_at
  type: datetime
  required: true
---

## Description

The record of one proposal made within an LLM run: what was proposed, what it was answered and how validation judged it.

## Responsibility

It keeps every proposal accountable, whether it was taken or refused.

=== domain/knowledge-base/tool-call.log
---
entries:
- field: attributes.arguments.type
  unstated: The material records a tool call's arguments as a free-form object without giving them a shape.
  decided: string
  why: Nothing in the material reads inside the arguments; they are kept and shown as recorded.
- field: attributes.result.type
  unstated: The material records a tool call's result as a free-form object without giving it a shape.
  decided: string
  why: Nothing in the material reads inside the result except the outcome, which the validation outcome already holds.
---

=== domain/knowledge-base/traversal-direction
---
type: enumeration
values:
- out
- in
- both
---

## Description

Which end of a knowledge link a traversal follows it from: its source, its target, or either.

## Responsibility

None.

=== domain/knowledge-base/traversal-request
---
type: value-object
attributes:
- name: direction
  type: traversal-direction
- name: link_types
  type: string
  many: true
- name: depth
  type: integer
- name: as_of
  type: date
- name: in_effect_only
  type: boolean
relationships:
- target: knowledge-node
  type: reference
  cardinality: '1'
---

## Description

What the owner asks a traversal for: the knowledge node it starts from, which way to follow links, which link types, how many hops, and as of which day.
Link types are named by their catalog name.

## Responsibility

None.

=== domain/knowledge-base/valid-from-basis
---
type: enumeration
values:
- stated
- document
- received
---

## Description

What justifies an assertion's validity start: a date the source states, the document's own date, or the date the source was received.

## Responsibility

None.

=== domain/knowledge-base/validation-outcome
---
type: enumeration
values:
- accepted
- consolidated
- superseded-previous
- needs-review
- uncertain
- disputed
- rejected
- error
---

## Description

How validation judged the proposal one tool call records.

## Responsibility

None.

=== domain/knowledge-base/value-type
---
type: enumeration
values:
- date
- number
- text
- bool
---

## Description

The type the values of an attribute key take.

## Responsibility

None.

=== domain/owner-access/_context
---
strategic: supporting
---

## Description

Owner access holds how the owner signs in to the application and what the owner is told when signing in fails.

## Responsibility

It turns the credentials the owner types into an access token the application holds and takes the owner to where they were going.

=== domain/owner-access/_context.log
---
entries:
- field: strategic
  unstated: The material does not say whether signing in is where the business differs or a solved problem.
  decided: supporting
  why: Signing in only gates the application behind an external identity provider and holds nothing the business differs on, so it is specific to this application without being core.
---

=== domain/owner-access/sign-in-attempt
---
type: aggregate-root
attributes:
- name: credentials
  type: sign-in-credentials
  required: true
- name: failure_kind
  type: sign-in-failure-kind
- name: destination
  type: sign-in-destination
operations:
- submit-credentials
- request-access-token
- classify-failure
- resolve-destination
---

## Description

One try of the owner at signing in, from the credentials typed to the destination reached.

## Responsibility

It keeps what the owner typed, the kind of the failure shown and the destination chosen, so that each try starts clean.

=== domain/owner-access/sign-in-credentials
---
type: value-object
attributes:
- name: email
  type: string
  required: true
- name: password
  type: string
  required: true
---

## Description

The e-mail address and the password the owner types into the sign-in form, labelled "Login" and "Senha" on screen.

## Responsibility

It carries what the identity provider needs to recognise the owner.

=== domain/owner-access/sign-in-credentials.log
---
entries:
- field: attributes
  unstated: The material names the two fields login and senha, in Portuguese, while the specification is written in English.
  decided: The attributes are email and password, and the labels Login and Senha stay in the description.
  why: The material's own words are the on-screen labels and the specification translates names, so the e-mail address the field holds is named for what it is.
---

=== domain/owner-access/sign-in-destination
---
type: value-object
attributes:
- name: path
  type: string
  required: true
---

## Description

The address inside the application the owner is taken to after signing in.

## Responsibility

It keeps the owner from being sent anywhere outside the application.

=== domain/owner-access/sign-in-failure-kind
---
type: enumeration
values:
- credential
- network
- session
- unknown
---

## Description

The kinds a failed sign-in falls into, each with its own message to the owner.

## Responsibility

It names the one category of failure the owner is told about.

=== rules/application-shell/a-401-is-answered-with-one-silent-refresh
---
type: invariant
statement: "A first-attempt 401 MUST make the helper ask the identity provider once for a fresh access token with the session cookie, whether the request is an ingestion or not."
constrains:
- domain/application-shell/request-helper
---

## Description

None.

=== rules/application-shell/a-bubble-shows-its-tool-chips-first
---
type: invariant
statement: "A bubble given tool calls MUST show one chip per call above the text in the order given, each chip showing only the tool's name, pending when ok is null, ok when true and error when false, by colour only."
constrains:
- domain/application-shell/message-bubble
---

## Description

None.

=== rules/application-shell/a-bubble-shows-plain-text
---
type: invariant
statement: "A bubble MUST show its message text as plain text exactly as given with its line breaks kept, accepting an empty text."
constrains:
- domain/application-shell/message-bubble
---

## Description

None.

=== rules/application-shell/a-bubble-state-is-resolved-in-order
---
type: invariant
statement: "A bubble's state MUST be resolved in the order error, streaming, stopped and idle."
constrains:
- domain/application-shell/message-bubble
---

## Description

None.

=== rules/application-shell/a-bubble-takes-one-role
---
type: invariant
statement: "A message bubble MUST take exactly one message role and the role MUST decide the side and the fill of the bubble."
constrains:
- domain/application-shell/message-bubble
---

## Description

None.

=== rules/application-shell/a-business-failure-shows-its-message
---
type: invariant
statement: "Any BUSINESS_ code MUST show a warning toast with the server's message when non-empty and \"Operação não pôde ser concluída.\" otherwise."
constrains:
- domain/application-shell/failure-router
---

## Description

None.

=== rules/application-shell/a-conversation-resource-is-recognised-by-its-key
---
type: invariant
statement: "A read or write MUST count as a single conversation's when its key has at least two elements, the first being conversations and the second a non-empty string other than list, and a write without a key MUST NOT."
constrains:
- domain/application-shell/failure-router
---

## Description

None.

=== rules/application-shell/a-conversation-row-labels-its-actions
---
type: invariant
statement: "A conversation row MUST label its actions Renomear, Arquivar, Reativar and Excluir, and its rename confirmation and cancellation Confirmar renomeação and Cancelar renomeação."
constrains:
- domain/application-shell/conversation-menu
---

## Description

None.

=== rules/application-shell/a-failed-envelope-keeps-its-code
---
type: invariant
statement: "A failed envelope MUST be a failure with its own code, message and details, and SYSTEM_UNKNOWN when it has no code."
constrains:
- domain/application-shell/request-helper
---

## Description

None.

=== rules/application-shell/a-failed-menu-action-does-not-navigate
---
type: invariant
statement: "A failed create, archive or delete MUST NOT navigate and the menu MUST declare no failure handling."
constrains:
- domain/application-shell/conversation-menu
---

## Description

None.

=== rules/application-shell/a-failed-refresh-ends-the-session
---
type: invariant
statement: "A failed refresh MUST clear the stored token, replace the page with the sign-in address and the reason session_expired and give the caller AUTH_SESSION_EXPIRED."
constrains:
- domain/application-shell/request-helper
---

## Description

None.

=== rules/application-shell/a-failure-carries-code-status-message-and-details
---
type: invariant
statement: "A failure MUST carry its code, status and message and its details only when present."
constrains:
- domain/application-shell/request-helper
---

## Description

None.

=== rules/application-shell/a-failure-to-complete-is-timeout-abort-or-network
---
type: invariant
statement: "A request that fails to complete MUST be a timeout when it timed out, an abort when the caller aborted and a network failure otherwise, each with status 0."
constrains:
- domain/application-shell/request-helper
---

## Description

None.

=== rules/application-shell/a-field-outside-a-form-is-a-developer-error
---
type: invariant
statement: "Reading a form field's wiring outside a form field MUST raise an error that no owner sees."
constrains:
- domain/application-shell/state-badge
---

## Description

None.

=== rules/application-shell/a-forbidden-failure-reads-access-denied
---
type: invariant
statement: "AUTH_FORBIDDEN MUST be routed as a boundary and shown as a danger toast reading \"Acesso negado.\"."
constrains:
- domain/application-shell/failure-router
---

## Description

None.

=== rules/application-shell/a-fresh-owner-skips-sign-in
---
type: invariant
statement: "The sign-in address opened with a fresh token MUST redirect to the chat address and show no form, and a freshness check that fails MUST count as not fresh."
constrains:
- domain/application-shell/application-shell
---

## Description

None.

=== rules/application-shell/a-gone-resource-reads-removed-for-compliance
---
type: invariant
statement: "RESOURCE_GONE MUST be an inline removed state reading \"Esta fonte foi removida por conformidade.\" and never the server's message."
constrains:
- domain/application-shell/failure-router
---

## Description

None.

=== rules/application-shell/a-graph-node-names-its-type
---
type: invariant
statement: "A graph node MUST take one of ten node types, each with a fixed pt-BR name that is its default subtitle unless the caller overrides it, and be named by that name, a colon and its label."
constrains:
- domain/application-shell/state-badge
---

## Description

None.

=== rules/application-shell/a-graph-node-shows-its-state-by-an-icon
---
type: invariant
statement: "A node with a confidence state MUST show it as an icon-only state badge and one without MUST show no badge, a selected node showing the selection in its border instead of the state's colour."
constrains:
- domain/application-shell/state-badge
---

## Description

None.

=== rules/application-shell/a-loading-workspace-says-so-politely
---
type: invariant
statement: "The chat, ingest and curation addresses MUST show a polite status line while their workspace loads, reading Carregando conversa…, Carregando ingestão… and Carregando curadoria…."
constrains:
- domain/application-shell/application-shell
---

## Description

None.

=== rules/application-shell/a-missing-conversation-returns-to-chat
---
type: invariant
statement: "RESOURCE_NOT_FOUND on a single conversation MUST show a warning toast reading \"Conversa não encontrada.\" and navigate to the chat address with empty search without reloading."
constrains:
- domain/application-shell/failure-router
---

## Description

None.

=== rules/application-shell/a-missing-resource-elsewhere-is-an-empty-state
---
type: invariant
statement: "RESOURCE_NOT_FOUND anywhere else MUST be an inline empty state with the server's message when non-empty and \"Nenhum resultado encontrado.\" otherwise and no toast."
constrains:
- domain/application-shell/failure-router
---

## Description

None.

=== rules/application-shell/a-network-failure-reads-no-connection
---
type: invariant
statement: "SYSTEM_NETWORK MUST show a warning toast reading \"Sem conexão.\" and SYSTEM_ABORTED MUST show nothing."
constrains:
- domain/application-shell/failure-router
---

## Description

None.

=== rules/application-shell/a-read-is-retried-once
---
type: invariant
statement: "A read MUST be retried once after any failure before the failure is routed and a write MUST NEVER be retried."
constrains:
- domain/application-shell/failure-router
---

## Description

None.

=== rules/application-shell/a-read-stays-fresh-five-minutes-by-default
---
type: invariant
statement: "A read MUST stay fresh for 5 minutes by default, MUST NOT be repeated when the window regains focus and MAY override the freshness with 0 milliseconds."
constrains:
- domain/application-shell/failure-router
---

## Description

None.

=== rules/application-shell/a-refreshed-token-repeats-the-request
---
type: invariant
statement: "A successful refresh MUST store the new token and send the request once more with the same options and a fresh cutoff."
constrains:
- domain/application-shell/request-helper
---

## Description

None.

=== rules/application-shell/a-rename-sends-the-trimmed-title
---
type: invariant
statement: "Enter or the confirm control MUST send the field's text with outer whitespace trimmed, sending nothing and closing silently when it is empty, with no length limit."
constrains:
- domain/application-shell/conversation-menu
---

## Description

None.

=== rules/application-shell/a-render-failure-is-reported-and-announced
---
type: invariant
statement: "A render failure MUST be reported with its source and component stack and announced assertively as an alert."
constrains:
- domain/application-shell/application-shell
---

## Description

None.

=== rules/application-shell/a-render-failure-replaces-the-screen
---
type: invariant
statement: "A render failure under the root MUST replace the whole screen with the failure notice and a Recarregar action that reloads the page."
constrains:
- domain/application-shell/application-shell
---

## Description

None.

=== rules/application-shell/a-repeated-request-never-refreshes-again
---
type: invariant
statement: "A repeated request MUST NOT trigger a second refresh and a 401 on it MUST be judged like any answer below 500."
constrains:
- domain/application-shell/request-helper
---

## Description

None.

=== rules/application-shell/a-reported-error-stays-in-the-console
---
type: invariant
statement: "A reported error MUST be written to the console only in development and MUST NOT make any network request."
constrains:
- domain/application-shell/failure-router
---

## Description

None.

=== rules/application-shell/a-request-goes-to-the-back-end-address
---
type: invariant
statement: "Every request MUST go to the configured back end address joined with its path, a path that starts with http:// or https:// being used as given."
constrains:
- domain/application-shell/request-helper
---

## Description

None.

=== rules/application-shell/a-request-is-cut-off-after-thirty-seconds
---
type: invariant
statement: "A request that is not an ingestion request MUST be cut off after 30000 milliseconds with a timeout reading Request timed out after 30s."
constrains:
- domain/application-shell/request-helper
---

## Description

None.

=== rules/application-shell/a-request-is-judged-in-a-fixed-order
---
type: invariant
statement: "A request MUST be judged in this order, its failure to complete, a 401 on the first attempt, a status of 500 or more, a body that is not JSON and then the envelope's ok."
constrains:
- domain/application-shell/request-helper
---

## Description

None.

=== rules/application-shell/a-row-offers-its-actions
---
type: invariant
statement: "Every row MUST offer rename and delete, a conversation not archived MUST also offer archive and an archived one reactivate instead."
constrains:
- domain/application-shell/conversation-menu
---

## Description

None.

=== rules/application-shell/a-row-shows-its-title-and-archived-mark
---
type: invariant
statement: "Each row MUST show the conversation's title or Conversa sem título when null, treat a conversation as archived when its archived instant is not null and then show Arquivada hidden from assistive technology and be named with the suffix (arquivada)."
constrains:
- domain/application-shell/conversation-menu
---

## Description

None.

=== rules/application-shell/a-server-error-is-always-a-failure
---
type: invariant
statement: "An answer with status 500 or more MUST be a failure with the body's own string code and message when it has them, the whole body as details, and SYSTEM_UPSTREAM and the message made of \"Algo deu errado\" and \"Tente novamente\", each ending in a full stop, otherwise."
constrains:
- domain/application-shell/request-helper
---

## Description

None.

=== rules/application-shell/a-server-error-is-always-a-failure.log
---
entries:
- field: statement
  unstated: The request helper tells the owner a fixed message when a server error body carries none, and the rule states only the code that stands in.
  decided: The message is Algo deu errado followed by Tente novamente, each ending in a full stop.
  why: It is the wording the running helper uses and the curation contracts already hold the same wording for their own helpers.
---

=== rules/application-shell/a-state-badge-animates-promotion-supersession-and-merge
---
type: invariant
statement: "A state badge MUST animate a promotion when its state changes from uncertain to accepted, a supersession when it changes into superseded and a merge where its caller marks one."
constrains:
- domain/application-shell/state-badge
---

## Description

None.

=== rules/application-shell/a-state-badge-has-five-states-with-labels
---
type: invariant
statement: "The badge MUST show one of five confidence states with the labels Aceito, Incerto, Baixa confiança, Em disputa and Superado, a caller being able to override the label."
constrains:
- domain/application-shell/state-badge
---

## Description

None.

=== rules/application-shell/a-state-badge-is-always-named
---
type: invariant
statement: "The badge MUST be named Estado de confiança followed by its label even when icon-only, showing the visible label unless icon-only and the icon always hidden from assistive technology."
constrains:
- domain/application-shell/state-badge
---

## Description

None.

=== rules/application-shell/a-streaming-bubble-is-busy
---
type: invariant
statement: "A streaming bubble MUST be marked busy to assistive technology with a cursor hidden from it after the text, removed when streaming ends."
constrains:
- domain/application-shell/message-bubble
---

## Description

None.

=== rules/application-shell/a-toast-keeps-its-tone
---
type: invariant
statement: "A danger toast MUST be shown as an error toast and a warning toast as a warning toast."
constrains:
- domain/application-shell/failure-router
---

## Description

None.

=== rules/application-shell/a-token-is-fresh-with-thirty-seconds-to-spare
---
type: invariant
statement: "A token MUST be fresh only when one is held and either it expires more than 30 seconds from now or it carries no readable expiry."
constrains:
- domain/application-shell/owner-session
---

## Description

None.

=== rules/application-shell/a-user-bubble-may-be-streaming
---
type: invariant
statement: "A bubble MUST NOT refuse a user role marked as streaming."
constrains:
- domain/application-shell/message-bubble
---

## Description

None.

=== rules/application-shell/an-answer-below-500-without-json-is-invalid
---
type: invariant
statement: "An answer below status 500 with no body or a body that is not JSON MUST be a failure SYSTEM_INVALID_RESPONSE."
constrains:
- domain/application-shell/request-helper
---

## Description

None.

=== rules/application-shell/an-authorization-failure-sends-the-owner-to-sign-in
---
type: invariant
statement: "AUTH_UNAUTHORIZED, AUTH_TOKEN_EXPIRED and AUTH_TOKEN_INVALID MUST clear the stored token and send the owner to the sign-in address with the reason session_expired."
constrains:
- domain/application-shell/failure-router
---

## Description

None.

=== rules/application-shell/an-avatar-is-named-by-the-full-name
---
type: invariant
statement: "An avatar MUST be named by the full name and show the initials of the first and last word, the first two letters of a single word, uppercased, and a question mark for a blank name."
constrains:
- domain/application-shell/state-badge
---

## Description

None.

=== rules/application-shell/an-error-message-replaces-other-text
---
type: invariant
statement: "A field's error message MUST replace any other message text and nothing MUST be shown when there is neither."
constrains:
- domain/application-shell/state-badge
---

## Description

None.

=== rules/application-shell/an-errored-bubble-adds-no-wording
---
type: invariant
statement: "An errored bubble MUST add no wording and show the error only by its border accent."
constrains:
- domain/application-shell/message-bubble
---

## Description

None.

=== rules/application-shell/an-ingestion-request-has-no-cutoff
---
type: invariant
statement: "A request marked as ingestion MUST have no client cutoff and carry only the caller's own signal."
constrains:
- domain/application-shell/request-helper
---

## Description

None.

=== rules/application-shell/an-invalid-field-is-described
---
type: invariant
statement: "A field in error MUST be marked invalid to assistive technology and described by its help text and its error message, and a field not in error by its help text only."
constrains:
- domain/application-shell/state-badge
---

## Description

None.

=== rules/application-shell/an-invalid-format-is-a-form-error
---
type: invariant
statement: "VALIDATION_INVALID_FORMAT MUST be routed as a form error with the server's message when non-empty and \"Há campos inválidos no formulário.\" otherwise, passing on the server's details and showing no toast."
constrains:
- domain/application-shell/failure-router
---

## Description

None.

=== rules/application-shell/an-uncertain-state-badge-pulses
---
type: invariant
statement: "An uncertain state badge MUST pulse."
constrains:
- domain/application-shell/state-badge
---

## Description

None.

=== rules/application-shell/an-unknown-address-says-page-not-found
---
type: invariant
statement: "The not-found address and any address that matches no route MUST show \"Página não encontrada.\" with \"O endereço solicitado não existe ou foi removido.\", the unmatched address without guard or shell."
constrains:
- domain/application-shell/application-shell
---

## Description

None.

=== rules/application-shell/any-other-code-shows-a-danger-toast
---
type: invariant
statement: "Any other code MUST show a danger toast with the server's message when non-empty and the standard failure message otherwise."
constrains:
- domain/application-shell/failure-router
---

## Description

None.

=== rules/application-shell/any-other-system-failure-hides-its-message
---
type: invariant
statement: "Any other SYSTEM_ code MUST show a danger toast with the standard failure message and never the server's message."
constrains:
- domain/application-shell/failure-router
---

## Description

None.

=== rules/application-shell/archive-and-reactivate-need-no-confirmation
---
type: invariant
statement: "Archiving and reactivating MUST act at once with no confirmation and close the menu."
constrains:
- domain/application-shell/conversation-menu
---

## Description

None.

=== rules/application-shell/archived-conversations-are-opt-in
---
type: invariant
statement: "The menu MUST hide archived conversations by default, offer the Mostrar arquivadas switch at its foot and only report the new value without storing it."
constrains:
- domain/application-shell/conversation-menu
---

## Description

None.

=== rules/application-shell/archiving-stamps-the-browser-clock
---
type: invariant
statement: "Archiving MUST send the browser clock's current instant as an ISO string and, when the archived conversation was the active one, navigate on success to the chat address without a conversation."
constrains:
- domain/application-shell/conversation-menu
---

## Description

None.

=== rules/application-shell/as-of-starts-at-today
---
type: invariant
statement: "The as-of date MUST start empty meaning today, the footer reading Como em: hoje and otherwise Como em: followed by the date in pt-BR form."
constrains:
- domain/application-shell/application-shell
---

## Description

None.

=== rules/application-shell/chat-and-curation-keep-one-search-key
---
type: invariant
statement: "The chat address MUST accept the optional search key conversation and the curation address the optional search key item, each kept verbatim only when a non-empty string and otherwise dropped."
constrains:
- domain/application-shell/application-shell
---

## Description

None.

=== rules/application-shell/choosing-a-destination-closes-the-palette-first
---
type: invariant
statement: "Choosing a palette destination MUST close the palette and then navigate."
constrains:
- domain/application-shell/application-shell
---

## Description

None.

=== rules/application-shell/choosing-a-row-selects-it
---
type: invariant
statement: "Choosing a row MUST select that conversation and close the menu."
constrains:
- domain/application-shell/conversation-menu
---

## Description

None.

=== rules/application-shell/choosing-or-creating-a-conversation-opens-it
---
type: invariant
statement: "Choosing a conversation MUST navigate to the chat address naming it and creating one MUST send no fields and, on success, navigate to the new one."
constrains:
- domain/application-shell/conversation-menu
---

## Description

None.

=== rules/application-shell/clearing-the-token-forgets-it
---
type: invariant
statement: "Clearing the token MUST remove it from memory and from session storage."
constrains:
- domain/application-shell/owner-session
---

## Description

None.

=== rules/application-shell/client-needs-two-urls
---
type: invariant
statement: "The client MUST read exactly two configuration values, the back end address and the identity provider address, each a valid URL, and read no other key."
constrains:
- domain/application-shell/request-helper
---

## Description

None.

=== rules/application-shell/deleting-asks-first
---
type: invariant
statement: "Deleting MUST close the menu and open a confirmation dialog titled Excluir conversa."
constrains:
- domain/application-shell/conversation-menu
---

## Description

None.

=== rules/application-shell/deleting-the-active-conversation-leaves-it
---
type: invariant
statement: "Deleting MUST send a delete by id and, when the deleted conversation was the active one, navigate on success to the chat address without a conversation."
constrains:
- domain/application-shell/conversation-menu
---

## Description

None.

=== rules/application-shell/every-failure-goes-to-the-router
---
type: invariant
statement: "Every read and write failure MUST go to the central routing and a failure that is not an envelope failure MUST be reported and shown as a danger toast with the standard failure message."
constrains:
- domain/application-shell/failure-router
---

## Description

None.

=== rules/application-shell/every-other-address-is-guarded
---
type: invariant
statement: "Every declared address other than sign-in MUST sit under one guarded layout that shows the application shell."
constrains:
- domain/application-shell/application-shell
---

## Description

None.

=== rules/application-shell/failure-routing-lives-in-one-function
---
type: invariant
statement: "All routing from a failure code to a screen action MUST live in one function that matches exact codes before prefixes and BUSINESS_ before SYSTEM_."
constrains:
- domain/application-shell/failure-router
---

## Description

None.

=== rules/application-shell/health-and-pending-are-asked-every-twenty-seconds
---
type: invariant
statement: "The health and the pending curation total MUST each be asked every 20 seconds and not retried on failure, health without the token."
constrains:
- domain/application-shell/application-shell
---

## Description

None.

=== rules/application-shell/health-is-judged-by-the-database-field
---
type: invariant
statement: "Health MUST be online when the answer's database equals ok, banco inacessível for any other parsed answer and verificando… while no answer was parsed, an unreachable or non-JSON answer parsing nothing."
constrains:
- domain/application-shell/application-shell
---

## Description

None.

=== rules/application-shell/invalid-configuration-stops-the-client
---
type: invariant
statement: "An invalid configuration MUST write the failed issues to the console and raise an error naming the two keys and each issue as its path and message."
constrains:
- domain/application-shell/request-helper
---

## Description

None.

=== rules/application-shell/leaving-a-rename-sends-nothing
---
type: invariant
statement: "Escape, the cancel control or closing the menu while renaming MUST drop the rename and send nothing."
constrains:
- domain/application-shell/conversation-menu
---

## Description

None.

=== rules/application-shell/one-client-serves-reads-and-writes
---
type: invariant
statement: "There MUST be one client for reads and writes created once when the module loads."
constrains:
- domain/application-shell/failure-router
---

## Description

None.

=== rules/application-shell/only-a-cancelled-reply-shows-a-notice
---
type: invariant
statement: "A bubble MUST show a notice below it only for the stop reason cancelled, reading Resposta interrompida, and none for any other, unknown or absent stop reason."
constrains:
- domain/application-shell/message-bubble
---

## Description

None.

=== rules/application-shell/only-ok-true-returns-the-result
---
type: invariant
statement: "The result MUST be returned only when the envelope's ok is exactly true, and any other envelope MUST be a failure even under a 2xx status."
constrains:
- domain/application-shell/request-helper
---

## Description

None.

=== rules/application-shell/only-the-confirmation-deletes
---
type: invariant
statement: "Only the confirm action MUST send the delete and cancelling or dismissing the dialog MUST send nothing."
constrains:
- domain/application-shell/conversation-menu
---

## Description

None.

=== rules/application-shell/reduced-motion-stops-the-state-badge-animating
---
type: invariant
statement: "A state badge MUST NOT animate while the owner prefers reduced motion."
constrains:
- domain/application-shell/state-badge
---

## Description

None.

=== rules/application-shell/renaming-and-reactivating-stay-where-they-are
---
type: invariant
statement: "Renaming MUST send the new title and reactivating MUST send an archive moment of null, neither navigating."
constrains:
- domain/application-shell/conversation-menu
---

## Description

None.

=== rules/application-shell/renaming-opens-a-field-with-the-title
---
type: invariant
statement: "Renaming MUST replace the row with a text field starting with the current title or empty when null."
constrains:
- domain/application-shell/conversation-menu
---

## Description

None.

=== rules/application-shell/session-expired-failure-carries-no-details
---
type: invariant
statement: "The session expired failure MUST carry no details."
constrains:
- domain/application-shell/request-helper
---

## Description

None.

=== rules/application-shell/setting-a-token-decodes-its-claims
---
type: invariant
statement: "Setting the token MUST decode its sub, exp, name and email claims without checking the signature, keeping each only when it has the expected type and none when the token does not have three dot-separated parts."
constrains:
- domain/application-shell/owner-session
---

## Description

None.

=== rules/application-shell/sign-in-hands-the-attempt-to-its-panel
---
type: invariant
statement: "The sign-in page MUST pass the sign-in attempt's submit, in-flight flag and failure to the sign-in panel."
constrains:
- domain/application-shell/application-shell
---

## Description

None.

=== rules/application-shell/sign-in-shows-the-expiry-notice-for-its-reason
---
type: invariant
statement: "The sign-in page MUST show the session expired notice exactly when its address has the reason session_expired, read once per mount, and none when the address cannot be read."
constrains:
- domain/application-shell/application-shell
---

## Description

None.

=== rules/application-shell/sign-in-sits-outside-the-guarded-shell
---
type: invariant
statement: "The sign-in address MUST sit outside the guarded subtree and be shown without the header, footer or command palette."
constrains:
- domain/application-shell/application-shell
---

## Description

None.

=== rules/application-shell/some-addresses-show-only-a-placeholder
---
type: invariant
statement: "The graph, search and history addresses MUST show only a placeholder with the titles Grafo, Busca and Histórico and the line \"Conteúdo em breve.\"."
constrains:
- domain/application-shell/application-shell
---

## Description

None.

=== rules/application-shell/the-active-ingestion-segment-is-never-shown
---
type: invariant
statement: "The footer's active ingestion segment MUST never be shown because there is no active run, and when present it would link to the history address."
constrains:
- domain/application-shell/application-shell
---

## Description

None.

=== rules/application-shell/the-active-row-is-only-highlighted
---
type: invariant
statement: "The active conversation's row MUST be marked only by a highlighted background and keep its accessible name."
constrains:
- domain/application-shell/conversation-menu
---

## Description

None.

=== rules/application-shell/the-areas-live-at-fixed-addresses
---
type: invariant
statement: "The areas Chat, Grafo, Buscar, Ingerir, Curar and Histórico MUST live at /chat, /graph, /search, /ingest, /curation and /history, and the not-found area at /not-found."
constrains:
- domain/application-shell/application-shell
---

## Description

None.

=== rules/application-shell/the-areas-live-at-fixed-addresses.log
---
entries:
- field: statement
  unstated: The rules name the areas and the not-found address without their paths, and other nodes state only /chat, /curation and /sign-in.
  decided: The six areas live at /chat, /graph, /search, /ingest, /curation and /history and the not-found area at /not-found.
  why: These are the addresses the router declares and the header and palette link to.
---

=== rules/application-shell/the-as-of-date-lives-in-memory
---
type: invariant
statement: "The as-of date MUST be held in memory only, never written to the address nor persisted, and no read MUST be sent with it."
constrains:
- domain/application-shell/application-shell
---

## Description

None.

=== rules/application-shell/the-backdrop-is-decoration
---
type: invariant
statement: "The backdrop MUST be hidden from assistive technology and its image MUST have an empty alternative text."
constrains:
- domain/application-shell/application-shell
---

## Description

None.

=== rules/application-shell/the-conversation-menu-shows-on-chat-only
---
type: invariant
statement: "The conversation menu MUST appear in the header only on the chat address or beneath it, and the header's only actions MUST be the theme choice and the command palette toggle."
constrains:
- domain/application-shell/application-shell
---

## Description

None.

=== rules/application-shell/the-cutoff-ends-with-the-headers
---
type: invariant
statement: "The cutoff timer MUST be cleared as soon as the response headers arrive and reading the body MUST have no cutoff."
constrains:
- domain/application-shell/request-helper
---

## Description

None.

=== rules/application-shell/the-delete-dialog-offers-cancel-and-confirm
---
type: invariant
statement: The delete confirmation dialog MUST offer the buttons Cancelar and Confirmar.
constrains:
- domain/application-shell/conversation-menu
---

## Description

None.

=== rules/application-shell/the-delete-dialog-warns-that-deleting-cannot-be-undone
---
type: invariant
statement: The delete confirmation dialog MUST warn that deleting cannot be undone by reading "Tem certeza?" and then "Esta ação não pode ser desfeita".
constrains:
- domain/application-shell/conversation-menu
---

## Description

None.

=== rules/application-shell/the-first-entry-creates-a-conversation
---
type: invariant
statement: "The first entry of the menu MUST create a conversation with no title and close the menu."
constrains:
- domain/application-shell/conversation-menu
---

## Description

None.

=== rules/application-shell/the-first-signal-aborts-the-request
---
type: invariant
statement: "A caller's signal and the cutoff MUST be combined so that whichever fires first aborts the request."
constrains:
- domain/application-shell/request-helper
---

## Description

None.

=== rules/application-shell/the-first-valid-configuration-is-kept
---
type: invariant
statement: "The first valid configuration MUST be frozen and cached and every later read MUST return it without checking again."
constrains:
- domain/application-shell/request-helper
---

## Description

None.

=== rules/application-shell/the-footer-shows-one-of-three-health-states
---
type: invariant
statement: "The footer MUST show the system health as online, banco inacessível or verificando…, starting at verificando…."
constrains:
- domain/application-shell/application-shell
---

## Description

None.

=== rules/application-shell/the-footer-shows-pending-curation
---
type: invariant
statement: "The footer MUST show the pending curation total as the number followed by pendentes, linked to the curation address, and hide it when the total is 0."
constrains:
- domain/application-shell/application-shell
---

## Description

None.

=== rules/application-shell/the-guard-needs-a-fresh-token
---
type: invariant
statement: "The guard MUST let the owner through only while the access token is fresh and otherwise send the owner to the sign-in address with the reason session_expired, carrying no destination."
constrains:
- domain/application-shell/application-shell
---

## Description

None.

=== rules/application-shell/the-header-lists-six-areas
---
type: invariant
statement: "The header MUST list the areas Chat, Grafo, Buscar, Ingerir, Curar and Histórico in this order, marking as current the area whose address equals or begins the current address."
constrains:
- domain/application-shell/application-shell
---

## Description

None.

=== rules/application-shell/the-header-menu-lists-without-archived-by-default
---
type: invariant
statement: "The header's conversation listing MUST be requested without archived conversations unless the owner includes them, and the active title MUST be that of the listed conversation named by the address, none when it is not listed."
constrains:
- domain/application-shell/conversation-menu
---

## Description

None.

=== rules/application-shell/the-header-shows-the-product-name
---
type: invariant
statement: "The header MUST show the product name Remember before its list of areas."
constrains:
- domain/application-shell/application-shell
---

## Description

None.

=== rules/application-shell/the-menu-lists-as-received
---
type: invariant
statement: "The menu MUST list the conversations in the order received without sorting, filtering or capping, still listing those already held while loading, showing a placeholder when loading with none and Nenhuma conversa ainda when not loading with none."
constrains:
- domain/application-shell/conversation-menu
---

## Description

None.

=== rules/application-shell/the-menu-trigger-names-the-active-conversation
---
type: invariant
statement: "The menu trigger MUST show Nova conversa with no active conversation and otherwise the active title or Conversa sem título when null, and be named Conversas — followed by the active title or Nova conversa."
constrains:
- domain/application-shell/conversation-menu
---

## Description

None.

=== rules/application-shell/the-owner-picks-the-as-of-date
---
type: invariant
statement: "The owner MUST pick the as-of date from a date input in the footer popover titled Recorte temporal, with no minimum or maximum, and emptying it or choosing Voltar para hoje MUST set it back to today."
constrains:
- domain/application-shell/application-shell
---

## Description

None.

=== rules/application-shell/the-palette-field-invites-a-search
---
type: invariant
statement: "The palette's search field MUST read \"Buscar áreas e ações…\" while it is empty."
constrains:
- domain/application-shell/application-shell
---

## Description

None.

=== rules/application-shell/the-palette-field-invites-a-search.log
---
entries:
- field: statement
  unstated: The palette search field reads a text promising actions although the palette offers only destinations, and no node holds the text.
  decided: The field reads Buscar áreas e ações… as the running screen shows it.
  why: The text is what the owner reads today and no material says it should change, so the specification records it rather than correcting it.
---

=== rules/application-shell/the-palette-lives-inside-the-shell
---
type: invariant
statement: "The palette and its shortcut MUST be mounted only within the guarded shell."
constrains:
- domain/application-shell/application-shell
---

## Description

None.

=== rules/application-shell/the-palette-offers-five-destinations
---
type: invariant
statement: "The palette MUST offer one group Ir para with the destinations Grafo, Buscar, Ingerir, Curar and Histórico in this order, filtered by label and reading \"Nada encontrado.\" when none matches."
constrains:
- domain/application-shell/application-shell
---

## Description

None.

=== rules/application-shell/the-palette-starts-closed-in-memory
---
type: invariant
statement: "The palette MUST start closed and its open state MUST be held in memory only."
constrains:
- domain/application-shell/application-shell
---

## Description

None.

=== rules/application-shell/the-pending-total-needs-a-token
---
type: invariant
statement: "The pending curation total MUST be the queue listing's total requested with limit 1 and the access token as a bearer, no request being made without a token and an answer without a total counting as 0."
constrains:
- domain/application-shell/application-shell
---

## Description

None.

=== rules/application-shell/the-root-address-leads-to-chat
---
type: invariant
statement: "The root address MUST always redirect to the chat address after the freshness guard has run."
constrains:
- domain/application-shell/application-shell
---

## Description

None.

=== rules/application-shell/the-shell-regions-have-names
---
type: invariant
statement: "The header MUST be a banner named Cabeçalho with a navigation named Áreas, a palette toggle named Abrir paleta de comandos (⌘K) and a theme choice named Tema, and the footer a contentinfo named Rodapé with the date input named Data do recorte."
constrains:
- domain/application-shell/application-shell
---

## Description

None.

=== rules/application-shell/the-shortcut-toggles-the-palette
---
type: invariant
statement: "Pressing the command key and K or Control and K anywhere in the shell MUST open or close the command palette and suppress the browser's default action."
constrains:
- domain/application-shell/application-shell
---

## Description

None.

=== rules/application-shell/the-ten-node-types-are-named-in-portuguese
---
type: invariant
statement: "The node types person, organization, project, event, role, category, concept, location, document and task MUST be named Pessoa, Organização, Projeto, Evento, Papel, Categoria, Conceito, Local, Documento and Tarefa."
constrains:
- domain/application-shell/state-badge
---

## Description

None.

=== rules/application-shell/the-token-is-mirrored-to-session-storage
---
type: invariant
statement: "The access token MUST be held in memory and mirrored to the tab's session storage under the key remember.auth.token, read once when the application loads and kept in memory only when storage cannot be written."
constrains:
- domain/application-shell/owner-session
---

## Description

None.

=== rules/application-shell/the-trigger-is-off-while-loading
---
type: invariant
statement: "The menu trigger MUST be disabled while the listing is loading and show a spinner in place of the chevron."
constrains:
- domain/application-shell/conversation-menu
---

## Description

None.

=== rules/application-shell/transport-failures-read-their-wording
---
type: invariant
statement: "The helper's own failures MUST read \"Tempo limite excedido na requisição.\" for a timeout, \"Requisição cancelada.\" for an abort, \"Falha de rede ao contactar o servidor.\" for a network failure, \"Resposta do servidor não é JSON válido.\" for an invalid answer and \"Erro desconhecido do servidor.\" for an unknown one."
constrains:
- domain/application-shell/request-helper
---

## Description

None.

=== rules/chat-workspace/a-turn-is-never-resent-by-the-screen
---
type: invariant
statement: "The screen MUST NOT resend a turn by itself, each stream being opened once."
constrains:
- domain/chat-workspace/chat-session
---

## Description

None.

=== rules/chat-workspace/aborting-and-cancelling-do-not-trigger-each-other
---
type: invariant
statement: "Aborting the stream and cancelling the turn MUST each leave the other undone."
constrains:
- domain/chat-workspace/chat-session
---

## Description

None.

=== rules/chat-workspace/aborting-ends-the-reading-quietly
---
type: invariant
statement: "Aborting before the answer arrives or while the stream is read MUST end the reading with no error frame, the messages and usage still being read again."
constrains:
- domain/chat-workspace/chat-session
---

## Description

None.

=== rules/chat-workspace/active-conversation-is-named-by-the-address
---
type: invariant
statement: "The active conversation MUST be the one the address's conversation parameter names, and none when it is absent."
constrains:
- domain/chat-workspace/chat-session
---

## Description

None.

=== rules/chat-workspace/an-outcome-settles-the-most-recent-chip
---
type: invariant
statement: "A tool call's outcome MUST settle the most recently added tool chip and change nothing when the turn has none."
constrains:
- domain/chat-workspace/chat-session
- domain/chat-workspace/tool-chip
- domain/chat-workspace/tool-chip-outcome
---

## Description

None.

=== rules/chat-workspace/any-other-code-leaves-the-composer-usable
---
type: invariant
statement: "Any other error code from the last send MUST leave the composer usable."
constrains:
- domain/chat-workspace/chat-session
- domain/chat-workspace/send-outcome
---

## Description

None.

=== rules/chat-workspace/any-status-may-follow-any-status
---
type: invariant
statement: "The turn state MUST accept any chat status after any chat status, enforcing no transitions itself."
constrains:
- domain/chat-workspace/chat-session
- domain/chat-workspace/chat-status
---

## Description

None.

=== rules/chat-workspace/archived-conversation-offers-no-input
---
type: invariant
statement: "An archived conversation MUST offer no text field and no send button, only a banner."
constrains:
- domain/chat-workspace/chat-session
---

## Description

None.

=== rules/chat-workspace/cancel-goes-through-the-back-end-request-helper
---
type: invariant
statement: "The cancel request MUST go through the back end request helper and so be cut off after thirty seconds, refresh the token once on a 401 and redirect to sign-in when it cannot."
constrains:
- domain/chat-workspace/chat-session
---

## Description

None.

=== rules/chat-workspace/cancel-targets-the-conversation-it-was-created-for
---
type: invariant
statement: "The cancel MUST target the conversation its hook was created for and take no conversation argument."
constrains:
- domain/chat-workspace/chat-session
---

## Description

None.

=== rules/chat-workspace/cancelling-a-turn-is-a-separate-request
---
type: invariant
statement: "Cancelling a turn MUST be a separate request to the conversation's cancel endpoint with no body, carrying the bearer when a token is held."
constrains:
- domain/chat-workspace/chat-session
---

## Description

None.

=== rules/chat-workspace/changing-conversation-clears-the-graph-and-the-detail
---
type: invariant
statement: "Changing the active conversation MUST clear the graph pane's subgraph and close any open node detail."
constrains:
- domain/chat-workspace/chat-session
---

## Description

None.

=== rules/chat-workspace/changing-conversation-does-not-stop-the-turn
---
type: invariant
statement: "Changing the active conversation MUST NOT stop a turn in flight, which is aborted only when the message list leaves the screen."
constrains:
- domain/chat-workspace/chat-session
---

## Description

None.

=== rules/chat-workspace/chip-is-a-status-region-named-by-tool-and-status
---
type: invariant
statement: "A tool-call chip MUST be a status region whose accessible name joins the tool's name and its status."
constrains:
- domain/chat-workspace/chat-session
- domain/chat-workspace/tool-chip
- domain/chat-workspace/tool-chip-outcome
---

## Description

None.

=== rules/chat-workspace/chip-shows-the-tool-and-its-summary
---
type: invariant
statement: "A tool-call chip MUST show the tool's name and, when it is not empty, the summary of the call's arguments."
constrains:
- domain/chat-workspace/chat-session
- domain/chat-workspace/tool-chip
- domain/chat-workspace/tool-chip-outcome
---

## Description

None.

=== rules/chat-workspace/clicking-a-node-swaps-the-pane-to-its-detail
---
type: invariant
statement: "Clicking a node in the graph pane MUST swap the pane to that node's detail, and closing the detail MUST bring the graph back."
constrains:
- domain/chat-workspace/chat-session
---

## Description

None.

=== rules/chat-workspace/comment-and-colonless-lines-are-ignored
---
type: invariant
statement: "A line starting with a colon, and a line with no colon, MUST be ignored."
constrains:
- domain/chat-workspace/chat-session
---

## Description

None.

=== rules/chat-workspace/composer-footer-is-empty
---
type: invariant
statement: "The composer's footer row MUST be rendered empty, with no usage readout under the composer."
constrains:
- domain/chat-workspace/chat-session
---

## Description

None.

=== rules/chat-workspace/composer-never-clears-the-last-outcome
---
type: invariant
statement: "The composer MUST NOT clear the last send's outcome, so the disabled notice stays while the composer stays on screen."
constrains:
- domain/chat-workspace/chat-session
- domain/chat-workspace/send-outcome
---

## Description

None.

=== rules/chat-workspace/composer-send-carries-the-identifier-and-the-content
---
type: invariant
statement: "A send from the composer MUST carry only the active conversation's identifier and the typed content, naming no model."
constrains:
- domain/chat-workspace/chat-session
---

## Description

None.

=== rules/chat-workspace/content-has-at-most-32768-characters
---
type: invariant
statement: "The composer's content MUST be at most 32768 characters long."
constrains:
- domain/chat-workspace/chat-session
---

## Description

None.

=== rules/chat-workspace/content-is-checked-on-every-change
---
type: invariant
statement: "The content MUST be checked on every change, so the too-long message appears while the owner types."
constrains:
- domain/chat-workspace/chat-session
---

## Description

None.

=== rules/chat-workspace/content-is-sent-as-the-caller-gives-it
---
type: invariant
statement: "The screen MUST send the content exactly as the caller gives it, with no trim, no length check and no refusal of an empty one in the send itself."
constrains:
- domain/chat-workspace/chat-session
---

## Description

None.

=== rules/chat-workspace/content-needs-a-character
---
type: invariant
statement: "The composer's content MUST be at least one character long."
constrains:
- domain/chat-workspace/chat-session
---

## Description

None.

=== rules/chat-workspace/conversation-is-archived-when-its-detail-says-so
---
type: invariant
statement: "A conversation MUST count as archived when its detail carries a non-null archive moment, and as not archived until the detail has loaded or when it fails to load."
constrains:
- domain/chat-workspace/chat-session
---

## Description

None.

=== rules/chat-workspace/conversation-reads-stay-fresh-for-thirty-seconds
---
type: invariant
statement: "A conversation's details, the conversation listing and a conversation's usage MUST stay fresh for thirty seconds."
constrains:
- domain/chat-workspace/chat-session
---

## Description

None.

=== rules/chat-workspace/create-and-delete-do-not-navigate
---
type: invariant
statement: "Creating or deleting a conversation MUST NOT navigate."
constrains:
- domain/chat-workspace/chat-session
---

## Description

None.

=== rules/chat-workspace/create-refreshes-every-conversation-read
---
type: invariant
statement: "After a successful create every conversation-scoped read MUST be marked stale and read again."
constrains:
- domain/chat-workspace/chat-session
---

## Description

None.

=== rules/chat-workspace/delete-removes-the-conversations-reads
---
type: invariant
statement: "After a successful delete the details, messages and usage of that conversation MUST be removed and every conversation-scoped read marked stale and read again."
constrains:
- domain/chat-workspace/chat-session
---

## Description

None.

=== rules/chat-workspace/delete-uses-the-no-body-helper
---
type: invariant
statement: "Deleting a conversation MUST use the no-body request helper and give the caller nothing back."
constrains:
- domain/chat-workspace/chat-session
---

## Description

None.

=== rules/chat-workspace/details-and-listing-are-read-again-on-focus
---
type: invariant
statement: "A conversation's details and the conversation listing MUST be read again when the window regains focus."
constrains:
- domain/chat-workspace/chat-session
---

## Description

None.

=== rules/chat-workspace/disabling-codes-lock-the-composer
---
type: invariant
statement: "A send that ended with BUSINESS_CHAT_DISABLED or BUSINESS_CHAT_PROVIDER_UNAVAILABLE MUST disable the text field and the send button and show an inline notice."
constrains:
- domain/chat-workspace/chat-session
- domain/chat-workspace/send-outcome
---

## Description

None.

=== rules/chat-workspace/done-settles-the-turn-and-makes-the-status-idle
---
type: invariant
statement: "A done frame MUST settle the graph pane's turn as done, make the chat status idle and make its stop reason the result of the send."
constrains:
- domain/chat-workspace/chat-session
- domain/chat-workspace/chat-status
- domain/chat-workspace/send-outcome
---

## Description

None.

=== rules/chat-workspace/each-frame-kind-requires-its-fields
---
type: invariant
statement: "A frame MUST carry the fields its event requires: none for llm_start, delta for text_delta, tool and args_summary for tool_start, ok for tool_result, stop_reason for done, code and message for error and source_tool, nodes and links for graph_delta."
constrains:
- domain/chat-workspace/chat-session
---

## Description

None.

=== rules/chat-workspace/enter-sends-and-shift-enter-breaks-the-line
---
type: invariant
statement: "Enter without Shift MUST send the message through the same checks as the send button, and Shift+Enter MUST insert a new line."
constrains:
- domain/chat-workspace/chat-session
---

## Description

None.

=== rules/chat-workspace/error-settles-the-turn-and-makes-the-status-error
---
type: invariant
statement: "An error frame MUST settle the graph pane's turn as failed, make the chat status error and make its code and message the result of the send."
constrains:
- domain/chat-workspace/chat-session
- domain/chat-workspace/chat-status
- domain/chat-workspace/send-outcome
---

## Description

None.

=== rules/chat-workspace/error-status-stays-until-the-next-send
---
type: invariant
statement: "The error chat status MUST stay after the turn ends until the next send clears it."
constrains:
- domain/chat-workspace/chat-session
- domain/chat-workspace/chat-status
---

## Description

None.

=== rules/chat-workspace/escape-aborts-the-turn-from-anywhere
---
type: invariant
statement: "While a turn streams Escape MUST abort it from anywhere on the page, and MUST do nothing when no turn is in flight."
constrains:
- domain/chat-workspace/chat-session
---

## Description

None.

=== rules/chat-workspace/event-names-the-frame-and-data-carries-it
---
type: invariant
statement: "The event line MUST name the frame and the data line carry its JSON, several data lines being joined with a newline and the last event line winning."
constrains:
- domain/chat-workspace/chat-session
---

## Description

None.

=== rules/chat-workspace/every-send-has-a-new-idempotency-key
---
type: invariant
statement: "Every send MUST generate a new random identifier as its idempotency key."
constrains:
- domain/chat-workspace/chat-session
- domain/chat-workspace/send-outcome
---

## Description

None.

=== rules/chat-workspace/failed-turn-gets-no-wording-from-the-list
---
type: invariant
statement: "A turn that ends in failure MUST get no failure wording from the message list."
constrains:
- domain/chat-workspace/chat-session
- domain/chat-workspace/message-list-state
---

## Description

None.

=== rules/chat-workspace/first-graph-delta-replaces-and-later-ones-add
---
type: invariant
statement: "The first graph_delta with nodes of a turn MUST replace the graph the pane held and every later one with nodes in the same turn MUST be added onto it, a delta with no nodes not counting as the replacement."
constrains:
- domain/chat-workspace/chat-session
---

## Description

None.

=== rules/chat-workspace/first-jump-happens-once
---
type: invariant
statement: "The first jump MUST happen once while the message list stays on screen, switching conversation not repeating it."
constrains:
- domain/chat-workspace/chat-session
- domain/chat-workspace/message-list-state
---

## Description

None.

=== rules/chat-workspace/first-load-jumps-to-the-bottom
---
type: invariant
statement: "When the history first loads the list MUST jump to the bottom without animation."
constrains:
- domain/chat-workspace/chat-session
- domain/chat-workspace/message-list-state
---

## Description

None.

=== rules/chat-workspace/frame-lines-are-field-value-pairs
---
type: invariant
statement: "Each line of a frame MUST be read as a field and a value, dropping a carriage return at the end of the line and one space after the colon."
constrains:
- domain/chat-workspace/chat-session
---

## Description

None.

=== rules/chat-workspace/frames-end-at-a-blank-line
---
type: invariant
statement: "Frames MUST end at a blank line and each complete frame MUST be applied as soon as it arrives."
constrains:
- domain/chat-workspace/chat-session
---

## Description

None.

=== rules/chat-workspace/graph-delta-with-no-nodes-leaves-the-graph
---
type: invariant
statement: "A graph_delta frame MUST be converted to a graph slice, and a slice with no nodes MUST leave the graph pane as it was."
constrains:
- domain/chat-workspace/chat-session
---

## Description

None.

=== rules/chat-workspace/graph-pane-receives-the-status-and-the-error
---
type: invariant
statement: "The graph pane MUST receive the graph's status and, when one exists, its error message."
constrains:
- domain/chat-workspace/chat-session
---

## Description

None.

=== rules/chat-workspace/graph-tool-start-puts-the-graph-pane-into-loading
---
type: invariant
statement: "The start of a graph tool, one of traverse, get_node, list_nodes, search and ingest_directed matched by its exact name, MUST put the graph pane into loading and any other tool MUST leave it as it was."
constrains:
- domain/chat-workspace/chat-session
---

## Description

None.

=== rules/chat-workspace/graph-view-is-restored-and-saved-per-conversation
---
type: invariant
statement: "Changing the active conversation MUST restore that conversation's saved graph view, and the graph MUST be saved again whenever it changes."
constrains:
- domain/chat-workspace/chat-session
---

## Description

None.

=== rules/chat-workspace/hint-hides-in-every-other-phase
---
type: invariant
statement: "The waiting hint MUST NOT show in any phase other than thinking and tool-running."
constrains:
- domain/chat-workspace/chat-session
- domain/chat-workspace/chat-status
---

## Description

None.

=== rules/chat-workspace/hint-is-a-polite-atomic-status-region
---
type: invariant
statement: "The waiting hint MUST be a polite, atomic status region so every change is announced whole."
constrains:
- domain/chat-workspace/chat-session
- domain/chat-workspace/chat-status
---

## Description

None.

=== rules/chat-workspace/history-failure-offers-a-retry
---
type: invariant
statement: "The history-failure alert MUST offer a retry that loads the history again."
constrains:
- domain/chat-workspace/chat-session
- domain/chat-workspace/message-list-state
---

## Description

None.

=== rules/chat-workspace/history-keeps-the-listed-order
---
type: invariant
statement: "The history MUST be shown in the order the message listing returns it."
constrains:
- domain/chat-workspace/chat-session
- domain/chat-workspace/message-list-state
---

## Description

None.

=== rules/chat-workspace/in-flight-bubble-is-removed-when-streaming-ends
---
type: invariant
statement: "When streaming ends for any reason the in-flight bubble MUST be removed and no in-flight text kept."
constrains:
- domain/chat-workspace/chat-session
- domain/chat-workspace/message-list-state
---

## Description

None.

=== rules/chat-workspace/invalid-content-sends-nothing
---
type: invariant
statement: "Content that fails either length bound MUST send nothing."
constrains:
- domain/chat-workspace/chat-session
---

## Description

None.

=== rules/chat-workspace/invalid-field-is-marked-and-described
---
type: invariant
statement: "A field with a validation message MUST be marked invalid and described by the message line present."
constrains:
- domain/chat-workspace/chat-session
---

## Description

None.

=== rules/chat-workspace/last-terminal-frame-sets-the-result
---
type: invariant
statement: "When two done frames or two error frames arrive the last one MUST set the result."
constrains:
- domain/chat-workspace/chat-session
- domain/chat-workspace/send-outcome
---

## Description

None.

=== rules/chat-workspace/leaving-the-list-aborts-the-turn
---
type: invariant
statement: "When the message list leaves the screen it MUST abort any turn in flight."
constrains:
- domain/chat-workspace/chat-session
- domain/chat-workspace/message-list-state
---

## Description

None.

=== rules/chat-workspace/listing-excludes-archived-by-default
---
type: invariant
statement: "The conversation listing MUST exclude archived conversations unless asked otherwise."
constrains:
- domain/chat-workspace/chat-session
---

## Description

None.

=== rules/chat-workspace/listing-sends-its-options-only-when-asked
---
type: invariant
statement: "The conversation listing MUST send limit only when given, cursor only when given and include_archived=true only when archived conversations are asked for, and the message listing limit and before only when given."
constrains:
- domain/chat-workspace/chat-session
---

## Description

None.

=== rules/chat-workspace/llm-start-makes-the-status-thinking
---
type: invariant
statement: "An llm_start frame MUST make the chat status thinking."
constrains:
- domain/chat-workspace/chat-session
- domain/chat-workspace/chat-status
---

## Description

None.

=== rules/chat-workspace/loading-history-shows-three-placeholders
---
type: invariant
statement: "While the history loads the list MUST show three placeholder bubbles, assistant then owner then assistant, and be marked busy."
constrains:
- domain/chat-workspace/chat-session
- domain/chat-workspace/message-list-state
---

## Description

None.

=== rules/chat-workspace/malformed-frames-are-skipped-silently
---
type: invariant
statement: "A frame MUST be skipped silently when it lacks an event or data line, its data is not a JSON object, its event is unknown or a field its event requires is missing or of the wrong type."
constrains:
- domain/chat-workspace/chat-session
---

## Description

None.

=== rules/chat-workspace/message-is-a-bubble-styled-by-its-role
---
type: invariant
statement: "Each message MUST be shown as a bubble styled by its role."
constrains:
- domain/chat-workspace/chat-session
- domain/chat-workspace/message-list-state
---

## Description

None.

=== rules/chat-workspace/message-list-is-a-polite-live-region
---
type: invariant
statement: "The message list MUST be a polite live region in every state and be marked busy only while loading or while a turn streams."
constrains:
- domain/chat-workspace/chat-session
- domain/chat-workspace/message-list-state
---

## Description

None.

=== rules/chat-workspace/message-passes-its-stop-reason-to-its-bubble
---
type: invariant
statement: "A message with a stop reason MUST pass it to its bubble and one with none MUST pass none."
constrains:
- domain/chat-workspace/chat-session
- domain/chat-workspace/message-list-state
---

## Description

None.

=== rules/chat-workspace/message-text-joins-its-blocks
---
type: invariant
statement: "A message's shown text MUST join the text of its content blocks in order, a block without text adding nothing."
constrains:
- domain/chat-workspace/chat-session
- domain/chat-workspace/message-list-state
---

## Description

None.

=== rules/chat-workspace/messages-and-usage-are-not-read-again-on-focus
---
type: invariant
statement: "The messages and the usage of a conversation MUST NOT be read again when the window regains focus."
constrains:
- domain/chat-workspace/chat-session
---

## Description

None.

=== rules/chat-workspace/messages-are-stale-as-soon-as-they-are-read
---
type: invariant
statement: "A conversation's messages MUST count as stale as soon as they are read."
constrains:
- domain/chat-workspace/chat-session
---

## Description

None.

=== rules/chat-workspace/no-body-request-has-no-cutoff-and-no-refresh
---
type: invariant
statement: "A no-body request MUST have no client cutoff and no token refresh on a 401."
constrains:
- domain/chat-workspace/chat-session
---

## Description

None.

=== rules/chat-workspace/no-body-request-succeeds-only-on-204
---
type: invariant
statement: "A no-body request MUST treat only HTTP 204 as success and any other status, 200 included, as a failure."
constrains:
- domain/chat-workspace/chat-session
---

## Description

None.

=== rules/chat-workspace/no-page-size-is-fixed-by-the-screen
---
type: invariant
statement: "The screen MUST fix no page size for the conversation listing or the message listing."
constrains:
- domain/chat-workspace/chat-session
---

## Description

None.

=== rules/chat-workspace/node-detail-receives-the-clicked-label
---
type: invariant
statement: "The node detail MUST be given the clicked node's label at click time, and none when the node has no label."
constrains:
- domain/chat-workspace/chat-session
---

## Description

None.

=== rules/chat-workspace/one-message-line-under-the-field
---
type: invariant
statement: "The composer MUST show at most one message line under the field, a validation message taking precedence over the disabled notice."
constrains:
- domain/chat-workspace/chat-session
---

## Description

None.

=== rules/chat-workspace/one-validation-message-per-field
---
type: invariant
statement: "Only the first problem found MUST be shown as the field's validation message."
constrains:
- domain/chat-workspace/chat-session
---

## Description

None.

=== rules/chat-workspace/owner-message-is-appended-before-the-answer
---
type: invariant
statement: "Before a send goes out the owner's message MUST be appended at the end of the conversation's cached messages with role user, one text block, an optimistic identifier built from the idempotency key and the browser's time, and a one-item list when none was cached."
constrains:
- domain/chat-workspace/chat-session
---

## Description

None.

=== rules/chat-workspace/reactivating-sends-an-unarchive-update
---
type: invariant
statement: "Reactivating an archived conversation MUST send an update for it with archivedAt null."
constrains:
- domain/chat-workspace/chat-session
---

## Description

None.

=== rules/chat-workspace/read-and-write-failures-surface-unchanged
---
type: invariant
statement: "A failed read or write MUST fail with the error its request helper raised, the screen mapping no code and showing no text of its own."
constrains:
- domain/chat-workspace/chat-session
---

## Description

None.

=== rules/chat-workspace/reading-continues-after-a-terminal-frame
---
type: invariant
statement: "The screen MUST keep reading after a done or error frame until the server closes the stream, and apply a frame that arrives later."
constrains:
- domain/chat-workspace/chat-session
---

## Description

None.

=== rules/chat-workspace/reads-need-a-conversation-id
---
type: invariant
statement: "A read of a conversation's details, messages or usage MUST be requested only when the conversation id is a non-empty string."
constrains:
- domain/chat-workspace/chat-session
---

## Description

None.

=== rules/chat-workspace/refused-send-keeps-the-owner-message-until-reread
---
type: invariant
statement: "A refused send MUST leave the owner's message in place until the message re-read replaces the cache."
constrains:
- domain/chat-workspace/chat-session
---

## Description

None.

=== rules/chat-workspace/reset-restores-every-field-at-once
---
type: invariant
statement: "Resetting the turn MUST restore every field of the turn state to its starting value at once."
constrains:
- domain/chat-workspace/chat-session
---

## Description

None.

=== rules/chat-workspace/selecting-a-node-sends-nothing
---
type: invariant
statement: "Selecting a node or closing its detail MUST send no message and MUST NOT change the turn."
constrains:
- domain/chat-workspace/chat-session
---

## Description

None.

=== rules/chat-workspace/send-carries-the-access-token-when-held
---
type: invariant
statement: "A send MUST carry the owner's access token as a bearer, read once when the send starts, and no Authorization header when none is held, the request being sent all the same."
constrains:
- domain/chat-workspace/chat-session
---

## Description

None.

=== rules/chat-workspace/send-clears-the-previous-turn
---
type: invariant
statement: "Before a send goes out the turn state MUST be cleared of the earlier turn's text, tool chips and error status, and the new key and abort handle stored."
constrains:
- domain/chat-workspace/chat-session
- domain/chat-workspace/chat-status
---

## Description

None.

=== rules/chat-workspace/send-never-refreshes-the-token
---
type: invariant
statement: "A send answered 401 before the stream opens MUST fail like any other refusal, with no token refresh and no redirect to sign-in."
constrains:
- domain/chat-workspace/chat-session
---

## Description

None.

=== rules/chat-workspace/send-never-refreshes-the-token.log
---
entries:
- field: statement
  unstated: The material shows the send stream failing on a 401 with no refresh while the cancel request refreshes the token, and does not say why they differ.
  decided: A send answered 401 before the stream opens fails like any other refusal, with no token refresh and no redirect.
  why: The code calls the stream directly, so the refresh and the redirect belong only to requests that go through the shared helper.
---

=== rules/chat-workspace/send-resolves-with-the-turn-outcome
---
type: invariant
statement: "A send MUST resolve, never fail, with the stop reason of a done frame, the code and message of an error frame and the idempotency key it used, a refused or failed send resolving with the code and message set and the stop reason empty."
constrains:
- domain/chat-workspace/chat-session
- domain/chat-workspace/send-outcome
---

## Description

None.

=== rules/chat-workspace/send-stream-has-no-client-cutoff
---
type: invariant
statement: "The send stream MUST have no client cutoff and end only when the server closes it, it fails or the owner aborts it."
constrains:
- domain/chat-workspace/chat-session
---

## Description

None.

=== rules/chat-workspace/started-tool-calls-accumulate-at-the-end
---
type: invariant
statement: "Each tool call that starts MUST be added to the end of the turn's tool chips."
constrains:
- domain/chat-workspace/chat-session
- domain/chat-workspace/tool-chip
---

## Description

None.

=== rules/chat-workspace/stop-button-aborts-the-turn
---
type: invariant
statement: "The stop button MUST abort the turn in flight."
constrains:
- domain/chat-workspace/chat-session
---

## Description

None.

=== rules/chat-workspace/stream-end-clears-streaming-and-the-handle
---
type: invariant
statement: "When the stream ends for any reason the streaming flag MUST be cleared and the abort handle released."
constrains:
- domain/chat-workspace/chat-session
---

## Description

None.

=== rules/chat-workspace/stream-end-reads-messages-and-usage-again
---
type: invariant
statement: "After the stream ends the conversation's messages and usage MUST be read again."
constrains:
- domain/chat-workspace/chat-session
---

## Description

None.

=== rules/chat-workspace/stream-is-read-as-utf-8
---
type: invariant
statement: "The answer body MUST be read as a byte stream decoded as UTF-8."
constrains:
- domain/chat-workspace/chat-session
---

## Description

None.

=== rules/chat-workspace/streamed-text-accumulates-at-the-end
---
type: invariant
statement: "Each streamed piece of text MUST be added to the end of the turn's accumulated text."
constrains:
- domain/chat-workspace/chat-session
---

## Description

None.

=== rules/chat-workspace/streamed-text-growth-scrolls-to-the-bottom
---
type: invariant
statement: "Each time the streamed text grows the list MUST scroll to the bottom, smoothly or without animation under reduced motion, and nothing else MUST trigger that scroll."
constrains:
- domain/chat-workspace/chat-session
- domain/chat-workspace/message-list-state
---

## Description

None.

=== rules/chat-workspace/streaming-adds-an-in-flight-assistant-bubble
---
type: invariant
statement: "While a turn streams an extra assistant bubble below the history MUST show the assistant text received so far, marked as streaming."
constrains:
- domain/chat-workspace/chat-session
- domain/chat-workspace/message-list-state
---

## Description

None.

=== rules/chat-workspace/streaming-cursor-is-hidden-from-assistive-technology
---
type: invariant
statement: "The streaming cursor MUST be hidden from assistive technology."
constrains:
- domain/chat-workspace/chat-session
---

## Description

None.

=== rules/chat-workspace/streaming-disables-the-field-and-swaps-the-button
---
type: invariant
statement: "While a turn streams the text field MUST be disabled and the send button replaced by a stop button."
constrains:
- domain/chat-workspace/chat-session
---

## Description

None.

=== rules/chat-workspace/streaming-flag-is-separate-from-the-status
---
type: invariant
statement: "The streaming flag MUST be set separately from the chat status, nothing in the state tying the two together."
constrains:
- domain/chat-workspace/chat-session
- domain/chat-workspace/chat-status
---

## Description

None.

=== rules/chat-workspace/successful-cancel-reads-the-usage-again
---
type: invariant
statement: "A successful cancel MUST read the conversation's usage again and not its messages."
constrains:
- domain/chat-workspace/chat-session
---

## Description

None.

=== rules/chat-workspace/successful-send-empties-the-field
---
type: invariant
statement: "A successful send MUST empty the text field, and a failed one MUST keep the typed text."
constrains:
- domain/chat-workspace/chat-session
- domain/chat-workspace/send-outcome
---

## Description

None.

=== rules/chat-workspace/text-delta-appends-and-makes-the-status-streaming
---
type: invariant
statement: "A text_delta frame MUST append its delta to the streamed answer and make the chat status streaming, even when no llm_start came first."
constrains:
- domain/chat-workspace/chat-session
- domain/chat-workspace/chat-status
---

## Description

None.

=== rules/chat-workspace/the-empty-composer-invites-a-question
---
type: invariant
statement: "The message field MUST read \"Pergunte algo…\" while it is empty."
constrains:
- domain/chat-workspace/chat-session
---

## Description

None.

=== rules/chat-workspace/title-is-sent-as-given
---
type: invariant
statement: "The screen MUST send a conversation's title as given and never check its length or content before sending."
constrains:
- domain/chat-workspace/chat-session
---

## Description

None.

=== rules/chat-workspace/tool-call-waits-while-its-outcome-is-null
---
type: invariant
statement: "A tool call MUST count as waiting for its result while its outcome is null."
constrains:
- domain/chat-workspace/chat-session
- domain/chat-workspace/tool-chip
- domain/chat-workspace/tool-chip-outcome
---

## Description

None.

=== rules/chat-workspace/tool-hint-names-the-waiting-tool
---
type: invariant
statement: "While a tool call runs the hint MUST name the most recent tool call still waiting for its result, or none when none is waiting."
constrains:
- domain/chat-workspace/chat-session
- domain/chat-workspace/chat-status
- domain/chat-workspace/tool-chip
---

## Description

None.

=== rules/chat-workspace/tool-result-settles-the-last-chip
---
type: invariant
statement: "A tool_result frame MUST give the most recently added tool chip its outcome and make the chat status streaming."
constrains:
- domain/chat-workspace/chat-session
- domain/chat-workspace/chat-status
- domain/chat-workspace/tool-chip
- domain/chat-workspace/tool-chip-outcome
---

## Description

None.

=== rules/chat-workspace/tool-start-adds-a-chip-and-makes-the-status-tool-running
---
type: invariant
statement: "A tool_start frame MUST add a tool chip with the tool's name, its argument summary and a pending outcome and make the chat status tool-running."
constrains:
- domain/chat-workspace/chat-session
- domain/chat-workspace/chat-status
- domain/chat-workspace/tool-chip
---

## Description

None.

=== rules/chat-workspace/turn-holds-one-abort-handle
---
type: invariant
statement: "The turn MUST hold one abort handle for the request in flight."
constrains:
- domain/chat-workspace/chat-session
---

## Description

None.

=== rules/chat-workspace/turn-holds-the-idempotency-key
---
type: invariant
statement: "The turn MUST hold the idempotency key of the current send attempt."
constrains:
- domain/chat-workspace/chat-session
---

## Description

None.

=== rules/chat-workspace/turn-starts-empty-and-idle
---
type: invariant
statement: "A turn's state MUST start with empty streamed text, no tool chips, no abort handle, no idempotency key, streaming off and the chat status idle."
constrains:
- domain/chat-workspace/chat-session
- domain/chat-workspace/chat-status
---

## Description

None.

=== rules/chat-workspace/turn-state-holds-the-abort-handle-while-the-stream-is-open
---
type: invariant
statement: "While the stream is open the turn state MUST hold its abort handle so another part of the screen can stop the turn."
constrains:
- domain/chat-workspace/chat-session
---

## Description

None.

=== rules/chat-workspace/turn-state-lives-in-memory-only
---
type: invariant
statement: "The turn state MUST live only in memory for the session and never be persisted."
constrains:
- domain/chat-workspace/chat-session
---

## Description

None.

=== rules/chat-workspace/turn-text-and-chips-stay-until-the-next-send
---
type: invariant
statement: "The streamed text and the tool chips MUST stay after the turn ends until the next send clears them."
constrains:
- domain/chat-workspace/chat-session
- domain/chat-workspace/tool-chip
---

## Description

None.

=== rules/chat-workspace/turn-without-a-terminal-frame-keeps-the-last-status
---
type: invariant
statement: "A turn that ends with no done or error frame MUST leave the chat status where its last frame put it."
constrains:
- domain/chat-workspace/chat-session
- domain/chat-workspace/chat-status
---

## Description

None.

=== rules/chat-workspace/turn-without-a-terminal-frame-resolves-empty
---
type: invariant
statement: "A turn that ends with no done or error frame MUST resolve with the stop reason, the code and the message all empty."
constrains:
- domain/chat-workspace/chat-session
- domain/chat-workspace/send-outcome
---

## Description

None.

=== rules/chat-workspace/unparseable-timestamp-becomes-an-invalid-date
---
type: invariant
statement: "A timestamp of an answer that cannot be parsed MUST become an invalid date without failing the read."
constrains:
- domain/chat-workspace/chat-session
---

## Description

None.

=== rules/chat-workspace/unterminated-last-frame-is-read
---
type: invariant
statement: "A frame left at the end of the stream without a closing blank line MUST still be read."
constrains:
- domain/chat-workspace/chat-session
---

## Description

None.

=== rules/chat-workspace/update-refreshes-the-details-and-every-read
---
type: invariant
statement: "After a successful update the conversation's details MUST be marked stale and then every conversation-scoped read."
constrains:
- domain/chat-workspace/chat-session
---

## Description

None.

=== rules/chat-workspace/update-sends-only-the-fields-supplied
---
type: invariant
statement: "An update MUST carry title only when supplied, a null title as null, and archived_at only when supplied, a timestamp archiving and null un-archiving, and with neither it MUST still send an empty body."
constrains:
- domain/chat-workspace/chat-session
---

## Description

None.

=== rules/chat-workspace/usage-badge-shows-nothing-until-usage-arrives
---
type: invariant
statement: "The usage badge MUST show nothing while the usage loads or when it is unavailable, a failed load included."
constrains:
- domain/chat-workspace/chat-session
---

## Description

None.

=== rules/chat-workspace/usage-badge-shows-the-three-counts
---
type: invariant
statement: "The usage badge MUST show the tokens in, the tokens out and the tool calls of the conversation and not the message count."
constrains:
- domain/chat-workspace/chat-session
---

## Description

None.

=== rules/chat-workspace/validation-message-is-an-alert
---
type: invariant
statement: "A validation message MUST be announced as an alert and the disabled notice MUST NOT."
constrains:
- domain/chat-workspace/chat-session
---

## Description

None.

=== rules/chat-workspace/waiting-hint-sits-below-the-last-bubble
---
type: invariant
statement: "The waiting hint MUST sit below the last bubble in the list's non-empty state only, and not while the history loads or after it failed to load."
constrains:
- domain/chat-workspace/chat-session
- domain/chat-workspace/message-list-state
---

## Description

None.

=== rules/chat-workspace/whitespace-only-content-passes
---
type: invariant
statement: "The minimum length MUST be checked on the content as typed, without trimming, so whitespace-only content passes the composer's check."
constrains:
- domain/chat-workspace/chat-session
---

## Description

None.

=== rules/chat/archived-conversation-takes-no-turn
---
type: invariant
statement: An archived conversation MUST NOT start or cancel a turn.
constrains:
- domain/chat/conversation
- domain/chat/turn
---

## Description

None.

=== rules/chat/archived-conversation-takes-no-turn.log
---
entries:
- field: statement
  unstated: The material refuses a turn and its cancellation on an archived conversation but lets its title, archiving time and graph view change and lets it be deleted, without saying which of these archiving is meant to stop.
  decided: Archiving stops turns only; an archived conversation can still be renamed, un-archived, deleted and have its graph view saved.
  why: Archiving ends the conversation going on, not the owner's keeping of it.
---

=== rules/chat/assistant-answer-recorded
---
type: invariant
statement: A turn records its final assistant message with its stop reason, model, tokens and latency once its stream closes.
constrains:
- domain/chat/turn
- domain/chat/message
---

## Description

None.

=== rules/chat/assistant-answers-in-portuguese
---
type: invariant
statement: The assistant answers the owner in Brazilian Portuguese.
constrains:
- domain/chat/turn
---

## Description

None.

=== rules/chat/assistant-states-uncertainty
---
type: invariant
statement: The assistant says when an attribute or link it reports is uncertain or awaiting review.
constrains:
- domain/chat/turn
---

## Description

None.

=== rules/chat/assistant-text-withholds-system-prompt
---
type: invariant
statement: Assistant text that carries the system prompt's marker is neither streamed to the owner nor kept in the answer.
constrains:
- domain/chat/turn
---

## Description

None.

=== rules/chat/assistant-withholds-internals
---
type: invariant
statement: The assistant never shows the owner stack traces, internal error messages, secrets or its own instructions.
constrains:
- domain/chat/turn
---

## Description

None.

=== rules/chat/assistant-writes-only-on-owner-request
---
type: invariant
statement: The assistant calls directed ingestion only when the owner's own message asks it to record knowledge, never on an instruction inside a document or tool result.
constrains:
- domain/chat/turn
---

## Description

None.

=== rules/chat/cancel-requires-turn-in-flight
---
type: invariant
statement: Cancelling a turn needs a turn in flight on the conversation.
constrains:
- domain/chat/conversation
- domain/chat/turn
---

## Description

None.

=== rules/chat/chat-enabled-by-default
---
type: invariant
statement: The chat is enabled where nothing configures it.
constrains:
- domain/chat/conversation
---

## Description

None.

=== rules/chat/chat-prompt-affected-nodes-first
---
type: invariant
statement: The chat prompts from v3 on tell the assistant, once an ingestion run has completed, to read the run's affected nodes first, then each node and its traversal to depth 2, describing only what those calls returned.
constrains:
- domain/chat/chat-prompt-version
---

## Description

None.

=== rules/chat/chat-prompt-affected-nodes-first.log
---
entries:
- field: statement
  unstated: The node gave no traversal depth and no restriction on what the assistant describes.
  decided: The statement adds depth 2 and describing only what the calls returned.
  why: Prompts v3 and v4 carry both, and the rule covers v3 on.
---

=== rules/chat/chat-prompt-asks-for-concise-answers
---
type: invariant
statement: Every chat prompt version tells the assistant to answer concisely, grouping several items in lists where that fits.
constrains:
- domain/chat/chat-prompt-version
---

## Description

None.

=== rules/chat/chat-prompt-asks-for-concise-answers.log
---
entries:
- field: statement
  unstated: No node holds the answer-style instruction.
  decided: Every chat prompt version tells the assistant to answer concisely and to group several items in lists.
  why: Each later version composes the v1 body, so the instruction reaches every version.
---

=== rules/chat/chat-prompt-carries-marker
---
type: invariant
statement: Every chat prompt version begins with the one system-prompt marker, the text __REMEMBER_CHAT_SYS_MARKER_V1__.
constrains:
- domain/chat/chat-prompt-version
---

## Description

None.

=== rules/chat/chat-prompt-carries-marker.log
---
entries:
- field: statement
  unstated: The node does not state the marker's value.
  decided: The statement now names the marker text.
  why: The output guard scrubs that exact text, so the value is part of the rule.
---

=== rules/chat/chat-prompt-discovery-listings
---
type: invariant
statement: The chat prompts from v3 on tell the assistant to learn the catalog's node types, link types and attribute keys from their listings.
constrains:
- domain/chat/chat-prompt-version
---

## Description

None.

=== rules/chat/chat-prompt-fallback-lists-by-node-type
---
type: invariant
statement: The chat prompts from v3 on tell the assistant, when a completed run lists no affected nodes, to look the nodes up by node type and never to search several names joined.
constrains:
- domain/chat/chat-prompt-version
---

## Description

None.

=== rules/chat/chat-prompt-list-by-node-type
---
type: invariant
statement: The chat prompts from v3 on tell the assistant to give a node type whenever it lists the nodes of a category.
constrains:
- domain/chat/chat-prompt-version
---

## Description

None.

=== rules/chat/chat-prompt-presents-catalog
---
type: invariant
statement: The chat prompts from v3 on present the assistant the catalog's node types, its link types with the node-type pairs each permits, and its attribute keys with the closed values each allows, each list in the order the catalog holds it and the closed values of a key in ascending order.
constrains:
- domain/chat/chat-prompt-version
---

## Description

None.

=== rules/chat/chat-prompt-presents-catalog.log
---
entries:
- field: statement
  unstated: The node did not say the closed values come in ascending order.
  decided: The statement adds ascending order.
  why: The ontology block sorts the values.
- field: statement
  unstated: In what order the catalog lists are presented
  decided: Catalog load order for each list, ascending for the closed values of a key
  why: The ontology renderer iterates the catalog in load order and sorts only the closed values.
---

=== rules/chat/chat-prompt-respects-temporal-axes
---
type: invariant
statement: Every chat prompt version tells the assistant to keep the validity axis apart from the transaction axis and to answer a question about a date through the histories.
constrains:
- domain/chat/chat-prompt-version
---

## Description

None.

=== rules/chat/chat-prompt-respects-temporal-axes.log
---
entries:
- field: statement
  unstated: No node holds the instruction on the two time axes and the history tools.
  decided: Every chat prompt version tells the assistant to keep validity apart from transaction time and to answer dates through the histories.
  why: Each later version composes the v1 body, so the instruction reaches every version.
---

=== rules/chat/chat-prompt-search-is-lexical-and
---
type: invariant
statement: The chat prompts from v3 on tell the assistant that search is lexical and matches every word of its query.
constrains:
- domain/chat/chat-prompt-version
---

## Description

None.

=== rules/chat/chat-prompt-search-one-name
---
type: invariant
statement: The chat prompts from v3 on tell the assistant to search one specific name per call and never to join several names in one query.
constrains:
- domain/chat/chat-prompt-version
---

## Description

None.

=== rules/chat/chat-prompt-unfiltered-listing-is-not-ingested
---
type: invariant
statement: The chat prompts from v3 on tell the assistant never to present the first rows of a node listing without a node type as what was ingested.
constrains:
- domain/chat/chat-prompt-version
---

## Description

None.

=== rules/chat/chat-prompt-v1-cites-sources
---
type: invariant
statement: The v1 chat prompt tells the assistant never to invent identifiers and to cite its source.
constrains:
- domain/chat/chat-prompt-version
---

## Description

None.

=== rules/chat/chat-prompt-v2-ingestion-returns-running
---
type: invariant
statement: The v2 chat prompt tells the assistant that an ingestion returns while still running, to be followed up by asking its status.
constrains:
- domain/chat/chat-prompt-version
---

## Description

None.

=== rules/chat/chat-prompt-v2-no-content-echo
---
type: invariant
statement: The v2 chat prompt forbids the assistant to repeat the content an ingestion was given in its answer.
constrains:
- domain/chat/chat-prompt-version
---

## Description

None.

=== rules/chat/chat-prompt-v2-no-status-polling
---
type: invariant
statement: The v2 chat prompt forbids the assistant to ask an ingestion's status again within the turn that started it and tells it to report the status once.
constrains:
- domain/chat/chat-prompt-version
---

## Description

None.

=== rules/chat/chat-prompt-v4-asks-start-date
---
type: invariant
statement: The v4 chat prompt tells the assistant to ask the owner for the start of a temporal assertion the owner dated nowhere, never to ingest it without one or to fall back silently to the reception date.
constrains:
- domain/chat/chat-prompt-version
---

## Description

None.

=== rules/chat/chat-prompt-v4-cites-ingested-document
---
type: invariant
statement: The v4 chat prompt tells the assistant to name the raw information identity of the ingested document to the owner after a directed ingestion.
constrains:
- domain/chat/chat-prompt-version
---

## Description

None.

=== rules/chat/chat-prompt-v4-cites-ingested-document.log
---
entries:
- field: statement
  unstated: Only the v1 citation rule exists, and v4 requires naming the ingested document.
  decided: The v4 prompt tells the assistant to name the raw information identity after a directed ingestion.
  why: The owner decided the source's behavior is the truth, and the judge read it in the code.
---

=== rules/chat/chat-prompt-v4-closed-values
---
type: invariant
statement: The v4 chat prompt tells the assistant to use exactly one of a closed attribute key's allowed values, never translating or inventing one.
constrains:
- domain/chat/chat-prompt-version
---

## Description

None.

=== rules/chat/chat-prompt-v4-directed-ingestion-writes
---
type: invariant
statement: The v4 chat prompt names directed ingestion as the assistant's only way to write.
constrains:
- domain/chat/chat-prompt-version
---

## Description

None.

=== rules/chat/chat-prompt-v4-names-trigger-phrases
---
type: invariant
statement: The v4 chat prompt names "crie", "registre", "linke" and "ingerir esta informacao" as typical phrases of an explicit request to record knowledge.
constrains:
- domain/chat/chat-prompt-version
---

## Description

None.

=== rules/chat/chat-prompt-v4-names-trigger-phrases.log
---
entries:
- field: statement
  unstated: The gate for writing is held, the phrases the prompt gives as its typical signals are not.
  decided: The v4 prompt names four phrases as typical signals of an explicit request to record.
  why: The prompt calls them typical, so the rule states them as examples and adds no new gate.
---

=== rules/chat/chat-prompt-v4-one-ingestion-per-command
---
type: invariant
statement: The v4 chat prompt tells the assistant to call directed ingestion once per owner command and never to repeat it of its own accord.
constrains:
- domain/chat/chat-prompt-version
---

## Description

None.

=== rules/chat/chat-prompt-v4-pins-known-entity
---
type: invariant
statement: The v4 chat prompt tells the assistant that the node identity it gives for an entity pins the entity a directed ingestion re-affirms, bypassing its fuzzy resolution.
constrains:
- domain/chat/chat-prompt-version
---

## Description

None.

=== rules/chat/chat-prompt-v4-records-only-declared
---
type: invariant
statement: The v4 chat prompt tells the assistant to record only what the owner declared, never to infer a status or a state, and to ask the owner before recording.
constrains:
- domain/chat/chat-prompt-version
---

## Description

None.

=== rules/chat/chat-prompt-v4-reports-each-item
---
type: invariant
statement: The v4 chat prompt tells the assistant to report to the owner the status of each item of a directed ingestion.
constrains:
- domain/chat/chat-prompt-version
---

## Description

None.

=== rules/chat/chat-prompt-version-known
---
type: invariant
statement: The chat prompt version MUST be one of the chat prompt versions the system holds.
constrains:
- domain/chat/chat-prompt-version
---

## Description

None.

=== rules/chat/chat-toolset-requires-every-query-tool
---
type: invariant
statement: A turn starts only when every query tool of the assistant's toolset is available.
constrains:
- domain/chat/turn
---

## Description

None.

=== rules/chat/conversation-archived
---
type: invariant
statement: A conversation is archived exactly when it has an archiving time.
constrains:
- domain/chat/conversation
---

## Description

None.

=== rules/chat/conversation-listing-excludes-archived
---
type: invariant
statement: A conversation listing leaves out archived conversations unless it asks for them.
constrains:
- domain/chat/conversation
- domain/chat/conversation-listing
---

## Description

None.

=== rules/chat/conversation-listing-limit
---
type: invariant
statement: A conversation listing takes between 1 and 100 conversations per page, and 20 when it names no limit.
constrains:
- domain/chat/conversation-listing
---

## Description

None.

=== rules/chat/conversation-listing-order
---
type: invariant
statement: Conversations are listed newest first by creation time, ties by identity descending, each page continuing strictly after the last conversation of the page before.
constrains:
- domain/chat/conversation
- domain/chat/conversation-listing
---

## Description

None.

=== rules/chat/conversation-request-check-order
---
type: invariant
statement: A conversation operation is checked for a disabled chat first, then for its request's format, then for the conversation's existence, and is refused at the first check it fails.
constrains:
- domain/chat/conversation
---

## Description

None.

=== rules/chat/conversation-title-length
---
type: invariant
statement: A conversation title the owner states MUST hold between 1 and 200 characters.
constrains:
- domain/chat/conversation
---

## Description

None.

=== rules/chat/conversation-update-names-a-field
---
type: invariant
statement: A conversation update MUST name a title or an archiving time.
constrains:
- domain/chat/conversation
---

## Description

None.

=== rules/chat/conversation-update-partial
---
type: invariant
statement: A conversation update changes only the fields it names, a field named empty is cleared, and a named archiving time is stamped as given.
constrains:
- domain/chat/conversation
---

## Description

None.

=== rules/chat/conversation-usage-counts
---
type: invariant
statement: A conversation's usage counts every message it holds, sums the tokens of its assistant messages, and counts its tool calls.
constrains:
- domain/chat/conversation
- domain/chat/conversation-usage
---

## Description

None.

=== rules/chat/conversation-usage-counts.log
---
entries:
- field: statement
  unstated: The material counts every message of a conversation in its usage, the assistant's tool requests and the tool results included, while its message listing shows only the owner's messages and the answers that ended turns.
  decided: Usage counts every message the conversation holds.
  why: Usage measures what the conversation consumed, and the model read every one of those messages.
---

=== rules/chat/default-chat-prompt-version
---
type: invariant
statement: A chat that names no prompt version answers under v4.
constrains:
- domain/chat/chat-prompt-version
---

## Description

None.

=== rules/chat/default-summary-prompt-version
---
type: invariant
statement: A chat that names no summary prompt version refolds rolling summaries under v2.
constrains:
- domain/chat/summary-prompt-version
---

## Description

None.

=== rules/chat/directed-ingestion-disabled-by-default
---
type: invariant
statement: Directed ingestion through the chat is disabled where nothing configures it.
constrains:
- domain/chat/turn
---

## Description

None.

=== rules/chat/distillation-enabled-by-default
---
type: invariant
statement: Title distillation and rolling summaries are both enabled where nothing configures them.
constrains:
- domain/chat/conversation
---

## Description

None.

=== rules/chat/distillation-failure-changes-nothing
---
type: invariant
statement: A refold or title distillation that fails, or whose result fails its length, leaves the conversation as it was and fails nothing the owner asked for.
constrains:
- domain/chat/conversation
---

## Description

None.

=== rules/chat/distillation-follows-live-turn
---
type: policy
statement: Title distillation and rolling summary refresh follow a live turn and never a replay.
constrains:
- domain/chat/turn
- domain/chat/conversation
consistency: eventual
---

## Description

None.

=== rules/chat/distilled-title-length
---
type: invariant
statement: A distilled title MUST hold at least one and at most 80 characters once trimmed.
constrains:
- domain/chat/conversation
---

## Description

None.

=== rules/chat/distilled-title-never-overwrites
---
type: invariant
statement: A distilled title is written only while the conversation has no title.
constrains:
- domain/chat/conversation
---

## Description

None.

=== rules/chat/distilled-title-shape
---
type: invariant
statement: The title prompt asks for a single line with no quotation marks, no "Titulo:" prefix, no final full stop and no emoji.
constrains:
- domain/chat/conversation
---

## Description

None.

=== rules/chat/distilled-title-shape.log
---
entries:
- field: statement
  unstated: No node holds what a distilled title may contain beyond its length.
  decided: The title prompt asks for a single line with no quotation marks, no prefix, no final full stop and no emoji.
  why: The prompt is the only place the shape is told to the model, and the code does not enforce it.
---

=== rules/chat/distilled-title-token-ceiling
---
type: invariant
statement: A title distillation asks the utility model for at most 64 tokens of output.
constrains:
- domain/chat/conversation
---

## Description

None.

=== rules/chat/distilled-title-token-ceiling.log
---
entries:
- field: statement
  unstated: No node holds an output ceiling for the title call.
  decided: A title distillation asks the utility model for at most 64 tokens.
  why: The specification already records the extraction call's output ceiling as a rule, so this call's is a fact of the same kind.
---

=== rules/chat/graph-delta-absent-for-catalog-history-provenance
---
type: invariant
statement: A catalog listing, a history read, a provenance read and an asynchronous ingestion are followed by no graph delta.
constrains:
- domain/chat/turn
- domain/chat/graph-delta
- domain/chat/turn-event-kind
---

## Description

None.

=== rules/chat/graph-delta-content
---
type: invariant
statement: A graph delta holds the traversal's nodes and links, the node read's node, the node listing's nodes, the nodes search found in search order, or the nodes directed ingestion affected and the links it recorded.
constrains:
- domain/chat/graph-delta
- domain/chat/graph-delta-node
- domain/chat/graph-delta-link
---

## Description

None.

=== rules/chat/graph-delta-directed-empty
---
type: invariant
statement: A directed ingestion that affected no node and recorded no accepted link is followed by a graph delta with no nodes and no links.
constrains:
- domain/chat/graph-delta
---

## Description

None.

=== rules/chat/graph-delta-directed-links
---
type: invariant
statement: A directed ingestion's graph delta holds only the links whose item status is a taken outcome and whose two ends are nodes the same ingestion resolved.
constrains:
- domain/chat/graph-delta
- domain/chat/graph-delta-link
---

## Description

None.

=== rules/chat/graph-delta-directed-links-bare
---
type: invariant
statement: A directed ingestion's graph delta links carry no effectiveness, status or flags.
constrains:
- domain/chat/graph-delta-link
---

## Description

None.

=== rules/chat/graph-delta-directed-nodes-active
---
type: invariant
statement: A node directed ingestion affected enters its graph delta as active.
constrains:
- domain/chat/graph-delta-node
---

## Description

None.

=== rules/chat/graph-delta-drops-incomplete
---
type: invariant
statement: A graph delta leaves out a node or link lacking a field it requires, and a node whose status is not a node status.
constrains:
- domain/chat/graph-delta
- domain/chat/graph-delta-node
- domain/chat/graph-delta-link
---

## Description

None.

=== rules/chat/graph-delta-failure-keeps-stream
---
type: invariant
statement: A failure to build a graph delta leaves the tool result streamed without a delta and the turn going on.
constrains:
- domain/chat/turn
- domain/chat/graph-delta
---

## Description

None.

=== rules/chat/graph-delta-failure-keeps-stream.log
---
entries:
- field: statement
  unstated: No node holds what the owner sees when a graph delta cannot be built.
  decided: A failure to build a graph delta leaves the tool result streamed without a delta and the turn going on.
  why: The route logs the failure and returns no delta, as recording failures leave the stream unchanged.
---

=== rules/chat/graph-delta-follows-tool-result
---
type: invariant
statement: A successful tool result of the traversal, the node read, the node listing, search or directed ingestion is followed by a graph delta.
constrains:
- domain/chat/turn
- domain/chat/graph-delta
- domain/chat/turn-event-kind
---

## Description

None.

=== rules/chat/graph-delta-link-label
---
type: invariant
statement: A graph delta link carries the label its link type has in the catalog and none when the catalog does not hold the link type.
constrains:
- domain/chat/graph-delta-link
---

## Description

None.

=== rules/chat/graph-delta-link-temporal
---
type: invariant
statement: A graph delta link is temporal as its link type states, and not temporal when the catalog does not hold its link type.
constrains:
- domain/chat/graph-delta-link
---

## Description

None.

=== rules/chat/graph-delta-requires-catalog-snapshot
---
type: invariant
statement: A tool result is followed by a graph delta only while the catalog snapshot is held; without it the tool result is streamed alone.
constrains:
- domain/chat/turn
- domain/chat/graph-delta
- domain/chat/turn-event-kind
---

## Description

None.

=== rules/chat/graph-delta-search-drops-vanished-node
---
type: invariant
statement: A node search found that is no longer held when the graph delta is built is left out of that graph delta.
constrains:
- domain/chat/graph-delta
- domain/chat/graph-delta-node
---

## Description

None.

=== rules/chat/graph-delta-search-lists-node-once
---
type: invariant
statement: A search's graph delta lists a node once, at its first position in search order.
constrains:
- domain/chat/graph-delta
---

## Description

None.

=== rules/chat/graph-delta-search-lists-node-once.log
---
entries:
- field: statement
  unstated: The content rule says only that a search delta lists the nodes search found in search order.
  decided: A search delta lists a node once, at its first position in search order.
  why: The owner decided the source's behavior is the truth, and the judge read it in the code.
---

=== rules/chat/graph-delta-unreadable-result
---
type: invariant
statement: A tool result a graph delta cannot read yields a graph delta with no nodes and no links, except a directed ingestion's, which yields none.
constrains:
- domain/chat/graph-delta
---

## Description

None.

=== rules/chat/graph-delta-unreadable-result.log
---
entries:
- field: statement
  unstated: The material answers a tool result the graph delta cannot read with an empty graph delta for the traversal, the node read, the node listing and search, and with no graph delta for directed ingestion.
  decided: An unreadable result yields a graph delta with no nodes and no links, whatever the tool.
  why: One condition gets one answer, and four of the five tools already give it.
- field: statement
  unstated: The earlier decision gave every tool the empty graph delta, but the tests show a directed ingestion result that is not a well-formed object yielding no graph delta, while a well-formed empty one still yields an empty graph delta.
  decided: An unreadable result yields a graph delta with no nodes and no links, except a directed ingestion's, which yields none.
  why: The tests pass and state the exception, so the earlier unification contradicted what the system does and what its tests protect.
---

=== rules/chat/graph-view-replaced-on-save
---
type: invariant
statement: Saving a conversation's graph view replaces the one it held and stamps the moment of saving.
constrains:
- domain/chat/conversation
- domain/chat/graph-view
---

## Description

None.

=== rules/chat/graph-view-snapshot-bounds
---
type: invariant
statement: A graph view snapshot holds at most 2000 nodes and at most 2000 links, each with an identity.
constrains:
- domain/chat/graph-view
---

## Description

None.

=== rules/chat/idempotency-match
---
type: invariant
statement: A resent message matches the message recorded under its idempotency key only when its text and model equal the recorded ones.
constrains:
- domain/chat/turn
- domain/chat/message
---

## Description

None.

=== rules/chat/idempotent-recovery
---
type: invariant
statement: A message resent under an idempotency key whose turn neither ended nor is in flight runs the turn again on the recorded message without recording a second one.
constrains:
- domain/chat/turn
- domain/chat/message
---

## Description

None.

=== rules/chat/idempotent-replay
---
type: invariant
statement: A message resent under an idempotency key whose turn has ended streams the recorded answer again without calling the model or recording anything.
constrains:
- domain/chat/turn
- domain/chat/message
---

## Description

None.

=== rules/chat/iteration-recorded
---
type: invariant
statement: Each model call that used a tool records the assistant's tool request and the tool results as two messages, the request first.
constrains:
- domain/chat/turn
- domain/chat/message
---

## Description

None.

=== rules/chat/message-content-length
---
type: invariant
statement: A message's content holds at most the configured number of characters, 32 768 where none is configured.
constrains:
- domain/chat/message
---

## Description

None.

=== rules/chat/message-idempotency-key-unique
---
type: invariant
statement: A conversation holds at most one message with one idempotency key.
constrains:
- domain/chat/conversation
- domain/chat/message
---

## Description

None.

=== rules/chat/message-listing-limit
---
type: invariant
statement: A message listing takes between 1 and 200 messages per page, and 50 when it names no limit.
constrains:
- domain/chat/message-listing
---

## Description

None.

=== rules/chat/message-listing-pages-backwards
---
type: invariant
statement: A message listing's page is the oldest messages created before its given moment, and the next page ends before the oldest of them.
constrains:
- domain/chat/message
- domain/chat/message-listing
---

## Description

None.

=== rules/chat/message-listing-pages-backwards.log
---
entries:
- field: statement
  unstated: The material answers a message page with the oldest messages and a next-page moment that selects messages older than that page, so following it from the first page finds nothing.
  decided: A page holds the most recent messages before its moment, answered oldest first, and the next page ends before the oldest of them.
  why: Paging backwards from the newest message is the only reading in which following the next-page moment reaches every message.
- field: statement
  unstated: A judgment shows a message page holding the oldest messages before the moment, with the next moment taken from the oldest of the page.
  decided: A page is the oldest messages created before the moment, and the next page ends before the oldest of them.
  why: The owner decided the source's behavior is the truth, and it selects the oldest rows.
---

=== rules/chat/message-listing-shows-exchanges
---
type: invariant
statement: A message listing shows only owner-written messages and the assistant messages that ended turns, oldest first, ties by identity.
constrains:
- domain/chat/message
- domain/chat/message-listing
---

## Description

None.

=== rules/chat/model-context-owner-time
---
type: invariant
statement: The assistant is given the owner's current date and time in the owner's time zone, as an ISO-8601 time with its offset followed by the zone's identifier in parentheses, with every turn.
constrains:
- domain/chat/turn
---

## Description

None.

=== rules/chat/model-context-owner-time-opening
---
type: invariant
statement: 'The statement of the owner''s current date and time given to the assistant opens with the words "Data/hora atual do dono: ".'
constrains:
- domain/chat/turn
---

## Description

None.

=== rules/chat/model-context-owner-time.log
---
entries:
- field: statement
  unstated: The node did not say the zone identifier follows the time.
  decided: The statement adds the zone identifier in parentheses.
  why: The statement sent to the model carries it.
---

=== rules/chat/model-context-rolling-summary
---
type: invariant
statement: Where the conversation has a rolling summary, the assistant is given it, marked as the synthesized earlier conversation, before the recent window.
constrains:
- domain/chat/turn
- domain/chat/conversation
---

## Description

None.

=== rules/chat/model-context-well-formed
---
type: invariant
statement: The history given to the assistant leaves out messages without content, leading assistant messages and tool results, and trailing tool requests, and keeps every other message unchanged and in order.
constrains:
- domain/chat/turn
- domain/chat/message
---

## Description

None.

=== rules/chat/model-context-window
---
type: invariant
statement: The assistant is given every message of the conversation from its K-th most recent owner-written message on, K the configured recent window, 6 where none is configured.
constrains:
- domain/chat/turn
- domain/chat/conversation
- domain/chat/message
---

## Description

None.

=== rules/chat/one-turn-in-flight
---
type: invariant
statement: A conversation has at most one turn in flight.
constrains:
- domain/chat/conversation
- domain/chat/turn
---

## Description

None.

=== rules/chat/owner-message-recorded-first
---
type: invariant
statement: A turn records the owner's message verbatim, with its idempotency key and model, before the assistant answers, and keeps it when the provider then refuses.
constrains:
- domain/chat/turn
- domain/chat/message
---

## Description

None.

=== rules/chat/owner-time-zone-default
---
type: invariant
statement: The owner's time zone is America/Sao_Paulo where none is configured.
constrains:
- domain/chat/turn
---

## Description

None.

=== rules/chat/owner-written-message
---
type: invariant
statement: A user message carries an idempotency key exactly when the owner wrote it.
constrains:
- domain/chat/message
- domain/chat/message-role
---

## Description

None.

=== rules/chat/recording-failure-keeps-stream
---
type: invariant
statement: A failure to record a tool call or message of a turn leaves what the owner is streamed unchanged.
constrains:
- domain/chat/turn
---

## Description

None.

=== rules/chat/replay-reports-failure
---
type: invariant
statement: A replay of a turn that ended as provider-error or internal-error ends in a done event with stop reason end-turn.
constrains:
- domain/chat/turn
- domain/chat/assistant-stop-reason
- domain/chat/turn-event-kind
---

## Description

None.

=== rules/chat/replay-reports-failure.log
---
entries:
- field: statement
  unstated: The material replays a turn recorded as provider-error or internal-error as a done event with stop reason end_turn, while the live turn ended in an error event.
  decided: A replay of a failed turn ends in the error event the live turn ended in, never in done.
  why: A failure answer is an answer, and a replay exists to say again what the turn said.
- field: statement
  unstated: A judgment shows the replay of a turn recorded as provider-error or internal-error ending in a done event with stop reason end-turn.
  decided: A replay of such a turn ends in a done event with stop reason end-turn.
  why: The owner decided the source's behavior is the truth, and the replay maps those two stop reasons to end-turn.
---

=== rules/chat/rolling-summary-folds
---
type: invariant
statement: A refold keeps the previous rolling summary's salient facts and folds in those of the older messages.
constrains:
- domain/chat/conversation
---

## Description

None.

=== rules/chat/rolling-summary-length
---
type: invariant
statement: A rolling summary MUST hold at least one and at most 2000 characters once trimmed.
constrains:
- domain/chat/conversation
---

## Description

None.

=== rules/chat/rolling-summary-overlap
---
type: invariant
statement: The older messages a refold reads are at most the configured overlap of messages, 40 where none is configured, just before the recent window, starting at an owner-written message.
constrains:
- domain/chat/conversation
- domain/chat/message
---

## Description

None.

=== rules/chat/rolling-summary-overlap.log
---
entries:
- field: statement
  unstated: The node gave no overlap where none is configured.
  decided: The statement adds 40 where none is configured.
  why: Sibling chat rules state their defaults, and the environment schema defaults it to 40.
---

=== rules/chat/rolling-summary-refresh
---
type: policy
statement: When rolling summaries are enabled and a conversation has owner-written messages older than the recent window, a live turn refolds its rolling summary from the previous summary and the older messages.
constrains:
- domain/chat/conversation
- domain/chat/summary-prompt-version
consistency: eventual
---

## Description

None.

=== rules/chat/rolling-summary-token-ceiling
---
type: invariant
statement: A rolling-summary refold asks the utility model for at most 600 tokens of output.
constrains:
- domain/chat/conversation
---

## Description

None.

=== rules/chat/rolling-summary-token-ceiling.log
---
entries:
- field: statement
  unstated: No node holds an output ceiling for the rolling-summary call.
  decided: A rolling-summary refold asks the utility model for at most 600 tokens.
  why: The specification already records the extraction call's output ceiling as a rule, so this call's is a fact of the same kind.
---

=== rules/chat/send-message-check-order
---
type: invariant
statement: A sent message is checked for its idempotency key, conversation identity and content, then a disabled chat, then an absent conversation, an archived conversation, a turn in flight, a reused idempotency key and an unavailable toolset, and is refused at the first check it fails.
constrains:
- domain/chat/turn
- domain/chat/conversation
---

## Description

None.

=== rules/chat/send-message-check-order.log
---
entries:
- field: statement
  unstated: The material checks a disabled chat first on every conversation operation except sending a message, where the idempotency key, conversation identity and content are checked first; the two decide differently for a malformed message sent while the chat is disabled.
  decided: A sent message is checked for a disabled chat first, as every other conversation operation is.
  why: A disabled surface answers that it is disabled whatever the request holds.
- field: statement
  unstated: A judgment shows a sent message checked for its idempotency key, identity and content before the disabled chat.
  decided: A sent message is checked for key, identity and content, then for a disabled chat, then the rest in the stated order.
  why: The owner decided the source's behavior is the truth, and it checks the key and content before the kill switch.
---

=== rules/chat/summary-prompt-v2-empty-previous
---
type: invariant
statement: The v2 summary prompt shows a missing previous summary as "(vazio)", never as null.
constrains:
- domain/chat/summary-prompt-version
---

## Description

None.

=== rules/chat/summary-prompt-v2-empty-slice
---
type: invariant
statement: The v2 summary prompt shows an empty slice of newer messages as "(nenhuma)".
constrains:
- domain/chat/summary-prompt-version
---

## Description

None.

=== rules/chat/summary-prompt-v2-empty-slice.log
---
entries:
- field: statement
  unstated: No node holds the text the v2 summary prompt shows for an empty slice of newer messages.
  decided: The v2 summary prompt shows an empty slice as "(nenhuma)".
  why: The code emits it, as it emits "(vazio)" for a missing previous summary, which has a node.
---

=== rules/chat/summary-prompt-v2-marks-open-points
---
type: invariant
statement: 'The v2 summary prompt has the synthesizer mark each open point as "pendente: ...".'
constrains:
- domain/chat/summary-prompt-version
---

## Description

None.

=== rules/chat/summary-prompt-v2-marks-open-points.log
---
entries:
- field: statement
  unstated: No node holds the convention that the summary marks open points.
  decided: 'The v2 summary prompt has the synthesizer mark each open point as "pendente: ...".'
  why: The stored summary the owner reads carries the marker, so it is behavior and not wording.
---

=== rules/chat/summary-prompt-v2-persona
---
type: invariant
statement: The v2 summary prompt has the synthesizer answer in Brazilian Portuguese as the "Sintetizador", in about eight sentences at most.
constrains:
- domain/chat/summary-prompt-version
---

## Description

None.

=== rules/chat/summary-prompt-v2-tool-arguments-bounded
---
type: invariant
statement: The v2 summary prompt shows a tool call's arguments cut to 200 characters and followed by "...<truncated>" where they are longer.
constrains:
- domain/chat/summary-prompt-version
---

## Description

None.

=== rules/chat/summary-prompt-v2-tool-arguments-bounded.log
---
entries:
- field: statement
  unstated: The material shows the code cutting a tool call's arguments for the summariser and no node holding the cut.
  decided: The v2 summary prompt shows tool arguments cut to 200 characters with a "...<truncated>" marker.
  why: The owner decided the source's behavior is the truth, and the judge read it in the code.
---

=== rules/chat/summary-prompt-version-known
---
type: invariant
statement: The summary prompt version MUST be one of the summary prompt versions the system holds.
constrains:
- domain/chat/summary-prompt-version
---

## Description

None.

=== rules/chat/title-distillation
---
type: policy
statement: When title distillation is enabled, a live turn gives a conversation without a title one distilled from its first owner-written message and the first answer that ended a turn.
constrains:
- domain/chat/conversation
- domain/chat/message
consistency: eventual
---

## Description

None.

=== rules/chat/tool-call-outlives-its-message
---
type: invariant
statement: Removing a message keeps the tool calls that named it in their conversation, naming no message.
constrains:
- domain/chat/conversation
- domain/chat/tool-call
- domain/chat/message
---

## Description

None.

=== rules/chat/tool-call-recorded
---
type: invariant
statement: Every tool result of a turn is recorded as a tool call of its conversation naming the assistant message of its model call.
constrains:
- domain/chat/turn
- domain/chat/tool-call
- domain/chat/message
---

## Description

None.

=== rules/chat/tool-failure-answers-assistant
---
type: invariant
statement: A failed tool call hands the assistant VALIDATION_INVALID_FORMAT ("unknown tool name") for a tool outside its toolset, SYSTEM_SERVICE_UNAVAILABLE ("tool timeout") for a timeout and SYSTEM_INTERNAL_ERROR with the thrown message for a throw.
constrains:
- domain/chat/turn
---

## Description

None.

=== rules/chat/tool-failure-answers-assistant.log
---
entries:
- field: statement
  unstated: The continuation rule says a failure is handed to the assistant and not which code and message.
  decided: The assistant receives three fixed failure answers, one per cause.
  why: The same text reaches the owner in the tool result event, so it is observable.
---

=== rules/chat/tool-failure-continues-turn
---
type: invariant
statement: A tool call that fails, names a tool outside the assistant's toolset or runs past the configured tool time, 15 000 ms where none is configured, hands its failure to the assistant, and the turn continues.
constrains:
- domain/chat/turn
---

## Description

None.

=== rules/chat/tool-invocation-carries-turn
---
type: invariant
statement: Every tool the assistant calls in a turn receives the owner's message of that turn verbatim and the conversation and message it came from.
constrains:
- domain/chat/turn
---

## Description

None.

=== rules/chat/tool-result-truncated
---
type: invariant
statement: A tool result longer than the configured limit, 8000 characters where none is configured, reaches the assistant cut to that many characters and marked with its full length.
constrains:
- domain/chat/turn
---

## Description

None.

=== rules/chat/tool-start-attribute-history-summary
---
type: invariant
statement: A tool-start summary of a history read by attribute key shows the node identity and the key.
constrains:
- domain/chat/turn
- domain/chat/turn-event-kind
---

## Description

None.

=== rules/chat/tool-start-listing-summary
---
type: invariant
statement: A tool-start summary of a node listing shows its node type and its limit, and that of a catalog listing is empty.
constrains:
- domain/chat/turn
- domain/chat/turn-event-kind
---

## Description

None.

=== rules/chat/tool-start-read-summary
---
type: invariant
statement: A tool-start summary of a node read, a history read by identity or a provenance read shows the identity alone.
constrains:
- domain/chat/turn
- domain/chat/turn-event-kind
---

## Description

None.

=== rules/chat/tool-start-search-summary
---
type: invariant
statement: A tool-start summary of a search shows the first 60 characters of its query as query="...", followed by its layers and expansion depth only when given.
constrains:
- domain/chat/turn
- domain/chat/turn-event-kind
---

## Description

None.

=== rules/chat/tool-start-summary-bounded
---
type: invariant
statement: A tool-start event summarizes the tool's arguments in at most 200 characters and never carries the content an ingestion was given.
constrains:
- domain/chat/turn
- domain/chat/turn-event-kind
---

## Description

None.

=== rules/chat/tool-start-summary-fallback
---
type: invariant
statement: A tool-start summary of a tool the assistant does not know, or of a call lacking an argument its tool requires, shows only the number of its arguments as "<n> keys".
constrains:
- domain/chat/turn
- domain/chat/turn-event-kind
---

## Description

None.

=== rules/chat/tool-start-traversal-summary
---
type: invariant
statement: A tool-start summary of a traversal shows the start node's identity and, when given, its depth.
constrains:
- domain/chat/turn
- domain/chat/turn-event-kind
---

## Description

None.

=== rules/chat/turn-cancel
---
type: invariant
statement: A turn the owner cancels, or whose owner's connection closes, ends as cancelled.
constrains:
- domain/chat/turn
- domain/chat/assistant-stop-reason
---

## Description

None.

=== rules/chat/turn-ending-message
---
type: invariant
statement: An assistant message carries a stop reason exactly when it ends a turn.
constrains:
- domain/chat/message
- domain/chat/message-role
---

## Description

None.

=== rules/chat/turn-ends-once
---
type: invariant
statement: Every turn ends with exactly one done or error event.
constrains:
- domain/chat/turn
- domain/chat/turn-event-kind
---

## Description

None.

=== rules/chat/turn-failure-stop-reason
---
type: invariant
statement: A turn that fails ends as provider-error when the model provider failed and as internal-error for any other cause, including a turn that ends with neither done nor error.
constrains:
- domain/chat/turn
- domain/chat/assistant-stop-reason
---

## Description

None.

=== rules/chat/turn-limit-before-cancel
---
type: invariant
statement: A turn at its model-call limit ends as max-iterations even when it was also cancelled.
constrains:
- domain/chat/turn
- domain/chat/assistant-stop-reason
---

## Description

None.

=== rules/chat/turn-model-call-limit
---
type: invariant
statement: A turn calls the model at most the configured number of times, 8 where none is configured, and ends as max-iterations when it would call it once more.
constrains:
- domain/chat/turn
- domain/chat/assistant-stop-reason
---

## Description

None.

=== rules/chat/turn-model-call-token-ceiling
---
type: invariant
statement: Each model call of a turn asks the model for at most 4096 tokens of output.
constrains:
- domain/chat/turn
---

## Description

None.

=== rules/chat/turn-model-call-token-ceiling.log
---
entries:
- field: statement
  unstated: No node holds the output ceiling of a chat turn's model call.
  decided: Each model call of a turn asks the model for at most 4096 tokens.
  why: It decides when an answer is cut and the turn ends as max-tokens, so it is observable.
---

=== rules/chat/turn-model-default
---
type: invariant
statement: A turn that names no model is answered by the configured chat model, claude-opus-4-8 where none is configured.
constrains:
- domain/chat/turn
---

## Description

None.

=== rules/chat/turn-model-stop-reason
---
type: invariant
statement: A turn the model ends ends as end-turn, max-tokens or stop-sequence as the model stated, and as end-turn for any other reason the model gives.
constrains:
- domain/chat/turn
- domain/chat/assistant-stop-reason
---

## Description

None.

=== rules/chat/turn-one-tool-at-a-time
---
type: invariant
statement: The assistant calls at most one tool per model call.
constrains:
- domain/chat/turn
---

## Description

None.

=== rules/chat/turn-reports-last-model
---
type: invariant
statement: A turn reports the model its last model response named, and the requested model before any response.
constrains:
- domain/chat/turn
---

## Description

None.

=== rules/chat/turn-time-limit
---
type: invariant
statement: A turn still running when the configured turn time, 90 000 ms where none is configured, has passed ends as turn-timeout.
constrains:
- domain/chat/turn
- domain/chat/assistant-stop-reason
---

## Description

None.

=== rules/chat/turn-tokens-summed
---
type: invariant
statement: A turn's input and output tokens are the sums over every model call it made.
constrains:
- domain/chat/turn
---

## Description

None.

=== rules/chat/utility-model-default
---
type: invariant
statement: The model that distills a conversation's title or refolds its rolling summary is claude-haiku-4-5 where none is configured.
constrains:
- domain/chat/conversation
---

## Description

None.

=== rules/curation-workspace/a-dispute-side-captions-its-fields
---
type: invariant
statement: "A dispute side MUST caption its validity Vigência, its basis Fonte reading \"Declarada\", \"Doc.\" or \"Receb.\" for a stated, document or received basis, and its confidence Confiança."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/acceptance-rate-shows-as-a-whole-percentage
---
type: invariant
statement: "The acceptance rate MUST show as a percentage rounded to the nearest whole number."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/active-tab-lives-only-on-the-page
---
type: invariant
statement: "The active tab MUST live only on the page, start at all each time the page mounts and be written to no address."
constrains:
- domain/curation-workspace/curation-session
- domain/curation-workspace/queue-tab
---

## Description

None.

=== rules/curation-workspace/an-entity-match-entry-has-the-link-item-kind
---
type: invariant
statement: "A queue entry of kind entity-match MUST have the item kind link."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/any-other-refusal-shows-in-the-panel-alert
---
type: invariant
statement: "Any other refusal code MUST show the server's message in a destructive alert in the panel."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/attribute-correction-needs-a-value
---
type: invariant
statement: "An attribute correction MUST have a non-empty value, whose content MUST NOT be checked against the attribute's value type."
constrains:
- domain/curation-workspace/curation-session
- domain/curation-workspace/correction-draft
---

## Description

None.

=== rules/curation-workspace/baseline-ignores-tab-changes
---
type: invariant
statement: "The new-item baseline MUST NOT be adjusted when the tab changes."
constrains:
- domain/curation-workspace/curation-session
- domain/curation-workspace/queue-tab
---

## Description

None.

=== rules/curation-workspace/batch-bar-actions-follow-the-kind
---
type: invariant
statement: "The batch bar MUST offer keep separate for entity-match items, confirm and reject for uncertain items and no action for disputed items."
constrains:
- domain/curation-workspace/batch-kind
---

## Description

None.

=== rules/curation-workspace/batch-bar-acts-on-one-kind
---
type: invariant
statement: "The batch bar MUST act on one selection of a single kind at a time, entity match, disputed or uncertain."
constrains:
- domain/curation-workspace/batch-kind
---

## Description

None.

=== rules/curation-workspace/batch-bar-needs-two-items
---
type: invariant
statement: "The batch bar MUST show nothing when fewer than two items are selected."
constrains:
- domain/curation-workspace/batch-kind
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/batch-bar-offers-to-clear-the-selection
---
type: invariant
statement: "The batch bar MUST offer a clear-selection control that leaves the clearing to its caller."
constrains:
- domain/curation-workspace/batch-kind
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/batch-bar-shows-the-count
---
type: invariant
statement: "The batch bar MUST show how many items are selected."
constrains:
- domain/curation-workspace/batch-kind
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/blank-reason-blocks-a-destructive-decision
---
type: invariant
statement: "A destructive decision with a reason that is empty after trimming MUST send nothing and move focus to the reason field."
constrains:
- domain/curation-workspace/curation-session
- domain/curation-workspace/decision-draft
---

## Description

None.

=== rules/curation-workspace/caller-cancellation-ends-the-request
---
type: invariant
statement: "A cancellation from the caller MUST end the request together with the cutoff."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/candidate-shows-its-similarity-as-a-percentage
---
type: invariant
statement: "Each candidate MUST show its canonical name and its similarity as a whole percentage, a value below 0 as 0 and a value above 1 as 100."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/changing-the-item-clears-the-draft
---
type: invariant
statement: "Changing the item MUST clear the selected candidate, the selected side and the reason."
constrains:
- domain/curation-workspace/curation-session
- domain/curation-workspace/decision-draft
---

## Description

None.

=== rules/curation-workspace/changing-the-item-restarts-the-correction
---
type: invariant
statement: "Changing the item MUST close the correction section and start it fresh."
constrains:
- domain/curation-workspace/curation-session
- domain/curation-workspace/correction-draft
---

## Description

None.

=== rules/curation-workspace/check-toggles-the-item-in-the-checked-set
---
type: invariant
statement: "The check action MUST add the selected item to the checked set or remove it when it is already there."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/checked-set-starts-empty-and-is-replaced-whole
---
type: invariant
statement: "The checked set MUST start empty and MUST be replaced whole on every change."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/chunk-excerpt-is-cut-to-200-characters
---
type: invariant
statement: "A chunk's excerpt MUST be cut the same way to 200 characters."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/chunk-shows-its-source-date-and-offsets
---
type: invariant
statement: "Each chunk MUST show its source type label, the document's received date in pt-BR and its offsets."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/client-detects-no-unchanged-correction
---
type: invariant
statement: "The correction form MUST NOT detect an unchanged correction, the no-change refusal coming only from the server."
constrains:
- domain/curation-workspace/curation-session
- domain/curation-workspace/correction-draft
---

## Description

None.

=== rules/curation-workspace/confirmation-or-rejection-refreshes-the-provenance-of-the-item
---
type: invariant
statement: "After a successful confirmation or rejection the provenance of that item MUST be read again."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/correction-asks-for-a-value-or-a-target
---
type: invariant
statement: "The correction form MUST ask for a new value for an attribute and for the target node id for a link, showing only one of the two."
constrains:
- domain/curation-workspace/curation-session
- domain/curation-workspace/correction-draft
---

## Description

None.

=== rules/curation-workspace/correction-checks-run-in-order
---
type: invariant
statement: "The correction checks MUST run in this order: the value or the target node id, then the start before the end, then a fragment under stated, each message landing on its own field."
constrains:
- domain/curation-workspace/curation-session
- domain/curation-workspace/correction-draft
---

## Description

None.

=== rules/curation-workspace/correction-dates-have-the-iso-shape
---
type: invariant
statement: "A date the owner gives MUST match the shape AAAA-MM-DD, only the shape being checked and not whether it is a real calendar date."
constrains:
- domain/curation-workspace/curation-session
- domain/curation-workspace/correction-draft
---

## Description

None.

=== rules/curation-workspace/correction-fields-start-from-the-item
---
type: invariant
statement: "Every correction field MUST start with the current item's values, the basis starting as document when the caller gives none and the reason always starting empty."
constrains:
- domain/curation-workspace/curation-session
- domain/curation-workspace/correction-draft
---

## Description

None.

=== rules/curation-workspace/correction-is-offered-only-for-a-dispute
---
type: invariant
statement: "A correction MUST be offered only for a dispute and never for an entity-match entry."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/correction-opens-inline-and-returns-focus
---
type: invariant
statement: "The correction form MUST open inline in the panel, and cancelling MUST close it and return focus to the correction button."
constrains:
- domain/curation-workspace/curation-session
- domain/curation-workspace/correction-draft
---

## Description

None.

=== rules/curation-workspace/correction-reason-is-required-and-trimmed
---
type: invariant
statement: "The correction reason MUST be required, keep at least one character after trimming and be submitted trimmed, with no maximum length."
constrains:
- domain/curation-workspace/curation-session
- domain/curation-workspace/correction-draft
---

## Description

None.

=== rules/curation-workspace/correction-refreshes-the-provenance-and-the-history
---
type: invariant
statement: "After a successful correction the provenance of the corrected item and of the new item, and the lineage history of the corrected item, MUST be read again."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/correction-refusals-reach-the-form
---
type: invariant
statement: "BUSINESS_TEMPORAL_INCOHERENT and BUSINESS_CORRECTION_NO_CHANGES MUST reach only the correction form, and BUSINESS_DATE_UNJUSTIFIED and BUSINESS_FRAGMENT_NOT_ACCEPTED MUST reach the correction form and the panel's alert."
constrains:
- domain/curation-workspace/curation-session
- domain/curation-workspace/correction-draft
---

## Description

None.

=== rules/curation-workspace/correction-sends-the-item-the-values-and-the-reason
---
type: invariant
statement: "On submit the form MUST send item_kind, item_id, corrected and reason, corrected carrying the value or the target node id, the dates, the basis and the fragment id."
constrains:
- domain/curation-workspace/curation-session
- domain/curation-workspace/correction-draft
---

## Description

None.

=== rules/curation-workspace/correction-shows-submitting
---
type: invariant
statement: "While a correction is submitted Cancelar MUST be disabled and Salvar correção MUST show a loading state."
constrains:
- domain/curation-workspace/curation-session
- domain/curation-workspace/correction-draft
---

## Description

None.

=== rules/curation-workspace/correction-start-precedes-the-end
---
type: invariant
statement: "When both dates are given the start MUST be strictly earlier than the end, and the message MUST show on the end field."
constrains:
- domain/curation-workspace/curation-session
- domain/curation-workspace/correction-draft
---

## Description

None.

=== rules/curation-workspace/correction-starts-from-the-first-sides-values
---
type: invariant
statement: "The correction form MUST start from the first side's value, target node, dates and basis with no fragment, and from the basis document when the dispute has no sides."
constrains:
- domain/curation-workspace/curation-session
- domain/curation-workspace/correction-draft
---

## Description

None.

=== rules/curation-workspace/correction-targets-the-first-side
---
type: invariant
statement: "A correction MUST always target the dispute's first side, whichever side the owner selected."
constrains:
- domain/curation-workspace/curation-session
- domain/curation-workspace/correction-draft
---

## Description

None.

=== rules/curation-workspace/curation-request-carries-the-access-token
---
type: invariant
statement: "A curation request MUST carry the owner's access token as a bearer when the application holds one and no Authorization header otherwise."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/curation-request-times-out-after-thirty-seconds
---
type: invariant
statement: "A curation request MUST fail after thirty seconds without the status of an answer."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/date-justification-offers-three-bases
---
type: invariant
statement: "The date justification MUST offer the bases stated, document and received in that order, each with a label and a hint."
constrains:
- domain/curation-workspace/curation-session
- domain/curation-workspace/correction-draft
---

## Description

None.

=== rules/curation-workspace/dates-show-as-pt-br-calendar-dates-in-utc
---
type: invariant
statement: "Side dates and period dates MUST show as full pt-BR calendar dates in UTC."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/decision-moves-to-the-ring-neighbour
---
type: invariant
statement: "After a decision the next item MUST be the ring neighbour of whatever is selected at that moment, taken from the queue as last loaded."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/decision-on-the-wrong-kind-sends-nothing
---
type: invariant
statement: "An entity-match resolution requested on an item that is not an entity-match entry, or a dispute resolution on an item that is not a dispute, MUST send nothing."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/decision-removes-its-item-by-its-identifier
---
type: invariant
statement: "A decision MUST remove its item by the node id for keeping entities separate, by the first item id for keeping a dispute or adjusting periods and by the item id for confirming and correcting."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/decision-shows-as-sending-until-answered
---
type: invariant
statement: "A decision MUST show as sending from the moment it goes to the server until the server answers or fails."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/destructive-decision-moves-on-twice
---
type: invariant
statement: "A destructive decision MUST move on once when it is made and again when the server accepts it."
constrains:
- domain/curation-workspace/curation-session
- domain/curation-workspace/dispatch-kind
---

## Description

None.

=== rules/curation-workspace/destructive-decision-moves-on-twice.log
---
entries:
- field: statement
  unstated: The material shows a destructive decision selecting the next item when it is made and again when the server accepts it, and does not say whether the second move is intended.
  decided: A destructive decision moves on once when it is made and again when the server accepts it.
  why: The code does both and counts both, so the obligation a reader can hold the screen to is the pair of moves.
---

=== rules/curation-workspace/destructive-decision-opens-the-undo-toast
---
type: invariant
statement: "A destructive decision MUST open an undo toast that shows its caption and the time left, for exactly the undo window."
constrains:
- domain/curation-workspace/curation-session
- domain/curation-workspace/pending-decision
---

## Description

None.

=== rules/curation-workspace/destructive-decision-removes-the-item-at-once
---
type: invariant
statement: "A destructive decision MUST remove its item from the queue the owner sees and move to the next item before anything is sent."
constrains:
- domain/curation-workspace/curation-session
- domain/curation-workspace/pending-decision
---

## Description

None.

=== rules/curation-workspace/destructive-decisions-carry-a-caption
---
type: invariant
statement: "A destructive decision MUST carry the caption Item fundido for a merge, Lado preferido for a preference and Item rejeitado for a rejection."
constrains:
- domain/curation-workspace/pending-decision
---

## Description

None.

=== rules/curation-workspace/destructive-decisions-wait-for-undo
---
type: invariant
statement: "The entity-match merge, the dispute preference and the rejection of an item MUST wait for undo before being sent."
constrains:
- domain/curation-workspace/curation-session
- domain/curation-workspace/dispatch-kind
---

## Description

None.

=== rules/curation-workspace/destructive-success-shows-no-notice-and-moves-on
---
type: invariant
statement: "A destructive decision that succeeds after its window MUST show no success notice and move to the next item."
constrains:
- domain/curation-workspace/curation-session
- domain/curation-workspace/dispatch-kind
---

## Description

None.

=== rules/curation-workspace/display-mode-is-decided-from-the-entry-alone
---
type: invariant
statement: "The display mode MUST be decided from the queue entry alone."
constrains:
- domain/curation-workspace/curation-session
- domain/curation-workspace/display-mode
---

## Description

None.

=== rules/curation-workspace/dispute-evidence-counts-as-viewed-when-its-trail-says-so
---
type: invariant
statement: "A dispute entry's evidence MUST count as viewed once the provenance trail of its first side reports it viewed, or at once when it has no sides."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/dispute-header-adds-the-relation
---
type: invariant
statement: "Once the subject name is available a dispute header MUST add the link type or the attribute key after it."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/dispute-header-falls-back-until-the-name-arrives
---
type: invariant
statement: "Until the subject name is available a dispute header MUST show the link type, else the attribute key, else Item em disputa."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/dispute-header-names-its-subject-node
---
type: invariant
statement: "A dispute's header MUST name its subject node, the link's source node or the node that holds the attribute, resolved through the node-detail read."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/dispute-offers-prefer-one-and-keep-disputed
---
type: invariant
statement: "A dispute MUST offer exactly the decisions prefer one side and keep disputed, with no control that adjusts periods."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/dispute-resolution-refreshes-the-provenance-of-its-items
---
type: invariant
statement: "After a successful dispute resolution the provenance of every item in item_ids MUST be read again."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/dispute-shows-summary-for-two-sides-with-an-end
---
type: invariant
statement: "A dispute MUST show the summary view only when it has exactly two sides and at least one of them has an end of validity."
constrains:
- domain/curation-workspace/curation-session
- domain/curation-workspace/display-mode
---

## Description

None.

=== rules/curation-workspace/drawer-closes-on-esc-close-backdrop-or-removal
---
type: invariant
statement: "The drawer MUST call back to close on Esc, on its close button, on a click on the backdrop and when a decision removes its item, whether it is open belonging to the screen that opens it."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/drawer-dispute-decisions-wait-for-the-evidence
---
type: invariant
statement: "In the drawer decisions on a dispute MUST stay disabled until the provenance trail of the dispute's first side reports its evidence viewed."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/drawer-entity-match-decisions-are-enabled-at-once
---
type: invariant
statement: "In the drawer decisions on an entity match MUST be enabled at once, with no provenance trail."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/drawer-finds-its-item-in-the-queue-listing
---
type: invariant
statement: "The drawer MUST find an entity-match item by its node id and a dispute by the id of any of its sides in the queue listing read with no arguments."
constrains:
- domain/curation-workspace/curation-session
- domain/curation-workspace/selected-item
---

## Description

None.

=== rules/curation-workspace/drawer-has-no-next-item
---
type: invariant
statement: "The drawer MUST have no next item and MUST close when a decision removes its item."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/drawer-holds-one-queue-item
---
type: invariant
statement: "The curation drawer MUST hold one review queue item, an entity match or a dispute, identified by kind and id."
constrains:
- domain/curation-workspace/curation-session
- domain/curation-workspace/selected-item
---

## Description

None.

=== rules/curation-workspace/drawer-never-changes-the-address
---
type: invariant
statement: "The drawer MUST NOT change the address, its only way out being the link to /curation with item=kind:id that closes it."
constrains:
- domain/curation-workspace/curation-session
- domain/curation-workspace/selected-item
---

## Description

None.

=== rules/curation-workspace/drawer-reads-the-queue-only-while-open
---
type: invariant
statement: "The drawer MUST read the review queue only while it is open."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/drawer-shares-the-evidence-flag
---
type: invariant
statement: "The drawer MUST read and set the evidence-viewed flag of the curation page's shared store."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/drawer-shows-the-callers-label
---
type: invariant
statement: "The drawer MUST show the caller's label under its title when the label is not empty."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/each-decision-uses-the-action-of-its-kind
---
type: invariant
statement: "Each decision MUST use the curation action of its kind: the entity-match resolution for both entity-match decisions, the dispute resolution for the three dispute decisions and confirm, reject and correct for their own."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/empty-correction-field-is-sent-as-null
---
type: invariant
statement: "An empty value, target node id, start date, end date or fragment id MUST count as not provided and be sent as null."
constrains:
- domain/curation-workspace/curation-session
- domain/curation-workspace/correction-draft
---

## Description

None.

=== rules/curation-workspace/entity-match-evidence-counts-as-viewed-at-once
---
type: invariant
statement: "An entity-match entry's evidence MUST count as viewed as soon as it opens."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/entity-match-header-names-the-proposed-node
---
type: invariant
statement: "An entity-match entry's header MUST name the proposed node by its canonical name."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/entity-match-offers-merge-and-keep-separate
---
type: invariant
statement: "An entity-match entry MUST offer exactly the decisions merge into a candidate and keep separate."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/entity-match-resolution-refreshes-the-node-details
---
type: invariant
statement: "After a successful entity-match resolution the detail of the resolved node and of the target node, when one is given, MUST be read again."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/entity-match-shows-summary-for-one-high-similarity-candidate
---
type: invariant
statement: "An entity-match entry MUST show the summary view only when it has exactly one candidate whose similarity is at least 0.9."
constrains:
- domain/curation-workspace/curation-session
- domain/curation-workspace/display-mode
---

## Description

None.

=== rules/curation-workspace/every-decision-waits-for-the-evidence
---
type: invariant
statement: "Every decision button, the keep decisions and the correction button included, MUST stay blocked until the evidence is viewed, and a blocked click MUST send nothing."
constrains:
- domain/curation-workspace/curation-session
- domain/curation-workspace/decision-draft
---

## Description

None.

=== rules/curation-workspace/every-side-is-listed-and-selectable
---
type: invariant
statement: "Every side MUST be listed in both presentations and selecting a side MUST make it the winner for a preference."
constrains:
- domain/curation-workspace/curation-session
- domain/curation-workspace/display-mode
- domain/curation-workspace/decision-draft
---

## Description

None.

=== rules/curation-workspace/evidence-indicator-pulses-until-viewed
---
type: invariant
statement: "The evidence indicator MUST read Ver evidência and pulse until the evidence is viewed and then read Evidência vista, the same words being its accessible name."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/evidence-indicator-pulses-until-viewed.log
---
entries:
- field: statement
  unstated: The indicator carries an accessible name of Veja a evidência antes de decidir that differs from its visible words, and no node says what its accessible name is.
  decided: The accessible name of the indicator is the same words it displays.
  why: The rule already fixes the visible words, and a name differing from them would let a screen reader hear a wording the node does not hold.
---

=== rules/curation-workspace/evidence-viewed-is-supplied-by-the-caller
---
type: invariant
statement: "The decision panel MUST NOT decide whether the evidence was viewed."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/failed-decision-is-read-in-order
---
type: invariant
statement: "A failed decision MUST be read in this order: a failure with no envelope, an authentication code, a code meaning the item is gone, a field code, a status of 500 or above and any other code."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/failed-metrics-fall-back-to-the-queue-totals
---
type: invariant
statement: "When the metrics read fails and queue totals are supplied the strip MUST show a dash for the acceptance rate, the needs-review count and the uncertain count and the queue totals for the disputed and entity-match counts."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/failed-metrics-never-fail-the-strip
---
type: invariant
statement: "A failed metrics read MUST NOT make the strip fail, and without a fallback the strip MUST keep showing its loading placeholders."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/failure-without-an-envelope-leaves-the-item-removed
---
type: invariant
statement: "A destructive decision that fails with no envelope MUST leave its item removed."
constrains:
- domain/curation-workspace/curation-session
- domain/curation-workspace/dispatch-kind
---

## Description

None.

=== rules/curation-workspace/failure-without-an-envelope-leaves-the-item-removed.log
---
entries:
- field: statement
  unstated: The material shows a failure with no envelope leaving a destructive decision's item removed while an enveloped refusal puts it back, and does not say why they differ.
  decided: A destructive decision that fails with no envelope leaves its item removed.
  why: The restore is tied to an enveloped refusal in the code, so the other failures leave the item removed.
---

=== rules/curation-workspace/field-code-wins-over-the-server-status
---
type: invariant
statement: "A field code MUST be shown in the panel even when the answer's status is 500 or above."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/field-messages-appear-on-blur-and-submit
---
type: invariant
statement: "Field messages of the correction form MUST appear when a field loses focus and when the owner submits."
constrains:
- domain/curation-workspace/curation-session
- domain/curation-workspace/correction-draft
---

## Description

None.

=== rules/curation-workspace/first-unauthorized-curation-answer-refreshes-the-token-once
---
type: invariant
statement: "The first unauthorized answer to a curation request MUST obtain a new access token from the identity provider, store it and resend the request once with it."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/form-hands-the-request-to-its-caller
---
type: invariant
statement: "The correction form MUST submit nothing itself and MUST hand the request to its caller, which passes back a server error as a code and a message."
constrains:
- domain/curation-workspace/curation-session
- domain/curation-workspace/correction-draft
---

## Description

None.

=== rules/curation-workspace/fragment-field-shows-only-under-stated
---
type: invariant
statement: "The fragment field and its message MUST show only under stated."
constrains:
- domain/curation-workspace/curation-session
- domain/curation-workspace/correction-draft
---

## Description

None.

=== rules/curation-workspace/fragment-filter-reaches-the-picker
---
type: invariant
statement: "A run or source filter given by the caller MUST reach the correction form's fragment picker."
constrains:
- domain/curation-workspace/curation-session
- domain/curation-workspace/correction-draft
---

## Description

None.

=== rules/curation-workspace/fragment-id-is-sent-whatever-the-basis
---
type: invariant
statement: "The fragment id MUST be sent whatever the basis is."
constrains:
- domain/curation-workspace/curation-session
- domain/curation-workspace/correction-draft
---

## Description

None.

=== rules/curation-workspace/fragment-shows-its-confidence-as-a-percentage
---
type: invariant
statement: "Each fragment MUST show its confidence as a whole percentage."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/fragment-text-is-cut-to-280-characters
---
type: invariant
statement: "A fragment's text longer than 280 characters MUST show its first 279 characters with trailing whitespace removed, followed by an ellipsis."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/full-presentation-lists-every-candidate
---
type: invariant
statement: "Outside summary presentation the panel MUST list every candidate."
constrains:
- domain/curation-workspace/curation-session
- domain/curation-workspace/display-mode
---

## Description

None.

=== rules/curation-workspace/header-badge-names-the-queue-kind
---
type: invariant
statement: "The header badge MUST read Para revisar for an entity-match entry and Disputado for a dispute."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/immediate-decisions-are-sent-at-once
---
type: invariant
statement: "The entity-match keep, the dispute keep, the period adjustment, the confirmation and the correction MUST be sent at once."
constrains:
- domain/curation-workspace/curation-session
- domain/curation-workspace/dispatch-kind
---

## Description

None.

=== rules/curation-workspace/immediate-success-confirms-and-moves-on
---
type: invariant
statement: "A decision sent at once that succeeds MUST tell the owner it was confirmed for two seconds and move to the next item."
constrains:
- domain/curation-workspace/curation-session
- domain/curation-workspace/dispatch-kind
---

## Description

None.

=== rules/curation-workspace/inline-confirmation-confirms-or-cancels
---
type: invariant
statement: "The inline confirmation MUST carry out the batch rejection when confirmed and, when cancelled, bring the action row back and do nothing."
constrains:
- domain/curation-workspace/batch-kind
---

## Description

None.

=== rules/curation-workspace/invalid-date-in-an-answer-fails-the-read
---
type: invariant
statement: "A required timestamp, or a present optional date, that is not a valid date MUST fail the read with an error that carries no code."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/invalid-target-refusal-marks-the-candidate
---
type: invariant
statement: "An invalid-target refusal MUST mark the selected candidate invalid and show no message text."
constrains:
- domain/curation-workspace/curation-session
- domain/curation-workspace/decision-draft
---

## Description

None.

=== rules/curation-workspace/item-age-is-measured-from-a-fixed-reference
---
type: invariant
statement: "An item's age MUST be measured from a reference time taken when the item changes, and MUST NOT advance while the item stays open."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/item-age-reads-in-minutes-hours-and-days
---
type: invariant
statement: "An item's age MUST read agora under a minute, há N min under an hour, há N h under a day, há N d under thirty days and the pt-BR date from thirty days on, with a future time reading agora."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/item-id-is-everything-after-the-first-colon
---
type: invariant
statement: "The id of an item link MUST be everything after its first colon."
constrains:
- domain/curation-workspace/curation-session
- domain/curation-workspace/selected-item
---

## Description

None.

=== rules/curation-workspace/keep-decisions-check-only-the-gate
---
type: invariant
statement: "Keeping entities separate and keeping a dispute MUST check only the evidence gate and be sent with no selection and no reason check."
constrains:
- domain/curation-workspace/curation-session
- domain/curation-workspace/decision-draft
---

## Description

None.

=== rules/curation-workspace/keep-disputed-sends-the-items-the-decision-and-the-reason
---
type: invariant
statement: "Keeping a dispute MUST send the item kind, the item ids of every side, the decision and the reason with no winner."
constrains:
- domain/curation-workspace/curation-session
- domain/curation-workspace/decision-draft
---

## Description

None.

=== rules/curation-workspace/keep-separate-sends-the-decision-and-the-reason
---
type: invariant
statement: "Keeping entities separate MUST send the decision and the reason with no target."
constrains:
- domain/curation-workspace/curation-session
- domain/curation-workspace/decision-draft
---

## Description

None.

=== rules/curation-workspace/keyboard-moves-follow-the-click-path
---
type: invariant
statement: "Moving by keyboard MUST go through the same selection path as a click."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/keyboard-shortcuts-act-only-while-enabled
---
type: invariant
statement: "Keyboard shortcuts MUST act only while they are enabled, and they MUST be enabled by default."
constrains:
- domain/curation-workspace/curation-shortcut
---

## Description

None.

=== rules/curation-workspace/keys-typed-into-a-field-are-no-shortcut
---
type: invariant
statement: "A key pressed while focus is on an input, a textarea, a select, an editable element or an element with the role combobox, listbox or textbox MUST NOT act as a shortcut."
constrains:
- domain/curation-workspace/curation-shortcut
---

## Description

None.

=== rules/curation-workspace/last-seen-total-starts-empty-and-follows-changes
---
type: invariant
statement: "The last queue total seen MUST be empty until the first queue answer and then change only when the total changes."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/leaving-sends-the-pending-decision-at-once
---
type: invariant
statement: "Leaving the curation screen with a decision waiting for undo MUST send it at once and tell the owner it was committed on leaving."
constrains:
- domain/curation-workspace/curation-session
- domain/curation-workspace/pending-decision
---

## Description

None.

=== rules/curation-workspace/link-correction-needs-a-target
---
type: invariant
statement: "A link correction MUST have a non-empty target node id with no format check."
constrains:
- domain/curation-workspace/curation-session
- domain/curation-workspace/correction-draft
---

## Description

None.

=== rules/curation-workspace/link-items-use-link-reads-and-others-attribute-reads
---
type: invariant
statement: "An item kind of link MUST select the link provenance and the link history and any other item kind the attribute ones."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/link-side-is-named-by-its-target
---
type: invariant
statement: "A side with no value but a target node MUST be named by the target node's canonical name with its node type, by Carregando… while the name loads and by nó and the first eight characters of its id when no name arrives."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/manual-fragment-id-is-not-checked
---
type: invariant
statement: "A manually entered fragment id MUST NOT be checked for format."
constrains:
- domain/curation-workspace/curation-session
- domain/curation-workspace/correction-draft
---

## Description

None.

=== rules/curation-workspace/merge-checks-the-gate-then-a-candidate-then-the-reason
---
type: invariant
statement: "A merge MUST check the evidence gate, then that a candidate is selected, then that the reason is not blank."
constrains:
- domain/curation-workspace/curation-session
- domain/curation-workspace/decision-draft
---

## Description

None.

=== rules/curation-workspace/merge-refreshes-both-node-details
---
type: invariant
statement: "After a successful merge the details of the survivor node and of the absorbed node MUST be read again."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/merge-sends-the-decision-the-target-and-the-reason
---
type: invariant
statement: "A merge MUST send the decision, the selected candidate as target node and the reason."
constrains:
- domain/curation-workspace/curation-session
- domain/curation-workspace/decision-draft
---

## Description

None.

=== rules/curation-workspace/merge-stays-offered-without-a-candidate
---
type: invariant
statement: "With no candidates the panel MUST still offer the merge, which does nothing because no candidate can be selected."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/metrics-stay-fresh-for-thirty-seconds
---
type: invariant
statement: "Curation metrics MUST stay fresh for thirty seconds, be read again when the window regains focus, never be polled and be retried once when a read fails."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/metrics-strip-hides-the-reject-rate-and-the-time
---
type: invariant
statement: "The metrics strip MUST NOT show the reject rate by code or the time the metrics were computed."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/metrics-strip-shows-five-metrics-in-order
---
type: invariant
statement: "The metrics strip MUST show the acceptance rate, the needs-review count, the uncertain count, the disputed count and the entity-match queue count, in that order, with the rate first and emphasised."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/metrics-strip-shows-placeholders-until-settled
---
type: invariant
statement: "Until the metrics read has settled the strip MUST show loading placeholders and mark itself busy."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/modified-keys-are-no-shortcut
---
type: invariant
statement: "A key held with Ctrl, Alt or Meta MUST NOT act as a shortcut."
constrains:
- domain/curation-workspace/curation-shortcut
---

## Description

None.

=== rules/curation-workspace/moving-on-selects-the-next-item-and-counts-it
---
type: invariant
statement: "Moving on MUST select the item the screen names as next, or none, and add one to the session's resolved count."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/new-item-count-is-the-total-minus-the-baseline
---
type: invariant
statement: "The new-item count MUST be the latest queue total minus a baseline that starts at the first total seen and moves only when the owner clicks the pill, and it MUST never be below zero."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/next-and-previous-move-through-the-queue-as-a-ring
---
type: invariant
statement: "Next and previous MUST move through the loaded queue as a ring, picking the first item for next and the last for previous when nothing in the queue is selected."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/no-selection-leaves-no-item-parameter
---
type: invariant
statement: "With nothing selected the address MUST carry no item parameter."
constrains:
- domain/curation-workspace/curation-session
- domain/curation-workspace/selected-item
---

## Description

None.

=== rules/curation-workspace/node-detail-sends-its-options-only-when-asked
---
type: invariant
statement: "Node detail MUST send as_of when given, in_effect_only only when asked for and include_uncertain=false only when uncertain attributes are excluded."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/nothing-is-preselected
---
type: invariant
statement: "The decision panel MUST preselect no candidate and no side, even for a single high-similarity candidate."
constrains:
- domain/curation-workspace/curation-session
- domain/curation-workspace/decision-draft
---

## Description

None.

=== rules/curation-workspace/one-destructive-decision-waits-at-a-time
---
type: invariant
statement: "Starting a second destructive decision MUST send the first one at once and close its toast."
constrains:
- domain/curation-workspace/curation-session
- domain/curation-workspace/pending-decision
---

## Description

None.

=== rules/curation-workspace/owner-selects-by-click-enter-or-space
---
type: invariant
statement: "The owner MUST be able to select an item by clicking it or by pressing Enter or Space on it."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/page-counts-loaded-entries-as-the-metrics-fallback
---
type: invariant
statement: "The page MUST count its loaded entries per queue as the metrics fallback, counting entity-match entries toward the entity-match queue and every other entry toward the disputed queue."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/page-does-not-remove-a-decided-item-itself
---
type: invariant
statement: "The page MUST NOT remove a decided item from the list or put it back, since the list changes only when the queue is read again."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/page-keeps-its-state-when-left
---
type: invariant
statement: "Leaving the curation page MUST NOT clear the selected item, the checked set or the new-item baseline."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/page-lists-only-one-queue-page
---
type: invariant
statement: "The curation page MUST list only the entries of the single queue page it reads."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/page-wires-four-shortcuts
---
type: invariant
statement: "The curation page MUST wire only the shortcuts next, previous, select by number and check."
constrains:
- domain/curation-workspace/curation-shortcut
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/panel-takes-no-confirm-reject-or-adjust
---
type: invariant
statement: "The decision panel MUST take no confirm, reject or adjust-periods decision."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/pending-confirmation-survives-a-selection-change
---
type: invariant
statement: "A pending batch-rejection confirmation MUST stay when the selection count or kind changes."
constrains:
- domain/curation-workspace/batch-kind
---

## Description

None.

=== rules/curation-workspace/pending-decision-lives-in-memory-only
---
type: invariant
statement: "A decision waiting for undo MUST NOT survive a reload."
constrains:
- domain/curation-workspace/curation-session
- domain/curation-workspace/pending-decision
---

## Description

None.

=== rules/curation-workspace/periods-are-listed-in-words-under-the-sides
---
type: invariant
statement: "The panel MUST list each side's period in words under the sides, the sides lettered A, B, C in the order the item lists them, in both presentations of a dispute."
constrains:
- domain/curation-workspace/curation-session
- domain/curation-workspace/display-mode
---

## Description

None.

=== rules/curation-workspace/picker-choice-shows-eighty-characters
---
type: invariant
statement: "Each picker choice MUST show the first eighty characters of the fragment's text and fill in the fragment's id."
constrains:
- domain/curation-workspace/curation-session
- domain/curation-workspace/correction-draft
---

## Description

None.

=== rules/curation-workspace/picker-falls-back-to-a-manual-fragment-id
---
type: invariant
statement: "Under stated the picker MUST fall back to a manual fragment-id input when no filter was given, the listing failed, returned nothing or has not answered."
constrains:
- domain/curation-workspace/curation-session
- domain/curation-workspace/correction-draft
---

## Description

None.

=== rules/curation-workspace/prefer-checks-the-gate-then-a-side-then-the-reason
---
type: invariant
statement: "A preference MUST check the evidence gate, then that a side is selected, then that the reason is not blank."
constrains:
- domain/curation-workspace/curation-session
- domain/curation-workspace/decision-draft
---

## Description

None.

=== rules/curation-workspace/preference-removes-its-item-by-the-first-id
---
type: invariant
statement: "A preference's item identifier MUST be chosen in this order: the first item id of the request, then the first side's item id, then the empty string."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/preference-sends-the-items-the-decision-the-winner-and-the-reason
---
type: invariant
statement: "A preference MUST send the item kind, the item ids of every side in the item's order, the decision, the selected side as winner and the reason."
constrains:
- domain/curation-workspace/curation-session
- domain/curation-workspace/decision-draft
---

## Description

None.

=== rules/curation-workspace/queue-answer-chooses-the-selection-again
---
type: invariant
statement: "Each time the queue read resolves, the page MUST select the item the address names when it is loaded, otherwise the first loaded item, otherwise none."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/queue-entries-are-identified-by-node-or-first-side
---
type: invariant
statement: "An entity-match entry MUST be identified by its node id and a dispute entry by the item id of its first side, or by a key built from its assertion kind, its source node and its link type or attribute key when it has no sides."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/queue-failure-is-checked-before-empty
---
type: invariant
statement: "A failed queue read MUST be checked before the empty state, which MUST show only for a read that succeeded with no entries."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/queue-is-read-again-on-every-read-poll-and-focus
---
type: invariant
statement: "The review queue MUST count as stale at once, be read again every thirty seconds while the tab is visible and be read again when the window regains focus."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/queue-keeps-the-answered-order
---
type: invariant
statement: "The screen MUST keep the order in which the review queue answers."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/queue-kind-is-sent-only-when-chosen
---
type: invariant
statement: "The review queue request MUST carry the kind only when one queue kind is chosen."
constrains:
- domain/curation-workspace/curation-session
- domain/curation-workspace/queue-tab
---

## Description

None.

=== rules/curation-workspace/queue-read-asks-the-first-page-of-twenty
---
type: invariant
statement: "The curation screen MUST ask the review queue for its first page of twenty entries."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/read-without-an-identifier-is-not-requested
---
type: invariant
statement: "A node detail, history or provenance read MUST NOT be requested without an identifier, and accepted fragments MUST NOT be requested until a non-empty run id or raw information id is given."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/reading-the-answer-body-has-no-cutoff
---
type: invariant
statement: "Reading the body of a curation answer MUST have no cutoff once its status has arrived."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/reason-field-always-shows-as-required
---
type: invariant
statement: "The reason field MUST always be rendered and marked as required."
constrains:
- domain/curation-workspace/curation-session
- domain/curation-workspace/decision-draft
---

## Description

None.

=== rules/curation-workspace/reason-is-sent-as-typed-and-empty-as-null
---
type: invariant
statement: "The reason MUST be sent as typed and an empty reason as null."
constrains:
- domain/curation-workspace/curation-session
- domain/curation-workspace/decision-draft
---

## Description

None.

=== rules/curation-workspace/reason-required-refusal-shows-under-the-reason
---
type: invariant
statement: "A BUSINESS_REASON_REQUIRED refusal MUST show the server's message under the reason field and focus it."
constrains:
- domain/curation-workspace/curation-session
- domain/curation-workspace/decision-draft
---

## Description

None.

=== rules/curation-workspace/refused-destructive-decision-restores-its-item
---
type: invariant
statement: "A destructive decision refused with a code that does not mean the item is gone MUST put its item back in the queue."
constrains:
- domain/curation-workspace/curation-session
- domain/curation-workspace/dispatch-kind
---

## Description

None.

=== rules/curation-workspace/rejecting-five-or-more-asks-first
---
type: invariant
statement: "Rejecting five or more items MUST ask for an inline confirmation first, and rejecting fewer MUST act at once."
constrains:
- domain/curation-workspace/batch-kind
---

## Description

None.

=== rules/curation-workspace/resent-curation-request-never-refreshes-again
---
type: invariant
statement: "A resent curation request MUST NOT start a second token refresh and MUST have a thirty-second cutoff of its own."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/reset-restores-the-starting-values
---
type: invariant
statement: "Resetting MUST put the selection, the evidence mark, the resolved count, the last seen total and the checked set back to their starting values."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/resolved-count-starts-at-zero
---
type: invariant
statement: "The session's resolved count MUST start at zero."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/save-is-disabled-without-a-stated-fragment
---
type: invariant
statement: "While the basis is stated and no fragment id is filled Salvar correção MUST be disabled."
constrains:
- domain/curation-workspace/curation-session
- domain/curation-workspace/correction-draft
---

## Description

None.

=== rules/curation-workspace/select-by-number-picks-the-nth-loaded-item
---
type: invariant
statement: "Select by number MUST pick the Nth loaded item for N from 1 to 9 and MUST leave the selection when N is beyond the loaded items."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/selected-item-is-carried-in-the-address
---
type: invariant
statement: "The selected item MUST be carried in the address as item=kind:id."
constrains:
- domain/curation-workspace/curation-session
- domain/curation-workspace/selected-item
---

## Description

None.

=== rules/curation-workspace/selecting-a-candidate-makes-it-the-merge-target
---
type: invariant
statement: "Selecting a candidate MUST make it the merge target."
constrains:
- domain/curation-workspace/curation-session
- domain/curation-workspace/decision-draft
---

## Description

None.

=== rules/curation-workspace/selecting-another-item-clears-the-evidence-mark
---
type: invariant
statement: "Selecting a different item, or clearing the selection, MUST mark its evidence as not yet viewed, and the mark MUST start as not viewed."
constrains:
- domain/curation-workspace/curation-session
- domain/curation-workspace/selected-item
---

## Description

None.

=== rules/curation-workspace/selecting-the-same-item-changes-nothing
---
type: invariant
statement: "Selecting the item already selected MUST change nothing and keep its evidence viewed."
constrains:
- domain/curation-workspace/curation-session
- domain/curation-workspace/selected-item
---

## Description

None.

=== rules/curation-workspace/selecting-writes-the-item-to-the-address
---
type: invariant
statement: "Selecting an item MUST write item=kind:id to /curation, replacing the current history entry."
constrains:
- domain/curation-workspace/curation-session
- domain/curation-workspace/selected-item
---

## Description

None.

=== rules/curation-workspace/selection-matches-a-dispute-by-any-side
---
type: invariant
statement: "A selection MUST match a dispute entry when its id equals the item id of any of its sides."
constrains:
- domain/curation-workspace/curation-session
- domain/curation-workspace/selected-item
---

## Description

None.

=== rules/curation-workspace/self-merge-refusal-shows-the-fixed-text
---
type: invariant
statement: "A self-merge refusal MUST show the panel's own fixed text in place of the server's message and mark the selected candidate invalid."
constrains:
- domain/curation-workspace/curation-session
- domain/curation-workspace/decision-draft
---

## Description

None.

=== rules/curation-workspace/sending-a-decision-clears-the-previous-failure
---
type: invariant
statement: "Sending a decision MUST clear the server error and the stale signal of the previous one."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/server-refusal-lands-on-its-field
---
type: invariant
statement: "A server refusal with a known code MUST put the server's message on the field that code maps to, and BUSINESS_CORRECTION_NO_CHANGES MUST show the form's fixed message at the top."
constrains:
- domain/curation-workspace/curation-session
- domain/curation-workspace/correction-draft
---

## Description

None.

=== rules/curation-workspace/session-state-is-not-persisted
---
type: invariant
statement: "The session state MUST live only in the open page's memory."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/shortcut-keys-have-fixed-meanings
---
type: invariant
statement: "The keys j, k, x, e, m, s, c, r, u and the question mark MUST mean next, previous, check, evidence, merge, keep separate, confirm, reject, undo and help, and the digits 1 to 9 MUST select the Nth visible queue item."
constrains:
- domain/curation-workspace/curation-shortcut
---

## Description

None.

=== rules/curation-workspace/shortcut-letters-act-in-lower-case-only
---
type: invariant
statement: "A shortcut letter MUST act only in lower case."
constrains:
- domain/curation-workspace/curation-shortcut
---

## Description

None.

=== rules/curation-workspace/shortcuts-listen-on-the-whole-window
---
type: invariant
statement: "The curation screen MUST listen for shortcuts on the whole window unless a target element is given."
constrains:
- domain/curation-workspace/curation-shortcut
---

## Description

None.

=== rules/curation-workspace/side-shows-its-validity-basis-and-confidence
---
type: invariant
statement: "Every side MUST show its validity from and to, the label of its valid-from basis and its confidence as a whole percentage, a missing date as —."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/stable-reads-stay-fresh-for-five-minutes
---
type: invariant
statement: "Node detail, lineage history, provenance and accepted fragments MUST stay fresh for five minutes and MUST NOT be read again when the window regains focus."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/stale-banner-is-a-non-blocking-alert
---
type: invariant
statement: "The stale banner MUST be a non-blocking alert with a reload action that leaves the reload to its caller and MUST NOT decide when to appear."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/stale-banner-says-the-item-changed
---
type: invariant
statement: "The stale banner MUST tell the owner that the item changed since it was opened, in words the caller may replace."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/stale-item-blocks-no-decision
---
type: invariant
statement: "A stale item MUST NOT block any decision, the buttons being gated only by the evidence gate."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/stale-item-shows-the-notice-with-a-reload
---
type: invariant
statement: "A stale item with a reload given MUST show the stale notice with a Recarregar action that triggers the reload."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/staleness-is-never-detected-by-the-panel
---
type: invariant
statement: "The decision panel MUST NOT detect staleness itself."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/stated-basis-lists-the-accepted-fragments
---
type: invariant
statement: "Under stated, with an accepted-fragment filter given, the form MUST list the accepted fragments for that filter in a picker."
constrains:
- domain/curation-workspace/curation-session
- domain/curation-workspace/correction-draft
---

## Description

None.

=== rules/curation-workspace/stated-basis-needs-a-fragment
---
type: invariant
statement: "When the valid-from basis is stated a fragment id MUST be required, and under document or received none."
constrains:
- domain/curation-workspace/curation-session
- domain/curation-workspace/correction-draft
---

## Description

None.

=== rules/curation-workspace/submitting-batch-shows-busy-buttons
---
type: invariant
statement: "While a batch action is submitted every action button and the inline confirm MUST show as busy and cancel and clear MUST NOT."
constrains:
- domain/curation-workspace/batch-kind
---

## Description

None.

=== rules/curation-workspace/successful-action-refreshes-the-queue-and-the-metrics
---
type: invariant
statement: "After a successful curation action the review queue and the curation metrics MUST be read again, and a failed action MUST refresh nothing."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/summary-shows-the-single-candidate-alone
---
type: invariant
statement: "In summary presentation with exactly one candidate the panel MUST show that candidate alone."
constrains:
- domain/curation-workspace/curation-session
- domain/curation-workspace/display-mode
---

## Description

None.

=== rules/curation-workspace/tabs-choose-the-queue-kind
---
type: invariant
statement: "The tabs MUST read both queues for all, the entity-match queue for entities and the disputed queue for disputes."
constrains:
- domain/curation-workspace/curation-session
- domain/curation-workspace/queue-tab
---

## Description

None.

=== rules/curation-workspace/the-correction-reason-field-asks-why
---
type: invariant
statement: "The reason field of the correction form MUST read \"Explique brevemente por que a correção é necessária.\" while it is empty."
constrains:
- domain/curation-workspace/correction-draft
---

## Description

None.

=== rules/curation-workspace/the-page-names-its-heading-and-regions
---
type: invariant
statement: "The curation page MUST be headed Curadoria and name its queue region Fila de curadoria and its decision region Painel de decisão."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/the-page-selects-the-addressed-item-or-the-first-entry
---
type: invariant
statement: "The curation page MUST select the item its address names when the loaded queue holds it and otherwise the first entry of the loaded queue, again whenever the loaded queue or the tab changes."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/the-page-selects-the-addressed-item-or-the-first-entry.log
---
entries:
- field: statement
  unstated: The curation page derives its selection on every mount and whenever the queue or the tab changes, replacing a kept selection, and no node says when the selection is derived.
  decided: The page selects the addressed item when the loaded queue holds it and otherwise the first entry, again on a queue or tab change.
  why: The running page does this and the kept-state rule speaks only of leaving the page, so deriving on entry does not contradict it.
---

=== rules/curation-workspace/the-queue-tab-group-is-named-by-its-filter
---
type: invariant
statement: "The queue tab group MUST be named Filtrar fila por tipo."
constrains:
- domain/curation-workspace/queue-tab
---

## Description

None.

=== rules/curation-workspace/the-undo-button-is-announced-as-undoing-the-action
---
type: invariant
statement: "The undo button MUST read Desfazer and be announced as Desfazer ação."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/the-undo-button-is-announced-as-undoing-the-action.log
---
entries:
- field: statement
  unstated: The undo button is announced as Desfazer ação while the visible word is Desfazer, and no node holds the announced name.
  decided: The button reads Desfazer and is announced as Desfazer ação.
  why: The announced name contains the visible word, so a reader who sees the button and one who hears it are not told different actions.
---

=== rules/curation-workspace/trail-keeps-the-answered-order
---
type: invariant
statement: "The trail MUST list fragments, and under each fragment its chunks, in the order the answer gives them."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/trail-reads-by-link-or-by-attribute
---
type: invariant
statement: "The provenance trail MUST read provenance by link for a link item and by attribute for an attribute item."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/trail-signals-that-the-evidence-was-viewed-once
---
type: invariant
statement: "The trail MUST signal once per mount that its evidence was viewed, the first time at least a quarter of it is visible or focus lands in it, and only focus where viewport observation is unavailable."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/typing-clears-the-reason-error
---
type: invariant
statement: "Typing in the reason field MUST clear any error it shows."
constrains:
- domain/curation-workspace/curation-session
- domain/curation-workspace/decision-draft
---

## Description

None.

=== rules/curation-workspace/undo-keeps-the-drawer-open
---
type: invariant
statement: "When a pending destructive decision is undone the drawer MUST stay open on the same item."
constrains:
- domain/curation-workspace/curation-session
- domain/curation-workspace/pending-decision
---

## Description

None.

=== rules/curation-workspace/undo-keeps-the-selection-and-the-count
---
type: invariant
statement: "Undo MUST NOT select the restored item again and MUST NOT take the decision off the session's resolved count."
constrains:
- domain/curation-workspace/curation-session
- domain/curation-workspace/pending-decision
---

## Description

None.

=== rules/curation-workspace/undo-restores-the-item-and-sends-nothing
---
type: invariant
statement: "Undo MUST put the item back in the queue and send nothing."
constrains:
- domain/curation-workspace/curation-session
- domain/curation-workspace/pending-decision
---

## Description

None.

=== rules/curation-workspace/undo-toast-counts-down-in-whole-seconds
---
type: invariant
statement: "The undo toast MUST show the action's caption and the whole seconds left, rounded up from the deadline and never below zero."
constrains:
- domain/curation-workspace/curation-session
- domain/curation-workspace/pending-decision
---

## Description

None.

=== rules/curation-workspace/undo-toast-only-reports-the-undo
---
type: invariant
statement: "The undo toast's undo action MUST only report the undo to its caller."
constrains:
- domain/curation-workspace/curation-session
- domain/curation-workspace/pending-decision
---

## Description

None.

=== rules/curation-workspace/undo-window-is-five-seconds
---
type: invariant
statement: "The undo window MUST last five seconds, and the decision MUST be sent only when it ends."
constrains:
- domain/curation-workspace/pending-decision
---

## Description

None.

=== rules/curation-workspace/unknown-item-in-the-address-selects-the-first-item
---
type: invariant
statement: "An item parameter that names nothing in the loaded queue MUST select the first loaded item, or nothing when the queue is empty."
constrains:
- domain/curation-workspace/curation-session
- domain/curation-workspace/selected-item
---

## Description

None.

=== rules/curation-workspace/unlabelled-source-type-shows-as-it-is
---
type: invariant
statement: "A source type with no label MUST show as its raw value."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/unmapped-refusal-shows-nothing-on-the-form
---
type: invariant
statement: "A refusal code outside the five mapped codes MUST show nothing on the form."
constrains:
- domain/curation-workspace/curation-session
- domain/curation-workspace/correction-draft
---

## Description

None.

=== rules/curation-workspace/unreadable-item-link-selects-nothing
---
type: invariant
statement: "An item link MUST select nothing when its value is not a string, is empty, has no colon, has an empty kind or id or names a kind other than entity_match or disputed."
constrains:
- domain/curation-workspace/curation-session
- domain/curation-workspace/selected-item
---

## Description

None.

=== rules/curation-workspace/unrefreshable-curation-session-ends-at-sign-in
---
type: invariant
statement: "When no new access token can be obtained the application MUST clear the stored token and replace the address with /sign-in?reason=session_expired."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/unwired-shortcut-does-nothing
---
type: invariant
statement: "A shortcut the screen wires to no action MUST do nothing and MUST leave the key's default behaviour alone."
constrains:
- domain/curation-workspace/curation-shortcut
---

## Description

None.

=== rules/curation-workspace/value-side-is-named-by-its-value
---
type: invariant
statement: "Any other side MUST be named by its value, or by — when it has none."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/vanished-item-is-not-restored
---
type: invariant
statement: "A destructive decision that finds the item already gone MUST NOT put the item back."
constrains:
- domain/curation-workspace/curation-session
- domain/curation-workspace/dispatch-kind
---

## Description

None.

=== rules/curation-workspace/viewed-signal-fires-once-per-mount
---
type: invariant
statement: "Once the viewed signal has fired it MUST NOT fire again on the same mount, even when the trail is given a different item."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/viewed-signal-may-fire-on-an-empty-trail
---
type: invariant
statement: "The viewed signal MUST be able to fire when provenance loaded with no fragments."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/viewed-signal-never-fires-on-a-failed-trail
---
type: invariant
statement: "The viewed signal MUST NOT fire while the trail loads, on a compliance-deleted source or on a load failure."
constrains:
- domain/curation-workspace/curation-session
---

## Description

None.

=== rules/curation-workspace/wired-shortcuts-stop-the-default-except-help
---
type: invariant
statement: "A wired shortcut other than help MUST stop the key's default behaviour."
constrains:
- domain/curation-workspace/curation-shortcut
---

## Description

None.

=== rules/graph-explorer/a-change-saves-only-with-a-conversation-and-nodes
---
type: invariant
statement: "On a graph change a save MUST require an active conversation, then at least one node, then skip the first change after a restore, so a change that leaves the pane empty does not use up the skip."
constrains:
- domain/graph-explorer/graph-pane
---

## Description

None.

=== rules/graph-explorer/a-chunk-offset-window-is-shown-as-chars
---
type: invariant
statement: "A chunk's offset window MUST be shown as the word chars followed by its start, an en dash and its end."
constrains:
- domain/graph-explorer/node-detail
---

## Description

None.

=== rules/graph-explorer/a-chunk-shows-its-index-offsets-and-excerpt
---
type: invariant
statement: "Each chunk MUST show chunk # followed by its index, its offset range and its excerpt."
constrains:
- domain/graph-explorer/node-detail
---

## Description

None.

=== rules/graph-explorer/a-chunk-shows-its-source
---
type: invariant
statement: "Each chunk MUST show its source as \"Tipo:\" with the source type and \"Recebido em:\" with the received-at label, \"Título:\" only with a title and \"Data do documento:\" only with a document date."
constrains:
- domain/graph-explorer/node-detail
---

## Description

None.

=== rules/graph-explorer/a-chunk-without-locator-has-an-empty-one
---
type: invariant
statement: "A chunk with no locator MUST get an empty locator."
constrains:
- domain/graph-explorer/node-detail
---

## Description

None.

=== rules/graph-explorer/a-counter-change-places-every-node-again
---
type: invariant
statement: "A layout run caused by a change of the layout counter MUST ignore every position and place every node again."
constrains:
- domain/graph-explorer/graph-pane
---

## Description

None.

=== rules/graph-explorer/a-delta-carries-its-source-tool-unchanged
---
type: invariant
statement: "A graph delta MUST carry the tool that produced it unchanged together with its nodes and links in arrival order."
constrains:
- domain/graph-explorer/graph-pane
---

## Description

None.

=== rules/graph-explorer/a-delta-without-state-for-a-node-leaves-it-off
---
type: invariant
statement: "A graph delta MUST leave out a node whose status the node-state mapping gives no state and MUST show a kept node with its id, mapped type, canonical name as label and derived state."
constrains:
- domain/graph-explorer/graph-pane
---

## Description

None.

=== rules/graph-explorer/a-failed-node-panel-carries-no-message-in-its-header
---
type: invariant
statement: "The header of a failed node detail panel MUST carry no message."
constrains:
- domain/graph-explorer/node-detail
---

## Description

None.

=== rules/graph-explorer/a-failed-node-panel-carries-no-message-in-its-header.log
---
entries:
- field: statement
  unstated: The failed node panel heads itself with the not-found wording whatever the variant, while the alert below shows the variant own message, and no node says what the header shows.
  decided: The header of a failed panel carries no message.
  why: A header message of a fixed variant contradicts the rule that each variant shows only its own message, and the loading view already heads the panel with no message of its own.
---

=== rules/graph-explorer/a-failed-node-read-is-an-alert
---
type: invariant
statement: "A failed node detail read MUST be announced as an alert with a retry offered only for the generic failure that reads the node again."
constrains:
- domain/graph-explorer/node-detail
---

## Description

None.

=== rules/graph-explorer/a-failed-relationships-read-always-offers-a-retry
---
type: invariant
statement: "Any failed relationships read MUST be announced as an alert reading \"Não foi possível carregar as relações.\" with the action Tentar novamente and no error code examined."
constrains:
- domain/graph-explorer/node-detail
---

## Description

None.

=== rules/graph-explorer/a-fragment-shows-confidence-status-text-and-chunks
---
type: invariant
statement: "Each fragment MUST show its confidence label, its status and its text followed by its chunks."
constrains:
- domain/graph-explorer/node-detail
---

## Description

None.

=== rules/graph-explorer/a-fragment-status-is-free-text
---
type: invariant
statement: "A fragment's status MUST be passed through as free text without being checked against a closed list."
constrains:
- domain/graph-explorer/node-detail
---

## Description

None.

=== rules/graph-explorer/a-gap-change-applies-from-the-next-reveal
---
type: invariant
statement: "A change to the reveal gap while a reveal runs MUST take effect from the next reveal."
constrains:
- domain/graph-explorer/graph-pane
---

## Description

None.

=== rules/graph-explorer/a-gap-of-zero-or-less-is-zero
---
type: invariant
statement: "A reveal gap of zero or less MUST be treated as 0 milliseconds and the reveal MUST stay asynchronous."
constrains:
- domain/graph-explorer/graph-pane
---

## Description

None.

=== rules/graph-explorer/a-graph-change-keeps-every-positioned-node-where-it-is
---
type: invariant
statement: "A layout run caused by a change of nodes or links MUST keep every node that already has a position at that position and place only nodes without one."
constrains:
- domain/graph-explorer/graph-pane
---

## Description

None.

=== rules/graph-explorer/a-kept-link-carries-its-slug-label-and-state
---
type: invariant
statement: "A kept delta link MUST carry its link type slug, its visible label, whether it is temporal and a state derived from its status and flags, and its in-effect flag only when the answer included it."
constrains:
- domain/graph-explorer/graph-pane
---

## Description

None.

=== rules/graph-explorer/a-late-restore-answer-is-discarded
---
type: invariant
statement: "A restore answer that arrives after the active conversation changed MUST be discarded."
constrains:
- domain/graph-explorer/graph-pane
---

## Description

None.

=== rules/graph-explorer/a-link-is-coloured-by-its-type
---
type: invariant
statement: "A link's colour MUST follow its link type for the 13 known types and an unknown type MUST take the colour of related_to."
constrains:
- domain/graph-explorer/graph-pane
---

## Description

None.

=== rules/graph-explorer/a-link-is-dashed-unless-temporal-and-sure
---
type: invariant
statement: "A link MUST be dashed 4 4 when its state is uncertain or it is not temporal and solid otherwise."
constrains:
- domain/graph-explorer/graph-pane
---

## Description

None.

=== rules/graph-explorer/a-link-is-dimmed-when-out-of-effect
---
type: invariant
statement: "A link and its label MUST be dimmed to 40% opacity when it is marked not in effect or its state is superseded."
constrains:
- domain/graph-explorer/graph-pane
---

## Description

None.

=== rules/graph-explorer/a-link-is-hidden-from-assistive-technology
---
type: invariant
statement: "A link MUST be hidden from assistive technology."
constrains:
- domain/graph-explorer/graph-pane
---

## Description

None.

=== rules/graph-explorer/a-link-is-kept-only-with-visible-ends
---
type: invariant
statement: "A delta link MUST be kept only when each endpoint is a kept node of the delta or a node already in the pane."
constrains:
- domain/graph-explorer/graph-pane
---

## Description

None.

=== rules/graph-explorer/a-link-is-outgoing-when-it-starts-at-the-node
---
type: invariant
statement: "A link MUST be outgoing when its source is the starting node the answer names and incoming otherwise, so a link from the node to itself is outgoing."
constrains:
- domain/graph-explorer/node-detail
---

## Description

None.

=== rules/graph-explorer/a-link-meets-each-node-at-its-border
---
type: invariant
statement: "A link's endpoints MUST sit where the line between the two node centres crosses each node's border, the side being checked in the order left, right, top, bottom within 1 unit after rounding and bottom when none matches."
constrains:
- domain/graph-explorer/graph-pane
---

## Description

None.

=== rules/graph-explorer/a-link-needs-both-measured-nodes-to-be-drawn
---
type: invariant
statement: "A link MUST be drawn only when both its nodes exist and have a measured non-zero width and height."
constrains:
- domain/graph-explorer/graph-pane
---

## Description

None.

=== rules/graph-explorer/a-link-needs-data-and-measured-nodes
---
type: invariant
statement: "A link MUST NOT be drawn while it has no data or while either endpoint node is unmeasured."
constrains:
- domain/graph-explorer/graph-pane
---

## Description

None.

=== rules/graph-explorer/a-link-shows-the-catalog-label
---
type: invariant
statement: "A link's label MUST show the link type's display label and never the slug."
constrains:
- domain/graph-explorer/graph-pane
---

## Description

None.

=== rules/graph-explorer/a-linkless-node-is-still-placed
---
type: invariant
statement: "A node with no links MUST still be placed and a coordinate that cannot be computed MUST become 0."
constrains:
- domain/graph-explorer/graph-pane
---

## Description

None.

=== rules/graph-explorer/a-node-click-only-reports-the-node-id
---
type: invariant
statement: "The pane MUST pass a node click to its caller as the node id and do nothing else with it."
constrains:
- domain/graph-explorer/graph-pane
---

## Description

None.

=== rules/graph-explorer/a-node-failure-is-classified-by-its-code
---
type: invariant
statement: "A node detail failure MUST be generic for a non-object error, not-found for RESOURCE_NOT_FOUND checked first, deleted for BUSINESS_NODE_DELETED and generic for any other code."
constrains:
- domain/graph-explorer/node-detail
---

## Description

None.

=== rules/graph-explorer/a-node-failure-reads-its-wording
---
type: invariant
statement: "Each variant of a node detail failure MUST show its own message, never the message of another variant."
constrains:
- domain/graph-explorer/node-detail
---

## Description

None.

=== rules/graph-explorer/a-node-is-drawn-with-its-type-label-state-and-selection
---
type: invariant
statement: "A graph node MUST be drawn with its type, label, optional confidence state, optional subtitle and selected flag."
constrains:
- domain/graph-explorer/graph-pane
---

## Description

None.

=== rules/graph-explorer/a-node-s-link-endpoints-are-inert
---
type: invariant
statement: "A node's link endpoints MUST be unconnectable, hidden from assistive technology, invisible and inert."
constrains:
- domain/graph-explorer/graph-pane
---

## Description

None.

=== rules/graph-explorer/a-node-without-position-sits-at-the-origin
---
type: invariant
statement: "A node with no computed position MUST be placed at (0, 0)."
constrains:
- domain/graph-explorer/graph-pane
---

## Description

None.

=== rules/graph-explorer/a-pending-save-is-dropped-on-leaving
---
type: invariant
statement: "A save still waiting MUST be dropped when the active conversation changes or the screen closes."
constrains:
- domain/graph-explorer/graph-pane
---

## Description

None.

=== rules/graph-explorer/a-provenance-answer-is-a-list-of-fragments
---
type: invariant
statement: "A full provenance answer MUST be read as fragments each with its id, text, confidence, status and chunks, each chunk with its id, index, offsets, excerpt, locator and raw information."
constrains:
- domain/graph-explorer/node-detail
---

## Description

None.

=== rules/graph-explorer/a-read-needs-a-non-empty-identity
---
type: invariant
statement: "A node, relationships or provenance read MUST NOT be requested unless its id is a non-empty string, and a provenance read MUST NOT be requested until the caller enables it."
constrains:
- domain/graph-explorer/node-detail
---

## Description

None.

=== rules/graph-explorer/a-read-stays-fresh-five-minutes
---
type: invariant
statement: "A node detail, relationships or full provenance read MUST stay fresh for 5 minutes and MUST NOT be repeated when the window regains focus."
constrains:
- domain/graph-explorer/node-detail
---

## Description

None.

=== rules/graph-explorer/a-redacted-original-input-is-never-shown
---
type: invariant
statement: "An original input that is exactly [REDACTED] MUST show \"Texto original redigido.\" named \"Texto original redigido por conformidade.\" and never the sentinel."
constrains:
- domain/graph-explorer/node-detail
---

## Description

None.

=== rules/graph-explorer/a-relationship-badge-follows-its-effective-status
---
type: invariant
statement: "A relationship row's badge MUST come from the link's effective status with the assertion status taken as accepted."
constrains:
- domain/graph-explorer/node-detail
---

## Description

None.

=== rules/graph-explorer/a-relationship-row-shows-arrow-type-neighbour-confidence-and-status
---
type: invariant
statement: "A relationship row MUST show in order a direction arrow hidden from assistive technology, the link type label, the neighbour's name, the confidence label and an icon-only status badge."
constrains:
- domain/graph-explorer/node-detail
---

## Description

None.

=== rules/graph-explorer/a-relationship-row-shows-its-validity
---
type: invariant
statement: "When a validity bound is known the relationship row MUST show from → to with a dash for a missing bound."
constrains:
- domain/graph-explorer/node-detail
---

## Description

None.

=== rules/graph-explorer/a-relationship-shows-fixed-fields
---
type: invariant
statement: "A relationship MUST be shown with its link type, effective status, in-effect flag, confidence, confidence label, validity labels, flags and provenance and MUST NOT show its status, is_current, recorded_at, superseded_at, hop or score."
constrains:
- domain/graph-explorer/node-detail
---

## Description

None.

=== rules/graph-explorer/a-save-follows-a-graph-change
---
type: invariant
statement: "A save MUST be triggered when the pane's nodes, positions or layout reset change."
constrains:
- domain/graph-explorer/graph-pane
---

## Description

None.

=== rules/graph-explorer/a-save-is-a-put-of-json
---
type: invariant
statement: "The save MUST be sent as a PUT of the graph view with a JSON body and a JSON content type."
constrains:
- domain/graph-explorer/graph-pane
---

## Description

None.

=== rules/graph-explorer/a-save-waits-800-milliseconds
---
type: invariant
statement: "A save MUST wait 800 milliseconds after the last change, each new change restarting the wait."
constrains:
- domain/graph-explorer/graph-pane
---

## Description

None.

=== rules/graph-explorer/a-saved-view-holds-positions-and-pins
---
type: invariant
statement: "A saved view MUST hold a version, nodes, links, a position for each node id and the pinned node ids, version 2 adding the layout algorithm."
constrains:
- domain/graph-explorer/graph-pane
---

## Description

None.

=== rules/graph-explorer/a-snapshot-carries-its-version-and-fields
---
type: invariant
statement: "A saved graph view MUST be version 2 with nodes, links, positions, pinned nodes and layout algorithm, and a version 1 view MUST carry the same without the layout algorithm."
constrains:
- domain/graph-explorer/graph-pane
---

## Description

None.

=== rules/graph-explorer/a-source-date-time-is-short-pt-br
---
type: invariant
statement: "A raw information's received-at instant MUST be shown as a short pt-BR date with a short time in the owner's local time zone, the raw text when it cannot be read."
constrains:
- domain/graph-explorer/node-detail
---

## Description

None.

=== rules/graph-explorer/a-source-shows-its-id-type-dates-and-title
---
type: invariant
statement: "A raw information MUST be shown with its id, source type, received-at label, title and document-date label."
constrains:
- domain/graph-explorer/node-detail
---

## Description

None.

=== rules/graph-explorer/a-successful-detail-shows-the-node
---
type: invariant
statement: "A loaded node detail MUST show the canonical name, the node type and the node's state badge in its header."
constrains:
- domain/graph-explorer/node-detail
---

## Description

None.

=== rules/graph-explorer/a-validity-date-is-shown-day-month-year
---
type: invariant
statement: "A validity date given as year-month-day MUST be shown as day, month and year with slashes in pt-BR formatted in UTC, an absent date MUST get no label and a date that cannot be read MUST be shown as the raw text."
constrains:
- domain/graph-explorer/node-detail
---

## Description

None.

=== rules/graph-explorer/a-weak-state-overrides-the-type-colour
---
type: invariant
statement: "An uncertain, disputed or superseded state MUST replace the link-type colour, the state being checked before the type, and accepted, low-confidence and no state MUST keep it."
constrains:
- domain/graph-explorer/graph-pane
---

## Description

None.

=== rules/graph-explorer/add-keeps-links-whose-nodes-are-missing
---
type: invariant
statement: "Adding a delta MUST keep every link, including a link whose endpoints are not in the pane."
constrains:
- domain/graph-explorer/graph-pane
---

## Description

None.

=== rules/graph-explorer/add-marks-a-delta-received
---
type: invariant
statement: "Adding a delta MUST mark that a delta was received this turn even when every id was already known."
constrains:
- domain/graph-explorer/graph-pane
---

## Description

None.

=== rules/graph-explorer/add-merges-by-identity
---
type: invariant
statement: "Adding a delta MUST merge its nodes and links into the pane by id, a node or link already present being overwritten by the newer one."
constrains:
- domain/graph-explorer/graph-pane
---

## Description

None.

=== rules/graph-explorer/add-queues-only-unseen-nodes
---
type: invariant
statement: "Adding a delta MUST queue for reveal only the nodes that are neither revealed nor already in the pane."
constrains:
- domain/graph-explorer/graph-pane
---

## Description

None.

=== rules/graph-explorer/aliases-are-listed-as-received
---
type: invariant
statement: "Aliases MUST be listed in the order received in a list named Aliases, the canonical one marked (canônico) and, with none, the text \"Nenhum alias adicional.\"."
constrains:
- domain/graph-explorer/node-detail
---

## Description

None.

=== rules/graph-explorer/an-absent-original-input-shows-nothing
---
type: invariant
statement: "An original input that is null or absent MUST show nothing."
constrains:
- domain/graph-explorer/node-detail
---

## Description

None.

=== rules/graph-explorer/an-attribute-hides-its-bookkeeping-fields
---
type: invariant
statement: "An attribute MUST be shown with its id, key, value, value type, effective status, in-effect flag, badge, validity labels and provenance and MUST NOT show its is_current, confidence or node_id."
constrains:
- domain/graph-explorer/node-detail
---

## Description

None.

=== rules/graph-explorer/an-attribute-row-shows-key-value-state-and-validity
---
type: invariant
statement: "An attribute row MUST show its key, its value and an icon-only state badge, and when a validity bound is known also from → to with a dash for a missing bound."
constrains:
- domain/graph-explorer/node-detail
---

## Description

None.

=== rules/graph-explorer/an-attribute-without-provenance-has-an-empty-list
---
type: invariant
statement: "An attribute whose answer has no provenance list MUST get an empty one."
constrains:
- domain/graph-explorer/node-detail
---

## Description

None.

=== rules/graph-explorer/an-empty-graph-has-no-positions
---
type: invariant
statement: "An empty graph MUST have no positions."
constrains:
- domain/graph-explorer/graph-pane
---

## Description

None.

=== rules/graph-explorer/an-inline-entry-hides-what-it-lacks
---
type: invariant
statement: "An inline provenance entry MUST show its fragment id and text with its confidence, its label, its raw information id, source type and excerpt each null when missing, and a missing or non-finite confidence MUST give no label rather than 0%."
constrains:
- domain/graph-explorer/node-detail
---

## Description

None.

=== rules/graph-explorer/an-inline-entry-shows-its-date-only
---
type: invariant
statement: "The received-at instant of an inline provenance entry MUST be shown as a pt-BR date with a two-digit day and month in the owner's local time zone, nothing for a missing instant and the raw text for one that cannot be read."
constrains:
- domain/graph-explorer/node-detail
---

## Description

None.

=== rules/graph-explorer/an-origin-failure-is-an-alert-with-a-retry-unless-deleted
---
type: invariant
statement: "A failed origin read MUST be announced as an alert and offer a retry that reads again for every variant except deleted."
constrains:
- domain/graph-explorer/node-detail
---

## Description

None.

=== rules/graph-explorer/an-origin-failure-is-classified-by-its-code
---
type: invariant
statement: "An origin read failure MUST be unknown for a non-object error, not-found for RESOURCE_NOT_FOUND checked first, deleted for BUSINESS_RAW_INFORMATION_DELETED, generic for a code starting SYSTEM_ and unknown for any other."
constrains:
- domain/graph-explorer/node-detail
---

## Description

None.

=== rules/graph-explorer/an-origin-failure-reads-its-wording
---
type: invariant
statement: "A not-found origin failure MUST read \"Origem não encontrada.\", a deleted one \"Documento original removido por conformidade.\" and a generic or unknown one \"Não foi possível carregar a origem.\"."
constrains:
- domain/graph-explorer/node-detail
---

## Description

None.

=== rules/graph-explorer/an-origin-without-fragments-says-not-found
---
type: invariant
statement: "A successful origin read with no fragments MUST show \"Origem não encontrada.\"."
constrains:
- domain/graph-explorer/node-detail
---

## Description

None.

=== rules/graph-explorer/an-original-input-is-shown-verbatim
---
type: invariant
statement: "An original input that is a string other than [REDACTED] MUST be shown verbatim with its whitespace in a disclosure named Texto original do operador."
constrains:
- domain/graph-explorer/node-detail
---

## Description

None.

=== rules/graph-explorer/an-unformatted-confidence-shows-zero-percent
---
type: invariant
statement: "A link or fragment confidence that cannot be formatted MUST be shown as 0%."
constrains:
- domain/graph-explorer/node-detail
---

## Description

None.

=== rules/graph-explorer/attribute-badge-follows-a-fixed-precedence
---
type: invariant
statement: "An attribute's badge MUST be disputed for effective status disputed, otherwise uncertain for uncertain, otherwise superseded for inactive, otherwise superseded when its assertion status is superseded, and accepted when none applies."
constrains:
- domain/graph-explorer/node-detail
---

## Description

None.

=== rules/graph-explorer/attributes-are-listed-as-received
---
type: invariant
statement: "Attributes MUST be listed in the order received in a table of attribute, value and state and, with none, the text \"Nenhum atributo registrado.\"."
constrains:
- domain/graph-explorer/node-detail
---

## Description

None.

=== rules/graph-explorer/attributes-in-effect-come-first-by-key
---
type: invariant
statement: "Attributes in effect MUST come before those not in effect and each group MUST be ordered by key compared in pt-BR ignoring case and accents, equal keys keeping the answered order."
constrains:
- domain/graph-explorer/node-detail
---

## Description

None.

=== rules/graph-explorer/choosing-a-layout-releases-the-pins
---
type: invariant
statement: "Choosing a different layout algorithm MUST set it, clear the owner's pins and advance the layout counter, and choosing the one already in use MUST change nothing."
constrains:
- domain/graph-explorer/graph-pane
---

## Description

None.

=== rules/graph-explorer/closing-the-drawer-returns-focus-to-curar
---
type: invariant
statement: "When the curation drawer closes focus MUST return to the Curar control on the next animation frame."
constrains:
- domain/graph-explorer/node-detail
---

## Description

None.

=== rules/graph-explorer/confidence-is-a-rounded-percentage
---
type: invariant
statement: "A confidence from 0 to 1 MUST be shown as its value times 100 rounded to a whole number followed by a percent sign."
constrains:
- domain/graph-explorer/node-detail
---

## Description

None.

=== rules/graph-explorer/curar-needs-a-target
---
type: invariant
statement: "The Curar control MUST appear only when a curation target exists."
constrains:
- domain/graph-explorer/node-detail
---

## Description

None.

=== rules/graph-explorer/curar-opens-the-drawer-for-the-target
---
type: invariant
statement: "Curar MUST open the curation drawer with the target kind, item id and the node's canonical name as its label without changing the address."
constrains:
- domain/graph-explorer/node-detail
---

## Description

None.

=== rules/graph-explorer/curation-target-follows-the-node
---
type: invariant
statement: "The curation target MUST be the entity-match item keyed by the node id when its status is needs_review, otherwise the disputed item keyed by the first attribute whose effective status is uncertain or disputed, otherwise none."
constrains:
- domain/graph-explorer/node-detail
---

## Description

None.

=== rules/graph-explorer/direction-picks-the-link-wording
---
type: invariant
statement: "An outgoing link MUST be labelled with its link type and the arrow → and an incoming link with its inverse name and the arrow ←."
constrains:
- domain/graph-explorer/node-detail
---

## Description

None.

=== rules/graph-explorer/empty-reveal-queue-ends-revealing
---
type: invariant
statement: "A pane that is revealing MUST become ready when its reveal queue is empty, and the reveal step MUST change no other status."
constrains:
- domain/graph-explorer/graph-pane
---

## Description

None.

=== rules/graph-explorer/empty-state-tells-where-memory-will-appear
---
type: invariant
statement: "The empty state MUST read \"A memória aparecerá aqui conforme você conversa.\" with no spinner and no action."
constrains:
- domain/graph-explorer/graph-pane
---

## Description

None.

=== rules/graph-explorer/empty-status-without-nodes-shows-only-the-empty-state
---
type: invariant
statement: "The pane MUST show only the empty state with no canvas when its status is empty and it holds no nodes, and MUST show the canvas when it is empty and holds nodes."
constrains:
- domain/graph-explorer/graph-pane
---

## Description

None.

=== rules/graph-explorer/ending-a-turn-resets-the-delta-mark
---
type: invariant
statement: "Ending a turn, whether with done or error, MUST reset the mark that a delta was received this turn."
constrains:
- domain/graph-explorer/graph-pane
---

## Description

None.

=== rules/graph-explorer/error-overlay-shows-the-message-or-the-default
---
type: invariant
statement: "The error overlay MUST show the pane's error message and, when there is none, \"Não foi possível carregar o grafo agora.\", and MUST offer no action."
constrains:
- domain/graph-explorer/graph-pane
---

## Description

None.

=== rules/graph-explorer/escape-closes-the-panel
---
type: invariant
statement: "Escape anywhere in the node detail panel MUST close it."
constrains:
- domain/graph-explorer/node-detail
---

## Description

None.

=== rules/graph-explorer/every-item-offers-its-full-origin
---
type: invariant
statement: "Every attribute and every relationship row MUST offer a disclosure Ver origem completa whose provenance is read, by attribute or by link, only while it is open."
constrains:
- domain/graph-explorer/node-detail
---

## Description

None.

=== rules/graph-explorer/fit-and-recenter-take-300-milliseconds
---
type: invariant
statement: "Fitting MUST fit all rendered nodes over 300 milliseconds with 0.1 padding and recentering MUST reset the viewport to x 0, y 0 and zoom 0.75 over 300 milliseconds."
constrains:
- domain/graph-explorer/graph-pane
---

## Description

None.

=== rules/graph-explorer/focusing-a-node-centres-it-at-zoom-one
---
type: invariant
statement: "Focusing a node MUST centre the viewport on its middle at zoom 1 over 300 milliseconds and do nothing when the node is not on the canvas."
constrains:
- domain/graph-explorer/graph-pane
---

## Description

None.

=== rules/graph-explorer/force-layout-keeps-nodes-270-apart
---
type: invariant
statement: "The force layout MUST give each node a footprint of 270 canvas units, a collision radius of 135, a link distance of 270, a charge strength of -300 and a centre at (0, 0)."
constrains:
- domain/graph-explorer/graph-pane
---

## Description

None.

=== rules/graph-explorer/force-layout-runs-a-hundred-silent-ticks
---
type: invariant
statement: "The force layout MUST run 100 synchronous ticks without animation."
constrains:
- domain/graph-explorer/graph-pane
---

## Description

None.

=== rules/graph-explorer/full-provenance-is-cached-by-kind-and-id
---
type: invariant
statement: "Full provenance MUST be cached under its kind and id."
constrains:
- domain/graph-explorer/node-detail
---

## Description

None.

=== rules/graph-explorer/graph-view-requests-carry-the-same-token-header-as-chat
---
type: invariant
statement: "The graph view save and restore MUST build their authorization header with the chat feature's helper, which carries the bearer access token when the auth store holds one and no header when it holds none."
constrains:
- domain/graph-explorer/graph-pane
---

## Description

None.

=== rules/graph-explorer/inline-entries-show-text-and-what-they-have
---
type: invariant
statement: "Each inline provenance entry MUST show its fragment text and its confidence label, source type and received-at label each only when present."
constrains:
- domain/graph-explorer/node-detail
---

## Description

None.

=== rules/graph-explorer/inline-provenance-needs-an-entry
---
type: invariant
statement: "The inline provenance disclosure MUST appear only when the item has at least one provenance entry, summarised as Proveniência followed by the count in parentheses with the word entrada for one and entradas otherwise, and for a link as Proveniência do link."
constrains:
- domain/graph-explorer/node-detail
---

## Description

None.

=== rules/graph-explorer/layout-controls-need-nodes-and-a-handler
---
type: invariant
statement: "The layout controls MUST appear top-right only when at least one node is visible and at least one control is wired."
constrains:
- domain/graph-explorer/graph-pane
---

## Description

None.

=== rules/graph-explorer/layout-defaults-to-force
---
type: invariant
statement: "The layout algorithm MUST be force by default and an unrecognized algorithm MUST fall back to force."
constrains:
- domain/graph-explorer/graph-pane
---

## Description

None.

=== rules/graph-explorer/layout-reruns-on-graph-or-counter-change
---
type: invariant
statement: "The layout MUST re-run when the nodes, the links or the layout counter change and MUST NOT re-run when a node is moved by hand."
constrains:
- domain/graph-explorer/graph-pane
---

## Description

None.

=== rules/graph-explorer/link-state-follows-a-fixed-precedence
---
type: invariant
statement: "A link's confidence state MUST be superseded when its status is superseded, otherwise disputed when it carries the disputed flag, otherwise low-confidence for the low_confidence flag, otherwise uncertain for the uncertain flag, and accepted when none applies."
constrains:
- domain/graph-explorer/graph-pane
---

## Description

None.

=== rules/graph-explorer/link-text-is-the-catalog-label-or-the-spaced-slug
---
type: invariant
statement: "A link's shown text MUST be the untrimmed link_type_label when it is present and not blank, and otherwise the link type with each underscore replaced by a space."
constrains:
- domain/graph-explorer/graph-pane
---

## Description

None.

=== rules/graph-explorer/link-type-slug-is-kept-apart-from-its-text
---
type: invariant
statement: "A mapped link MUST keep its link type slug as its label, and the slug MUST never be the text shown."
constrains:
- domain/graph-explorer/graph-link-view
---

## Description

None.

=== rules/graph-explorer/links-with-a-missing-endpoint-are-left-out-of-layouts
---
type: invariant
statement: "Links whose endpoints are not both in the graph MUST be left out of every layout."
constrains:
- domain/graph-explorer/graph-pane
---

## Description

None.

=== rules/graph-explorer/lists-keep-the-answered-order
---
type: invariant
statement: "Relationships, fragments, chunks, nodes and links MUST keep the order the answer or the delta gives them."
constrains:
- domain/graph-explorer/node-detail
---

## Description

None.

=== rules/graph-explorer/loading-and-error-overlay-the-canvas
---
type: invariant
statement: "The pane MUST put a loading overlay over the canvas while loading and an error overlay while in error, none while revealing or ready, and the nodes already shown MUST stay on the canvas under the overlay."
constrains:
- domain/graph-explorer/graph-pane
---

## Description

None.

=== rules/graph-explorer/loading-overlay-says-it-is-searching
---
type: invariant
statement: "The loading overlay MUST show a spinner and the text \"Buscando na memória…\"."
constrains:
- domain/graph-explorer/graph-pane
---

## Description

None.

=== rules/graph-explorer/merged-or-deleted-node-has-no-state-and-is-left-off
---
type: invariant
statement: "A node whose status is merged, deleted or unknown MUST get no confidence state and MUST be left off the pane without any error."
constrains:
- domain/graph-explorer/graph-pane
---

## Description

None.

=== rules/graph-explorer/missing-flags-and-provenance-are-empty-lists
---
type: invariant
statement: "A link with no flags or provenance list MUST get an empty list for each."
constrains:
- domain/graph-explorer/node-detail
---

## Description

None.

=== rules/graph-explorer/moving-a-node-pins-it
---
type: invariant
statement: "Moving a node by hand MUST fix it at the dropped position and record it as pinned by the owner, and moving a node that is not in the graph MUST change nothing."
constrains:
- domain/graph-explorer/graph-pane
---

## Description

None.

=== rules/graph-explorer/node-badge-follows-the-node-status
---
type: invariant
statement: "A node's badge MUST be accepted for active, uncertain for needs_review and superseded for merged and for deleted."
constrains:
- domain/graph-explorer/node-detail
---

## Description

None.

=== rules/graph-explorer/node-detail-has-no-merged-into-by-default
---
type: invariant
statement: "A node detail with no merged-into node MUST treat it as none and each alias MUST keep its id, text and kind unchanged."
constrains:
- domain/graph-explorer/node-detail
---

## Description

None.

=== rules/graph-explorer/node-detail-reads-share-a-key-by-node
---
type: invariant
statement: "A node detail MUST be cached by node id, with a placeholder id when there is none, and a node's relationships under a separate key by node id that the node detail key does not cover."
constrains:
- domain/graph-explorer/node-detail
---

## Description

None.

=== rules/graph-explorer/node-state-follows-its-status-alone
---
type: invariant
statement: "A node's confidence state MUST be accepted for status active and uncertain for status needs_review, and never superseded, disputed or low-confidence."
constrains:
- domain/graph-explorer/graph-pane
---

## Description

None.

=== rules/graph-explorer/node-type-is-trimmed-lowercased-and-falls-back-to-concept
---
type: invariant
statement: "A node's type MUST be its slug trimmed and lower-cased when that is one of the ten known node types and concept otherwise, and mapping MUST never fail."
constrains:
- domain/graph-explorer/graph-pane
---

## Description

None.

=== rules/graph-explorer/nodes-drag-only-when-a-commit-is-wired
---
type: invariant
statement: "Nodes MUST be draggable only when a position commit is wired and every position change during a drag MUST be committed with the node id and coordinate."
constrains:
- domain/graph-explorer/graph-pane
---

## Description

None.

=== rules/graph-explorer/only-a-version-2-view-restores-its-layout
---
type: invariant
statement: "A saved view's layout algorithm MUST be restored only for version 2 with a layout algorithm and every other view MUST restore as force without failing."
constrains:
- domain/graph-explorer/graph-pane
---

## Description

None.

=== rules/graph-explorer/only-revealed-nodes-are-shown
---
type: invariant
statement: "When a reveal set is supplied only revealed nodes MUST be shown and a link only when both its endpoints are revealed, and with no reveal set every node and link MUST be shown."
constrains:
- domain/graph-explorer/graph-pane
---

## Description

None.

=== rules/graph-explorer/original-input-is-carried-only-when-answered
---
type: invariant
statement: "A raw information's original input MUST be carried only when the answer includes the field, including when it is null, and passed through unchanged."
constrains:
- domain/graph-explorer/node-detail
---

## Description

None.

=== rules/graph-explorer/pane-is-a-region-named-after-the-graph
---
type: invariant
statement: "The graph pane MUST be a region whose accessible name is Grafo de conhecimento and MUST take its nodes, links, status and error message from its caller without writing them."
constrains:
- domain/graph-explorer/graph-pane
---

## Description

None.

=== rules/graph-explorer/pane-is-busy-only-while-loading-or-revealing
---
type: invariant
statement: "The pane MUST be marked busy only while its status is loading or revealing."
constrains:
- domain/graph-explorer/graph-pane
---

## Description

None.

=== rules/graph-explorer/pane-starts-and-clears-empty
---
type: invariant
statement: "A graph pane that starts or is cleared MUST hold no nodes, links, positions, pins, queued or revealed nodes and no error message, MUST have status empty, no delta received this turn, layout counter 0 and layout algorithm force."
constrains:
- domain/graph-explorer/graph-pane
---

## Description

None.

=== rules/graph-explorer/radial-layout-puts-the-root-at-the-centre
---
type: invariant
statement: "The radial layout MUST put the root at (0, 0) with angle 0 pointing to the top and an angular gap of 1 between siblings and 2 between other neighbours divided by depth."
constrains:
- domain/graph-explorer/graph-pane
---

## Description

None.

=== rules/graph-explorer/radial-rings-take-the-largest-radius
---
type: invariant
statement: "Each radial ring's radius MUST be the largest of depth times 200, 270 divided by twice the sine of pi over the ring count for a ring of two or more nodes, and the previous ring's radius plus 200, ring 0 having radius 0."
constrains:
- domain/graph-explorer/graph-pane
---

## Description

None.

=== rules/graph-explorer/read-failures-pass-through-unchanged
---
type: invariant
statement: "A failed node detail, relationships or full provenance read MUST surface the request helper's own error with its code unchanged."
constrains:
- domain/graph-explorer/node-detail
---

## Description

None.

=== rules/graph-explorer/reduced-motion-reveals-everything-at-once
---
type: invariant
statement: "When the owner prefers reduced motion every queued node MUST be revealed at once with no stagger, and where the preference cannot be read motion MUST be assumed on."
constrains:
- domain/graph-explorer/graph-pane
---

## Description

None.

=== rules/graph-explorer/relationship-rows-keep-the-answered-order
---
type: invariant
statement: "Relationship rows MUST be listed in the order received."
constrains:
- domain/graph-explorer/node-detail
---

## Description

None.

=== rules/graph-explorer/relationships-are-a-named-busy-section
---
type: invariant
statement: "The relationships section MUST be named Relações and marked busy while its read is pending and MUST check pending first, then failure, then no links, then the list."
constrains:
- domain/graph-explorer/node-detail
---

## Description

None.

=== rules/graph-explorer/relationships-are-read-at-depth-one-both-ways
---
type: invariant
statement: "A node's relationships MUST be requested at depth 1 and in direction both."
constrains:
- domain/graph-explorer/node-detail
---

## Description

None.

=== rules/graph-explorer/relationships-say-loading-or-none
---
type: invariant
statement: "While pending the relationships section MUST show the polite text \"Carregando relações…\" and with no links \"Nenhuma relação encontrada.\"."
constrains:
- domain/graph-explorer/node-detail
---

## Description

None.

=== rules/graph-explorer/removing-nodes-removes-everything-about-them
---
type: invariant
statement: "Removing nodes MUST drop them with their positions, revealed marks, pins, queued reveals and every link that touches one, and an empty list MUST change nothing."
constrains:
- domain/graph-explorer/graph-pane
---

## Description

None.

=== rules/graph-explorer/reorganizing-releases-the-pins
---
type: invariant
statement: "Reorganizing MUST clear the owner's pins and advance the layout counter without clearing positions beforehand."
constrains:
- domain/graph-explorer/graph-pane
---

## Description

None.

=== rules/graph-explorer/replace-keeps-only-the-delta
---
type: invariant
statement: "Replacing with a delta MUST keep only its nodes and the links whose two endpoints are among them, clear positions, pins and revealed nodes, queue every node in delta order, mark a delta received and leave the status untouched."
constrains:
- domain/graph-explorer/graph-pane
---

## Description

None.

=== rules/graph-explorer/restore-reads-the-saved-view-of-the-conversation
---
type: invariant
statement: "When a conversation is active its saved graph view MUST be read, a present view MUST replace the pane's contents and an absent one MUST change nothing."
constrains:
- domain/graph-explorer/graph-pane
---

## Description

None.

=== rules/graph-explorer/restore-restores-the-layout-of-a-version-2-view
---
type: invariant
statement: "A saved view of version 2 MUST be restored with its layout algorithm and any other version MUST be restored as version 1 without one."
constrains:
- domain/graph-explorer/graph-pane
---

## Description

None.

=== rules/graph-explorer/restoring-keeps-orphan-positions
---
type: invariant
statement: "Restoring a saved view MUST keep the positions it holds for ids that are not among its nodes."
constrains:
- domain/graph-explorer/graph-pane
---

## Description

None.

=== rules/graph-explorer/restoring-shows-every-node-at-once
---
type: invariant
statement: "Restoring a saved view MUST restore nodes, links, positions and pins, mark every node revealed, empty the queue, set the status ready even for a view with no nodes and clear the error message and the delta mark."
constrains:
- domain/graph-explorer/graph-pane
---

## Description

None.

=== rules/graph-explorer/reveal-goes-one-node-at-a-time-in-queue-order
---
type: invariant
statement: "Queued nodes MUST be revealed one at a time from the head of the queue, 90 milliseconds apart by default."
constrains:
- domain/graph-explorer/graph-pane
---

## Description

None.

=== rules/graph-explorer/reveal-marks-nodes-only
---
type: invariant
statement: "The reveal step MUST mark nodes only and MUST NOT decide which links are visible."
constrains:
- domain/graph-explorer/graph-pane
---

## Description

None.

=== rules/graph-explorer/revealing-a-revealed-node-changes-nothing
---
type: invariant
statement: "Revealing a node that is already revealed MUST change nothing."
constrains:
- domain/graph-explorer/graph-pane
---

## Description

None.

=== rules/graph-explorer/screen-readers-hear-the-direction
---
type: invariant
statement: "Screen readers MUST hear direção: destino for an outgoing link and direção: origem for any other."
constrains:
- domain/graph-explorer/node-detail
---

## Description

None.

=== rules/graph-explorer/setting-a-status-keeps-the-error-message-only-for-error
---
type: invariant
statement: "Setting any status other than error MUST clear the error message and setting error MUST keep the message it is given."
constrains:
- domain/graph-explorer/graph-pane
---

## Description

None.

=== rules/graph-explorer/several-components-hang-under-a-virtual-root
---
type: invariant
statement: "With two or more components their roots MUST hang under a virtual root with the id __super_root__ that is never given a position."
constrains:
- domain/graph-explorer/graph-pane
---

## Description

None.

=== rules/graph-explorer/stopping-the-reveal-keeps-what-it-reached
---
type: invariant
statement: "Stopping the reveal MUST cancel the pending step and leave revealed nodes revealed and queued nodes queued."
constrains:
- domain/graph-explorer/graph-pane
---

## Description

None.

=== rules/graph-explorer/the-attributes-section-is-headed-atributos
---
type: invariant
statement: "The attributes section of a node detail MUST be headed Atributos."
constrains:
- domain/graph-explorer/node-detail
---

## Description

None.

=== rules/graph-explorer/the-canvas-opens-at-three-quarters-zoom
---
type: invariant
statement: "The canvas MUST open at x 0, y 0 and zoom 0.75 and fit its content with 0.1 padding on every change."
constrains:
- domain/graph-explorer/graph-pane
---

## Description

None.

=== rules/graph-explorer/the-canvas-stays-mounted-outside-the-empty-state
---
type: invariant
statement: "The canvas MUST stay mounted through loading, revealing, ready and error so that pan and zoom survive, and be unmounted only for the empty state."
constrains:
- domain/graph-explorer/graph-pane
---

## Description

None.

=== rules/graph-explorer/the-close-button-takes-focus
---
type: invariant
statement: "The panel's close button MUST be named Fechar detalhes do nó and take focus when the panel mounts and whenever the node id changes."
constrains:
- domain/graph-explorer/node-detail
---

## Description

None.

=== rules/graph-explorer/the-first-node-id-key-is-a-placeholder
---
type: invariant
statement: "A read with no node id MUST use the placeholder id __noop__ in its key."
constrains:
- domain/graph-explorer/node-detail
---

## Description

None.

=== rules/graph-explorer/the-layout-picker-needs-the-algorithm-and-its-setter
---
type: invariant
statement: "The layout picker MUST appear only when both the current algorithm and its setter are supplied, offer force, tree and radial in that order labelled Força, Árvore and Radial, and be named Algoritmo de layout do grafo."
constrains:
- domain/graph-explorer/graph-pane
---

## Description

None.

=== rules/graph-explorer/the-loading-view-says-it-is-loading
---
type: invariant
statement: "While loading the panel MUST show the label given on click or nothing in its header and a spinner with the polite text \"Carregando detalhes…\" in its body."
constrains:
- domain/graph-explorer/node-detail
---

## Description

None.

=== rules/graph-explorer/the-neighbour-is-the-other-end
---
type: invariant
statement: "A relationship's neighbour MUST be the endpoint that is not the starting node, named and typed from the answer's nodes and shown by its id with an empty type when absent from them."
constrains:
- domain/graph-explorer/node-detail
---

## Description

None.

=== rules/graph-explorer/the-origin-body-checks-pending-failure-then-data
---
type: invariant
statement: "The origin body MUST check pending first, then failure, then no fragments, then the list, be marked busy while pending and say \"Carregando origem…\" politely."
constrains:
- domain/graph-explorer/node-detail
---

## Description

None.

=== rules/graph-explorer/the-overlay-is-a-polite-status-region
---
type: invariant
statement: "The overlay MUST be a polite status region whose card is named Erro do grafo in the error variant and Carregando grafo in the loading variant."
constrains:
- domain/graph-explorer/graph-pane
---

## Description

None.

=== rules/graph-explorer/the-overlay-lets-the-pointer-through
---
type: invariant
statement: "The overlay MUST NOT capture the pointer so that pan, zoom and click still reach the canvas."
constrains:
- domain/graph-explorer/graph-pane
---

## Description

None.

=== rules/graph-explorer/the-overlay-message-is-two-lines-at-most
---
type: invariant
statement: "The overlay message MUST be clamped to at most 2 lines."
constrains:
- domain/graph-explorer/graph-pane
---

## Description

None.

=== rules/graph-explorer/the-owner-cannot-draw-links
---
type: invariant
statement: "The owner MUST NOT be able to draw links on the canvas, elements MUST be selectable and panning by drag and zooming by scroll MUST be on."
constrains:
- domain/graph-explorer/graph-pane
---

## Description

None.

=== rules/graph-explorer/the-pane-reveals-at-the-hooks-default-gap
---
type: invariant
statement: "The pause between revealing one node and the next MUST default to the reveal step's own default gap."
constrains:
- domain/graph-explorer/graph-pane
---

## Description

None.

=== rules/graph-explorer/the-pane-wires-the-owner-s-arrangement-to-the-store
---
type: invariant
statement: "The pane MUST wire node dragging to moving a node, the reorganize control to reorganizing and the algorithm picker to choosing the layout algorithm."
constrains:
- domain/graph-explorer/graph-pane
---

## Description

None.

=== rules/graph-explorer/the-panel-checks-pending-then-failure-then-data
---
type: invariant
statement: "The node detail panel MUST check pending first, then failure, then data, and show the loading view when there is no data and no failure."
constrains:
- domain/graph-explorer/node-detail
---

## Description

None.

=== rules/graph-explorer/the-panel-is-a-region-named-after-the-node
---
type: invariant
statement: "The node detail panel MUST be a complementary region named Detalhes do nó followed by the loaded canonical name, else the label given on click, else carregando."
constrains:
- domain/graph-explorer/node-detail
---

## Description

None.

=== rules/graph-explorer/the-panel-reads-the-node-by-id
---
type: invariant
statement: "The node detail panel MUST read the node's detail by its id."
constrains:
- domain/graph-explorer/node-detail
---

## Description

None.

=== rules/graph-explorer/the-reorganize-control-needs-its-handler
---
type: invariant
statement: "The reorganize control MUST appear when a reset handler is supplied, call it, read Reorganizar and be named Reorganizar o layout do grafo."
constrains:
- domain/graph-explorer/graph-pane
---

## Description

None.

=== rules/graph-explorer/title-and-document-date-come-from-metadata
---
type: invariant
statement: "The title MUST be the metadata title and the document date the metadata document_date shown day, month, year, each only when a non-empty string and null otherwise."
constrains:
- domain/graph-explorer/node-detail
---

## Description

None.

=== rules/graph-explorer/tree-and-radial-layouts-share-one-spanning-tree
---
type: invariant
statement: "The tree and radial layouts MUST lay out one spanning tree built breadth-first over undirected links, ignoring self-links, counting duplicates once, taking component roots by highest degree with ties to the smaller id and visiting neighbours in ascending id order."
constrains:
- domain/graph-explorer/graph-pane
---

## Description

None.

=== rules/graph-explorer/tree-layout-grows-left-to-right
---
type: invariant
statement: "The tree layout MUST run depth along x and siblings along y, 110 canvas units between siblings and 340 between layers."
constrains:
- domain/graph-explorer/graph-pane
---

## Description

None.

=== rules/graph-explorer/turn-done-after-a-delta-makes-the-pane-ready
---
type: invariant
statement: "A turn that ends with done after a delta arrived that turn MUST make the pane ready with no error message."
constrains:
- domain/graph-explorer/graph-pane
---

## Description

None.

=== rules/graph-explorer/turn-done-without-a-delta-leaves-the-status
---
type: invariant
statement: "A turn that ends with done and no delta that turn MUST leave the pane's status as it was."
constrains:
- domain/graph-explorer/graph-pane
---

## Description

None.

=== rules/graph-explorer/turn-error-ends-a-busy-pane-in-error
---
type: invariant
statement: "A turn that ends with error while the pane is loading or revealing MUST put it in error with no error message from that path, and from empty, ready or error MUST leave its status as it was."
constrains:
- domain/graph-explorer/graph-pane
---

## Description

None.

=== rules/graph-explorer/view-failures-are-silent
---
type: invariant
statement: "A failed graph view restore or save MUST show the owner nothing and a failed save MUST NOT be retried."
constrains:
- domain/graph-explorer/graph-pane
---

## Description

None.

=== rules/ingest-workspace/a-recorded-source-names-the-model-and-prompt-version
---
type: invariant
statement: "A source the screen records MUST name the model claude-opus-4-8 and the prompt version v3."
constrains:
- domain/ingest-workspace/ingest-session
---

## Description

None.

=== rules/ingest-workspace/a-recorded-source-names-the-model-and-prompt-version.log
---
entries:
- field: statement
  unstated: The ingest screen names a fixed model and prompt version whenever it records a source, and no node says which.
  decided: The screen names claude-opus-4-8 and v3.
  why: Those are the values the running screen sends and the extraction rules conditioned on prompt version already presuppose v3 for the screen.
---

=== rules/ingest-workspace/a-traversal-read-stays-fresh-for-five-minutes
---
type: invariant
statement: "A traversal read of an assembly MUST count as fresh for five minutes, during which neither a repeated assembly nor a regained window focus reads it again."
constrains:
- domain/ingest-workspace/ingest-session
---

## Description

None.

=== rules/ingest-workspace/an-assembly-delta-names-ingest-assembly-as-its-source-tool
---
type: invariant
statement: "The graph delta an ingest assembly shows MUST name ingest_assembly as its source tool."
constrains:
- domain/chat/graph-delta
---

## Description

None.

=== rules/ingest-workspace/another-document-clears-the-session
---
type: invariant
statement: "Ingesting another document MUST clear the content, the source type, the selected node, the run identity, the affected nodes, the summary, the failure and the validation message and return the screen to idle."
constrains:
- domain/ingest-workspace/ingest-session
- domain/ingest-workspace/ingest-phase
---

## Description

None.

=== rules/ingest-workspace/assembled-link-carries-only-what-the-bff-states
---
type: invariant
statement: "An assembled link MUST be temporal only when the BFF says it is, carry in-effect only when the BFF gives it and carry a state only when the BFF gives its status."
constrains:
- domain/ingest-workspace/ingest-session
---

## Description

None.

=== rules/ingest-workspace/assembled-link-is-kept-once-by-identity
---
type: invariant
statement: "A link reached by several traversals MUST enter the graph once by its identity, the later copy replacing the earlier."
constrains:
- domain/ingest-workspace/ingest-session
---

## Description

None.

=== rules/ingest-workspace/assembled-neighbour-state-comes-from-its-status
---
type: invariant
statement: "The state of an assembled neighbour MUST be derived from its node status when it has one, and an affected node MUST carry none."
constrains:
- domain/ingest-workspace/ingest-session
---

## Description

None.

=== rules/ingest-workspace/assembled-node-is-labelled-by-its-canonical-name
---
type: invariant
statement: "An assembled node MUST be labelled with its canonical name and carry its node type."
constrains:
- domain/ingest-workspace/ingest-session
---

## Description

None.

=== rules/ingest-workspace/assembled-node-keeps-the-entry-it-got-first
---
type: invariant
statement: "A node reached by several traversals MUST keep the entry it got first, and a traversal entry MUST NOT replace an affected node."
constrains:
- domain/ingest-workspace/ingest-session
---

## Description

None.

=== rules/ingest-workspace/assembly-of-no-nodes-is-an-empty-ready-graph
---
type: invariant
statement: "Graph assembly with no affected nodes MUST replace the graph with an empty one that is ready."
constrains:
- domain/ingest-workspace/ingest-session
---

## Description

None.

=== rules/ingest-workspace/assembly-replaces-the-graph-only-when-every-traversal-succeeds
---
type: invariant
statement: "Graph assembly MUST replace the graph, not add to it, only once every traversal has succeeded, and then move the graph to revealing."
constrains:
- domain/ingest-workspace/ingest-session
---

## Description

None.

=== rules/ingest-workspace/assembly-traverses-each-affected-node
---
type: invariant
statement: "Graph assembly MUST request, in parallel and only while enabled, one traversal of depth one in both directions for each affected node."
constrains:
- domain/ingest-workspace/ingest-session
---

## Description

None.

=== rules/ingest-workspace/connection-drop-is-an-unconflicting-envelope
---
type: invariant
statement: "An extraction failure MUST count as a connection drop when it is a failure envelope whose status is neither 409 nor 422 and whose code is not SYSTEM_LLM_PROVIDER_UNAVAILABLE, AUTH_SESSION_EXPIRED or SYSTEM_ABORTED."
constrains:
- domain/ingest-workspace/ingest-session
- domain/ingest-workspace/ingest-failure
---

## Description

None.

=== rules/ingest-workspace/connection-drop-is-an-unconflicting-envelope.log
---
entries:
- field: statement
  unstated: The material lists the codes that end in the error phase and says any other failure envelope that is not a conflict is silently polled, which includes codes the same screen lists as retryable.
  decided: A failure envelope counts as a connection drop unless its status is 409 or 422 or its code is one of the three named, whatever else it carries.
  why: The code treats the three named codes and the two statuses as the only exceptions, so the exceptions are what the rule names.
---

=== rules/ingest-workspace/connection-drop-polls-the-run
---
type: invariant
statement: "An extraction failure that counts as a connection drop MUST start polling the run instead of showing a failure."
constrains:
- domain/ingest-workspace/ingest-session
- domain/ingest-workspace/ingest-phase
---

## Description

None.

=== rules/ingest-workspace/content-is-checked-before-source-type
---
type: invariant
statement: "An ingest submitted with neither content nor a source type MUST be refused for its missing content."
constrains:
- domain/ingest-workspace/ingest-session
---

## Description

None.

=== rules/ingest-workspace/disabled-file-area-ignores-input
---
type: invariant
statement: "A disabled file area MUST ignore a click, a keypress and a drop."
constrains:
- domain/ingest-workspace/ingest-session
---

## Description

None.

=== rules/ingest-workspace/editing-changes-the-phase-only-in-idle-and-ready
---
type: invariant
statement: "Editing the ingest form MUST change the phase only while the phase is idle or ready."
constrains:
- domain/ingest-workspace/ingest-session
- domain/ingest-workspace/ingest-phase
---

## Description

None.

=== rules/ingest-workspace/existing-graph-is-assembled-on-request
---
type: invariant
statement: "In the noop phase the owner's request to view the existing graph MUST assemble the graph over the kept affected nodes and move the screen to revealing."
constrains:
- domain/ingest-workspace/ingest-session
- domain/ingest-workspace/ingest-phase
---

## Description

None.

=== rules/ingest-workspace/extraction-answer-moves-to-revealing
---
type: invariant
statement: "An extraction answer MUST keep the run summary and any affected nodes and move the screen to revealing."
constrains:
- domain/ingest-workspace/ingest-session
- domain/ingest-workspace/ingest-phase
---

## Description

None.

=== rules/ingest-workspace/extraction-has-no-client-cutoff
---
type: invariant
statement: "Running extraction MUST wait for as long as the BFF keeps the connection open."
constrains:
- domain/ingest-workspace/ingest-session
---

## Description

None.

=== rules/ingest-workspace/failed-traversal-leaves-the-graph-as-it-was
---
type: invariant
statement: "A failed traversal MUST leave the graph as it was and be reported as an error."
constrains:
- domain/ingest-workspace/ingest-session
---

## Description

None.

=== rules/ingest-workspace/failure-envelope-shows-its-own-code-and-message
---
type: invariant
statement: "A failure envelope MUST be shown with its own code and message."
constrains:
- domain/ingest-workspace/ingest-failure
---

## Description

None.

=== rules/ingest-workspace/failure-outside-an-envelope-is-no-connection-drop
---
type: invariant
statement: "A failure that is not a failure envelope MUST NOT count as a connection drop."
constrains:
- domain/ingest-workspace/ingest-session
- domain/ingest-workspace/ingest-failure
---

## Description

None.

=== rules/ingest-workspace/failure-outside-an-envelope-shows-the-unknown-code
---
type: invariant
statement: "A failure that is not a failure envelope MUST be shown with the code SYSTEM_UNKNOWN."
constrains:
- domain/ingest-workspace/ingest-failure
---

## Description

None.

=== rules/ingest-workspace/fields-are-editable-outside-a-run
---
type: invariant
statement: "The content and source type fields MUST be editable only in the idle, ready and error phases."
constrains:
- domain/ingest-workspace/ingest-session
- domain/ingest-workspace/ingest-phase
---

## Description

None.

=== rules/ingest-workspace/file-area-shows-only-in-idle-and-ready
---
type: invariant
statement: "The file area MUST show only in the idle and ready phases."
constrains:
- domain/ingest-workspace/ingest-session
- domain/ingest-workspace/ingest-phase
---

## Description

None.

=== rules/ingest-workspace/file-read-replaces-the-content
---
type: invariant
statement: "A file read successfully MUST replace the whole content and clear the rejection message."
constrains:
- domain/ingest-workspace/ingest-session
---

## Description

None.

=== rules/ingest-workspace/first-unauthorized-answer-refreshes-the-token-once
---
type: invariant
statement: "The first unauthorized answer to an ingestion request MUST obtain a new access token from the identity provider, store it and resend the request once with it."
constrains:
- domain/ingest-workspace/ingest-session
---

## Description

None.

=== rules/ingest-workspace/form-is-ready-with-content-and-source-type
---
type: invariant
statement: "The ingest form MUST be ready exactly when its content holds at least one character and a source type is selected."
constrains:
- domain/ingest-workspace/ingest-session
- domain/ingest-workspace/ingest-phase
---

## Description

None.

=== rules/ingest-workspace/ingest-requires-content
---
type: invariant
statement: "An ingest MUST NOT be submitted while its content is empty."
constrains:
- domain/ingest-workspace/ingest-session
---

## Description

None.

=== rules/ingest-workspace/ingest-requires-source-type
---
type: invariant
statement: "An ingest MUST NOT be submitted while no source type is selected."
constrains:
- domain/ingest-workspace/ingest-session
---

## Description

None.

=== rules/ingest-workspace/ingestion-request-carries-the-access-token
---
type: invariant
statement: "An ingestion request MUST carry the owner's access token as a bearer when the application holds one and no Authorization header otherwise."
constrains:
- domain/ingest-workspace/ingest-session
---

## Description

None.

=== rules/ingest-workspace/ingestion-request-times-out-after-thirty-seconds
---
type: invariant
statement: "An ingestion request other than running extraction MUST fail after thirty seconds without an answer."
constrains:
- domain/ingest-workspace/ingest-session
---

## Description

None.

=== rules/ingest-workspace/known-content-waits-for-the-owner
---
type: invariant
statement: "A source recorded as already ingested MUST move the screen to the noop phase without starting an extraction."
constrains:
- domain/ingest-workspace/ingest-session
- domain/ingest-workspace/ingest-phase
---

## Description

None.

=== rules/ingest-workspace/new-source-starts-extraction-at-once
---
type: invariant
statement: "A newly created source MUST start its extraction at once."
constrains:
- domain/ingest-workspace/ingest-session
---

## Description

None.

=== rules/ingest-workspace/noop-keeps-the-affected-nodes
---
type: invariant
statement: "The noop phase MUST keep the affected nodes of the recording answer, or none when the answer has none."
constrains:
- domain/ingest-workspace/ingest-session
---

## Description

None.

=== rules/ingest-workspace/only-extraction-failures-count-as-connection-drops
---
type: invariant
statement: "A failure of recording the source or of retrying the run MUST end in the error phase."
constrains:
- domain/ingest-workspace/ingest-session
- domain/ingest-workspace/ingest-phase
---

## Description

None.

=== rules/ingest-workspace/only-text-files-are-accepted
---
type: invariant
statement: "A file MUST be accepted only when its type is text/plain or another text type or its name ends in .txt in any letter case."
constrains:
- domain/ingest-workspace/ingest-session
---

## Description

None.

=== rules/ingest-workspace/only-the-first-file-is-used
---
type: invariant
statement: "Of several files dropped or picked together, only the first MUST be used."
constrains:
- domain/ingest-workspace/ingest-session
---

## Description

None.

=== rules/ingest-workspace/outcome-shows-the-seven-counts-in-order
---
type: invariant
statement: "The outcome MUST show the accepted, consolidated, needs-review, uncertain, disputed, rejected and error counts of the run summary, in that order, and no others."
constrains:
- domain/ingest-workspace/ingest-session
---

## Description

None.

=== rules/ingest-workspace/polled-completed-run-moves-to-revealing
---
type: invariant
statement: "A polled run that completed MUST stop the polling, keep its summary and any affected nodes and move the screen to revealing."
constrains:
- domain/ingest-workspace/ingest-session
- domain/ingest-workspace/ingest-phase
---

## Description

None.

=== rules/ingest-workspace/polled-failed-run-ends-in-run-failed
---
type: invariant
statement: "A polled run that failed MUST stop the polling and move the screen to the error phase with the code RUN_FAILED."
constrains:
- domain/ingest-workspace/ingest-session
- domain/ingest-workspace/ingest-phase
- domain/ingest-workspace/ingest-failure
---

## Description

None.

=== rules/ingest-workspace/polled-running-run-keeps-the-screen-waiting
---
type: invariant
statement: "A polled run that has neither completed nor failed MUST keep the screen in the polling phase."
constrains:
- domain/ingest-workspace/ingest-session
- domain/ingest-workspace/ingest-phase
---

## Description

None.

=== rules/ingest-workspace/recorded-source-keeps-the-run-identity
---
type: invariant
statement: "A recorded source MUST keep the identity of its run whatever the outcome."
constrains:
- domain/ingest-workspace/ingest-session
---

## Description

None.

=== rules/ingest-workspace/rejection-stays-until-a-file-is-read
---
type: invariant
statement: "A file rejection message MUST stay until a file is read successfully."
constrains:
- domain/ingest-workspace/ingest-session
---

## Description

None.

=== rules/ingest-workspace/resent-request-never-refreshes-again
---
type: invariant
statement: "A resent ingestion request MUST NOT start a second token refresh."
constrains:
- domain/ingest-workspace/ingest-session
---

## Description

None.

=== rules/ingest-workspace/retry-is-offered-only-for-retryable-codes
---
type: invariant
statement: "A failure MUST offer a retry only when its code is SYSTEM_LLM_PROVIDER_UNAVAILABLE, SYSTEM_INTERNAL_ERROR, SYSTEM_UPSTREAM, SYSTEM_TIMEOUT, SYSTEM_NETWORK or RUN_FAILED."
constrains:
- domain/ingest-workspace/ingest-failure
---

## Description

None.

=== rules/ingest-workspace/retry-with-a-run-retries-then-extracts
---
type: invariant
statement: "A retry with a run identity held MUST clear the failure, retry the run and, when the retry is answered, start extraction on the same run again."
constrains:
- domain/ingest-workspace/ingest-session
- domain/ingest-workspace/ingest-failure
---

## Description

None.

=== rules/ingest-workspace/retry-without-a-run-submits-again
---
type: invariant
statement: "A retry with no run identity held MUST submit the form again."
constrains:
- domain/ingest-workspace/ingest-session
---

## Description

None.

=== rules/ingest-workspace/revealing-completes-when-the-graph-is-ready
---
type: invariant
statement: "The revealing phase MUST become complete only when the graph reports ready."
constrains:
- domain/ingest-workspace/ingest-session
- domain/ingest-workspace/ingest-phase
---

## Description

None.

=== rules/ingest-workspace/review-count-points-to-curation
---
type: invariant
statement: "The outcome MUST point the owner to the curation screen when the needs-review count is above zero."
constrains:
- domain/ingest-workspace/ingest-session
---

## Description

None.

=== rules/ingest-workspace/run-is-polled-every-five-seconds
---
type: invariant
statement: "A run MUST be read every five seconds until the last run read has completed or failed."
constrains:
- domain/ingest-workspace/ingest-session
---

## Description

None.

=== rules/ingest-workspace/run-is-read-only-with-an-identity-and-the-gate
---
type: invariant
statement: "A run MUST be read only when its identity is not empty and its reading is enabled."
constrains:
- domain/ingest-workspace/ingest-session
---

## Description

None.

=== rules/ingest-workspace/selected-node-detail-replaces-the-graph
---
type: invariant
statement: "The detail of a selected node MUST replace the graph until it is closed, without changing the phase."
constrains:
- domain/ingest-workspace/ingest-session
---

## Description

None.

=== rules/ingest-workspace/submission-clears-earlier-messages
---
type: invariant
statement: "A submission that passes both checks MUST clear the validation message and the earlier failure before the phase moves to sending."
constrains:
- domain/ingest-workspace/ingest-session
- domain/ingest-workspace/ingest-failure
---

## Description

None.

=== rules/ingest-workspace/submit-control-shows-in-idle-ready-and-sending
---
type: invariant
statement: "The submit control MUST show only in the idle, ready and sending phases and MUST be disabled while sending."
constrains:
- domain/ingest-workspace/ingest-session
- domain/ingest-workspace/ingest-phase
---

## Description

None.

=== rules/ingest-workspace/submit-needs-the-ready-phase
---
type: invariant
statement: "An ingest MUST be submitted only in the ready phase with a ready form."
constrains:
- domain/ingest-workspace/ingest-session
- domain/ingest-workspace/ingest-phase
---

## Description

None.

=== rules/ingest-workspace/unrefreshable-session-ends-at-sign-in
---
type: invariant
statement: "When no new access token can be obtained the application MUST clear the stored token and replace the address with /sign-in?reason=session_expired."
constrains:
- domain/ingest-workspace/ingest-session
---

## Description

None.

=== rules/knowledge-base/a-node-status-and-an-assertion-flag-cross-the-wire-with-underscores
---
type: invariant
statement: "A node status and an assertion flag MUST cross the wire with each hyphen of their enumeration value written as an underscore."
constrains:
- domain/knowledge-base/node-status
- domain/knowledge-base/assertion-flag
---

## Description

None.

=== rules/knowledge-base/a-node-status-and-an-assertion-flag-cross-the-wire-with-underscores.log
---
entries:
- field: statement
  unstated: A survey of the graph stream found needs_review and low_confidence on the wire while the enumerations spell needs-review and low-confidence, and nothing said which spelling the stream carries.
  decided: The stream carries the underscore form of each hyphenated enumeration value.
  why: The element schema keeps enumeration values in kebab-case with code forms derived, and the running stream and back end use the underscore forms.
---

=== rules/knowledge-base/a-source-type-crosses-the-wire-in-the-materials-words
---
type: invariant
statement: "A source type MUST cross the wire as ata, artigo, transcricao or outro for meeting-minutes, article, transcript or other and as its own value for every other source type."
constrains:
- domain/knowledge-base/source-type
---

## Description

None.

=== rules/knowledge-base/a-source-type-crosses-the-wire-in-the-materials-words.log
---
entries:
- field: statement
  unstated: The screen sends ata, artigo, transcricao and outro where the enumeration holds meeting-minutes, article, transcript and other, and nothing says the wire uses the material words.
  decided: Those four values cross the wire as the material words and every other source type as itself.
  why: The back end accepts exactly pdf, email, ata, chat, artigo, transcricao and outro, and the enumeration description already names those words as the material own.
---

=== rules/knowledge-base/accept-rate
---
type: invariant
statement: A curation metrics accept rate is the share of curation actions of kind resolve-entity-match, merge-nodes, resolve-dispute, confirm-item or correct-item among all curation actions, and 0 when none is recorded.
constrains:
- domain/knowledge-base/curation-metrics
- domain/knowledge-base/curation-action-kind
---

## Description

None.

=== rules/knowledge-base/accepted-fragment-listing-refuses-unknown-parameter
---
type: invariant
statement: A listing of accepted fragments is refused when it names a query parameter the listing does not define.
constrains:
- domain/knowledge-base/accepted-fragment-filter
---

## Description

None.

=== rules/knowledge-base/adjust-periods-one-per-item
---
type: invariant
statement: A dispute resolution deciding adjust-periods MUST give exactly one period to each of its items.
constrains:
- domain/knowledge-base/dispute-resolution
- domain/knowledge-base/adjusted-period
- domain/knowledge-base/dispute-decision
---

## Description

None.

=== rules/knowledge-base/adjust-periods-outcome
---
type: policy
statement: A dispute resolution deciding adjust-periods gives each item the validity start and end of its period and makes it active.
constrains:
- domain/knowledge-base/dispute-resolution
- domain/knowledge-base/adjusted-period
- domain/knowledge-base/assertion-status
- domain/knowledge-base/knowledge-link
- domain/knowledge-base/node-attribute
consistency: eventual
---

## Description

None.

=== rules/knowledge-base/adjusted-periods-single-open
---
type: invariant
statement: A dispute resolution deciding adjust-periods in a dispute scope whose link type or attribute key does not allow multiple current values MUST leave at most one period without a validity end.
constrains:
- domain/knowledge-base/dispute-resolution
- domain/knowledge-base/adjusted-period
- domain/knowledge-base/dispute-scope
---

## Description

None.

=== rules/knowledge-base/affected-counts-non-negative
---
type: invariant
statement: Each of a compliance deletion's affected counts is zero or more.
constrains:
- domain/knowledge-base/compliance-deletion
- domain/knowledge-base/affected-counts
---

## Description

None.

=== rules/knowledge-base/affected-nodes-follow-merges
---
type: policy
statement: An affected knowledge node that was merged is listed as the knowledge node it was merged into.
constrains:
- domain/knowledge-base/llm-run
- domain/knowledge-base/knowledge-node
consistency: eventual
---

## Description

None.

=== rules/knowledge-base/affected-nodes-follow-merges.log
---
entries:
- field: consistency
  unstated: The material does not say how this read holds across the separate records it combines.
  decided: eventual
  why: The records it combines are written independently and never change in one transaction, so a read reflects each as last committed.
---

=== rules/knowledge-base/affected-nodes-of-a-run
---
type: policy
statement: An LLM run's affected knowledge nodes are those its node proposals resolved to and those joined or described by its link and attribute proposals whose outcome was accepted, consolidated, superseded a previous assertion, disputed, created, matched an existing node or needs review, each listed once in the order first reached.
constrains:
- domain/knowledge-base/llm-run
- domain/knowledge-base/knowledge-node
- domain/knowledge-base/proposal
consistency: eventual
---

## Description

None.

=== rules/knowledge-base/affected-nodes-of-a-run.log
---
entries:
- field: statement
  unstated: The material collects a run's affected nodes from the nodes its link and attribute proposals join or describe on the directed path, while the extraction path and a rebuild from tool calls count only the nodes its node proposals resolved to; the two decide differently for the target node of a link an extraction accepted.
  decided: The nodes that landed link and attribute proposals join or describe are affected nodes on every path.
  why: The collector is built to take those nodes, and only the extraction's results fail to carry them.
- field: consistency
  unstated: The material does not say how this read holds across the separate records it combines.
  decided: eventual
  why: The records it combines are written independently and never change in one transaction, so a read reflects each as last committed.
- field: statement
  unstated: A judgment shows the outcomes that admit a link or attribute proposal's nodes including created, matched an existing node and needs review.
  decided: The outcomes are accepted, consolidated, superseded a previous assertion, disputed, created, matched an existing node and needs review.
  why: The owner decided the source's behavior is the truth, and its allow-list holds those seven.
---

=== rules/knowledge-base/affected-nodes-omit-absent
---
type: policy
statement: An affected knowledge node that is no longer held when an LLM run's affected nodes are first listed is left out of them.
constrains:
- domain/knowledge-base/llm-run
- domain/knowledge-base/knowledge-node
consistency: eventual
---

## Description

None.

=== rules/knowledge-base/affected-nodes-omit-absent.log
---
entries:
- field: statement
  unstated: A judgment of the source shows a run's affected nodes read back from a cache without being checked again, so a node deleted after the first listing still appears.
  decided: A node no longer held when the run's affected nodes are first listed is left out of them.
  why: The owner decided the source's behavior is the truth, and the omission is applied once, when the list is first made.
---

=== rules/knowledge-base/affected-nodes-only-when-completed
---
type: invariant
statement: An LLM run lists its affected knowledge nodes only when its status is completed.
constrains:
- domain/knowledge-base/llm-run
- domain/knowledge-base/run-status
---

## Description

None.

=== rules/knowledge-base/alias-admitted-only-from-source
---
type: invariant
statement: A node proposal's alias is admitted only when its normalized form occurs in the normalized content of the raw information of the proposal's LLM run, except within a directed ingestion.
constrains:
- domain/knowledge-base/proposal
- domain/knowledge-base/node-alias
---

## Description

None.

=== rules/knowledge-base/alias-matching
---
type: invariant
statement: Aliases are matched without language stemming and without regard to accents.
constrains:
- domain/knowledge-base/knowledge-node
---

## Description

None.

=== rules/knowledge-base/alias-not-blank
---
type: invariant
statement: A node alias MUST NOT be empty once surrounding whitespace is trimmed.
constrains:
- domain/knowledge-base/node-alias
---

## Description

None.

=== rules/knowledge-base/alias-not-blank.log
---
entries:
- field: statement
  unstated: The material refuses a blank alias while a new node holds its proposed name as its canonical alias and the name checks bound only its length; the two decide differently for a node proposal whose name is only whitespace.
  decided: 'The alias rule stands: a node proposal whose name or alias is blank once trimmed records no node or alias.'
  why: The store refuses a blank alias whatever the proposal passed, so no reading in which one is recorded can hold.
---

=== rules/knowledge-base/alias-unique-per-node
---
type: invariant
statement: A knowledge node holds at most one alias of one normalized form.
constrains:
- domain/knowledge-base/knowledge-node
- domain/knowledge-base/node-alias
---

## Description

None.

=== rules/knowledge-base/alias-unique-per-node.log
---
entries:
- field: statement
  unstated: The material keeps one alias per normalized form on a node while a node proposal adds each of its proposed aliases; the two decide differently for a proposed alias that differs from one the node holds only in case, accents or spacing.
  decided: 'The uniqueness stands: a proposed name or alias whose normalized form the node already holds is held once.'
  why: Two aliases with one normalized form find the node under the same searches, so the second adds nothing a reader can use.
- field: statement
  unstated: The material's normalization trims only spaces before collapsing whitespace, so a leading or trailing tab or line break survives as a space, while entity resolution trims every surrounding whitespace; the two give different normalized forms for such a name.
  decided: The normalized form is the one name-normalization states, with every surrounding whitespace trimmed.
  why: A name that differs only by surrounding whitespace names the same entity, so the stricter trim is the one the domain means.
---

=== rules/knowledge-base/allowed-document-types
---
type: invariant
statement: The allowed values of doc_type of Document, in sort order from 1, are «proposta» labelled «Proposta», «ata» labelled «Ata», «contrato» labelled «Contrato», «relatório» labelled «Relatório» and «outro» labelled «Outro».
constrains:
- domain/knowledge-base/attribute-key
- domain/knowledge-base/allowed-value
---

## Description

None.

=== rules/knowledge-base/allowed-event-types
---
type: invariant
statement: The allowed values of event_type of Event, in sort order from 1, are «reunião» labelled «Reunião», «go-live» labelled «Go-live», «workshop» labelled «Workshop», «outro» labelled «Outro», «cobrança» labelled «Cobrança/Follow-up», «decisão» labelled «Decisão», «escalonamento» labelled «Escalonamento», «bloqueio» labelled «Bloqueio/Impedimento» and «marco» labelled «Marco/Entrega».
constrains:
- domain/knowledge-base/attribute-key
- domain/knowledge-base/allowed-value
---

## Description

None.

=== rules/knowledge-base/allowed-project-statuses
---
type: invariant
statement: The allowed values of status_text of Project, in sort order from 1, are «planejado» labelled «Planejado», «em aprovação» labelled «Em aprovação», «aprovado» labelled «Aprovado», «em andamento» labelled «Em andamento», «pausado» labelled «Pausado», «concluído» labelled «Concluído», «cancelado» labelled «Cancelado» and «outro» labelled «Outro».
constrains:
- domain/knowledge-base/attribute-key
- domain/knowledge-base/allowed-value
---

## Description

None.

=== rules/knowledge-base/allowed-task-priorities
---
type: invariant
statement: The allowed values of priority of Task, in sort order from 1, are «baixa» labelled «Baixa», «média» labelled «Média», «alta» labelled «Alta» and «crítica» labelled «Crítica».
constrains:
- domain/knowledge-base/attribute-key
- domain/knowledge-base/allowed-value
---

## Description

None.

=== rules/knowledge-base/allowed-task-statuses
---
type: invariant
statement: The allowed values of status of Task, in sort order from 1, are «a fazer» labelled «A fazer», «em andamento» labelled «Em andamento», «bloqueada» labelled «Bloqueada», «em revisão» labelled «Em revisão», «concluída» labelled «Concluída», «cancelada» labelled «Cancelada» and «outro» labelled «Outro».
constrains:
- domain/knowledge-base/attribute-key
- domain/knowledge-base/allowed-value
---

## Description

None.

=== rules/knowledge-base/allowed-value-unique-per-key
---
type: invariant
statement: No two allowed values of one attribute key hold the same value.
constrains:
- domain/knowledge-base/attribute-key
- domain/knowledge-base/allowed-value
---

## Description

None.

=== rules/knowledge-base/allowed-values-in-string-order
---
type: invariant
statement: An attribute-key listing gives a closed attribute key's allowed values in ascending string order.
constrains:
- domain/knowledge-base/attribute-key
- domain/knowledge-base/allowed-value
---

## Description

None.

=== rules/knowledge-base/ambiguous-candidates-need-review
---
type: policy
statement: A node proposal resolved by neither an exact alias nor a single strong candidate, with at least one active knowledge node of its node type at a similarity of 0.55 or more, creates a knowledge node in status needs-review and records an entity match review pairing it with each of the ten such nodes most similar to it and its similarity.
constrains:
- domain/knowledge-base/proposal
- domain/knowledge-base/knowledge-node
- domain/knowledge-base/entity-match-review
- domain/knowledge-base/node-resolution
- domain/knowledge-base/node-status
consistency: eventual
---

## Description

None.

=== rules/knowledge-base/ambiguous-candidates-need-review.log
---
entries:
- field: consistency
  unstated: The material does not say how this rule holds across the separate records it changes.
  decided: eventual
  why: The records it changes are separate aggregates, and no reader in the material depends on seeing them change together.
- field: statement
  unstated: How many candidates a review pairs with the new node
  decided: The ten most similar nodes at or above the floor
  why: The resolver fetches ten candidates by similarity before filtering by the floor, so no more are ever paired.
---

=== rules/knowledge-base/approximate-match-similarity
---
type: invariant
statement: The similarity a search item carries for a knowledge node the node layer matched approximately is the highest word similarity of that node's aliases to the query text, with no layer weight applied.
constrains:
- domain/knowledge-base/search-item
- domain/knowledge-base/node-match
---

## Description

This rule sets the value of a search item's similarity for an approximately matched knowledge node. It does not set the item's score, which approximate-match-strength and layer-weights govern. It does not set which items carry a similarity, which node-item-shows-match governs.

=== rules/knowledge-base/approximate-match-similarity.log
---
entries:
- field: statement
  unstated: No node and no part of the material says what value the similarity carried by an approximately matched knowledge node takes. The material says only that the approximate item also reports the similarity, so that the uncertainty of the match is explicit. No node says whether that value is the raw word similarity or the strength after the node layer weight.
  decided: The similarity is the highest word similarity of the node's aliases to the query text, with no layer weight applied.
  why: The field exists to show the reader how uncertain the match is. The raw word similarity is the measure the 0.6 admission threshold is compared against, so only the unweighted value can be read against that threshold. The node layer weight already reaches the item through its score.
---

=== rules/knowledge-base/approximate-match-strength
---
type: invariant
statement: An approximate node-layer match's strength is the highest word similarity of the knowledge node's aliases to the query text.
constrains:
- domain/knowledge-base/search-item
---

## Description

None.

=== rules/knowledge-base/approximate-match-strength.log
---
entries:
- field: statement
  unstated: The material does not say what score a knowledge node matched only approximately takes.
  decided: Its strength is the highest word similarity of its aliases to the query text, weighted by the node layer weight.
  why: The similarity is the measure the match was decided by, and the ranking already places approximate results after the others whatever their score.
---

=== rules/knowledge-base/assertion-review-check-order
---
type: invariant
statement: A confirmation or rejection is checked for an absent item and then for its item's status, and is refused at the first check it fails.
constrains:
- domain/knowledge-base/assertion-review
---

## Description

None.

=== rules/knowledge-base/assertion-review-records-curation-action
---
type: policy
statement: An accepted confirmation or rejection records one curation action of kind confirm-item or reject-item respectively on its assertion kind at its item's identity, with its reason as the reason and an empty payload.
constrains:
- domain/knowledge-base/assertion-review
- domain/knowledge-base/curation-action
- domain/knowledge-base/curation-action-kind
- domain/knowledge-base/curation-target-kind
- domain/knowledge-base/assertion-kind
---

## Description

None.

=== rules/knowledge-base/attribute-confidence-range
---
type: invariant
statement: A node attribute's confidence is between 0 and 1 inclusive.
constrains:
- domain/knowledge-base/node-attribute
---

## Description

None.

=== rules/knowledge-base/attribute-key-for-node-type
---
type: invariant
statement: An attribute proposal MUST name an attribute key the catalog holds for the node type of its knowledge node.
constrains:
- domain/knowledge-base/proposal
- domain/knowledge-base/attribute-key
---

## Description

None.

=== rules/knowledge-base/attribute-key-history
---
type: invariant
statement: An attribute-key history holds every node attribute of its knowledge node and attribute key, whatever its status.
constrains:
- domain/knowledge-base/node-attribute
- domain/knowledge-base/graph-read
---

## Description

None.

=== rules/knowledge-base/attribute-key-history-check-order
---
type: invariant
statement: An attribute-key history is checked for an existing knowledge node, then for one not deleted, then for an attribute key the catalog holds for that node's node type.
constrains:
- domain/knowledge-base/knowledge-node
- domain/knowledge-base/graph-read
---

## Description

None.

=== rules/knowledge-base/attribute-key-history-requires-registered-key
---
type: invariant
statement: An attribute-key history MUST name an attribute key the catalog holds for the node type of its knowledge node.
constrains:
- domain/knowledge-base/attribute-key
- domain/knowledge-base/graph-read
---

## Description

None.

=== rules/knowledge-base/attribute-key-listing-by-node-type
---
type: invariant
statement: An attribute-key listing that names a node type holds only that node type's attribute keys.
constrains:
- domain/knowledge-base/attribute-key
---

## Description

None.

=== rules/knowledge-base/attribute-key-listing-order
---
type: invariant
statement: The attribute-key listing orders attribute keys by node-type name and then by key.
constrains:
- domain/knowledge-base/attribute-key
---

## Description

None.

=== rules/knowledge-base/attribute-key-unique-per-node-type
---
type: invariant
statement: No two attribute keys of one node type hold the same key.
constrains:
- domain/knowledge-base/attribute-key
---

## Description

None.

=== rules/knowledge-base/attribute-never-supersedes-itself
---
type: invariant
statement: A node attribute never names itself as the one it supersedes.
constrains:
- domain/knowledge-base/node-attribute
---

## Description

None.

=== rules/knowledge-base/attribute-proposal-check-order
---
type: invariant
statement: An attribute proposal is checked for an existing knowledge node, then for an attribute key known for its node type, then for a value of the key's type and allowed values, then for cited fragments that exist and belong to its LLM run, then for its dates, then for its confidence, then for the anchoring of its fragments, and stops at the first check it fails.
constrains:
- domain/knowledge-base/proposal
---

## Description

None.

=== rules/knowledge-base/attribute-provenance-once-per-fragment
---
type: invariant
statement: A node attribute holds at most one provenance per information fragment.
constrains:
- domain/knowledge-base/node-attribute
- domain/knowledge-base/provenance
---

## Description

None.

=== rules/knowledge-base/attribute-provenance-once-per-fragment.log
---
entries:
- field: statement
  unstated: The material keeps one provenance per fragment on a node attribute while a re-affirmation adds a provenance for each fragment it cites; the two decide differently for a re-affirmation citing a fragment the node attribute already holds.
  decided: 'The uniqueness stands: a re-affirmation citing a fragment the assertion already holds adds no second provenance for it.'
  why: A second provenance to the same fragment traces the assertion to no source it was not already traced to.
---

=== rules/knowledge-base/attribute-start-has-basis
---
type: invariant
statement: A node attribute that holds a validity start holds the basis of that start.
constrains:
- domain/knowledge-base/node-attribute
- domain/knowledge-base/valid-from-basis
---

## Description

None.

=== rules/knowledge-base/attribute-validity-ordered
---
type: invariant
statement: A node attribute that holds both a validity start and a validity end holds the start strictly before the end.
constrains:
- domain/knowledge-base/node-attribute
---

## Description

None.

=== rules/knowledge-base/attribute-value-in-allowed-values
---
type: invariant
statement: An attribute proposal or an attribute correction for a key that has allowed values MUST carry one of them exactly as written.
constrains:
- domain/knowledge-base/proposal
- domain/knowledge-base/attribute-key
- domain/knowledge-base/corrected-values
---

## Description

None.

=== rules/knowledge-base/attribute-value-parses
---
type: invariant
statement: 'An attribute proposal''s value and an attribute correction''s value MUST read as its key''s value type: a real calendar date written as year-month-day for date, digits with an optional leading minus and an optional decimal part for number, exactly true or false for bool, and any text for text.'
expression: 'date: ^\d{4}-\d{2}-\d{2}$ naming an existing day; number: ^-?\d+(\.\d+)?$ and finite; bool: ^(true|false)$; text: any'
constrains:
- domain/knowledge-base/proposal
- domain/knowledge-base/attribute-key
- domain/knowledge-base/value-type
- domain/knowledge-base/corrected-values
---

## Description

None.

=== rules/knowledge-base/attribute-value-parses.log
---
entries:
- field: statement
  unstated: The material leaves to the runtime's date parser whether a well-formed but impossible date such as 2024-02-30 is refused.
  decided: Only a real calendar date is a date value.
  why: A date attribute names a day, and no such day exists.
---

=== rules/knowledge-base/audit-filter-checks-order
---
type: invariant
statement: A compliance deletion or an audit listing whose request fails several checks of form is refused for an unordered time window first, then for a missing field, then for a reason out of range, then for any other malformed field.
constrains:
- domain/knowledge-base/compliance-deletion
- domain/knowledge-base/compliance-deletion-filter
- domain/knowledge-base/curation-action-filter
---

## Description

An audit listing is a listing of compliance deletions or of curation actions.

=== rules/knowledge-base/audit-filters-match-exactly
---
type: invariant
statement: A compliance-deletion or curation-action listing holds only records equal to each raw information, action kind, target kind and target identity its filter names.
constrains:
- domain/knowledge-base/compliance-deletion-filter
- domain/knowledge-base/curation-action-filter
---

## Description

None.

=== rules/knowledge-base/audit-listing-accepts-open-window
---
type: invariant
statement: A listing of compliance deletions that gives only the start of its execution window, or only the end, is accepted with the other bound open.
constrains:
- domain/knowledge-base/compliance-deletion-filter
---

## Description

None.

=== rules/knowledge-base/audit-listing-order
---
type: invariant
statement: A compliance-deletion or curation-action listing orders its records newest first by their recorded time.
constrains:
- domain/knowledge-base/compliance-deletion-filter
- domain/knowledge-base/curation-action-filter
---

## Description

None.

=== rules/knowledge-base/audit-listing-total-before-pagination
---
type: invariant
statement: A compliance-deletion or curation-action listing's total counts every matching record before the page is cut.
constrains:
- domain/knowledge-base/compliance-deletion-filter
- domain/knowledge-base/curation-action-filter
- domain/knowledge-base/page
---

## Description

None.

=== rules/knowledge-base/audit-listing-window-half-open
---
type: invariant
statement: A compliance-deletion or curation-action listing holds only records whose recorded time is at or after its window's start and strictly before its window's end.
constrains:
- domain/knowledge-base/compliance-deletion-filter
- domain/knowledge-base/curation-action-filter
---

## Description

A compliance deletion's recorded time is its execution time, and a curation action's is its creation time.

=== rules/knowledge-base/audit-page-defaults
---
type: invariant
statement: A compliance-deletion or curation-action listing page that omits its limit holds 50 records and one that omits its offset starts at 0.
constrains:
- domain/knowledge-base/compliance-deletion-filter
- domain/knowledge-base/curation-action-filter
- domain/knowledge-base/page
---

## Description

None.

=== rules/knowledge-base/audit-window-ordered
---
type: invariant
statement: A compliance-deletion or curation-action filter that states both bounds of its time window MUST state the start strictly before the end.
constrains:
- domain/knowledge-base/compliance-deletion-filter
- domain/knowledge-base/curation-action-filter
---

## Description

None.

=== rules/knowledge-base/below-confidence-floor-records-nothing
---
type: invariant
statement: A link or attribute proposal whose confidence is below 0.40 records no knowledge link or node attribute.
constrains:
- domain/knowledge-base/proposal
---

## Description

None.

=== rules/knowledge-base/caller-never-states-received
---
type: invariant
statement: A proposal MUST NOT state the basis received.
constrains:
- domain/knowledge-base/proposal
- domain/knowledge-base/valid-from-basis
---

## Description

None.

=== rules/knowledge-base/caller-never-states-received.log
---
entries:
- field: statement
  unstated: Whether an extraction may state the basis received
  decided: An extraction under prompt version v4 may, for a relative date resolved against reception
  why: The v4 prompt tells the model to state received for that case and the owner holds that the prompt is the truth.
- field: statement
  unstated: Whether an extraction may state the basis received
  decided: No proposal may, extraction included; the earlier exception is withdrawn
  why: The proposal schema refuses received, so the v4 prompt asking for it is a text defect and the rule stands.
---

=== rules/knowledge-base/candidate-similarity
---
type: invariant
statement: A knowledge node's similarity to a node proposal is the highest trigram similarity between the proposal's name and any of the node's aliases.
constrains:
- domain/knowledge-base/knowledge-node
- domain/knowledge-base/node-alias
---

## Description

None.

=== rules/knowledge-base/catalog-attribute-keys
---
type: invariant
statement: 'The catalog holds exactly nineteen attribute keys, each with its value type: for Project deadline (date), start_date (date), status_text (text) and budget (number); for Event event_date (date), end_date (date) and event_type (text); for Person email (text), phone (text) and birth_date (date); for Organization cnpj (text) and website (text); for Location city (text) and address (text); for Concept definition (text); for Document doc_type (text); and for Task status (text), priority (text) and due_date (date).'
constrains:
- domain/knowledge-base/attribute-key
- domain/knowledge-base/value-type
---

## Description

None.

=== rules/knowledge-base/catalog-link-type-rules
---
type: invariant
statement: 'The catalog permits, each with no validity window, exactly these pairs of source and target node types: participates_in from Person to Project or Event; member_of from Person to Organization; holds_role from Person to Role; responsible_for from Person to Project, Event or Task; reports_to from Person to Person; part_of from Organization to Organization, from Project to Project, from Event to Project and from Task to Project; located_in from Organization or Event to Location; organizes from Organization or Person to Event; belongs_to_category from Person, Organization, Project, Event, Concept or Location to Category; related_to from Concept or Project to Concept; concerns from Document to Project, Event or Organization and from Event to Project; delivered_to from Document to Person; and sponsors from Organization to Project.'
constrains:
- domain/knowledge-base/link-type
- domain/knowledge-base/link-type-rule
---

## Description

None.

=== rules/knowledge-base/catalog-link-types
---
type: invariant
statement: 'The catalog holds exactly thirteen link types, each with its label and its inverse: participates_in «participa de» (has_participant), member_of «é membro de» (has_member), holds_role «exerce o cargo de» (role_held_by), responsible_for «é responsável por» (under_responsibility_of), reports_to «reporta a» (manages), part_of «faz parte de» (has_part), located_in «localizado em» (location_of), organizes «organiza» (organized_by), belongs_to_category «pertence à categoria» (contains), related_to «relacionado a» (related_to), concerns «trata de» (addressed_by), delivered_to «entregue a» (recipient_of) and sponsors «patrocina» (sponsored_by).'
constrains:
- domain/knowledge-base/link-type
---

## Description

None.

=== rules/knowledge-base/catalog-node-types
---
type: invariant
statement: 'The catalog holds exactly ten node types, described as follows: Person «Pessoa física», Organization «Empresa, órgão, time formal», Project «Projeto/iniciativa com objetivo e ciclo de vida», Event «Acontecimento pontual (reunião, go-live, workshop)», Role «Cargo/função (vocabulário controlado)», Category «Rótulo taxonômico para classificação», Concept «Conceito/tema referenciável», Location «Lugar físico ou lógico», Document «Artefato referenciado no conteúdo (proposta, ata, contrato, relatório); não é a fonte ingerida» and Task «Tarefa/atividade com responsável, prazo e ciclo de vida».'
constrains:
- domain/knowledge-base/node-type
---

## Description

None.

=== rules/knowledge-base/chunk-excerpt-is-verbatim
---
type: invariant
statement: A raw chunk's text is exactly the content between its offset_start and its offset_end.
constrains:
- domain/knowledge-base/raw-chunk
---

## Description

None.

=== rules/knowledge-base/chunk-index-follows-content
---
type: invariant
statement: A raw information's chunks are indexed from 0 in the order they appear in its content.
constrains:
- domain/knowledge-base/raw-chunk
---

## Description

None.

=== rules/knowledge-base/chunk-layer-matches-current-chunks
---
type: policy
statement: The chunk layer matches only raw chunks that are not superseded.
constrains:
- domain/knowledge-base/search-layer
- domain/knowledge-base/raw-information
---

## Description

None.

=== rules/knowledge-base/chunk-listing-order
---
type: invariant
statement: A raw information's chunks are listed by index ascending.
constrains:
- domain/knowledge-base/raw-chunk
---

## Description

None.

=== rules/knowledge-base/chunk-match-cites-its-fragment
---
type: invariant
statement: A chunk-layer match that supports an information fragment the search matched is shown as that fragment's excerpt in the fragment's search item.
constrains:
- domain/knowledge-base/search-item
---

## Description

None.

=== rules/knowledge-base/chunk-match-never-surfaces
---
type: invariant
statement: A chunk-layer match never surfaces as a search item.
constrains:
- domain/knowledge-base/search-item
---

## Description

None.

=== rules/knowledge-base/chunk-offsets-count-code-points
---
type: invariant
statement: A raw chunk's offset_start and offset_end count Unicode code points, offset_start inclusive and offset_end exclusive.
constrains:
- domain/knowledge-base/raw-chunk
---

## Description

None.

=== rules/knowledge-base/chunk-offsets-ordered
---
type: invariant
statement: A raw chunk's offset_start is at least 0 and its offset_end is greater than its offset_start.
constrains:
- domain/knowledge-base/raw-chunk
---

## Description

None.

=== rules/knowledge-base/chunk-position-unique
---
type: invariant
statement: A raw information holds at most one raw chunk of one chunking version at one index.
constrains:
- domain/knowledge-base/raw-information
- domain/knowledge-base/raw-chunk
---

## Description

None.

=== rules/knowledge-base/chunker-lines-end-at-newline
---
type: invariant
statement: A chunker line ends at a newline character, and a blank line is a line with no characters, so a line holding only spaces or a carriage return is not blank.
constrains:
- domain/knowledge-base/raw-information
- domain/knowledge-base/source-type
---

## Description

None.

=== rules/knowledge-base/chunker-lines-end-at-newline.log
---
entries:
- field: statement
  unstated: No node says what a line and a blank line are for the chunker.
  decided: A line ends at a newline and a blank line has no characters.
  why: It decides where an email header ends, and a CRLF email never closes its header block.
---

=== rules/knowledge-base/chunking-deterministic
---
type: invariant
statement: The same content under the same source type is always divided into the same chunks.
constrains:
- domain/knowledge-base/raw-chunk
---

## Description

None.

=== rules/knowledge-base/chunking-version
---
type: invariant
statement: Every raw chunk records the version of the chunking that cut it, and that version is v1.
constrains:
- domain/knowledge-base/raw-chunk
---

## Description

None.

=== rules/knowledge-base/chunks-never-cross-blocks
---
type: invariant
statement: A raw information's content is first cut into blocks at the hard boundaries of its source type, and no raw chunk crosses the edge of a block.
constrains:
- domain/knowledge-base/raw-information
- domain/knowledge-base/raw-chunk
- domain/knowledge-base/source-type
---

## Description

None.

=== rules/knowledge-base/cited-fragments-anchored
---
type: invariant
statement: Every information fragment a link or attribute proposal cites MUST be drawn from a raw chunk of the raw information of the proposal's LLM run.
constrains:
- domain/knowledge-base/proposal
- domain/knowledge-base/information-fragment
---

## Description

None.

=== rules/knowledge-base/cited-fragments-exist
---
type: invariant
statement: Every information fragment a link or attribute proposal cites MUST exist.
constrains:
- domain/knowledge-base/proposal
- domain/knowledge-base/information-fragment
---

## Description

None.

=== rules/knowledge-base/cited-fragments-in-run
---
type: invariant
statement: Every information fragment a link or attribute proposal cites MUST belong to the proposal's LLM run.
constrains:
- domain/knowledge-base/proposal
- domain/knowledge-base/information-fragment
---

## Description

None.

=== rules/knowledge-base/closed-attribute-keys
---
type: invariant
statement: The catalog attribute keys that hold allowed values are exactly doc_type of Document, event_type of Event, status_text of Project, and status and priority of Task.
constrains:
- domain/knowledge-base/attribute-key
- domain/knowledge-base/allowed-value
---

## Description

None.

=== rules/knowledge-base/closing-stamps-finish-time
---
type: invariant
statement: Completing or failing an LLM run sets its finish time to the moment it closed.
constrains:
- domain/knowledge-base/llm-run
---

## Description

None.

=== rules/knowledge-base/compliance-deletion-check-order
---
type: invariant
statement: A compliance deletion is checked for a well-formed request, then for an existing raw information, then for one already deleted, before it changes anything.
constrains:
- domain/knowledge-base/compliance-deletion
---

## Description

None.

=== rules/knowledge-base/compliance-deletion-counts-what-it-marked
---
type: invariant
statement: A compliance deletion's affected counts are the numbers of raw chunks, information fragments, knowledge links and node attributes it marked deleted.
constrains:
- domain/knowledge-base/compliance-deletion
- domain/knowledge-base/affected-counts
---

## Description

None.

=== rules/knowledge-base/compliance-deletion-flags-metadata
---
type: policy
statement: A compliance deletion adds compliance_deleted set to true to its raw information's metadata and keeps every other metadata key.
constrains:
- domain/knowledge-base/compliance-deletion
- domain/knowledge-base/raw-information
consistency: eventual
---

## Description

None.

=== rules/knowledge-base/compliance-deletion-keeps-content-hash
---
type: policy
statement: A compliance deletion leaves its raw information's content hash unchanged.
constrains:
- domain/knowledge-base/compliance-deletion
- domain/knowledge-base/raw-information
consistency: eventual
---

## Description

None.

=== rules/knowledge-base/compliance-deletion-propagates
---
type: policy
statement: A compliance deletion marks deleted every information fragment, knowledge link and node attribute not already deleted that rests on its raw information and on no other raw information that is not deleted.
constrains:
- domain/knowledge-base/compliance-deletion
- domain/knowledge-base/information-fragment
- domain/knowledge-base/knowledge-link
- domain/knowledge-base/node-attribute
consistency: eventual
---

## Description

An information fragment rests on the raw information its source chunks belong to.
A knowledge link or a node attribute rests on the raw information its provenance fragments rest on.

=== rules/knowledge-base/compliance-deletion-propagates.log
---
entries:
- field: consistency
  unstated: The material does not say how this propagation holds across the separate records it changes.
  decided: eventual
  why: The records it changes are separate aggregates, and no reader in the material depends on seeing them change together.
- field: statement
  unstated: The standing node marks deleted every fragment of the raw information and every link and attribute whose only provenance is one of them, while the material spares any fragment, link or attribute that also rests on another raw information not deleted; the two decide differently for a fragment whose source chunks belong to two raw informations of which only one is deleted.
  decided: A compliance deletion marks deleted only the fragments, links and attributes that rest on no other raw information that is not deleted.
  why: Knowledge another source that is not deleted still attests is held by that source, so deleting one source does not take it away.
---

=== rules/knowledge-base/compliance-deletion-reason-length
---
type: invariant
statement: A compliance deletion's reason, trimmed of surrounding whitespace, MUST hold between 1 and 1000 characters.
constrains:
- domain/knowledge-base/compliance-deletion
---

## Description

None.

=== rules/knowledge-base/compliance-deletion-reason-trimmed
---
type: invariant
statement: A compliance deletion records its reason trimmed of surrounding whitespace.
constrains:
- domain/knowledge-base/compliance-deletion
---

## Description

None.

=== rules/knowledge-base/compliance-deletion-records-curation-action
---
type: policy
statement: A compliance deletion that deletes its raw information records one curation action of kind compliance-delete on target kind raw-information at that raw information's identity, with the deletion's reason as its reason and the reason and affected counts as its payload.
constrains:
- domain/knowledge-base/compliance-deletion
- domain/knowledge-base/curation-action
- domain/knowledge-base/curation-action-kind
- domain/knowledge-base/curation-target-kind
consistency: eventual
---

## Description

None.

=== rules/knowledge-base/compliance-deletion-redacts-content
---
type: policy
statement: A compliance deletion replaces its raw information's content, and its original input where it has one, with the literal [REDACTED].
constrains:
- domain/knowledge-base/compliance-deletion
- domain/knowledge-base/raw-information
consistency: eventual
---

## Description

None.

=== rules/knowledge-base/compliance-deletion-tombstones
---
type: policy
statement: A compliance deletion marks its raw information and each of its raw chunks not already superseded deleted and gives them, its information fragments and every knowledge link and node attribute it marks deleted the moment of the deletion as their supersession time.
constrains:
- domain/knowledge-base/compliance-deletion
- domain/knowledge-base/raw-information
- domain/knowledge-base/raw-chunk
- domain/knowledge-base/information-fragment
- domain/knowledge-base/knowledge-link
- domain/knowledge-base/node-attribute
consistency: eventual
---

## Description

None.

=== rules/knowledge-base/compliance-deletion-tombstones.log
---
entries:
- field: statement
  unstated: The material gives raw informations, raw chunks and information fragments a supersession time and shows a deleted assertion with no supersession time staying current and blocking an equal new one, without saying what sets these on a compliance deletion.
  decided: A compliance deletion marks its raw information and raw chunks deleted and stamps the moment of the deletion as the supersession time of them, their fragments and every assertion it marks deleted.
  why: A deleted item left without a supersession time keeps counting as current, which is what a deletion exists to end.
- field: statement
  unstated: The standing statement, decided by an earlier analysis, marked each raw chunk of the deleted raw information, while the delivered code marks only the chunks not already superseded; a proof of the counts rule exposed the case of a chunk already superseded before the deletion.
  decided: A compliance deletion marks deleted only the raw chunks not already superseded; a chunk already superseded keeps its status and its supersession time and is not counted.
  why: The owner decided on 2026-10-01 that the delivered behavior is the business's, since a superseded chunk is already no longer current.
---

=== rules/knowledge-base/compliance-refusal-takes-precedence
---
type: policy
statement: A provenance read whose chain reaches a compliance deletion is refused for that deletion ahead of any other refusal the read would meet, except the refusal of a fragment that is not accepted.
constrains:
- domain/knowledge-base/provenance
- domain/knowledge-base/compliance-deletion
---

## Description

None.

=== rules/knowledge-base/compliance-refusal-takes-precedence.log
---
entries:
- field: statement
  unstated: The standing node put the compliance refusal ahead of every other, while the documentation puts the refusal of a fragment that is not accepted ahead of it; the two decide differently for a fragment provenance read of a non-accepted fragment whose source was deleted for compliance.
  decided: The compliance refusal comes first except against the refusal of a fragment that is not accepted.
  why: The documentation states this precedence explicitly as the order of the three provenance refusals.
---

=== rules/knowledge-base/concurrent-proposals-resolve-in-turn
---
type: invariant
statement: Concurrent proposals of one node name under one node type are resolved one after another, each reading the aliases the earlier one left.
constrains:
- domain/knowledge-base/node-resolution
- domain/knowledge-base/proposal
---

## Description

None.

=== rules/knowledge-base/concurrent-proposals-resolve-in-turn.log
---
entries:
- field: statement
  unstated: The material states that resolution takes a lock per node type and normalized name before reading any alias and before the similarity lookup, and not what the lock is for in domain terms.
  decided: Concurrent proposals of one node name under one node type are resolved one after another, each reading the aliases the earlier one left.
  why: The lock is the means and the serialization is the observable condition a test can fail, and the domain states conditions, not mechanisms.
---

=== rules/knowledge-base/confirmation-activates
---
type: policy
statement: A confirmation makes its item active.
constrains:
- domain/knowledge-base/assertion-review
- domain/knowledge-base/assertion-status
- domain/knowledge-base/knowledge-link
- domain/knowledge-base/node-attribute
consistency: eventual
---

## Description

None.

=== rules/knowledge-base/confirmation-keeps-assertion-values
---
type: invariant
statement: Confirming an uncertain assertion changes only its status, keeping its confidence and its validity and supersession dates.
constrains:
- domain/knowledge-base/assertion-review
---

## Description

None.

=== rules/knowledge-base/confirmation-requires-uncertain
---
type: invariant
statement: A confirmation MUST name an uncertain item.
constrains:
- domain/knowledge-base/assertion-review
- domain/knowledge-base/assertion-status
---

## Description

None.

=== rules/knowledge-base/conflict-disputes
---
type: policy
statement: A proposal for a type that does not allow multiple current assertions that meets a current assertion as a dispute marks that assertion disputed and records a new assertion in status disputed that supersedes nothing.
constrains:
- domain/knowledge-base/proposal
- domain/knowledge-base/knowledge-link
- domain/knowledge-base/node-attribute
- domain/knowledge-base/assertion-status
consistency: eventual
---

## Description

None.

=== rules/knowledge-base/conflict-disputes.log
---
entries:
- field: consistency
  unstated: The material does not say how this rule holds across the separate records it changes.
  decided: eventual
  why: Each case of this rule concerns one knowledge link or one node attribute and never both, so no reader depends on the two changing together.
---

=== rules/knowledge-base/consolidation-precedence
---
type: policy
statement: A link or attribute proposal is taken as a re-affirmation, else as a correction, else as a succession, else as a dispute, else as a new assertion, by the first of these whose condition it meets.
constrains:
- domain/knowledge-base/proposal
- domain/knowledge-base/knowledge-link
- domain/knowledge-base/node-attribute
consistency: eventual
---

## Description

None.

=== rules/knowledge-base/consolidation-precedence.log
---
entries:
- field: consistency
  unstated: The material does not say how this rule holds across the separate records it changes.
  decided: eventual
  why: Each case of this rule concerns one knowledge link or one node attribute and never both, so no reader depends on the two changing together.
---

=== rules/knowledge-base/consolidation-race-decided-again
---
type: policy
statement: A link or attribute proposal whose recording meets a current assertion that a concurrent proposal committed first is decided again, once, against that assertion.
constrains:
- domain/knowledge-base/proposal
- domain/knowledge-base/knowledge-link
- domain/knowledge-base/node-attribute
consistency: eventual
---

## Description

None.

=== rules/knowledge-base/consolidation-race-decided-again.log
---
entries:
- field: consistency
  unstated: The material does not say how this rule holds across the separate records it concerns.
  decided: eventual
  why: Each case concerns one knowledge link or one node attribute and never both, so no reader depends on the two changing together.
---

=== rules/knowledge-base/consolidation-race-refuses-second-collision
---
type: policy
statement: A link or attribute proposal whose second decision again meets a current assertion that a concurrent proposal committed first is refused.
constrains:
- domain/knowledge-base/proposal
- domain/knowledge-base/knowledge-link
- domain/knowledge-base/node-attribute
consistency: eventual
---

## Description

None.

=== rules/knowledge-base/consolidation-race-refuses-second-collision.log
---
entries:
- field: consistency
  unstated: The material does not say how this rule holds across the separate records it concerns.
  decided: eventual
  why: Each case concerns one knowledge link or one node attribute and never both, so no reader depends on the two changing together.
---

=== rules/knowledge-base/consolidation-records-provenance
---
type: policy
statement: A taken link or attribute proposal records, on the assertion it lands on, one provenance for each information fragment it cites.
constrains:
- domain/knowledge-base/proposal
- domain/knowledge-base/knowledge-link
- domain/knowledge-base/node-attribute
- domain/knowledge-base/provenance
consistency: eventual
---

## Description

None.

=== rules/knowledge-base/consolidation-records-provenance.log
---
entries:
- field: consistency
  unstated: The material does not say how this rule holds across the separate records it changes.
  decided: eventual
  why: Each case of this rule concerns one knowledge link or one node attribute and never both, so no reader depends on the two changing together.
---

=== rules/knowledge-base/content-hash-is-sha256
---
type: invariant
statement: A raw information's content hash is the SHA-256 digest of its content encoded as UTF-8, written as 64 lowercase hexadecimal characters.
constrains:
- domain/knowledge-base/raw-information
---

## Description

None.

=== rules/knowledge-base/content-hash-unique
---
type: invariant
statement: No two raw informations hold the same content hash.
constrains:
- domain/knowledge-base/raw-information
---

## Description

None.

=== rules/knowledge-base/content-length
---
type: invariant
statement: A raw information's content MUST hold between 1 and 10,485,760 UTF-16 code units.
constrains:
- domain/knowledge-base/raw-information
---

## Description

None.

=== rules/knowledge-base/contentless-blocks-single-chunk
---
type: invariant
statement: Content that is not empty but whose blocks hold nothing is one raw chunk spanning the whole content.
constrains:
- domain/knowledge-base/raw-information
- domain/knowledge-base/raw-chunk
---

## Description

None.

=== rules/knowledge-base/corrected-item-provenance
---
type: policy
statement: A correction's new item holds every provenance of the superseded item and, where the correction cites one, the cited information fragment.
constrains:
- domain/knowledge-base/assertion-correction
- domain/knowledge-base/corrected-values
- domain/knowledge-base/provenance
- domain/knowledge-base/knowledge-link
- domain/knowledge-base/node-attribute
consistency: eventual
---

## Description

None.

=== rules/knowledge-base/corrected-item-values
---
type: policy
statement: A correction's new item carries each value the correction states, a null one counting as not stated, and the superseded item's value otherwise, with the superseded item's confidence and no run.
constrains:
- domain/knowledge-base/assertion-correction
- domain/knowledge-base/corrected-values
- domain/knowledge-base/knowledge-link
- domain/knowledge-base/node-attribute
consistency: eventual
---

## Description

None.

=== rules/knowledge-base/corrected-stated-start-cites-fragment
---
type: invariant
statement: A correction whose validity start has the basis stated MUST cite an information fragment.
constrains:
- domain/knowledge-base/assertion-correction
- domain/knowledge-base/corrected-values
- domain/knowledge-base/valid-from-basis
---

## Description

None.

=== rules/knowledge-base/correction-changes-something
---
type: invariant
statement: A correction MUST change at least one of the value, the target node, the validity start and the validity end.
constrains:
- domain/knowledge-base/assertion-correction
- domain/knowledge-base/corrected-values
---

## Description

None.

=== rules/knowledge-base/correction-check-order
---
type: invariant
statement: A correction is checked for an absent item, then for an item already deleted or superseded, then for a cited fragment absent or not accepted, then for a corrected attribute value that does not read as its key's value type or is outside its allowed values, and is refused at the first check it fails.
constrains:
- domain/knowledge-base/assertion-correction
---

## Description

None.

=== rules/knowledge-base/correction-fits-assertion-kind
---
type: invariant
statement: A correction MUST NOT change a link's value or an attribute's target node.
constrains:
- domain/knowledge-base/assertion-correction
- domain/knowledge-base/corrected-values
- domain/knowledge-base/assertion-kind
---

## Description

None.

=== rules/knowledge-base/correction-fragment-accepted
---
type: invariant
statement: A correction MUST cite only an accepted information fragment.
constrains:
- domain/knowledge-base/corrected-values
- domain/knowledge-base/information-fragment
---

## Description

None.

=== rules/knowledge-base/correction-records-curation-action
---
type: policy
statement: An accepted correction records one curation action of kind correct-item on its assertion kind at the corrected item's identity, with its reason as the reason and its corrected values and the new item's identity as the payload.
constrains:
- domain/knowledge-base/assertion-correction
- domain/knowledge-base/curation-action
- domain/knowledge-base/curation-action-kind
- domain/knowledge-base/curation-target-kind
- domain/knowledge-base/assertion-kind
---

## Description

None.

=== rules/knowledge-base/correction-replaces
---
type: policy
statement: A proposal with change hint correction that meets a current assertion supersedes it, leaving its validity end as it was, and records a new assertion that names it as the one it supersedes.
constrains:
- domain/knowledge-base/proposal
- domain/knowledge-base/knowledge-link
- domain/knowledge-base/node-attribute
- domain/knowledge-base/change-hint
- domain/knowledge-base/assertion-status
consistency: eventual
---

## Description

None.

=== rules/knowledge-base/correction-replaces.log
---
entries:
- field: consistency
  unstated: The material does not say how this rule holds across the separate records it changes.
  decided: eventual
  why: Each case of this rule concerns one knowledge link or one node attribute and never both, so no reader depends on the two changing together.
---

=== rules/knowledge-base/correction-requires-errata-evidence
---
type: invariant
statement: A proposal with change hint correction MUST cite at least one information fragment whose text contains, in any letter case, errata, errado, correção, corrigir, correction or correcao.
constrains:
- domain/knowledge-base/proposal
- domain/knowledge-base/change-hint
- domain/knowledge-base/information-fragment
---

## Description

None.

=== rules/knowledge-base/correction-supersedes-item
---
type: policy
statement: A correction supersedes its item, leaving its validity end as it was, and records a new active item of the same kind that names it as the one it supersedes.
constrains:
- domain/knowledge-base/assertion-correction
- domain/knowledge-base/knowledge-link
- domain/knowledge-base/node-attribute
- domain/knowledge-base/assertion-status
consistency: eventual
---

## Description

None.

=== rules/knowledge-base/curation-action-reason-length
---
type: invariant
statement: A curation action's reason MUST hold at most 1000 characters.
constrains:
- domain/knowledge-base/curation-action
---

## Description

None.

=== rules/knowledge-base/curation-action-time-is-recording-time
---
type: invariant
statement: A curation action's creation time is the moment it was recorded.
constrains:
- domain/knowledge-base/curation-action
---

## Description

None.

=== rules/knowledge-base/curation-reason-not-blank
---
type: invariant
statement: A reason a curation request states MUST hold at least one character after trimming.
constrains:
- domain/knowledge-base/entity-match-resolution
- domain/knowledge-base/node-merge
- domain/knowledge-base/dispute-resolution
- domain/knowledge-base/assertion-review
- domain/knowledge-base/assertion-correction
---

## Description

None.

=== rules/knowledge-base/curation-reason-required
---
type: invariant
statement: A node merge, a rejection, a correction, an entity-match resolution deciding merge-into and a dispute resolution deciding prefer-one MUST state a reason.
constrains:
- domain/knowledge-base/entity-match-resolution
- domain/knowledge-base/node-merge
- domain/knowledge-base/dispute-resolution
- domain/knowledge-base/assertion-review
- domain/knowledge-base/assertion-correction
---

## Description

None.

=== rules/knowledge-base/curation-refuses-deleted-node
---
type: invariant
statement: An entity-match resolution or a node merge MUST NOT name a deleted knowledge node.
constrains:
- domain/knowledge-base/entity-match-resolution
- domain/knowledge-base/node-merge
- domain/knowledge-base/knowledge-node
- domain/knowledge-base/node-status
---

## Description

None.

=== rules/knowledge-base/curation-request-check-order
---
type: invariant
statement: A curation request failing several request checks is refused for the first it fails among a merge-into without a target node, a missing reason, a node merged into itself, a prefer-one without a winner, an adjust-periods without one period per item, a validity start not before its end, a correction changing nothing and an unjustified corrected start, and is refused for a failing format only when none of these fails.
constrains:
- domain/knowledge-base/entity-match-resolution
- domain/knowledge-base/node-merge
- domain/knowledge-base/dispute-resolution
- domain/knowledge-base/assertion-review
- domain/knowledge-base/assertion-correction
---

## Description

None.

=== rules/knowledge-base/curation-request-checked-first
---
type: invariant
statement: A curation operation checks its request before it checks any knowledge node, link, attribute or information fragment the request names.
constrains:
- domain/knowledge-base/entity-match-resolution
- domain/knowledge-base/node-merge
- domain/knowledge-base/dispute-resolution
- domain/knowledge-base/assertion-review
- domain/knowledge-base/assertion-correction
---

## Description

None.

=== rules/knowledge-base/current-assertion
---
type: policy
statement: A knowledge link or node attribute is current while it has neither a validity end nor a supersession time.
constrains:
- domain/knowledge-base/knowledge-link
- domain/knowledge-base/node-attribute
consistency: eventual
---

## Description

None.

=== rules/knowledge-base/current-assertion.log
---
entries:
- field: consistency
  unstated: The material does not say how this rule holds across the separate records it changes.
  decided: eventual
  why: Each case of this rule concerns one knowledge link or one node attribute and never both, so no reader depends on the two changing together.
---

=== rules/knowledge-base/date-check-order
---
type: invariant
statement: A proposal's dates are checked for a start before the end, then for correction evidence, then for a basis to a stated start, then for an available required start, and the proposal is refused at the first check it fails.
constrains:
- domain/knowledge-base/proposal
---

## Description

None.

=== rules/knowledge-base/default-extraction-model
---
type: invariant
statement: A document ingestion that names no model runs under the configured ingestion model, or under claude-sonnet-4-6 where none is configured.
constrains:
- domain/knowledge-base/llm-run
---

## Description

None.

=== rules/knowledge-base/default-extraction-model.log
---
entries:
- field: statement
  unstated: The material does not say which model a document ingestion that names none runs under.
  decided: The configured ingestion model, and claude-sonnet-4-6 where none is configured.
  why: The owner holds the code as the truth, and the code applies that order when a document ingestion names no model.
---

=== rules/knowledge-base/default-prompt-version
---
type: invariant
statement: A document ingestion that names no prompt version runs under v5.
constrains:
- domain/knowledge-base/llm-run
- domain/knowledge-base/prompt-version
---

## Description

None.

=== rules/knowledge-base/deleted-node-read-refused
---
type: invariant
statement: A node read, an attribute-key history or a traversal is refused when its knowledge node is deleted.
constrains:
- domain/knowledge-base/knowledge-node
- domain/knowledge-base/node-status
- domain/knowledge-base/graph-read
---

## Description

None.

=== rules/knowledge-base/deleted-source-deletion-records-nothing
---
type: policy
statement: A compliance deletion requested for a raw information already deleted records nothing and ends in the outcome noop-already-deleted.
constrains:
- domain/knowledge-base/compliance-deletion
- domain/knowledge-base/raw-information
- domain/knowledge-base/compliance-deletion-outcome
consistency: eventual
---

## Description

None.

=== rules/knowledge-base/deletion-execution-time-is-recording-time
---
type: invariant
statement: A compliance deletion's execution time is the moment it was recorded.
constrains:
- domain/knowledge-base/compliance-deletion
---

## Description

None.

=== rules/knowledge-base/directed-attribute-value-as-text
---
type: invariant
statement: A directed attribute's number or boolean value is proposed as its text form, a boolean as true or false.
constrains:
- domain/knowledge-base/directed-item
- domain/knowledge-base/proposal
---

## Description

None.

=== rules/knowledge-base/directed-attribute-value-shape
---
type: invariant
statement: A directed attribute's value MUST be a text of 1 to 2000 characters, a finite number or a boolean.
constrains:
- domain/knowledge-base/directed-item
---

## Description

None.

=== rules/knowledge-base/directed-chat-pointer-whole
---
type: invariant
statement: A chat turn's conversation and message identities are recorded in a directed ingestion's raw information together or not at all.
constrains:
- domain/knowledge-base/directed-ingestion
- domain/knowledge-base/raw-information
---

## Description

None.

=== rules/knowledge-base/directed-defaults
---
type: invariant
statement: A directed attribute or link is proposed with the change hint its item states, none when it states none, and, when it states no basis, with basis stated.
constrains:
- domain/knowledge-base/directed-ingestion
- domain/knowledge-base/proposal
- domain/knowledge-base/change-hint
- domain/knowledge-base/valid-from-basis
---

## Description

None.

=== rules/knowledge-base/directed-defaults.log
---
entries:
- field: statement
  unstated: The material's directed service accepts a change hint and a validity end for attributes and links, while the directed tool's own schema declares neither, so they never arrive.
  decided: A directed attribute or link is proposed with change hint none.
  why: The directed tool is the only way a directed ingestion is made, and it carries no change hint.
- field: statement
  unstated: Whether a caller may state the change hint of a directed item
  decided: The item's own change hint applies, none when it states none
  why: The directed service accepts and proposes a stated hint; the owner holds that the code is the truth.
---

=== rules/knowledge-base/directed-dependency-failed
---
type: invariant
statement: A directed attribute or link whose node or evidence reference names nothing is not proposed and is reported dependency-failed, naming the first missing reference in the order node then evidence for an attribute and source, target then evidence for a link.
constrains:
- domain/knowledge-base/directed-item
- domain/knowledge-base/directed-item-status
---

## Description

None.

=== rules/knowledge-base/directed-dispatch-order
---
type: invariant
statement: A directed ingestion proposes its fragments, then its nodes, then its attributes, then its links, each group in the order given, and reports its items in that same order.
constrains:
- domain/knowledge-base/directed-ingestion
- domain/knowledge-base/directed-item
- domain/knowledge-base/directed-item-kind
---

## Description

None.

=== rules/knowledge-base/directed-fragments-anchor-first-chunk
---
type: invariant
statement: A directed ingestion anchors every fragment to the first raw chunk of its raw information.
constrains:
- domain/knowledge-base/directed-ingestion
- domain/knowledge-base/raw-chunk
---

## Description

None.

=== rules/knowledge-base/directed-full-confidence
---
type: invariant
statement: A directed ingestion proposes every fragment, attribute and link at confidence 1.0.
constrains:
- domain/knowledge-base/directed-ingestion
- domain/knowledge-base/proposal
---

## Description

None.

=== rules/knowledge-base/directed-ingestion-run
---
type: invariant
statement: A directed ingestion opens an LLM run of model directed and prompt version directed-v1 and calls no language model.
constrains:
- domain/knowledge-base/directed-ingestion
- domain/knowledge-base/llm-run
---

## Description

None.

=== rules/knowledge-base/directed-item-status
---
type: invariant
statement: A directed item's status is accepted for a recorded fragment, needs-review or accepted for a node according to its resolution, its outcome for a taken attribute or link, error for a refusal with a system error and rejected for any other refusal.
constrains:
- domain/knowledge-base/directed-item
- domain/knowledge-base/directed-item-status
- domain/knowledge-base/node-resolution
---

## Description

None.

=== rules/knowledge-base/directed-later-reference-wins
---
type: invariant
statement: When two directed items of one kind share a reference, the reference names the later one that was accepted, and a later item that is refused leaves it naming the earlier one.
constrains:
- domain/knowledge-base/directed-item
---

## Description

None.

=== rules/knowledge-base/directed-later-reference-wins.log
---
entries:
- field: statement
  unstated: What a reference names when the later item sharing it is refused
  decided: It keeps naming the earlier accepted item
  why: The service updates a reference only on acceptance, so a refused later item never displaces the earlier one.
---

=== rules/knowledge-base/directed-link-report-reference
---
type: invariant
statement: A directed link item's report entry carries as its reference the link's source reference, its link type and its target reference, joined by "->".
constrains:
- domain/knowledge-base/directed-item
---

## Description

None.

=== rules/knowledge-base/directed-link-report-reference.log
---
entries:
- field: statement
  unstated: The report entry's reference is held only as a string.
  decided: A link entry's reference is source reference, link type and target reference joined by "->".
  why: The chat graph delta parses this form, so a change to it would silently drop links.
---

=== rules/knowledge-base/directed-pinned-node
---
type: invariant
statement: A directed node that names an existing identity resolves to that knowledge node without entity resolution, whatever node type, name or aliases it states, provided the node exists and is active.
constrains:
- domain/knowledge-base/directed-item
- domain/knowledge-base/knowledge-node
- domain/knowledge-base/node-status
---

## Description

None.

=== rules/knowledge-base/directed-reference-length
---
type: invariant
statement: A directed item's reference MUST hold between 1 and 120 characters.
constrains:
- domain/knowledge-base/directed-item
---

## Description

None.

=== rules/knowledge-base/directed-requires-fragment-and-node
---
type: invariant
statement: A directed ingestion MUST carry at least one fragment and one node.
constrains:
- domain/knowledge-base/directed-ingestion
---

## Description

None.

=== rules/knowledge-base/directed-run-completes
---
type: invariant
statement: A directed ingestion completes its LLM run whatever its items' statuses.
constrains:
- domain/knowledge-base/directed-ingestion
- domain/knowledge-base/llm-run
---

## Description

None.

=== rules/knowledge-base/directed-source-content
---
type: invariant
statement: A directed ingestion records a chat raw information whose content lists each fragment as its reference and text, then its label when it has one, then the moment of ingestion and a nonce of its own.
constrains:
- domain/knowledge-base/directed-ingestion
- domain/knowledge-base/raw-information
- domain/knowledge-base/source-type
---

## Description

None.

=== rules/knowledge-base/directed-source-label-length
---
type: invariant
statement: A directed ingestion's label MUST hold between 1 and 200 characters.
constrains:
- domain/knowledge-base/directed-ingestion
---

## Description

None.

=== rules/knowledge-base/directed-source-metadata
---
type: invariant
statement: A directed ingestion records, in its raw information's metadata, that it is directed, its label when it has one and, when it is made from a chat turn, the turn's conversation and message identities.
constrains:
- domain/knowledge-base/directed-ingestion
- domain/knowledge-base/raw-information
---

## Description

None.

=== rules/knowledge-base/directed-turn-is-original-input
---
type: invariant
statement: A directed ingestion made from a chat turn records the turn's excerpt as its raw information's original input.
constrains:
- domain/knowledge-base/directed-ingestion
- domain/knowledge-base/raw-information
---

## Description

None.

=== rules/knowledge-base/directed-validity-start-shape
---
type: invariant
statement: A directed attribute's or link's validity start MUST be written as four digits, two digits and two digits, separated by hyphens.
constrains:
- domain/knowledge-base/directed-item
---

## Description

None.

=== rules/knowledge-base/directed-validity-start-shape.log
---
entries:
- field: statement
  unstated: The service accepts a validity end on a directed attribute or link, while the directed tool's schema declares only a validity start.
  decided: Only the validity start is stated, because the tool strips any other field before the service reads it.
  why: The tool is the only entry of a directed ingestion, so a validity end never arrives.
---

=== rules/knowledge-base/dispute-entry-time
---
type: invariant
statement: A disputed queue entry's creation time is the earliest recording time among its items.
constrains:
- domain/knowledge-base/dispute-scope
---

## Description

None.

=== rules/knowledge-base/dispute-entry-time.log
---
entries:
- field: statement
  unstated: The material dates a disputed queue entry by the first of its items met within the fetched page, which depends on where the page cut falls.
  decided: The earliest recording time among its items.
  why: The items are met in recording order, so the earliest is what the material yields whenever the whole entry is on the page.
---

=== rules/knowledge-base/dispute-queue-entry
---
type: invariant
statement: The disputed queue holds one entry per dispute scope holding disputed items, listing each of those items as a side.
constrains:
- domain/knowledge-base/dispute-scope
- domain/knowledge-base/assertion-status
---

## Description

None.

=== rules/knowledge-base/dispute-resolution-check-order
---
type: invariant
statement: A dispute resolution is checked for an absent item, then for an item not disputed, then for items outside one dispute scope, then for its decision's own checks, and is refused at the first check it fails.
constrains:
- domain/knowledge-base/dispute-resolution
---

## Description

None.

=== rules/knowledge-base/dispute-resolution-distinct-items
---
type: invariant
statement: A dispute resolution MUST name at least two items and none twice.
constrains:
- domain/knowledge-base/dispute-resolution
---

## Description

None.

=== rules/knowledge-base/dispute-resolution-records-curation-action
---
type: policy
statement: An accepted dispute resolution records one curation action of kind resolve-dispute on its assertion kind, at its winner's identity for prefer-one and at its first item's identity otherwise, with its reason as the reason and its decision, its items and its winner or periods as the payload.
constrains:
- domain/knowledge-base/dispute-resolution
- domain/knowledge-base/curation-action
- domain/knowledge-base/curation-action-kind
- domain/knowledge-base/curation-target-kind
- domain/knowledge-base/assertion-kind
---

## Description

None.

=== rules/knowledge-base/dispute-resolution-requires-disputed-items
---
type: invariant
statement: A dispute resolution MUST name only disputed items.
constrains:
- domain/knowledge-base/dispute-resolution
- domain/knowledge-base/assertion-status
---

## Description

None.

=== rules/knowledge-base/dispute-resolution-single-scope
---
type: invariant
statement: A dispute resolution MUST name items of one dispute scope, and knowledge links it names MUST also share one target node.
constrains:
- domain/knowledge-base/dispute-resolution
- domain/knowledge-base/dispute-scope
---

## Description

None.

=== rules/knowledge-base/dispute-resolution-single-scope.log
---
entries:
- field: statement
  unstated: Whether links of a non-multiple type may name different targets in one resolution
  decided: They must share one target, as the reviewed dispute service enforces
  why: The service refuses links with different targets even for a functional type, and the owner holds that the code is the truth.
---

=== rules/knowledge-base/dispute-scope
---
type: policy
statement: Disputed items share a dispute scope when they are node attributes of one knowledge node and one attribute key, knowledge links from one source node of one link type that does not allow multiple current links, or knowledge links from one source node of one link type to one target node.
constrains:
- domain/knowledge-base/dispute-scope
- domain/knowledge-base/knowledge-link
- domain/knowledge-base/node-attribute
consistency: eventual
---

## Description

None.

=== rules/knowledge-base/dispute-scope.log
---
entries:
- field: statement
  unstated: The material's review queue groups disputed links of a link type that allows a single current link by source node and link type, while its dispute resolution requires the same target node; the two decide differently for two disputed reports_to links from one node to different targets.
  decided: Links of a link type that does not allow multiple current links share a dispute scope by source node and link type, whatever their targets.
  why: A dispute on such a link type arises precisely between links to different targets, so requiring one target leaves every such dispute unresolvable.
---

=== rules/knowledge-base/document-context-entity-type-in-catalog
---
type: invariant
statement: A preliminary reading that lists an entity under a node type the catalog does not hold yields a document context without that entity.
constrains:
- domain/knowledge-base/document-context
---

## Description

This rule covers which entities from a preliminary reading's entity list the extraction keeps in the document context. It does not decide which document context status the run records. rules/knowledge-base/document-context-status-recorded decides that.

=== rules/knowledge-base/document-context-entity-type-in-catalog.log
---
entries:
- field: statement
  unstated: The material says the document context lists each entity with its node type and the names the document uses for it. domain/knowledge-base/document-entity references a node type of the catalog. No node and no intake material says what an extraction records when the preliminary reading lists an entity under a node type the catalog does not hold. The entity could be dropped or kept, or the reading could count as failed.
  decided: A preliminary reading that lists an entity under a node type the catalog does not hold yields a document context without that entity. The reading still counts as having produced a document context.
  why: A document entity references a node type the catalog holds, so it cannot be kept under a type the catalog lacks. That leaves dropping the entity or failing the reading. The overlong-summary case was already decided by cutting the summary and keeping the reading (rules/knowledge-base/document-context-summary-cut-to-five-lines). That decision rested on two points that hold here too. The material calls the document context only a reading aid. Failing the whole reading would also discard the valid summary and the other entities over a defect in one entry. Dropping the entity keeps what each chunk reading is shown equal to what is recorded for audit. It also never offers the model a node type that rules/knowledge-base/node-type-in-catalog would refuse in a proposal.
---

=== rules/knowledge-base/document-context-model
---
type: invariant
statement: A document context is produced under the configured context model, or under claude-haiku-4-5 where none is configured.
constrains:
- domain/knowledge-base/document-context
---

## Description

None.

=== rules/knowledge-base/document-context-read-first
---
type: invariant
statement: Under prompt version v5 and later, an extraction whose raw information holds more than one chunk and a content of at most 100000 UTF-16 code units reads that whole content once, before its first chunk, to produce the run's document context when the run holds none.
constrains:
- domain/knowledge-base/llm-run
- domain/knowledge-base/document-context
---

## Description

None.

=== rules/knowledge-base/document-context-read-first.log
---
entries:
- field: statement
  unstated: The unit the 100000 limit on a raw information's content is counted in, which decides whether the preliminary reading is made. The statement and the material ("mais de 100.000 caracteres") both say only "characters", and these differ from Unicode code points when the content has characters outside the Basic Multilingual Plane.
  decided: The 100000 limit counts the raw information's content in UTF-16 code units, the same unit in both rules/knowledge-base/document-context-read-first and rules/knowledge-base/document-context-status-recorded.
  why: The limit measures the same field that rules/knowledge-base/content-length already bounds in UTF-16 code units. Using that unit means a raw information's content has one length everywhere it is checked. Unicode code points are the unit for chunk offsets and chunk sizes, which measure positions inside chunks, not the whole content. No log entry decided this unit before.
---

=== rules/knowledge-base/document-context-status-kept-on-reuse
---
type: invariant
statement: Under prompt version v5 and later, an extraction that makes no preliminary reading because its run already holds a document context leaves the run's document context status as it was.
constrains:
- domain/knowledge-base/llm-run
- domain/knowledge-base/document-context-status
---

## Description

Governs the document context status of a run whose extraction reuses the document context the run already holds.
It does not decide the status an extraction records when it makes a preliminary reading or cannot make one; rules/knowledge-base/document-context-status-recorded decides that.

=== rules/knowledge-base/document-context-status-kept-on-reuse.log
---
entries:
- field: statement
  unstated: No node said what an extraction does to the run's document context status when it skips the preliminary reading because the run already holds a document context, as happens when a run is retried.
  decided: The extraction leaves the run's document context status as it was.
  why: The status says whether the run's document context was produced. When the context is reused, the run still holds the same context, which an earlier attempt produced and recorded. No new preliminary reading happens that could produce a different outcome. The intake says a retry reuses the recorded context, and keeping the status keeps the audit record matching the context the model was shown.
---

=== rules/knowledge-base/document-context-status-recorded
---
type: invariant
statement: Under prompt version v5 and later, an extraction records its run's document context status as single-chunk when the raw information holds one chunk whatever its length, too-long when it holds more than one chunk and its content exceeds 100000 UTF-16 code units, failed when the preliminary reading fails and produced when it yields a document context.
constrains:
- domain/knowledge-base/llm-run
- domain/knowledge-base/document-context-status
---

## Description

None.

=== rules/knowledge-base/document-context-status-recorded.log
---
entries:
- field: statement
  unstated: Which document context status a run records when its raw information holds one chunk and its content also exceeds 100000 characters. The statement lists single-chunk and too-long as separate conditions and does not say which one wins when both hold.
  decided: single-chunk applies to a one-chunk raw information of any length, and too-long applies only to a raw information of more than one chunk whose content exceeds 100000 characters.
  why: Under rules/knowledge-base/document-context-read-first, a one-chunk raw information never gets a preliminary reading, whatever its length, and the material says a one-chunk document has no preliminary reading. So the reason no context exists is the single chunk. The 100000-character limit only stops a reading that would otherwise happen, which is true only when there is more than one chunk.
---

=== rules/knowledge-base/document-context-summary-cut-to-five-lines
---
type: invariant
statement: A preliminary reading whose summary runs past 5 lines yields a document context whose summary is that summary's first 5 lines.
constrains:
- domain/knowledge-base/document-context
---

## Description

This rule covers what the extraction keeps of a preliminary reading's summary when the summary is longer than the limit that rules/knowledge-base/document-context-summary-lines sets. It does not decide which document context status the run records. rules/knowledge-base/document-context-status-recorded decides that.

=== rules/knowledge-base/document-context-summary-cut-to-five-lines.log
---
entries:
- field: statement
  unstated: The material gives the document context a summary of up to 5 lines, and rules/knowledge-base/document-context-summary-lines holds that limit. Neither says what an extraction records when the preliminary reading returns a longer summary. It could cut the summary or treat the reading as failed.
  decided: A preliminary reading whose summary runs past 5 lines yields a document context whose summary is that summary's first 5 lines. The reading still counts as having produced a document context.
  why: The material calls the document context only a reading aid and lets an extraction go on without it. Treating an overlong summary as a failed reading would throw away the reading's entity list, which is valid, over a defect in the summary alone. Cutting keeps the summary within the 5-line limit. The recorded context is also exactly what each chunk reading is shown, so the audit purpose of recording it still holds.
---

=== rules/knowledge-base/document-context-summary-lines
---
type: invariant
statement: A document context's summary holds at most 5 lines, where a line ends at a newline character or at the summary's end, a carriage return ends no line, an empty line counts as a line, and a newline that ends the summary starts no further line.
constrains:
- domain/knowledge-base/document-context
---

## Description

None.

=== rules/knowledge-base/document-context-summary-lines.log
---
entries:
- field: statement
  unstated: The material gives the document context a summary of up to 5 lines, and no node says what one line of that summary is. No node says which line-break sequences end a line, whether empty lines count, or whether a trailing line break starts a new line, and the same answer governs both counting against the limit and keeping the first 5 lines.
  decided: A line ends at a newline character or at the summary's end. A carriage return ends no line. An empty line counts as a line. A newline that ends the summary starts no further line.
  why: The specification already defines a line as ending at a newline character in rules/knowledge-base/chunker-lines-end-at-newline, so the same document text has one notion of line. Empty lines count because the summary is shown to the model as written, so every line it shows is a line of the summary. A trailing newline starts no line because otherwise a summary ending in a newline would count one line more than it shows.
---

=== rules/knowledge-base/document-ingestion-extracts-new-content
---
type: policy
statement: Ingesting a document records it and extracts it through its new LLM run, and extracts nothing when its content is already held.
constrains:
- domain/knowledge-base/raw-information
- domain/knowledge-base/llm-run
consistency: eventual
---

## Description

None.

=== rules/knowledge-base/document-ingestion-extracts-new-content.log
---
entries:
- field: consistency
  unstated: The material does not say how this rule holds across the separate records it changes.
  decided: eventual
  why: The records it changes are separate aggregates, and no reader in the material depends on seeing them change together.
---

=== rules/knowledge-base/document-ingestion-records-no-storage-reference
---
type: invariant
statement: A document ingestion records its raw information with no storage reference and with the caller's metadata, or empty metadata where the caller gives none.
constrains:
- domain/knowledge-base/raw-information
---

## Description

None.

=== rules/knowledge-base/document-ingestion-records-no-storage-reference.log
---
entries:
- field: statement
  unstated: Neither the ingest-document answer nor a rule says what storage reference and metadata a document ingestion records.
  decided: A document ingestion records no storage reference and the caller's metadata or none.
  why: The owner decided the source's behavior is the truth, and the judge read it in the code.
---

=== rules/knowledge-base/effective-status
---
type: policy
statement: A knowledge link's or node attribute's effective status is inactive when its status is active and its validity ends on or before today, and is its status otherwise.
constrains:
- domain/knowledge-base/knowledge-link
- domain/knowledge-base/node-attribute
- domain/knowledge-base/effective-status
- domain/knowledge-base/assertion-status
consistency: eventual
---

## Description

None.

=== rules/knowledge-base/email-header-block
---
type: invariant
statement: An email's header block ends at its first blank line, whose line break belongs to no block.
constrains:
- domain/knowledge-base/raw-information
- domain/knowledge-base/source-type
---

## Description

None.

=== rules/knowledge-base/email-quote-blocks
---
type: invariant
statement: After its header block, an email's content starts a new block at every non-blank line whose quotation differs from that of the previous non-blank line, a line being quoted when its first character after leading spaces or tabs is a greater-than sign.
constrains:
- domain/knowledge-base/raw-information
- domain/knowledge-base/source-type
---

## Description

None.

=== rules/knowledge-base/empty-provenance-chain-refused
---
type: invariant
statement: A provenance read of an existing item whose provenance chain is empty is refused.
constrains:
- domain/knowledge-base/provenance
---

## Description

None.

=== rules/knowledge-base/end-on-change-link-types
---
type: invariant
statement: The catalog link types that require a validity end on change are exactly reports_to, part_of and located_in.
constrains:
- domain/knowledge-base/link-type
---

## Description

None.

=== rules/knowledge-base/entity-match-queue-entry
---
type: policy
statement: The entity-match queue holds one entry per knowledge node in status needs-review, listing each of its entity match reviews as a candidate, most similar first.
constrains:
- domain/knowledge-base/knowledge-node
- domain/knowledge-base/entity-match-review
consistency: eventual
---

## Description

None.

=== rules/knowledge-base/entity-match-resolution-check-order
---
type: invariant
statement: An entity-match resolution is checked for a merge-into naming its own node first, and deciding keep-separate then for an absent node, a deleted node and a node not in needs-review, and is refused at the first check it fails.
constrains:
- domain/knowledge-base/entity-match-resolution
---

## Description

None.

=== rules/knowledge-base/entity-match-resolution-clears-reviews
---
type: policy
statement: An accepted entity-match resolution removes every entity match review of its knowledge node.
constrains:
- domain/knowledge-base/entity-match-resolution
- domain/knowledge-base/entity-match-review
consistency: eventual
---

## Description

None.

=== rules/knowledge-base/entity-match-resolution-records-curation-action
---
type: policy
statement: An accepted entity-match resolution records one curation action of kind resolve-entity-match on target kind node at its node's identity, with its reason as the reason and its decision, and for merge-into its target node, as the payload.
constrains:
- domain/knowledge-base/entity-match-resolution
- domain/knowledge-base/curation-action
- domain/knowledge-base/curation-action-kind
- domain/knowledge-base/curation-target-kind
---

## Description

None.

=== rules/knowledge-base/entity-match-resolution-requires-pending-review
---
type: invariant
statement: An entity-match resolution MUST resolve a knowledge node in status needs-review.
constrains:
- domain/knowledge-base/entity-match-resolution
- domain/knowledge-base/knowledge-node
- domain/knowledge-base/node-status
---

## Description

None.

=== rules/knowledge-base/every-proposal-audited
---
type: invariant
statement: Every proposal made within an LLM run is recorded as one of its tool calls, with its arguments, its result and its validation outcome, whichever transport carried it and whether it was taken, refused or failed, unless recording the tool call of a refused or failed proposal itself fails.
constrains:
- domain/knowledge-base/llm-run
- domain/knowledge-base/tool-call
- domain/knowledge-base/proposal
---

## Description

None.

=== rules/knowledge-base/every-proposal-audited.log
---
entries:
- field: statement
  unstated: The material has MCP proposals record a tool call on every outcome and REST proposals record none; the two decide differently for a proposal carried over REST.
  decided: Every proposal within a run records its tool call, whichever transport carried it.
  why: A run's summary is counted from its tool calls, so a proposal without one would vanish from its run's account.
- field: statement
  unstated: The material has a refused or failed proposal always recorded as a tool call, while the code keeps none when recording that tool call itself fails.
  decided: A refused or failed proposal whose tool call cannot be recorded is the one exception to being recorded.
  why: The owner holds the code as the truth, and the handler logs the failed recording and answers the original refusal.
---

=== rules/knowledge-base/exact-alias-earliest-alias-wins
---
type: invariant
statement: A node proposal whose name equals an alias of more than one active knowledge node of its node type resolves as matched-existing to the one whose matching alias was created earliest, an alias with no recorded creation time counting as created after every alias that has one, and equal creation times going to the lowest knowledge node identity.
constrains:
- domain/knowledge-base/proposal
- domain/knowledge-base/knowledge-node
- domain/knowledge-base/node-alias
- domain/knowledge-base/node-resolution
---

## Description

Which knowledge node a node proposal resolves to when its name equals an alias held by several active knowledge nodes of its node type.
Whether a proposal resolves by exact alias at all is decided by rules/knowledge-base/exact-alias-resolves.

=== rules/knowledge-base/exact-alias-earliest-alias-wins.log
---
entries:
- field: statement
  unstated: No node says which knowledge node a proposal resolves to when its name equals an alias of several active knowledge nodes of its node type, and node-alias declares created_at as optional, so nothing says where an alias with no creation time falls in an earliest-first order.
  decided: The node whose matching alias was created earliest wins. An alias with no recorded creation time counts as created after every alias that has one. Equal creation times, including two aliases that both have none, go to the lowest knowledge node identity.
  why: The intake scope (item 2) asks for a deterministic tie-break of oldest alias first, then node identity. Putting an alias with no creation time last follows the search-ranking rule, where an item that was never recorded falls after every recorded item with the same score. It is also the order an ascending sort on creation time and then node identity gives, so a node with a known creation time is never passed over for one whose age is unknown.
---

=== rules/knowledge-base/exact-alias-resolves
---
type: invariant
statement: A node proposal whose name equals an alias of an active knowledge node of its node type resolves to that node as matched-existing.
constrains:
- domain/knowledge-base/proposal
- domain/knowledge-base/knowledge-node
- domain/knowledge-base/node-alias
- domain/knowledge-base/node-resolution
---

## Description

None.

=== rules/knowledge-base/exact-node-item-carries-no-similarity
---
type: invariant
statement: A knowledge node search item that the node layer matched exactly carries no similarity, even when one of the node's aliases has a word similarity to the query text that would be enough for an approximate match.
constrains:
- domain/knowledge-base/search-item
---

## Description

Governs whether an exactly matched knowledge node search item carries a similarity. It does not decide which match a node that meets both ways takes (rules/knowledge-base/node-layer-approximate-match), nor what an approximately matched item carries (rules/knowledge-base/node-item-shows-match).

=== rules/knowledge-base/exact-node-item-carries-no-similarity.log
---
entries:
- field: statement
  unstated: Neither the material nor any node says whether a knowledge node search item matched exactly carries a similarity when one of its aliases also reaches the approximate threshold; the material says only that a node matching both ways appears once as exact, and that the approximate item also reports the similarity.
  decided: A knowledge node search item matched exactly carries no similarity, whatever its aliases' word similarity to the query text.
  why: The material gives the similarity to the approximate item so that the uncertainty of a trigram match is visible to the reader, and an exact match carries no such uncertainty, so showing a similarity on it would suggest one.
---

=== rules/knowledge-base/expanded-link-layer-is-node
---
type: invariant
statement: A search item for a knowledge link a search's expansion reaches carries the layer node.
constrains:
- domain/knowledge-base/search-item
- domain/knowledge-base/search-layer
---

## Description

None.

=== rules/knowledge-base/expanded-link-layer-is-node.log
---
entries:
- field: statement
  unstated: No node said which layer a search item for an expanded link carries.
  decided: The layer node.
  why: The search service gives every expanded link item the layer node, though a link is not read from the node layer.
---

=== rules/knowledge-base/expanded-link-requires-provenance
---
type: policy
statement: A knowledge link expansion reaches surfaces as a search item only when it holds provenance.
constrains:
- domain/knowledge-base/knowledge-link
- domain/knowledge-base/search-item
---

## Description

None.

=== rules/knowledge-base/expansion-as-of-view
---
type: policy
statement: Expansion under a query that names an as-of date reaches only knowledge links whose validity has no start or starts on or before that date and has no end or ends after it.
constrains:
- domain/knowledge-base/search-query
- domain/knowledge-base/knowledge-link
---

## Description

None.

=== rules/knowledge-base/expansion-current-view
---
type: policy
statement: Expansion under a query that names no as-of date reaches only knowledge links that have no validity end.
constrains:
- domain/knowledge-base/search-query
- domain/knowledge-base/knowledge-link
---

## Description

None.

=== rules/knowledge-base/expansion-decay
---
type: policy
statement: A knowledge link reached at hop h scores 0.5 raised to the power h times the score of the matched knowledge node it was reached from.
constrains:
- domain/knowledge-base/knowledge-link
- domain/knowledge-base/search-item
---

## Description

None.

=== rules/knowledge-base/expansion-depth-bounds
---
type: invariant
statement: A search query's expansion depth and a traversal's depth MUST be whole numbers between 1 and 3 hops.
constrains:
- domain/knowledge-base/search-query
- domain/knowledge-base/traversal-request
---

## Description

None.

=== rules/knowledge-base/expansion-follows-both-directions
---
type: invariant
statement: A search's expansion follows a knowledge link from either of its ends.
constrains:
- domain/knowledge-base/knowledge-link
---

## Description

None.

=== rules/knowledge-base/expansion-follows-both-directions.log
---
entries:
- field: statement
  unstated: The standing node says expansion follows a knowledge link from either end, while the material's traversal follows links only from their source or only from their target when its direction is out or in; the two decide differently for an outgoing traversal from a node that is only a link's target.
  decided: The standing node governs a search's expansion, and a traversal follows the direction it names.
  why: The standing node was read from the search's expansion, which names no direction.
---

=== rules/knowledge-base/expansion-hop
---
type: policy
statement: A search's expansion reaches a knowledge link at the hop equal to the number of knowledge links on the expansion path from the matched knowledge node up to and including that link, so a link with the matched knowledge node as one endpoint is reached at hop 1.
constrains:
- domain/knowledge-base/knowledge-link
- domain/knowledge-base/search-item
---

## Description

This rule sets how a search's expansion counts the hop at which it reaches a knowledge link along one expansion path.
It does not set the score a link gets at that hop. rules/knowledge-base/expansion-decay sets that.
It does not choose among several paths that reach the same link. rules/knowledge-base/expansion-link-once covers that.
It does not count the hops of a traversal.

=== rules/knowledge-base/expansion-hop.log
---
entries:
- field: statement
  unstated: No node or material says how a search's expansion counts the hop at which it reaches a knowledge link, or whether a link that touches the matched knowledge node is at hop 0 or hop 1.
  decided: The hop is the number of knowledge links on the expansion path from the matched knowledge node up to and including the link, so a link with the matched knowledge node as one endpoint is reached at hop 1.
  why: Counting the link itself makes a link next to a match score half of that match's score, so no expanded link ranks level with the matched node.
---

=== rules/knowledge-base/expansion-in-effect-only
---
type: policy
statement: Expansion under an in-effect-only query reaches no knowledge link whose validity starts after the query's as-of date, or after today when the query names none.
constrains:
- domain/knowledge-base/search-query
- domain/knowledge-base/knowledge-link
---

## Description

None.

=== rules/knowledge-base/expansion-link-once
---
type: policy
statement: A search lists a knowledge link its expansion reaches by more than one path once, scored by the path whose decayed score is highest and at the lowest hop among the paths that give that score.
constrains:
- domain/knowledge-base/knowledge-link
- domain/knowledge-base/search-item
---

## Description

This rule covers a knowledge link that a search's expansion reaches more than once, whether at different hops or from different matched knowledge nodes.
It does not set the decayed score of a single path. rules/knowledge-base/expansion-decay sets that.
It also does not cover how a traversal lists the links it reaches. rules/knowledge-base/traversal-link-once covers that.

=== rules/knowledge-base/expansion-link-once.log
---
entries:
- field: statement
  unstated: No node or material says whether a knowledge link reached by several expansion paths is listed once or once per path. None says which hop and which matched knowledge node's score set its score.
  decided: Listed once. Its score is the highest decayed score among the paths that reach it. Its hop is the lowest hop among the paths that give that score.
  why: A link's score measures how strongly the search's matches support it, and its strongest path is the best support it has. A weaker path must not lower a link that is close to a strong match. Choosing the lowest hop on a tie keeps the item's hop deterministic.
---

=== rules/knowledge-base/expansion-reaches-merged-node-survivor
---
type: invariant
statement: Expansion that reaches a merged knowledge node reaches the knowledge node it was merged into in its place.
constrains:
- domain/knowledge-base/knowledge-node
---

## Description

None.

=== rules/knowledge-base/expansion-restricted-to-named-link-types
---
type: policy
statement: Expansion under a search query, or a traversal, that names link types follows only links of those types.
constrains:
- domain/knowledge-base/search-query
- domain/knowledge-base/traversal-request
- domain/knowledge-base/knowledge-link
---

## Description

None.

=== rules/knowledge-base/expansion-skips-deleted-nodes
---
type: invariant
statement: A search's expansion never reaches a knowledge node whose status is deleted.
constrains:
- domain/knowledge-base/knowledge-node
---

## Description

None.

=== rules/knowledge-base/expansion-skips-deleted-nodes.log
---
entries:
- field: statement
  unstated: The standing node says expansion never reaches a deleted knowledge node, while the material's traversal lists a deleted node it reaches as a link's end without expanding it; the two decide differently for a traversal whose link ends at a deleted node.
  decided: The standing node governs a search's expansion, and a traversal lists the deleted nodes it reaches.
  why: The standing node was read from the search's expansion, and the traversal shows each reached link together with both of its ends.
---

=== rules/knowledge-base/expansion-skips-superseded-and-deleted-links
---
type: invariant
statement: Expansion never reaches a knowledge link whose status is superseded or deleted.
constrains:
- domain/knowledge-base/knowledge-link
---

## Description

None.

=== rules/knowledge-base/expansion-starts-from-matched-nodes
---
type: policy
statement: A search that expands does so through the knowledge graph from its matched knowledge nodes.
constrains:
- domain/knowledge-base/search-query
- domain/knowledge-base/knowledge-link
---

## Description

None.

=== rules/knowledge-base/extraction-anchors-to-read-chunk
---
type: invariant
statement: A fragment an extraction proposes is anchored to the raw chunk being read, whatever raw chunks the model names.
constrains:
- domain/knowledge-base/proposal
- domain/knowledge-base/information-fragment
---

## Description

None.

=== rules/knowledge-base/extraction-answers-proposals-as-contract
---
type: invariant
statement: An extraction hands back to the model each proposal call whose arguments parse with the answer the published ingestion contract gives that proposal, a node proposal's answer carrying each proposed alias that was not admitted and its reason.
constrains:
- domain/knowledge-base/llm-run
---

## Description

Governs what the language model is told, within an extraction, about each fragment, node, link and attribute proposal it makes whose arguments parse.
What each proposal answers on acceptance and refusal is stated by contracts/knowledge-base/ingestion; a proposal call whose arguments do not parse is governed by rules/knowledge-base/extraction-malformed-arguments-refused, and a call to a tool outside the four proposals by rules/knowledge-base/extraction-unknown-tool-refused.

=== rules/knowledge-base/extraction-answers-proposals-as-contract.log
---
entries:
- field: statement
  unstated: No node states what an extraction hands back to the model for a proposal whose arguments parse. The material makes propose_node list each alias it did not record and the reason, but it states that only for the published contract (MCP and the REST mirror), not for the extraction loop's own answer to the model.
  decided: For each proposal call whose arguments parse, an extraction hands back to the model the answer the published ingestion contract gives that proposal. For a node proposal, that answer carries each proposed alias that was not admitted and its reason.
  why: The extraction loop sends a parsed proposal to the same proposal handlers the contract publishes and hands their answer back to the model. So one answer serves both paths, and the model learns which of its aliases were not recorded. A second wording for the loop would be a second answer to one question. Calls whose arguments do not parse, and calls to a tool outside the four proposals, already have their own rules, so this statement stays clear of them.
---

=== rules/knowledge-base/extraction-asks-for-other-names
---
type: invariant
statement: Under prompt version v5 and later, an extraction asks the model to propose with each node every other name the text gives the same entity, such as an acronym, a short name or another spelling, and never a pronoun or a role alone.
constrains:
- domain/knowledge-base/llm-run
- domain/knowledge-base/prompt-version
---

## Description

None.

=== rules/knowledge-base/extraction-before-v5-asks-for-no-other-names
---
type: invariant
statement: Under prompt versions v1 to v4, an extraction does not ask the model to propose other names of an entity with each node.
constrains:
- domain/knowledge-base/llm-run
- domain/knowledge-base/prompt-version
---

## Description

Governs what an extraction under prompt versions v1 to v4 leaves out of its instructions about a node's other names. What an extraction under v5 and later asks for is governed by rules/knowledge-base/extraction-asks-for-other-names. Whether a proposed alias is recorded on its node is governed by rules/knowledge-base/new-node-aliases and rules/knowledge-base/matched-node-gains-only-aliases.

=== rules/knowledge-base/extraction-before-v5-asks-for-no-other-names.log
---
entries:
- field: statement
  unstated: No node stated whether an extraction under prompt versions v1 to v4 asks the model to propose other names of an entity with each node.
  found: /home/siegfriedneto/projects/eternal/siegard-work/aliases-fuzzy-context/intake/material-aliases-fuzzy-contexto.md — "Nenhuma versão do prompt de extração (v1 a v4) menciona aliases."
---

=== rules/knowledge-base/extraction-chunk-turn-limit
---
type: invariant
statement: An extraction counts a chunk as read, and goes on with the run, once the model has taken 64 turns on it.
constrains:
- domain/knowledge-base/llm-run
---

## Description

None.

=== rules/knowledge-base/extraction-chunk-turn-limit.log
---
entries:
- field: statement
  unstated: No node holds the number of model turns after which a chunk counts as read.
  decided: A chunk counts as read once the model has taken 64 turns on it.
  why: The code closes it as completed and goes on, so the figure and the outcome are the business behavior.
---

=== rules/knowledge-base/extraction-closes-its-run
---
type: invariant
statement: An extraction completes its LLM run once it has read every chunk and fails it when it stops on an error.
constrains:
- domain/knowledge-base/llm-run
- domain/knowledge-base/run-status
---

## Description

None.

=== rules/knowledge-base/extraction-dates-events
---
type: invariant
statement: Under prompt version v2 and later, an extraction asks the model to propose an event's event_date, and its end_date when the end is distinct, whenever the document states the date of the occurrence.
constrains:
- domain/knowledge-base/llm-run
- domain/knowledge-base/prompt-version
---

## Description

None.

=== rules/knowledge-base/extraction-dates-events.log
---
entries:
- field: statement
  unstated: The material shows the event-dating directive in the v2 prompt module only.
  decided: The rule holds under prompt version v2 and later.
  why: The v3 and v4 prompts are built by appending to the v2 prompt, so they carry the directive.
---

=== rules/knowledge-base/extraction-event-date-is-the-value
---
type: invariant
statement: Under prompt version v2 and later, an extraction asks the model to give an event's occurrence date as the value of event_date and the date that value became known, typically the document date, as its validity start.
constrains:
- domain/knowledge-base/llm-run
- domain/knowledge-base/prompt-version
---

## Description

None.

=== rules/knowledge-base/extraction-event-date-is-the-value.log
---
entries:
- field: statement
  unstated: The material shows the event-date directive in the v2 prompt module only.
  decided: The rule holds under prompt version v2 and later.
  why: The v3 and v4 prompts are built by appending to the v2 prompt, so they carry the directive.
---

=== rules/knowledge-base/extraction-event-type-fallback
---
type: invariant
statement: Under prompt version v3 and later, an extraction asks the model to use the event type outro only when no other value fits and then to lower its confidence to at most 0.74.
constrains:
- domain/knowledge-base/llm-run
- domain/knowledge-base/prompt-version
---

## Description

None.

=== rules/knowledge-base/extraction-event-type-fallback.log
---
entries:
- field: statement
  unstated: The material shows the event-type fallback in the v3 prompt module only.
  decided: The rule holds under prompt version v3 and later.
  why: The v4 prompt is built by appending to the v3 prompt, so it carries the directive.
---

=== rules/knowledge-base/extraction-fails-on-repeated-system-errors
---
type: invariant
statement: An extraction fails its LLM run when three proposals in a row within one chunk fail with a system error.
constrains:
- domain/knowledge-base/llm-run
---

## Description

None.

=== rules/knowledge-base/extraction-malformed-arguments-refused
---
type: invariant
statement: An extraction hands back to the model its proposal call whose arguments do not parse, refused with VALIDATION_INVALID_FORMAT and the message "Input failed Zod parse.".
constrains:
- domain/knowledge-base/llm-run
---

## Description

None.

=== rules/knowledge-base/extraction-malformed-arguments-refused.log
---
entries:
- field: statement
  unstated: The contract holds the MCP wording for malformed arguments, not the extraction loop's.
  decided: The loop hands back VALIDATION_INVALID_FORMAT with "Input failed Zod parse.".
  why: The loop is a different path from MCP, and the contract's log only retired the wording for MCP.
---

=== rules/knowledge-base/extraction-never-invents-a-date
---
type: invariant
statement: An extraction asks the model never to invent a date.
constrains:
- domain/knowledge-base/llm-run
---

## Description

None.

=== rules/knowledge-base/extraction-prompt-lists-closed-values
---
type: invariant
statement: An extraction prompt lists the allowed values of each closed attribute key beside that key and lists none for an open attribute key.
constrains:
- domain/knowledge-base/prompt-version
- domain/knowledge-base/attribute-key
---

## Description

None.

=== rules/knowledge-base/extraction-prompt-names-relative-date-words
---
type: invariant
statement: Under prompt version v4 and later, an extraction's system prompt names "hoje", "ontem", "amanhã", "semana que vem" and "esta semana" as relative-date words.
constrains:
- domain/knowledge-base/llm-run
- domain/knowledge-base/prompt-version
---

## Description

None.

=== rules/knowledge-base/extraction-prompt-names-relative-date-words.log
---
entries:
- field: statement
  unstated: No node said which relative-date words the v4 extraction system prompt names.
  decided: hoje, ontem and amanhã.
  why: The v4 system prompt carries those three words and its test fails when one goes missing.
- field: statement
  unstated: The material creates prompt version v5 without saying whether it keeps what v4 asks of the model about relative dates.
  decided: Under prompt version v4 and later.
  why: v5 is v4 plus the alias and document-context instructions; dropping v4 relative-date handling would make the new default regress on dates.
- field: statement
  unstated: The earlier entry settled three relative-date words, while the v4 system prompt also names "semana que vem" and "esta semana" and tells the model to treat similar pt-BR temporal deictics alike.
  decided: The named words are hoje, ontem, amanhã, semana que vem and esta semana; the open-ended instruction about similar deictics is not a word the prompt names and is not stated.
  why: A rule about what the prompt names is held to a closed list, and the two added phrases are named in the shipped prompt that v5 inherits.
---

=== rules/knowledge-base/extraction-prompt-v5-keeps-v4
---
type: invariant
statement: The extraction system prompt of prompt version v5 contains every instruction that the extraction system prompt of prompt version v4 contains.
constrains:
- domain/knowledge-base/llm-run
- domain/knowledge-base/prompt-version
---

## Description

Governs what the v5 extraction system prompt keeps from v4. It does not say which instructions v4 carries: the rules scoped to v4, or to an earlier version and later, decide that. It does not say what v5 adds either: rules/knowledge-base/extraction-asks-for-other-names and the document-context rules decide that.

=== rules/knowledge-base/extraction-prompt-v5-keeps-v4.log
---
entries:
- field: statement
  unstated: The material creates prompt version v5 and makes it the default, but it does not say whether the v5 extraction system prompt keeps every instruction of the v4 one.
  decided: The extraction system prompt of prompt version v5 contains every instruction that the extraction system prompt of prompt version v4 contains.
  why: Earlier decisions already treat v5 as v4 plus the alias and document-context instructions. Those decisions scoped the v4 relative-date rules (extraction-prompt-names-relative-date-words, extraction-relative-date-falls-back-to-reception) to "v4 and later", so the same answer holds here. Dropping any v4 instruction would make the new default prompt regress.
---

=== rules/knowledge-base/extraction-prompt-values-ascending
---
type: invariant
statement: The allowed values an extraction prompt lists for a key are in ascending string order, whatever order the catalog holds them in.
constrains:
- domain/knowledge-base/prompt-version
- domain/knowledge-base/allowed-value
---

## Description

None.

=== rules/knowledge-base/extraction-prompt-values-verbatim
---
type: invariant
statement: The allowed values an extraction prompt lists keep their accents, spelled as validation compares them.
constrains:
- domain/knowledge-base/prompt-version
- domain/knowledge-base/allowed-value
---

## Description

None.

=== rules/knowledge-base/extraction-reads-chunks-in-order
---
type: invariant
statement: An extraction reads its raw information's chunks one at a time in index order, showing the model each one with the source's type, document date, title and reception time, the last 200 Unicode code points of the chunk before it and the run's document context when it holds one.
constrains:
- domain/knowledge-base/llm-run
---

## Description

None.

=== rules/knowledge-base/extraction-reads-chunks-in-order.log
---
entries:
- field: statement
  unstated: The unit in which the extraction counts the 200-character tail of the previous chunk that it shows the model with each chunk. The statement says only "the last 200 characters of the chunk before it". The material says the same ("os últimos 200 caracteres do chunk anterior", "Os 200 caracteres do chunk anterior continuam"). Unicode code points and UTF-16 code units give different results when the chunk holds characters outside the Basic Multilingual Plane.
  decided: The tail shown is the last 200 Unicode code points of the chunk before the one being read.
  why: The tail is measured inside a chunk. Every other measure inside a chunk already uses Unicode code points. That includes the chunk offsets in rules/knowledge-base/chunk-offsets-count-code-points and the chunk sizes in rules/knowledge-base/short-block-one-chunk, rules/knowledge-base/long-block-sentence-chunks and rules/knowledge-base/long-sentence-own-chunk. The entry in rules/knowledge-base/document-context-read-first.log.md also keeps UTF-16 code units for lengths of the whole content and code points for measures inside chunks. Counting in code points also means the cut never splits a surrogate pair. No log entry decided this unit before.
---

=== rules/knowledge-base/extraction-relative-date-falls-back-to-reception
---
type: invariant
statement: Under prompt version v4 and later, an extraction asks the model to resolve a relative date in a chunk against the document date when the source has one and otherwise against the date of its reception.
constrains:
- domain/knowledge-base/llm-run
- domain/knowledge-base/prompt-version
---

## Description

None.

=== rules/knowledge-base/extraction-relative-date-falls-back-to-reception.log
---
entries:
- field: statement
  unstated: The v4 directive tells the model to give the basis received to a date taken from the reception time, which another rule forbids a proposal to state.
  decided: The rule states the anchor of a relative date and leaves the basis out.
  why: Stating the basis would write the contradiction into this rule, and the owner has not asked for it to be settled.
- field: statement
  unstated: Which basis the v4 prompt asks for on the reception fallback
  decided: The basis received
  why: The prompt text names received explicitly for the fallback.
- field: statement
  unstated: Which basis the v4 prompt asks for on the reception fallback
  decided: None is stated by the node; the earlier wording naming received is withdrawn
  why: Naming received here would contradict the rule that no proposal states it.
- field: statement
  unstated: The material creates prompt version v5 without saying whether it keeps the v4 fallback of relative dates to the reception time.
  decided: Under prompt version v4 and later.
  why: v5 is v4 plus the alias and document-context instructions; dropping the v4 fallback would make the new default regress on dates.
---

=== rules/knowledge-base/extraction-relative-date-needs-document-date
---
type: invariant
statement: Under prompt version v3, an extraction asks the model to resolve a relative date in a chunk against the document date and to omit the date when the source has none.
constrains:
- domain/knowledge-base/llm-run
- domain/knowledge-base/prompt-version
---

## Description

None.

=== rules/knowledge-base/extraction-relative-date-needs-document-date.log
---
entries:
- field: statement
  unstated: The material shows the omission of an undated relative date only in the v3 prompt, which v4 replaces.
  decided: The rule holds under prompt version v3 alone.
  why: The v4 prompt declares that it supersedes this v3 rule.
---

=== rules/knowledge-base/extraction-requires-running-run
---
type: invariant
statement: An extraction runs only over an LLM run whose status is running.
constrains:
- domain/knowledge-base/llm-run
- domain/knowledge-base/run-status
---

## Description

None.

=== rules/knowledge-base/extraction-reschedule-is-succession
---
type: invariant
statement: Under prompt version v2 and later, an extraction tells the model that rescheduling an event is a succession of its event_date.
constrains:
- domain/knowledge-base/llm-run
- domain/knowledge-base/prompt-version
---

## Description

None.

=== rules/knowledge-base/extraction-reschedule-is-succession.log
---
entries:
- field: statement
  unstated: The extraction date rules do not say how a rescheduled event is hinted.
  decided: From v2 on, an extraction tells the model a rescheduling is a succession of event_date.
  why: Prompt versions v3 and v4 compose v2, so the instruction holds from v2 on.
---

=== rules/knowledge-base/extraction-stated-basis-needs-written-start
---
type: invariant
statement: An extraction asks the model to give a validity start the basis stated only when the start is written in the chunk and supported by a cited fragment.
constrains:
- domain/knowledge-base/llm-run
- domain/knowledge-base/valid-from-basis
---

## Description

None.

=== rules/knowledge-base/extraction-turn-token-ceiling
---
type: invariant
statement: An extraction asks the language model for at most 8000 tokens of output on each turn.
constrains:
- domain/knowledge-base/llm-run
---

## Description

None.

=== rules/knowledge-base/extraction-turn-token-ceiling.log
---
entries:
- field: statement
  unstated: The material does not say whether the output ceiling of an extraction turn is a fact of the business or a setting of the implementation.
  decided: It is recorded as a rule of extraction, like the default extraction model.
  why: The owner holds the code as the truth, and all four prompt versions pass the same ceiling to every model call.
---

=== rules/knowledge-base/extraction-turn-without-proposals-ends-chunk
---
type: invariant
statement: An extraction counts a chunk as read once a model turn proposes nothing, and resumes the chunk after a paused turn.
constrains:
- domain/knowledge-base/llm-run
---

## Description

None.

=== rules/knowledge-base/extraction-turn-without-proposals-ends-chunk.log
---
entries:
- field: statement
  unstated: No node says which model turns end the reading of a chunk.
  decided: A turn that proposes nothing ends the chunk, and a paused turn resumes it.
  why: The owner decided the source's behavior is the truth, and the judge read it in the code.
---

=== rules/knowledge-base/extraction-unknown-tool-refused
---
type: invariant
statement: An extraction hands back to the model its call to a tool outside the four proposals, refused with VALIDATION_INVALID_FORMAT and the message "Unknown tool '<name>'.".
constrains:
- domain/knowledge-base/llm-run
---

## Description

None.

=== rules/knowledge-base/extraction-unknown-tool-refused.log
---
entries:
- field: statement
  unstated: No node holds what the model is told for a tool outside the four proposals.
  decided: The call is handed back refused, with VALIDATION_INVALID_FORMAT and "Unknown tool '<name>'.".
  why: The owner decided the source's behavior is the truth, and the judge read it in the code.
---

=== rules/knowledge-base/extraction-user-prompt-shows-anchor-dates
---
type: invariant
statement: An extraction's user message shows the reception time and the document date of the source, and shows the document date as "(unknown)" when the source has none.
constrains:
- domain/knowledge-base/llm-run
- domain/knowledge-base/prompt-version
---

## Description

None.

=== rules/knowledge-base/extraction-user-prompt-shows-anchor-dates.log
---
entries:
- field: statement
  unstated: No node said how the user message of an extraction shows the two anchor dates or marks an absent document date.
  decided: It shows both, with (unknown) for a missing document date.
  why: The v4 directive tells the model to look for document_date being (unknown), so the marker is part of the contract between the two prompts.
---

=== rules/knowledge-base/failed-preliminary-reading-continues
---
type: invariant
statement: An extraction whose preliminary reading fails goes on to read its chunks.
constrains:
- domain/knowledge-base/llm-run
---

## Description

None.

=== rules/knowledge-base/fragment-chunks-exist
---
type: invariant
statement: Every raw chunk a fragment proposal cites MUST exist.
constrains:
- domain/knowledge-base/proposal
- domain/knowledge-base/raw-chunk
---

## Description

None.

=== rules/knowledge-base/fragment-chunks-in-run-source
---
type: invariant
statement: Every raw chunk a fragment proposal cites MUST belong to the raw information of the proposal's LLM run.
constrains:
- domain/knowledge-base/proposal
- domain/knowledge-base/raw-chunk
---

## Description

None.

=== rules/knowledge-base/fragment-confidence-range
---
type: invariant
statement: An information fragment's confidence is between 0 and 1 inclusive.
constrains:
- domain/knowledge-base/information-fragment
---

## Description

None.

=== rules/knowledge-base/fragment-item-summary
---
type: invariant
statement: A fragment search item's summary is the information fragment's text.
constrains:
- domain/knowledge-base/search-item
---

## Description

None.

=== rules/knowledge-base/fragment-layer-matches-accepted-only
---
type: policy
statement: The fragment layer matches only information fragments whose status is accepted.
constrains:
- domain/knowledge-base/search-layer
- domain/knowledge-base/information-fragment
---

## Description

None.

=== rules/knowledge-base/fragment-missing-chunk-first
---
type: invariant
statement: A fragment proposal is checked for raw chunks that exist before it is checked for raw chunks of its LLM run's raw information.
constrains:
- domain/knowledge-base/proposal
---

## Description

None.

=== rules/knowledge-base/fragment-recorded-proposed
---
type: invariant
statement: A fragment proposal records an information fragment in status proposed, whatever its confidence.
constrains:
- domain/knowledge-base/information-fragment
- domain/knowledge-base/fragment-status
---

## Description

None.

=== rules/knowledge-base/fragment-text-length
---
type: invariant
statement: An information fragment's text MUST hold between 1 and 1000 characters.
constrains:
- domain/knowledge-base/information-fragment
---

## Description

None.

=== rules/knowledge-base/graph-item-flags
---
type: policy
statement: A graph read flags a knowledge link or node attribute uncertain when its status is uncertain and disputed when its status is disputed, and never flags it low-confidence.
constrains:
- domain/knowledge-base/graph-read
- domain/knowledge-base/knowledge-link
- domain/knowledge-base/node-attribute
- domain/knowledge-base/assertion-flag
consistency: eventual
---

## Description

None.

=== rules/knowledge-base/graph-provenance-excerpt-is-chunk-excerpt
---
type: policy
statement: A graph read's provenance entry shows the part of the cited raw chunk's text that starts at the chunk's start offset in its source and is as long as the chunk.
constrains:
- domain/knowledge-base/graph-read
- domain/knowledge-base/provenance
- domain/knowledge-base/raw-chunk
consistency: eventual
---

## Description

None.

=== rules/knowledge-base/graph-provenance-excerpt-is-chunk-excerpt.log
---
entries:
- field: statement
  unstated: The material cuts a provenance entry's excerpt from the chunk's own text starting at the chunk's start offset, which gives a shifted or empty slice for any chunk that does not start at the beginning of its source.
  decided: A provenance entry shows the whole excerpt of the raw chunk it cites.
  why: A chunk's excerpt is already the content between its offsets, so offsetting it again cuts away the text the entry exists to show.
- field: statement
  unstated: A judgment shows the excerpt cut from the chunk's text starting at the chunk's start offset for the chunk's length.
  decided: The entry shows the part of the chunk's text from the chunk's start offset, as long as the chunk.
  why: The owner decided the source's behavior is the truth, and it cuts the excerpt by those offsets.
---

=== rules/knowledge-base/graph-provenance-hides-compliance-deleted
---
type: policy
statement: A graph read shows a provenance entry whatever the compliance status of its raw information.
constrains:
- domain/knowledge-base/graph-read
- domain/knowledge-base/provenance
- domain/knowledge-base/compliance-deletion
consistency: eventual
---

## Description

None.

=== rules/knowledge-base/graph-provenance-hides-compliance-deleted.log
---
entries:
- field: statement
  unstated: The material reads a graph read's provenance with no filter on whether the fragment's raw information was deleted for compliance, and says nothing about whether such entries may be shown.
  decided: A graph read shows no provenance entry whose raw information was deleted for compliance.
  why: A compliance deletion exists to keep a deleted source's knowledge from being presented as still traceable, and a provenance entry presents exactly that trace.
- field: statement
  unstated: A judgment shows a graph read listing the provenance of a fragment whose raw information was deleted for compliance, with no filter.
  decided: A graph read shows a provenance entry whatever the compliance status of its raw information.
  why: The owner decided the source's behavior is the truth, and the read applies no compliance filter.
---

=== rules/knowledge-base/graph-provenance-one-entry-per-chunk
---
type: policy
statement: A graph read shows one provenance entry for each raw chunk that each provenance fragment of a knowledge link or node attribute cites.
constrains:
- domain/knowledge-base/graph-read
- domain/knowledge-base/knowledge-link
- domain/knowledge-base/node-attribute
- domain/knowledge-base/provenance
consistency: eventual
---

## Description

None.

=== rules/knowledge-base/graph-provenance-order
---
type: policy
statement: A graph read orders a knowledge link's or node attribute's provenance entries by the time each provenance was recorded and then by fragment identity.
constrains:
- domain/knowledge-base/graph-read
- domain/knowledge-base/knowledge-link
- domain/knowledge-base/node-attribute
- domain/knowledge-base/provenance
consistency: eventual
---

## Description

None.

=== rules/knowledge-base/graph-read-as-of-view
---
type: policy
statement: A node read or traversal that names an as-of date shows only knowledge links and node attributes without a supersession time whose validity has no start or starts on or before that date and has no end or ends after it.
constrains:
- domain/knowledge-base/node-view
- domain/knowledge-base/traversal-request
- domain/knowledge-base/knowledge-link
- domain/knowledge-base/node-attribute
consistency: eventual
---

## Description

None.

=== rules/knowledge-base/graph-read-current-view
---
type: policy
statement: A node read or traversal that names no as-of date shows only current knowledge links and node attributes.
constrains:
- domain/knowledge-base/node-view
- domain/knowledge-base/traversal-request
- domain/knowledge-base/knowledge-link
- domain/knowledge-base/node-attribute
consistency: eventual
---

## Description

None.

=== rules/knowledge-base/graph-read-in-effect-only
---
type: policy
statement: A node read or traversal that asks for in-effect-only items and names no as-of date shows only knowledge links and node attributes in effect.
constrains:
- domain/knowledge-base/node-view
- domain/knowledge-base/traversal-request
- domain/knowledge-base/knowledge-link
- domain/knowledge-base/node-attribute
consistency: eventual
---

## Description

None.

=== rules/knowledge-base/graph-read-shows-empty-provenance
---
type: policy
statement: A graph read shows a knowledge link or node attribute that has no provenance with an empty provenance list.
constrains:
- domain/knowledge-base/graph-read
- domain/knowledge-base/knowledge-link
- domain/knowledge-base/node-attribute
- domain/knowledge-base/provenance
consistency: eventual
---

## Description

None.

=== rules/knowledge-base/health-checked-at-probe-start
---
type: invariant
statement: A health report's time is the moment the probe began, before the store was asked.
constrains:
- domain/knowledge-base/health-report
---

## Description

None.

=== rules/knowledge-base/health-probe-never-fails
---
type: invariant
statement: A health probe reports the store unreachable, and the system not healthy, when the store does not answer, and never fails.
constrains:
- domain/knowledge-base/health-report
- domain/knowledge-base/database-status
---

## Description

None.

=== rules/knowledge-base/held-content-records-nothing
---
type: invariant
statement: Ingesting content whose content hash a raw information already holds records no new raw information, raw chunk or LLM run.
constrains:
- domain/knowledge-base/raw-information
---

## Description

None.

=== rules/knowledge-base/history-order
---
type: policy
statement: A link, attribute or attribute-key history orders its versions by recording time and then by identity.
constrains:
- domain/knowledge-base/graph-read
- domain/knowledge-base/knowledge-link
- domain/knowledge-base/node-attribute
consistency: eventual
---

## Description

None.

=== rules/knowledge-base/idempotency-key
---
type: invariant
statement: An LLM run's idempotency key is the SHA-256 digest, as 64 lowercase hexadecimal characters, of its raw information's content hash, its prompt version, its model and the chunking version joined in that order without separator.
constrains:
- domain/knowledge-base/llm-run
---

## Description

None.

=== rules/knowledge-base/idempotency-key-unique
---
type: invariant
statement: No two LLM runs hold the same idempotency key.
constrains:
- domain/knowledge-base/llm-run
---

## Description

None.

=== rules/knowledge-base/in-effect-assertion
---
type: policy
statement: A knowledge link or node attribute is in effect while it is current and its validity has no start or starts on or before today.
constrains:
- domain/knowledge-base/knowledge-link
- domain/knowledge-base/node-attribute
consistency: eventual
---

## Description

None.

=== rules/knowledge-base/ingestion-records-chunks-and-run
---
type: policy
statement: Ingesting content no raw information holds records its raw information with its raw chunks and opens one LLM run over it in status running.
constrains:
- domain/knowledge-base/raw-information
- domain/knowledge-base/llm-run
- domain/knowledge-base/run-status
consistency: eventual
---

## Description

None.

=== rules/knowledge-base/ingestion-records-chunks-and-run.log
---
entries:
- field: consistency
  unstated: The material does not say how this rule holds across the separate records it changes.
  decided: eventual
  why: The records it changes are separate aggregates, and no reader in the material depends on seeing them change together.
---

=== rules/knowledge-base/item-flags
---
type: invariant
statement: A search item is flagged uncertain when its status is uncertain, disputed when its status is disputed, and low-confidence when it is an accepted information fragment whose confidence is below 0.4.
constrains:
- domain/knowledge-base/search-item
- domain/knowledge-base/assertion-flag
---

## Description

None.

=== rules/knowledge-base/keep-disputed-changes-nothing
---
type: invariant
statement: A dispute resolution deciding keep-disputed changes none of its items.
constrains:
- domain/knowledge-base/dispute-resolution
- domain/knowledge-base/dispute-decision
---

## Description

None.

=== rules/knowledge-base/keep-separate-activates-node
---
type: policy
statement: An entity-match resolution deciding keep-separate returns its knowledge node to active.
constrains:
- domain/knowledge-base/entity-match-resolution
- domain/knowledge-base/knowledge-node
- domain/knowledge-base/node-status
---

## Description

None.

=== rules/knowledge-base/layer-weights
---
type: invariant
statement: A match's strength is weighted by 1.0 on the fragment layer, 0.9 on the node layer and 0.6 on the chunk layer.
constrains:
- domain/knowledge-base/search-item
---

## Description

None.

=== rules/knowledge-base/lineage-history
---
type: policy
statement: A link or attribute history holds the item, each item it supersedes in turn, and each item that supersedes it or one of its successors, whatever their status or validity.
constrains:
- domain/knowledge-base/graph-read
- domain/knowledge-base/knowledge-link
- domain/knowledge-base/node-attribute
consistency: eventual
---

## Description

None.

=== rules/knowledge-base/link-and-fragment-items-carry-no-match
---
type: invariant
statement: A search item for a knowledge link or an information fragment carries no node match and no similarity.
constrains:
- domain/knowledge-base/search-item
- domain/knowledge-base/node-match
---

## Description

This rule says which search items do not carry a node match or a similarity. These are link items, including links a search's expansion reaches, and fragment items, including fragments the chunk layer surfaces.
It does not say what a knowledge node item carries. rules/knowledge-base/node-item-shows-match covers that.
It does not set the score or the rank of an item that the search reached through an approximately matched knowledge node. rules/knowledge-base/approximate-match-strength and rules/knowledge-base/search-ranking cover those.

=== rules/knowledge-base/link-and-fragment-items-carry-no-match.log
---
entries:
- field: statement
  unstated: No node says whether a search item for a knowledge link or an information fragment carries a node match and a similarity. The material says only that every node-layer item tells how it matched and that items reached by expansion get no marking of their own.
  decided: A search item for a knowledge link or an information fragment carries no node match and no similarity.
  why: A node match describes how the node layer matched a knowledge node, and the node layer never matches link or fragment items. The fragment and chunk layers stay full-text only, and the material says the items that expansion reaches from an approximately matched node get no marking of their own. Their uncertainty already shows in their rank, which places them after all the others.
---

=== rules/knowledge-base/link-confidence-range
---
type: invariant
statement: A knowledge link's confidence is between 0 and 1 inclusive.
constrains:
- domain/knowledge-base/knowledge-link
---

## Description

None.

=== rules/knowledge-base/link-item-summary
---
type: policy
statement: A link search item's summary reads `source -[link type]-> target`, with the canonical names of its source and target knowledge nodes.
constrains:
- domain/knowledge-base/search-item
- domain/knowledge-base/knowledge-link
---

## Description

None.

=== rules/knowledge-base/link-never-supersedes-itself
---
type: invariant
statement: A knowledge link never names itself as the one it supersedes.
constrains:
- domain/knowledge-base/knowledge-link
---

## Description

None.

=== rules/knowledge-base/link-or-attribute-cites-a-fragment
---
type: invariant
statement: A link or attribute proposal MUST cite at least one information fragment.
constrains:
- domain/knowledge-base/proposal
- domain/knowledge-base/information-fragment
---

## Description

None.

=== rules/knowledge-base/link-permitted-by-type-rule
---
type: invariant
statement: A link proposal MUST be permitted by a link type rule of its link type, in effect today, for the node types of its source and target knowledge nodes.
constrains:
- domain/knowledge-base/proposal
- domain/knowledge-base/link-type
- domain/knowledge-base/link-type-rule
---

## Description

None.

=== rules/knowledge-base/link-proposal-check-order
---
type: invariant
statement: A link proposal is checked for a known link type, then for existing source and target knowledge nodes, then for cited fragments that exist and belong to its LLM run, then for a permitting link type rule, then for its dates, then for its confidence, then for the anchoring of its fragments, and stops at the first check it fails.
constrains:
- domain/knowledge-base/proposal
---

## Description

None.

=== rules/knowledge-base/link-provenance-once-per-fragment
---
type: invariant
statement: A knowledge link holds at most one provenance per information fragment.
constrains:
- domain/knowledge-base/knowledge-link
- domain/knowledge-base/provenance
---

## Description

None.

=== rules/knowledge-base/link-provenance-once-per-fragment.log
---
entries:
- field: statement
  unstated: The material keeps one provenance per fragment on a knowledge link while a re-affirmation adds a provenance for each fragment it cites; the two decide differently for a re-affirmation citing a fragment the knowledge link already holds.
  decided: 'The uniqueness stands: a re-affirmation citing a fragment the assertion already holds adds no second provenance for it.'
  why: A second provenance to the same fragment traces the assertion to no source it was not already traced to.
---

=== rules/knowledge-base/link-start-has-basis
---
type: invariant
statement: A knowledge link that holds a validity start holds the basis of that start.
constrains:
- domain/knowledge-base/knowledge-link
- domain/knowledge-base/valid-from-basis
---

## Description

None.

=== rules/knowledge-base/link-type-in-catalog
---
type: invariant
statement: A link proposal MUST name a link type the catalog holds.
constrains:
- domain/knowledge-base/proposal
- domain/knowledge-base/link-type
---

## Description

None.

=== rules/knowledge-base/link-type-listing-order
---
type: invariant
statement: The link-type listing orders link types by name and each link type's rules by source and then target node-type name.
constrains:
- domain/knowledge-base/link-type
- domain/knowledge-base/link-type-rule
---

## Description

None.

=== rules/knowledge-base/link-type-name-unique
---
type: invariant
statement: No two link types hold the same name.
constrains:
- domain/knowledge-base/link-type
---

## Description

None.

=== rules/knowledge-base/link-type-rule-in-effect
---
type: invariant
statement: A link type rule is in effect on a day that falls on or after its validity start, when it has one, and before its validity end, when it has one.
expression: (valid_from is null or valid_from <= day) and (valid_to is null or day < valid_to), where day is the UTC calendar date
constrains:
- domain/knowledge-base/link-type-rule
---

## Description

None.

=== rules/knowledge-base/link-type-rule-window-ordered
---
type: invariant
statement: A link type rule that holds both a validity start and a validity end holds the start strictly before the end.
constrains:
- domain/knowledge-base/link-type-rule
---

## Description

None.

=== rules/knowledge-base/link-type-rules-on-request
---
type: invariant
statement: The link-type listing carries each link type's rules, whatever their window, only when the request asks for rules.
constrains:
- domain/knowledge-base/link-type
- domain/knowledge-base/link-type-rule
---

## Description

None.

=== rules/knowledge-base/link-types-ignored-without-expansion
---
type: invariant
statement: A search query that does not expand ignores the link types it names.
constrains:
- domain/knowledge-base/search-query
---

## Description

None.

=== rules/knowledge-base/link-validity-ordered
---
type: invariant
statement: A knowledge link that holds both a validity start and a validity end holds the start strictly before the end.
constrains:
- domain/knowledge-base/knowledge-link
---

## Description

None.

=== rules/knowledge-base/listing-excludes-compliance-deleted
---
type: policy
statement: The accepted-fragment listing excludes information fragments whose raw information was deleted for compliance.
constrains:
- domain/knowledge-base/information-fragment
- domain/knowledge-base/compliance-deletion
consistency: eventual
---

## Description

None.

=== rules/knowledge-base/listing-excludes-compliance-deleted.log
---
entries:
- field: consistency
  unstated: The material does not say how this read holds across the separate records it combines.
  decided: eventual
  why: The records it combines are written independently and never change in one transaction, so a read reflects each as last committed.
---

=== rules/knowledge-base/listing-holds-accepted-only
---
type: policy
statement: The accepted-fragment listing holds only information fragments whose status is accepted.
constrains:
- domain/knowledge-base/accepted-fragment-filter
- domain/knowledge-base/information-fragment
---

## Description

None.

=== rules/knowledge-base/listing-one-entry-per-fragment
---
type: policy
statement: The accepted-fragment listing shows each information fragment once, attributed to its lowest-index raw chunk.
constrains:
- domain/knowledge-base/information-fragment
- domain/knowledge-base/raw-information
consistency: eventual
---

## Description

None.

=== rules/knowledge-base/listing-one-entry-per-fragment.log
---
entries:
- field: consistency
  unstated: The material does not say how this read holds across the separate records it combines.
  decided: eventual
  why: The records it combines are written independently and never change in one transaction, so a read reflects each as last committed.
---

=== rules/knowledge-base/listing-order
---
type: policy
statement: The accepted-fragment listing is ordered by source reception time descending, then fragment creation time descending, then fragment identifier ascending.
constrains:
- domain/knowledge-base/information-fragment
- domain/knowledge-base/raw-information
consistency: eventual
---

## Description

None.

=== rules/knowledge-base/listing-order.log
---
entries:
- field: consistency
  unstated: The material does not say how this read holds across the separate records it combines.
  decided: eventual
  why: The records it combines are written independently and never change in one transaction, so a read reflects each as last committed.
---

=== rules/knowledge-base/listing-requires-a-filter
---
type: invariant
statement: An accepted-fragment listing MUST name an LLM run, a raw information, or both.
constrains:
- domain/knowledge-base/accepted-fragment-filter
---

## Description

None.

=== rules/knowledge-base/listing-total-before-pagination
---
type: invariant
statement: An accepted-fragment listing's total counts every entry before the page is cut.
constrains:
- domain/knowledge-base/accepted-fragment-filter
- domain/knowledge-base/page
---

## Description

None.

=== rules/knowledge-base/llm-run-lifecycle
---
type: state-machine
statement: An LLM run moves only along the declared transitions.
subject: domain/knowledge-base/llm-run
status: domain/knowledge-base/run-status
initial: running
terminal:
- completed
transitions:
- from: running
  trigger: complete
  to: completed
- from: running
  trigger: fail
  to: failed
- from: failed
  trigger: retry
  to: running
rejections:
- from: running
  trigger: retry
- from: failed
  trigger: complete
- from: failed
  trigger: fail
---

## Description

None.

=== rules/knowledge-base/long-block-sentence-chunks
---
type: invariant
statement: A block of more than 4000 code points is cut at its Portuguese sentence boundaries into raw chunks, each closing before the sentence that would take it past 2000 code points.
constrains:
- domain/knowledge-base/raw-chunk
---

## Description

None.

=== rules/knowledge-base/long-sentence-own-chunk
---
type: invariant
statement: A sentence of more than 2000 code points in a block of more than 4000 is one raw chunk on its own, whatever its length.
constrains:
- domain/knowledge-base/raw-chunk
---

## Description

None.

=== rules/knowledge-base/match-review-distinct-nodes
---
type: invariant
statement: An entity match review pairs two different knowledge nodes.
constrains:
- domain/knowledge-base/entity-match-review
---

## Description

None.

=== rules/knowledge-base/match-review-pair-unique
---
type: invariant
statement: At most one entity match review pairs one knowledge node with one candidate knowledge node.
constrains:
- domain/knowledge-base/entity-match-review
---

## Description

None.

=== rules/knowledge-base/match-review-similarity-range
---
type: invariant
statement: An entity match review's similarity is between 0 and 1 inclusive.
constrains:
- domain/knowledge-base/entity-match-review
---

## Description

None.

=== rules/knowledge-base/matched-item-hop-zero
---
type: invariant
statement: A search item the search matched directly carries hop 0.
constrains:
- domain/knowledge-base/search-item
---

## Description

None.

=== rules/knowledge-base/matched-item-hop-zero.log
---
entries:
- field: statement
  unstated: No node said what hop an item the search matched directly carries, beside expansion-hop for expanded links.
  decided: Hop 0.
  why: The search service sets hop 0 on every matched node and fragment item, and expansion-hop starts its count at 1 for the first link.
---

=== rules/knowledge-base/matched-node-gains-only-aliases
---
type: invariant
statement: A node proposal resolved to an existing knowledge node adds each of its admitted aliases to that node and never its proposed name.
constrains:
- domain/knowledge-base/knowledge-node
- domain/knowledge-base/node-alias
---

## Description

None.

=== rules/knowledge-base/matched-node-requires-provenance
---
type: policy
statement: A knowledge node a search matches surfaces as a search item only when it holds provenance.
constrains:
- domain/knowledge-base/knowledge-node
- domain/knowledge-base/search-item
---

## Description

None.

=== rules/knowledge-base/matched-node-requires-provenance.log
---
entries:
- field: statement
  unstated: No node said whether a matched knowledge node without provenance surfaces in a search.
  decided: It does not surface.
  why: The search service skips a matched node holding no provenance, the same way expanded-link-requires-provenance skips a link.
---

=== rules/knowledge-base/merge-check-order
---
type: invariant
statement: A merge is checked for a node merged into itself, then for an absent survivor, an absent absorbed node, a deleted survivor, a deleted absorbed node, a survivor that is not active, an absorbed node not in the status its operation expects and nodes of different node types, and is refused at the first check it fails.
constrains:
- domain/knowledge-base/entity-match-resolution
- domain/knowledge-base/node-merge
---

## Description

None.

=== rules/knowledge-base/merge-compresses-paths
---
type: policy
statement: A merge makes every knowledge node merged into the absorbed node name the survivor instead.
constrains:
- domain/knowledge-base/entity-match-resolution
- domain/knowledge-base/node-merge
- domain/knowledge-base/knowledge-node
---

## Description

None.

=== rules/knowledge-base/merge-copies-aliases
---
type: policy
statement: A merge gives the survivor, as kind alias with its run and creation time, each alias of the absorbed node whose normalized form the survivor does not hold, and leaves the absorbed node its own aliases.
constrains:
- domain/knowledge-base/entity-match-resolution
- domain/knowledge-base/node-merge
- domain/knowledge-base/knowledge-node
- domain/knowledge-base/node-alias
- domain/knowledge-base/alias-kind
---

## Description

None.

=== rules/knowledge-base/merge-counts-what-it-changed
---
type: invariant
statement: A merge counts the knowledge links and node attributes it moved, the aliases it copied and the knowledge nodes it made name the survivor.
constrains:
- domain/knowledge-base/merge-counts
---

## Description

None.

=== rules/knowledge-base/merge-into-requires-target
---
type: invariant
statement: An entity-match resolution deciding merge-into MUST name a target knowledge node.
constrains:
- domain/knowledge-base/entity-match-resolution
- domain/knowledge-base/entity-match-decision
---

## Description

None.

=== rules/knowledge-base/merge-marks-absorbed-merged
---
type: policy
statement: A merge marks the absorbed knowledge node merged into the survivor.
constrains:
- domain/knowledge-base/entity-match-resolution
- domain/knowledge-base/node-merge
- domain/knowledge-base/knowledge-node
- domain/knowledge-base/node-status
---

## Description

None.

=== rules/knowledge-base/merge-repoints-assertions
---
type: policy
statement: A merge moves to the survivor every knowledge link whose source or target is the absorbed node and every node attribute of the absorbed node, whatever their status.
constrains:
- domain/knowledge-base/entity-match-resolution
- domain/knowledge-base/node-merge
- domain/knowledge-base/knowledge-node
- domain/knowledge-base/knowledge-link
- domain/knowledge-base/node-attribute
consistency: eventual
---

## Description

None.

=== rules/knowledge-base/merge-requires-same-node-type
---
type: invariant
statement: A merge MUST join two knowledge nodes of one node type.
constrains:
- domain/knowledge-base/entity-match-resolution
- domain/knowledge-base/node-merge
- domain/knowledge-base/knowledge-node
---

## Description

None.

=== rules/knowledge-base/merge-survivor-active
---
type: invariant
statement: The knowledge node a merge keeps MUST be active.
constrains:
- domain/knowledge-base/entity-match-resolution
- domain/knowledge-base/node-merge
- domain/knowledge-base/knowledge-node
- domain/knowledge-base/node-status
---

## Description

None.

=== rules/knowledge-base/merged-node-names-survivor
---
type: invariant
statement: A knowledge node names the knowledge node it was merged into exactly when its status is merged.
constrains:
- domain/knowledge-base/knowledge-node
- domain/knowledge-base/node-status
---

## Description

None.

=== rules/knowledge-base/merged-node-read-as-itself
---
type: invariant
statement: A node read and an attribute-key history answer a merged knowledge node as itself and do not follow it to the knowledge node it was merged into.
constrains:
- domain/knowledge-base/knowledge-node
- domain/knowledge-base/graph-read
---

## Description

None.

=== rules/knowledge-base/metrics-assertion-counts
---
type: invariant
statement: A curation metrics uncertain count and disputed count are the numbers of knowledge links and node attributes whose effective status is uncertain and disputed respectively.
constrains:
- domain/knowledge-base/curation-metrics
- domain/knowledge-base/effective-status
---

## Description

None.

=== rules/knowledge-base/metrics-disputed-queue-count
---
type: invariant
statement: A curation metrics disputed queue count is the number of distinct source node, target node and link type combinations of disputed knowledge links plus the number of distinct node and attribute key combinations of disputed node attributes.
constrains:
- domain/knowledge-base/curation-metrics
---

## Description

None.

=== rules/knowledge-base/metrics-disputed-queue-count.log
---
entries:
- field: statement
  unstated: The material counts the disputed queue for the metrics by source, target and link type whatever the link type, while its queue lists one entry per dispute scope; the two differ for a dispute between links to different targets.
  decided: The disputed queue count is the number of entries the disputed queue holds.
  why: The count is named after the queue, and the owner reads it as how many disputes await a decision.
- field: statement
  unstated: A judgment shows the metric counting distinct source, target and link type combinations of disputed links and distinct node and key combinations of disputed attributes.
  decided: The count is those distinct combinations of disputed links plus those of disputed attributes.
  why: The owner decided the source's behavior is the truth, and it groups that way.
---

=== rules/knowledge-base/metrics-review-counts
---
type: invariant
statement: A curation metrics needs-review count and entity-match queue count are both the number of knowledge nodes in status needs-review.
constrains:
- domain/knowledge-base/curation-metrics
- domain/knowledge-base/node-status
---

## Description

None.

=== rules/knowledge-base/model-refusal-skips-chunk
---
type: invariant
statement: A chunk the model declines to read is skipped without failing the LLM run.
constrains:
- domain/knowledge-base/llm-run
---

## Description

None.

=== rules/knowledge-base/multi-current-attribute-keys
---
type: invariant
statement: The catalog attribute keys that allow multiple current values are exactly email and phone of Person.
constrains:
- domain/knowledge-base/attribute-key
---

## Description

None.

=== rules/knowledge-base/name-normalization
---
type: invariant
statement: Entity resolution, the node listing, alias admission and the node layer's approximate match compare names after lower-casing them, removing their accents, trimming them and collapsing their inner whitespace.
constrains:
- domain/knowledge-base/node-alias
---

## Description

None.

=== rules/knowledge-base/name-normalization.log
---
entries:
- field: statement
  unstated: The material says entity resolution compares normalized names without saying what normalizing does.
  decided: Lower-casing, removing accents, trimming and collapsing inner whitespace.
  why: The material names the normalization as the database's own, and one normalization for every name comparison keeps resolution and alias matching from disagreeing about the same name.
---

=== rules/knowledge-base/new-assertion
---
type: policy
statement: A link or attribute proposal that meets no current assertion records a new assertion that supersedes nothing.
constrains:
- domain/knowledge-base/proposal
- domain/knowledge-base/knowledge-link
- domain/knowledge-base/node-attribute
consistency: eventual
---

## Description

None.

=== rules/knowledge-base/new-assertion-status-from-confidence
---
type: policy
statement: A knowledge link or node attribute recorded by a proposal other than a dispute is active when the proposal's confidence is at least 0.75 and uncertain when it is at least 0.40 and below 0.75.
constrains:
- domain/knowledge-base/proposal
- domain/knowledge-base/knowledge-link
- domain/knowledge-base/node-attribute
- domain/knowledge-base/assertion-status
consistency: eventual
---

## Description

None.

=== rules/knowledge-base/new-assertion-status-from-confidence.log
---
entries:
- field: consistency
  unstated: The material does not say how this rule holds across the separate records it changes.
  decided: eventual
  why: Each case of this rule concerns one knowledge link or one node attribute and never both, so no reader depends on the two changing together.
---

=== rules/knowledge-base/new-assertion.log
---
entries:
- field: consistency
  unstated: The material does not say how this rule holds across the separate records it changes.
  decided: eventual
  why: Each case of this rule concerns one knowledge link or one node attribute and never both, so no reader depends on the two changing together.
---

=== rules/knowledge-base/new-node-aliases
---
type: invariant
statement: A newly created knowledge node holds its proposed name as its canonical alias and each of its admitted aliases as an alias.
constrains:
- domain/knowledge-base/knowledge-node
- domain/knowledge-base/node-alias
- domain/knowledge-base/alias-kind
---

## Description

None.

=== rules/knowledge-base/no-candidate-creates-active-node
---
type: invariant
statement: A node proposal that no active knowledge node of its node type reaches at a similarity of 0.55 creates an active knowledge node as created-new.
constrains:
- domain/knowledge-base/proposal
- domain/knowledge-base/knowledge-node
- domain/knowledge-base/node-resolution
- domain/knowledge-base/node-status
---

## Description

None.

=== rules/knowledge-base/no-document-context-before-v5
---
type: invariant
statement: Under prompt version v4 or any earlier prompt version, an extraction makes no preliminary reading of the whole document and records no document context and no document context status.
constrains:
- domain/knowledge-base/llm-run
- domain/knowledge-base/document-context
- domain/knowledge-base/document-context-status
---

## Description

None.

=== rules/knowledge-base/no-document-context-before-v5.log
---
entries:
- field: statement
  unstated: The preliminary reading and the context status recorded on a run are stated only under prompt version v5 and later, and no node said what an extraction under v4 or an earlier version does about them.
  decided: Under prompt version v4 or any earlier prompt version, an extraction makes no preliminary reading of the whole document and records no document context and no document context status.
  why: The material puts the preliminary reading into the new prompt version v5 and describes the earlier extraction as reading each chunk alone. A run made under an earlier version should repeat the behavior of that version. Both run attributes are optional, so a run under v4 can simply have neither, and no status value has to be invented for "not applicable".
---

=== rules/knowledge-base/node-item-shows-match
---
type: invariant
statement: A knowledge node search item at hop 0 carries whether the node layer matched it exactly or approximately, and the similarity of an approximate match.
constrains:
- domain/knowledge-base/search-item
- domain/knowledge-base/node-match
---

## Description

None.

=== rules/knowledge-base/node-item-summary
---
type: invariant
statement: A node search item's summary is the knowledge node's canonical name.
constrains:
- domain/knowledge-base/search-item
---

## Description

None.

=== rules/knowledge-base/node-layer-approximate-match
---
type: invariant
statement: The node layer matches a knowledge node approximately when it does not match it exactly and one of its aliases at least 5 characters long once normalized has a word similarity of at least 0.6 to the query text.
constrains:
- domain/knowledge-base/search-layer
- domain/knowledge-base/knowledge-node
- domain/knowledge-base/node-match
---

## Description

None.

=== rules/knowledge-base/node-layer-matches-through-aliases
---
type: policy
statement: The node layer matches a knowledge node exactly when the lexical parse of the query text matches any one of its aliases.
constrains:
- domain/knowledge-base/search-layer
- domain/knowledge-base/knowledge-node
---

## Description

None.

=== rules/knowledge-base/node-layer-skips-merged-and-deleted
---
type: policy
statement: The node layer never matches a knowledge node whose status is merged or deleted.
constrains:
- domain/knowledge-base/search-layer
- domain/knowledge-base/knowledge-node
---

## Description

None.

=== rules/knowledge-base/node-listing-by-status
---
type: invariant
statement: A node listing holds only knowledge nodes of the status its filter names, or active ones when it names none.
constrains:
- domain/knowledge-base/node-filter
- domain/knowledge-base/knowledge-node
- domain/knowledge-base/node-status
---

## Description

None.

=== rules/knowledge-base/node-listing-name-prefix
---
type: invariant
statement: A node listing that names a name prefix holds only knowledge nodes one of whose aliases, compared as a name, matches the prefix compared as a name followed by any text, a percent sign in the prefix standing for any text and an underscore for any one character.
constrains:
- domain/knowledge-base/node-filter
- domain/knowledge-base/knowledge-node
- domain/knowledge-base/node-alias
---

## Description

None.

=== rules/knowledge-base/node-listing-name-prefix.log
---
entries:
- field: statement
  unstated: The material shows a percent sign or an underscore in a node listing's name prefix acting as a wildcard, without saying whether a prefix is read literally.
  decided: A name prefix is read literally.
  why: A name prefix is the start of a name the owner types, and its characters mean themselves.
- field: statement
  unstated: A judgment shows a node listing's name prefix compared with a pattern match in which a percent sign and an underscore are wildcards.
  decided: The prefix matches as a name followed by any text, a percent sign standing for any text and an underscore for any one character.
  why: The owner decided the source's behavior is the truth, and it reads those two characters as wildcards.
---

=== rules/knowledge-base/node-listing-one-entry-per-node
---
type: invariant
statement: A node listing holds each knowledge node once, however many of its aliases match.
constrains:
- domain/knowledge-base/node-filter
- domain/knowledge-base/knowledge-node
---

## Description

None.

=== rules/knowledge-base/node-listing-order
---
type: invariant
statement: A node listing orders knowledge nodes by canonical name and then by identity.
constrains:
- domain/knowledge-base/node-filter
- domain/knowledge-base/knowledge-node
---

## Description

None.

=== rules/knowledge-base/node-listing-total-before-pagination
---
type: invariant
statement: A node listing's total counts every matching knowledge node before the page is cut.
constrains:
- domain/knowledge-base/node-filter
- domain/knowledge-base/page
---

## Description

None.

=== rules/knowledge-base/node-merge-absorbs-active-node
---
type: invariant
statement: A node merge MUST absorb an active knowledge node.
constrains:
- domain/knowledge-base/node-merge
- domain/knowledge-base/knowledge-node
- domain/knowledge-base/node-status
---

## Description

None.

=== rules/knowledge-base/node-merge-records-curation-action
---
type: policy
statement: An accepted node merge records one curation action of kind merge-nodes on target kind node at the absorbed node's identity, with its reason as the reason and the survivor's identity as the payload.
constrains:
- domain/knowledge-base/node-merge
- domain/knowledge-base/curation-action
- domain/knowledge-base/curation-action-kind
- domain/knowledge-base/curation-target-kind
---

## Description

None.

=== rules/knowledge-base/node-name-length
---
type: invariant
statement: A node proposal's name and each of its aliases MUST hold between 1 and 500 characters.
constrains:
- domain/knowledge-base/proposal
---

## Description

None.

=== rules/knowledge-base/node-never-merged-into-itself
---
type: invariant
statement: A knowledge node is never merged into itself.
constrains:
- domain/knowledge-base/knowledge-node
---

## Description

None.

=== rules/knowledge-base/node-read-alias-order
---
type: invariant
statement: A node read lists its knowledge node's canonical alias first and its other aliases after it in alphabetical order.
constrains:
- domain/knowledge-base/knowledge-node
- domain/knowledge-base/node-alias
- domain/knowledge-base/alias-kind
---

## Description

None.

=== rules/knowledge-base/node-read-alias-order.log
---
entries:
- field: statement
  unstated: The material orders a node's aliases by kind and then by alias without settling which kind comes first, since the order follows how the kinds are declared rather than their spelling.
  decided: The canonical alias comes first, followed by the other aliases in alphabetical order.
  why: The canonical alias is the name the node is known by, so it heads the list of its names.
---

=== rules/knowledge-base/node-read-attribute-order
---
type: invariant
statement: A node read orders its knowledge node's attributes by attribute key name, then by recording time, then by identity.
constrains:
- domain/knowledge-base/node-attribute
- domain/knowledge-base/graph-read
---

## Description

None.

=== rules/knowledge-base/node-read-excludes-uncertain-on-request
---
type: invariant
statement: A node read that leaves out uncertain items shows no node attribute whose status is uncertain.
constrains:
- domain/knowledge-base/node-view
- domain/knowledge-base/node-attribute
---

## Description

None.

=== rules/knowledge-base/node-read-warns-attribute-without-provenance
---
type: policy
statement: A node read logs a warning for each attribute of the node that is not deleted and has no provenance.
constrains:
- domain/knowledge-base/graph-read
- domain/knowledge-base/node-attribute
- domain/knowledge-base/provenance
consistency: eventual
---

## Description

None.

=== rules/knowledge-base/node-read-warns-attribute-without-provenance.log
---
entries:
- field: statement
  unstated: The material says a graph read shows an attribute without provenance with an empty list, and says nothing of whether the read reports such an attribute as an anomaly or which attributes it reports.
  decided: A node read logs a warning for each attribute that is not deleted and has no provenance; deleted attributes are not reported.
  why: The delivered read already warns only for attributes outside the deleted state, and an attribute without provenance is the anomaly the provenance requirement exists to prevent, so a read that shows one silently would hide it.
---

=== rules/knowledge-base/node-surfaces-only-with-accepted-mention
---
type: policy
statement: A matched knowledge node surfaces only when at least one accepted information fragment mentions one of its aliases.
constrains:
- domain/knowledge-base/knowledge-node
- domain/knowledge-base/information-fragment
- domain/knowledge-base/search-item
consistency: eventual
---

## Description

None.

=== rules/knowledge-base/node-surfaces-only-with-accepted-mention.log
---
entries:
- field: consistency
  unstated: The material does not say how this read holds across the separate records it combines.
  decided: eventual
  why: The records it combines are written independently and never change in one transaction, so a read reflects each as last committed.
---

=== rules/knowledge-base/node-type-filter-in-catalog
---
type: invariant
statement: A node listing or attribute-key listing that names a node type the catalog does not hold is refused.
constrains:
- domain/knowledge-base/node-filter
- domain/knowledge-base/node-type
---

## Description

None.

=== rules/knowledge-base/node-type-in-catalog
---
type: invariant
statement: A node proposal MUST name a node type the catalog holds.
constrains:
- domain/knowledge-base/proposal
- domain/knowledge-base/node-type
---

## Description

None.

=== rules/knowledge-base/node-type-listing-order
---
type: invariant
statement: The node-type listing orders node types by name.
constrains:
- domain/knowledge-base/node-type
---

## Description

None.

=== rules/knowledge-base/node-type-name-unique
---
type: invariant
statement: No two node types hold the same name.
constrains:
- domain/knowledge-base/node-type
---

## Description

None.

=== rules/knowledge-base/node-view-defaults
---
type: invariant
statement: A node read that omits an option names no as-of date, does not ask for in-effect-only items and includes uncertain items.
constrains:
- domain/knowledge-base/node-view
---

## Description

None.

=== rules/knowledge-base/non-expanding-search-walks-no-graph
---
type: invariant
statement: A search query that does not expand walks no part of the knowledge graph.
constrains:
- domain/knowledge-base/search-query
---

## Description

None.

=== rules/knowledge-base/omitted-change-hint-is-none
---
type: invariant
statement: A link proposal that states no change hint carries the change hint none.
constrains:
- domain/knowledge-base/proposal
- domain/knowledge-base/change-hint
---

## Description

None.

=== rules/knowledge-base/omitted-change-hint-is-none.log
---
entries:
- field: statement
  unstated: The re-affirmation rule speaks of hint none and no node says a missing hint is none.
  decided: A link proposal stating no change hint carries none.
  why: The judge read the default in the link proposal schema, and the attribute schema was not read.
---

=== rules/knowledge-base/one-canonical-alias
---
type: invariant
statement: A knowledge node holds at most one canonical alias.
constrains:
- domain/knowledge-base/knowledge-node
- domain/knowledge-base/node-alias
- domain/knowledge-base/alias-kind
---

## Description

None.

=== rules/knowledge-base/one-current-attribute-per-functional-key
---
type: invariant
statement: A knowledge node holds at most one current node attribute that is not disputed of an attribute key that does not allow multiple current values.
constrains:
- domain/knowledge-base/node-attribute
- domain/knowledge-base/assertion-status
---

## Description

None.

=== rules/knowledge-base/one-current-attribute-per-functional-key.log
---
entries:
- field: statement
  unstated: The material has a dispute record a second current assertion beside the one it disputes while a duplicate guard keeps one current assertion per node and type, without saying whether the guard spares disputed assertions; the two decide differently for the new assertion of a dispute.
  decided: At most one current assertion that is not disputed; disputed assertions are exempt.
  why: A dispute exists to hold both conflicting assertions until curation settles it.
---

=== rules/knowledge-base/one-current-attribute-per-value
---
type: invariant
statement: A knowledge node holds at most one current node attribute that is not disputed of one attribute key with one value.
constrains:
- domain/knowledge-base/node-attribute
- domain/knowledge-base/assertion-status
---

## Description

None.

=== rules/knowledge-base/one-current-attribute-per-value.log
---
entries:
- field: statement
  unstated: The material has a dispute record a second current assertion beside the one it disputes while a duplicate guard keeps one current assertion per node and type, without saying whether the guard spares disputed assertions; the two decide differently for the new assertion of a dispute.
  decided: At most one current assertion that is not disputed; disputed assertions are exempt.
  why: A dispute exists to hold both conflicting assertions until curation settles it.
---

=== rules/knowledge-base/one-current-link-per-functional-type
---
type: invariant
statement: A source knowledge node holds at most one current knowledge link that is not disputed of a link type that does not allow multiple current links.
constrains:
- domain/knowledge-base/knowledge-link
- domain/knowledge-base/assertion-status
---

## Description

None.

=== rules/knowledge-base/one-current-link-per-functional-type.log
---
entries:
- field: statement
  unstated: The material has a dispute record a second current assertion beside the one it disputes while a duplicate guard keeps one current assertion per node and type, without saying whether the guard spares disputed assertions; the two decide differently for the new assertion of a dispute.
  decided: At most one current assertion that is not disputed; disputed assertions are exempt.
  why: A dispute exists to hold both conflicting assertions until curation settles it.
---

=== rules/knowledge-base/one-current-link-per-target
---
type: invariant
statement: A source knowledge node holds at most one current knowledge link that is not disputed of one link type to one target knowledge node.
constrains:
- domain/knowledge-base/knowledge-link
- domain/knowledge-base/assertion-status
---

## Description

None.

=== rules/knowledge-base/one-current-link-per-target.log
---
entries:
- field: statement
  unstated: The material has a dispute record a second current assertion beside the one it disputes while a duplicate guard keeps one current assertion per node and type, without saying whether the guard spares disputed assertions; the two decide differently for the new assertion of a dispute.
  decided: At most one current assertion that is not disputed; disputed assertions are exempt.
  why: A dispute exists to hold both conflicting assertions until curation settles it.
---

=== rules/knowledge-base/original-input-length
---
type: invariant
statement: A raw information's original input MUST NOT exceed 10,485,760 UTF-16 code units.
constrains:
- domain/knowledge-base/raw-information
---

## Description

None.

=== rules/knowledge-base/orphaned-fragment
---
type: invariant
statement: An information fragment is orphaned when its status is proposed and no provenance cites it.
constrains:
- domain/knowledge-base/information-fragment
- domain/knowledge-base/fragment-status
- domain/knowledge-base/provenance
---

## Description

None.

=== rules/knowledge-base/page-defaults
---
type: invariant
statement: A search, accepted-fragment listing, node listing or review queue listing page that omits its limit returns 20 items and one that omits its offset starts at 0.
constrains:
- domain/knowledge-base/page
- domain/knowledge-base/review-queue-filter
---

## Description

None.

=== rules/knowledge-base/page-defaults.log
---
entries:
- field: statement
  unstated: The standing node gives every page a default limit of 20, while the material's tool-call listing defaults its page to 50; the two decide differently for a tool-call listing that omits its limit.
  decided: The default of 20 holds for search and the accepted-fragment listing, and the tool-call listing defaults to 50.
  why: The tool-call listing's default is stated in its own request schema.
---

=== rules/knowledge-base/page-limit-bounds
---
type: invariant
statement: A page's limit MUST be between 1 and 100.
constrains:
- domain/knowledge-base/page
---

## Description

None.

=== rules/knowledge-base/page-offset-non-negative
---
type: invariant
statement: A page's offset MUST be at least 0.
constrains:
- domain/knowledge-base/page
---

## Description

None.

=== rules/knowledge-base/pdf-blocks-at-form-feeds
---
type: invariant
statement: A pdf's content is cut into blocks at every form feed, the form feed belonging to no block and an empty span between two form feeds forming none.
constrains:
- domain/knowledge-base/raw-information
- domain/knowledge-base/source-type
---

## Description

None.

=== rules/knowledge-base/point-reads-answer-any-status
---
type: policy
statement: A read of one knowledge link or node attribute by identity answers it whatever its status or validity.
constrains:
- domain/knowledge-base/graph-read
- domain/knowledge-base/knowledge-link
- domain/knowledge-base/node-attribute
consistency: eventual
---

## Description

None.

=== rules/knowledge-base/prefer-one-outcome
---
type: policy
statement: A dispute resolution deciding prefer-one makes its winner active and marks every other item deleted with its supersession time stamped, leaving each validity as it was.
constrains:
- domain/knowledge-base/dispute-resolution
- domain/knowledge-base/assertion-status
- domain/knowledge-base/knowledge-link
- domain/knowledge-base/node-attribute
consistency: eventual
---

## Description

None.

=== rules/knowledge-base/prefer-one-requires-winner
---
type: invariant
statement: A dispute resolution deciding prefer-one MUST name a winner among its items.
constrains:
- domain/knowledge-base/dispute-resolution
- domain/knowledge-base/dispute-decision
---

## Description

None.

=== rules/knowledge-base/prompt-version-known
---
type: invariant
statement: An extraction's prompt version MUST be one of the prompt versions the system holds.
constrains:
- domain/knowledge-base/llm-run
- domain/knowledge-base/prompt-version
---

## Description

None.

=== rules/knowledge-base/proposal-confidence-range
---
type: invariant
statement: A proposal's confidence MUST be between 0 and 1 inclusive.
constrains:
- domain/knowledge-base/proposal
---

## Description

None.

=== rules/knowledge-base/proposal-meets-current-assertion
---
type: policy
statement: A link or attribute proposal meets the current assertion of its node and its link type or attribute key when that type does not allow multiple current assertions, and the current assertion of its node, its type and its target or value when it does.
constrains:
- domain/knowledge-base/proposal
- domain/knowledge-base/knowledge-link
- domain/knowledge-base/node-attribute
consistency: eventual
---

## Description

None.

=== rules/knowledge-base/proposal-meets-current-assertion.log
---
entries:
- field: consistency
  unstated: The material does not say how this rule holds across the separate records it changes.
  decided: eventual
  why: Each case of this rule concerns one knowledge link or one node attribute and never both, so no reader depends on the two changing together.
---

=== rules/knowledge-base/proposal-requires-running-run
---
type: invariant
statement: A proposal is taken only within an LLM run whose status is running.
constrains:
- domain/knowledge-base/proposal
- domain/knowledge-base/llm-run
- domain/knowledge-base/run-status
---

## Description

None.

=== rules/knowledge-base/proposal-run-checks-first
---
type: invariant
statement: A proposal is checked for a well-formed request, then for an existing LLM run, then for a running one, before any check of its own.
constrains:
- domain/knowledge-base/proposal
- domain/knowledge-base/llm-run
---

## Description

None.

=== rules/knowledge-base/prose-matching
---
type: policy
statement: Fragment text, chunk text and the fragments that mention a node are matched with Portuguese stemming and without regard to accents.
constrains:
- domain/knowledge-base/information-fragment
- domain/knowledge-base/raw-information
consistency: eventual
---

## Description

None.

=== rules/knowledge-base/prose-matching.log
---
entries:
- field: consistency
  unstated: The material does not say how this read holds across the separate records it combines.
  decided: eventual
  why: The records it combines are written independently and never change in one transaction, so a read reflects each as last committed.
---

=== rules/knowledge-base/provenance-accepts-proposed-fragment
---
type: invariant
statement: Recording a provenance to an information fragment whose status is proposed moves it to accepted, and leaves a fragment in any other status as it was.
constrains:
- domain/knowledge-base/information-fragment
- domain/knowledge-base/fragment-status
- domain/knowledge-base/provenance
---

## Description

None.

=== rules/knowledge-base/provenance-in-recording-order
---
type: invariant
statement: A link's or an attribute's provenance lists its fragments in the order that provenance was recorded.
constrains:
- domain/knowledge-base/provenance
---

## Description

None.

=== rules/knowledge-base/provenance-refused-after-compliance-deletion
---
type: policy
statement: A provenance read whose chain reaches any raw information deleted for compliance is refused.
constrains:
- domain/knowledge-base/provenance
- domain/knowledge-base/compliance-deletion
---

## Description

None.

=== rules/knowledge-base/provenance-requires-accepted-fragment
---
type: invariant
statement: A fragment's provenance is read only when the fragment's status is accepted.
constrains:
- domain/knowledge-base/information-fragment
---

## Description

None.

=== rules/knowledge-base/reaffirmation-consolidates
---
type: policy
statement: A proposal with change hint none that meets a current assertion with the same target or value re-affirms it whatever validity start it states, adding its provenance and changing nothing else about the assertion.
constrains:
- domain/knowledge-base/proposal
- domain/knowledge-base/knowledge-link
- domain/knowledge-base/node-attribute
- domain/knowledge-base/change-hint
consistency: eventual
---

## Description

None.

=== rules/knowledge-base/reaffirmation-consolidates.log
---
entries:
- field: statement
  unstated: The material has a multi-valued link re-affirm whatever its validity start while an attribute needs the same start, and a multi-valued proposal with change hint succession that meets a current assertion falls through to a duplicate and a system error; the two decide differently for a multi-valued attribute re-stated with another start.
  decided: For a type that allows multiple current assertions, a proposal with the same target or value that is not a correction re-affirms; for one that does not, it needs change hint none and the same validity start.
  why: A multi-valued type holds only one current assertion per target or value, so a second one with the same target or value can only consolidate into it.
- field: consistency
  unstated: The material does not say how this rule holds across the separate records it changes.
  decided: eventual
  why: Each case of this rule concerns one knowledge link or one node attribute and never both, so no reader depends on the two changing together.
- field: statement
  unstated: The earlier decision let a proposal that is not a correction re-affirm in a multi-current type, but a test shows a succession proposal meeting a current assertion with the same target there is not consolidated.
  decided: A proposal re-affirms only when its change hint is none and, for a type that does not allow multiple current assertions, it states the same validity start.
  why: The tests pass and state that only a hint of none re-affirms, so the earlier reading let a succession claim be absorbed as a repeat.
- field: statement
  unstated: A judgment shows an attribute needing the same validity start to re-affirm even where it allows multiple current values, while a link of such a type does not.
  decided: A proposal re-affirms only with change hint none and the same validity start, a link of a type allowing multiple current links excepted.
  why: The owner decided the source's behavior is the truth, and the attribute branch requires the same start.
- field: statement
  unstated: The owner now wants a same-target or same-value proposal with change hint none to re-affirm whatever validity start it states, reversing the earlier decision that required the same start, and did not say what happens to the start the assertion already holds.
  decided: Every proposal with change hint none and the same target or value re-affirms whatever its validity start, and the assertion keeps the start it holds, since only its provenance changes.
  why: A re-affirmation records no new assertion, so a proposal that adds nothing but evidence has no ground to move the start of the assertion it repeats.
- field: statement
  unstated: The owner did not say whether a proposal with change hint succession or correction and the same target or value still follows the rules it follows today.
  decided: 'Change hint none stays the only hint that re-affirms: a same-target succession still goes to dispute and a correction still supersedes the assertion it meets.'
  why: The owner asked to settle the different start only, and a hint other than none states a claim about the assertion that a repeat does not make.
---

=== rules/knowledge-base/recent-ingestion-latest-run
---
type: policy
statement: Each recent ingestion shows the most recently started LLM run of its raw information, or none when it has none.
constrains:
- domain/knowledge-base/raw-information
- domain/knowledge-base/llm-run
consistency: eventual
---

## Description

None.

=== rules/knowledge-base/recent-ingestion-latest-run.log
---
entries:
- field: consistency
  unstated: The material does not say how this read holds across the separate records it combines.
  decided: eventual
  why: The records it combines are written independently and never change in one transaction, so a read reflects each as last committed.
---

=== rules/knowledge-base/recent-ingestions-limit-bounds
---
type: invariant
statement: A recent-ingestions listing's limit MUST be between 1 and 50.
constrains:
- domain/knowledge-base/raw-information
---

## Description

None.

=== rules/knowledge-base/recent-ingestions-limit-default
---
type: invariant
statement: A recent-ingestions listing that omits its limit holds 10 entries.
constrains:
- domain/knowledge-base/raw-information
---

## Description

None.

=== rules/knowledge-base/recent-ingestions-order
---
type: invariant
statement: Recent ingestions list raw informations by reception time, newest first.
constrains:
- domain/knowledge-base/raw-information
---

## Description

None.

=== rules/knowledge-base/reception-time-is-recording-time
---
type: invariant
statement: A raw information's reception time is the moment it was recorded.
constrains:
- domain/knowledge-base/raw-information
---

## Description

None.

=== rules/knowledge-base/refused-curation-records-nothing
---
type: policy
statement: A refused or failed curation operation changes nothing and records no curation action.
constrains:
- domain/knowledge-base/curation-action
- domain/knowledge-base/entity-match-resolution
- domain/knowledge-base/node-merge
- domain/knowledge-base/dispute-resolution
- domain/knowledge-base/assertion-review
- domain/knowledge-base/assertion-correction
---

## Description

None.

=== rules/knowledge-base/refused-proposal-records-only-its-tool-call
---
type: invariant
statement: A refused or failed proposal records nothing but its tool call.
constrains:
- domain/knowledge-base/tool-call
- domain/knowledge-base/proposal
---

## Description

None.

=== rules/knowledge-base/reject-rate-by-code
---
type: invariant
statement: A curation metrics reject rate by code gives, for each error code a reject-item curation action's payload carries, the share of such actions among all curation actions.
constrains:
- domain/knowledge-base/curation-metrics
- domain/knowledge-base/reject-rate
- domain/knowledge-base/curation-action-kind
---

## Description

None.

=== rules/knowledge-base/rejection-and-correction-require-live-item
---
type: invariant
statement: A rejection or a correction MUST name an item whose status is active, uncertain or disputed.
constrains:
- domain/knowledge-base/assertion-review
- domain/knowledge-base/assertion-correction
- domain/knowledge-base/assertion-status
---

## Description

None.

=== rules/knowledge-base/rejection-deletes
---
type: policy
statement: A rejection marks its item deleted and stamps its supersession time.
constrains:
- domain/knowledge-base/assertion-review
- domain/knowledge-base/assertion-status
- domain/knowledge-base/knowledge-link
- domain/knowledge-base/node-attribute
consistency: eventual
---

## Description

None.

=== rules/knowledge-base/required-start-available
---
type: invariant
statement: A proposal for a link type or attribute key that requires a validity start MUST state one or come from a source with a document date or a reception date.
constrains:
- domain/knowledge-base/proposal
- domain/knowledge-base/raw-information
---

## Description

None.

=== rules/knowledge-base/required-start-fallback
---
type: invariant
statement: A proposal for a link type or attribute key that requires a validity start and states none keeps no start and no basis when its source has a document date, and takes the date the source was received with basis received when it has none.
constrains:
- domain/knowledge-base/proposal
- domain/knowledge-base/raw-information
- domain/knowledge-base/valid-from-basis
---

## Description

None.

=== rules/knowledge-base/required-start-fallback.log
---
entries:
- field: statement
  unstated: The material lets a proposal that needs a validity start pass with no start and no basis when its source has a document date, while one whose source has only a reception date takes that date with basis received; the two decide differently for whether a required start may stay empty.
  decided: It takes the document date with basis document or, failing that, the reception date with basis received.
  why: A type that requires a validity start is never left without one, and every start carries its justification.
- field: statement
  unstated: A judgment of the source shows a proposal that needs a validity start and states none leaving it empty, with no basis, when its source has a document date, and taking the reception date with basis received only when it has none.
  decided: It keeps no start and no basis when its source has a document date, and takes the reception date with basis received when it has none.
  why: The owner decided the source's behavior is the truth, and the earlier decision to fill the document date contradicted what the system does.
---

=== rules/knowledge-base/retry-counts-attempts
---
type: invariant
statement: Retrying an LLM run adds one to its attempts and clears its finish time while keeping its start time.
constrains:
- domain/knowledge-base/llm-run
---

## Description

None.

=== rules/knowledge-base/retry-keeps-document-context-status
---
type: invariant
statement: Retrying an LLM run leaves its document context status unchanged.
constrains:
- domain/knowledge-base/llm-run
- domain/knowledge-base/document-context-status
---

## Description

The retry itself neither sets nor clears the run's document context status.
What an extraction under the retried run records is governed by rules/knowledge-base/document-context-status-recorded.

=== rules/knowledge-base/retry-keeps-document-context-status.log
---
entries:
- field: statement
  unstated: The material has a retry reopen the run and reuse its recorded document context, without saying whether the retry keeps, clears or resets the run's recorded document context status.
  decided: Retrying an LLM run leaves its document context status unchanged.
  why: The status is the record of whether the run holds a context and why not, and the retry keeps the context, so it keeps the status as well. Clearing it would leave a reused context with no status, because rules/knowledge-base/document-context-status-recorded records produced only when a preliminary reading yields a context. An extraction that does read again after an earlier failure still records its own outcome under that rule.
---

=== rules/knowledge-base/retry-rejects-orphaned-fragments
---
type: policy
statement: Retrying an LLM run rejects every orphaned information fragment of that run.
constrains:
- domain/knowledge-base/llm-run
- domain/knowledge-base/information-fragment
- domain/knowledge-base/fragment-status
consistency: eventual
---

## Description

None.

=== rules/knowledge-base/retry-rejects-orphaned-fragments.log
---
entries:
- field: consistency
  unstated: The material does not say how this rule holds across the separate records it changes.
  decided: eventual
  why: The records it changes are separate aggregates, and no reader in the material depends on seeing them change together.
---

=== rules/knowledge-base/review-queue-kinds
---
type: invariant
statement: A review queue listing holds the entries of the queue its filter names, or of both queues when it names none.
constrains:
- domain/knowledge-base/review-queue-filter
- domain/knowledge-base/review-queue-kind
---

## Description

None.

=== rules/knowledge-base/review-queue-order
---
type: invariant
statement: A review queue listing orders entity-match entries before link disputes and link disputes before attribute disputes, entity-match entries by their node's creation time and then identity, and disputes by their creation time and then the identity of their earliest item.
constrains:
- domain/knowledge-base/review-queue-filter
---

## Description

None.

=== rules/knowledge-base/review-queue-page-windows-entries
---
type: invariant
statement: A review queue listing applies the page's limit and offset separately to its entity-match rows, one for each needs-review node and candidate, to its disputed knowledge links and to its disputed node attributes.
constrains:
- domain/knowledge-base/review-queue-filter
- domain/knowledge-base/page
---

## Description

None.

=== rules/knowledge-base/review-queue-page-windows-entries.log
---
entries:
- field: statement
  unstated: The material applies the page's limit and offset separately to three listings and, for the entity-match queue, to node-candidate rows, so a page can hold more entries than its limit and split one node's candidates across pages.
  decided: The page skips and returns whole entries in listing order.
  why: The owner reads the queue as a list of entries, and a limit that does not bound the entries returned does not page it.
- field: statement
  unstated: A judgment shows the page's limit and offset applied to each of the three underlying listings separately, the entity-match one over candidate rows.
  decided: The limit and offset apply separately to the entity-match rows, the disputed links and the disputed attributes.
  why: The owner decided the source's behavior is the truth, and it pages those three listings separately.
---

=== rules/knowledge-base/review-queue-total-before-pagination
---
type: invariant
statement: A review queue listing's total counts, before the page is cut, the knowledge nodes in needs review and the disputed knowledge links and node attributes of the kinds it lists, each disputed item counted once.
constrains:
- domain/knowledge-base/review-queue-filter
---

## Description

None.

=== rules/knowledge-base/review-queue-total-before-pagination.log
---
entries:
- field: statement
  unstated: The material totals the queue as the count of needs-review nodes plus the count of disputed links and of disputed attributes, which is not the number of entries the queue lists when a dispute holds several items.
  decided: The total counts every entry the listing holds before the page is cut.
  why: A total over a paged list counts what the pages hold, as every other listing of this specification does.
- field: statement
  unstated: A judgment shows the queue total counting needs-review nodes plus disputed links plus disputed attributes, one for each item.
  decided: The total counts the nodes in needs review and the disputed links and attributes of the kinds listed, each item once.
  why: The owner decided the source's behavior is the truth, and it counts items.
---

=== rules/knowledge-base/run-finish-time-when-closed
---
type: invariant
statement: An LLM run holds a finish time exactly when its status is not running.
constrains:
- domain/knowledge-base/llm-run
- domain/knowledge-base/run-status
---

## Description

None.

=== rules/knowledge-base/run-opens-with-one-attempt
---
type: invariant
statement: An LLM run is opened with 1 attempt.
constrains:
- domain/knowledge-base/llm-run
---

## Description

None.

=== rules/knowledge-base/run-start-is-opening-time
---
type: invariant
statement: An LLM run's start time is the moment it was opened.
constrains:
- domain/knowledge-base/llm-run
---

## Description

None.

=== rules/knowledge-base/search-excerpt-is-chunk-excerpt
---
type: invariant
statement: A search item's chunk excerpt is the part of the cited raw chunk's text that starts at the chunk's start offset in its source and is as long as the chunk.
constrains:
- domain/knowledge-base/search-item
- domain/knowledge-base/raw-chunk
---

## Description

None.

=== rules/knowledge-base/search-excerpt-is-chunk-excerpt.log
---
entries:
- field: statement
  unstated: The excerpt rule is scoped to graph reads and search is not a graph read.
  decided: A search item's excerpt is cut from the chunk's own text at its start offset, as long as the chunk.
  why: The search SQL applies the same cut in four queries.
---

=== rules/knowledge-base/search-excludes-compliance-deleted-sources
---
type: policy
statement: Search shows no information fragment whose raw information was deleted for compliance, neither as a search item nor as the support of one.
constrains:
- domain/knowledge-base/information-fragment
- domain/knowledge-base/compliance-deletion
consistency: eventual
---

## Description

None.

=== rules/knowledge-base/search-excludes-compliance-deleted-sources.log
---
entries:
- field: consistency
  unstated: The material does not say how this read holds across the separate records it combines.
  decided: eventual
  why: The records it combines are written independently and never change in one transaction, so a read reflects each as last committed.
- field: statement
  unstated: The first increment's material showed search surfacing an accepted fragment whose raw information has a compliance deletion, while the documentation says deleted content never recirculates and that compliance deletion marks the fragments deleted; the two decide differently for an accepted fragment of a compliance-deleted source.
  decided: Search shows no information fragment whose raw information was deleted for compliance, as an item or as support, replacing the node that said search keeps such fragments.
  why: The documentation states the business's intent for deleted sources, and the first material only described what the code does.
---

=== rules/knowledge-base/search-layer-candidate-cap
---
type: invariant
statement: A search keeps at most 200 candidates from each layer before ranking, and its total counts the candidates kept.
constrains:
- domain/knowledge-base/search-item
- domain/knowledge-base/page
---

## Description

None.

=== rules/knowledge-base/search-layer-candidate-cap.log
---
entries:
- field: statement
  unstated: No node holds the number of candidates each search layer contributes.
  decided: Each layer keeps at most 200 candidates before ranking, and the total counts those kept.
  why: The code applies the cap before the count, so the total is bounded by it.
---

=== rules/knowledge-base/search-layer-outside-set-refused
---
type: invariant
statement: A search query naming a layer that is not a search layer is refused.
constrains:
- domain/knowledge-base/search-query
- domain/knowledge-base/search-layer
---

## Description

None.

=== rules/knowledge-base/search-option-defaults
---
type: invariant
statement: 'A search option the query omits takes its default: every search layer, expansion on at depth 1, uncertain items included, and in-effect-only off.'
constrains:
- domain/knowledge-base/search-query
---

## Description

None.

=== rules/knowledge-base/search-query-length
---
type: invariant
statement: A search query's text MUST NOT exceed 1000 characters.
constrains:
- domain/knowledge-base/search-query
---

## Description

None.

=== rules/knowledge-base/search-query-must-parse
---
type: invariant
statement: A search query whose lexical parse yields no search term is refused.
constrains:
- domain/knowledge-base/search-query
---

## Description

None.

=== rules/knowledge-base/search-query-not-blank
---
type: invariant
statement: A search query's text MUST NOT be empty once surrounding whitespace is trimmed.
constrains:
- domain/knowledge-base/search-query
---

## Description

None.

=== rules/knowledge-base/search-ranking
---
type: invariant
statement: Search items are ranked with every item the search reached only through knowledge nodes it matched approximately after all the others, and within each group by score descending, then by recording time descending with an information fragment counting as recorded at its creation time and a knowledge node counting as never recorded and so after every knowledge link and information fragment of equal score, then by identifier ascending.
constrains:
- domain/knowledge-base/search-item
---

## Description

None.

=== rules/knowledge-base/search-ranking.log
---
entries:
- field: statement
  unstated: The material ranks a knowledge node matched only approximately below every knowledge node matched exactly, but says nothing of fragments, of other items, or of links expansion reaches from it.
  decided: Every item the search reached only through approximately matched knowledge nodes ranks after all the others, then by score within each group.
  why: A link reached from a misspelled name would otherwise outrank an exact match whenever its decayed similarity beat a low full-text rank.
- field: statement
  unstated: The statement counts a knowledge node as never recorded in a most-recent-first order, but no node and no intake material says whether a never-recorded item comes after or before every knowledge link and information fragment with the same score.
  decided: A knowledge node comes after every knowledge link and information fragment with the same score.
  why: An item with no recording time is never more recent than an item that has one, so in a most-recent-first order it comes last. The delivered search service already ranks nodes this way, because it gives a node a recording time of zero before sorting most recent first.
- field: statement
  unstated: The ranking breaks ties of equal score by recording time, but an information fragment declares no recording time, only a creation time and a supersession time, so no node says which time a fragment item is ordered by.
  decided: An information fragment search item counts as recorded at its information fragment's creation time.
  why: The creation time is the only required time an information fragment declares and the moment the fragment entered the store, so it plays the part a knowledge link's recording time plays. The search service already orders fragment items by it, through f.created_at in search.repository.ts and recordedAtTs from created_at in search.service.ts.
---

=== rules/knowledge-base/search-total-before-pagination
---
type: invariant
statement: A search's total counts every search item before the page is cut.
constrains:
- domain/knowledge-base/search-item
- domain/knowledge-base/page
---

## Description

None.

=== rules/knowledge-base/short-block-one-chunk
---
type: invariant
statement: A block of at most 4000 code points is one raw chunk.
constrains:
- domain/knowledge-base/raw-chunk
---

## Description

None.

=== rules/knowledge-base/single-current-link-types
---
type: invariant
statement: The catalog link types that do not allow multiple current links are exactly reports_to, part_of and located_in.
constrains:
- domain/knowledge-base/link-type
---

## Description

None.

=== rules/knowledge-base/source-status-active-or-deleted
---
type: invariant
statement: A raw information's status and each of its raw chunks' status is active or deleted.
constrains:
- domain/knowledge-base/raw-information
- domain/knowledge-base/raw-chunk
- domain/knowledge-base/node-status
---

## Description

None.

=== rules/knowledge-base/source-status-active-or-deleted.log
---
entries:
- field: statement
  unstated: The material types a raw information's and a raw chunk's status with all four node statuses and gives needs-review and merged no meaning for either.
  decided: A raw information and its raw chunks are only ever active or deleted.
  why: Nothing reviews or merges a source, and the only change a source undergoes is its deletion for compliance.
---

=== rules/knowledge-base/speaker-line
---
type: invariant
statement: A speaker line is a line that, after optional leading whitespace and an optional time stamp opened by [ or ( and closed by ] or ) holding h:mm, hh:mm, h:mm:ss or hh:mm:ss followed by whitespace, starts with one or two words of the letters A to Z, a to z and À to ÿ, digits or underscores separated by one whitespace character and followed by a colon and a whitespace character.
constrains:
- domain/knowledge-base/raw-information
---

## Description

None.

=== rules/knowledge-base/speaker-line.log
---
entries:
- field: statement
  unstated: A judgment of the source shows a speaker line accepting any opening bracket with any closing bracket around the time stamp, seconds on either form, and the letters A to Z, a to z and À to ÿ, which the node did not list.
  decided: The time stamp is opened by [ or ( and closed by ] or ) holding h:mm, hh:mm, h:mm:ss or hh:mm:ss, and a word holds the letters A to Z, a to z and À to ÿ, digits or underscores.
  why: The owner decided the source's behavior is the truth, and a chunker that splits on a line the node denies is a different chunker.
---

=== rules/knowledge-base/start-requiring-attribute-keys
---
type: invariant
statement: The catalog attribute keys that require a validity start are exactly the temporal ones other than email and phone of Person and website of Organization.
constrains:
- domain/knowledge-base/attribute-key
---

## Description

None.

=== rules/knowledge-base/start-requiring-link-types
---
type: invariant
statement: The catalog link types that require a validity start are exactly the temporal ones other than delivered_to.
constrains:
- domain/knowledge-base/link-type
---

## Description

None.

=== rules/knowledge-base/stated-start-requires-basis
---
type: invariant
statement: A proposal or a correction that states a validity start MUST state its basis.
constrains:
- domain/knowledge-base/proposal
- domain/knowledge-base/valid-from-basis
- domain/knowledge-base/corrected-values
---

## Description

None.

=== rules/knowledge-base/strong-candidate-resolves
---
type: invariant
statement: A node proposal with no exact alias resolves as matched-existing to the one active knowledge node of its node type whose similarity is at least 0.85, when no other active knowledge node of that type reaches 0.55.
constrains:
- domain/knowledge-base/proposal
- domain/knowledge-base/knowledge-node
- domain/knowledge-base/node-resolution
---

## Description

None.

=== rules/knowledge-base/succession-before-previous-start
---
type: policy
statement: A succession whose closing date falls on or before the validity start of the assertion it closes supersedes that assertion without giving it a validity end.
constrains:
- domain/knowledge-base/knowledge-link
- domain/knowledge-base/node-attribute
consistency: eventual
---

## Description

None.

=== rules/knowledge-base/succession-before-previous-start.log
---
entries:
- field: consistency
  unstated: The material does not say how this rule holds across the separate records it changes.
  decided: eventual
  why: Each case of this rule concerns one knowledge link or one node attribute and never both, so no reader depends on the two changing together.
---

=== rules/knowledge-base/succession-closes-previous
---
type: policy
statement: A proposal for a type that does not allow multiple current assertions that meets a current assertion with a different target or value, and either has change hint succession or cites a fragment that signals succession, closes that assertion as superseded and records a new assertion that names it as the one it supersedes.
constrains:
- domain/knowledge-base/proposal
- domain/knowledge-base/knowledge-link
- domain/knowledge-base/node-attribute
- domain/knowledge-base/change-hint
- domain/knowledge-base/assertion-status
consistency: eventual
---

## Description

None.

=== rules/knowledge-base/succession-closes-previous.log
---
entries:
- field: consistency
  unstated: The material does not say how this rule holds across the separate records it changes.
  decided: eventual
  why: Each case of this rule concerns one knowledge link or one node attribute and never both, so no reader depends on the two changing together.
---

=== rules/knowledge-base/succession-closing-date
---
type: policy
statement: A succession gives the assertion it closes a validity end at the new assertion's validity start, or at today when the new assertion has none.
constrains:
- domain/knowledge-base/knowledge-link
- domain/knowledge-base/node-attribute
consistency: eventual
---

## Description

None.

=== rules/knowledge-base/succession-closing-date.log
---
entries:
- field: consistency
  unstated: The material does not say how this rule holds across the separate records it changes.
  decided: eventual
  why: Each case of this rule concerns one knowledge link or one node attribute and never both, so no reader depends on the two changing together.
---

=== rules/knowledge-base/succession-signal
---
type: invariant
statement: An information fragment signals succession when its text contains, in any letter case, deixou de, passou a, novo, nova, substituiu, substituido, substituido por, succeeded or replaced.
constrains:
- domain/knowledge-base/information-fragment
---

## Description

None.

=== rules/knowledge-base/summary-counts-orphaned-fragments
---
type: policy
statement: An LLM run's summary counts the orphaned information fragments of that run.
constrains:
- domain/knowledge-base/llm-run
- domain/knowledge-base/run-summary
- domain/knowledge-base/information-fragment
consistency: eventual
---

## Description

None.

=== rules/knowledge-base/summary-counts-orphaned-fragments.log
---
entries:
- field: consistency
  unstated: The material does not say how this read holds across the separate records it combines.
  decided: eventual
  why: The records it combines are written independently and never change in one transaction, so a read reflects each as last committed.
---

=== rules/knowledge-base/summary-counts-tool-calls
---
type: invariant
statement: An LLM run's summary counts its tool calls by validation outcome, counting zero for an outcome no tool call has.
constrains:
- domain/knowledge-base/run-summary
- domain/knowledge-base/tool-call
- domain/knowledge-base/validation-outcome
---

## Description

None.

=== rules/knowledge-base/temporal-attribute-keys
---
type: invariant
statement: The temporal catalog attribute keys are exactly deadline, start_date, status_text and budget of Project, event_date and end_date of Event, email and phone of Person, website of Organization, and status, priority and due_date of Task.
constrains:
- domain/knowledge-base/attribute-key
---

## Description

None.

=== rules/knowledge-base/temporal-filters-apply-to-expansion-only
---
type: policy
statement: The as-of date and the in-effect-only switch filter the knowledge links expansion reaches and never the fragment, node or chunk layers.
constrains:
- domain/knowledge-base/search-query
- domain/knowledge-base/knowledge-link
---

## Description

None.

=== rules/knowledge-base/temporal-link-types
---
type: invariant
statement: Every catalog link type is temporal except belongs_to_category, related_to and concerns.
constrains:
- domain/knowledge-base/link-type
---

## Description

None.

=== rules/knowledge-base/tool-call-listing-order
---
type: invariant
statement: An LLM run's tool calls are listed by recording time ascending, then by identifier ascending.
constrains:
- domain/knowledge-base/tool-call
---

## Description

None.

=== rules/knowledge-base/tool-call-page-defaults
---
type: invariant
statement: A tool-call listing page that omits its limit holds 50 tool calls and one that omits its offset starts at 0.
constrains:
- domain/knowledge-base/page
- domain/knowledge-base/tool-call
---

## Description

None.

=== rules/knowledge-base/tool-call-total-before-pagination
---
type: invariant
statement: A tool-call listing's total counts every tool call of the LLM run before the page is cut.
constrains:
- domain/knowledge-base/tool-call
---

## Description

None.

=== rules/knowledge-base/tool-call-validation-outcome
---
type: invariant
statement: A tool call's validation outcome is rejected for a refused proposal, error for a failed one, needs-review for a node proposal resolved as needing review, the proposal's outcome for a taken link or attribute proposal, and accepted otherwise.
constrains:
- domain/knowledge-base/tool-call
- domain/knowledge-base/validation-outcome
- domain/knowledge-base/node-resolution
---

## Description

None.

=== rules/knowledge-base/traversal-check-order
---
type: invariant
statement: A traversal is checked for its depth, then for each named link type in the order given, then for an existing starting knowledge node, then for one not deleted.
constrains:
- domain/knowledge-base/traversal-request
- domain/knowledge-base/knowledge-node
---

## Description

None.

=== rules/knowledge-base/traversal-defaults
---
type: invariant
statement: A traversal that omits an option follows links from either end, goes one hop deep, names no as-of date, does not ask for in-effect-only links and follows every link type.
constrains:
- domain/knowledge-base/traversal-request
- domain/knowledge-base/traversal-direction
---

## Description

None.

=== rules/knowledge-base/traversal-direction
---
type: policy
statement: A traversal follows a knowledge link from its source when its direction is out, from its target when it is in, and from either end when it is both.
constrains:
- domain/knowledge-base/traversal-request
- domain/knowledge-base/traversal-direction
- domain/knowledge-base/knowledge-link
---

## Description

None.

=== rules/knowledge-base/traversal-drops-merge-self-loops
---
type: policy
statement: A traversal leaves out a knowledge link whose two distinct ends become one knowledge node through merge substitution.
constrains:
- domain/knowledge-base/traversal-request
- domain/knowledge-base/knowledge-link
- domain/knowledge-base/knowledge-node
consistency: eventual
---

## Description

None.

=== rules/knowledge-base/traversal-expands-live-nodes
---
type: invariant
statement: A traversal expands no knowledge node it reached that is deleted or merged.
constrains:
- domain/knowledge-base/traversal-request
- domain/knowledge-base/knowledge-node
---

## Description

None.

=== rules/knowledge-base/traversal-expands-live-nodes.log
---
entries:
- field: statement
  unstated: A judgment of the source shows a traversal expanding its starting node whatever the starting node's status, and refusing a deleted start earlier, while it filters only the nodes it reached.
  decided: A traversal expands no knowledge node it reached that is deleted or merged.
  why: The owner decided the source's behavior is the truth, and the filter the source applies is on reached nodes only.
---

=== rules/knowledge-base/traversal-link-once
---
type: policy
statement: A traversal shows each knowledge link once, at the first hop that reached it.
constrains:
- domain/knowledge-base/traversal-request
- domain/knowledge-base/knowledge-link
---

## Description

None.

=== rules/knowledge-base/traversal-link-score
---
type: policy
statement: A knowledge link a traversal reaches at hop h scores 0.5 raised to the power h.
constrains:
- domain/knowledge-base/traversal-request
- domain/knowledge-base/knowledge-link
---

## Description

None.

=== rules/knowledge-base/traversal-lists-reached-nodes
---
type: invariant
statement: A traversal lists every knowledge node it starts from or reaches that is not merged, deleted ones included.
constrains:
- domain/knowledge-base/traversal-request
- domain/knowledge-base/knowledge-node
---

## Description

None.

=== rules/knowledge-base/traversal-lists-reached-nodes.log
---
entries:
- field: statement
  unstated: The material leaves a merged starting node whose survivor is missing or deleted out of a traversal's nodes while its starting node identity still names it.
  decided: A traversal always lists its starting knowledge node.
  why: The starting node identity a traversal answers must resolve within the nodes that same answer lists.
- field: statement
  unstated: A judgment of the source shows a traversal leaving out a merged starting node whose survivor is missing or deleted, which the earlier decision had it always list.
  decided: A traversal lists every knowledge node it starts from or reaches that is not merged, deleted ones included.
  why: The owner decided the source's behavior is the truth, and listing only nodes that are not merged applies one test to the start and to what it reaches.
---

=== rules/knowledge-base/traversal-merged-start
---
type: invariant
statement: A traversal from a merged knowledge node starts from the knowledge node it was merged into when that node is held and not deleted.
constrains:
- domain/knowledge-base/traversal-request
- domain/knowledge-base/knowledge-node
---

## Description

None.

=== rules/knowledge-base/traversal-order
---
type: policy
statement: A traversal lists knowledge nodes in the order it first reached them with its starting node first, and knowledge links in the order it first reached them with outgoing links before incoming ones within a hop.
constrains:
- domain/knowledge-base/traversal-request
- domain/knowledge-base/knowledge-node
- domain/knowledge-base/knowledge-link
consistency: eventual
---

## Description

None.

=== rules/knowledge-base/traversal-skips-deleted-links
---
type: policy
statement: A traversal never follows a knowledge link whose status is deleted.
constrains:
- domain/knowledge-base/traversal-request
- domain/knowledge-base/knowledge-link
---

## Description

None.

=== rules/knowledge-base/traversal-substitutes-merged-ends
---
type: policy
statement: A traversal shows a knowledge link that ends at a merged knowledge node as ending at the knowledge node it was merged into.
constrains:
- domain/knowledge-base/traversal-request
- domain/knowledge-base/knowledge-link
- domain/knowledge-base/knowledge-node
consistency: eventual
---

## Description

None.

=== rules/knowledge-base/turn-blocks
---
type: invariant
statement: A chat's or a transcript's content starts a new block at every speaker line after its first line.
constrains:
- domain/knowledge-base/raw-information
- domain/knowledge-base/source-type
---

## Description

None.

=== rules/knowledge-base/uncertain-items-excluded-on-request
---
type: invariant
statement: A search query that does not include uncertain items surfaces no search item whose status is uncertain.
constrains:
- domain/knowledge-base/search-query
- domain/knowledge-base/search-item
---

## Description

None.

=== rules/knowledge-base/undivided-sources
---
type: invariant
statement: The content of meeting minutes, of an article and of any other source is one block.
constrains:
- domain/knowledge-base/raw-information
- domain/knowledge-base/source-type
---

## Description

None.

=== rules/knowledge-base/unknown-link-type-refused
---
type: policy
statement: A search query that expands, or a traversal, that names a link type the catalog does not hold is refused.
constrains:
- domain/knowledge-base/search-query
- domain/knowledge-base/traversal-request
- domain/knowledge-base/link-type
---

## Description

None.

=== rules/knowledge-base/unused-resolution-fields-ignored
---
type: invariant
statement: An entity-match resolution deciding keep-separate ignores its target node, and a dispute resolution ignores a winner or periods its decision does not use, though a value of either that is malformed is still refused.
constrains:
- domain/knowledge-base/entity-match-resolution
- domain/knowledge-base/dispute-resolution
---

## Description

None.

=== rules/knowledge-base/unused-resolution-fields-ignored.log
---
entries:
- field: statement
  unstated: Whether an unused winner or periods value is format-checked
  decided: A malformed value of either is still refused
  why: The request schema validates both fields whatever the decision, so a malformed unused field is refused, not ignored.
---

=== rules/knowledge-base/validity-start-before-end
---
type: invariant
statement: A proposal, an adjusted period or a correction that states both a validity start and a validity end MUST state the start strictly before the end.
constrains:
- domain/knowledge-base/proposal
- domain/knowledge-base/adjusted-period
- domain/knowledge-base/corrected-values
---

## Description

None.

=== rules/knowledge-base/word-similarity
---
type: invariant
statement: An alias's word similarity to a query text is the highest trigram similarity between the normalized alias and any continuous stretch of the normalized query text.
constrains:
- domain/knowledge-base/node-alias
---

## Description

None.

=== rules/owner-access/access-token-is-held-before-the-owner-moves-on
---
type: invariant
statement: The owner MUST hold the access token before being taken to the destination.
constrains:
- domain/owner-access/sign-in-attempt
---

## Description

None.

=== rules/owner-access/any-other-sign-in-failure-is-unknown
---
type: invariant
statement: A sign-in failure no other failure kind claims MUST be classified as unknown.
constrains:
- domain/owner-access/sign-in-attempt
- domain/owner-access/sign-in-failure-kind
---

## Description

None.

=== rules/owner-access/missing-session-or-token-is-a-session-failure
---
type: invariant
statement: A sign-in failure MUST be classified as session when the identity provider holds no session for the owner or answers the token request without a usable access token.
constrains:
- domain/owner-access/sign-in-attempt
- domain/owner-access/sign-in-failure-kind
---

## Description

None.

=== rules/owner-access/network-looking-failure-is-a-network-failure
---
type: invariant
statement: A sign-in failure that did not come out of the exchange with the identity provider MUST be classified as network when it is a type error or its message mentions a failed fetch or the network.
constrains:
- domain/owner-access/sign-in-attempt
- domain/owner-access/sign-in-failure-kind
---

## Description

None.

=== rules/owner-access/network-looking-failure-is-a-network-failure.log
---
entries:
- field: statement
  unstated: The material does not say whether a failure that did not come out of the exchange with the identity provider is read by its message or only by its type.
  decided: It is a network failure when it is a type error or its message mentions a failed fetch or the network, and a failure the exchange raised is never read by its message.
  why: The code reads the message only after every recognised failure of the exchange has been classified by its cause, so the message reading applies to the remainder and nothing else.
---

=== rules/owner-access/rejected-credentials-are-a-credential-failure
---
type: invariant
statement: A sign-in failure MUST be classified as credential when the identity provider rejects the credentials.
constrains:
- domain/owner-access/sign-in-attempt
- domain/owner-access/sign-in-failure-kind
---

## Description

None.

=== rules/owner-access/sign-in-attempt-in-flight-accepts-no-second-submission
---
type: invariant
statement: A sign-in attempt in flight MUST NOT accept a second submission.
constrains:
- domain/owner-access/sign-in-attempt
---

## Description

None.

=== rules/owner-access/sign-in-attempt-in-flight-accepts-no-second-submission.log
---
entries:
- field: statement
  unstated: The material says the fields and the submit button are disabled while an attempt is in flight, and does not say what that protects.
  decided: The condition is that an attempt in flight accepts no second submission.
  why: Disabling the controls is the means, and what the owner can no longer do is submit again before the first attempt ends, which is the obligation a reader can hold the screen to.
---

=== rules/owner-access/sign-in-destination-defaults-to-chat
---
type: invariant
statement: After a successful sign-in the owner MUST be taken to the destination the address requested in its redirect parameter, or to /chat when the address requested none or one that is not a valid sign-in destination.
constrains:
- domain/owner-access/sign-in-attempt
- domain/owner-access/sign-in-destination
---

## Description

None.

=== rules/owner-access/sign-in-destination-defaults-to-chat.log
---
entries:
- field: statement
  unstated: The address names the requested destination in a parameter the rule does not name.
  decided: The parameter is named redirect.
  why: The running sign-in reads exactly that parameter and anything building a sign-in address has to match it.
---

=== rules/owner-access/sign-in-destination-is-a-local-path
---
type: invariant
statement: A sign-in destination MUST be a path of at most 2048 characters that starts with a single slash and contains neither a scheme separator nor a backslash.
constrains:
- domain/owner-access/sign-in-destination
---

## Description

None.

=== rules/owner-access/sign-in-failure-shows-only-its-kind-message
---
type: invariant
statement: A sign-in failure MUST be shown to the owner only as the message of its failure kind, never as a message of the identity provider.
constrains:
- domain/owner-access/sign-in-attempt
- domain/owner-access/sign-in-failure-kind
---

## Description

None.

=== rules/owner-access/sign-in-failure-stays-until-the-next-attempt
---
type: invariant
statement: The failure kind of a sign-in attempt MUST stay shown until the owner submits the next attempt.
constrains:
- domain/owner-access/sign-in-attempt
- domain/owner-access/sign-in-failure-kind
---

## Description

None.

=== rules/owner-access/sign-in-requires-password
---
type: invariant
statement: A sign-in attempt MUST NOT be sent to the identity provider while its password is empty.
constrains:
- domain/owner-access/sign-in-attempt
---

## Description

None.

=== rules/owner-access/sign-in-requires-valid-email
---
type: invariant
statement: A sign-in attempt MUST NOT be sent to the identity provider while its e-mail is not a valid e-mail address.
constrains:
- domain/owner-access/sign-in-attempt
---

## Description

None.

=== rules/owner-access/token-is-requested-after-credentials-accepted
---
type: invariant
statement: The access token MUST be requested only after the identity provider has accepted the credentials.
constrains:
- domain/owner-access/sign-in-attempt
---

## Description

None.

=== rules/owner-access/unreachable-provider-is-a-network-failure
---
type: invariant
statement: A sign-in failure MUST be classified as network when the identity provider cannot be reached.
constrains:
- domain/owner-access/sign-in-attempt
- domain/owner-access/sign-in-failure-kind
---

## Description

None.

=== scenarios/application-shell/a-401-is-refreshed-once
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

=== scenarios/application-shell/an-empty-rename-sends-nothing
---
subject: rules/application-shell/a-rename-sends-the-trimmed-title
given:
- "the owner is renaming a conversation"
- "the field holds only spaces"
when:
- "the owner presses Enter"
then:
- "nothing is sent"
- "the field closes with no message"
---

## Description

A blank title is dropped silently.

=== scenarios/application-shell/an-expiring-token-redirects-to-sign-in
---
subject: rules/application-shell/the-guard-needs-a-fresh-token
given:
- "the access token expires in 20 seconds"
when:
- "the owner opens the curation address"
then:
- "the owner is sent to the sign-in address with the reason session_expired"
---

## Description

A token about to expire is not fresh.

=== scenarios/application-shell/unreachable-health-stays-verifying
---
subject: rules/application-shell/health-is-judged-by-the-database-field
given:
- "the back end is unreachable and no health answer was ever parsed"
when:
- "the footer asks for the health"
then:
- "the footer reads verificando…"
---

## Description

An unreachable back end never reads as banco inacessível.

=== scenarios/chat-workspace/escape-stops-a-streaming-turn
---
subject: rules/chat-workspace/escape-aborts-the-turn-from-anywhere
given:
- "a turn is streaming and focus is on the graph pane"
when:
- "the owner presses Escape"
then:
- "the turn is aborted"
---

## Description

Escape stops the turn even when focus is elsewhere.

=== scenarios/chat-workspace/failed-send-keeps-the-typed-text
---
subject: rules/chat-workspace/successful-send-empties-the-field
given:
- "the owner typed a message and the back end answers an error frame"
when:
- "the send resolves"
then:
- "the text field still holds the typed text"
---

## Description

A failed send costs the owner nothing they typed.

=== scenarios/chat-workspace/malformed-frame-is-skipped
---
subject: rules/chat-workspace/malformed-frames-are-skipped-silently
given:
- "the stream carries a text_delta frame whose data is not JSON between two good ones"
when:
- "the stream is read"
then:
- "the bad frame is skipped silently"
- "the good frames are applied"
---

## Description

One bad frame does not end the turn.

=== scenarios/chat-workspace/second-graph-delta-adds-to-the-first
---
subject: rules/chat-workspace/first-graph-delta-replaces-and-later-ones-add
given:
- "the pane holds the graph of the last turn"
- "two graph_delta frames with nodes arrive in the new turn"
when:
- "the second frame is applied"
then:
- "the first frame replaced the old graph"
- "the second was added onto it"
---

## Description

One turn builds one graph, replacing the old one only once.

=== scenarios/curation-workspace/changing-tab-counts-the-difference-as-new
---
subject: rules/curation-workspace/baseline-ignores-tab-changes
given:
- "the owner sees 3 entries on Tudo and the baseline is 3"
when:
- "the owner moves to a tab whose total is 5"
then:
- "the pill reads \"2 novos\""
---

## Description

The baseline does not follow the tab, so the pill can overstate.

=== scenarios/curation-workspace/keep-decision-waits-for-the-evidence
---
subject: rules/curation-workspace/every-decision-waits-for-the-evidence
given:
- "a dispute is open and its evidence was not viewed"
when:
- "the owner presses Manter em disputa"
then:
- "nothing is sent"
- "the hint \"Veja a evidência antes de decidir.\" is carried"
---

## Description

Even the harmless decision waits for the evidence.

=== scenarios/curation-workspace/merge-can-be-undone-within-five-seconds
---
subject: rules/curation-workspace/undo-restores-the-item-and-sends-nothing
given:
- "the owner merged an entity match and the undo toast is open"
when:
- "the owner undoes within five seconds"
then:
- "the item is back in the queue"
- "nothing was sent to the server"
---

## Description

A merge costs the owner nothing for five seconds.

=== scenarios/curation-workspace/one-high-similarity-candidate-shows-the-summary
---
subject: rules/curation-workspace/entity-match-shows-summary-for-one-high-similarity-candidate
given:
- "an entity-match entry has one candidate whose similarity is 0.93"
when:
- "the owner opens it"
then:
- "the panel shows the summary view with that candidate alone"
---

## Description

A single near-certain candidate gets the short view.

=== scenarios/curation-workspace/rejecting-five-items-asks-first
---
subject: rules/curation-workspace/rejecting-five-or-more-asks-first
given:
- "five uncertain items are selected"
when:
- "the owner presses Rejeitar 5"
then:
- "the bar asks \"Você está rejeitando 5 itens. Confirmar?\""
- "nothing is rejected yet"
---

## Description

A larger batch rejection asks before it acts.

=== scenarios/curation-workspace/second-destructive-decision-sends-the-first
---
subject: rules/curation-workspace/one-destructive-decision-waits-at-a-time
given:
- "a rejection is waiting for undo"
when:
- "the owner merges another entity match"
then:
- "the rejection is sent at once and its toast closes"
- "the merge now waits for undo"
---

## Description

Only one decision waits for undo, so the next one commits the one before.

=== scenarios/curation-workspace/stated-basis-without-a-fragment-cannot-be-saved
---
subject: rules/curation-workspace/save-is-disabled-without-a-stated-fragment
given:
- "the owner chose the basis stated and filled no fragment id"
when:
- "the owner looks at Salvar correção"
then:
- "the button is disabled"
---

## Description

A date the source states needs the fragment that states it.

=== scenarios/curation-workspace/upper-case-key-is-no-shortcut
---
subject: rules/curation-workspace/shortcut-letters-act-in-lower-case-only
given:
- "the curation screen listens and focus is not in a field"
when:
- "the owner presses Shift and j"
then:
- "the screen does not move to the next item"
---

## Description

Shift plus a shortcut letter does nothing.

=== scenarios/curation-workspace/vanished-item-is-not-restored
---
subject: rules/curation-workspace/vanished-item-is-not-restored
given:
- "a preference was sent after its undo window and the item was resolved elsewhere"
when:
- "the server answers BUSINESS_REVIEW_NOT_PENDING"
then:
- "the owner reads \"Já resolvido em outro lugar.\""
- "the item is not put back and the stale signal is raised"
---

## Description

An item someone else already resolved stays gone.

=== scenarios/graph-explorer/a-deleted-source-offers-no-retry
---
subject: rules/graph-explorer/an-origin-failure-is-an-alert-with-a-retry-unless-deleted
given:
- "the origin read fails with BUSINESS_RAW_INFORMATION_DELETED"
when:
- "the panel shows the failure"
then:
- "the alert reads that the original document was removed for compliance"
- "no retry is offered"
---

## Description

A removed source is final.

=== scenarios/graph-explorer/first-change-after-a-restore-is-not-saved
---
subject: rules/graph-explorer/a-change-saves-only-with-a-conversation-and-nodes
given:
- "a saved view was just restored for the active conversation"
when:
- "the first graph change with at least one node happens"
then:
- "nothing is saved"
- "the next change is saved after 800 milliseconds"
---

## Description

A restore does not write itself back.

=== scenarios/graph-explorer/reduced-motion-reveals-all-at-once
---
subject: rules/graph-explorer/reduced-motion-reveals-everything-at-once
given:
- "the owner prefers reduced motion"
- "four nodes are queued for reveal"
when:
- "the reveal step runs"
then:
- "all four nodes are revealed at once"
- "the pane becomes ready"
---

## Description

A reduced-motion owner gets no stagger.

=== scenarios/graph-explorer/unknown-neighbour-is-shown-by-its-id
---
subject: rules/graph-explorer/the-neighbour-is-the-other-end
given:
- "a relationship whose neighbour is missing from the answer's nodes"
when:
- "the relationships are shown"
then:
- "the neighbour is named by its id"
- "its type is empty"
---

## Description

A missing neighbour is not an error.

=== scenarios/ingest-workspace/conflicting-extraction-shows-the-failure
---
subject: rules/ingest-workspace/connection-drop-is-an-unconflicting-envelope
given:
- "the extraction of a new source is running"
- "the back end answers 409"
when:
- "the extraction call fails"
then:
- "the screen moves to the error phase"
- "the failure shows the code and the message of the answer"
---

## Description

A refusal for a conflict is a real answer, so it is shown.

=== scenarios/ingest-workspace/expired-token-is-refreshed-once-and-resent
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

=== scenarios/ingest-workspace/internal-error-during-extraction-polls-the-run
---
subject: rules/ingest-workspace/connection-drop-is-an-unconflicting-envelope
given:
- "the extraction of a new source is running"
- "the back end answers 500 with the code SYSTEM_INTERNAL_ERROR"
when:
- "the extraction call fails"
then:
- "no failure is shown"
- "the screen moves to polling and shows \"Verificando extração…\""
---

## Description

An internal error of the back end is treated as a lost connection, so the screen watches the run instead of failing.

=== scenarios/ingest-workspace/whitespace-only-content-is-ready
---
subject: rules/ingest-workspace/form-is-ready-with-content-and-source-type
given:
- "the content holds only spaces and a source type is selected"
when:
- "the form is read"
then:
- "the form is ready"
- "the phase is ready"
---

## Description

Content made only of spaces is content, so the form is ready.

=== scenarios/knowledge-base/acronym-in-source-is-admitted
---
subject: rules/knowledge-base/alias-admitted-only-from-source
given:
- a raw information whose content says "o Conselho Nacional de Desenvolvimento Científico (CNPq) aprovou o projeto"
- an LLM run over it holds no knowledge node of that name
when:
- a node proposal names "Conselho Nacional de Desenvolvimento Científico" with the alias "CNPq"
then:
- the knowledge node is created with the canonical alias "Conselho Nacional de Desenvolvimento Científico"
- it also holds the alias "CNPq"
involves:
- rules/knowledge-base/new-node-aliases
---

## Description

None.

=== scenarios/knowledge-base/admitted-acronym-resolves-later-proposal
---
subject: rules/knowledge-base/exact-alias-resolves
given:
- an active knowledge node holds the canonical alias "Conselho Nacional de Desenvolvimento Científico" and the alias "CNPq"
when:
- a later document's node proposal of the same node type names "CNPq"
then:
- the proposal resolves as matched-existing to that knowledge node
involves:
- rules/knowledge-base/alias-admitted-only-from-source
---

## Description

None.

=== scenarios/knowledge-base/alias-absent-from-source-not-admitted
---
subject: rules/knowledge-base/alias-admitted-only-from-source
given:
- a raw information whose content refers to a company only as "a estatal"
when:
- a node proposal in an LLM run over it names the alias "Petrobras"
then:
- the node proposal is taken and its resolution answered
- the alias "Petrobras" is not recorded on the knowledge node
- the answer lists "Petrobras" as not admitted, with the reason ALIAS_NOT_IN_SOURCE
involves:
- contracts/knowledge-base/ingestion
---

## Description

None.

=== scenarios/knowledge-base/context-links-later-mention
---
subject: rules/knowledge-base/document-context-read-first
given:
- a raw information of 3 chunks under prompt version v5
- chunk 1 says "o Diretor Financeiro, João Silva" and chunk 3 says "o Diretor aprovou o orçamento"
- the document context lists João Silva as a person the document also calls "o Diretor"
when:
- while reading chunk 3 the model proposes a node named "João Silva" and a fragment for the approval
then:
- the node proposal resolves to the knowledge node created while reading chunk 1
- the fragment is anchored to chunk 3
involves:
- rules/knowledge-base/extraction-reads-chunks-in-order
- rules/knowledge-base/extraction-anchors-to-read-chunk
---

## Description

None.

=== scenarios/knowledge-base/correct-name-matches-exactly
---
subject: rules/knowledge-base/node-layer-approximate-match
given:
- the knowledge base holds the knowledge nodes "Petrobras" and "Petrobrás Distribuidora", each with an accepted information fragment mentioning it
when:
- the owner searches for "petrobras"
then:
- both knowledge nodes are returned
- both items carry the match exact
involves:
- rules/knowledge-base/node-layer-matches-through-aliases
---

## Description

None.

=== scenarios/knowledge-base/directed-alias-admitted-without-source
---
subject: rules/knowledge-base/alias-admitted-only-from-source
given:
- a directed ingestion whose fragments never write the name "Petrobras"
when:
- one of its nodes states the alias "Petrobras"
then:
- the alias "Petrobras" is recorded on the knowledge node
involves:
- domain/knowledge-base/directed-ingestion
---

## Description

None.

=== scenarios/knowledge-base/email-without-blank-line-is-one-block
---
subject: rules/knowledge-base/email-quote-blocks
given:
- an email with no blank line, whose later lines are quoted
when:
- it is ingested
then:
- its header block never ends
- no quotation change starts a new block
- the whole email is one block
involves:
- rules/knowledge-base/email-header-block
---

## Description

None.

=== scenarios/knowledge-base/failed-context-reading-keeps-extracting
---
subject: rules/knowledge-base/failed-preliminary-reading-continues
given:
- a raw information of 3 chunks under prompt version v5
when:
- the preliminary reading answers a provider error
then:
- the 3 chunks are read
- the run completes
- the run records the document context status failed and holds no document context
involves:
- rules/knowledge-base/document-context-status-recorded
---

## Description

None.

=== scenarios/knowledge-base/form-feed-only-pdf-is-one-chunk
---
subject: rules/knowledge-base/contentless-blocks-single-chunk
given:
- a pdf whose content is only form feeds
when:
- it is ingested
then:
- its blocks hold nothing
- one raw chunk with index 0 spans the whole content
involves:
- rules/knowledge-base/pdf-blocks-at-form-feeds
---

## Description

None.

=== scenarios/knowledge-base/functional-link-dispute-resolved-by-preference
---
subject: rules/knowledge-base/dispute-scope
given:
- knowledge node Ana holds two disputed reports_to links, one to Bruno and one to Carla
- reports_to does not allow multiple current links
when:
- the owner resolves the dispute naming both links, deciding prefer-one with the link to Bruno as winner
then:
- the resolution is accepted
- the link to Bruno is active
- the link to Carla is deleted
- one curation action of kind resolve-dispute is recorded at the link to Bruno
involves:
- rules/knowledge-base/dispute-resolution-single-scope
- rules/knowledge-base/prefer-one-outcome
- rules/knowledge-base/dispute-resolution-records-curation-action
---

## Description

The two links compete for the same ground although their targets differ, because the link type admits a single current link.

=== scenarios/knowledge-base/go-live-date-is-the-value
---
subject: rules/knowledge-base/extraction-event-date-is-the-value
given:
- a document dated 2026-06-20 announces a go-live on 2026-08-01
when:
- an extraction under prompt version v2 or later reads it
then:
- the model is asked to propose event_date 2026-08-01 for the go-live
- the model is asked to give 2026-06-20 as that proposal's validity start with the basis document
involves:
- rules/knowledge-base/extraction-dates-events
- domain/knowledge-base/valid-from-basis
---

## Description

None.

=== scenarios/knowledge-base/held-content-under-another-model
---
subject: rules/knowledge-base/held-content-records-nothing
given:
- a raw information ingested with one model and its LLM run
when:
- the same content is ingested naming another model
then:
- no raw information, raw chunk or LLM run is recorded
- the answer is an internal failure
involves:
- contracts/knowledge-base/ingestion
---

## Description

None.

=== scenarios/knowledge-base/impossible-calendar-date-refused
---
subject: rules/knowledge-base/attribute-value-parses
given:
- an attribute key whose value type is date
when:
- an attribute proposal carries the value 2024-02-30
then:
- the proposal is refused
- no node attribute is recorded
---

## Description

None.

=== scenarios/knowledge-base/listing-for-unknown-source-is-empty
---
subject: contracts/knowledge-base/retrieval
given:
- no information fragment was produced by the named LLM run or drawn from the named raw information
when:
- the owner lists accepted fragments for that source
then:
- the listing is accepted
- the total is 0
- no entry is listed
---

## Description

None.

=== scenarios/knowledge-base/misspelled-name-inside-longer-query
---
subject: rules/knowledge-base/node-layer-approximate-match
given:
- the knowledge base holds the knowledge node "Petrobras", with an accepted information fragment mentioning it
when:
- the owner searches for "contrato Petrobrass"
then:
- the knowledge node "Petrobras" is returned with the match approximate
involves:
- rules/knowledge-base/word-similarity
---

## Description

None.

=== scenarios/knowledge-base/misspelled-name-matches-approximately
---
subject: rules/knowledge-base/node-layer-approximate-match
given:
- the knowledge base holds the knowledge node "Petrobras", with an accepted information fragment mentioning it
when:
- the owner searches for "Petrobrass"
then:
- the knowledge node "Petrobras" is returned as a search item at hop 0
- the item carries the match approximate and its similarity
involves:
- rules/knowledge-base/node-item-shows-match
---

## Description

None.

=== scenarios/knowledge-base/preliminary-reading-proposes-nothing
---
subject: domain/knowledge-base/document-context
given:
- a raw information of 3 chunks under prompt version v5
- the knowledge base holds nothing read from it
when:
- the preliminary reading yields a document context listing two entities
then:
- no proposal is made
- the knowledge base holds no knowledge node, information fragment, knowledge link or node attribute read from it until its first chunk is read
involves:
- rules/knowledge-base/document-context-read-first
---

## Description

None.

=== scenarios/knowledge-base/retried-run-reuses-context
---
subject: rules/knowledge-base/document-context-read-first
given:
- an LLM run under prompt version v5 that failed after producing its document context
when:
- the run is retried and its extraction runs again
then:
- no second preliminary reading is made
- each chunk is shown with the document context the run already held
---

## Description

None.

=== scenarios/knowledge-base/same-target-other-start-re-affirms
---
subject: rules/knowledge-base/reaffirmation-consolidates
given:
- a link type that does not allow multiple current links
- a current knowledge link of that type from node A to node B, valid from 2024-01-01
when:
- a proposal of that link type from A to B arrives with change hint none, valid from 2024-06-01
then:
- the proposal re-affirms the link
- the provenance of the proposal is added to the link
- no new link is recorded
- the link stays valid from 2024-01-01
involves:
- rules/knowledge-base/consolidation-precedence
- rules/knowledge-base/conflict-disputes
---

## Description

None.

=== scenarios/knowledge-base/same-target-succession-is-disputed
---
subject: rules/knowledge-base/conflict-disputes
given:
- a link type that does not allow multiple current links
- a current knowledge link of that type from node A to node B
when:
- a proposal of that link type from A to B arrives with change hint succession, citing no errata
then:
- the proposal does not re-affirm the link, because its change hint is not none
- it does not succeed the link, because its target is the same
- the current link is marked disputed
- a new link from A to B is recorded in status disputed
involves:
- rules/knowledge-base/consolidation-precedence
- rules/knowledge-base/reaffirmation-consolidates
- rules/knowledge-base/succession-closes-previous
---

## Description

None.

=== scenarios/knowledge-base/same-value-other-start-re-affirms
---
subject: rules/knowledge-base/reaffirmation-consolidates
given:
- an attribute key that does not allow multiple current values
- a current node attribute of that key holding the value V, valid from 2026-01-01
when:
- a proposal of that key for the same node arrives with change hint none, the value V and valid from 2026-03-01
then:
- the proposal re-affirms the attribute
- the provenance of the proposal is added to the attribute
- no new attribute is recorded
- the attribute stays valid from 2026-01-01
involves:
- rules/knowledge-base/consolidation-precedence
- rules/knowledge-base/conflict-disputes
---

## Description

None.

=== scenarios/knowledge-base/short-alias-never-matches-approximately
---
subject: rules/knowledge-base/node-layer-approximate-match
given:
- the knowledge base holds the knowledge node "CNPq", whose only alias is "CNPq"
when:
- the owner searches for "CNPJ"
then:
- the knowledge node "CNPq" is not returned
---

## Description

None.

=== scenarios/knowledge-base/single-chunk-document-has-no-context
---
subject: rules/knowledge-base/document-context-status-recorded
given:
- a raw information of 1 chunk under prompt version v5
when:
- the extraction runs
then:
- no preliminary reading is made
- the run records the document context status single-chunk
---

## Description

None.

=== scenarios/knowledge-base/stop-words-only-query
---
subject: rules/knowledge-base/search-query-must-parse
given:
- the owner writes a search query made only of stop words
when:
- the owner searches with it
then:
- the search is refused
- no search item is returned
---

## Description

The query has characters, so it passes the length and blank checks, and still yields no search term.

=== scenarios/knowledge-base/synonym-without-shared-characters-finds-nothing
---
subject: contracts/knowledge-base/retrieval
given:
- the knowledge base holds knowledge about "Projeto Apollo" and nothing that shares characters with "Iniciativa Lunar"
when:
- the owner searches for "Iniciativa Lunar"
then:
- the search is accepted
- the total is 0
- no search item is returned
---

## Description

None.

=== scenarios/knowledge-base/unmatched-term-leaves-approximate-match
---
subject: rules/knowledge-base/node-layer-approximate-match
given:
- the knowledge base holds the knowledge node "Petrobras", with an accepted information fragment mentioning it, and no alias holding the word "contrato"
when:
- the owner searches for "contrato Petrobras"
then:
- the knowledge node "Petrobras" is returned with the match approximate
involves:
- rules/knowledge-base/node-layer-matches-through-aliases
---

## Description

None.

=== scenarios/owner-access/expired-session-notice-stays-beside-a-failure
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

=== scenarios/owner-access/external-destination-falls-back-to-chat
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

=== scenarios/owner-access/offline-fetch-error-is-a-network-failure
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

=== scenarios/owner-access/whitespace-only-password-is-sent
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
