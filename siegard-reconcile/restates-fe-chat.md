---
contract_version: siegard-reconcile/8
title: Prose comments removed from the chat frontend files
summary: Every comment that was not a tool directive was removed from these files, answering the restates
  findings the adoption left against them; the facts stay in their nodes and no behaviour changed.
target: frontend
files:
- path: src/features/chat/api/_request.ts
  change: Prose comments removed; behaviour unchanged.
- path: src/features/chat/api/_transforms.ts
  change: Prose comments removed; behaviour unchanged.
- path: src/features/chat/api/chat-stream.ts
  change: Prose comments removed; behaviour unchanged.
- path: src/features/chat/api/use-cancel-turn.ts
  change: Prose comments removed; behaviour unchanged.
- path: src/features/chat/api/use-create-conversation.ts
  change: Prose comments removed; behaviour unchanged.
- path: src/features/chat/api/use-delete-conversation.ts
  change: Prose comments removed; behaviour unchanged.
- path: src/features/chat/api/use-get-conversation-usage.ts
  change: Prose comments removed; behaviour unchanged.
- path: src/features/chat/api/use-get-conversation.ts
  change: Prose comments removed; behaviour unchanged.
- path: src/features/chat/api/use-list-conversations.ts
  change: Prose comments removed; behaviour unchanged.
- path: src/features/chat/api/use-update-conversation.ts
  change: Prose comments removed; behaviour unchanged.
- path: src/features/chat/api/useSendMessage.ts
  change: Prose comments removed; behaviour unchanged.
- path: src/features/chat/components/ChatStatusIndicator.tsx
  change: Prose comments removed; behaviour unchanged.
- path: src/features/chat/components/ChatWorkspace.tsx
  change: Prose comments removed; behaviour unchanged.
- path: src/features/chat/components/Composer.tsx
  change: Prose comments removed; behaviour unchanged.
- path: src/features/chat/components/Composer.types.ts
  change: Prose comments removed; behaviour unchanged.
- path: src/features/chat/components/ConversationView.tsx
  change: Prose comments removed; behaviour unchanged.
- path: src/features/chat/components/MessageStream.tsx
  change: Prose comments removed; behaviour unchanged.
- path: src/features/chat/components/StreamingCursor.tsx
  change: Prose comments removed; behaviour unchanged.
- path: src/features/chat/components/ToolCallChip/ToolCallChip.tsx
  change: Prose comments removed; behaviour unchanged.
- path: src/features/chat/components/UsageBadge/UsageBadge.tsx
  change: Prose comments removed; behaviour unchanged.
- path: src/features/chat/state/chat-turn.ts
  change: Prose comments removed; behaviour unchanged.
nodes:
- node: contracts/chat-workspace/bff-conversations
  conforms: true
  how: "src/features/chat/api/_request.ts: held at httpVoid, lines 10-61, which holds the whole refusal\
    \ table of delete-conversation. It forms the URL from VITE_BFF_URL and the path. It maps a thrown\
    \ abort to SYSTEM_ABORTED and any other thrown error to SYSTEM_NETWORK, both with HTTP status 0. It\
    \ reads the envelope's code, message and details from the answer. It falls back to SYSTEM_UPSTREAM\
    \ at status 500 or above and to SYSTEM_UNKNOWN below 500. The other operations of the contract (send-message,\
    \ cancel-turn, create, list, read, update, list-messages, usage) are held in the sibling use-*.ts\
    \ files, outside this file. authHeader (lines 5-8) is the shared bearer helper those files use. —\
    \ code: isAbort ? \"SYSTEM_ABORTED\" : \"SYSTEM_NETWORK\",\nhttpStatus: 0,\nmessage: isAbort\n  ?\
    \ \"Requisição cancelada.\"\n  : \"Falha de rede ao contactar o servidor.\",\n...\nif (response.status\
    \ === 204) return;\n...\ntypeof errObj?.code === \"string\"\n  ? errObj.code\n  : response.status\
    \ >= 500\n    ? \"SYSTEM_UPSTREAM\"\n    : \"SYSTEM_UNKNOWN\",\nhttpStatus: response.status,\n...\n\
    \  ? \"Algo deu errado. Tente novamente.\"\n  : \"Erro desconhecido do servidor.\",\ndetails: errObj?.details,\n\
    src/features/chat/api/_transforms.ts: held at toConversation, toChatMessage, toUsageData, toConversationList\
    \ and toMessageList (lines 64-112), plus the wire shapes ConversationWire, ChatMessageWire, UsageWire,\
    \ CancelWire, ConversationListWire and MessageListWire (lines 10-52). The file declares and reads\
    \ only the answers. Every request line, the send-message stream frames and the failure refusals are\
    \ nowhere in this file. — return { id: wire.id, title: wire.title, archivedAt: wire.archived_at !==\
    \ null ? new Date(wire.archived_at) : null, createdAt: new Date(wire.created_at), };\nmessageCount:\
    \ wire.messages,\nitems: wire.items.map(toChatMessage), nextBefore: wire.next_before,\nnextCursor:\
    \ wire.next_cursor,\nreadonly cancelled: true;\nThe contract names these reads: a conversation as\
    \ id, title, archived_at and created_at with the summary and update time not kept; the message fields\
    \ id, conversation_id, role, content, stop_reason, idempotency_key, model, tokens_in, tokens_out,\
    \ latency_ms and created_at; items with next_before; items with next_cursor; usage messages kept as\
    \ the message count; and the cancel answer { cancelled: true }. The file carries each of these.\n\
    src/features/chat/api/chat-stream.ts: held at streamChat (lines 171-259) for the send-message operation:\
    \ the request headers and fetch, the SYSTEM_NETWORK, SYSTEM_INVALID_RESPONSE, SYSTEM_UPSTREAM and\
    \ SYSTEM_UNKNOWN refusals, extractPreStreamError (lines 141-169), and the frame reading in parseSSEFrame\
    \ (lines 55-134). The other operations (cancel-turn, conversations CRUD, list-messages, usage) are\
    \ not in this file. — \"Content-Type\": \"application/json\",\n    Accept: \"text/event-stream\",\n\
    \    ...(options.headers ?? {}),\ncode: \"SYSTEM_NETWORK\", message: \"Falha de rede ao contactar\
    \ o servidor.\"\ncode: \"SYSTEM_INVALID_RESPONSE\", message: \"Resposta do servidor sem corpo.\"\n\
    response.status >= 500 ? { code: \"SYSTEM_UPSTREAM\", message: \"Algo deu errado. Tente novamente.\"\
    \ } : { code: \"SYSTEM_UNKNOWN\", message: \"Erro desconhecido do servidor.\" }\ncode: typeof e.code\
    \ === \"string\" ? e.code : fallback.code,\nmessage: typeof e.message === \"string\" ? e.message :\
    \ fallback.message,\nmessage: \"Falha de rede durante o streaming.\"\nsrc/features/chat/api/use-cancel-turn.ts:\
    \ held at useCancelTurn, the mutationFn: the cancel-turn operation, the only one of the contract's\
    \ operations this file touches. — http<CancelWire>(\n  `/api/v1/conversations/${encodeURIComponent(conversationId)}/cancel`,\n\
    \  {\n    method: \"POST\",\n    headers: authHeader(),\n  },\n);\nsrc/features/chat/api/use-create-conversation.ts:\
    \ held at the mutationFn of useCreateConversation(), lines 23-34 — const body: CreateConversationVariables\
    \ = vars ?? {};\nconst wire = await http<ConversationWire>(\"/api/v1/conversations\", {\n  method:\
    \ \"POST\",\n  ...\n  body: JSON.stringify(body),\n});\nreturn toConversation(wire);\nsrc/features/chat/api/use-delete-conversation.ts:\
    \ held at The mutationFn of useDeleteConversation, lines 20-25. It sends the delete-conversation request.\
    \ The 204-only success and the failure answers are not stated in this file. They belong to the helper\
    \ it calls, httpVoid in ./_request, which this file only invokes. — await httpVoid(`/api/v1/conversations/${encodeURIComponent(id)}`,\
    \ {\n  method: \"DELETE\",\n  headers: authHeader(),\n});\nsrc/features/chat/api/use-get-conversation-usage.ts:\
    \ held at the queryFn of useGetConversationUsage, lines 16-22. It holds the GET request and URL for\
    \ read-conversation-usage. Reading the answer's fields (messages kept as the message count, tokens_in,\
    \ tokens_out, tool_calls) is delegated to toUsageData, imported from ./_transforms, and is not in\
    \ this file. — const wire = await http<UsageWire>(\n  `/api/v1/conversations/${encodeURIComponent(\n\
    \    conversationId as string,\n  )}/usage`,\n  { method: \"GET\", headers: authHeader() },\n);\n\
    return toUsageData(wire);\nsrc/features/chat/api/use-get-conversation.ts: held at the queryFn of useGetConversation,\
    \ lines 15-21, which implements the read-conversation operation — const wire = await http<ConversationWire>(\n\
    \  `/api/v1/conversations/${encodeURIComponent(id as string)}`,\n  { method: \"GET\", headers: authHeader()\
    \ },\n);\nreturn toConversation(wire);\nsrc/features/chat/api/use-list-conversations.ts: held at the\
    \ queryFn of useListConversations (lines 34-40) with buildQueryString (lines 19-26), the list-conversations\
    \ operation only — `/api/v1/conversations${buildQueryString(params)}`, { method: \"GET\", headers:\
    \ authHeader() } ... return toConversationList(wire);\nif (params.limit !== undefined) search.set(\"\
    limit\", String(params.limit));\nif (params.cursor !== undefined) search.set(\"cursor\", params.cursor);\n\
    if (params.includeArchived === true) search.set(\"include_archived\", \"true\");\nsrc/features/chat/api/use-update-conversation.ts:\
    \ held at the mutationFn of useUpdateConversation (the update-conversation operation): the PATCH request,\
    \ the URL-encoded id, the JSON content type and the conversation read from the answer — const wire\
    \ = await http<ConversationWire>(\n  `/api/v1/conversations/${encodeURIComponent(id)}`,\n  {\n   \
    \ method: \"PATCH\",\n    headers: {\n      ...authHeader(),\n      \"Content-Type\": \"application/json\"\
    ,\n    },\n    body: JSON.stringify(body),\n  },\n);\nreturn toConversation(wire);\nsrc/features/chat/api/useSendMessage.ts:\
    \ held at The send-message half is split. Here the url, body and headers are built in mutationFn,\
    \ lines 139-155. The frame reading and refusal answers sit in streamChat in chat-stream.ts, which\
    \ is outside this file. — `/api/v1/conversations/${encodeURIComponent(vars.conversationId)}/messages`;\
    \ `\"Idempotency-Key\": idempotencyKey`; `const body: { content: string; model?: string } = {`; `if\
    \ (vars.model !== undefined) body.model = vars.model;`"
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
  - src/features/chat/api/use-update-conversation.ts
  - src/features/chat/api/useSendMessage.ts
- node: contracts/chat-workspace/chat-screen
  conforms: true
  how: "src/features/chat/components/ChatStatusIndicator.tsx: held at The two copy constants, `label`\
    \ selection, and the early return in the component body. This file holds the show-turn-progress hint\
    \ only. It does not hold the tool-call chips, the usage counts, or any other operation of the contract.\
    \ — const COPY_THINKING = \"pensando…\";\nconst COPY_TOOL_PREFIX = \"consultando a memória…\";\n...\n\
    label =\n  active !== null ? `${COPY_TOOL_PREFIX} (${active})` : COPY_TOOL_PREFIX;\nsrc/features/chat/components/Composer.tsx:\
    \ held at Composer (archived banner versus send band), ArchivedBanner, ComposerSendBand and the label,\
    \ aria-label and notice constants at lines 21-36 — const LABEL_TEXTAREA = \"Mensagem para o assistente\"\
    ; const ARIA_SEND = \"Enviar mensagem\"; const ARIA_STOP = \"Parar geração\"; aria-label=\"Compositor\
    \ de mensagem\"; const ARCHIVED_BODY = \"Esta conversa está arquivada. Reative para enviar novas mensagens.\"\
    ; const DISABLED_CHAT_DISABLED = \"O chat está temporariamente indisponível (desativado).\"; const\
    \ DISABLED_PROVIDER_UNAVAILABLE = \"O provedor do chat está indisponível. Tente novamente em instantes.\"\
    \nsrc/features/chat/components/ConversationView.tsx: held at The empty branch of ConversationView\
    \ (conversationId undefined) and the section returned by ActiveConversation, with its two labelled\
    \ slots. The archived banner and the composer's own fields are not in this file. The file hands them\
    \ to Composer through the isArchived and onUnarchive props. — <section aria-label=\"Conversa\" ...>\
    \ <p className=\"text-body text-body\">Selecione ou crie uma conversa para começar.</p>\naria-label=\"\
    Mensagens da conversa\" wrapping <MessageStream conversationId={conversationId} className=\"h-full\"\
    \ />\naria-label=\"Compositor de mensagem\" wrapping <Composer conversationId={conversationId} isArchived={isArchived}\
    \ .../>\nsrc/features/chat/components/MessageStream.tsx: held at The message-list part of the contract\
    \ is held in the COPY_* constants (lines 13-17) and in the three render branches. The pending branch\
    \ (146-162) shows the placeholders, the error branch (164-178) shows the alert and the retry, and\
    \ the empty branch (196-202) shows the empty text. The other operations of the contract belong to\
    \ other files. — const LABEL_REGION = \"Mensagens da conversa\";\nconst COPY_EMPTY = \"Nenhuma mensagem\
    \ ainda. Envie uma mensagem para começar.\";\nconst COPY_ERROR =\n  \"Não foi possível carregar o\
    \ histórico. Tente novamente.\";\nconst COPY_RETRY = \"Tentar novamente\";\nsrc/features/chat/components/ToolCallChip/ToolCallChip.tsx:\
    \ held at statusLabel() and the ariaLabel template in ToolCallChip, lines 6-19, which hold the three\
    \ statuses and the accessible name for the show-turn-progress chip. — const STATUS_PENDING = \"em\
    \ andamento\";\nconst STATUS_OK = \"concluído\";\nconst STATUS_ERROR = \"erro\";\nconst ariaLabel\
    \ = `${tool} — ${status}`;\nsrc/features/chat/components/UsageBadge/UsageBadge.tsx: held at buildAriaLabel()\
    \ and the aria-label on the root span of UsageBadge. These cover only the show-usage operation. The\
    \ file holds nothing of the other four operations. — `Uso: ${tokensIn} tokens de entrada, ` +\n  \
    \  `${tokensOut} tokens de saída, ` +\n    `${toolCalls} chamadas de ferramenta`\n...\naria-label={ariaLabel}"
  encoded_at:
  - src/features/chat/components/ChatStatusIndicator.tsx
  - src/features/chat/components/Composer.tsx
  - src/features/chat/components/ConversationView.tsx
  - src/features/chat/components/MessageStream.tsx
  - src/features/chat/components/ToolCallChip/ToolCallChip.tsx
  - src/features/chat/components/UsageBadge/UsageBadge.tsx
- node: domain/chat-workspace/message-list-state
  conforms: true
  how: 'src/features/chat/components/MessageStream.tsx: held at The `data-state` values on the three section
    elements (lines 157, 174, 194). The two enumerations match exactly. — data-state="loading"

    data-state="error"

    data-state={isStreaming ? "streaming" : isEmpty ? "empty" : "success"}'
  encoded_at:
  - src/features/chat/components/MessageStream.tsx
- node: domain/chat-workspace/send-outcome
  conforms: true
  how: "src/features/chat/api/useSendMessage.ts: held at The `SendMessageResult` interface, lines 31-36,\
    \ declares the shape. — export interface SendMessageResult {\n  readonly stopReason: string | null;\n\
    \  readonly errorCode: string | null;\n  readonly errorMessage: string | null;\n  readonly idempotencyKey:\
    \ string;\n}"
  encoded_at:
  - src/features/chat/api/useSendMessage.ts
- node: domain/chat/turn-event-kind
  conforms: true
  how: "src/features/chat/api/chat-stream.ts: held at the ChatSSEFrame union (lines 41-48) with its seven\
    \ frame interfaces (lines 3-39), and the switch on the event name in parseSSEFrame (lines 85-133).\
    \ This is where the seven kinds are declared. — export type ChatSSEFrame =\n  | ChatSSEFrameLLMStart\n\
    \  | ChatSSEFrameTextDelta\n  | ChatSSEFrameToolStart\n  | ChatSSEFrameToolResult\n  | ChatSSEFrameDone\n\
    \  | ChatSSEFrameError\n  | ChatSSEFrameGraphDelta;"
  encoded_at:
  - src/features/chat/api/chat-stream.ts
- node: rules/chat-workspace/a-turn-is-never-resent-by-the-screen
  conforms: true
  how: "src/features/chat/api/chat-stream.ts: held at streamChat, lines 182-200: a single fetch call,\
    \ with no retry or loop around it. — let response: Response;\n  try {\n    ...\n    response = await\
    \ fetch(url, init);\n  } catch (err) {\n    ...\n    return;\n  }\nsrc/features/chat/api/useSendMessage.ts:\
    \ held at Line 209. The mutation is built with no retry option and mutationFn opens the stream once\
    \ per call, in the single `streamChat(url, body, {` call at line 163. — return useMutation({ mutationFn\
    \ });"
  encoded_at:
  - src/features/chat/api/chat-stream.ts
  - src/features/chat/api/useSendMessage.ts
- node: rules/chat-workspace/aborting-and-cancelling-do-not-trigger-each-other
  conforms: false
  how: "the fact left part of its ground: still held in src/features/chat/api/useSendMessage.ts, and src/features/chat/api/use-cancel-turn.ts\
    \ read `nowhere. This file only issues the cancel request. It holds no stream, no AbortController\
    \ and no abort call, so the rule's other half sits in the stream-sending code, which is outside this\
    \ file set.` — mutationFn: async () => {\n  return http<CancelWire>(\n    `/api/v1/conversations/${encodeURIComponent(conversationId)}/cancel`,\
    \ — a binding asserts the file answers for the node, so the pair that stopped holding it is released\
    \ by `--bind ... --replace`, never restamped here"
  observed_at:
  - src/features/chat/api/use-cancel-turn.ts
  - src/features/chat/api/useSendMessage.ts
- node: rules/chat-workspace/aborting-ends-the-reading-quietly
  conforms: true
  how: "src/features/chat/api/chat-stream.ts: held at the AbortError branch of the fetch catch (lines\
    \ 191-193) and of the reader.read catch (lines 226-228). Each returns without yielding an error frame.\
    \ — const isAbort = err instanceof DOMException && err.name === \"AbortError\";\n    if (isAbort)\
    \ return;\nsrc/features/chat/api/useSendMessage.ts: held at Lines 162-207. The signal is passed to\
    \ streamChat. Abort adds no error here, and after the loop the messages and usage reads are invalidated.\
    \ — signal: controller.signal,\n...\nvoid queryClient.invalidateQueries({ queryKey: messagesKey });"
  encoded_at:
  - src/features/chat/api/chat-stream.ts
  - src/features/chat/api/useSendMessage.ts
- node: rules/chat-workspace/active-conversation-is-named-by-the-address
  conforms: true
  how: 'src/features/chat/components/ChatWorkspace.tsx: held at Line 13 reads the conversation parameter
    from the address, and line 55 hands it to the message list. — const { conversation } = chatRoute.useSearch();

    <ConversationView conversationId={conversation} />'
  encoded_at:
  - src/features/chat/components/ChatWorkspace.tsx
- node: rules/chat-workspace/an-outcome-settles-the-most-recent-chip
  conforms: true
  how: 'src/features/chat/state/chat-turn.ts: held at `updateLastToolChip`, lines 55-64 — if (state.toolChips.length
    === 0) return state;

    const next = state.toolChips.slice();

    const lastIdx = next.length - 1;

    ...

    next[lastIdx] = { ...last, ok };'
  encoded_at:
  - src/features/chat/state/chat-turn.ts
- node: rules/chat-workspace/any-other-code-leaves-the-composer-usable
  conforms: true
  how: 'src/features/chat/components/Composer.tsx: held at disabledNoticeFor, lines 116-122 — if (errorCode
    === "BUSINESS_CHAT_DISABLED") return DISABLED_CHAT_DISABLED; if (errorCode === "BUSINESS_CHAT_PROVIDER_UNAVAILABLE")
    { return DISABLED_PROVIDER_UNAVAILABLE; } return null;'
  encoded_at:
  - src/features/chat/components/Composer.tsx
- node: rules/chat-workspace/any-status-may-follow-any-status
  conforms: true
  how: 'src/features/chat/state/chat-turn.ts: held at `setChatStatus`, line 66 — setChatStatus: (chatStatus)
    => set({ chatStatus }),'
  encoded_at:
  - src/features/chat/state/chat-turn.ts
- node: rules/chat-workspace/archived-conversation-offers-no-input
  conforms: true
  how: 'src/features/chat/components/Composer.tsx: held at Composer, lines 131-138 — if (isArchived) {
    return ( <ArchivedBanner onUnarchive={onUnarchive} ...'
  encoded_at:
  - src/features/chat/components/Composer.tsx
- node: rules/chat-workspace/cancel-goes-through-the-back-end-request-helper
  conforms: true
  how: 'src/features/chat/api/use-cancel-turn.ts: held at useCancelTurn, the mutationFn: the request goes
    through the shared `http` helper. — import { http } from "@/lib/http";

    ...

    return http<CancelWire>('
  encoded_at:
  - src/features/chat/api/use-cancel-turn.ts
- node: rules/chat-workspace/cancel-targets-the-conversation-it-was-created-for
  conforms: true
  how: "src/features/chat/api/use-cancel-turn.ts: held at The useCancelTurn signature and the mutation's\
    \ void variables: the conversation is closed over from the hook's argument, and the mutation takes\
    \ none. — export function useCancelTurn(\n  conversationId: string,\n): UseMutationResult<CancelWire,\
    \ Error, void> {"
  encoded_at:
  - src/features/chat/api/use-cancel-turn.ts
- node: rules/chat-workspace/cancelling-a-turn-is-a-separate-request
  conforms: true
  how: "src/features/chat/api/_request.ts: held at authHeader, lines 5-8, which is the bearer-when-held\
    \ part of the rule. The cancel endpoint and the body-less POST are in use-cancel-turn.ts, which calls\
    \ authHeader() and sends no body. This file does not name the endpoint. — const token = useAuthStore.getState().accessToken;\n\
    return token !== null ? { Authorization: `Bearer ${token}` } : {};\nsrc/features/chat/api/use-cancel-turn.ts:\
    \ held at useCancelTurn, the mutationFn: a POST to the conversation's cancel endpoint with no body\
    \ option and with the headers from authHeader(). — {\n  method: \"POST\",\n  headers: authHeader(),\n\
    },"
  encoded_at:
  - src/features/chat/api/_request.ts
  - src/features/chat/api/use-cancel-turn.ts
- node: rules/chat-workspace/changing-conversation-clears-the-graph-and-the-detail
  conforms: true
  how: "src/features/chat/components/ChatWorkspace.tsx: held at The effect at lines 29-32, which runs\
    \ whenever `conversation` changes. — useEffect(() => {\n  useGraphStore.getState().clear();\n  setSelectedNode(null);\n\
    }, [conversation]);"
  encoded_at:
  - src/features/chat/components/ChatWorkspace.tsx
- node: rules/chat-workspace/changing-conversation-does-not-stop-the-turn
  conforms: true
  how: "src/features/chat/components/ChatWorkspace.tsx: held at The render of ConversationView at line\
    \ 55, which has no `key`, so a change of conversation does not remount it. The abort itself is not\
    \ in this file. — <ConversationView conversationId={conversation} />\nsrc/features/chat/components/MessageStream.tsx:\
    \ held at The abort effect (lines 138-144) has an empty dependency array, so it runs only on unmount.\
    \ A change of `conversationId` does not run it. — useEffect(() => {\n  return () => {\n    const controller\
    \ = useChatTurnStore.getState().abortController;\n    controller?.abort();\n  };\n  // eslint-disable-next-line\
    \ react-hooks/exhaustive-deps\n}, []);"
  encoded_at:
  - src/features/chat/components/ChatWorkspace.tsx
  - src/features/chat/components/MessageStream.tsx
- node: rules/chat-workspace/chip-is-a-status-region-named-by-tool-and-status
  conforms: true
  how: "src/features/chat/components/ToolCallChip/ToolCallChip.tsx: held at the root span of the returned\
    \ element, lines 40-42. — <span\n  role=\"status\"\n  aria-label={ariaLabel}"
  encoded_at:
  - src/features/chat/components/ToolCallChip/ToolCallChip.tsx
- node: rules/chat-workspace/chip-shows-the-tool-and-its-summary
  conforms: true
  how: "src/features/chat/components/ToolCallChip/ToolCallChip.tsx: held at the tool name span and the\
    \ conditional summary span, lines 51-54. — <span className=\"font-medium\">{tool}</span>\n{argsSummary.length\
    \ > 0 && (\n  <span className=\"text-muted-foreground\">{argsSummary}</span>\n)}"
  encoded_at:
  - src/features/chat/components/ToolCallChip/ToolCallChip.tsx
- node: rules/chat-workspace/clicking-a-node-swaps-the-pane-to-its-detail
  conforms: true
  how: "src/features/chat/components/ChatWorkspace.tsx: held at The ternary at lines 62-79, driven by\
    \ `selectedNode`, together with handleNodeSelect and handleDetailClose. — {selectedNode !== null ?\
    \ (\n  <NodeDetailPanel\n    nodeId={selectedNode.id}\n    ...\n    onClose={handleDetailClose}\n\
    \  />\n) : (\n  <GraphSpace"
  encoded_at:
  - src/features/chat/components/ChatWorkspace.tsx
- node: rules/chat-workspace/comment-and-colonless-lines-are-ignored
  conforms: true
  how: "src/features/chat/api/chat-stream.ts: held at parseSSEFrame, lines 62-64. — if (line.startsWith(\"\
    :\")) continue;\n    const colon = line.indexOf(\":\");\n    if (colon === -1) continue;"
  encoded_at:
  - src/features/chat/api/chat-stream.ts
- node: rules/chat-workspace/composer-footer-is-empty
  conforms: true
  how: 'src/features/chat/components/Composer.tsx: held at the usage slot div, lines 309-312 — <div className="flex
    items-center justify-end" data-testid="composer-usage-slot" />'
  encoded_at:
  - src/features/chat/components/Composer.tsx
- node: rules/chat-workspace/composer-never-clears-the-last-outcome
  conforms: true
  how: 'src/features/chat/components/Composer.tsx: held at lastErrorCode derivation, lines 181-183; nothing
    in the file resets the mutation — const lastErrorCode = mutation.data?.errorCode ?? null; const disabledNotice
    = disabledNoticeFor(lastErrorCode);'
  encoded_at:
  - src/features/chat/components/Composer.tsx
- node: rules/chat-workspace/composer-send-carries-the-identifier-and-the-content
  conforms: true
  how: 'src/features/chat/components/Composer.tsx: held at onSubmit, lines 185-196 — const result = await
    mutation.mutateAsync({ conversationId, content: values.content, });'
  encoded_at:
  - src/features/chat/components/Composer.tsx
- node: rules/chat-workspace/content-has-at-most-32768-characters
  conforms: true
  how: 'src/features/chat/components/Composer.tsx: held at MAX_CONTENT_LENGTH and composerSchema, lines
    19 and 38-43 — const MAX_CONTENT_LENGTH = 32768; .max(MAX_CONTENT_LENGTH, MSG_TOO_LONG)'
  encoded_at:
  - src/features/chat/components/Composer.tsx
- node: rules/chat-workspace/content-is-checked-on-every-change
  conforms: true
  how: 'src/features/chat/components/Composer.tsx: held at useForm options, lines 164-170 — mode: "onChange",'
  encoded_at:
  - src/features/chat/components/Composer.tsx
- node: rules/chat-workspace/content-is-sent-as-the-caller-gives-it
  conforms: true
  how: "src/features/chat/api/useSendMessage.ts: held at Lines 152-154. The body takes vars.content untouched,\
    \ with no trim and no length check. — const body: { content: string; model?: string } = {\n  content:\
    \ vars.content,\n};"
  encoded_at:
  - src/features/chat/api/useSendMessage.ts
- node: rules/chat-workspace/content-needs-a-character
  conforms: true
  how: 'src/features/chat/components/Composer.tsx: held at composerSchema, lines 38-43 — .string() .min(1,
    MSG_EMPTY)'
  encoded_at:
  - src/features/chat/components/Composer.tsx
- node: rules/chat-workspace/conversation-is-archived-when-its-detail-says-so
  conforms: true
  how: 'src/features/chat/components/ConversationView.tsx: held at The isArchived constant in ActiveConversation,
    line 35. — const isArchived = conversationQuery.data?.archivedAt != null;'
  encoded_at:
  - src/features/chat/components/ConversationView.tsx
- node: rules/chat-workspace/conversation-reads-stay-fresh-for-thirty-seconds
  conforms: true
  how: 'src/features/chat/api/use-get-conversation-usage.ts: held at the STALE_MS constant (line 8), passed
    as staleTime on line 25 — const STALE_MS = 30_000;

    ...

    staleTime: STALE_MS,

    src/features/chat/api/use-get-conversation.ts: held at the STALE_MS constant, line 8, passed as staleTime
    at line 23 — const STALE_MS = 30_000;

    ...

    staleTime: STALE_MS,

    src/features/chat/api/use-list-conversations.ts: held at the STALE_MS constant, line 17, passed as
    staleTime at line 41; only the conversation listing is read in this file — const STALE_MS = 30_000;

    staleTime: STALE_MS,'
  encoded_at:
  - src/features/chat/api/use-get-conversation-usage.ts
  - src/features/chat/api/use-get-conversation.ts
  - src/features/chat/api/use-list-conversations.ts
- node: rules/chat-workspace/create-and-delete-do-not-navigate
  conforms: false
  how: "the fact left part of its ground: still held in src/features/chat/api/use-create-conversation.ts,\
    \ and src/features/chat/api/use-delete-conversation.ts read `Nowhere, and that is the conformance.\
    \ The hook has no navigation call. Its onSuccess only touches the query cache.` — onSuccess: (_data,\
    \ { id }) => {\n  queryClient.removeQueries({ queryKey: conversationKeys.detail(id) });\n  queryClient.removeQueries({\
    \ queryKey: conversationKeys.messages(id) });\n  queryClient.removeQueries({ queryKey: conversationKeys.usage(id)\
    \ });\n  void queryClient.invalidateQueries({ queryKey: conversationKeys.all });\n} — a binding asserts\
    \ the file answers for the node, so the pair that stopped holding it is released by `--bind ... --replace`,\
    \ never restamped here"
  observed_at:
  - src/features/chat/api/use-create-conversation.ts
  - src/features/chat/api/use-delete-conversation.ts
- node: rules/chat-workspace/create-refreshes-every-conversation-read
  conforms: true
  how: "src/features/chat/api/use-create-conversation.ts: held at the onSuccess handler of useCreateConversation(),\
    \ lines 35-39 — void queryClient.invalidateQueries({\n  queryKey: conversationKeys.all,\n});"
  encoded_at:
  - src/features/chat/api/use-create-conversation.ts
- node: rules/chat-workspace/delete-removes-the-conversations-reads
  conforms: true
  how: 'src/features/chat/api/use-delete-conversation.ts: held at The onSuccess handler of useMutation,
    lines 26-31. — queryClient.removeQueries({ queryKey: conversationKeys.detail(id) });

    queryClient.removeQueries({ queryKey: conversationKeys.messages(id) });

    queryClient.removeQueries({ queryKey: conversationKeys.usage(id) });

    void queryClient.invalidateQueries({ queryKey: conversationKeys.all });'
  encoded_at:
  - src/features/chat/api/use-delete-conversation.ts
- node: rules/chat-workspace/delete-uses-the-no-body-helper
  conforms: true
  how: "src/features/chat/api/use-delete-conversation.ts: held at The mutationFn, lines 20-25. It calls\
    \ httpVoid and the async function returns nothing. The mutation result type is UseMutationResult<void,\
    \ Error, DeleteConversationVariables>. — mutationFn: async ({ id }) => {\n  await httpVoid(`/api/v1/conversations/${encodeURIComponent(id)}`,\
    \ {"
  encoded_at:
  - src/features/chat/api/use-delete-conversation.ts
- node: rules/chat-workspace/details-and-listing-are-read-again-on-focus
  conforms: true
  how: 'src/features/chat/api/use-get-conversation.ts: held at the refetchOnWindowFocus option of the
    useQuery call, line 24 — refetchOnWindowFocus: true,

    src/features/chat/api/use-list-conversations.ts: held at the useQuery options, line 42; only the listing
    is read in this file — refetchOnWindowFocus: true,'
  encoded_at:
  - src/features/chat/api/use-get-conversation.ts
  - src/features/chat/api/use-list-conversations.ts
- node: rules/chat-workspace/disabling-codes-lock-the-composer
  conforms: true
  how: 'src/features/chat/components/Composer.tsx: held at isTextareaDisabled, the send Button''s disabled
    prop and the notice paragraph, lines 229, 287 and 295-307 — const isTextareaDisabled = isStreaming
    || disabledNotice !== null; disabled={disabledNotice !== null} {hasError ? errors.content?.message
    : disabledNotice}'
  encoded_at:
  - src/features/chat/components/Composer.tsx
- node: rules/chat-workspace/done-settles-the-turn-and-makes-the-status-idle
  conforms: true
  how: "src/features/chat/api/useSendMessage.ts: held at The \"done\" case of dispatchFrame, lines 261-264,\
    \ and the stopReason assignment at lines 182-183. — case \"done\":\n  useGraphStore.getState().settleTurn(\"\
    done\");\n  actions.setChatStatus(\"idle\");\n...\nstopReason = frame.stop_reason;"
  encoded_at:
  - src/features/chat/api/useSendMessage.ts
- node: rules/chat-workspace/each-frame-kind-requires-its-fields
  conforms: true
  how: "src/features/chat/api/chat-stream.ts: held at the per-event cases of parseSSEFrame, lines 85-133.\
    \ — if (typeof tool !== \"string\" || typeof argsSummary !== \"string\") {\n        return null;\n\
    \      }\nif (typeof ok !== \"boolean\") return null;\nif (typeof stopReason !== \"string\") return\
    \ null;\nif (typeof code !== \"string\" || typeof message !== \"string\") return null;\nif (typeof\
    \ sourceTool !== \"string\") return null;\nif (!Array.isArray(nodes)) return null;\nif (!Array.isArray(links))\
    \ return null;"
  encoded_at:
  - src/features/chat/api/chat-stream.ts
- node: rules/chat-workspace/enter-sends-and-shift-enter-breaks-the-line
  conforms: true
  how: 'src/features/chat/components/Composer.tsx: held at onTextareaKeyDown, lines 200-208 — if (e.key
    === "Enter" && !e.shiftKey) { e.preventDefault(); formRef.current?.requestSubmit(); }'
  encoded_at:
  - src/features/chat/components/Composer.tsx
- node: rules/chat-workspace/error-settles-the-turn-and-makes-the-status-error
  conforms: true
  how: "src/features/chat/api/useSendMessage.ts: held at The \"error\" case of dispatchFrame, lines 265-268,\
    \ and the code and message assignment at lines 184-186. The graph store's `settleTurn` accepts \"\
    done\" or \"error\", and \"error\" is the failed settlement. — case \"error\":\n  useGraphStore.getState().settleTurn(\"\
    error\");\n  actions.setChatStatus(\"error\");\n...\nerrorCode = frame.code;\nerrorMessage = frame.message;"
  encoded_at:
  - src/features/chat/api/useSendMessage.ts
- node: rules/chat-workspace/error-status-stays-until-the-next-send
  conforms: true
  how: "src/features/chat/api/useSendMessage.ts: held at The finally block, lines 189-192, clears only\
    \ streaming and the abort handle and leaves the status alone. The status is cleared by resetTurn at\
    \ the start of the next send, line 118. — } finally {\n  actions.setStreaming(false);\n  actions.setAbortController(null);\n\
    }"
  encoded_at:
  - src/features/chat/api/useSendMessage.ts
- node: rules/chat-workspace/escape-aborts-the-turn-from-anywhere
  conforms: true
  how: 'src/features/chat/components/Composer.tsx: held at the useEffect with a document keydown listener,
    lines 210-222 — document.addEventListener("keydown", onKeyDown); if (e.key !== "Escape") return; const
    controller = useChatTurnStore.getState().abortController; if (controller !== null) { e.preventDefault();
    controller.abort(); }'
  encoded_at:
  - src/features/chat/components/Composer.tsx
- node: rules/chat-workspace/event-names-the-frame-and-data-carries-it
  conforms: true
  how: "src/features/chat/api/chat-stream.ts: held at parseSSEFrame, lines 67-72. The last event line\
    \ overwrites eventName, and data lines are joined with a newline. — if (field === \"event\") {\n \
    \     eventName = value;\n    } else if (field === \"data\") {\n      dataLine = dataLine === null\
    \ ? value : `${dataLine}\\n${value}`;\n    }"
  encoded_at:
  - src/features/chat/api/chat-stream.ts
- node: rules/chat-workspace/every-send-has-a-new-idempotency-key
  conforms: true
  how: 'src/features/chat/api/useSendMessage.ts: held at newIdempotencyKey(), lines 71-73, called once
    per mutationFn invocation at line 115. — return crypto.randomUUID();

    ...

    const idempotencyKey = newIdempotencyKey();'
  encoded_at:
  - src/features/chat/api/useSendMessage.ts
- node: rules/chat-workspace/failed-turn-gets-no-wording-from-the-list
  conforms: true
  how: "src/features/chat/components/MessageStream.tsx: held at The non-empty branch (lines 204-226) renders\
    \ only the history bubbles, the streaming bubble and ChatStatusIndicator. It has no failure copy for\
    \ a turn. The only error wording in the file is COPY_ERROR, which belongs to the history query. —\
    \ {isStreaming ? (\n  <ChatBubble\n    key=\"streaming\"\n    variant=\"assistant\"\n    content={streamingText}\n\
    \    streaming\n    animate\n  />\n) : null}\n\n<ChatStatusIndicator />"
  encoded_at:
  - src/features/chat/components/MessageStream.tsx
- node: rules/chat-workspace/first-graph-delta-replaces-and-later-ones-add
  conforms: true
  how: "src/features/chat/api/useSendMessage.ts: held at The graph_delta branch of the frame loop, lines\
    \ 168-180, with the per-send flag graphReplacedThisTurn. — if (graphReplacedThisTurn) {\n  gs.addNodes(delta);\n\
    } else {\n  gs.replaceNodes(delta);\n  graphReplacedThisTurn = true;\n}"
  encoded_at:
  - src/features/chat/api/useSendMessage.ts
- node: rules/chat-workspace/first-jump-happens-once
  conforms: true
  how: 'src/features/chat/components/MessageStream.tsx: held at The `hasInitialScrolledRef` guard in the
    layout effect (lines 114-124). The ref is never reset, so the jump happens once while the component
    stays mounted. A change of `conversationId` does not repeat it. — if (!query.isSuccess) return;

    if (hasInitialScrolledRef.current) return;

    ...

    hasInitialScrolledRef.current = true;'
  encoded_at:
  - src/features/chat/components/MessageStream.tsx
- node: rules/chat-workspace/first-load-jumps-to-the-bottom
  conforms: true
  how: 'src/features/chat/components/MessageStream.tsx: held at The layout effect (lines 116-124), which
    scrolls the bottom sentinel into view with `behavior: "auto"` when the query first succeeds. — node.scrollIntoView({
    block: "end", behavior: "auto" });'
  encoded_at:
  - src/features/chat/components/MessageStream.tsx
- node: rules/chat-workspace/frame-lines-are-field-value-pairs
  conforms: true
  how: "src/features/chat/api/chat-stream.ts: held at parseSSEFrame, lines 60 and 65-66. — const line\
    \ = rawLine.replace(/\\r$/, \"\");\nconst field = line.slice(0, colon);\n    const value = line.slice(colon\
    \ + 1).replace(/^ /, \"\");"
  encoded_at:
  - src/features/chat/api/chat-stream.ts
- node: rules/chat-workspace/graph-delta-with-no-nodes-leaves-the-graph
  conforms: true
  how: 'src/features/chat/api/useSendMessage.ts: held at Lines 169-170. The frame is converted, and the
    store is touched only when the slice has nodes. — const delta = mapWireToGraphDelta(frame);

    if (delta.nodes.length > 0) {'
  encoded_at:
  - src/features/chat/api/useSendMessage.ts
- node: rules/chat-workspace/graph-pane-receives-the-status-and-the-error
  conforms: true
  how: 'src/features/chat/components/ChatWorkspace.tsx: held at The props passed to GraphSpace at lines
    74-75, read from the graph store at lines 23-24. — status={status}

    {...(errorMessage !== undefined ? { errorMessage } : {})}'
  encoded_at:
  - src/features/chat/components/ChatWorkspace.tsx
- node: rules/chat-workspace/graph-tool-start-puts-the-graph-pane-into-loading
  conforms: true
  how: "src/features/chat/api/useSendMessage.ts: held at The GRAPH_TOOLS set, lines 212-218, isGraphTool,\
    \ and the tool_start case at lines 251-253. The match is by exact name through Set.has. — const GRAPH_TOOLS:\
    \ ReadonlySet<string> = new Set<string>([\n  \"traverse\",\n  \"get_node\",\n  \"list_nodes\",\n \
    \ \"search\",\n  \"ingest_directed\",\n]);\n...\nif (isGraphTool(frame.tool)) {\n  useGraphStore.getState().setStatus(\"\
    loading\");\n}"
  encoded_at:
  - src/features/chat/api/useSendMessage.ts
- node: rules/chat-workspace/graph-view-is-restored-and-saved-per-conversation
  conforms: true
  how: 'src/features/chat/components/ChatWorkspace.tsx: held at The call to useGraphPersistence at line
    34, which delegates to the hook in another file. This file holds the call and the conversation it
    is given. — useGraphPersistence(conversation);'
  encoded_at:
  - src/features/chat/components/ChatWorkspace.tsx
- node: rules/chat-workspace/hint-hides-in-every-other-phase
  conforms: true
  how: "src/features/chat/components/ChatStatusIndicator.tsx: held at The early return before the label\
    \ is computed. — if (chatStatus !== \"thinking\" && chatStatus !== \"tool_running\") {\n  return null;\n\
    }"
  encoded_at:
  - src/features/chat/components/ChatStatusIndicator.tsx
- node: rules/chat-workspace/hint-is-a-polite-atomic-status-region
  conforms: true
  how: 'src/features/chat/components/ChatStatusIndicator.tsx: held at The attributes on the root `div`
    of the returned element. — role="status"

    aria-live="polite"

    aria-atomic="true"'
  encoded_at:
  - src/features/chat/components/ChatStatusIndicator.tsx
- node: rules/chat-workspace/history-failure-offers-a-retry
  conforms: true
  how: 'src/features/chat/components/MessageStream.tsx: held at ErrorBanner (lines 68-95) and its use
    in the error branch (line 176). The retry button calls `query.refetch()`. — <ErrorBanner onRetry={()
    => void query.refetch()} />'
  encoded_at:
  - src/features/chat/components/MessageStream.tsx
- node: rules/chat-workspace/history-keeps-the-listed-order
  conforms: true
  how: 'src/features/chat/components/MessageStream.tsx: held at The `messages.map` call (lines 205-213),
    which renders `query.data?.items` in the order returned. There is no sort or reverse. — const messages:
    ReadonlyArray<ChatMessage> = query.data?.items ?? [];

    ...

    {messages.map((m) => ('
  encoded_at:
  - src/features/chat/components/MessageStream.tsx
- node: rules/chat-workspace/in-flight-bubble-is-removed-when-streaming-ends
  conforms: true
  how: "src/features/chat/components/MessageStream.tsx: held at The in-flight bubble is rendered only\
    \ while `isStreaming` is true (lines 215-223). It leaves the tree when streaming ends, and the file\
    \ keeps no copy of the streamed text. — {isStreaming ? (\n  <ChatBubble\n    key=\"streaming\""
  encoded_at:
  - src/features/chat/components/MessageStream.tsx
- node: rules/chat-workspace/invalid-content-sends-nothing
  conforms: true
  how: 'src/features/chat/components/Composer.tsx: held at the form''s handleSubmit(onSubmit) combined
    with the resolver and composerSchema — void handleSubmit(onSubmit)(e); resolver: safeZodResolver<ComposerFormValues,
    typeof composerSchema>( composerSchema, )'
  encoded_at:
  - src/features/chat/components/Composer.tsx
- node: rules/chat-workspace/invalid-field-is-marked-and-described
  conforms: true
  how: 'src/features/chat/components/Composer.tsx: held at hasError and describedBy, lines 230-232, with
    the Textarea props — aria-invalid={hasError} aria-describedby={describedBy} const describedBy = hasError
    || disabledNotice !== null ? messageId : undefined;'
  encoded_at:
  - src/features/chat/components/Composer.tsx
- node: rules/chat-workspace/last-terminal-frame-sets-the-result
  conforms: true
  how: "src/features/chat/api/useSendMessage.ts: held at Lines 182-187. Each done or error frame overwrites\
    \ the local result variables, so the last one wins. — if (frame.type === \"done\") {\n  stopReason\
    \ = frame.stop_reason;\n} else if (frame.type === \"error\") {\n  errorCode = frame.code;\n  errorMessage\
    \ = frame.message;\n}"
  encoded_at:
  - src/features/chat/api/useSendMessage.ts
- node: rules/chat-workspace/leaving-the-list-aborts-the-turn
  conforms: true
  how: 'src/features/chat/components/MessageStream.tsx: held at The unmount cleanup in the effect at lines
    138-144, which aborts the controller held in the turn store. — const controller = useChatTurnStore.getState().abortController;

    controller?.abort();'
  encoded_at:
  - src/features/chat/components/MessageStream.tsx
- node: rules/chat-workspace/listing-excludes-archived-by-default
  conforms: true
  how: 'src/features/chat/api/use-list-conversations.ts: held at buildQueryString line 23 and the default
    at line 31 — if (params.includeArchived === true) search.set("include_archived", "true");

    const includeArchived = params.includeArchived ?? false;'
  encoded_at:
  - src/features/chat/api/use-list-conversations.ts
- node: rules/chat-workspace/listing-sends-its-options-only-when-asked
  conforms: true
  how: 'src/features/chat/api/use-list-conversations.ts: held at buildQueryString, lines 21-23, and its
    empty-string fallback at line 25; the message listing is not in this file — if (params.limit !== undefined)
    search.set("limit", String(params.limit));

    if (params.cursor !== undefined) search.set("cursor", params.cursor);

    if (params.includeArchived === true) search.set("include_archived", "true");

    return qs.length > 0 ? `?${qs}` : "";'
  encoded_at:
  - src/features/chat/api/use-list-conversations.ts
- node: rules/chat-workspace/llm-start-makes-the-status-thinking
  conforms: true
  how: "src/features/chat/api/useSendMessage.ts: held at The \"llm_start\" case of dispatchFrame, lines\
    \ 237-239. — case \"llm_start\":\n  actions.setChatStatus(\"thinking\");"
  encoded_at:
  - src/features/chat/api/useSendMessage.ts
- node: rules/chat-workspace/loading-history-shows-three-placeholders
  conforms: true
  how: 'src/features/chat/components/MessageStream.tsx: held at SKELETON_ROWS (lines 29-33) lists three
    rows: assistant, user, assistant. The pending branch (146-162) renders them with `aria-busy="true"`.
    — { variant: "assistant", widthClass: "w-3/5" },

    { variant: "user", widthClass: "w-2/5" },

    { variant: "assistant", widthClass: "w-4/5" },'
  encoded_at:
  - src/features/chat/components/MessageStream.tsx
- node: rules/chat-workspace/message-is-a-bubble-styled-by-its-role
  conforms: true
  how: "src/features/chat/components/MessageStream.tsx: held at Each message is rendered as a ChatBubble\
    \ with `variant={m.role}` (lines 206-212). — <ChatBubble\n  key={m.id}\n  variant={m.role}\n  content={joinContent(m.content)}"
  encoded_at:
  - src/features/chat/components/MessageStream.tsx
- node: rules/chat-workspace/message-list-is-a-polite-live-region
  conforms: true
  how: 'src/features/chat/components/MessageStream.tsx: held at All three section branches carry `aria-live="polite"`.
    `aria-busy` is set on the pending branch (line 151) and only while `isStreaming` on the success branch
    (line 188). The error branch sets none. — aria-live="polite"

    {...(isStreaming ? { "aria-busy": "true" as const } : {})}'
  encoded_at:
  - src/features/chat/components/MessageStream.tsx
- node: rules/chat-workspace/message-passes-its-stop-reason-to-its-bubble
  conforms: true
  how: 'src/features/chat/components/MessageStream.tsx: held at The conditional spread on the history
    ChatBubble (line 211). It passes `stopReason` only when `m.stop_reason` is not null. — {...(m.stop_reason
    !== null ? { stopReason: m.stop_reason } : {})}'
  encoded_at:
  - src/features/chat/components/MessageStream.tsx
- node: rules/chat-workspace/message-text-joins-its-blocks
  conforms: true
  how: "src/features/chat/components/MessageStream.tsx: held at joinContent (lines 19-27), which concatenates\
    \ `text` in block order and adds nothing for a block without a string `text`. — for (const block of\
    \ blocks) {\n  if (typeof block.text === \"string\") {\n    out += block.text;\n  }\n}"
  encoded_at:
  - src/features/chat/components/MessageStream.tsx
- node: rules/chat-workspace/messages-and-usage-are-not-read-again-on-focus
  conforms: true
  how: 'src/features/chat/api/use-get-conversation-usage.ts: held at the refetchOnWindowFocus option of
    the useQuery call, line 26 — refetchOnWindowFocus: false,'
  encoded_at:
  - src/features/chat/api/use-get-conversation-usage.ts
- node: rules/chat-workspace/no-body-request-has-no-cutoff-and-no-refresh
  conforms: true
  how: 'src/features/chat/api/_request.ts: held at httpVoid, lines 10-61. It calls fetch(url, init) directly,
    with no timer or signal added by this function, and it has no 401 branch and no token refresh. A 401
    goes through the same envelope or fallback path as any other non-204 status. — response = await fetch(url,
    init);

    ...

    httpStatus: response.status,'
  encoded_at:
  - src/features/chat/api/_request.ts
- node: rules/chat-workspace/no-body-request-succeeds-only-on-204
  conforms: true
  how: 'src/features/chat/api/_request.ts: held at httpVoid, line 34. Only status 204 returns normally,
    and every other status, 200 included, reaches the throw of EnvelopeError at lines 45-60. — if (response.status
    === 204) return;'
  encoded_at:
  - src/features/chat/api/_request.ts
- node: rules/chat-workspace/no-page-size-is-fixed-by-the-screen
  conforms: true
  how: 'src/features/chat/api/use-list-conversations.ts: held at ListConversationsParams, lines 11-15,
    and buildQueryString, line 21; limit is optional and has no default — readonly limit?: number;

    if (params.limit !== undefined) search.set("limit", String(params.limit));'
  encoded_at:
  - src/features/chat/api/use-list-conversations.ts
- node: rules/chat-workspace/node-detail-receives-the-clicked-label
  conforms: true
  how: "src/features/chat/components/ChatWorkspace.tsx: held at handleNodeSelect at lines 36-42 captures\
    \ the label at click time. Lines 65-67 pass it to NodeDetailPanel only when it is defined. — const\
    \ node = nodesMap.get(nodeId);\nsetSelectedNode({ id: nodeId, label: node?.label });\n{...(selectedNode.label\
    \ !== undefined\n  ? { nodeLabel: selectedNode.label }\n  : {})}"
  encoded_at:
  - src/features/chat/components/ChatWorkspace.tsx
- node: rules/chat-workspace/one-message-line-under-the-field
  conforms: true
  how: 'src/features/chat/components/Composer.tsx: held at the single message paragraph, lines 295-307
    — {(hasError || disabledNotice !== null) && ( <p id={messageId} ... {hasError ? errors.content?.message
    : disabledNotice}'
  encoded_at:
  - src/features/chat/components/Composer.tsx
- node: rules/chat-workspace/one-validation-message-per-field
  conforms: true
  how: 'src/features/chat/components/Composer.tsx: held at safeZodResolver, lines 55-61 — if (errors[path]
    === undefined) { errors[path] = { type: issue.code, message: issue.message }; }'
  encoded_at:
  - src/features/chat/components/Composer.tsx
- node: rules/chat-workspace/reactivating-sends-an-unarchive-update
  conforms: true
  how: "src/features/chat/components/ConversationView.tsx: held at The onUnarchive prop passed to Composer,\
    \ lines 59-61. — onUnarchive={() =>\n      updateMutation.mutate({ id: conversationId, archivedAt:\
    \ null })\n    }"
  encoded_at:
  - src/features/chat/components/ConversationView.tsx
- node: rules/chat-workspace/read-and-write-failures-surface-unchanged
  conforms: true
  how: "src/features/chat/api/use-create-conversation.ts: held at the mutationFn of useCreateConversation(),\
    \ lines 23-34. It has no catch, no error mapping and no text of its own, so a failure from the request\
    \ helper propagates as raised. — const wire = await http<ConversationWire>(\"/api/v1/conversations\"\
    , {\nsrc/features/chat/api/use-delete-conversation.ts: held at The whole hook body. It declares no\
    \ onError, no catch, and no code mapping or message text. A failure raised by httpVoid propagates\
    \ as the mutation's Error. — return useMutation({\n  mutationFn: async ({ id }) => {\n    await httpVoid(`/api/v1/conversations/${encodeURIComponent(id)}`,\
    \ {\nsrc/features/chat/api/use-get-conversation-usage.ts: held at the queryFn, lines 15-23. It has\
    \ no catch or error mapping and no text of its own, so the error raised by http propagates as is.\
    \ — queryFn: async () => {\n  const wire = await http<UsageWire>(\n    ...\n    { method: \"GET\"\
    , headers: authHeader() },\n  );\n  return toUsageData(wire);\n},\nsrc/features/chat/api/use-get-conversation.ts:\
    \ held at the queryFn, lines 15-21, which awaits http and catches nothing, so a failure reaches the\
    \ query as the helper raised it — const wire = await http<ConversationWire>(\n  `/api/v1/conversations/${encodeURIComponent(id\
    \ as string)}`,\n  { method: \"GET\", headers: authHeader() },\n);\nsrc/features/chat/api/use-list-conversations.ts:\
    \ held at the queryFn, lines 34-40; the http call is awaited with no catch or mapping, so what http\
    \ raises reaches the query — const wire = await http<ConversationListWire>(\n  `/api/v1/conversations${buildQueryString(params)}`,\n\
    \  { method: \"GET\", headers: authHeader() },\n);\nreturn toConversationList(wire);\nsrc/features/chat/api/use-update-conversation.ts:\
    \ held at mutationFn of useUpdateConversation: the error from http() propagates without a try/catch,\
    \ a code mapping or any text of the screen's own — const wire = await http<ConversationWire>(\n  `/api/v1/conversations/${encodeURIComponent(id)}`,"
  encoded_at:
  - src/features/chat/api/use-create-conversation.ts
  - src/features/chat/api/use-delete-conversation.ts
  - src/features/chat/api/use-get-conversation-usage.ts
  - src/features/chat/api/use-get-conversation.ts
  - src/features/chat/api/use-list-conversations.ts
  - src/features/chat/api/use-update-conversation.ts
- node: rules/chat-workspace/reading-continues-after-a-terminal-frame
  conforms: true
  how: "src/features/chat/api/useSendMessage.ts: held at The `for await` loop, lines 167-188. It has no\
    \ break or return on done or error, so it ends only when the stream ends. — for await (const frame\
    \ of stream) {\n  ...\n  dispatchFrame(frame, actions);\n  if (frame.type === \"done\") {"
  encoded_at:
  - src/features/chat/api/useSendMessage.ts
- node: rules/chat-workspace/reads-need-a-conversation-id
  conforms: true
  how: 'src/features/chat/api/use-get-conversation-usage.ts: held at the enabled option of the useQuery
    call, line 24 — enabled: typeof conversationId === "string" && conversationId.length > 0,

    src/features/chat/api/use-get-conversation.ts: held at the enabled option of the useQuery call, line
    22 — enabled: typeof id === "string" && id.length > 0,'
  encoded_at:
  - src/features/chat/api/use-get-conversation-usage.ts
  - src/features/chat/api/use-get-conversation.ts
- node: rules/chat-workspace/refused-send-keeps-the-owner-message-until-reread
  conforms: true
  how: 'src/features/chat/api/useSendMessage.ts: held at The optimistic append, lines 123-137, with no
    removal or rollback anywhere in the file. The invalidation at lines 194-195 is what replaces the cache.
    — return { ...prev, items: [...prev.items, optimistic] };

    ...

    void queryClient.invalidateQueries({ queryKey: messagesKey });'
  encoded_at:
  - src/features/chat/api/useSendMessage.ts
- node: rules/chat-workspace/reset-restores-every-field-at-once
  conforms: true
  how: 'src/features/chat/state/chat-turn.ts: held at `reset`, line 41, over `initialState`, lines 29-36
    — reset: () => set({ ...initialState }),'
  encoded_at:
  - src/features/chat/state/chat-turn.ts
- node: rules/chat-workspace/selecting-a-node-sends-nothing
  conforms: true
  how: "src/features/chat/components/ChatWorkspace.tsx: held at handleNodeSelect and handleDetailClose\
    \ at lines 36-46, which only set local selection state. — const handleDetailClose = useCallback(()\
    \ => {\n  setSelectedNode(null);\n}, []);"
  encoded_at:
  - src/features/chat/components/ChatWorkspace.tsx
- node: rules/chat-workspace/send-carries-the-access-token-when-held
  conforms: false
  how: 'the fact left part of its ground: still held in src/features/chat/api/useSendMessage.ts, and src/features/chat/api/use-list-conversations.ts
    read `nowhere` — the file reads a listing and sends no message; the only header use is `headers: authHeader()`
    on a GET — a binding asserts the file answers for the node, so the pair that stopped holding it is
    released by `--bind ... --replace`, never restamped here'
  observed_at:
  - src/features/chat/api/use-list-conversations.ts
  - src/features/chat/api/useSendMessage.ts
- node: rules/chat-workspace/send-clears-the-previous-turn
  conforms: true
  how: 'src/features/chat/api/useSendMessage.ts: held at Lines 118-121, before the optimistic message
    and the request. — actions.resetTurn();

    actions.setIdempotencyKey(idempotencyKey);

    actions.setAbortController(controller);

    actions.setStreaming(true);'
  encoded_at:
  - src/features/chat/api/useSendMessage.ts
- node: rules/chat-workspace/send-never-refreshes-the-token
  conforms: true
  how: "src/features/chat/api/chat-stream.ts: held at streamChat, lines 202-214. A non-ok answer, 401\
    \ included, goes to extractPreStreamError and yields an error frame. The file has no refresh call\
    \ and no redirect. — const err = await extractPreStreamError(response);\n    yield { type: \"error\"\
    , code: err.code, message: err.message };\n    return;"
  encoded_at:
  - src/features/chat/api/chat-stream.ts
- node: rules/chat-workspace/send-resolves-with-the-turn-outcome
  conforms: true
  how: "src/features/chat/api/useSendMessage.ts: held at The result variables initialised to null at lines\
    \ 157-159 and returned at lines 199-204. Failed sends arrive as error frames from streamChat and so\
    \ resolve instead of throwing. — let stopReason: string | null = null;\nlet errorCode: string | null\
    \ = null;\nlet errorMessage: string | null = null;\n...\nreturn {\n  stopReason,\n  errorCode,\n \
    \ errorMessage,\n  idempotencyKey,\n};"
  encoded_at:
  - src/features/chat/api/useSendMessage.ts
- node: rules/chat-workspace/send-stream-has-no-client-cutoff
  conforms: true
  how: "src/features/chat/api/chat-stream.ts: held at streamChat, lines 176-259. The only signal is the\
    \ caller's optional options.signal. The read loop has no timer and ends on done, error, abort or a\
    \ failed read. — if (options.signal !== undefined) init.signal = options.signal;\nwhile (true) {\n\
    \      ...\n      if (chunk.done) break;"
  encoded_at:
  - src/features/chat/api/chat-stream.ts
- node: rules/chat-workspace/started-tool-calls-accumulate-at-the-end
  conforms: true
  how: "src/features/chat/state/chat-turn.ts: held at `addToolChip`, lines 52-53 — addToolChip: (chip)\
    \ =>\n  set((state) => ({ toolChips: [...state.toolChips, chip] })),"
  encoded_at:
  - src/features/chat/state/chat-turn.ts
- node: rules/chat-workspace/stop-button-aborts-the-turn
  conforms: true
  how: 'src/features/chat/components/Composer.tsx: held at onStopClick, lines 224-227 — const controller
    = useChatTurnStore.getState().abortController; controller?.abort();'
  encoded_at:
  - src/features/chat/components/Composer.tsx
- node: rules/chat-workspace/stream-end-clears-streaming-and-the-handle
  conforms: true
  how: "src/features/chat/api/useSendMessage.ts: held at The finally block, lines 189-192. — } finally\
    \ {\n  actions.setStreaming(false);\n  actions.setAbortController(null);\n}"
  encoded_at:
  - src/features/chat/api/useSendMessage.ts
- node: rules/chat-workspace/stream-end-reads-messages-and-usage-again
  conforms: true
  how: "src/features/chat/api/useSendMessage.ts: held at Lines 194-197, after the finally block. — void\
    \ queryClient.invalidateQueries({ queryKey: messagesKey });\nvoid queryClient.invalidateQueries({\n\
    \  queryKey: conversationKeys.usage(vars.conversationId),\n});"
  encoded_at:
  - src/features/chat/api/useSendMessage.ts
- node: rules/chat-workspace/stream-is-read-as-utf-8
  conforms: true
  how: "src/features/chat/api/chat-stream.ts: held at streamChat, lines 216-217 and 237. — const reader\
    \ = response.body.getReader();\n  const decoder = new TextDecoder(\"utf-8\");\nbuffer += decoder.decode(chunk.value,\
    \ { stream: true });"
  encoded_at:
  - src/features/chat/api/chat-stream.ts
- node: rules/chat-workspace/streamed-text-accumulates-at-the-end
  conforms: true
  how: "src/features/chat/state/chat-turn.ts: held at `appendText`, lines 45-46 — appendText: (delta)\
    \ =>\n  set((state) => ({ streamingText: state.streamingText + delta })),"
  encoded_at:
  - src/features/chat/state/chat-turn.ts
- node: rules/chat-workspace/streaming-adds-an-in-flight-assistant-bubble
  conforms: true
  how: "src/features/chat/components/MessageStream.tsx: held at The streaming ChatBubble after the history\
    \ map (lines 215-223). It is an assistant bubble showing `streamingText`, marked `streaming`. — <ChatBubble\n\
    \  key=\"streaming\"\n  variant=\"assistant\"\n  content={streamingText}\n  streaming\n  animate\n\
    />"
  encoded_at:
  - src/features/chat/components/MessageStream.tsx
- node: rules/chat-workspace/streaming-cursor-is-hidden-from-assistive-technology
  conforms: true
  how: "src/features/chat/components/StreamingCursor.tsx: held at The `<span>` rendered by `StreamingCursor`\
    \ (line 10-11), through its `aria-hidden` attribute. — <span\n  aria-hidden=\"true\"\n  data-testid=\"\
    streaming-cursor\""
  encoded_at:
  - src/features/chat/components/StreamingCursor.tsx
- node: rules/chat-workspace/streaming-disables-the-field-and-swaps-the-button
  conforms: true
  how: 'src/features/chat/components/Composer.tsx: held at isTextareaDisabled and the isStreaming ternary,
    lines 229 and 270-292 — {isStreaming ? ( <Button type="button" variant="destructive" ... aria-label={ARIA_STOP}
    onClick={onStopClick} data-testid="composer-stop-button" > ) : ( <Button type="submit" ...'
  encoded_at:
  - src/features/chat/components/Composer.tsx
- node: rules/chat-workspace/streaming-flag-is-separate-from-the-status
  conforms: true
  how: 'src/features/chat/state/chat-turn.ts: held at `setStreaming`, line 50, and `setChatStatus`, line
    66, which are independent setters — setStreaming: (isStreaming) => set({ isStreaming }),

    setChatStatus: (chatStatus) => set({ chatStatus }),'
  encoded_at:
  - src/features/chat/state/chat-turn.ts
- node: rules/chat-workspace/successful-cancel-reads-the-usage-again
  conforms: true
  how: "src/features/chat/api/use-cancel-turn.ts: held at useCancelTurn, the onSuccess handler: it invalidates\
    \ the usage key and no messages key. — onSuccess: () => {\n  void queryClient.invalidateQueries({\n\
    \    queryKey: conversationKeys.usage(conversationId),\n  });\n},"
  encoded_at:
  - src/features/chat/api/use-cancel-turn.ts
- node: rules/chat-workspace/successful-send-empties-the-field
  conforms: true
  how: 'src/features/chat/components/Composer.tsx: held at onSubmit, lines 185-196 — if (result.errorCode
    === null) { reset({ content: "" }); }'
  encoded_at:
  - src/features/chat/components/Composer.tsx
- node: rules/chat-workspace/text-delta-appends-and-makes-the-status-streaming
  conforms: true
  how: "src/features/chat/api/useSendMessage.ts: held at The \"text_delta\" case of dispatchFrame, lines\
    \ 240-243. It does not depend on llm_start. — case \"text_delta\":\n  actions.appendText(frame.delta);\n\
    \  actions.setChatStatus(\"streaming\");"
  encoded_at:
  - src/features/chat/api/useSendMessage.ts
- node: rules/chat-workspace/title-is-sent-as-given
  conforms: true
  how: 'src/features/chat/api/use-create-conversation.ts: held at the body construction in the mutationFn,
    lines 24 and 31 — const body: CreateConversationVariables = vars ?? {};

    ...

    body: JSON.stringify(body),'
  encoded_at:
  - src/features/chat/api/use-create-conversation.ts
- node: rules/chat-workspace/tool-call-waits-while-its-outcome-is-null
  conforms: true
  how: 'src/features/chat/components/ChatStatusIndicator.tsx: held at The `chip.ok === null` test inside
    `pickActiveToolName`. The file reads this one field of a chip shape declared in `../types`. — if (chip
    !== undefined && chip.ok === null) return chip.tool;'
  encoded_at:
  - src/features/chat/components/ChatStatusIndicator.tsx
- node: rules/chat-workspace/tool-hint-names-the-waiting-tool
  conforms: true
  how: 'src/features/chat/components/ChatStatusIndicator.tsx: held at `pickActiveToolName` scans from
    the last chip backwards and returns the first waiting tool, or null. The `label` assignment then names
    it in parentheses, or shows the bare prefix when none waits. — for (let i = chips.length - 1; i >=
    0; i -= 1) {

    ...

    active !== null ? `${COPY_TOOL_PREFIX} (${active})` : COPY_TOOL_PREFIX;'
  encoded_at:
  - src/features/chat/components/ChatStatusIndicator.tsx
- node: rules/chat-workspace/tool-result-settles-the-last-chip
  conforms: true
  how: "src/features/chat/api/useSendMessage.ts: held at The \"tool_result\" case of dispatchFrame, lines\
    \ 255-258. — case \"tool_result\":\n  actions.updateLastToolChip(frame.ok);\n  actions.setChatStatus(\"\
    streaming\");"
  encoded_at:
  - src/features/chat/api/useSendMessage.ts
- node: rules/chat-workspace/tool-start-adds-a-chip-and-makes-the-status-tool-running
  conforms: true
  how: "src/features/chat/api/useSendMessage.ts: held at The \"tool_start\" case of dispatchFrame, lines\
    \ 244-250. — actions.addToolChip({\n  tool: frame.tool,\n  argsSummary: frame.argsSummary,\n  ok:\
    \ null,\n});\nactions.setChatStatus(\"tool_running\");"
  encoded_at:
  - src/features/chat/api/useSendMessage.ts
- node: rules/chat-workspace/turn-holds-one-abort-handle
  conforms: true
  how: 'src/features/chat/state/chat-turn.ts: held at the `abortController` field, line 14, and `setAbortController`,
    line 43 — abortController: AbortController | null;

    setAbortController: (abortController) => set({ abortController }),'
  encoded_at:
  - src/features/chat/state/chat-turn.ts
- node: rules/chat-workspace/turn-holds-the-idempotency-key
  conforms: true
  how: 'src/features/chat/state/chat-turn.ts: held at the `idempotencyKey` field, line 15, and `setIdempotencyKey`,
    line 48 — idempotencyKey: string | null;

    setIdempotencyKey: (idempotencyKey) => set({ idempotencyKey }),'
  encoded_at:
  - src/features/chat/state/chat-turn.ts
- node: rules/chat-workspace/turn-starts-empty-and-idle
  conforms: true
  how: 'src/features/chat/state/chat-turn.ts: held at `initialState`, lines 29-36 — streamingText: "",

    toolChips: [] as ReadonlyArray<ToolCallData>,

    abortController: null as AbortController | null,

    idempotencyKey: null as string | null,

    isStreaming: false,

    chatStatus: "idle" as ChatStatus,'
  encoded_at:
  - src/features/chat/state/chat-turn.ts
- node: rules/chat-workspace/turn-state-holds-the-abort-handle-while-the-stream-is-open
  conforms: true
  how: 'src/features/chat/api/useSendMessage.ts: held at Lines 116-120 store the controller before the
    request. The finally block at lines 189-192 releases it. — actions.setAbortController(controller);

    actions.setStreaming(true);'
  encoded_at:
  - src/features/chat/api/useSendMessage.ts
- node: rules/chat-workspace/turn-state-lives-in-memory-only
  conforms: true
  how: "src/features/chat/state/chat-turn.ts: held at `useChatTurnStore = create<ChatTurnState>(...)`,\
    \ line 38. It is a plain zustand store with no `persist` middleware or storage call. — export const\
    \ useChatTurnStore = create<ChatTurnState>((set) => ({\n  ...initialState,"
  encoded_at:
  - src/features/chat/state/chat-turn.ts
- node: rules/chat-workspace/turn-text-and-chips-stay-until-the-next-send
  conforms: true
  how: 'src/features/chat/api/useSendMessage.ts: held at The file clears the turn state only through resetTurn
    at the start of a send, line 118. The finally block and the post-stream code do not clear text or
    chips. — actions.resetTurn();'
  encoded_at:
  - src/features/chat/api/useSendMessage.ts
- node: rules/chat-workspace/turn-without-a-terminal-frame-keeps-the-last-status
  conforms: true
  how: "src/features/chat/api/useSendMessage.ts: held at The dispatchFrame switch, which sets the status\
    \ only on frames. The end of the stream sets none, as the finally block at lines 189-192 shows. —\
    \ } finally {\n  actions.setStreaming(false);\n  actions.setAbortController(null);\n}"
  encoded_at:
  - src/features/chat/api/useSendMessage.ts
- node: rules/chat-workspace/turn-without-a-terminal-frame-resolves-empty
  conforms: true
  how: 'src/features/chat/api/useSendMessage.ts: held at Lines 157-159, which initialise the three result
    values to null, and the return at lines 199-204. — let stopReason: string | null = null;

    let errorCode: string | null = null;

    let errorMessage: string | null = null;'
  encoded_at:
  - src/features/chat/api/useSendMessage.ts
- node: rules/chat-workspace/unparseable-timestamp-becomes-an-invalid-date
  conforms: true
  how: 'src/features/chat/api/_transforms.ts: held at The timestamp reads in toConversation (archivedAt
    and createdAt, lines 68-69) and toChatMessage (createdAt, line 94). Each is a bare Date construction
    with no throw, guard or validation. — createdAt: new Date(wire.created_at),

    createdAt: new Date(wire.created_at),

    archivedAt: wire.archived_at !== null ? new Date(wire.archived_at) : null,

    The construction yields an invalid date for an unparseable string and does not throw, so the read
    does not fail.'
  encoded_at:
  - src/features/chat/api/_transforms.ts
- node: rules/chat-workspace/unterminated-last-frame-is-read
  conforms: true
  how: "src/features/chat/api/chat-stream.ts: held at streamChat, lines 248-252. The buffer left after\
    \ the stream ends is parsed as one more frame. — const tail = buffer.trim();\n    if (tail.length\
    \ > 0) {\n      const frame = parseSSEFrame(tail);\n      if (frame !== null) yield frame;\n    }"
  encoded_at:
  - src/features/chat/api/chat-stream.ts
- node: rules/chat-workspace/update-refreshes-the-details-and-every-read
  conforms: true
  how: "src/features/chat/api/use-update-conversation.ts: held at onSuccess of useUpdateConversation:\
    \ the details key is invalidated first, then the all-conversations key — void queryClient.invalidateQueries({\n\
    \  queryKey: conversationKeys.detail(data.id),\n});\nvoid queryClient.invalidateQueries({\n  queryKey:\
    \ conversationKeys.all,\n});"
  encoded_at:
  - src/features/chat/api/use-update-conversation.ts
- node: rules/chat-workspace/update-sends-only-the-fields-supplied
  conforms: true
  how: 'src/features/chat/api/use-update-conversation.ts: held at the body construction in mutationFn
    of useUpdateConversation, plus the UpdateConversationVariables declaration for the optional fields
    — const body: Record<string, unknown> = {};

    if (title !== undefined) body["title"] = title;

    if (archivedAt !== undefined) body["archived_at"] = archivedAt;

    ... body: JSON.stringify(body),'
  encoded_at:
  - src/features/chat/api/use-update-conversation.ts
- node: rules/chat-workspace/usage-badge-shows-nothing-until-usage-arrives
  conforms: true
  how: "src/features/chat/components/UsageBadge/UsageBadge.tsx: held at The early return at line 24 of\
    \ UsageBadge. — if (query.isLoading || query.data == null) {\n    return null;\n  }"
  encoded_at:
  - src/features/chat/components/UsageBadge/UsageBadge.tsx
- node: rules/chat-workspace/usage-badge-shows-the-three-counts
  conforms: true
  how: 'src/features/chat/components/UsageBadge/UsageBadge.tsx: held at The destructuring at line 28 and
    the three count spans of the returned markup. No message count is read or rendered. — const { tokens_in,
    tokens_out, tool_calls } = query.data;

    ...

    <span data-testid="usage-badge-tokens-in">

    ...

    <span data-testid="usage-badge-tokens-out">

    ...

    <span data-testid="usage-badge-tool-calls">'
  encoded_at:
  - src/features/chat/components/UsageBadge/UsageBadge.tsx
- node: rules/chat-workspace/validation-message-is-an-alert
  conforms: true
  how: 'src/features/chat/components/Composer.tsx: held at the message paragraph''s role prop, line 298
    — role={hasError ? "alert" : undefined}'
  encoded_at:
  - src/features/chat/components/Composer.tsx
- node: rules/chat-workspace/waiting-hint-sits-below-the-last-bubble
  conforms: true
  how: 'src/features/chat/components/MessageStream.tsx: held at ChatStatusIndicator is the last child
    of the non-empty branch (line 225). The pending and error branches do not render it, and neither does
    the empty branch. — <ChatStatusIndicator />'
  encoded_at:
  - src/features/chat/components/MessageStream.tsx
- node: rules/chat-workspace/whitespace-only-content-passes
  conforms: true
  how: 'src/features/chat/components/Composer.tsx: held at composerSchema, lines 38-43, which applies
    no trim — content: z .string() .min(1, MSG_EMPTY) .max(MAX_CONTENT_LENGTH, MSG_TOO_LONG),'
  encoded_at:
  - src/features/chat/components/Composer.tsx
- node: rules/chat/conversation-listing-excludes-archived
  conforms: true
  how: 'src/features/chat/api/use-list-conversations.ts: held at buildQueryString line 23; the listing
    leaves out archived conversations by sending include_archived only when asked for — if (params.includeArchived
    === true) search.set("include_archived", "true");'
  encoded_at:
  - src/features/chat/api/use-list-conversations.ts
- node: scenarios/chat-workspace/escape-stops-a-streaming-turn
  conforms: true
  how: 'src/features/chat/components/Composer.tsx: held at the document-level Escape listener, lines 210-222
    — document.addEventListener("keydown", onKeyDown); controller.abort();'
  encoded_at:
  - src/features/chat/components/Composer.tsx
- node: scenarios/chat-workspace/failed-send-keeps-the-typed-text
  conforms: true
  how: 'src/features/chat/components/Composer.tsx: held at onSubmit, lines 185-196, which resets the field
    only on success — if (result.errorCode === null) { reset({ content: "" }); }'
  encoded_at:
  - src/features/chat/components/Composer.tsx
- node: scenarios/chat-workspace/malformed-frame-is-skipped
  conforms: true
  how: "src/features/chat/api/chat-stream.ts: held at parseSSEFrame, lines 76-81 together with the yield\
    \ guard at lines 243-244. A frame whose data is not JSON returns null, the loop does not yield it,\
    \ and the next frames are still read. — try {\n    payload = JSON.parse(dataLine);\n  } catch {\n\
    \    return null;\n  }\nconst frame = parseSSEFrame(block);\n        if (frame !== null) yield frame;"
  encoded_at:
  - src/features/chat/api/chat-stream.ts
- node: scenarios/chat-workspace/second-graph-delta-adds-to-the-first
  conforms: true
  how: "src/features/chat/api/useSendMessage.ts: held at Lines 172-177. The first delta with nodes replaces\
    \ and the second is added. — if (graphReplacedThisTurn) {\n  gs.addNodes(delta);\n} else {\n  gs.replaceNodes(delta);\n\
    \  graphReplacedThisTurn = true;\n}"
  encoded_at:
  - src/features/chat/api/useSendMessage.ts
unstated:
- file: src/features/chat/components/Composer.tsx
  where: the Textarea in ComposerSendBand, line 262
  evidence: placeholder="Pergunte algo…"
  cost: The composer shows this hint text inside the empty field, and no node holds it. The contract for
    compose-message names the field's label, the send and stop buttons and the band, but not a placeholder.
    The wording therefore lives only in this file, so a reader who looks in the specification for what
    the empty field says will not find it.
unbound:
- src/features/chat/components/Composer.types.ts
notes: "Judged by 20 delegation(s), one per file; folded mechanically by trace.py --fold from the returns\
  \ under siegard-reconcile/restates-fe-chat.returns/.\nA finding in src/features/chat/state/chat-turn.ts\
  \ names domain/chat-workspace/chat-status, which no file of this set is bound to: the `ChatStatus` type,\
  \ lines 4-9: export type ChatStatus =\n  | \"idle\"\n  | \"thinking\"\n  | \"streaming\"\n  | \"tool_running\"\
  \n  | \"error\"; — The chat-status enumeration is declared here as its own authority, in a file that\
  \ node is not bound to. The node spells the fourth value `tool-running` and this file spells it `tool_running`.\
  \ When the node's values move, `--check` does not reach this file. Nobody can then tell which spelling\
  \ was decided. The same literal `tool_running` is also compared in `ChatStatusIndicator.tsx`, so the\
  \ divergence spreads from this declaration.. It blocks nothing here; it is owed a route of its own.\n\
  Candidates: 5 opened across 5 of 20 delegation(s); each return lists its own under `candidates_opened`.\n\
  Unstated: 1 fact(s) the source states that no node holds, over 1 file(s), listed under `unstated`. They\
  \ block no binding here and no rebind closes them — the route is the analysis that gives each fact a\
  \ node."
---

## Folded
This record was folded by `trace.py --fold` from the delegation returns under `siegard-reconcile/restates-fe-chat.returns/`, which are the evidence behind every entry above.
