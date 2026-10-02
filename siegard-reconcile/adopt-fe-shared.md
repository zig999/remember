---
contract_version: siegard-reconcile/8
title: Adoption of the frontend shared context
summary: The shared part of the frontend is adopted as it stands and did not change; the owner states
  the source is the running system, and this reconciliation asks whether the specification written from
  its survey holds what each file carries.
target: frontend
files:
- path: src/components/ds/ChatBubble/ChatBubble.tsx
  change: Draws one message as a bubble with its tool chips and stop notice.
- path: src/components/ds/ChatBubble/ChatBubble.types.ts
  change: Declares the props of ChatBubble.
- path: src/components/ds/ChatBubble/ChatBubble.variants.ts
  change: Declares the style variants of ChatBubble.
- path: src/components/ds/ChatBubble/index.ts
  change: Re-exports its directory.
- path: src/components/ds/ConversationMenu/ConversationMenu.tsx
  change: Shows the menu to pick, create, rename, archive and delete conversations.
- path: src/components/ds/ConversationMenu/ConversationMenu.types.ts
  change: Declares the props of ConversationMenu.
- path: src/components/ds/ConversationMenu/index.ts
  change: Re-exports its directory.
- path: src/components/ds/GlassSurface/GlassSurface.tsx
  change: Holds part of the shared client.
- path: src/components/ds/GlassSurface/GlassSurface.types.ts
  change: Declares the props of GlassSurface.
- path: src/components/ds/GlassSurface/GlassSurface.variants.ts
  change: Declares the style variants of GlassSurface.
- path: src/components/ds/GlassSurface/index.ts
  change: Re-exports its directory.
- path: src/components/ds/GraphNode/GraphNode.tsx
  change: Draws one graph node with its type name and state badge.
- path: src/components/ds/GraphNode/GraphNode.types.ts
  change: Declares the props of GraphNode.
- path: src/components/ds/GraphNode/index.ts
  change: Re-exports its directory.
- path: src/components/ds/StateBadge/StateBadge.tsx
  change: Shows a confidence state as a labelled badge.
- path: src/components/ds/StateBadge/StateBadge.types.ts
  change: Declares the props of StateBadge.
- path: src/components/ds/StateBadge/index.ts
  change: Re-exports its directory.
- path: src/components/ui/.gitkeep
  change: Keeps the directory in version control.
- path: src/components/ui/avatar/avatar.tsx
  change: Shows an avatar with initials derived from the name.
- path: src/components/ui/avatar/avatar.types.ts
  change: Declares the props of avatar.
- path: src/components/ui/avatar/index.ts
  change: Re-exports its directory.
- path: src/components/ui/badge/badge.tsx
  change: Holds part of the shared client.
- path: src/components/ui/badge/badge.types.ts
  change: Declares the props of badge.
- path: src/components/ui/badge/index.ts
  change: Re-exports its directory.
- path: src/components/ui/command/command.tsx
  change: Wraps the command menu primitive.
- path: src/components/ui/command/command.types.ts
  change: Declares the props of command.
- path: src/components/ui/command/index.ts
  change: Re-exports its directory.
- path: src/components/ui/dropdown-menu/dropdown-menu.tsx
  change: Holds part of the shared client.
- path: src/components/ui/dropdown-menu/dropdown-menu.types.ts
  change: Declares the props of dropdown-menu.
- path: src/components/ui/dropdown-menu/index.ts
  change: Re-exports its directory.
- path: src/components/ui/form/form.tsx
  change: Wires a form field to its labels, description and error message.
- path: src/components/ui/form/form.types.ts
  change: Declares the props of form.
- path: src/components/ui/form/index.ts
  change: Re-exports its directory.
- path: src/components/ui/popover/index.ts
  change: Re-exports its directory.
- path: src/components/ui/popover/popover.tsx
  change: Holds part of the shared client.
- path: src/components/ui/popover/popover.types.ts
  change: Declares the props of popover.
- path: src/lib/cn.ts
  change: Merges class names.
- path: src/lib/env.ts
  change: Reads and validates the client configuration and caches it.
- path: src/lib/error-routing.ts
  change: Maps a failure code to the action the owner sees.
- path: src/lib/http.ts
  change: Sends every request to the back end with the access token, the cutoff and one silent token refresh.
- path: src/lib/motion.ts
  change: Declares the motion variants.
- path: src/lib/query-client.ts
  change: Holds the client for reads and writes with its defaults and applies the routed failure action.
- path: src/lib/report-error.ts
  change: Reports a client error to the development console.
- path: src/lib/tokens.ts
  change: Declares the design tokens.
- path: src/router/SignInPage.tsx
  change: Shows the sign-in page with the session expired notice.
- path: src/router/StubPage.tsx
  change: Shows the placeholder page of areas not yet built.
- path: src/router/__root.tsx
  change: Hosts the root route with the render failure boundary and the unmatched address notice.
- path: src/router/router.ts
  change: Creates the router from the route tree.
- path: src/router/routes.tsx
  change: Declares the addresses, their guard and their search keys.
- path: src/shell/AmbientBackdrop.tsx
  change: Draws the decorative backdrop behind the shell.
- path: src/shell/AppErrorBoundary.tsx
  change: Replaces the screen with the failure notice when a render fails.
- path: src/shell/AppShell.tsx
  change: Frames the workspace with the header, footer and command palette.
- path: src/shell/AppToaster.tsx
  change: Mounts the toaster that shows failure toasts.
- path: src/shell/CommandPalette.tsx
  change: Offers the command palette with its destinations and shortcut.
- path: src/shell/Footer.tsx
  change: Shows the health, the pending curation total and the as-of date.
- path: src/shell/Header.tsx
  change: Shows the header with the area navigation, the palette toggle and the theme choice.
- path: src/shell/HeaderConversationMenu.tsx
  change: Manages the conversations from the header menu.
- path: src/shell/ThemeSelect.tsx
  change: Lets the owner choose the theme.
- path: src/shell/api/use-shell-status.ts
  change: Reads the system health and the pending curation total.
- path: src/state/as-of.ts
  change: Holds the as-of date in memory.
- path: src/state/auth.ts
  change: Holds the access token and its claims and tells whether it is fresh.
- path: src/state/command-palette.ts
  change: Holds the open state of the command palette.
- path: src/state/graph-view.ts
  change: Holds the client state of the graph view.
- path: src/state/theme.ts
  change: Holds the chosen theme.
- path: src/styles/theme.css
  change: Declares the theme tokens and styles.
nodes:
- node: constraints/failures-answer-one-envelope
  conforms: true
  how: "src/lib/http.ts: held at the `EnvelopeError` class and `EnvelopeErrorPayload`, lines 51-72, with\
    \ every failure path of `http()` throwing it — export class EnvelopeError extends Error {\n  override\
    \ readonly name = \"EnvelopeError\";\n  readonly code: string;\n  readonly httpStatus: number;\n \
    \ readonly details?: unknown;"
  encoded_at:
  - src/lib/http.ts
- node: contracts/application-shell/bff-shell-reads
  conforms: true
  how: 'src/shell/api/use-shell-status.ts: held at getJson(), useHealth() and useCurationCount(), lines
    22-55 — queryFn: () => getJson("/health"),

    queryFn: () => getJson("/api/v1/curation/queue?limit=1", token),

    return res.json().catch(() => null);

    return d?.total ?? d?.result?.total ?? 0;'
  encoded_at:
  - src/shell/api/use-shell-status.ts
- node: contracts/application-shell/shell-screen
  conforms: true
  how: "src/lib/error-routing.ts: held at the `show-failure` operation only, in `routeError` (lines 71-132).\
    \ The `show-shell` and `show-page-state` operations are not in this file. — Every wording the contract\
    \ names for `show-failure` is declared in `const MSG`, for example `accessDenied: \"Acesso negado.\"\
    `, `validationInvalid: \"Há campos inválidos no formulário.\"`, `notFound: \"Nenhum resultado encontrado.\"\
    `, `gone: \"Esta fonte foi removida por conformidade.\"`, `business: \"Operação não pôde ser concluída.\"\
    `, `system: \"Algo deu errado. Tente novamente.\"` and `offline: \"Sem conexão.\"`. The 401 session-expired\
    \ failure is `sessionExpired: \"Sua sessão expirou. Faça login novamente.\"`, and nothing in this\
    \ file raises it.\nsrc/lib/query-client.ts: held at the non-envelope branch of both caches' `onError`,\
    \ lines 163-164 and 173-174. The rest of the contract (its wordings and the shell) is held in other\
    \ files. — reportError(err);\ntoast.error(\"Algo deu errado. Tente novamente.\");\nsrc/router/__root.tsx:\
    \ held at NotFoundFallback, lines 73-76, for the show-page-state refusal \"Página não encontrada.\"\
    \ This file holds neither the shell, the failure toasts, the render-failure notice nor the placeholder\
    \ wording. — <h1 className=\"text-lg font-semibold tracking-tight\">Página não encontrada.</h1>\n\
    <p className=\"text-body text-body\">\n  O endereço solicitado não existe ou foi removido.\n</p>\n\
    src/router/routes.tsx: held at protectedLayoutRoute.beforeLoad (show-shell refusal redirect), the\
    \ three Suspense fallbacks, the StubPage titles of graphRoute, searchRoute and historyRoute, and notFoundRoute\
    \ (show-page-state) — throw redirect({ to: \"/sign-in\", search: { reason: \"session_expired\" } });\n\
    title=\"Página não encontrada.\"\nhint=\"O endereço solicitado não existe ou foi removido.\"\nsrc/shell/AppErrorBoundary.tsx:\
    \ held at the fallback JSX returned by render(), lines 59-78, for the show-page-state refusal on a\
    \ render failure — <h1 className=\"text-lg font-semibold tracking-tight\">Algo deu errado.</h1>\n\
    <p className=\"text-body text-body\">\n  A página não pôde ser renderizada. Recarregue para tentar\
    \ novamente.\n</p>\n... Recarregar\nsrc/shell/Footer.tsx: held at the Footer function's JSX (lines\
    \ 59-132); only the footer part of show-shell is carried here — role=\"contentinfo\"\naria-label=\"\
    Rodapé\"\n... Como em: {formatAsOf(asOf)}\n... {curationPending} pendentes\nsrc/shell/Header.tsx:\
    \ held at the JSX of Header(), as the banner, the Áreas navigation and the palette toggle. This file\
    \ holds the header's part of `show-shell`. The theme choice named Tema sits in ThemeSelect and the\
    \ footer is in another file. — role=\"banner\"\n      aria-label=\"Cabeçalho\"\n<nav aria-label=\"\
    Áreas\" className=\"flex items-center gap-xs\">\naria-label=\"Abrir paleta de comandos (⌘K)\"\nsrc/shell/ThemeSelect.tsx:\
    \ held at the aria-label prop on the Select in ThemeSelect's return, line 24. It holds only the \"\
    Tema\" part of the show-shell answer, the theme choice. The banner, navigation, palette toggle, workspace\
    \ and footer are not in this file. — <Select\n  value={theme}\n  onChange={(value) => setTheme(value\
    \ as ThemeName)}\n  options={THEMES}\n  aria-label=\"Tema\""
  encoded_at:
  - src/lib/error-routing.ts
  - src/lib/query-client.ts
  - src/router/__root.tsx
  - src/router/routes.tsx
  - src/shell/AppErrorBoundary.tsx
  - src/shell/Footer.tsx
  - src/shell/Header.tsx
  - src/shell/ThemeSelect.tsx
- node: domain/application-shell/application-shell
  conforms: true
  how: "src/router/routes.tsx: held at routeTree, lines 272-284, where the address attribute is realised\
    \ as the declared routes — export const routeTree = RootRoute.addChildren([\n  signInRoute,\n  protectedLayoutRoute.addChildren(["
  encoded_at:
  - src/router/routes.tsx
- node: domain/application-shell/failure-action
  conforms: true
  how: 'src/lib/error-routing.ts: held at the `ErrorAction` union, lines 22-36 — `| { kind: "redirect";
    to: string } | { kind: "toast-and-navigate"; ... } | { kind: "boundary"; message: string } | { kind:
    "set-error"; ... } | { kind: "inline-empty"; message: string } | { kind: "inline-gone"; message: string
    } | { kind: "toast"; ... } | { kind: "silent" }`. These are the eight values the enumeration lists.'
  encoded_at:
  - src/lib/error-routing.ts
- node: rules/application-shell/a-401-is-answered-with-one-silent-refresh
  conforms: true
  how: "src/lib/http.ts: held at the 401 branch of `http()`, line 268, and `trySilentRefresh()` — if (response.status\
    \ === 401 && __retried !== true) {\n    const refreshed = await trySilentRefresh();"
  encoded_at:
  - src/lib/http.ts
- node: rules/application-shell/a-bubble-shows-its-tool-chips-first
  conforms: true
  how: 'src/components/ds/ChatBubble/ChatBubble.tsx: held at the `toolChips.map(...)` block rendered before
    `<GlassSurface>` and the `ToolChipStub` component, lines 60-88 and 171-186 — {toolChips !== undefined
    && toolChips.length > 0 ? ( <div data-testid="tool-chips" ...> {toolChips.map((chip, i) => ( <ToolChipStub
    key={`${chip.tool}:${i}`} tool={chip.tool} ok={chip.ok} /> ))}

    ok === null ? "border-border-glass text-muted-foreground" : ok ? "border-border-accepted text-state-accepted-fg"
    : "border-border-error text-state-disputed-fg"

    {tool}

    src/components/ds/ChatBubble/ChatBubble.types.ts: held at the `toolChips` prop declaration, line 81,
    carries only the input of the rule: the ordered tool calls. One chip per call, the order, the name-only
    chip and the pending/ok/error colours are rendered in ChatBubble.tsx and not here. — toolChips?: ReadonlyArray<ToolCallData>;'
  encoded_at:
  - src/components/ds/ChatBubble/ChatBubble.tsx
  - src/components/ds/ChatBubble/ChatBubble.types.ts
- node: rules/application-shell/a-bubble-shows-plain-text
  conforms: true
  how: 'src/components/ds/ChatBubble/ChatBubble.tsx: held at the `<p data-testid="bubble-content">` that
    renders `{content}`, lines 223-229 — <p data-testid="bubble-content" className="whitespace-pre-wrap
    break-words text-xs text-foreground"> {content}

    src/components/ds/ChatBubble/ChatBubble.types.ts: held at the `content` prop declaration, line 46,
    which accepts any string including an empty one. Plain rendering with line breaks kept is in ChatBubble.tsx
    and not in this file. — content: string;'
  encoded_at:
  - src/components/ds/ChatBubble/ChatBubble.tsx
  - src/components/ds/ChatBubble/ChatBubble.types.ts
- node: rules/application-shell/a-bubble-state-is-resolved-in-order
  conforms: true
  how: 'src/components/ds/ChatBubble/ChatBubble.tsx: held at the `data-state` expression on the root div,
    lines 155-163 — data-state={ error ? "error" : streaming ? "streaming" : stopNotice !== undefined
    ? "stopped" : "idle" }'
  encoded_at:
  - src/components/ds/ChatBubble/ChatBubble.tsx
- node: rules/application-shell/a-bubble-takes-one-role
  conforms: true
  how: 'src/components/ds/ChatBubble/ChatBubble.tsx: held at `data-variant={variant}` and `chatBubble({
    variant })` on the root div, and `glassFill` at line 149. The side is decided by the CVA in ChatBubble.variants.ts,
    which is outside this file. — const glassFill = variant === "user" ? "ambient" : "ambient-accent";

    data-variant={variant}

    className={cn(chatBubble({ variant }), className)}

    src/components/ds/ChatBubble/ChatBubble.types.ts: held at the `variant` prop, line 41, required and
    typed by ChatBubbleVariant (line 34). It takes exactly one role. The side and fill that the role decides
    are realized in ChatBubble.variants.ts and ChatBubble.tsx. — variant: ChatBubbleVariant;'
  encoded_at:
  - src/components/ds/ChatBubble/ChatBubble.tsx
  - src/components/ds/ChatBubble/ChatBubble.types.ts
- node: rules/application-shell/a-business-failure-shows-its-message
  conforms: true
  how: 'src/lib/error-routing.ts: held at the `BUSINESS_` branch of the `default` case, line 123 — `if
    (code.startsWith("BUSINESS_")) { return { kind: "toast", tone: "warning", message: fallbackMessage
    ?? MSG.business }; }`. `fallbackMessage` is null when the message is empty.'
  encoded_at:
  - src/lib/error-routing.ts
- node: rules/application-shell/a-conversation-resource-is-recognised-by-its-key
  conforms: true
  how: 'src/lib/error-routing.ts: held at `isConversationResourceKey`, lines 146-154. The other half of
    the rule, a write without a key never counting as a conversation''s, is handled by the caller and
    not here. — `if (queryKey.length < 2) return false; if (queryKey[0] !== "conversations") return false;
    ... if (typeof second !== "string") return false; if (second === "list") return false; return second.length
    > 0;`'
  encoded_at:
  - src/lib/error-routing.ts
- node: rules/application-shell/a-failed-envelope-keeps-its-code
  conforms: true
  how: "src/lib/http.ts: held at the final throw of `http()`, lines 329-335 — code: error?.code ?? \"\
    SYSTEM_UNKNOWN\",\n    httpStatus: response.status,\n    message: error?.message ?? \"Erro desconhecido\
    \ do servidor.\",\n    details: error?.details,"
  encoded_at:
  - src/lib/http.ts
- node: rules/application-shell/a-failed-menu-action-does-not-navigate
  conforms: true
  how: 'src/shell/HeaderConversationMenu.tsx: held at Every `navigate` call in `onCreate`, `onArchive`
    and `onDelete` sits inside an `onSuccess` callback. No `onError`, `onSettled` or failure handler is
    declared anywhere in the file. — createMutation.mutate(undefined, { onSuccess: (created) => { void
    navigate({ ... }); } });

    updateMutation.mutate({ id, archivedAt: new Date().toISOString() }, { onSuccess: () => { if (id ===
    activeConversationId) { void navigate({ to: "/chat", search: {} }); } } });

    deleteMutation.mutate({ id }, { onSuccess: () => { ... } });'
  encoded_at:
  - src/shell/HeaderConversationMenu.tsx
- node: rules/application-shell/a-failed-refresh-ends-the-session
  conforms: true
  how: "src/lib/http.ts: held at the catch of `trySilentRefresh()`, lines 200-206, and the AUTH_SESSION_EXPIRED\
    \ throw at lines 287-291 — useAuthStore.getState().clear();\n    redirectImpl(\"/sign-in?reason=session_expired\"\
    );\n    return false;"
  encoded_at:
  - src/lib/http.ts
- node: rules/application-shell/a-failure-carries-code-status-message-and-details
  conforms: true
  how: "src/lib/http.ts: held at the `EnvelopeError` constructor, lines 64-71 — this.code = payload.code;\n\
    \    this.httpStatus = payload.httpStatus;\n    if (payload.details !== undefined) {\n      this.details\
    \ = payload.details;\n    }"
  encoded_at:
  - src/lib/http.ts
- node: rules/application-shell/a-failure-to-complete-is-timeout-abort-or-network
  conforms: true
  how: "src/lib/http.ts: held at the catch of `fetch(url, fetchInit)`, lines 235-261 — if (isTimeoutError(err))\
    \ {\n    throw new EnvelopeError({\n      code: \"SYSTEM_TIMEOUT\",\n      httpStatus: 0,"
  encoded_at:
  - src/lib/http.ts
- node: rules/application-shell/a-field-outside-a-form-is-a-developer-error
  conforms: true
  how: "src/components/ui/form/form.tsx: held at useFormField(), lines 73-75 — if (!fieldContext) {\n\
    \    throw new Error(\"useFormField deve ser usado dentro de <FormField>\");\n  }"
  encoded_at:
  - src/components/ui/form/form.tsx
- node: rules/application-shell/a-forbidden-failure-reads-access-denied
  conforms: true
  how: 'src/lib/error-routing.ts: held at `case "AUTH_FORBIDDEN"`, lines 88-89. The danger tone is not
    carried by the returned action. — `case "AUTH_FORBIDDEN": return { kind: "boundary", message: MSG.accessDenied
    };`. The action has no `tone` field. Showing it as a danger toast depends on whichever code executes
    the action, which is outside this file.

    src/lib/query-client.ts: held at the `boundary` branch of `applyErrorAction`, lines 85-91, which shows
    the message as a danger toast. The mapping from AUTH_FORBIDDEN to that action and its text is held
    elsewhere. — case "boundary":

    ...

    toast.error(action.message);

    return;'
  encoded_at:
  - src/lib/error-routing.ts
  - src/lib/query-client.ts
- node: rules/application-shell/a-fresh-owner-skips-sign-in
  conforms: true
  how: 'src/router/routes.tsx: held at signInRoute.beforeLoad, lines 158-171 — try { fresh = useAuthStore.getState().isFresh();
    } catch { fresh = false; }

    if (fresh) { throw redirect({ to: "/chat" }); }'
  encoded_at:
  - src/router/routes.tsx
- node: rules/application-shell/a-gone-resource-reads-removed-for-compliance
  conforms: true
  how: 'src/lib/error-routing.ts: held at `case "RESOURCE_GONE"`, lines 112-113 — `case "RESOURCE_GONE":
    return { kind: "inline-gone", message: MSG.gone };`. The server''s message is not read.

    src/lib/query-client.ts: held at the `inline-gone` branch, lines 97-101, which shows no toast. The
    mapping from RESOURCE_GONE and its wording are not in this file. — case "inline-empty":

    case "inline-gone":

    ...

    return;'
  encoded_at:
  - src/lib/error-routing.ts
  - src/lib/query-client.ts
- node: rules/application-shell/a-graph-node-names-its-type
  conforms: true
  how: "src/components/ds/GraphNode/GraphNode.tsx: held at the `NODE_STYLE` map, lines 43-54, the `aria-label`\
    \ on GlassSurface, line 99, and the subtitle span, line 112. The ten-member `GraphNodeType` union\
    \ is declared in GraphNode.types.ts, not in this file. — person: { icon: User, label: \"Pessoa\",\
    \ color: \"text-node-person\" },\n...\naria-label={`${style.label}: ${label}`}\n...\n{subtitle ??\
    \ style.label}\nsrc/components/ds/GraphNode/GraphNode.types.ts: held at Partly. The ten-type enumeration\
    \ is the GraphNodeType union (lines 12-22) and the caller override is the optional `subtitle?: string`\
    \ prop (line 32). The fixed pt-BR names and the \"name: label\" naming are not in this file, and the\
    \ default subtitle is applied in GraphNode.tsx. — export type GraphNodeType =\n  | \"person\"\n  |\
    \ \"organization\"\n  | \"project\"\n  | \"event\"\n  | \"role\"\n  | \"category\"\n  | \"concept\"\
    \n  | \"location\"\n  | \"document\"\n  | \"task\";\n...\nsubtitle?: string;"
  encoded_at:
  - src/components/ds/GraphNode/GraphNode.tsx
  - src/components/ds/GraphNode/GraphNode.types.ts
- node: rules/application-shell/a-graph-node-shows-its-state-by-an-icon
  conforms: true
  how: "src/components/ds/GraphNode/GraphNode.tsx: held at the conditional `{state && (<StateBadge ...\
    \ iconOnly ... />)}`, lines 115-123, and the selected branch of the `accent` computation, lines 80-84\
    \ — const accent: GlassAccent = selected\n    ? \"focus\"\n    : state\n      ? STATE_ACCENT[state]\n\
    \      : \"none\";\n...\n{state && (\n  <StateBadge\n    state={state}\n    size=\"sm\"\n    iconOnly"
  encoded_at:
  - src/components/ds/GraphNode/GraphNode.tsx
- node: rules/application-shell/a-loading-workspace-says-so-politely
  conforms: true
  how: 'src/router/routes.tsx: held at the Suspense fallbacks of chatRoute, ingestRoute and curationRoute
    — role="status" aria-live="polite" ... Carregando conversa… / Carregando ingestão… / Carregando curadoria…'
  encoded_at:
  - src/router/routes.tsx
- node: rules/application-shell/a-missing-conversation-returns-to-chat
  conforms: true
  how: 'src/lib/error-routing.ts: held at the `context?.isConversationResource === true` branch inside
    `case "RESOURCE_NOT_FOUND"`, lines 102-109. The empty search and the no-reload navigation are left
    to the executor and are not in this file. — `return { kind: "toast-and-navigate", tone: "warning",
    message: MSG.conversationNotFound, to: "/chat" };`

    src/lib/query-client.ts: held at the `toast-and-navigate` branch, lines 60-69 — void router.navigate({
    to: action.to, search: {} as never });'
  encoded_at:
  - src/lib/error-routing.ts
  - src/lib/query-client.ts
- node: rules/application-shell/a-missing-resource-elsewhere-is-an-empty-state
  conforms: true
  how: 'src/lib/error-routing.ts: held at the final `return` of `case "RESOURCE_NOT_FOUND"`, line 110
    — `return { kind: "inline-empty", message: fallbackMessage ?? MSG.notFound };`. It carries no toast.

    src/lib/query-client.ts: held at the `inline-empty` branch, lines 97-101, which shows no toast. The
    server-message and fallback wording is not in this file. — case "inline-empty":

    case "inline-gone":

    ...

    return;'
  encoded_at:
  - src/lib/error-routing.ts
  - src/lib/query-client.ts
- node: rules/application-shell/a-network-failure-reads-no-connection
  conforms: true
  how: 'src/lib/error-routing.ts: held at `case "SYSTEM_NETWORK"` and `case "SYSTEM_ABORTED"`, lines 115-120
    — `case "SYSTEM_NETWORK": return { kind: "toast", tone: "warning", message: MSG.offline }; case "SYSTEM_ABORTED":
    return { kind: "silent" };`'
  encoded_at:
  - src/lib/error-routing.ts
- node: rules/application-shell/a-read-is-retried-once
  conforms: true
  how: "src/lib/query-client.ts: held at `defaultOptions` in `createQueryClient`, lines 146-155 — queries:\
    \ {\n  retry: 1,\n...\nmutations: {\n  retry: 0,\n},"
  encoded_at:
  - src/lib/query-client.ts
- node: rules/application-shell/a-read-stays-fresh-five-minutes-by-default
  conforms: true
  how: 'src/lib/query-client.ts: held at `STABLE_STALE_MS`, `VOLATILE_STALE_MS` and the `queries` defaults,
    lines 39, 42 and 149-150 — export const STABLE_STALE_MS = 5 * 60 * 1000;

    export const VOLATILE_STALE_MS = 0;

    staleTime: STABLE_STALE_MS,

    refetchOnWindowFocus: false,'
  encoded_at:
  - src/lib/query-client.ts
- node: rules/application-shell/a-refreshed-token-repeats-the-request
  conforms: true
  how: "src/lib/http.ts: held at lines 269-281: the new token is stored in `trySilentRefresh`, then the\
    \ request is re-sent through `http()` — useAuthStore.getState().setToken(newJwt);\n...\n      const\
    \ retryOpts: HttpOptions = { ...opts, __retried: true };\n      return http<T>(path, retryOpts);"
  encoded_at:
  - src/lib/http.ts
- node: rules/application-shell/a-rename-sends-the-trimmed-title
  conforms: true
  how: "src/components/ds/ConversationMenu/ConversationMenu.tsx: held at commitRename, lines 171-177,\
    \ and onRenameKeyDown, lines 217-228 — const trimmed = renameDraft.trim();\n    if (trimmed.length\
    \ > 0) onRename(id, trimmed);\n    setRenamingId(null);\n... onClick={() => commitRename(c.id)}"
  encoded_at:
  - src/components/ds/ConversationMenu/ConversationMenu.tsx
- node: rules/application-shell/a-render-failure-is-reported-and-announced
  conforms: true
  how: "src/shell/AppErrorBoundary.tsx: held at componentDidCatch (lines 45-50) for the report, and the\
    \ fallback root element (lines 60-65) for the announcement — reportError(error, {\n  source: \"AppErrorBoundary\"\
    ,\n  extra: { componentStack: info.componentStack ?? null },\n});\n<div role=\"alert\" aria-live=\"\
    assertive\" ..."
  encoded_at:
  - src/shell/AppErrorBoundary.tsx
- node: rules/application-shell/a-render-failure-replaces-the-screen
  conforms: true
  how: "src/router/__root.tsx: held at the `<AppErrorBoundary>` mount around `<Outlet />`, lines 47-49.\
    \ The \"Algo deu errado.\" notice and the Recarregar action are not in this file; they are presumably\
    \ in AppErrorBoundary, which is outside the file set. — <AppErrorBoundary>\n  <Outlet />\n</AppErrorBoundary>\n\
    src/shell/AppErrorBoundary.tsx: held at render() (lines 56-81) and handleReload (lines 52-54) — if\
    \ (this.state.hasError) {\n  ...\n  className=\"flex min-h-screen flex-col items-center justify-center\
    \ gap-md px-lg text-foreground\"\nprivate readonly handleReload = (): void => {\n  if (typeof window\
    \ !== \"undefined\") window.location.reload();"
  encoded_at:
  - src/router/__root.tsx
  - src/shell/AppErrorBoundary.tsx
- node: rules/application-shell/a-repeated-request-never-refreshes-again
  conforms: true
  how: 'src/lib/http.ts: held at the `__retried !== true` guard at line 268. A repeated 401 falls through
    to the status and body judgments below it. — if (response.status === 401 && __retried !== true) {'
  encoded_at:
  - src/lib/http.ts
- node: rules/application-shell/a-reported-error-stays-in-the-console
  conforms: true
  how: "src/lib/report-error.ts: held at The body of reportError(), lines 30-42, which holds both halves\
    \ of the rule. The `import.meta.env.DEV` guard holds the dev-only part. The single `console.error`\
    \ call holds the console write. No network call appears anywhere in the file. — if (!import.meta.env.DEV)\
    \ {\n    return;\n  }\n  console.error(\"[report-error]\", {\n    error,\n    source: context.source,\n\
    \    queryKey: context.queryKey,\n    extra: context.extra,\n  });"
  encoded_at:
  - src/lib/report-error.ts
- node: rules/application-shell/a-request-goes-to-the-back-end-address
  conforms: false
  how: 'src/shell/api/use-shell-status.ts, getJson(), lines 22-28, the template literal inside fetch:
    const res = await fetch(`${VITE_BFF_URL}${path}`, { headers }); — The address join is written a second
    time here, beside the request helper that the node constrains, which the header comment names as bypassed
    ("Direct fetch (NOT lib/http)"). This copy concatenates unconditionally and has no branch for a path
    that starts with http:// or https://. The two joins agree only while every caller passes a relative
    path. If the node moves, the helper follows it, and nothing reaches this copy.'
  observed_at:
  - src/shell/api/use-shell-status.ts
- node: rules/application-shell/a-request-is-cut-off-after-thirty-seconds
  conforms: true
  how: "src/lib/http.ts: held at `DEFAULT_TIMEOUT_MS` and the timer in `buildSignal`, lines 101 and 162-166\
    \ — timeoutController.abort(new DOMException(\"Request timed out after 30s\", \"TimeoutError\"));\n\
    \  }, DEFAULT_TIMEOUT_MS);"
  encoded_at:
  - src/lib/http.ts
- node: rules/application-shell/a-request-is-judged-in-a-fixed-order
  conforms: true
  how: "src/lib/http.ts: held at the sequence in `http()`: fetch catch (232-261), 401 (268), >= 500 (295),\
    \ JSON parse (312-322), then `body.ok` (324) — if (response.status === 401 && __retried !== true)\
    \ {\n...\n  if (response.status >= 500) {\n...\n    body = (await response.json()) as Envelope<T>;\n\
    ...\n  if (body.ok === true) {"
  encoded_at:
  - src/lib/http.ts
- node: rules/application-shell/a-row-offers-its-actions
  conforms: true
  how: 'src/components/ds/ConversationMenu/ConversationMenu.tsx: held at the normal row, lines 393-449
    — {isArchived ? ( ... handleUnarchive(c.id) ... ) : ( ... handleArchive(c.id) ... )}

    ... startRename(c.id, c.title) ... requestDelete(c.id)'
  encoded_at:
  - src/components/ds/ConversationMenu/ConversationMenu.tsx
- node: rules/application-shell/a-row-shows-its-title-and-archived-mark
  conforms: true
  how: 'src/components/ds/ConversationMenu/ConversationMenu.tsx: held at lines 315-320 and 382-391 — const
    isArchived = c.archivedAt !== null;

    const itemTitle = c.title ?? STRINGS.titleFallback;

    const itemAriaLabel = isArchived ? `${itemTitle} ${STRINGS.archivedSuffix}` : itemTitle;

    ... <span aria-hidden="true" ...>{STRINGS.archivedBadge}</span>'
  encoded_at:
  - src/components/ds/ConversationMenu/ConversationMenu.tsx
- node: rules/application-shell/a-server-error-is-always-a-failure
  conforms: true
  how: "src/lib/http.ts: held at the `response.status >= 500` branch, lines 295-310 — code: envelopeCode\
    \ ?? \"SYSTEM_UPSTREAM\",\n    httpStatus: response.status,\n    message:\n      extractEnvelopeMessage(raw)\
    \ ?? \"Algo deu errado. Tente novamente.\",\n    details: raw,"
  encoded_at:
  - src/lib/http.ts
- node: rules/application-shell/a-state-badge-has-five-states-with-labels
  conforms: true
  how: "src/components/ds/StateBadge/StateBadge.tsx: held at the STATE_LABELS table (lines 46-52) and\
    \ the label resolution in the StateBadge body (line 168) — accepted: \"Aceito\",\n  uncertain: \"\
    Incerto\",\n  \"low-confidence\": \"Baixa confiança\",\n  disputed: \"Em disputa\",\n  superseded:\
    \ \"Superado\",\n...\nconst resolvedLabel = label ?? STATE_LABELS[state];\nsrc/components/ds/StateBadge/StateBadge.types.ts:\
    \ held at the `ConfidenceState` union (lines 12-17) holds the five states, and `label?: string` on\
    \ `StateBadgeProps` (line 43) holds the caller's label override. The visible labels Aceito, Incerto,\
    \ Baixa confiança, Em disputa and Superado are not declared in this file. — export type ConfidenceState\
    \ =\n  | \"accepted\"\n  | \"uncertain\"\n  | \"low-confidence\"\n  | \"disputed\"\n  | \"superseded\"\
    ;\n...\nlabel?: string;"
  encoded_at:
  - src/components/ds/StateBadge/StateBadge.tsx
  - src/components/ds/StateBadge/StateBadge.types.ts
- node: rules/application-shell/a-state-badge-is-always-named
  conforms: true
  how: 'src/components/ds/StateBadge/StateBadge.tsx: held at the aria-label attribute on the motion span
    (line 247), the label render at line 262, and the icon at line 261 — aria-label={`Estado de confiança:
    ${resolvedLabel}`}

    ...

    <IconCmp size={iconSize} aria-hidden="true" />

    {!iconOnly && <span>{resolvedLabel}</span>}'
  encoded_at:
  - src/components/ds/StateBadge/StateBadge.tsx
- node: rules/application-shell/a-streaming-bubble-is-busy
  conforms: true
  how: 'src/components/ds/ChatBubble/ChatBubble.tsx: held at `ariaBusy`, spread onto the root div, and
    `StreamingCursorStub` rendered after the content, lines 97-107, 136, 167 and 228 — const ariaBusy
    = streaming ? "true" : undefined;

    {...(ariaBusy !== undefined ? { "aria-busy": ariaBusy } : {})}

    {streaming ? <StreamingCursorStub /> : null}

    <span aria-hidden="true" data-testid="streaming-cursor" ...>'
  encoded_at:
  - src/components/ds/ChatBubble/ChatBubble.tsx
- node: rules/application-shell/a-toast-keeps-its-tone
  conforms: true
  how: 'src/lib/query-client.ts: held at the `toast` branch of `applyErrorAction`, lines 56-59 — if (action.tone
    === "danger") toast.error(action.message);

    else toast.warning(action.message);'
  encoded_at:
  - src/lib/query-client.ts
- node: rules/application-shell/a-user-bubble-may-be-streaming
  conforms: false
  how: "src/components/ds/ChatBubble/ChatBubble.types.ts, the last sentences of the docstring on `streaming`,\
    \ lines 52-53: User bubbles MUST never have `streaming=true` (the\n   * type does not prohibit it;\
    \ the ChatBubbleList enforces it). — The node says a bubble must not refuse a user role marked as\
    \ streaming. This comment says the opposite, that a user bubble must never stream. No code holds that\
    \ restriction. `streaming?: boolean` is independent of `variant`, and no ChatBubbleList exists under\
    \ frontend/src. The next reader will take the comment for a business decision that contradicts the\
    \ specification."
  observed_at:
  - src/components/ds/ChatBubble/ChatBubble.types.ts
- node: rules/application-shell/an-answer-below-500-without-json-is-invalid
  conforms: true
  how: "src/lib/http.ts: held at the catch around `response.json()`, lines 313-322 — code: \"SYSTEM_INVALID_RESPONSE\"\
    ,\n    httpStatus: response.status,\n    message: \"Resposta do servidor não é JSON válido.\","
  encoded_at:
  - src/lib/http.ts
- node: rules/application-shell/an-authorization-failure-sends-the-owner-to-sign-in
  conforms: true
  how: 'src/lib/error-routing.ts: held at the three stacked `case` labels, lines 83-86. Clearing the stored
    token is not in this file. — `case "AUTH_UNAUTHORIZED": case "AUTH_TOKEN_EXPIRED": case "AUTH_TOKEN_INVALID":
    return { kind: "redirect", to: "/sign-in?reason=session_expired" };`'
  encoded_at:
  - src/lib/error-routing.ts
- node: rules/application-shell/an-avatar-is-named-by-the-full-name
  conforms: true
  how: 'src/components/ui/avatar/avatar.tsx: held at initials() lines 12-17, and the aria-label attribute
    in Avatar() line 49 — if (parts.length === 0) return "?";

    if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();

    return (parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)).toUpperCase();

    ...

    aria-label={name}'
  encoded_at:
  - src/components/ui/avatar/avatar.tsx
- node: rules/application-shell/an-error-message-replaces-other-text
  conforms: true
  how: "src/components/ui/form/form.tsx: held at FormMessage, lines 132-133 — const body = error ? String(error.message\
    \ ?? \"\") : children;\n  if (!body) return null;"
  encoded_at:
  - src/components/ui/form/form.tsx
- node: rules/application-shell/an-errored-bubble-adds-no-wording
  conforms: true
  how: 'src/components/ds/ChatBubble/ChatBubble.tsx: held at `glassAccent`, passed to `GlassSurface` as
    `accent`, line 141. No error text is rendered anywhere. — const glassAccent = error ? "error" : "none";

    <GlassSurface level="modal" accent={glassAccent}'
  encoded_at:
  - src/components/ds/ChatBubble/ChatBubble.tsx
- node: rules/application-shell/an-ingestion-request-has-no-cutoff
  conforms: true
  how: "src/lib/http.ts: held at the `ingest` branch of `buildSignal`, lines 159-161 — if (opts.ingest\
    \ === true) {\n    return { signal: opts.signal, cleanup: () => undefined };\n  }"
  encoded_at:
  - src/lib/http.ts
- node: rules/application-shell/an-invalid-field-is-described
  conforms: true
  how: "src/components/ui/form/form.tsx: held at FormControl, lines 104-111 — aria-describedby={\n   \
    \     error ? `${formDescriptionId} ${formMessageId}` : formDescriptionId\n      }\n      aria-invalid={!!error}"
  encoded_at:
  - src/components/ui/form/form.tsx
- node: rules/application-shell/an-invalid-format-is-a-form-error
  conforms: true
  how: 'src/lib/error-routing.ts: held at `case "VALIDATION_INVALID_FORMAT"`, lines 91-96 — `kind: "set-error",
    message: fallbackMessage ?? MSG.validationInvalid, ...("details" in err && err.details !== undefined
    ? { details: err.details } : {})`. It returns no toast.

    src/lib/query-client.ts: held at the `set-error` branch, lines 92-96, which shows no toast. The mapping
    from VALIDATION_INVALID_FORMAT, the message wording and the passing on of details are in src/lib/error-routing.ts.
    — case "set-error":

    ...

    return;'
  encoded_at:
  - src/lib/error-routing.ts
  - src/lib/query-client.ts
- node: rules/application-shell/an-unknown-address-says-page-not-found
  conforms: true
  how: "src/router/__root.tsx: held at `notFoundComponent: NotFoundComponent` on the root route, lines\
    \ 38-41, and the text in NotFoundFallback, lines 73-76. The root component mounts no guard or shell,\
    \ so the unmatched address renders without them. — export const Route = createRootRoute({\n  component:\
    \ RootComponent,\n  notFoundComponent: NotFoundComponent,\n});\n<h1 className=\"text-lg font-semibold\
    \ tracking-tight\">Página não encontrada.</h1>\nO endereço solicitado não existe ou foi removido.\n\
    src/router/routes.tsx: held at notFoundRoute, lines 256-266, which carries the title and hint. The\
    \ match-no-route handling without guard or shell is not in this file. — path: \"/not-found\",\ncomponent:\
    \ () => (<StubPage title=\"Página não encontrada.\" hint=\"O endereço solicitado não existe ou foi\
    \ removido.\" testId=\"not-found-page\" />)"
  encoded_at:
  - src/router/__root.tsx
  - src/router/routes.tsx
- node: rules/application-shell/any-other-code-shows-a-danger-toast
  conforms: true
  how: 'src/lib/error-routing.ts: held at the last `return` of the `default` branch, line 130 — `return
    { kind: "toast", tone: "danger", message: fallbackMessage ?? MSG.system };`'
  encoded_at:
  - src/lib/error-routing.ts
- node: rules/application-shell/any-other-system-failure-hides-its-message
  conforms: true
  how: 'src/lib/error-routing.ts: held at the `SYSTEM_` branch of the `default` case, lines 126-128 —
    `if (code.startsWith("SYSTEM_")) { return { kind: "toast", tone: "danger", message: MSG.system };
    }`. The server''s message is not read.'
  encoded_at:
  - src/lib/error-routing.ts
- node: rules/application-shell/archive-and-reactivate-need-no-confirmation
  conforms: true
  how: "src/components/ds/ConversationMenu/ConversationMenu.tsx: held at handleArchive and handleUnarchive,\
    \ lines 184-192 — function handleArchive(id: string): void {\n    onArchive(id);\n    setOpen(false);\n\
    \  }"
  encoded_at:
  - src/components/ds/ConversationMenu/ConversationMenu.tsx
- node: rules/application-shell/archived-conversations-are-opt-in
  conforms: true
  how: 'src/components/ds/ConversationMenu/ConversationMenu.tsx: held at the footer row, lines 459-476,
    with includeArchived defaulting to false at line 111 — includeArchived = false,

    ...

    <Switch id="conversation-menu-include-archived" checked={includeArchived} onChange={onIncludeArchivedChange}'
  encoded_at:
  - src/components/ds/ConversationMenu/ConversationMenu.tsx
- node: rules/application-shell/archiving-stamps-the-browser-clock
  conforms: true
  how: 'src/shell/HeaderConversationMenu.tsx: held at `onArchive`, lines 102-116 — updateMutation.mutate({
    id, archivedAt: new Date().toISOString() }, { onSuccess: () => { if (id === activeConversationId)
    { void navigate({ to: "/chat", search: {} }); } } });'
  encoded_at:
  - src/shell/HeaderConversationMenu.tsx
- node: rules/application-shell/as-of-starts-at-today
  conforms: true
  how: "src/shell/Footer.tsx: held at formatAsOf, line 45-47. The empty start itself comes from the store\
    \ in another file. — return asOf ? asOf.toLocaleDateString(\"pt-BR\") : \"hoje\";\n<Clock className=\"\
    size-3\" aria-hidden=\"true\" /> Como em: {formatAsOf(asOf)}\nsrc/state/as-of.ts: held at The initial\
    \ state of `useAsOfStore`, line 25. The `Como em: hoje` footer text is not in this file; it is in\
    \ `src/shell/Footer.tsx`. — export const useAsOfStore = create<AsOfState>((set) => ({\n  asOf: null,"
  encoded_at:
  - src/shell/Footer.tsx
  - src/state/as-of.ts
- node: rules/application-shell/chat-and-curation-keep-one-search-key
  conforms: true
  how: 'src/router/routes.tsx: held at chatRoute.validateSearch and curationRoute.validateSearch — if
    (typeof raw === "string" && raw.length > 0) { return { conversation: raw }; } return {};

    if (typeof raw === "string" && raw.length > 0) { return { item: raw }; } return {};'
  encoded_at:
  - src/router/routes.tsx
- node: rules/application-shell/choosing-a-destination-closes-the-palette-first
  conforms: true
  how: "src/shell/CommandPalette.tsx: held at the `run` function and its use in the `onSelect` of each\
    \ CommandItem, lines 57-60 and 72 — function run(action: () => void) {\n    setOpen(false);\n    action();\n\
    \  }\nonSelect={() => run(() => void navigate({ to: a.to }))}"
  encoded_at:
  - src/shell/CommandPalette.tsx
- node: rules/application-shell/choosing-a-row-selects-it
  conforms: true
  how: "src/components/ds/ConversationMenu/ConversationMenu.tsx: held at handleSelect, lines 156-159,\
    \ and the row's onSelect at line 372 — function handleSelect(id: string): void {\n    onSelect(id);\n\
    \    setOpen(false);\n  }"
  encoded_at:
  - src/components/ds/ConversationMenu/ConversationMenu.tsx
- node: rules/application-shell/choosing-or-creating-a-conversation-opens-it
  conforms: true
  how: 'src/shell/HeaderConversationMenu.tsx: held at `onSelect`, lines 86-88, and `onCreate`, lines 89-98
    — void navigate({ to: "/chat", search: { conversation: id } });

    createMutation.mutate(undefined, { onSuccess: (created) => { void navigate({ to: "/chat", search:
    { conversation: created.id } }); } });'
  encoded_at:
  - src/shell/HeaderConversationMenu.tsx
- node: rules/application-shell/clearing-the-token-forgets-it
  conforms: true
  how: "src/state/auth.ts: held at The clear action of the store (lines 114-117), with writeToken(null)\
    \ (lines 95-103) — clear: () => {\n  writeToken(null);\n  set({ accessToken: null, claims: null });\n\
    },\n... if (token === null) sessionStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);"
  encoded_at:
  - src/state/auth.ts
- node: rules/application-shell/client-needs-two-urls
  conforms: true
  how: "src/lib/env.ts: held at `EnvSchema` (lines 35-38) and the object `getEnv` passes to `safeParse`\
    \ (lines 69-72) — const EnvSchema = z.object({\n  VITE_BFF_URL: z.url(\"VITE_BFF_URL must be a valid\
    \ URL\"),\n  VITE_NEON_AUTH_URL: z.url(\"VITE_NEON_AUTH_URL must be a valid URL\"),\n});"
  encoded_at:
  - src/lib/env.ts
- node: rules/application-shell/deleting-asks-first
  conforms: true
  how: "src/components/ds/ConversationMenu/ConversationMenu.tsx: held at requestDelete, lines 194-199,\
    \ and the dialog title, lines 482-494 — setOpen(false);\n    setDeletingId(id);\n... <Dialog open={deletingId\
    \ !== null} ...> ... <DialogTitle>{STRINGS.deleteTitle}</DialogTitle>"
  encoded_at:
  - src/components/ds/ConversationMenu/ConversationMenu.tsx
- node: rules/application-shell/deleting-the-active-conversation-leaves-it
  conforms: true
  how: 'src/shell/HeaderConversationMenu.tsx: held at `onDelete`, lines 120-131 — deleteMutation.mutate({
    id }, { onSuccess: () => { if (id === activeConversationId) { void navigate({ to: "/chat", search:
    {} }); } } });'
  encoded_at:
  - src/shell/HeaderConversationMenu.tsx
- node: rules/application-shell/every-failure-goes-to-the-router
  conforms: true
  how: "src/lib/query-client.ts: held at the `onError` handlers of `queryCache` and `mutationCache`, lines\
    \ 157-175 — if (err instanceof EnvelopeError) {\n  applyErrorAction(routeError(err, contextFromQuery(query)));\n\
    \  return;\n}\nreportError(err);\ntoast.error(\"Algo deu errado. Tente novamente.\");"
  encoded_at:
  - src/lib/query-client.ts
- node: rules/application-shell/every-other-address-is-guarded
  conforms: true
  how: 'src/router/routes.tsx: held at the getParentRoute of indexRoute, chatRoute, graphRoute, searchRoute,
    ingestRoute, curationRoute, historyRoute and notFoundRoute, and the routeTree children list — getParentRoute:
    () => protectedLayoutRoute,

    component: ProtectedLayout,'
  encoded_at:
  - src/router/routes.tsx
- node: rules/application-shell/failure-routing-lives-in-one-function
  conforms: true
  how: 'src/lib/error-routing.ts: held at `routeError`, lines 71-132 — `switch (code) { case "AUTH_UNAUTHORIZED":
    ... case "RESOURCE_GONE": ... default: if (code.startsWith("BUSINESS_")) {...} if (code.startsWith("SYSTEM_"))
    {...} }`. Exact codes are matched first, then `BUSINESS_` before `SYSTEM_`.'
  encoded_at:
  - src/lib/error-routing.ts
- node: rules/application-shell/health-and-pending-are-asked-every-twenty-seconds
  conforms: true
  how: 'src/shell/api/use-shell-status.ts: held at REFETCH_MS and the options of both useQuery calls,
    lines 20-51 — const REFETCH_MS = 20_000;

    refetchInterval: REFETCH_MS,

    retry: false,'
  encoded_at:
  - src/shell/api/use-shell-status.ts
- node: rules/application-shell/health-is-judged-by-the-database-field
  conforms: true
  how: 'src/shell/api/use-shell-status.ts: held at useHealth(), lines 38-40 — if (q.data == null) return
    "checking";

    return (d.database ?? d.result?.database) === "ok" ? "ok" : "down";'
  encoded_at:
  - src/shell/api/use-shell-status.ts
- node: rules/application-shell/invalid-configuration-stops-the-client
  conforms: true
  how: "src/lib/env.ts: held at `EnvInvalidError` (lines 44-55) and the failure branch of `getEnv` (lines\
    \ 74-79) — console.error(\"[env] Frontend env validation failed:\", parsed.error.issues);\n    throw\
    \ new EnvInvalidError(parsed.error.issues);\n...\n\"Frontend env invalid — fix VITE_BFF_URL / VITE_NEON_AUTH_URL:\
    \ \" +\n        issues.map((i) => `${i.path.join(\".\") || \"(root)\"}: ${i.message}`).join(\"; \"\
    ),"
  encoded_at:
  - src/lib/env.ts
- node: rules/application-shell/leaving-a-rename-sends-nothing
  conforms: true
  how: "src/components/ds/ConversationMenu/ConversationMenu.tsx: held at onRenameKeyDown, the cancel button\
    \ and the effect, lines 217-242 — else if (e.key === \"Escape\") {\n      e.preventDefault();\n  \
    \    cancelRename();\n... if (wasOpenRef.current && !open && renamingId !== null) { setRenamingId(null);"
  encoded_at:
  - src/components/ds/ConversationMenu/ConversationMenu.tsx
- node: rules/application-shell/one-client-serves-reads-and-writes
  conforms: true
  how: 'src/lib/query-client.ts: held at `createQueryClient` with both `queryCache` and `mutationCache`,
    and the singleton on line 181 — export const queryClient: QueryClient = createQueryClient();'
  encoded_at:
  - src/lib/query-client.ts
- node: rules/application-shell/only-a-cancelled-reply-shows-a-notice
  conforms: true
  how: 'src/components/ds/ChatBubble/ChatBubble.tsx: held at `STOP_NOTICE_BY_REASON`, the `stopNotice`
    lookup and the `stop-notice` paragraph, lines 50-52, 131-132 and 235-245 — const STOP_NOTICE_BY_REASON:
    Readonly<Record<string, string>> = { cancelled: "Resposta interrompida", };

    const stopNotice = stopReason !== undefined ? STOP_NOTICE_BY_REASON[stopReason] : undefined;

    {stopNotice !== undefined ? ( <p data-testid="stop-notice" ...> {stopNotice}'
  encoded_at:
  - src/components/ds/ChatBubble/ChatBubble.tsx
- node: rules/application-shell/only-ok-true-returns-the-result
  conforms: true
  how: "src/lib/http.ts: held at lines 324-335 — if (body.ok === true) {\n    return body.result as T;\n\
    \  }"
  encoded_at:
  - src/lib/http.ts
- node: rules/application-shell/only-the-confirmation-deletes
  conforms: true
  how: "src/components/ds/ConversationMenu/ConversationMenu.tsx: held at confirmDelete, cancelDelete and\
    \ the dialog's onOpenChange, lines 201-214 and 482-487 — function confirmDelete(): void {\n    if\
    \ (deletingId !== null) onDelete(deletingId);\n...\nonOpenChange={(o) => {\n    if (!o) cancelDelete();"
  encoded_at:
  - src/components/ds/ConversationMenu/ConversationMenu.tsx
- node: rules/application-shell/renaming-and-reactivating-stay-where-they-are
  conforms: true
  how: 'src/shell/HeaderConversationMenu.tsx: held at `onRename`, lines 99-101, and `onUnarchive`, lines
    117-119 — updateMutation.mutate({ id, title: newTitle });

    updateMutation.mutate({ id, archivedAt: null });'
  encoded_at:
  - src/shell/HeaderConversationMenu.tsx
- node: rules/application-shell/renaming-opens-a-field-with-the-title
  conforms: true
  how: 'src/components/ds/ConversationMenu/ConversationMenu.tsx: held at startRename and the rename branch,
    lines 166-169 and 326-364 — setRenameDraft(currentTitle ?? "");

    ... if (renamingId === c.id) { return ( <div ...> <Input autoFocus value={renameDraft}'
  encoded_at:
  - src/components/ds/ConversationMenu/ConversationMenu.tsx
- node: rules/application-shell/setting-a-token-decodes-its-claims
  conforms: true
  how: 'src/state/auth.ts: held at decodeJwtClaims (lines 61-84), called by setToken at line 112 and when
    the initial state is built at line 109 — if (parts.length !== 3) return null;

    ...

    if (typeof parsed["sub"] === "string") (claims as { sub?: string }).sub = parsed["sub"] as string;

    if (typeof parsed["exp"] === "number") (claims as { exp?: number }).exp = parsed["exp"] as number;

    if (typeof parsed["name"] === "string") ...

    if (typeof parsed["email"] === "string") ...'
  encoded_at:
  - src/state/auth.ts
- node: rules/application-shell/sign-in-hands-the-attempt-to-its-panel
  conforms: true
  how: "src/router/SignInPage.tsx: held at the JSX returned by SignInPage, lines 43-48 — const { signIn,\
    \ isLoading, error } = useSignIn();\n<SignInPanel\n  onSubmit={signIn}\n  isSubmitting={isLoading}\n\
    \  error={error}"
  encoded_at:
  - src/router/SignInPage.tsx
- node: rules/application-shell/sign-in-shows-the-expiry-notice-for-its-reason
  conforms: true
  how: "src/router/SignInPage.tsx: held at readSessionExpired(), lines 26-34, and the useMemo call at\
    \ line 40 — const params = new URLSearchParams(window.location.search);\nreturn params.get(\"reason\"\
    ) === \"session_expired\";\n} catch {\n  return false;\nconst sessionExpired = useMemo(readSessionExpired,\
    \ []);\nsrc/router/routes.tsx: held at only the redirect that carries the reason (protectedLayoutRoute.beforeLoad,\
    \ search: { reason: \"session_expired\" }) and the mount of SignInPage. The notice itself is shown\
    \ in src/router/SignInPage.tsx, outside this file. — component: () => <SignInPage />,"
  encoded_at:
  - src/router/SignInPage.tsx
  - src/router/routes.tsx
- node: rules/application-shell/sign-in-sits-outside-the-guarded-shell
  conforms: true
  how: 'src/router/routes.tsx: held at signInRoute, lines 155-177, a direct child of RootRoute — getParentRoute:
    () => RootRoute,

    path: "/sign-in",'
  encoded_at:
  - src/router/routes.tsx
- node: rules/application-shell/some-addresses-show-only-a-placeholder
  conforms: true
  how: "src/router/StubPage.tsx: held at The `hint` default in the `StubPage` parameter list holds the\
    \ line \"Conteúdo em breve.\". The titles Grafo, Busca and Histórico are not held in this file; they\
    \ are passed from src/router/routes.tsx. — export function StubPage({\n  title,\n  hint = \"Conteúdo\
    \ em breve.\",\n  testId,\n}: StubPageProps) {\n...\n<h1 className=\"text-lg font-semibold tracking-tight\"\
    >{title}</h1>\n<p className=\"text-body text-body\">{hint}</p>\nsrc/router/routes.tsx: held at graphRoute,\
    \ searchRoute and historyRoute components for the titles. The \"Conteúdo em breve.\" line is not in\
    \ this file. — <StubPage title=\"Grafo\" testId=\"graph-page\" />\n<StubPage title=\"Busca\" testId=\"\
    search-page\" />\n<StubPage title=\"Histórico\" testId=\"history-page\" />"
  encoded_at:
  - src/router/StubPage.tsx
  - src/router/routes.tsx
- node: rules/application-shell/the-active-ingestion-segment-is-never-shown
  conforms: true
  how: "src/shell/Footer.tsx: held at the `activeRun &&` branch, lines 123-130. Whether a run is ever\
    \ passed is decided by the caller, not by this file. — {activeRun && (\n  <Link\n    to=\"/history\"\
    \nsrc/shell/api/use-shell-status.ts: held at useActiveRun(), lines 58-60 — export function useActiveRun():\
    \ { label: string } | null {\n  return null;\n}"
  encoded_at:
  - src/shell/Footer.tsx
  - src/shell/api/use-shell-status.ts
- node: rules/application-shell/the-active-row-is-only-highlighted
  conforms: true
  how: 'src/components/ds/ConversationMenu/ConversationMenu.tsx: held at the row''s className and aria-label,
    lines 373-380 — aria-label={itemAriaLabel}

    ...

    className={cn( "min-h-10 gap-sm", isActive && "bg-elevated", )}'
  encoded_at:
  - src/components/ds/ConversationMenu/ConversationMenu.tsx
- node: rules/application-shell/the-as-of-date-lives-in-memory
  conforms: false
  how: "src/state/as-of.ts, The header comment, lines 2 and 9-12, and the `asOf` field's doc comment on\
    \ line 18.: * useAsOfStore — time-travel cursor (in-memory mirror of the URL `?as_of=…`).\n * The\
    \ URL is the source of truth — this store is the in-memory cache\n * components read. The router (`useSearch()`)\
    \ syncs the URL into this store\n * when `?as_of` changes; components only READ from this store, never\
    \ write\n * directly. Writing happens via `navigate({ search: { as_of: ... } })`.\n/** Time-travel\
    \ cursor — `null` means \"now\" (no `?as_of` param). */ — The comment says the as-of date is mirrored\
    \ from, and written through, the address (`?as_of`). The node says it is held in memory only and never\
    \ written to the address. No code carries the URL behaviour. A grep of frontend/src for `as_of`/`asOf`/`useAsOfStore`\
    \ finds no `useSearch`, no `navigate` and no router sync. `src/shell/Footer.tsx` even notes that it\
    \ writes the store directly. The comment is therefore the only place the address behaviour appears,\
    \ and it reads as a decision the business made. The next reader will take the as-of date to be URL-addressable\
    \ and shareable, when the specification forbids exactly that."
  observed_at:
  - src/state/as-of.ts
- node: rules/application-shell/the-backdrop-is-decoration
  conforms: true
  how: "src/shell/AmbientBackdrop.tsx: held at the wrapper `<div aria-hidden=\"true\">` at line 58 and\
    \ the `<img alt=\"\" role=\"presentation\">` at lines 63-66 — <div\n      aria-hidden=\"true\"\n \
    \     className=\"fixed inset-0 z-backdrop overflow-hidden bg-background\"\n      data-testid=\"ambient-backdrop\"\
    \n    >\n      {src !== \"\" && (\n        <img\n          src={src}\n          alt=\"\"\n       \
    \   role=\"presentation\""
  encoded_at:
  - src/shell/AmbientBackdrop.tsx
- node: rules/application-shell/the-conversation-menu-shows-on-chat-only
  conforms: true
  how: "src/shell/Header.tsx: held at `onChatRoute` at line 58 and its conditional render at lines 105-110.\
    \ The actions div at lines 113-125 holds only ThemeSelect and the palette Button. — const onChatRoute\
    \ = pathname === \"/chat\" || pathname.startsWith(\"/chat/\");\n{onChatRoute ? (\n        <HeaderConversationMenu\n\
    <ThemeSelect />\n        <Button"
  encoded_at:
  - src/shell/Header.tsx
- node: rules/application-shell/the-cutoff-ends-with-the-headers
  conforms: true
  how: "src/lib/http.ts: held at `cleanup()` called right after `await fetch(...)` resolves, line 262.\
    \ The body is read afterwards with no timer. — cleanup();\n\n  // ---- DC silent refresh (TC-01)"
  encoded_at:
  - src/lib/http.ts
- node: rules/application-shell/the-first-entry-creates-a-conversation
  conforms: true
  how: "src/components/ds/ConversationMenu/ConversationMenu.tsx: held at handleCreate and the first DropdownMenuItem,\
    \ lines 161-164 and 285-292 — function handleCreate(): void {\n    onCreate();\n    setOpen(false);\n\
    \  }"
  encoded_at:
  - src/components/ds/ConversationMenu/ConversationMenu.tsx
- node: rules/application-shell/the-first-signal-aborts-the-request
  conforms: true
  how: 'src/lib/http.ts: held at `composeSignals`, lines 131-148, called from `buildSignal` — const signal
    = composeSignals([timeoutController.signal, opts.signal]);'
  encoded_at:
  - src/lib/http.ts
- node: rules/application-shell/the-first-valid-configuration-is-kept
  conforms: true
  how: "src/lib/env.ts: held at the cache guard and the freeze in `getEnv` (lines 67 and 81-82) — if (cached\
    \ !== null) return cached;\n...\n  cached = Object.freeze(parsed.data);\n  return cached;"
  encoded_at:
  - src/lib/env.ts
- node: rules/application-shell/the-footer-shows-one-of-three-health-states
  conforms: true
  how: 'src/shell/Footer.tsx: held at the HEALTH table, lines 38-43, and the default parameter, line 51
    — ok: { dot: "bg-state-accepted", label: "online" },

    down: { dot: "bg-destructive", label: "banco inacessível" },

    checking: { dot: "bg-muted-foreground", label: "verificando…" },

    health = "checking",'
  encoded_at:
  - src/shell/Footer.tsx
- node: rules/application-shell/the-footer-shows-pending-curation
  conforms: true
  how: "src/shell/Footer.tsx: held at the conditional Link, lines 113-120 — {curationPending > 0 && (\n\
    \  <Link\n    to=\"/curation\"\n... {curationPending} pendentes"
  encoded_at:
  - src/shell/Footer.tsx
- node: rules/application-shell/the-guard-needs-a-fresh-token
  conforms: true
  how: 'src/router/routes.tsx: held at protectedLayoutRoute.beforeLoad, lines 87-95 — const fresh = useAuthStore.getState().isFresh();

    if (!fresh) { throw redirect({ to: "/sign-in", search: { reason: "session_expired" } }); }'
  encoded_at:
  - src/router/routes.tsx
- node: rules/application-shell/the-header-lists-six-areas
  conforms: true
  how: "src/shell/Header.tsx: held at the `NAV` array at lines 33-40 and the `active` computation with\
    \ `aria-current` at lines 82-88. — { to: \"/chat\", label: \"Chat\", icon: MessageSquare },\n{ to:\
    \ \"/history\", label: \"Histórico\", icon: History },\nconst active =\n            pathname === item.to\
    \ || pathname.startsWith(`${item.to}/`);\naria-current={active ? \"page\" : undefined}"
  encoded_at:
  - src/shell/Header.tsx
- node: rules/application-shell/the-header-menu-lists-without-archived-by-default
  conforms: true
  how: 'src/shell/HeaderConversationMenu.tsx: held at `useState(false)` for `includeArchived` (line 58),
    `useListConversations({ includeArchived })` (line 62), and the `activeTitle` derivation (lines 70-72)
    — const [includeArchived, setIncludeArchived] = useState(false);

    const listQuery = useListConversations({ includeArchived });

    const activeTitle = conversations.find((c) => c.id === activeConversationId)?.title ?? null;'
  encoded_at:
  - src/shell/HeaderConversationMenu.tsx
- node: rules/application-shell/the-menu-lists-as-received
  conforms: true
  how: 'src/components/ds/ConversationMenu/ConversationMenu.tsx: held at the list branches, lines 297-313
    and 314-452 — {isLoading && conversations.length === 0 ? ( <div ... data-testid="conversation-menu-skeleton">
    ...) : conversations.length === 0 ? ( ... {STRINGS.empty} ... ) : ( conversations.map((c) => {'
  encoded_at:
  - src/components/ds/ConversationMenu/ConversationMenu.tsx
- node: rules/application-shell/the-menu-trigger-names-the-active-conversation
  conforms: true
  how: 'src/components/ds/ConversationMenu/ConversationMenu.tsx: held at triggerLabel and triggerAriaLabel,
    lines 144-153 — const triggerLabel = activeConversationId === null ? STRINGS.triggerFallback : (activeTitle
    ?? STRINGS.titleFallback);

    const triggerAriaLabel = `Conversas — ${activeTitle ?? STRINGS.triggerFallback}`;'
  encoded_at:
  - src/components/ds/ConversationMenu/ConversationMenu.tsx
- node: rules/application-shell/the-owner-picks-the-as-of-date
  conforms: true
  how: "src/shell/Footer.tsx: held at the Popover with the date Input and the Voltar para hoje Button,\
    \ lines 77-109 — <p className=\"text-xs font-medium font-semibold text-foreground\">Recorte temporal</p>\n\
    type=\"date\"\nonChange={(e) =>\n  setAsOf(e.target.value ? new Date(e.target.value) : null)\n}\n\
    Voltar para hoje"
  encoded_at:
  - src/shell/Footer.tsx
- node: rules/application-shell/the-palette-lives-inside-the-shell
  conforms: true
  how: "src/router/routes.tsx: held at ProtectedLayout, which mounts AppShell only under the guarded layout.\
    \ The palette itself is mounted in src/shell/AppShell.tsx, outside this file. — function ProtectedLayout()\
    \ { return (<AppShell><Outlet /></AppShell>); }\nsrc/shell/AppShell.tsx: held at Line 70, the `<CommandPalette\
    \ />` element returned by `AppShell`, which is the only place in the frontend source that mounts it\
    \ (tests and stories aside). — import { CommandPalette } from \"./CommandPalette\";\n...\n      <Footer\n\
    \        health={health}\n        curationPending={curationPending}\n        activeRun={activeRun}\n\
    \      />\n      <CommandPalette />\nThe shortcut's own handler sits inside `CommandPalette` (a file\
    \ this pass does not judge), so it is mounted wherever the palette is. Whether `AppShell` itself sits\
    \ inside the guarded address is held by `src/router/routes.tsx`, which is not in this file set."
  encoded_at:
  - src/router/routes.tsx
  - src/shell/AppShell.tsx
- node: rules/application-shell/the-palette-offers-five-destinations
  conforms: true
  how: "src/shell/CommandPalette.tsx: held at the `AREAS` array, lines 30-36, and the `CommandGroup` with\
    \ its `CommandEmpty`, lines 66-78 — { to: \"/graph\", label: \"Grafo\", icon: Network },\n  { to:\
    \ \"/search\", label: \"Buscar\", icon: Search },\n  { to: \"/ingest\", label: \"Ingerir\", icon:\
    \ Upload },\n  { to: \"/curation\", label: \"Curar\", icon: Scale },\n  { to: \"/history\", label:\
    \ \"Histórico\", icon: History },\n<CommandEmpty>Nada encontrado.</CommandEmpty>\n<CommandGroup heading=\"\
    Ir para\">\nvalue={a.label}"
  encoded_at:
  - src/shell/CommandPalette.tsx
- node: rules/application-shell/the-palette-starts-closed-in-memory
  conforms: true
  how: "src/state/command-palette.ts: held at the `create<CommandPaletteState>((set, get) => ({ open:\
    \ false, ... }))` call, lines 20-24. The initial value `open: false` makes it start closed, and the\
    \ plain `create` has no `persist` middleware or storage, so the state lives in memory only. — export\
    \ const useCommandPaletteStore = create<CommandPaletteState>((set, get) => ({\n  open: false,\n  setOpen:\
    \ (open) => set({ open }),\n  toggle: () => set({ open: !get().open }),\n}));"
  encoded_at:
  - src/state/command-palette.ts
- node: rules/application-shell/the-pending-total-needs-a-token
  conforms: true
  how: 'src/shell/api/use-shell-status.ts: held at useCurationCount(), lines 44-55 — queryFn: () => getJson("/api/v1/curation/queue?limit=1",
    token),

    enabled: token != null,

    return d?.total ?? d?.result?.total ?? 0;'
  encoded_at:
  - src/shell/api/use-shell-status.ts
- node: rules/application-shell/the-root-address-leads-to-chat
  conforms: true
  how: 'src/router/routes.tsx: held at indexRoute.beforeLoad, lines 103-109, a child of protectedLayoutRoute,
    so the freshness guard runs first — path: "/",

    beforeLoad: () => { throw redirect({ to: "/chat" }); },'
  encoded_at:
  - src/router/routes.tsx
- node: rules/application-shell/the-shell-regions-have-names
  conforms: true
  how: "src/shell/Footer.tsx: held at the GlassSurface props, lines 62-63, and the date Input, line 93.\
    \ The footer half of the node is held here and the header half is outside this file. — role=\"contentinfo\"\
    \naria-label=\"Rodapé\"\naria-label=\"Data do recorte\"\nsrc/shell/Header.tsx: held at the banner,\
    \ nav and palette toggle attributes in Header(). The theme choice named Tema is in ThemeSelect and\
    \ the Rodapé footer with its date input is in Footer. Neither is in this file. — role=\"banner\"\n\
    \      aria-label=\"Cabeçalho\"\n<nav aria-label=\"Áreas\" className=\"flex items-center gap-xs\"\
    >\naria-label=\"Abrir paleta de comandos (⌘K)\"\nsrc/shell/ThemeSelect.tsx: held at the aria-label\
    \ prop on the Select in ThemeSelect's return, line 24. It holds only the theme choice named Tema.\
    \ The banner, navigation, palette toggle and footer names are held in other files. — aria-label=\"\
    Tema\""
  encoded_at:
  - src/shell/Footer.tsx
  - src/shell/Header.tsx
  - src/shell/ThemeSelect.tsx
- node: rules/application-shell/the-shortcut-toggles-the-palette
  conforms: true
  how: "src/shell/CommandPalette.tsx: held at the keydown handler in the `useEffect`, lines 45-54 — if\
    \ ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === \"k\") {\n      e.preventDefault();\n     \
    \ toggle();\n    }\nwindow.addEventListener(\"keydown\", onKey);"
  encoded_at:
  - src/shell/CommandPalette.tsx
- node: rules/application-shell/the-token-is-mirrored-to-session-storage
  conforms: true
  how: "src/state/auth.ts: held at AUTH_TOKEN_STORAGE_KEY (line 51), readInitialToken (lines 86-93), writeToken\
    \ (lines 95-103) and the store's initial state (lines 105-109) — export const AUTH_TOKEN_STORAGE_KEY\
    \ = \"remember.auth.token\";\n...\nconst initialToken = readInitialToken();\n...\ntry {\n  if (token\
    \ === null) sessionStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);\n  else sessionStorage.setItem(AUTH_TOKEN_STORAGE_KEY,\
    \ token);\n} catch { /* fail soft — token stays in memory only */ }"
  encoded_at:
  - src/state/auth.ts
- node: rules/application-shell/the-trigger-is-off-while-loading
  conforms: true
  how: 'src/components/ds/ConversationMenu/ConversationMenu.tsx: held at the trigger Button, lines 249-275
    — disabled={isLoading}

    ...

    {isLoading ? ( <Loader2 ... animate-spin ... /> ) : ( <ChevronDown'
  encoded_at:
  - src/components/ds/ConversationMenu/ConversationMenu.tsx
- node: rules/application-shell/transport-failures-read-their-wording
  conforms: true
  how: 'src/lib/http.ts: held at the `message` fields at lines 241, 251, 258, 319 and 333 — message: "Tempo
    limite excedido na requisição.",

    ...

    message: "Requisição cancelada.",

    ...

    message: "Falha de rede ao contactar o servidor.",

    ...

    message: "Resposta do servidor não é JSON válido.",

    ...

    message: error?.message ?? "Erro desconhecido do servidor.",'
  encoded_at:
  - src/lib/http.ts
unstated:
- file: src/components/ds/ConversationMenu/ConversationMenu.tsx
  where: confirmDelete and cancelDelete, lines 201-214
  evidence: queueMicrotask(() => triggerRef.current?.focus());
  cost: After the delete dialog is confirmed, cancelled or dismissed, focus is sent back to the menu trigger.
    This is behavior the owner experiences, in particular a keyboard user. I found no node holding it,
    and I searched the specification root for the focus terms. Only this file's comments say it.
- file: src/components/ds/ConversationMenu/ConversationMenu.tsx
  where: the STRINGS table (lines 98-103) and the delete dialog (lines 494-516)
  evidence: "deleteBody: \"Tem certeza? Esta ação não pode ser desfeita.\",\n  deleteCancel: \"Cancelar\"\
    ,\n  deleteConfirm: \"Confirmar\","
  cost: The dialog body text and the labels "Cancelar" and "Confirmar" are wording the owner reads, and
    they exist only here. The node holds the dialog title "Excluir conversa" and which action sends the
    delete, not this text. The next reader looks for it in the specification and does not find it. A change
    to the wording will never reach a node.
- file: src/components/ds/ConversationMenu/ConversationMenu.tsx
  where: the per-row action buttons, lines 401, 415, 429 and 443, with the STRINGS entries rename, archive,
    unarchive and delete (lines 91-94)
  evidence: "aria-label={`${STRINGS.rename} ${itemTitle}`}\n...\naria-label={`${STRINGS.unarchive} ${itemTitle}`}\n\
    ...\naria-label={`${STRINGS.archive} ${itemTitle}`}\n...\naria-label={`${STRINGS.delete} ${itemTitle}`}\n\
    ...\nrename: \"Renomear\",\n  archive: \"Arquivar\",\n  unarchive: \"Reativar\",\n  delete: \"Excluir\"\
    ,"
  cost: The node says every row MUST offer rename and delete, plus archive or reactivate, but gives no
    names for those actions. The labels "Renomear", "Arquivar", "Reativar" and "Excluir" and the "label
    + title" naming pattern are decided only in this file.
- file: src/components/ds/ConversationMenu/ConversationMenu.tsx
  where: the rename row, lines 331, 340, 347 and 356, with their STRINGS entries confirmRename and cancelRename
    (lines 98-99)
  evidence: "aria-label={`Renomeando ${itemTitle}`}\n...\naria-label={`Novo título para ${itemTitle}`}\n\
    ...\nconfirmRename: \"Confirmar renomeação\",\n  cancelRename: \"Cancelar renomeação\","
  cost: The names of the rename group, the rename field and the confirm and cancel controls are what assistive
    technology announces, and no node holds them. The nodes mention the field and the "confirm control"
    and "cancel control" only generically. The wording lives only in this file.
- file: src/components/ds/GraphNode/GraphNode.tsx
  where: the `STATE_ACCENT` map, lines 56-67, and its use in the `accent` computation, lines 80-84
  evidence: 'accepted: "none",

    uncertain: "uncertain",

    "low-confidence": "none",

    disputed: "disputed",

    superseded: "superseded",'
  cost: The rule that only uncertain, disputed and superseded recolour a node's border, while accepted
    and low-confidence leave it at the default, lives only in this table. The node says a selected node
    shows selection "instead of the state's colour" but never says which states have a colour. A change
    to the attention states would have to be found in this file rather than in the specification.
- file: src/components/ds/GraphNode/GraphNode.tsx
  where: the `TypeStyle` interface and `NODE_STYLE` map, lines 34-54 (the `icon` and `color` columns)
  evidence: 'person: { icon: User, label: "Pessoa", color: "text-node-person" },

    ...

    task: { icon: SquareCheck, label: "Tarefa", color: "text-node-task" },'
  cost: Which icon and which colour token stand for each of the ten node types is a presentation rule
    that only this map holds. The node set says nothing of them, and a node carries only the name and
    the default subtitle. A reader who wants to know how a Pessoa node is told apart from an Organização
    node looks in the specification, finds nothing, and must read the code to learn it. The comment's
    pointer to `tokens.md §6.3` is not a node.
- file: src/components/ds/StateBadge/StateBadge.tsx
  where: decideTransition(), lines 125-137, and the variant selection in the component body, lines 206-241
  evidence: "if (prev === \"uncertain\" && next === \"accepted\") return \"promote\";\nif (next === \"\
    superseded\") return \"supersede\";\n...\n} else if (state === \"uncertain\" && motionAllowed) {\n\
    \  variants = pulseUncertain(false);\n  animateProp = \"visible\";"
  cost: The badge runs an ambient pulse on `uncertain` and one-shot promote, supersede and merge animations.
    It also gates all motion on `animate` and on `useReducedMotion()`. The code is the only place that
    says which state changes are animated and that `uncertain` pulses. A reader looking in the specification
    for how a confidence change is shown finds neither rule. The two nodes in this set hold only the five
    labels and the accessible name.
- file: src/components/ds/StateBadge/StateBadge.types.ts
  where: the `StateBadgeSize` type, line 19, and the `size?` prop, line 34
  evidence: 'export type StateBadgeSize = "sm" | "md";

    ...

    size?: StateBadgeSize;'
  cost: The file declares a two-value size vocabulary, `sm` and `md`. The state-badge aggregate lists
    only `state` and `icon_only` as attributes, so no node holds this vocabulary. It is code with no node
    behind it, and the next reader will look for it in the specification and not find it.
- file: src/components/ds/StateBadge/StateBadge.types.ts
  where: the `animate?` prop, line 31
  evidence: 'animate?: boolean;'
  cost: The file declares an `animate` switch on the badge. The comment above it describes a pulse for
    `uncertain` and says `prefers-reduced-motion` wins. The state-badge aggregate carries no such attribute,
    and no rule holds the behavior. The switch is a decision about the badge that lives only in code.
- file: src/components/ui/avatar/avatar.tsx
  where: lines 19-27, SWATCHES and swatch(), applied in Avatar() at line 50
  evidence: 'export const SWATCHES = ["bg-primary", "bg-accent", "bg-data"] as const;

    ...

    for (const c of name) h = (h * 31 + c.charCodeAt(0)) | 0;

    return SWATCHES[Math.abs(h) % SWATCHES.length]!;'
  cost: An avatar's colour is derived from its name by a string hash over a three-colour palette. No node
    holds that rule, so it lives only in this code. The next reader looks in the specification for what
    colours an avatar takes and for whether one name always gets one colour, and finds nothing. The file's
    own header calls this determinism "the load-bearing behavior".
- file: src/components/ui/command/command.tsx
  where: CommandDialog, the default of the `label` parameter (line 117), rendered as the sr-only DialogTitle
    (line 125)
  evidence: 'label = "Paleta de comandos",

    ...

    <DialogTitle className="sr-only">{label}</DialogTitle>'
  cost: The accessible name a screen reader announces for the open command palette is a string only this
    file holds. src/shell/CommandPalette.tsx calls `<CommandDialog open={open} onOpenChange={setOpen}>`
    without a label, so the default is what is announced. The specification names the palette toggle "Abrir
    paleta de comandos (⌘K)" and names the other shell regions, but holds no name for the palette dialog.
    The next reader looks in the specification for what the palette is called, finds nothing, and the
    wording lives only in this UI primitive.
- file: src/lib/http.ts
  where: the 5xx branch of `http()`, lines 303-309
  evidence: "message:\n        extractEnvelopeMessage(raw) ?? \"Algo deu errado. Tente novamente.\","
  cost: This helper emits "Algo deu errado. Tente novamente." for a 5xx answer with no message of its
    own. No node in this file's set states that wording. `transport-failures-read-their-wording` lists
    five wordings and omits this one, and `a-server-error-is-always-a-failure` gives no fallback message.
    Only the contracts of other helpers hold this wording (bff-ingestion, bff-curation, bff-conversations),
    so the request helper's wording lives only in this code.
- file: src/lib/http.ts
  where: the catch branch of `fetch` in `http()`, lines 237-260 (the codes SYSTEM_TIMEOUT, SYSTEM_ABORTED,
    SYSTEM_NETWORK)
  evidence: "code: \"SYSTEM_TIMEOUT\",\n        httpStatus: 0,\n        message: \"Tempo limite excedido\
    \ na requisição.\",\n...\n      code: \"SYSTEM_ABORTED\",\n...\n    code: \"SYSTEM_NETWORK\","
  cost: The nodes in this file's set give the wording and status 0 for these three failures, but they
    do not name the codes. The codes are named in contracts for other helpers (contracts/ingest-workspace/bff-ingestion,
    contracts/curation-workspace/bff-curation) and in the application-shell rules that route on them.
    The codes the request helper emits therefore live only in this code. The retry offer and the toast
    routing depend on them.
- file: src/lib/tokens.ts
  where: the values of `linkType`, `nodeType`, `state`, `stateFg`, `borderColor`, `color`, and the other
    categories in the file (lines 27-231)
  evidence: '"participates-in": "oklch(70% 0.14 200)",

    "related-to": "oklch(60% 0.02 250)",

    accepted: "oklch(72% 0.160 155)",

    uncertain: "oklch(76% 0.150 82)",

    "low-confidence": "oklch(58% 0.025 260)",

    disputed: "oklch(70% 0.180 45)",

    superseded: "oklch(46% 0.018 260)",'
  cost: The colour assigned to each link type, node type and confidence state, and the scales for spacing,
    text, radius, shadow, motion duration and z-index, are values no node in the specification holds.
    The graph-explorer rules say that a link follows its link type's colour and that a weak state overrides
    it. They give no colour for any type or state. The header comment names docs/specs/front/design-system/tokens.md
    as the "Canonical source", which is outside the specification root. So these values live only in this
    file, a reader looking in the specification finds no decision, and the code has become the place where
    the decision sits.
- file: src/shell/AmbientBackdrop.tsx
  where: the useEffect at lines 33-54, the conditional `<img>` render at lines 62-70, and the `onError`
    handler at line 68
  evidence: "const ric = (window as unknown as {\n      requestIdleCallback?: (cb: () => void) => number;\n\
    \    }).requestIdleCallback;\n    if (typeof ric === \"function\") {\n      ric(assign);\n    } else\
    \ {\n      const timer = window.setTimeout(assign, 0);\n...\n{src !== \"\" && (\n        <img\n  \
    \        src={src}\n          ...\n          onError={() => setSrc(\"\")}\n        />"
  cost: The shell's rules that the image must not load before first paint (so it stays out of the LCP
    budget) and that a failed load must fall back to the flat `bg-background` colour live only in this
    code. No node in the specification holds them. They are cited only as `front.back.md BR-15`, in a
    comment and in a document that is not a node. The next reader will look for these behaviours in the
    specification and will not find them. A change to the loading or fallback policy would then be made
    here, where it reads as an implementation detail and not as a business decision.
- file: src/shell/CommandPalette.tsx
  where: the `CommandInput` placeholder, line 64
  evidence: <CommandInput placeholder="Buscar áreas e ações…" />
  cost: This is text the running system shows the owner, and no node holds its wording. It claims the
    palette searches "ações" as well as areas, but the node offers only the Ir para group of destinations.
    The wording lives only in this file, so the next reader looks for it in the specification and does
    not find it.
- file: src/shell/Footer.tsx
  where: the helper paragraph inside PopoverContent, line 88-90
  evidence: "<p className=\"mt-xs text-xs text-muted-foreground\">\n  Veja o que era verdade numa data\
    \ (as_of).\n</p>"
  cost: This text is shown to the owner, and no node holds it. Neither the as-of-date rules nor the shell-screen
    contract mentions it, and a search of the specification found no node with it. The popover title "Recorte
    temporal" is held and this sentence is not. Its wording, and the field name `as_of` shown to the owner,
    live only in the component, where the next reader will not look for them.
- file: src/shell/Header.tsx
  where: the NAV constant, lines 33-40
  evidence: "{ to: \"/chat\", label: \"Chat\", icon: MessageSquare },\n  { to: \"/graph\", label: \"Grafo\"\
    , icon: Network },\n  { to: \"/search\", label: \"Buscar\", icon: Search },\n  { to: \"/ingest\",\
    \ label: \"Ingerir\", icon: Upload },\n  { to: \"/curation\", label: \"Curar\", icon: Scale },\n \
    \ { to: \"/history\", label: \"Histórico\", icon: History },"
  cost: The node fixes the area labels and their order, and says an area is current when "its address
    equals or begins the current address". It never states which address belongs to each area. The pairing
    of Grafo to "/graph", Buscar to "/search", Ingerir to "/ingest", Curar to "/curation" and Histórico
    to "/history" is decided only here. The icon chosen for each area is likewise held nowhere in the
    specification.
- file: src/shell/Header.tsx
  where: the brand block, lines 71-77
  evidence: "<Diamond className=\"size-4 text-primary\" aria-hidden=\"true\" />\n        <span className=\"\
    font-sans text-sm font-medium font-bold tracking-tight text-foreground\">\n          Remember\n  \
    \      </span>"
  cost: The header shows the visible word "Remember" and a diamond mark as its brand. No node in the specification
    states a brand or its text. The `show-shell` operation of `contracts/application-shell/shell-screen`
    lists what the banner holds (the navigation, the palette toggle, the theme choice) and omits it. The
    product name now lives only in this component, where a reader of the specification will not find it.
restates:
- file: src/components/ds/ChatBubble/ChatBubble.tsx
  where: the `ariaBusy` comment, lines 134-135
  evidence: '// ARIA: `aria-busy=''true''` only when streaming. Spec §9: removed when

    // streaming ends so live-region semantics do not stay stuck.'
  cost: 'The busy-while-streaming rule is restated in prose over the code that holds it (`const ariaBusy
    = streaming ? "true" : undefined;` and `{streaming ? <StreamingCursorStub /> : null}`). The comment
    claims a spec section as its authority, which is a second home for the rule.'
  node: rules/application-shell/a-streaming-bubble-is-busy
- file: src/components/ds/ChatBubble/ChatBubble.tsx
  where: the error-accent comment above `glassAccent`, lines 138-140
  evidence: '// Glass accent — only `error` swaps the border; idle/streaming/stopped all

    // share the default glass border so the bubble''s tonal language stays

    // "neutral content surface" by default.'
  cost: 'The rule that an errored bubble is shown by its border accent alone is restated in prose beside
    `const glassAccent = error ? "error" : "none";`. The comment is a second home for the rule.'
  node: rules/application-shell/an-errored-bubble-adds-no-wording
- file: src/components/ds/ChatBubble/ChatBubble.tsx
  where: the role/fill comment above `glassFill`, lines 143-148
  evidence: '//  - user (right)      → plain ambient glass.

    //  - assistant (left)  → ambient glass + a touch of the accent (principal)

    //                        color (`--color-surface-glass-ambient-accent`).'
  cost: 'The role-to-side-and-fill rule is written a second time in prose beside the code that holds it,
    so a reader can take the comment for the place the rule is decided. Code holds the fill here (`const
    glassFill = variant === "user" ? "ambient" : "ambient-accent"`) and the side in `chatBubble({ variant
    })` from ChatBubble.variants.ts. The prose is a second home that `--check` does not follow when the
    node moves.'
  node: rules/application-shell/a-bubble-takes-one-role
- file: src/components/ds/ChatBubble/ChatBubble.tsx
  where: the stop-notice comments, lines 49, 128-130 and 232-234, and the docblock item 4, lines 25-26
  evidence: '// Stop-reason notice — table-driven. `stopReason=''cancelled''` renders the

    // notice; any other value (including undefined and unknown strings)

    // renders nothing (spec §4 stopped table).'
  cost: 'The only-cancelled-shows-a-notice rule and its exact copy are restated in several comments, with
    the copy quoted again as "Resposta interrompida". The code holds both in `STOP_NOTICE_BY_REASON` (`cancelled:
    "Resposta interrompida"`) and the `stopNotice` lookup. The comments are second homes that cite a spec
    table instead of the node.'
  node: rules/application-shell/only-a-cancelled-reply-shows-a-notice
- file: src/components/ds/ChatBubble/ChatBubble.tsx
  where: the tool-chips slot comment, line 170, and the docblock sentence about chips above the text,
    line 56-58
  evidence: '{/* Tool chips slot — chips render above the message text (spec §6). */}'
  cost: The placement rule (chips above the text, in the order given) is restated as a comment next to
    the JSX that holds it, citing a spec section that is not the node. A reader may treat the comment
    as the authority, and it would not move with the node.
  node: rules/application-shell/a-bubble-shows-its-tool-chips-first
- file: src/components/ds/ChatBubble/ChatBubble.types.ts
  where: the docstring above ChatBubbleVariant, lines 30-33
  evidence: 'Spec §6: `user` bubbles align to the right (self-end); `assistant` bubbles

    align to the left (self-start).'
  cost: The rule that the role decides the side is stated in prose here while code already holds it, so
    a reader gets two places for one fact. When the node moves, nothing reaches this comment.
  node: rules/application-shell/a-bubble-takes-one-role
- file: src/components/ds/ChatBubble/ChatBubble.types.ts
  where: the docstring on `content`, lines 42-45
  evidence: 'Message text. Empty string is legal — a freshly-opened streaming bubble

    has `content=""` and grows via `streaming=true` + parent re-renders.'
  cost: 'The acceptance of an empty text is stated in prose beside the code that holds it (`content: string`,
    which has no minimum length). The prose is a second home that the node does not reach.'
  node: rules/application-shell/a-bubble-shows-plain-text
- file: src/components/ds/ChatBubble/ChatBubble.types.ts
  where: the docstring on `error`, lines 56-61
  evidence: "Switches the underlying\n   * `GlassSurface` to `accent='error'` (red border). Does NOT swap\
    \ any text\n   * content"
  cost: 'The rule that an errored bubble adds no wording and shows the error only by its border accent
    is restated in prose here. The code that holds it is `const glassAccent = error ? "error" : "none";`
    in src/components/ds/ChatBubble/ChatBubble.tsx. The prose will not follow the node if the node moves.'
  node: rules/application-shell/an-errored-bubble-adds-no-wording
- file: src/components/ds/ChatBubble/ChatBubble.types.ts
  where: the docstring on `stopReason`, lines 64-68
  evidence: "Only `'cancelled'` renders a visible\n   * notice (\"Resposta interrompida\", spec §4 stopped).\
    \ Any other value\n   * (`'end_turn'`, `'max_tokens'`, `'stop_sequence'`, …) renders no notice"
  cost: 'The only-cancelled rule and the notice wording are repeated in prose beside the code that holds
    them, `STOP_NOTICE_BY_REASON` with `cancelled: "Resposta interrompida"` in src/components/ds/ChatBubble/ChatBubble.tsx.
    If the node''s wording changes, this comment keeps the old one.'
  node: rules/application-shell/only-a-cancelled-reply-shows-a-notice
- file: src/components/ds/ChatBubble/ChatBubble.types.ts
  where: the docstring on `streaming`, lines 48-53
  evidence: "Adds\n   * `aria-busy='true'` and renders the inline streaming cursor (spec §4\n   * \"streaming\"\
    ). Removed when streaming ends — `aria-busy` collapses to its\n   * default (absent)."
  cost: 'The busy marking is restated in prose in a file that does not implement it. The code holding
    it is `const ariaBusy = streaming ? "true" : undefined;` in src/components/ds/ChatBubble/ChatBubble.tsx.
    A change to the node leaves this comment stale.'
  node: rules/application-shell/a-streaming-bubble-is-busy
- file: src/components/ds/ChatBubble/ChatBubble.types.ts
  where: the docstring on `toolChips`, lines 77-78
  evidence: Tool-call chips to render inline (above the message text).
  cost: The placement of chips above the text is stated in prose while code holds it. The code is the
    `tool-chips` block placed before the `GlassSurface` in src/components/ds/ChatBubble/ChatBubble.tsx.
    The comment is a second home that the node does not reach.
  node: rules/application-shell/a-bubble-shows-its-tool-chips-first
- file: src/components/ds/ConversationMenu/ConversationMenu.tsx
  where: comment above triggerLabel and triggerAriaLabel, lines 140-153
  evidence: "// Two rules combined:\n  //   1) activeConversationId === null  -> \"Nova conversa\"\n \
    \ //   2) activeConversationId !== null  -> activeTitle ?? \"Conversa sem título\"\n  ...\n  // Spec\
    \ §9: aria-label \"Conversas — {activeTitle ?? 'Nova conversa'}\"."
  cost: The trigger's label and accessible-name rules are written out in comments as well as in code.
    The code holds them in `triggerLabel` and `triggerAriaLabel`. The comments also cite a spec section
    outside the specification root as if it were the authority.
  node: rules/application-shell/the-menu-trigger-names-the-active-conversation
- file: src/components/ds/ConversationMenu/ConversationMenu.tsx
  where: comment at line 296
  evidence: '{/* Loading-with-no-data shows lightweight skeleton (spec §4 row 3) */}'
  cost: The "placeholder while loading with no conversations" rule is restated in a JSX comment. The code
    holds it in the branch `isLoading && conversations.length === 0`.
  node: rules/application-shell/the-menu-lists-as-received
- file: src/components/ds/ConversationMenu/ConversationMenu.tsx
  where: comment at lines 322-325 (rename branch)
  evidence: '// Renaming branch — replaces the row contents but keeps the item

    // pinned in place (no list reorder).'
  cost: '"Renaming replaces the row with a text field" is restated in prose. The code holds it in `if
    (renamingId === c.id) { return (<div ...><Input value={renameDraft} .../>`.'
  node: rules/application-shell/renaming-opens-a-field-with-the-title
- file: src/components/ds/ConversationMenu/ConversationMenu.tsx
  where: comment in commitRename, line 173
  evidence: '// Spec §5: emits "with non-empty title". Empty trim is silently cancelled.'
  cost: The trim-and-send-nothing-when-empty rule is restated in a comment. The code holds it in `const
    trimmed = renameDraft.trim(); if (trimmed.length > 0) onRename(id, trimmed);`.
  node: rules/application-shell/a-rename-sends-the-trimmed-title
- file: src/components/ds/ConversationMenu/ConversationMenu.tsx
  where: comments at lines 216 and 230-234 (rename keyboard and closing the menu while renaming)
  evidence: "// Rename input keyboard: Enter commits, Esc cancels (spec §4 \"renaming\").\n...\n  // When\
    \ the dropdown transitions from open → closed, drop any in-flight\n  // rename so re-opening shows\
    \ a clean state."
  cost: '"Escape or closing the menu drops the rename" is restated in prose. The code holds it in `onRenameKeyDown`,
    `cancelRename` and the effect that clears `renamingId` when `open` goes from true to false.'
  node: rules/application-shell/leaving-a-rename-sends-nothing
- file: src/components/ds/ConversationMenu/ConversationMenu.tsx
  where: header docstring lines 48-50 and comment in requestDelete, lines 194-196
  evidence: '* - The AlertDialog (Dialog from components/ui/dialog) opens OUTSIDE the

    *    DropdownMenu Portal so we don''t fight Radix focus stacking; we close the

    *    dropdown when the dialog opens.'
  cost: The prose repeats "deleting closes the menu and opens a confirmation dialog". The code holds it
    in `requestDelete`, which calls `setOpen(false); setDeletingId(id);`.
  node: rules/application-shell/deleting-asks-first
- file: src/components/ds/ConversationMenu/ConversationMenu.tsx
  where: header docstring, lines 43-46 (includeArchived note)
  evidence: '* `includeArchived` is mirror-of-prop (controlled). The component never

    *    persists it locally — flipping the Switch fires

    *    `onIncludeArchivedChange(next)` and the consumer rebinds the prop.'
  cost: The docstring states, a second time, that the switch value is only reported and never stored.
    The code already does this in `checked={includeArchived}` and `onChange={onIncludeArchivedChange}`.
    A reader can mistake the docstring for the place the rule is decided.
  node: rules/application-shell/archived-conversations-are-opt-in
- file: src/components/ds/ConversationMenu/ConversationMenu.tsx
  where: header docstring, lines 46-47 (close behavior on Select, Archive and Unarchive)
  evidence: '* - We close the dropdown on Select / Archive / Unarchive immediately and

    *    keep it open during rename (the inline input lives inside the menu).'
  cost: This second statement of "choosing a row selects it and closes the menu" sits in prose. The code
    holds it in `handleSelect`, which calls `onSelect(id); setOpen(false);`. The prose can drift from
    the node without anything noticing.
  node: rules/application-shell/choosing-a-row-selects-it
- file: src/components/ds/ConversationMenu/ConversationMenu.tsx
  where: header docstring, lines 46-47 (same comment, archive and reactivate part)
  evidence: '* - We close the dropdown on Select / Archive / Unarchive immediately and'
  cost: The "act at once and close the menu" rule for archive and reactivate is restated in prose. The
    code holds it in `handleArchive` and `handleUnarchive`, each ending in `setOpen(false)`.
  node: rules/application-shell/archive-and-reactivate-need-no-confirmation
- file: src/components/ds/ConversationMenu/ConversationMenu.types.ts
  where: ConversationMenuProps.activeConversationId, the docblock on lines 20-23
  evidence: '* (the trigger then shows the "Nova conversa" fallback per spec §3).'
  cost: 'The text "Nova conversa" for a trigger with no active conversation is also written in a comment
    here, beside the code that holds it. The fallback is held in `ConversationMenu.tsx` as `triggerFallback:
    "Nova conversa"` and the `triggerLabel` branch on `activeConversationId === null`. If the node''s
    wording changes, this comment keeps the old text. A reader of the types file then sees a second statement
    of the fact and cannot tell which one was decided.'
  node: rules/application-shell/the-menu-trigger-names-the-active-conversation
- file: src/components/ds/ConversationMenu/ConversationMenu.types.ts
  where: ConversationMenuProps.activeTitle, the docblock on lines 26-31
  evidence: '* Title of the active conversation for the trigger. Null falls back to

    * "Conversa sem título" (spec §3 — "Falls back to ''Conversa sem título'' if

    * null"). When `activeConversationId` is also null the trigger shows

    * "Nova conversa" instead.'
  cost: 'The title fallback and the "Nova conversa" precedence rule are restated in a comment. The code
    holds both in `ConversationMenu.tsx`: `activeTitle ?? STRINGS.titleFallback` inside the `activeConversationId
    === null` branch. Two homes for one fact means a later change to the node reaches only the code, and
    the comment goes stale. The same comment also cites a docs/specs spec as the source, which points
    a reader to a document that is not the node.'
  node: rules/application-shell/the-menu-trigger-names-the-active-conversation
- file: src/components/ds/GraphNode/GraphNode.tsx
  where: the comment after the `accent` computation, lines 85-87
  evidence: '// Resting/default border is the GlassSurface panel''s own glass edge

    // (`border-border-glass`) — no override here. Attention states (uncertain /

    // disputed / superseded) recolor it via `accent`; selected uses `focus`.'
  cost: 'The comment restates, outside behaviour, that a selected node shows selection in its border instead
    of the state colour. Code holds that fact in `selected ? "focus" : ...` and in `selected && "ring-2
    ring-border-focus"`, so the prose is only a second place to keep in step with the node.'
  node: rules/application-shell/a-graph-node-shows-its-state-by-an-icon
- file: src/components/ds/GraphNode/GraphNode.tsx
  where: the doc comment on `TypeStyle.label`, line 36
  evidence: /** pt-BR type name (default subtitle). */
  cost: The comment is a second home for the fact that the pt-BR type name is the default subtitle. Code
    already holds that fact in `NODE_STYLE` and in `{subtitle ?? style.label}`, so the comment can disagree
    with the node later without any check noticing.
  node: rules/application-shell/a-graph-node-names-its-type
- file: src/components/ds/GraphNode/GraphNode.types.ts
  where: line 11, the doc comment above the GraphNodeType union
  evidence: /** The 10 normative NodeTypes (remember-modelagem-v7 §15.1 / tokens.md §6.3). */
  cost: The number of node types, and the claim that they are normative, is stated a second time in prose
    beside the union that already enumerates ten members. If the set of types changes, the comment still
    gives its own count and its own citation to a document outside the specification tree. A reader checking
    the type set meets two places that each look authoritative.
  node: rules/application-shell/a-graph-node-names-its-type
- file: src/components/ds/GraphNode/GraphNode.types.ts
  where: line 31, the doc comment on GraphNodeProps.subtitle
  evidence: /** Override the subtitle (defaults to the pt-BR type name). */
  cost: The default-subtitle rule is restated as prose here. The behavior sits in GraphNode.tsx, where
    the subtitle renders as `{subtitle ?? style.label}` and `style.label` is annotated "pt-BR type name
    (default subtitle)". Anyone changing the rule edits the code, and this comment keeps asserting the
    old rule.
  node: rules/application-shell/a-graph-node-names-its-type
- file: src/components/ds/StateBadge/StateBadge.tsx
  where: the comment at line 167 and the "canonical pt-BR labels (§6)" comment at line 41
  evidence: '// Resolve label: prop wins; otherwise the per-state pt-BR default (§6).'
  cost: The comment restates the label override and the per-state default labels, which are held by code
    at `const resolvedLabel = label ?? STATE_LABELS[state];` and the `STATE_LABELS` table. A second statement
    of the fact outside behavior can drift from the node without anything noticing.
  node: rules/application-shell/a-state-badge-has-five-states-with-labels
- file: src/components/ds/StateBadge/StateBadge.tsx
  where: the header docstring, line 13, and the block comment at line 41 and the docstring at lines 42-45
    above STATE_LABELS
  evidence: '*  - §9   WCAG 2.2 AA: aria-label always present, icon aria-hidden, motion gated by useReducedMotion().'
  cost: The docstring restates the fact that the badge is always named and its icon hidden from assistive
    technology. The same fact is held by code at the `aria-label` attribute and by `<IconCmp size={iconSize}
    aria-hidden="true" />`. If the node moves, the prose keeps saying the old fact and `--check` does
    not reach it.
  node: rules/application-shell/a-state-badge-is-always-named
- file: src/components/ds/StateBadge/StateBadge.types.ts
  where: the comment above `label?`, line 42
  evidence: '/** Override the pt-BR label rendered next to the icon. */

    label?: string;'
  cost: 'The comment restates that a caller may override the label, which the node holds. The optional
    `label?: string` member declares it in code, so the comment is a second home for the fact. Its removal
    is owed.'
  node: rules/application-shell/a-state-badge-has-five-states-with-labels
- file: src/components/ds/StateBadge/StateBadge.types.ts
  where: the docblock on lines 2-9, and the comment above `state` on line 22
  evidence: '* `ConfidenceState` is the SINGLE source of truth for the five-state vocabulary

    * (remember-modelagem-v7.md §3.5 / §6.6). Every other module that needs the type

    * — features, hooks, BFF response adapters — MUST import it from here.

    ...

    /** Required — one of the five vocabulary values. */'
  cost: The comments restate the five-state fact and also claim that this file is its single source of
    truth. A reader who believes the claim treats this file as the place the vocabulary was decided. The
    vocabulary is also held by the enumeration node domain/graph-explorer/confidence-state, so the comments
    act as a second authority outside any behavior. The code in this file already holds the fact, so the
    pair still conforms. What is owed is the comments' removal.
  node: rules/application-shell/a-state-badge-has-five-states-with-labels
- file: src/components/ui/avatar/avatar.tsx
  where: line 11, the docstring above initials()
  evidence: /** First letter of first + last word; single word -> first 2 letters; empty -> "?". */
  cost: The initials rule is written a second time in prose beside the code that holds it. When the node
    moves, the docstring is not bound to follow it, so a reader can take the comment for the decided rule.
  node: rules/application-shell/an-avatar-is-named-by-the-full-name
- file: src/components/ui/form/form.tsx
  where: the header docblock, lines 11-12 (the FormControl bullet)
  evidence: '* - FormControl (Slot) injects id / aria-invalid / aria-describedby into the

    *     wrapped input so label, description and message are correctly associated.'
  cost: The rule that an invalid field is described by its help text and its error message is restated
    in prose beside the `aria-describedby` and `aria-invalid` props in FormControl. The two can drift
    apart without anyone noticing, and the prose gives a reader a second place to look for what the node
    decided.
  node: rules/application-shell/an-invalid-field-is-described
- file: src/components/ui/form/form.tsx
  where: the header docblock, lines 8-10 (the useFormField() bullet)
  evidence: '* - useFormField() joins both contexts + RHF state; THROWS if used outside a

    *     FormField (the misuse is silent otherwise — aria wiring would point at

    *     undefined ids).'
  cost: The rule that a field's wiring read outside a form field raises is stated twice in this file,
    once as prose and once as the guard at lines 73-75. If the node moves, the prose keeps saying the
    old rule and nothing reads it. A later reader may take the docblock for the place the rule was decided.
  node: rules/application-shell/a-field-outside-a-form-is-a-developer-error
- file: src/lib/env.ts
  where: the header docstring's "Behaviour" first bullet, lines 11-13, and the `getEnv` docstring, lines
    61-65
  evidence: "* - On a valid pair, `getEnv()` returns a frozen `Env` object cached for\n *    subsequent\
    \ reads (read-once at boot).\n...\n * Read + validate the frontend env. Caches the result; throws\n\
    \ * `EnvInvalidError` on rejection."
  cost: The caching and freezing rule is written in prose a second time. The code already holds it in
    `if (cached !== null) return cached;` and `cached = Object.freeze(parsed.data);`. If the rule changes,
    the comments keep describing the old behaviour.
  node: rules/application-shell/the-first-valid-configuration-is-kept
- file: src/lib/env.ts
  where: the header docstring's "Behaviour" second bullet, lines 13-18, and the inline comment at line
    75
  evidence: "* - On any rejection (missing or non-URL value), `getEnv()` throws an\n *    `EnvInvalidError`.\n\
    ...\n *    `console.error` is invoked at construction so the failure is visible in\n *    every environment,\
    \ including production builds.\n...\n    // Fail loud (Golden Rule 12) — surface even before React\
    \ renders."
  cost: The console write and the raised error are described a second time in prose. The code already
    holds both, in `console.error("[env] Frontend env validation failed:", parsed.error.issues);` and
    in `throw new EnvInvalidError(parsed.error.issues);`. The comment's remark that `console.error` is
    invoked "at construction" does not match the code, where it is invoked in `getEnv` before the constructor
    runs. The prose is a second home for the rule.
  node: rules/application-shell/invalid-configuration-stops-the-client
- file: src/lib/env.ts
  where: the header docstring's "Contract" list and "Historical note", lines 5-9 and 25-28
  evidence: "* Contract:\n *  - VITE_BFF_URL          : valid URL — base URL of the Remember BFF.\n *\
    \  - VITE_NEON_AUTH_URL    : valid URL — base URL of Neon Auth\n...\n *  - The previous Stack Auth\
    \ SDK required VITE_STACK_PROJECT_ID and\n *    VITE_STACK_PUBLISHABLE_CLIENT_KEY. Both were removed\
    \ when the auth layer\n *    moved to raw fetch (no SDK). The schema no longer accepts them."
  cost: The docstring says a second time, in prose, that there are exactly two valid-URL keys and no other.
    The code already holds this in `EnvSchema` and in the two-key object `getEnv` passes to `safeParse`.
    If the node moves, the docstring still carries the old key list, and a reader may take it for the
    rule.
  node: rules/application-shell/client-needs-two-urls
- file: src/lib/error-routing.ts
  where: the comment above `case "AUTH_UNAUTHORIZED"`, lines 79-82
  evidence: "// All three AUTH expiry / invalid codes funnel the operator to /sign-in.\n    // TC-11:\
    \ AUTH_TOKEN_EXPIRED and AUTH_TOKEN_INVALID are session-loss codes\n    // emitted by the BFF JWT\
    \ middleware; behaviour is identical to a fresh 401"
  cost: The grouping of the three AUTH codes into one session-loss outcome is restated in prose. It also
    cites a TC id and a front spec section as authority, so a reader may look there instead of at the
    node.
  node: rules/application-shell/an-authorization-failure-sends-the-owner-to-sign-in
- file: src/lib/error-routing.ts
  where: the comment inside `case "SYSTEM_ABORTED"`, line 119
  evidence: // Caller-driven cancel (unmount, navigation) — never user-facing.
  cost: The silent-abort outcome is restated with a reason ("unmount, navigation") that no node gives.
    The comment is a second home for part of the rule.
  node: rules/application-shell/a-network-failure-reads-no-connection
- file: src/lib/error-routing.ts
  where: the comments on the `toast-and-navigate` member of `ErrorAction` (lines 24-29), on `ErrorRoutingContext`
    (lines 38-45) and inside the `RESOURCE_NOT_FOUND` case (lines 99-101)
  evidence: "`RESOURCE_NOT_FOUND` on a conversation query\n   * must surface a warning toast AND drop\
    \ the URL back to `/chat`\n   * (TC-11 / chat.feature.spec.md §6)."
  cost: The conversation-404 rule is restated three times in comments, each citing a feature spec or a
    TC id. Those are other homes for the fact than the node, so a reader can take one of them for the
    decision.
  node: rules/application-shell/a-missing-conversation-returns-to-chat
- file: src/lib/error-routing.ts
  where: the docstring of `isConversationResourceKey`, lines 134-145, and the inline comment at line 151
  evidence: "The list\n * key `[\"conversations\", \"list\", …]` deliberately does NOT match — listing\n\
    \ * never produces a 404 of one specific conversation; only detail/child\n * queries should redirect\
    \ on RESOURCE_NOT_FOUND."
  cost: The key-recognition rule is restated in prose with a rationale ("listing never produces a 404")
    that no node holds. It also cites `chat/api/keys.ts` and a feature spec as its source.
  node: rules/application-shell/a-conversation-resource-is-recognised-by-its-key
- file: src/lib/error-routing.ts
  where: the docstring of `routeError`, lines 67-70, and the comment in the `default` branch, line 129
  evidence: "Route a single error code → action. Pure function. Unknown codes default\n * to a danger\
    \ toast (fail loud — Golden Rule 12)."
  cost: The fallback for any other code is restated in prose and justified by a Golden Rule rather than
    by the node. Someone changing the fallback would find two places that claim to say it.
  node: rules/application-shell/any-other-code-shows-a-danger-toast
- file: src/lib/error-routing.ts
  where: the file's leading block comment, lines 1-13, above the import
  evidence: "* error-routing — the SINGLE place that maps BFF envelope error codes to\n * concrete UI\
    \ behaviour (front.md §5, front.back.md BR-17, EV-05).\n *\n * Feature hooks MUST NOT inline `if (err.code\
    \ === \"...\")` logic for any of\n * the codes mapped here."
  cost: The one-function rule is stated a second time in prose beside the code that holds it. If the node
    moves, nothing reads this block, so a reader can take the comment for the decided rule. What the block
    adds is a prohibition on feature hooks, and no code enforces that.
  node: rules/application-shell/failure-routing-lives-in-one-function
- file: src/lib/http.ts
  where: header docstring lines 15-17, and the comment "ok === false — surface the envelope error verbatim."
    at line 328
  evidence: "*  - Parses the logical envelope `{ ok, result?, error? }`.\n *      ok === true   → returns\
    \ `result`.\n *      ok === false  → throws `EnvelopeError`."
  cost: The rule that only `ok === true` returns the result is restated in prose. The code that holds
    it is `if (body.ok === true) { return body.result as T; }`. The comment says "ok === false" throws,
    which is narrower than the node. The node makes any other envelope a failure.
  node: rules/application-shell/only-ok-true-returns-the-result
- file: src/lib/http.ts
  where: header docstring lines 18-19, and the comment "HTTP ≥ 500 → SYSTEM_* without requiring a parseable
    JSON body." at line 294
  evidence: "*  - HTTP status ≥ 500 OR 0 (network) are mapped to `SYSTEM_*` codes even\n *    when the\
    \ body is not JSON."
  cost: 'The 5xx mapping is stated in prose as "`SYSTEM_*` codes". The code holds a narrower rule: the
    body''s own string code when it has one, otherwise `SYSTEM_UPSTREAM`. A reader of the comment sees
    a different rule from the one the code applies.'
  node: rules/application-shell/a-server-error-is-always-a-failure
- file: src/lib/http.ts
  where: header docstring lines 20-21, the comment on `DEFAULT_TIMEOUT_MS` at line 100, and the `buildSignal`
    docstring lines 152-153
  evidence: '/** Non-ingest cutoff. front.back.md §6. */

    export const DEFAULT_TIMEOUT_MS = 30_000;'
  cost: The 30 s cutoff is restated in several comments and cited to front.back.md §6. The value is held
    by `DEFAULT_TIMEOUT_MS = 30_000` and the `setTimeout` in `buildSignal`.
  node: rules/application-shell/a-request-is-cut-off-after-thirty-seconds
- file: src/lib/http.ts
  where: header docstring lines 21-22, the `ingest` option comment at lines 77-82, and the `buildSignal`
    docstring line 151
  evidence: "/**\n   * When true, skip the client-side AbortController cutoff. Required for\n   * ingest\
    \ endpoints — see CLAUDE.md \"ingest_document client timeout ≠\n   * failure\". Default false (30\
    \ s cutoff applies).\n   */"
  cost: 'The no-cutoff rule for ingestion requests is restated in prose and cited to CLAUDE.md. The code
    that holds it is `if (opts.ingest === true) { return { signal: opts.signal, cleanup: () => undefined
    }; }`. The citation points a reader at CLAUDE.md instead of the node.'
  node: rules/application-shell/an-ingestion-request-has-no-cutoff
- file: src/lib/http.ts
  where: header docstring lines 23-24, the `trySilentRefresh` docstring lines 186-188, and the "DC silent
    refresh (TC-01)" comment at lines 264-267
  evidence: "*  - On HTTP 401 from the BFF: call `fetchAccessToken()` once to mint a fresh\n *    JWT\
    \ from the still-valid session cookie; on success update the auth"
  cost: The rule that a first-attempt 401 triggers one silent refresh is restated in several comments
    and cited to TC-01. The code that holds it is `if (response.status === 401 && __retried !== true)
    { const refreshed = await trySilentRefresh();`.
  node: rules/application-shell/a-401-is-answered-with-one-silent-refresh
- file: src/lib/http.ts
  where: header docstring lines 24-25 and the retry comment at lines 271-281
  evidence: "*    JWT from the still-valid session cookie; on success update the auth\n *    store and\
    \ retry the original request once; on failure clear the store"
  cost: 'The retry-after-refresh rule is restated in prose. The code that holds it is `const retryOpts:
    HttpOptions = { ...opts, __retried: true }; return http<T>(path, retryOpts);`. The comment also claims
    a caller interceptor re-injects the bearer on retry. That claim is prose about behaviour held in another
    layer, not in this file.'
  node: rules/application-shell/a-refreshed-token-repeats-the-request
- file: src/lib/http.ts
  where: header docstring lines 25-26, the `trySilentRefresh` docstring lines 189-191, and the comment
    at lines 283-286
  evidence: "store and retry the original request once; on failure clear the store\n *    and redirect\
    \ to `/sign-in?reason=session_expired`. The retry attempt"
  cost: 'The failed-refresh outcome is restated in prose. The code that holds it is `useAuthStore.getState().clear();
    redirectImpl("/sign-in?reason=session_expired");` and `code: "AUTH_SESSION_EXPIRED"`. A reader may
    look for the sign-in reason in the comment rather than in the code.'
  node: rules/application-shell/a-failed-refresh-ends-the-session
- file: src/lib/http.ts
  where: header docstring lines 26-28, the `__retried` option comment at lines 89-95, and the comment
    at lines 277-279
  evidence: "The retry attempt\n *    SKIPS the silent-refresh branch (`__retried` guard) so a 401 → 401\
    \ loop\n *    is impossible."
  cost: The rule that a repeated request never refreshes again is restated in prose. The code that holds
    it is `__retried !== true` on the 401 branch.
  node: rules/application-shell/a-repeated-request-never-refreshes-again
- file: src/lib/http.ts
  where: header docstring, line 14 ("Reads `VITE_BFF_URL` via `lib/env.ts`")
  evidence: "* Contract:\n *  - Reads `VITE_BFF_URL` via `lib/env.ts` (no hardcoded base — BR-02)."
  cost: The back end address rule is stated a second time in a comment. The code that holds it is `joinUrl(VITE_BFF_URL,
    path)` in this file. A reader may take the comment, or its BR-02 citation, for the place the rule
    lives.
  node: rules/application-shell/a-request-goes-to-the-back-end-address
- file: src/lib/http.ts
  where: the `signal` option comment, lines 83-87
  evidence: "/**\n   * Optional caller-supplied signal — composed with the internal timeout\n   * signal\
    \ when applicable. If `ingest` is true, the caller's signal is\n   * forwarded as-is.\n   */"
  cost: The rule that the caller's signal and the cutoff are combined is restated in prose. The code that
    holds it is `composeSignals([timeoutController.signal, opts.signal])`.
  node: rules/application-shell/the-first-signal-aborts-the-request
- file: src/lib/query-client.ts
  where: the comment inside `case "redirect"` (lines 71-75)
  evidence: '// AUTH_* codes: clear the in-memory bearer + sessionStorage before

    // sending the user to /sign-in so a refresh cannot revive the stale

    // token (front.back.md §2 + TC-11 routing rules).'
  cost: The rule that an authentication failure clears the stored token and sends the owner to sign-in
    is narrated in prose. The branch it sits in already holds it with `useAuthStore.getState().clear()`
    and `window.location.assign(action.to)`. The comment names `sessionStorage`, and a reader may take
    that as a decided fact, but no code in this file touches it.
  node: rules/application-shell/an-authorization-failure-sends-the-owner-to-sign-in
- file: src/lib/query-client.ts
  where: the comment inside `case "toast-and-navigate"` (lines 61-65)
  evidence: '// TC-11: composite action used by the chat conversation 404 path.

    // The toast informs the operator and the navigation drops the stale

    // `?conversation=<id>` so the workspace stops querying a ghost id.'
  cost: 'The reaction to a missing conversation (toast, then navigate with an empty search and no reload)
    is narrated here as well as held by the branch below it, `void router.navigate({ to: action.to, search:
    {} as never })`. The prose cites TC-11, which does not point at the node that holds the rule.'
  node: rules/application-shell/a-missing-conversation-returns-to-chat
- file: src/lib/query-client.ts
  where: the module header (lines 18-20) and the doc comment at line 180
  evidence: '* Note: the QueryClient lives at module scope so the instance is stable

    * across HMR reloads of consumers — `QueryClientProvider` in `main.tsx` is

    * the single mount point (BR-12).

    /** Module-scope singleton consumed by `main.tsx`. BR-12. */'
  cost: 'The single-client rule is stated in prose citing BR-12, while `export const queryClient: QueryClient
    = createQueryClient();` at module scope already holds it. The prose is a second home that no tool
    re-checks when the node moves.'
  node: rules/application-shell/one-client-serves-reads-and-writes
- file: src/lib/query-client.ts
  where: the module header comment (lines 13-16) and the comment at line 162 inside `queryCache.onError`
  evidence: '* The global `QueryCache.onError` runs the pure `routeError(...)` mapper and

    * executes the resulting `ErrorAction`. Side effects (toast, redirect,

    * boundary, set-error) are kept in this file so feature hooks never need to

    * handle envelope errors themselves (BR-17).

    // Non-envelope error — log and toast danger as a safety net.'
  cost: The rule that every failure goes to the central routing, with a non-envelope failure reported
    and shown as a danger toast, is held by `onError` in both caches and also narrated in prose citing
    BR-17. The prose is a second home that nothing keeps in step with the node.
  node: rules/application-shell/every-failure-goes-to-the-router
- file: src/lib/query-client.ts
  where: the module header comment (lines 4-12), the doc comments at lines 38 and 42, and the inline comment
    at line 150
  evidence: '* - front.md §4.1 (TanStack Query defaults: retry=1, refetchOnWindowFocus,

    *    staleTime per data class)

    *  - front.back.md BR-08 (stale-time policy by data class — stable 5 min,

    *    volatile 0; volatile hooks override the global default)

    /** Stable-data staleTime (catalog, immutable detail). front.md §4.1 + BR-08. */

    refetchOnWindowFocus: false, // stable default; volatile hooks opt in'
  cost: 'The five-minute freshness, the 0 override and the no-refetch-on-focus rule are each said twice
    in this file, once by `STABLE_STALE_MS`, `VOLATILE_STALE_MS` and `refetchOnWindowFocus: false` and
    once by prose. The comments cite front.md and front.back.md as their source, so a reader may take
    them for the place the rule is decided. When the node moves, nothing reaches the comments.'
  node: rules/application-shell/a-read-stays-fresh-five-minutes-by-default
- file: src/lib/query-client.ts
  where: the module header comment (lines 4-6), restating the retry default
  evidence: '* - front.md §4.1 (TanStack Query defaults: retry=1, refetchOnWindowFocus,'
  cost: 'The retry-once rule is also stated in prose that cites front.md as its source, next to code (`retry:
    1` for queries, `retry: 0` for mutations) that already holds it. A reader may treat the comment as
    the place the rule is decided.'
  node: rules/application-shell/a-read-is-retried-once
- file: src/lib/report-error.ts
  where: The file-header docstring, lines 15-21 ("Behaviour this wave"), and the inline comment at line
    32 inside reportError().
  evidence: '* - In dev (`import.meta.env.DEV === true`): `console.error` the error and

    *    context.

    *  - In production: no-op (the endpoint does not exist yet).

    *

    * No network call is made in either mode — wiring the BFF endpoint is a

    * later wave.


    // Production: stay silent until the BFF endpoint ships.'
  cost: The prose restates a second time the rule the node holds, that a reported error is written to
    the console only in development and makes no network request. The code in this file already holds
    it, in the `if (!import.meta.env.DEV) { return; }` guard, the single `console.error` call, and the
    absence of any network call. The comments add a time horizon ("this wave", "until the BFF endpoint
    ships", "a later wave"). A reader may take it as a decision about when the rule changes, but no node
    states one. When the node moves, nothing binds this prose to it, so the two can drift without anyone
    noticing.
  node: rules/application-shell/a-reported-error-stays-in-the-console
- file: src/lib/tokens.ts
  where: the file header comment (lines 1-21), and the section comments "NodeType catalog (10)" (line
    66) and "LinkType catalog (13)" (line 81)
  evidence: '* Canonical source: docs/specs/front/design-system/tokens.md §2 (v1.0.2),

    /* ---------- color: NodeType catalog (10) ---------- */

    /* ---------- color: LinkType catalog (13) ---------- */'
  cost: These comments state that the catalogs hold ten and thirteen entries, and name a document outside
    the specification as authoritative. The same counts are held by the `nodeType` and `linkType` objects
    in this file and by the catalog nodes. The comments are a second home that no running system emits.
    The "Canonical source" line also points a reader to a document that the specification root does not
    contain.
  node: rules/knowledge-base/catalog-link-types
- file: src/router/SignInPage.tsx
  where: the header docblock, lines 13-14, and the useMemo comment, lines 38-39
  evidence: '`sessionExpired` is derived from `?reason=session_expired` (the BR-04 guard

    redirects there when `isFresh()` rejects).

    // `useMemo` so re-renders during the loading state do not re-parse the URL'
  cost: The expiry-notice rule is stated a second time in prose. If the node changes, this comment still
    reads as the rule and nothing flags it. The code already holds the fact in readSessionExpired(), so
    the prose is only a second home.
  node: rules/application-shell/sign-in-shows-the-expiry-notice-for-its-reason
- file: src/router/SignInPage.tsx
  where: the header docblock, lines 13-14, the clause "the BR-04 guard redirects there when `isFresh()`
    rejects"
  evidence: the BR-04 guard redirects there when `isFresh()` rejects
  cost: 'The comment restates the guard''s behaviour, which is not implemented in this file. A reader
    would take the comment as the place that behaviour is described. The guard is in routes.tsx, which
    holds `search: { reason: "session_expired" }`, and the guard node is a different file''s.'
  node: rules/application-shell/the-guard-needs-a-fresh-token
- file: src/router/StubPage.tsx
  where: the header block comment, lines 2-3
  evidence: '* StubPage — minimal centered placeholder shown by the foundation routes

    * (/graph, /search, /ingest, /curation, /history, /sign-in, /not-found).'
  cost: The comment says which addresses show only a placeholder, which is the fact the node holds. It
    lists addresses beyond the node's three, and /ingest no longer renders StubPage according to the router
    test comments. A reader who trusts the comment gets a different set of placeholder addresses than
    the node states. The code that fixes the set is in src/router/routes.tsx, so this prose is a second
    home outside behavior. Removing it loses nothing the code does not carry.
  node: rules/application-shell/some-addresses-show-only-a-placeholder
- file: src/router/__root.tsx
  where: the comment inside NotFoundComponent, lines 61-63, beside NotFoundFallback at lines 67-79
  evidence: '// The default not-found surface; the named `/not-found` route renders the

    // same component via NotFoundPage so both deep-link and unknown-path

    // patterns produce the same in-frame fallback.'
  cost: 'The comment restates that the not-found address and an unmatched address show the same notice.
    The unknown-address rule holds this, and `notFoundComponent: NotFoundComponent` plus the NotFoundFallback
    markup in this file carry it as code. The comment also asserts a second route (`NotFoundPage`) that
    this file does not hold. A reader would trust it as the place where the two addresses are said to
    agree.'
  node: rules/application-shell/an-unknown-address-says-page-not-found
- file: src/router/__root.tsx
  where: the header docblock, lines 7 and 17-18, beside the AppErrorBoundary mount at lines 47-49
  evidence: "* - front.md §5.1 (single <AppErrorBoundary> wraps the root)\n * The boundary wraps only\
    \ the route `<Outlet/>` so a render error preserves\n * the ambient backdrop and the toaster (front.md\
    \ §5.1)."
  cost: The docblock says in prose that a render error under the root is caught by one boundary, a fact
    the render-failure rule holds. The code that does it, `<AppErrorBoundary><Outlet /></AppErrorBoundary>`,
    is in this same file. The prose is a second home that no running system emits. When the rule moves,
    the comment still reads as if it were the decision.
  node: rules/application-shell/a-render-failure-replaces-the-screen
- file: src/router/routes.tsx
  where: the docblock above chatRoute, lines 111-120
  evidence: "`validateSearch` returns `string | undefined`: empty/missing value yields\n * `undefined`\
    \ so the URL stays clean (`/chat` not `/chat?conversation=`)."
  cost: The keep-only-a-non-empty-string rule for the conversation key is restated in prose. The code
    holds it in chatRoute.validateSearch (typeof raw === "string" && raw.length > 0).
  node: rules/application-shell/chat-and-curation-keep-one-search-key
- file: src/router/routes.tsx
  where: the docblock above curationRoute, lines 211-222
  evidence: "Same shape as `chatRoute.validateSearch`: empty or missing yields `{}`,\n * keeping the URL\
    \ clean (`/curation` not `/curation?item=`)."
  cost: The rule that the item search key is kept only when a non-empty string is restated in prose. The
    code holds it in curationRoute.validateSearch. The comment also cites curadoria.flow.md §3 row 3b
    as the authority for the fall-through behavior.
  node: rules/application-shell/chat-and-curation-keep-one-search-key
- file: src/router/routes.tsx
  where: the docblock above indexRoute, lines 99-102
  evidence: "Root index route — redirects to /chat per chat.feature.spec.md UI-01\n * and chat.flow.md\
    \ FL-01 (the chat workspace is the primary entry)."
  cost: 'The root-redirects-to-chat rule is restated in prose, citing other documents as its authority.
    The code holds it in indexRoute.beforeLoad (throw redirect({ to: "/chat" })).'
  node: rules/application-shell/the-root-address-leads-to-chat
- file: src/router/routes.tsx
  where: the docblock above protectedLayoutRoute, lines 76-83
  evidence: "BR-04 (preserved): absent or near-expired token (isFresh() === false)\n * redirects to /sign-in?reason=session_expired."
  cost: The guard rule is restated in prose beside the code that implements it (beforeLoad throwing redirect
    to /sign-in with search reason session_expired). A change to the node would leave this sentence behind
    as a second, unbound statement.
  node: rules/application-shell/the-guard-needs-a-fresh-token
- file: src/router/routes.tsx
  where: the docblock above routeTree, lines 268-271
  evidence: "Route tree — /sign-in stays a sibling of the pathless protected layout so\n * it renders\
    \ without the AppShell chrome."
  cost: The sign-in-outside-the-shell fact is stated again in prose next to the routeTree that holds it
    (RootRoute.addChildren([signInRoute, protectedLayoutRoute.addChildren([...])])).
  node: rules/application-shell/sign-in-sits-outside-the-guarded-shell
- file: src/router/routes.tsx
  where: the docblock above signInRoute and the comment inside its beforeLoad, lines 148-154 and 159-161
  evidence: "FL-AUTH-01 bypass: if a fresh JWT is already present, skip the form and\n * route the operator\
    \ straight to /chat. Wrapped in try/catch so a corrupt\n * store never prevents the sign-in form from\
    \ rendering."
  cost: 'The rule that a fresh owner skips sign-in, and that a failed freshness check counts as not fresh,
    is restated in two comments. The code holds it in the try/catch around isFresh() and the `if (fresh)
    { throw redirect({ to: "/chat" }); }` branch.'
  node: rules/application-shell/a-fresh-owner-skips-sign-in
- file: src/router/routes.tsx
  where: the module header docblock, lines 1-28 (layout tree and deviation note)
  evidence: "RootRoute (no guard, no AppShell — just AmbientBackdrop + boundary + toaster)\n *   ├── /sign-in\
    \            (signInRoute — direct child; FL-AUTH-01 bypass)\n *   └── \"protected\"         (protectedLayoutRoute\
    \ — pathless, id=\"protected\";\n *                            beforeLoad: JWT guard; component: <AppShell><Outlet/></AppShell>)"
  cost: The docblock states in prose that sign-in sits outside the guarded shell and that every other
    address sits under it. The code that holds this is the parent wiring of signInRoute and protectedLayoutRoute
    and the routeTree. A second statement of the fact exists outside behavior. It also cites front.md,
    front.back.md BR-04 and temp/login-screen-plan.md as authorities, which are not the nodes.
  node: rules/application-shell/sign-in-sits-outside-the-guarded-shell
- file: src/shell/AmbientBackdrop.tsx
  where: the "Contract" block of the header docstring, line 12
  evidence: '*  - <img> with object-fit cover, object-position center, alt="", role="presentation"'
  cost: The docstring says in prose that the image has an empty alternative text. The rendered `<img alt=""
    ...>` and the wrapper's `aria-hidden="true"` already hold that fact in this same file. A second statement
    in a comment can drift from the node unnoticed. The next reader may also take the comment as the place
    the rule is decided, not the node.
  node: rules/application-shell/the-backdrop-is-decoration
- file: src/shell/AppErrorBoundary.tsx
  where: 'the header comment, lines 1-19, bullet "All thrown errors are forwarded to `reportError` (dev:
    console, prod: stub — front.back.md §7 item 6)."'
  evidence: '* - All thrown errors are forwarded to `reportError` (dev: console, prod:

    *    stub — front.back.md §7 item 6).'
  cost: The comment restates the report rule, but the running code already holds it in `componentDidCatch`.
    The comment is a second home for the rule. A reader may take the comment, or the cited front.back.md
    section, as where the rule is decided. The comment also states a dev/prod behaviour of `reportError`.
    That behaviour lives in another file and is not what the rule says.
  node: rules/application-shell/a-render-failure-is-reported-and-announced
- file: src/shell/AppErrorBoundary.tsx
  where: 'the header comment, lines 1-19, bullets "Catches render-time errors in the workspace; preserves
    the 3-region frame (header + footer stay visible ...)" and "Fallback: in-frame message + Reload action."'
  evidence: '*  - Catches render-time errors in the workspace; preserves the 3-region

    *    frame (header + footer stay visible because they live OUTSIDE the

    *    boundary''s children — see __root.tsx composition).

    *  - Fallback: in-frame message + Reload action.'
  cost: The comment restates the replace-the-screen rule in different words. It says header and footer
    stay visible and the message is "in-frame". The node says the failure notice replaces the whole screen.
    The code in this file renders `min-h-screen` with a `Recarregar` button wired to `window.location.reload()`,
    so it agrees with the node and the comment is the part that is out of line. A reader who trusts the
    comment will expect a frame the node does not promise. Whether the header and footer actually stay
    visible depends on the mount point in `__root.tsx`, which is outside this file set and was not read.
  node: rules/application-shell/a-render-failure-replaces-the-screen
- file: src/shell/CommandPalette.tsx
  where: the comment above `run`, line 56
  evidence: // Close the palette, then run the action.
  cost: The close-then-navigate order is written a second time in prose. The `run` function body already
    holds it, so a later edit to one can leave the other saying something different.
  node: rules/application-shell/choosing-a-destination-closes-the-palette-first
- file: src/shell/CommandPalette.tsx
  where: the header docstring, line 7, and the comment above the keydown effect, line 44
  evidence: '* - Global keybind: ⌘K (mac) / Ctrl+K toggles; Esc closes (Dialog default).

    // Global ⌘K / Ctrl+K toggle.'
  cost: The shortcut rule is written a second time in prose. The `useEffect` keydown handler already holds
    it, so the two can drift apart. A reader may then take the comment, not the node, as where the shortcut
    was decided.
  node: rules/application-shell/the-shortcut-toggles-the-palette
- file: src/shell/CommandPalette.tsx
  where: the header docstring, line 8
  evidence: '* - Actions: navigate to the five areas. (Opening the as_of time picker from'
  cost: The docstring restates that the palette offers five destinations. The `AREAS` array and the `CommandGroup
    heading="Ir para"` already hold that, so the prose is a second home outside behavior.
  node: rules/application-shell/the-palette-offers-five-destinations
- file: src/shell/Footer.tsx
  where: the FooterProps comment on activeRun (line 34) and the JSX comment above the active-run Link
    (line 122)
  evidence: "/** Active ingestion run, if any. Hidden when null. */\n{/* Active run — hidden when idle\
    \ */}\n{activeRun && (\n  <Link\n    to=\"/history\""
  cost: The comments restate the active-ingestion segment rule that the `activeRun &&` branch and `to="/history"`
    already carry. A reader who edits the node would look at the comments and find a second statement
    of it.
  node: rules/application-shell/the-active-ingestion-segment-is-never-shown
- file: src/shell/Footer.tsx
  where: the FooterProps comment on health, line 30
  evidence: '/** System health (BFF /health). Defaults to "checking" until wired (2b). */

    health = "checking",'
  cost: The comment states the starting state `verificando…` as a second home of what the node holds.
    The default parameter `health = "checking"` and the HEALTH table hold it, so the comment can only
    drift from the code.
  node: rules/application-shell/the-footer-shows-one-of-three-health-states
- file: src/shell/Footer.tsx
  where: the file's docblock (lines 10-12), the FooterProps comment on curationPending (line 33) and the
    JSX comment above the curation Link (line 112)
  evidence: "Hidden when there is nothing to show\n * (curation == 0, no active run), per the spec (\"\
    some quando zero\").\n/** Curation queue total (entity_match + disputed). Hidden when 0. */\n{/* Curation\
    \ pending — hidden when zero */}\n{curationPending > 0 && ("
  cost: Three comments state the hide-when-zero rule that the `curationPending > 0 &&` branch already
    carries. If the node changes, for example the threshold or the label, these comments keep the old
    rule, and `--check` never reaches comments. The node does not hold the "(entity_match + disputed)"
    composition, which is addressed in looked_past.
  node: rules/application-shell/the-footer-shows-pending-curation
- file: src/shell/Header.tsx
  where: the JSX comment above the HeaderConversationMenu conditional, lines 103-104
  evidence: "{/* Active-conversation menu — only on /chat (TC-02). The hooks live\n          inside this\
    \ child so chat-feature traffic stays off other routes. */}"
  cost: 'The comment states the menu''s chat-only visibility, a fact the node holds and the `onChatRoute
    ? ... : null` branch in this same file already implements. It is a second home for the rule outside
    behaviour, and it cites a task identifier, TC-02, that no node reads.'
  node: rules/application-shell/the-conversation-menu-shows-on-chat-only
- file: src/shell/Header.tsx
  where: the docstring at lines 1-10, lines 3-5
  evidence: '* Spec: front.md §2 (fixed/thin), §2.2 (z-frame), frontend-analise-funcional.md §2

    * (brand · nav between the 5 areas, active highlighted · ⌘K).'
  cost: The prose says five areas, while the code in `NAV` lists six (Chat, Grafo, Buscar, Ingerir, Curar,
    Histórico) and the node holds six. A reader who trusts the docstring gets the wrong count, and it
    also restates the active-highlight behaviour that the code already carries.
  node: rules/application-shell/the-header-lists-six-areas
- file: src/shell/HeaderConversationMenu.tsx
  where: the header docblock, line 24 ("On create success → navigate to ...")
  evidence: '* - On create success → navigate to `/chat?conversation=<new-id>`.'
  cost: The create-then-open rule is stated a second time in prose beside the code that holds it. If the
    node moves, the comment keeps asserting the old rule, and nothing checks it because it is a comment.
  node: rules/application-shell/choosing-or-creating-a-conversation-opens-it
- file: src/shell/HeaderConversationMenu.tsx
  where: the header docblock, line 25, and the comment inside `onArchive`'s `onSuccess`, lines 107-109
  evidence: '* - On archive of the ACTIVE conversation → navigate to `/chat` (no id).

    // If the archived conversation was the active one, drop the

    // `?conversation` param so the workspace falls back to the

    // empty-state per chat.feature.spec.md §3.'
  cost: The archive-and-leave rule is restated twice in prose, and one copy cites `chat.feature.spec.md
    §3` as its authority. A reader who trusts the citation looks in `docs/specs/` and not in the node.
  node: rules/application-shell/archiving-stamps-the-browser-clock
- file: src/shell/HeaderConversationMenu.tsx
  where: the header docblock, line 26 ("On delete of the ACTIVE conversation ...")
  evidence: '* - On delete of the ACTIVE conversation → navigate to `/chat` (no id).'
  cost: The delete-and-leave rule exists a second time as prose, so it can drift from the node without
    anything noticing.
  node: rules/application-shell/deleting-the-active-conversation-leaves-it
- file: src/shell/HeaderConversationMenu.tsx
  where: the header docblock, lines 27-28, and the comment above `useListConversations`, lines 60-61
  evidence: '* - `includeArchived` is the local UI filter — owned here, mirrored into the

    *   list query so the cache key stays aligned with what the menu shows.

    // Data: the list query — `includeArchived` is part of the query key so

    // toggling it swaps to a separate cache entry (chat.feature.spec.md §4).'
  cost: The rule that the listing excludes archived conversations unless the owner includes them is described
    in prose and attributed to `chat.feature.spec.md §4`. The cache-key claim is made here about code
    in another file.
  node: rules/application-shell/the-header-menu-lists-without-archived-by-default
- file: src/shell/HeaderConversationMenu.tsx
  where: 'the header docblock, lines 30-31 ("Out of scope: ...")'
  evidence: '* Out of scope: rename does NOT navigate (the active id stays the same);

    *               unarchive does NOT navigate (the conversation stays active).'
  cost: The rule that rename and reactivate stay where they are is stated again in prose. It could survive
    a change to the node and mislead the next reader.
  node: rules/application-shell/renaming-and-reactivating-stay-where-they-are
- file: src/shell/api/use-shell-status.ts
  where: header docblock, lines 10-13, and the one-line comment above useActiveRun
  evidence: "`useActiveRun`\n * returns null until a runs-list read exists; the footer simply hides the\n\
    \ * segment (Phase 2b scope note)."
  cost: The prose says why the active-ingestion segment is never shown, a fact the node holds. Code holds
    it too, in `useActiveRun` returning `null`. The comment also carries a phase note that no node states,
    and it will go stale once a runs-list read exists.
  node: rules/application-shell/the-active-ingestion-segment-is-never-shown
- file: src/shell/api/use-shell-status.ts
  where: header docblock, lines 6-9
  evidence: "`/health` is public; the curation queue needs the Neon Auth\n * JWT (read from the auth store)."
  cost: 'The facts that health is read without a token and that the queue needs the access token are stated
    again in prose. Code holds both facts in this file, in `getJson("/health")` with no token argument
    and in `enabled: token != null`. The comment is a second home for facts the nodes hold, and it can
    drift from them unnoticed.'
  node: contracts/application-shell/bff-shell-reads
- file: src/state/auth.ts
  where: Docblock of decodeJwtClaims, lines 56-60
  evidence: '* Decode the payload of a JWT without verifying the signature (verification

    * happens server-side via JWKS — front.back.md §6). Returns null on any

    * parse failure; callers treat null as "no claims available".'
  cost: The no-signature-check decoding rule is stated in prose with a pointer to front.back.md §6. The
    code holds it in decodeJwtClaims. The pointer sends a reader to a document that is not the node.
  node: rules/application-shell/setting-a-token-decodes-its-claims
- file: src/state/auth.ts
  where: Docblock of isFresh, lines 43-46, the comment on EXPIRY_MARGIN_SECONDS at line 53, and the comment
    at line 121 inside isFresh
  evidence: '* Returns true if the current token is present AND its decoded `exp` is

    * more than 30 seconds in the future. front.back.md BR-04.

    ...

    /** Safety margin before declaring the token expired (BR-04). */

    ...

    // Without exp we conservatively trust the token (BFF will reject via 401).'
  cost: The 30-second margin and the "no readable expiry counts as fresh" rule are stated in comments
    citing BR-04. The code also holds them in isFresh. The next reader finds the rule in two places and
    does not know that a node in the specification holds it too. The node sits outside this file's node
    set, so the specification's own check will not reach a comment that drifts from it.
  node: rules/application-shell/a-token-is-fresh-with-thirty-seconds-to-spare
- file: src/state/auth.ts
  where: Header docblock, lines 11-14, with the comment on AUTH_TOKEN_STORAGE_KEY at line 50 and the comment
    inside the catch of writeToken at line 101
  evidence: '* Storage policy: in-memory Zustand store, mirrored to `sessionStorage` key

    * `remember.auth.token`. NOT persisted to `localStorage` (prevents leaking

    * across tabs/contexts the user did not actively start — see front.back.md

    * §2 rationale).

    ...

    /* fail soft — token stays in memory only */'
  cost: The storage key, the session-storage mirroring and the memory-only fallback are stated in prose
    as well as held by code. The prose points at front.back.md §2 as the authority. A reader who trusts
    the comment will look there instead of in the node. The rationale about leaking across tabs belongs
    in the decision log, not in the source.
  node: rules/application-shell/the-token-is-mirrored-to-session-storage
- file: src/state/command-palette.ts
  where: 'the docstring above the store, lines 1-10 (`useCommandPaletteStore — open/closed state of ⌘K
    (in-memory only)` and `front.back.md §2 (Store: useCommandPaletteStore — in-memory only)`)'
  evidence: "/**\n * useCommandPaletteStore — open/closed state of ⌘K (in-memory only).\n *\n * Spec references:\n\
    \ *  - front.md §4.3 (client state catalog)\n *  - front.back.md §2 (Store: useCommandPaletteStore\
    \ — in-memory only)"
  cost: 'The docstring says a second time, outside behavior, that the open state is held in memory only.
    The code already holds this: `create<CommandPaletteState>(...)` has no persistence middleware and
    sets `open: false`. A reader can take the docstring as a second authority for the rule. If the node
    moves, nothing reaches this prose. The docstring also cites `front.md` and `front.back.md` section
    numbers as if they governed the store.'
  node: rules/application-shell/the-palette-starts-closed-in-memory
unbound:
- src/components/ds/ChatBubble/ChatBubble.variants.ts
- src/components/ds/ChatBubble/index.ts
- src/components/ds/ConversationMenu/ConversationMenu.types.ts
- src/components/ds/ConversationMenu/index.ts
- src/components/ds/GlassSurface/GlassSurface.tsx
- src/components/ds/GlassSurface/GlassSurface.types.ts
- src/components/ds/GlassSurface/GlassSurface.variants.ts
- src/components/ds/GlassSurface/index.ts
- src/components/ds/GraphNode/index.ts
- src/components/ds/StateBadge/index.ts
- src/components/ui/.gitkeep
- src/components/ui/avatar/avatar.types.ts
- src/components/ui/avatar/index.ts
- src/components/ui/badge/badge.tsx
- src/components/ui/badge/badge.types.ts
- src/components/ui/badge/index.ts
- src/components/ui/command/command.tsx
- src/components/ui/command/command.types.ts
- src/components/ui/command/index.ts
- src/components/ui/dropdown-menu/dropdown-menu.tsx
- src/components/ui/dropdown-menu/dropdown-menu.types.ts
- src/components/ui/dropdown-menu/index.ts
- src/components/ui/form/form.types.ts
- src/components/ui/form/index.ts
- src/components/ui/popover/index.ts
- src/components/ui/popover/popover.tsx
- src/components/ui/popover/popover.types.ts
- src/lib/cn.ts
- src/lib/motion.ts
- src/lib/tokens.ts
- src/router/router.ts
- src/shell/AppToaster.tsx
- src/state/graph-view.ts
- src/state/theme.ts
- src/styles/theme.css
adopted: true
unheld:
- node: domain/application-shell/owner-session
  how: 'read on 2 file(s), and every judge answered `nowhere`: no file of the set holds this fact'
- node: domain/knowledge-base/link-type
  how: 'read on 2 file(s), and every judge answered `nowhere`: no file of the set holds this fact'
- node: rules/application-shell/session-expired-failure-carries-no-details
  how: 'read on 1 file(s), and every judge answered `nowhere`: no file of the set holds this fact'
notes: "Judged by 34 delegation(s), one per file; folded mechanically by trace.py --fold from the returns\
  \ under siegard-reconcile/adopt-fe-shared.returns/.\nStaged as an adoption of source no delivery wrote:\
  \ 117 candidate node(s) were read on every file, and each cleared one is bound to the files whose judgment\
  \ holds its fact.\nA finding in src/components/ds/ChatBubble/ChatBubble.types.ts names domain/chat/message-role,\
  \ which no file of this set is bound to: the type ChatBubbleVariant, line 34: export type ChatBubbleVariant\
  \ = \"user\" | \"assistant\"; — The two values a message role can take are declared a second time here.\
  \ src/features/chat/types.ts already declares `export type ChatMessageRole = \"user\" | \"assistant\"\
  ;`, and the specification's enumeration holds them in domain/chat/message-role. If a role is added,\
  \ three places can disagree and nobody can tell which one was decided.. It blocks nothing here; it is\
  \ owed a route of its own.\nA finding in src/lib/tokens.ts names rules/knowledge-base/catalog-link-types,\
  \ which no file of this set is bound to: the `linkType` export, lines 81-97 (section comment \"color:\
  \ LinkType catalog (13)\"): export const linkType = Object.freeze({\n  \"participates-in\": \"oklch(70%\
  \ 0.14 200)\",\n  \"member-of\": \"oklch(68% 0.14 220)\",\n  \"holds-role\": \"oklch(70% 0.14 280)\"\
  ,\n  \"responsible-for\": \"oklch(70% 0.16 25)\",\n  ...\n  sponsors: \"oklch(72% 0.13 220)\",\n} as\
  \ const);\nexport type LinkTypeToken = keyof typeof linkType; — The thirteen link type names are a vocabulary\
  \ that rules/knowledge-base/catalog-link-types already holds. Here they are declared again as keys and\
  \ exported as the type `LinkTypeToken`, and spelled in kebab-case where the catalog writes participates_in,\
  \ member_of, holds_role. The day the catalog gains or renames a link type, this file still carries the\
  \ old list. Nothing links the two, so nobody can tell which spelling the business decided. A change\
  \ to the catalog does not reach this file, because the catalog is not bound to it.. It blocks nothing\
  \ here; it is owed a route of its own.\nA finding in src/lib/tokens.ts names rules/knowledge-base/catalog-node-types,\
  \ which no file of this set is bound to: the `nodeType` export, lines 66-79 (section comment \"NodeType\
  \ catalog (10)\"): export const nodeType = Object.freeze({\n  person: \"oklch(74% 0.150 300)\",\n  organization:\
  \ \"oklch(68% 0.130 250)\",\n  project: \"oklch(74% 0.120 190)\",\n  event: \"oklch(72% 0.170 35)\"\
  ,\n  role: \"oklch(72% 0.180 325)\",\n  category: \"oklch(70% 0.100 130)\",\n  concept: \"oklch(76%\
  \ 0.130 88)\",\n  location: \"oklch(72% 0.120 155)\",\n  document: \"oklch(70% 0.040 260)\",\n  task:\
  \ \"oklch(70% 0.170 22)\",\n} as const); — The ten node type names are held by rules/knowledge-base/catalog-node-types.\
  \ Here they are declared a second time as the keys of `NodeTypeToken`, in a file that node does not\
  \ answer for. If the catalog changes, this list does not follow, and nothing flags the difference..\
  \ It blocks nothing here; it is owed a route of its own.\nCandidates: 24 opened across 15 of 34 delegation(s);\
  \ each return lists its own under `candidates_opened`.\nUnstated: 19 fact(s) the source states that\
  \ no node holds, over 12 file(s), listed under `unstated`. They block no binding here and no rebind\
  \ closes them — the route is the analysis that gives each fact a node.\nRestates: 94 place(s) where\
  \ text in the source restates a node's fact the code holds, over 29 file(s), listed under `restates`.\
  \ The pair conforms, so none blocks a binding — the route is removing the text, and reconciling the\
  \ file after."
---

## Folded
This record was folded by `trace.py --fold` from the delegation returns under `siegard-reconcile/adopt-fe-shared.returns/`, which are the evidence behind every entry above.
