---
contract_version: siegard-reconcile/8
title: Adoption of the frontend chat context
summary: The chat feature of the frontend is adopted as it stands and did not change; the owner states
  the source is the running system, and this reconciliation asks whether the specification written from
  its survey holds what each file carries.
target: frontend
files:
- path: src/features/chat/api/_request.ts
  change: Sends the chat requests to the back end with the access token and maps their failures to the
    chat's own failure codes.
- path: src/features/chat/api/_transforms.ts
  change: Declares the wire-to-domain mapping of the conversation, message and usage answers and the date
    parsing.
- path: src/features/chat/api/chat-stream.ts
  change: Opens the streamed chat turn and decodes its events into the turn's progress.
- path: src/features/chat/api/index.ts
  change: Re-exports the chat's data hooks.
- path: src/features/chat/api/keys.ts
  change: Declares the query keys of the conversation, message and usage reads.
- path: src/features/chat/api/use-cancel-turn.ts
  change: Cancels the turn in flight.
- path: src/features/chat/api/use-create-conversation.ts
  change: Creates a conversation and refreshes the cached list.
- path: src/features/chat/api/use-delete-conversation.ts
  change: Deletes a conversation and refreshes the cached reads.
- path: src/features/chat/api/use-get-conversation-usage.ts
  change: Reads the usage of a conversation.
- path: src/features/chat/api/use-get-conversation.ts
  change: Reads one conversation's detail.
- path: src/features/chat/api/use-list-conversations.ts
  change: Reads the conversation list.
- path: src/features/chat/api/use-list-messages.ts
  change: Reads the messages of a conversation.
- path: src/features/chat/api/use-update-conversation.ts
  change: Renames or archives a conversation and refreshes the cached reads.
- path: src/features/chat/api/useSendMessage.ts
  change: Sends a message and drives the streamed turn, recording its outcome.
- path: src/features/chat/components/ChatStatusIndicator.tsx
  change: Shows the waiting hint for the state of the turn.
- path: src/features/chat/components/ChatWorkspace.tsx
  change: Hosts the chat screen and its conversation selection.
- path: src/features/chat/components/Composer.tsx
  change: Takes the owner's message and sends or cancels the turn.
- path: src/features/chat/components/Composer.types.ts
  change: Declares the props of the composer.
- path: src/features/chat/components/ConversationView.tsx
  change: Composes the message list, the usage and the composer of one conversation.
- path: src/features/chat/components/MessageStream.tsx
  change: Lists the messages of a conversation and the in-flight reply, with loading, error and empty
    states.
- path: src/features/chat/components/StreamingCursor.tsx
  change: Shows the cursor of a reply still streaming.
- path: src/features/chat/components/ToolCallChip/ToolCallChip.tsx
  change: Shows one tool call of the turn with its outcome.
- path: src/features/chat/components/ToolCallChip/ToolCallChip.types.ts
  change: Declares the props of the tool-call chip.
- path: src/features/chat/components/ToolCallChip/index.ts
  change: Re-exports the tool-call chip.
- path: src/features/chat/components/UsageBadge/UsageBadge.tsx
  change: Shows the usage totals of a conversation.
- path: src/features/chat/components/UsageBadge/UsageBadge.types.ts
  change: Declares the props of the usage badge.
- path: src/features/chat/components/UsageBadge/index.ts
  change: Re-exports the usage badge.
- path: src/features/chat/components/index.ts
  change: Re-exports the chat components.
- path: src/features/chat/state/chat-turn.ts
  change: 'Holds the turn in flight: its streamed text, tool calls, status and abort handle.'
- path: src/features/chat/types.ts
  change: Declares the chat's conversation, message, usage and tool-call types.
nodes:
- node: contracts/chat-workspace/bff-conversations
  conforms: true
  how: "src/features/chat/api/_request.ts: held at httpVoid, lines 45-99. This file holds only the delete-conversation\
    \ failure side of the node; the other operations sit in other files. — code: isAbort ? \"SYSTEM_ABORTED\"\
    \ : \"SYSTEM_NETWORK\", httpStatus: 0, message: isAbort ? \"Requisição cancelada.\" : \"Falha de rede\
    \ ao contactar o servidor.\"\nif (response.status === 204) return;\ntypeof errObj?.code === \"string\"\
    \ ? errObj.code : response.status >= 500 ? \"SYSTEM_UPSTREAM\" : \"SYSTEM_UNKNOWN\", httpStatus: response.status,\
    \ message: ... \"Algo deu errado. Tente novamente.\" : \"Erro desconhecido do servidor.\", details:\
    \ errObj?.details\nsrc/features/chat/api/_transforms.ts: held at This file holds the answer-reading\
    \ side of the contract: the wire interfaces `ConversationWire`, `ConversationListWire`, `ChatMessageWire`,\
    \ `MessageListWire`, `UsageWire` and `CancelWire`, and the transforms `toConversation`, `toConversationList`,\
    \ `toChatMessage`, `toMessageList` and `toUsageData`. The request side (URLs, headers, stream frames,\
    \ refusals) is not stated in this file and nothing here contradicts it. — export function toConversation(wire:\
    \ ConversationWire): Conversation {\n  return {\n    id: wire.id,\n    title: wire.title,\n    archivedAt:\
    \ wire.archived_at !== null ? new Date(wire.archived_at) : null,\n    createdAt: new Date(wire.created_at),\n\
    \  };\n}\nexport function toUsageData(wire: UsageWire): UsageData {\n  return {\n    messageCount:\
    \ wire.messages,\n    tokens_in: wire.tokens_in,\n    tokens_out: wire.tokens_out,\n    tool_calls:\
    \ wire.tool_calls,\n  };\n}\nsrc/features/chat/api/chat-stream.ts: held at the send-message stream\
    \ half in streamChat and extractPreStreamError. Request method, headers and error frames are held\
    \ here. The URL, the body, the Idempotency-Key and the other eight operations are held in other files.\
    \ — `method: \"POST\"`, `\"Content-Type\": \"application/json\"`, `Accept: \"text/event-stream\"`,\
    \ `code: \"SYSTEM_NETWORK\"`, `message: \"Falha de rede ao contactar o servidor.\"`, `code: \"SYSTEM_INVALID_RESPONSE\"\
    `, `message: \"Resposta do servidor sem corpo.\"`, `code: \"SYSTEM_UPSTREAM\"`, `message: \"Algo deu\
    \ errado. Tente novamente.\"`, `code: \"SYSTEM_UNKNOWN\"`, `message: \"Erro desconhecido do servidor.\"\
    `, `message: \"Falha de rede durante o streaming.\"`\nsrc/features/chat/api/use-cancel-turn.ts: held\
    \ at the mutationFn of useCancelTurn, lines 37-45 — return http<CancelWire>(\n  `/api/v1/conversations/${encodeURIComponent(conversationId)}/cancel`,\n\
    \  {\n    method: \"POST\",\n    headers: authHeader(),\n  },\n);\nsrc/features/chat/api/use-create-conversation.ts:\
    \ held at the mutationFn of useCreateConversation, lines 34-45. The shape of the conversation read\
    \ from the answer is declared in `_transforms` and `../types`, outside this file. — const body: CreateConversationVariables\
    \ = vars ?? {};\nconst wire = await http<ConversationWire>(\"/api/v1/conversations\", {\n  method:\
    \ \"POST\",\n  headers: {\n    ...authHeader(),\n    \"Content-Type\": \"application/json\",\n  },\n\
    \  body: JSON.stringify(body),\n});\nreturn toConversation(wire);\nsrc/features/chat/api/use-delete-conversation.ts:\
    \ held at the `mutationFn` of useDeleteConversation, lines 36-41. It holds the request shape: DELETE,\
    \ id URL-encoded, no body, through the no-body helper. The refusal mapping (SYSTEM_ABORTED, SYSTEM_NETWORK,\
    \ the envelope, the 204-only success) is not in this file; it belongs to `httpVoid` in `_request.ts`,\
    \ which is outside the set. — await httpVoid(`/api/v1/conversations/${encodeURIComponent(id)}`, {\n\
    \  method: \"DELETE\",\n  headers: authHeader(),\n});\nsrc/features/chat/api/use-get-conversation-usage.ts:\
    \ held at the queryFn of useGetConversationUsage, lines 24-31. It holds the request half of read-conversation-usage:\
    \ the GET, the URL-encoded id and the `/usage` path. The reading of the answer (`messages` kept as\
    \ the message count) is delegated to `toUsageData` in `./_transforms`, outside this file. — const\
    \ wire = await http<UsageWire>(\n  `/api/v1/conversations/${encodeURIComponent(\n    conversationId\
    \ as string,\n  )}/usage`,\n  { method: \"GET\", headers: authHeader() },\n);\nreturn toUsageData(wire);\n\
    src/features/chat/api/use-get-conversation.ts: held at the queryFn of useGetConversation, lines 24-31\
    \ — const wire = await http<ConversationWire>(\n  `/api/v1/conversations/${encodeURIComponent(id as\
    \ string)}`,\n  { method: \"GET\", headers: authHeader() },\n);\nreturn toConversation(wire);\nsrc/features/chat/api/use-list-conversations.ts:\
    \ held at the queryFn of useListConversations (lines 45-51) together with buildQueryString (lines\
    \ 30-37), for the list-conversations operation — const wire = await http<ConversationListWire>(\n\
    \  `/api/v1/conversations${buildQueryString(params)}`,\n  { method: \"GET\", headers: authHeader()\
    \ },\n);\nreturn toConversationList(wire);\nsrc/features/chat/api/use-list-messages.ts: held at queryFn,\
    \ lines 41-49, and buildQueryString, lines 27-33. The items and next_before mapping is delegated to\
    \ toMessageList in ./_transforms, a file outside this set. — `/api/v1/conversations/${encodeURIComponent(\n\
    \    conversationId as string,\n  )}/messages${buildQueryString(params)}`,\n  { method: \"GET\", headers:\
    \ authHeader() },\nsrc/features/chat/api/use-update-conversation.ts: held at mutationFn, lines 40-56,\
    \ the update-conversation operation — `/api/v1/conversations/${encodeURIComponent(id)}`,\n{\n  method:\
    \ \"PATCH\",\n  headers: {\n    ...authHeader(),\n    \"Content-Type\": \"application/json\",\n  },\n\
    \  body: JSON.stringify(body),\n}\nreturn toConversation(wire);\nsrc/features/chat/api/useSendMessage.ts:\
    \ held at mutationFn lines 226-242, the URL, headers and body of the send; only the send-message request\
    \ is made in this file — `/api/v1/conversations/${encodeURIComponent(vars.conversationId)}/messages`\n\
    ...\n\"Idempotency-Key\": idempotencyKey,\n...\nif (vars.model !== undefined) body.model = vars.model;\n\
    src/features/chat/types.ts: held at Conversation, ChatMessage, ChatStopReason and UsageData declare\
    \ the shapes the requests are read into; the request construction itself is not in this file. — export\
    \ interface Conversation { readonly id: string; readonly title: string | null; readonly archivedAt:\
    \ Date | null; readonly createdAt: Date; }\nexport interface UsageData { readonly messageCount: number;\
    \ readonly tokens_in: number; readonly tokens_out: number; readonly tool_calls: number; }"
  encoded_at:
  - src/features/chat/api/_request.ts
  - src/features/chat/api/_transforms.ts
  - src/features/chat/api/chat-stream.ts
  - src/features/chat/api/use-cancel-turn.ts
  - src/features/chat/api/use-create-conversation.ts
  - src/features/chat/api/use-delete-conversation.ts
  - src/features/chat/api/use-get-conversation-usage.ts
  - src/features/chat/api/use-get-conversation.ts
  - src/features/chat/api/use-list-conversations.ts
  - src/features/chat/api/use-list-messages.ts
  - src/features/chat/api/use-update-conversation.ts
  - src/features/chat/api/useSendMessage.ts
  - src/features/chat/types.ts
- node: contracts/chat-workspace/chat-screen
  conforms: true
  how: "src/features/chat/components/ChatStatusIndicator.tsx: held at the COPY_THINKING and COPY_TOOL_PREFIX\
    \ constants and the label composition in the component body, lines 94-95 and 156-163. This is the\
    \ show-turn-progress hint only. The tool-chip rendering is not in this file. — const COPY_THINKING\
    \ = \"pensando…\";\nconst COPY_TOOL_PREFIX = \"consultando a memória…\";\nlabel =\n      active !==\
    \ null ? `${COPY_TOOL_PREFIX} (${active})` : COPY_TOOL_PREFIX;\nsrc/features/chat/components/Composer.tsx:\
    \ held at The compose-message operation is held across `ComposerSendBand` and `ArchivedBanner`. The\
    \ show-conversation, read-history, show-turn-progress and show-usage operations are not this file's.\
    \ — aria-label=\"Compositor de mensagem\"; const LABEL_TEXTAREA = \"Mensagem para o assistente\";\
    \ const ARIA_SEND = \"Enviar mensagem\"; const ARIA_STOP = \"Parar geração\"; const MSG_EMPTY = \"\
    Digite uma mensagem antes de enviar.\"; const MSG_TOO_LONG = \"A mensagem é muito longa. Reduza o\
    \ texto.\"; const ARCHIVED_BODY = \"Esta conversa está arquivada. Reative para enviar novas mensagens.\"\
    ; const ARCHIVED_ACTION = \"Reativar\";\nsrc/features/chat/components/ConversationView.tsx: held at\
    \ ConversationView renders the \"Conversa\" section in both branches. The empty branch carries the\
    \ no-active-conversation hint, and the active branch carries the \"Mensagens da conversa\" slot and\
    \ the \"Compositor de mensagem\" slot, lines 39-51 and 70-98. The archived banner, the composer fields,\
    \ the history states, turn progress and usage belong to MessageStream and Composer, not to this file.\
    \ — <section aria-label=\"Conversa\" ...> <p className=\"text-body text-body\">\n    Selecione ou\
    \ crie uma conversa para começar.\n  </p>\n... <div ... data-testid=\"message-stream-slot\" aria-label=\"\
    Mensagens da conversa\"> ...\n<div ... data-testid=\"composer-slot\" aria-label=\"Compositor de mensagem\"\
    >\nsrc/features/chat/components/MessageStream.tsx: held at the read-history part only. COPY_EMPTY,\
    \ COPY_ERROR, COPY_RETRY and LABEL_REGION, the loading branch, the error branch with ErrorBanner,\
    \ and the empty branch. Composer, usage, turn-progress chips and the archived banner are not in this\
    \ file. — const LABEL_REGION = \"Mensagens da conversa\";\nconst COPY_EMPTY = \"Nenhuma mensagem ainda.\
    \ Envie uma mensagem para começar.\";\nconst COPY_ERROR =\n  \"Não foi possível carregar o histórico.\
    \ Tente novamente.\";\nconst COPY_RETRY = \"Tentar novamente\";\nsrc/features/chat/components/ToolCallChip/ToolCallChip.tsx:\
    \ held at the STATUS_PENDING, STATUS_OK and STATUS_ERROR constants and statusLabel() (lines 38-46);\
    \ the ariaLabel template literal (line 51); the chip span's role and aria-label (lines 75-77); the\
    \ tool name and argsSummary rendering (lines 86-89) — const STATUS_PENDING = \"em andamento\";\nconst\
    \ STATUS_OK = \"concluído\";\nconst STATUS_ERROR = \"erro\";\nconst ariaLabel = `${tool} — ${status}`;\n\
    <span role=\"status\" aria-label={ariaLabel}\nsrc/features/chat/components/UsageBadge/UsageBadge.tsx:\
    \ held at buildAriaLabel (lines 41-51) and the role=\"status\" span's aria-label attribute (line 74)\
    \ — `Uso: ${tokensIn} tokens de entrada, ` + `${tokensOut} tokens de saída, ` + `${toolCalls} chamadas\
    \ de ferramenta`\nand aria-label={ariaLabel}"
  encoded_at:
  - src/features/chat/components/ChatStatusIndicator.tsx
  - src/features/chat/components/Composer.tsx
  - src/features/chat/components/ConversationView.tsx
  - src/features/chat/components/MessageStream.tsx
  - src/features/chat/components/ToolCallChip/ToolCallChip.tsx
  - src/features/chat/components/UsageBadge/UsageBadge.tsx
- node: domain/chat-workspace/chat-status
  conforms: false
  how: "src/features/chat/api/useSendMessage.ts, dispatchFrame, case \"tool_start\" (line 384), and the\
    \ header docblock line 29: actions.setChatStatus(\"tool_running\"); — The node spells this chat status\
    \ \"tool-running\", with a hyphen, and the code emits \"tool_running\", with an underscore. Whoever\
    \ reads the specification for the status value does not find the string the screen sets. The two spellings\
    \ are two decisions, and the next change to either one will not reach the other. The ChatStatus type\
    \ itself is declared in ../state/chat-turn, outside this file. This file is where the literal is set.\n\
    src/features/chat/state/chat-turn.ts, the ChatStatus union type, lines 51-56: export type ChatStatus\
    \ =\n  | \"idle\"\n  | \"thinking\"\n  | \"streaming\"\n  | \"tool_running\"\n  | \"error\";\nThe\
    \ node's enumeration lists `- tool-running`. — The node spells the fourth phase `tool-running` with\
    \ a hyphen, and so do two other nodes: the rule on tool_start, and the rule on when the waiting hint\
    \ shows. The code declares `\"tool_running\"` with an underscore. The next reader who checks the code\
    \ against the specification finds two different values for one phase. Any comparison against the node's\
    \ spelling will not match the code's value."
  observed_at:
  - src/features/chat/api/useSendMessage.ts
  - src/features/chat/state/chat-turn.ts
- node: domain/chat-workspace/message-list-state
  conforms: true
  how: 'src/features/chat/components/MessageStream.tsx: held at the branches `query.isPending`, `query.isError`
    and the success branch, with the `data-state` expression — data-state={isStreaming ? "streaming" :
    isEmpty ? "empty" : "success"}'
  encoded_at:
  - src/features/chat/components/MessageStream.tsx
- node: domain/chat-workspace/send-outcome
  conforms: true
  how: 'src/features/chat/api/useSendMessage.ts: held at SendMessageResult and the return of mutationFn,
    lines 91-100 and 304-309 — readonly stopReason: string | null;

    readonly errorCode: string | null;

    readonly errorMessage: string | null;

    readonly idempotencyKey: string;'
  encoded_at:
  - src/features/chat/api/useSendMessage.ts
- node: domain/chat-workspace/tool-chip
  conforms: true
  how: 'src/features/chat/types.ts: held at ToolCallData interface, lines 85-90. It carries `tool`, `argsSummary`
    and `ok`, where the node names `tool`, `args_summary` and `outcome`. — export interface ToolCallData
    { readonly tool: string; readonly argsSummary: string; readonly ok: boolean | null; }'
  encoded_at:
  - src/features/chat/types.ts
- node: domain/chat-workspace/tool-chip-outcome
  conforms: true
  how: 'src/features/chat/types.ts: held at ToolCallData.ok, line 89. The three outcomes are the three
    values of `boolean | null`. The words `pending`, `succeeded` and `failed` are not declared in this
    file. — readonly ok: boolean | null;'
  encoded_at:
  - src/features/chat/types.ts
- node: domain/chat/assistant-stop-reason
  conforms: true
  how: 'src/features/chat/types.ts: held at ChatStopReason union, lines 39-47. All eight values are present,
    spelled with underscores as in the upstream contract''s wire values. — export type ChatStopReason
    = | "end_turn" | "max_tokens" | "stop_sequence" | "max_iterations" | "turn_timeout" | "cancelled"
    | "provider_error" | "internal_error";'
  encoded_at:
  - src/features/chat/types.ts
- node: domain/chat/conversation
  conforms: true
  how: 'src/features/chat/types.ts: held at Conversation interface, lines 23-30. It keeps `id`, `title`,
    `archivedAt` and `createdAt`. `rolling_summary` and `updated_at` are not kept, which the bff contract
    states. — export interface Conversation { readonly id: string; readonly title: string | null; readonly
    archivedAt: Date | null; readonly createdAt: Date; }'
  encoded_at:
  - src/features/chat/types.ts
- node: domain/chat/conversation-usage
  conforms: true
  how: 'src/features/chat/types.ts: held at UsageData interface, lines 97-102. The node''s `messages`
    is declared here as `messageCount`. — export interface UsageData { readonly messageCount: number;
    readonly tokens_in: number; readonly tokens_out: number; readonly tool_calls: number; }'
  encoded_at:
  - src/features/chat/types.ts
- node: domain/chat/message
  conforms: false
  how: 'src/features/chat/types.ts, ChatMessage.content, line 69: readonly content: ReadonlyArray<ChatContentBlock>;
    — The `domain/chat/message` node types `content` as `string` and marks it required, while the source
    declares it as a list of block objects. Someone reading the node would expect a plain text field and
    would find a different type in the code. The upstream contract `contracts/chat/conversations` and
    `contracts/chat-workspace/bff-conversations` both say "content blocks". The node is therefore the
    one out of step, and it still governs.'
  observed_at:
  - src/features/chat/types.ts
- node: domain/chat/message-role
  conforms: true
  how: 'src/features/chat/types.ts: held at ChatMessageRole union, line 37. — export type ChatMessageRole
    = "user" | "assistant";'
  encoded_at:
  - src/features/chat/types.ts
- node: domain/chat/turn-event-kind
  conforms: true
  how: 'src/features/chat/api/chat-stream.ts: held at the ChatSSEFrame union (lines 108-115) and the switch
    in parseSSEFrame (lines 163-222) — `export type ChatSSEFrame = | ChatSSEFrameLLMStart | ChatSSEFrameTextDelta
    | ChatSSEFrameToolStart | ChatSSEFrameToolResult | ChatSSEFrameDone | ChatSSEFrameError | ChatSSEFrameGraphDelta;`'
  encoded_at:
  - src/features/chat/api/chat-stream.ts
- node: rules/chat-workspace/a-turn-is-never-resent-by-the-screen
  conforms: true
  how: 'src/features/chat/api/chat-stream.ts: held at streamChat, which has one `fetch(url, init)` call
    with no retry or loop around it — `response = await fetch(url, init);`

    src/features/chat/api/useSendMessage.ts: held at mutationFn, line 256, which calls streamChat once
    per send, with no retry loop — const stream = streamChat(url, body, {'
  encoded_at:
  - src/features/chat/api/chat-stream.ts
  - src/features/chat/api/useSendMessage.ts
- node: rules/chat-workspace/aborting-and-cancelling-do-not-trigger-each-other
  conforms: true
  how: "src/features/chat/api/use-cancel-turn.ts: held at the mutationFn of useCancelTurn, lines 37-45,\
    \ by the absence of any abort — mutationFn: async () => {\n  return http<CancelWire>(\n    `/api/v1/conversations/${encodeURIComponent(conversationId)}/cancel`,\n\
    \    { method: \"POST\", headers: authHeader() },\n  );\n},\nsrc/features/chat/api/useSendMessage.ts:\
    \ held at mutationFn creates the AbortController and stores it, and never calls cancelTurn — const\
    \ controller = new AbortController();\n...\nactions.setAbortController(controller);"
  encoded_at:
  - src/features/chat/api/use-cancel-turn.ts
  - src/features/chat/api/useSendMessage.ts
- node: rules/chat-workspace/aborting-ends-the-reading-quietly
  conforms: true
  how: 'src/features/chat/api/chat-stream.ts: held at the AbortError branches around fetch and around
    reader.read(). Re-reading messages and usage is not in this file. — `if (isAbort) return;`

    src/features/chat/api/useSendMessage.ts: held at Held only in part here. The loop and the post-stream
    invalidation run when the stream ends. The no-error-frame behavior on abort lives in streamChat in
    chat-stream, which is outside this file. — for await (const frame of stream) {

    ...

    void queryClient.invalidateQueries({ queryKey: messagesKey });'
  encoded_at:
  - src/features/chat/api/chat-stream.ts
  - src/features/chat/api/useSendMessage.ts
- node: rules/chat-workspace/active-conversation-is-named-by-the-address
  conforms: true
  how: 'src/features/chat/components/ChatWorkspace.tsx: held at line 97, and `conversationId={conversation}`
    at line 202 — const { conversation } = chatRoute.useSearch();'
  encoded_at:
  - src/features/chat/components/ChatWorkspace.tsx
- node: rules/chat-workspace/an-outcome-settles-the-most-recent-chip
  conforms: true
  how: 'src/features/chat/state/chat-turn.ts: held at the updateLastToolChip body, lines 137-146 — if
    (state.toolChips.length === 0) return state;

    const next = state.toolChips.slice();

    const lastIdx = next.length - 1;

    const last = next[lastIdx];

    if (last === undefined) return state;

    next[lastIdx] = { ...last, ok };'
  encoded_at:
  - src/features/chat/state/chat-turn.ts
- node: rules/chat-workspace/any-other-code-leaves-the-composer-usable
  conforms: true
  how: "src/features/chat/components/Composer.tsx: held at `disabledNoticeFor`, the final `return null`,\
    \ and `isTextareaDisabled` — if (errorCode === \"BUSINESS_CHAT_DISABLED\") return DISABLED_CHAT_DISABLED;\n\
    \  if (errorCode === \"BUSINESS_CHAT_PROVIDER_UNAVAILABLE\") {\n    return DISABLED_PROVIDER_UNAVAILABLE;\n\
    \  }\n  return null;"
  encoded_at:
  - src/features/chat/components/Composer.tsx
- node: rules/chat-workspace/any-status-may-follow-any-status
  conforms: true
  how: 'src/features/chat/state/chat-turn.ts: held at the setChatStatus action, line 148 — setChatStatus:
    (chatStatus) => set({ chatStatus }),'
  encoded_at:
  - src/features/chat/state/chat-turn.ts
- node: rules/chat-workspace/archived-conversation-offers-no-input
  conforms: true
  how: "src/features/chat/components/Composer.tsx: held at the `if (isArchived)` branch of `Composer`\
    \ — if (isArchived) {\n    return (\n      <ArchivedBanner\n        onUnarchive={onUnarchive}"
  encoded_at:
  - src/features/chat/components/Composer.tsx
- node: rules/chat-workspace/cancel-goes-through-the-back-end-request-helper
  conforms: true
  how: 'src/features/chat/api/use-cancel-turn.ts: held at the `http` call in mutationFn, line 38. The
    thirty-second cut-off, the token refresh on a 401 and the sign-in redirect belong to `@/lib/http`,
    which is outside this file set. — import { http } from "@/lib/http";

    ...

    return http<CancelWire>('
  encoded_at:
  - src/features/chat/api/use-cancel-turn.ts
- node: rules/chat-workspace/cancel-targets-the-conversation-it-was-created-for
  conforms: true
  how: "src/features/chat/api/use-cancel-turn.ts: held at the signature and mutationFn of useCancelTurn,\
    \ lines 32-45 — export function useCancelTurn(\n  conversationId: string,\n): UseMutationResult<CancelWire,\
    \ Error, void> {\n...\nmutationFn: async () => {"
  encoded_at:
  - src/features/chat/api/use-cancel-turn.ts
- node: rules/chat-workspace/cancelling-a-turn-is-a-separate-request
  conforms: true
  how: "src/features/chat/api/_request.ts: held at authHeader, lines 29-32. It supplies the bearer when\
    \ a token is held; the cancel request itself is made in use-cancel-turn.ts. — const token = useAuthStore.getState().accessToken;\
    \ return token !== null ? { Authorization: `Bearer ${token}` } : {};\nsrc/features/chat/api/use-cancel-turn.ts:\
    \ held at the mutationFn of useCancelTurn, lines 37-45 — {\n  method: \"POST\",\n  headers: authHeader(),\n\
    },"
  encoded_at:
  - src/features/chat/api/_request.ts
  - src/features/chat/api/use-cancel-turn.ts
- node: rules/chat-workspace/changing-conversation-clears-the-graph-and-the-detail
  conforms: true
  how: "src/features/chat/components/ChatWorkspace.tsx: held at the effect at lines 149-152 — useEffect(()\
    \ => {\n    useGraphStore.getState().clear();\n    setSelectedNode(null);\n  }, [conversation]);"
  encoded_at:
  - src/features/chat/components/ChatWorkspace.tsx
- node: rules/chat-workspace/changing-conversation-does-not-stop-the-turn
  conforms: true
  how: "src/features/chat/components/ChatWorkspace.tsx: held at the effect at lines 149-152, whose body\
    \ only clears the graph store and the selection, and the unkeyed `<ConversationView conversationId={conversation}\
    \ />` at line 202. Nothing in this file aborts or cancels a turn; the abort on leaving the list sits\
    \ in MessageStream, which is outside this file. — useGraphStore.getState().clear();\n    setSelectedNode(null);\n\
    src/features/chat/components/MessageStream.tsx: held at the unmount-only cleanup effect, lines 271-279.\
    \ Its empty dependency array does not include `conversationId`. — useEffect(() => {\n    return ()\
    \ => {\n      const controller = useChatTurnStore.getState().abortController;\n      controller?.abort();\n\
    \    };\n    // eslint-disable-next-line react-hooks/exhaustive-deps\n  }, []);"
  encoded_at:
  - src/features/chat/components/ChatWorkspace.tsx
  - src/features/chat/components/MessageStream.tsx
- node: rules/chat-workspace/chip-is-a-status-region-named-by-tool-and-status
  conforms: true
  how: "src/features/chat/components/ToolCallChip/ToolCallChip.tsx: held at lines 51 and 75-77 — const\
    \ ariaLabel = `${tool} — ${status}`;\n<span\n  role=\"status\"\n  aria-label={ariaLabel}"
  encoded_at:
  - src/features/chat/components/ToolCallChip/ToolCallChip.tsx
- node: rules/chat-workspace/chip-shows-the-tool-and-its-summary
  conforms: true
  how: "src/features/chat/components/ToolCallChip/ToolCallChip.tsx: held at lines 86-89 — <span className=\"\
    font-medium\">{tool}</span>\n{argsSummary.length > 0 && (\n  <span className=\"text-muted-foreground\"\
    >{argsSummary}</span>\n)}"
  encoded_at:
  - src/features/chat/components/ToolCallChip/ToolCallChip.tsx
- node: rules/chat-workspace/clicking-a-node-swaps-the-pane-to-its-detail
  conforms: true
  how: "src/features/chat/components/ChatWorkspace.tsx: held at handleNodeSelect, handleDetailClose and\
    \ the ternary at lines 215-236 — {selectedNode !== null ? (\n      <NodeDetailPanel\n        nodeId={selectedNode.id}\n\
    \        ...\n        onClose={handleDetailClose}\n      />\n    ) : (\n      <GraphSpace"
  encoded_at:
  - src/features/chat/components/ChatWorkspace.tsx
- node: rules/chat-workspace/comment-and-colonless-lines-are-ignored
  conforms: true
  how: 'src/features/chat/api/chat-stream.ts: held at parseSSEFrame, the two `continue` branches — `if
    (line.startsWith(":")) continue; // SSE comment / keep-alive`

    `if (colon === -1) continue;`'
  encoded_at:
  - src/features/chat/api/chat-stream.ts
- node: rules/chat-workspace/composer-footer-is-empty
  conforms: true
  how: "src/features/chat/components/Composer.tsx: held at the footer `div` at the end of the form in\
    \ `ComposerSendBand` — <div\n          className=\"flex items-center justify-end\"\n          data-testid=\"\
    composer-usage-slot\"\n        />"
  encoded_at:
  - src/features/chat/components/Composer.tsx
- node: rules/chat-workspace/composer-never-clears-the-last-outcome
  conforms: true
  how: "src/features/chat/components/Composer.tsx: held at `ComposerSendBand`, where the notice is derived\
    \ from the retained `mutation.data` and nothing resets the mutation — const mutation = useSendMessage();\n\
    \  const lastErrorCode = mutation.data?.errorCode ?? null;\n  const disabledNotice = disabledNoticeFor(lastErrorCode);"
  encoded_at:
  - src/features/chat/components/Composer.tsx
- node: rules/chat-workspace/composer-send-carries-the-identifier-and-the-content
  conforms: true
  how: "src/features/chat/components/Composer.tsx: held at `onSubmit` — const result = await mutation.mutateAsync({\n\
    \      conversationId,\n      content: values.content,\n    });"
  encoded_at:
  - src/features/chat/components/Composer.tsx
- node: rules/chat-workspace/content-has-at-most-32768-characters
  conforms: true
  how: "src/features/chat/components/Composer.tsx: held at `MAX_CONTENT_LENGTH` and the `composerSchema`\
    \ `.max(...)` — const MAX_CONTENT_LENGTH = 32768;\n...\n    .max(MAX_CONTENT_LENGTH, MSG_TOO_LONG),"
  encoded_at:
  - src/features/chat/components/Composer.tsx
- node: rules/chat-workspace/content-is-checked-on-every-change
  conforms: true
  how: 'src/features/chat/components/Composer.tsx: held at the `useForm` options — mode: "onChange",'
  encoded_at:
  - src/features/chat/components/Composer.tsx
- node: rules/chat-workspace/content-is-sent-as-the-caller-gives-it
  conforms: true
  how: "src/features/chat/api/useSendMessage.ts: held at the body construction, line 239-241 — const body:\
    \ { content: string; model?: string } = {\n  content: vars.content,\n};"
  encoded_at:
  - src/features/chat/api/useSendMessage.ts
- node: rules/chat-workspace/content-needs-a-character
  conforms: true
  how: 'src/features/chat/components/Composer.tsx: held at `composerSchema` — .min(1, MSG_EMPTY)'
  encoded_at:
  - src/features/chat/components/Composer.tsx
- node: rules/chat-workspace/conversation-is-archived-when-its-detail-says-so
  conforms: true
  how: 'src/features/chat/components/ConversationView.tsx: held at the `isArchived` declaration in ActiveConversation,
    line 68. It is true only when the loaded detail''s `archivedAt` is non-null. While the query is pending
    or has failed, `data` is undefined and the result is false. — const isArchived = conversationQuery.data?.archivedAt
    != null;'
  encoded_at:
  - src/features/chat/components/ConversationView.tsx
- node: rules/chat-workspace/conversation-reads-stay-fresh-for-thirty-seconds
  conforms: true
  how: "src/features/chat/api/use-get-conversation-usage.ts: held at line 17 (the constant) and line 34\
    \ (its use as the staleness window of the usage query) — const STALE_MS = 30_000;\n...\nstaleTime:\
    \ STALE_MS,\nsrc/features/chat/api/use-get-conversation.ts: held at the constant STALE_MS at line\
    \ 17 and the option staleTime at line 33 — const STALE_MS = 30_000;\n...\nstaleTime: STALE_MS,\nsrc/features/chat/api/use-list-conversations.ts:\
    \ held at STALE_MS and the staleTime option, lines 28 and 52. The conversation listing is the only\
    \ one of the three reads this rule names that this file holds. — const STALE_MS = 30_000;\n...\n \
    \   staleTime: STALE_MS,"
  encoded_at:
  - src/features/chat/api/use-get-conversation-usage.ts
  - src/features/chat/api/use-get-conversation.ts
  - src/features/chat/api/use-list-conversations.ts
- node: rules/chat-workspace/create-and-delete-do-not-navigate
  conforms: true
  how: "src/features/chat/api/use-create-conversation.ts: held at the whole hook, lines 33-52. It holds\
    \ the rule by carrying no navigation: the mutation only requests and invalidates. — onSuccess: ()\
    \ => {\n  void queryClient.invalidateQueries({\n    queryKey: conversationKeys.all,\n  });\n},\nsrc/features/chat/api/use-delete-conversation.ts:\
    \ held at the onSuccess handler, lines 42-49. It performs only cache operations and calls no router\
    \ or navigation function. No navigation appears anywhere in the file's code. — onSuccess: (_data,\
    \ { id }) => {\n  queryClient.removeQueries({ queryKey: conversationKeys.detail(id) });\n  queryClient.removeQueries({\
    \ queryKey: conversationKeys.messages(id) });\n  queryClient.removeQueries({ queryKey: conversationKeys.usage(id)\
    \ });\n  void queryClient.invalidateQueries({ queryKey: conversationKeys.all });\n},"
  encoded_at:
  - src/features/chat/api/use-create-conversation.ts
  - src/features/chat/api/use-delete-conversation.ts
- node: rules/chat-workspace/create-refreshes-every-conversation-read
  conforms: true
  how: "src/features/chat/api/use-create-conversation.ts: held at the onSuccess handler, lines 46-51 —\
    \ void queryClient.invalidateQueries({\n  queryKey: conversationKeys.all,\n});"
  encoded_at:
  - src/features/chat/api/use-create-conversation.ts
- node: rules/chat-workspace/delete-removes-the-conversations-reads
  conforms: true
  how: 'src/features/chat/api/use-delete-conversation.ts: held at the onSuccess handler, lines 42-49 —
    queryClient.removeQueries({ queryKey: conversationKeys.detail(id) });

    queryClient.removeQueries({ queryKey: conversationKeys.messages(id) });

    queryClient.removeQueries({ queryKey: conversationKeys.usage(id) });

    void queryClient.invalidateQueries({ queryKey: conversationKeys.all });'
  encoded_at:
  - src/features/chat/api/use-delete-conversation.ts
- node: rules/chat-workspace/delete-uses-the-no-body-helper
  conforms: true
  how: "src/features/chat/api/use-delete-conversation.ts: held at the mutationFn, lines 36-41, and the\
    \ result type, lines 29-33 — ): UseMutationResult<void, Error, DeleteConversationVariables> {\n...\n\
    mutationFn: async ({ id }) => {\n  await httpVoid(`/api/v1/conversations/${encodeURIComponent(id)}`,\
    \ {"
  encoded_at:
  - src/features/chat/api/use-delete-conversation.ts
- node: rules/chat-workspace/details-and-listing-are-read-again-on-focus
  conforms: true
  how: 'src/features/chat/api/use-get-conversation.ts: held at the refetchOnWindowFocus option, line 34
    — refetchOnWindowFocus: true,

    src/features/chat/api/use-list-conversations.ts: held at the useQuery options, line 53. This file
    holds the listing half of the rule. — refetchOnWindowFocus: true,'
  encoded_at:
  - src/features/chat/api/use-get-conversation.ts
  - src/features/chat/api/use-list-conversations.ts
- node: rules/chat-workspace/disabling-codes-lock-the-composer
  conforms: true
  how: "src/features/chat/components/Composer.tsx: held at `disabledNoticeFor`, `isTextareaDisabled`,\
    \ the send button `disabled` prop and the notice row — const isTextareaDisabled = isStreaming || disabledNotice\
    \ !== null;\n...\n        disabled={disabledNotice !== null}"
  encoded_at:
  - src/features/chat/components/Composer.tsx
- node: rules/chat-workspace/done-settles-the-turn-and-makes-the-status-idle
  conforms: true
  how: 'src/features/chat/api/useSendMessage.ts: held at the case "done" branch of dispatchFrame and the
    stopReason assignment in the loop — useGraphStore.getState().settleTurn("done");

    actions.setChatStatus("idle");

    ...

    stopReason = frame.stop_reason;'
  encoded_at:
  - src/features/chat/api/useSendMessage.ts
- node: rules/chat-workspace/each-frame-kind-requires-its-fields
  conforms: true
  how: 'src/features/chat/api/chat-stream.ts: held at the per-event cases of the switch in parseSSEFrame
    — `if (typeof tool !== "string" || typeof argsSummary !== "string") {`

    `if (typeof ok !== "boolean") return null;`

    `if (typeof stopReason !== "string") return null;`

    `if (typeof code !== "string" || typeof message !== "string") return null;`

    `if (!Array.isArray(links)) return null;`'
  encoded_at:
  - src/features/chat/api/chat-stream.ts
- node: rules/chat-workspace/enter-sends-and-shift-enter-breaks-the-line
  conforms: true
  how: "src/features/chat/components/Composer.tsx: held at `onTextareaKeyDown` — if (e.key === \"Enter\"\
    \ && !e.shiftKey) {\n      e.preventDefault();\n      formRef.current?.requestSubmit();"
  encoded_at:
  - src/features/chat/components/Composer.tsx
- node: rules/chat-workspace/error-settles-the-turn-and-makes-the-status-error
  conforms: true
  how: 'src/features/chat/api/useSendMessage.ts: held at the case "error" branch of dispatchFrame and
    the code and message assignment in the loop — useGraphStore.getState().settleTurn("error");

    actions.setChatStatus("error");

    ...

    errorCode = frame.code;

    errorMessage = frame.message;'
  encoded_at:
  - src/features/chat/api/useSendMessage.ts
- node: rules/chat-workspace/error-status-stays-until-the-next-send
  conforms: true
  how: 'src/features/chat/api/useSendMessage.ts: held at mutationFn calls resetTurn() at the start of
    the send and nothing clears the status when the turn ends — actions.resetTurn();'
  encoded_at:
  - src/features/chat/api/useSendMessage.ts
- node: rules/chat-workspace/escape-aborts-the-turn-from-anywhere
  conforms: true
  how: "src/features/chat/components/Composer.tsx: held at the `useEffect` document keydown listener —\
    \ if (!isStreaming) return;\n    const onKeyDown = (e: globalThis.KeyboardEvent) => {\n      if (e.key\
    \ !== \"Escape\") return;\n      const controller = useChatTurnStore.getState().abortController;\n\
    \      if (controller !== null) {\n        e.preventDefault();\n        controller.abort();"
  encoded_at:
  - src/features/chat/components/Composer.tsx
- node: rules/chat-workspace/event-names-the-frame-and-data-carries-it
  conforms: true
  how: 'src/features/chat/api/chat-stream.ts: held at parseSSEFrame, the field loop at lines 143-149 —
    `eventName = value;`

    `dataLine = dataLine === null ? value : `${dataLine}\n${value}`;`'
  encoded_at:
  - src/features/chat/api/chat-stream.ts
- node: rules/chat-workspace/every-send-has-a-new-idempotency-key
  conforms: true
  how: 'src/features/chat/api/useSendMessage.ts: held at newIdempotencyKey(), called once per mutationFn
    run — return crypto.randomUUID();'
  encoded_at:
  - src/features/chat/api/useSendMessage.ts
- node: rules/chat-workspace/failed-turn-gets-no-wording-from-the-list
  conforms: true
  how: "src/features/chat/components/MessageStream.tsx: held at the streaming ChatBubble element, lines\
    \ 371-379. It carries no error or failure prop, and no branch renders turn-failure wording. — <ChatBubble\n\
    \          key=\"streaming\"\n          variant=\"assistant\"\n          content={streamingText}\n\
    \          streaming\n          animate\n        />"
  encoded_at:
  - src/features/chat/components/MessageStream.tsx
- node: rules/chat-workspace/first-graph-delta-replaces-and-later-ones-add
  conforms: true
  how: "src/features/chat/api/useSendMessage.ts: held at the graph_delta branch of the stream loop, lines\
    \ 261-280 — if (graphReplacedThisTurn) {\n  gs.addNodes(delta);\n} else {\n  gs.replaceNodes(delta);\n\
    \  graphReplacedThisTurn = true;\n}"
  encoded_at:
  - src/features/chat/api/useSendMessage.ts
- node: rules/chat-workspace/first-jump-happens-once
  conforms: true
  how: "src/features/chat/components/MessageStream.tsx: held at the layout effect guarded by hasInitialScrolledRef,\
    \ lines 238-246. The ref is never reset when `conversationId` changes. — if (hasInitialScrolledRef.current)\
    \ return;\n    ...\n    hasInitialScrolledRef.current = true;"
  encoded_at:
  - src/features/chat/components/MessageStream.tsx
- node: rules/chat-workspace/first-load-jumps-to-the-bottom
  conforms: true
  how: 'src/features/chat/components/MessageStream.tsx: held at the layout effect on `query.isSuccess`,
    lines 238-246 — node.scrollIntoView({ block: "end", behavior: "auto" });'
  encoded_at:
  - src/features/chat/components/MessageStream.tsx
- node: rules/chat-workspace/frame-lines-are-field-value-pairs
  conforms: true
  how: 'src/features/chat/api/chat-stream.ts: held at parseSSEFrame, lines 135-142 — `const line = rawLine.replace(/\r$/,
    "");`

    `const value = line.slice(colon + 1).replace(/^ /, "");`'
  encoded_at:
  - src/features/chat/api/chat-stream.ts
- node: rules/chat-workspace/frames-end-at-a-blank-line
  conforms: false
  how: 'src/features/chat/api/chat-stream.ts, the frame-drain loop, lines 346-353, together with the carriage-return
    drop at line 135: `let boundary = buffer.indexOf("\n\n");`

    `const line = rawLine.replace(/\r$/, "");` — The node ends a frame at a blank line and drops a carriage
    return at the end of each line. The loop recognises only a bare `\n\n`. In a stream with CRLF line
    endings the separator is `\r\n\r\n`, and `indexOf("\n\n")` never matches it. No frame would be applied
    as it arrives. Everything would pile up in the buffer until the stream ends and be read as one block,
    which keeps only the last event and joins all the data lines. The `\r` handling at line 135 shows
    the code expects CRLF lines, but the frame boundary does not.'
  observed_at:
  - src/features/chat/api/chat-stream.ts
- node: rules/chat-workspace/graph-delta-with-no-nodes-leaves-the-graph
  conforms: true
  how: 'src/features/chat/api/useSendMessage.ts: held at the graph_delta branch of the stream loop, lines
    265-270 — const delta = mapWireToGraphDelta(frame);

    ...

    if (delta.nodes.length > 0) {'
  encoded_at:
  - src/features/chat/api/useSendMessage.ts
- node: rules/chat-workspace/graph-pane-receives-the-status-and-the-error
  conforms: true
  how: "src/features/chat/components/ChatWorkspace.tsx: held at the store selectors at lines 130-131 and\
    \ the GraphSpace props at lines 229-232 — status={status}\n          {...(errorMessage !== undefined\
    \ ? { errorMessage } : {})}"
  encoded_at:
  - src/features/chat/components/ChatWorkspace.tsx
- node: rules/chat-workspace/graph-tool-start-puts-the-graph-pane-into-loading
  conforms: true
  how: "src/features/chat/api/useSendMessage.ts: held at GRAPH_TOOLS and isGraphTool, lines 337-347, and\
    \ the tool_start case, lines 388-390 — const GRAPH_TOOLS: ReadonlySet<string> = new Set<string>([\n\
    \  \"traverse\",\n  \"get_node\",\n  \"list_nodes\",\n  \"search\",\n  \"ingest_directed\",\n]);\n\
    ...\nuseGraphStore.getState().setStatus(\"loading\");"
  encoded_at:
  - src/features/chat/api/useSendMessage.ts
- node: rules/chat-workspace/graph-view-is-restored-and-saved-per-conversation
  conforms: true
  how: 'src/features/chat/components/ChatWorkspace.tsx: held at the call at line 158. The restore and
    save logic sits in the hook''s own file, which is outside this file set and was not read. — useGraphPersistence(conversation);'
  encoded_at:
  - src/features/chat/components/ChatWorkspace.tsx
- node: rules/chat-workspace/hint-hides-in-every-other-phase
  conforms: true
  how: "src/features/chat/components/ChatStatusIndicator.tsx: held at the early-return guard, line 148\
    \ — if (chatStatus !== \"thinking\" && chatStatus !== \"tool_running\") {\n    return null;\n  }"
  encoded_at:
  - src/features/chat/components/ChatStatusIndicator.tsx
- node: rules/chat-workspace/hint-is-a-polite-atomic-status-region
  conforms: true
  how: "src/features/chat/components/ChatStatusIndicator.tsx: held at the attributes of the rendered div,\
    \ lines 166-171 — role=\"status\"\n      aria-live=\"polite\"\n      aria-atomic=\"true\""
  encoded_at:
  - src/features/chat/components/ChatStatusIndicator.tsx
- node: rules/chat-workspace/history-failure-offers-a-retry
  conforms: true
  how: 'src/features/chat/components/MessageStream.tsx: held at ErrorBanner and the `query.isError` branch,
    lines 162-194 and 304-319 — <ErrorBanner onRetry={() => void query.refetch()} />'
  encoded_at:
  - src/features/chat/components/MessageStream.tsx
- node: rules/chat-workspace/history-keeps-the-listed-order
  conforms: true
  how: 'src/features/chat/components/MessageStream.tsx: held at the `messages.map` over `query.data?.items`,
    line 349. No sort is applied. — const messages: ReadonlyArray<ChatMessage> = query.data?.items ??
    [];'
  encoded_at:
  - src/features/chat/components/MessageStream.tsx
- node: rules/chat-workspace/in-flight-bubble-is-removed-when-streaming-ends
  conforms: true
  how: "src/features/chat/components/MessageStream.tsx: held at the conditional render of the streaming\
    \ bubble, lines 371-379. The accumulator lives in the store, and this file keeps no copy. — {isStreaming\
    \ ? (\n        <ChatBubble\n          key=\"streaming\"\n...\n      ) : null}"
  encoded_at:
  - src/features/chat/components/MessageStream.tsx
- node: rules/chat-workspace/invalid-content-sends-nothing
  conforms: true
  how: "src/features/chat/components/Composer.tsx: held at the form `onSubmit` going through `handleSubmit`\
    \ with the schema resolver — onSubmit={(e) => {\n          void handleSubmit(onSubmit)(e);\n     \
    \   }}"
  encoded_at:
  - src/features/chat/components/Composer.tsx
- node: rules/chat-workspace/invalid-field-is-marked-and-described
  conforms: true
  how: "src/features/chat/components/Composer.tsx: held at the `Textarea` props and the message row —\
    \ aria-invalid={hasError}\n...\n        aria-describedby={describedBy}"
  encoded_at:
  - src/features/chat/components/Composer.tsx
- node: rules/chat-workspace/last-terminal-frame-sets-the-result
  conforms: true
  how: "src/features/chat/api/useSendMessage.ts: held at the loop, which overwrites the result variables\
    \ on each done or error frame — if (frame.type === \"done\") {\n  stopReason = frame.stop_reason;\n\
    } else if (frame.type === \"error\") {\n  errorCode = frame.code;\n  errorMessage = frame.message;\n\
    }"
  encoded_at:
  - src/features/chat/api/useSendMessage.ts
- node: rules/chat-workspace/leaving-the-list-aborts-the-turn
  conforms: true
  how: "src/features/chat/components/MessageStream.tsx: held at the unmount cleanup effect, lines 271-279\
    \ — const controller = useChatTurnStore.getState().abortController;\n      controller?.abort();"
  encoded_at:
  - src/features/chat/components/MessageStream.tsx
- node: rules/chat-workspace/listing-excludes-archived-by-default
  conforms: true
  how: 'src/features/chat/api/use-list-conversations.ts: held at buildQueryString, line 34, where `include_archived`
    is set only when it is exactly true — if (params.includeArchived === true) search.set("include_archived",
    "true");'
  encoded_at:
  - src/features/chat/api/use-list-conversations.ts
- node: rules/chat-workspace/listing-sends-its-options-only-when-asked
  conforms: true
  how: "src/features/chat/api/use-list-conversations.ts: held at buildQueryString, lines 32-34. The listing\
    \ half of the rule is held here. The message-listing half belongs to another file. — if (params.limit\
    \ !== undefined) search.set(\"limit\", String(params.limit));\n  if (params.cursor !== undefined)\
    \ search.set(\"cursor\", params.cursor);\n  if (params.includeArchived === true) search.set(\"include_archived\"\
    , \"true\");\n  const qs = search.toString();\n  return qs.length > 0 ? `?${qs}` : \"\";\nsrc/features/chat/api/use-list-messages.ts:\
    \ held at buildQueryString, lines 27-33, the message-listing half. The conversation-listing half belongs\
    \ to another file. — if (params.limit !== undefined) search.set(\"limit\", String(params.limit));\n\
    \  if (params.before !== undefined) search.set(\"before\", params.before);\n  const qs = search.toString();\n\
    \  return qs.length > 0 ? `?${qs}` : \"\";"
  encoded_at:
  - src/features/chat/api/use-list-conversations.ts
  - src/features/chat/api/use-list-messages.ts
- node: rules/chat-workspace/llm-start-makes-the-status-thinking
  conforms: true
  how: 'src/features/chat/api/useSendMessage.ts: held at dispatchFrame, case "llm_start" — case "llm_start":

    ...

    actions.setChatStatus("thinking");'
  encoded_at:
  - src/features/chat/api/useSendMessage.ts
- node: rules/chat-workspace/loading-history-shows-three-placeholders
  conforms: true
  how: "src/features/chat/components/MessageStream.tsx: held at SKELETON_ROWS, LoadingSkeleton, and the\
    \ `query.isPending` branch with `aria-busy=\"true\"`, lines 117-156 and 282-298 — const SKELETON_ROWS:\
    \ ReadonlyArray<{ variant: \"assistant\" | \"user\"; widthClass: string }> = [\n  { variant: \"assistant\"\
    , widthClass: \"w-3/5\" },\n  { variant: \"user\", widthClass: \"w-2/5\" },\n  { variant: \"assistant\"\
    , widthClass: \"w-4/5\" },\n];"
  encoded_at:
  - src/features/chat/components/MessageStream.tsx
- node: rules/chat-workspace/malformed-frames-are-skipped-silently
  conforms: false
  how: 'src/features/chat/api/chat-stream.ts, line 160, inside parseSSEFrame, together with `case "llm_start":`
    at line 164: `if (payload === null || typeof payload !== "object") return null;`

    `case "llm_start":`

    `  return { type: "llm_start" };` — The node requires a frame to be skipped when its data is not a
    JSON object. `typeof payload !== "object"` is also false for an array, so `event: llm_start` with
    `data: []` is applied as an `llm_start` frame. It would move the turn status to thinking, where the
    node says the frame is skipped silently. The other event kinds happen to be rejected later only because
    their required fields are absent on an array.'
  observed_at:
  - src/features/chat/api/chat-stream.ts
- node: rules/chat-workspace/message-is-a-bubble-styled-by-its-role
  conforms: true
  how: "src/features/chat/components/MessageStream.tsx: held at the ChatBubble rendered for each message,\
    \ lines 355-361 — <ChatBubble\n          key={m.id}\n          variant={m.role}"
  encoded_at:
  - src/features/chat/components/MessageStream.tsx
- node: rules/chat-workspace/message-list-is-a-polite-live-region
  conforms: true
  how: "src/features/chat/components/MessageStream.tsx: held at the three section elements, lines 284-296,\
    \ 306-317 and 326-339. All carry `aria-live=\"polite\"`, and aria-busy is set only in loading and\
    \ while streaming. — aria-live=\"polite\"\n      {...(isStreaming ? { \"aria-busy\": \"true\" as const\
    \ } : {})}"
  encoded_at:
  - src/features/chat/components/MessageStream.tsx
- node: rules/chat-workspace/message-passes-its-stop-reason-to-its-bubble
  conforms: true
  how: 'src/features/chat/components/MessageStream.tsx: held at the conditional spread on the history
    ChatBubble, line 360 — {...(m.stop_reason !== null ? { stopReason: m.stop_reason } : {})}'
  encoded_at:
  - src/features/chat/components/MessageStream.tsx
- node: rules/chat-workspace/message-text-joins-its-blocks
  conforms: true
  how: "src/features/chat/components/MessageStream.tsx: held at joinContent, lines 98-106 — for (const\
    \ block of blocks) {\n    if (typeof block.text === \"string\") {\n      out += block.text;\n    }\n\
    \  }"
  encoded_at:
  - src/features/chat/components/MessageStream.tsx
- node: rules/chat-workspace/messages-and-usage-are-not-read-again-on-focus
  conforms: true
  how: 'src/features/chat/api/use-get-conversation-usage.ts: held at line 35, in the useQuery options
    — refetchOnWindowFocus: false,

    src/features/chat/api/use-list-messages.ts: held at the useQuery options, line 52. The usage half
    belongs to another file. — refetchOnWindowFocus: false,'
  encoded_at:
  - src/features/chat/api/use-get-conversation-usage.ts
  - src/features/chat/api/use-list-messages.ts
- node: rules/chat-workspace/messages-are-stale-as-soon-as-they-are-read
  conforms: true
  how: 'src/features/chat/api/use-list-messages.ts: held at the useQuery options, line 51 — staleTime:
    0, // volatile per §4 BR-08'
  encoded_at:
  - src/features/chat/api/use-list-messages.ts
- node: rules/chat-workspace/no-body-request-has-no-cutoff-and-no-refresh
  conforms: true
  how: 'src/features/chat/api/_request.ts: held at httpVoid, lines 45-99, by what it does not contain.
    The `fetch(url, init)` call has no timeout and no signal of its own, and no branch on status 401 or
    any token refresh. A 401 falls through to the generic failure path. — response = await fetch(url,
    init);

    throw new EnvelopeError({ code: typeof errObj?.code === "string" ? errObj.code : response.status >=
    500 ? "SYSTEM_UPSTREAM" : "SYSTEM_UNKNOWN", ...'
  encoded_at:
  - src/features/chat/api/_request.ts
- node: rules/chat-workspace/no-body-request-succeeds-only-on-204
  conforms: true
  how: 'src/features/chat/api/_request.ts: held at the branch at line 69 of httpVoid, followed by an unconditional
    throw. — if (response.status === 204) return;'
  encoded_at:
  - src/features/chat/api/_request.ts
- node: rules/chat-workspace/no-page-size-is-fixed-by-the-screen
  conforms: true
  how: "src/features/chat/api/use-list-conversations.ts: held at the signature and buildQueryString (lines\
    \ 40 and 32). `params` defaults to `{}`, and `limit` is forwarded only when the caller supplies it.\
    \ No page-size literal appears in the code. — params: ListConversationsParams = {},\n...\n  if (params.limit\
    \ !== undefined) search.set(\"limit\", String(params.limit));\nsrc/features/chat/api/use-list-messages.ts:\
    \ held at buildQueryString, lines 27-33, and the default `params: ListMessagesParams = {}`. No limit\
    \ is set in code. — if (params.limit !== undefined) search.set(\"limit\", String(params.limit));"
  encoded_at:
  - src/features/chat/api/use-list-conversations.ts
  - src/features/chat/api/use-list-messages.ts
- node: rules/chat-workspace/node-detail-receives-the-clicked-label
  conforms: true
  how: "src/features/chat/components/ChatWorkspace.tsx: held at handleNodeSelect at lines 169-175 and\
    \ the conditional spread at lines 220-222 — const node = nodesMap.get(nodeId);\n      setSelectedNode({\
    \ id: nodeId, label: node?.label });"
  encoded_at:
  - src/features/chat/components/ChatWorkspace.tsx
- node: rules/chat-workspace/one-message-line-under-the-field
  conforms: true
  how: 'src/features/chat/components/Composer.tsx: held at the single message `<p>` in `ComposerSendBand`
    — {hasError ? errors.content?.message : disabledNotice}'
  encoded_at:
  - src/features/chat/components/Composer.tsx
- node: rules/chat-workspace/one-validation-message-per-field
  conforms: true
  how: "src/features/chat/components/Composer.tsx: held at `safeZodResolver` — if (errors[path] === undefined)\
    \ {\n        errors[path] = { type: issue.code, message: issue.message };\n      }"
  encoded_at:
  - src/features/chat/components/Composer.tsx
- node: rules/chat-workspace/owner-message-is-appended-before-the-answer
  conforms: false
  how: 'src/features/chat/api/useSendMessage.ts, buildOptimisticUserMessage, the returned object (lines
    116-128): id: `optimistic-${args.idempotencyKey}`,

    ...

    createdAt: new Date(), — The node says the optimistic identifier is built from the idempotency key
    and the browser''s time. The code builds the id from the key alone and keeps the time in a separate
    createdAt field. A reader who relies on the node''s identifier format will not find the time in the
    id.'
  observed_at:
  - src/features/chat/api/useSendMessage.ts
- node: rules/chat-workspace/reactivating-sends-an-unarchive-update
  conforms: true
  how: "src/features/chat/components/ConversationView.tsx: held at the `onUnarchive` handler passed to\
    \ Composer, lines 92-94 — onUnarchive={() =>\n      updateMutation.mutate({ id: conversationId, archivedAt:\
    \ null })\n    }"
  encoded_at:
  - src/features/chat/components/ConversationView.tsx
- node: rules/chat-workspace/read-and-write-failures-surface-unchanged
  conforms: true
  how: "src/features/chat/api/use-create-conversation.ts: held at the mutationFn, lines 34-45. The `http`\
    \ call is awaited with no catch and no code mapping, and the hook carries no text of its own. — const\
    \ wire = await http<ConversationWire>(\"/api/v1/conversations\", {\nsrc/features/chat/api/use-delete-conversation.ts:\
    \ held at the mutation declares no onError, no catch and no error mapping or text, so the error `httpVoid`\
    \ raises propagates unchanged through `mutationFn`. The fact is held by that absence in the useMutation\
    \ configuration, lines 35-50. — return useMutation({\n  mutationFn: async ({ id }) => {\n    await\
    \ httpVoid(...);\n  },\n  onSuccess: (_data, { id }) => { ... },\n});\nsrc/features/chat/api/use-get-conversation-usage.ts:\
    \ held at the queryFn, lines 24-31. The error the `http` helper raises is awaited with no try/catch,\
    \ no code mapping and no text of its own, so it reaches the query unchanged. — const wire = await\
    \ http<UsageWire>(\n  ...\n  { method: \"GET\", headers: authHeader() },\n);\nreturn toUsageData(wire);\n\
    src/features/chat/api/use-get-conversation.ts: held at the queryFn, lines 24-31. The `await http(...)`\
    \ call has no catch, mapping or text, so the helper's error propagates. — const wire = await http<ConversationWire>(\n\
    \  `/api/v1/conversations/${encodeURIComponent(id as string)}`,\n  { method: \"GET\", headers: authHeader()\
    \ },\n);\nreturn toConversation(wire);\nsrc/features/chat/api/use-list-conversations.ts: held at the\
    \ queryFn, lines 45-51. The await on `http` has no catch, mapping or message of its own, so the request\
    \ helper's error becomes the query's error. — queryFn: async () => {\n      const wire = await http<ConversationListWire>(\n\
    \        `/api/v1/conversations${buildQueryString(params)}`,\n        { method: \"GET\", headers:\
    \ authHeader() },\n      );\n      return toConversationList(wire);\n    },\nsrc/features/chat/api/use-list-messages.ts:\
    \ held at queryFn, lines 41-49. It awaits http() with no catch or mapping and shows no text of its\
    \ own. — const wire = await http<MessageListWire>(\n  `/api/v1/conversations/${encodeURIComponent(\n\
    src/features/chat/api/use-update-conversation.ts: held at mutationFn, lines 40-56, which has no catch,\
    \ mapping or message of its own — const wire = await http<ConversationWire>(\n  `/api/v1/conversations/${encodeURIComponent(id)}`,\n\
    ...\nreturn toConversation(wire);"
  encoded_at:
  - src/features/chat/api/use-create-conversation.ts
  - src/features/chat/api/use-delete-conversation.ts
  - src/features/chat/api/use-get-conversation-usage.ts
  - src/features/chat/api/use-get-conversation.ts
  - src/features/chat/api/use-list-conversations.ts
  - src/features/chat/api/use-list-messages.ts
  - src/features/chat/api/use-update-conversation.ts
- node: rules/chat-workspace/reading-continues-after-a-terminal-frame
  conforms: true
  how: 'src/features/chat/api/useSendMessage.ts: held at the for-await loop, which has no break after
    done or error and ends only when the generator ends — for await (const frame of stream) {'
  encoded_at:
  - src/features/chat/api/useSendMessage.ts
- node: rules/chat-workspace/reads-need-a-conversation-id
  conforms: true
  how: 'src/features/chat/api/use-get-conversation-usage.ts: held at line 33, the `enabled` option — enabled:
    typeof conversationId === "string" && conversationId.length > 0,

    src/features/chat/api/use-get-conversation.ts: held at the enabled option, line 32 — enabled: typeof
    id === "string" && id.length > 0,

    src/features/chat/api/use-list-messages.ts: held at the enabled option, line 50 — enabled: typeof
    conversationId === "string" && conversationId.length > 0,'
  encoded_at:
  - src/features/chat/api/use-get-conversation-usage.ts
  - src/features/chat/api/use-get-conversation.ts
  - src/features/chat/api/use-list-messages.ts
- node: rules/chat-workspace/refused-send-keeps-the-owner-message-until-reread
  conforms: true
  how: 'src/features/chat/api/useSendMessage.ts: held at the optimistic row stays in the cache, and the
    post-stream invalidation re-reads it. Nothing in this file removes it. — void queryClient.invalidateQueries({
    queryKey: messagesKey });'
  encoded_at:
  - src/features/chat/api/useSendMessage.ts
- node: rules/chat-workspace/reset-restores-every-field-at-once
  conforms: true
  how: 'src/features/chat/state/chat-turn.ts: held at the reset action, line 123, together with initialState,
    lines 111-118 — reset: () => set({ ...initialState }),'
  encoded_at:
  - src/features/chat/state/chat-turn.ts
- node: rules/chat-workspace/selecting-a-node-sends-nothing
  conforms: true
  how: "src/features/chat/components/ChatWorkspace.tsx: held at handleNodeSelect and handleDetailClose,\
    \ lines 169-183. Both only set local state and call no chat action. — const handleDetailClose = useCallback(()\
    \ => {\n    setSelectedNode(null);\n  }, []);"
  encoded_at:
  - src/features/chat/components/ChatWorkspace.tsx
- node: rules/chat-workspace/send-carries-the-access-token-when-held
  conforms: true
  how: "src/features/chat/api/use-list-conversations.ts: held at the call site only, line 48. The token\
    \ read and the absent-header behavior live in the `authHeader` helper in ./_request.ts, outside this\
    \ file's set. This file attaches the helper's headers to the request. — { method: \"GET\", headers:\
    \ authHeader() },\nsrc/features/chat/api/useSendMessage.ts: held at mutationFn, lines 231-237 — const\
    \ token = useAuthStore.getState().accessToken;\n...\nif (token !== null) {\n  headers[\"Authorization\"\
    ] = `Bearer ${token}`;\n}"
  encoded_at:
  - src/features/chat/api/use-list-conversations.ts
  - src/features/chat/api/useSendMessage.ts
- node: rules/chat-workspace/send-clears-the-previous-turn
  conforms: true
  how: 'src/features/chat/api/useSendMessage.ts: held at mutationFn, lines 203-206 — actions.resetTurn();

    actions.setIdempotencyKey(idempotencyKey);

    actions.setAbortController(controller);

    actions.setStreaming(true);'
  encoded_at:
  - src/features/chat/api/useSendMessage.ts
- node: rules/chat-workspace/send-never-refreshes-the-token
  conforms: true
  how: 'src/features/chat/api/chat-stream.ts: held at streamChat. A 401 goes through the same non-ok branch
    as any refusal, with no refresh or redirect. — `const err = await extractPreStreamError(response);`

    `yield { type: "error", code: err.code, message: err.message };`'
  encoded_at:
  - src/features/chat/api/chat-stream.ts
- node: rules/chat-workspace/send-resolves-with-the-turn-outcome
  conforms: true
  how: "src/features/chat/api/useSendMessage.ts: held at the return of mutationFn. The mutationFn has\
    \ a try/finally and no catch, so it resolves only if the streamChat generator never throws. Whether\
    \ it can throw is decided in chat-stream, outside this file. — return {\n  stopReason,\n  errorCode,\n\
    \  errorMessage,\n  idempotencyKey,\n};"
  encoded_at:
  - src/features/chat/api/useSendMessage.ts
- node: rules/chat-workspace/send-stream-has-no-client-cutoff
  conforms: true
  how: 'src/features/chat/api/chat-stream.ts: held at streamChat. The only way the caller ends the request
    is options.signal, and there is no timer. — `if (options.signal !== undefined) init.signal = options.signal;`'
  encoded_at:
  - src/features/chat/api/chat-stream.ts
- node: rules/chat-workspace/started-tool-calls-accumulate-at-the-end
  conforms: true
  how: "src/features/chat/state/chat-turn.ts: held at the addToolChip action, lines 134-135 — addToolChip:\
    \ (chip) =>\n  set((state) => ({ toolChips: [...state.toolChips, chip] })),"
  encoded_at:
  - src/features/chat/state/chat-turn.ts
- node: rules/chat-workspace/stop-button-aborts-the-turn
  conforms: true
  how: "src/features/chat/components/Composer.tsx: held at `onStopClick` and the stop `Button` — const\
    \ controller = useChatTurnStore.getState().abortController;\n  controller?.abort();"
  encoded_at:
  - src/features/chat/components/Composer.tsx
- node: rules/chat-workspace/stream-end-clears-streaming-and-the-handle
  conforms: true
  how: 'src/features/chat/api/useSendMessage.ts: held at the finally block, lines 289-296 — actions.setStreaming(false);

    actions.setAbortController(null);'
  encoded_at:
  - src/features/chat/api/useSendMessage.ts
- node: rules/chat-workspace/stream-end-reads-messages-and-usage-again
  conforms: true
  how: "src/features/chat/api/useSendMessage.ts: held at mutationFn, lines 299-302 — void queryClient.invalidateQueries({\
    \ queryKey: messagesKey });\nvoid queryClient.invalidateQueries({\n  queryKey: conversationKeys.usage(vars.conversationId),\n\
    });"
  encoded_at:
  - src/features/chat/api/useSendMessage.ts
- node: rules/chat-workspace/stream-is-read-as-utf-8
  conforms: true
  how: 'src/features/chat/api/chat-stream.ts: held at streamChat, where the byte reader and decoder are
    created — `const reader = response.body.getReader();`

    `const decoder = new TextDecoder("utf-8");`'
  encoded_at:
  - src/features/chat/api/chat-stream.ts
- node: rules/chat-workspace/streamed-text-accumulates-at-the-end
  conforms: true
  how: "src/features/chat/state/chat-turn.ts: held at the appendText action, lines 127-128 — appendText:\
    \ (delta) =>\n  set((state) => ({ streamingText: state.streamingText + delta })),"
  encoded_at:
  - src/features/chat/state/chat-turn.ts
- node: rules/chat-workspace/streamed-text-growth-scrolls-to-the-bottom
  conforms: false
  how: 'src/features/chat/components/MessageStream.tsx, the useEffect that scrolls on stream deltas, lines
    251-261, in its dependency array: }, [streamingText, isStreaming, prefersReducedMotion]); — The rule
    says each growth of the streamed text scrolls the list and nothing else triggers that scroll. This
    effect also re-runs, and scrolls, whenever `isStreaming` or the reduced-motion preference changes
    while `streamingText` is non-empty. A change of the reduced-motion preference mid-turn would scroll
    the list with no text growth. Whether `isStreaming` flipping true can re-scroll depends on whether
    the store clears `streamingText` between turns, and that store is outside this file. The trigger set
    is decided here by the dependency array, and no node states it.'
  observed_at:
  - src/features/chat/components/MessageStream.tsx
- node: rules/chat-workspace/streaming-adds-an-in-flight-assistant-bubble
  conforms: true
  how: "src/features/chat/components/MessageStream.tsx: held at the conditional streaming ChatBubble after\
    \ the history, lines 371-379 — <ChatBubble\n          key=\"streaming\"\n          variant=\"assistant\"\
    \n          content={streamingText}\n          streaming\n          animate\n        />"
  encoded_at:
  - src/features/chat/components/MessageStream.tsx
- node: rules/chat-workspace/streaming-cursor-is-hidden-from-assistive-technology
  conforms: true
  how: "src/features/chat/components/StreamingCursor.tsx: held at the `aria-hidden=\"true\"` attribute\
    \ on the `<span>` returned by StreamingCursor, line 39 — <span\n      aria-hidden=\"true\"\n     \
    \ data-testid=\"streaming-cursor\""
  encoded_at:
  - src/features/chat/components/StreamingCursor.tsx
- node: rules/chat-workspace/streaming-disables-the-field-and-swaps-the-button
  conforms: true
  how: "src/features/chat/components/Composer.tsx: held at `isTextareaDisabled` and the `isStreaming ?\
    \ (<Button ... aria-label={ARIA_STOP}` ternary — const isTextareaDisabled = isStreaming || disabledNotice\
    \ !== null;\n...\n    {isStreaming ? (\n      <Button\n        type=\"button\"\n        variant=\"\
    destructive\""
  encoded_at:
  - src/features/chat/components/Composer.tsx
- node: rules/chat-workspace/streaming-flag-is-separate-from-the-status
  conforms: true
  how: 'src/features/chat/state/chat-turn.ts: held at the setStreaming action, line 132, beside setChatStatus,
    line 148. Each setter writes only its own field. — setStreaming: (isStreaming) => set({ isStreaming
    }),'
  encoded_at:
  - src/features/chat/state/chat-turn.ts
- node: rules/chat-workspace/successful-cancel-reads-the-usage-again
  conforms: true
  how: "src/features/chat/api/use-cancel-turn.ts: held at the onSuccess of useCancelTurn, lines 46-50\
    \ — onSuccess: () => {\n  void queryClient.invalidateQueries({\n    queryKey: conversationKeys.usage(conversationId),\n\
    \  });\n},"
  encoded_at:
  - src/features/chat/api/use-cancel-turn.ts
- node: rules/chat-workspace/successful-send-empties-the-field
  conforms: true
  how: "src/features/chat/components/Composer.tsx: held at `onSubmit` — if (result.errorCode === null)\
    \ {\n        reset({ content: \"\" });\n      }"
  encoded_at:
  - src/features/chat/components/Composer.tsx
- node: rules/chat-workspace/text-delta-appends-and-makes-the-status-streaming
  conforms: true
  how: 'src/features/chat/api/useSendMessage.ts: held at dispatchFrame, case "text_delta" — actions.appendText(frame.delta);

    actions.setChatStatus("streaming");'
  encoded_at:
  - src/features/chat/api/useSendMessage.ts
- node: rules/chat-workspace/title-is-sent-as-given
  conforms: true
  how: 'src/features/chat/api/use-create-conversation.ts: held at lines 35 and 42. The variables become
    the body unchanged, with no length or content check. — const body: CreateConversationVariables = vars
    ?? {};

    ...

    body: JSON.stringify(body),'
  encoded_at:
  - src/features/chat/api/use-create-conversation.ts
- node: rules/chat-workspace/tool-call-waits-while-its-outcome-is-null
  conforms: true
  how: 'src/features/chat/components/ChatStatusIndicator.tsx: held at the condition inside pickActiveToolName,
    line 119 — if (chip !== undefined && chip.ok === null) return chip.tool;'
  encoded_at:
  - src/features/chat/components/ChatStatusIndicator.tsx
- node: rules/chat-workspace/tool-hint-names-the-waiting-tool
  conforms: true
  how: "src/features/chat/components/ChatStatusIndicator.tsx: held at pickActiveToolName (the backwards\
    \ loop, lines 112-122) and the tool_running branch of the label, lines 160-162 — for (let i = chips.length\
    \ - 1; i >= 0; i -= 1) {\n    const chip = chips[i];\n    if (chip !== undefined && chip.ok === null)\
    \ return chip.tool;\n  }\n  return null;\nlabel =\n      active !== null ? `${COPY_TOOL_PREFIX} (${active})`\
    \ : COPY_TOOL_PREFIX;"
  encoded_at:
  - src/features/chat/components/ChatStatusIndicator.tsx
- node: rules/chat-workspace/tool-result-settles-the-last-chip
  conforms: true
  how: 'src/features/chat/api/useSendMessage.ts: held at dispatchFrame, case "tool_result" — actions.updateLastToolChip(frame.ok);

    actions.setChatStatus("streaming");'
  encoded_at:
  - src/features/chat/api/useSendMessage.ts
- node: rules/chat-workspace/tool-start-adds-a-chip-and-makes-the-status-tool-running
  conforms: true
  how: "src/features/chat/api/useSendMessage.ts: held at dispatchFrame, case \"tool_start\". The status\
    \ value is \"tool_running\" and the node's name is \"tool-running\"; see the finding. — actions.addToolChip({\n\
    \  tool: frame.tool,\n  argsSummary: frame.argsSummary,\n  ok: null,\n});\nactions.setChatStatus(\"\
    tool_running\");"
  encoded_at:
  - src/features/chat/api/useSendMessage.ts
- node: rules/chat-workspace/turn-holds-one-abort-handle
  conforms: true
  how: 'src/features/chat/state/chat-turn.ts: held at the abortController field, line 68, and the setAbortController
    action, line 125 — abortController: AbortController | null;'
  encoded_at:
  - src/features/chat/state/chat-turn.ts
- node: rules/chat-workspace/turn-holds-the-idempotency-key
  conforms: true
  how: 'src/features/chat/state/chat-turn.ts: held at the idempotencyKey field, line 73, and the setIdempotencyKey
    action, line 130 — idempotencyKey: string | null;'
  encoded_at:
  - src/features/chat/state/chat-turn.ts
- node: rules/chat-workspace/turn-starts-empty-and-idle
  conforms: true
  how: 'src/features/chat/state/chat-turn.ts: held at the initialState constant, lines 111-118 — streamingText:
    "",

    toolChips: [] as ReadonlyArray<ToolCallData>,

    abortController: null as AbortController | null,

    idempotencyKey: null as string | null,

    isStreaming: false,

    chatStatus: "idle" as ChatStatus,'
  encoded_at:
  - src/features/chat/state/chat-turn.ts
- node: rules/chat-workspace/turn-state-holds-the-abort-handle-while-the-stream-is-open
  conforms: true
  how: 'src/features/chat/api/useSendMessage.ts: held at mutationFn, lines 200-205 — const controller
    = new AbortController();

    ...

    actions.setAbortController(controller);'
  encoded_at:
  - src/features/chat/api/useSendMessage.ts
- node: rules/chat-workspace/turn-state-lives-in-memory-only
  conforms: true
  how: 'src/features/chat/state/chat-turn.ts: held at the store creation, line 120. It is a bare zustand
    `create` with no persistence middleware. — export const useChatTurnStore = create<ChatTurnState>((set)
    => ({'
  encoded_at:
  - src/features/chat/state/chat-turn.ts
- node: rules/chat-workspace/turn-text-and-chips-stay-until-the-next-send
  conforms: true
  how: 'src/features/chat/api/useSendMessage.ts: held at the finally block clears only the streaming flag
    and the abort handle. The text and chips are cleared only by resetTurn() at the start of the next
    send. — actions.setStreaming(false);

    actions.setAbortController(null);'
  encoded_at:
  - src/features/chat/api/useSendMessage.ts
- node: rules/chat-workspace/turn-without-a-terminal-frame-keeps-the-last-status
  conforms: true
  how: "src/features/chat/api/useSendMessage.ts: held at nothing in this file sets a status when the loop\
    \ ends, so the last frame's status stays — } finally {\n  actions.setStreaming(false);\n  actions.setAbortController(null);\n\
    }"
  encoded_at:
  - src/features/chat/api/useSendMessage.ts
- node: rules/chat-workspace/turn-without-a-terminal-frame-resolves-empty
  conforms: true
  how: 'src/features/chat/api/useSendMessage.ts: held at the initial values of the result variables, lines
    244-246 — let stopReason: string | null = null;

    let errorCode: string | null = null;

    let errorMessage: string | null = null;'
  encoded_at:
  - src/features/chat/api/useSendMessage.ts
- node: rules/chat-workspace/unparseable-timestamp-becomes-an-invalid-date
  conforms: true
  how: 'src/features/chat/api/_transforms.ts: held at `toConversation` (`archivedAt` and `createdAt`)
    and `toChatMessage` (`createdAt`) — createdAt: new Date(wire.created_at),

    archivedAt: wire.archived_at !== null ? new Date(wire.archived_at) : null,

    The transforms construct `Date` directly. They have no validation and no try/catch, so an unparseable
    string becomes an invalid date without failing the read.'
  encoded_at:
  - src/features/chat/api/_transforms.ts
- node: rules/chat-workspace/unterminated-last-frame-is-read
  conforms: true
  how: 'src/features/chat/api/chat-stream.ts: held at streamChat, the tail drain after the loop ends —
    `const tail = buffer.trim();`

    `const frame = parseSSEFrame(tail);`'
  encoded_at:
  - src/features/chat/api/chat-stream.ts
- node: rules/chat-workspace/update-refreshes-the-details-and-every-read
  conforms: true
  how: "src/features/chat/api/use-update-conversation.ts: held at onSuccess, lines 57-64 — void queryClient.invalidateQueries({\n\
    \  queryKey: conversationKeys.detail(data.id),\n});\nvoid queryClient.invalidateQueries({\n  queryKey:\
    \ conversationKeys.all,\n});"
  encoded_at:
  - src/features/chat/api/use-update-conversation.ts
- node: rules/chat-workspace/update-sends-only-the-fields-supplied
  conforms: true
  how: 'src/features/chat/api/use-update-conversation.ts: held at mutationFn, lines 41-43 and 52 — const
    body: Record<string, unknown> = {};

    if (title !== undefined) body["title"] = title;

    if (archivedAt !== undefined) body["archived_at"] = archivedAt;

    ...

    body: JSON.stringify(body),'
  encoded_at:
  - src/features/chat/api/use-update-conversation.ts
- node: rules/chat-workspace/usage-badge-shows-nothing-until-usage-arrives
  conforms: true
  how: "src/features/chat/components/UsageBadge/UsageBadge.tsx: held at the early return at lines 64-66\
    \ — if (query.isLoading || query.data == null) {\n  return null;\n}"
  encoded_at:
  - src/features/chat/components/UsageBadge/UsageBadge.tsx
- node: rules/chat-workspace/usage-badge-shows-the-three-counts
  conforms: true
  how: 'src/features/chat/components/UsageBadge/UsageBadge.tsx: held at the destructuring at line 68 and
    the three rendered spans, lines 81-92 — const { tokens_in, tokens_out, tool_calls } = query.data;

    with spans data-testid="usage-badge-tokens-in", "usage-badge-tokens-out" and "usage-badge-tool-calls".
    `messages` is never read.'
  encoded_at:
  - src/features/chat/components/UsageBadge/UsageBadge.tsx
- node: rules/chat-workspace/validation-message-is-an-alert
  conforms: true
  how: 'src/features/chat/components/Composer.tsx: held at the message `<p>` `role` prop — role={hasError
    ? "alert" : undefined}'
  encoded_at:
  - src/features/chat/components/Composer.tsx
- node: rules/chat-workspace/waiting-hint-sits-below-the-last-bubble
  conforms: true
  how: 'src/features/chat/components/MessageStream.tsx: held at `<ChatStatusIndicator />` at line 387,
    inside the non-empty branch only. It is not rendered in the pending or error branches. — <ChatStatusIndicator
    />'
  encoded_at:
  - src/features/chat/components/MessageStream.tsx
- node: rules/chat-workspace/whitespace-only-content-passes
  conforms: true
  how: "src/features/chat/components/Composer.tsx: held at `composerSchema`, with no trim on the content\
    \ — content: z\n    .string()\n    .min(1, MSG_EMPTY)\n    .max(MAX_CONTENT_LENGTH, MSG_TOO_LONG),"
  encoded_at:
  - src/features/chat/components/Composer.tsx
- node: rules/chat/conversation-listing-excludes-archived
  conforms: true
  how: 'src/features/chat/api/use-list-conversations.ts: held at buildQueryString, line 34. The request
    names archived conversations only when `includeArchived` is true. — if (params.includeArchived ===
    true) search.set("include_archived", "true");'
  encoded_at:
  - src/features/chat/api/use-list-conversations.ts
- node: scenarios/chat-workspace/escape-stops-a-streaming-turn
  conforms: true
  how: 'src/features/chat/components/Composer.tsx: held at the `useEffect` document keydown listener —
    document.addEventListener("keydown", onKeyDown);'
  encoded_at:
  - src/features/chat/components/Composer.tsx
- node: scenarios/chat-workspace/failed-send-keeps-the-typed-text
  conforms: true
  how: "src/features/chat/components/Composer.tsx: held at `onSubmit`, where `reset` runs only when `errorCode`\
    \ is null — if (result.errorCode === null) {\n        reset({ content: \"\" });\n      }"
  encoded_at:
  - src/features/chat/components/Composer.tsx
- node: scenarios/chat-workspace/malformed-frame-is-skipped
  conforms: true
  how: 'src/features/chat/api/chat-stream.ts: held at parseSSEFrame (the JSON.parse catch) and the drain
    loop, which yields only non-null frames — `try { payload = JSON.parse(dataLine); } catch { return
    null; }`

    `if (frame !== null) yield frame;`'
  encoded_at:
  - src/features/chat/api/chat-stream.ts
- node: scenarios/chat-workspace/second-graph-delta-adds-to-the-first
  conforms: true
  how: 'src/features/chat/api/useSendMessage.ts: held at the graphReplacedThisTurn branch of the stream
    loop, lines 270-278 — gs.replaceNodes(delta);

    graphReplacedThisTurn = true;'
  encoded_at:
  - src/features/chat/api/useSendMessage.ts
unstated:
- file: src/features/chat/api/use-get-conversation-usage.ts
  where: the queryFn request, line 29
  evidence: '{ method: "GET", headers: authHeader() },'
  cost: The usage read carries the owner's access token, and no node says reads do. The only bearer rule
    that lists this file, send-carries-the-access-token-when-held, is worded for a send. The contract's
    read-conversation-usage answer names no header. A reader looking in the specification for what a read
    sends finds nothing, and the behavior lives only in code.
- file: src/features/chat/api/use-list-messages.ts
  where: line 46, the options passed to http() in queryFn
  evidence: '{ method: "GET", headers: authHeader() },'
  cost: The message read attaches the owner's bearer through authHeader() (in ./_request), and no node
    of the chat workspace states that a read carries it. The chat nodes state it only for a send ("A send
    MUST carry the owner's access token as a bearer...") and for cancelling a turn. The curation and ingestion
    contexts each have a node for the same fact on their requests. A reader looking in the specification
    for how chat reads authenticate finds nothing, and the behaviour lives only in this code.
- file: src/features/chat/types.ts
  where: ActiveConversation interface, lines 112-120
  evidence: "export interface ActiveConversation {\n  readonly id: string;\n  readonly title: string |\
    \ null;\n  /** Derived: `archivedAt !== null`. */\n  readonly isArchived: boolean;\n  readonly archivedAt:\
    \ Date | null;\n  readonly messages: ReadonlyArray<ChatMessage>;\n  readonly usage: UsageData | null;\n\
    }"
  cost: This composed model joins a conversation's detail, its messages and its usage into one type, with
    `usage` allowed to be absent. No node holds that composition. The nearest, `rules/chat-workspace/conversation-is-archived-when-its-detail-says-so`,
    constrains `domain/chat-workspace/chat-session` and says nothing of this model. The shape the screen
    reads from lives only in the type.
- file: src/features/chat/types.ts
  where: ChatContentBlock interface, lines 54-58
  evidence: "export interface ChatContentBlock {\n  readonly type: string;\n  readonly text?: string;\n\
    \  readonly [key: string]: unknown;\n}"
  cost: The shape of a content block is a `type` string, an optional `text` and any further fields, and
    no node declares it. The nearest rule, `rules/chat-workspace/message-text-joins-its-blocks`, speaks
    of "the text of its content blocks" and does not give the block a shape. A reader who opens the specification
    to learn what a block carries will not find it, and the type here becomes the only place it is decided.
restates:
- file: src/features/chat/api/_request.ts
  where: the docstring of httpVoid, lines 34-44, and the comment at lines 71-72
  evidence: "\" *  - 204 → resolves void.\n *  - 4xx with envelope body → throws `EnvelopeError` mirroring\
    \ lib/http.ts.\n *  - 5xx or network / abort failures → throws `EnvelopeError` with a\n *    `SYSTEM_*`\
    \ code so the central error router classifies them.\"\n\"// Any non-204 — including 200 with body\
    \ — is treated as an error path\""
  cost: The 204-only success rule and the failure classes exist as prose and as code (`if (response.status
    === 204) return;` followed by the unconditional `throw new EnvelopeError`). Two readable statements
    of the rule exist, and if the code changes the comment will still claim the old rule.
  node: rules/chat-workspace/no-body-request-succeeds-only-on-204
- file: src/features/chat/api/_request.ts
  where: the docstring of httpVoid, lines 34-44, together with the header comment, lines 16-21
  evidence: "\" *  - 5xx or network / abort failures → throws `EnvelopeError` with a\n *    `SYSTEM_*`\
    \ code so the central error router classifies them.\"\n\" *  - `httpVoid()` is a NARROW carve-out\
    \ for the single 204 endpoint of this\n *    feature (`DELETE /conversations/:id`).\""
  cost: The delete-conversation refusal table (SYSTEM_ABORTED, SYSTEM_NETWORK, SYSTEM_UPSTREAM, SYSTEM_UNKNOWN,
    with HTTP status 0 for abort and network) is restated in prose. The code that holds it is the `catch`
    and the `code`/`message` ternaries of httpVoid. The prose names no codes and no messages, so it cannot
    be checked against the node.
  node: contracts/chat-workspace/bff-conversations
- file: src/features/chat/api/_request.ts
  where: the header block comment, lines 1-22, and the docstring of authHeader, line 28
  evidence: "\" *  - `authHeader()` reads the JWT from the Zustand store at call time so\n *    every\
    \ request sees the freshest token after sign-in / refresh.\"\n\"/** Build the `Authorization: Bearer\
    \ <jwt>` header when a token is present. */\""
  cost: 'The bearer rule for cancel-turn is stated in prose here and held by `authHeader()`, whose body
    is `token !== null ? { Authorization: `Bearer ${token}` } : {}`. A reader who finds the comment may
    take it as the rule''s home. The comment also cites docs/specs/front/features/chat.feature.spec.md
    and `dev_tc_003-delivery.md` as authorities, and the node no longer points to either.'
  node: rules/chat-workspace/cancelling-a-turn-is-a-separate-request
- file: src/features/chat/api/_transforms.ts
  where: the header docblock, lines 1-11 (the "Spec references" paragraph), and the "Wire shapes (mirror
    openapi.yaml ...)" banner comment, lines 22-25
  evidence: "* Spec references:\n *  - docs/specs/front/features/chat.feature.spec.md §4 \"Response transforms\"\
    \n *    table (date casts; `messages` → `messageCount` rename for usage)"
  cost: 'The docblock states in prose the contract''s facts that the file already holds in code: the timestamp
    casts to dates, and the `messages` count read as `messageCount`. It also names a document under docs/specs
    as the authority for them. A reader who follows the comment goes to that document, not to the node
    `contracts/chat-workspace/bff-conversations`. The citation can go stale without anything failing,
    because no tool reads it.'
  node: contracts/chat-workspace/bff-conversations
- file: src/features/chat/api/chat-stream.ts
  where: comment at lines 146-147, inside parseSSEFrame
  evidence: '`// Multi-line `data:` per SSE spec would concatenate with `\n`; the BFF`

    `// emits single-line JSON, so the last `data:` wins on malformed input.`'
  cost: 'The prose restates the data-line rule and says the last `data:` wins. The code on the next line
    joins every data line with a newline: `dataLine = dataLine === null ? value : `${dataLine}\n${value}``.
    It is the last `event:` line that wins. A reader who trusts the comment gets the opposite rule from
    the one the code runs.'
  node: rules/chat-workspace/event-names-the-frame-and-data-carries-it
- file: src/features/chat/api/chat-stream.ts
  where: comment at lines 355-356, before the trailing-frame drain
  evidence: '`// Drain a trailing partial frame (rare — well-behaved servers terminate`

    `// with `\n\n`, but defensive).`'
  cost: Prose restates the rule that an unterminated last frame is read. The code holds it in `const tail
    = buffer.trim();` and the `parseSSEFrame(tail)` call that follows.
  node: rules/chat-workspace/unterminated-last-frame-is-read
- file: src/features/chat/api/chat-stream.ts
  where: header docblock lines 25-26 and the comment above the drain loop, line 345
  evidence: '`Splits on the SSE frame boundary `\n\n`. A multi-line frame may contain`

    `// Drain all complete frames (separated by `\n\n`).`'
  cost: Prose restates where a frame ends. The code holds this at `buffer.indexOf("\n\n")`. The next reader
    has two places that appear to decide the boundary.
  node: rules/chat-workspace/frames-end-at-a-blank-line
- file: src/features/chat/api/chat-stream.ts
  where: header docblock lines 28-31
  evidence: '`Malformed frames (missing event/data, non-JSON data, unknown event name)`

    `are SKIPPED silently`'
  cost: Prose restates the skip rule, which parseSSEFrame holds by returning `null` and streamChat holds
    by yielding only non-null frames. The comment also states the rule more narrowly than the node. It
    omits fields of the wrong type and data that is not an object.
  node: rules/chat-workspace/malformed-frames-are-skipped-silently
- file: src/features/chat/api/chat-stream.ts
  where: header docblock lines 32-33
  evidence: '`Pre-stream HTTP errors (4xx/5xx) emit one terminal `error` frame`

    `constructed from the envelope body when possible, then return.`'
  cost: Prose restates how a refused send is answered. The contract holds that, and extractPreStreamError
    and the `!response.ok` branch carry it in code. The comment names only 4xx/5xx, where the code handles
    every non-2xx status.
  node: contracts/chat-workspace/bff-conversations
- file: src/features/chat/api/chat-stream.ts
  where: header docblock lines 34-35 and the docblock of streamChat, lines 273-275
  evidence: '`Caller-driven abort via `options.signal` propagates to `fetch()` and the`

    `reader; the generator returns cleanly (no throw on abort).`'
  cost: Prose restates the quiet-abort rule, which the code holds in both `if (isAbort) return;` branches.
    A second statement of the rule sits beside the node.
  node: rules/chat-workspace/aborting-ends-the-reading-quietly
- file: src/features/chat/api/chat-stream.ts
  where: header docblock lines 8-10 ("six event names") and the comment above ChatSSEFrame, line 107
  evidence: '`six event names: `llm_start`, `text_delta`, `tool_start`, `tool_result`, `done`, `error``

    `/** Discriminated union of all 7 SSE frame variants. */`'
  cost: Prose names the event kinds a second time, outside any node, and the two comments disagree (six,
    then seven). The union and the switch in parseSSEFrame already hold the seven kinds. A reader who
    trusts the header will think `graph_delta` is not part of the stream.
  node: domain/chat/turn-event-kind
- file: src/features/chat/api/chat-stream.ts
  where: line 137, inside parseSSEFrame
  evidence: '`if (line.startsWith(":")) continue; // SSE comment / keep-alive`'
  cost: The trailing comment restates the rule that comment and colonless lines are ignored. The code
    holds that rule in this line and in the `colon === -1` branch below it.
  node: rules/chat-workspace/comment-and-colonless-lines-are-ignored
- file: src/features/chat/api/chat-stream.ts
  where: line 141, inside parseSSEFrame
  evidence: '`// Per SSE spec, an optional single space follows the colon.`'
  cost: Prose restates the field and value reading rule. `.replace(/^ /, "")` holds it in the same line.
    The comment also cites an outside specification as its authority.
  node: rules/chat-workspace/frame-lines-are-field-value-pairs
- file: src/features/chat/api/use-cancel-turn.ts
  where: the file docstring, lines 1-2 and 17-21 ("POST /api/v1/conversations/:id/cancel", "we invalidate
    `usage(id)` opportunistically")
  evidence: "/**\n * useCancelTurn — POST /api/v1/conversations/:id/cancel.\n...\n * Cache: we invalidate\
    \ `usage(id)` opportunistically."
  cost: 'The cancel endpoint and the rule that a successful cancel reads the usage again each have a second
    home in prose here. A later change to the node leaves this docstring saying the old fact, and `--check`
    does not see a comment. The code holds both facts in the same file: the `http` call to `/cancel` and
    `invalidateQueries({ queryKey: conversationKeys.usage(conversationId) })`.'
  node: rules/chat-workspace/successful-cancel-reads-the-usage-again
- file: src/features/chat/api/use-cancel-turn.ts
  where: the file docstring, lines 12-15 ("the conversation id is bound at hook construction; `mutate()`
    takes no vars")
  evidence: "* Signature per TC-03 task summary: `useCancelTurn(conversationId)` — the\n * conversation\
    \ id is bound at hook construction; `mutate()` takes no vars.\n * The id is captured at hook time,\
    \ not at mutate time, because the stop\n * button always targets the currently active conversation."
  cost: 'The rule that the cancel targets the hook''s conversation and takes no argument is also written
    as prose, together with a rationale ("because the stop button always targets the currently active
    conversation") that no node holds. A reader may take the rationale for the decided reason. The code
    holds the rule: `useCancelTurn(conversationId: string)` returns `UseMutationResult<CancelWire, Error,
    void>`, and `mutationFn: async () =>` reads the captured id.'
  node: rules/chat-workspace/cancel-targets-the-conversation-it-was-created-for
- file: src/features/chat/api/use-create-conversation.ts
  where: the header docstring, lines 7-9, the clause about invalidating the list
  evidence: "§3 transition table: on success, navigate to /chat?conversation=<new-id>\n *    AND invalidate\
    \ `conversationKeys.list()` (handled here — navigation is\n *    the caller's responsibility)."
  cost: The prose says the invalidation targets `conversationKeys.list()`. The code invalidates `conversationKeys.all`.
    A reader who trusts the docstring will believe only the list is refreshed, when the node and the code
    refresh every conversation-scoped read. The prose is a second home for the fact and it disagrees with
    the code.
  node: rules/chat-workspace/create-refreshes-every-conversation-read
- file: src/features/chat/api/use-create-conversation.ts
  where: the inline comment above the invalidation in onSuccess, lines 47-50
  evidence: "// Both filter variants must refresh (include_archived true | false).\nvoid queryClient.invalidateQueries({\n\
    \  queryKey: conversationKeys.all,\n});"
  cost: The comment states, in prose, the rule that every conversation-scoped read is refreshed after
    a create. The same fact is already held by the node and by the invalidation call beneath it. When
    either moves, the comment keeps saying the old thing, and it reads as a second home for the rule.
  node: rules/chat-workspace/create-refreshes-every-conversation-read
- file: src/features/chat/api/use-delete-conversation.ts
  where: the comment inside onSuccess, lines 43-44
  evidence: '// Drop the detail + nested children from the cache outright — the

    // entity no longer exists. List queries refresh from the server.'
  cost: 'The cache-removal and re-read rule is restated in prose beside the calls that carry it (`removeQueries`
    for detail, messages and usage, and `invalidateQueries({ queryKey: conversationKeys.all })`). The
    comment says only "list queries refresh", while the code invalidates every conversation-scoped key.
    The comment and the code can drift apart, and a reader would not know which one was decided.'
  node: rules/chat-workspace/delete-removes-the-conversations-reads
- file: src/features/chat/api/use-delete-conversation.ts
  where: the file docstring, lines 12-15
  evidence: '* Because the endpoint returns 204, this hook uses the local `httpVoid`

    * helper (see `_request.ts`) instead of `http<T>()` — `http<T>` always

    * tries to `response.json()` which throws on an empty body. Narrow scope:

    * only this hook depends on `httpVoid`.'
  cost: The no-body helper rule has a second home in prose. When the node moves, this text stays and still
    reads as the reason. The code (`await httpVoid(...)` in `mutationFn`) is where the rule is held, and
    a reader who finds the docstring first will take it for the decision.
  node: rules/chat-workspace/delete-uses-the-no-body-helper
- file: src/features/chat/api/use-get-conversation-usage.ts
  where: 'the header docstring, line 8 ("§4 transforms: rename `messages` → `messageCount`, flatten to
    root.")'
  evidence: '*  - §4 transforms: rename `messages` → `messageCount`, flatten to root.'
  cost: How the usage answer is read (`messages` kept as the message count) is described a second time
    in this file's prose, while the code that does it sits in another file. The two can drift apart without
    anyone noticing. Removing the docstring changes no behavior.
  node: contracts/chat-workspace/bff-conversations
- file: src/features/chat/api/use-get-conversation-usage.ts
  where: 'the header docstring, lines 6-7 ("chat.feature.spec.md §4 (request #4 ... staleTime 30s, manual
    revalidation)")'
  evidence: '* - chat.feature.spec.md §4 (request #4: lazy, sequential after #2;

    *    staleTime 30s, manual revalidation)'
  cost: The thirty-second freshness window is stated a second time in prose, next to the code that holds
    it. When the rule moves, this docstring keeps the old figure and nothing tells the next reader which
    one was decided. Removing the docstring changes no behavior.
  node: rules/chat-workspace/conversation-reads-stay-fresh-for-thirty-seconds
- file: src/features/chat/api/use-get-conversation.ts
  where: 'the header docblock, lines 1-9, the "chat.feature.spec.md §4 (request #2 ...)" bullet'
  evidence: "chat.feature.spec.md §4 (request #2: critical priority, staleTime 30s,\n   on-focus revalidation,\
    \ parallel with #3 `listMessages`)"
  cost: 'The thirty-second freshness and the refetch on focus are stated in the docblock and also held
    by code, in this file as `staleTime: STALE_MS` and `refetchOnWindowFocus: true`. A reader can take
    the docblock for the place those values are decided, and if a node changes it keeps saying the old
    value with nothing to flag it.'
  node: rules/chat-workspace/conversation-reads-stay-fresh-for-thirty-seconds
- file: src/features/chat/api/use-list-conversations.ts
  where: the docblock on `includeArchived` in ListConversationsParams, line 24
  evidence: /** Default false — archived rows excluded. */
  cost: The comment restates the exclusion of archived conversations by default. The code holds it as
    `if (params.includeArchived === true) search.set("include_archived", "true");`, so nothing is sent
    unless archived conversations are asked for. The default now has a second home in prose.
  node: rules/chat-workspace/listing-excludes-archived-by-default
- file: src/features/chat/api/use-list-conversations.ts
  where: the docblock on `limit` in ListConversationsParams, line 20
  evidence: /** Page size — clamped server-side to [1, 100]. Default 20. */
  cost: 'The comment restates the listing''s page-size bounds and default. Those are held by node rules/chat/conversation-listing-limit,
    which is outside this file''s set, and by code in backend/src/modules/chat/routes/chat.schemas.ts
    as `limit: z.coerce.number().int().min(1).max(100).default(20)`. This file holds none of it. The comment
    also says "clamped", but that schema rejects out-of-range values rather than clamping them. A reader
    of the screen code sees a second statement of the bounds that no running system reads.'
  node: rules/chat/conversation-listing-limit
- file: src/features/chat/api/use-list-conversations.ts
  where: the header docblock, lines 4-8 (the "on-focus revalidation" clause)
  evidence: on-focus revalidation)
  cost: 'The docblock states the re-read on window focus that `refetchOnWindowFocus: true` already performs.
    The fact has a second home in prose, and the two can drift apart without anyone noticing.'
  node: rules/chat-workspace/details-and-listing-are-read-again-on-focus
- file: src/features/chat/api/use-list-conversations.ts
  where: the header docblock, lines 4-8 (the "staleTime 30s" clause)
  evidence: 'chat.feature.spec.md §4 (request #1: parallel header mount, staleTime 30s,'
  cost: 'The docblock states a thirty-second freshness window that the code also holds, as `const STALE_MS
    = 30_000;` and `staleTime: STALE_MS`. The window now has a second home outside behavior. A reader
    who changes one of the two will not know which was decided. The prose also cites a spec file by name
    instead of the node.'
  node: rules/chat-workspace/conversation-reads-stay-fresh-for-thirty-seconds
- file: src/features/chat/api/use-update-conversation.ts
  where: 'the docblocks on `title` and `archivedAt` in UpdateConversationVariables (lines 23-30), and
    the "partial body: title?, archived_at?" bullet in the header (line 5)'
  evidence: "/** Pass `null` to clear, omit to leave untouched. */\n/**\n   * RFC3339 timestamp to archive,\
    \ `null` to un-archive, or omit."
  cost: The prose restates how a null or absent title and archived_at are sent. The mutationFn code holds
    that rule (`if (title !== undefined) body["title"] = title;` and `if (archivedAt !== undefined) body["archived_at"]
    = archivedAt;`). The comments are a second home that a change to the node would not reach.
  node: rules/chat-workspace/update-sends-only-the-fields-supplied
- file: src/features/chat/api/use-update-conversation.ts
  where: the header docblock, lines 1-9 (the "§3 transition table" bullet)
  evidence: "*  - §3 transition table: on rename success invalidate `detail(id)` + `list()`;\n *    on\
    \ archive success invalidate `list()` (and the caller navigates)."
  cost: The docblock states an invalidation rule that differs by kind of update, and the code does not.
    onSuccess always marks `detail(data.id)` stale and then `conversationKeys.all`, for a rename and an
    archive alike. A reader who trusts the comment will look here for a second home of the rule and find
    it disagrees with the node and with the code beneath it. Code holds the fact, so the pair conforms
    and what is owed is the prose's removal. The code is in this file's onSuccess, and `conversationKeys.all`
    is declared in src/features/chat/api/keys.ts.
  node: rules/chat-workspace/update-refreshes-the-details-and-every-read
- file: src/features/chat/api/useSendMessage.ts
  where: the comment above `let graphReplacedThisTurn = false;` (lines 247-253)
  evidence: '// Turn-scoped: has THIS response already reset the graph pane? The first

    // graph result of a response REPLACES the prior response''s graph

    // (non-cumulative — owner decision 2026-06-22); later graph results in

    // the SAME response compose onto it via `addNodes`.'
  cost: The replace-then-add rule is held by the code (replaceNodes/addNodes with the graphReplacedThisTurn
    flag) and by the node. The comment is a second home outside behavior, and the "owner decision" date
    it cites will not follow the node when the node moves.
  node: rules/chat-workspace/first-graph-delta-replaces-and-later-ones-add
- file: src/features/chat/api/useSendMessage.ts
  where: the comments in dispatchFrame, case "error" (lines 418-419), and in the `finally` block (lines
    290-293)
  evidence: '// chatStatus → error (sticky banner). The next `reset()` on the next

    // send clears it back to `idle` — see plan §12.2.'
  cost: The error status staying until the next send, and the accumulated text and chips staying after
    the turn, are held by code (resetTurn() at the start of mutationFn, and a `finally` that clears only
    setStreaming and setAbortController). The comments restate them and cite a plan section, giving the
    rule a second home.
  node: rules/chat-workspace/error-status-stays-until-the-next-send
- file: src/features/chat/api/useSendMessage.ts
  where: the docblock above `const GRAPH_TOOLS` (lines 319-336)
  evidence: '* The closed set of graph-producing chat tools (chat tool catalog, plan §3.3 /

    * `tool-catalog.ts`).

    *

    * Match must be exact (no prefix/substring) — the backend forwards the

    * registered tool slug verbatim on `tool_start.tool` and `graph_delta.sourceTool`.'
  cost: The closed set and the exact-name match are held by code (the GRAPH_TOOLS Set and isGraphTool)
    and by the node. The docblock repeats them, so a change to the tool list has two places to drift.
    It also cites a plan section and a spec version as authority.
  node: rules/chat-workspace/graph-tool-start-puts-the-graph-pane-into-loading
- file: src/features/chat/api/useSendMessage.ts
  where: the header docblock, responsibilities 1-5 (lines 17-56)
  evidence: '*  5. Read the JWT from `useAuthStore.getState()` at SEND TIME (not via the

    *     hook — non-reactive), per the spec''s "auth token via

    *     `useAuthStore.getState().accessToken`" rule.'
  cost: Send-time token reading, the Bearer header only when a token is held, the new idempotency key
    per send and the frame-to-status routing are all held by code in this file and by their nodes. The
    docblock restates them and points to spec files outside the specification root (docs/specs/...), so
    a reader is directed to a source that is not the specification.
  node: rules/chat-workspace/send-carries-the-access-token-when-held
- file: src/features/chat/components/ChatStatusIndicator.tsx
  where: docblock of pickActiveToolName, lines 99-111
  evidence: "* The \"active\" tool is the most recent pending chip — `tool_start` adds\n * with `ok: null`;\
    \ `tool_result` settles it (boolean)."
  cost: The rule that a chip with a null outcome is still waiting, and that the hint names the most recent
    one, is stated again in prose. The loop `if (chip !== undefined && chip.ok === null) return chip.tool;`
    holds both rules in this file. Two readings of the same rule then sit side by side.
  node: rules/chat-workspace/tool-hint-names-the-waiting-tool
- file: src/features/chat/components/ChatStatusIndicator.tsx
  where: header docblock, lines 17-28 (AC-F.17/18/19 and the TC-FE-10 quotes)
  evidence: "*   - AC-F.18 — during a graph tool, the indicator shows\n *     \"consultando a memória…\
    \ (tool)\"."
  cost: The hint wording is quoted again in prose, with the wording "(tool)" and a separate "graph tool"
    scope that the node does not hold. A reader comparing comment to node finds two versions. The constants
    `COPY_THINKING` and `COPY_TOOL_PREFIX` and the template in the label branch hold the wording in code.
  node: contracts/chat-workspace/chat-screen
- file: src/features/chat/components/ChatStatusIndicator.tsx
  where: header docblock, lines 34-39 (the "State machine consumed" list)
  evidence: "*   idle         → indicator NOT rendered (null)\n *   thinking     → \"pensando…\"\n * \
    \  streaming    → indicator NOT rendered (token text takes over)\n *   tool_running → \"consultando\
    \ a memória…\" (+ optional \" (tool name)\" suffix)\n *   error        → indicator NOT rendered (a\
    \ separate banner — owned by the"
  cost: The phases in which the hint shows are written a second time in prose that no running system emits.
    If the rule moves, a reader can follow the comment instead of the guard at line 148. The guard `if
    (chatStatus !== "thinking" && chatStatus !== "tool_running") { return null; }` in this file holds
    the fact.
  node: rules/chat-workspace/hint-hides-in-every-other-phase
- file: src/features/chat/components/ChatStatusIndicator.tsx
  where: header docblock, lines 67-72 ("Accessibility" paragraph)
  evidence: "*   - `role=\"status\"` + `aria-live=\"polite\"` so AT announces the phrase\n *     without\
    \ interrupting the user.\n *   - `aria-atomic=\"true\"` — when the phrase flips"
  cost: The polite, atomic status region is described a second time as prose. The attributes `role="status"`,
    `aria-live="polite"` and `aria-atomic="true"` on the rendered div already hold it. A reader could
    take the comment as the place the requirement lives.
  node: rules/chat-workspace/hint-is-a-polite-atomic-status-region
- file: src/features/chat/components/ChatWorkspace.tsx
  where: comment above `useGraphPersistence(conversation)`, lines 154-157
  evidence: "BR-42: restore the saved graph view when the conversation changes,\n  // and save it whenever\
    \ nodes/positions/layoutNonce change."
  cost: The restore-and-save rule is restated in prose, citing a back-spec rule id. This file holds only
    the call `useGraphPersistence(conversation)`. The restore and save behavior is in `src/features/graph/api/use-graph-persistence`,
    which is outside this file set and which I did not read. The prose also names `layoutNonce` and positions,
    which this file does not state in code.
  node: rules/chat-workspace/graph-view-is-restored-and-saved-per-conversation
- file: src/features/chat/components/ChatWorkspace.tsx
  where: comment above the conversation-change effect, lines 136-148
  evidence: "when the active conversation changes —\n  // including the `undefined → uuid` transition\
    \ on first selection and the\n  // `uuid → undefined` transition on leaving — the subgraph must be\
    \ cleared."
  cost: The clear-the-graph-and-close-the-detail rule is restated in prose over the effect that holds
    it (`useGraphStore.getState().clear(); setSelectedNode(null);`). The prose also gives a reason (a
    coherence and privacy bug) that no node records.
  node: rules/chat-workspace/changing-conversation-clears-the-graph-and-the-detail
- file: src/features/chat/components/ChatWorkspace.tsx
  where: comment inside the `GraphSpace` props, lines 230-231
  evidence: "Same `exactOptionalPropertyTypes` discipline — only spread\n          // `errorMessage` when\
    \ the store actually has one."
  cost: 'The rule that the pane gets the error message only when one exists is repeated in prose. The
    code holds it (`{...(errorMessage !== undefined ? { errorMessage } : {})}`).'
  node: rules/chat-workspace/graph-pane-receives-the-status-and-the-error
- file: src/features/chat/components/ChatWorkspace.tsx
  where: comments above `selectedNode` state (lines 101-104) and above `handleNodeSelect` (lines 160-164)
  evidence: "The label is captured at click time and forwarded to NodeDetailPanel so\n  // the loading\
    \ state can render the canonical name immediately"
  cost: 'The rule that the detail receives the click-time label, and none when absent, is restated in
    two comments. The code already holds it (`setSelectedNode({ id: nodeId, label: node?.label })` and
    the conditional `nodeLabel` spread). The comments would keep stating the old rule after a change.'
  node: rules/chat-workspace/node-detail-receives-the-clicked-label
- file: src/features/chat/components/ChatWorkspace.tsx
  where: header docstring, lines 17-19 ("Search state")
  evidence: "The URL is the single source of truth\n * for the active conversation id (front.md §3.2)."
  cost: The rule that the address names the active conversation is stated a second time in prose, beside
    the code that holds it (`const { conversation } = chatRoute.useSearch();`). When the node moves, the
    comment keeps saying the old thing and no check reaches it.
  node: rules/chat-workspace/active-conversation-is-named-by-the-address
- file: src/features/chat/components/ChatWorkspace.tsx
  where: header docstring, lines 31-35, and the comment above `selectedNode` state, lines 99-100
  evidence: "When non-null the right pane swaps from\n *    GraphSpace to `<NodeDetailPanel>`; closing\
    \ the panel restores\n *    the canvas."
  cost: 'The swap-and-restore rule is repeated in comments while `selectedNode !== null ? (<NodeDetailPanel
    .../>) : (<GraphSpace .../>)` already holds it. The prose is a second home for the node''s fact and
    will not follow the node.'
  node: rules/chat-workspace/clicking-a-node-swaps-the-pane-to-its-detail
- file: src/features/chat/components/ChatWorkspace.tsx
  where: header docstring, lines 51-54 ("Unidirectionality")
  evidence: "`onNodeSelect` only updates local UI state; `onClose` only\n *    clears that state. Selecting\
    \ a node has zero impact on the chat\n *    turn (no message sent, no store mutated)."
  cost: 'The rule that selecting sends nothing and leaves the turn alone is restated as prose. The code
    holds it (`setSelectedNode({ id: nodeId, label: node?.label })` and `setSelectedNode(null)` touch
    only local state). The comment is a second home that can drift.'
  node: rules/chat-workspace/selecting-a-node-sends-nothing
- file: src/features/chat/components/Composer.tsx
  where: JSX comment above the message row, lines 435-438
  evidence: "We render at most one message at a\n        time: the form error takes precedence; otherwise\
    \ the disabled\n        notice."
  cost: The one-message-line and precedence rule is stated in a comment beside the code that holds it,
    so there are two homes for the rule.
  node: rules/chat-workspace/one-message-line-under-the-field
- file: src/features/chat/components/Composer.tsx
  where: comment above `onSubmit`, lines 305-306
  evidence: "// Cleared on success so a quick Enter-Enter doesn't re-send the prior text;\n  // left intact\
    \ on error so the owner can edit and retry."
  cost: The outcome rule for a successful or failed send is restated as prose over the handler that implements
    it. Its stated reason ("Enter-Enter") is a rationale no node records.
  node: rules/chat-workspace/successful-send-empties-the-field
- file: src/features/chat/components/Composer.tsx
  where: comment inside `useForm` options, lines 280-281
  evidence: "// Live-validate as the user types so the > 32768 char message appears\n    // immediately,\
    \ not on submit (TC-09 \"Content > 32768 chars: live error\")."
  cost: 'The check-on-every-change rule and the 32768 figure are restated beside `mode: "onChange"`, so
    there are two statements of one rule in this file.'
  node: rules/chat-workspace/content-is-checked-on-every-change
- file: src/features/chat/components/Composer.tsx
  where: header docblock, lines 11-13 (Disabled mode)
  evidence: "Disabled (UI-10)         — textarea disabled, inline notice (when the\n        last send\
    \ returned BUSINESS_CHAT_DISABLED or\n        BUSINESS_CHAT_PROVIDER_UNAVAILABLE pre-stream)."
  cost: The two locking codes are listed in prose as well as in `disabledNoticeFor`. A change to the set
    of codes in the node would leave this header naming the old pair.
  node: rules/chat-workspace/disabling-codes-lock-the-composer
- file: src/features/chat/components/Composer.tsx
  where: header docblock, lines 14-16 (sendMessage content bound)
  evidence: "`content` length is bounded `[1, MAX_CONTENT_LENGTH]`\n    (default 32768, BR-32)."
  cost: The 32768 bound is restated in the header and again at the `MAX_CONTENT_LENGTH` constant comment.
    A reader looking for the limit finds three places. The code holds one, and the other two can drift
    from it silently.
  node: rules/chat-workspace/content-has-at-most-32768-characters
- file: src/features/chat/components/Composer.tsx
  where: header docblock, lines 24-27 (WCAG note on invalid field)
  evidence: "invalid field exposes aria-invalid + aria-describedby\n    pointing at the message id."
  cost: The marking rule is stated in prose beside the code that implements it, so the node's wording
    has a second home in the file header.
  node: rules/chat-workspace/invalid-field-is-marked-and-described
- file: src/features/chat/components/Composer.tsx
  where: header docblock, lines 48-50 (Keyboard contract, Enter and Shift+Enter)
  evidence: "Enter on the textarea -> submit, when content is non-empty.\n *  - Shift+Enter -> insert\
    \ newline (default textarea behaviour preserved)."
  cost: The prose restates the Enter and Shift+Enter rule. Its qualifier "when content is non-empty" is
    not what the code does, because `requestSubmit()` runs the checks and shows the empty-content alert.
    A reader of the header learns a rule slightly different from the node and from the code.
  node: rules/chat-workspace/enter-sends-and-shift-enter-breaks-the-line
- file: src/features/chat/components/Composer.tsx
  where: header docblock, lines 51-55 (Keyboard contract, Escape)
  evidence: "Esc, while `isStreaming === true` -> abort the in-flight controller. We\n    install a document-level\
    \ keydown listener because the textarea is\n    `disabled` in stop mode"
  cost: The Escape-from-anywhere rule is written in prose as well as in the effect. The next reader has
    two places to update when the node moves.
  node: rules/chat-workspace/escape-aborts-the-turn-from-anywhere
- file: src/features/chat/components/Composer.tsx
  where: header docblock, lines 9-10 (Archived banner mode)
  evidence: "Archived banner (UI-08)  — entire input area replaced by notice +\n        'Reativar' button."
  cost: The fact that an archived conversation offers a banner and no input is written twice in this file,
    once as the Composer's branch and once in prose. When the node moves, the prose keeps saying the old
    version, and a reader of the header can take it for the decided rule.
  node: rules/chat-workspace/archived-conversation-offers-no-input
- file: src/features/chat/components/Composer.types.ts
  where: the file header comment (lines 10-12) and the JSDoc on `isArchived` (lines 19-23) and on `onUnarchive`
    (lines 25-29)
  evidence: "the Composer renders an archived banner with a 'Reativar'\n *    action that calls `onUnarchive`.\n\
    ...\n   * banner with a 'Reativar' button (BR-25).\n...\n   * Callback invoked when the owner clicks\
    \ 'Reativar' in the archived banner."
  cost: Three comments say the archived banner carries the action "Reativar". The node chat-screen already
    holds that fact, and code holds it too, in Composer.tsx as `const ARCHIVED_ACTION = "Reativar";`.
    A reader who finds the wording here has a third place to check, and it is not bound to the node. If
    the node's wording changes, these comments go stale without anyone being told.
  node: contracts/chat-workspace/chat-screen
- file: src/features/chat/components/ConversationView.tsx
  where: the comment above `const isArchived`, lines 66-67, inside ActiveConversation
  evidence: "// Until the detail loads, treat as not-archived (the Composer's send band is\n  // the safe\
    \ default; if it turns out archived the banner swaps in on load)."
  cost: The rule that a conversation counts as archived only when its detail carries a non-null archive
    moment, and as not archived while the detail is loading or when it fails to load, is restated in prose
    beside the code that implements it. When the node moves, this comment stays and keeps asserting the
    old behaviour. The code is the expression `conversationQuery.data?.archivedAt != null`, so the pair
    conforms and what is owed is removal of the prose.
  node: rules/chat-workspace/conversation-is-archived-when-its-detail-says-so
- file: src/features/chat/components/MessageStream.tsx
  where: comment before ChatStatusIndicator, lines 381-386
  evidence: TC-FE-10 — discreet waiting hint anchored below the last bubble.
  cost: The placement of the waiting hint is restated in prose as well as in `<ChatStatusIndicator />`
    rendered after the bubbles in the non-empty branch.
  node: rules/chat-workspace/waiting-hint-sits-below-the-last-bubble
- file: src/features/chat/components/MessageStream.tsx
  where: docstring of joinContent, lines 89-97
  evidence: "unknown block types simply contribute nothing,\n * which keeps a forward-compatible payload"
  cost: The block-joining rule is restated in a docstring as well as in the `typeof block.text === "string"`
    accumulation.
  node: rules/chat-workspace/message-text-joins-its-blocks
- file: src/features/chat/components/MessageStream.tsx
  where: header docstring line 9 and the sentence on lines 48-50
  evidence: "an initial history load uses\n *    `behavior: 'auto'` (no animation cascade)"
  cost: 'The first-load jump is described in prose, and the behavior is also held by `node.scrollIntoView({
    block: "end", behavior: "auto" })` in the layout effect.'
  node: rules/chat-workspace/first-load-jumps-to-the-bottom
- file: src/features/chat/components/MessageStream.tsx
  where: header docstring lines 11-14, and the comment before the streaming bubble, lines 364-370
  evidence: "a streaming assistant\n *                              bubble is appended below\n *     \
    \                         the history; its content is the running\n *                            \
    \  `streamingText` accumulator."
  cost: The in-flight bubble fact is stated in comments as well as in the `isStreaming ? <ChatBubble ...
    streaming />` element. Two places would have to move together.
  node: rules/chat-workspace/streaming-adds-an-in-flight-assistant-bubble
- file: src/features/chat/components/MessageStream.tsx
  where: header docstring lines 15-18 and 62-65
  evidence: "when `isStreaming` flips false, the streaming\n *                              bubble disappears"
  cost: The removal of the in-flight bubble is restated in prose. The code holds it by rendering the bubble
    only while `isStreaming` is true.
  node: rules/chat-workspace/in-flight-bubble-is-removed-when-streaming-ends
- file: src/features/chat/components/MessageStream.tsx
  where: header docstring lines 23-26, and the comment above ErrorBanner, lines 158-161
  evidence: "inline error banner with a Retry button that\n *                              calls `refetch()`\
    \ when the history fetch\n *                              fails."
  cost: The retry behavior is stated in prose as well as in ErrorBanner's `onRetry={() => void query.refetch()}`.
  node: rules/chat-workspace/history-failure-offers-a-retry
- file: src/features/chat/components/MessageStream.tsx
  where: header docstring lines 27-30
  evidence: "pt-BR copy \"Nenhuma mensagem ainda. Envie uma\n *                              mensagem\
    \ para começar.\" when the conversation\n *                              has no messages and no streaming\
    \ turn is in\n *                              flight."
  cost: The empty-state wording and its condition are copied into a comment while COPY_EMPTY and `isEmpty`
    hold them. If the contract's wording moves, the comment keeps the old text.
  node: contracts/chat-workspace/chat-screen
- file: src/features/chat/components/MessageStream.tsx
  where: header docstring lines 33-41, and the comment at lines 329-331
  evidence: "`aria-live='polite'` on the root region — the same region for ALL\n *    updates"
  cost: The live-region and busy rules are restated in prose. The sections' `aria-live="polite"` and the
    `aria-busy` handling in the three branches hold them.
  node: rules/chat-workspace/message-list-is-a-polite-live-region
- file: src/features/chat/components/MessageStream.tsx
  where: header docstring lines 43-50, and the comment above the delta-scroll effect, lines 248-250
  evidence: "incremental deltas use\n *    `behavior: 'smooth'`. Reduced-motion downgrades smooth → auto."
  cost: 'The smooth-or-auto scroll behavior is stated in prose as well as in `behavior: prefersReducedMotion
    ? "auto" : "smooth"`.'
  node: rules/chat-workspace/streamed-text-growth-scrolls-to-the-bottom
- file: src/features/chat/components/MessageStream.tsx
  where: header docstring lines 52-57, and the comment above the unmount effect, lines 263-270
  evidence: "On unmount, abort whatever `AbortController` is currently registered in\n *    `useChatTurnStore`."
  cost: The abort-on-leaving fact is stated in prose as well as in the cleanup `controller?.abort()`.
  node: rules/chat-workspace/leaving-the-list-aborts-the-turn
- file: src/features/chat/components/MessageStream.tsx
  where: header docstring lines 7-8, and the comment above SKELETON_ROWS, line 111
  evidence: "UI-02 (loading)        — 3 alternating skeleton bubbles while the\n *                   \
    \           history fetch is `isPending`."
  cost: The three-placeholder fact appears in prose as well as in SKELETON_ROWS. A change to the node
    would leave a second statement of it in the comment.
  node: rules/chat-workspace/loading-history-shows-three-placeholders
- file: src/features/chat/components/MessageStream.tsx
  where: header docstring lines 9-10
  evidence: UI-03 (success)        — history rendered chronologically; auto-scroll
  cost: The prose says the history is rendered chronologically, while the code renders `messages.map`
    in the order received. A reader would take the file to apply an ordering the code does not apply,
    and the node's wording is "the order the message listing returns it".
  node: rules/chat-workspace/history-keeps-the-listed-order
- file: src/features/chat/components/StreamingCursor.tsx
  where: The docstring's "Accessibility (TC-08 constraint)" paragraph, lines 20-21, and the "screen readers
    ignore it" clause in lines 6-8.
  evidence: "* Accessibility (TC-08 constraint):\n *  - `aria-hidden='true'` always. The cursor never\
    \ appears in the AT tree."
  cost: The rule that the cursor is hidden from assistive technology is held by the node and by the `aria-hidden="true"`
    attribute on the span. The docstring states it a third time as prose. If the node moves, `--check`
    does not reach this prose. A reader could take the docstring, which cites "TC-08", for the authority
    on the rule.
  node: rules/chat-workspace/streaming-cursor-is-hidden-from-assistive-technology
- file: src/features/chat/components/ToolCallChip/ToolCallChip.tsx
  where: the comment above the status constants, line 36
  evidence: /* ---------- status copy (pt-BR; verbatim from TC-10 constraints) ---------- */
  cost: The comment attributes the status words to a task constraint, TC-10, rather than to the chat-screen
    node that holds them. It names the wrong authority for the fact. A reader who follows it looks in
    a task document and not in the specification.
  node: contracts/chat-workspace/chat-screen
- file: src/features/chat/components/ToolCallChip/ToolCallChip.tsx
  where: the file header docstring, lines 12-16 (the "Spec references" paragraph)
  evidence: "* Spec references:\n *  - dev_tc_010 task contract — three observable states + aria-label\
    \ format\n *    \"{tool} — {status}\" with status in pt-BR\n *    ('em andamento' | 'concluído' |\
    \ 'erro')."
  cost: The accessible-name format and the three status words are held in the chat-screen node (operation
    show-turn-progress). Here they are also written as prose that cites a task contract (dev_tc_010) instead
    of the node. When the node's wording moves, a reader who finds this comment sees a second, uncited
    statement of the fact. Comments are not bound to the node, so the check never reaches it.
  node: contracts/chat-workspace/chat-screen
- file: src/features/chat/components/UsageBadge/UsageBadge.tsx
  where: the header docstring, lines 12-16 ("Lazy contract"), and the comment on lines 59-63 above the
    early return
  evidence: "\"This component renders `null` while the query is in flight or has not\n *    resolved yet\
    \ (`isLoading` OR `data == null`). No skeleton, no zero-state\n *    fallback\""
  cost: The rule that the badge shows nothing until usage arrives is restated in prose. The code at `if
    (query.isLoading || query.data == null) { return null; }` holds it, so the comments are a second home
    that can drift from the rule.
  node: rules/chat-workspace/usage-badge-shows-nothing-until-usage-arrives
- file: src/features/chat/components/UsageBadge/UsageBadge.tsx
  where: the header docstring, lines 18-21 ("Spec references"), and the comment above buildAriaLabel,
    line 39
  evidence: "\"the pt-BR aria-label format:\n *    \\\"Uso: X tokens de entrada, Y tokens de saída, Z\
    \ chamadas de ferramenta\\\".\""
  cost: The accessible-name format is written twice in this file, once in the code that builds it and
    once in prose that cites a task contract, not the node. If the node's wording changes, the prose keeps
    the old text and nobody knows which one was decided.
  node: contracts/chat-workspace/chat-screen
- file: src/features/chat/components/UsageBadge/UsageBadge.tsx
  where: the header docstring, lines 5-8 and 22-23
  evidence: "\"Surfaces\n * the three aggregate counters returned by GET /conversations/:id/usage —\n\
    \ * tokens_in, tokens_out, tool_calls\"\nand \"We only render the latter three.\""
  cost: The rule that the badge shows the three counts and not the message count is restated in prose.
    The destructuring `const { tokens_in, tokens_out, tool_calls } = query.data;` holds it, so the comment
    is a second home for the rule.
  node: rules/chat-workspace/usage-badge-shows-the-three-counts
- file: src/features/chat/state/chat-turn.ts
  where: the docstring on addToolChip, line 93
  evidence: /** Add a `tool_start` chip with `ok=null` (pending). */
  cost: 'The docstring restates that a started tool call is added to the turn''s chips. The code holds
    it: `set((state) => ({ toolChips: [...state.toolChips, chip] }))`. The prose is a second home.'
  node: rules/chat-workspace/started-tool-calls-accumulate-at-the-end
- file: src/features/chat/state/chat-turn.ts
  where: the docstring on appendText, line 87
  evidence: /** Append a `text_delta` chunk to `streamingText`. */
  cost: 'The docstring restates the append-at-the-end rule as prose. The code holds it: `set((state) =>
    ({ streamingText: state.streamingText + delta }))`. The prose is a second home.'
  node: rules/chat-workspace/streamed-text-accumulates-at-the-end
- file: src/features/chat/state/chat-turn.ts
  where: the docstring on reset, line 83
  evidence: /** Clear all turn state — called on conversation switch and on terminal frame. */
  cost: 'The docstring restates that reset clears all turn state. The code holds it: `reset: () => set({
    ...initialState }),`. The prose is a second home that the node''s binding does not reach.'
  node: rules/chat-workspace/reset-restores-every-field-at-once
- file: src/features/chat/state/chat-turn.ts
  where: the docstring on the abortController field, lines 63-68
  evidence: '* AbortController owning the in-flight `fetch` for the current SSE turn.'
  cost: 'The docstring restates the one-abort-handle-per-turn rule as prose. The `abortController: AbortController
    | null;` field and its `setAbortController` setter already hold it. The prose is a second home that
    nothing reads.'
  node: rules/chat-workspace/turn-holds-one-abort-handle
- file: src/features/chat/state/chat-turn.ts
  where: the docstring on the idempotencyKey field, lines 69-73, and on setIdempotencyKey, line 89
  evidence: '* Idempotency-Key (UUID) generated once per send attempt; kept so the

    * caller can detect a retry of the same logical turn.'
  cost: 'The docstring restates that the turn holds the idempotency key of the current send attempt. It
    also adds a UUID format and a retry-detection purpose that no node holds, but it is prose, not behavior.
    The field `idempotencyKey: string | null;` already holds the fact, so the prose is a second home outside
    behavior.'
  node: rules/chat-workspace/turn-holds-the-idempotency-key
- file: src/features/chat/state/chat-turn.ts
  where: the docstring on updateLastToolChip, lines 95-101
  evidence: '* Settle the last chip with a `tool_result.ok`. The spec invariant

    * (openapi.yaml `sendMessage` §"Frame ordering invariants" #2) guarantees

    * every `tool_start` is followed by exactly one `tool_result`, so the

    * latest pending chip is always the one being settled.'
  cost: 'The docstring restates the settle-the-most-recent-chip rule as prose and cites another document
    as its authority. The code holds the rule: `if (state.toolChips.length === 0) return state;` and `next[lastIdx]
    = { ...last, ok };`. The prose is a second home, and its claim about frame ordering is not a fact
    this file enforces.'
  node: rules/chat-workspace/an-outcome-settles-the-most-recent-chip
- file: src/features/chat/state/chat-turn.ts
  where: 'the file header comment, lines 1-24, "Why NOT persisted" and "Persistence: none (session only)"'
  evidence: '* "none (session only)".

    * - docs/specs/front/features/chat.feature.spec.md §"Data Layer Notes" —

    *    "Zustand slice `useChatTurnStore` holds ephemeral turn state (streaming

    *    text, in-flight chips) — never persisted."'
  cost: 'The comment restates, as prose, that the turn state is never persisted. The code already holds
    this: the store is built with a bare `create<ChatTurnState>((set) => ({` and no persistence middleware.
    The comment is a second home for the fact. When the node moves, this prose is not reached by `--check`.'
  node: rules/chat-workspace/turn-state-lives-in-memory-only
unbound:
- src/features/chat/api/index.ts
- src/features/chat/api/keys.ts
- src/features/chat/components/Composer.types.ts
- src/features/chat/components/ToolCallChip/ToolCallChip.types.ts
- src/features/chat/components/ToolCallChip/index.ts
- src/features/chat/components/UsageBadge/UsageBadge.types.ts
- src/features/chat/components/UsageBadge/index.ts
- src/features/chat/components/index.ts
adopted: true
unheld:
- node: domain/chat/tool-call
  how: 'read on 3 file(s), and every judge answered `nowhere`: no file of the set holds this fact'
notes: 'Judged by 23 delegation(s), one per file; folded mechanically by trace.py --fold from the returns
  under siegard-reconcile/adopt-fe-chat.returns/.

  Staged as an adoption of source no delivery wrote: 144 candidate node(s) were read on every file, and
  each cleared one is bound to the files whose judgment holds its fact.

  Candidates: 11 opened across 4 of 23 delegation(s); each return lists its own under `candidates_opened`.

  Unstated: 4 fact(s) the source states that no node holds, over 3 file(s), listed under `unstated`. They
  block no binding here and no rebind closes them — the route is the analysis that gives each fact a node.

  Restates: 79 place(s) where text in the source restates a node''s fact the code holds, over 21 file(s),
  listed under `restates`. The pair conforms, so none blocks a binding — the route is removing the text,
  and reconciling the file after.'
---

## Folded
This record was folded by `trace.py --fold` from the delegation returns under `siegard-reconcile/adopt-fe-chat.returns/`, which are the evidence behind every entry above.
