/**
 * __root — TanStack Router root route.
 *
 * Spec references:
 *  - front.md §3 (routing conventions — single root layout, protected by JWT)
 *  - front.md §3.1 (route map)
 *  - front.md §5.1 (single <AppErrorBoundary> wraps the root)
 *  - front.back.md BR-04 (JWT guard in `beforeLoad` — absent or expired → /sign-in)
 *  - front.back.md BR-12 (single <Toaster>, single QueryClientProvider, single boundary)
 *
 * Layout:
 *   <AppShell>
 *     <AppErrorBoundary>
 *       <Outlet/>
 *     </AppErrorBoundary>
 *   </AppShell>
 *   <Toaster/>
 *
 * The boundary wraps only the workspace `<Outlet/>` so a render error inside
 * an area preserves the header + footer (front.md §5.1).
 */

import { createRootRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppShell } from "@/shell/AppShell";
import { AppErrorBoundary } from "@/shell/AppErrorBoundary";
import { AppToaster } from "@/shell/AppToaster";
import { useAuthStore } from "@/state/auth";

/** Routes that bypass the JWT guard. */
const PUBLIC_ROUTES = new Set<string>(["/sign-in"]);

export const Route = createRootRoute({
  /**
   * BR-04: every route except /sign-in is protected. Absent or near-expired
   * token (exp <= now()+30s) redirects to /sign-in?reason=session_expired.
   */
  beforeLoad: ({ location }) => {
    if (PUBLIC_ROUTES.has(location.pathname)) return;
    const fresh = useAuthStore.getState().isFresh();
    if (!fresh) {
      throw redirect({
        to: "/sign-in",
        search: { reason: "session_expired" },
      });
    }
  },
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootComponent() {
  return (
    <>
      <AppShell>
        <AppErrorBoundary>
          <Outlet />
        </AppErrorBoundary>
      </AppShell>
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
      className="flex min-h-[60vh] flex-col items-center justify-center gap-md px-lg text-content"
      data-testid="not-found-page"
    >
      <h1 className="text-heading">Página não encontrada.</h1>
      <p className="text-body text-body">
        O endereço solicitado não existe ou foi removido.
      </p>
    </section>
  );
}
