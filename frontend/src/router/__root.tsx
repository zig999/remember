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
      <AppToaster />
    </>
  );
}

function NotFoundComponent() {
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
