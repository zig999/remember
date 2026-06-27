/**
 * routes — code-based route declarations (front.back.md §7 constraint 4).
 *
 * Layout (post TC-01 refactor):
 *   RootRoute (no guard, no AppShell — just AmbientBackdrop + boundary + toaster)
 *   ├── /sign-in            (signInRoute — direct child; FL-AUTH-01 bypass)
 *   └── "protected"         (protectedLayoutRoute — pathless, id="protected";
 *                            beforeLoad: JWT guard; component: <AppShell><Outlet/></AppShell>)
 *       ├── /               (indexRoute — redirect /chat)
 *       ├── /chat
 *       ├── /graph
 *       ├── /search
 *       ├── /ingest
 *       ├── /curation
 *       ├── /history
 *       └── /not-found
 *
 * Deviation note (R5 — owner-authorized 2026-06-20, see temp/login-screen-plan.md §4):
 *   The JWT guard moves from __root.beforeLoad to protectedLayoutRoute.beforeLoad
 *   (a pathless layout route). /sign-in becomes a direct child of RootRoute so
 *   it renders chrome-free (no Header/Footer/CommandPalette) — only the ambient
 *   backdrop + the sign-in panel. This deviates from:
 *     - front.md §2/§3.1 (single root layout)
 *     - front.back.md BR-04 (guard in __root)
 *   The guard predicate (useAuthStore.getState().isFresh()) and the redirect
 *   shape ({ to: '/sign-in', search: { reason: 'session_expired' } }) are
 *   preserved verbatim. Specs to reconcile in a follow-up sweep.
 */

import { lazy, Suspense } from "react";
import { createRoute, redirect, Outlet } from "@tanstack/react-router";
import { Route as RootRoute } from "./__root";
import { StubPage } from "./StubPage";
import { SignInPage } from "./SignInPage";
import { AppShell } from "@/shell/AppShell";
import { useAuthStore } from "@/state/auth";

/**
 * The heavy feature pages (chat + curation) are loaded lazily. Their module
 * graphs are large — the curation page pulls DecisionPanel / ProvenanceTrail /
 * CorrectionForm and the React Flow node-type map; the chat workspace pulls
 * the graph feature. A static import here drags all of that into anything that
 * imports the route tree — including the bare-Node `routes.spec.tsx`, which
 * only builds the tree to assert route ids and was timing out on that
 * transitive load under the full parallel suite. `lazy` defers each import to
 * first render, keeping route-tree construction cheap.
 */
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

/**
 * ProtectedLayout — workspace chrome (AppShell) for authenticated routes.
 * Single-use component, kept inline to mirror the route declaration above.
 */
function ProtectedLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

/**
 * Pathless layout route hosting the JWT guard + AppShell chrome. Children
 * are the protected routes; /sign-in stays outside this subtree so it can
 * render with only the ambient backdrop.
 *
 * BR-04 (preserved): absent or near-expired token (isFresh() === false)
 * redirects to /sign-in?reason=session_expired.
 */
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

/**
 * Root index route — redirects to /chat per chat.feature.spec.md UI-01
 * and chat.flow.md FL-01 (the chat workspace is the primary entry).
 */
export const indexRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
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
 * truth; ChatWorkspace reads it via `chatRoute.useSearch()` (TC-07).
 *
 * `validateSearch` returns `string | undefined`: empty/missing value yields
 * `undefined` so the URL stays clean (`/chat` not `/chat?conversation=`).
 */
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
          className="m-auto text-body-sm text-muted"
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

/**
 * signInRoute — chrome-free sign-in surface (direct child of RootRoute).
 *
 * FL-AUTH-01 bypass: if a fresh JWT is already present, skip the form and
 * route the operator straight to /chat. Wrapped in try/catch so a corrupt
 * store never prevents the sign-in form from rendering.
 */
export const signInRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: "/sign-in",
  beforeLoad: () => {
    // FL-AUTH-01: only redirect if the predicate returns true cleanly. A
    // corrupt store (predicate throws) falls through to the sign-in form
    // rather than blocking the operator behind an unrecoverable error.
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
  // TC-03: the real sign-in surface — SignInPanel (CRT animation + glass
  // surface) hosting the RHF/Zod form wired to the Stack Auth mutation. The
  // TC-01 stub was a placeholder; the page renders chrome-free under
  // RootRoute (no AppShell), preserving the "only backdrop + panel" layout.
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
          className="m-auto text-body-sm text-muted"
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

/**
 * Curation route — `/curation` (TC-04 of the curadoria-ui wave).
 *
 * `validateSearch` accepts a single optional `?item=<kind>:<id>` deep-link
 * param. The string is preserved verbatim here — the page parses it via
 * `parseItemSearchParam` (features/curation/state/curation-store.ts) so
 * a malformed value silently falls through to first-item auto-select
 * (curadoria.flow.md §3 row 3b).
 *
 * Same shape as `chatRoute.validateSearch`: empty or missing yields `{}`,
 * keeping the URL clean (`/curation` not `/curation?item=`).
 */
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
          className="m-auto text-body-sm text-muted"
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

/**
 * Route tree — /sign-in stays a sibling of the pathless protected layout so
 * it renders without the AppShell chrome. Order only matters for siblings.
 */
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
