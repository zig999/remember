---
contract_version: siegard-survey/1
target: frontend
files:
  - src/router/SignInPage.tsx
  - src/router/StubPage.tsx
  - src/router/__root.tsx
  - src/router/router.ts
  - src/router/routes.tsx
  - src/shell/AmbientBackdrop.tsx
  - src/shell/AppErrorBoundary.tsx
  - src/shell/AppShell.tsx
  - src/shell/AppToaster.tsx
  - src/shell/CommandPalette.tsx
  - src/shell/Footer.tsx
  - src/shell/Header.tsx
  - src/shell/HeaderConversationMenu.tsx
  - src/shell/ThemeSelect.tsx
  - src/shell/api/use-shell-status.ts
  - src/state/as-of.ts
  - src/state/auth.ts
  - src/state/command-palette.ts
  - src/state/graph-view.ts
  - src/state/theme.ts
---

## Facts

### Route map and guarding
- The application has a sign-in surface at `/sign-in`, which sits outside the guarded subtree and is shown without the header, footer or command palette. `src/router/routes.tsx` (`signInRoute`, `routeTree`).
- Every other declared address sits under one guarded layout that shows the application shell: `/`, `/chat`, `/graph`, `/search`, `/ingest`, `/curation`, `/history`, `/not-found`. `src/router/routes.tsx` (`protectedLayoutRoute`, `routeTree`).
- The guard lets the owner through only while the owner-access token is fresh. Otherwise it sends the owner to `/sign-in` with the search `reason=session_expired`. `src/router/routes.tsx` (`protectedLayoutRoute.beforeLoad`).
  - The redirect carries only `reason`. It does not carry the address the owner asked for, so the sign-in destination that follows is not the guarded page. `src/router/routes.tsx` (`redirect({ to: "/sign-in", search: { reason: "session_expired" } })`).
  - A missing token produces the same `reason=session_expired` as an expired token. `src/router/routes.tsx` (`protectedLayoutRoute.beforeLoad`), `src/state/auth.ts` (`isFresh`).
- The root address `/` always redirects to `/chat`. Because it is a child of the guarded layout, the freshness guard runs first and the redirect to `/chat` second. `src/router/routes.tsx` (`indexRoute.beforeLoad`).
- When the owner opens `/sign-in` while already holding a fresh token, they are redirected to `/chat` and the form is not shown. `src/router/routes.tsx` (`signInRoute.beforeLoad`).
  - If the freshness check throws, the result is treated as not fresh and the sign-in form is shown. `src/router/routes.tsx` (`signInRoute.beforeLoad` try/catch).
- The chat workspace address `/chat` accepts one optional search key, `conversation`. It is kept only when it is a non-empty string, and is otherwise dropped from the address. Its format is not checked here. `src/router/routes.tsx` (`chatRoute.validateSearch`).
- The curation workspace address `/curation` accepts one optional search key, `item`. It is kept verbatim only when it is a non-empty string, and is otherwise dropped. `src/router/routes.tsx` (`curationRoute.validateSearch`).
- `/graph`, `/search` and `/history` show only a placeholder. The titles are "Grafo", "Busca" and "Histórico", and each has the line "Conteúdo em breve.". `src/router/routes.tsx` (`graphRoute`, `searchRoute`, `historyRoute`), `src/router/StubPage.tsx` (`StubPage` default `hint`).
- `/chat`, `/ingest` and `/curation` show a status line while their workspace loads: "Carregando conversa…", "Carregando ingestão…" and "Carregando curadoria…". Each is announced politely (`role="status"`, `aria-live="polite"`). `src/router/routes.tsx` (`Suspense` fallbacks).
- `/not-found` shows "Página não encontrada." with "O endereço solicitado não existe ou foi removido.". `src/router/routes.tsx` (`notFoundRoute`).
- An address that matches no route gets the root fallback, with the same two lines. The root route carries no guard and no shell. `src/router/__root.tsx` (`NotFoundComponent`, `NotFoundFallback`, `createRootRoute`).

### Sign-in page (owner-access)
- The sign-in page shows the session-expired notice exactly when the address has `reason=session_expired`. It reads the address once per mount, and an unreadable address means no notice. `src/router/SignInPage.tsx` (`readSessionExpired`, `useMemo`).
- The sign-in page passes the sign-in attempt's submit, its in-flight flag and its failure to the sign-in panel. The panel and the attempt belong to the owner-access feature. `src/router/SignInPage.tsx` (`useSignIn`, `SignInPanel`).

### Owner-access token held by the browser
- The owner-access token is held in memory and mirrored to the tab's session storage under the key `remember.auth.token`. It is read from there once, when the application loads. `src/state/auth.ts` (`AUTH_TOKEN_STORAGE_KEY`, `readInitialToken`).
- If session storage cannot be written, the token is kept in memory only. `src/state/auth.ts` (`writeToken`).
- Setting the token decodes its claims without checking the signature. The claims kept are `sub`, `exp`, `name` and `email`, and each is kept only when it has the expected type. `src/state/auth.ts` (`decodeJwtClaims`, `setToken`).
  - A token that does not have exactly three dot-separated parts, or whose payload fails to parse, yields no claims. `src/state/auth.ts` (`decodeJwtClaims`).
- Clearing the token removes it from memory and from session storage. `src/state/auth.ts` (`clear`).
- The token is fresh only when one is held and either:
  - its expiry is more than 30 seconds after the current second, or
  - it has no readable expiry (no claims, or no `exp`), in which case it counts as fresh.
  `src/state/auth.ts` (`isFresh`, `EXPIRY_MARGIN_SECONDS = 30`).

### Header
- The header's navigation lists six areas, in this order: Chat `/chat`, Grafo `/graph`, Buscar `/search`, Ingerir `/ingest`, Curar `/curation`, Histórico `/history`. `src/shell/Header.tsx` (`NAV`).
- An area is marked current (`aria-current="page"`) when the current path equals the area's path or begins with that path followed by `/`. `src/shell/Header.tsx` (`active`).
- The conversation menu appears in the header only when the path is `/chat` or begins with `/chat/`. It receives the conversation named by the `conversation` search key (chat-workspace: the active conversation is named by the address). `src/shell/Header.tsx` (`onChatRoute`, `HeaderConversationMenu`).
- The header's only actions are the theme choice and the command-palette toggle. The shell has no sign-out action. `src/shell/Header.tsx` (actions block).

### Conversation menu in the header (chat workspace)
- The conversation listing is requested without archived conversations by default. The owner can include them with a local toggle, which is part of the listing request. `src/shell/HeaderConversationMenu.tsx` (`includeArchived` initial `false`, `useListConversations({ includeArchived })`).
- The active conversation's title is the title of the listed conversation whose identifier equals the address's `conversation`. If none is listed, there is no title. `src/shell/HeaderConversationMenu.tsx` (`activeTitle`).
- Choosing a conversation navigates to `/chat?conversation=<id>`. `src/shell/HeaderConversationMenu.tsx` (`onSelect`).
- Creating a conversation sends a create with no body fields. When it succeeds, the menu navigates to `/chat?conversation=<new id>`. `src/shell/HeaderConversationMenu.tsx` (`onCreate`).
- Renaming sends an update with the new title and does not navigate. `src/shell/HeaderConversationMenu.tsx` (`onRename`).
- Archiving sends an update whose archive moment is the browser clock's current instant, as an ISO string. If the archived conversation was the active one, success navigates to `/chat` with no `conversation`. `src/shell/HeaderConversationMenu.tsx` (`onArchive`, `new Date().toISOString()`).
- Reactivating sends an update with the archive moment set to null and does not navigate. `src/shell/HeaderConversationMenu.tsx` (`onUnarchive`).
- Deleting sends a delete by identifier. If the deleted conversation was the active one, success navigates to `/chat` with no `conversation`. `src/shell/HeaderConversationMenu.tsx` (`onDelete`).
- A failed create, archive or delete does not navigate. No failure handling is declared in this file. `src/shell/HeaderConversationMenu.tsx` (`onSuccess`-only callbacks).

### Command palette
- Pressing ⌘K or Ctrl+K anywhere in the shell opens or closes the command palette and suppresses the browser's default action. `src/shell/CommandPalette.tsx` (`onKey`).
- The palette and its shortcut are mounted only within the guarded shell, so they are absent on `/sign-in`. `src/shell/AppShell.tsx` (`<CommandPalette />`), `src/router/routes.tsx` (`signInRoute`).
- The palette offers one group, "Ir para", with five destinations in this order: Grafo `/graph`, Buscar `/search`, Ingerir `/ingest`, Curar `/curation`, Histórico `/history`. `src/shell/CommandPalette.tsx` (`AREAS`).
- Choosing a destination closes the palette first, then navigates. `src/shell/CommandPalette.tsx` (`run`).
- Destinations are filtered by their label. When nothing matches, the palette shows "Nada encontrado.". `src/shell/CommandPalette.tsx` (`CommandItem value`, `CommandEmpty`).
- The palette starts closed and its open state is held in memory only. `src/state/command-palette.ts` (`useCommandPaletteStore`).

### Footer status bar
- The footer shows system health as one of three states: "online", "banco inacessível" or "verificando…". It starts at "verificando…". `src/shell/Footer.tsx` (`HEALTH`, default `health = "checking"`).
- Health is "verificando…" while no health answer has been parsed. It is "online" when the answer's `database` (or `result.database`) equals `ok`, and "banco inacessível" for any other answer. `src/shell/api/use-shell-status.ts` (`useHealth`).
  - A health request that fails (an unreachable BFF) or whose body is not JSON leaves no parsed answer. Health then stays "verificando…" and never reads "banco inacessível". `src/shell/api/use-shell-status.ts` (`getJson` `.catch(() => null)`, `retry: false`, `q.data == null`).
  - After a failed refresh, the last parsed state stays shown. `src/shell/api/use-shell-status.ts` (`useHealth` reads `q.data`).
- Health is asked every 20 seconds, without the owner-access token, and is not retried on failure. `src/shell/api/use-shell-status.ts` (`REFETCH_MS = 20_000`, `getJson("/health")`, `retry: false`).
- The footer shows the pending curation total as "<n> pendentes", linked to `/curation`. It is hidden when the total is 0. `src/shell/Footer.tsx` (`curationPending > 0`).
- The pending curation total is the queue listing's `total` (or `result.total`), requested with `limit=1` and the owner-access token as a bearer. `src/shell/api/use-shell-status.ts` (`useCurationCount`).
  - Without a token, no request is made and the total is 0, so the count is hidden. `src/shell/api/use-shell-status.ts` (`enabled: token != null`).
  - Any answer without a `total` counts as 0 and is hidden. That includes a refusal envelope or an unreadable body. `src/shell/api/use-shell-status.ts` (`d?.total ?? d?.result?.total ?? 0`).
  - The total is asked every 20 seconds and is not retried on failure. `src/shell/api/use-shell-status.ts` (`REFETCH_MS`, `retry: false`).
- The footer's active-ingestion segment is never shown, because the active run is always absent. When present, it would link to `/history` with the run's label. `src/shell/api/use-shell-status.ts` (`useActiveRun` returns `null`), `src/shell/Footer.tsx` (`activeRun &&`).

### The as-of date
- The as-of date starts empty, which means today. While empty, the footer reads "Como em: hoje". Otherwise it reads "Como em: " followed by the date in pt-BR form. `src/state/as-of.ts` (`asOf: null`), `src/shell/Footer.tsx` (`formatAsOf`).
- The owner picks the as-of date from a date input in the footer popover, which is titled "Recorte temporal" and explained with "Veja o que era verdade numa data (as_of).". `src/shell/Footer.tsx` (`PopoverContent`).
- Emptying the input or choosing "Voltar para hoje" sets the as-of date back to today. `src/shell/Footer.tsx` (`onChange`, `Button onClick`).
- The date input sets no minimum or maximum, so a future date is accepted. `src/shell/Footer.tsx` (`Input type="date"`).
- The as-of date is held in memory only. It is not written to the address, is not persisted, and is lost on reload. `src/state/as-of.ts` (`create`), `src/shell/Footer.tsx` (`setAsOf`).
- No file of the area sends the as-of date to any read. Only the footer shows it. `src/shell/Footer.tsx`, `src/shell/api/use-shell-status.ts`.

### Render failure
- A render failure anywhere under the root replaces the whole screen, including the header and footer, with the following. `src/shell/AppErrorBoundary.tsx` (`render`), `src/router/__root.tsx` (`<AppErrorBoundary><Outlet/></AppErrorBoundary>`).
  - The title "Algo deu errado.".
  - The text "A página não pôde ser renderizada. Recarregue para tentar novamente.".
  - A "Recarregar" action that reloads the page.
- The failure is reported with source `AppErrorBoundary` and the component stack. `src/shell/AppErrorBoundary.tsx` (`componentDidCatch`).
- The failure message is announced assertively (`role="alert"`, `aria-live="assertive"`). `src/shell/AppErrorBoundary.tsx` (`render`).

### Accessible names
- Header region: `banner` named "Cabeçalho". Navigation named "Áreas". Palette toggle named "Abrir paleta de comandos (⌘K)". Theme choice named "Tema". `src/shell/Header.tsx`, `src/shell/ThemeSelect.tsx`.
- Footer region: `contentinfo` named "Rodapé". The as-of date input is named "Data do recorte". `src/shell/Footer.tsx`.
- The backdrop is hidden from assistive technology (`aria-hidden="true"`), and its image has an empty alt with `role="presentation"`. `src/shell/AmbientBackdrop.tsx`.

## Answers
- Opening any guarded address — no token held, or the token expires within 30 seconds → redirect to `/sign-in?reason=session_expired`, and the sign-in page shows the session-expired notice. `src/router/routes.tsx` (`protectedLayoutRoute.beforeLoad`), `src/router/SignInPage.tsx` (`readSessionExpired`).
- Opening `/sign-in` — a fresh token is already held → redirect to `/chat`. `src/router/routes.tsx` (`signInRoute.beforeLoad`).
- Opening `/sign-in` — the freshness check throws → the sign-in form is shown. `src/router/routes.tsx` (`signInRoute.beforeLoad` catch).
- Opening `/` — the token is fresh → redirect to `/chat`. `src/router/routes.tsx` (`indexRoute.beforeLoad`).
- Opening an address no route matches → "Página não encontrada." / "O endereço solicitado não existe ou foi removido.". `src/router/__root.tsx` (`NotFoundFallback`).
- `/chat` or `/curation` with an empty or non-string `conversation` / `item` → the key is dropped and the workspace opens without it. `src/router/routes.tsx` (`chatRoute.validateSearch`, `curationRoute.validateSearch`).
- Footer health — the answer's `database` is not `ok` → "banco inacessível". `src/shell/api/use-shell-status.ts` (`useHealth`), `src/shell/Footer.tsx` (`HEALTH.down`).
- Footer health — the BFF is unreachable or the body is not JSON, with no earlier answer → "verificando…". `src/shell/api/use-shell-status.ts` (`useHealth`).
- Footer pending curation — a refusal (any answer without `total`) or no token held → 0, and the segment is hidden. `src/shell/api/use-shell-status.ts` (`useCurationCount`).
- Command palette — the filter matches no destination → "Nada encontrado.". `src/shell/CommandPalette.tsx` (`CommandEmpty`).
- Conversation create, archive or delete — the request fails → no navigation. `src/shell/HeaderConversationMenu.tsx` (`onSuccess` callbacks).
- Any render failure → "Algo deu errado." with a "Recarregar" action that reloads the page. `src/shell/AppErrorBoundary.tsx` (`render`, `handleReload`).

## Vocabularies
- Footer health state: `ok` ("online"), `down` ("banco inacessível"), `checking` ("verificando…"). `src/shell/Footer.tsx` (`HealthStatus`, `HEALTH`).
- Sign-in reason: `session_expired`. `src/router/routes.tsx` (`protectedLayoutRoute.beforeLoad`), `src/router/SignInPage.tsx` (`readSessionExpired`).
- Header navigation areas: `/chat` Chat, `/graph` Grafo, `/search` Buscar, `/ingest` Ingerir, `/curation` Curar, `/history` Histórico. `src/shell/Header.tsx` (`NAV`).
- Command palette destinations: `/graph` Grafo, `/search` Buscar, `/ingest` Ingerir, `/curation` Curar, `/history` Histórico. `src/shell/CommandPalette.tsx` (`AREAS`).
- Declared addresses: `/sign-in`, `/`, `/chat`, `/graph`, `/search`, `/ingest`, `/curation`, `/history`, `/not-found`. `src/router/routes.tsx` (`routeTree`).
- Address search keys: `conversation` (on `/chat`), `item` (on `/curation`), `reason` (on `/sign-in`). `src/router/routes.tsx`, `src/router/SignInPage.tsx`.
- Owner-access token claims kept: `sub`, `exp`, `name`, `email`. `src/state/auth.ts` (`DecodedClaims`, `decodeJwtClaims`).

## Upstream artifacts
- `GET /health` on the BFF answers a raw body whose `database` field (or `result.database`) is `ok` when the store is reachable (knowledge-base health report, database status). It is called with no bearer. `src/shell/api/use-shell-status.ts` (`useHealth`).
- `GET /api/v1/curation/queue?limit=1` on the BFF answers a body whose `total` (or `result.total`) is the pending review-queue total. It is called with `Authorization: Bearer <token>`. `src/shell/api/use-shell-status.ts` (`useCurationCount`).
- The base address of every BFF call is `VITE_BFF_URL`. `src/shell/api/use-shell-status.ts` (`getEnv`).
- The owner-access token is a Neon Auth (Stack Auth) JWT with three dot-separated base64url parts. Its payload may carry `sub`, `exp` (seconds since epoch), `name` and `email`. `src/state/auth.ts` (`decodeJwtClaims`).
- The chat feature's conversation operations, as the header menu sends them:
  - a listing with `includeArchived`;
  - a create with no fields;
  - an update by `id` with `title`, or with `archivedAt` as an ISO string or null;
  - a delete by `id`.
  The create answers the new conversation's `id`, and the listing answers `items` carrying `id` and `title`. `src/shell/HeaderConversationMenu.tsx` (`useListConversations`, `useCreateConversation`, `useUpdateConversation`, `useDeleteConversation`).
- The owner-access feature supplies the sign-in attempt (`signIn`, `isLoading`, `error`) and the sign-in panel. `src/router/SignInPage.tsx` (`useSignIn`, `SignInPanel`).
- The chat, curation and ingest workspaces are supplied by their features and mounted at `/chat`, `/curation` and `/ingest`. `src/router/routes.tsx` (`ChatWorkspace`, `CurationPage`, `IngestWorkspace`).

## Outside the domain
- Code-based route tree, typed `Register` declaration and `defaultPreload: "intent"`: router wiring. `src/router/router.ts`.
- Lazy loading of the chat, curation and ingest workspaces: build performance. `src/router/routes.tsx`.
- Landscape backdrop image `/backdrop/cityscape-dusk.png`, assigned after first paint on `requestIdleCallback` or `setTimeout(0)`, and cleared on load error: decoration. `src/shell/AmbientBackdrop.tsx`.
- Single sonner toaster: dark theme, top-right, expanded stack, close button, offset below the header, glass styling. It sets no durations: surface. `src/shell/AppToaster.tsx`.
- UI theme choice between `phosphor` ("Phosphor", the default) and `default` ("Terminal"), written to `<html data-theme>` and persisted in local storage under `remember.theme.v1` (version 1): surface. `src/state/theme.ts`, `src/shell/ThemeSelect.tsx`.
- Shell layout: fixed header (h-12) and footer (h-8), a single scrolling workspace, z-index layers, icons, colours, test ids: surface. `src/shell/AppShell.tsx`, `src/shell/Header.tsx`, `src/shell/Footer.tsx`, `src/router/StubPage.tsx`.
- Shell query keys `["shell","health"]` and `["shell","curation-count"]`. The latter does not include the token: cache shape. `src/shell/api/use-shell-status.ts`.
- Graph view store persisted in session storage under `remember.graph` (version 1), with pinned positions, expansion set, selection and panel-collapsed flag, plus a reset. No file of the area reads or writes it: dormant client state. `src/state/graph-view.ts`.
- Error reporting through `reportError`: diagnostics wiring. `src/shell/AppErrorBoundary.tsx`.

## Observed and not decided here
- The header navigation offers six areas including Chat: `NAV` lists `{ to: "/chat", label: "Chat" }` first (`src/shell/Header.tsx`). The command palette offers five and omits Chat: `AREAS` begins with `{ to: "/graph", label: "Grafo" }` (`src/shell/CommandPalette.tsx`).
- Two not-found surfaces show the same text under different rules. The unmatched-address fallback is declared on the root route, which "no guard, no AppShell" describes: `notFoundComponent: NotFoundComponent` (`src/router/__root.tsx`). The named `/not-found` sits under the freshness guard and the shell: `notFoundRoute` with `getParentRoute: () => protectedLayoutRoute` (`src/router/routes.tsx`).
- The as-of date is shown on two clocks. The input value is the date in UTC, `asOf.toISOString().slice(0, 10)`, and a chosen day is parsed as UTC midnight, `new Date(e.target.value)`. The footer label is the same instant in local time, `asOf.toLocaleDateString("pt-BR")`. West of UTC, the label names the day before the input. (`src/shell/Footer.tsx`, `formatAsOf` and `Input`.)
- The sign-in route treats a throwing freshness check as not fresh: `try { fresh = useAuthStore.getState().isFresh(); } catch { fresh = false; }` (`src/router/routes.tsx`, `signInRoute.beforeLoad`). The guarded layout calls it unguarded: `const fresh = useAuthStore.getState().isFresh();` (`src/router/routes.tsx`, `protectedLayoutRoute.beforeLoad`).
