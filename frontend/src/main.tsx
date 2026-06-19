import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/styles/theme.css";

// BR-12: single global QueryClient, single Toaster, single AppErrorBoundary live in __root
// (mounted in a later wave). The foundation only boots an empty shell — full bootstrapping
// (router + QueryClient + Toaster + ErrorBoundary) ships when the shell wave lands.
const container = document.getElementById("root");
if (!container) {
  throw new Error("Root element #root not found — index.html is malformed.");
}

createRoot(container).render(
  <StrictMode>
    {/* Foundation placeholder — replaced by <AppShell> in the next wave. */}
    <div className="flex min-h-screen items-center justify-center">
      <p>Remember — bootstrapping (TC-01 scaffold).</p>
    </div>
  </StrictMode>,
);
