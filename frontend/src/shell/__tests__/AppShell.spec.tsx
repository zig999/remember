// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { renderToString } from "react-dom/server";

// The Header uses TanStack Router's <Link>/useLocation, which need a
// RouterProvider. This is a focused shell-markup test, so we stub those two
// (anchor + fixed pathname) rather than mounting a full router.
vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-router")>();
  // Stub location: pathname "/graph" + empty search. The Header now reads
  // `l.search.conversation` to mirror the chat deep-link param (TC-02), so
  // the stub must include a `search` field — otherwise the `select` callback
  // would dereference `undefined`. Since this test renders at /graph, the
  // ConversationMenu code path is intentionally NOT exercised here.
  return {
    ...actual,
    useLocation: (opts?: {
      select?: (l: { pathname: string; search: Record<string, unknown> }) => unknown;
    }) =>
      opts?.select
        ? opts.select({ pathname: "/graph", search: {} })
        : { pathname: "/graph", search: {} },
    useNavigate: () => () => undefined,
    Link: ({
      to,
      children,
      ...props
    }: { to: string; children?: ReactNode } & Record<string, unknown>) => (
      <a href={to} {...props}>
        {children}
      </a>
    ),
  };
});

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { AppShell } from "../AppShell";

// AppShell wires the footer status hooks (useQuery), so it needs a
// QueryClientProvider. Renders pending state in SSR (no queryFn runs).
function renderShell(node: ReactElement): string {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return renderToString(<QueryClientProvider client={qc}>{node}</QueryClientProvider>);
}

describe("AppShell", () => {
  it("renders the 3-region layout: header (z-frame fixed), workspace (z-base scrollable), footer (z-frame fixed) — backdrop now lives on __root (TC-01)", () => {
    const html = renderShell(
      <AppShell>
        <div data-testid="content">hello</div>
      </AppShell>,
    );

    // TC-01: AmbientBackdrop moved up to __root so it is also visible on
    // /sign-in (which renders chrome-free, outside AppShell). AppShell must
    // no longer render it.
    expect(html).not.toContain('data-testid="ambient-backdrop"');

    // Header — banner role + fixed top-0 + z-frame
    expect(html).toContain('role="banner"');
    expect(html).toContain('aria-label="Cabeçalho"');
    expect(html).toMatch(/class="[^"]*\bz-frame\b/);

    // Footer — contentinfo role + fixed bottom-0 + z-frame
    expect(html).toContain('role="contentinfo"');
    expect(html).toContain('aria-label="Rodapé"');

    // Workspace — only region that scrolls (overflow-y-auto), pt-12 pb-8 reserves
    // the fixed header/footer.
    expect(html).toContain('data-testid="app-workspace"');
    expect(html).toMatch(/class="[^"]*\bz-base\b/);
    expect(html).toMatch(/class="[^"]*\boverflow-y-auto\b/);
    expect(html).toMatch(/class="[^"]*\bpt-12\b/);
    expect(html).toMatch(/class="[^"]*\bpb-8\b/);

    // The child renders inside the workspace.
    expect(html).toContain('data-testid="content"');
    expect(html).toContain("hello");
  });

  it("header and footer use the canonical GlassSurface ambient composition", () => {
    const html = renderShell(<AppShell>x</AppShell>);
    // GlassSurface level="ambient" composes the canonical class list per
    // GlassSurface.component.spec.md §6.1.
    expect(html).toContain("bg-surface-glass-ambient");
    expect(html).toContain("backdrop-blur-glass-sm");
    expect(html).toContain("border-border-glass");
    expect(html).toContain("shadow-sm");
    expect(html).toContain("rounded-none");
  });
});
