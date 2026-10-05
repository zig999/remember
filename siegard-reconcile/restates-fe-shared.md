---
contract_version: siegard-reconcile/8
title: Prose comments removed from the shared frontend files
summary: Every comment that was not a tool directive was removed from these files, answering the restates
  findings the adoption left against them; the facts stay in their nodes and no behaviour changed.
target: frontend
files:
- path: src/components/ds/ChatBubble/ChatBubble.tsx
  change: Prose comments removed; behaviour unchanged.
- path: src/components/ds/ChatBubble/ChatBubble.types.ts
  change: Prose comments removed; behaviour unchanged.
- path: src/components/ds/ConversationMenu/ConversationMenu.tsx
  change: Prose comments removed; behaviour unchanged.
- path: src/components/ds/ConversationMenu/ConversationMenu.types.ts
  change: Prose comments removed; behaviour unchanged.
- path: src/components/ds/GraphNode/GraphNode.tsx
  change: Prose comments removed; behaviour unchanged.
- path: src/components/ds/GraphNode/GraphNode.types.ts
  change: Prose comments removed; behaviour unchanged.
- path: src/components/ds/StateBadge/StateBadge.tsx
  change: Prose comments removed; behaviour unchanged.
- path: src/components/ds/StateBadge/StateBadge.types.ts
  change: Prose comments removed; behaviour unchanged.
- path: src/components/ui/avatar/avatar.tsx
  change: Prose comments removed; behaviour unchanged.
- path: src/components/ui/form/form.tsx
  change: Prose comments removed; behaviour unchanged.
- path: src/lib/env.ts
  change: Prose comments removed; behaviour unchanged.
- path: src/lib/error-routing.ts
  change: Prose comments removed; behaviour unchanged.
- path: src/lib/http.ts
  change: Prose comments removed; behaviour unchanged.
- path: src/lib/query-client.ts
  change: Prose comments removed; behaviour unchanged.
- path: src/lib/report-error.ts
  change: Prose comments removed; behaviour unchanged.
- path: src/lib/tokens.ts
  change: Prose comments removed; behaviour unchanged.
- path: src/router/SignInPage.tsx
  change: Prose comments removed; behaviour unchanged.
- path: src/router/StubPage.tsx
  change: Prose comments removed; behaviour unchanged.
- path: src/router/__root.tsx
  change: Prose comments removed; behaviour unchanged.
- path: src/router/routes.tsx
  change: Prose comments removed; behaviour unchanged.
- path: src/shell/AmbientBackdrop.tsx
  change: Prose comments removed; behaviour unchanged.
- path: src/shell/AppErrorBoundary.tsx
  change: Prose comments removed; behaviour unchanged.
- path: src/shell/CommandPalette.tsx
  change: Prose comments removed; behaviour unchanged.
- path: src/shell/Footer.tsx
  change: Prose comments removed; behaviour unchanged.
- path: src/shell/Header.tsx
  change: Prose comments removed; behaviour unchanged.
- path: src/shell/HeaderConversationMenu.tsx
  change: Prose comments removed; behaviour unchanged.
- path: src/shell/api/use-shell-status.ts
  change: Prose comments removed; behaviour unchanged.
- path: src/state/auth.ts
  change: Prose comments removed; behaviour unchanged.
- path: src/state/command-palette.ts
  change: Prose comments removed; behaviour unchanged.
nodes:
- node: constraints/failures-answer-one-envelope
  conforms: true
  how: "src/lib/http.ts: held at class EnvelopeError (lines 22-36) and the throw sites in http() — constructor(payload:\
    \ EnvelopeErrorPayload) {\n    super(payload.message);\n    this.code = payload.code;\n    this.httpStatus\
    \ = payload.httpStatus;\n    if (payload.details !== undefined) {"
  encoded_at:
  - src/lib/http.ts
- node: contracts/application-shell/bff-shell-reads
  conforms: true
  how: 'src/shell/api/use-shell-status.ts: held at getJson() and its two callers, useHealth() (line 16)
    and useCurationCount() (line 28) — queryFn: () => getJson("/health")

    queryFn: () => getJson("/api/v1/curation/queue?limit=1", token)

    if (token) headers.Authorization = `Bearer ${token}`;

    return res.json().catch(() => null);

    const d = q.data as { database?: string; result?: { database?: string } };

    const d = q.data as { total?: number; result?: { total?: number } } | null | undefined;'
  encoded_at:
  - src/shell/api/use-shell-status.ts
- node: contracts/application-shell/shell-screen
  conforms: true
  how: "src/lib/error-routing.ts: held at the MSG table and the routeError switch (lines 19-83). The show-failure\
    \ wording and routing are held here. The 401 \"session expired\" failure the contract assigns to the\
    \ request helper is raised in http.ts, not in this file. — accessDenied: \"Acesso negado.\", validationInvalid:\
    \ \"Há campos inválidos no formulário.\", notFound: \"Nenhum resultado encontrado.\", conversationNotFound:\
    \ \"Conversa não encontrada.\", gone: \"Esta fonte foi removida por conformidade.\", business: \"\
    Operação não pôde ser concluída.\", system: \"Algo deu errado. Tente novamente.\", offline: \"Sem\
    \ conexão.\"\nsrc/lib/query-client.ts: held at the onError handlers in createQueryClient(), lines\
    \ 79-86 and 89-96. They give the non-envelope fallback toast on show-failure. The wording of the other\
    \ codes is held in src/lib/error-routing.ts, which this file calls. — reportError(err);\n        toast.error(\"\
    Algo deu errado. Tente novamente.\");\nsrc/router/__root.tsx: held at NotFoundFallback (lines 27-38)\
    \ for the \"Página não encontrada.\" answer of show-page-state. RootComponent (lines 11-21) mounts\
    \ the AppToaster that carries show-failure's toasts, but the toast wordings are not in this file.\
    \ — <h1 className=\"text-lg font-semibold tracking-tight\">Página não encontrada.</h1>\n<p className=\"\
    text-body text-body\">\n  O endereço solicitado não existe ou foi removido.\n</p>\nsrc/router/routes.tsx:\
    \ held at the not-found route and the three placeholder routes (lines 100-110, 159-175), plus the\
    \ guard redirect (lines 36-44) — title=\"Página não encontrada.\"\nhint=\"O endereço solicitado não\
    \ existe ou foi removido.\"\n<StubPage title=\"Grafo\" testId=\"graph-page\" />\nthrow redirect({\
    \ to: \"/sign-in\", search: { reason: \"session_expired\" } });\nsrc/shell/AppErrorBoundary.tsx: held\
    \ at The default fallback returned by render() in AppErrorBoundary, lines 38-57. It holds the show-page-state\
    \ refusal for a render failure: the title, the message and the Recarregar action. The other operations\
    \ of this contract (show-failure, show-shell, the other show-page-state refusals) are not in this\
    \ file. — <h1 className=\"text-lg font-semibold tracking-tight\">Algo deu errado.</h1>\n<p className=\"\
    text-body text-body\">\n  A página não pôde ser renderizada. Recarregue para tentar novamente.\n</p>\n\
    <button\n  type=\"button\"\n  onClick={this.handleReload}\n  ...\n>\n  Recarregar\n</button>\nsrc/shell/Footer.tsx:\
    \ held at the root element of Footer(), lines 41-49. It is a contentinfo named \"Rodapé\" and holds\
    \ the health span, the as-of popover trigger and the pending-curation link. This file holds only the\
    \ footer part of show-shell. — <GlassSurface\n      level=\"ambient\"\n      role=\"contentinfo\"\n\
    \      aria-label=\"Rodapé\"\nsrc/shell/Header.tsx: held at the GlassSurface with role=\"banner\"\
    \ and aria-label=\"Cabeçalho\" (lines 46-49), the nav aria-label=\"Áreas\" (line 62) and the palette\
    \ Button aria-label=\"Abrir paleta de comandos (⌘K)\" (lines 94-98). The theme choice is rendered\
    \ as the ThemeSelect element (line 93) and is declared in another file. The footer, health state and\
    \ as-of date are not in this file. — role=\"banner\"\n      aria-label=\"Cabeçalho\"\n<nav aria-label=\"\
    Áreas\" className=\"flex items-center gap-xs\">\naria-label=\"Abrir paleta de comandos (⌘K)\""
  encoded_at:
  - src/lib/error-routing.ts
  - src/lib/query-client.ts
  - src/router/__root.tsx
  - src/router/routes.tsx
  - src/shell/AppErrorBoundary.tsx
  - src/shell/Footer.tsx
  - src/shell/Header.tsx
- node: domain/application-shell/application-shell
  conforms: true
  how: "src/router/routes.tsx: held at routeTree (lines 177-189), which declares the addresses and puts\
    \ every address except sign-in under protectedLayoutRoute — export const routeTree = RootRoute.addChildren([\n\
    \  signInRoute,\n  protectedLayoutRoute.addChildren(["
  encoded_at:
  - src/router/routes.tsx
- node: domain/application-shell/failure-action
  conforms: true
  how: 'src/lib/error-routing.ts: held at the ErrorAction union type (lines 5-13) — | { kind: "redirect";
    to: string } | { kind: "toast-and-navigate"; ... } | { kind: "boundary"; message: string } | { kind:
    "set-error"; ... } | { kind: "inline-empty"; ... } | { kind: "inline-gone"; ... } | { kind: "toast";
    ... } | { kind: "silent" }'
  encoded_at:
  - src/lib/error-routing.ts
- node: rules/application-shell/a-401-is-answered-with-one-silent-refresh
  conforms: true
  how: "src/lib/http.ts: held at the 401 branch of http(), lines 164-175, and trySilentRefresh() — if\
    \ (response.status === 401 && __retried !== true) {\n    const refreshed = await trySilentRefresh();\n\
    ...\nconst newJwt = await fetchAccessToken();"
  encoded_at:
  - src/lib/http.ts
- node: rules/application-shell/a-bubble-shows-its-tool-chips-first
  conforms: false
  how: 'the fact left part of its ground: still held in src/components/ds/ChatBubble/ChatBubble.tsx, and
    src/components/ds/ChatBubble/ChatBubble.types.ts read `nowhere. The file only types the `toolChips`
    prop and declares no chip order, content or colour. The `ToolCallData` shape comes from `@/features/chat/types`.`
    — toolChips?: ReadonlyArray<ToolCallData>; — a binding asserts the file answers for the node, so the
    pair that stopped holding it is released by `--bind ... --replace`, never restamped here'
  observed_at:
  - src/components/ds/ChatBubble/ChatBubble.tsx
  - src/components/ds/ChatBubble/ChatBubble.types.ts
- node: rules/application-shell/a-bubble-shows-plain-text
  conforms: true
  how: "src/components/ds/ChatBubble/ChatBubble.tsx: held at The `<p data-testid=\"bubble-content\">`\
    \ element, which renders `{content}` as a plain child with whitespace-pre-wrap. — <p\n  data-testid=\"\
    bubble-content\"\n  className=\"whitespace-pre-wrap break-words text-xs text-foreground\"\n>\n  {content}\n\
    src/components/ds/ChatBubble/ChatBubble.types.ts: held at the `content: string` member of `ChatBubbleProps`.\
    \ It is a required string, so an empty string is accepted. Keeping line breaks is rendering behavior\
    \ and is not declared in this file. — content: string;"
  encoded_at:
  - src/components/ds/ChatBubble/ChatBubble.tsx
  - src/components/ds/ChatBubble/ChatBubble.types.ts
- node: rules/application-shell/a-bubble-state-is-resolved-in-order
  conforms: true
  how: "src/components/ds/ChatBubble/ChatBubble.tsx: held at The `data-state` expression on the root div,\
    \ which tests error, then streaming, then stopNotice, then falls back to idle. — data-state={\n  error\n\
    \    ? \"error\"\n    : streaming\n      ? \"streaming\"\n      : stopNotice !== undefined\n     \
    \   ? \"stopped\"\n        : \"idle\"\n}"
  encoded_at:
  - src/components/ds/ChatBubble/ChatBubble.tsx
- node: rules/application-shell/a-bubble-takes-one-role
  conforms: true
  how: 'src/components/ds/ChatBubble/ChatBubble.tsx: held at The single `variant` prop. It sets `data-variant`
    and the `chatBubble({ variant })` classes (the side is decided in ChatBubble.variants, outside this
    file). It also sets glassFill, which is the fill. — const glassFill = variant === "user" ? "ambient"
    : "ambient-accent";

    ...

    data-variant={variant}

    ...

    className={cn(chatBubble({ variant }), className)}

    src/components/ds/ChatBubble/ChatBubble.types.ts: held at the `ChatBubbleVariant` union and the required
    `variant` member of `ChatBubbleProps`. They give exactly one role per bubble. The side and the fill
    that the role decides are not declared in this file. — export type ChatBubbleVariant = "user" | "assistant";

    ...

    variant: ChatBubbleVariant;'
  encoded_at:
  - src/components/ds/ChatBubble/ChatBubble.tsx
  - src/components/ds/ChatBubble/ChatBubble.types.ts
- node: rules/application-shell/a-business-failure-shows-its-message
  conforms: true
  how: "src/lib/error-routing.ts: held at the BUSINESS_ prefix branch in the default case of routeError,\
    \ line 75 — if (code.startsWith(\"BUSINESS_\")) {\n  return { kind: \"toast\", tone: \"warning\",\
    \ message: fallbackMessage ?? MSG.business };\n}"
  encoded_at:
  - src/lib/error-routing.ts
- node: rules/application-shell/a-conversation-resource-is-recognised-by-its-key
  conforms: true
  how: 'src/lib/error-routing.ts: held at isConversationResourceKey, lines 85-92 — if (queryKey.length
    < 2) return false;

    if (queryKey[0] !== "conversations") return false;

    ... if (second === "list") return false;

    return second.length > 0;'
  encoded_at:
  - src/lib/error-routing.ts
- node: rules/application-shell/a-failed-envelope-keeps-its-code
  conforms: true
  how: "src/lib/http.ts: held at the final throw of http(), lines 210-216 — code: error?.code ?? \"SYSTEM_UNKNOWN\"\
    ,\n    httpStatus: response.status,\n    message: error?.message ?? \"Erro desconhecido do servidor.\"\
    ,\n    details: error?.details,"
  encoded_at:
  - src/lib/http.ts
- node: rules/application-shell/a-failed-menu-action-does-not-navigate
  conforms: true
  how: "src/shell/HeaderConversationMenu.tsx: held at The onCreate, onArchive and onDelete handlers (lines\
    \ 46-85). Each navigates only inside an onSuccess callback, and the file declares no onError. — createMutation.mutate(undefined,\
    \ {\n          onSuccess: (created) => {\n            void navigate({\n...\ndeleteMutation.mutate(\n\
    \          { id },\n          {\n            onSuccess: () => {"
  encoded_at:
  - src/shell/HeaderConversationMenu.tsx
- node: rules/application-shell/a-failed-refresh-ends-the-session
  conforms: true
  how: "src/lib/http.ts: held at the catch of trySilentRefresh(), lines 114-119, and the throw at lines\
    \ 170-174 — useAuthStore.getState().clear();\n    redirectImpl(\"/sign-in?reason=session_expired\"\
    );\n    return false;\n...\ncode: \"AUTH_SESSION_EXPIRED\","
  encoded_at:
  - src/lib/http.ts
- node: rules/application-shell/a-failure-carries-code-status-message-and-details
  conforms: true
  how: "src/lib/http.ts: held at class EnvelopeError, lines 22-36 — this.code = payload.code;\n    this.httpStatus\
    \ = payload.httpStatus;\n    if (payload.details !== undefined) {\n      this.details = payload.details;\n\
    \    }"
  encoded_at:
  - src/lib/http.ts
- node: rules/application-shell/a-failure-to-complete-is-timeout-abort-or-network
  conforms: true
  how: "src/lib/http.ts: held at the catch around fetch() in http(), lines 135-161 — code: \"SYSTEM_TIMEOUT\"\
    ,\n        httpStatus: 0,\n...\ncode: \"SYSTEM_ABORTED\",\n        httpStatus: 0,\n...\ncode: \"SYSTEM_NETWORK\"\
    ,\n      httpStatus: 0,"
  encoded_at:
  - src/lib/http.ts
- node: rules/application-shell/a-field-outside-a-form-is-a-developer-error
  conforms: true
  how: "src/components/ui/form/form.tsx: held at useFormField(), the guard on lines 59-61 — if (!fieldContext)\
    \ {\n    throw new Error(\"useFormField deve ser usado dentro de <FormField>\");\n  }"
  encoded_at:
  - src/components/ui/form/form.tsx
- node: rules/application-shell/a-forbidden-failure-reads-access-denied
  conforms: true
  how: "src/lib/error-routing.ts: held at the AUTH_FORBIDDEN case of routeError, lines 44-45. Showing\
    \ the boundary as an error toast is done by applyErrorAction in query-client.ts, which this file does\
    \ not contain. — case \"AUTH_FORBIDDEN\":\n  return { kind: \"boundary\", message: MSG.accessDenied\
    \ };\nsrc/lib/query-client.ts: held at the \"boundary\" case of applyErrorAction(), lines 38-40. It\
    \ shows the routed message as a danger toast. The text \"Acesso negado.\" and the choice of the boundary\
    \ action for AUTH_FORBIDDEN are held in src/lib/error-routing.ts. — case \"boundary\":\n      toast.error(action.message);\n\
    \      return;"
  encoded_at:
  - src/lib/error-routing.ts
  - src/lib/query-client.ts
- node: rules/application-shell/a-fresh-owner-skips-sign-in
  conforms: true
  how: 'src/router/routes.tsx: held at signInRoute beforeLoad (lines 86-96) — try { fresh = useAuthStore.getState().isFresh();
    } catch { fresh = false; }

    if (fresh) { throw redirect({ to: "/chat" }); }'
  encoded_at:
  - src/router/routes.tsx
- node: rules/application-shell/a-gone-resource-reads-removed-for-compliance
  conforms: true
  how: "src/lib/error-routing.ts: held at the RESOURCE_GONE case of routeError, lines 65-66 — case \"\
    RESOURCE_GONE\":\n  return { kind: \"inline-gone\", message: MSG.gone };\nsrc/lib/query-client.ts:\
    \ held at the \"inline-gone\" case of applyErrorAction(), lines 43-45. It shows no toast, so the state\
    \ stays inline. The text \"Esta fonte foi removida por conformidade.\" is held in src/lib/error-routing.ts.\
    \ — case \"inline-empty\":\n    case \"inline-gone\":\n      return;"
  encoded_at:
  - src/lib/error-routing.ts
  - src/lib/query-client.ts
- node: rules/application-shell/a-graph-node-names-its-type
  conforms: true
  how: "src/components/ds/GraphNode/GraphNode.tsx: held at NODE_STYLE (lines 26-37), the `aria-label`\
    \ on the GlassSurface (line 72), and the subtitle span (line 85) — aria-label={`${style.label}: ${label}`}\n\
    {subtitle ?? style.label}\nwith the ten GraphNodeType entries in NODE_STYLE, each carrying a `label`.\n\
    src/components/ds/GraphNode/GraphNode.types.ts: held at the GraphNodeType union (lines 4-14) holds\
    \ the \"one of ten node types\" part. GraphNodeProps (lines 16-24) holds the caller override of the\
    \ default subtitle as the optional `subtitle?: string`. The fixed pt-BR names and the \"name, colon,\
    \ label\" form are not declared in this file. — export type GraphNodeType =\n  | \"person\"\n  | \"\
    organization\"\n  | \"project\"\n  | \"event\"\n  | \"role\"\n  | \"category\"\n  | \"concept\"\n\
    \  | \"location\"\n  | \"document\"\n  | \"task\";\n\nexport interface GraphNodeProps {\n  type: GraphNodeType;\n\
    \  label: string;\n  subtitle?: string;"
  encoded_at:
  - src/components/ds/GraphNode/GraphNode.tsx
  - src/components/ds/GraphNode/GraphNode.types.ts
- node: rules/application-shell/a-graph-node-shows-its-state-by-an-icon
  conforms: true
  how: 'src/components/ds/GraphNode/GraphNode.tsx: held at the accent computation (lines 58-62), the ring
    on the surface (line 75), and the conditional StateBadge (lines 88-96) — const accent: GlassAccent
    = selected ? "focus" : state ? STATE_ACCENT[state] : "none";

    selected && "ring-2 ring-border-focus",

    {state && (<StateBadge state={state} size="sm" iconOnly animate={false} className="ml-auto shrink-0"
    />)}'
  encoded_at:
  - src/components/ds/GraphNode/GraphNode.tsx
- node: rules/application-shell/a-loading-workspace-says-so-politely
  conforms: true
  how: 'src/router/routes.tsx: held at the Suspense fallbacks of chatRoute, ingestRoute and curationRoute
    (lines 66-80, 115-129, 142-156) — role="status" aria-live="polite" ... Carregando conversa… / Carregando
    ingestão… / Carregando curadoria…'
  encoded_at:
  - src/router/routes.tsx
- node: rules/application-shell/a-missing-conversation-returns-to-chat
  conforms: true
  how: "src/lib/error-routing.ts: held at the conversation branch of the RESOURCE_NOT_FOUND case, lines\
    \ 55-62 — if (context?.isConversationResource === true) {\n  return {\n    kind: \"toast-and-navigate\"\
    ,\n    tone: \"warning\",\n    message: MSG.conversationNotFound,\n    to: \"/chat\",\n  };\n}\nsrc/lib/query-client.ts:\
    \ held at the \"toast-and-navigate\" case of applyErrorAction(), lines 24-28. It shows the toast,\
    \ then navigates to action.to with empty search through the router, so there is no page reload. The\
    \ text \"Conversa não encontrada.\" and the chat address are held in src/lib/error-routing.ts. contextFromQuery()\
    \ and contextFromMutation() supply the conversation-resource context. — void router.navigate({ to:\
    \ action.to, search: {} as never });"
  encoded_at:
  - src/lib/error-routing.ts
  - src/lib/query-client.ts
- node: rules/application-shell/a-missing-resource-elsewhere-is-an-empty-state
  conforms: true
  how: "src/lib/error-routing.ts: held at the fall-through of the RESOURCE_NOT_FOUND case, line 63 — return\
    \ { kind: \"inline-empty\", message: fallbackMessage ?? MSG.notFound };\nsrc/lib/query-client.ts:\
    \ held at the \"inline-empty\" case of applyErrorAction(), lines 43-45. It shows no toast. The message\
    \ choice and the \"Nenhum resultado encontrado.\" text are held in src/lib/error-routing.ts. — case\
    \ \"inline-empty\":\n    case \"inline-gone\":\n      return;"
  encoded_at:
  - src/lib/error-routing.ts
  - src/lib/query-client.ts
- node: rules/application-shell/a-network-failure-reads-no-connection
  conforms: true
  how: "src/lib/error-routing.ts: held at the SYSTEM_NETWORK and SYSTEM_ABORTED cases, lines 68-72 — case\
    \ \"SYSTEM_NETWORK\":\n  return { kind: \"toast\", tone: \"warning\", message: MSG.offline };\ncase\
    \ \"SYSTEM_ABORTED\":\n  return { kind: \"silent\" };"
  encoded_at:
  - src/lib/error-routing.ts
- node: rules/application-shell/a-read-is-retried-once
  conforms: true
  how: "src/lib/query-client.ts: held at the defaultOptions of createQueryClient(), lines 68-76 — queries:\
    \ {\n        retry: 1,\n        staleTime: STABLE_STALE_MS,\n        refetchOnWindowFocus: false,\n\
    \      },\n      mutations: {\n        retry: 0,\n      },"
  encoded_at:
  - src/lib/query-client.ts
- node: rules/application-shell/a-read-stays-fresh-five-minutes-by-default
  conforms: true
  how: "src/lib/query-client.ts: held at STABLE_STALE_MS (line 14), VOLATILE_STALE_MS (line 16), and the\
    \ queries defaults in createQueryClient() — export const STABLE_STALE_MS = 5 * 60 * 1000;\n\nexport\
    \ const VOLATILE_STALE_MS = 0;\n...\nstaleTime: STABLE_STALE_MS,\n        refetchOnWindowFocus: false,"
  encoded_at:
  - src/lib/query-client.ts
- node: rules/application-shell/a-refreshed-token-repeats-the-request
  conforms: true
  how: "src/lib/http.ts: held at the refreshed branch of the 401 handling, lines 166-169, with buildSignal()\
    \ rebuilding the cutoff on the repeat call — useAuthStore.getState().setToken(newJwt);\n...\nconst\
    \ retryOpts: HttpOptions = { ...opts, __retried: true };\n      return http<T>(path, retryOpts);"
  encoded_at:
  - src/lib/http.ts
- node: rules/application-shell/a-rename-sends-the-trimmed-title
  conforms: true
  how: 'src/components/ds/ConversationMenu/ConversationMenu.tsx: held at commitRename() and onRenameKeyDown(),
    lines 106-111 and 144-155 — const trimmed = renameDraft.trim();

    if (trimmed.length > 0) onRename(id, trimmed);

    setRenamingId(null);

    setRenameDraft("");

    ... if (e.key === "Enter") { e.preventDefault(); commitRename(id); }

    The Input has no maxLength.'
  encoded_at:
  - src/components/ds/ConversationMenu/ConversationMenu.tsx
- node: rules/application-shell/a-render-failure-is-reported-and-announced
  conforms: true
  how: "src/shell/AppErrorBoundary.tsx: held at componentDidCatch, lines 24-29, which reports the error\
    \ with its source and component stack. The fallback container at lines 39-44 carries the assertive\
    \ alert announcement. — reportError(error, {\n  source: \"AppErrorBoundary\",\n  extra: { componentStack:\
    \ info.componentStack ?? null },\n});\n...\n<div\n  role=\"alert\"\n  aria-live=\"assertive\""
  encoded_at:
  - src/shell/AppErrorBoundary.tsx
- node: rules/application-shell/a-render-failure-replaces-the-screen
  conforms: true
  how: "src/router/__root.tsx: held at RootComponent, lines 15-17. It wraps the Outlet in AppErrorBoundary\
    \ under the root, so a render failure of any page falls inside the boundary. The notice and the Recarregar\
    \ action are in the imported AppErrorBoundary, a file outside this set, and this file states neither.\
    \ — <AppErrorBoundary>\n  <Outlet />\n</AppErrorBoundary>\nsrc/shell/AppErrorBoundary.tsx: held at\
    \ getDerivedStateFromError (line 20) sets hasError. render() (lines 35-58) returns the full-screen\
    \ fallback in place of the children. handleReload (lines 31-33) is wired to the Recarregar button.\
    \ — static getDerivedStateFromError(error: Error): AppErrorBoundaryState {\n  return { hasError: true,\
    \ error };\n}\n...\nclassName=\"flex min-h-screen flex-col items-center justify-center gap-md px-lg\
    \ text-foreground\"\n...\nif (typeof window !== \"undefined\") window.location.reload();"
  encoded_at:
  - src/router/__root.tsx
  - src/shell/AppErrorBoundary.tsx
- node: rules/application-shell/a-repeated-request-never-refreshes-again
  conforms: true
  how: 'src/lib/http.ts: held at the guard on the 401 branch, line 164, and the unchanged flow to the
    body judgment below it — if (response.status === 401 && __retried !== true) {'
  encoded_at:
  - src/lib/http.ts
- node: rules/application-shell/a-reported-error-stays-in-the-console
  conforms: true
  how: "src/lib/report-error.ts: held at reportError(), lines 7-18: the early return on `!import.meta.env.DEV`\
    \ and the single console.error call. — if (!import.meta.env.DEV) {\n    return;\n  }\n  // eslint-disable-next-line\
    \ no-console\n  console.error(\"[report-error]\", {\nThe function has no fetch, XHR or beacon call,\
    \ so no network request is made."
  encoded_at:
  - src/lib/report-error.ts
- node: rules/application-shell/a-request-is-cut-off-after-thirty-seconds
  conforms: true
  how: 'src/lib/http.ts: held at DEFAULT_TIMEOUT_MS (line 44) and buildSignal() (lines 84-97) — export
    const DEFAULT_TIMEOUT_MS = 30_000;

    ...

    timeoutController.abort(new DOMException("Request timed out after 30s", "TimeoutError"));'
  encoded_at:
  - src/lib/http.ts
- node: rules/application-shell/a-request-is-judged-in-a-fixed-order
  conforms: true
  how: 'src/lib/http.ts: held at the sequence in http(): fetch catch (line 135), 401 on first attempt
    (line 164), status >= 500 (line 177), response.json() catch (lines 195-204), then body.ok (line 206)
    — if (response.status === 401 && __retried !== true) {

    ...

    if (response.status >= 500) {

    ...

    body = (await response.json()) as Envelope<T>;

    ...

    if (body.ok === true) {'
  encoded_at:
  - src/lib/http.ts
- node: rules/application-shell/a-row-offers-its-actions
  conforms: true
  how: 'src/components/ds/ConversationMenu/ConversationMenu.tsx: held at the action buttons inside each
    row''s DropdownMenuItem, lines 305-361 — {isArchived ? ( ... handleUnarchive(c.id) ... ArchiveRestore
    ) : ( ... handleArchive(c.id) ... Archive )}

    with the rename button (startRename) and the delete button (requestDelete) rendered for every row'
  encoded_at:
  - src/components/ds/ConversationMenu/ConversationMenu.tsx
- node: rules/application-shell/a-row-shows-its-title-and-archived-mark
  conforms: true
  how: 'src/components/ds/ConversationMenu/ConversationMenu.tsx: held at the per-row derivations and the
    badge, lines 234-239 and 294-303 — const isArchived = c.archivedAt !== null;

    const itemTitle = c.title ?? STRINGS.titleFallback;

    const itemAriaLabel = isArchived ? `${itemTitle} ${STRINGS.archivedSuffix}` : itemTitle;

    {isArchived && (<span aria-hidden="true" ...>{STRINGS.archivedBadge}</span>)}'
  encoded_at:
  - src/components/ds/ConversationMenu/ConversationMenu.tsx
- node: rules/application-shell/a-server-error-is-always-a-failure
  conforms: true
  how: "src/lib/http.ts: held at the status >= 500 branch of http(), lines 177-192, with extractEnvelopeCode\
    \ and extractEnvelopeMessage (lines 221-241). The fallback message is reported as an unstated finding.\
    \ — code: envelopeCode ?? \"SYSTEM_UPSTREAM\",\n    httpStatus: response.status,\n    message:\n \
    \     extractEnvelopeMessage(raw) ?? \"Algo deu errado. Tente novamente.\",\n    details: raw,"
  encoded_at:
  - src/lib/http.ts
- node: rules/application-shell/a-state-badge-has-five-states-with-labels
  conforms: true
  how: "src/components/ds/StateBadge/StateBadge.tsx: held at STATE_LABELS (lines 25-31), STATE_ICONS (lines\
    \ 33-39), the `state` variants of stateBadgeVariants (lines 54-62), and `const resolvedLabel = label\
    \ ?? STATE_LABELS[state];` (line 100) — accepted: \"Aceito\",\nuncertain: \"Incerto\",\n\"low-confidence\"\
    : \"Baixa confiança\",\ndisputed: \"Em disputa\",\nsuperseded: \"Superado\",\n...\nconst resolvedLabel\
    \ = label ?? STATE_LABELS[state];\nsrc/components/ds/StateBadge/StateBadge.types.ts: held at The ConfidenceState\
    \ union (lines 3-8) declares the five states. The label?: string prop of StateBadgeProps (line 21)\
    \ declares the label override. The label texts Aceito, Incerto, Baixa confiança, Em disputa and Superado\
    \ are not in this file; it is a types file and declares only the shape. — export type ConfidenceState\
    \ =\n  | \"accepted\"\n  | \"uncertain\"\n  | \"low-confidence\"\n  | \"disputed\"\n  | \"superseded\"\
    ;\n\nexport interface StateBadgeProps {\n  state: ConfidenceState;\n  ...\n  label?: string;"
  encoded_at:
  - src/components/ds/StateBadge/StateBadge.tsx
  - src/components/ds/StateBadge/StateBadge.types.ts
- node: rules/application-shell/a-state-badge-is-always-named
  conforms: true
  how: 'src/components/ds/StateBadge/StateBadge.tsx: held at the aria-label on the root motion span (line
    152), the icon element (line 164), and the visible-label branch (line 165) — aria-label={`Estado de
    confiança: ${resolvedLabel}`}

    ...

    <IconCmp size={iconSize} aria-hidden="true" />

    {!iconOnly && <span>{resolvedLabel}</span>}'
  encoded_at:
  - src/components/ds/StateBadge/StateBadge.tsx
- node: rules/application-shell/a-streaming-bubble-is-busy
  conforms: true
  how: 'src/components/ds/ChatBubble/ChatBubble.tsx: held at The ariaBusy constant spread onto the root
    div, and StreamingCursorStub rendered after the content only while streaming. — const ariaBusy = streaming
    ? "true" : undefined;

    ...

    {...(ariaBusy !== undefined ? { "aria-busy": ariaBusy } : {})}

    ...

    aria-hidden="true"

    data-testid="streaming-cursor"

    ...

    {streaming ? <StreamingCursorStub /> : null}'
  encoded_at:
  - src/components/ds/ChatBubble/ChatBubble.tsx
- node: rules/application-shell/a-toast-keeps-its-tone
  conforms: true
  how: "src/lib/query-client.ts: held at the \"toast\" and \"toast-and-navigate\" cases of applyErrorAction(),\
    \ lines 20-28 — if (action.tone === \"danger\") toast.error(action.message);\n      else toast.warning(action.message);"
  encoded_at:
  - src/lib/query-client.ts
- node: rules/application-shell/an-answer-below-500-without-json-is-invalid
  conforms: true
  how: "src/lib/http.ts: held at the response.json() catch in http(), lines 194-204 — code: \"SYSTEM_INVALID_RESPONSE\"\
    ,\n      httpStatus: response.status,\n      message: \"Resposta do servidor não é JSON válido.\","
  encoded_at:
  - src/lib/http.ts
- node: rules/application-shell/an-authorization-failure-sends-the-owner-to-sign-in
  conforms: true
  how: "src/lib/error-routing.ts: held at the three AUTH_ cases of routeError, lines 39-42. The action\
    \ and address are chosen here. Clearing the stored token is done by applyErrorAction in query-client.ts,\
    \ not in this file. — case \"AUTH_UNAUTHORIZED\":\ncase \"AUTH_TOKEN_EXPIRED\":\ncase \"AUTH_TOKEN_INVALID\"\
    :\n  return { kind: \"redirect\", to: \"/sign-in?reason=session_expired\" };"
  encoded_at:
  - src/lib/error-routing.ts
- node: rules/application-shell/an-avatar-is-named-by-the-full-name
  conforms: true
  how: 'src/components/ui/avatar/avatar.tsx: held at initials() (lines 5-10) and the aria-label on the
    span in Avatar() (line 39) — const parts = name.trim().split(/\s+/).filter(Boolean);

    if (parts.length === 0) return "?";

    if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();

    return (parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)).toUpperCase();

    ...

    aria-label={name}'
  encoded_at:
  - src/components/ui/avatar/avatar.tsx
- node: rules/application-shell/an-error-message-replaces-other-text
  conforms: true
  how: "src/components/ui/form/form.tsx: held at FormMessage(), lines 118-119 — const body = error ? String(error.message\
    \ ?? \"\") : children;\n  if (!body) return null;"
  encoded_at:
  - src/components/ui/form/form.tsx
- node: rules/application-shell/an-errored-bubble-adds-no-wording
  conforms: true
  how: "src/components/ds/ChatBubble/ChatBubble.tsx: held at The glassAccent constant passed as the accent\
    \ of GlassSurface. The error state adds no text element; the only text elements are the content paragraph\
    \ and the stop notice. — const glassAccent = error ? \"error\" : \"none\";\n...\n<GlassSurface\n \
    \ level=\"modal\"\n  accent={glassAccent}"
  encoded_at:
  - src/components/ds/ChatBubble/ChatBubble.tsx
- node: rules/application-shell/an-ingestion-request-has-no-cutoff
  conforms: true
  how: "src/lib/http.ts: held at the ingest branch of buildSignal(), lines 85-87 — if (opts.ingest ===\
    \ true) {\n    return { signal: opts.signal, cleanup: () => undefined };\n  }"
  encoded_at:
  - src/lib/http.ts
- node: rules/application-shell/an-invalid-field-is-described
  conforms: true
  how: "src/components/ui/form/form.tsx: held at FormControl(), lines 92-95 — aria-describedby={\n   \
    \     error ? `${formDescriptionId} ${formMessageId}` : formDescriptionId\n      }\n      aria-invalid={!!error}"
  encoded_at:
  - src/components/ui/form/form.tsx
- node: rules/application-shell/an-invalid-format-is-a-form-error
  conforms: true
  how: "src/lib/error-routing.ts: held at the VALIDATION_INVALID_FORMAT case of routeError, lines 47-52\
    \ — case \"VALIDATION_INVALID_FORMAT\":\n  return {\n    kind: \"set-error\",\n    message: fallbackMessage\
    \ ?? MSG.validationInvalid,\n    ...(\"details\" in err && err.details !== undefined ? { details:\
    \ err.details } : {}),\n  };\nsrc/lib/query-client.ts: held at the \"set-error\" case of applyErrorAction(),\
    \ lines 41-42. It shows no toast. The message choice, the \"Há campos inválidos no formulário.\" fallback\
    \ and the passing on of details are held in src/lib/error-routing.ts. — case \"set-error\":\n    \
    \  return;"
  encoded_at:
  - src/lib/error-routing.ts
  - src/lib/query-client.ts
- node: rules/application-shell/an-unknown-address-says-page-not-found
  conforms: true
  how: "src/router/__root.tsx: held at notFoundComponent on the root route (line 8), which renders NotFoundFallback\
    \ (lines 27-38). The root route carries no guard and no shell around the fallback. — notFoundComponent:\
    \ NotFoundComponent,\n...\n<h1 className=\"text-lg font-semibold tracking-tight\">Página não encontrada.</h1>\n\
    <p className=\"text-body text-body\">\n  O endereço solicitado não existe ou foi removido.\n</p>\n\
    src/router/routes.tsx: held at notFoundRoute (lines 165-175) shows the required title and hint for\
    \ the not-found address. The fallback for an address that matches no route, which must render without\
    \ guard or shell, is not in this file. — title=\"Página não encontrada.\"\nhint=\"O endereço solicitado\
    \ não existe ou foi removido.\"\ntestId=\"not-found-page\""
  encoded_at:
  - src/router/__root.tsx
  - src/router/routes.tsx
- node: rules/application-shell/any-other-code-shows-a-danger-toast
  conforms: true
  how: 'src/lib/error-routing.ts: held at the last return of the default case, line 81 — return { kind:
    "toast", tone: "danger", message: fallbackMessage ?? MSG.system };'
  encoded_at:
  - src/lib/error-routing.ts
- node: rules/application-shell/any-other-system-failure-hides-its-message
  conforms: true
  how: "src/lib/error-routing.ts: held at the SYSTEM_ prefix branch in the default case, lines 78-80 —\
    \ if (code.startsWith(\"SYSTEM_\")) {\n  return { kind: \"toast\", tone: \"danger\", message: MSG.system\
    \ };\n}"
  encoded_at:
  - src/lib/error-routing.ts
- node: rules/application-shell/archive-and-reactivate-need-no-confirmation
  conforms: true
  how: 'src/components/ds/ConversationMenu/ConversationMenu.tsx: held at handleArchive() and handleUnarchive(),
    lines 118-126 — function handleArchive(id: string): void { onArchive(id); setOpen(false); }

    function handleUnarchive(id: string): void { onUnarchive(id); setOpen(false); }'
  encoded_at:
  - src/components/ds/ConversationMenu/ConversationMenu.tsx
- node: rules/application-shell/archived-conversations-are-opt-in
  conforms: true
  how: 'src/components/ds/ConversationMenu/ConversationMenu.tsx: held at the Switch row at the foot of
    the DropdownMenuContent, lines 369-386; the default is the includeArchived = false prop default (line
    59) — <Switch id="conversation-menu-include-archived" checked={includeArchived} onChange={onIncludeArchivedChange}
    ... />

    with the label {STRINGS.showArchived} ("Mostrar arquivadas")

    The component keeps no state of its own for the value.'
  encoded_at:
  - src/components/ds/ConversationMenu/ConversationMenu.tsx
- node: rules/application-shell/archiving-stamps-the-browser-clock
  conforms: true
  how: "src/shell/HeaderConversationMenu.tsx: held at The onArchive handler (lines 59-70). — updateMutation.mutate(\n\
    \          { id, archivedAt: new Date().toISOString() },\n          {\n            onSuccess: () =>\
    \ {\n              if (id === activeConversationId) {\n                void navigate({ to: \"/chat\"\
    , search: {} });"
  encoded_at:
  - src/shell/HeaderConversationMenu.tsx
- node: rules/application-shell/as-of-starts-at-today
  conforms: true
  how: "src/shell/Footer.tsx: held at formatAsOf(), lines 26-28, and the trigger label at line 62. The\
    \ initial empty value comes from useAsOfStore, which is declared in another file, so this file only\
    \ reads and renders it. — function formatAsOf(asOf: Date | null): string {\n  return asOf ? asOf.toLocaleDateString(\"\
    pt-BR\") : \"hoje\";\n}\n... <Clock className=\"size-3\" aria-hidden=\"true\" /> Como em: {formatAsOf(asOf)}"
  encoded_at:
  - src/shell/Footer.tsx
- node: rules/application-shell/chat-and-curation-keep-one-search-key
  conforms: true
  how: 'src/router/routes.tsx: held at validateSearch of chatRoute (lines 59-65) and curationRoute (lines
    135-141) — if (typeof raw === "string" && raw.length > 0) { return { conversation: raw }; }

    return {};

    if (typeof raw === "string" && raw.length > 0) { return { item: raw }; }'
  encoded_at:
  - src/router/routes.tsx
- node: rules/application-shell/choosing-a-destination-closes-the-palette-first
  conforms: true
  how: "src/shell/CommandPalette.tsx: held at the run() function and its use in the onSelect of each CommandItem,\
    \ lines 45-48 and 60 — function run(action: () => void) {\n    setOpen(false);\n    action();\n  }\n\
    ...\nonSelect={() => run(() => void navigate({ to: a.to }))}"
  encoded_at:
  - src/shell/CommandPalette.tsx
- node: rules/application-shell/choosing-a-row-selects-it
  conforms: true
  how: 'src/components/ds/ConversationMenu/ConversationMenu.tsx: held at handleSelect() and the row''s
    DropdownMenuItem onSelect, lines 91-94 and 284 — function handleSelect(id: string): void { onSelect(id);
    setOpen(false); }

    onSelect={() => handleSelect(c.id)}'
  encoded_at:
  - src/components/ds/ConversationMenu/ConversationMenu.tsx
- node: rules/application-shell/choosing-or-creating-a-conversation-opens-it
  conforms: true
  how: "src/shell/HeaderConversationMenu.tsx: held at The onSelect handler (lines 43-45) and the onCreate\
    \ handler (lines 46-55). — void navigate({ to: \"/chat\", search: { conversation: id } });\n...\n\
    createMutation.mutate(undefined, {\n          onSuccess: (created) => {\n            void navigate({\n\
    \              to: \"/chat\",\n              search: { conversation: created.id },"
  encoded_at:
  - src/shell/HeaderConversationMenu.tsx
- node: rules/application-shell/clearing-the-token-forgets-it
  conforms: true
  how: "src/state/auth.ts: held at the `clear` action of the `useAuthStore` creator (lines 74-77), calling\
    \ `writeToken(null)` (lines 56-63) — clear: () => {\n      writeToken(null);\n      set({ accessToken:\
    \ null, claims: null });\n    },\n... if (token === null) sessionStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);"
  encoded_at:
  - src/state/auth.ts
- node: rules/application-shell/client-needs-two-urls
  conforms: true
  how: "src/lib/env.ts: held at EnvSchema (lines 3-6) and the object built in getEnv() (lines 28-31) —\
    \ const EnvSchema = z.object({\n  VITE_BFF_URL: z.url(\"VITE_BFF_URL must be a valid URL\"),\n  VITE_NEON_AUTH_URL:\
    \ z.url(\"VITE_NEON_AUTH_URL must be a valid URL\"),\n});\n...\nconst parsed = EnvSchema.safeParse({\n\
    \  VITE_BFF_URL: source.VITE_BFF_URL,\n  VITE_NEON_AUTH_URL: source.VITE_NEON_AUTH_URL,\n});"
  encoded_at:
  - src/lib/env.ts
- node: rules/application-shell/deleting-asks-first
  conforms: true
  how: 'src/components/ds/ConversationMenu/ConversationMenu.tsx: held at requestDelete() and the Dialog,
    lines 128-131 and 390-406 — function requestDelete(id: string): void { setOpen(false); setDeletingId(id);
    }

    <Dialog open={deletingId !== null} ...>

    <DialogTitle>{STRINGS.deleteTitle}</DialogTitle>

    with deleteTitle: "Excluir conversa"'
  encoded_at:
  - src/components/ds/ConversationMenu/ConversationMenu.tsx
- node: rules/application-shell/deleting-the-active-conversation-leaves-it
  conforms: true
  how: "src/shell/HeaderConversationMenu.tsx: held at The onDelete handler (lines 74-85). — deleteMutation.mutate(\n\
    \          { id },\n          {\n            onSuccess: () => {\n              if (id === activeConversationId)\
    \ {\n                void navigate({ to: \"/chat\", search: {} });"
  encoded_at:
  - src/shell/HeaderConversationMenu.tsx
- node: rules/application-shell/every-failure-goes-to-the-router
  conforms: true
  how: "src/lib/query-client.ts: held at the QueryCache and MutationCache onError handlers in createQueryClient(),\
    \ lines 78-97 — if (err instanceof EnvelopeError) {\n          applyErrorAction(routeError(err, contextFromQuery(query)));\n\
    \          return;\n        }\n        reportError(err);\n        toast.error(\"Algo deu errado. Tente\
    \ novamente.\");"
  encoded_at:
  - src/lib/query-client.ts
- node: rules/application-shell/every-other-address-is-guarded
  conforms: true
  how: 'src/router/routes.tsx: held at protectedLayoutRoute and ProtectedLayout (lines 25-46), parent
    of every route except signInRoute — <AppShell><Outlet /></AppShell>

    getParentRoute: () => protectedLayoutRoute,'
  encoded_at:
  - src/router/routes.tsx
- node: rules/application-shell/failure-routing-lives-in-one-function
  conforms: true
  how: "src/lib/error-routing.ts: held at routeError, lines 31-83: exact codes in the switch cases, then\
    \ the BUSINESS_ prefix check, then the SYSTEM_ prefix check, in the default case — switch (code) {\
    \ case \"AUTH_UNAUTHORIZED\": ... default:\n  if (code.startsWith(\"BUSINESS_\")) { ... }\n  if (code.startsWith(\"\
    SYSTEM_\")) { ... }"
  encoded_at:
  - src/lib/error-routing.ts
- node: rules/application-shell/health-and-pending-are-asked-every-twenty-seconds
  conforms: true
  how: 'src/shell/api/use-shell-status.ts: held at REFETCH_MS (line 6) and the options of both useQuery
    calls (lines 17-22 and 30-36) — const REFETCH_MS = 20_000;

    refetchInterval: REFETCH_MS,

    retry: false,

    queryFn: () => getJson("/health"),'
  encoded_at:
  - src/shell/api/use-shell-status.ts
- node: rules/application-shell/health-is-judged-by-the-database-field
  conforms: true
  how: 'src/shell/api/use-shell-status.ts: held at the return statements of useHealth(), lines 23-25 —
    if (q.data == null) return "checking";

    return (d.database ?? d.result?.database) === "ok" ? "ok" : "down";'
  encoded_at:
  - src/shell/api/use-shell-status.ts
- node: rules/application-shell/invalid-configuration-stops-the-client
  conforms: true
  how: "src/lib/env.ts: held at the failure branch of getEnv(), lines 33-37, and the EnvInvalidError constructor,\
    \ lines 14-20 — if (!parsed.success) {\n  console.error(\"[env] Frontend env validation failed:\"\
    , parsed.error.issues);\n  throw new EnvInvalidError(parsed.error.issues);\n}\n...\n\"Frontend env\
    \ invalid — fix VITE_BFF_URL / VITE_NEON_AUTH_URL: \" +\n  issues.map((i) => `${i.path.join(\".\"\
    ) || \"(root)\"}: ${i.message}`).join(\"; \"),"
  encoded_at:
  - src/lib/env.ts
- node: rules/application-shell/leaving-a-rename-sends-nothing
  conforms: true
  how: 'src/components/ds/ConversationMenu/ConversationMenu.tsx: held at cancelRename(), the Escape branch
    of onRenameKeyDown() and the close effect, lines 113-116, 151-154 and 157-164 — else if (e.key ===
    "Escape") { e.preventDefault(); cancelRename(); }

    onClick={cancelRename}

    if (wasOpenRef.current && !open && renamingId !== null) { setRenamingId(null); setRenameDraft("");
    }'
  encoded_at:
  - src/components/ds/ConversationMenu/ConversationMenu.tsx
- node: rules/application-shell/one-client-serves-reads-and-writes
  conforms: true
  how: 'src/lib/query-client.ts: held at the module-level constant on line 101. One QueryClient serves
    reads and writes and is created once when the module loads. — export const queryClient: QueryClient
    = createQueryClient();'
  encoded_at:
  - src/lib/query-client.ts
- node: rules/application-shell/only-a-cancelled-reply-shows-a-notice
  conforms: true
  how: "src/components/ds/ChatBubble/ChatBubble.tsx: held at The STOP_NOTICE_BY_REASON table, the stopNotice\
    \ lookup, and the conditional stop-notice paragraph below the bubble. — const STOP_NOTICE_BY_REASON:\
    \ Readonly<Record<string, string>> = {\n  cancelled: \"Resposta interrompida\",\n};\n...\nconst stopNotice\
    \ =\n  stopReason !== undefined ? STOP_NOTICE_BY_REASON[stopReason] : undefined;\n...\n{stopNotice\
    \ !== undefined ? (\n  <p\n    data-testid=\"stop-notice\""
  encoded_at:
  - src/components/ds/ChatBubble/ChatBubble.tsx
- node: rules/application-shell/only-ok-true-returns-the-result
  conforms: true
  how: "src/lib/http.ts: held at lines 206-216 — if (body.ok === true) {\n    return body.result as T;\n\
    \  }\n...\nthrow new EnvelopeError({"
  encoded_at:
  - src/lib/http.ts
- node: rules/application-shell/only-the-confirmation-deletes
  conforms: true
  how: 'src/components/ds/ConversationMenu/ConversationMenu.tsx: held at confirmDelete(), cancelDelete()
    and the Dialog''s onOpenChange, lines 133-142 and 390-394 — function confirmDelete(): void { if (deletingId
    !== null) onDelete(deletingId); setDeletingId(null); ... }

    function cancelDelete(): void { setDeletingId(null); ... }

    onOpenChange={(o) => { if (!o) cancelDelete(); }}'
  encoded_at:
  - src/components/ds/ConversationMenu/ConversationMenu.tsx
- node: rules/application-shell/renaming-and-reactivating-stay-where-they-are
  conforms: true
  how: 'src/shell/HeaderConversationMenu.tsx: held at The onRename handler (lines 56-58) and the onUnarchive
    handler (lines 71-73). Neither calls navigate. — updateMutation.mutate({ id, title: newTitle });

    ...

    updateMutation.mutate({ id, archivedAt: null });'
  encoded_at:
  - src/shell/HeaderConversationMenu.tsx
- node: rules/application-shell/renaming-opens-a-field-with-the-title
  conforms: true
  how: 'src/components/ds/ConversationMenu/ConversationMenu.tsx: held at startRename() and the renamingId
    branch of the row map, lines 101-104 and 241-278 — function startRename(id: string, currentTitle:
    string | null): void { setRenamingId(id); setRenameDraft(currentTitle ?? ""); }

    if (renamingId === c.id) { return (<div ...><Input autoFocus value={renameDraft} ... />'
  encoded_at:
  - src/components/ds/ConversationMenu/ConversationMenu.tsx
- node: rules/application-shell/setting-a-token-decodes-its-claims
  conforms: true
  how: "src/state/auth.ts: held at `decodeJwtClaims` (lines 23-45) and the `setToken` action (lines 70-73)\
    \ — const parts = token.split(\".\");\n    if (parts.length !== 3) return null;\n... if (typeof parsed[\"\
    sub\"] === \"string\") (claims as { sub?: string }).sub = parsed[\"sub\"] as string;\nif (typeof parsed[\"\
    exp\"] === \"number\") ...\nif (typeof parsed[\"name\"] === \"string\") ...\nif (typeof parsed[\"\
    email\"] === \"string\") ...\n... setToken: (token) => { writeToken(token); set({ accessToken: token,\
    \ claims: token !== null ? decodeJwtClaims(token) : null }); }"
  encoded_at:
  - src/state/auth.ts
- node: rules/application-shell/sign-in-hands-the-attempt-to-its-panel
  conforms: true
  how: "src/router/SignInPage.tsx: held at the JSX returned by SignInPage, lines 19-26, with the destructuring\
    \ of useSignIn() at line 16 — const { signIn, isLoading, error } = useSignIn();\n<SignInPanel\n  onSubmit={signIn}\n\
    \  isSubmitting={isLoading}\n  error={error}"
  encoded_at:
  - src/router/SignInPage.tsx
- node: rules/application-shell/sign-in-shows-the-expiry-notice-for-its-reason
  conforms: false
  how: 'the fact left part of its ground: still held in src/router/SignInPage.tsx, and src/router/routes.tsx
    read `nowhere` — This file only mounts `component: () => <SignInPage />` and declares no search handling
    for `reason`. The notice is read in SignInPage, which is outside this file. — a binding asserts the
    file answers for the node, so the pair that stopped holding it is released by `--bind ... --replace`,
    never restamped here'
  observed_at:
  - src/router/SignInPage.tsx
  - src/router/routes.tsx
- node: rules/application-shell/sign-in-sits-outside-the-guarded-shell
  conforms: true
  how: "src/router/routes.tsx: held at signInRoute with RootRoute as parent (lines 83-85, 178) — export\
    \ const signInRoute = createRoute({\n  getParentRoute: () => RootRoute,\n  path: \"/sign-in\","
  encoded_at:
  - src/router/routes.tsx
- node: rules/application-shell/some-addresses-show-only-a-placeholder
  conforms: true
  how: 'src/router/StubPage.tsx: held at the default of the `hint` parameter in StubPage (line 11), rendered
    in the `<p>` on line 20. The titles Grafo, Busca and Histórico are not held in this file: `title`
    is a prop supplied by the caller. — hint = "Conteúdo em breve.",

    ...

    <h1 className="text-lg font-semibold tracking-tight">{title}</h1>

    <p className="text-body text-body">{hint}</p>

    src/router/routes.tsx: held at graphRoute, searchRoute and historyRoute (lines 100-110, 159-163) set
    the titles. The line "Conteúdo em breve." is rendered by StubPage, outside this file. — <StubPage
    title="Grafo" testId="graph-page" />

    <StubPage title="Busca" testId="search-page" />

    <StubPage title="Histórico" testId="history-page" />'
  encoded_at:
  - src/router/StubPage.tsx
  - src/router/routes.tsx
- node: rules/application-shell/the-active-ingestion-segment-is-never-shown
  conforms: true
  how: "src/shell/Footer.tsx: held at the activeRun prop and its conditional Link, lines 16, 34 and 100-107.\
    \ The prop defaults to null, so the segment does not render unless a caller supplies a run. When it\
    \ does render, it links to the history address. — activeRun = null,\n...\n{activeRun && (\n      \
    \  <Link\n          to=\"/history\"\nsrc/shell/api/use-shell-status.ts: held at useActiveRun(), lines\
    \ 41-43 — export function useActiveRun(): { label: string } | null {\n  return null;\n}"
  encoded_at:
  - src/shell/Footer.tsx
  - src/shell/api/use-shell-status.ts
- node: rules/application-shell/the-active-row-is-only-highlighted
  conforms: true
  how: 'src/components/ds/ConversationMenu/ConversationMenu.tsx: held at the className and aria-label
    of the row''s DropdownMenuItem, lines 285-292 — aria-label={itemAriaLabel}

    className={cn("min-h-10 gap-sm", isActive && "bg-elevated")}

    data-active={isActive || undefined}'
  encoded_at:
  - src/components/ds/ConversationMenu/ConversationMenu.tsx
- node: rules/application-shell/the-backdrop-is-decoration
  conforms: true
  how: "src/shell/AmbientBackdrop.tsx: held at The root element of the returned JSX (aria-hidden=\"true\"\
    , line 33) and the img element (alt=\"\", line 40). — <div\n      aria-hidden=\"true\"\n      className=\"\
    fixed inset-0 z-backdrop overflow-hidden bg-background\"\n      data-testid=\"ambient-backdrop\"\n\
    \    >\n      {src !== \"\" && (\n        <img\n          src={src}\n          alt=\"\"\n        \
    \  role=\"presentation\""
  encoded_at:
  - src/shell/AmbientBackdrop.tsx
- node: rules/application-shell/the-conversation-menu-shows-on-chat-only
  conforms: true
  how: "src/shell/Header.tsx: held at the onChatRoute test (line 42) gating HeaderConversationMenu (lines\
    \ 85-90). The only actions in the right-hand cluster are ThemeSelect and the palette toggle Button\
    \ (lines 92-104). — const onChatRoute = pathname === \"/chat\" || pathname.startsWith(\"/chat/\");\n\
    {onChatRoute ? (\n        <HeaderConversationMenu"
  encoded_at:
  - src/shell/Header.tsx
- node: rules/application-shell/the-cutoff-ends-with-the-headers
  conforms: true
  how: "src/lib/http.ts: held at cleanup() in the fetch catch and straight after fetch resolves, lines\
    \ 138 and 162. The body is read at lines 180 and 196 under no timer. — cleanup: () => clearTimeout(timer),\n\
    ...\ncleanup();\n\n  if (response.status === 401 && __retried !== true) {"
  encoded_at:
  - src/lib/http.ts
- node: rules/application-shell/the-first-entry-creates-a-conversation
  conforms: true
  how: 'src/components/ds/ConversationMenu/ConversationMenu.tsx: held at handleCreate() and the first
    DropdownMenuItem, lines 96-99 and 205-212 — function handleCreate(): void { onCreate(); setOpen(false);
    }

    <DropdownMenuItem onSelect={handleCreate} ...> <span>{STRINGS.newConversation}</span>

    onCreate is called with no argument.'
  encoded_at:
  - src/components/ds/ConversationMenu/ConversationMenu.tsx
- node: rules/application-shell/the-first-signal-aborts-the-request
  conforms: true
  how: 'src/lib/http.ts: held at composeSignals() (lines 67-82), used by buildSignal() at line 92 — const
    signal = composeSignals([timeoutController.signal, opts.signal]);

    ...

    if (typeof anyFn === "function") return anyFn(real);'
  encoded_at:
  - src/lib/http.ts
- node: rules/application-shell/the-first-valid-configuration-is-kept
  conforms: true
  how: 'src/lib/env.ts: held at the module-level cache and the guard and assignment in getEnv(), lines
    23-26 and 39-40 — let cached: Env | null = null;

    ...

    if (cached !== null) return cached;

    ...

    cached = Object.freeze(parsed.data);

    return cached;'
  encoded_at:
  - src/lib/env.ts
- node: rules/application-shell/the-footer-shows-one-of-three-health-states
  conforms: true
  how: "src/shell/Footer.tsx: held at the HealthStatus type, the HEALTH table and the health = \"checking\"\
    \ default, lines 10, 19-24 and 32. — ok: { dot: \"bg-state-accepted\", label: \"online\" },\n    down:\
    \ { dot: \"bg-destructive\", label: \"banco inacessível\" },\n    checking: { dot: \"bg-muted-foreground\"\
    , label: \"verificando…\" },\n...\nhealth = \"checking\","
  encoded_at:
  - src/shell/Footer.tsx
- node: rules/application-shell/the-footer-shows-pending-curation
  conforms: true
  how: "src/shell/Footer.tsx: held at the conditional Link at lines 91-98. It renders only when the total\
    \ is above 0, links to /curation, and prints the number followed by \"pendentes\". — {curationPending\
    \ > 0 && (\n        <Link\n          to=\"/curation\"\n...\n          <Scale className=\"size-3\"\
    \ aria-hidden=\"true\" /> {curationPending} pendentes"
  encoded_at:
  - src/shell/Footer.tsx
- node: rules/application-shell/the-guard-needs-a-fresh-token
  conforms: true
  how: 'src/router/routes.tsx: held at protectedLayoutRoute beforeLoad (lines 36-44) — const fresh = useAuthStore.getState().isFresh();

    if (!fresh) { throw redirect({ to: "/sign-in", search: { reason: "session_expired" } }); }'
  encoded_at:
  - src/router/routes.tsx
- node: rules/application-shell/the-header-lists-six-areas
  conforms: true
  how: "src/shell/Header.tsx: held at the NAV array (lines 23-30) in the specified order, and the active\
    \ computation with aria-current (lines 64-70) — const active =\n            pathname === item.to ||\
    \ pathname.startsWith(`${item.to}/`);\naria-current={active ? \"page\" : undefined}"
  encoded_at:
  - src/shell/Header.tsx
- node: rules/application-shell/the-header-menu-lists-without-archived-by-default
  conforms: true
  how: "src/shell/HeaderConversationMenu.tsx: held at The includeArchived state (line 21), the list query\
    \ (line 23) and the activeTitle derivation (lines 29-31). — const [includeArchived, setIncludeArchived]\
    \ = useState(false);\n\n  const listQuery = useListConversations({ includeArchived });\n...\nconst\
    \ activeTitle =\n    conversations.find((c) => c.id === activeConversationId)?.title ?? null;"
  encoded_at:
  - src/shell/HeaderConversationMenu.tsx
- node: rules/application-shell/the-menu-lists-as-received
  conforms: true
  how: 'src/components/ds/ConversationMenu/ConversationMenu.tsx: held at the list branch inside DropdownMenuContent,
    lines 216-365 — {isLoading && conversations.length === 0 ? (<div ... data-testid="conversation-menu-skeleton">
    ...) : conversations.length === 0 ? (<div ...>{STRINGS.empty}</div>) : (conversations.map((c) => {

    with empty: "Nenhuma conversa ainda"; there is no sort, filter or slice'
  encoded_at:
  - src/components/ds/ConversationMenu/ConversationMenu.tsx
- node: rules/application-shell/the-menu-trigger-names-the-active-conversation
  conforms: true
  how: 'src/components/ds/ConversationMenu/ConversationMenu.tsx: held at triggerLabel and triggerAriaLabel,
    lines 84-89 — const triggerLabel = activeConversationId === null ? STRINGS.triggerFallback : (activeTitle
    ?? STRINGS.titleFallback);

    const triggerAriaLabel = `Conversas — ${activeTitle ?? STRINGS.triggerFallback}`;'
  encoded_at:
  - src/components/ds/ConversationMenu/ConversationMenu.tsx
- node: rules/application-shell/the-owner-picks-the-as-of-date
  conforms: true
  how: "src/shell/Footer.tsx: held at the Popover at lines 56-88. It has the title \"Recorte temporal\"\
    \ and a date Input with no min or max. Emptying the input calls setAsOf(null), and the \"Voltar para\
    \ hoje\" button does the same. — <p className=\"text-xs font-medium font-semibold text-foreground\"\
    >Recorte temporal</p>\n...\n<Input\n          type=\"date\"\n          aria-label=\"Data do recorte\"\
    \n...\nsetAsOf(e.target.value ? new Date(e.target.value) : null)\n...\nonClick={() => setAsOf(null)}\n\
    >\n          Voltar para hoje"
  encoded_at:
  - src/shell/Footer.tsx
- node: rules/application-shell/the-palette-lives-inside-the-shell
  conforms: false
  how: 'no named file holds this fact now: src/router/routes.tsx read `nowhere` — This file mounts `<AppShell>`
    only inside ProtectedLayout and references no palette or shortcut. The palette mounting sits in AppShell,
    outside this file.'
  observed_at:
  - src/router/routes.tsx
- node: rules/application-shell/the-palette-offers-five-destinations
  conforms: true
  how: "src/shell/CommandPalette.tsx: held at the AREAS table and the CommandGroup and CommandEmpty in\
    \ the render, lines 20-26 and 54-66 — <CommandEmpty>Nada encontrado.</CommandEmpty>\n  <CommandGroup\
    \ heading=\"Ir para\">\n    {AREAS.map((a) => (\n      <CommandItem\n        key={a.to}\n        value={a.label}"
  encoded_at:
  - src/shell/CommandPalette.tsx
- node: rules/application-shell/the-palette-starts-closed-in-memory
  conforms: true
  how: "src/state/command-palette.ts: held at the `useCommandPaletteStore` initializer, line 9-13: `open:\
    \ false` as the initial state, in a plain zustand `create` store with no persistence middleware. —\
    \ export const useCommandPaletteStore = create<CommandPaletteState>((set, get) => ({\n  open: false,\n\
    \  setOpen: (open) => set({ open }),\n  toggle: () => set({ open: !get().open }),\n}));"
  encoded_at:
  - src/state/command-palette.ts
- node: rules/application-shell/the-pending-total-needs-a-token
  conforms: true
  how: 'src/shell/api/use-shell-status.ts: held at useCurationCount(), lines 28-39 — const token = useAuthStore((s)
    => s.accessToken);

    queryFn: () => getJson("/api/v1/curation/queue?limit=1", token),

    enabled: token != null,

    return d?.total ?? d?.result?.total ?? 0;'
  encoded_at:
  - src/shell/api/use-shell-status.ts
- node: rules/application-shell/the-root-address-leads-to-chat
  conforms: true
  how: 'src/router/routes.tsx: held at indexRoute (lines 48-54), a child of protectedLayoutRoute, so it
    runs after the freshness guard — getParentRoute: () => protectedLayoutRoute,

    path: "/",

    beforeLoad: () => { throw redirect({ to: "/chat" }); },'
  encoded_at:
  - src/router/routes.tsx
- node: rules/application-shell/the-shell-regions-have-names
  conforms: true
  how: "src/shell/Footer.tsx: held at the footer part only, lines 43-44 and 72. The contentinfo is named\
    \ \"Rodapé\" and the date input is named \"Data do recorte\". The header banner, navigation, palette\
    \ toggle and theme choice are not in this file. — role=\"contentinfo\"\n      aria-label=\"Rodapé\"\
    \n...\naria-label=\"Data do recorte\"\nsrc/shell/Header.tsx: held at the header names in this file:\
    \ the banner \"Cabeçalho\" (line 49), the navigation \"Áreas\" (line 62) and the palette toggle \"\
    Abrir paleta de comandos (⌘K)\" (line 98). The theme choice \"Tema\" is named in ThemeSelect, not\
    \ in this file. The footer's contentinfo \"Rodapé\" and \"Data do recorte\" are outside this file.\
    \ — aria-label=\"Cabeçalho\"\n<nav aria-label=\"Áreas\"\naria-label=\"Abrir paleta de comandos (⌘K)\""
  encoded_at:
  - src/shell/Footer.tsx
  - src/shell/Header.tsx
- node: rules/application-shell/the-shortcut-toggles-the-palette
  conforms: true
  how: "src/shell/CommandPalette.tsx: held at the useEffect keydown listener on window, lines 34-43 —\
    \ if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === \"k\") {\n      e.preventDefault();\n  \
    \    toggle();\n    }\n  }\n  window.addEventListener(\"keydown\", onKey);"
  encoded_at:
  - src/shell/CommandPalette.tsx
- node: rules/application-shell/the-token-is-mirrored-to-session-storage
  conforms: true
  how: 'src/state/auth.ts: held at `AUTH_TOKEN_STORAGE_KEY` (line 19), `readInitialToken` (lines 47-54),
    `writeToken` (lines 56-63), and the initial state read once in the `useAuthStore` creator (lines 65-69)
    — export const AUTH_TOKEN_STORAGE_KEY = "remember.auth.token";

    ... const initialToken = readInitialToken();

    ... try { if (token === null) sessionStorage.removeItem(AUTH_TOKEN_STORAGE_KEY); else sessionStorage.setItem(AUTH_TOKEN_STORAGE_KEY,
    token); } catch { }'
  encoded_at:
  - src/state/auth.ts
- node: rules/application-shell/the-trigger-is-off-while-loading
  conforms: true
  how: 'src/components/ds/ConversationMenu/ConversationMenu.tsx: held at the trigger Button, lines 170-196
    — disabled={isLoading}

    {isLoading ? (<Loader2 className="size-4 shrink-0 animate-spin ..." data-testid="conversation-menu-spinner"
    />) : (<ChevronDown ... />)}'
  encoded_at:
  - src/components/ds/ConversationMenu/ConversationMenu.tsx
- node: rules/application-shell/transport-failures-read-their-wording
  conforms: true
  how: 'src/lib/http.ts: held at the message fields of the throws at lines 143, 151, 158, 201 and 214
    — message: "Tempo limite excedido na requisição.",

    message: "Requisição cancelada.",

    message: "Falha de rede ao contactar o servidor.",

    message: "Resposta do servidor não é JSON válido.",

    message: error?.message ?? "Erro desconhecido do servidor.",'
  encoded_at:
  - src/lib/http.ts
unstated:
- file: src/components/ds/ConversationMenu/ConversationMenu.tsx
  where: STRINGS.deleteBody, rendered in the delete dialog's DialogDescription (lines 49 and 403-405)
  evidence: "deleteBody: \"Tem certeza? Esta ação não pode ser desfeita.\",\n...\n<DialogDescription id=\"\
    conversation-menu-delete-desc\">\n  {STRINGS.deleteBody}\n</DialogDescription>"
  cost: The dialog tells the owner that deleting a conversation is irreversible. No node holds that claim.
    deleting-asks-first holds only the dialog's title, and only-the-confirmation-deletes holds who sends
    the delete. The statement about what deletion does therefore lives only in this file. The next reader
    looks for it in the specification and does not find it. If deletion semantics change, nothing flags
    this text.
- file: src/components/ds/ConversationMenu/ConversationMenu.tsx
  where: the STRINGS vocabulary for the row actions, the rename field and the dialog buttons (lines 39-51),
    and the aria-labels built from it (lines 246, 255, 313, 327, 341, 355)
  evidence: 'rename: "Renomear",

    archive: "Arquivar",

    delete: "Excluir",

    confirmRename: "Confirmar renomeação",

    cancelRename: "Cancelar renomeação",

    deleteCancel: "Cancelar",

    deleteConfirm: "Confirmar",

    ...

    aria-label={`Renomeando ${itemTitle}`}

    aria-label={`Novo título para ${itemTitle}`}'
  cost: The rules require rename, archive, reactivate, delete, confirm and cancel controls but name none
    of their labels, except that deleting-asks-first names the dialog title "Excluir conversa". The words
    the owner and assistive technology hear for these controls are decided only here. A relabelling or
    a translation has no node to answer to.
- file: src/components/ds/GraphNode/GraphNode.tsx
  where: NODE_STYLE, lines 26-37 (the `label` of each of the ten entries)
  evidence: 'person: { icon: User, label: "Pessoa", color: "text-node-person" },

    organization: { icon: Building2, label: "Organização", color: "text-node-organization" },

    project: { icon: Rocket, label: "Projeto", color: "text-node-project" },

    event: { icon: CalendarClock, label: "Evento", color: "text-node-event" },

    role: { icon: IdCard, label: "Papel", color: "text-node-role" },

    category: { icon: Tag, label: "Categoria", color: "text-node-category" },

    concept: { icon: Lightbulb, label: "Conceito", color: "text-node-concept" },

    location: { icon: MapPin, label: "Local", color: "text-node-location" },

    document: { icon: FileText, label: "Documento", color: "text-node-document" },

    task: { icon: SquareCheck, label: "Tarefa", color: "text-node-task" },'
  cost: The node says each type has "a fixed pt-BR name" but does not state the ten names. The only place
    they are written is this table, so the code is where the business wording lives, and the next reader
    who looks in the specification for what a Role or a Location node is called will not find it. The
    catalog node (rules/knowledge-base/catalog-node-types) holds the types and their English descriptions,
    not these display names.
- file: src/components/ds/StateBadge/StateBadge.tsx
  where: decideTransition() (lines 75-86) and the animation selection in StateBadge (lines 122-146)
  evidence: "if (dataTransitionAttr === \"merge\") return \"merge\";\nif (prev === \"uncertain\" && next\
    \ === \"accepted\") return \"promote\";\nif (next === \"superseded\") return \"supersede\";\n...\n\
    } else if (state === \"uncertain\" && motionAllowed) {\n  variants = pulseUncertain(false);\n  animateProp\
    \ = \"visible\";"
  cost: 'The code decides which confidence-state changes the badge animates: uncertain to accepted is
    a promotion, any change into superseded is a supersession, a merge is signalled by a data attribute,
    and an uncertain badge pulses continuously. It also decides that reduced motion switches all of this
    off. No node in the specification holds any of it. Only the two badge nodes (five labelled states,
    always named) bind this file, and neither mentions motion or transitions. The next reader looks in
    the specification for which state changes the badge marks, finds nothing, and the code becomes the
    only place that decision lives.'
- file: src/lib/http.ts
  where: the status >= 500 branch of http(), lines 177-192, the fallback message passed to EnvelopeError
  evidence: "message:\n        extractEnvelopeMessage(raw) ?? \"Algo deu errado. Tente novamente.\","
  cost: When a 5xx body carries no readable message, this helper tells the owner "Algo deu errado. Tente
    novamente.". The only node in this file's set about a 5xx answer, a-server-error-is-always-a-failure,
    gives the code (SYSTEM_UPSTREAM) but states no fallback message. The same wording is held only in
    the contracts of other request helpers (contracts/curation-workspace/bff-curation, for example). The
    next reader of this helper's 5xx contract will not find the wording in the rule that governs it, and
    the code is the only place it is stated for this helper.
- file: src/router/routes.tsx
  where: the path declarations of graphRoute, searchRoute, ingestRoute, historyRoute and notFoundRoute
    (lines 102, 108, 114, 161, 167)
  evidence: 'path: "/graph",

    path: "/search",

    path: "/ingest",

    path: "/history",

    path: "/not-found",'
  cost: The literal addresses for the graph, search, ingest, history and not-found areas are decided only
    in this file. The rules name them as "the graph, search and history addresses" and "the not-found
    address" and never state the path. The next reader looks for these paths in the specification and
    does not find them. Other nodes do state `/chat`, `/curation` and `/sign-in`, so these five are the
    ones left to the code.
- file: src/shell/CommandPalette.tsx
  where: line 52, the placeholder prop of CommandInput
  evidence: <CommandInput placeholder="Buscar áreas e ações…" />
  cost: The palette's search-field wording is shown to the owner on every opening, and no node holds it.
    The palette node fixes only the group label, the destination labels and the empty reading "Nada encontrado.".
    The next reader who looks in the specification for what the field says will not find it, and the text
    can change with no node moving. The text also promises "ações", although the node offers one group
    of five destinations and no actions.
- file: src/shell/CommandPalette.tsx
  where: lines 20-26, the AREAS table, the `to` member of each entry
  evidence: "{ to: \"/graph\", label: \"Grafo\", icon: Network },\n  { to: \"/search\", label: \"Buscar\"\
    , icon: Search },\n  { to: \"/ingest\", label: \"Ingerir\", icon: Upload },\n  { to: \"/curation\"\
    , label: \"Curar\", icon: Scale },\n  { to: \"/history\", label: \"Histórico\", icon: History },"
  cost: Which address each destination leads to is decided only in this table. The node names the five
    destinations by label and order and never says where they lead. The addresses are also declared in
    src/router/routes.tsx. Moving or renaming an address there leaves this table unreached by any node,
    and nothing says which of the two was decided.
- file: src/shell/Header.tsx
  where: the NAV constant, lines 23-30 (the `to` value of each of the six entries)
  evidence: "{ to: \"/chat\", label: \"Chat\", icon: MessageSquare },\n  { to: \"/graph\", label: \"Grafo\"\
    , icon: Network },\n  { to: \"/search\", label: \"Buscar\", icon: Search },\n  { to: \"/ingest\",\
    \ label: \"Ingerir\", icon: Upload },\n  { to: \"/curation\", label: \"Curar\", icon: Scale },\n \
    \ { to: \"/history\", label: \"Histórico\", icon: History },"
  cost: The node fixes the six area names, their order and the "equals or begins" test for the current
    area. It does not give the address each area is at. The mapping from Chat, Grafo, Buscar, Ingerir,
    Curar and Histórico to "/chat", "/graph", "/search", "/ingest", "/curation" and "/history" lives only
    in this array. A reader who looks in the specification for where each area lives finds no address.
    If an address changes, no node says which was decided.
- file: src/shell/Header.tsx
  where: the brand block at the start of the header, lines 55-60
  evidence: "<span className=\"font-sans text-sm font-medium font-bold tracking-tight text-foreground\"\
    >\n          Remember\n        </span>"
  cost: The header shows the product name "Remember" as text the owner reads. No node holds that name
    or the fact that the header shows it. The shell-screen show-shell answer lists the banner's contents
    (the navigation, the palette toggle and the theme choice) and does not mention it. The wording lives
    only in the code, where nobody looks for it when the specification is read.
unbound:
- src/components/ds/ConversationMenu/ConversationMenu.types.ts
- src/lib/tokens.ts
notes: 'Judged by 27 delegation(s), one per file; folded mechanically by trace.py --fold from the returns
  under siegard-reconcile/restates-fe-shared.returns/.

  Candidates: 14 opened across 5 of 27 delegation(s); each return lists its own under `candidates_opened`.

  Unstated: 10 fact(s) the source states that no node holds, over 7 file(s), listed under `unstated`.
  They block no binding here and no rebind closes them — the route is the analysis that gives each fact
  a node.'
---

## Folded
This record was folded by `trace.py --fold` from the delegation returns under `siegard-reconcile/restates-fe-shared.returns/`, which are the evidence behind every entry above.
