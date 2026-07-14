/**
 * __root — TanStack Router root route.
 *
 * Spec references:
 *  - front.md §3 (routing conventions)
 *  - front.md §3.1 (route map)
 *  - front.md §5.1 (single <AppErrorBoundary> wraps the root)
 *  - front.back.md BR-12 (single <Toaster>, single QueryClientProvider, single boundary)
 *
 * Layout (post TC-01 refactor):
 *   <AmbientBackdrop/>
 *   <AppErrorBoundary>
 *     <Outlet/>      ← either /sign-in (chrome-free) or protectedLayoutRoute (with AppShell)
 *   </AppErrorBoundary>
 *   <AppToaster/>
 *
 * The boundary wraps only the route `<Outlet/>` so a render error preserves
 * the ambient backdrop and the toaster (front.md §5.1).
 *
 * Deviation note (R5 — owner-authorized 2026-06-20, see temp/login-screen-plan.md §4):
 *   This route no longer mounts <AppShell> and no longer hosts the JWT guard.
 *   Both responsibilities moved to `protectedLayoutRoute` (pathless layout
 *   route, id="protected") so that /sign-in can render chrome-free with only
 *   the ambient backdrop as background. This deviates from:
 *     - front.md §2 (single root layout / AppShell wraps everything)
 *     - front.md §3.1 (route map — guard implied at root)
 *     - front.md §5.1 (boundary at root — preserved here; only chrome moved)
 *     - front.back.md BR-04 (JWT guard in `__root.beforeLoad` — now in
 *       protectedLayoutRoute.beforeLoad; guard logic itself is unchanged)
 *   Specs to reconcile in a follow-up sweep.
 */

import { createRootRoute, Outlet } from "@tanstack/react-router";
import { AmbientBackdrop } from "@/shell/AmbientBackdrop";
import { AppErrorBoundary } from "@/shell/AppErrorBoundary";
import { AppToaster } from "@/shell/AppToaster";

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootComponent() {
  return (
    <>
      <AmbientBackdrop />
      <AppErrorBoundary>
        <Outlet />
      </AppErrorBoundary>
      {/*
        BR-12: single <Toaster> mounted at the root, styled as a glass panel
        (see AppToaster — translucent bg + frosted blur + glass border/shadow,
        z-toast = 60 keeps the stack above the frame).
      */}
      <AppToaster />
    </>
  );
}

function NotFoundComponent() {
  // The default not-found surface; the named `/not-found` route renders the
  // same component via NotFoundPage so both deep-link and unknown-path
  // patterns produce the same in-frame fallback.
  return <NotFoundFallback />;
}

function NotFoundFallback() {
  return (
    <section
      className="flex min-h-[60vh] flex-col items-center justify-center gap-md px-lg text-foreground"
      data-testid="not-found-page"
    >
      <h1 className="text-lg font-semibold tracking-tight">Página não encontrada.</h1>
      <p className="text-body text-body">
        O endereço solicitado não existe ou foi removido.
      </p>
    </section>
  );
}
