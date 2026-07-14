/**
 * main — app bootstrap.
 *
 * Spec references:
 *  - front.md §3.3 (app bootstrapping; no spinner; env-invalid fallback)
 *  - front.back.md BR-02 (env validated at boot; fail loud on invalid)
 *  - front.back.md BR-12 (single QueryClientProvider, single RouterProvider,
 *    single Toaster, single AppErrorBoundary — all mounted exactly once)
 *
 * Order matters:
 *   1. import theme.css FIRST so styles are present before React renders
 *   2. resolve env (loud throw if invalid → static fallback page)
 *   3. construct (use module-level) QueryClient
 *   4. mount: <StrictMode><QueryClientProvider><RouterProvider/></...></StrictMode>
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import "@/styles/theme.css";

import { getEnv, EnvInvalidError } from "@/lib/env";
import { queryClient } from "@/lib/query-client";
import { router } from "@/router/router";

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root element #root not found — index.html is malformed.");
}

const root = createRoot(container);

try {
  // BR-02: validate env before rendering. Throws EnvInvalidError on failure;
  // caller surfaces an in-frame fallback per front.md §3.3.
  getEnv();
} catch (err) {
  if (err instanceof EnvInvalidError) {
    root.render(<EnvErrorFallback />);
    throw err; // re-throw so the failure is visible in console + tests.
  }
  throw err;
}

root.render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);

/**
 * Boot-failure fallback (front.md §3.3): when env validation fails the
 * 3-region frame is NOT rendered — the user sees only a full-screen message.
 */
function EnvErrorFallback() {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="flex min-h-screen flex-col items-center justify-center gap-md px-lg text-foreground"
      data-testid="env-error-fallback"
    >
      <h1 className="text-lg font-semibold tracking-tight">Configuração inválida.</h1>
      <p className="text-body text-body">
        Verifique as variáveis VITE_BFF_URL e VITE_NEON_AUTH_URL e recarregue.
      </p>
    </div>
  );
}
