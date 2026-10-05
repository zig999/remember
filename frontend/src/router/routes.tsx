import { lazy, Suspense } from "react";
import { createRoute, redirect, Outlet } from "@tanstack/react-router";
import { Route as RootRoute } from "./__root";
import { StubPage } from "./StubPage";
import { SignInPage } from "./SignInPage";
import { AppShell } from "@/shell/AppShell";
import { useAuthStore } from "@/state/auth";

const ChatWorkspace = lazy(() =>
  import("@/features/chat/components/ChatWorkspace").then((m) => ({
    default: m.ChatWorkspace,
  })),
);
const CurationPage = lazy(() =>
  import("@/features/curation/components/CurationPage").then((m) => ({
    default: m.CurationPage,
  })),
);
const IngestWorkspace = lazy(() =>
  import("@/features/ingest/components/IngestWorkspace").then((m) => ({
    default: m.IngestWorkspace,
  })),
);

function ProtectedLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

export const protectedLayoutRoute = createRoute({
  getParentRoute: () => RootRoute,
  id: "protected",
  beforeLoad: () => {
    const fresh = useAuthStore.getState().isFresh();
    if (!fresh) {
      throw redirect({
        to: "/sign-in",
        search: { reason: "session_expired" },
      });
    }
  },
  component: ProtectedLayout,
});

export const indexRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: "/",
  beforeLoad: () => {
    throw redirect({ to: "/chat" });
  },
});

export const chatRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: "/chat",
  validateSearch: (search: Record<string, unknown>): { conversation?: string } => {
    const raw = search.conversation;
    if (typeof raw === "string" && raw.length > 0) {
      return { conversation: raw };
    }
    return {};
  },
  component: () => (
    <Suspense
      fallback={
        <div
          className="m-auto text-xs text-muted-foreground"
          role="status"
          aria-live="polite"
        >
          Carregando conversa…
        </div>
      }
    >
      <ChatWorkspace />
    </Suspense>
  ),
});

export const signInRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: "/sign-in",
  beforeLoad: () => {
    let fresh = false;
    try {
      fresh = useAuthStore.getState().isFresh();
    } catch {
      fresh = false;
    }
    if (fresh) {
      throw redirect({ to: "/chat" });
    }
  },
  component: () => <SignInPage />,
});

export const graphRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: "/graph",
  component: () => <StubPage title="Grafo" testId="graph-page" />,
});

export const searchRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: "/search",
  component: () => <StubPage title="Busca" testId="search-page" />,
});

export const ingestRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: "/ingest",
  component: () => (
    <Suspense
      fallback={
        <div
          className="m-auto text-xs text-muted-foreground"
          role="status"
          aria-live="polite"
        >
          Carregando ingestão…
        </div>
      }
    >
      <IngestWorkspace />
    </Suspense>
  ),
});

export const curationRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: "/curation",
  validateSearch: (search: Record<string, unknown>): { item?: string } => {
    const raw = search.item;
    if (typeof raw === "string" && raw.length > 0) {
      return { item: raw };
    }
    return {};
  },
  component: () => (
    <Suspense
      fallback={
        <div
          className="m-auto text-xs text-muted-foreground"
          role="status"
          aria-live="polite"
        >
          Carregando curadoria…
        </div>
      }
    >
      <CurationPage />
    </Suspense>
  ),
});

export const historyRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: "/history",
  component: () => <StubPage title="Histórico" testId="history-page" />,
});

export const notFoundRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: "/not-found",
  component: () => (
    <StubPage
      title="Página não encontrada."
      hint="O endereço solicitado não existe ou foi removido."
      testId="not-found-page"
    />
  ),
});

export const routeTree = RootRoute.addChildren([
  signInRoute,
  protectedLayoutRoute.addChildren([
    indexRoute,
    chatRoute,
    graphRoute,
    searchRoute,
    ingestRoute,
    curationRoute,
    historyRoute,
    notFoundRoute,
  ]),
]);
