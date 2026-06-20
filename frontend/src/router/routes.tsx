/**
 * routes — code-based route declarations (front.back.md §7 constraint 4).
 *
 * Layout per front.md §3.1:
 *   /            → redirect /chat
 *   /sign-in     → public stub
 *   /chat        → stub (primary view; TC-07 replaces with ChatWorkspace)
 *   /graph       → stub
 *   /search      → stub
 *   /ingest      → stub
 *   /curation    → stub
 *   /history     → stub
 *   /not-found   → stub
 *   <unknown>    → __root notFoundComponent (in-frame fallback)
 */

import { createRoute, redirect } from "@tanstack/react-router";
import { Route as RootRoute } from "./__root";
import { StubPage } from "./StubPage";

/**
 * Root index route — redirects to /chat per chat.feature.spec.md UI-01
 * and chat.flow.md FL-01 (the chat workspace is the primary entry).
 */
export const indexRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: "/",
  beforeLoad: () => {
    throw redirect({ to: "/chat" });
  },
});

/**
 * Chat route — primary workspace per chat.feature.spec.md UI-01.
 *
 * Accepts optional `conversation` search param (chat.flow.md FL-02 deep link
 * `/chat?conversation=<uuid>`). Active conversation id is the URL source of
 * truth; component reads it via `Route.useSearch()` (wired in TC-07).
 *
 * `validateSearch` returns `string | undefined`: empty/missing value yields
 * `undefined` so the URL stays clean (`/chat` not `/chat?conversation=`).
 */
export const chatRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: "/chat",
  validateSearch: (search: Record<string, unknown>): { conversation?: string } => {
    const raw = search.conversation;
    if (typeof raw === "string" && raw.length > 0) {
      return { conversation: raw };
    }
    return {};
  },
  component: () => <StubPage title="Chat" testId="chat-page" />,
});

export const signInRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: "/sign-in",
  component: () => (
    <StubPage
      title="Entrar"
      hint="Tela de autenticação em breve (Neon Auth)."
      testId="sign-in-page"
    />
  ),
});

export const graphRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: "/graph",
  component: () => <StubPage title="Grafo" testId="graph-page" />,
});

export const searchRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: "/search",
  component: () => <StubPage title="Busca" testId="search-page" />,
});

export const ingestRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: "/ingest",
  component: () => <StubPage title="Ingestão" testId="ingest-page" />,
});

export const curationRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: "/curation",
  component: () => <StubPage title="Curadoria" testId="curation-page" />,
});

export const historyRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: "/history",
  component: () => <StubPage title="Histórico" testId="history-page" />,
});

export const notFoundRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: "/not-found",
  component: () => (
    <StubPage
      title="Página não encontrada."
      hint="O endereço solicitado não existe ou foi removido."
      testId="not-found-page"
    />
  ),
});

/**
 * Route tree — order matters only for siblings; TanStack Router resolves
 * specificity automatically. All routes attach to the single `RootRoute`.
 */
export const routeTree = RootRoute.addChildren([
  indexRoute,
  signInRoute,
  chatRoute,
  graphRoute,
  searchRoute,
  ingestRoute,
  curationRoute,
  historyRoute,
  notFoundRoute,
]);
