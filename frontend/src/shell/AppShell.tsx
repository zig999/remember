/**
 * AppShell — the 3-region frame + ambient backdrop.
 *
 * Spec references:
 *  - front.md §2 (Application shell — 3 fixed regions + z-1 backdrop)
 *  - front.md §2.1 (Region rules — header/footer fixed; workspace scrolls)
 *  - front.md §2.2 (Layer/z-index scale: z-backdrop / z-base / z-frame)
 *  - front.md §3.3 (No spinner during bootstrapping — frame is the anchor)
 *
 * Region layout (CSS):
 *   - AmbientBackdrop : position fixed, inset-0, z-backdrop (-1)
 *   - Header          : position fixed, top-0,  z-frame    (40)
 *   - Workspace       : flow,           pt-12 pb-8, z-base (0) — only region that scrolls
 *   - Footer          : position fixed, bottom-0, z-frame (40)
 *
 * The workspace consumes the area between the fixed header and footer via
 * `padding` on the body wrapper — never via `position: absolute` which would
 * conflict with route-level scrolling.
 */

import type { ReactNode } from "react";
import { AmbientBackdrop } from "./AmbientBackdrop";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { CommandPalette } from "./CommandPalette";
import { useHealth, useCurationCount, useActiveRun } from "./api/use-shell-status";
import { cn } from "@/lib/cn";

export interface AppShellProps {
  /** The active route content — mounted inside the workspace region. */
  children: ReactNode;
  /** Optional extra classes on the workspace wrapper. */
  className?: string;
}

export function AppShell({ children, className }: AppShellProps) {
  // Live footer status (frontend-analise-funcional.md §2). These read from the
  // QueryClient (real BFF in-app; seeded cache in Storybook).
  const health = useHealth();
  const curationPending = useCurationCount();
  const activeRun = useActiveRun();

  return (
    <>
      <AmbientBackdrop />
      <Header />
      <main
        // Workspace: the only region that scrolls (front.md §2.1).
        // pt-12 / pb-8 reserve the fixed header (h-12) and footer (h-8).
        className={cn(
          "relative z-base min-h-screen overflow-y-auto pt-12 pb-8",
          className,
        )}
        data-testid="app-workspace"
      >
        {children}
      </main>
      <Footer
        health={health}
        curationPending={curationPending}
        activeRun={activeRun}
      />
      <CommandPalette />
    </>
  );
}
