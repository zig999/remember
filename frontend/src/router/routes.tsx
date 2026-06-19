/**
 * routes — code-based route declarations (front.back.md §7 constraint 4).
 *
 * Layout per front.md §3.1:
 *   /            → redirect /graph
 *   /sign-in     → public stub
 *   /graph       → stub (foundation)
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
 * Root index route — redirects to /graph per front.md §3.1.
 */
export const indexRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: "/",
  beforeLoad: () => {
    throw redirect({ to: "/graph" });
  },
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
  graphRoute,
  searchRoute,
  ingestRoute,
  curationRoute,
  historyRoute,
  notFoundRoute,
]);
